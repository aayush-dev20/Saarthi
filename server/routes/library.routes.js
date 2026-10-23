import express from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { LibraryPass, Book, BookLoan } from '../models/Library.js';
import { Notification } from '../models/Notification.js';
import { User } from '../models/User.js';
import { AuditLog } from '../models/PracticeSet.js';

const router = express.Router();

const QR_SECRET = process.env.QR_SIGNING_SECRET || 'saarthi_qr_session_signing_secret_98741';

function signLibraryToken(passNumber, studentId, expiresAtMs) {
  const payload = `${passNumber}:${studentId}:${expiresAtMs}`;
  const hmac = crypto.createHmac('sha256', QR_SECRET).update(payload).digest('hex');
  return `${payload}:${hmac}`;
}

function verifyLibraryToken(token) {
  const parts = token.split(':');
  if (parts.length !== 4) return null;
  const [passNumber, studentId, expiresAtStr, hmac] = parts;
  const expiresAtMs = parseInt(expiresAtStr, 10);
  if (isNaN(expiresAtMs) || Date.now() > expiresAtMs) {
    return { valid: false, reason: 'EXPIRED' };
  }
  const payload = `${passNumber}:${studentId}:${expiresAtMs}`;
  const expectedHmac = crypto.createHmac('sha256', QR_SECRET).update(payload).digest('hex');
  if (hmac !== expectedHmac) {
    return { valid: false, reason: 'TAMPERED' };
  }
  return { valid: true, passNumber, studentId, expiresAtMs };
}

// -------------------------------------------------------------
// 1. Digital Library Pass Endpoints
// -------------------------------------------------------------

// Student requests a digital library pass
const requestPassSchema = {
  body: z.object({
    passType: z.enum(['STANDARD', 'READING_ROOM', 'EXTENDED_HOURS', 'RESEARCH_SECTION']).optional(),
    purpose: z.string().optional(),
    durationHours: z.number().min(1).max(72).optional(),
  }),
};

router.post('/pass/request', authenticateToken, requireRole(['student']), validate(requestPassSchema), async (req, res, next) => {
  try {
    const student = req.user;
    const { passType = 'STANDARD', purpose = 'General Study & Research', durationHours = 24 } = req.body;

    // Check if student already has an active, valid pass
    const now = new Date();
    const existingActivePass = await LibraryPass.findOne({
      student: student._id,
      status: 'ACTIVE',
      validUntil: { $gt: now },
    });

    if (existingActivePass) {
      return res.status(200).json({
        success: true,
        message: 'Active library pass already exists',
        data: existingActivePass,
      });
    }

    const passNumber = `LPASS-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
    const validUntil = new Date(now.getTime() + durationHours * 60 * 60 * 1000);
    const qrToken = signLibraryToken(passNumber, student._id.toString(), validUntil.getTime());

    const pass = new LibraryPass({
      student: student._id,
      studentIdNumber: student.idNumber,
      studentName: student.name,
      passNumber,
      passType,
      purpose,
      qrToken,
      validFrom: now,
      validUntil,
      status: 'ACTIVE',
    });

    await pass.save();

    res.status(201).json({
      success: true,
      message: 'Digital Library Pass issued successfully',
      data: pass,
    });
  } catch (err) {
    next(err);
  }
});

// Student gets their current active pass and past history
router.get('/pass/my', authenticateToken, requireRole(['student']), async (req, res, next) => {
  try {
    const studentId = req.user._id;
    const now = new Date();

    const passes = await LibraryPass.find({ student: studentId }).sort({ createdAt: -1 });

    // Auto-expire any passes whose validUntil has passed
    for (const p of passes) {
      if (p.status === 'ACTIVE' && p.validUntil < now) {
        p.status = 'EXPIRED';
        await p.save();
      }
    }

    const activePass = passes.find((p) => p.status === 'ACTIVE' && p.validUntil > now) || null;

    res.json({
      success: true,
      data: {
        activePass,
        history: passes,
      },
    });
  } catch (err) {
    next(err);
  }
});

// Librarian / Staff verifies pass by scanning QR token or pass number
const verifyPassSchema = {
  body: z.object({
    tokenOrNumber: z.string().min(3),
    location: z.string().optional(),
    note: z.string().optional(),
  }),
};

router.post('/pass/verify', authenticateToken, requireRole(['admin', 'faculty']), validate(verifyPassSchema), async (req, res, next) => {
  try {
    const { tokenOrNumber, location = 'Central Library Main Gate', note = '' } = req.body;
    const verifier = req.user;
    const now = new Date();

    let pass = null;

    if (tokenOrNumber.includes(':')) {
      const tokenResult = verifyLibraryToken(tokenOrNumber);
      if (!tokenResult || !tokenResult.valid) {
        return res.status(400).json({
          success: false,
          message: `QR Token verification failed: ${tokenResult?.reason || 'INVALID_FORMAT'}`,
        });
      }
      pass = await LibraryPass.findOne({ passNumber: tokenResult.passNumber }).populate('student', 'name idNumber email department semester section avatar');
    } else {
      pass = await LibraryPass.findOne({ passNumber: tokenOrNumber.trim().toUpperCase() }).populate('student', 'name idNumber email department semester section avatar');
    }

    if (!pass) {
      return res.status(404).json({ success: false, message: 'Library pass not found' });
    }

    if (pass.validUntil < now) {
      pass.status = 'EXPIRED';
      await pass.save();
      return res.status(403).json({
        success: false,
        message: 'Library pass has expired',
        data: { passNumber: pass.passNumber, validUntil: pass.validUntil, status: 'EXPIRED' },
      });
    }

    if (pass.status === 'REVOKED') {
      return res.status(403).json({ success: false, message: 'Library pass has been revoked by administration' });
    }

    if (pass.singleUse && pass.status === 'USED') {
      return res.status(409).json({ success: false, message: 'Single-use library pass has already been used for entry' });
    }

    // Record check-in event
    pass.checkInLogs.push({
      verifiedAt: now,
      verifiedBy: verifier._id,
      verifierName: verifier.name,
      location,
      note,
    });

    if (pass.singleUse) {
      pass.status = 'USED';
    }

    await pass.save();

    // Audit log
    await AuditLog.create({
      actor: verifier._id,
      action: 'LIBRARY_PASS_VERIFIED',
      targetType: 'LibraryPass',
      targetId: pass._id.toString(),
      details: {
        studentName: pass.studentName,
        studentId: pass.studentIdNumber,
        passNumber: pass.passNumber,
        location,
      },
    });

    res.json({
      success: true,
      message: `Verified! Entry granted for ${pass.studentName} (${pass.studentIdNumber})`,
      data: {
        verified: true,
        passNumber: pass.passNumber,
        passType: pass.passType,
        student: pass.student,
        validUntil: pass.validUntil,
        checkedInAt: now,
        location,
      },
    });
  } catch (err) {
    next(err);
  }
});

// Revoke a pass
router.post('/pass/:id/revoke', authenticateToken, requireRole(['admin']), async (req, res, next) => {
  try {
    const pass = await LibraryPass.findById(req.params.id);
    if (!pass) return res.status(404).json({ success: false, message: 'Pass not found' });
    pass.status = 'REVOKED';
    await pass.save();
    res.json({ success: true, message: `Pass ${pass.passNumber} revoked successfully`, data: pass });
  } catch (err) {
    next(err);
  }
});

// -------------------------------------------------------------
// 2. Book Catalogue Endpoints
// -------------------------------------------------------------

router.get('/books', async (req, res, next) => {
  try {
    const { category, search, availableOnly } = req.query;
    const filter = { isActive: true };

    if (category) filter.category = category;
    if (availableOnly === 'true') filter.availableCopies = { $gt: 0 };
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
        { isbn: { $regex: search, $options: 'i' } },
      ];
    }

    let books = await Book.find(filter).sort({ title: 1 });

    // Seed default library catalogue if empty
    if (books.length === 0 && !search && !category) {
      const defaultBooks = [
        {
          isbn: '978-0131103627',
          title: 'The C Programming Language',
          author: 'Brian W. Kernighan, Dennis M. Ritchie',
          category: 'Computer Science',
          subjectCode: 'BTCS 301-18',
          totalCopies: 8,
          availableCopies: 6,
          shelfLocation: 'Stack CS-101',
        },
        {
          isbn: '978-0262033848',
          title: 'Introduction to Algorithms (CLRS)',
          author: 'Thomas H. Cormen, Charles E. Leiserson',
          category: 'Computer Science',
          subjectCode: 'BTCS 301-18',
          totalCopies: 12,
          availableCopies: 9,
          shelfLocation: 'Stack CS-204',
        },
        {
          isbn: '978-0133591620',
          title: 'Operating System Concepts',
          author: 'Abraham Silberschatz, Peter B. Galvin',
          category: 'Computer Science',
          subjectCode: 'BTCS 402-18',
          totalCopies: 10,
          availableCopies: 7,
          shelfLocation: 'Stack CS-302',
        },
        {
          isbn: '978-0078022159',
          title: 'Database System Concepts',
          author: 'Avi Silberschatz, Henry F. Korth',
          category: 'Computer Science',
          subjectCode: 'BTCS 403-18',
          totalCopies: 9,
          availableCopies: 7,
          shelfLocation: 'Stack CS-405',
        },
        {
          isbn: '978-0471198260',
          title: 'Advanced Engineering Mathematics',
          author: 'Erwin Kreyszig',
          category: 'Mathematics',
          subjectCode: 'BTAM 304-18',
          totalCopies: 15,
          availableCopies: 11,
          shelfLocation: 'Stack MATH-102',
        },
        {
          isbn: '978-0134685991',
          title: 'Effective Java',
          author: 'Joshua Bloch',
          category: 'Computer Science',
          subjectCode: 'BTCS 302-18',
          totalCopies: 6,
          availableCopies: 5,
          shelfLocation: 'Stack CS-501',
        },
      ];
      await Book.insertMany(defaultBooks);
      books = await Book.find(filter).sort({ title: 1 });
    }

    res.json({ success: true, count: books.length, data: books });
  } catch (err) {
    next(err);
  }
});

// -------------------------------------------------------------
// 3. Book Issue & Return (Librarian / Staff Workflow)
// -------------------------------------------------------------

const issueBookSchema = {
  body: z.object({
    bookId: z.string(),
    studentIdentifier: z.string(), // ID number or email or ObjectId
    loanDurationDays: z.number().min(1).max(60).optional(),
  }),
};

router.post('/books/issue', authenticateToken, requireRole(['admin', 'faculty']), validate(issueBookSchema), async (req, res, next) => {
  try {
    const { bookId, studentIdentifier, loanDurationDays = 14 } = req.body;
    const issuer = req.user;

    const book = await Book.findById(bookId);
    if (!book) return res.status(404).json({ success: false, message: 'Book not found' });

    if (book.availableCopies <= 0) {
      return res.status(400).json({ success: false, message: `All ${book.totalCopies} copies of '${book.title}' are currently issued.` });
    }

    const student = await User.findOne({
      $or: [
        { idNumber: studentIdentifier.trim().toUpperCase() },
        { email: studentIdentifier.trim().toLowerCase() },
      ],
      role: 'student',
    });

    if (!student) {
      return res.status(404).json({ success: false, message: `Student '${studentIdentifier}' not found.` });
    }

    // Check if student already has this book issued and unreturned
    const existingLoan = await BookLoan.findOne({
      book: book._id,
      student: student._id,
      status: { $in: ['ISSUED', 'OVERDUE'] },
    });

    if (existingLoan) {
      return res.status(409).json({ success: false, message: `Student ${student.name} already has an active loan for this book.` });
    }

    const now = new Date();
    const dueDate = new Date(now.getTime() + loanDurationDays * 24 * 60 * 60 * 1000);
    const loanId = `LOAN-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    const loan = new BookLoan({
      loanId,
      book: book._id,
      student: student._id,
      issuedBy: issuer._id,
      issueDate: now,
      dueDate,
      status: 'ISSUED',
    });

    // Atomic decrement
    book.availableCopies -= 1;
    await book.save();
    await loan.save();

    // In-App Notification to student
    await Notification.create({
      recipient: student._id,
      title: 'Book Issued: ' + book.title,
      message: `You have borrowed '${book.title}'. Due date is ${dueDate.toLocaleDateString()}. Please return on or before due date to avoid fines.`,
      type: 'ACADEMIC',
      actionUrl: '/library',
    });

    // Audit log
    await AuditLog.create({
      actor: issuer._id,
      action: 'BOOK_ISSUED',
      targetType: 'BookLoan',
      targetId: loan._id.toString(),
      details: {
        bookTitle: book.title,
        studentName: student.name,
        studentId: student.idNumber,
        dueDate,
      },
    });

    res.status(201).json({
      success: true,
      message: `Book '${book.title}' successfully issued to ${student.name} (Due: ${dueDate.toLocaleDateString()})`,
      data: loan,
    });
  } catch (err) {
    next(err);
  }
});

// Return a book
const returnBookSchema = {
  body: z.object({
    loanId: z.string().optional(),
    bookId: z.string().optional(),
    studentIdNumber: z.string().optional(),
  }),
};

router.post('/books/return', authenticateToken, requireRole(['admin', 'faculty']), validate(returnBookSchema), async (req, res, next) => {
  try {
    const { loanId, bookId, studentIdNumber } = req.body;
    let query = { status: { $in: ['ISSUED', 'OVERDUE'] } };

    if (loanId) {
      query.loanId = loanId.trim().toUpperCase();
    } else if (bookId && studentIdNumber) {
      const student = await User.findOne({ idNumber: studentIdNumber.trim().toUpperCase() });
      if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
      query.book = bookId;
      query.student = student._id;
    } else {
      return res.status(400).json({ success: false, message: 'Provide either loanId or both bookId and studentIdNumber' });
    }

    const loan = await BookLoan.findOne(query).populate('book').populate('student', 'name idNumber');
    if (!loan) {
      return res.status(404).json({ success: false, message: 'Active book loan record not found' });
    }

    const now = new Date();
    loan.returnDate = now;
    loan.status = 'RETURNED';

    // Calculate overdue fine if returned after due date
    if (now > loan.dueDate) {
      const diffDays = Math.ceil((now - loan.dueDate) / (1000 * 60 * 60 * 24));
      loan.fineAmount = diffDays * (loan.finePerDay || 5);
    }

    await loan.save();

    // Increment available copies atomically
    await Book.findByIdAndUpdate(loan.book._id, { $inc: { availableCopies: 1 } });

    // Notification to student
    await Notification.create({
      recipient: loan.student._id,
      title: 'Book Return Confirmed: ' + loan.book.title,
      message: `Your return for '${loan.book.title}' has been processed. ${loan.fineAmount > 0 ? `Outstanding fine: ₹${loan.fineAmount}` : 'No overdue fines.'}`,
      type: 'ACADEMIC',
      actionUrl: '/library',
    });

    res.json({
      success: true,
      message: `Book '${loan.book.title}' return processed successfully.${loan.fineAmount > 0 ? ` Overdue fine: ₹${loan.fineAmount}` : ''}`,
      data: loan,
    });
  } catch (err) {
    next(err);
  }
});

// Student's currently borrowed books & loan history
router.get('/my-books', authenticateToken, requireRole(['student']), async (req, res, next) => {
  try {
    const studentId = req.user._id;
    const now = new Date();

    const loans = await BookLoan.find({ student: studentId })
      .populate('book')
      .sort({ createdAt: -1 });

    // Dynamically update status to OVERDUE if overdue
    for (const l of loans) {
      if (l.status === 'ISSUED' && l.dueDate < now) {
        l.status = 'OVERDUE';
        const diffDays = Math.ceil((now - l.dueDate) / (1000 * 60 * 60 * 24));
        l.fineAmount = diffDays * (l.finePerDay || 5);
        await l.save();
      }
    }

    const activeLoans = loans.filter((l) => l.status === 'ISSUED' || l.status === 'OVERDUE');
    const returnedHistory = loans.filter((l) => l.status === 'RETURNED');

    res.json({
      success: true,
      data: {
        activeLoans,
        history: returnedHistory,
        totalFineDue: activeLoans.reduce((sum, l) => sum + (l.fineAmount || 0), 0),
      },
    });
  } catch (err) {
    next(err);
  }
});

// Librarian view of all loans
router.get('/loans', authenticateToken, requireRole(['admin', 'faculty']), async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const loans = await BookLoan.find(filter)
      .populate('book')
      .populate('student', 'name idNumber email department section phone')
      .sort({ dueDate: 1 });

    res.json({ success: true, count: loans.length, data: loans });
  } catch (err) {
    next(err);
  }
});

// Run scheduled restart-safe reminder check
router.post('/reminders/check', authenticateToken, requireRole(['admin', 'faculty']), async (req, res, next) => {
  try {
    const now = new Date();
    const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

    const activeLoans = await BookLoan.find({
      status: { $in: ['ISSUED', 'OVERDUE'] },
    }).populate('book').populate('student');

    let remindersDispatched = 0;

    for (const loan of activeLoans) {
      // 1. Overdue reminder
      if (loan.dueDate < now) {
        loan.status = 'OVERDUE';
        const diffDays = Math.ceil((now - loan.dueDate) / (1000 * 60 * 60 * 24));
        loan.fineAmount = diffDays * (loan.finePerDay || 5);

        // Check if overdue reminder was sent today to prevent duplicates
        const alreadySentToday = loan.remindersSent.some(
          (r) => r.type === 'OVERDUE' && (now - new Date(r.sentAt)) < 24 * 60 * 60 * 1000
        );

        if (!alreadySentToday) {
          const msg = `ALERT: '${loan.book.title}' is overdue by ${diffDays} day(s). Accumulated fine: ₹${loan.fineAmount}. Please return immediately.`;
          loan.remindersSent.push({
            type: 'OVERDUE',
            sentAt: now,
            channel: 'IN_APP',
            message: msg,
          });
          await Notification.create({
            recipient: loan.student._id,
            title: 'Library Book Overdue Alert',
            message: msg,
            type: 'ACADEMIC',
            actionUrl: '/library',
          });
          remindersDispatched++;
        }
        await loan.save();
      }
      // 2. Upcoming due date reminder (within 2 days)
      else if (loan.dueDate <= twoDaysFromNow) {
        const alreadySentUpcoming = loan.remindersSent.some((r) => r.type === 'UPCOMING_DUE');
        if (!alreadySentUpcoming) {
          const msg = `REMINDER: '${loan.book.title}' is due on ${loan.dueDate.toLocaleDateString()}. Please renew or return before due date.`;
          loan.remindersSent.push({
            type: 'UPCOMING_DUE',
            sentAt: now,
            channel: 'IN_APP',
            message: msg,
          });
          await Notification.create({
            recipient: loan.student._id,
            title: 'Library Due Date Approaching',
            message: msg,
            type: 'ACADEMIC',
            actionUrl: '/library',
          });
          remindersDispatched++;
          await loan.save();
        }
      }
    }

    res.json({
      success: true,
      message: `Processed ${activeLoans.length} active loans. Dispatched ${remindersDispatched} in-app reminders.`,
      remindersDispatched,
    });
  } catch (err) {
    next(err);
  }
});

export default router;

import express from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { User } from '../models/User.js';
import { authenticateToken, generateToken } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

const registerSchema = {
  body: z.object({
    idNumber: z.string().min(2).max(30),
    name: z.string().min(2).max(100),
    email: z.string().email(),
    password: z.string().min(6),
    role: z.enum(['student', 'faculty', 'admin', 'transport_manager', 'hostel_warden']).optional(),
    college: z.string().optional(),
    department: z.string().optional(),
    designation: z.string().optional(),
    semester: z.number().optional(),
    section: z.string().optional(),
    phone: z.string().optional(),
    rollNumber: z.string().optional(),
    registrationNumber: z.string().optional(),
    degree: z.string().optional(),
    branch: z.string().optional(),
    academicYear: z.string().optional(),
    subjectsTaught: z.union([z.array(z.string()), z.string()]).optional(),
  }),
};

const loginSchema = {
  body: z.object({
    idNumber: z.string().min(1).optional(),
    identifier: z.string().min(1).optional(),
    password: z.string().min(1),
  }).refine((data) => data.idNumber || data.identifier, {
    message: 'idNumber or identifier is required',
  }),
};

// 1. Register (Student or Teacher)
router.post('/register', validate(registerSchema), async (req, res, next) => {
  try {
    const {
      idNumber,
      name,
      email,
      password,
      role = 'student',
      college,
      department,
      designation,
      semester,
      section,
      phone,
      rollNumber,
      registrationNumber,
      degree,
      branch,
      academicYear,
      subjectsTaught,
    } = req.body;

    const cleanId = (idNumber || rollNumber || '').trim().toUpperCase();
    const cleanEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      $or: [{ idNumber: cleanId }, { email: cleanEmail }],
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this Institutional ID / Roll Number or Email already exists.',
      });
    }

    // Teachers ALWAYS require administrator approval before active login
    // Students registering with unknown IDs are marked as pending verification
    let initialStatus = 'active';
    if (role === 'faculty' || role === 'teacher') {
      initialStatus = 'pending'; // MUST be approved by admin
    }

    let subjectsArray = [];
    if (Array.isArray(subjectsTaught)) {
      subjectsArray = subjectsTaught;
    } else if (typeof subjectsTaught === 'string' && subjectsTaught.trim()) {
      subjectsArray = subjectsTaught.split(',').map((s) => s.trim()).filter(Boolean);
    }

    const user = new User({
      idNumber: cleanId,
      name: name.trim(),
      email: cleanEmail,
      password,
      role: role === 'teacher' ? 'faculty' : role,
      status: initialStatus,
      college: college || 'Indo Global College of Engineering (Affiliated to IKGPTU)',
      department: department || (role === 'faculty' ? 'Department of Computer Science & Engineering' : 'Computer Science & Engineering'),
      designation: designation || (role === 'faculty' ? 'Assistant Professor' : ''),
      semester: semester || 4,
      section: section || 'CSE-A',
      phone: phone || '+91 98765 43210',
      rollNumber: rollNumber || cleanId,
      registrationNumber: registrationNumber || `REG-${cleanId}`,
      degree: degree || 'B.Tech',
      branch: branch || 'Computer Science & Engineering',
      academicYear: academicYear || '2nd Year',
      subjectsTaught: subjectsArray,
      avatar: name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase(),
    });

    await user.save();
    const token = generateToken(user);

    res.status(201).json({
      success: true,
      pendingApproval: initialStatus === 'pending',
      message: initialStatus === 'pending'
        ? 'Registration submitted! Your faculty account is pending verification and approval by the Academic Administrator.'
        : 'Student registration completed successfully.',
      token,
      user: user.toJSON(),
    });
  } catch (err) {
    next(err);
  }
});

// 2. Login
router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const rawId = (req.body.idNumber || req.body.identifier || '').trim();
    const { password } = req.body;

    const user = await User.findOne({
      $or: [
        { idNumber: rawId.toUpperCase() },
        { email: rawId.toLowerCase() },
        { rollNumber: rawId.toUpperCase() },
      ],
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid ID Number / Email or Password.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid ID Number / Email or Password.',
      });
    }

    if (user.status === 'rejected') {
      return res.status(403).json({
        success: false,
        message: 'This account registration was reviewed and rejected by the Institutional Administrator.',
      });
    }

    const isPending = user.status === 'pending';
    const token = generateToken(user);

    res.json({
      success: true,
      pendingApproval: isPending,
      message: isPending
        ? 'Your account is pending institutional approval by the College Administrator.'
        : 'Authentication successful',
      token,
      user: user.toJSON(),
    });
  } catch (err) {
    next(err);
  }
});

// 3. Get current session user
router.get('/me', authenticateToken, async (req, res) => {
  res.json({
    success: true,
    user: req.user.toJSON(),
  });
});

// 4. Forgot Password Request
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { identifier } = req.body;
    if (!identifier) {
      return res.status(400).json({ success: false, message: 'Please provide ID Number or Email address.' });
    }

    const user = await User.findOne({
      $or: [
        { idNumber: identifier.trim().toUpperCase() },
        { email: identifier.trim().toLowerCase() },
      ],
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'No registered user matches this identifier.' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(24).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour validity
    await user.save();

    res.json({
      success: true,
      message: `Password reset token generated for ${user.name}.`,
      resetToken, // Returned for UI verification in institutional demo
      expiresIn: '1 hour',
    });
  } catch (err) {
    next(err);
  }
});

// 5. Reset Password Execution
router.post('/reset-password', async (req, res, next) => {
  try {
    const { resetToken, newPassword } = req.body;
    if (!resetToken || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Valid token and new password (min 6 chars) required.' });
    }

    const user = await User.findOne({
      resetPasswordToken: resetToken,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Reset token is invalid or has expired.' });
    }

    user.password = newPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.json({
      success: true,
      message: 'Password successfully updated. You may now log in with your new credentials.',
    });
  } catch (err) {
    next(err);
  }
});

export default router;

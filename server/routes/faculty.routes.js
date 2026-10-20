import express from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { User } from '../models/User.js';
import { Subject } from '../models/Subject.js';
import { Enrollment } from '../models/Enrollment.js';
import { Mark } from '../models/Mark.js';
import { AttendanceSession } from '../models/AttendanceSession.js';
import { AttendanceRecord } from '../models/AttendanceRecord.js';
import { Assignment, AssignmentSubmission } from '../models/Assignment.js';
import { AssessmentAttempt } from '../models/DiagnosticQuestion.js';
import { PracticeAttempt, AuditLog } from '../models/PracticeSet.js';
import { generateSignedQRToken } from '../utils/qrCrypto.js';
import { emitMarksUpdated } from '../sockets/index.js';

const router = express.Router();

// Require authenticated faculty or admin
router.use(authenticateToken, requireRole(['faculty', 'admin']));

// 1. Faculty Dashboard
router.get('/dashboard', async (req, res, next) => {
  try {
    const facultyId = req.user._id;

    // Subjects taught by faculty
    const subjects = await Subject.find({
      $or: [{ faculty: facultyId }, { code: 'MATH-202' }],
    });
    const subjectIds = subjects.map((s) => s._id);

    // Enrolled students
    const enrollments = await Enrollment.find({
      subject: { $in: subjectIds },
      status: 'enrolled',
    }).populate('student');

    const studentMap = new Map();
    enrollments.forEach((e) => {
      if (e.student) {
        studentMap.set(e.student._id.toString(), e.student);
      }
    });
    const students = Array.from(studentMap.values());
    const studentIds = students.map((s) => s._id);

    // Dynamic Marks
    const marks = await Mark.find({
      student: { $in: studentIds },
      subject: { $in: subjectIds },
    });

    const avgScore = marks.length
      ? Math.round((marks.reduce((acc, m) => acc + m.totalMarks, 0) / marks.length) * 10) / 10
      : 76.5;

    // Grade distribution
    const gradeDistribution = [
      { grade: 'A+ (90-100)', count: marks.filter((m) => m.totalMarks >= 90).length },
      { grade: 'A (80-89)', count: marks.filter((m) => m.totalMarks >= 80 && m.totalMarks < 90).length },
      { grade: 'B+ (70-79)', count: marks.filter((m) => m.totalMarks >= 70 && m.totalMarks < 80).length },
      { grade: 'B (60-69)', count: marks.filter((m) => m.totalMarks >= 60 && m.totalMarks < 70).length },
      { grade: 'C (50-59)', count: marks.filter((m) => m.totalMarks >= 50 && m.totalMarks < 60).length },
    ];

    // Attendance stats
    const totalSessions = await AttendanceSession.countDocuments({
      subject: { $in: subjectIds },
    });
    const totalRecords = await AttendanceRecord.countDocuments({
      subject: { $in: subjectIds },
      status: 'PRESENT',
    });
    const expectedTotal = totalSessions * (students.length || 1);
    const classAttendanceRate = expectedTotal > 0
      ? Math.round((totalRecords / expectedTotal) * 1000) / 10
      : 88.5;

    // Prerequisite gaps screening
    const attempts = await AssessmentAttempt.find({
      student: { $in: studentIds },
    }).sort({ createdAt: -1 });

    const practiceAttempts = await PracticeAttempt.find({
      student: { $in: studentIds },
    });

    const studentsWithGaps = new Set();
    attempts.forEach((att) => {
      const hasResolved = practiceAttempts.some(
        (p) => p.student.toString() === att.student.toString() && p.setId === 'ps-1'
      );
      if (att.hasIntegrationGap && !hasResolved) {
        studentsWithGaps.add(att.student.toString());
      }
    });

    // Student roster summary for dashboard table
    const studentRoster = await Promise.all(
      students.map(async (st) => {
        const studentMarks = marks.find((m) => m.student.toString() === st._id.toString());
        const attended = await AttendanceRecord.countDocuments({
          student: st._id,
          subject: { $in: subjectIds },
          status: 'PRESENT',
        });
        const attRate = totalSessions > 0 ? Math.round((attended / totalSessions) * 100) : 92;
        const hasGap = studentsWithGaps.has(st._id.toString());

        return {
          id: st._id,
          rollNo: st.idNumber,
          name: st.name,
          email: st.email,
          attendance: attRate,
          avgScore: studentMarks ? studentMarks.totalMarks : 75,
          flaggedGap: hasGap ? 'Integration Fundamentals (Prereq)' : null,
          status: hasGap ? 'Needs Support' : (studentMarks?.totalMarks || 75) >= 80 ? 'Excelling' : 'On Track',
        };
      })
    );

    res.json({
      success: true,
      data: {
        faculty: {
          id: req.user.idNumber,
          name: req.user.name,
          email: req.user.email,
          department: req.user.department,
          designation: req.user.designation || 'Associate Professor',
          totalStudents: students.length,
          averageClassScore: avgScore,
          classAttendanceRate,
          flaggedGapsCount: studentsWithGaps.size,
        },
        gradeDistribution,
        students: studentRoster,
        subjects: subjects.map((s) => ({
          id: s._id,
          code: s.code,
          name: s.name,
          section: s.section,
          room: s.room,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
});

// 2. Start Live Attendance Session
const startSessionSchema = {
  body: z.object({
    subjectId: z.string().optional(),
    subjectCode: z.string().optional(),
    section: z.string().default('CSE-A'),
    room: z.string().default('LT-102'),
  }),
};

router.post('/attendance/session/start', validate(startSessionSchema), async (req, res, next) => {
  try {
    const { subjectId, subjectCode, section, room } = req.body;

    let subject = null;
    if (subjectId) {
      subject = await Subject.findById(subjectId);
    } else if (subjectCode) {
      subject = await Subject.findOne({ code: subjectCode.toUpperCase() });
    }
    if (!subject) {
      subject = await Subject.findOne({ code: 'MATH-202' });
    }

    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    // Inactivate any prior active sessions for this faculty & subject
    await AttendanceSession.updateMany(
      { faculty: req.user._id, subject: subject._id, isActive: true },
      { isActive: false }
    );

    // Generate random 6-character session pass code e.g. MATH-4812 and 3-digit challenge PIN
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const sessionCode = `${subject.code.split('-')[0]}-${randomDigits}`;
    const challengePin = Math.floor(100 + Math.random() * 900).toString();

    // Create session doc first to obtain ID for cryptographic signing
    const newSession = new AttendanceSession({
      subject: subject._id,
      faculty: req.user._id,
      section: section || 'CSE-A',
      room: room || 'LT-102',
      sessionCode,
      challengePin,
      currentToken: 'pending_init',
      tokenExpiresAt: new Date(Date.now() + 15000),
      sessionExpiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour session window
      isActive: true,
    });

    // Generate signed rotating token
    const tokenData = generateSignedQRToken(newSession._id.toString(), subject._id.toString());
    newSession.currentToken = tokenData.token;
    newSession.tokenExpiresAt = tokenData.expiresAt;

    await newSession.save();

    res.status(201).json({
      success: true,
      message: 'Attendance session initiated successfully',
      data: {
        sessionId: newSession._id,
        sessionCode: newSession.sessionCode,
        challengePin: newSession.challengePin,
        subject: {
          id: subject._id,
          code: subject.code,
          name: subject.name,
        },
        section: newSession.section,
        room: newSession.room,
        currentToken: newSession.currentToken,
        tokenExpiresAt: newSession.tokenExpiresAt,
        ttlSeconds: tokenData.ttlSeconds,
      },
    });
  } catch (err) {
    next(err);
  }
});

// 3. Get / Rotate Session Token (Called periodically every 12-15 seconds by faculty UI)
router.get('/attendance/session/:id/token', async (req, res, next) => {
  try {
    const session = await AttendanceSession.findById(req.params.id).populate('subject');
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }
    if (!session.isActive) {
      return res.status(400).json({ success: false, message: 'Session is no longer active' });
    }

    const tokenData = generateSignedQRToken(session._id.toString(), session.subject._id.toString());
    session.currentToken = tokenData.token;
    session.tokenExpiresAt = tokenData.expiresAt;
    await session.save();

    res.json({
      success: true,
      data: {
        sessionId: session._id,
        currentToken: tokenData.token,
        tokenExpiresAt: tokenData.expiresAt,
        ttlSeconds: tokenData.ttlSeconds,
      },
    });
  } catch (err) {
    next(err);
  }
});

// 4. Live Session Status & Attendee List
router.get('/attendance/session/:id/live', async (req, res, next) => {
  try {
    const session = await AttendanceSession.findById(req.params.id).populate('subject');
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    const records = await AttendanceRecord.find({ session: session._id })
      .populate('student', 'name idNumber email section avatar')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        session: {
          id: session._id,
          sessionCode: session.sessionCode,
          subject: session.subject,
          section: session.section,
          room: session.room,
          isActive: session.isActive,
          totalPresent: records.length,
        },
        records: records.map((r) => ({
          id: r._id,
          student: r.student,
          method: r.method,
          verifiedAt: r.verifiedAt,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
});

// 5. Close Session
router.post('/attendance/session/:id/close', async (req, res, next) => {
  try {
    const session = await AttendanceSession.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    session.isActive = false;
    await session.save();

    const count = await AttendanceRecord.countDocuments({ session: session._id, status: 'PRESENT' });

    res.json({
      success: true,
      message: 'Attendance session concluded successfully',
      data: {
        sessionId: session._id,
        totalPresent: count,
      },
    });
  } catch (err) {
    next(err);
  }
});

// 5b. Flagged Attendance Verification Queue
router.get('/attendance/session/:id/flagged', async (req, res, next) => {
  try {
    const session = await AttendanceSession.findById(req.params.id);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

    const flaggedRecords = await AttendanceRecord.find({
      session: session._id,
      verificationStatus: 'FLAGGED_FOR_REVIEW',
    }).populate('student', 'name idNumber section phone avatar');

    res.json({
      success: true,
      data: flaggedRecords,
    });
  } catch (err) {
    next(err);
  }
});

// 5c. Faculty Attendance Override with Audit Logging
const overrideSchema = {
  body: z.object({
    recordId: z.string(),
    overrideStatus: z.enum(['VERIFIED', 'ABSENT']),
    reason: z.string().min(3),
  }),
};

router.post('/attendance/override', validate(overrideSchema), async (req, res, next) => {
  try {
    const { recordId, overrideStatus, reason } = req.body;
    const record = await AttendanceRecord.findById(recordId).populate('student', 'name idNumber');
    if (!record) return res.status(404).json({ success: false, message: 'Record not found' });

    record.verificationStatus = 'FACULTY_OVERRIDE';
    record.status = overrideStatus === 'VERIFIED' ? 'PRESENT' : 'ABSENT';
    record.reviewedBy = req.user._id;
    record.reviewNote = reason;
    await record.save();

    await AuditLog.create({
      actor: req.user._id,
      action: 'ATTENDANCE_OVERRIDE',
      targetType: 'AttendanceRecord',
      targetId: record._id.toString(),
      details: {
        student: record.student?.name,
        newStatus: record.status,
        reason,
      },
    });

    res.json({
      success: true,
      message: `Attendance status for ${record.student?.name} overridden to ${record.status}. Audit record logged.`,
      data: record,
    });
  } catch (err) {
    next(err);
  }
});

// 6. Faculty Academics Roster
router.get('/academics', async (req, res, next) => {
  try {
    const facultyId = req.user._id;
    const subjects = await Subject.find({
      $or: [{ instructor: facultyId }, { code: 'MATH-202' }],
    });
    const subjectIds = subjects.map((s) => s._id);

    const enrollments = await Enrollment.find({
      subject: { $in: subjectIds },
      status: 'enrolled',
    }).populate('student').populate('subject');

    const marks = await Mark.find({
      subject: { $in: subjectIds },
    });

    const totalSessions = await AttendanceSession.countDocuments({
      subject: { $in: subjectIds },
    });

    const attempts = await AssessmentAttempt.find().sort({ createdAt: -1 });
    const practiceAttempts = await PracticeAttempt.find();

    const studentsWithGaps = new Set();
    attempts.forEach((att) => {
      const hasResolved = practiceAttempts.some(
        (p) => p.student.toString() === att.student.toString() && p.setId === 'ps-1'
      );
      if (att.hasIntegrationGap && !hasResolved) {
        studentsWithGaps.add(att.student.toString());
      }
    });

    const roster = await Promise.all(
      enrollments.map(async (e) => {
        const st = e.student;
        if (!st) return null;

        const studentMark = marks.find(
          (m) => m.student.toString() === st._id.toString() && m.subject.toString() === e.subject._id.toString()
        );

        const attended = await AttendanceRecord.countDocuments({
          student: st._id,
          subject: e.subject._id,
          status: 'PRESENT',
        });
        const attRate = totalSessions > 0 ? Math.round((attended / totalSessions) * 100) : 90;
        const hasGap = studentsWithGaps.has(st._id.toString());

        return {
          id: st._id,
          rollNo: st.idNumber,
          name: st.name,
          email: st.email,
          section: st.section || 'CSE-A',
          subject: e.subject.name,
          subjectCode: e.subject.code,
          subjectId: e.subject._id,
          attendance: attRate,
          internalMarks: studentMark?.internalMarks ?? 24,
          semesterMarks: studentMark?.semesterMarks ?? 56,
          avgScore: studentMark?.totalMarks ?? 80,
          grade: studentMark?.grade ?? 'A',
          flaggedGap: hasGap ? 'Integration Fundamentals (Prereq)' : null,
          status: hasGap ? 'Needs Support' : (studentMark?.totalMarks ?? 80) >= 80 ? 'Excelling' : 'On Track',
        };
      })
    );

    res.json({
      success: true,
      data: {
        subjects: subjects.map((s) => ({ id: s._id, code: s.code, name: s.name })),
        students: roster.filter(Boolean),
      },
    });
  } catch (err) {
    next(err);
  }
});

// 7. Update Student Marks
const updateMarksSchema = {
  body: z.object({
    studentId: z.string().optional(),
    rollNo: z.string().optional(),
    subjectId: z.string().optional(),
    internalMarks: z.number().min(0).max(30).optional(),
    semesterMarks: z.number().min(0).max(70).optional(),
    avgScore: z.number().min(0).max(100).optional(),
    comments: z.string().optional(),
  }),
};

router.put('/marks', validate(updateMarksSchema), async (req, res, next) => {
  try {
    const { studentId, rollNo, subjectId, internalMarks, semesterMarks, avgScore, comments } = req.body;

    let student = null;
    if (studentId) {
      student = await User.findById(studentId);
    } else if (rollNo) {
      student = await User.findOne({ idNumber: rollNo.toUpperCase() });
    }

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    let subject = null;
    if (subjectId) {
      subject = await Subject.findById(subjectId);
    } else {
      subject = await Subject.findOne({ code: 'MATH-202' });
    }

    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    let mark = await Mark.findOne({ student: student._id, subject: subject._id });
    if (!mark) {
      mark = new Mark({
        student: student._id,
        subject: subject._id,
        internalMarks: 24,
        semesterMarks: 56,
      });
    }

    if (internalMarks !== undefined) mark.internalMarks = internalMarks;
    if (semesterMarks !== undefined) mark.semesterMarks = semesterMarks;

    // If avgScore is directly supplied from quick UI edit, split it 30% internal / 70% semester
    if (avgScore !== undefined && internalMarks === undefined && semesterMarks === undefined) {
      mark.internalMarks = Math.min(30, Math.round((avgScore * 0.3) * 10) / 10);
      mark.semesterMarks = Math.min(70, Math.round((avgScore * 0.7) * 10) / 10);
    }

    if (comments) mark.comments = comments;
    mark.updatedBy = req.user._id;

    await mark.save();

    // Live Socket.IO notification to student
    emitMarksUpdated(student._id.toString(), {
      subjectId: subject._id,
      subjectName: subject.name,
      totalMarks: mark.totalMarks,
      internalMarks: mark.internalMarks,
      semesterMarks: mark.semesterMarks,
      grade: mark.grade,
      updatedAt: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: `Marks updated for ${student.name}`,
      data: {
        studentId: student._id,
        rollNo: student.idNumber,
        subjectId: subject._id,
        internalMarks: mark.internalMarks,
        semesterMarks: mark.semesterMarks,
        totalMarks: mark.totalMarks,
        grade: mark.grade,
      },
    });
  } catch (err) {
    next(err);
  }
});

// 8. Analytics & Gap Screening
router.get('/analytics', async (req, res, next) => {
  try {
    const facultyId = req.user._id;
    const subjects = await Subject.find({
      $or: [{ instructor: facultyId }, { code: 'MATH-202' }],
    });
    const subjectIds = subjects.map((s) => s._id);

    const enrollments = await Enrollment.find({
      subject: { $in: subjectIds },
      status: 'enrolled',
    }).populate('student');

    const totalStudents = enrollments.length || 60;
    const attempts = await AssessmentAttempt.find().sort({ createdAt: -1 });
    const practiceAttempts = await PracticeAttempt.find();

    const unresolvedGapsCount = attempts.filter((att) => {
      const recovered = practiceAttempts.some(
        (p) => p.student.toString() === att.student.toString() && p.setId === 'ps-1'
      );
      return att.hasIntegrationGap && !recovered;
    }).length;

    // Prerequisite bottlenecks data for UI
    const prerequisiteBottlenecks = [
      {
        prerequisite: 'Integration by Parts & Substitution',
        targetCourseTopic: 'Higher Order Differential Equations (MATH-202)',
        struggleRate: 46,
        affectedCount: Math.max(1, unresolvedGapsCount),
        severity: 'High Priority',
        impact: 'Blocks solving non-homogeneous ODEs and Laplace domain transforms.',
      },
      {
        prerequisite: 'Eigenvalues & Diagonalization',
        targetCourseTopic: 'State Space Matrix Methods (MATH-202)',
        struggleRate: 28,
        affectedCount: 14,
        severity: 'Moderate',
        impact: 'Reduces precision in solving coupled multi-variable differential systems.',
      },
      {
        prerequisite: 'Partial Fraction Decomposition',
        targetCourseTopic: 'Inverse Laplace Transforms',
        struggleRate: 22,
        affectedCount: 11,
        severity: 'Low',
        impact: 'Delays transfer function derivation in control signals.',
      },
    ];

    // Cohort segmentation
    const cohorts = [
      { category: 'Excelling (>80%)', percentage: 38, count: Math.round(totalStudents * 0.38), color: '#10b981' },
      { category: 'On Track (60-80%)', percentage: 44, count: Math.round(totalStudents * 0.44), color: '#3b82f6' },
      { category: 'Needs Support (<60%)', percentage: 18, count: Math.round(totalStudents * 0.18), color: '#f59e0b' },
    ];

    res.json({
      success: true,
      data: {
        summary: {
          totalStudents,
          cohorts,
          flaggedBottlenecksCount: prerequisiteBottlenecks.length,
          avgRemediationRate: 84.2,
        },
        bottlenecks: prerequisiteBottlenecks,
      },
    });
  } catch (err) {
    next(err);
  }
});

// 9. Faculty Assignment Management & Grading
router.get('/assignments', async (req, res, next) => {
  try {
    const facultyId = req.user._id;
    const assignments = await Assignment.find({ faculty: facultyId }).populate('subject').sort({ createdAt: -1 });

    const results = await Promise.all(
      assignments.map(async (a) => {
        const submissionsCount = await AssignmentSubmission.countDocuments({ assignment: a._id });
        const gradedCount = await AssignmentSubmission.countDocuments({ assignment: a._id, status: 'Graded' });
        return {
          id: a._id,
          title: a.title,
          courseCode: a.courseCode || a.subject?.code,
          subjectName: a.subject?.name,
          dueDate: a.dueDate,
          totalPoints: a.totalPoints,
          unitTopic: a.unitTopic,
          section: a.section,
          status: a.status,
          submissionsCount,
          gradedCount,
        };
      })
    );

    res.json({
      success: true,
      data: results,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/assignments', async (req, res, next) => {
  try {
    const facultyId = req.user._id;
    const { title, subjectCode, courseCode, unitTopic, totalPoints, dueDate, section, description, attachmentName } = req.body;

    let subject = await Subject.findOne({ code: subjectCode || courseCode || 'BTCS 301-18' });
    if (!subject) {
      subject = await Subject.findOne();
    }

    const assignment = new Assignment({
      subject: subject._id,
      faculty: facultyId,
      title: title || 'New Course Assignment',
      courseCode: courseCode || subject.code,
      unitTopic: unitTopic || 'Core Foundations',
      description: description || 'Complete all prescribed analytical problems.',
      dueDate: dueDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      totalPoints: Number(totalPoints) || 100,
      section: section || 'CSE-A',
      attachmentName: attachmentName || '',
      status: 'PUBLISHED',
    });

    await assignment.save();

    res.status(201).json({
      success: true,
      message: `Assignment "${assignment.title}" published successfully for Section ${assignment.section}.`,
      data: assignment,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/assignments/:id/submissions', async (req, res, next) => {
  try {
    const assignmentId = req.params.id;
    const assignment = await Assignment.findById(assignmentId).populate('subject');
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    const submissions = await AssignmentSubmission.find({ assignment: assignmentId })
      .populate('student', 'name idNumber rollNumber email section avatar')
      .sort({ submittedAt: -1 });

    res.json({
      success: true,
      data: {
        assignment,
        submissions,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/assignments/:id/grade', async (req, res, next) => {
  try {
    const facultyId = req.user._id;
    const { submissionId, score, feedback } = req.body;

    const submission = await AssignmentSubmission.findById(submissionId).populate('student');
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    submission.score = Number(score);
    submission.feedback = feedback || 'Evaluated by faculty.';
    submission.status = 'Graded';
    submission.gradedAt = new Date();
    submission.gradedBy = facultyId;

    await submission.save();

    res.json({
      success: true,
      message: `Submission graded successfully (${score} marks).`,
      data: submission,
    });
  } catch (err) {
    next(err);
  }
});

export default router;

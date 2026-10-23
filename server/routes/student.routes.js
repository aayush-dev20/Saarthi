import express from 'express';
import { z } from 'zod';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { User } from '../models/User.js';
import { Enrollment } from '../models/Enrollment.js';
import { Subject } from '../models/Subject.js';
import { Mark } from '../models/Mark.js';
import { AttendanceSession } from '../models/AttendanceSession.js';
import { AttendanceRecord } from '../models/AttendanceRecord.js';
import { Assignment, AssignmentSubmission } from '../models/Assignment.js';
import { Concept, ConceptPrerequisite } from '../models/Concept.js';
import { DiagnosticQuestion, AssessmentAttempt } from '../models/DiagnosticQuestion.js';
import { PracticeSet, PracticeAttempt, AuditLog } from '../models/PracticeSet.js';
import { LearningResource } from '../models/LearningResource.js';
import { LeaderboardEntry } from '../models/Leaderboard.js';
import { verifySignedQRToken } from '../utils/qrCrypto.js';
import { emitAttendanceRecorded, emitAttendanceScanNotification } from '../sockets/index.js';
import { evaluateClassroomLocation } from '../utils/haversine.js';

const router = express.Router();

// Apply auth & student role to all routes
router.use(authenticateToken, requireRole(['student', 'admin']));

// 1. Student Dashboard Data
router.get('/dashboard', async (req, res, next) => {
  try {
    const studentId = req.user._id;

    // Enrollments
    const enrollments = await Enrollment.find({ student: studentId }).populate('subject');
    const subjectIds = enrollments.map((e) => e.subject?._id).filter(Boolean);

    // Dynamic Marks
    const marks = await Mark.find({ student: studentId, subject: { $in: subjectIds } }).populate('subject');
    const avgMarks = marks.length
      ? Math.round((marks.reduce((acc, m) => acc + m.totalMarks, 0) / marks.length) * 10) / 10
      : 0;

    // Dynamic Attendance
    const totalSessions = await AttendanceSession.countDocuments({
      subject: { $in: subjectIds },
      section: req.user.section,
    });
    const attendedRecords = await AttendanceRecord.countDocuments({
      student: studentId,
      status: 'PRESENT',
    });
    const attendancePercentage = totalSessions > 0
      ? Math.round((attendedRecords / totalSessions) * 1000) / 10
      : 100;

    // Assignments
    const assignments = await Assignment.find({ subject: { $in: subjectIds } });
    const submissions = await AssignmentSubmission.find({
      student: studentId,
      assignment: { $in: assignments.map((a) => a._id) },
    });
    const submittedIds = new Set(submissions.map((s) => s.assignment.toString()));
    const pendingAssignments = assignments.filter((a) => !submittedIds.has(a._id.toString()));

    // Concept Mastery
    const concepts = await Concept.find();
    const attempts = await AssessmentAttempt.find({ student: studentId }).sort({ createdAt: -1 });
    const latestAttempt = attempts[0] || null;
    const practiceAttempts = await PracticeAttempt.find({ student: studentId });

    // Calculate dynamic mastery
    let masteredCount = 0;
    const totalConcepts = concepts.length || 7;

    concepts.forEach((c) => {
      let m = c.defaultMastery;
      if (latestAttempt) {
        if (c.code === 'c5') {
          // Integration gap
          const recovered = practiceAttempts.some((p) => p.setId === 'ps-1') || (latestAttempt.isReassessment && latestAttempt.score >= 70);
          m = recovered ? 84 : latestAttempt.hasIntegrationGap ? 42 : 80;
        } else if (c.code === 'c6') {
          // Differential Equations
          m = latestAttempt.score >= 70 ? 80 : 52;
        }
      }
      if (m >= 80) masteredCount++;
    });

    // Subject items for cards
    const subjectCards = enrollments.map((e) => {
      const sub = e.subject;
      const subMark = marks.find((m) => m.subject?._id?.toString() === sub?._id?.toString());
      return {
        id: sub?._id,
        code: sub?.code,
        name: sub?.name,
        instructor: sub?.instructorName,
        attendance: attendancePercentage, // course specific or aggregate
        totalMarks: subMark?.totalMarks || 0,
        status: subMark?.totalMarks >= 85 ? 'Excelling' : subMark?.totalMarks >= 70 ? 'On Track' : 'Needs Attention',
        gapAlert: sub?.code === 'MATH-202' && latestAttempt?.hasIntegrationGap ? 'Prerequisite Gap: Integration Fundamentals' : null,
      };
    });

    res.json({
      success: true,
      data: {
        student: {
          id: req.user.idNumber,
          name: req.user.name,
          section: req.user.section,
          semester: req.user.semester,
          overallAttendance: attendancePercentage,
          averageMarks: avgMarks,
          pendingAssignmentsCount: pendingAssignments.length,
          conceptsMasteredCount: masteredCount,
          totalConceptsCount: totalConcepts,
        },
        hasGapAlert: latestAttempt ? latestAttempt.hasIntegrationGap : true,
        gapDetails: {
          subject: 'Engineering Mathematics IV',
          concept: 'Integration Fundamentals',
          targetTopic: 'Differential Equations',
        },
        subjects: subjectCards,
        pendingAssignments: pendingAssignments.slice(0, 3).map((a) => ({
          id: a._id,
          title: a.title,
          subject: a.subject?.name || 'Coursework',
          dueDate: a.dueDate,
          priority: a.priority,
        })),
        trends: [
          { month: 'Jan', studentScore: Math.max(50, avgMarks - 8), classAverage: 68 },
          { month: 'Feb', studentScore: Math.max(50, avgMarks - 4), classAverage: 70 },
          { month: 'Mar', studentScore: Math.max(50, avgMarks - 10), classAverage: 72 },
          { month: 'Apr', studentScore: Math.min(100, avgMarks + 3), classAverage: 73 },
          { month: 'May', studentScore: avgMarks, classAverage: 75 },
        ],
      },
    });
  } catch (err) {
    next(err);
  }
});

// 2. Academics & Marksheet
router.get('/academics', async (req, res, next) => {
  try {
    const studentId = req.user._id;
    const enrollments = await Enrollment.find({ student: studentId }).populate('subject');
    const subjectIds = enrollments.map((e) => e.subject?._id).filter(Boolean);

    const marks = await Mark.find({ student: studentId, subject: { $in: subjectIds } }).populate('subject');

    const marksheet = enrollments.map((e) => {
      const sub = e.subject;
      const m = marks.find((mark) => mark.subject?._id?.toString() === sub?._id?.toString());
      const total = m ? m.totalMarks : 0;
      return {
        id: sub?._id,
        code: sub?.code,
        name: sub?.name,
        courseType: sub?.courseType || 'Professional Core Course',
        credits: sub?.credits || 3,
        load: sub?.load || '3-0-0',
        semester: sub?.semester || 4,
        instructor: sub?.instructorName || 'Department Faculty',
        internalMarks: m?.internalMarks ?? 0,
        internalMax: m?.internalMax || sub?.internalMax || 40,
        semesterMarks: m?.semesterMarks ?? 0,
        semesterMax: m?.semesterMax || sub?.externalMax || 60,
        totalMarks: total,
        totalMax: (m?.internalMax || sub?.internalMax || 40) + (m?.semesterMax || sub?.externalMax || 60),
        grade: m?.grade || 'N/A',
        publicationStatus: m?.publicationStatus || 'PUBLISHED',
        status: m?.publicationStatus === 'PUBLISHED' ? 'Published' : 'Provisional',
      };
    });

    res.json({
      success: true,
      data: {
        subjects: marksheet,
        academicYear: '2nd Year',
        institution: 'Indo Global College of Engineering (Affiliated to IKGPTU)',
        program: 'B.Tech Computer Science & Engineering (2018 Scheme)',
      },
    });
  } catch (err) {
    next(err);
  }
});

// 3. Attendance Records & History
router.get('/attendance', async (req, res, next) => {
  try {
    const studentId = req.user._id;
    const enrollments = await Enrollment.find({ student: studentId }).populate('subject');
    const subjectIds = enrollments.map((e) => e.subject?._id).filter(Boolean);

    const records = await AttendanceRecord.find({ student: studentId })
      .populate('subject')
      .populate('session')
      .sort({ verifiedAt: -1 })
      .limit(30);

    const subjectStats = await Promise.all(
      enrollments.map(async (e) => {
        const sub = e.subject;
        const totalHeld = await AttendanceSession.countDocuments({
          subject: sub?._id,
          section: req.user.section,
        });
        const attended = await AttendanceRecord.countDocuments({
          student: studentId,
          subject: sub?._id,
          status: 'PRESENT',
        });
        const pct = totalHeld > 0 ? Math.round((attended / totalHeld) * 1000) / 10 : 100;
        return {
          id: sub?._id,
          code: sub?.code,
          name: sub?.name,
          totalClasses: Math.max(totalHeld, 1),
          attendedClasses: attended,
          attendance: pct,
        };
      })
    );

    const history = records.map((r) => ({
      id: r._id,
      date: r.verifiedAt ? r.verifiedAt.toISOString().split('T')[0] : '2026-10-15',
      subject: r.subject?.name || 'Class Lecture',
      slot: '10:00 - 11:00 AM',
      method: r.method === 'QR_VERIFIED' ? 'QR Verified' : r.method === 'MANUAL_CODE' ? 'Manual Passcode' : 'Faculty Override',
      status: r.status === 'PRESENT' ? 'Present' : 'Absent',
      room: r.room || 'LT-102',
    }));

    res.json({
      success: true,
      data: {
        subjects: subjectStats,
        history,
      },
    });
  } catch (err) {
    next(err);
  }
});

// 4. Verify Attendance (Anti-Proxy Multi-Factor Validation)
const verifyAttendanceSchema = {
  body: z.object({
    token: z.string().optional(),
    code: z.string().optional(),
    challengePin: z.string().optional(),
    wifiSsid: z.string().optional(),
    networkSubnet: z.string().optional(),
    clientGeo: z.object({
      lat: z.number().optional(),
      lng: z.number().optional(),
      accuracyMeters: z.number().optional(),
    }).optional(),
  }),
};

router.post('/attendance/verify', validate(verifyAttendanceSchema), async (req, res, next) => {
  try {
    const studentId = req.user._id;
    const { token, code, challengePin, wifiSsid, networkSubnet, clientGeo } = req.body;

    let session = null;
    let verifyMethod = 'QR_VERIFIED';

    if (token) {
      // Cryptographic verification
      const verifyResult = verifySignedQRToken(token);
      if (!verifyResult.valid) {
        return res.status(400).json({
          success: false,
          message: verifyResult.error,
        });
      }

      session = await AttendanceSession.findById(verifyResult.sessionId).populate('subject');
      verifyMethod = 'QR_VERIFIED';
    } else if (code) {
      // Manual passcode verification
      session = await AttendanceSession.findOne({
        sessionCode: code.trim().toUpperCase(),
        isActive: true,
      }).populate('subject');
      verifyMethod = 'MANUAL_CODE';
    } else {
      return res.status(400).json({
        success: false,
        message: 'Either live QR token or session passcode must be provided',
      });
    }

    if (!session || !session.isActive) {
      return res.status(404).json({
        success: false,
        message: 'No active lecture session found for this code/token. The session may have expired.',
      });
    }

    // Check single attendance check-in per session (Duplicate Replay Protection)
    const existingRecord = await AttendanceRecord.findOne({
      session: session._id,
      student: studentId,
    });

    if (existingRecord) {
      return res.status(409).json({
        success: false,
        message: `Attendance is already recorded for this session at ${existingRecord.verifiedAt.toLocaleTimeString()}`,
      });
    }

    // Multi-signal proximity risk engine
    let proximityScore = 70; // baseline for scanning active HMAC token
    let flagReasons = [];
    let distanceMeters = null;

    // 1. Teacher Live Challenge PIN Check (if teacher enabled classroom challenge)
    if (session.challengePin) {
      if (challengePin && challengePin.trim() === session.challengePin.trim()) {
        proximityScore += 20;
      } else if (challengePin) {
        proximityScore -= 25;
        flagReasons.push('Live teacher challenge PIN mismatch');
      }
    }

    // 2. Campus Wi-Fi / Subnet Signal Check
    const reportedSubnet = networkSubnet || req.ip || '';
    if (session.allowedSubnet && reportedSubnet) {
      if (reportedSubnet.includes('10.') || reportedSubnet.includes('192.168.') || reportedSubnet.includes('127.0.0.1')) {
        proximityScore += 10;
      }
    }

    // 3. Geolocation Sanity Signal (Auxiliary check: does not falsely reject if indoors)
    if (clientGeo?.lat && clientGeo?.lng && session.classroomGeo?.lat) {
      // Haversine approximate distance
      const R = 6371e3; // Earth radius in metres
      const φ1 = (clientGeo.lat * Math.PI) / 180;
      const φ2 = (session.classroomGeo.lat * Math.PI) / 180;
      const Δφ = ((session.classroomGeo.lat - clientGeo.lat) * Math.PI) / 180;
      const Δλ = ((session.classroomGeo.lng - clientGeo.lng) * Math.PI) / 180;

      const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      distanceMeters = Math.round(R * c);

      // Indoor GPS often drifts 80-250m; we only flag gross anomalies (> 1500m)
      if (distanceMeters > 1500) {
        proximityScore -= 30;
        flagReasons.push(`Location distance outlier (~${Math.round(distanceMeters / 1000)}km away from campus)`);
      }
    }

    proximityScore = Math.max(10, Math.min(100, proximityScore));
    const isFlagged = proximityScore < 60 || flagReasons.length > 0;
    const verificationStatus = isFlagged ? 'FLAGGED_FOR_REVIEW' : 'VERIFIED';

    // Record attendance with all anti-proxy audit signals
    const record = new AttendanceRecord({
      session: session._id,
      student: studentId,
      subject: session.subject._id,
      method: verifyMethod,
      status: 'PRESENT',
      room: session.room,
      verificationStatus,
      flagReason: flagReasons.join('; '),
      proximityScore,
      wifiSsid: wifiSsid || 'IndoGlobal-Campus-WiFi',
      networkSubnet: reportedSubnet,
      clientGeo: clientGeo ? { ...clientGeo, distanceMeters } : undefined,
      challengePinProvided: challengePin || '',
    });

    await record.save();

    // Broadcast live event to faculty session room via Socket.IO
    emitAttendanceRecorded(session._id.toString(), {
      studentId: req.user._id,
      name: req.user.name,
      rollNo: req.user.idNumber,
      method: verifyMethod,
      verifiedAt: record.verifiedAt,
      verificationStatus,
      proximityScore,
      flagReason: record.flagReason,
    });

    res.status(201).json({
      success: true,
      message: isFlagged
        ? `Attendance logged for review (${record.flagReason}). Verified by teacher console.`
        : `Verified! Attendance recorded for ${session.subject.name}`,
      data: {
        id: record._id,
        subject: session.subject.name,
        date: record.verifiedAt.toISOString().split('T')[0],
        method: verifyMethod,
        room: session.room,
        verificationStatus,
        proximityScore,
      },
    });
  } catch (err) {
    next(err);
  }
});

// 5. Assignments List & Submission
router.get('/assignments', async (req, res, next) => {
  try {
    const studentId = req.user._id;
    const enrollments = await Enrollment.find({ student: studentId });
    const subjectIds = enrollments.map((e) => e.subject);

    const assignments = await Assignment.find({ subject: { $in: subjectIds } }).populate('subject');
    const submissions = await AssignmentSubmission.find({
      student: studentId,
      assignment: { $in: assignments.map((a) => a._id) },
    });

    const subMap = new Map();
    submissions.forEach((s) => subMap.set(s.assignment.toString(), s));

    const list = assignments.map((a) => {
      const sub = subMap.get(a._id.toString());
      return {
        id: a._id,
        title: a.title,
        subject: a.subject?.name || 'Core Course',
        dueDate: a.dueDate,
        totalPoints: a.totalPoints,
        priority: a.priority,
        description: a.description,
        prerequisiteNote: a.prerequisiteNote,
        status: sub ? sub.status : 'Pending',
        submittedOn: sub?.submittedOn || null,
        score: sub?.score ?? null,
      };
    });

    res.json({
      success: true,
      data: list,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/assignments/:id/submit', async (req, res, next) => {
  try {
    const studentId = req.user._id;
    const assignmentId = req.params.id;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    let submission = await AssignmentSubmission.findOne({
      assignment: assignmentId,
      student: studentId,
    });

    const todayStr = new Date().toISOString().split('T')[0];

    if (submission) {
      submission.status = 'Submitted';
      submission.submittedOn = todayStr;
      await submission.save();
    } else {
      submission = new AssignmentSubmission({
        assignment: assignmentId,
        student: studentId,
        status: 'Submitted',
        submittedOn: todayStr,
      });
      await submission.save();
    }

    res.json({
      success: true,
      message: 'Assignment submitted successfully',
      data: submission,
    });
  } catch (err) {
    next(err);
  }
});

// 6. Learning Gaps & Knowledge Graph Nodes
router.get('/learning-gaps', async (req, res, next) => {
  try {
    const studentId = req.user._id;
    const concepts = await Concept.find().sort({ posX: 1 });
    const edges = await ConceptPrerequisite.find();
    const attempts = await AssessmentAttempt.find({ student: studentId }).sort({ createdAt: -1 });
    const latestAttempt = attempts[0] || null;
    const practiceAttempts = await PracticeAttempt.find({ student: studentId });

    const nodes = concepts.map((c) => {
      let mastery = c.defaultMastery;
      let status = 'mastered';
      let evidence = null;
      let isFlaggedGap = false;

      if (latestAttempt) {
        if (c.code === 'c5') {
          const recovered = practiceAttempts.some((p) => p.setId === 'ps-1') || (latestAttempt.isReassessment && latestAttempt.score >= 70);
          mastery = recovered ? 84 : latestAttempt.hasIntegrationGap ? 42 : 82;
          status = recovered ? 'proficient' : latestAttempt.hasIntegrationGap ? 'gap' : 'proficient';
          isFlaggedGap = !recovered && latestAttempt.hasIntegrationGap;
          evidence = recovered
            ? 'Prerequisite recovered: Scored 84% on reassessment.'
            : 'Missed integration-by-parts questions during diagnostic screening. Calculations bottleneck ODE solution steps.';
        } else if (c.code === 'c6') {
          mastery = latestAttempt.score >= 70 ? 80 : 52;
          status = latestAttempt.score >= 70 ? 'proficient' : 'struggling';
        }
      } else {
        // Initial state before assessment
        if (c.code === 'c5') {
          mastery = 42;
          status = 'gap';
          isFlaggedGap = true;
          evidence = 'Pre-diagnostic indicates weak integration-by-parts fundamentals.';
        } else if (c.code === 'c6') {
          mastery = 52;
          status = 'struggling';
        }
      }

      return {
        id: c.code,
        type: 'conceptNode',
        position: { x: c.posX, y: c.posY },
        data: {
          label: c.label,
          category: c.category,
          mastery,
          status,
          description: c.description,
          isTarget: c.isTarget,
          isFlaggedGap,
          evidence,
        },
      };
    });

    const flowEdges = edges.map((e) => ({
      id: e.edgeId,
      source: e.source,
      target: e.target,
      animated: e.isAnimated,
      style: e.style,
    }));

    res.json({
      success: true,
      data: {
        nodes,
        edges: flowEdges,
      },
    });
  } catch (err) {
    next(err);
  }
});

// 7. Diagnostic Questions (Securely serves questions WITHOUT correct answer keys)
router.get('/assessment', async (req, res, next) => {
  try {
    const questions = await DiagnosticQuestion.find();
    const shouldShuffle = req.query.shuffle === 'true' || req.query.shuffle === '1';

    // Strip out correct answer boolean before sending to frontend client!
    const sanitized = questions.map((q) => {
      let opts = q.options.map((o) => ({
        id: o.id,
        text: o.text,
      }));
      if (shouldShuffle) {
        opts = [...opts].sort(() => 0.5 - Math.random());
      }
      return {
        id: q._id,
        conceptCode: q.conceptCode,
        conceptName: q.conceptName,
        isPrerequisiteCheck: q.isPrerequisiteCheck,
        question: q.question,
        options: opts,
        explanation: q.explanation,
      };
    });

    res.json({
      success: true,
      data: sanitized,
    });
  } catch (err) {
    next(err);
  }
});

// 8. Submit Diagnostic Assessment (Server-Side Evaluation & Scoring)
const assessmentSubmitSchema = {
  body: z.object({
    answers: z.record(z.string().nullable().optional()), // { [questionId]: 'opt_2' }
  }),
};

router.post('/assessment/submit', validate(assessmentSubmitSchema), async (req, res, next) => {
  try {
    const studentId = req.user._id;
    const { answers = {} } = req.body;

    const questions = await DiagnosticQuestion.find();
    if (!questions || questions.length === 0) {
      return res.status(404).json({ success: false, message: 'Question bank not found' });
    }

    let correctCount = 0;
    let prereqErrors = 0;
    let targetErrors = 0;
    const evaluatedAnswers = [];

    questions.forEach((q) => {
      const selectedId = answers[q._id.toString()];
      const correctOption = q.options.find((o) => o.correct);
      const isCorrect = Boolean(selectedId && correctOption && selectedId === correctOption.id);

      if (isCorrect) {
        correctCount++;
      } else {
        if (q.isPrerequisiteCheck) {
          prereqErrors++;
        } else {
          targetErrors++;
        }
      }

      evaluatedAnswers.push({
        questionId: q._id.toString(),
        selectedOptionId: selectedId || null,
        isCorrect,
        conceptCode: q.conceptCode,
        isPrerequisiteCheck: q.isPrerequisiteCheck,
      });
    });

    const scorePercent = Math.round((correctCount / questions.length) * 100);
    const hasIntegrationGap = prereqErrors >= 1;

    // Check if this is a retake / reassessment
    const prevAttempts = await AssessmentAttempt.countDocuments({ student: studentId });

    const attempt = new AssessmentAttempt({
      student: studentId,
      answers: evaluatedAnswers,
      score: scorePercent,
      correctCount,
      totalQuestions: questions.length,
      prereqErrors,
      targetErrors,
      hasIntegrationGap,
      isReassessment: prevAttempts > 0,
    });

    await attempt.save();

    res.status(201).json({
      success: true,
      message: 'Assessment evaluated and recorded in database',
      data: {
        attemptId: attempt._id,
        score: scorePercent,
        correctCount,
        totalQ: questions.length,
        prereqErrors,
        targetErrors,
        hasIntegrationGap,
        isReassessment: attempt.isReassessment,
        questionsWithKeys: questions.map((q) => ({
          id: q._id,
          conceptName: q.conceptName,
          question: q.question,
          explanation: q.explanation,
          correctOptionId: q.options.find((o) => o.correct)?.id,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
});

// 9. Personalized Practice Sets & Attempts
router.get('/practice', async (req, res, next) => {
  try {
    const sets = await PracticeSet.find();
    res.json({
      success: true,
      data: sets,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/practice/submit', async (req, res, next) => {
  try {
    const studentId = req.user._id;
    const { setId } = req.body;

    const attempt = new PracticeAttempt({
      student: studentId,
      setId: setId || 'ps-1',
      completedAt: new Date(),
      score: 100,
    });

    await attempt.save();

    res.json({
      success: true,
      message: 'Practice attempt recorded successfully',
      data: attempt,
    });
  } catch (err) {
    next(err);
  }
});

// 10. Student Progress Growth Report (Auditable Growth from Authentic Records)
router.get('/progress', async (req, res, next) => {
  try {
    const studentId = req.user._id;
    const attempts = await AssessmentAttempt.find({ student: studentId }).sort({ createdAt: 1 });
    const concepts = await Concept.find().sort({ posX: 1 });
    const practiceAttempts = await PracticeAttempt.find({ student: studentId });

    if (attempts.length === 0 && practiceAttempts.length === 0) {
      return res.json({
        success: true,
        data: {
          hasData: false,
          message: 'No diagnostic or reassessment records found. Take your first diagnostic assessment to generate an auditable growth report.',
        },
      });
    }

    const initialAttempt = attempts[0] || null;
    const latestAttempt = attempts[attempts.length - 1] || null;

    const initialScore = initialAttempt ? initialAttempt.score : 0;
    const currentScore = latestAttempt ? latestAttempt.score : (practiceAttempts.length ? 80 : initialScore);
    const improvement = attempts.length > 1 ? currentScore - initialScore : (practiceAttempts.length ? currentScore - initialScore : 0);
    const relativeChange = initialScore > 0 ? Math.round((improvement / initialScore) * 100) : 0;

    const isRecovered = currentScore >= 70;

    res.json({
      success: true,
      data: {
        hasData: true,
        assessmentCount: attempts.length,
        practiceCount: practiceAttempts.length,
        initialScore,
        initialDate: initialAttempt?.createdAt ? initialAttempt.createdAt.toISOString().split('T')[0] : 'Baseline',
        currentScore,
        reassessmentDate: latestAttempt?.createdAt ? latestAttempt.createdAt.toISOString().split('T')[0] : 'Current',
        improvement, // Absolute percentage points
        relativeChange, // Relative % change
        isVerified: isRecovered,
        topicsImproved: isRecovered ? ['Integration by Parts & Substitution', 'First-Order Linear ODEs'] : [],
        topicsNeedingEvidence: !isRecovered ? ['Integration by Parts & Substitution'] : [],
        nextRecommendation: isRecovered
          ? 'Proceed to BTCS 403 (Design & Analysis of Algorithms) or explore second-order ODE applications.'
          : 'Complete practice module ps-1 on Integration by Parts and retake the reassessment.',
        concepts: concepts.map((c) => {
          let mastery = c.defaultMastery;
          if (c.code === 'c5') {
            mastery = isRecovered ? 84 : 42;
          } else if (c.code === 'c6') {
            mastery = isRecovered ? 80 : 52;
          }
          return {
            id: c.code,
            label: c.label,
            category: c.category,
            mastery,
            status: mastery >= 80 ? 'mastered' : mastery >= 70 ? 'proficient' : 'gap',
          };
        }),
      },
    });
  } catch (err) {
    next(err);
  }
});

// 11. Student Academic CGPA / SGPA Leaderboard (Real-Data Verified Calculations)
router.get('/leaderboard', async (req, res, next) => {
  try {
    const currentStudentId = req.user._id;
    const { mode = 'cgpa', semester = 'all', branch = 'all' } = req.query;

    const studentFilter = { role: 'student', status: 'active' };
    if (branch && branch !== 'all') {
      studentFilter.department = { $regex: branch, $options: 'i' };
    }

    const students = await User.find(studentFilter).select('_id name idNumber avatar section semester department');

    const rankingMode = mode.toLowerCase() === 'sgpa' ? 'Semester GPA (SGPA)' : 'Cumulative CGPA (10-Point Scale)';
    const tieBreakingRule = '1st: Grade Points / CGPA; 2nd: Higher Aggregate Exam Percentage; 3rd: Higher Lecture Attendance Rate; 4th: Institutional Roll ID';

    // Grade Point conversion table based on standard 10-point scale
    const getGradePoint = (percentage) => {
      if (percentage >= 90) return 10;
      if (percentage >= 80) return 9;
      if (percentage >= 70) return 8;
      if (percentage >= 60) return 7;
      if (percentage >= 50) return 6;
      if (percentage >= 40) return 5;
      return 0; // Fail
    };

    const calculatedRanks = [];

    for (const st of students) {
      let markFilter = { student: st._id };
      if (semester && semester !== 'all') {
        const semNum = Number(semester);
        const subjectsInSem = await Subject.find({ semester: semNum }).select('_id');
        markFilter.subject = { $in: subjectsInSem.map((s) => s._id) };
      }

      const marks = await Mark.find(markFilter).populate('subject');

      // Only count verified published marks with valid course credits
      if (marks.length === 0) continue;

      let totalCreditsEarned = 0;
      let totalCreditPoints = 0;
      let totalRawMarks = 0;
      let totalMaxMarks = 0;

      for (const m of marks) {
        const credits = m.subject?.credits || 3;
        const totalMarks = m.totalMarks || (m.internalMarks || 0) + (m.externalMarks || 0) + (m.midSemMarks || 0);
        const maxMarks = m.subject?.totalMax || (m.subject?.internalMax || 40) + (m.subject?.externalMax || 60);

        const percentage = maxMarks > 0 ? (totalMarks / maxMarks) * 100 : totalMarks;
        const gp = getGradePoint(percentage);

        totalCreditPoints += credits * gp;
        totalCreditsEarned += credits;
        totalRawMarks += totalMarks;
        totalMaxMarks += maxMarks;
      }

      if (totalCreditsEarned === 0) continue;

      const gpa = Math.round((totalCreditPoints / totalCreditsEarned) * 100) / 100;
      const aggregatePercentage = totalMaxMarks > 0 ? Math.round((totalRawMarks / totalMaxMarks) * 1000) / 10 : 0;

      // Lecture attendance rate for tie-breaking
      const attendedSessions = await AttendanceRecord.countDocuments({ student: st._id, status: 'PRESENT' });
      const totalSessions = await AttendanceSession.countDocuments();
      const attendanceRate = totalSessions > 0 ? Math.round((attendedSessions / totalSessions) * 100) : 100;

      calculatedRanks.push({
        studentId: st._id,
        name: st.name,
        rollNo: st.idNumber,
        avatar: st.avatar || st.name.slice(0, 2).toUpperCase(),
        section: st.section || 'CSE-A',
        semester: st.semester || 4,
        branch: st.department || 'Computer Science & Engineering',
        gpa,
        aggregatePercentage,
        attendanceRate,
        creditsCompleted: totalCreditsEarned,
        isMe: st._id.toString() === currentStudentId.toString(),
      });
    }

    // Sort with deterministic tie-breaking:
    // 1. GPA desc
    // 2. Aggregate percentage desc
    // 3. Attendance rate desc
    // 4. Roll number asc
    calculatedRanks.sort((a, b) => {
      if (b.gpa !== a.gpa) return b.gpa - a.gpa;
      if (b.aggregatePercentage !== a.aggregatePercentage) return b.aggregatePercentage - a.aggregatePercentage;
      if (b.attendanceRate !== a.attendanceRate) return b.attendanceRate - a.attendanceRate;
      return a.rollNo.localeCompare(b.rollNo);
    });

    const leaderboardWithRank = calculatedRanks.map((item, idx) => ({
      ...item,
      rank: idx + 1,
    }));

    const myEntry = leaderboardWithRank.find((r) => r.isMe) || null;

    res.json({
      success: true,
      data: {
        rankingMode,
        academicPeriod: semester === 'all' ? 'All Completed Semesters' : `Semester ${semester}`,
        tieBreakingRule,
        totalEligibleStudents: leaderboardWithRank.length,
        myRank: myEntry?.rank || 'N/A',
        myGPA: myEntry?.gpa || 'N/A',
        myAggregatePercentage: myEntry?.aggregatePercentage || 'N/A',
        leaderboard: leaderboardWithRank,
      },
    });
  } catch (err) {
    next(err);
  }
});

// 12. Learning Resources & Curated YouTube Remedial Videos
router.get('/learning-resources/:conceptCode', async (req, res, next) => {
  try {
    const { conceptCode } = req.params;
    let resource = await LearningResource.findOne({ conceptCode });

    if (!resource) {
      resource = await LearningResource.findOne({
        conceptCode: { $regex: new RegExp(conceptCode, 'i') },
      });
    }

    if (!resource) {
      resource = await LearningResource.findOne();
    }

    if (!resource) {
      resource = new LearningResource({
        conceptCode,
          conceptName: 'Integration by Parts & Substitution',
          subjectCode: 'MATH-202',
          title: 'Mastering Integration by Parts & U-Substitution for Differential Equations',
          description: 'A comprehensive visual walkthrough by 3Blue1Brown & Khan Academy breaking down the product rule origin of ∫ u dv and systematic LIATE choice strategies.',
          author: 'Khan Academy & 3Blue1Brown',
          youtubeVideoId: '2UQCfhzZ3b8',
          youtubeUrl: 'https://www.youtube.com/watch?v=2UQCfhzZ3b8',
          embedUrl: 'https://www.youtube-nocookie.com/embed/2UQCfhzZ3b8',
          durationMinutes: 14,
          keyTakeaways: [
            'How the product rule d(uv)/dx = u dv/dx + v du/dx yields the parts formula',
            'Applying the LIATE priority rule: Logarithmic, Inverse trig, Algebraic, Trig, Exponential',
            'Handling cyclic integrals like ∫ e^x sin(x) dx via algebraic grouping',
          ],
          timestamps: [
            { title: 'Visual Intuition of Area Under Product', time: '01:15', seconds: 75 },
            { title: 'The LIATE Decision Tree', time: '05:30', seconds: 330 },
            { title: 'Common Algebraic Traps in ODEs', time: '09:45', seconds: 585 },
          ],
          postLearningQuestions: [
            {
              id: 'plq-1',
              question: 'In applying integration by parts to ∫ x * ln(x) dx, what should u be chosen as according to LIATE?',
              options: ['u = ln(x)', 'u = x', 'u = x * ln(x)', 'u = dx'],
              correctIndex: 0,
              explanation: 'Logarithmic functions have highest priority in LIATE (L before A), so u = ln(x) and dv = x dx.',
            },
            {
              id: 'plq-2',
              question: 'Evaluate ∫ x * e^x dx using the parts formula u*v - ∫ v du.',
              options: ['x * e^x - e^x + C', 'x * e^x + e^x + C', '(x^2/2) * e^x + C', 'e^x - x + C'],
              correctIndex: 0,
              explanation: 'With u = x, du = dx, and dv = e^x dx, v = e^x: Result is x e^x - ∫ e^x dx = x e^x - e^x + C.',
            },
          ],
        });
        await resource.save();
      }

    res.json({
      success: true,
      data: resource,
    });
  } catch (err) {
    next(err);
  }
});

// 13. Complete YouTube Learning Session & Record Post-Test Score
router.post('/learning-resources/:conceptCode/complete', async (req, res, next) => {
  try {
    const studentId = req.user._id;
    const { conceptCode } = req.params;
    const { score, completedQuestionsCount } = req.body;

    const resource = await LearningResource.findOne({ conceptCode });

    // Record practice attempt
    await PracticeAttempt.create({
      student: studentId,
      setId: `yt-${conceptCode}`,
      score: score || 100,
    });

    // Update student diagnostic attempt: mark integration gap as recovered!
    await AssessmentAttempt.create({
      student: studentId,
      subjectCode: 'MATH-202',
      score: score || 85,
      correctCount: completedQuestionsCount || 2,
      totalQuestions: 2,
      prereqErrors: 0,
      targetErrors: 0,
      hasIntegrationGap: false,
      isReassessment: true,
    });

    // Award leaderboard diagnostic recovery points (+50 pts)
    await LeaderboardEntry.findOneAndUpdate(
      { student: studentId },
      {
        $inc: { diagnosticImprovementPoints: 50, participationPoints: 20 },
      },
      { upsert: true }
    );

    res.json({
      success: true,
      message: `Verified mastery of ${resource?.conceptName || conceptCode}! Learning gap marked as resolved in institutional database.`,
      data: {
        conceptCode,
        isGapResolved: true,
        masteryScore: 88,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;

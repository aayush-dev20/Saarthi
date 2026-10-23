import express from 'express';
import { z } from 'zod';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { LeaveApplication } from '../models/Leave.js';
import { Notification } from '../models/Notification.js';
import { AuditLog } from '../models/PracticeSet.js';

const router = express.Router();

router.use(authenticateToken);

// 1. Student submits a leave application
const applyLeaveSchema = {
  body: z.object({
    leaveType: z.enum(['HOSTEL_LEAVE', 'ACADEMIC_LEAVE', 'MEDICAL_LEAVE', 'EMERGENCY_LEAVE']),
    startDate: z.string(),
    endDate: z.string(),
    reason: z.string().min(5, 'Reason must be at least 5 characters'),
    destinationAddress: z.string().optional(),
    emergencyContact: z.string().optional(),
  }),
};

router.post('/apply', requireRole(['student']), validate(applyLeaveSchema), async (req, res, next) => {
  try {
    const student = req.user;
    const { leaveType, startDate, endDate, reason, destinationAddress = '', emergencyContact = '' } = req.body;

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid start or end date format' });
    }

    if (end < start) {
      return res.status(400).json({ success: false, message: 'End date cannot be prior to start date' });
    }

    const totalDays = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1);

    // Routing rule: Hostel leaves route to Warden; academic/medical to Faculty/HOD
    let approvalRoute = 'FACULTY_ADVISOR';
    if (leaveType === 'HOSTEL_LEAVE') {
      approvalRoute = 'HOSTEL_WARDEN';
    } else if (totalDays > 7 || leaveType === 'EMERGENCY_LEAVE') {
      approvalRoute = 'HOD';
    }

    const applicationNumber = `LEV-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    const application = new LeaveApplication({
      applicationNumber,
      student: student._id,
      studentIdNumber: student.idNumber,
      studentName: student.name,
      department: student.department || 'Computer Science & Engineering',
      semester: student.semester || 4,
      section: student.section || 'CSE-A',
      leaveType,
      startDate: start,
      endDate: end,
      totalDays,
      reason,
      destinationAddress,
      emergencyContact: emergencyContact || student.phone || '',
      approvalRoute,
      status: 'PENDING',
      auditTrail: [
        {
          action: 'APPLICATION_SUBMITTED',
          actor: student._id,
          actorName: student.name,
          timestamp: new Date(),
          remarks: `Application submitted for ${totalDays} day(s) (${leaveType}).`,
        },
      ],
    });

    await application.save();

    res.status(201).json({
      success: true,
      message: `Leave application ${applicationNumber} submitted successfully. Routed to ${approvalRoute} for review.`,
      data: application,
    });
  } catch (err) {
    next(err);
  }
});

// 2. Student views their own leave applications
router.get('/my', requireRole(['student']), async (req, res, next) => {
  try {
    const studentId = req.user._id;
    const leaves = await LeaveApplication.find({ student: studentId }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: leaves.length,
      data: leaves,
    });
  } catch (err) {
    next(err);
  }
});

// 3. Authorized Reviewers (Warden, Faculty, Admin) fetch applications pending review
router.get('/pending', requireRole(['hostel_warden', 'faculty', 'admin']), async (req, res, next) => {
  try {
    const user = req.user;
    const filter = { status: 'PENDING' };

    if (user.role === 'hostel_warden') {
      filter.approvalRoute = 'HOSTEL_WARDEN';
    } else if (user.role === 'faculty') {
      filter.approvalRoute = { $in: ['FACULTY_ADVISOR', 'HOD'] };
    }
    // Admin sees all

    const applications = await LeaveApplication.find(filter)
      .populate('student', 'name idNumber email phone hostelInfo section')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: applications.length,
      data: applications,
    });
  } catch (err) {
    next(err);
  }
});

// 4. View all applications (Filterable)
router.get('/all', requireRole(['hostel_warden', 'faculty', 'admin']), async (req, res, next) => {
  try {
    const { status, leaveType, department, semester } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (leaveType) filter.leaveType = leaveType;
    if (department) filter.department = department;
    if (semester) filter.semester = Number(semester);

    const applications = await LeaveApplication.find(filter)
      .populate('student', 'name idNumber email phone hostelInfo section')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: applications.length,
      data: applications,
    });
  } catch (err) {
    next(err);
  }
});

// 5. Review Leave Application (Approve or Reject)
const reviewLeaveSchema = {
  body: z.object({
    status: z.enum(['APPROVED', 'REJECTED']),
    remarks: z.string().min(2, 'Review remarks required'),
  }),
};

router.put('/:id/review', requireRole(['hostel_warden', 'faculty', 'admin']), validate(reviewLeaveSchema), async (req, res, next) => {
  try {
    const reviewer = req.user;
    const { status, remarks } = req.body;

    const application = await LeaveApplication.findById(req.params.id).populate('student');
    if (!application) {
      return res.status(404).json({ success: false, message: 'Leave application not found' });
    }

    // Security: Student cannot approve their own application
    if (application.student._id.toString() === reviewer._id.toString()) {
      return res.status(403).json({ success: false, message: 'Self-approval is strictly prohibited by institutional policy' });
    }

    if (application.status !== 'PENDING') {
      return res.status(409).json({ success: false, message: `Application has already been resolved with status: ${application.status}` });
    }

    const now = new Date();
    application.status = status;
    application.reviewer = reviewer._id;
    application.reviewerName = `${reviewer.name} (${reviewer.role.replace('_', ' ').toUpperCase()})`;
    application.reviewedAt = now;
    application.reviewerRemarks = remarks;

    application.auditTrail.push({
      action: `APPLICATION_${status}`,
      actor: reviewer._id,
      actorName: reviewer.name,
      timestamp: now,
      remarks,
    });

    await application.save();

    // Institutional Audit Log
    await AuditLog.create({
      actor: reviewer._id,
      action: `LEAVE_${status}`,
      targetType: 'LeaveApplication',
      targetId: application._id.toString(),
      details: {
        studentId: application.studentIdNumber,
        studentName: application.studentName,
        totalDays: application.totalDays,
        leaveType: application.leaveType,
        remarks,
      },
    });

    // In-App Notification to student
    await Notification.create({
      recipient: application.student._id,
      title: `Leave Application ${status === 'APPROVED' ? 'Approved' : 'Rejected'}`,
      message: `Your leave application (${application.applicationNumber}) for ${application.totalDays} day(s) was ${status.toLowerCase()} by ${application.reviewerName}. Note: ${remarks}`,
      type: 'ACADEMIC',
      actionUrl: '/leave',
    });

    res.json({
      success: true,
      message: `Leave application ${application.applicationNumber} has been ${status.toLowerCase()} successfully.`,
      data: application,
    });
  } catch (err) {
    next(err);
  }
});

// 6. Student cancels their own pending application
router.delete('/:id/cancel', requireRole(['student']), async (req, res, next) => {
  try {
    const studentId = req.user._id;
    const application = await LeaveApplication.findOne({ _id: req.params.id, student: studentId });

    if (!application) {
      return res.status(404).json({ success: false, message: 'Leave application not found' });
    }

    if (application.status !== 'PENDING') {
      return res.status(409).json({ success: false, message: 'Cannot cancel an application that has already been reviewed' });
    }

    application.status = 'CANCELLED';
    application.auditTrail.push({
      action: 'APPLICATION_CANCELLED_BY_STUDENT',
      actor: studentId,
      actorName: req.user.name,
      timestamp: new Date(),
      remarks: 'Cancelled by applicant',
    });

    await application.save();

    res.json({
      success: true,
      message: `Application ${application.applicationNumber} cancelled successfully.`,
      data: application,
    });
  } catch (err) {
    next(err);
  }
});

export default router;

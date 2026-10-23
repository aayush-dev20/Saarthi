import express from 'express';
import { z } from 'zod';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { User } from '../models/User.js';
import { Subject } from '../models/Subject.js';
import { AttendanceRecord } from '../models/AttendanceRecord.js';
import { AttendanceSession } from '../models/AttendanceSession.js';
import { Mark } from '../models/Mark.js';
import { AssignmentSubmission } from '../models/Assignment.js';
import { LeaveApplication } from '../models/Leave.js';
import { HostelRoom, HostelBlock } from '../models/Hostel.js';
import { Bus, OutingPass } from '../models/Transport.js';
import { Timetable } from '../models/Timetable.js';
import { AuditLog } from '../models/PracticeSet.js';

const router = express.Router();

router.use(authenticateToken, requireRole(['admin']));

// 1. Admin Executive Dashboard
router.get('/dashboard', async (req, res, next) => {
  try {
    const [totalStudents, totalFaculty, totalStaff] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'faculty' }),
      User.countDocuments({ role: { $in: ['transport_manager', 'hostel_warden', 'admin'] } }),
    ]);

    const totalSessions = await AttendanceSession.countDocuments();
    const verifiedAttendance = await AttendanceRecord.countDocuments({ verificationStatus: 'VERIFIED' });
    const flaggedAttendance = await AttendanceRecord.countDocuments({ verificationStatus: 'FLAGGED_FOR_REVIEW' });

    // Hostel metrics
    const rooms = await HostelRoom.find();
    const totalBeds = rooms.reduce((acc, r) => acc + r.capacity, 0);
    const occupiedBeds = rooms.reduce((acc, r) => acc + r.occupancy, 0);

    // Transport metrics
    const buses = await Bus.find();
    const activeBuses = buses.filter((b) => b.status === 'ACTIVE' || b.status === 'ON_ROUTE').length;

    // Outing & Leave passes
    const pendingOutings = await OutingPass.countDocuments({ status: 'REQUESTED' });
    const pendingLeaves = await LeaveApplication.countDocuments({ status: 'PENDING' });

    res.json({
      success: true,
      data: {
        institutionalKPIs: {
          totalStudents,
          totalFaculty,
          totalStaff,
          campusAttendanceHealth: totalSessions > 0 ? Math.round((verifiedAttendance / (totalSessions * (totalStudents || 1))) * 100) : 92,
          flaggedAttendanceCount: flaggedAttendance,
          hostelOccupancyRate: totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 85,
          activeBusesCount: activeBuses,
          totalBusesCount: buses.length || 8,
          pendingOutingRequests: pendingOutings,
          pendingLeaveApplications: pendingLeaves,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

// 2. Comprehensive Student Records (Searchable & Filterable)
router.get('/students', async (req, res, next) => {
  try {
    const { search, branch, semester, section, isResident, status } = req.query;
    const filter = { role: 'student' };

    if (status && status !== 'all') filter.status = status;
    if (branch && branch !== 'all') filter.department = { $regex: branch, $options: 'i' };
    if (semester && semester !== 'all') filter.semester = Number(semester);
    if (section && section !== 'all') filter.section = section;
    if (isResident === 'true') filter['hostelInfo.isResident'] = true;
    if (isResident === 'false') filter['hostelInfo.isResident'] = false;

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { idNumber: { $regex: search.toUpperCase(), $options: 'i' } },
        { email: { $regex: search.toLowerCase(), $options: 'i' } },
        { rollNumber: { $regex: search.toUpperCase(), $options: 'i' } },
        { registrationNumber: { $regex: search.toUpperCase(), $options: 'i' } },
      ];
    }

    const students = await User.find(filter).select('-password').sort({ idNumber: 1 });

    // Enrich with academic and attendance stats
    const enriched = await Promise.all(
      students.map(async (st) => {
        const studentId = st._id;
        const [attendedCount, totalSessionsCount, marksList, leaveCount, submissionCount] = await Promise.all([
          AttendanceRecord.countDocuments({ student: studentId, status: 'PRESENT' }),
          AttendanceSession.countDocuments(),
          Mark.find({ student: studentId }),
          LeaveApplication.countDocuments({ student: studentId }),
          AssignmentSubmission.countDocuments({ student: studentId }),
        ]);

        const attendanceRate = totalSessionsCount > 0 ? Math.round((attendedCount / totalSessionsCount) * 100) : 100;
        const avgScore = marksList.length
          ? Math.round((marksList.reduce((acc, m) => acc + (m.totalMarks || 0), 0) / marksList.length) * 10) / 10
          : 0;

        // CGPA approximation based on 10-point scale
        const cgpa = avgScore > 0 ? Math.min(10, Math.round((avgScore / 9.5) * 100) / 100) : 0;

        return {
          _id: st._id,
          id: st._id,
          name: st.name,
          studentId: st.idNumber,
          idNumber: st.idNumber,
          officialEmail: st.email,
          email: st.email,
          college: st.college || 'Indo Global College of Engineering (Affiliated to IKGPTU)',
          rollNumber: st.rollNumber || st.idNumber,
          registrationNumber: st.registrationNumber || `IKGPTU-2024-${st.idNumber}`,
          degree: st.degree || 'B.Tech',
          branch: st.department || 'Computer Science & Engineering',
          department: st.department,
          semester: st.semester || 4,
          section: st.section || 'CSE-A',
          academicYear: st.academicYear || '2024-2028',
          status: st.status,
          attendanceRate,
          attendedSessions: attendedCount,
          totalSessions: totalSessionsCount,
          cgpa,
          averageMarks: avgScore,
          assignmentsSubmitted: submissionCount,
          leaveApplicationsCount: leaveCount,
          hostelInfo: st.hostelInfo || { isResident: false },
          transportInfo: st.transportInfo || { isBusUser: false },
          phone: st.phone || 'N/A',
        };
      })
    );

    res.json({
      success: true,
      count: enriched.length,
      data: enriched,
    });
  } catch (err) {
    next(err);
  }
});

// 3. Comprehensive Teacher Records (Searchable & Filterable)
router.get('/teachers', async (req, res, next) => {
  try {
    const { search, department, status } = req.query;
    const filter = { role: 'faculty' };

    if (status && status !== 'all') filter.status = status;
    if (department && department !== 'all') filter.department = { $regex: department, $options: 'i' };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { idNumber: { $regex: search.toUpperCase(), $options: 'i' } },
        { email: { $regex: search.toLowerCase(), $options: 'i' } },
      ];
    }

    const teachers = await User.find(filter).select('-password').sort({ idNumber: 1 });

    const enriched = await Promise.all(
      teachers.map(async (tc) => {
        const [assignedSubjects, sessionsConducted] = await Promise.all([
          Subject.find({ faculty: tc._id }),
          AttendanceSession.countDocuments({ faculty: tc._id }),
        ]);

        return {
          _id: tc._id,
          id: tc._id,
          name: tc.name,
          facultyId: tc.idNumber,
          idNumber: tc.idNumber,
          officialEmail: tc.email,
          email: tc.email,
          department: tc.department,
          designation: tc.designation || 'Associate Professor',
          college: tc.college,
          status: tc.status,
          assignedSubjects: assignedSubjects.map((s) => ({
            id: s._id,
            code: s.code,
            name: s.name,
            semester: s.semester,
            section: s.section,
          })),
          assignedSubjectsCount: assignedSubjects.length,
          sessionsConducted,
          phone: tc.phone || 'N/A',
        };
      })
    );

    res.json({
      success: true,
      count: enriched.length,
      data: enriched,
    });
  } catch (err) {
    next(err);
  }
});

// 4. 360-Degree Profile View for a specific User
router.get('/users/:id/detail', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    let profileDetails = { user };

    if (user.role === 'student') {
      const [marks, attendanceRecords, leaveApplications, assignmentSubmissions] = await Promise.all([
        Mark.find({ student: user._id }).populate('subject', 'name code'),
        AttendanceRecord.find({ student: user._id }).sort({ createdAt: -1 }).limit(20),
        LeaveApplication.find({ student: user._id }).sort({ createdAt: -1 }),
        AssignmentSubmission.find({ student: user._id }).populate('assignment', 'title dueDate'),
      ]);

      profileDetails.marks = marks;
      profileDetails.attendanceHistory = attendanceRecords;
      profileDetails.leaves = leaveApplications;
      profileDetails.submissions = assignmentSubmissions;
    } else if (user.role === 'faculty') {
      const [subjects, sessions] = await Promise.all([
        Subject.find({ faculty: user._id }),
        AttendanceSession.find({ faculty: user._id }).sort({ createdAt: -1 }).limit(15),
      ]);
      profileDetails.subjects = subjects;
      profileDetails.recentSessions = sessions;
    }

    res.json({
      success: true,
      data: profileDetails,
    });
  } catch (err) {
    next(err);
  }
});

// 5. Edit Authorized User Fields (Admin Action with Audit Log)
const editUserSchema = {
  body: z.object({
    name: z.string().optional(),
    department: z.string().optional(),
    semester: z.number().optional(),
    section: z.string().optional(),
    designation: z.string().optional(),
    status: z.enum(['active', 'pending', 'rejected']).optional(),
    rollNumber: z.string().optional(),
    phone: z.string().optional(),
    hostelInfo: z.object({
      isResident: z.boolean().optional(),
      block: z.string().optional(),
      roomNumber: z.string().optional(),
      bedNumber: z.string().optional(),
    }).optional(),
    transportInfo: z.object({
      isBusUser: z.boolean().optional(),
      busNumber: z.string().optional(),
      routeNumber: z.string().optional(),
      stopName: z.string().optional(),
    }).optional(),
  }),
};

router.put('/users/:id/profile', validate(editUserSchema), async (req, res, next) => {
  try {
    const admin = req.user;
    const allowedUpdates = req.body;

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const previousSnapshot = {
      name: user.name,
      department: user.department,
      semester: user.semester,
      section: user.section,
      status: user.status,
    };

    Object.assign(user, allowedUpdates);
    await user.save();

    // Audit Log
    await AuditLog.create({
      actor: admin._id,
      action: 'ADMIN_USER_PROFILE_UPDATED',
      targetType: 'User',
      targetId: user._id.toString(),
      details: {
        targetUserName: user.name,
        targetUserId: user.idNumber,
        previous: previousSnapshot,
        updatedFields: Object.keys(allowedUpdates),
      },
    });

    res.json({
      success: true,
      message: `Profile for ${user.name} (${user.idNumber}) updated successfully by Administrator.`,
      data: user.toJSON(),
    });
  } catch (err) {
    next(err);
  }
});

// 6. User Management (General List & Filter for dropdowns)
router.get('/users', async (req, res, next) => {
  try {
    const { role, search } = req.query;
    const filter = {};
    if (role && role !== 'all') {
      filter.role = role;
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { idNumber: { $regex: search.toUpperCase(), $options: 'i' } },
        { email: { $regex: search.toLowerCase(), $options: 'i' } },
      ];
    }

    const users = await User.find(filter).select('-password').sort({ createdAt: -1 }).limit(100);

    res.json({
      success: true,
      data: {
        total: users.length,
        users,
      },
    });
  } catch (err) {
    next(err);
  }
});

// 7. User Role Modification
router.put('/users/:id/role', async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['student', 'faculty', 'admin', 'transport_manager', 'hostel_warden'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role specified' });
    }

    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await AuditLog.create({
      actor: req.user._id,
      action: 'USER_ROLE_UPDATED',
      targetType: 'User',
      targetId: user._id.toString(),
      details: { newRole: role, updatedUser: user.name },
    });

    res.json({
      success: true,
      message: `Role updated for ${user.name} to ${role}`,
      user,
    });
  } catch (err) {
    next(err);
  }
});

// 8. Pending Registrations & Approval
router.get('/pending-users', async (req, res, next) => {
  try {
    const pendingUsers = await User.find({ status: 'pending' }).select('-password').sort({ createdAt: -1 });
    res.json({
      success: true,
      data: pendingUsers,
    });
  } catch (err) {
    next(err);
  }
});

router.put('/users/:id/approve', async (req, res, next) => {
  try {
    const { notes } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: 'active', approvalNotes: notes || 'Approved by Academic Administrator' },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await AuditLog.create({
      actor: req.user._id,
      action: 'USER_REGISTRATION_APPROVED',
      targetType: 'User',
      targetId: user._id.toString(),
      details: { approvedUser: user.name, role: user.role, idNumber: user.idNumber },
    });

    res.json({
      success: true,
      message: `Account for ${user.name} (${user.role}) has been officially approved!`,
      user,
    });
  } catch (err) {
    next(err);
  }
});

router.put('/users/:id/reject', async (req, res, next) => {
  try {
    const { reason } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected', approvalNotes: reason || 'Registration rejected by administrator' },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await AuditLog.create({
      actor: req.user._id,
      action: 'USER_REGISTRATION_REJECTED',
      targetType: 'User',
      targetId: user._id.toString(),
      details: { rejectedUser: user.name, reason },
    });

    res.json({
      success: true,
      message: `Account registration for ${user.name} was rejected.`,
      user,
    });
  } catch (err) {
    next(err);
  }
});

// 9. Timetable & Classroom Allocation
router.get('/timetables', async (req, res, next) => {
  try {
    const timetables = await Timetable.find().populate('subject').populate('faculty', 'name idNumber');
    res.json({
      success: true,
      data: timetables,
    });
  } catch (err) {
    next(err);
  }
});

// 10. Audit Log Inspector (With filter & pagination)
router.get('/audit-logs', async (req, res, next) => {
  try {
    const { action, targetType } = req.query;
    const filter = {};
    if (action) filter.action = action;
    if (targetType) filter.targetType = targetType;

    const logs = await AuditLog.find(filter)
      .populate('actor', 'name idNumber role email')
      .sort({ createdAt: -1 })
      .limit(200);

    res.json({
      success: true,
      count: logs.length,
      data: logs,
    });
  } catch (err) {
    next(err);
  }
});

export default router;

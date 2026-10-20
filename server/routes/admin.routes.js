import express from 'express';
import { z } from 'zod';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { User } from '../models/User.js';
import { Subject } from '../models/Subject.js';
import { AttendanceRecord } from '../models/AttendanceRecord.js';
import { AttendanceSession } from '../models/AttendanceSession.js';
import { Mark } from '../models/Mark.js';
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

    // Outing passes
    const pendingOutings = await OutingPass.countDocuments({ status: 'REQUESTED' });

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
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

// 2. User Management (List & Filter)
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

    const users = await User.find(filter).sort({ createdAt: -1 }).limit(100);

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

// 3. User Role Modification
router.put('/users/:id/role', async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['student', 'faculty', 'admin', 'transport_manager', 'hostel_warden'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role specified' });
    }

    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
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

// 3b. Pending Registrations & Approval
router.get('/pending-users', async (req, res, next) => {
  try {
    const pendingUsers = await User.find({ status: 'pending' }).sort({ createdAt: -1 });
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
    );

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
    );

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

// 4. Timetable & Classroom Allocation
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

// 5. Audit Log Inspector
router.get('/audit-logs', async (req, res, next) => {
  try {
    const logs = await AuditLog.find().populate('actor', 'name idNumber role').sort({ createdAt: -1 }).limit(100);
    res.json({
      success: true,
      data: logs,
    });
  } catch (err) {
    next(err);
  }
});

export default router;

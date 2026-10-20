import express from 'express';
import { z } from 'zod';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { HostelBlock, HostelRoom, HostelCheckLog, MaintenanceRequest } from '../models/Hostel.js';
import { OutingPass } from '../models/Transport.js';
import { User } from '../models/User.js';
import { AuditLog } from '../models/PracticeSet.js';

const router = express.Router();

router.use(authenticateToken);

// 1. Hostel Warden Executive Dashboard
router.get('/dashboard', requireRole(['hostel_warden', 'admin']), async (req, res, next) => {
  try {
    const blocks = await HostelBlock.find();
    const rooms = await HostelRoom.find();
    const totalCapacity = rooms.reduce((acc, r) => acc + r.capacity, 0);
    const totalOccupied = rooms.reduce((acc, r) => acc + r.occupancy, 0);

    const pendingOutings = await OutingPass.countDocuments({ status: 'REQUESTED' });
    const approvedOutings = await OutingPass.countDocuments({ status: { $in: ['APPROVED', 'CHECKED_OUT'] } });
    const openMaintenance = await MaintenanceRequest.countDocuments({ status: { $in: ['OPEN', 'ASSIGNED', 'IN_PROGRESS'] } });

    res.json({
      success: true,
      data: {
        summary: {
          totalCapacity,
          totalOccupied,
          vacantBeds: totalCapacity - totalOccupied,
          occupancyRate: totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0,
          pendingOutingRequests: pendingOutings,
          activeOutingPasses: approvedOutings,
          openMaintenanceTickets: openMaintenance,
        },
        blocks,
      },
    });
  } catch (err) {
    next(err);
  }
});

// 2. Room & Bed Inventory
router.get('/rooms', async (req, res, next) => {
  try {
    const { blockId, status } = req.query;
    const filter = {};
    if (blockId) filter.block = blockId;
    if (status && status !== 'ALL') filter.status = status;

    const rooms = await HostelRoom.find(filter)
      .populate('block', 'name gender curfewTime')
      .populate('beds.student', 'name idNumber phone email')
      .sort({ roomNumber: 1 });

    res.json({ success: true, data: rooms });
  } catch (err) {
    next(err);
  }
});

// 3. Room & Bed Allocation
router.post('/allocate', requireRole(['hostel_warden', 'admin']), async (req, res, next) => {
  try {
    const { roomId, bedNumber, studentId } = req.body;

    const room = await HostelRoom.findById(roomId).populate('block');
    if (!room) return res.status(404).json({ success: false, message: 'Hostel room not found' });

    const student = await User.findById(studentId);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    // Validate bed availability
    const bed = room.beds.find((b) => b.bedNumber === bedNumber);
    if (!bed) return res.status(400).json({ success: false, message: `Bed ${bedNumber} does not exist in room ${room.roomNumber}` });
    if (bed.status === 'OCCUPIED' && bed.student?.toString() !== student._id.toString()) {
      return res.status(409).json({ success: false, message: `Bed ${bedNumber} is already occupied` });
    }

    // Assign bed
    bed.student = student._id;
    bed.status = 'OCCUPIED';

    room.occupancy = room.beds.filter((b) => b.status === 'OCCUPIED').length;
    room.status = room.occupancy >= room.capacity ? 'FULL' : 'AVAILABLE';
    await room.save();

    // Update student's user profile
    student.hostelInfo = {
      block: room.block?.name || 'Hostel Block',
      roomNumber: room.roomNumber,
      bedNumber: bed.bedNumber,
      isResident: true,
    };
    await student.save();

    await AuditLog.create({
      actor: req.user._id,
      action: 'HOSTEL_BED_ALLOCATED',
      targetType: 'HostelRoom',
      targetId: room._id.toString(),
      details: { studentName: student.name, roomNumber: room.roomNumber, bedNumber },
    });

    res.json({
      success: true,
      message: `Bed ${bedNumber} in Room ${room.roomNumber} successfully allocated to ${student.name}`,
      data: room,
    });
  } catch (err) {
    next(err);
  }
});

// 4. Night Curfew Roll Call Logs
router.get('/curfew-logs', requireRole(['hostel_warden', 'admin']), async (req, res, next) => {
  try {
    const logs = await HostelCheckLog.find()
      .populate('student', 'name idNumber phone hostelInfo')
      .populate('verifiedBy', 'name idNumber')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ success: true, data: logs });
  } catch (err) {
    next(err);
  }
});

// 5. Record Curfew Roll Call Entry
router.post('/curfew-check', requireRole(['hostel_warden', 'admin']), async (req, res, next) => {
  try {
    const { studentId, status, remarks } = req.body;
    const student = await User.findById(studentId);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const log = new HostelCheckLog({
      student: student._id,
      block: student.hostelInfo?.block ? await HostelBlock.findOne({ name: student.hostelInfo.block })?.then(b => b?._id) : null,
      roomNumber: student.hostelInfo?.roomNumber || 'N/A',
      type: 'NIGHT_CURFEW_CHECK',
      status: status || 'PRESENT',
      verifiedBy: req.user._id,
      remarks: remarks || '',
    });
    await log.save();

    res.json({ success: true, message: `Curfew record saved for ${student.name}`, data: log });
  } catch (err) {
    next(err);
  }
});

// 6. Outing Passes Management
router.get('/outings', async (req, res, next) => {
  try {
    const filter = {};
    if (req.user.role === 'student') {
      filter.student = req.user._id;
    }

    const passes = await OutingPass.find(filter)
      .populate('student', 'name idNumber phone hostelInfo')
      .populate('approvedBy', 'name idNumber')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: passes });
  } catch (err) {
    next(err);
  }
});

// Student Submits Weekend Outing Request
router.post('/outings', requireRole(['student']), async (req, res, next) => {
  try {
    const { destination, purpose, departureDate, expectedReturnDate, shuttleBooked } = req.body;

    const pass = new OutingPass({
      student: req.user._id,
      destination,
      purpose,
      departureDate: new Date(departureDate),
      expectedReturnDate: new Date(expectedReturnDate),
      shuttleBooked: !!shuttleBooked,
      status: 'REQUESTED',
    });
    await pass.save();

    res.status(201).json({
      success: true,
      message: 'Weekend outing request submitted for Warden review.',
      data: pass,
    });
  } catch (err) {
    next(err);
  }
});

// Warden Approves or Updates Outing Pass
router.put('/outings/:id', requireRole(['hostel_warden', 'admin']), async (req, res, next) => {
  try {
    const { status, remarks } = req.body;
    const pass = await OutingPass.findById(req.params.id).populate('student', 'name');
    if (!pass) return res.status(404).json({ success: false, message: 'Outing pass not found' });

    if (status) pass.status = status;
    if (remarks) pass.approvalRemarks = remarks;
    pass.approvedBy = req.user._id;

    if (status === 'CHECKED_OUT') pass.actualDepartureTime = new Date();
    if (status === 'RETURNED') pass.actualReturnTime = new Date();

    await pass.save();

    await AuditLog.create({
      actor: req.user._id,
      action: `OUTING_PASS_${status}`,
      targetType: 'OutingPass',
      targetId: pass._id.toString(),
      details: { student: pass.student?.name, status, remarks },
    });

    res.json({ success: true, message: `Outing pass status updated to ${status}`, data: pass });
  } catch (err) {
    next(err);
  }
});

// 7. Maintenance Tickets
router.get('/maintenance', async (req, res, next) => {
  try {
    const filter = {};
    if (req.user.role === 'student') {
      filter.student = req.user._id;
    }

    const tickets = await MaintenanceRequest.find(filter)
      .populate('student', 'name idNumber phone hostelInfo')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: tickets });
  } catch (err) {
    next(err);
  }
});

router.post('/maintenance', async (req, res, next) => {
  try {
    const { blockName, roomNumber, category, title, description, priority } = req.body;

    const ticket = new MaintenanceRequest({
      student: req.user._id,
      blockName: blockName || req.user.hostelInfo?.block || 'Aravali Boys Hostel',
      roomNumber: roomNumber || req.user.hostelInfo?.roomNumber || 'B-204',
      category,
      title,
      description,
      priority: priority || 'MEDIUM',
      status: 'OPEN',
    });
    await ticket.save();

    res.status(201).json({
      success: true,
      message: 'Maintenance ticket created and routed to facilities team.',
      data: ticket,
    });
  } catch (err) {
    next(err);
  }
});

router.put('/maintenance/:id', requireRole(['hostel_warden', 'admin']), async (req, res, next) => {
  try {
    const { status, resolutionNotes, assignedStaff } = req.body;
    const ticket = await MaintenanceRequest.findById(req.params.id);
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

    if (status) ticket.status = status;
    if (resolutionNotes) ticket.resolutionNotes = resolutionNotes;
    if (assignedStaff) ticket.assignedStaff = assignedStaff;
    if (status === 'RESOLVED') ticket.resolvedAt = new Date();

    await ticket.save();

    res.json({ success: true, message: `Ticket marked as ${status}`, data: ticket });
  } catch (err) {
    next(err);
  }
});

export default router;

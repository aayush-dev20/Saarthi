import express from 'express';
import { z } from 'zod';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { Bus, BusRoute, OutingPass } from '../models/Transport.js';
import { AuditLog } from '../models/PracticeSet.js';

const router = express.Router();

router.use(authenticateToken);

// 1. Transport Overview Dashboard (Accessible by Transport Manager & Admin)
router.get('/dashboard', requireRole(['transport_manager', 'admin']), async (req, res, next) => {
  try {
    const buses = await Bus.find();
    const routes = await BusRoute.find({ isActive: true });
    const outingPasses = await OutingPass.find().populate('student', 'name idNumber phone hostelInfo');

    const activeBuses = buses.filter((b) => b.status === 'ACTIVE' || b.status === 'ON_ROUTE').length;
    const maintenanceBuses = buses.filter((b) => b.status === 'MAINTENANCE').length;
    const todayOutingCount = outingPasses.filter((p) => p.status === 'APPROVED' || p.status === 'CHECKED_OUT').length;

    res.json({
      success: true,
      data: {
        summary: {
          totalBuses: buses.length,
          activeBuses,
          maintenanceBuses,
          activeRoutesCount: routes.length,
          weekendOutingPassengers: todayOutingCount,
        },
        buses,
        routes,
      },
    });
  } catch (err) {
    next(err);
  }
});

// 2. Bus Fleet List
router.get('/buses', async (req, res, next) => {
  try {
    const buses = await Bus.find().sort({ busNumber: 1 });
    res.json({ success: true, data: buses });
  } catch (err) {
    next(err);
  }
});

// 3. Update Bus Status
router.put('/buses/:id/status', requireRole(['transport_manager', 'admin']), async (req, res, next) => {
  try {
    const { status, currentStop } = req.body;
    const bus = await Bus.findById(req.params.id);
    if (!bus) return res.status(404).json({ success: false, message: 'Bus not found' });

    if (status) bus.status = status;
    if (currentStop) {
      bus.currentLocation.currentStop = currentStop;
      bus.currentLocation.lastUpdated = new Date();
    }
    await bus.save();

    res.json({ success: true, message: `Bus ${bus.busNumber} updated to ${bus.status}`, data: bus });
  } catch (err) {
    next(err);
  }
});

// 4. Routes List (Students can view their bus routes)
router.get('/routes', async (req, res, next) => {
  try {
    const routes = await BusRoute.find({ isActive: true }).populate('assignedBus');
    res.json({ success: true, data: routes });
  } catch (err) {
    next(err);
  }
});

// 5. Weekend Outing List (Transport View)
router.get('/outings', requireRole(['transport_manager', 'admin']), async (req, res, next) => {
  try {
    const passes = await OutingPass.find()
      .populate('student', 'name idNumber phone hostelInfo section')
      .sort({ departureDate: -1 });

    res.json({ success: true, data: passes });
  } catch (err) {
    next(err);
  }
});

// 6. Update Outing Shuttle Assignment
router.put('/outings/:id/shuttle', requireRole(['transport_manager', 'admin']), async (req, res, next) => {
  try {
    const { shuttleBooked, shuttleRoute } = req.body;
    const pass = await OutingPass.findById(req.params.id).populate('student', 'name');
    if (!pass) return res.status(404).json({ success: false, message: 'Outing pass not found' });

    if (shuttleBooked !== undefined) pass.shuttleBooked = shuttleBooked;
    if (shuttleRoute) pass.shuttleRoute = shuttleRoute;
    await pass.save();

    await AuditLog.create({
      actor: req.user._id,
      action: 'OUTING_SHUTTLE_ASSIGNED',
      targetType: 'OutingPass',
      targetId: pass._id.toString(),
      details: { studentName: pass.student?.name, shuttleRoute },
    });

    res.json({ success: true, message: 'Shuttle transportation confirmed for outing pass', data: pass });
  } catch (err) {
    next(err);
  }
});

export default router;

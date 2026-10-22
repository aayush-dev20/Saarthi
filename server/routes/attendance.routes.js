import express from 'express';
import { z } from 'zod';
import { authenticateToken } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { AttendanceSession } from '../models/AttendanceSession.js';
import { AttendanceRecord } from '../models/AttendanceRecord.js';
import { Classroom } from '../models/Classroom.js';
import { Enrollment } from '../models/Enrollment.js';
import { verifySignedQRToken } from '../utils/qrCrypto.js';
import { evaluateClassroomLocation, calculateHaversineDistance } from '../utils/haversine.js';
import { emitAttendanceScanNotification } from '../sockets/index.js';

const router = express.Router();

// Validation schema for POST /api/attendance/scan
const scanAttendanceSchema = {
  body: z.object({
    qrToken: z.string().optional(),
    token: z.string().optional(),
    code: z.string().optional(),
    latitude: z.number().optional().nullable(),
    longitude: z.number().optional().nullable(),
    lat: z.number().optional().nullable(),
    lng: z.number().optional().nullable(),
    accuracy: z.number().optional().nullable(),
    accuracyMeters: z.number().optional().nullable(),
    locationTimestamp: z.union([z.number(), z.string(), z.date()]).optional(),
    locationPermission: z.enum(['GRANTED', 'DENIED', 'UNAVAILABLE', 'TIMEOUT']).default('GRANTED').optional(),
    challengePin: z.string().optional(),
    sessionId: z.string().optional(),
  }),
};

/**
 * POST /api/attendance/scan
 * GPS-Based Classroom Attendance Verification with Live Teacher Notifications
 */
router.post('/scan', authenticateToken, validate(scanAttendanceSchema), async (req, res, next) => {
  try {
    // 1. Strict Server-Side Identity: Never trust client-supplied user identity
    const student = req.user;
    if (student.role !== 'student' && student.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only authenticated students can submit classroom attendance scans.',
      });
    }

    const {
      qrToken,
      token,
      code,
      latitude,
      longitude,
      lat,
      lng,
      accuracy,
      accuracyMeters,
      locationTimestamp,
      locationPermission = 'GRANTED',
      challengePin,
      sessionId: explicitSessionId,
    } = req.body;

    const rawToken = qrToken || token;
    const finalLat = latitude != null ? latitude : lat;
    const finalLng = longitude != null ? longitude : lng;
    const finalAccuracy = accuracy != null ? accuracy : accuracyMeters;

    let session = null;
    let verifyMethod = 'QR_VERIFIED';

    // 2. Validate QR Token or Session Code
    if (rawToken) {
      const verifyResult = verifySignedQRToken(rawToken);
      if (!verifyResult.valid) {
        return res.status(400).json({
          success: false,
          error: 'TOKEN_INVALID_OR_EXPIRED',
          message: verifyResult.error || 'The scanned QR code token is expired, forged, or invalid.',
        });
      }

      session = await AttendanceSession.findById(verifyResult.sessionId).populate('subject').populate('faculty');
      verifyMethod = 'QR_VERIFIED';
    } else if (code) {
      session = await AttendanceSession.findOne({
        sessionCode: code.trim().toUpperCase(),
        isActive: true,
      }).populate('subject').populate('faculty');
      verifyMethod = 'MANUAL_CODE';
    } else if (explicitSessionId) {
      session = await AttendanceSession.findById(explicitSessionId).populate('subject').populate('faculty');
    }

    if (!session || !session.isActive) {
      return res.status(404).json({
        success: false,
        error: 'SESSION_INACTIVE',
        message: 'No active attendance session found. The session may have concluded or expired.',
      });
    }

    // Check session expiration window
    if (session.sessionExpiresAt && new Date() > new Date(session.sessionExpiresAt)) {
      session.isActive = false;
      await session.save();
      return res.status(400).json({
        success: false,
        error: 'SESSION_EXPIRED',
        message: 'This attendance session has ended and is no longer accepting submissions.',
      });
    }

    // 3. Verify Student Enrollment / Eligibility
    const enrollment = await Enrollment.findOne({
      student: student._id,
      subject: session.subject?._id,
    });

    // If not enrolled in this specific subject and not in matching section, check section
    if (!enrollment && student.section && session.section && student.section !== session.section) {
      return res.status(403).json({
        success: false,
        error: 'SECTION_MISMATCH',
        message: `You are enrolled in section ${student.section}, but this lecture is for section ${session.section}.`,
      });
    }

    // 4. Duplicate Check-in Prevention (Anti-Proxy Replay Protection)
    const existingRecord = await AttendanceRecord.findOne({
      session: session._id,
      student: student._id,
    });

    if (existingRecord) {
      return res.status(409).json({
        success: false,
        error: 'DUPLICATE_ATTENDANCE',
        message: `Attendance is already recorded for ${student.name} in this session at ${new Date(
          existingRecord.verifiedAt
        ).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
        data: {
          recordId: existingRecord._id,
          verifiedAt: existingRecord.verifiedAt,
          status: existingRecord.status,
          verificationStatus: existingRecord.verificationStatus,
        },
      });
    }

    // 5. Classroom Geofence & Location Evaluation
    const classroomName = session.room || session.classroomName || 'Classroom 12';
    const classroomCoords = session.classroomGeo || {
      lat: 30.7333,
      lng: 76.7794,
      radiusMeters: 50,
      maxAccuracyMeters: 35,
      name: classroomName,
    };

    const studentLocation = {
      lat: finalLat,
      lng: finalLng,
      accuracy: finalAccuracy,
      permission: locationPermission,
    };

    const geoEvaluation = evaluateClassroomLocation(studentLocation, {
      lat: classroomCoords.lat,
      lng: classroomCoords.lng,
      radiusMeters: classroomCoords.radiusMeters || 50,
      maxAccuracyMeters: classroomCoords.maxAccuracyMeters || 35,
      name: classroomName,
    });

    // 6. Teacher Live Challenge PIN Check (Optional extra multi-factor)
    let pinMismatch = false;
    if (session.challengePin && challengePin) {
      if (challengePin.trim() !== session.challengePin.trim()) {
        pinMismatch = true;
      }
    }

    let finalStatus = geoEvaluation.attendanceStatus; // 'PRESENT' | 'FLAGGED_FOR_REVIEW'
    let finalVerificationStatus = geoEvaluation.verificationStatus; // 'VERIFIED' | 'FLAGGED_FOR_REVIEW'
    let flagReasons = [];

    if (geoEvaluation.flagReason) {
      flagReasons.push(geoEvaluation.flagReason);
    }
    if (pinMismatch) {
      finalStatus = 'FLAGGED_FOR_REVIEW';
      finalVerificationStatus = 'FLAGGED_FOR_REVIEW';
      flagReasons.push('Live classroom challenge PIN mismatch');
    }

    const flagReasonStr = flagReasons.join('; ');
    const proximityScore =
      finalVerificationStatus === 'VERIFIED'
        ? Math.max(85, Math.min(100, Math.round(100 - (geoEvaluation.distanceMeters || 0) / 2)))
        : Math.max(15, Math.min(55, Math.round(70 - (geoEvaluation.distanceMeters || 100) / 5)));

    // 7. Persist Attendance Record to Database
    const record = new AttendanceRecord({
      session: session._id,
      student: student._id,
      subject: session.subject._id,
      method: verifyMethod,
      status: finalStatus,
      room: classroomName,
      classroomName,
      verificationStatus: finalVerificationStatus,
      locationVerification: geoEvaluation.locationVerification,
      verificationResult: geoEvaluation.verificationResult,
      flagReason: flagReasonStr,
      proximityScore,
      wifiSsid: req.body.wifiSsid || 'IndoGlobal-Campus-WiFi',
      networkSubnet: req.ip || '',
      clientGeo: {
        lat: finalLat,
        lng: finalLng,
        accuracyMeters: geoEvaluation.accuracyMeters,
        distanceMeters: geoEvaluation.distanceMeters,
        locationTimestamp: locationTimestamp ? new Date(locationTimestamp) : new Date(),
        locationPermission,
        verificationResult: geoEvaluation.verificationResult,
      },
      classroomGeo: {
        lat: classroomCoords.lat,
        lng: classroomCoords.lng,
        radiusMeters: classroomCoords.radiusMeters || 50,
        maxAccuracyMeters: classroomCoords.maxAccuracyMeters || 35,
      },
      challengePinProvided: challengePin || '',
    });

    await record.save();

    // 8. Send Real-Time Socket.IO Notification to Teacher's Live Dashboard
    const scanTimeFormatted = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const liveNotification = {
      recordId: record._id.toString(),
      studentName: student.name,
      studentId: student.idNumber,
      student: {
        id: student._id.toString(),
        name: student.name,
        studentId: student.idNumber,
        rollNo: student.idNumber,
        avatar: student.avatar || student.name.slice(0, 2).toUpperCase(),
        section: student.section,
      },
      classroom: classroomName,
      subject: session.subject?.name || 'Classroom Lecture',
      scanTime: scanTimeFormatted,
      scanDate: new Date().toLocaleDateString(),
      locationPermission: locationPermission === 'DENIED' ? 'Denied' : 'Granted',
      gpsAccuracy: geoEvaluation.accuracyMeters != null ? `${geoEvaluation.accuracyMeters} metres` : 'N/A',
      gpsAccuracyValue: geoEvaluation.accuracyMeters,
      distanceFromClassroom:
        geoEvaluation.distanceMeters != null ? `${geoEvaluation.distanceMeters} metres` : 'N/A',
      distanceMeters: geoEvaluation.distanceMeters,
      configuredRadius: classroomCoords.radiusMeters || 50,
      locationVerification:
        geoEvaluation.locationVerification === 'WITHIN_RADIUS'
          ? 'Within configured radius'
          : geoEvaluation.locationVerification === 'OUT_OF_RADIUS'
          ? 'Outside configured radius'
          : geoEvaluation.locationVerification === 'INCONCLUSIVE_ACCURACY'
          ? 'Inconclusive: Poor GPS accuracy'
          : 'Location permission denied',
      locationStatus: geoEvaluation.locationVerification,
      attendanceStatus:
        finalStatus === 'PRESENT'
          ? 'Present — subject to verification rules'
          : 'Flagged for review — teacher audit required',
      verificationStatus: finalVerificationStatus,
      flagReason: flagReasonStr,
      proximityScore,
    };

    // Emit live event to teacher's authorized session room
    emitAttendanceScanNotification(session._id.toString(), liveNotification);

    // 9. Return JSON Response to Student
    res.status(201).json({
      success: true,
      message:
        finalStatus === 'PRESENT'
          ? `Verified! Attendance recorded for ${session.subject?.name} in ${classroomName}`
          : `Attendance logged for review (${flagReasonStr}). Verified by teacher console.`,
      data: {
        recordId: record._id,
        classroom: classroomName,
        subject: session.subject?.name,
        scanTime: scanTimeFormatted,
        distanceFromClassroom: geoEvaluation.distanceMeters,
        configuredRadius: classroomCoords.radiusMeters || 50,
        gpsAccuracy: geoEvaluation.accuracyMeters,
        locationVerification: liveNotification.locationVerification,
        locationVerificationCode: geoEvaluation.locationVerification,
        attendanceStatus: finalStatus,
        verificationStatus: finalVerificationStatus,
        flagReason: flagReasonStr,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/attendance/classrooms
 * List all configured classrooms and their location profiles
 */
router.get('/classrooms', async (req, res, next) => {
  try {
    let classrooms = await Classroom.find({ isActive: true }).sort({ name: 1 });

    // Auto-seed default classrooms if empty
    if (classrooms.length === 0) {
      classrooms = await Classroom.insertMany([
        {
          name: 'Classroom 12',
          code: 'CR-12',
          building: 'Academic Block A',
          campus: 'Indo Global Campus',
          floor: '1st Floor',
          lat: 30.7333,
          lng: 76.7794,
          radiusMeters: 50,
          maxAccuracyMeters: 35,
          capacity: 60,
        },
        {
          name: 'LT-102 (Lecture Theatre 2)',
          code: 'LT-102',
          building: 'Main Academic Block',
          campus: 'Indo Global Campus',
          floor: 'Ground Floor',
          lat: 30.7335,
          lng: 76.7798,
          radiusMeters: 50,
          maxAccuracyMeters: 35,
          capacity: 120,
        },
        {
          name: 'Systems Lab 1',
          code: 'SYS-LAB-1',
          building: 'Computer Science Wing',
          campus: 'Indo Global Campus',
          floor: '2nd Floor',
          lat: 30.7337,
          lng: 76.7792,
          radiusMeters: 45,
          maxAccuracyMeters: 30,
          capacity: 40,
        },
        {
          name: 'Algorithm Lab 3',
          code: 'ALGO-LAB-3',
          building: 'Computer Science Wing',
          campus: 'Indo Global Campus',
          floor: '2nd Floor',
          lat: 30.7338,
          lng: 76.7793,
          radiusMeters: 45,
          maxAccuracyMeters: 30,
          capacity: 40,
        },
        {
          name: 'LH-101 (Lecture Hall 1)',
          code: 'LH-101',
          building: 'Main Academic Block',
          campus: 'Indo Global Campus',
          floor: 'Ground Floor',
          lat: 30.7332,
          lng: 76.7796,
          radiusMeters: 55,
          maxAccuracyMeters: 40,
          capacity: 150,
        },
      ]);
    }

    res.json({
      success: true,
      data: classrooms,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/attendance/classrooms/:id/radius
 * Configure radius & acceptable accuracy for a classroom
 */
router.put('/classrooms/:id/radius', authenticateToken, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'faculty') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const { radiusMeters, maxAccuracyMeters } = req.body;
    const update = {};
    if (radiusMeters != null) update.radiusMeters = Number(radiusMeters);
    if (maxAccuracyMeters != null) update.maxAccuracyMeters = Number(maxAccuracyMeters);

    const classroom = await Classroom.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!classroom) {
      return res.status(404).json({ success: false, message: 'Classroom not found' });
    }

    res.json({
      success: true,
      message: `Classroom ${classroom.name} geofence updated (Radius: ${classroom.radiusMeters}m, Max Accuracy: ${classroom.maxAccuracyMeters}m)`,
      data: classroom,
    });
  } catch (err) {
    next(err);
  }
});

export default router;

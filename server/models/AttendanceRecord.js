import mongoose from 'mongoose';

const attendanceRecordSchema = new mongoose.Schema(
  {
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AttendanceSession',
      required: true,
      index: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
      index: true,
    },
    method: {
      type: String,
      enum: ['QR_VERIFIED', 'MANUAL_CODE', 'FACULTY_OVERRIDE'],
      default: 'QR_VERIFIED',
    },
    status: {
      type: String,
      enum: ['PRESENT', 'ABSENT', 'FLAGGED_FOR_REVIEW', 'REJECTED'],
      default: 'PRESENT',
    },
    verifiedAt: {
      type: Date,
      default: Date.now,
    },
    room: {
      type: String,
      default: 'Classroom 12',
    },
    classroomName: {
      type: String,
      default: 'Classroom 12',
    },
    classroom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Classroom',
      default: null,
    },
    ipAddress: {
      type: String,
      default: '',
    },
    verificationStatus: {
      type: String,
      enum: ['VERIFIED', 'FLAGGED_FOR_REVIEW', 'FACULTY_OVERRIDE', 'REJECTED'],
      default: 'VERIFIED',
      index: true,
    },
    locationVerification: {
      type: String,
      enum: [
        'WITHIN_RADIUS',
        'OUT_OF_RADIUS',
        'INCONCLUSIVE_ACCURACY',
        'PERMISSION_DENIED',
        'MANUAL_OVERRIDE',
        'NOT_EVALUATED',
      ],
      default: 'WITHIN_RADIUS',
      index: true,
    },
    verificationResult: {
      type: String,
      default: 'Verified',
    },
    flagReason: {
      type: String,
      default: '',
    },
    proximityScore: {
      type: Number,
      default: 95,
      min: 0,
      max: 100,
    },
    wifiSsid: {
      type: String,
      default: 'IndoGlobal-Campus-WiFi',
    },
    networkSubnet: {
      type: String,
      default: '',
    },
    clientGeo: {
      lat: Number,
      lng: Number,
      accuracyMeters: Number,
      distanceMeters: Number,
      locationTimestamp: Date,
      locationPermission: {
        type: String,
        enum: ['GRANTED', 'DENIED', 'UNAVAILABLE', 'TIMEOUT'],
        default: 'GRANTED',
      },
      verificationResult: String,
    },
    classroomGeo: {
      lat: Number,
      lng: Number,
      radiusMeters: Number,
      maxAccuracyMeters: Number,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewNote: {
      type: String,
      default: '',
    },
    challengePinProvided: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// Enforce single attendance record per student per session
attendanceRecordSchema.index({ session: 1, student: 1 }, { unique: true });

export const AttendanceRecord = mongoose.model('AttendanceRecord', attendanceRecordSchema);

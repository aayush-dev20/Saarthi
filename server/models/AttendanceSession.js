import mongoose from 'mongoose';

const attendanceSessionSchema = new mongoose.Schema(
  {
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
      index: true,
    },
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    section: {
      type: String,
      required: true,
      default: 'CSE-A',
    },
    room: {
      type: String,
      default: 'LT-102',
    },
    sessionCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    currentToken: {
      type: String,
      required: true,
    },
    tokenExpiresAt: {
      type: Date,
      required: true,
    },
    sessionExpiresAt: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    challengePin: {
      type: String,
      default: '742',
    },
    allowedSubnet: {
      type: String,
      default: '10.182.*',
    },
    classroomGeo: {
      lat: { type: Number, default: 28.5355 },
      lng: { type: Number, default: 77.3910 },
      radiusMeters: { type: Number, default: 60 },
    },
    requireProximityCheck: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const AttendanceSession = mongoose.model('AttendanceSession', attendanceSessionSchema);

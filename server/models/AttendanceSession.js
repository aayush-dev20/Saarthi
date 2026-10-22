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
    classroom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Classroom',
      default: null,
    },
    classroomName: {
      type: String,
      default: 'Classroom 12',
    },
    room: {
      type: String,
      default: 'Classroom 12',
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
      lat: { type: Number, default: 30.7333 },
      lng: { type: Number, default: 76.7794 },
      radiusMeters: { type: Number, default: 50 },
      maxAccuracyMeters: { type: Number, default: 35 },
      campus: { type: String, default: 'Indo Global Campus' },
      building: { type: String, default: 'Main Academic Block' },
    },
    requireProximityCheck: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const AttendanceSession = mongoose.model('AttendanceSession', attendanceSessionSchema);

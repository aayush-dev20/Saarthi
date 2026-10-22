import mongoose from 'mongoose';

const classroomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    building: {
      type: String,
      default: 'Main Academic Block',
      trim: true,
    },
    campus: {
      type: String,
      default: 'Indo Global Campus',
      trim: true,
    },
    floor: {
      type: String,
      default: '1st Floor',
    },
    capacity: {
      type: Number,
      default: 60,
    },
    // Classroom Geo Coordinates
    lat: {
      type: Number,
      required: true,
      default: 30.7333,
    },
    lng: {
      type: Number,
      required: true,
      default: 76.7794,
    },
    // Configurable geofence radius in metres
    radiusMeters: {
      type: Number,
      required: true,
      default: 50,
      min: 10,
      max: 500,
    },
    // Maximum acceptable GPS accuracy in metres
    maxAccuracyMeters: {
      type: Number,
      required: true,
      default: 35,
      min: 5,
      max: 150,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const Classroom = mongoose.model('Classroom', classroomSchema);

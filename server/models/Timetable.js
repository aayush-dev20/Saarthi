import mongoose from 'mongoose';

const timetableSchema = new mongoose.Schema(
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
    dayOfWeek: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      required: true,
      index: true,
    },
    periodNumber: {
      type: Number,
      required: true,
      min: 1,
      max: 8,
    },
    startTime: {
      type: String,
      required: true, // e.g. "10:00 AM"
    },
    endTime: {
      type: String,
      required: true, // e.g. "11:00 AM"
    },
    room: {
      type: String,
      required: true,
      default: 'LT-102',
    },
    section: {
      type: String,
      required: true,
      default: 'CSE-A',
      index: true,
    },
    semester: {
      type: Number,
      required: true,
      default: 4,
    },
    type: {
      type: String,
      enum: ['Lecture', 'Tutorial', 'Lab', 'Seminar'],
      default: 'Lecture',
    },
  },
  { timestamps: true }
);

timetableSchema.index({ dayOfWeek: 1, periodNumber: 1, room: 1 }, { unique: true });

export const Timetable = mongoose.model('Timetable', timetableSchema);

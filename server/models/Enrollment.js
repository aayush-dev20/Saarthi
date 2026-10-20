import mongoose from 'mongoose';

const enrollmentSchema = new mongoose.Schema(
  {
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
    semester: {
      type: Number,
      required: true,
      default: 4,
    },
    section: {
      type: String,
      required: true,
      default: 'CSE-A',
    },
    status: {
      type: String,
      enum: ['enrolled', 'completed', 'dropped'],
      default: 'enrolled',
    },
  },
  { timestamps: true }
);

enrollmentSchema.index({ student: 1, subject: 1 }, { unique: true });

export const Enrollment = mongoose.model('Enrollment', enrollmentSchema);

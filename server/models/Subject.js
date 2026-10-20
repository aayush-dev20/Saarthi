import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: String,
      default: 'Applied Mathematics & Computing',
    },
    semester: {
      type: Number,
      required: true,
      default: 4,
    },
    credits: {
      type: Number,
      default: 4,
    },
    courseType: {
      type: String,
      enum: ['Professional Core Course', 'Engineering Science Course', 'Basic Science Course', 'Humanities & Social Sciences', 'Mandatory Course'],
      default: 'Professional Core Course',
    },
    load: {
      type: String, // e.g. "3-0-0", "0-0-4"
      default: '3-0-0',
    },
    internalMax: {
      type: Number,
      default: 40,
    },
    externalMax: {
      type: Number,
      default: 60,
    },
    totalMax: {
      type: Number,
      default: 100,
    },
    scheme: {
      type: String,
      default: 'IKGPTU-2018',
    },
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    instructorName: {
      type: String,
      default: '',
    },
    color: {
      type: String,
      default: 'indigo',
    },
  },
  { timestamps: true }
);

export const Subject = mongoose.model('Subject', subjectSchema);

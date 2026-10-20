import mongoose from 'mongoose';

const markSchema = new mongoose.Schema(
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
    internalMarks: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 0,
    },
    internalMax: {
      type: Number,
      default: 40,
    },
    semesterMarks: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 0,
    },
    semesterMax: {
      type: Number,
      default: 60,
    },
    totalMarks: {
      type: Number,
      default: 0,
    },
    grade: {
      type: String,
      default: 'N/A',
    },
    publicationStatus: {
      type: String,
      enum: ['PUBLISHED', 'PROVISIONAL', 'IN_REVIEW'],
      default: 'PUBLISHED',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    comments: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

markSchema.pre('save', function () {
  this.totalMarks = Math.round(this.internalMarks + this.semesterMarks);
  const maxTotal = (this.internalMax || 40) + (this.semesterMax || 60);
  const pct = maxTotal > 0 ? (this.totalMarks / maxTotal) * 100 : 0;
  if (pct >= 90) this.grade = 'A+';
  else if (pct >= 80) this.grade = 'A';
  else if (pct >= 70) this.grade = 'B+';
  else if (pct >= 60) this.grade = 'B';
  else if (pct >= 50) this.grade = 'C';
  else this.grade = 'F';
});

markSchema.index({ student: 1, subject: 1 }, { unique: true });

export const Mark = mongoose.model('Mark', markSchema);

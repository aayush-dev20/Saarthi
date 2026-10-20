import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema(
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
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    dueDate: {
      type: String, // YYYY-MM-DD
      required: true,
    },
    totalPoints: {
      type: Number,
      default: 25,
    },
    priority: {
      type: String,
      enum: ['High', 'Medium', 'Normal'],
      default: 'Medium',
    },
    prerequisiteNote: {
      type: String,
      default: null,
    },
    section: {
      type: String,
      default: 'CSE-A',
    },
    courseCode: {
      type: String,
      default: 'BTCS 301-18',
    },
    unitTopic: {
      type: String,
      default: 'Unit 2: Core Fundamentals',
    },
    semester: {
      type: Number,
      default: 4,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'PUBLISHED', 'CLOSED'],
      default: 'PUBLISHED',
    },
    attachmentName: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

export const Assignment = mongoose.model('Assignment', assignmentSchema);

const assignmentSubmissionSchema = new mongoose.Schema(
  {
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assignment',
      required: true,
      index: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Submitted', 'Graded'],
      default: 'Submitted',
    },
    submittedOn: {
      type: String, // YYYY-MM-DD
      default: () => new Date().toISOString().split('T')[0],
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    submissionText: {
      type: String,
      default: '',
    },
    fileName: {
      type: String,
      default: '',
    },
    fileSize: {
      type: String,
      default: '',
    },
    serverReceiptId: {
      type: String,
      default: '',
    },
    isLate: {
      type: Boolean,
      default: false,
    },
    score: {
      type: Number,
      default: null,
    },
    feedback: {
      type: String,
      default: '',
    },
    gradedAt: {
      type: Date,
      default: null,
    },
    gradedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

assignmentSubmissionSchema.index({ assignment: 1, student: 1 }, { unique: true });

export const AssignmentSubmission = mongoose.model('AssignmentSubmission', assignmentSubmissionSchema);

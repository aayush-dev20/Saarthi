import mongoose from 'mongoose';

const practiceSetSchema = new mongoose.Schema(
  {
    setId: {
      type: String,
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: true,
    },
    concept: {
      type: String,
      required: true,
    },
    conceptCode: {
      type: String,
      default: 'c5',
    },
    difficulty: {
      type: String,
      default: 'Medium',
    },
    estimatedMinutes: {
      type: Number,
      default: 15,
    },
    questions: [
      {
        id: String,
        prompt: String,
        options: [String],
        correctIndex: Number,
        hint: String,
        solution: String,
      },
    ],
  },
  { timestamps: true }
);

export const PracticeSet = mongoose.model('PracticeSet', practiceSetSchema);

const practiceAttemptSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    setId: {
      type: String,
      required: true,
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },
    score: {
      type: Number,
      default: 100,
    },
  },
  { timestamps: true }
);

export const PracticeAttempt = mongoose.model('PracticeAttempt', practiceAttemptSchema);

const auditLogSchema = new mongoose.Schema(
  {
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    targetType: {
      type: String,
      required: true,
    },
    targetId: {
      type: String,
    },
    details: {
      type: Object,
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);

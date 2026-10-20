import mongoose from 'mongoose';

const diagnosticQuestionSchema = new mongoose.Schema(
  {
    conceptCode: {
      type: String,
      required: true,
      index: true,
    },
    conceptName: {
      type: String,
      required: true,
    },
    subjectCode: {
      type: String,
      default: 'MATH-202',
    },
    isPrerequisiteCheck: {
      type: Boolean,
      default: false,
    },
    question: {
      type: String,
      required: true,
    },
    options: [
      {
        id: { type: String, required: true },
        text: { type: String, required: true },
        correct: { type: Boolean, required: true },
      },
    ],
    explanation: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export const DiagnosticQuestion = mongoose.model('DiagnosticQuestion', diagnosticQuestionSchema);

const assessmentAttemptSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    subjectCode: {
      type: String,
      default: 'MATH-202',
    },
    answers: [
      {
        questionId: String,
        selectedOptionId: String,
        isCorrect: Boolean,
        conceptCode: String,
        isPrerequisiteCheck: Boolean,
      },
    ],
    score: {
      type: Number,
      required: true,
    },
    correctCount: {
      type: Number,
      required: true,
    },
    totalQuestions: {
      type: Number,
      required: true,
    },
    prereqErrors: {
      type: Number,
      default: 0,
    },
    targetErrors: {
      type: Number,
      default: 0,
    },
    hasIntegrationGap: {
      type: Boolean,
      default: false,
    },
    isReassessment: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const AssessmentAttempt = mongoose.model('AssessmentAttempt', assessmentAttemptSchema);

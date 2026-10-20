import mongoose from 'mongoose';

const learningResourceSchema = new mongoose.Schema(
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
      required: true,
      default: 'MATH-202',
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    author: {
      type: String,
      default: 'Department Faculty & Academic Curriculum Board',
    },
    // Self-contained core learning content (in-app interactive module)
    theoreticalDerivation: {
      type: String,
      default: '',
    },
    formulaBox: {
      formula: { type: String, default: '' },
      description: { type: String, default: '' },
      rules: [{ type: String }],
    },
    workedExamples: [
      {
        problem: String,
        stepByStepSolution: [String],
        finalAnswer: String,
        pitfallToAvoid: String,
      },
    ],
    prerequisiteRefresher: {
      prerequisiteConcept: { type: String, default: '' },
      whyItMatters: { type: String, default: '' },
      coreRule: { type: String, default: '' },
    },
    downloadableNotesSummary: {
      type: String,
      default: '',
    },
    // Optional external reference (never required)
    youtubeVideoId: {
      type: String,
      default: '',
    },
    youtubeUrl: {
      type: String,
      default: '',
    },
    embedUrl: {
      type: String,
      default: '',
    },
    durationMinutes: {
      type: Number,
      default: 14,
    },
    keyTakeaways: [String],
    timestamps: [
      {
        title: String,
        time: String,
        seconds: Number,
      },
    ],
    postLearningQuestions: [
      {
        id: String,
        question: String,
        options: [String],
        correctIndex: Number,
        explanation: String,
      },
    ],
  },
  { timestamps: true }
);

export const LearningResource = mongoose.model('LearningResource', learningResourceSchema);

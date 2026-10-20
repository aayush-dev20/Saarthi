import mongoose from 'mongoose';

const conceptSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    label: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    subjectCode: {
      type: String,
      default: 'MATH-202',
      index: true,
    },
    posX: {
      type: Number,
      default: 0,
    },
    posY: {
      type: Number,
      default: 0,
    },
    isTarget: {
      type: Boolean,
      default: false,
    },
    defaultMastery: {
      type: Number,
      default: 80,
    },
  },
  { timestamps: true }
);

export const Concept = mongoose.model('Concept', conceptSchema);

const conceptPrerequisiteSchema = new mongoose.Schema(
  {
    edgeId: {
      type: String,
      required: true,
      unique: true,
    },
    source: {
      type: String,
      required: true,
    },
    target: {
      type: String,
      required: true,
    },
    isAnimated: {
      type: Boolean,
      default: false,
    },
    style: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true }
);

export const ConceptPrerequisite = mongoose.model('ConceptPrerequisite', conceptPrerequisiteSchema);

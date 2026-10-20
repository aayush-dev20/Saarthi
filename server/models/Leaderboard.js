import mongoose from 'mongoose';

const leaderboardEntrySchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    semester: {
      type: Number,
      default: 4,
    },
    section: {
      type: String,
      default: 'CSE-A',
    },
    academicPoints: {
      type: Number,
      default: 0,
      description: 'Points based on verified internal and semester exam scores',
    },
    diagnosticImprovementPoints: {
      type: Number,
      default: 0,
      description: 'Awarded for closing identified prerequisite gaps (max 100 per semester)',
    },
    courseworkPoints: {
      type: Number,
      default: 0,
      description: 'Awarded on verified assignment submissions (max 25 per on-time assignment)',
    },
    participationPoints: {
      type: Number,
      default: 0,
      description: 'Practice sets completed without hint spamming',
    },
    totalScore: {
      type: Number,
      default: 0,
      index: true,
    },
    rank: {
      type: Number,
      default: 1,
    },
    badges: [
      {
        id: String,
        name: String,
        description: String,
        icon: String,
        earnedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

leaderboardEntrySchema.pre('save', function () {
  this.totalScore = Math.round(
    this.academicPoints +
    this.diagnosticImprovementPoints +
    this.courseworkPoints +
    this.participationPoints
  );
});

export const LeaderboardEntry = mongoose.model('LeaderboardEntry', leaderboardEntrySchema);

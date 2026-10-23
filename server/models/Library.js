import mongoose from 'mongoose';

// 1. Digital Library Pass Schema
const libraryPassSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    studentIdNumber: {
      type: String,
      required: true,
    },
    studentName: {
      type: String,
      required: true,
    },
    passNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    passType: {
      type: String,
      enum: ['STANDARD', 'READING_ROOM', 'EXTENDED_HOURS', 'RESEARCH_SECTION'],
      default: 'STANDARD',
    },
    purpose: {
      type: String,
      default: 'General Study & Research',
    },
    qrToken: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    validFrom: {
      type: Date,
      required: true,
      default: Date.now,
    },
    validUntil: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'EXPIRED', 'USED', 'REVOKED'],
      default: 'ACTIVE',
      index: true,
    },
    singleUse: {
      type: Boolean,
      default: false,
    },
    checkInLogs: [
      {
        verifiedAt: { type: Date, default: Date.now },
        verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        verifierName: String,
        location: { type: String, default: 'Central Library Main Gate' },
        note: String,
      },
    ],
  },
  { timestamps: true }
);

export const LibraryPass = mongoose.model('LibraryPass', libraryPassSchema);

// 2. Book Catalogue Schema
const bookSchema = new mongoose.Schema(
  {
    isbn: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      index: true,
    },
    author: {
      type: String,
      required: true,
    },
    publisher: {
      type: String,
      default: 'Standard Academic Press',
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    subjectCode: {
      type: String,
      index: true,
    },
    totalCopies: {
      type: Number,
      required: true,
      min: 0,
      default: 5,
    },
    availableCopies: {
      type: Number,
      required: true,
      min: 0,
      default: 5,
    },
    shelfLocation: {
      type: String,
      default: 'Stack Area - Level 2',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const Book = mongoose.model('Book', bookSchema);

// 3. Book Loan (Issue & Return) Schema
const bookLoanSchema = new mongoose.Schema(
  {
    loanId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: true,
      index: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    issueDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: true,
      index: true,
    },
    returnDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['ISSUED', 'RETURNED', 'OVERDUE'],
      default: 'ISSUED',
      index: true,
    },
    finePerDay: {
      type: Number,
      default: 5, // INR 5 per day standard university policy
    },
    fineAmount: {
      type: Number,
      default: 0,
    },
    finePaid: {
      type: Boolean,
      default: false,
    },
    remindersSent: [
      {
        type: { type: String, enum: ['UPCOMING_DUE', 'OVERDUE', 'RETURN_CONFIRMED'] },
        sentAt: { type: Date, default: Date.now },
        channel: { type: String, default: 'IN_APP' },
        message: String,
      },
    ],
  },
  { timestamps: true }
);

export const BookLoan = mongoose.model('BookLoan', bookLoanSchema);

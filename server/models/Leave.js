import mongoose from 'mongoose';

const leaveApplicationSchema = new mongoose.Schema(
  {
    applicationNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
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
    department: {
      type: String,
      default: 'Computer Science & Engineering',
    },
    semester: {
      type: Number,
      default: 4,
    },
    section: {
      type: String,
      default: 'CSE-A',
    },
    leaveType: {
      type: String,
      enum: ['HOSTEL_LEAVE', 'ACADEMIC_LEAVE', 'MEDICAL_LEAVE', 'EMERGENCY_LEAVE'],
      required: true,
      index: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    totalDays: {
      type: Number,
      required: true,
      min: 1,
    },
    reason: {
      type: String,
      required: true,
    },
    destinationAddress: {
      type: String,
      default: '',
    },
    emergencyContact: {
      type: String,
      default: '',
    },
    approvalRoute: {
      type: String,
      enum: ['HOSTEL_WARDEN', 'FACULTY_ADVISOR', 'HOD', 'ADMIN'],
      default: 'FACULTY_ADVISOR',
      index: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'],
      default: 'PENDING',
      index: true,
    },
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewerName: {
      type: String,
    },
    reviewedAt: {
      type: Date,
    },
    reviewerRemarks: {
      type: String,
      default: '',
    },
    auditTrail: [
      {
        action: { type: String, required: true },
        actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        actorName: String,
        timestamp: { type: Date, default: Date.now },
        remarks: String,
      },
    ],
  },
  { timestamps: true }
);

export const LeaveApplication = mongoose.model('LeaveApplication', leaveApplicationSchema);

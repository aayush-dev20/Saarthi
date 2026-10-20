import mongoose from 'mongoose';

// 1. Hostel Block
const hostelBlockSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    gender: {
      type: String,
      enum: ['BOYS', 'GIRLS', 'COED'],
      required: true,
    },
    totalFloors: {
      type: Number,
      required: true,
      default: 4,
    },
    warden: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    wardenContact: {
      name: String,
      phone: String,
      office: String,
    },
    curfewTime: {
      type: String,
      default: '09:30 PM',
    },
  },
  { timestamps: true }
);

export const HostelBlock = mongoose.model('HostelBlock', hostelBlockSchema);

// 2. Hostel Room & Bed Inventory
const hostelRoomSchema = new mongoose.Schema(
  {
    block: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HostelBlock',
      required: true,
      index: true,
    },
    roomNumber: {
      type: String,
      required: true,
      trim: true,
    },
    floor: {
      type: Number,
      required: true,
      default: 1,
    },
    capacity: {
      type: Number,
      required: true,
      default: 2,
    },
    occupancy: {
      type: Number,
      default: 0,
      min: 0,
    },
    beds: [
      {
        bedNumber: { type: String, required: true }, // e.g. "Bed-A", "Bed-B"
        student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        status: { type: String, enum: ['VACANT', 'OCCUPIED', 'RESERVED'], default: 'VACANT' },
      },
    ],
    status: {
      type: String,
      enum: ['AVAILABLE', 'FULL', 'MAINTENANCE'],
      default: 'AVAILABLE',
      index: true,
    },
  },
  { timestamps: true }
);

hostelRoomSchema.index({ block: 1, roomNumber: 1 }, { unique: true });

export const HostelRoom = mongoose.model('HostelRoom', hostelRoomSchema);

// 3. Hostel Check-In / Check-Out & Curfew Log
const hostelCheckLogSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    block: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HostelBlock',
      required: true,
    },
    roomNumber: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['NIGHT_CURFEW_CHECK', 'GATE_CHECK_OUT', 'GATE_CHECK_IN', 'LATE_ENTRY'],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['PRESENT', 'OUTING_APPROVED', 'UNAUTHORIZED_ABSENT', 'LATE_VERIFIED'],
      default: 'PRESENT',
      index: true,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    remarks: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

export const HostelCheckLog = mongoose.model('HostelCheckLog', hostelCheckLogSchema);

// 4. Hostel Maintenance Request
const maintenanceRequestSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    blockName: {
      type: String,
      required: true,
    },
    roomNumber: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ['ELECTRICAL', 'PLUMBING', 'CARPENTRY', 'AIR_CONDITIONING', 'CLEANING', 'OTHER'],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      default: 'MEDIUM',
    },
    status: {
      type: String,
      enum: ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED'],
      default: 'OPEN',
      index: true,
    },
    assignedStaff: {
      name: String,
      phone: String,
    },
    resolvedAt: Date,
    resolutionNotes: String,
  },
  { timestamps: true }
);

export const MaintenanceRequest = mongoose.model('MaintenanceRequest', maintenanceRequestSchema);

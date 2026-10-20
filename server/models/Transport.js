import mongoose from 'mongoose';

// 1. Bus Registry Schema
const busSchema = new mongoose.Schema(
  {
    busNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    registrationPlate: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    capacity: {
      type: Number,
      required: true,
      default: 45,
    },
    assignedDriver: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      licenseNumber: { type: String, default: '' },
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'ON_ROUTE', 'MAINTENANCE', 'STANDBY'],
      default: 'ACTIVE',
      index: true,
    },
    gpsTrackerInstalled: {
      type: Boolean,
      default: true,
    },
    currentLocation: {
      lastUpdated: { type: Date, default: Date.now },
      currentStop: { type: String, default: 'Campus Bus Terminal' },
    },
  },
  { timestamps: true }
);

export const Bus = mongoose.model('Bus', busSchema);

// 2. Bus Route Schema
const busRouteSchema = new mongoose.Schema(
  {
    routeNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    routeName: {
      type: String,
      required: true, // e.g. "Sector 62 Metro Shuttle via City Center"
    },
    origin: {
      type: String,
      required: true,
    },
    destination: {
      type: String,
      required: true,
      default: 'Campus Gate 1',
    },
    morningDeparture: {
      type: String,
      default: '07:30 AM',
    },
    eveningDeparture: {
      type: String,
      default: '05:15 PM',
    },
    assignedBus: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bus',
    },
    stops: [
      {
        stopName: { type: String, required: true },
        morningPickupTime: { type: String, required: true },
        eveningDropTime: { type: String, required: true },
        landmark: { type: String, default: '' },
        sequence: { type: Number, required: true },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const BusRoute = mongoose.model('BusRoute', busRouteSchema);

// 3. Weekend Outing Attendance & Gatepass Schema
const outingPassSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    destination: {
      type: String,
      required: true,
    },
    purpose: {
      type: String,
      required: true, // e.g. "Weekend Home Visit", "Medical", "City Library"
    },
    departureDate: {
      type: Date,
      required: true,
    },
    expectedReturnDate: {
      type: Date,
      required: true,
    },
    actualDepartureTime: {
      type: Date,
      default: null,
    },
    actualReturnTime: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['REQUESTED', 'APPROVED', 'CHECKED_OUT', 'RETURNED', 'LATE', 'REJECTED'],
      default: 'REQUESTED',
      index: true,
    },
    shuttleBooked: {
      type: Boolean,
      default: false,
    },
    shuttleRoute: {
      type: String,
      default: 'Route-5 (Weekend Metro Shuttle)',
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    approvalRemarks: {
      type: String,
      default: '',
    },
    parentContactVerified: {
      type: Boolean,
      default: true,
    },
    gateVerificationLog: [
      {
        action: { type: String, enum: ['EXIT_SCAN', 'ENTRY_SCAN', 'MANUAL_VERIFY'] },
        timestamp: { type: Date, default: Date.now },
        verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        guardNote: String,
      },
    ],
  },
  { timestamps: true }
);

export const OutingPass = mongoose.model('OutingPass', outingPassSchema);

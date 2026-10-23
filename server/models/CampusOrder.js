import mongoose from 'mongoose';

// 1. Canteen Catalogue Item Schema
const canteenItemSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: ['Breakfast', 'Meals & Thali', 'Snacks', 'Beverages', 'Bakery & Sweets'],
      required: true,
      index: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      default: '',
    },
    imageUrl: {
      type: String,
      default: '',
    },
    isAvailable: {
      type: Boolean,
      default: true,
      index: true,
    },
    stockQuantity: {
      type: Number,
      default: 50,
      min: 0,
    },
    preparationTimeMinutes: {
      type: Number,
      default: 10,
    },
    isVegetarian: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const CanteenItem = mongoose.model('CanteenItem', canteenItemSchema);

// 2. Campus Order Schema
const campusOrderSchema = new mongoose.Schema(
  {
    orderNumber: {
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
    items: [
      {
        item: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'CanteenItem',
          required: true,
        },
        code: String,
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true, min: 1 },
        subtotal: { type: Number, required: true },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'COMPLETED', 'CANCELLED'],
      default: 'PENDING',
      index: true,
    },
    pickupOtp: {
      type: String,
      required: true,
    },
    deliveryLocation: {
      type: String,
      default: 'Main Canteen Counter',
    },
    paymentMethod: {
      type: String,
      enum: ['PAY_AT_COUNTER', 'CAMPUS_WALLET'],
      default: 'PAY_AT_COUNTER',
    },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'PAID', 'REFUNDED'],
      default: 'PENDING',
    },
    notes: {
      type: String,
      default: '',
    },
    cancellationReason: {
      type: String,
      default: '',
    },
    statusHistory: [
      {
        status: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        note: String,
      },
    ],
  },
  { timestamps: true }
);

export const CampusOrder = mongoose.model('CampusOrder', campusOrderSchema);

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    idNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['student', 'faculty', 'admin', 'transport_manager', 'hostel_warden'],
      default: 'student',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'pending', 'rejected'],
      default: 'active',
      index: true,
    },
    rollNumber: {
      type: String,
      trim: true,
      default: '',
    },
    registrationNumber: {
      type: String,
      trim: true,
      default: '',
    },
    degree: {
      type: String,
      default: 'B.Tech',
    },
    branch: {
      type: String,
      default: 'Computer Science & Engineering',
    },
    academicYear: {
      type: String,
      default: '2nd Year',
    },
    subjectsTaught: [
      {
        type: String,
        trim: true,
      },
    ],
    approvalNotes: {
      type: String,
      default: '',
    },
    department: {
      type: String,
      default: 'Computer Science & Engineering',
    },
    designation: {
      type: String,
      default: '',
    },
    semester: {
      type: Number,
      default: 4,
    },
    section: {
      type: String,
      default: 'CSE-A',
    },
    phone: {
      type: String,
      default: '+91 98765 43210',
    },
    emergencyContact: {
      name: { type: String, default: 'Parent / Guardian' },
      phone: { type: String, default: '+91 98765 00000' },
      relation: { type: String, default: 'Parent' },
    },
    hostelInfo: {
      block: { type: String, default: 'Aravali Boys Hostel' },
      roomNumber: { type: String, default: 'B-204' },
      bedNumber: { type: String, default: 'Bed-1' },
      isResident: { type: Boolean, default: true },
    },
    transportInfo: {
      isBusUser: { type: Boolean, default: true },
      busNumber: { type: String, default: 'BUS-12' },
      routeNumber: { type: String, default: 'Route-5 (Metro Shuttle)' },
      stopName: { type: String, default: 'Sector 62 Metro Station' },
    },
    avatar: {
      type: String,
      default: '',
    },
    college: {
      type: String,
      default: 'Indo Global College of Engineering',
    },
    resetPasswordToken: {
      type: String,
      default: null,
    },
    resetPasswordExpires: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Hash password before saving if modified
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Exclude password from toJSON
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

export const User = mongoose.model('User', userSchema);

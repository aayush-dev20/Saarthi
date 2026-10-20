import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'saarthi_super_secure_jwt_secret_key_2026_academic_production';

let io = null;

export function initSocketIO(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Socket authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
      if (!token) {
        return next(new Error('Authentication token required for Socket connection'));
      }

      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid socket credentials'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.user;
    console.log(`🔌 [Socket.IO] Connected: ${user.name} (${user.role} - ${user.idNumber})`);

    // Join private room
    socket.join(`user:${user._id.toString()}`);
    socket.join(`role:${user.role}`);

    // Faculty room for live attendance monitoring
    socket.on('join_attendance_session', (sessionId) => {
      if (user.role === 'faculty' || user.role === 'admin') {
        socket.join(`session:${sessionId}`);
        console.log(`📡 Faculty ${user.name} subscribed to session room: session:${sessionId}`);
      }
    });

    socket.on('leave_attendance_session', (sessionId) => {
      socket.leave(`session:${sessionId}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 [Socket.IO] Disconnected: ${user.name}`);
    });
  });

  return io;
}

export function getIO() {
  return io;
}

export function emitAttendanceRecorded(sessionId, studentData) {
  if (!io) return;
  io.to(`session:${sessionId}`).emit('attendance:recorded', {
    sessionId,
    student: studentData,
    timestamp: new Date().toISOString(),
  });
}

export function emitMarksUpdated(studentId, markData) {
  if (!io) return;
  io.to(`user:${studentId}`).emit('marks:updated', markData);
}

export function emitGapUpdated(studentId, gapData) {
  if (!io) return;
  io.to(`user:${studentId}`).emit('gap:updated', gapData);
}

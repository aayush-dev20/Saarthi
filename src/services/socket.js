import { io } from 'socket.io-client';
import { getToken } from './api';

let socket = null;

export function getSocket() {
  if (!socket) {
    const token = getToken();
    socket = io('/', {
      auth: { token },
      autoConnect: true,
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('⚡ [Socket Client] Connected with ID:', socket.id);
    });

    socket.on('connect_error', (err) => {
      console.warn('⚠️ [Socket Client] Connection warning:', err.message);
    });
  }
  return socket;
}

export function reconnectSocketWithToken(token) {
  if (socket) {
    socket.disconnect();
  }
  socket = io('/', {
    auth: { token },
    autoConnect: true,
    transports: ['websocket', 'polling'],
  });
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

// Attendance session subscription
export function joinAttendanceSession(sessionId, onAttendanceRecorded) {
  const s = getSocket();
  s.emit('join_attendance_session', sessionId);

  if (onAttendanceRecorded) {
    s.on('attendance:recorded', onAttendanceRecorded);
  }

  return () => {
    s.emit('leave_attendance_session', sessionId);
    if (onAttendanceRecorded) {
      s.off('attendance:recorded', onAttendanceRecorded);
    }
  };
}

// Student real-time grade & gap alerts
export function subscribeToStudentLiveUpdates({ onMarksUpdated, onGapUpdated }) {
  const s = getSocket();

  if (onMarksUpdated) {
    s.on('marks:updated', onMarksUpdated);
  }

  if (onGapUpdated) {
    s.on('gap:updated', onGapUpdated);
  }

  return () => {
    if (onMarksUpdated) s.off('marks:updated', onMarksUpdated);
    if (onGapUpdated) s.off('gap:updated', onGapUpdated);
  };
}

export default {
  getSocket,
  reconnectSocketWithToken,
  disconnectSocket,
  joinAttendanceSession,
  subscribeToStudentLiveUpdates,
};

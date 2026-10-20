// Saarthi Unified API Client
const BASE_URL = '/api';

export const TOKEN_KEY = 'saarthi_auth_token';
export const USER_KEY = 'saarthi_current_user';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthSession(token, user) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event('saarthi_auth_change'));
}

export function clearAuthSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  window.dispatchEvent(new Event('saarthi_auth_change'));
}

async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const config = {
    ...options,
    headers,
  };

  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Health
  checkHealth: () => request('/health'),

  // Authentication
  login: async (idNumber, password) => {
    const res = await request('/auth/login', {
      method: 'POST',
      body: { idNumber, password },
    });
    if (res.token && res.user) {
      setAuthSession(res.token, res.user);
    }
    return res;
  },

  register: async (payload) => {
    const res = await request('/auth/register', {
      method: 'POST',
      body: payload,
    });
    if (res.token && res.user) {
      setAuthSession(res.token, res.user);
    }
    return res;
  },

  getMe: () => request('/auth/me'),
  forgotPassword: (identifier) => request('/auth/forgot-password', { method: 'POST', body: { identifier } }),
  resetPassword: (resetToken, newPassword) => request('/auth/reset-password', { method: 'POST', body: { resetToken, newPassword } }),

  // Student Endpoints
  getStudentDashboard: () => request('/student/dashboard'),
  getStudentAcademics: () => request('/student/academics'),
  getStudentAttendance: () => request('/student/attendance'),
  verifyStudentAttendance: (payload) => request('/student/attendance/verify', { method: 'POST', body: payload }),
  getStudentAssignments: () => request('/student/assignments'),
  submitStudentAssignment: (id, payload = {}) => request(`/student/assignments/${id}/submit`, { method: 'POST', body: payload }),
  getLearningGaps: () => request('/student/learning-gaps'),
  getDiagnosticQuestions: (subjectCode = 'MATH-202') => request(`/student/assessment?subjectCode=${subjectCode}`),
  submitDiagnosticAssessment: (payload) => request('/student/assessment/submit', { method: 'POST', body: payload }),
  getPracticeModule: (setId = 'ps-1') => request(`/student/practice?setId=${setId}`),
  submitPracticeAttempt: (payload) => request('/student/practice/submit', { method: 'POST', body: payload }),
  getProgressReports: () => request('/student/progress'),
  getLeaderboard: () => request('/student/leaderboard'),
  getLearningResource: (conceptCode) => request(`/student/learning-resources/${conceptCode}`),
  completeLearningResource: (conceptCode, payload) => request(`/student/learning-resources/${conceptCode}/complete`, { method: 'POST', body: payload }),

  // Faculty Endpoints
  getFacultyDashboard: () => request('/faculty/dashboard'),
  startFacultySession: (payload) => request('/faculty/attendance/session/start', { method: 'POST', body: payload }),
  getFacultySessionToken: (sessionId) => request(`/faculty/attendance/session/${sessionId}/token`),
  closeFacultySession: (sessionId) => request(`/faculty/attendance/session/${sessionId}/close`, { method: 'POST' }),
  getFacultyLiveSession: (sessionId) => request(`/faculty/attendance/session/${sessionId}/live`),
  getFacultyAcademics: () => request('/faculty/academics'),
  updateFacultyMarks: (payload) => request('/faculty/marks', { method: 'PUT', body: payload }),
  getFacultyAnalytics: () => request('/faculty/analytics'),
  getFlaggedAttendance: (sessionId) => request(`/faculty/attendance/session/${sessionId}/flagged`),
  facultyOverrideAttendance: (payload) => request('/faculty/attendance/override', { method: 'POST', body: payload }),
  getFacultyAssignments: () => request('/faculty/assignments'),
  createFacultyAssignment: (payload) => request('/faculty/assignments', { method: 'POST', body: payload }),
  getFacultyAssignmentSubmissions: (id) => request(`/faculty/assignments/${id}/submissions`),
  gradeFacultySubmission: (id, payload) => request(`/faculty/assignments/${id}/grade`, { method: 'POST', body: payload }),

  // Administrator Endpoints
  getAdminDashboard: () => request('/admin/dashboard'),
  getAdminUsers: (params = '') => request(`/admin/users${params ? `?${params}` : ''}`),
  updateUserRole: (id, role) => request(`/admin/users/${id}/role`, { method: 'PUT', body: { role } }),
  getAdminPendingUsers: () => request('/admin/pending-users'),
  approveAdminUser: (id, notes) => request(`/admin/users/${id}/approve`, { method: 'PUT', body: { notes } }),
  rejectAdminUser: (id, reason) => request(`/admin/users/${id}/reject`, { method: 'PUT', body: { reason } }),
  getAdminTimetables: () => request('/admin/timetables'),
  getAdminAuditLogs: () => request('/admin/audit-logs'),

  // Transport Endpoints
  getTransportDashboard: () => request('/transport/dashboard'),
  getBuses: () => request('/transport/buses'),
  updateBusStatus: (id, payload) => request(`/transport/buses/${id}/status`, { method: 'PUT', body: payload }),
  getBusRoutes: () => request('/transport/routes'),
  getTransportOutings: () => request('/transport/outings'),
  updateOutingShuttle: (id, payload) => request(`/transport/outings/${id}/shuttle`, { method: 'PUT', body: payload }),

  // Hostel Endpoints
  getHostelDashboard: () => request('/hostel/dashboard'),
  getHostelRooms: (params = '') => request(`/hostel/rooms${params ? `?${params}` : ''}`),
  allocateHostelBed: (payload) => request('/hostel/allocate', { method: 'POST', body: payload }),
  getCurfewLogs: () => request('/hostel/curfew-logs'),
  recordCurfewCheck: (payload) => request('/hostel/curfew-check', { method: 'POST', body: payload }),
  getHostelOutings: () => request('/hostel/outings'),
  submitStudentOuting: (payload) => request('/hostel/outings', { method: 'POST', body: payload }),
  updateOutingStatus: (id, payload) => request(`/hostel/outings/${id}`, { method: 'PUT', body: payload }),
  getMaintenanceTickets: () => request('/hostel/maintenance'),
  submitMaintenanceTicket: (payload) => request('/hostel/maintenance', { method: 'POST', body: payload }),
  updateMaintenanceTicket: (id, payload) => request(`/hostel/maintenance/${id}`, { method: 'PUT', body: payload }),
};

export default api;

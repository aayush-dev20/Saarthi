import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';
import LandingPage from './pages/landing/LandingPage';

// Dedicated Public Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import PendingStatusPage from './pages/auth/PendingStatusPage';

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard';
import StudentAcademics from './pages/student/StudentAcademics';
import StudentAttendance from './pages/student/StudentAttendance';
import StudentAssignments from './pages/student/StudentAssignments';
import LearningGaps from './pages/student/LearningGaps';
import DiagnosticAssessment from './pages/student/DiagnosticAssessment';
import PersonalizedPractice from './pages/student/PersonalizedPractice';
import ProgressReports from './pages/student/ProgressReports';
import StudentLeaderboard from './pages/student/StudentLeaderboard';
import StudentCampusPass from './pages/student/StudentCampusPass';
import StudentLibrary from './pages/student/StudentLibrary';
import StudentLeave from './pages/student/StudentLeave';
import StudentCanteen from './pages/student/StudentCanteen';

// Teacher Pages
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import TeacherAnalytics from './pages/teacher/TeacherAnalytics';
import TeacherAcademics from './pages/teacher/TeacherAcademics';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminAudit from './pages/admin/AdminAudit';

// Transport Pages
import TransportDashboard from './pages/transport/TransportDashboard';
import OutingAttendance from './pages/transport/OutingAttendance';

// Hostel Pages
import HostelDashboard from './pages/hostel/HostelDashboard';
import HostelRooms from './pages/hostel/HostelRooms';
import HostelOutingManager from './pages/hostel/HostelOutingManager';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Pages */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/pending-status" element={<PendingStatusPage />} />

          {/* Protected Student Experience */}
          <Route element={<ProtectedRoute allowedRoles={['student', 'admin']} />}>
            <Route path="/student" element={<AppLayout />}>
              <Route index element={<Navigate to="/student/dashboard" replace />} />
              <Route path="dashboard" element={<StudentDashboard />} />
              <Route path="academics" element={<StudentAcademics />} />
              <Route path="attendance" element={<StudentAttendance />} />
              <Route path="assignments" element={<StudentAssignments />} />
              <Route path="learning-gaps" element={<LearningGaps />} />
              <Route path="assessment" element={<DiagnosticAssessment />} />
              <Route path="practice" element={<PersonalizedPractice />} />
              <Route path="progress" element={<ProgressReports />} />
              <Route path="leaderboard" element={<StudentLeaderboard />} />
              <Route path="campus-pass" element={<StudentCampusPass />} />
              <Route path="library" element={<StudentLibrary />} />
              <Route path="leave" element={<StudentLeave />} />
              <Route path="canteen" element={<StudentCanteen />} />
            </Route>
          </Route>

          {/* Protected Teacher Experience */}
          <Route element={<ProtectedRoute allowedRoles={['faculty', 'admin']} />}>
            <Route path="/teacher" element={<AppLayout />}>
              <Route index element={<Navigate to="/teacher/dashboard" replace />} />
              <Route path="dashboard" element={<TeacherDashboard />} />
              <Route path="analytics" element={<TeacherAnalytics />} />
              <Route path="academics" element={<TeacherAcademics />} />
            </Route>
          </Route>

          {/* Protected Admin Experience */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin" element={<AppLayout />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="audit" element={<AdminAudit />} />
            </Route>
          </Route>

          {/* Protected Transport Experience */}
          <Route element={<ProtectedRoute allowedRoles={['transport_manager', 'admin']} />}>
            <Route path="/transport" element={<AppLayout />}>
              <Route index element={<Navigate to="/transport/dashboard" replace />} />
              <Route path="dashboard" element={<TransportDashboard />} />
              <Route path="outing-attendance" element={<OutingAttendance />} />
            </Route>
          </Route>

          {/* Protected Hostel Warden Experience */}
          <Route element={<ProtectedRoute allowedRoles={['hostel_warden', 'admin']} />}>
            <Route path="/hostel" element={<AppLayout />}>
              <Route index element={<Navigate to="/hostel/dashboard" replace />} />
              <Route path="dashboard" element={<HostelDashboard />} />
              <Route path="rooms" element={<HostelRooms />} />
              <Route path="outing-manager" element={<HostelOutingManager />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
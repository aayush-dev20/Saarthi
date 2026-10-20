import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute({ allowedRoles }) {
  const { user, isAuthenticated, isPending, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
        <p className="text-xs font-semibold text-slate-500">Verifying Institutional Session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (isPending || user?.status === 'pending') {
    return <Navigate to="/pending-status" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // Unauthorized access prevention — redirect to proper portal
    if (user?.role === 'faculty') {
      return <Navigate to="/teacher/dashboard" replace />;
    } else if (user?.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (user?.role === 'transport_manager') {
      return <Navigate to="/transport/dashboard" replace />;
    } else if (user?.role === 'hostel_warden') {
      return <Navigate to="/hostel/dashboard" replace />;
    } else {
      return <Navigate to="/student/dashboard" replace />;
    }
  }

  return <Outlet />;
}

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Compass,
  Clock,
  ShieldCheck,
  RefreshCw,
  LogOut,
  Building2,
  GraduationCap,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

export default function PendingStatusPage() {
  const navigate = useNavigate();
  const { user, refreshUser, logout } = useAuth();
  const [checking, setChecking] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  const handleCheckStatus = async () => {
    setChecking(true);
    setStatusMessage(null);
    try {
      const res = await api.getMe();
      if (res.user?.status === 'active') {
        await refreshUser();
        setStatusMessage('Your account has been approved! Redirecting to your dashboard...');
        setTimeout(() => {
          if (res.user.role === 'faculty') {
            navigate('/teacher/dashboard', { replace: true });
          } else if (res.user.role === 'admin') {
            navigate('/admin/dashboard', { replace: true });
          } else {
            navigate('/student/dashboard', { replace: true });
          }
        }, 1500);
      } else {
        setStatusMessage('Status: Verification still pending with the Academic Administrator.');
      }
    } catch (err) {
      setStatusMessage('Unable to connect to verification server. Please try again.');
    } finally {
      setChecking(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center gap-2.5 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-700 flex items-center justify-center text-white shadow-xs">
            <Compass className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-slate-900">
            Saarthi
          </span>
        </div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          Account Verification Status
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Indo Global College of Engineering • Academic Registrar
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-8 px-6 shadow-xs border border-slate-200/80 rounded-2xl sm:px-10">
          {/* Status Badge */}
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 mb-6 flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0 text-amber-700">
              <Clock className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-amber-900">Registration Awaiting Approval</h3>
              <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                Your profile has been safely saved in the university database. In compliance with institution security guidelines, new teacher accounts and non-roster student registrations require authorization by the Academic Administration Office before full portal access is granted.
              </p>
            </div>
          </div>

          {statusMessage && (
            <div className="mb-4 p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Submitted Enrolment Summary Card */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2.5 text-xs mb-6">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Registered Profile Details
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Full Name</span>
              <span className="font-semibold text-slate-800">{user?.name || 'Registered User'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Registered ID</span>
              <span className="font-mono font-semibold text-slate-800">{user?.idNumber}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Requested Role</span>
              <span className="capitalize font-semibold text-indigo-700">{user?.role}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Department / Branch</span>
              <span className="font-semibold text-slate-800">{user?.department || user?.branch}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Email Address</span>
              <span className="font-semibold text-slate-800">{user?.email}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={handleCheckStatus}
              disabled={checking}
              className="w-full sm:flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
              <span>{checking ? 'Checking Registry...' : 'Check Approval Status'}</span>
            </button>

            <button
              onClick={handleLogout}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

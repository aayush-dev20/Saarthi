import React from 'react';
import { Menu, Search, LogOut, QrCode, Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Topbar({ onMenuClick, onOpenQR }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isStudent = user?.role === 'student';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleDisplayName = (r) => {
    if (r === 'faculty') return 'Faculty Member';
    if (r === 'admin') return 'Dean & Administrator';
    if (r === 'transport_manager') return 'Transport Fleet Manager';
    if (r === 'hostel_warden') return 'Chief Hostel Warden';
    return 'Registered Student';
  };

  const getRoleBadgeColor = (r) => {
    if (r === 'faculty') return 'bg-purple-50 text-purple-700 border-purple-200';
    if (r === 'admin') return 'bg-rose-50 text-rose-700 border-rose-200';
    if (r === 'transport_manager') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (r === 'hostel_warden') return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-indigo-50 text-indigo-700 border-indigo-200';
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-slate-200">
      <div className="flex items-center justify-between px-4 sm:px-6 h-16">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="hidden sm:flex items-center gap-2 bg-slate-100/80 px-3 py-1.5 rounded-lg border border-slate-200/60 w-64 text-slate-400 text-sm">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search courses, attendance, syllabus..."
              className="bg-transparent border-none outline-none text-slate-700 placeholder-slate-400 w-full text-xs"
              readOnly
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick QR Attendance Trigger */}
          {onOpenQR && (user?.role === 'student' || user?.role === 'faculty') && (
            <button
              onClick={onOpenQR}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors"
              title={isStudent ? 'Scan QR Code for Attendance' : 'Generate Class QR Code'}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>{isStudent ? 'Scan QR' : 'Class QR'}</span>
            </button>
          )}

          {/* Institutional Affiliation Badge */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium">Indo Global (IKGPTU)</span>
          </div>

          {/* User Role Badge */}
          <span className={`hidden sm:inline-block px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${getRoleBadgeColor(user?.role)}`}>
            {getRoleDisplayName(user?.role)}
          </span>

          {/* User Info */}
          <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-semibold text-xs flex items-center justify-center shadow-xs">
              {user?.avatar || (user?.name ? user.name[0] : 'U')}
            </div>
            <div className="hidden md:block text-left">
              <div className="text-xs font-semibold text-slate-900 leading-tight">
                {user?.name}
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                {user?.idNumber || user?.rollNumber}
              </div>
            </div>

            {/* Secure Sign Out Button */}
            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1"
              title="Sign Out of Session"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

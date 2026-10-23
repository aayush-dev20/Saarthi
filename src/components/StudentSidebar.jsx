import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  GraduationCap,
  CalendarCheck,
  FileCheck2,
  GitFork,
  BookOpenCheck,
  TrendingUp,
  BrainCircuit,
  Compass,
  LogOut,
  X,
  Trophy,
  Bus,
  BookOpen,
  FileText,
  UtensilsCrossed,
} from 'lucide-react';

const studentNavItems = [
  { to: '/student/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { to: '/student/academics', icon: GraduationCap, label: 'My Academics' },
  { to: '/student/attendance', icon: CalendarCheck, label: 'Attendance' },
  { to: '/student/assignments', icon: FileCheck2, label: 'Assignments' },
  { to: '/student/learning-gaps', icon: GitFork, label: 'Learning Gaps', badge: 'Core' },
  { to: '/student/assessment', icon: BrainCircuit, label: 'Diagnostic Test' },
  { to: '/student/practice', icon: BookOpenCheck, label: 'Practice Sets' },
  { to: '/student/progress', icon: TrendingUp, label: 'Progress Reports' },
  { to: '/student/leaderboard', icon: Trophy, label: 'Leaderboard', badge: 'Rank' },
  { to: '/student/library', icon: BookOpen, label: 'Digital Library', badge: 'Pass' },
  { to: '/student/leave', icon: FileText, label: 'Leave Applications' },
  { to: '/student/canteen', icon: UtensilsCrossed, label: 'Campus Canteen', badge: 'Live' },
  { to: '/student/campus-pass', icon: Bus, label: 'Transport & Hostel' },
];

export default function StudentSidebar({ isOpen, onClose }) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 w-64 bg-white border-r border-slate-200 z-50 flex flex-col transition-transform duration-200 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-100">
          <NavLink to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-700 flex items-center justify-center text-white shadow-xs">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg text-slate-900 tracking-tight block leading-tight">
                Saarthi
              </span>
              <span className="text-[10px] text-indigo-600 font-semibold tracking-wider uppercase block">
                Student Portal
              </span>
            </div>
          </NavLink>

          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 py-4 px-3 overflow-y-auto space-y-1">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Academic & Growth
          </div>

          {studentNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-100 text-indigo-800">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Learning Gap Callout Widget in Sidebar */}
        <div className="p-3 mx-3 mb-3 bg-amber-50/70 rounded-xl border border-amber-200/70 text-xs">
          <div className="font-semibold text-amber-900 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            1 Prerequisite Gap
          </div>
          <p className="text-amber-800/90 text-[11px] mt-1 leading-snug">
            Integration gap detected in Engineering Mathematics.
          </p>
          <NavLink
            to="/student/learning-gaps"
            onClick={onClose}
            className="mt-2 inline-block text-[11px] font-bold text-amber-900 hover:underline"
          >
            Inspect Gap Map →
          </NavLink>
        </div>

        {/* Logout / Switch */}
        <div className="p-3 border-t border-slate-100">
          <NavLink
            to="/"
            className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out / Landing</span>
          </NavLink>
        </div>
      </aside>
    </>
  );
}

import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  BarChart3,
  Users2,
  Compass,
  LogOut,
  X,
  AlertTriangle,
} from 'lucide-react';

const teacherNavItems = [
  { to: '/teacher/dashboard', icon: LayoutDashboard, label: 'Class Overview' },
  { to: '/teacher/analytics', icon: BarChart3, label: 'Learning Analytics', badge: 'Gaps' },
  { to: '/teacher/academics', icon: Users2, label: 'Academic Management' },
];

export default function TeacherSidebar({ isOpen, onClose }) {
  return (
    <>
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
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-100">
          <NavLink to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-700 to-blue-800 flex items-center justify-center text-white shadow-xs">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg text-slate-900 tracking-tight block leading-tight">
                Saarthi
              </span>
              <span className="text-[10px] text-blue-700 font-semibold tracking-wider uppercase block">
                Faculty Portal
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

        <div className="flex-1 py-4 px-3 overflow-y-auto space-y-1">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Teaching & Insights
          </div>

          {teacherNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-800 font-semibold shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-900">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Priority Teacher Notice */}
        <div className="p-3 mx-3 mb-3 bg-indigo-50/70 rounded-xl border border-indigo-200/70 text-xs">
          <div className="font-semibold text-indigo-900 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-indigo-600" />
            Intervention Tip
          </div>
          <p className="text-indigo-950 text-[11px] mt-1 leading-snug">
            28 students struggling with Integration fundamentals before Fourier Series.
          </p>
          <NavLink
            to="/teacher/analytics"
            onClick={onClose}
            className="mt-2 inline-block text-[11px] font-bold text-indigo-700 hover:underline"
          >
            View Suggested Interventions →
          </NavLink>
        </div>

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

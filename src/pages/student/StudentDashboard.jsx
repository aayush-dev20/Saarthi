import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  CalendarCheck,
  GraduationCap,
  FileCheck2,
  GitFork,
  ArrowRight,
  Clock,
  Sparkles,
  AlertTriangle,
  QrCode,
  BookOpen,
  Loader2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import StatCard from '../../components/StatCard';
import Badge from '../../components/Badge';
import QRScannerModal from '../../components/QRScannerModal';
import { api } from '../../services/api';
import { subscribeToStudentLiveUpdates } from '../../services/socket';
import { performanceTrends } from '../../data/mockData';

export default function StudentDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const fetchDashboard = async () => {
    try {
      const res = await api.getStudentDashboard();
      if (res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.warn('Failed to fetch live student dashboard:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();

    // Live Socket.IO updates for marks & learning gaps
    const unsubscribe = subscribeToStudentLiveUpdates({
      onMarksUpdated: () => fetchDashboard(),
      onGapUpdated: () => fetchDashboard(),
    });

    const handleAttendanceChange = () => fetchDashboard();
    window.addEventListener('saarthi_attendance_updated', handleAttendanceChange);

    return () => {
      if (unsubscribe) unsubscribe();
      window.removeEventListener('saarthi_attendance_updated', handleAttendanceChange);
    };
  }, []);

  const student = data?.student || {
    id: 'S1001',
    name: 'Aayush Sharma',
    section: 'CSE-A',
    semester: 4,
    overallAttendance: 100,
    averageMarks: 81.5,
    pendingAssignmentsCount: 1,
    conceptsMasteredCount: 5,
    totalConceptsCount: 7,
  };

  const subjects = data?.subjects || [];
  const hasGapAlert = data?.hasGapAlert ?? true;

  return (
    <div className="space-y-6">
      {/* Top Banner / Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Semester {student.semester} • B.Tech CSE • Live DB</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Good morning, {student.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Indo Global College • Roll No: {student.id} • Sec {student.section}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <QrCode className="w-4 h-4 text-white" />
            <span>Scan Classroom QR</span>
          </button>

          <NavLink
            to="/student/attendance"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
          >
            <span>Log</span>
          </NavLink>

          <NavLink
            to="/student/learning-gaps"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
          >
            <GitFork className="w-4 h-4" />
            <span>Learning Gaps</span>
          </NavLink>
        </div>
      </div>

      {/* Signature Alert: Prerequisite Gap Alert Banner */}
      {hasGapAlert && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-amber-100 text-amber-800 shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-amber-950">
                  Action Recommended: Prerequisite Gap Detected
                </span>
                <Badge variant="warning">Engineering Math IV</Badge>
              </div>
              <p className="text-xs text-amber-800/90 mt-1 max-w-2xl leading-relaxed">
                Assessment evidence indicates a bottleneck in <strong>Integration Fundamentals</strong>, which is currently hindering your mastery of Differential Equations.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <NavLink
              to="/student/assessment"
              className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <span>Take Diagnostic</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </NavLink>
            <NavLink
              to="/student/learning-gaps"
              className="px-3 py-2 rounded-xl bg-white hover:bg-amber-50 text-amber-900 border border-amber-300 text-xs font-semibold transition-colors"
            >
              View Recovery Plan
            </NavLink>
          </div>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Overall Attendance"
          value={`${student.overallAttendance}%`}
          subtitle="Above 75% regulatory mandate"
          trend={+1.4}
          icon={CalendarCheck}
          color="emerald"
        />

        <StatCard
          title="Average Score"
          value={`${student.averageMarks}%`}
          subtitle="Internal & Semester Aggregate"
          trend={+4.2}
          icon={GraduationCap}
          color="indigo"
        />

        <StatCard
          title="Pending Tasks"
          value={student.pendingAssignmentsCount}
          subtitle="Assignments due this week"
          icon={FileCheck2}
          color="amber"
        />

        <StatCard
          title="Concept Mastery"
          value={`${student.conceptsMasteredCount} / ${student.totalConceptsCount}`}
          subtitle="Syllabus prerequisite progress"
          trend={+12}
          icon={GitFork}
          color="blue"
        />
      </div>

      {/* Charts & Subject Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Trend Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Academic Score Progression</h2>
              <p className="text-xs text-slate-500">Student vs. Class Average across monthly evaluations</p>
            </div>
            <Badge variant="primary">Sem 4 Progress</Badge>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis domain={[50, 100]} stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="studentScore"
                  name="My Score"
                  stroke="#4f46e5"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#4f46e5' }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="classAverage"
                  name="Class Average"
                  stroke="#94a3b8"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 3, fill: '#94a3b8' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Continue Learning Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Continue Learning
              </span>
              <BookOpen className="w-4 h-4 text-indigo-600" />
            </div>

            <h3 className="font-bold text-sm text-slate-900">
              Integration by Parts Recovery Set
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              4 targeted conceptual problems to fix your integration calculation speed.
            </p>

            <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Objective:</span>
                <span className="font-semibold text-slate-900">∫ u dv Formula Mastery</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Est. Time:</span>
                <span className="font-semibold text-slate-900">15 mins</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Prerequisite for:</span>
                <span className="font-semibold text-indigo-600">Differential Equations</span>
              </div>
            </div>
          </div>

          <NavLink
            to="/student/practice"
            className="mt-5 w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs text-center shadow-xs transition-colors flex items-center justify-center gap-2"
          >
            <span>Resume Practice</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </NavLink>
        </div>
      </div>

      {/* Subject Progress Cards & Upcoming Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subject-wise Cards */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Course Academics & Attendance</h2>
            <NavLink to="/student/academics" className="text-xs font-semibold text-indigo-600 hover:underline">
              View Detailed Marksheet →
            </NavLink>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {subjects.map((subj) => (
              <div
                key={subj.id || subj.code}
                className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 font-semibold">{subj.code}</span>
                    <h3 className="text-xs font-bold text-slate-900 leading-snug line-clamp-1">{subj.name}</h3>
                  </div>
                  <Badge variant={subj.status === 'Excelling' ? 'success' : subj.status === 'Needs Attention' ? 'warning' : 'default'}>
                    {subj.status}
                  </Badge>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-50 p-2 rounded-xl">
                    <span className="text-[10px] text-slate-500 block">Attendance</span>
                    <span className="font-bold text-slate-900">{subj.attendance}%</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl">
                    <span className="text-[10px] text-slate-500 block">Marks</span>
                    <span className="font-bold text-slate-900">{subj.totalMarks} / 100</span>
                  </div>
                </div>

                {subj.gapAlert && (
                  <div className="mt-2.5 text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200/60 flex items-center gap-1.5">
                    <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                    <span className="truncate">{subj.gapAlert}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Assignments */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900">Pending Assignments</h2>
            <NavLink to="/student/assignments" className="text-xs font-semibold text-indigo-600 hover:underline">
              All Tasks →
            </NavLink>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 rounded-xl border border-slate-200/80 hover:border-indigo-300 transition-colors bg-slate-50/50">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-indigo-600">MATH-202</span>
                <Badge variant="danger">High</Badge>
              </div>
              <h4 className="text-xs font-bold text-slate-900 mt-1 line-clamp-1">
                Eigenvalue Applications & State Space
              </h4>
              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  Due in 2 days
                </span>
                <NavLink to="/student/assignments" className="font-semibold text-indigo-600 hover:underline">
                  Submit →
                </NavLink>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* GPS-Based Classroom Attendance Scanner Modal */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onAttendanceMarked={() => fetchDashboard()}
      />
    </div>
  );
}

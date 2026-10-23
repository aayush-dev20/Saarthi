import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Users2,
  CalendarCheck,
  GraduationCap,
  AlertTriangle,
  QrCode,
  ArrowRight,
  Search,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import StatCard from '../../components/StatCard';
import Badge from '../../components/Badge';
import QRGeneratorModal from '../../components/QRGeneratorModal';
import { api } from '../../services/api';

export default function TeacherDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [students, setStudents] = useState([]);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchFacultyDashboard = async () => {
    try {
      const res = await api.getFacultyDashboard();
      if (res.data) {
        setDashboardData(res.data);
        if (res.data.students) setStudents(res.data.students);
      }
    } catch (err) {
      console.warn('Failed to fetch live faculty dashboard:', err.message);
    }
  };

  useEffect(() => {
    fetchFacultyDashboard();
  }, []);

  const faculty = dashboardData?.faculty || {
    id: 'T2001',
    name: 'Dr. Vandana Rao',
    department: 'Department of Applied Mathematics',
    designation: 'Associate Professor',
    totalStudents: 6,
    averageClassScore: 78.4,
    classAttendanceRate: 91.2,
    flaggedGapsCount: 1,
  };

  const gradeDistribution = dashboardData?.gradeDistribution || [
    { grade: 'A+ (90-100)', count: 2 },
    { grade: 'A (80-89)', count: 2 },
    { grade: 'B+ (70-79)', count: 1 },
    { grade: 'B (60-69)', count: 0 },
    { grade: 'C (50-59)', count: 1 },
  ];

  const filteredStudents = students.filter(
    (s) =>
      (s.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.rollNo || '').includes(searchQuery)
  );

  const flaggedGapsSummary = dashboardData?.flaggedGapsSummary || [
    {
      subject: 'Engineering Math IV',
      concept: 'Integration by Parts (Prerequisite)',
      studentsAffected: faculty.flaggedGapsCount || 1,
      severity: 'High Priority',
    },
    {
      subject: 'Engineering Math IV',
      concept: 'Differential Operators & Roots',
      studentsAffected: 2,
      severity: 'Moderate',
    },
    {
      subject: 'Engineering Math IV',
      concept: 'Eigenvalue Calculation',
      studentsAffected: 1,
      severity: 'Moderate',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Faculty Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Faculty Command Center • {faculty.department}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Welcome, {faculty.name}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Indo Global College • {faculty.designation} • Core Course: Engineering Mathematics IV
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => setIsQrOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <QrCode className="w-4 h-4" />
            <span>Broadcast Lecture QR</span>
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Enrolled Students"
          value={faculty.totalStudents}
          subtitle="Section CSE-A Active Roster"
          icon={Users2}
          color="indigo"
        />

        <StatCard
          title="Class Average"
          value={`${faculty.averageClassScore}%`}
          subtitle="Combined Internal & Exam Marks"
          trend={+2.1}
          icon={GraduationCap}
          color="emerald"
        />

        <StatCard
          title="Lecture Attendance"
          value={`${faculty.classAttendanceRate}%`}
          subtitle="Verified via QR session tokens"
          icon={CalendarCheck}
          color="blue"
        />

        <StatCard
          title="Flagged Prerequisite Gaps"
          value={`${faculty.flaggedGapsCount} Students`}
          subtitle="Identified via diagnostic screening"
          icon={AlertTriangle}
          color="amber"
        />
      </div>

      {/* Flagged Concepts Summary Banner */}
      <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-sm font-bold text-amber-950 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Highest Impact Prerequisite Bottlenecks in Class
            </h2>
            <p className="text-xs text-amber-800/90 mt-0.5">
              These underlying concepts are causing recurring failures in current semester topics.
            </p>
          </div>
          <NavLink
            to="/teacher/analytics"
            className="text-xs font-bold text-amber-900 hover:underline flex items-center gap-1 shrink-0"
          >
            <span>Full Analytics Matrix</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </NavLink>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {flaggedGapsSummary.map((gap, idx) => (
            <div key={idx} className="bg-white p-3.5 rounded-xl border border-amber-200/70 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                {gap.subject}
              </span>
              <div className="font-bold text-xs text-slate-900 leading-snug line-clamp-1">{gap.concept}</div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="font-extrabold text-amber-700">{gap.studentsAffected} students</span>
                <Badge variant="warning">{gap.severity}</Badge>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grade Distribution & Class Performance Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Score Distribution Across Section</h2>
              <p className="text-xs text-slate-500">Student marks categorization for Mid-Term Assessment</p>
            </div>
            <Badge variant="primary">Engineering Math IV</Badge>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gradeDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="grade" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" name="Number of Students" fill="#4f46e5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Teaching Intervention Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
              Teaching Intervention Recommended
            </span>
            <h3 className="font-bold text-sm text-slate-900">
              15-Min Integration-by-Parts Remedial Tutorial
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Targeted remediation for students held back by integration substitution errors before ODEs.
            </p>

            <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1.5">
              <div className="flex justify-between text-slate-600">
                <span>Target Group:</span>
                <span className="font-semibold text-slate-900">{faculty.flaggedGapsCount || 1} Flagged Students</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Impact:</span>
                <span className="font-semibold text-emerald-600">Estimated +18% on Next Test</span>
              </div>
            </div>
          </div>

          <NavLink
            to="/teacher/analytics"
            className="mt-4 w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs text-center shadow-xs transition-colors"
          >
            Review Diagnostic Breakdown →
          </NavLink>
        </div>
      </div>

      {/* Student List Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Student Academic & Prerequisite Registry</h2>
            <p className="text-xs text-slate-500">Live roster with diagnostic gap alerts and attendance tracking</p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-64 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search student or roll no..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-xs text-slate-800 w-full placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 sm:px-6">Roll No & Student</th>
                <th className="py-3 px-4">Attendance</th>
                <th className="py-3 px-4 text-center">Avg Score</th>
                <th className="py-3 px-4">Flagged Prerequisite Gap</th>
                <th className="py-3 px-4 sm:px-6 text-right">Support Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map((s) => (
                <tr key={s.id || s.rollNo} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 sm:px-6">
                    <div className="font-bold text-slate-900">{s.name}</div>
                    <div className="text-[10px] font-mono text-slate-400">{s.rollNo}</div>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-800">{s.attendance}%</td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-900">{s.avgScore}%</td>
                  <td className="py-3.5 px-4">
                    {s.flaggedGap ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                        <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                        {s.flaggedGap}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">None</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 sm:px-6 text-right">
                    <Badge
                      variant={
                        s.status === 'Needs Urgent Support'
                          ? 'danger'
                          : s.status === 'Needs Support'
                          ? 'warning'
                          : s.status === 'Excelling'
                          ? 'success'
                          : 'default'
                      }
                    >
                      {s.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* QR Generator Modal */}
      <QRGeneratorModal
        isOpen={isQrOpen}
        onClose={() => setIsQrOpen(false)}
      />
    </div>
  );
}

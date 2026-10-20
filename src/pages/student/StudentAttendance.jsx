import React, { useState, useEffect } from 'react';
import { CalendarCheck, QrCode, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import StatCard from '../../components/StatCard';
import Badge from '../../components/Badge';
import QRScannerModal from '../../components/QRScannerModal';
import { api } from '../../services/api';

export default function StudentAttendance() {
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [overallRate, setOverallRate] = useState(100);
  const [totalAttended, setTotalAttended] = useState(4);
  const [totalSessions, setTotalSessions] = useState(4);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const fetchAttendance = async () => {
    try {
      const res = await api.getStudentAttendance();
      if (res.data) {
        setAttendanceLogs(res.data.records || []);
        setSubjects(res.data.subjects || []);
        setOverallRate(res.data.overallAttendanceRate ?? 100);
        setTotalAttended(res.data.totalAttended ?? 4);
        setTotalSessions(res.data.totalSessions ?? 4);
      }
    } catch (err) {
      console.warn('Could not fetch live attendance:', err.message);
    }
  };

  useEffect(() => {
    fetchAttendance();
    window.addEventListener('saarthi_attendance_updated', fetchAttendance);
    return () => window.removeEventListener('saarthi_attendance_updated', fetchAttendance);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Attendance Monitoring</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time biometric & cryptographic QR code lecture verification records in MongoDB.
          </p>
        </div>

        <button
          onClick={() => setIsScannerOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
        >
          <QrCode className="w-4 h-4" />
          <span>Scan Lecture QR</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Overall Attendance"
          value={`${overallRate}%`}
          subtitle="Minimum 75% required by university"
          icon={CalendarCheck}
          color="emerald"
        />

        <StatCard
          title="Total Lectures Attended"
          value={`${totalAttended} / ${totalSessions}`}
          subtitle="Cumulative verified records"
          icon={CheckCircle2}
          color="indigo"
        />

        <StatCard
          title="Safe Absence Buffer"
          value="4 Lectures"
          subtitle="Margin remaining before crossing 75%"
          icon={AlertCircle}
          color="amber"
        />
      </div>

      {/* Subject-wise Progress Bars */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 mb-4">Subject Attendance & Eligibility Status</h2>

        <div className="space-y-4">
          {subjects.map((sub) => {
            const isLow = sub.attendance < 75;
            return (
              <div key={sub.id || sub.code} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div>
                    <span className="font-bold text-xs text-slate-900">{sub.name}</span>
                    <span className="text-[11px] text-slate-400 font-mono ml-2">({sub.code})</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-slate-600">
                      {sub.attendedClasses || sub.attendanceCount || 4} / {sub.totalClasses || 4} classes
                    </span>
                    <Badge variant={isLow ? 'danger' : 'success'}>
                      {sub.attendance}% {isLow ? '• Shortage' : '• Eligible'}
                    </Badge>
                  </div>
                </div>

                {/* Progress track */}
                <div className="relative w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isLow ? 'bg-rose-500' : sub.attendance > 85 ? 'bg-emerald-500' : 'bg-indigo-600'
                    }`}
                    style={{ width: `${sub.attendance}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Attendance History Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Recent Attendance Logs</h2>
          <span className="text-xs text-slate-400">Auto-synced with faculty sessions</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 sm:px-6">Date</th>
                <th className="py-3 px-4">Subject & Room</th>
                <th className="py-3 px-4">Time Slot / Room</th>
                <th className="py-3 px-4">Verification Method</th>
                <th className="py-3 px-4 sm:px-6 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {attendanceLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 sm:px-6 font-mono text-slate-700 font-medium">
                    {log.date}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-900">{log.subject}</div>
                    <div className="text-[10px] text-slate-400">Room: {log.room}</div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">{log.slot || '10:00 - 11:00 AM'}</td>
                  <td className="py-3.5 px-4">
                    <span className="font-mono text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                      {log.method}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 sm:px-6 text-right">
                    <Badge variant={log.status === 'Present' || log.status === 'PRESENT' ? 'success' : 'danger'}>
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Present
                      </span>
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* QR Scanner Modal */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onAttendanceMarked={fetchAttendance}
      />
    </div>
  );
}

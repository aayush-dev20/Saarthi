import React, { useState, useEffect } from 'react';
import {
  Users,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  Building,
  Bus,
  GraduationCap,
  Loader2,
} from 'lucide-react';
import { api } from '../../services/api';
import StatCard from '../../components/StatCard';

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        setLoading(true);
        setError(null);
        const res = await api.getAdminDashboard();
        if (res.data) {
          const kpis = res.data.institutionalKPIs || res.data;
          setAnalytics({
            totalStudents: kpis.totalStudents,
            totalFaculty: kpis.totalFaculty,
            avgAttendance: kpis.campusAttendanceHealth,
            flaggedAttendanceTotal: kpis.flaggedAttendanceCount,
            activeBuses: kpis.activeBusesCount,
            totalBuses: kpis.totalBusesCount,
            hostelOccupancyRate: kpis.hostelOccupancyRate,
            pendingOutingRequests: kpis.pendingOutingRequests,
            totalStaff: kpis.totalStaff,
          });
        }
      } catch (err) {
        setError('Could not load campus KPIs. Please refresh.');
        console.error('Admin dashboard error:', err.message);
      } finally {
        setLoading(false);
      }
    }
    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <span className="ml-3 text-slate-500 text-sm">Loading campus KPIs...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
        <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
        <p className="text-red-700 text-sm font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Executive Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
            <span>Institutional Governance &amp; Analytics</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Executive Campus Management Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Centralized institutional KPIs across academic performance, anti-proxy attendance verification, transport fleets, and hostel housing logistics.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          title="Total Enrolled Students"
          value={analytics?.totalStudents ?? '—'}
          change="Live from Database"
          trend="up"
          icon={GraduationCap}
        />
        <StatCard
          title="Active Teaching Faculty"
          value={analytics?.totalFaculty ?? '—'}
          change="Full Staffing"
          trend="neutral"
          icon={Users}
        />
        <StatCard
          title="Campus Attendance Average"
          value={analytics?.avgAttendance != null ? `${analytics.avgAttendance}%` : '—'}
          change="Live Calculation"
          trend="up"
          icon={TrendingUp}
        />
        <StatCard
          title="Attendance Audits Pending"
          value={analytics?.flaggedAttendanceTotal ?? '—'}
          change="Flagged Signals"
          trend={analytics?.flaggedAttendanceTotal > 0 ? 'down' : 'neutral'}
          icon={AlertTriangle}
        />
      </div>

      {/* Campus Infrastructure Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bus className="w-4 h-4 text-blue-600" />
              <h2 className="font-bold text-slate-900 text-sm">Transport Transit Logistics</h2>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
              Live Fleet Data
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Active Buses</span>
              <span className="text-xl font-bold text-slate-900">{analytics?.activeBuses ?? '—'}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Fleet</span>
              <span className="text-xl font-bold text-slate-900">{analytics?.totalBuses ?? '—'}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Pending Passes</span>
              <span className="text-xl font-bold text-indigo-600">{analytics?.pendingOutingRequests ?? '—'}</span>
            </div>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Bus fleet telemetry synchronizes stop arrival forecasts to eliminate student wait times and coordinate weekend excursion safety.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-purple-600" />
              <h2 className="font-bold text-slate-900 text-sm">Residential Hostel Occupancy</h2>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-50 text-purple-700 font-semibold border border-purple-200">
              {analytics?.hostelOccupancyRate != null ? `Capacity: ${analytics.hostelOccupancyRate}%` : 'Live Data'}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Occupancy</span>
              <span className="text-xl font-bold text-slate-900">
                {analytics?.hostelOccupancyRate != null ? `${analytics.hostelOccupancyRate}%` : '—'}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Staff</span>
              <span className="text-xl font-bold text-slate-900">{analytics?.totalStaff ?? '—'}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Violations</span>
              <span className="text-xl font-bold text-emerald-600">0</span>
            </div>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Hostel warden digital roll-calls verify curfew compliance at 10:00 PM nightly with automated emergency alert triggers.
          </p>
        </div>
      </div>
    </div>
  );
}

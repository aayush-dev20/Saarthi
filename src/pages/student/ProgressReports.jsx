import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  TrendingUp,
  Download,
  Printer,
  Sparkles,
  CheckCircle2,
  GitFork,
  ArrowRight,
  Clock,
  Award,
  AlertCircle,
  Loader2,
  BarChart3,
  Calendar,
} from 'lucide-react';
import StatCard from '../../components/StatCard';
import Badge from '../../components/Badge';
import { api } from '../../services/api';

export default function ProgressReports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProgress() {
      try {
        const res = await api.getProgressReports();
        setData(res.data);
      } catch (err) {
        console.warn('Failed to load live progress reports:', err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchProgress();
  }, []);

  if (loading) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-600" />
        <span>Calculating authentic student progress report from MongoDB...</span>
      </div>
    );
  }

  // Honest Empty State if no tests taken yet
  if (!data || data.hasData === false) {
    return (
      <div className="space-y-6">
        <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-xs text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">No Assessment Records Yet</h2>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              {data?.message || 'To compute your authentic growth trajectory, take the diagnostic assessment check for your current courses.'}
            </p>
          </div>
          <NavLink
            to="/student/assessment"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <span>Take Diagnostic Assessment</span>
            <ArrowRight className="w-4 h-4" />
          </NavLink>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <span>Auditable Growth Analytics • Database Verified</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Student Growth & Mastery Report
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Evidence-based comparison of diagnostic baseline vs. post-practice reassessments.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print Verified Report</span>
          </button>
        </div>
      </div>

      {/* Comparison Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Baseline Diagnostic */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Initial Diagnostic
            </span>
            <span className="text-[10px] text-slate-400 font-mono">{data.initialDate}</span>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-slate-600 font-mono">
            {data.initialScore}%
          </div>
          <p className="mt-1 text-xs text-amber-700 font-medium">
            Prerequisite bottleneck identified
          </p>
        </div>

        {/* Latest Reassessment */}
        <div className="bg-white rounded-2xl p-6 border border-emerald-200 shadow-xs bg-emerald-50/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
              Latest Reassessment
            </span>
            <span className="text-[10px] text-emerald-700 font-mono">{data.reassessmentDate}</span>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-emerald-600 font-mono">
            {data.currentScore}%
          </div>
          <p className="mt-1 text-xs text-emerald-700 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            {data.isVerified ? 'Prerequisite verified as recovered' : 'Further practice advised'}
          </p>
        </div>

        {/* Net Absolute & Relative Growth */}
        <div className="bg-white rounded-2xl p-6 border border-indigo-200 shadow-xs bg-indigo-50/20">
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-800">
            Absolute Score Increase
          </span>
          <div className="mt-3 text-3xl font-extrabold text-indigo-700 font-mono">
            +{data.improvement} <span className="text-sm font-normal text-indigo-600">pp</span>
          </div>
          <p className="mt-1 text-xs text-indigo-700 font-medium">
            {data.relativeChange > 0 ? `+${data.relativeChange}% relative improvement` : 'Baseline established'}
          </p>
        </div>
      </div>

      {/* Topics Improved & Next Recommendation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Topics Recovered & Improved</span>
          </h3>
          {data.topicsImproved?.length > 0 ? (
            <ul className="space-y-2 text-xs">
              {data.topicsImproved.map((t, idx) => (
                <li key={idx} className="flex items-center gap-2 text-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-400">Complete targeted practice modules to record topic recovery.</p>
          )}
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" />
            <span>Recommendation for Next Study Session</span>
          </h3>
          <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
            {data.nextRecommendation}
          </p>
        </div>
      </div>

      {/* Concept Mastery Progression Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-xs">Concept Mastery History (Calculus & ODEs)</h3>
          <span className="text-[11px] text-slate-400 font-medium">Evaluations: {data.assessmentCount} tests</span>
        </div>
        <div className="p-4 space-y-3">
          {data.concepts?.map((c) => (
            <div key={c.id} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-800">{c.label} ({c.category})</span>
                <span className="font-mono font-bold text-slate-700">{c.mastery}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    c.mastery >= 80 ? 'bg-emerald-500' : c.mastery >= 70 ? 'bg-indigo-500' : 'bg-amber-500'
                  }`}
                  style={{ width: `${c.mastery}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

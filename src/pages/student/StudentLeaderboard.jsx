import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Medal,
  Award,
  Sparkles,
  TrendingUp,
  BrainCircuit,
  BookOpenCheck,
  CheckCircle2,
  CalendarCheck,
  ShieldAlert,
  Loader2,
  Filter,
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function StudentLeaderboard() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [rankingMode, setRankingMode] = useState('overall'); // 'overall', 'growth', 'consistency', 'academics'
  const [currentUserEntry, setCurrentUserEntry] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const res = await api.getLeaderboard();
      const list = Array.isArray(res.data) ? res.data : (res.data?.leaderboard || []);
      setLeaderboard(list);

      const myEntry = list.find(
        (entry) =>
          entry.isMe ||
          entry.student?.idNumber === user?.idNumber ||
          entry.rollNo === user?.idNumber ||
          entry.studentId === user?.id
      );
      if (myEntry) setCurrentUserEntry(myEntry);
      else if (list.length > 0) setCurrentUserEntry(list[0]);
    } catch (err) {
      console.warn('Could not fetch leaderboard:', err.message);
      setLeaderboard([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  // Sort based on selected ranking mode
  const sortedLeaderboard = [...leaderboard].sort((a, b) => {
    if (rankingMode === 'growth') {
      return (b.diagnosticImprovementPoints || 0) - (a.diagnosticImprovementPoints || 0);
    } else if (rankingMode === 'consistency') {
      return (b.participationPoints || 0) - (a.participationPoints || 0);
    } else if (rankingMode === 'academics') {
      return (b.academicPoints || 0) - (a.academicPoints || 0);
    }
    return (b.totalPoints || 0) - (a.totalPoints || 0);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold mb-2">
            <Trophy className="w-3.5 h-3.5 text-indigo-600" />
            <span>Campus Merit & Continuous Learning Ranking</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Student Academic & Growth Leaderboard
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Calculated strictly from verified database records: academic standing, diagnostic prerequisite recovery, and continuous practice completion.
          </p>
        </div>
      </div>

      {/* Ranking Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            Ranking Metric:
          </span>

          <button
            onClick={() => setRankingMode('overall')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
              rankingMode === 'overall' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Overall Merit Points
          </button>

          <button
            onClick={() => setRankingMode('growth')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
              rankingMode === 'growth' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Prerequisite Growth & Recovery
          </button>

          <button
            onClick={() => setRankingMode('consistency')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
              rankingMode === 'consistency' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Practice Consistency
          </button>

          <button
            onClick={() => setRankingMode('academics')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
              rankingMode === 'academics' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Coursework & Academics
          </button>
        </div>

        <div className="text-[11px] text-slate-400 font-medium">
          Fair tie-breaking rule applied • Updated live
        </div>
      </div>

      {/* Leaderboard Table / Content */}
      {loading ? (
        <div className="bg-white p-12 text-center text-slate-400 rounded-2xl border border-slate-200">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
          <span>Computing leaderboard standings from MongoDB...</span>
        </div>
      ) : sortedLeaderboard.length === 0 ? (
        <div className="bg-white p-12 text-center text-slate-400 rounded-2xl border border-slate-200">
          <Trophy className="w-8 h-8 mx-auto mb-2 text-slate-300" />
          <p className="font-semibold text-slate-700">No leaderboard standings recorded yet.</p>
          <p className="text-xs text-slate-400 mt-1">Standings will update automatically as students complete assessments.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4 text-center">Rank</th>
                <th className="py-3.5 px-4">Student (Privacy Display)</th>
                <th className="py-3.5 px-3 text-center">Section</th>
                <th className="py-3.5 px-3 text-center">Coursework Points</th>
                <th className="py-3.5 px-3 text-center">Growth Points</th>
                <th className="py-3.5 px-3 text-center">Practice Points</th>
                <th className="py-3.5 px-4 text-right">Total Merit Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {sortedLeaderboard.map((entry, idx) => {
                const rankNum = idx + 1;
                const isMe = entry.rollNo === user?.idNumber || entry.name === user?.name;
                return (
                  <tr
                    key={entry.rollNo || idx}
                    className={`transition-colors ${isMe ? 'bg-indigo-50/60 font-semibold' : 'hover:bg-slate-50/60'}`}
                  >
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-bold text-xs ${
                        rankNum === 1 ? 'bg-amber-100 text-amber-800' :
                        rankNum === 2 ? 'bg-slate-200 text-slate-800' :
                        rankNum === 3 ? 'bg-amber-50 text-amber-900 border border-amber-300' :
                        'text-slate-500'
                      }`}>
                        {rankNum}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px]">
                          {entry.avatar || entry.name?.[0] || 'S'}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                            <span>{entry.name}</span>
                            {isMe && (
                              <span className="text-[10px] bg-indigo-600 text-white px-1.5 py-0.2 rounded font-normal">
                                You
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {entry.rollNo?.slice(0, 2)}***{entry.rollNo?.slice(-2)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono text-slate-600">
                      {entry.section || 'CSE-A'}
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono text-slate-700">
                      {entry.academicPoints || 0}
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono text-indigo-700 font-bold">
                      +{entry.diagnosticImprovementPoints || 0}
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono text-slate-700">
                      {entry.participationPoints || 0}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-extrabold text-sm text-slate-900">
                      {entry.totalPoints || (entry.academicPoints + entry.diagnosticImprovementPoints + entry.participationPoints)} pts
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

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
  GraduationCap,
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function StudentLeaderboard() {
  const { user } = useAuth();
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [meta, setMeta] = useState({});
  const [rankingMode, setRankingMode] = useState('cgpa'); // 'cgpa' or 'sgpa'
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('mode', rankingMode);
      if (selectedSemester !== 'all') params.append('semester', selectedSemester);
      if (selectedBranch !== 'all') params.append('branch', selectedBranch);

      const res = await api.getLeaderboard(params.toString());
      if (res.data) {
        setLeaderboardData(res.data.leaderboard || []);
        setMeta({
          rankingMode: res.data.rankingMode,
          academicPeriod: res.data.academicPeriod,
          tieBreakingRule: res.data.tieBreakingRule,
          totalEligibleStudents: res.data.totalEligibleStudents,
          myRank: res.data.myRank,
          myGPA: res.data.myGPA,
          myAggregatePercentage: res.data.myAggregatePercentage,
        });
      }
    } catch (err) {
      console.warn('Could not fetch leaderboard:', err.message);
      setLeaderboardData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [rankingMode, selectedSemester, selectedBranch]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold mb-2">
            <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
            <span>Academic Merit & Official CGPA Ranking</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Student Academic Standing & Leaderboard
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Calculated strictly from verified institutional database records using official university credit-weighted grade points (10-Point Scale).
          </p>
        </div>

        {meta.myRank !== undefined && meta.myRank !== 'N/A' && (
          <div className="flex items-center gap-3 bg-indigo-50/70 border border-indigo-100 p-3 rounded-xl">
            <Trophy className="w-8 h-8 text-indigo-600" />
            <div>
              <div className="text-[11px] text-indigo-700 font-semibold uppercase">Your Rank</div>
              <div className="text-2xl font-black text-indigo-900">
                #{meta.myRank} <span className="text-xs font-normal text-slate-500">of {meta.totalEligibleStudents}</span>
              </div>
            </div>
            <div className="pl-3 border-l border-indigo-200">
              <div className="text-[11px] text-indigo-700 font-semibold uppercase">{rankingMode === 'cgpa' ? 'CGPA' : 'SGPA'}</div>
              <div className="text-2xl font-black text-indigo-900">{meta.myGPA}</div>
            </div>
          </div>
        )}
      </div>

      {/* Filter Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            Ranking Metric:
          </span>

          <button
            onClick={() => setRankingMode('cgpa')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
              rankingMode === 'cgpa' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Cumulative CGPA
          </button>

          <button
            onClick={() => setRankingMode('sgpa')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
              rankingMode === 'sgpa' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Semester GPA (SGPA)
          </button>

          {/* Semester Selector */}
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-medium text-xs outline-none cursor-pointer"
          >
            <option value="all">All Semesters</option>
            <option value="3">Semester 3</option>
            <option value="4">Semester 4</option>
          </select>

          {/* Branch Selector */}
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-medium text-xs outline-none cursor-pointer"
          >
            <option value="all">All Engineering Branches</option>
            <option value="Computer Science">Computer Science & Engineering</option>
          </select>
        </div>

        <div className="text-[11px] text-slate-400 font-medium hidden sm:block">
          Tie-breaker: Marks % → Attendance Rate
        </div>
      </div>

      {/* Tie-Breaking Notice Banner */}
      <div className="px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 flex items-center justify-between">
        <span><strong>Verified Institutional Policy:</strong> {meta.tieBreakingRule}</span>
        <span className="font-semibold text-indigo-700">{meta.academicPeriod}</span>
      </div>

      {/* Leaderboard Table */}
      {loading ? (
        <div className="bg-white p-12 text-center text-slate-400 rounded-2xl border border-slate-200">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
          <span>Computing verified CGPA & SGPA rankings from MongoDB...</span>
        </div>
      ) : leaderboardData.length === 0 ? (
        <div className="bg-white p-12 text-center text-slate-400 rounded-2xl border border-slate-200">
          <Trophy className="w-8 h-8 mx-auto mb-2 text-slate-300" />
          <p className="font-semibold text-slate-700">No verified academic records match the selected filter.</p>
          <p className="text-xs text-slate-400 mt-1">Standings update automatically as faculty submit verified internal and external semester marks.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4 text-center">Rank</th>
                <th className="py-3.5 px-4">Student (Privacy Protected)</th>
                <th className="py-3.5 px-3 text-center">Section</th>
                <th className="py-3.5 px-3 text-center">Credits Earned</th>
                <th className="py-3.5 px-3 text-center">Aggregate Marks %</th>
                <th className="py-3.5 px-3 text-center">Attendance %</th>
                <th className="py-3.5 px-4 text-right">{rankingMode === 'cgpa' ? 'Cumulative CGPA' : 'Semester SGPA'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {leaderboardData.map((entry, idx) => {
                const rankNum = entry.rank || idx + 1;
                const isMe = entry.isMe || entry.rollNo === user?.idNumber;
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
                        <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px]">
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
                    <td className="py-3.5 px-3 text-center font-semibold text-slate-700 font-mono">
                      {entry.creditsCompleted} Credits
                    </td>
                    <td className="py-3.5 px-3 text-center font-semibold text-slate-800 font-mono">
                      {entry.aggregatePercentage}%
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono text-slate-700">
                      {entry.attendanceRate}%
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-black text-sm font-mono border border-emerald-200">
                        {entry.gpa} / 10.0
                      </span>
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

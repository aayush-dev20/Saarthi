import React, { useState } from 'react';
import {
  BarChart3,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  Users2,
  GitFork,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import { teacherClassStudents, teacherFlaggedGapsSummary } from '../../data/mockData';

export default function TeacherAnalytics() {
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');

  const needsSupportStudents = teacherClassStudents.filter((s) => s.status.includes('Support'));
  const onTrackStudents = teacherClassStudents.filter((s) => s.status === 'On Track');
  const excellingStudents = teacherClassStudents.filter((s) => s.status === 'Excelling');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Learning Gap Analytics & Teaching Interventions
        </h1>
        <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
          Aggregated class-wide diagnosis showing prerequisite bottlenecks and recommended educational interventions.
        </p>
      </div>

      {/* Flagged Prerequisite Concepts Grid */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Class Prerequisite Gap Frequency</h2>
            <p className="text-xs text-slate-500">Concepts diagnosed as underlying failure points across assessments</p>
          </div>
          <Badge variant="warning">Diagnostic Screening Active</Badge>
        </div>

        <div className="space-y-4">
          {teacherFlaggedGapsSummary.map((gap, idx) => (
            <div key={idx} className="p-4 rounded-xl border border-slate-200/70 bg-slate-50/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div>
                  <span className="font-bold text-xs text-slate-900">{gap.concept}</span>
                  <span className="text-[11px] text-slate-500 ml-2">({gap.subject})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">
                    {gap.studentsAffected} students ({gap.percentage}%)
                  </span>
                  <Badge variant={gap.severity === 'High Priority' ? 'danger' : 'warning'}>
                    {gap.severity}
                  </Badge>
                </div>
              </div>

              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-500"
                  style={{ width: `${gap.percentage * 3}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Suggested Pedagogical Interventions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs uppercase tracking-wider">
            <Lightbulb className="w-4 h-4 text-indigo-600" />
            <span>Recommended Class Intervention 1</span>
          </div>

          <h3 className="font-bold text-sm text-slate-900">
            15-Minute Remedial: Integration by Parts & Chain Rule
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Prior to starting Non-Homogeneous Differential Equations next Tuesday, spend 15 minutes reviewing substitution formulas. 28 students are calculating standard steps incorrectly.
          </p>

          <div className="p-3 bg-indigo-50 rounded-xl text-xs text-indigo-900 font-medium">
            Projected Impact: Enables 85% of currently flagged students to solve subsequent assignments.
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-blue-700 font-bold text-xs uppercase tracking-wider">
            <Lightbulb className="w-4 h-4 text-blue-600" />
            <span>Recommended Class Intervention 2</span>
          </div>

          <h3 className="font-bold text-sm text-slate-900">
            Peer Mentoring Pairings
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Pair students with strong integration fluency (e.g. Pooja Malhotra, Ananya Dixit) with students in the recovery group for laboratory sessions.
          </p>

          <div className="p-3 bg-blue-50 rounded-xl text-xs text-blue-900 font-medium">
            Active Study Groups: 4 pairs identified in Section CSE-A.
          </div>
        </div>
      </div>

      {/* Student Cohort Classification */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Student Support Grouping</h2>
          <span className="text-xs text-slate-400">Click any student to inspect evidence</span>
        </div>

        <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Needs Support Cohort */}
          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-amber-900">Needs Support ({needsSupportStudents.length})</span>
              <Badge variant="warning">Remedial Focus</Badge>
            </div>
            <div className="space-y-2">
              {needsSupportStudents.map((s) => (
                <div
                  key={s.id}
                  onClick={() => setSelectedStudent(s)}
                  className="bg-white p-2.5 rounded-lg border border-amber-200/70 shadow-2xs hover:border-amber-400 cursor-pointer text-xs"
                >
                  <div className="font-bold text-slate-900">{s.name}</div>
                  <div className="text-[10px] text-amber-700 font-medium mt-0.5">
                    Gap: {s.flaggedGap}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* On Track Cohort */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800">On Track ({onTrackStudents.length})</span>
              <Badge variant="default">Steady</Badge>
            </div>
            <div className="space-y-2">
              {onTrackStudents.map((s) => (
                <div
                  key={s.id}
                  onClick={() => setSelectedStudent(s)}
                  className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs hover:border-slate-300 cursor-pointer text-xs"
                >
                  <div className="font-bold text-slate-900">{s.name}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Score: {s.avgScore}% • Attendance: {s.attendance}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Excelling Cohort */}
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-emerald-900">Excelling ({excellingStudents.length})</span>
              <Badge variant="success">Peer Mentors</Badge>
            </div>
            <div className="space-y-2">
              {excellingStudents.map((s) => (
                <div
                  key={s.id}
                  onClick={() => setSelectedStudent(s)}
                  className="bg-white p-2.5 rounded-lg border border-emerald-200/70 shadow-2xs hover:border-emerald-400 cursor-pointer text-xs"
                >
                  <div className="font-bold text-slate-900">{s.name}</div>
                  <div className="text-[10px] text-emerald-700 font-medium mt-0.5">
                    Score: {s.avgScore}% • No gaps detected
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Student Details Drawer / Modal */}
      {selectedStudent && (
        <Modal
          isOpen={!!selectedStudent}
          onClose={() => setSelectedStudent(null)}
          title={`Diagnostic Profile: ${selectedStudent.name}`}
          maxWidth="max-w-md"
        >
          <div className="space-y-4 text-xs">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Roll Number</span>
                <span className="font-bold text-slate-900 font-mono">{selectedStudent.rollNo}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Attendance</span>
                <span className="font-bold text-slate-900">{selectedStudent.attendance}%</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Avg Score</span>
                <span className="font-bold text-indigo-700">{selectedStudent.avgScore}%</span>
              </div>
            </div>

            <div>
              <span className="font-bold text-slate-800 block mb-1">Identified Prerequisite Gap:</span>
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
                <strong>{selectedStudent.flaggedGap}</strong>
                <p className="mt-1 text-[11px] leading-relaxed">
                  Struggling with target topic: {selectedStudent.targetStruggling}. Recommended to assign targeted integration practice set 1.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedStudent(null)}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

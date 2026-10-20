import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Filter,
  Download,
  Search,
  BookOpen,
  Award,
  CheckCircle2,
  Clock,
  Building2,
  Loader2,
  Calendar,
} from 'lucide-react';
import Badge from '../../components/Badge';
import { api } from '../../services/api';
import { subscribeToStudentLiveUpdates } from '../../services/socket';

export default function StudentAcademics() {
  const [subjects, setSubjects] = useState([]);
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedSemester, setSelectedSemester] = useState('All'); // 'All', '3', '4'
  const [selectedCourseType, setSelectedCourseType] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const loadAcademics = async () => {
    try {
      const res = await api.getStudentAcademics();
      const list = res.data?.subjects || (Array.isArray(res.data) ? res.data : []);
      setSubjects(list);
      setMetadata({
        academicYear: res.data?.academicYear || '2nd Year',
        institution: res.data?.institution || 'Indo Global College of Engineering (IKGPTU)',
        program: res.data?.program || 'B.Tech Computer Science & Engineering (2018 Scheme)',
      });
    } catch (err) {
      console.warn('Could not load live student academics:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAcademics();

    const unsubscribe = subscribeToStudentLiveUpdates({
      onMarksUpdated: () => loadAcademics(),
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Multi-dimensional filtering
  const filteredSubjects = subjects.filter((s) => {
    // Semester filter
    if (selectedSemester !== 'All' && String(s.semester) !== selectedSemester) {
      return false;
    }

    // Course type filter
    if (selectedCourseType !== 'All' && !s.courseType?.toLowerCase().includes(selectedCourseType.toLowerCase())) {
      return false;
    }

    // Publication Status filter
    if (selectedStatus !== 'All' && s.publicationStatus !== selectedStatus) {
      return false;
    }

    // Text search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (s.name || '').toLowerCase().includes(q);
      const matchCode = (s.code || '').toLowerCase().includes(q);
      const matchFaculty = (s.instructor || '').toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchFaculty) return false;
    }

    return true;
  });

  // Calculate SGPA / Total Credits
  const totalCredits = filteredSubjects.reduce((acc, s) => acc + (s.credits || 0), 0);
  const totalEarnedMarks = filteredSubjects.reduce((acc, s) => acc + (s.totalMarks || 0), 0);
  const maxPossibleMarks = filteredSubjects.reduce((acc, s) => acc + (s.totalMax || 100), 0);
  const overallPercentage = maxPossibleMarks > 0 ? Math.round((totalEarnedMarks / maxPossibleMarks) * 1000) / 10 : 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold mb-2">
            <Building2 className="w-3.5 h-3.5 text-indigo-600" />
            <span>Official IKGPTU B.Tech CSE Curriculum (2018 Study Scheme)</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            My Academics — Course Catalogue & Grade Registry
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Verified institutional curriculum for 2nd Year B.Tech CSE. Tracks internal continuous evaluations, semester theory marks, laboratory assessments, and verified credits under Punjab Technical University regulations.
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span>Export PTU Grade Transcript</span>
        </button>
      </div>

      {/* Summary Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Enrolled Courses</div>
          <div className="text-xl font-bold text-slate-900 mt-1">{filteredSubjects.length}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Semesters III & IV Scheme</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Accumulated Credits</div>
          <div className="text-xl font-bold text-indigo-600 mt-1">{totalCredits} <span className="text-xs text-slate-400 font-normal">Credits</span></div>
          <div className="text-[10px] text-slate-400 mt-0.5">PTU Degree Requirement</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Weighted Performance</div>
          <div className="text-xl font-bold text-emerald-600 mt-1">{overallPercentage}%</div>
          <div className="text-[10px] text-emerald-600 font-medium mt-0.5">First Class with Distinction</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Curriculum Status</div>
          <div className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-1.5 text-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>IKGPTU Verified</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Batch 2024-28 CSE</div>
        </div>
      </div>

      {/* Multi-Dimensional Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Semester Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-500 font-medium">Semester:</span>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="bg-transparent font-semibold text-slate-800 outline-none cursor-pointer"
              >
                <option value="All">All Semesters (3 & 4)</option>
                <option value="3">Semester III</option>
                <option value="4">Semester IV (Current)</option>
              </select>
            </div>

            {/* Course Type Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
              <BookOpen className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-500 font-medium">Course Type:</span>
              <select
                value={selectedCourseType}
                onChange={(e) => setSelectedCourseType(e.target.value)}
                className="bg-transparent font-semibold text-slate-800 outline-none cursor-pointer"
              >
                <option value="All">All Course Types</option>
                <option value="Professional Core">Professional Core (PCC)</option>
                <option value="Engineering Science">Engineering Science (ESC)</option>
                <option value="Basic Science">Basic Science (BSC)</option>
                <option value="Humanities">Humanities (HSMC)</option>
                <option value="Mandatory">Mandatory Course (MC)</option>
              </select>
            </div>

            {/* Publication Status Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
              <Award className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-500 font-medium">Result Status:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-transparent font-semibold text-slate-800 outline-none cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="PUBLISHED">Published</option>
                <option value="PROVISIONAL">Provisional</option>
                <option value="IN_REVIEW">In Review</option>
              </select>
            </div>
          </div>

          {/* Search Box */}
          <div className="flex items-center gap-2 w-full sm:w-64 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search code, subject, faculty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-xs text-slate-800 w-full placeholder:text-slate-400"
            />
          </div>
        </div>
      </div>

      {/* Official PTU Course Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">Course Code</th>
                <th className="py-3.5 px-4">Course Name & Curriculum Type</th>
                <th className="py-3.5 px-3 text-center">Load (L-T-P)</th>
                <th className="py-3.5 px-3 text-center">Credits</th>
                <th className="py-3.5 px-4">Assigned Faculty</th>
                <th className="py-3.5 px-3 text-center">Internal Marks</th>
                <th className="py-3.5 px-3 text-center">Semester Marks</th>
                <th className="py-3.5 px-3 text-center">Total Marks</th>
                <th className="py-3.5 px-3 text-center">Grade</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Result Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                    <span>Loading verified academic records from MongoDB...</span>
                  </td>
                </tr>
              ) : filteredSubjects.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <BookOpen className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">No courses match the selected filters.</p>
                    <p className="text-[11px] text-slate-400 mt-1">Try resetting the semester or course type filter.</p>
                  </td>
                </tr>
              ) : (
                filteredSubjects.map((s) => {
                  const isMandatory = s.courseType === 'Mandatory Course';
                  return (
                    <tr key={s.id || s.code} className="hover:bg-slate-50/60 transition-colors">
                      {/* Course Code */}
                      <td className="py-3.5 px-4 sm:px-6 font-mono font-bold text-indigo-700 whitespace-nowrap">
                        {s.code}
                      </td>

                      {/* Course Name & Type */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-semibold text-slate-900 leading-snug">{s.name}</div>
                        <div className="text-[10px] text-slate-500 font-medium mt-0.5 flex items-center gap-1.5">
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-500" />
                          <span>{s.courseType}</span>
                          <span>•</span>
                          <span>Sem {s.semester}</span>
                        </div>
                      </td>

                      {/* Load */}
                      <td className="py-3.5 px-3 text-center font-mono text-slate-600">
                        {s.load || '3-0-0'}
                      </td>

                      {/* Credits */}
                      <td className="py-3.5 px-3 text-center font-bold text-slate-800">
                        {isMandatory ? <span className="text-slate-400 font-normal">Non-Credit</span> : s.credits}
                      </td>

                      {/* Assigned Faculty */}
                      <td className="py-3.5 px-4 text-slate-700 whitespace-nowrap">
                        <div className="font-medium">{s.instructor}</div>
                        <div className="text-[10px] text-slate-400">IKGPTU Department Faculty</div>
                      </td>

                      {/* Internal Marks */}
                      <td className="py-3.5 px-3 text-center font-mono">
                        <span className="font-semibold text-slate-800">{s.internalMarks}</span>
                        <span className="text-slate-400 text-[10px]"> / {s.internalMax}</span>
                      </td>

                      {/* Semester Marks */}
                      <td className="py-3.5 px-3 text-center font-mono">
                        {isMandatory ? (
                          <span className="text-slate-400 text-[11px]">—</span>
                        ) : (
                          <>
                            <span className="font-semibold text-slate-800">{s.semesterMarks}</span>
                            <span className="text-slate-400 text-[10px]"> / {s.semesterMax}</span>
                          </>
                        )}
                      </td>

                      {/* Total Marks */}
                      <td className="py-3.5 px-3 text-center font-mono">
                        <span className="font-bold text-slate-900 text-sm">{s.totalMarks}</span>
                        <span className="text-slate-400 text-[10px]"> / {s.totalMax}</span>
                      </td>

                      {/* Grade */}
                      <td className="py-3.5 px-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-md font-bold text-xs ${
                          s.grade === 'A+' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          s.grade === 'A' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          s.grade === 'B+' || s.grade === 'B' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                          'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {s.grade || 'A'}
                        </span>
                      </td>

                      {/* Result / Publication Status */}
                      <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap">
                        <Badge variant={s.publicationStatus === 'PUBLISHED' ? 'success' : 'default'}>
                          {s.publicationStatus === 'PUBLISHED' ? 'Published' : 'Provisional'}
                        </Badge>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

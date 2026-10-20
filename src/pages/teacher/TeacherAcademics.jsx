import React, { useState, useEffect } from 'react';
import {
  Users2,
  Edit3,
  Search,
  CheckCircle2,
  Download,
  Loader2,
  FileCheck2,
  Plus,
  Clock,
  Send,
  Award,
  AlertCircle,
  Eye,
} from 'lucide-react';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import { api } from '../../services/api';

export default function TeacherAcademics() {
  const [activeTab, setActiveTab] = useState('assignments'); // 'assignments' or 'roster'
  const [loading, setLoading] = useState(true);

  // Assignments State
  const [assignments, setAssignments] = useState([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    courseCode: 'BTCS 301-18',
    unitTopic: '',
    totalPoints: 100,
    dueDate: '',
    section: 'CSE-A',
    description: '',
  });
  const [creating, setCreating] = useState(false);

  // Submissions State
  const [selectedAssignmentForSubmissions, setSelectedAssignmentForSubmissions] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [gradingSubmission, setGradingSubmission] = useState(null);
  const [gradeScore, setGradeScore] = useState('');
  const [gradeFeedback, setGradeFeedback] = useState('');
  const [grading, setGrading] = useState(false);

  // Roster & Marks State
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingStudent, setEditingStudent] = useState(null);
  const [newScore, setNewScore] = useState('');
  const [toastMessage, setToastMessage] = useState(null);
  const [savingMarks, setSavingMarks] = useState(false);

  const fetchAssignments = async () => {
    try {
      const res = await api.getFacultyAssignments();
      setAssignments(res.data || []);
    } catch (err) {
      console.warn('Could not load faculty assignments:', err.message);
    }
  };

  const fetchRoster = async () => {
    try {
      const res = await api.getFacultyAcademics();
      if (res.data?.students) {
        setStudents(res.data.students);
      }
    } catch (err) {
      console.warn('Failed to fetch faculty academics:', err.message);
    }
  };

  useEffect(() => {
    async function loadAll() {
      setLoading(true);
      await Promise.all([fetchAssignments(), fetchRoster()]);
      setLoading(false);
    }
    loadAll();
  }, []);

  // Open Submissions Review
  const handleViewSubmissions = async (asg) => {
    setSelectedAssignmentForSubmissions(asg);
    setLoadingSubmissions(true);
    try {
      const res = await api.getFacultyAssignmentSubmissions(asg.id);
      setSubmissions(res.data?.submissions || []);
    } catch (err) {
      console.warn('Failed to fetch submissions:', err.message);
      setSubmissions([]);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  // Create Assignment
  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.createFacultyAssignment(createForm);
      setIsCreateModalOpen(false);
      setCreateForm({
        title: '',
        courseCode: 'BTCS 301-18',
        unitTopic: '',
        totalPoints: 100,
        dueDate: '',
        section: 'CSE-A',
        description: '',
      });
      setToastMessage('Assignment successfully published to class section!');
      await fetchAssignments();
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      alert(err.message || 'Failed to create assignment');
    } finally {
      setCreating(false);
    }
  };

  // Grade Submission
  const handleSaveGrade = async (e) => {
    e.preventDefault();
    if (!gradingSubmission) return;
    setGrading(true);
    try {
      await api.gradeFacultySubmission(selectedAssignmentForSubmissions.id, {
        submissionId: gradingSubmission._id,
        score: Number(gradeScore),
        feedback: gradeFeedback,
      });
      setToastMessage(`Grade awarded to ${gradingSubmission.student?.name} (${gradeScore} pts).`);
      setGradingSubmission(null);
      await handleViewSubmissions(selectedAssignmentForSubmissions);
      await fetchAssignments();
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      alert(err.message || 'Failed to grade submission');
    } finally {
      setGrading(false);
    }
  };

  // Marks Roster Editing
  const handleSaveMarks = async (e) => {
    e.preventDefault();
    if (!editingStudent) return;
    setSavingMarks(true);
    try {
      await api.updateFacultyMarks({
        studentId: editingStudent.id,
        rollNo: editingStudent.rollNo,
        avgScore: Number(newScore),
      });
      setToastMessage(`Updated marks for ${editingStudent.name} (${newScore}%)`);
      await fetchRoster();
      setEditingStudent(null);
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      alert(err.message || 'Failed to update marks');
    } finally {
      setSavingMarks(false);
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      (s.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.rollNo || '').includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Faculty Academics & Coursework Manager
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Publish continuous assessments, review student submissions, and manage verified grade marks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'assignments' && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Assignment</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-white border border-slate-200 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('assignments')}
          className={`py-2 px-4 text-xs font-semibold rounded-lg flex items-center gap-2 transition-all ${
            activeTab === 'assignments'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          <span>Assignments & Submissions ({assignments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('roster')}
          className={`py-2 px-4 text-xs font-semibold rounded-lg flex items-center gap-2 transition-all ${
            activeTab === 'roster'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users2 className="w-4 h-4" />
          <span>Class Roster & Mark Registry ({students.length})</span>
        </button>
      </div>

      {/* TAB 1: Assignments & Grading */}
      {activeTab === 'assignments' && (
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white p-12 text-center text-slate-400 rounded-2xl border border-slate-200">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
              <span>Loading assignments from database...</span>
            </div>
          ) : assignments.length === 0 ? (
            <div className="bg-white p-12 text-center text-slate-400 rounded-2xl border border-slate-200">
              <FileCheck2 className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="font-semibold text-slate-600">No course assignments published yet.</p>
              <p className="text-xs text-slate-400 mt-1">Click "Create New Assignment" above to assign problem sets.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assignments.map((asg) => (
                <div
                  key={asg.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                        {asg.courseCode}
                      </span>
                      <span className="text-[11px] font-medium text-slate-500">
                        Sec {asg.section}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm leading-snug">
                      {asg.title}
                    </h3>

                    {asg.unitTopic && (
                      <div className="text-[11px] text-indigo-600 font-medium mt-1">
                        {asg.unitTopic}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="text-[11px] text-slate-500">
                      <div>Due: <span className="font-semibold text-slate-700">{asg.dueDate}</span></div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {asg.submissionsCount || 0} submitted • {asg.gradedCount || 0} graded
                      </div>
                    </div>

                    <button
                      onClick={() => handleViewSubmissions(asg)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Review</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Class Roster & Marks */}
      {activeTab === 'roster' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-2 w-full sm:w-72 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by student name or roll no..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-xs text-slate-800 w-full"
              />
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Showing {filteredStudents.length} Students
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4 sm:px-6">Roll No</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4 text-center">Continuous Avg</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((s) => (
                  <tr key={s.id || s.rollNo} className="hover:bg-slate-50/60">
                    <td className="py-3.5 px-4 sm:px-6 font-mono font-semibold text-slate-900">
                      {s.rollNo}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {s.name}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800">
                      {s.avgScore}%
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Badge variant={s.avgScore >= 80 ? 'success' : s.avgScore >= 65 ? 'default' : 'warning'}>
                        {s.avgScore >= 80 ? 'Excelling' : s.avgScore >= 65 ? 'On Track' : 'Needs Support'}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 text-right">
                      <button
                        onClick={() => { setEditingStudent(s); setNewScore(s.avgScore); }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Update Marks</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Create Assignment */}
      {isCreateModalOpen && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Create & Publish Course Assignment"
          maxWidth="max-w-lg"
        >
          <form onSubmit={handleCreateAssignment} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Assignment Title *</label>
              <input
                type="text"
                required
                value={createForm.title}
                onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                placeholder="e.g. Balanced Tree Rotations & Invariant Verification"
                className="w-full text-xs rounded-xl border border-slate-200 py-2 px-3 bg-slate-50 focus:bg-white outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Course Code *</label>
                <select
                  value={createForm.courseCode}
                  onChange={(e) => setCreateForm({ ...createForm, courseCode: e.target.value })}
                  className="w-full text-xs rounded-xl border border-slate-200 py-2 px-3 bg-slate-50 outline-none"
                >
                  <option value="BTCS 301-18">BTCS 301-18 (Data Structures & Algorithms)</option>
                  <option value="BTCS 302-18">BTCS 302-18 (OOP)</option>
                  <option value="BTCS 401-18">BTCS 401-18 (Discrete Mathematics)</option>
                  <option value="BTCS 402-18">BTCS 402-18 (Operating Systems)</option>
                  <option value="BTCS 403-18">BTCS 403-18 (DAA)</option>
                  <option value="BTAM 304-18">BTAM 304-18 (Mathematics-III)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Total Marks *</label>
                <input
                  type="number"
                  required
                  value={createForm.totalPoints}
                  onChange={(e) => setCreateForm({ ...createForm, totalPoints: e.target.value })}
                  className="w-full text-xs rounded-xl border border-slate-200 py-2 px-3 bg-slate-50 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Unit / Syllabus Topic</label>
                <input
                  type="text"
                  value={createForm.unitTopic}
                  onChange={(e) => setCreateForm({ ...createForm, unitTopic: e.target.value })}
                  placeholder="e.g. Unit 3: Dynamic Programming"
                  className="w-full text-xs rounded-xl border border-slate-200 py-2 px-3 bg-slate-50 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Due Date *</label>
                <input
                  type="date"
                  required
                  value={createForm.dueDate}
                  onChange={(e) => setCreateForm({ ...createForm, dueDate: e.target.value })}
                  className="w-full text-xs rounded-xl border border-slate-200 py-2 px-3 bg-slate-50 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Detailed Instructions / Questions</label>
              <textarea
                rows={3}
                required
                value={createForm.description}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                placeholder="Enter complete problem statements, test cases, and formatting instructions..."
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-slate-50 focus:bg-white outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={creating}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors disabled:opacity-50 mt-2"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Publish Assignment to Section</span>}
            </button>
          </form>
        </Modal>
      )}

      {/* Modal: Submissions Review */}
      {selectedAssignmentForSubmissions && (
        <Modal
          isOpen={!!selectedAssignmentForSubmissions}
          onClose={() => { setSelectedAssignmentForSubmissions(null); setGradingSubmission(null); }}
          title={`Submissions: ${selectedAssignmentForSubmissions.title}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4">
            {loadingSubmissions ? (
              <div className="py-8 text-center text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                <span>Loading submissions...</span>
              </div>
            ) : submissions.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                <Clock className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="font-semibold text-slate-600">No student submissions received yet.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {submissions.map((sub) => (
                  <div key={sub._id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-start justify-between gap-3 text-xs">
                    <div>
                      <div className="font-bold text-slate-900">{sub.student?.name}</div>
                      <div className="text-[11px] font-mono text-slate-500">{sub.student?.idNumber} • Sec {sub.student?.section}</div>
                      {sub.fileName && (
                        <div className="text-[11px] text-indigo-600 mt-1 font-mono">Attachment: {sub.fileName}</div>
                      )}
                      {sub.submissionText && (
                        <div className="text-[11px] text-slate-600 mt-1 bg-white p-2 rounded border border-slate-200 font-mono">
                          {sub.submissionText}
                        </div>
                      )}
                      {sub.feedback && (
                        <div className="text-[10px] text-emerald-700 mt-1 font-medium">Feedback: {sub.feedback}</div>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      {sub.status === 'Graded' ? (
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                          {sub.score} pts
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            setGradingSubmission(sub);
                            setGradeScore(sub.score || '');
                            setGradeFeedback(sub.feedback || '');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700"
                        >
                          Grade Work
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* In-line Grading Form */}
            {gradingSubmission && (
              <form onSubmit={handleSaveGrade} className="pt-3 border-t border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-900 text-xs">
                  Grading: {gradingSubmission.student?.name} ({gradingSubmission.student?.idNumber})
                </h4>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Score (out of 100) *</label>
                    <input
                      type="number"
                      required
                      min={0}
                      max={100}
                      value={gradeScore}
                      onChange={(e) => setGradeScore(e.target.value)}
                      className="w-full text-xs rounded-xl border border-slate-200 py-1.5 px-3 bg-white"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Faculty Feedback</label>
                    <input
                      type="text"
                      value={gradeFeedback}
                      onChange={(e) => setGradeFeedback(e.target.value)}
                      placeholder="e.g. Excellent complexity analysis."
                      className="w-full text-xs rounded-xl border border-slate-200 py-1.5 px-3 bg-white"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={grading}
                    className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {grading ? 'Recording...' : 'Confirm Grade & Publish Feedback'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setGradingSubmission(null)}
                    className="py-2 px-3 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </Modal>
      )}

      {/* Modal: Edit Continuous Marks */}
      {editingStudent && (
        <Modal
          isOpen={!!editingStudent}
          onClose={() => setEditingStudent(null)}
          title={`Update Academic Standing — ${editingStudent.name}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleSaveMarks} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Roll Number</label>
              <input
                type="text"
                readOnly
                value={editingStudent.rollNo}
                className="w-full rounded-xl border border-slate-200 py-2 px-3 bg-slate-100 font-mono text-slate-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Continuous Assessment Score (0 - 100%) *</label>
              <input
                type="number"
                required
                min={0}
                max={100}
                value={newScore}
                onChange={(e) => setNewScore(e.target.value)}
                className="w-full rounded-xl border border-slate-200 py-2 px-3 bg-white outline-none font-bold text-slate-900"
              />
            </div>
            <button
              type="submit"
              disabled={savingMarks}
              className="w-full py-2.5 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 mt-2"
            >
              {savingMarks ? 'Saving...' : 'Save Marks to MongoDB'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}

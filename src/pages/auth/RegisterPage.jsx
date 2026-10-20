import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Compass,
  GraduationCap,
  Building2,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { api, setAuthSession } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState('student'); // 'student' or 'teacher'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Common Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [college, setCollege] = useState('Indo Global College of Engineering (IKGPTU)');
  const [phone, setPhone] = useState('');

  // Student-specific Fields
  const [rollNumber, setRollNumber] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [degree, setDegree] = useState('B.Tech');
  const [branch, setBranch] = useState('Computer Science & Engineering');
  const [academicYear, setAcademicYear] = useState('2nd Year');
  const [semester, setSemester] = useState(4);
  const [section, setSection] = useState('CSE-A');

  // Teacher-specific Fields
  const [facultyId, setFacultyId] = useState('');
  const [department, setDepartment] = useState('Department of Computer Science & Engineering');
  const [designation, setDesignation] = useState('Assistant Professor');
  const [subjectsTaught, setSubjectsTaught] = useState('BTCS 301-18, BTCS 403-18');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please ensure both passwords match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      let payload = {};
      if (activeTab === 'student') {
        payload = {
          role: 'student',
          name,
          email,
          password,
          college,
          phone,
          idNumber: rollNumber.trim().toUpperCase(),
          rollNumber: rollNumber.trim().toUpperCase(),
          registrationNumber: registrationNumber.trim() || `REG-${rollNumber.trim().toUpperCase()}`,
          degree,
          branch,
          academicYear,
          semester: Number(semester),
          section,
        };
      } else {
        payload = {
          role: 'faculty',
          name,
          email,
          password,
          college,
          phone,
          idNumber: facultyId.trim().toUpperCase(),
          department,
          designation,
          subjectsTaught,
        };
      }

      const res = await api.register(payload);
      if (res.token && res.user) {
        setAuthSession(res.token, res.user);
        await refreshUser();
      }

      if (res.pendingApproval || res.user?.status === 'pending') {
        navigate('/pending-status');
      } else {
        navigate(activeTab === 'teacher' ? '/teacher/dashboard' : '/student/dashboard');
      }
    } catch (err) {
      setError(err.data?.message || err.message || 'Registration failed. Please verify institutional details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-10 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center">
        <NavLink to="/" className="inline-flex items-center gap-2.5 mb-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-700 flex items-center justify-center text-white shadow-xs">
            <Compass className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-slate-900">
            Saarthi
          </span>
        </NavLink>
        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          Institutional Registration
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Official University Enrolment & Faculty Portal Access
        </p>
      </div>

      <div className="mt-5 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-6 px-6 shadow-xs border border-slate-200/80 rounded-2xl sm:px-8">
          {/* Distinct Role Selection Tabs */}
          <div className="flex p-1 bg-slate-100 rounded-xl mb-5">
            <button
              type="button"
              onClick={() => { setActiveTab('student'); setError(null); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
                activeTab === 'student'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Register as Student</span>
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('teacher'); setError(null); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
                activeTab === 'teacher'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Register as Teacher</span>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Common: Full Name & Official Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Aayush Sharma"
                  className="w-full text-xs rounded-xl border border-slate-200 py-2 px-3 text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {activeTab === 'student' ? 'College Email *' : 'Official College Email *'}
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={activeTab === 'student' ? 'student@college.edu' : 'faculty@college.edu'}
                  className="w-full text-xs rounded-xl border border-slate-200 py-2 px-3 text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            {/* Passwords */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password (min 6 chars) *
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs rounded-xl border border-slate-200 py-2 px-3 text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs rounded-xl border border-slate-200 py-2 px-3 text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            {/* Institution & Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  College / Institution *
                </label>
                <input
                  type="text"
                  required
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-200 py-2 px-3 text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contact Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full text-xs rounded-xl border border-slate-200 py-2 px-3 text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            {/* Student Specific Fields */}
            {activeTab === 'student' && (
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      University Roll Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={rollNumber}
                      onChange={(e) => setRollNumber(e.target.value)}
                      placeholder="e.g. S1001 or 2104889"
                      className="w-full text-xs rounded-xl border border-slate-200 py-2 px-3 text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Registration / Enrollment Number
                    </label>
                    <input
                      type="text"
                      value={registrationNumber}
                      onChange={(e) => setRegistrationNumber(e.target.value)}
                      placeholder="e.g. IKGPTU-2024-CSE-084"
                      className="w-full text-xs rounded-xl border border-slate-200 py-2 px-3 text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Degree & Branch *
                    </label>
                    <input
                      type="text"
                      required
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      placeholder="B.Tech Computer Science & Engineering"
                      className="w-full text-xs rounded-xl border border-slate-200 py-2 px-3 text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Year</label>
                      <select
                        value={academicYear}
                        onChange={(e) => setAcademicYear(e.target.value)}
                        className="w-full text-xs rounded-xl border border-slate-200 py-2 px-2 text-slate-900 bg-slate-50 outline-none"
                      >
                        <option value="1st Year">1st</option>
                        <option value="2nd Year">2nd</option>
                        <option value="3rd Year">3rd</option>
                        <option value="4th Year">4th</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Sem</label>
                      <select
                        value={semester}
                        onChange={(e) => setSemester(Number(e.target.value))}
                        className="w-full text-xs rounded-xl border border-slate-200 py-2 px-2 text-slate-900 bg-slate-50 outline-none"
                      >
                        <option value={1}>1</option>
                        <option value={2}>2</option>
                        <option value={3}>3</option>
                        <option value={4}>4</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Sec</label>
                      <input
                        type="text"
                        value={section}
                        onChange={(e) => setSection(e.target.value)}
                        className="w-full text-xs rounded-xl border border-slate-200 py-2 px-2 text-slate-900 bg-slate-50 outline-none font-mono text-center"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Teacher Specific Fields */}
            {activeTab === 'teacher' && (
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] leading-relaxed">
                  <strong>Administrative Approval Required:</strong> In accordance with university cybersecurity policies, teacher registrations remain in a pending verification status until authorized by an Administrator.
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Employee / Faculty ID *
                    </label>
                    <input
                      type="text"
                      required
                      value={facultyId}
                      onChange={(e) => setFacultyId(e.target.value)}
                      placeholder="e.g. T2004 or FAC-CSE-12"
                      className="w-full text-xs rounded-xl border border-slate-200 py-2 px-3 text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Designation *
                    </label>
                    <select
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      className="w-full text-xs rounded-xl border border-slate-200 py-2 px-3 text-slate-900 bg-slate-50 outline-none"
                    >
                      <option value="Assistant Professor">Assistant Professor</option>
                      <option value="Associate Professor">Associate Professor</option>
                      <option value="Professor & HOD">Professor & HOD</option>
                      <option value="Lab Instructor">Lab Instructor</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Department *
                  </label>
                  <input
                    type="text"
                    required
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-200 py-2 px-3 text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Requested Teaching Course Assignments (PTU Codes)
                  </label>
                  <input
                    type="text"
                    value={subjectsTaught}
                    onChange={(e) => setSubjectsTaught(e.target.value)}
                    placeholder="e.g. BTCS 301-18 (DSA), BTCS 403-18 (DAA)"
                    className="w-full text-xs rounded-xl border border-slate-200 py-2 px-3 text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition-colors disabled:opacity-50 mt-4"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting Enrolment Record...</span>
                </>
              ) : (
                <>
                  <span>
                    {activeTab === 'student' ? 'Complete Student Enrolment' : 'Submit Faculty Registration'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Already have an institutional account?{' '}
              <NavLink to="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">
                Sign In here
              </NavLink>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

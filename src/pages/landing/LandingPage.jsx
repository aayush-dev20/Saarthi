import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Compass,
  ArrowRight,
  GitFork,
  CalendarCheck,
  GraduationCap,
  Sparkles,
  TrendingUp,
  BrainCircuit,
  Users2,
  CheckCircle2,
  ShieldCheck,
  ChevronRight,
  LogIn,
} from 'lucide-react';
import Modal from '../../components/Modal';
import { setCurrentUser } from '../../utils/storage';
import { studentProfile, teacherProfile } from '../../data/mockData';
import { useAuth } from '../../context/AuthContext';

export default function LandingPage() {
  const navigate = useNavigate();
  const { switchRole } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [role, setRole] = useState('student');
  const [idNumber, setIdNumber] = useState('S1001');
  const [password, setPassword] = useState('student123');
  const [name, setName] = useState('Aayush Sharma');
  const [email, setEmail] = useState('aayush.dev@college.edu');

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    if (selectedRole === 'student') {
      setIdNumber('S1001');
      setPassword('student123');
      setName('Aayush Sharma');
      setEmail('aayush.dev@college.edu');
    } else {
      setIdNumber('T2001');
      setPassword('teacher123');
      setName('Dr. Sarah Jenkins');
      setEmail('sarah.jenkins@faculty.edutrack.edu');
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    const targetRole = role === 'teacher' ? 'faculty' : role;
    if (switchRole) {
      await switchRole(targetRole);
    }
    navigate(targetRole === 'faculty' ? '/teacher/dashboard' : '/student/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Navigation */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <NavLink to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-700 flex items-center justify-center text-white shadow-xs">
              <Compass className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-slate-900">
              Saarthi
            </span>
          </NavLink>

          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-600">
            <a href="#features" className="hover:text-indigo-600 transition-colors">Platform Features</a>
            <a href="#how-it-works" className="hover:text-indigo-600 transition-colors">How It Works</a>
            <a href="#case-study" className="hover:text-indigo-600 transition-colors">Prerequisite Gap Model</a>
          </nav>

          <div className="flex items-center gap-3">
            <NavLink
              to="/login"
              className="text-xs font-semibold text-slate-700 hover:text-indigo-600 px-3 py-2 transition-colors flex items-center gap-1.5"
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </NavLink>

            <NavLink
              to="/register"
              className="text-xs font-semibold px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors"
            >
              Get Started
            </NavLink>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 lg:pt-24 lg:pb-28 overflow-hidden bg-gradient-to-b from-white to-slate-50 border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/70 text-indigo-700 text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>EduTrack + EduBridge: Combined Academic & Learning System</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 max-w-4xl mx-auto leading-[1.15]">
            Understand the Gap.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-700">
              Unlock Your Potential.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Saarthi unites daily academic tracking — attendance, marks, and assignments — with a breakthrough prerequisite gap diagnostic engine that detects foundational misunderstandings before exams.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <NavLink
              to="/login"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <GraduationCap className="w-4 h-4" />
              <span>Enter Student Portal</span>
              <ArrowRight className="w-4 h-4" />
            </NavLink>

            <NavLink
              to="/login"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm border border-slate-300 shadow-xs transition-all flex items-center justify-center gap-2"
            >
              <Users2 className="w-4 h-4 text-indigo-600" />
              <span>Enter Faculty Portal</span>
            </NavLink>
          </div>

          {/* Product Preview Card */}
          <div className="mt-14 max-w-5xl mx-auto rounded-2xl p-2 bg-slate-200/70 border border-slate-200 shadow-xl">
            <div className="bg-white rounded-xl p-5 text-left border border-slate-100">
              {/* Window Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-400" />
                  <span className="w-3 h-3 rounded-full bg-amber-400" />
                  <span className="w-3 h-3 rounded-full bg-emerald-400" />
                  <span className="ml-3 text-xs font-semibold text-slate-500">
                    Saarthi Knowledge Intelligence — Student View
                  </span>
                </div>
                <div className="text-[11px] font-medium text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                  Active Demo Environment
                </div>
              </div>

              {/* Sample Dashboard Preview Content */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Overall Attendance</div>
                  <div className="text-2xl font-bold text-slate-900 mt-1">84.6%</div>
                  <div className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> QR Verified Attendance Active
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Average Marks</div>
                  <div className="text-2xl font-bold text-slate-900 mt-1">78.4%</div>
                  <div className="text-[11px] text-indigo-600 font-medium mt-1">
                    Sem 4 • 5 Core Subjects
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200">
                  <div className="text-[11px] text-amber-800 font-semibold uppercase tracking-wider flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    Signature Diagnosis
                  </div>
                  <div className="text-sm font-bold text-amber-950 mt-1">Prerequisite Gap Detected</div>
                  <div className="text-[11px] text-amber-800 mt-0.5 leading-snug">
                    Differential Equations issue traced back to Integration.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-2">Comprehensive Architecture</h2>
            <h3 className="text-3xl font-bold text-slate-900">
              Everything students and educators need in one platform
            </h3>
            <p className="mt-3 text-sm text-slate-600">
              Built to eliminate both administrative friction and invisible learning barriers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/70 hover:border-indigo-300 transition-all hover:shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-4">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base text-slate-900 mb-2">QR Attendance Tracking</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Dynamic time-based QR code generation for teachers and instant camera or code verification for students.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/70 hover:border-indigo-300 transition-all hover:shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
                <GraduationCap className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base text-slate-900 mb-2">Academic Performance</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Subject-wise internal assessments, semester exams, and class grade analytics with intuitive filters.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/70 hover:border-indigo-300 transition-all hover:shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mb-4">
                <GitFork className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base text-slate-900 mb-2">Prerequisite Gap Graph</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Interactive concept dependency mapping powered by React Flow to pinpoint root-cause weaknesses.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/70 hover:border-indigo-300 transition-all hover:shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-4">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base text-slate-900 mb-2">Practice & Reassessment</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Targeted practice modules with real explanations, paired with reassessment to measure verified growth.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3-Step Workflow */}
      <section id="how-it-works" className="py-20 bg-slate-50 border-y border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-2">The Closed-Loop Cycle</h2>
            <h3 className="text-3xl font-bold text-slate-900">Assess → Practice → Improve</h3>
            <p className="mt-3 text-sm text-slate-600">
              Continuous learning intelligence that turns academic struggles into demonstrable mastery.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 relative shadow-xs">
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full inline-block mb-4">
                Step 01
              </span>
              <h4 className="font-bold text-base text-slate-900 mb-2">Diagnostic Assessment</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Take a targeted diagnostic quiz. Rather than just grading right/wrong, Saarthi examines which prerequisite concepts contributed to the error.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 relative shadow-xs">
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full inline-block mb-4">
                Step 02
              </span>
              <h4 className="font-bold text-base text-slate-900 mb-2">Targeted Recovery</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Receive customized practice sets tailored specifically to the diagnosed prerequisite gap with step-by-step solution breakdowns.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 relative shadow-xs">
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full inline-block mb-4">
                Step 03
              </span>
              <h4 className="font-bold text-base text-slate-900 mb-2">Verified Reassessment</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Complete a reassessment. Watch your concept mastery increase on the graph, while teachers see real-time recovery analytics.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Case Study Section */}
      <section id="case-study" className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-xl">
            <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold mb-3">
              <BrainCircuit className="w-4 h-4" />
              <span>Real-World Learning Journey</span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Case in Point: Differential Equations Bottleneck
            </h3>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-300">
              <div className="bg-white/10 p-4 rounded-xl border border-white/10">
                <div className="font-bold text-white mb-1">1. The Symptom</div>
                <p>
                  A student is struggling with Second-Order Differential Equations, repeatedly failing homework problems.
                </p>
              </div>

              <div className="bg-white/10 p-4 rounded-xl border border-white/10">
                <div className="font-bold text-white mb-1">2. Saarthi's Diagnosis</div>
                <p>
                  The diagnostic test reveals the student understands ODE theory, but fails calculations due to weak <strong>Integration by Parts</strong> fundamentals.
                </p>
              </div>

              <div className="bg-white/10 p-4 rounded-xl border border-white/10">
                <div className="font-bold text-white mb-1">3. The Resolution</div>
                <p>
                  4 targeted integration practice exercises restore foundational fluency. Post-reassessment mastery climbs from 42% to 84%.
                </p>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
              <span className="text-xs text-indigo-200">
                Ready to experience the interactive concept graph and assessments?
              </span>
              <NavLink
                to="/student/learning-gaps"
                className="px-5 py-2.5 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-semibold text-xs transition-colors flex items-center gap-2"
              >
                <span>Launch Learning Gap Map</span>
                <ChevronRight className="w-4 h-4" />
              </NavLink>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-indigo-600" />
            <span className="font-bold text-slate-800">Saarthi</span>
            <span>• Smart Academic & Learning Platform</span>
          </div>
          <div>
            Built with React, Vite, Tailwind CSS, Lucide, Recharts & React Flow.
          </div>
        </div>
      </footer>

      {/* Sign In / Register Modal */}
      <Modal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        title={authMode === 'login' ? 'Sign In to Saarthi' : 'Register for Saarthi'}
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          {/* Role selector tabs */}
          <div className="flex p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => handleRoleSelect('student')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                role === 'student' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
              }`}
            >
              Student Portal
            </button>
            <button
              type="button"
              onClick={() => handleRoleSelect('teacher')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                role === 'teacher' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
              }`}
            >
              Faculty Portal
            </button>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-3">
            {authMode === 'register' && (
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-200 py-2.5 px-3 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Enter full name"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                {role === 'student' ? 'Student ID / Roll No' : 'Faculty ID'}
              </label>
              <input
                type="text"
                required
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 py-2.5 px-3 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                placeholder={role === 'student' ? 'S1001' : 'T2001'}
              />
            </div>

            {authMode === 'register' && (
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-200 py-2.5 px-3 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="name@college.edu"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 py-2.5 px-3 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              {authMode === 'login' ? `Enter as ${role === 'student' ? 'Student' : 'Faculty'}` : 'Complete Registration'}
            </button>
          </form>

          {/* Quick Demo Pre-fill notes */}
          <div className="pt-2 border-t border-slate-100 text-center text-[11px] text-slate-500">
            <strong>Pre-configured Demo Credentials:</strong><br />
            Student: <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700 font-mono">S1001 / student123</code><br />
            Teacher: <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700 font-mono">T2001 / teacher123</code>
          </div>

          <div className="text-center text-xs">
            {authMode === 'login' ? (
              <button
                type="button"
                onClick={() => setAuthMode('register')}
                className="text-indigo-600 hover:underline font-semibold"
              >
                Need an account? Register here
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className="text-indigo-600 hover:underline font-semibold"
              >
                Already have credentials? Sign in
              </button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}

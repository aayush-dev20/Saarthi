import React from 'react';
import { NavLink } from 'react-router-dom';
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
  ChevronRight,
  LogIn,
  BookOpen,
  FileText,
  UtensilsCrossed,
  Building,
  Bus,
  Trophy,
  Info,
} from 'lucide-react';

/* ─── Feature card data ──────────────────────────────────────────── */
const features = [
  {
    icon: CalendarCheck,
    iconBg: 'bg-indigo-100 text-indigo-700',
    title: 'QR Attendance Tracking',
    desc: 'Dynamic time-based QR code generation for teachers and instant camera or code verification for students.',
    status: 'live',
    cta: { label: 'View Attendance', to: '/login' },
  },
  {
    icon: GraduationCap,
    iconBg: 'bg-emerald-100 text-emerald-700',
    title: 'Academics & Marks',
    desc: 'Subject-wise internal assessments, semester exams, assignments and class grade analytics.',
    status: 'live',
    cta: { label: 'View Academics', to: '/login' },
  },
  {
    icon: GitFork,
    iconBg: 'bg-amber-100 text-amber-800',
    title: 'Prerequisite Gap Graph',
    desc: 'Interactive concept dependency mapping powered by React Flow to pinpoint root-cause learning weaknesses.',
    status: 'live',
    cta: { label: 'Explore Gaps', to: '/login' },
  },
  {
    icon: TrendingUp,
    iconBg: 'bg-blue-100 text-blue-700',
    title: 'Practice & Reassessment',
    desc: 'Targeted practice modules with step-by-step explanations, paired with reassessment to verify growth.',
    status: 'live',
    cta: { label: 'Start Practice', to: '/login' },
  },
  {
    icon: BookOpen,
    iconBg: 'bg-violet-100 text-violet-700',
    title: 'Digital Library',
    desc: 'HMAC-verified library passes, book catalogue, issue/return tracking and automated overdue fine calculation.',
    status: 'live',
    cta: { label: 'Browse Library', to: '/login' },
  },
  {
    icon: FileText,
    iconBg: 'bg-rose-100 text-rose-700',
    title: 'Leave Management',
    desc: 'Apply for leave, track approval status, view history and receive real-time notifications on decisions.',
    status: 'live',
    cta: { label: 'Apply for Leave', to: '/login' },
  },
  {
    icon: UtensilsCrossed,
    iconBg: 'bg-orange-100 text-orange-700',
    title: 'Campus Canteen',
    desc: 'Browse the menu, add items to cart, place orders with OTP verification and track order status live.',
    status: 'live',
    cta: { label: 'Order Food', to: '/login' },
  },
  {
    icon: Trophy,
    iconBg: 'bg-yellow-100 text-yellow-700',
    title: 'CGPA Leaderboard',
    desc: 'Credit-weighted GPA rankings with 4-tier tie-breaking. Toggle between CGPA and SGPA views.',
    status: 'live',
    cta: { label: 'View Rankings', to: '/login' },
  },
  {
    icon: Building,
    iconBg: 'bg-teal-100 text-teal-700',
    title: 'Hostel & Outing',
    desc: 'Room allocation, outing request management, warden approvals and real-time hostel analytics.',
    status: 'live',
    cta: { label: 'Hostel Portal', to: '/login' },
  },
  {
    icon: Bus,
    iconBg: 'bg-cyan-100 text-cyan-700',
    title: 'Transport Services',
    desc: 'Route management, outing attendance tracking and transport manager dashboard.',
    status: 'live',
    cta: { label: 'Transport Portal', to: '/login' },
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans overflow-x-hidden">
      {/* ─── Navigation ─── */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <NavLink to="/" className="flex items-center gap-2.5 shrink-0" aria-label="Saarthi Home">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-700 flex items-center justify-center text-white shadow-xs">
              <Compass className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-slate-900">
              Saarthi
            </span>
          </NavLink>

          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600" aria-label="Landing page navigation">
            <a href="#features" className="hover:text-indigo-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-md px-1">
              Platform Features
            </a>
            <a href="#how-it-works" className="hover:text-indigo-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-md px-1">
              How It Works
            </a>
            <a href="#case-study" className="hover:text-indigo-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-md px-1">
              Prerequisite Gap Model
            </a>
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <NavLink
              to="/login"
              className="text-xs font-semibold text-slate-700 hover:text-indigo-600 px-3 py-2 transition-colors flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-xl"
            >
              <LogIn className="w-4 h-4" aria-hidden="true" />
              Sign In
            </NavLink>

            <NavLink
              to="/register"
              className="text-xs font-semibold px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            >
              Get Started
            </NavLink>
          </div>
        </div>
      </header>

      {/* ─── Hero Section ─── */}
      <section className="relative pt-14 pb-16 lg:pt-20 lg:pb-24 overflow-hidden bg-gradient-to-b from-white to-slate-50 border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/70 text-indigo-700 text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" aria-hidden="true" />
            <span>Integrated College ERP &amp; Learning Intelligence Platform</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold tracking-tight text-slate-900 max-w-4xl mx-auto leading-[1.15]">
            Manage Your Campus.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-700">
              Understand Every Learner.
            </span>
          </h1>

          <p className="mt-5 text-sm sm:text-base lg:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            One connected platform for college academics, attendance, campus services
            and personalized learning support.
          </p>

          <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
            <NavLink
              to="/login"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            >
              <GraduationCap className="w-4 h-4" aria-hidden="true" />
              <span>Enter Student Portal</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </NavLink>

            <NavLink
              to="/login"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm border border-slate-300 shadow-xs transition-all flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <Users2 className="w-4 h-4 text-indigo-600" aria-hidden="true" />
              <span>Enter Faculty Portal</span>
            </NavLink>
          </div>

          {/* Product Preview Card */}
          <div className="mt-12 max-w-5xl mx-auto rounded-2xl p-2 bg-slate-200/70 border border-slate-200 shadow-xl">
            <div className="bg-white rounded-xl p-4 sm:p-5 text-left border border-slate-100">
              {/* Window Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-400" aria-hidden="true" />
                  <span className="w-3 h-3 rounded-full bg-amber-400" aria-hidden="true" />
                  <span className="w-3 h-3 rounded-full bg-emerald-400" aria-hidden="true" />
                  <span className="ml-2 text-xs font-semibold text-slate-500">
                    Saarthi — Student Dashboard Preview
                  </span>
                </div>
                <div className="text-[10px] sm:text-[11px] font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 flex items-center gap-1">
                  <Info className="w-3 h-3" aria-hidden="true" />
                  Illustrative Example — Not Real Data
                </div>
              </div>

              {/* Sample Dashboard Preview Content */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="p-3 sm:p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="text-[10px] sm:text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Overall Attendance</div>
                  <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">84.6%</div>
                  <div className="text-[10px] sm:text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" aria-hidden="true" /> QR Verified
                  </div>
                </div>

                <div className="p-3 sm:p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="text-[10px] sm:text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Average Marks</div>
                  <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">78.4%</div>
                  <div className="text-[10px] sm:text-[11px] text-indigo-600 font-medium mt-1">
                    Sem 4 • 5 Core Subjects
                  </div>
                </div>

                <div className="p-3 sm:p-4 rounded-xl bg-amber-50/80 border border-amber-200">
                  <div className="text-[10px] sm:text-[11px] text-amber-800 font-semibold uppercase tracking-wider flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" aria-hidden="true" />
                    Diagnosis Alert
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-amber-950 mt-1">Prerequisite Gap Detected</div>
                  <div className="text-[10px] sm:text-[11px] text-amber-800 mt-0.5 leading-snug">
                    Differential Equations → Integration
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Feature Grid ─── */}
      <section id="features" className="py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-2">Platform Modules</h2>
            <h3 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Everything students and educators need in one platform
            </h3>
            <p className="mt-3 text-sm text-slate-600">
              From daily attendance and marks to prerequisite-gap diagnostics and campus services.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <article
                  key={f.title}
                  className="group p-5 rounded-2xl bg-slate-50 border border-slate-200/70 hover:border-indigo-300 transition-all hover:shadow-sm flex flex-col"
                >
                  <div className={`w-10 h-10 rounded-xl ${f.iconBg} flex items-center justify-center mb-3`}>
                    <Icon className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <h4 className="font-bold text-sm sm:text-base text-slate-900 mb-1.5">{f.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed flex-1">{f.desc}</p>
                  {f.cta && (
                    <NavLink
                      to={f.cta.to}
                      className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-md"
                    >
                      {f.cta.label}
                      <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </NavLink>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── 3-Step Workflow ─── */}
      <section id="how-it-works" className="py-16 lg:py-20 bg-slate-50 border-y border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-2">The Closed-Loop Cycle</h2>
            <h3 className="text-2xl sm:text-3xl font-bold text-slate-900">Assess → Practice → Improve</h3>
            <p className="mt-3 text-sm text-slate-600">
              Continuous learning intelligence that turns academic struggles into demonstrable mastery.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {[
              {
                step: '01',
                title: 'Diagnostic Assessment',
                desc: 'Take a targeted diagnostic quiz. Rather than just grading right/wrong, Saarthi examines which prerequisite concepts contributed to the error.',
              },
              {
                step: '02',
                title: 'Targeted Recovery',
                desc: 'Receive customized practice sets tailored specifically to the diagnosed prerequisite gap with step-by-step solution breakdowns.',
              },
              {
                step: '03',
                title: 'Verified Reassessment',
                desc: 'Complete a reassessment. Watch your concept mastery increase on the graph, while teachers see real-time recovery analytics.',
              },
            ].map((s) => (
              <article key={s.step} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full inline-block mb-4">
                  Step {s.step}
                </span>
                <h4 className="font-bold text-base text-slate-900 mb-2">{s.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{s.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Case Study Section ─── */}
      <section id="case-study" className="py-16 lg:py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-10 lg:p-12 shadow-xl">
            <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold mb-3">
              <BrainCircuit className="w-4 h-4" aria-hidden="true" />
              <span>Illustrative Learning Journey — Example Scenario</span>
            </div>

            <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">
              Case in Point: Differential Equations Bottleneck
            </h3>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 text-xs text-slate-300">
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
                  4 targeted integration practice exercises restore foundational fluency.
                  Post-reassessment mastery climbs from 42% to 84%.
                </p>
                <p className="mt-1.5 text-[10px] text-indigo-300 italic flex items-center gap-1">
                  <Info className="w-3 h-3 shrink-0" aria-hidden="true" />
                  Illustrative example — not based on actual student records
                </p>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
              <span className="text-xs text-indigo-200">
                Ready to experience the interactive concept graph and assessments?
              </span>
              <NavLink
                to="/login"
                className="px-5 py-2.5 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-semibold text-xs transition-colors flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <span>Try the Learning Gap Map</span>
                <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </NavLink>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-indigo-600" aria-hidden="true" />
            <span className="font-bold text-slate-800">Saarthi</span>
            <span>• Integrated College ERP &amp; Learning Platform</span>
          </div>
          <div>
            Built with React, Vite, Tailwind CSS, Lucide, Recharts &amp; React Flow.
          </div>
        </div>
      </footer>
    </div>
  );
}

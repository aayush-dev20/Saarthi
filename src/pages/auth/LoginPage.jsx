import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Compass,
  Lock,
  User,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Loader2,
  GraduationCap,
  Building2,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginDemo, isAuthenticated, user } = useAuth();

  const [idNumber, setIdNumber] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // If already authenticated and not pending, redirect
  React.useEffect(() => {
    if (isAuthenticated && user) {
      if (user.status === 'pending') {
        navigate('/pending-status', { replace: true });
      } else {
        const redirectPath =
          location.state?.from?.pathname ||
          (user.role === 'faculty'
            ? '/teacher/dashboard'
            : user.role === 'admin'
            ? '/admin/dashboard'
            : user.role === 'transport_manager'
            ? '/transport/dashboard'
            : user.role === 'hostel_warden'
            ? '/hostel/dashboard'
            : '/student/dashboard');
        navigate(redirectPath, { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate, location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!idNumber.trim() || !password) {
      setError('Please provide your ID Number / College Email and Password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await login(idNumber.trim(), password);
      if (res.pendingApproval || res.user?.status === 'pending') {
        navigate('/pending-status');
      } else {
        const targetPath =
          res.user?.role === 'faculty'
            ? '/teacher/dashboard'
            : res.user?.role === 'admin'
            ? '/admin/dashboard'
            : res.user?.role === 'transport_manager'
            ? '/transport/dashboard'
            : res.user?.role === 'hostel_warden'
            ? '/hostel/dashboard'
            : '/student/dashboard';
        navigate(targetPath);
      }
    } catch (err) {
      setError(err.data?.message || err.message || 'Invalid credentials. Please verify your ID and password.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (role) => {
    setLoading(true);
    setError(null);
    try {
      const u = await loginDemo(role);
      const targetPath =
        u.role === 'faculty'
          ? '/teacher/dashboard'
          : u.role === 'admin'
          ? '/admin/dashboard'
          : u.role === 'transport_manager'
          ? '/transport/dashboard'
          : u.role === 'hostel_warden'
          ? '/hostel/dashboard'
          : '/student/dashboard';
      navigate(targetPath);
    } catch (err) {
      setError(err.message || 'Demo authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <NavLink to="/" className="inline-flex items-center gap-2.5 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-700 flex items-center justify-center text-white shadow-sm">
            <Compass className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-slate-900">
            Saarthi
          </span>
        </NavLink>
        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          Institutional Campus Sign In
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Indo Global College of Engineering • Affiliated to I.K. Gujral PTU
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200/80 rounded-2xl sm:px-10">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Institutional ID / Roll Number or Official Email
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  required
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  placeholder="e.g. S1001, T2001, or name@college.edu"
                  className="block w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 font-mono"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
                <NavLink
                  to="/forgot-password"
                  className="text-[11px] font-medium text-indigo-600 hover:text-indigo-700"
                >
                  Forgot password?
                </NavLink>
              </div>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Registration link */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              New to Saarthi?{' '}
              <NavLink to="/register" className="font-semibold text-indigo-600 hover:text-indigo-700">
                Register as Student or Teacher
              </NavLink>
            </p>
          </div>

          {/* Evaluator Fast-Testing Credentials */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 mb-2.5">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>Institutional Test Profiles (1-Click Evaluation):</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => handleQuickDemo('student')}
                className="py-1.5 px-2 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-800 rounded-lg font-medium border border-indigo-100 text-left transition-colors"
              >
                <div className="font-semibold">Student (Aayush)</div>
                <div className="text-[10px] text-indigo-600 font-mono">S1001 / student123</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('faculty')}
                className="py-1.5 px-2 bg-purple-50/70 hover:bg-purple-100 text-purple-800 rounded-lg font-medium border border-purple-100 text-left transition-colors"
              >
                <div className="font-semibold">Faculty (Dr. Rao)</div>
                <div className="text-[10px] text-purple-600 font-mono">T2001 / teacher123</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('admin')}
                className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-medium border border-slate-200 text-left transition-colors"
              >
                <div className="font-semibold">Admin (Col. Varma)</div>
                <div className="text-[10px] text-slate-600 font-mono">A3001 / admin123</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('hostel')}
                className="py-1.5 px-2 bg-amber-50/70 hover:bg-amber-100 text-amber-800 rounded-lg font-medium border border-amber-100 text-left transition-colors"
              >
                <div className="font-semibold">Warden (Dr. Anita)</div>
                <div className="text-[10px] text-amber-600 font-mono">HW5001 / warden123</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

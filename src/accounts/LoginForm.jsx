import React, { useState } from 'react';
import { Eye, EyeOff, Building2, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import authService from "../services/auth.service";

const LoginForm = ({ onSuccess, onSwitchToSignup, onForgotPassword, onBackToLanding }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const credentials = { email, password };
      const result = await authService.login(credentials);

      if (result?.access && result?.user) {
        localStorage.setItem('access_token', result.access);
        localStorage.setItem('refresh_token', result.refresh);
        localStorage.setItem('user', JSON.stringify(result.user));

        onSuccess && onSuccess();
      } else {
        setError('Invalid email or password');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleLogin();
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center p-4">
      {/* Background Glow */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-500/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-500/10 blur-[120px] rounded-full"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Header/Logo */}
        <div className="text-center mb-10">
          <button
            onClick={onBackToLanding}
            className="inline-flex items-center gap-2 text-slate-400 hover:text-teal-500 transition mb-8 text-sm font-medium"
          >
            ← Back to website
          </button>
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-teal-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-teal-500/20">
              <Building2 className="w-7 h-7" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Tenant<span className="text-teal-500">IQ</span></h1>
          </div>
          <p className="text-slate-400 font-medium">Enterprise Knowledge Platform</p>
        </div>

        {/* Login Card */}
        <div className="bg-[#1E293B] border border-slate-800 rounded-3xl shadow-2xl p-8 sm:p-10">
          <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
          <p className="text-slate-400 mb-8">Please enter your details to sign in.</p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div className="text-red-200 text-sm leading-relaxed">{error}</div>
            </div>
          )}

          <div className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2 ml-1">
                Email Address
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-teal-500 transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full pl-12 pr-4 py-3.5 bg-[#0F172A] border border-slate-700 rounded-xl text-white placeholder:text-slate-600 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                  placeholder="name@company.com"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2 ml-1">
                <label className="text-sm font-semibold text-slate-300">
                  Password
                </label>
                <button
                  onClick={onForgotPassword}
                  className="text-xs font-bold text-teal-500 hover:text-teal-400 transition"
                  type="button"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-teal-500 transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full pl-12 pr-12 py-3.5 bg-[#0F172A] border border-slate-700 rounded-xl text-white placeholder:text-slate-600 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                  placeholder="••••••••"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-teal-500 hover:bg-teal-600 disabled:bg-teal-500/50 text-[#0F172A] font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-teal-500/10 active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-3 border-[#0F172A] border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-800 text-center">
            <p className="text-slate-400 text-sm">
              Don't have an account?{' '}
              <button
                onClick={onSwitchToSignup}
                disabled={loading}
                className="text-teal-500 font-bold hover:text-teal-400 underline underline-offset-4 transition"
              >
                Create an account
              </button>
            </p>
          </div>
        </div>

        <p className="text-center text-slate-600 text-xs mt-8 font-medium">
          © {new Date().getFullYear()} TenantIQ Intelligence. Secure & Encrypted Workspace.
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
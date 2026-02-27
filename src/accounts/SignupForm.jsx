// ==================== src/components/SignupForm.jsx ====================
import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
  Building2,
  Mail,
  Lock,
  User,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import authService from '../services/auth.service';

const SignupForm = ({ onSwitchToLogin, onSignupSuccess }) => {
  const [formData, setFormData] = useState({
    full_name: '',
    company_name: '',
    email: '',
    password: '',
    confirm_password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const validateForm = () => {
    if (!formData.full_name.trim()) return setError('Full name is required'), false;
    if (!formData.company_name.trim()) return setError('Company name is required'), false;
    if (!formData.email.trim()) return setError('Email is required'), false;

    if (!/\S+@\S+\.\S+/.test(formData.email))
      return setError('Enter a valid email'), false;

    if (formData.password.length < 8)
      return setError('Password must be at least 8 characters'), false;

    if (formData.password !== formData.confirm_password)
      return setError('Passwords do not match'), false;

    return true;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        full_name: formData.full_name,
        company_name: formData.company_name,
        email: formData.email,
        password: formData.password,
        confirm_password: formData.confirm_password,
      };

      const result = await authService.register(payload);

      if (result?.success) {
        setSuccess(result.message || 'Account created successfully');
        setTimeout(() => onSignupSuccess(formData.email), 1500);
      } else {
        setError(result?.message || 'Signup failed');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center p-4">
      {/* Background Glow */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-500/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-500/10 blur-[120px] rounded-full"></div>
      </div>

      <div className="w-full max-w-2xl relative z-10">
        {/* Header/Logo */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-teal-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-teal-500/20">
              <Building2 className="w-7 h-7" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Tenant<span className="text-teal-500">IQ</span></h1>
          </div>
          <p className="text-slate-400 font-medium tracking-wide">Enterprise Knowledge Platform v2.0</p>
        </div>

        {/* Signup Card */}
        <div className="bg-[#1E293B] border border-slate-800 rounded-3xl shadow-2xl p-8 sm:p-10">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Create Workspace</h2>
            <p className="text-slate-400">Join the next generation of document intelligence.</p>
          </div>

          {/* Alerts */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
              <p className="text-red-200 text-sm leading-relaxed">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-teal-500/10 border border-teal-500/20 rounded-xl p-4 mb-6 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-teal-400 mt-0.5 shrink-0" />
              <p className="text-teal-100 text-sm leading-relaxed">{success}</p>
            </div>
          )}

          {/* Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Full Name"
              icon={<User className="w-5 h-5" />}
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              placeholder="Elon Musk"
              disabled={loading}
            />

            <Input
              label="Company Name"
              icon={<Building2 className="w-5 h-5" />}
              name="company_name"
              value={formData.company_name}
              onChange={handleChange}
              placeholder="SpaceX"
              disabled={loading}
            />

            <div className="md:col-span-2">
              <Input
                label="Work Email"
                icon={<Mail className="w-5 h-5" />}
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="elon@spacex.com"
                disabled={loading}
              />
            </div>

            <PasswordInput
              label="Password"
              name="password"
              value={formData.password}
              show={showPassword}
              toggle={() => setShowPassword(!showPassword)}
              onChange={handleChange}
              disabled={loading}
            />

            <PasswordInput
              label="Confirm Password"
              name="confirm_password"
              value={formData.confirm_password}
              show={showConfirmPassword}
              toggle={() => setShowConfirmPassword(!showConfirmPassword)}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          <button
            onClick={handleSignup}
            disabled={loading}
            className="w-full mt-8 bg-teal-500 hover:bg-teal-600 disabled:bg-teal-500/50 text-[#0F172A] font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-teal-500/10 active:scale-[0.98]"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-3 border-[#0F172A] border-t-transparent rounded-full animate-spin"></div>
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <span>Create Workspace</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          {/* Switch */}
          <div className="mt-8 pt-8 border-t border-slate-800 text-center">
            <p className="text-slate-400 text-sm">
              Already have an account?{' '}
              <button
                onClick={onSwitchToLogin}
                disabled={loading}
                className="text-teal-500 font-bold hover:text-teal-400 underline underline-offset-4 transition"
              >
                Sign In
              </button>
            </p>
          </div>
        </div>

        <p className="text-center text-slate-600 text-xs mt-8 font-medium">
          © {new Date().getFullYear()} TenantIQ Intelligence. Bank-Grade Security Workspace.
        </p>
      </div>
    </div>
  );
};

/* ---------- Reusable Inputs (Themed) ---------- */

const Input = ({ label, icon, ...props }) => (
  <div className="space-y-2">
    <label className="block text-sm font-semibold text-slate-300 ml-1">
      {label}
    </label>
    <div className="relative group">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-teal-500 transition-colors">
        {icon}
      </span>
      <input
        {...props}
        className="w-full pl-12 pr-4 py-3.5 bg-[#0F172A] border border-slate-700 rounded-xl text-white placeholder:text-slate-600 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
      />
    </div>
  </div>
);

const PasswordInput = ({ label, show, toggle, ...props }) => (
  <div className="space-y-2">
    <label className="block text-sm font-semibold text-slate-300 ml-1">
      {label}
    </label>
    <div className="relative group">
      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-teal-500 transition-colors w-5 h-5" />
      <input
        {...props}
        type={show ? 'text' : 'password'}
        className="w-full pl-12 pr-12 py-3.5 bg-[#0F172A] border border-slate-700 rounded-xl text-white placeholder:text-slate-600 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
        placeholder="••••••••"
      />
      <button
        type="button"
        onClick={toggle}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
      >
        {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
      </button>
    </div>
  </div>
);

export default SignupForm;

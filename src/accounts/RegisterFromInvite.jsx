// ==================== src/accounts/RegisterFromInvite.jsx ====================
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, User, CheckCircle, AlertCircle, Shield, Building, ArrowLeft, ArrowRight } from 'lucide-react';
import api from '../services/api';
import authService from '../services/auth.service';

const RegisterFromInvite = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [invitationData, setInvitationData] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    password: '',
    confirmPassword: ''
  });

  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    message: ''
  });

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      validateInvitation(token);
    } else {
      setError('Invalid invitation link. Please request a new invitation.');
      setLoading(false);
    }
  }, [searchParams]);

  const validateInvitation = async (token) => {
    try {
      setLoading(true);
      const response = await api.get(`/invitations/validate/${token}/`);
      setInvitationData(response.data);
      setError('');
      setSuccess('Valid invitation found! Please complete your registration.');
    } catch (err) {
      setError('Invitation link is invalid or has expired. Please contact your administrator.');
      console.error('Validation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkPasswordStrength = (password) => {
    let score = 0;
    let message = '';

    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    switch (score) {
      case 0:
      case 1:
        message = 'Weak';
        break;
      case 2:
        message = 'Fair';
        break;
      case 3:
        message = 'Good';
        break;
      case 4:
        message = 'Strong';
        break;
      default:
        message = 'Weak';
    }

    setPasswordStrength({ score, message });
  };

  const handlePasswordChange = (password) => {
    setFormData({ ...formData, password });
    checkPasswordStrength(password);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!formData.name.trim()) {
      setError('Please enter your full name');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (passwordStrength.score < 2) {
      setError('Please choose a stronger password');
      return;
    }

    setRegistering(true);
    try {
      const token = searchParams.get('token');
      const response = await api.post('/auth/register-from-invite/', {
        token,
        name: formData.name.trim(),
        password: formData.password
      });

      // Auto login after registration
      await authService.login({
        email: invitationData.email,
        password: formData.password
      });

      setSuccess('🎉 Account created successfully! Redirecting to dashboard...');

      // Redirect after delay
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err) {
      console.error('Registration error:', err);
      const errorMsg = err.response?.data?.error ||
        err.response?.data?.message ||
        'Registration failed. Please try again.';
      setError(errorMsg);
    } finally {
      setRegistering(false);
    }
  };

  const getPasswordStrengthColor = () => {
    switch (passwordStrength.score) {
      case 1: return 'bg-red-500';
      case 2: return 'bg-yellow-500';
      case 3: return 'bg-blue-500';
      case 4: return 'bg-green-500';
      default: return 'bg-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 border-4 border-teal-500/10 border-t-teal-500 rounded-full animate-spin mb-6"></div>
        <h2 className="text-xl font-bold text-white mb-2">Validating Invitation</h2>
        <p className="text-slate-400 font-medium tracking-wide">Checking security credentials...</p>
      </div>
    );
  }

  if (error && !invitationData) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center p-4">
        {/* Background Glow */}
        <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-500/10 blur-[120px] rounded-full"></div>
        </div>

        <div className="max-w-md w-full bg-[#1E293B] border border-slate-800 rounded-3xl shadow-2xl p-8 sm:p-10 relative z-10 text-center">
          <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-red-500/20">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Invitation Error</h2>
          <p className="text-slate-400 font-medium mb-8 leading-relaxed">{error}</p>
          <div className="space-y-4">
            <button
              onClick={() => navigate('/login')}
              className="w-full px-6 py-4 bg-teal-500 hover:bg-teal-600 text-[#0F172A] font-bold rounded-xl transition shadow-lg shadow-teal-500/10 active:scale-[0.98]"
            >
              Return to Login
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full px-6 py-4 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 font-bold rounded-xl transition active:scale-[0.98]"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center p-4">
      {/* Background Glow */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-500/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-500/10 blur-[120px] rounded-full"></div>
      </div>

      <div className="max-w-xl w-full relative z-10">
        <div className="bg-[#1E293B] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="p-8 sm:p-10 border-b border-slate-800">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-teal-500 rounded-xl flex items-center justify-center text-[#0F172A] shadow-lg shadow-teal-500/20">
                <Shield className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Join Secure Workspace</h1>
                <p className="text-slate-400 font-medium">Complete your identity profile</p>
              </div>
            </div>
          </div>

          <div className="p-8 sm:p-10">
            {/* Invitation Details */}
            <div className="bg-[#0F172A] border border-slate-700/50 rounded-2xl p-6 mb-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-teal-500/10 rounded-2xl flex items-center justify-center flex-shrink-0 border border-teal-500/20 shadow-lg shadow-teal-500/5">
                  <Mail className="w-6 h-6 text-teal-500" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-white text-lg mb-3">Invitation Found</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-slate-500" />
                      <span className="text-sm text-slate-400 font-medium">Email:</span>
                      <span className="text-sm text-white font-bold">{invitationData?.email}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Shield className="w-4 h-4 text-slate-500" />
                      <span className="text-sm text-slate-400 font-medium">Role:</span>
                      <span className="text-sm text-teal-500 font-bold">
                        {invitationData?.role?.replace('_', ' ') || 'Team Member'}
                      </span>
                    </div>
                    {invitationData?.company_name && (
                      <div className="flex items-center gap-3">
                        <Building className="w-4 h-4 text-slate-500" />
                        <span className="text-sm text-slate-400 font-medium">Org:</span>
                        <span className="text-sm text-white font-bold">{invitationData.company_name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Success Message */}
            {success && (
              <div className="mb-8 bg-teal-500/10 border border-teal-500/20 rounded-xl p-4 flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-teal-500 shrink-0" />
                <p className="font-bold text-teal-100 text-sm">{success}</p>
              </div>
            )}

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="group">
                <label className="block text-sm font-semibold text-slate-300 mb-2 ml-1">
                  Legal Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-teal-500 transition-colors" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter your name"
                    className="w-full pl-12 pr-4 py-4 bg-[#0F172A] border border-slate-700 rounded-2xl text-white placeholder:text-slate-600 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="group">
                <label className="block text-sm font-semibold text-slate-300 mb-2 ml-1">
                  Secure Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-teal-500 transition-colors" />
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    placeholder="Create your secret key"
                    className="w-full pl-12 pr-4 py-4 bg-[#0F172A] border border-slate-700 rounded-2xl text-white placeholder:text-slate-600 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                    required
                  />
                </div>

                {/* Password Strength Indicator */}
                {formData.password && (
                  <div className="mt-4 bg-[#0F172A]/50 p-4 rounded-xl border border-slate-700/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Complexity</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${passwordStrength.score === 1 ? 'bg-red-500/10 text-red-500' :
                        passwordStrength.score === 2 ? 'bg-yellow-500/10 text-yellow-500' :
                          passwordStrength.score === 3 ? 'bg-blue-500/10 text-blue-500' :
                            passwordStrength.score === 4 ? 'bg-teal-500/10 text-teal-500' : 'bg-slate-500/10 text-slate-500'
                        }`}>
                        {passwordStrength.message}
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mb-4">
                      <div
                        className={`h-full transition-all duration-500 ${getPasswordStrengthColor().replace('bg-', 'bg-')}`}
                        style={{ width: `${passwordStrength.score * 25}%` }}
                      ></div>
                    </div>
                    <div className="grid grid-cols-2 gap-y-2">
                      <SecurityHook label="8+ Characters" active={formData.password.length >= 8} />
                      <SecurityHook label="Uppercase" active={/[A-Z]/.test(formData.password)} />
                      <SecurityHook label="Number" active={/[0-9]/.test(formData.password)} />
                      <SecurityHook label="Special Char" active={/[^A-Za-z0-9]/.test(formData.password)} />
                    </div>
                  </div>
                )}
              </div>

              <div className="group">
                <label className="block text-sm font-semibold text-slate-300 mb-2 ml-1">
                  Confirm Key
                </label>
                <div className="relative">
                  <CheckCircle className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${formData.password === formData.confirmPassword && formData.confirmPassword ? 'text-teal-500' : 'text-slate-500'}`} />
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="Repeat password"
                    className="w-full pl-12 pr-4 py-4 bg-[#0F172A] border border-slate-700 rounded-2xl text-white placeholder:text-slate-600 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                    required
                  />
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-red-200 text-sm leading-relaxed">{error}</p>
                </div>
              )}

              {/* Terms & Conditions */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
                <div className="flex items-start gap-4">
                  <div className="relative flex items-center mt-1">
                    <input
                      type="checkbox"
                      id="terms"
                      required
                      className="w-5 h-5 rounded-md border-slate-700 bg-[#0F172A] text-teal-500 focus:ring-teal-500/20 focus:ring-offset-0"
                    />
                  </div>
                  <label htmlFor="terms" className="text-sm text-slate-400 leading-relaxed font-medium">
                    I agree to the <button type="button" className="text-teal-500 hover:text-teal-400 font-bold transition underline underline-offset-4">Terms of Intelligence</button> and <button type="button" className="text-teal-500 hover:text-teal-400 font-bold transition underline underline-offset-4">Privacy Standards</button>. My account will be joined to {invitationData?.company_name || 'the organization'}.
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={registering}
                className="w-full py-5 bg-teal-500 hover:bg-teal-600 text-[#0F172A] font-bold rounded-2xl shadow-lg shadow-teal-500/10 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {registering ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-6 h-6 border-3 border-[#0F172A] border-t-transparent rounded-full animate-spin"></div>
                    <span>Initializing Account...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <span>Activate Account & Join Team</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </div>
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full py-4 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition flex items-center justify-center gap-2 font-bold text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Authentication</span>
              </button>
            </form>
          </div>
        </div>

        {/* Security Info */}
        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-600 font-bold uppercase tracking-widest">
          <Shield className="w-4 h-4 text-teal-500/50" />
          <span>Post-Quantum Security Enabled</span>
        </div>
      </div>
    </div>
  );
};

const SecurityHook = ({ label, active }) => (
  <div className="flex items-center gap-2">
    <CheckCircle className={`w-3.5 h-3.5 ${active ? 'text-teal-500' : 'text-slate-700'}`} />
    <span className={`text-[10px] font-bold uppercase tracking-tight ${active ? 'text-slate-300' : 'text-slate-600'}`}>{label}</span>
  </div>
);

export default RegisterFromInvite;
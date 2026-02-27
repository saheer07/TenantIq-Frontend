// ==================== src/accounts/ForgotPassword.jsx ====================
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle, AlertCircle, Loader, Lock, Eye, EyeOff } from 'lucide-react';
import authService from '../services/auth.service';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Email, 2: OTP + New Password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  // Step 1: Send OTP to email
  const handleSendOTP = async (e) => {
    e.preventDefault();

    setError('');

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      console.log('Sending password reset OTP to:', email);

      await authService.forgotPassword(email);

      setOtpSent(true);
      setStep(2);

    } catch (err) {
      console.error('Password reset error:', err);

      if (err.response) {
        const status = err.response.status;
        const data = err.response.data;

        if (status === 404) {
          setError('No account found with this email address');
        } else if (status === 400) {
          setError(data.message || data.error || data.detail || 'Invalid email address');
        } else if (status === 429) {
          setError('Too many requests. Please try again later');
        } else if (status >= 500) {
          setError('Server error. Please try again later');
        } else {
          setError(data.message || data.error || data.detail || 'Failed to send reset code');
        }
      } else if (err.request) {
        setError('Cannot connect to server. Please check your internet connection');
      } else {
        setError('An unexpected error occurred. Please try again');
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Reset password with OTP
  const handleResetPassword = async (e) => {
    e.preventDefault();

    setError('');

    if (!otp) {
      setError('Please enter the verification code');
      return;
    }

    if (otp.length !== 6) {
      setError('Verification code must be 6 digits');
      return;
    }

    if (!newPassword) {
      setError('Please enter a new password');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      console.log('Resetting password with OTP');

      // ✅ FIXED: Changed 'otp' to 'token: otp' to match the service parameter name
      await authService.resetPassword({
        email,
        token: otp,  // Changed from 'otp' to 'token: otp'
        new_password: newPassword
      });

      // Show success and redirect to login
      alert('Password reset successful! Please login with your new password.');
      navigate('/login');

    } catch (err) {
      console.error('Password reset error:', err);

      if (err.response) {
        const status = err.response.status;
        const data = err.response.data;

        if (status === 400) {
          setError(data.message || data.error || data.detail || 'Invalid verification code or password');
        } else if (status === 404) {
          setError('Invalid or expired verification code');
        } else if (status >= 500) {
          setError('Server error. Please try again later');
        } else {
          setError(data.message || data.error || data.detail || 'Failed to reset password');
        }
      } else if (err.request) {
        setError('Cannot connect to server. Please check your internet connection');
      } else {
        setError('An unexpected error occurred. Please try again');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError('');
    setLoading(true);

    try {
      await authService.forgotPassword(email);
      alert('Verification code resent! Check your email.');
    } catch (err) {
      setError('Failed to resend code. Please try again.');
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

      <div className="w-full max-w-md relative z-10">
        <button
          onClick={() => step === 2 ? setStep(1) : navigate('/login')}
          className="inline-flex items-center gap-2 text-slate-400 hover:text-teal-500 transition mb-8 text-sm font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{step === 2 ? 'Change Email' : 'Back to Authentication'}</span>
        </button>

        <div className="bg-[#1E293B] border border-slate-800 rounded-3xl shadow-2xl p-8 sm:p-10">
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-teal-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-teal-500/20 shadow-lg shadow-teal-500/5">
              {step === 1 ? (
                <Mail className="w-10 h-10 text-teal-500" />
              ) : (
                <Lock className="w-10 h-10 text-teal-500" />
              )}
            </div>
            <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">
              {step === 1 ? 'Forgot Password?' : 'Reset Password'}
            </h2>
            <p className="text-slate-400 font-medium">
              {step === 1
                ? "We'll send a secure authorization code."
                : 'Set a new secure password for your account.'
              }
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mb-8 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="text-red-200 text-sm leading-relaxed">{error}</div>
            </div>
          )}

          {step === 1 ? (
            // Step 1: Email Form
            <form onSubmit={handleSendOTP} className="space-y-6">
              <div className="group">
                <label htmlFor="email" className="block text-sm font-semibold text-slate-300 mb-2 ml-1">
                  Recovery Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-teal-500 transition-colors" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    disabled={loading}
                    className="w-full pl-12 pr-4 py-4 bg-[#0F172A] border border-slate-700 rounded-2xl text-white placeholder:text-slate-600 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all disabled:opacity-50"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-teal-500 hover:bg-teal-600 text-[#0F172A] font-bold py-4 rounded-xl transition-all shadow-lg shadow-teal-500/10 disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Sending Identity Link...</span>
                  </>
                ) : (
                  <span>Send Recovery Code</span>
                )}
              </button>
            </form>
          ) : (
            // Step 2: OTP + New Password Form
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div className="group">
                <label htmlFor="otp" className="block text-sm font-semibold text-slate-300 mb-2 ml-1">
                  6-Digit Verification Code
                </label>
                <input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  disabled={loading}
                  maxLength={6}
                  className="w-full px-2 sm:px-4 py-4 bg-[#0F172A] border border-slate-700 rounded-2xl text-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all disabled:opacity-50 text-center text-xl sm:text-3xl tracking-[0.2em] sm:tracking-[0.5em] font-mono font-bold"
                  required
                />
                <p className="text-xs text-slate-500 mt-3 text-center font-medium">
                  Authorizing reset for <span className="text-teal-500">{email}</span>
                </p>
              </div>

              <div className="space-y-6">
                <div className="group">
                  <label htmlFor="newPassword" className="block text-sm font-semibold text-slate-300 mb-2 ml-1">
                    Secure New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-teal-500 transition-colors" />
                    <input
                      id="newPassword"
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      disabled={loading}
                      className="w-full pl-12 pr-12 py-4 bg-[#0F172A] border border-slate-700 rounded-2xl text-white placeholder:text-slate-600 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all disabled:opacity-50"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="group">
                  <label htmlFor="confirmPassword" className="block text-sm font-semibold text-slate-300 mb-2 ml-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-teal-500 transition-colors" />
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Match passwords"
                      disabled={loading}
                      className="w-full pl-12 pr-12 py-4 bg-[#0F172A] border border-slate-700 rounded-2xl text-white placeholder:text-slate-600 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all disabled:opacity-50"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-2 space-y-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-teal-500 hover:bg-teal-600 text-[#0F172A] font-bold py-4 rounded-xl transition-all shadow-lg shadow-teal-500/10 disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  {loading ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      <span>Saving Password...</span>
                    </>
                  ) : (
                    <span>Update Recovery Password</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={loading}
                  className="w-full text-teal-500 hover:text-teal-400 font-bold text-sm transition-colors disabled:opacity-50 py-2"
                >
                  Didn't receive code? Resend Link
                </button>
              </div>
            </form>
          )}

          <div className="mt-8 pt-8 border-t border-slate-800">
            <p className="text-center text-sm text-slate-400 font-medium">
              Remembered your credentials?{' '}
              <button
                onClick={() => navigate('/login')}
                className="text-teal-500 hover:text-teal-400 font-bold transition-colors underline underline-offset-4"
              >
                Sign In
              </button>
            </p>
          </div>
        </div>

        <div className="mt-8 text-center px-6">
          <p className="text-xs text-slate-600 font-medium leading-relaxed">
            Trouble with recovery? Contact our security response team at{' '}
            <a
              href="mailto:support@tenantiq.ai"
              className="text-slate-500 hover:text-teal-500 transition-colors"
            >
              security@tenantiq.ai
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle, AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import authService from '../services/auth.service';

const EmailVerification = ({ onVerificationComplete, onBackToLogin, userEmail }) => {
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendError, setResendError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [isAlreadyVerified, setIsAlreadyVerified] = useState(false);

  useEffect(() => {
    // Determine the email from props, current user, or storage
    let userEmailAddress = userEmail || authService.getCurrentUser()?.email || localStorage.getItem('pending_verification_email') || sessionStorage.getItem('signup_email');

    if (!userEmailAddress) {
      const promptedEmail = prompt('Please enter your email address for verification:');
      if (promptedEmail) {
        userEmailAddress = promptedEmail;
        sessionStorage.setItem('signup_email', promptedEmail);
      }
    }

    setEmail(userEmailAddress);
    console.log('Email found:', userEmailAddress);

    // Auto verify if token exists in URL (from email link)
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token && userEmailAddress) {
      handleVerify(token, userEmailAddress);
    }
  }, [userEmail]);

  const handleVerify = async (otp = verificationCode, userEmailAddress = email) => {
    const cleanOtp = otp?.trim();

    if (!cleanOtp) {
      setError('Please enter verification code');
      return;
    }

    if (!userEmailAddress) {
      setError('Email address not found. Please try signing up again.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      console.log('Calling verifyEmail with:', { email: userEmailAddress, otp: cleanOtp });
      const result = await authService.verifyEmail({ email: userEmailAddress, otp: cleanOtp });
      console.log('Verification result:', result);

      if (result?.success) {
        setMessage('Email verified successfully! Redirecting to login...');
        localStorage.removeItem('pending_verification_email');
        sessionStorage.removeItem('signup_email');

        setTimeout(() => {
          if (onVerificationComplete) onVerificationComplete();
        }, 2000);
      } else {
        setError(result?.message || 'Verification failed. Please check your code and try again.');
      }
    } catch (err) {
      console.error('Verification error:', err);
      setError(err.message || 'An error occurred during verification. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) {
      return;
    }

    try {
      setResendLoading(true);
      setResendError('');

      const emailToResend = email || localStorage.getItem('pending_verification_email');

      console.log('📧 Resending verification to:', emailToResend);

      if (!emailToResend) {
        setResendError('Email address not found. Please try signing up again.');
        return;
      }

      const result = await authService.resendVerification(emailToResend);

      console.log('✅ Resend successful:', result);

      // Show success message
      setResendError(''); // Clear any previous errors
      alert('Verification code sent! Please check your email.');

      // Start cooldown
      setResendCooldown(60);
      const interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

    } catch (error) {
      console.error('❌ Resend error:', error);

      // Display user-friendly error message
      if (error.message.includes('already verified')) {
        setResendError('This email is already verified. Please try logging in.');
      } else if (error.message.includes('not found')) {
        setResendError('Email not found. Please sign up first.');
      } else if (error.message.includes('rate limit')) {
        setResendError('Too many requests. Please wait a few minutes and try again.');
      } else {
        setResendError(error.message || 'Failed to resend verification code. Please try again.');
      }
    } finally {
      setResendLoading(false);
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
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-teal-500/10 rounded-3xl mb-6 border border-teal-500/20">
            <Mail className="w-10 h-10 text-teal-500" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Verify Your Email</h1>
          <p className="text-slate-400 font-medium">
            We've sent a 6-digit code to
            <br />
            <span className="text-teal-400 font-bold">{email || 'your email'}</span>
          </p>
        </div>

        {/* Verification Box */}
        <div className="bg-[#1E293B] border border-slate-800 rounded-3xl shadow-2xl p-8 sm:p-10">
          <h2 className="text-xl font-bold text-white mb-6 text-center">
            Enter Authentication Code
          </h2>

          {/* Already Verified Success */}
          {isAlreadyVerified && (
            <div className="bg-teal-500/10 border border-teal-500/20 rounded-2xl p-6 mb-4">
              <div className="flex flex-col items-center text-center gap-4">
                <CheckCircle className="w-12 h-12 text-teal-500" />
                <div>
                  <h3 className="font-bold text-white text-lg mb-1">Email Already Verified</h3>
                  <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                    Your account is fully verified. You can now access your workspace.
                  </p>
                  <button
                    onClick={onBackToLogin}
                    className="w-full px-6 py-3 bg-teal-500 hover:bg-teal-600 text-[#0F172A] font-bold rounded-xl transition shadow-lg shadow-teal-500/10"
                  >
                    Go to Login
                  </button>
                </div>
              </div>
            </div>
          )}

          {message && !isAlreadyVerified && (
            <div className="bg-teal-500/10 border border-teal-500/20 rounded-xl p-4 mb-6 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-teal-500 shrink-0 mt-0.5" />
              <div className="text-teal-100 text-sm leading-relaxed">{message}</div>
            </div>
          )}

          {error && !isAlreadyVerified && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div className="text-red-200 text-sm leading-relaxed">{error}</div>
            </div>
          )}

          {!isAlreadyVerified && (
            <div className="space-y-6">
              <div className="group">
                <label className="block text-sm font-semibold text-slate-300 mb-2 ml-1">
                  Verification Code (OTP)
                </label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleVerify()}
                  className="w-full px-2 sm:px-4 py-4 bg-[#0F172A] border border-slate-700 rounded-2xl text-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none text-center text-xl sm:text-3xl tracking-[0.2em] sm:tracking-[0.5em] font-mono font-bold transition-all"
                  placeholder="000000"
                  disabled={loading || !email}
                  maxLength={6}
                  autoFocus
                />
                <p className="text-xs text-slate-500 mt-3 text-center font-medium">
                  Enter the code from your inbox to confirm identity.
                </p>
              </div>

              {/* Verify Button */}
              <button
                onClick={() => handleVerify()}
                disabled={loading || !verificationCode.trim() || !email}
                className="w-full bg-teal-500 hover:bg-teal-600 disabled:bg-teal-500/50 disabled:cursor-not-allowed text-[#0F172A] font-bold py-4 rounded-xl transition-all shadow-lg shadow-teal-500/10 flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-3 border-[#0F172A] border-t-transparent rounded-full animate-spin"></div>
                    <span>Verifying Identity...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span>Verify My Email</span>
                  </>
                )}
              </button>

              {/* Resend Button */}
              <div className="text-center pt-6 border-t border-slate-800">
                <p className="text-sm text-slate-400 mb-4 font-medium">
                  Didn't receive the code?
                </p>
                <button
                  onClick={handleResend}
                  disabled={resendLoading || resendCooldown > 0 || !email}
                  className="text-teal-500 hover:text-teal-400 font-bold text-sm flex items-center gap-2 mx-auto disabled:text-slate-600 disabled:cursor-not-allowed transition-colors"
                >
                  {resendLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                      <span>Sending...</span>
                    </>
                  ) : resendCooldown > 0 ? (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      <span>Request again in {resendCooldown}s</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      <span>Resend Verification Code</span>
                    </>
                  )}
                </button>
                {resendError && (
                  <p className="text-red-500 text-xs mt-3 font-medium bg-red-500/5 py-2 px-4 rounded-lg border border-red-500/10 inline-block">{resendError}</p>
                )}
              </div>
            </div>
          )}

          {/* Back to Login - Always visible */}
          {onBackToLogin && (
            <button
              onClick={onBackToLogin}
              className="w-full flex items-center justify-center gap-2 text-slate-400 hover:text-teal-500 text-sm font-bold mt-8 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Authentication</span>
            </button>
          )}
        </div>

        <p className="text-center text-slate-600 text-xs mt-8 font-medium">
          © {new Date().getFullYear()} TenantIQ Intelligence. Secure & Encrypted Workspace.
        </p>
      </div>
    </div>
  );
};

export default EmailVerification;
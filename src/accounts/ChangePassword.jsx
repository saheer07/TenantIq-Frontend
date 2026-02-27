// ==================== src/components/ChangePassword.jsx ====================
import React, { useState } from 'react';
import { Lock, X, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import authService from '../services/auth.service';

const ChangePassword = ({ onClose }) => {
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.oldPassword) {
      setError('Please enter your current password');
      return false;
    }

    if (!formData.newPassword) {
      setError('Please enter a new password');
      return false;
    }

    if (formData.newPassword.length < 8) {
      setError('New password must be at least 8 characters');
      return false;
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.newPassword)) {
      setError('Password must contain uppercase, lowercase, and number');
      return false;
    }

    if (formData.newPassword === formData.oldPassword) {
      setError('New password must be different from old password');
      return false;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const result = await authService.changePassword(
        formData.oldPassword,
        formData.newPassword
      );

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          onClose?.();
        }, 2000);
      } else {
        setError(result.message || 'Failed to change password');
      }
    } catch (err) {
      console.error('Change password error:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0F172A]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1E293B] border border-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-500/10 rounded-xl flex items-center justify-center border border-teal-500/20">
              <Lock className="w-5 h-5 text-teal-500" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">Change Password</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition p-1 hover:bg-slate-800 rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {success && (
            <div className="bg-teal-500/10 border border-teal-500/20 rounded-xl p-4 mb-6 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-teal-500 shrink-0 mt-0.5" />
              <div className="text-teal-100 text-sm font-bold">
                Password successfully updated. Secure access restored.
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div className="text-red-200 text-sm font-medium">{error}</div>
            </div>
          )}

          <div className="space-y-5">
            {/* Current Password */}
            <div className="group">
              <label className="block text-sm font-semibold text-slate-300 mb-2 ml-1">
                Current Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-teal-500 transition-colors" />
                <input
                  type={showOldPassword ? 'text' : 'password'}
                  name="oldPassword"
                  value={formData.oldPassword}
                  onChange={handleChange}
                  className="w-full pl-10 pr-12 py-3 bg-[#0F172A] border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                  placeholder="Enter current password"
                  disabled={loading || success}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-white"
                  disabled={loading || success}
                >
                  {showOldPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="group">
              <label className="block text-sm font-semibold text-slate-300 mb-2 ml-1">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-teal-500 transition-colors" />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  className="w-full pl-10 pr-12 py-3 bg-[#0F172A] border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                  placeholder="Enter new password"
                  disabled={loading || success}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-white"
                  disabled={loading || success}
                >
                  {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="mt-2 text-[11px] text-slate-500 font-bold uppercase tracking-wider ml-1">
                Min 8 chars • Uppercase • Lowercase • Number
              </p>
            </div>

            {/* Confirm New Password */}
            <div className="group">
              <label className="block text-sm font-semibold text-slate-300 mb-2 ml-1">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-teal-500 transition-colors" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full pl-10 pr-12 py-3 bg-[#0F172A] border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                  placeholder="Confirm new password"
                  disabled={loading || success}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-white"
                  disabled={loading || success}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 mt-8">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-slate-700 text-slate-300 font-bold rounded-xl hover:bg-slate-800 hover:text-white transition active:scale-[0.98]"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || success}
              className="flex-1 px-4 py-3 bg-teal-500 text-[#0F172A] font-bold rounded-xl hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-teal-500/10"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-[#0F172A] border-t-transparent rounded-full animate-spin"></div>
                  <span>Updating...</span>
                </>
              ) : success ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span>Verified</span>
                </>
              ) : (
                'Update Password'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;
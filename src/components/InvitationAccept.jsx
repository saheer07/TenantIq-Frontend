// ==================== src/components/InvitationAccept.jsx ====================
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Check, AlertCircle, UserPlus, Shield } from 'lucide-react';
import api from '../services/api';

const InvitationAccept = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [invitation, setInvitation] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    fetchInvitation();
  }, [token]);

  const fetchInvitation = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/invitations/${token}/`);
      setInvitation(response.data);
    } catch (error) {
      console.error('Failed to fetch invitation:', error);
      setError(error.response?.data?.error || 'Invalid or expired invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const response = await api.post(`/invitations/${token}/accept/`, {
        name: formData.name,
        password: formData.password
      });

      alert('Account created successfully! You can now log in.');
      navigate('/login');
    } catch (error) {
      console.error('Failed to accept invitation:', error);
      setError(error.response?.data?.error || 'Failed to create account');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-slate-400">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-[#1E293B] rounded-xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Invitation Error</h2>
            <p className="text-slate-400 mb-6">{error}</p>
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-[#1E293B] rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-600 to-indigo-600 p-6 text-white">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#1E293B]/20 rounded-full flex items-center justify-center">
                <UserPlus className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Join {invitation?.tenant_name || 'the team'}</h2>
                <p className="text-teal-100">You've been invited by {invitation?.invited_by_name}</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="p-8">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-teal-600" />
                <span className="font-medium text-slate-700">
                  Role: {invitation?.role?.replace('_', ' ')}
                </span>
              </div>

              <div className="space-y-2 text-sm text-slate-400">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Access to AI chat features</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Document upload and management</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Team collaboration tools</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleAccept} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={8}
                  className="w-full px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                  placeholder="Create a password (min. 8 characters)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                  placeholder="Confirm your password"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-teal-600 to-indigo-600 text-white rounded-lg hover:from-teal-700 hover:to-indigo-700 transition font-medium"
              >
                Create Account & Join Team
              </button>
            </form>

            <p className="text-xs text-slate-500 mt-6 text-center">
              By creating an account, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvitationAccept;
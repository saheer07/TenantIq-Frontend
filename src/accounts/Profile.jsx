import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Building, Shield, Calendar, CheckCircle, Edit2, Save, X } from 'lucide-react';
import api from '../services/api';
import authService from '../services/auth.service';

export default function Profile() {
  const [user, setUser] = useState(authService.getCurrentUser());
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [editData, setEditData] = useState({
    name: '',
    phone: '',
    department: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await api.get('/auth/me/');
      setUser(response.data);
      authService.setCurrentUser(response.data);

      // Set initial edit data
      setEditData({
        name: response.data.name || '',
        phone: response.data.phone || '',
        department: response.data.department || '',
      });
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleEditToggle = () => {
    if (editing) {
      // Cancel editing - reset to original data
      setEditData({
        name: user?.name || '',
        phone: user?.phone || '',
        department: user?.department || '',
      });
      setError('');
      setSuccess('');
    }
    setEditing(!editing);
  };

  const handleChange = (e) => {
    setEditData({
      ...editData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSave = async () => {
    // Validation
    if (!editData.name.trim()) {
      setError('Name is required');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // Use PUT request to /auth/me/ instead of /auth/profile/update/
      const response = await api.put('/auth/me/', editData);

      // Update local user data
      const updatedUser = { ...user, ...response.data };
      setUser(updatedUser);
      authService.setCurrentUser(updatedUser);

      setSuccess('Profile updated successfully!');
      setEditing(false);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Profile update failed:', err);

      const errorMessage = err.response?.data?.detail
        || err.response?.data?.message
        || 'Failed to update profile';

      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="w-12 h-12 border-4 border-teal-500/10 border-t-teal-500 rounded-full animate-spin"></div>
        <p className="text-slate-400 font-medium tracking-wide">Syncing your profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-8 sm:pb-12 px-4 sm:px-0">
      {/* Background Glows for the profile area */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-teal-500/5 blur-[120px] rounded-full pointer-events-none -z-10"></div>

      <div className="bg-[#1E293B] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden relative z-10">
        {/* Profile Banner/Header */}
        <div className="h-24 sm:h-32 bg-gradient-to-r from-[#14B8A6]/20 to-[#0F172A] border-b border-slate-800/50 relative">
          <div className="absolute -bottom-10 sm:-bottom-12 left-4 sm:left-8 p-1 bg-[#1E293B] rounded-2xl sm:rounded-3xl shadow-xl border border-slate-800">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-teal-500 to-[#1E293B] rounded-xl sm:rounded-2xl flex items-center justify-center text-white text-2xl sm:text-3xl font-bold shadow-inner">
              {editing
                ? editData.name?.[0]?.toUpperCase() || 'U'
                : user?.name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'
              }
            </div>
          </div>

          <div className="absolute top-4 sm:top-6 right-4 sm:right-8 flex gap-2 sm:gap-3">
            {!editing ? (
              <button
                onClick={handleEditToggle}
                className="flex items-center gap-2 px-5 py-2.5 bg-teal-500 hover:bg-teal-600 text-[#0F172A] font-bold rounded-xl transition shadow-lg shadow-teal-500/10 active:scale-[0.98]"
              >
                <Edit2 className="w-4 h-4" />
                Edit Profile
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-[#0F172A] font-bold rounded-xl transition active:scale-[0.98]"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-[#0F172A] border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save
                    </>
                  )}
                </button>

                <button
                  onClick={handleEditToggle}
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition active:scale-[0.98]"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="pt-14 sm:pt-16 px-4 sm:px-8 pb-6 sm:pb-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-8 border-b border-slate-800/50">
            <div>
              {editing ? (
                <div className="relative group max-w-md">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-teal-500 transition-colors" />
                  <input
                    type="text"
                    name="name"
                    value={editData.name}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 bg-[#0F172A] border border-slate-700 rounded-xl text-xl font-bold text-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                    placeholder="Your Name"
                  />
                </div>
              ) : (
                <h3 className="text-3xl font-bold text-white tracking-tight">{user?.name || 'User'}</h3>
              )}
              <div className="flex items-center gap-3 mt-2">
                <span className="text-slate-400 font-medium">{user?.email}</span>
                {user?.is_verified && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-500 text-[11px] font-bold uppercase tracking-wider">
                    <CheckCircle className="w-3 h-3" />
                    Verified
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <ProfileStat label="Role" value={user?.role?.replace('_', ' ') || 'Member'} icon={Shield} />
              <ProfileStat label="Joined" value={user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'} icon={Calendar} />
            </div>
          </div>

          {/* Messages */}
          {success && (
            <div className="mb-8 p-4 bg-teal-500/10 border border-teal-500/20 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-2 duration-300">
              <CheckCircle className="w-5 h-5 text-teal-500" />
              <p className="text-teal-100 text-sm font-bold">{success}</p>
            </div>
          )}

          {error && (
            <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-2 duration-300">
              <X className="w-5 h-5 text-red-500" />
              <p className="text-red-200 text-sm font-medium">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Form Fields */}
            <ProfileField
              label="Full Name"
              icon={User}
              isEditing={editing}
              name="name"
              value={editing ? editData.name : user?.name || 'Not set'}
              onChange={handleChange}
              placeholder="John Doe"
            />

            <ProfileField
              label="Contact Email"
              icon={Mail}
              isEditing={false}
              value={user?.email}
              subtitle="Primary identity"
            />

            <ProfileField
              label="Phone Number"
              icon={Phone}
              isEditing={editing}
              name="phone"
              type="tel"
              value={editing ? editData.phone : user?.phone || 'Not set'}
              onChange={handleChange}
              placeholder="+1 234 567 890"
            />

            <ProfileField
              label="Organization"
              icon={Building}
              isEditing={false}
              value={user?.company_name || 'N/A'}
              subtitle="Enterprise Workspace"
            />

            <ProfileField
              label="Department"
              icon={Building}
              isEditing={editing}
              name="department"
              value={editing ? editData.department : user?.department || 'Not set'}
              onChange={handleChange}
              placeholder="e.g. Engineering"
            />
          </div>

          {/* Account Integrity */}
          <div className="mt-10 p-6 bg-[#0F172A] border border-slate-800 rounded-3xl">
            <h4 className="font-bold text-white text-lg mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-teal-500" />
              Security & Integrity
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <StatusCheck label="Email Verified" status={user?.is_verified} />
              <StatusCheck label="Account Active" status={user?.is_active} />
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Last Activity</span>
                <span className="text-xs text-slate-300 font-medium">
                  {user?.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const ProfileStat = ({ label, value, icon: Icon }) => (
  <div className="flex items-center gap-3 bg-[#0F172A] border border-slate-800 px-4 py-3 rounded-2xl">
    <div className="p-2 bg-slate-800 rounded-xl">
      <Icon className="w-4 h-4 text-teal-500" />
    </div>
    <div className="flex flex-col">
      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{label}</span>
      <span className="text-sm text-white font-bold">{value}</span>
    </div>
  </div>
);

const ProfileField = ({ label, value, icon: Icon, isEditing, name, onChange, placeholder, type = "text", subtitle }) => (
  <div className="group space-y-2">
    <label className="text-sm font-semibold text-slate-400 ml-1 flex items-center gap-2">
      <Icon className="w-4 h-4 text-slate-500 group-focus-within:text-teal-500 transition-colors" />
      {label}
    </label>
    {isEditing ? (
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-4 py-3.5 bg-[#0F172A] border border-slate-700 rounded-2xl text-white font-medium focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
      />
    ) : (
      <div className="w-full px-5 py-4 bg-[#0F172A]/50 border border-slate-800/50 rounded-2xl group-hover:border-slate-700 transition-colors">
        <p className="text-white font-bold">{value}</p>
        {subtitle && <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">{subtitle}</p>}
      </div>
    )}
  </div>
);

const StatusCheck = ({ label, status }) => (
  <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-2xl border border-slate-800/50">
    <span className="text-xs text-slate-400 font-bold">{label}</span>
    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase ${status ? 'bg-teal-500/10 text-teal-500' : 'bg-red-500/10 text-red-500'}`}>
      {status ? 'PASSED' : 'FAILED'}
    </span>
  </div>
);

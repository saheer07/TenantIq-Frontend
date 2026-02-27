// ==================== src/components/UserManagement.jsx - UPDATED ====================
import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  Plus,
  Search,
  Mail,
  Phone,
  Building,
  Trash2,
  Edit,
  UserCheck,
  UserX,
  AlertCircle,
  X,
  Eye,
  EyeOff
} from 'lucide-react';
import api from '../services/api';

const UserManagement = ({ onRefresh }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUserData, setNewUserData] = useState({
    email: '',
    full_name: '',
    password: '',
    role: 'TENANT_USER',
    phone: '',
    department: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [userStats, setUserStats] = useState({
    total: 0,
    verified: 0,
    admins: 0,
    inactive: 0
  });

  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchUsers();
  }, []);

  useEffect(() => {
    updateStats();
  }, [users]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/auth/user-management/users/');
      setUsers(response.data);
    } catch (error) {
      console.error('❌ Failed to fetch users:', error);
      const msg = error.response?.data?.detail ||
        error.response?.data?.error ||
        error.friendlyMessage ||
        'Failed to load users. Please check your connection.';
      alert(`Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const updateStats = () => {
    const stats = {
      total: users.length,
      verified: users.filter(u => u.is_verified).length,
      admins: users.filter(u => u.role === 'TENANT_ADMIN').length,
      inactive: users.filter(u => !u.is_active).length
    };
    setUserStats(stats);
  };

  const handleCreateUser = async () => {
    // Validation
    if (!newUserData.email || !newUserData.password) {
      alert('Email and password are required');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUserData.email)) {
      alert('Please enter a valid email address');
      return;
    }

    if (newUserData.password.length < 8) {
      alert('Password must be at least 8 characters long');
      return;
    }

    setActionLoading(true);
    try {


      const response = await api.post('/auth/user-management/users/create/', newUserData);



      alert(`User created successfully!\n\nLogin Credentials:\nEmail: ${newUserData.email}\nPassword: ${newUserData.password}\n\nPlease share these credentials securely with the user.`);

      // Reset form
      setNewUserData({
        email: '',
        full_name: '',
        password: '',
        role: 'TENANT_USER',
        phone: '',
        department: ''
      });
      setShowCreateModal(false);

      // Refresh data
      await fetchUsers();

      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('❌ User creation failed:', error);
      console.error('Response data:', error.response?.data);
      console.error('Response status:', error.response?.status);

      // Better error handling
      let errorMessage = 'Failed to create user';

      if (error.response?.data) {
        const data = error.response.data;

        // Handle different error formats
        if (data.error) {
          errorMessage = data.error;
        } else if (data.detail) {
          errorMessage = data.detail;
        } else if (data.message) {
          errorMessage = data.message;
        } else if (typeof data === 'object') {
          // Handle field-specific errors
          const errors = Object.entries(data)
            .filter(([key]) => key !== 'success')
            .map(([field, messages]) => {
              const msgs = Array.isArray(messages) ? messages.join(', ') : messages;
              return `${field}: ${msgs}`;
            });
          if (errors.length > 0) {
            errorMessage = errors.join('\n');
          }
        }
      }

      alert(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this user? This action cannot be undone.')) {
      return;
    }

    setActionLoading(true);
    try {


      const response = await api.delete(`/auth/user-management/users/${userId}/`);



      // Remove from local state
      setUsers(users.filter(u => u.id !== userId));

      // Show success message
      alert('User removed successfully');

      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('❌ Delete failed:', error);
      console.error('❌ Error response:', error.response);
      console.error('❌ Error data:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);

      // Extract error message
      let errorMessage = 'Failed to remove user';

      if (error.response?.data) {
        if (error.response.data.error) {
          errorMessage = error.response.data.error;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.detail) {
          errorMessage = error.response.data.detail;
        }
      }

      alert(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleActive = async (userId, currentStatus) => {
    setActionLoading(true);
    try {

      await api.post(`/auth/user-management/users/${userId}/toggle-active/`);
      setUsers(users.map(u =>
        u.id === userId ? { ...u, is_active: !currentStatus } : u
      ));

      alert(`User ${currentStatus ? 'deactivated' : 'activated'} successfully`);
    } catch (error) {
      console.error('❌ Toggle failed:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to update user status';
      alert(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditUser = async (userData) => {
    setActionLoading(true);
    try {

      await api.put(`/auth/user-management/users/${userData.id}/`, userData);
      setUsers(users.map(u => u.id === userData.id ? userData : u));
      setShowEditModal(false);
      setEditingUser(null);

      alert('User updated successfully');
    } catch (error) {
      console.error('❌ Edit failed:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to update user';
      alert(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'bg-red-100 text-red-700 border border-red-200';
      case 'TENANT_ADMIN':
        return 'bg-purple-100 text-purple-700 border border-purple-200';
      case 'TENANT_USER':
        return 'bg-teal-100 text-teal-700 border border-teal-200';
      default:
        return 'bg-gray-100 text-gray-700 border border-gray-200';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="bg-[#0F172A] border border-[#334155] rounded-3xl p-8 shadow-2xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h2 className="text-3xl font-black text-white flex items-center gap-4 tracking-tight">
              <div className="p-3 bg-teal-600/10 rounded-2xl">
                <Users className="w-8 h-8 text-teal-500" />
              </div>
              Team Management
            </h2>
            <p className="text-slate-400 mt-2 font-medium">
              Scale your organization and manage access control
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-8 py-3.5 bg-teal-600 text-white rounded-2xl hover:bg-teal-700 transition-all flex items-center gap-2 font-bold shadow-lg shadow-teal-500/20 active:scale-95 uppercase tracking-widest text-xs"
          >
            <Plus className="w-5 h-5" />
            Add Member
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-10 group">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-teal-500 transition-colors" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, email, or department..."
            className="w-full pl-12 pr-4 py-4 bg-[#1E293B] border border-[#334155] rounded-2xl focus:ring-4 focus:ring-teal-500/5 focus:border-teal-500/50 outline-none text-white transition-all shadow-inner placeholder-slate-600 font-medium"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
          {[
            { label: 'Total Members', val: userStats.total, color: 'text-teal-500', bg: 'bg-teal-500/10' },
            { label: 'Active Now', val: userStats.verified, color: 'text-green-500', bg: 'bg-green-500/10' },
            { label: 'Administrators', val: userStats.admins, color: 'text-purple-500', bg: 'bg-purple-500/10' },
            { label: 'Inactive', val: userStats.inactive, color: 'text-red-500', bg: 'bg-red-500/10' }
          ].map((stat, i) => (
            <div key={i} className="bg-[#1E293B] border border-[#334155]/50 rounded-2xl p-6 transition-transform hover:scale-105 duration-300">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] font-black uppercase tracking-widest ${stat.color}`}>{stat.label}</span>
                <div className={`w-1.5 h-1.5 rounded-full ${stat.color.replace('text', 'bg')}`}></div>
              </div>
              <div className="text-3xl font-black text-white">{stat.val}</div>
            </div>
          ))}
        </div>

        {/* User List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin shadow-lg shadow-teal-500/20"></div>
            <p className="mt-6 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Syncing team data...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-20 bg-[#1E293B]/50 rounded-3xl border-2 border-dashed border-[#334155]">
            <Users className="w-16 h-16 text-slate-800 mx-auto mb-6" />
            <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight">Empty Roster</h3>
            <p className="text-slate-500 mb-8 max-w-xs mx-auto">
              {searchTerm ? 'No members match your current filter' : 'Your workspace is quiet. Let’s bring in the team!'}
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-8 py-3 bg-white text-black rounded-2xl hover:bg-slate-200 transition-all font-black uppercase tracking-widest text-[10px]"
            >
              Onboard User
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="bg-[#1E293B] border border-[#334155] rounded-3xl p-6 hover:border-teal-500/50 transition-all duration-300 shadow-xl shadow-black/20 group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-6 flex-1 min-w-0">
                    <div className="w-16 h-16 bg-teal-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl flex-shrink-0 shadow-lg shadow-teal-500/20 group-hover:scale-110 transition-transform">
                      {user.full_name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <p className="font-black text-xl text-white truncate tracking-tight uppercase">{user.full_name || user.email.split('@')[0]}</p>
                        <span className={`px-2.5 py-1 text-[10px] font-black rounded-lg uppercase tracking-widest ${user.is_active ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}>
                          {user.is_active ? 'Online' : 'Restricted'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-400 font-medium">
                        <div className="flex items-center gap-2 truncate">
                          <Mail className="w-4 h-4 text-teal-500/50" />
                          <span className="truncate">{user.email}</span>
                        </div>
                        {user.department && (
                          <div className="flex items-center gap-2 truncate">
                            <Building className="w-4 h-4 text-teal-500/50" />
                            <span className="truncate">{user.department}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 font-black uppercase tracking-widest text-[9px] text-slate-600 mt-2">
                          {user.role === 'TENANT_ADMIN' ? 'Administrator' : 'Core Member'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-4 ml-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingUser(user);
                          setShowEditModal(true);
                        }}
                        className="p-3 text-slate-500 hover:text-white hover:bg-[#1E293B] rounded-xl transition-all"
                        title="Edit member"
                      >
                        <Edit className="w-5 h-5" />
                      </button>

                      <button
                        onClick={() => handleToggleActive(user.id, user.is_active)}
                        disabled={actionLoading}
                        className={`p-3 rounded-xl transition-all ${user.is_active
                          ? 'text-teal-500 hover:bg-teal-500/10'
                          : 'text-red-500 hover:bg-red-500/10'
                          }`}
                        title={user.is_active ? 'Restrict Access' : 'Grant Access'}
                      >
                        {user.is_active ? <UserCheck className="w-5 h-5" /> : <UserX className="w-5 h-5" />}
                      </button>

                      <button
                        onClick={() => handleDelete(user.id)}
                        disabled={actionLoading}
                        className="p-3 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                        title="Offboard member"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-[#0F172A] border border-[#334155] rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black text-white uppercase tracking-tight">Access Token</h3>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewUserData({
                      email: '',
                      full_name: '',
                      password: '',
                      role: 'TENANT_USER',
                      phone: '',
                      department: ''
                    });
                  }}
                  className="p-3 text-slate-500 hover:text-white hover:bg-[#1E293B] rounded-2xl transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6 max-h-[60vh] overflow-y-auto px-1 custom-scrollbar">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-teal-500 uppercase tracking-widest ml-1">
                    Universal Identity <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-teal-500" />
                    <input
                      type="email"
                      value={newUserData.email}
                      onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                      placeholder="address@domain.com"
                      className="w-full pl-12 pr-4 py-4 bg-[#1E293B] border border-[#334155] rounded-2xl focus:border-teal-500/50 outline-none text-white font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={newUserData.full_name}
                    onChange={(e) => setNewUserData({ ...newUserData, full_name: e.target.value })}
                    placeholder="E.g. Alexander Pierce"
                    className="w-full px-5 py-4 bg-[#1E293B] border border-[#334155] rounded-2xl focus:border-teal-500/50 outline-none text-white font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-teal-500 uppercase tracking-widest ml-1">
                    Secret Key <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newUserData.password}
                      onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                      placeholder="Minimum 8 characters"
                      className="w-full px-5 py-4 bg-[#1E293B] border border-[#334155] rounded-2xl focus:border-teal-500/50 outline-none text-white font-medium pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                    Authorization Tier
                  </label>
                  <select
                    value={newUserData.role}
                    onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value })}
                    className="w-full px-5 py-4 bg-[#1E293B] border border-[#334155] rounded-2xl focus:border-teal-500/50 outline-none text-white font-bold"
                  >
                    <option value="TENANT_USER">Basic Operator</option>
                    <option value="TENANT_ADMIN">System Admin</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                      Department
                    </label>
                    <input
                      type="text"
                      value={newUserData.department}
                      onChange={(e) => setNewUserData({ ...newUserData, department: e.target.value })}
                      placeholder="Core Team"
                      className="w-full px-5 py-4 bg-[#1E293B] border border-[#334155] rounded-2xl focus:border-teal-500/50 outline-none text-white text-xs font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                      Signal
                    </label>
                    <input
                      type="tel"
                      value={newUserData.phone}
                      onChange={(e) => setNewUserData({ ...newUserData, phone: e.target.value })}
                      placeholder="+91..."
                      className="w-full px-5 py-4 bg-[#1E293B] border border-[#334155] rounded-2xl focus:border-teal-500/50 outline-none text-white text-xs font-medium"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mt-10">
                <button
                  onClick={handleCreateUser}
                  disabled={actionLoading || !newUserData.email || !newUserData.password}
                  className="w-full px-8 py-5 bg-teal-600 text-white rounded-[1.5rem] hover:bg-teal-700 disabled:opacity-50 transition-all font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-teal-500/40 active:scale-95 flex items-center justify-center gap-3 order-1 sm:order-2"
                >
                  {actionLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      Initialize User
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="w-full px-8 py-5 text-slate-400 font-black uppercase tracking-widest text-[10px] hover:text-white transition-colors order-2 sm:order-1"
                >
                  Abort
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-[#0F172A] border border-[#334155] rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black text-white uppercase tracking-tight">Identity Override</h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingUser(null);
                  }}
                  className="p-3 text-slate-500 hover:text-white hover:bg-[#1E293B] rounded-2xl transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6 max-h-[60vh] overflow-y-auto px-1 custom-scrollbar">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-teal-500 uppercase tracking-widest ml-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={editingUser.full_name || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, full_name: e.target.value })}
                    placeholder="Full name"
                    className="w-full px-5 py-4 bg-[#1E293B] border border-[#334155] rounded-2xl focus:border-teal-500/50 outline-none text-white font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                    Universal Identity
                  </label>
                  <div className="relative group opacity-50">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                    <input
                      type="email"
                      value={editingUser.email}
                      disabled
                      className="w-full pl-12 pr-4 py-4 bg-[#0F172A] border border-[#334155] rounded-2xl outline-none text-slate-500 font-medium cursor-not-allowed"
                    />
                  </div>
                  <p className="text-[9px] text-slate-600 ml-1 italic font-medium mt-1">Primary identity cannot be modified</p>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                    Authorization Tier
                  </label>
                  <select
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                    className="w-full px-5 py-4 bg-[#1E293B] border border-[#334155] rounded-2xl focus:border-teal-500/50 outline-none text-white font-bold"
                  >
                    <option value="TENANT_USER">Team Member</option>
                    <option value="TENANT_ADMIN">Administrator</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                      Department
                    </label>
                    <input
                      type="text"
                      value={editingUser.department || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, department: e.target.value })}
                      placeholder="Core Team"
                      className="w-full px-5 py-4 bg-[#1E293B] border border-[#334155] rounded-2xl focus:border-teal-500/50 outline-none text-white text-xs font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                      Signal
                    </label>
                    <input
                      type="tel"
                      value={editingUser.phone || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                      placeholder="+91..."
                      className="w-full px-5 py-4 bg-[#1E293B] border border-[#334155] rounded-2xl focus:border-teal-500/50 outline-none text-white text-xs font-medium"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mt-10">
                <button
                  onClick={() => handleEditUser(editingUser)}
                  disabled={actionLoading}
                  className="w-full px-8 py-5 bg-teal-600 text-white rounded-[1.5rem] hover:bg-teal-700 disabled:opacity-50 transition-all font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-teal-500/40 active:scale-95 flex items-center justify-center gap-3 order-1 sm:order-2"
                >
                  {actionLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    'Commit Changes'
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingUser(null);
                  }}
                  className="w-full px-8 py-5 text-slate-400 font-black uppercase tracking-widest text-[10px] hover:text-white transition-colors order-2 sm:order-1"
                >
                  Abort
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
// ==================== src/components/AuditLogs.jsx ====================
import React, { useState, useEffect } from 'react';
import {
  Shield,
  Search,
  Download,
  User,
  Activity,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  LogIn,
  LogOut,
  UserPlus,
  Settings,
  FileText,
  CreditCard,
  Trash2,
  Edit
} from 'lucide-react';
import api from '../services/api';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 20;

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await api.get('/audit-logs/');
      setLogs(response.data);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
      setLogs(generateMockLogs());
    } finally {
      setLoading(false);
    }
  };

  const generateMockLogs = () => {
    const actions = [
      'USER_LOGIN', 'USER_LOGOUT', 'USER_CREATED', 'USER_DELETED', 'USER_UPDATED',
      'DOCUMENT_UPLOADED', 'DOCUMENT_DELETED', 'SUBSCRIPTION_CREATED',
      'SUBSCRIPTION_UPDATED', 'SUBSCRIPTION_CANCELLED', 'PASSWORD_CHANGED',
      'EMAIL_VERIFIED', 'ROLE_CHANGED', 'SETTINGS_UPDATED', 'INVITATION_SENT'
    ];

    const users = [
      'admin@company.com',
      'john.doe@company.com',
      'jane.smith@company.com',
      'bob.johnson@company.com'
    ];

    const statuses = ['success', 'failed', 'warning'];
    const mockLogs = [];
    const now = new Date();

    for (let i = 0; i < 100; i++) {
      const action = actions[Math.floor(Math.random() * actions.length)];
      const user = users[Math.floor(Math.random() * users.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const timestamp = new Date(now - Math.random() * 30 * 24 * 60 * 60 * 1000);

      mockLogs.push({
        id: i + 1,
        action,
        user,
        status,
        timestamp: timestamp.toISOString(),
        details: generateDetails(action, status),
        ip_address: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      });
    }

    return mockLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  };

  const generateDetails = (action, status) => {
    const details = {
      'USER_LOGIN': status === 'success' ? 'Successful login' : 'Invalid credentials',
      'USER_LOGOUT': 'User logged out',
      'USER_CREATED': 'New user account created',
      'USER_DELETED': 'User account removed',
      'USER_UPDATED': 'User profile updated',
      'DOCUMENT_UPLOADED': 'Document uploaded and processed',
      'DOCUMENT_DELETED': 'Document removed from system',
      'SUBSCRIPTION_CREATED': 'New subscription activated',
      'SUBSCRIPTION_UPDATED': 'Subscription plan changed',
      'SUBSCRIPTION_CANCELLED': 'Subscription cancelled',
      'PASSWORD_CHANGED': 'Password updated successfully',
      'EMAIL_VERIFIED': 'Email address verified',
      'ROLE_CHANGED': 'User role modified',
      'SETTINGS_UPDATED': 'System settings changed',
      'INVITATION_SENT': 'User invitation sent'
    };
    return details[action] || 'Action performed';
  };

  const getActionIcon = (action) => {
    const icons = {
      'USER_LOGIN': LogIn,
      'USER_LOGOUT': LogOut,
      'USER_CREATED': UserPlus,
      'USER_DELETED': Trash2,
      'USER_UPDATED': Edit,
      'DOCUMENT_UPLOADED': FileText,
      'DOCUMENT_DELETED': Trash2,
      'SUBSCRIPTION_CREATED': CreditCard,
      'SUBSCRIPTION_UPDATED': CreditCard,
      'SUBSCRIPTION_CANCELLED': XCircle,
      'PASSWORD_CHANGED': Settings,
      'EMAIL_VERIFIED': CheckCircle,
      'ROLE_CHANGED': Shield,
      'SETTINGS_UPDATED': Settings,
      'INVITATION_SENT': UserPlus
    };
    return icons[action] || Activity;
  };

  const getActionColor = (action) => {
    if (action.includes('DELETE') || action.includes('CANCEL')) return 'text-red-600';
    if (action.includes('CREATE') || action.includes('VERIFIED')) return 'text-green-600';
    if (action.includes('UPDATE') || action.includes('CHANGED')) return 'text-teal-600';
    if (action.includes('LOGIN')) return 'text-purple-600';
    return 'text-slate-600';
  };

  const getStatusBadge = (status) => {
    const configs = {
      'success': {
        color: 'bg-green-100 text-green-700',
        icon: CheckCircle,
        text: 'Success'
      },
      'failed': {
        color: 'bg-red-100 text-red-700',
        icon: XCircle,
        text: 'Failed'
      },
      'warning': {
        color: 'bg-yellow-100 text-yellow-700',
        icon: AlertCircle,
        text: 'Warning'
      }
    };

    const config = configs[status] || configs['success'];
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3" />
        {config.text}
      </span>
    );
  };

  const filterByDateRange = (log) => {
    if (dateRange === 'all') return true;

    const logDate = new Date(log.timestamp);
    const now = new Date();
    const daysDiff = (now - logDate) / (1000 * 60 * 60 * 24);

    switch (dateRange) {
      case 'today': return daysDiff < 1;
      case 'week': return daysDiff < 7;
      case 'month': return daysDiff < 30;
      default: return true;
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch =
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAction = filterAction === 'all' || log.action === filterAction;
    const matchesStatus = filterStatus === 'all' || log.status === filterStatus;
    const matchesDate = filterByDateRange(log);

    return matchesSearch && matchesAction && matchesStatus && matchesDate;
  });

  const indexOfLastLog = currentPage * logsPerPage;
  const indexOfFirstLog = indexOfLastLog - logsPerPage;
  const currentLogs = filteredLogs.slice(indexOfFirstLog, indexOfLastLog);
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);

  const exportToCSV = () => {
    const headers = ['Timestamp', 'User', 'Action', 'Status', 'Details', 'IP Address'];
    const csvData = [
      headers.join(','),
      ...filteredLogs.map(log => [
        new Date(log.timestamp).toLocaleString(),
        log.user,
        log.action,
        log.status,
        `"${log.details}"`,
        log.ip_address || 'N/A'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const uniqueActions = [...new Set(logs.map(log => log.action))].sort();

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="bg-[#0F172A] border border-[#334155] rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-2xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 sm:mb-10">
          <div className="text-center md:text-left">
            <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center justify-center md:justify-start gap-3 sm:gap-4 tracking-tight">
              <div className="p-2 sm:p-3 bg-teal-600/10 rounded-xl sm:rounded-2xl">
                <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-teal-500" />
              </div>
              Audit Logs
            </h2>
            <p className="text-sm sm:text-slate-400 mt-2 font-medium">
              Monitor system integrity and organizational activity
            </p>
          </div>
          <button
            onClick={exportToCSV}
            className="w-full md:w-auto px-6 sm:px-8 py-3 sm:py-3.5 bg-[#1E293B] text-white border border-[#334155] rounded-xl sm:rounded-2xl hover:bg-[#1E293B] transition-all flex items-center justify-center gap-2 font-bold shadow-lg active:scale-95 uppercase tracking-widest text-[10px] sm:text-xs"
          >
            <Download className="w-5 h-5" />
            Export Archive
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-10">
          {[
            { label: 'Total Events', val: logs.length, color: 'text-teal-500', bg: 'bg-teal-500/10' },
            { label: 'Successful', val: logs.filter(l => l.status === 'success').length, color: 'text-green-500', bg: 'bg-green-500/10' },
            { label: 'Failed Ops', val: logs.filter(l => l.status === 'failed').length, color: 'text-red-500', bg: 'bg-red-500/10' },
            { label: 'Access Events', val: logs.filter(l => l.action === 'USER_LOGIN').length, color: 'text-purple-500', bg: 'bg-purple-500/10' }
          ].map((stat, i) => (
            <div key={i} className="bg-[#1E293B] border border-[#334155]/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 transition-transform hover:scale-105 duration-300">
              <div className="flex items-center justify-between mb-1 sm:mb-2">
                <span className={`text-[8px] sm:text-[10px] font-black uppercase tracking-widest ${stat.color}`}>{stat.label}</span>
              </div>
              <div className="text-xl sm:text-3xl font-black text-white">{stat.val}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-teal-500 transition-colors" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter logs..."
              className="w-full pl-12 pr-4 py-3.5 bg-[#1E293B] border border-[#334155] rounded-2xl focus:border-teal-500/50 outline-none text-white font-medium"
            />
          </div>

          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="px-5 py-3.5 bg-[#1E293B] border border-[#334155] rounded-2xl focus:border-teal-500/50 outline-none text-white font-bold text-xs uppercase tracking-widest cursor-pointer"
          >
            <option value="all">All Actions</option>
            {uniqueActions.map(action => (
              <option key={action} value={action}>{action.replace(/_/g, ' ')}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-5 py-3.5 bg-[#1E293B] border border-[#334155] rounded-2xl focus:border-teal-500/50 outline-none text-white font-bold text-xs uppercase tracking-widest cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
            <option value="warning">Warning</option>
          </select>

          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-5 py-3.5 bg-[#1E293B] border border-[#334155] rounded-2xl focus:border-teal-500/50 outline-none text-white font-bold text-xs uppercase tracking-widest cursor-pointer"
          >
            <option value="all">Timeline: All</option>
            <option value="today">Timeline: Today</option>
            <option value="week">Timeline: Week</option>
            <option value="month">Timeline: Month</option>
          </select>
        </div>

        <div className="mb-4 text-sm text-slate-600">
          Showing {indexOfFirstLog + 1}-{Math.min(indexOfLastLog, filteredLogs.length)} of {filteredLogs.length} events
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-6 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Retrieving logs...</p>
          </div>
        ) : currentLogs.length === 0 ? (
          <div className="text-center py-20 bg-[#1E293B]/50 rounded-3xl border-2 border-dashed border-[#334155]">
            <Shield className="w-16 h-16 text-slate-800 mx-auto mb-6" />
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No activity records found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full border-separate border-spacing-y-2">
                <thead className="bg-[#1E293B]">
                  <tr>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest rounded-l-2xl">Time</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Authority</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Operation</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Manifest</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">State</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest rounded-r-2xl">Network</th>
                  </tr>
                </thead>
                <tbody>
                  {currentLogs.map((log) => {
                    const ActionIcon = getActionIcon(log.action);
                    return (
                      <tr key={log.id} className="group bg-[#1E293B]/50 hover:bg-[#1E293B]/80 transition-all duration-300 backdrop-blur-sm">
                        <td className="px-6 py-4 text-xs text-slate-400 whitespace-nowrap rounded-l-2xl font-medium">
                          <div className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-teal-500/50" />
                            {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-teal-600/10 rounded-lg flex items-center justify-center text-teal-500 font-bold text-xs uppercase">
                              {log.user[0]}
                            </div>
                            <span className="text-xs font-black text-white truncate max-w-[120px] uppercase tracking-tight">{log.user.split('@')[0]}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <ActionIcon className={`w-3.5 h-3.5 ${getActionColor(log.action)}`} />
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest whitespace-nowrap">
                              {log.action.replace(/_/g, ' ')}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-[11px] text-slate-400 max-w-xs truncate font-medium">
                          {log.details}
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(log.status)}
                        </td>
                        <td className="px-6 py-4 text-[10px] text-slate-600 font-mono rounded-r-2xl">
                          {log.ip_address || 'PROXY_HIDDEN'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Previous
                </button>

                <div className="flex items-center gap-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-10 h-10 rounded-lg transition ${currentPage === pageNum
                          ? 'bg-teal-600 text-white'
                          : 'border border-slate-300 hover:bg-slate-50'
                          }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AuditLogs;
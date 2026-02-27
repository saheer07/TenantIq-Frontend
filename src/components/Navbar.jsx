// ==================== src/components/Navbar.jsx ====================
import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  Search,
  User,
  Settings,
  LogOut,
  CreditCard,
  HelpCircle,
  Menu,
  X,
  Sparkles,
  ChevronDown
} from 'lucide-react';

const Navbar = ({
  user,
  subscription,
  onLogout,
  onMenuToggle,
  sidebarOpen,
  onNavigate
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications] = useState([]);
  const userMenuRef = useRef(null);
  const notifRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isTenantAdmin = user?.role === 'TENANT_ADMIN';
  const isTenantUser = user?.role === 'TENANT_USER';
  const hasSubscription = subscription?.is_active || false;

  const getUserInitials = () => {
    if (user?.name) {
      return user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return user?.email?.[0]?.toUpperCase() || 'U';
  };

  const formatRole = (role) => {
    if (!role) return 'User';
    return role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <nav className="bg-[#1E293B] border-b border-[#334155] shadow-xl sticky top-0 z-40">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left Section */}
          <div className="flex items-center gap-4">
            {/* Mobile Menu Toggle */}
            <button
              onClick={onMenuToggle}
              className="p-2 rounded-lg hover:bg-[#334155] transition-colors"
              aria-label="Toggle menu"
            >
              {sidebarOpen ? (
                <X className="w-5 h-5 text-slate-400" />
              ) : (
                <Menu className="w-5 h-5 text-slate-400" />
              )}
            </button>

            {/* Logo & Brand */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-700 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/20">
                <span className="text-white font-black text-2xl">T</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-extrabold text-white">TenantIQ</h1>
                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{user?.company_name || 'Dashboard'}</p>
              </div>
            </div>
          </div>


          {/* Right Section */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Subscription Badge */}
            {!isSuperAdmin && (isTenantAdmin || isTenantUser) && (
              <div className="hidden lg:block">
                {hasSubscription ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-teal-500/10 border border-teal-500/20 rounded-lg">
                    <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(20,184,166,0.5)]"></div>
                    <div className="text-xs">
                      <div className="font-bold text-teal-400 uppercase tracking-widest text-[10px]">
                        {subscription?.plan_name || 'Active'}
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => onNavigate('subscription')}
                    className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-all active:scale-95"
                  >
                    <div className="text-xs">
                      <div className="font-bold text-red-500 uppercase tracking-widest text-[10px]">Activate Plan</div>
                    </div>
                  </button>
                )}
              </div>
            )}

            {/* Help Button */}
            <button
              className="p-2 text-slate-400 hover:bg-[#334155] rounded-lg transition-colors"
              title="Help & Support"
            >
              <HelpCircle className="w-5 h-5" />
            </button>

            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-slate-400 hover:bg-[#334155] rounded-lg transition-colors"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-teal-500 rounded-full"></span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-[#1E293B] rounded-xl shadow-2xl border border-[#334155] overflow-hidden">
                  <div className="p-4 border-b border-[#334155] bg-[#1E293B]">
                    <h3 className="font-semibold text-white">Notifications</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-slate-500">
                        <Bell className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                        <p className="text-sm">No notifications</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {notifications.map((notif, idx) => (
                          <div key={idx} className="p-4 hover:bg-[#334155] cursor-pointer">
                            <p className="text-sm text-slate-300">{notif.message}</p>
                            <p className="text-xs text-slate-500 mt-1">{notif.time}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 p-2 hover:bg-[#334155] rounded-lg transition-colors"
              >
                <div className="w-9 h-9 bg-teal-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm shadow-lg shadow-teal-500/20">
                  {getUserInitials()}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-semibold text-white leading-tight">
                    {user?.name || 'User'}
                  </p>
                  <p className="text-xs text-slate-400">{formatRole(user?.role)}</p>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-500 hidden sm:block" />
              </button>

              {/* User Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-[#1E293B] rounded-xl shadow-2xl border border-[#334155] overflow-hidden">
                  {/* User Info */}
                  <div className="p-4 border-b border-[#334155] bg-[#111827]">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-12 h-12 bg-teal-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-teal-500/20">
                        {getUserInitials()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white truncate">
                          {user?.name || 'User'}
                        </p>
                        <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-teal-900/30 text-teal-400 text-xs rounded-full font-medium border border-teal-500/20">
                        {formatRole(user?.role)}
                      </span>
                      {hasSubscription && !isSuperAdmin && (
                        <span className="px-2 py-1 bg-green-900/30 text-green-400 text-xs rounded-full font-medium border border-green-500/20">
                          Premium
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-2 bg-[#1E293B]">
                    <button
                      onClick={() => {
                        onNavigate('profile');
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-300 hover:bg-[#334155] transition-colors"
                    >
                      <User className="w-4 h-4" />
                      <span className="text-sm font-medium">My Profile</span>
                    </button>

                    {(isTenantAdmin || isTenantUser) && (
                      <button
                        onClick={() => {
                          onNavigate('subscription');
                          setShowUserMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-300 hover:bg-[#334155] transition-colors"
                      >
                        <CreditCard className="w-4 h-4" />
                        <span className="text-sm font-medium">Subscription</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        onNavigate('settings');
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-300 hover:bg-[#334155] transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      <span className="text-sm font-medium">Settings</span>
                    </button>

                    <div className="my-2 border-t border-[#334155]"></div>

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onLogout();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="text-sm font-medium">Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

    </nav>
  );
};

export default Navbar;
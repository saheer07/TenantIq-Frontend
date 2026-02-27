// ==================== src/App.jsx ====================
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import LoginForm from './accounts/LoginForm';
import SignupForm from './accounts/SignupForm';
import Dashboard from './components/Dashboard';
import LandingPage from './components/LandingPage';
import EmailVerification from './accounts/EmailVerification';
import ForgotPassword from './accounts/ForgotPassword';
import RegisterFromInvite from './accounts/RegisterFromInvite';
import authService from './services/auth.service';
import { DocumentProvider } from './context/DocumentContext';

// ── Spinner ───────────────────────────────────────────────────────────────────
const Spinner = () => (
  <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center gap-6 font-['Plus_Jakarta_Sans',sans-serif]">
    <style>{`
      @keyframes tiq-spin { to { transform: rotate(360deg); } }
      .tiq-spinner-ring {
        width: 48px; height: 48px;
        border: 3.5px solid rgba(20, 184, 166, 0.1);
        border-top-color: #14B8A6;
        border-radius: 50%;
        animation: tiq-spin 0.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        box-shadow: 0 0 20px rgba(20, 184, 166, 0.1);
      }
    `}</style>
    <div className="tiq-spinner-ring"></div>
    <div className="text-slate-400 text-sm font-medium tracking-wide">Initializing your workspace...</div>
  </div>
);

// ── Main App ──────────────────────────────────────────────────────────────────
function App() {
  const [currentView, setCurrentView] = useState('loading');
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState('');

  useEffect(() => { checkAuthStatus(); }, []);

  const normalizeRole = (role) => role ? role.toUpperCase() : null;

  const checkAuthStatus = async () => {
    try {
      const isAuth = authService.isAuthenticated();
      if (!isAuth) { setCurrentView('landing'); return; }

      let currentUser = authService.getCurrentUser();
      if (!currentUser && authService.fetchCurrentUser) {
        currentUser = await authService.fetchCurrentUser();
      }
      if (!currentUser) { authService.clearAuth(); setCurrentView('landing'); return; }

      currentUser = { ...currentUser, role: normalizeRole(currentUser.role) };
      setUser(currentUser);

      if (currentUser?.is_verified === false) {
        setPendingVerificationEmail(currentUser.email);
        setCurrentView('verify-email');
        return;
      }

      if (currentUser.role === 'SUPER_ADMIN') {
        setSubscription({ is_active: true, plan_name: 'Admin Access' });
        setCurrentView('dashboard');
        return;
      }

      if (currentUser.role === 'TENANT_ADMIN' || currentUser.role === 'TENANT_USER') {
        try {
          const subData = await authService.checkSubscription();
          setSubscription(parseSubscriptionData(subData));
        } catch (err) {
          console.error('Subscription check failed:', err);
          setSubscription({ is_active: false });
        }
      }

      setCurrentView('dashboard');
    } catch (error) {
      console.error('Auth check failed:', error);
      authService.clearAuth();
      setCurrentView('landing');
    }
  };

  const parseSubscriptionData = (subData) => {
    if (!subData) return { is_active: false };
    if (subData.has_subscription !== undefined) {
      if (subData.has_subscription && subData.is_active) {
        return {
          is_active: true, has_subscription: true,
          ...subData.subscription,
          id: subData.id ?? subData.subscription?.id,
          tenant_name: subData.tenant_name,
        };
      }
      return { is_active: false, has_subscription: false };
    }
    if (subData.is_active !== undefined) return subData;
    return { is_active: false };
  };

  const handleLoginSuccess = async () => { await checkAuthStatus(); };

  const handleSignupSuccess = (email) => {
    if (email) {
      setPendingVerificationEmail(email);
      sessionStorage.setItem('pending_verification_email', email);
    }
    setCurrentView('verify-email');
  };

  const handleLogout = async () => {
    try { await authService.logout(); } catch (e) { console.error('Logout error:', e); }
    finally {
      setUser(null); setSubscription(null); setPendingVerificationEmail('');
      sessionStorage.removeItem('pending_verification_email');
      setCurrentView('landing');
    }
  };

  const handleVerificationComplete = async () => {
    setPendingVerificationEmail('');
    sessionStorage.removeItem('pending_verification_email');
    await checkAuthStatus();
  };

  const refreshSubscription = async () => {
    if (!user) return;
    try {
      const subData = await authService.checkSubscription();
      setSubscription(parseSubscriptionData(subData));
    } catch { setSubscription({ is_active: false }); }
  };

  if (currentView === 'loading') return <Spinner />;

  return (
    <Routes>
      {currentView === 'landing' && (
        <>
          <Route path="/" element={
            <LandingPage
              onLogin={() => setCurrentView('login')}
              onSignup={() => setCurrentView('signup')}
            />
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </>
      )}

      {currentView === 'login' && (
        <>
          <Route path="/" element={
            <LoginForm
              onSuccess={handleLoginSuccess}
              onSwitchToSignup={() => setCurrentView('signup')}
              onForgotPassword={() => setCurrentView('forgot-password')}
              onBackToLanding={() => setCurrentView('landing')}
            />
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </>
      )}

      {currentView === 'signup' && (
        <>
          <Route path="/" element={
            <SignupForm
              onSignupSuccess={handleSignupSuccess}
              onSwitchToLogin={() => setCurrentView('login')}
              onBackToLanding={() => setCurrentView('landing')}
            />
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </>
      )}

      {currentView === 'verify-email' && (
        <>
          <Route path="/" element={
            <EmailVerification
              userEmail={pendingVerificationEmail}
              onVerificationComplete={handleVerificationComplete}
              onBackToLogin={() => {
                authService.clearAuth();
                setPendingVerificationEmail('');
                sessionStorage.removeItem('pending_verification_email');
                setCurrentView('login');
              }}
            />
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </>
      )}

      {currentView === 'forgot-password' && (
        <>
          <Route path="/" element={<ForgotPassword onBackToLogin={() => setCurrentView('login')} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </>
      )}

      {currentView === 'dashboard' && user && (
        <Route path="/*" element={
          <DocumentProvider>
            <Dashboard
              user={user}
              subscription={subscription}
              onLogout={handleLogout}
              onSubscriptionChange={refreshSubscription}
            />
          </DocumentProvider>
        } />
      )}

      <Route path="/register-invite" element={<RegisterFromInvite />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
// ==================== src/components/Dashboard.jsx ====================
import React, { useState, useEffect, useRef } from 'react';
import {
  LogOut, MessageSquare, Users, FileText, Settings, Shield,
  User as UserIcon, CreditCard, Lock, Sparkles, Home, BarChart3,
  Bell, HelpCircle, ChevronDown, Menu, X, Zap, Activity,
  TrendingUp, Clock, CheckCircle2, ArrowUpRight, Cpu, Database,
  Globe, AlertTriangle, Eye, Layers, Wifi, RefreshCw, Star,
  MoreHorizontal, ChevronRight, Package, Gauge, BookOpen,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import authService from '../services/auth.service';
import api from '../services/api';
import Footer from './Footer';
import ChatInterface from './ChatInterface';
import UserManagement from './UserManagement';
import Profile from '../accounts/Profile';
import AuditLogs from './AuditLogs';
import ChangePassword from '../accounts/ChangePassword';
import SubscriptionPlans from './SubscriptionPlans';

/* ─────────────────────────────────────────────────────────────────────────────
   DESIGN TOKENS
───────────────────────────────────────────────────────────────────────────── */
const T = {
  bg:        '#07111F',
  bgCard:    '#0C1A2E',
  bgCard2:   '#0F1E33',
  border:    'rgba(30,60,90,0.55)',
  borderHov: 'rgba(20,184,166,0.28)',
  teal:      '#14B8A6',
  tealDark:  '#0D9488',
  tealLight: '#2DD4BF',
  textPri:   '#EFF6FF',
  textSec:   '#64748B',
  textMid:   '#94A3B8',
};

/* ─────────────────────────────────────────────────────────────────────────────
   AMBIENT BACKGROUND
───────────────────────────────────────────────────────────────────────────── */
const AmbientBg = () => (
  <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
    {/* Grid */}
    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.025 }}>
      <defs>
        <pattern id="dash-grid" width="48" height="48" patternUnits="userSpaceOnUse">
          <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#14B8A6" strokeWidth="0.6" strokeDasharray="2 4"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#dash-grid)" />
    </svg>
    {/* Glows */}
    <div style={{ position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)', width: 1000, height: 500, background: 'radial-gradient(ellipse, rgba(20,184,166,0.055) 0%, transparent 70%)', filter: 'blur(20px)' }} />
    <div style={{ position: 'absolute', bottom: '0', right: '-5%', width: 600, height: 600, background: 'radial-gradient(circle, rgba(56,189,248,0.03) 0%, transparent 70%)' }} />
    <div style={{ position: 'absolute', top: '40%', left: '-5%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(167,139,250,0.025) 0%, transparent 70%)' }} />
  </div>
);

/* ─────────────────────────────────────────────────────────────────────────────
   MINI SPARKLINE
───────────────────────────────────────────────────────────────────────────── */
const Sparkline = ({ data = [], color = T.teal, height = 32 }) => {
  const max = Math.max(...data, 1);
  const total = data.length;
  const pts = data.map((v, i) => {
    const x = (i / (total - 1)) * 100;
    const y = height - (v / max) * height;
    return `${x},${y}`;
  }).join(' ');
  const area = `0,${height} ${pts} 100,${height}`;
  return (
    <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" style={{ width: '100%', height }} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`spark-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#spark-${color.replace('#','')})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      {/* Last dot */}
      {data.length > 0 && (
        <circle cx="100" cy={height - (data[data.length-1]/max)*height} r="2.2" fill={color} />
      )}
    </svg>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   STAT CARD
───────────────────────────────────────────────────────────────────────────── */
const StatCard = ({ label, value, sub, icon: Icon, accent, sparkData, delay = 0 }) => {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov
          ? `linear-gradient(145deg, ${T.bgCard2} 0%, ${T.bgCard} 100%)`
          : `linear-gradient(145deg, ${T.bgCard} 0%, #090F1C 100%)`,
        border: `1px solid ${hov ? accent + '30' : T.border}`,
        borderRadius: 20,
        padding: '22px 22px 18px',
        cursor: 'default',
        transition: 'all 0.25s ease',
        boxShadow: hov ? `0 12px 40px ${accent}12` : 'none',
        animation: `tiq-up 0.45s ${delay}ms cubic-bezier(0.16,1,0.3,1) both`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: accent, filter: 'blur(30px)', opacity: hov ? 0.12 : 0, transition: 'opacity 0.3s' }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: accent + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s', transform: hov ? 'scale(1.1)' : 'scale(1)' }}>
          <Icon style={{ width: 18, height: 18, color: accent }} />
        </div>
        {sub && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '2px 8px', borderRadius: 100, background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.14)' }}>
            <TrendingUp style={{ width: 9, height: 9, color: '#34D399' }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: '#34D399' }}>{sub}</span>
          </div>
        )}
      </div>
      <div style={{ fontSize: 28, fontWeight: 900, color: T.textPri, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 11, color: T.textSec, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: sparkData ? 14 : 0 }}>{label}</div>
      {sparkData && <Sparkline data={sparkData} color={accent} height={30} />}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   ACTIVITY FEED ITEM
───────────────────────────────────────────────────────────────────────────── */
const FeedItem = ({ icon: Icon, accent, title, meta, time, last }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, paddingTop: 13, paddingBottom: 13, borderBottom: last ? 'none' : `1px solid ${T.border}` }}>
    <div style={{ width: 34, height: 34, borderRadius: 10, background: accent + '16', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
      <Icon style={{ width: 14, height: 14, color: accent }} />
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: T.textPri, lineHeight: 1.35, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
      <div style={{ fontSize: 11, color: T.textSec, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{meta}</div>
    </div>
    <div style={{ fontSize: 10, color: '#2D4A6A', fontWeight: 500, flexShrink: 0, marginTop: 3 }}>{time}</div>
  </div>
);

/* ─────────────────────────────────────────────────────────────────────────────
   HEALTH ROW
───────────────────────────────────────────────────────────────────────────── */
const HealthRow = ({ label, value, status, pct }) => {
  const col = status === 'ok' ? '#34D399' : status === 'warn' ? '#FBBF24' : '#F87171';
  return (
    <div style={{ paddingTop: 11, paddingBottom: 11, borderBottom: `1px solid rgba(30,60,90,0.3)` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: pct != null ? 6 : 0 }}>
        <span style={{ fontSize: 12, color: T.textSec, fontWeight: 500 }}>{label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: T.textMid }}>{value}</span>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: col, boxShadow: `0 0 6px ${col}`, display: 'inline-block' }} />
        </div>
      </div>
      {pct != null && (
        <div style={{ height: 3, borderRadius: 100, background: 'rgba(30,60,90,0.5)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, borderRadius: 100, background: `linear-gradient(to right, ${T.teal}, ${T.tealDark})`, transition: 'width 0.8s cubic-bezier(0.16,1,0.3,1)' }} />
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   QUICK ACTION CARD
───────────────────────────────────────────────────────────────────────────── */
const ActionCard = ({ label, desc, icon: Icon, accent, onClick, locked }) => {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={locked}
      onMouseEnter={() => !locked && setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        textAlign: 'left',
        padding: '20px 20px 18px',
        borderRadius: 18,
        background: hov ? T.bgCard2 : T.bgCard,
        border: `1px solid ${hov ? accent + '28' : T.border}`,
        cursor: locked ? 'not-allowed' : 'pointer',
        opacity: locked ? 0.45 : 1,
        transition: 'all 0.2s ease',
        transform: hov ? 'translateY(-3px)' : 'translateY(0)',
        boxShadow: hov ? `0 14px 35px ${accent}0F` : 'none',
        width: '100%',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: accent + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s', transform: hov ? 'scale(1.12)' : 'scale(1)' }}>
          <Icon style={{ width: 18, height: 18, color: accent }} />
        </div>
        {locked
          ? <Lock style={{ width: 13, height: 13, color: '#1E3A52' }} />
          : <ArrowUpRight style={{ width: 14, height: 14, color: hov ? T.textMid : '#1E3A52', transition: 'color 0.2s' }} />
        }
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: T.textPri, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 11, color: T.textSec, lineHeight: 1.55 }}>{desc}</div>
      {locked && <div style={{ fontSize: 10, color: '#1E3A52', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', marginTop: 8 }}>Subscription required</div>}
    </button>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   PLAN BADGE
───────────────────────────────────────────────────────────────────────────── */
const PlanBadge = ({ text, glow }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 100, background: T.teal + '0C', border: `1px solid ${T.teal}22` }}>
    <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.teal, boxShadow: glow ? `0 0 8px ${T.teal}` : 'none', animation: 'tiq-pulse 2.5s infinite' }} />
    <span style={{ fontSize: 10, fontWeight: 700, color: T.tealLight, textTransform: 'uppercase', letterSpacing: '0.16em' }}>{text}</span>
  </div>
);

/* ─────────────────────────────────────────────────────────────────────────────
   TOP NAV
───────────────────────────────────────────────────────────────────────────── */
const TopNav = ({ user, subscription, activeTab, setActiveTab, onLogout, navItems }) => {
  const [userOpen, setUserOpen]    = useState(false);
  const [notifOpen, setNotifOpen]  = useState(false);
  const [mobileOpen, setMobileOpen]= useState(false);
  const userRef  = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    const h = (e) => {
      if (userRef.current  && !userRef.current.contains(e.target))  setUserOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || 'U';

  const fmtRole = r => r?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) ?? 'User';
  const isSA = user?.role === 'SUPER_ADMIN';
  const hasSub = subscription?.is_active === true;

  const navBtn = (id, label, Icon, locked) => {
    const active = activeTab === id;
    return (
      <button
        key={id}
        onClick={() => !locked && setActiveTab(id)}
        title={locked ? 'Subscription required' : label}
        style={{
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '7px 14px', borderRadius: 10,
          fontSize: 13, fontWeight: 600, border: 'none',
          cursor: locked ? 'not-allowed' : 'pointer',
          color: active ? '#fff' : locked ? '#1E3A52' : T.textSec,
          background: active ? `linear-gradient(135deg, ${T.teal}E0, ${T.tealDark}E0)` : 'transparent',
          boxShadow: active ? `0 3px 16px ${T.teal}28` : 'none',
          transition: 'all 0.15s ease',
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={e => { if (!locked && !active) { e.currentTarget.style.background = 'rgba(20,184,166,0.07)'; e.currentTarget.style.color = T.textPri; } }}
        onMouseLeave={e => { if (!locked && !active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.textSec; } }}
      >
        <Icon style={{ width: 15, height: 15, flexShrink: 0 }} />
        <span>{label}</span>
        {locked && <Lock style={{ width: 11, height: 11, opacity: 0.5 }} />}
      </button>
    );
  };

  const iconBtn = (onClick, children, ref) => (
    <button ref={ref} onClick={onClick} style={{ width: 36, height: 36, borderRadius: 10, background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textSec, cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0 }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(20,184,166,0.07)'; e.currentTarget.style.color = T.textPri; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.textSec; }}>
      {children}
    </button>
  );

  const dropdownBase = { position: 'absolute', right: 0, top: 'calc(100% + 10px)', borderRadius: 18, background: '#080F1C', border: `1px solid ${T.border}`, boxShadow: '0 30px 80px rgba(0,0,0,0.75)', overflow: 'hidden', zIndex: 200 };

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 100 }}>
      {/* Accent line */}
      <div style={{ height: 1, background: `linear-gradient(to right, transparent, ${T.teal}80, transparent)` }} />
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 32px', height: 62,
        background: 'rgba(7,17,31,0.92)',
        backdropFilter: 'blur(28px)',
        borderBottom: `1px solid ${T.border}`,
        boxShadow: '0 1px 0 rgba(20,184,166,0.04), 0 6px 40px rgba(0,0,0,0.45)',
      }}>

        {/* LEFT */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 11, flexShrink: 0 }}>
            <div style={{ position: 'relative' }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: `linear-gradient(135deg, ${T.teal} 0%, ${T.tealDark} 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 18px ${T.teal}38` }}>
                <span style={{ color: '#fff', fontWeight: 900, fontSize: 18, lineHeight: 1 }}>T</span>
              </div>
              <span style={{ position: 'absolute', top: -2, right: -2, width: 10, height: 10, borderRadius: '50%', background: T.teal, border: `2px solid ${T.bg}`, boxShadow: `0 0 7px ${T.teal}`, animation: 'tiq-pulse 3s infinite' }} />
            </div>
            <div style={{ lineHeight: 1 }}>
              <div style={{ fontWeight: 900, fontSize: 17, color: T.textPri, letterSpacing: '-0.04em' }}>TenantIQ</div>
              {user?.company_name && (
                <div style={{ fontSize: 9, fontWeight: 700, color: T.teal + '70', textTransform: 'uppercase', letterSpacing: '0.18em', marginTop: 2 }}>{user.company_name}</div>
              )}
            </div>
          </div>

          {/* Divider */}
          <div style={{ width: 1, height: 22, background: T.border, display: 'none', flexShrink: 0 }} className="lg-show-flex" />

          {/* Nav tabs — hidden on mobile */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: 2 }} className="nav-desktop">
            {navItems.map(({ id, label, icon, locked }) => navBtn(id, label, icon, locked))}
          </nav>
        </div>

        {/* RIGHT */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Sub badge desktop */}
          {!isSA && (
            <div style={{ marginRight: 6 }} className="sub-badge-desktop">
              {hasSub
                ? <PlanBadge text={subscription?.plan_name || 'Active'} glow />
                : (
                  <button onClick={() => setActiveTab('subscription')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 100, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.18)', cursor: 'pointer', transition: 'all 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(245,158,11,0.14)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(245,158,11,0.08)'}>
                    <Zap style={{ width: 12, height: 12, color: '#FBBF24' }} />
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#FBBF24', textTransform: 'uppercase', letterSpacing: '0.14em' }}>Upgrade</span>
                  </button>
                )}
            </div>
          )}

          {/* Notifications */}
          <div style={{ position: 'relative' }} ref={notifRef}>
            {iconBtn(() => setNotifOpen(p => !p), <Bell style={{ width: 17, height: 17 }} />, null)}
            {notifOpen && (
              <div style={{ ...dropdownBase, width: 320 }}>
                <div style={{ padding: '14px 18px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 700, color: T.textPri, fontSize: 14 }}>Notifications</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: T.textSec, textTransform: 'uppercase', letterSpacing: '0.12em', background: 'rgba(30,60,90,0.4)', padding: '2px 8px', borderRadius: 100 }}>0 new</span>
                </div>
                <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(30,60,90,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                    <Bell style={{ width: 20, height: 20, color: '#1E3A52' }} />
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: T.textSec }}>All caught up!</p>
                  <p style={{ fontSize: 11, color: '#1E3A52', marginTop: 4 }}>No new notifications right now</p>
                </div>
              </div>
            )}
          </div>

          {iconBtn(null, <HelpCircle style={{ width: 17, height: 17 }} />)}

          {/* Divider */}
          <div style={{ width: 1, height: 20, background: T.border, margin: '0 4px' }} />

          {/* User menu */}
          <div style={{ position: 'relative' }} ref={userRef}>
            <button onClick={() => setUserOpen(p => !p)} style={{
              display: 'flex', alignItems: 'center', gap: 9,
              padding: '5px 10px 5px 6px', borderRadius: 12, border: `1px solid ${userOpen ? T.teal + '28' : 'transparent'}`,
              background: userOpen ? 'rgba(20,184,166,0.05)' : 'transparent',
              cursor: 'pointer', transition: 'all 0.15s',
            }}
              onMouseEnter={e => { if (!userOpen) { e.currentTarget.style.background = 'rgba(30,60,90,0.4)'; e.currentTarget.style.border = `1px solid ${T.border}`; } }}
              onMouseLeave={e => { if (!userOpen) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.border = '1px solid transparent'; } }}>
              <div style={{ width: 30, height: 30, borderRadius: 9, background: `linear-gradient(135deg, ${T.teal}, ${T.tealDark})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 12, flexShrink: 0, boxShadow: `0 2px 10px ${T.teal}30` }}>
                {initials}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1 }} className="user-name-desktop">
                <span style={{ fontSize: 13, fontWeight: 700, color: T.textPri }}>{user?.name || 'User'}</span>
                <span style={{ fontSize: 10, color: T.textSec, marginTop: 2 }}>{fmtRole(user?.role)}</span>
              </div>
              <ChevronDown style={{ width: 13, height: 13, color: T.textSec, transition: 'transform 0.2s', transform: userOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} className="user-chevron-desktop" />
            </button>

            {userOpen && (
              <div style={{ ...dropdownBase, width: 260 }}>
                {/* Header */}
                <div style={{ padding: 16, borderBottom: `1px solid ${T.border}`, background: `linear-gradient(135deg, ${T.teal}08, transparent)` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 13, background: `linear-gradient(135deg, ${T.teal}, ${T.tealDark})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 15, boxShadow: `0 4px 14px ${T.teal}30` }}>{initials}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: T.textPri, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name || 'User'}</div>
                      <div style={{ fontSize: 11, color: T.textSec, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ padding: '2px 9px', borderRadius: 100, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', background: T.teal + '12', color: T.tealLight, border: `1px solid ${T.teal}20` }}>{fmtRole(user?.role)}</span>
                    {hasSub && !isSA && <span style={{ padding: '2px 9px', borderRadius: 100, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', background: 'rgba(52,211,153,0.1)', color: '#34D399', border: '1px solid rgba(52,211,153,0.18)' }}>Premium</span>}
                  </div>
                </div>
                <div style={{ padding: '6px 0' }}>
                  {[
                    { label: 'My Profile', icon: UserIcon, tab: 'profile', sub: 'View & edit your info' },
                    { label: 'Settings',   icon: Settings,  tab: 'settings', sub: 'Preferences & security' },
                    ...(user?.role !== 'SUPER_ADMIN' ? [{ label: 'Subscription', icon: CreditCard, tab: 'subscription', sub: 'Plans & billing' }] : []),
                  ].map(({ label, icon: Ic, tab, sub }) => (
                    <button key={tab} onClick={() => { setActiveTab(tab); setUserOpen(false); }}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', background: 'transparent', border: 'none', cursor: 'pointer', color: T.textMid, transition: 'all 0.12s', textAlign: 'left' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(20,184,166,0.06)'; e.currentTarget.style.color = T.textPri; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.textMid; }}>
                      <div style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(30,60,90,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Ic style={{ width: 13, height: 13 }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3 }}>{label}</div>
                        <div style={{ fontSize: 10, color: T.textSec, lineHeight: 1.3 }}>{sub}</div>
                      </div>
                    </button>
                  ))}
                  <div style={{ margin: '6px 14px', borderTop: `1px solid ${T.border}` }} />
                  <button onClick={() => { setUserOpen(false); onLogout(); }}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#F87171', transition: 'all 0.12s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.07)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <div style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <LogOut style={{ width: 13, height: 13 }} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>Sign out</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setMobileOpen(p => !p)} className="nav-mobile-btn"
            style={{ width: 36, height: 36, borderRadius: 10, background: 'transparent', border: 'none', color: T.textSec, cursor: 'pointer', display: 'none', alignItems: 'center', justifyContent: 'center', marginLeft: 4 }}>
            {mobileOpen ? <X style={{ width: 18, height: 18 }} /> : <Menu style={{ width: 18, height: 18 }} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="nav-mobile-drawer" style={{ padding: '10px 12px', background: 'rgba(7,17,31,0.98)', borderBottom: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {navItems.map(({ id, label, icon: Ic, locked }) => (
            <button key={id} onClick={() => { if (!locked) { setActiveTab(id); setMobileOpen(false); } }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 12, fontSize: 14, fontWeight: 600, border: 'none', cursor: locked ? 'not-allowed' : 'pointer', color: activeTab === id ? '#fff' : locked ? '#1E3A52' : T.textSec, background: activeTab === id ? `linear-gradient(135deg, ${T.teal}D0, ${T.tealDark}D0)` : 'transparent', transition: 'all 0.15s' }}>
              <Ic style={{ width: 16, height: 16 }} />
              {label}
              {locked && <Lock style={{ width: 13, height: 13, marginLeft: 'auto', opacity: 0.4 }} />}
            </button>
          ))}
        </div>
      )}

      <style>{`
        @media (min-width: 1024px) {
          .nav-desktop { display: flex !important; }
          .lg-show-flex { display: flex !important; }
          .sub-badge-desktop { display: block !important; }
          .user-name-desktop { display: flex !important; }
          .user-chevron-desktop { display: block !important; }
        }
        @media (max-width: 1023px) {
          .nav-desktop { display: none !important; }
          .sub-badge-desktop { display: none !important; }
          .user-name-desktop { display: none !important; }
          .user-chevron-desktop { display: none !important; }
          .nav-mobile-btn { display: flex !important; }
          .nav-mobile-drawer { display: flex !important; }
        }
        @media (max-width: 640px) {
          header > div:nth-child(2) { padding: 0 16px !important; }
        }
      `}</style>
    </header>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   OVERVIEW TAB
───────────────────────────────────────────────────────────────────────────── */
const OverviewTab = ({ user, canManageUsers, canAccessLogs, setActiveTab, subscription }) => {
  const hasSub = subscription?.is_active === true;
  const greeting = (() => {
    const h = new Date().getHours();
    return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
  })();

  const sparks = {
    chats:  [18, 24, 19, 31, 27, 38, 33, 45, 40, 55, 49, 62],
    docs:   [4,  7,  5,  9,  8, 13, 11, 15, 14, 17, 19, 24],
    team:   [3,  3,  4,  4,  5,  5,  6,  6,  7,  8,  9, 11],
    eff:    [74, 77, 72, 80, 79, 83, 81, 86, 84, 88, 87, 91],
  };

  const feed = [
    { icon: MessageSquare, accent: T.teal,      title: 'AI query answered',        meta: 'Lease agreement — 4 sources cited',          time: '2m' },
    { icon: Users,         accent: '#A78BFA',   title: 'Team member invited',       meta: 'priya.m@acme.io added as Tenant User',        time: '47m' },
    { icon: FileText,      accent: '#38BDF8',   title: 'Document indexed',          meta: 'Q3_Financial_Report.pdf · 2.4 MB',            time: '2h' },
    { icon: CheckCircle2,  accent: '#34D399',   title: 'Verification emails sent',  meta: 'Onboarding triggered for 3 new accounts',     time: '4h' },
    { icon: Shield,        accent: '#FBBF24',   title: 'Security scan passed',      meta: 'Zero anomalies detected this week',            time: '1d' },
    { icon: RefreshCw,     accent: '#F472B6',   title: 'Subscription renewed',      meta: `Plan auto-renewed · ${subscription?.plan_name || 'Pro'}`, time: '3d' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <div style={{ width: 3, height: 18, borderRadius: 10, background: `linear-gradient(to bottom, ${T.teal}, ${T.tealDark})` }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: T.teal + '80', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Workspace Overview</span>
          </div>
          <h2 style={{ fontSize: 26, fontWeight: 900, color: T.textPri, letterSpacing: '-0.04em', lineHeight: 1.1 }}>
            Good {greeting}, <span style={{ color: T.tealLight }}>{user?.name?.split(' ')[0] || 'there'}</span> 👋
          </h2>
          <p style={{ fontSize: 13, color: T.textSec, marginTop: 5 }}>Here's your workspace at a glance today.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px', borderRadius: 12, background: 'rgba(20,184,166,0.05)', border: `1px solid ${T.teal}14` }}>
          <Clock style={{ width: 13, height: 13, color: T.teal + '60' }} />
          <span style={{ fontSize: 12, color: T.textSec, fontWeight: 500 }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        <StatCard label="AI Conversations" value="2,547" sub="+12%" icon={MessageSquare} accent={T.teal}    sparkData={sparks.chats} delay={0}   />
        <StatCard label="Documents"        value="156"   sub="+8%"  icon={FileText}      accent="#38BDF8"   sparkData={sparks.docs}  delay={60}  />
        <StatCard label="Team Members"     value="24"    sub="+3"   icon={Users}         accent="#A78BFA"   sparkData={sparks.team}  delay={120} />
        <StatCard label="Efficiency Score" value="91%"   sub="+4%"  icon={Gauge}         accent="#34D399"   sparkData={sparks.eff}   delay={180} />
      </div>

      {/* Middle row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }} className="mid-row-grid">
        {/* Activity feed */}
        <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 20, padding: '20px 20px 4px', animation: 'tiq-up 0.45s 240ms cubic-bezier(0.16,1,0.3,1) both' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <div style={{ width: 30, height: 30, borderRadius: 9, background: T.teal + '14', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Activity style={{ width: 14, height: 14, color: T.teal }} />
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: T.textPri }}>Activity Feed</span>
            </div>
            <button style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: T.teal, background: 'none', border: 'none', cursor: 'pointer' }}>
              <Eye style={{ width: 11, height: 11 }} /> View all
            </button>
          </div>
          {feed.map((item, i) => <FeedItem key={i} {...item} last={i === feed.length - 1} />)}
        </div>

        {/* Right column: health + usage */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* System health */}
          <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 20, padding: '20px 20px 4px', animation: 'tiq-up 0.45s 300ms cubic-bezier(0.16,1,0.3,1) both' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 6 }}>
              <div style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(52,211,153,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Cpu style={{ width: 14, height: 14, color: '#34D399' }} />
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: T.textPri }}>System Health</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 10, background: 'rgba(52,211,153,0.05)', border: '1px solid rgba(52,211,153,0.12)', marginBottom: 6 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#34D399', boxShadow: '0 0 7px #34D399', animation: 'tiq-pulse 2.5s infinite', flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#34D399' }}>All systems operational</span>
            </div>
            <HealthRow label="AI Engine"     value="99.9%" status="ok"   />
            <HealthRow label="Document API"  value="99.7%" status="ok"   />
            <HealthRow label="Auth Service"  value="100%"  status="ok"   />
            <HealthRow label="Storage"       value="68%"   status="warn" />
            <HealthRow label="Avg Latency"   value="14ms"  status="ok"   />
          </div>

          {/* Quota */}
          <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 20, padding: 20, animation: 'tiq-up 0.45s 360ms cubic-bezier(0.16,1,0.3,1) both' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <div style={{ width: 30, height: 30, borderRadius: 9, background: T.teal + '12', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Layers style={{ width: 14, height: 14, color: T.teal }} />
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: T.textPri }}>Monthly Quota</span>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: T.teal }}>847 / 1,000</span>
            </div>
            {[
              { label: 'AI Queries',    pct: 84.7, color: T.teal },
              { label: 'Storage',       pct: 68,   color: '#FBBF24' },
              { label: 'Team Seats',    pct: 48,   color: '#A78BFA' },
            ].map(({ label, pct, color }) => (
              <div key={label} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 11, color: T.textSec, fontWeight: 500 }}>{label}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color }}>{pct}%</span>
                </div>
                <div style={{ height: 5, borderRadius: 100, background: 'rgba(30,60,90,0.4)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, borderRadius: 100, background: color, transition: 'width 0.8s cubic-bezier(0.16,1,0.3,1)', opacity: 0.85 }} />
                </div>
              </div>
            ))}
            {!hasSub && (
              <button onClick={() => setActiveTab('subscription')}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', padding: '10px 0', borderRadius: 10, background: T.teal + '10', border: `1px dashed ${T.teal}28`, cursor: 'pointer', fontSize: 12, fontWeight: 700, color: T.tealLight, transition: 'all 0.15s', marginTop: 4 }}
                onMouseEnter={e => e.currentTarget.style.background = T.teal + '18'}
                onMouseLeave={e => e.currentTarget.style.background = T.teal + '10'}>
                <Zap style={{ width: 13, height: 13 }} /> Upgrade for unlimited access
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ animation: 'tiq-up 0.45s 420ms cubic-bezier(0.16,1,0.3,1) both' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <div style={{ width: 3, height: 14, borderRadius: 10, background: `linear-gradient(to bottom, ${T.teal}, ${T.tealDark})` }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: T.textSec, textTransform: 'uppercase', letterSpacing: '0.18em' }}>Quick Actions</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12 }}>
          <ActionCard label="Start AI Chat"  desc="Query your knowledge base with natural language"  icon={MessageSquare} accent={T.teal}    onClick={() => setActiveTab('chat')} />
          <ActionCard label="Manage Team"    desc="Invite, remove, and manage team roles"            icon={Users}         accent="#A78BFA"   onClick={() => setActiveTab('team')}  locked={!canManageUsers} />
          <ActionCard label="Audit Logs"     desc="Review all activity across your workspace"        icon={BarChart3}      accent="#38BDF8"  onClick={() => setActiveTab('audit')} locked={!canAccessLogs} />
          <ActionCard label="Knowledge Base" desc="Upload and manage your document library"          icon={BookOpen}      accent="#F472B6"   onClick={() => setActiveTab('chat')} locked={!hasSub} />
        </div>
      </div>

      <style>{`
        @media (min-width: 900px) {
          .mid-row-grid { grid-template-columns: 1.5fr 1fr !important; }
        }
      `}</style>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   SETTINGS TAB
───────────────────────────────────────────────────────────────────────────── */
const SettingsTab = ({ user, setActiveTab, setShowChangePassword, handleLogout, subscription }) => {
  const hasSub = subscription?.is_active === true;
  const fmtRole = r => r?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) ?? 'User';

  const infoRows = [
    { label: 'Email',       value: user?.email,                    icon: Globe },
    { label: 'Role',        value: fmtRole(user?.role),            icon: Shield },
    { label: 'Company',     value: user?.company_name || '—',      icon: Database },
    { label: 'Department',  value: user?.department    || '—',     icon: Users },
    { label: 'Status',      value: user?.is_active ? 'Active' : 'Inactive', icon: Activity, ok: user?.is_active },
  ];

  return (
    <div style={{ maxWidth: 680, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ animation: 'tiq-up 0.4s cubic-bezier(0.16,1,0.3,1) both' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <div style={{ width: 3, height: 16, borderRadius: 10, background: `linear-gradient(to bottom, ${T.teal}, ${T.tealDark})` }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: T.teal + '80', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Account</span>
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 900, color: T.textPri, letterSpacing: '-0.04em' }}>Settings</h2>
        <p style={{ fontSize: 13, color: T.textSec, marginTop: 4 }}>Manage preferences, security, and account details.</p>
      </div>

      {/* Action cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, animation: 'tiq-up 0.4s 80ms cubic-bezier(0.16,1,0.3,1) both' }}>
        <ActionCard label="Security"     desc="Change password and manage 2FA"           icon={Shield}    accent={T.teal}  onClick={() => setShowChangePassword(true)} />
        <ActionCard label="Profile"      desc="Edit name, phone, and department"          icon={UserIcon}  accent="#38BDF8" onClick={() => setActiveTab('profile')} />
        <ActionCard label="Subscription" desc="Plans, billing, and usage limits"          icon={CreditCard} accent="#FBBF24" onClick={() => setActiveTab('subscription')} />
        <ActionCard label="Integrations" desc="Connect your stack via API & webhooks"     icon={Wifi}      accent="#A78BFA" onClick={() => {}} locked={!hasSub} />
      </div>

      {/* Account info */}
      <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 20, overflow: 'hidden', animation: 'tiq-up 0.4s 160ms cubic-bezier(0.16,1,0.3,1) both' }}>
        <div style={{ padding: '14px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 26, height: 26, borderRadius: 8, background: T.teal + '12', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UserIcon style={{ width: 11, height: 11, color: T.teal }} />
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, color: T.textSec, textTransform: 'uppercase', letterSpacing: '0.18em' }}>Account Information</span>
        </div>
        <div style={{ padding: '0 20px' }}>
          {infoRows.map(({ label, value, icon: Ic, ok }, i) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 0', borderBottom: i < infoRows.length - 1 ? `1px solid rgba(30,60,90,0.3)` : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <Ic style={{ width: 13, height: 13, color: '#2D4A6A' }} />
                <span style={{ fontSize: 12, color: T.textSec, fontWeight: 500 }}>{label}</span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: ok === true ? '#34D399' : ok === false ? '#F87171' : T.textMid }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Danger zone */}
      <div style={{ background: 'rgba(239,68,68,0.025)', border: '1px solid rgba(239,68,68,0.09)', borderRadius: 20, padding: 20, animation: 'tiq-up 0.4s 240ms cubic-bezier(0.16,1,0.3,1) both' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
          <AlertTriangle style={{ width: 14, height: 14, color: 'rgba(239,68,68,0.5)' }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(239,68,68,0.5)', textTransform: 'uppercase', letterSpacing: '0.16em' }}>Danger Zone</span>
        </div>
        <p style={{ fontSize: 12, color: '#2D4A6A', marginBottom: 14 }}>These actions are permanent and cannot be undone.</p>
        <button onClick={handleLogout}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px', borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.14)', color: '#F87171', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.13)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}>
          <LogOut style={{ width: 14, height: 14 }} />
          Sign out of account
        </button>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN DASHBOARD
───────────────────────────────────────────────────────────────────────────── */
const Dashboard = ({ user: propUser, subscription: propSubscription, onLogout, onSubscriptionChange }) => {
  const navigate   = useNavigate();
  const [activeTab, setActiveTab]         = useState('chat');
  const [showChangePw, setShowChangePw]   = useState(false);
  const [user, setUser]                   = useState(propUser);
  const [loadingUser, setLoadingUser]     = useState(!propUser);
  const subscription = propSubscription;

  const norm = r => r?.toUpperCase() ?? null;

  const fetchUser = async () => {
    if (propUser) return;
    try {
      setLoadingUser(true);
      const { data } = await api.get('/auth/me/');
      const u = { ...data, role: norm(data.role) };
      setUser(u); authService.setCurrentUser(u);
    } catch (e) { if (e.response?.status === 401) handleLogout(); }
    finally { setLoadingUser(false); }
  };

  const handleLogout = async () => {
    try { await authService.logout(); } catch {}
    finally { sessionStorage.clear(); navigate('/login'); onLogout?.(); }
  };

  useEffect(() => { if (!propUser) fetchUser(); else setUser({ ...propUser, role: norm(propUser.role) }); }, []);
  useEffect(() => { if (propUser && JSON.stringify(propUser) !== JSON.stringify(user)) setUser({ ...propUser, role: norm(propUser.role) }); }, [propUser]);

  if (loadingUser) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: T.bg, gap: 18 }}>
      <div style={{ position: 'relative' }}>
        <div style={{ width: 56, height: 56, borderRadius: 18, background: `linear-gradient(135deg, ${T.teal}, ${T.tealDark})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 40px ${T.teal}45` }}>
          <span style={{ color: '#fff', fontWeight: 900, fontSize: 26 }}>T</span>
        </div>
        <div style={{ position: 'absolute', inset: -4, borderRadius: 22, border: `2px solid ${T.teal}30`, animation: 'tiq-ping 1.5s cubic-bezier(0,0,0.2,1) infinite' }} />
      </div>
      <p style={{ fontSize: 11, color: T.textSec, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em' }}>Loading workspace…</p>
    </div>
  );

  if (!user) { handleLogout(); return null; }

  const role = norm(user?.role);
  const isSA   = role === 'SUPER_ADMIN';
  const isTA   = role === 'TENANT_ADMIN';
  const isTU   = role === 'TENANT_USER';
  const hasSub = subscription?.is_active === true;
  const canManageUsers  = isSA || (isTA && hasSub);
  const canAccessSub    = isTA || isTU;
  const canAccessLogs   = isSA;

  const navItems = [
    ...(!isTU ? [{ id: 'home', label: 'Overview', icon: Home }] : []),
    { id: 'chat',  label: 'AI Chat',    icon: MessageSquare },
    ...(isSA || isTA ? [{ id: 'team', label: 'Team', icon: Users, locked: !canManageUsers }] : []),
    ...(canAccessLogs ? [{ id: 'audit', label: 'Audit Logs', icon: BarChart3 }] : []),
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const SubBanner = () => {
    if (isTU || isSA || hasSub || activeTab === 'subscription') return null;
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderRadius: 16, background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.14)', marginBottom: 24 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Zap style={{ width: 16, height: 16, color: '#FBBF24' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#FCD34D' }}>Activate subscription to unlock all features</p>
          <p style={{ fontSize: 11, color: '#78350F', marginTop: 2 }}>Team management, unlimited AI, document training, and more.</p>
        </div>
        <button onClick={() => setActiveTab('subscription')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#fff', fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', flexShrink: 0, boxShadow: '0 4px 14px rgba(245,158,11,0.25)', transition: 'all 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
          <Sparkles style={{ width: 12, height: 12 }} /> View Plans
        </button>
      </div>
    );
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: T.bg, color: T.textPri, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        @keyframes tiq-up   { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes tiq-in   { from { opacity:0; } to { opacity:1; } }
        @keyframes tiq-pulse { 0%,100%{opacity:1;} 50%{opacity:0.5;} }
        @keyframes tiq-ping  { 0%{transform:scale(1);opacity:1;} 75%,100%{transform:scale(1.5);opacity:0;} }
        * { box-sizing: border-box; }
      `}</style>

      <AmbientBg />
      <TopNav user={user} subscription={subscription} activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} navItems={navItems} />

      <main style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 24px 60px' }}>
          <SubBanner />

          {/* OVERVIEW */}
          {activeTab === 'home' && !isTU && (
            <OverviewTab user={user} canManageUsers={canManageUsers} canAccessLogs={canAccessLogs} setActiveTab={setActiveTab} subscription={subscription} />
          )}

          {/* AI CHAT */}
          {activeTab === 'chat' && (
            <div style={{ height: 'calc(100vh - 200px)', minHeight: 500, animation: 'tiq-in 0.3s ease both' }}>
              <ChatInterface hasSubscription={hasSub} onUpgrade={() => setActiveTab('subscription')} />
            </div>
          )}

          {/* TEAM */}
          {activeTab === 'team' && (isSA || isTA) && canManageUsers && (
            <div style={{ animation: 'tiq-up 0.4s cubic-bezier(0.16,1,0.3,1) both' }}>
              <UserManagement onRefresh={() => onSubscriptionChange?.()} user={user} subscription={subscription} />
            </div>
          )}

          {/* AUDIT LOGS */}
          {activeTab === 'audit' && canAccessLogs && (
            <div style={{ animation: 'tiq-up 0.4s cubic-bezier(0.16,1,0.3,1) both' }}><AuditLogs /></div>
          )}

          {/* PROFILE */}
          {activeTab === 'profile' && (
            <div style={{ animation: 'tiq-up 0.4s cubic-bezier(0.16,1,0.3,1) both' }}><Profile /></div>
          )}

          {/* SUBSCRIPTION */}
          {activeTab === 'subscription' && canAccessSub && (
            <div style={{ animation: 'tiq-up 0.4s cubic-bezier(0.16,1,0.3,1) both' }}>
              <SubscriptionPlans currentSubscription={subscription} onSubscriptionChange={() => onSubscriptionChange?.()} isAdmin={isTA} user={user} />
            </div>
          )}

          {/* SETTINGS */}
          {activeTab === 'settings' && (
            <SettingsTab user={user} setActiveTab={setActiveTab} setShowChangePassword={setShowChangePw} handleLogout={handleLogout} subscription={subscription} />
          )}
        </div>
        <Footer />
      </main>

      {showChangePw && <ChangePassword onClose={() => setShowChangePw(false)} />}
    </div>
  );
};

export default Dashboard;
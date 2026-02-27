// ==================== src/components/LandingPage.jsx ====================
import React from 'react';

const LandingPage = ({ onLogin, onSignup }) => (
  <div className="tiq-landing">
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

      :root {
        --color-teal: #14B8A6;
        --color-teal-dark: #0D9488;
        --color-teal-light: #2DD4BF;
        --color-slate-900: #0F172A;
        --color-slate-800: #1E293B;
        --color-slate-700: #334155;
        --color-slate-400: #94A3B8;
        --color-slate-50: #F8FAFC;
        --white: #ffffff;
      }

      .tiq-landing * { box-sizing: border-box; margin: 0; padding: 0; }

      .tiq-landing {
        font-family: 'Plus Jakarta Sans', sans-serif;
        background: var(--color-slate-900);
        color: var(--color-slate-50);
        min-height: 100vh;
        overflow-x: hidden;
      }

      /* NAV */
      .tiq-nav {
        display: flex; align-items: center; justify-content: space-between;
        padding: 0 4rem; height: 80px;
        background: rgba(15, 23, 42, 0.8);
        backdrop-filter: blur(12px);
        border-bottom: 1px solid var(--color-slate-800);
        position: sticky; top: 0; z-index: 100;
      }
      .tiq-logo {
        font-weight: 800; font-size: 1.5rem;
        color: var(--white); letter-spacing: -0.02em;
        display: flex; align-items: center; gap: 0.75rem;
      }
      .tiq-logo-icon {
        width: 36px; height: 36px;
        background: var(--color-teal); border-radius: 10px;
        display: flex; align-items: center; justify-content: center;
        color: white; font-size: 1rem; font-weight: 800;
        box-shadow: 0 0 20px rgba(20, 184, 166, 0.3);
      }
      .tiq-nav-center { display: flex; gap: 2rem; }
      .tiq-nav-link {
        font-size: 0.9rem; font-weight: 500;
        color: var(--color-slate-400); background: none; border: none;
        cursor: pointer; transition: all 0.2s;
        font-family: 'Plus Jakarta Sans', sans-serif;
      }
      .tiq-nav-link:hover { color: var(--color-teal); }

      .tiq-nav-right { display: flex; gap: 1rem; align-items: center; }
      .tiq-btn-ghost {
        padding: 0.6rem 1.25rem; font-size: 0.9rem; font-weight: 600;
        color: var(--white); background: none;
        border: 1px solid var(--color-slate-700); border-radius: 10px;
        cursor: pointer; transition: all 0.2s;
        font-family: 'Plus Jakarta Sans', sans-serif;
      }
      .tiq-btn-ghost:hover { background: var(--color-slate-800); border-color: var(--color-slate-400); }
      .tiq-btn-primary {
        padding: 0.6rem 1.5rem; font-size: 0.9rem; font-weight: 600;
        color: white; background: var(--color-teal);
        border: none; border-radius: 10px;
        cursor: pointer; transition: all 0.2s;
        font-family: 'Plus Jakarta Sans', sans-serif;
        box-shadow: 0 4px 12px rgba(20, 184, 166, 0.3);
      }
      .tiq-btn-primary:hover { background: var(--color-teal-dark); transform: translateY(-1px); }

      /* HERO */
      .tiq-hero {
        padding: 8rem 2rem 6rem; text-align: center;
        position: relative; overflow: hidden;
      }
      .tiq-hero::before {
        content: ''; position: absolute; top: -10%; left: 50%; transform: translateX(-50%);
        width: 80%; height: 60%; background: radial-gradient(circle, rgba(20, 184, 166, 0.1) 0%, transparent 70%);
        z-index: 0; pointer-events: none;
      }
      .tiq-hero-content { position: relative; z-index: 1; }
      .tiq-hero-badge {
        display: inline-flex; align-items: center; gap: 0.5rem;
        padding: 0.5rem 1rem;
        background: rgba(20, 184, 166, 0.1); color: var(--color-teal);
        border-radius: 100px; font-size: 0.8rem; font-weight: 600;
        margin-bottom: 2rem; border: 1px solid rgba(20, 184, 166, 0.2);
      }
      .tiq-badge-dot {
        width: 8px; height: 8px; background: var(--color-teal);
        border-radius: 50%; animation: tiq-pulse 2s infinite;
      }
      @keyframes tiq-pulse { 0%,100% { opacity:1; box-shadow: 0 0 0 0 rgba(20, 184, 166, 0.4); } 50% { opacity:0.6; box-shadow: 0 0 0 6px rgba(20, 184, 166, 0); } }
      .tiq-h1 {
        font-size: clamp(2.5rem, 6vw, 4.5rem); font-weight: 800;
        line-height: 1.05; letter-spacing: -0.04em;
        color: var(--white); max-width: 900px;
        margin: 0 auto 1.5rem;
      }
      .tiq-h1 span {
        background: linear-gradient(to right, #2DD4BF, #14B8A6);
        -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      }
      .tiq-hero-sub {
        font-size: 1.2rem; color: var(--color-slate-400); line-height: 1.6;
        max-width: 600px; margin: 0 auto 3rem; font-weight: 400;
      }
      .tiq-hero-actions { display: flex; gap: 1.5rem; justify-content: center; flex-wrap: wrap; }
      .tiq-hero-cta {
        display: inline-flex; align-items: center; gap: 0.75rem;
        padding: 1rem 2.5rem; background: var(--color-teal); color: white;
        border: none; border-radius: 12px;
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: 1rem; font-weight: 700; cursor: pointer; transition: all 0.2s;
        box-shadow: 0 10px 25px rgba(20, 184, 166, 0.25);
      }
      .tiq-hero-cta:hover { transform: translateY(-2px); box-shadow: 0 15px 30px rgba(20, 184, 166, 0.35); background: var(--color-teal-dark); }
      .tiq-hero-outline {
        display: inline-flex; align-items: center; gap: 0.75rem;
        padding: 1rem 2.5rem; background: transparent; color: var(--white);
        border: 1.5px solid var(--color-slate-700); border-radius: 12px;
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: 1rem; font-weight: 700; cursor: pointer; transition: all 0.2s;
      }
      .tiq-hero-outline:hover { border-color: var(--color-teal); background: rgba(20, 184, 166, 0.05); }

      /* MOCKUP */
      .tiq-mockup-container {
        max-width: 1100px; margin: 5rem auto 0;
        padding: 0 2rem; perspective: 1000px;
      }
      .tiq-mockup-wrap {
        background: var(--color-slate-800);
        border-radius: 20px; overflow: hidden;
        border: 1px solid rgba(255, 255, 255, 0.05);
        box-shadow: 0 30px 100px rgba(0, 0, 0, 0.4);
        transform: rotateX(5deg); transition: transform 0.5s;
      }
      .tiq-mockup-wrap:hover { transform: rotateX(0deg); }
      .tiq-mockup-bar {
        background: rgba(255, 255, 255, 0.03); padding: 0.75rem 1.5rem;
        display: flex; align-items: center; gap: 1.5rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      }
      .tiq-mockup-dots { display: flex; gap: 8px; }
      .tiq-mockup-dot { width: 12px; height: 12px; border-radius: 50%; opacity: 0.5; }
      .tiq-mockup-url {
        flex: 1; background: rgba(0, 0, 0, 0.2); border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 8px; padding: 0.4rem 1rem;
        font-size: 0.8rem; color: var(--color-slate-400); text-align: center;
      }
      .tiq-mockup-body {
        display: grid; grid-template-columns: 240px 1fr;
        min-height: 500px;
      }
      .tiq-mock-sidebar {
        background: rgba(0, 0, 0, 0.1); border-right: 1px solid rgba(255, 255, 255, 0.05);
        padding: 2rem 1.25rem; display: flex; flex-direction: column; gap: 0.5rem;
      }
      .tiq-mock-sidebar-label {
        font-size: 0.7rem; font-weight: 700; color: var(--color-slate-400);
        letter-spacing: 0.1em; text-transform: uppercase;
        padding: 0 0.75rem; margin-bottom: 0.5rem;
      }
      .tiq-mock-item {
        display: flex; align-items: center; gap: 0.75rem;
        padding: 0.75rem; border-radius: 10px;
        font-size: 0.85rem; font-weight: 500; color: var(--color-slate-400);
      }
      .tiq-mock-item.act { background: rgba(20, 184, 166, 0.1); color: var(--color-teal); font-weight: 600; }

      .tiq-mock-content { flex: 1; padding: 2.5rem; display: flex; flex-direction: column; }
      .tiq-mock-chat { display: flex; flex-direction: column; gap: 1.5rem; flex: 1; }
      .tiq-mock-msg { display: flex; gap: 1rem; align-items: flex-start; }
      .tiq-mock-msg.right { flex-direction: row-reverse; }
      .tiq-mock-av {
        width: 32px; height: 32px; border-radius: 10px; flex-shrink: 0;
        display: flex; align-items: center; justify-content: center;
        font-size: 0.75rem; font-weight: 800;
      }
      .tiq-mock-av.ai { background: var(--color-teal); color: white; }
      .tiq-mock-av.u { background: var(--color-slate-700); color: white; }
      .tiq-mock-bub {
        max-width: 80%; padding: 1rem 1.25rem;
        font-size: 0.9rem; line-height: 1.6; border-radius: 16px;
      }
      .tiq-mock-bub.ai { background: rgba(20, 184, 166, 0.05); color: var(--color-slate-50); border: 1px solid rgba(20, 184, 166, 0.1); border-top-left-radius: 2px; }
      .tiq-mock-bub.u { background: var(--color-teal); color: white; border-top-right-radius: 2px; }

      .tiq-mock-input {
        margin-top: 2rem;
        display: flex; align-items: center; gap: 1rem;
        background: rgba(0, 0, 0, 0.2); border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 14px; padding: 0.75rem 1.25rem;
      }
      .tiq-mock-input-text { flex: 1; font-size: 0.9rem; color: var(--color-slate-400); }
      .tiq-mock-send {
        width: 32px; height: 32px; background: var(--color-teal);
        border-radius: 8px; display: flex; align-items: center; justify-content: center;
      }

      /* STATS */
      .tiq-stats-section { padding: 6rem 2rem; background: var(--color-slate-900); }
      .tiq-stats-grid {
        max-width: 1100px; margin: 0 auto;
        display: grid; grid-template-columns: repeat(4, 1fr); gap: 2rem;
      }
      .tiq-stat-card {
        padding: 2rem; background: rgba(30, 41, 59, 0.5); border: 1px solid var(--color-slate-800);
        border-radius: 20px; text-align: center; transition: all 0.3s;
      }
      .tiq-stat-card:hover { border-color: var(--color-teal); transform: translateY(-5px); }
      .tiq-stat-val { font-size: 2.5rem; font-weight: 800; color: var(--color-teal); letter-spacing: -0.04em; margin-bottom: 0.5rem; }
      .tiq-stat-label { font-size: 0.9rem; color: var(--color-slate-400); font-weight: 500; }

      /* FEATURES */
      .tiq-features { padding: 8rem 2rem; max-width: 1200px; margin: 0 auto; }
      .tiq-feat-header { text-align: center; margin-bottom: 5rem; }
      .tiq-feat-header h2 { font-size: 3rem; font-weight: 800; margin-bottom: 1rem; letter-spacing: -0.03em; }
      .tiq-feat-header p { color: var(--color-slate-400); font-size: 1.1rem; max-width: 600px; margin: 0 auto; }

      .tiq-feat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; }
      .tiq-feat-card {
        padding: 2.5rem; background: var(--color-slate-800); border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 24px; transition: all 0.3s; position: relative; overflow: hidden;
      }
      .tiq-feat-card::before {
        content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 100%;
        background: linear-gradient(135deg, rgba(20, 184, 166, 0.1) 0%, transparent 40%);
        opacity: 0; transition: opacity 0.3s;
      }
      .tiq-feat-card:hover { border-color: var(--color-teal); transform: translateY(-8px); }
      .tiq-feat-card:hover::before { opacity: 1; }

      .tiq-feat-icon {
        width: 56px; height: 56px; background: rgba(20, 184, 166, 0.1);
        border-radius: 16px; display: flex; align-items: center; justify-content: center;
        font-size: 1.5rem; margin-bottom: 1.5rem; color: var(--color-teal);
        border: 1px solid rgba(20, 184, 166, 0.2);
      }
      .tiq-feat-title { font-size: 1.25rem; font-weight: 700; margin-bottom: 1rem; color: var(--white); }
      .tiq-feat-desc { font-size: 0.95rem; color: var(--color-slate-400); line-height: 1.6; }

      /* CTA */
      .tiq-cta-section {
        padding: 8rem 2rem; text-align: center;
        background: linear-gradient(180deg, var(--color-slate-900) 0%, #080C14 100%);
      }
      .tiq-cta-card {
        max-width: 1000px; margin: 0 auto; padding: 5rem 3rem;
        background: var(--color-teal); border-radius: 40px;
        color: white; position: relative; overflow: hidden;
        box-shadow: 0 20px 50px rgba(20, 184, 166, 0.3);
      }
      .tiq-cta-card h2 { font-size: 3.5rem; font-weight: 800; margin-bottom: 1.5rem; line-height: 1; letter-spacing: -0.04em; }
      .tiq-cta-card p { font-size: 1.25rem; margin-bottom: 3rem; opacity: 0.9; max-width: 600px; margin-left: auto; margin-right: auto; }
      .tiq-cta-btn {
        padding: 1.25rem 3rem; background: white; color: var(--color-teal);
        border: none; border-radius: 16px; font-weight: 800; font-size: 1.1rem;
        cursor: pointer; transition: all 0.2s; box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
      }
      .tiq-cta-btn:hover { transform: scale(1.05); box-shadow: 0 15px 30px rgba(0, 0, 0, 0.15); }

      /* FOOTER */
      .tiq-footer {
        padding: 4rem 2rem; background: #080C14; border-top: 1px solid var(--color-slate-800);
      }
      .tiq-footer-content {
        max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center;
      }
      .tiq-footer-brand { font-weight: 800; font-size: 1.25rem; color: var(--white); }
      .tiq-footer-brand span { color: var(--color-teal); }
      .tiq-footer-links { display: flex; gap: 3rem; }
      .tiq-footer-link { color: var(--color-slate-400); text-decoration: none; font-size: 0.9rem; transition: color 0.2s; }
      .tiq-footer-link:hover { color: var(--color-teal); }
      .tiq-footer-copy { color: var(--color-slate-700); font-size: 0.85rem; margin-top: 2rem; border-top: 1px solid #111; padding-top: 2rem; text-align: center; }

      @media (max-width: 1024px) {
        .tiq-nav { padding: 0 2rem; }
        .tiq-feat-grid { grid-template-columns: repeat(2, 1fr); }
        .tiq-stats-grid { grid-template-columns: repeat(2, 1fr); }
        .tiq-mockup-body { grid-template-columns: 1fr; }
        .tiq-mock-sidebar { display: none; }
      }
      @media (max-width: 768px) {
        .tiq-nav { padding: 0 1.5rem; height: 70px; }
        .tiq-nav-center { display: none; }
        .tiq-h1 { font-size: 2.75rem; }
        .tiq-hero { padding: 6rem 1.5rem 4rem; }
        .tiq-cta-card { padding: 3rem 1.5rem; border-radius: 30px; }
        .tiq-cta-card h2 { font-size: 2.25rem; }
        .tiq-footer-content { flex-direction: column; gap: 2rem; text-align: center; }
        .tiq-footer-links { flex-direction: column; gap: 1rem; }
      }
      @media (max-width: 640px) {
        .tiq-stats-grid { grid-template-columns: 1fr; }
        .tiq-feat-grid { grid-template-columns: 1fr; }
        .tiq-hero-actions { flex-direction: column; gap: 1rem; }
        .tiq-hero-cta, .tiq-hero-outline { width: 100%; justify-content: center; }
      }
    `}</style>

    <nav className="tiq-nav">
      <div className="tiq-logo">
        <div className="tiq-logo-icon">T</div>
        TenantIQ
      </div>
      <div className="tiq-nav-center">
        <button className="tiq-nav-link">Features</button>
        <button className="tiq-nav-link">Pricing</button>
        <button className="tiq-nav-link">Enterprise</button>
        <button className="tiq-nav-link">Resources</button>
      </div>
      <div className="tiq-nav-right">
        <button className="tiq-btn-ghost" onClick={onLogin}>Log in</button>
        <button className="tiq-btn-primary" onClick={onSignup}>Get Started</button>
      </div>
    </nav>

    <section className="tiq-hero">
      <div className="tiq-hero-content">
        <div className="tiq-hero-badge">
          <div className="tiq-badge-dot"></div>
          v2.0 - AI-Driven Document Analysis
        </div>
        <h1 className="tiq-h1">
          The Intelligent Hub for Your <span>Team's Knowledge</span>
        </h1>
        <p className="tiq-hero-sub">
          Stop digging through folders. Upload documents and interact with your data in real-time. TenantIQ provides accurate, cited answers from your own knowledge base.
        </p>
        <div className="tiq-hero-actions">
          <button className="tiq-hero-cta" onClick={onSignup}>Register Your Workspace</button>
          <button className="tiq-hero-outline" onClick={onLogin}>Access Dashboard</button>
        </div>
      </div>

      <div className="tiq-mockup-container">
        <div className="tiq-mockup-wrap">
          <div className="tiq-mockup-bar">
            <div className="tiq-mockup-dots">
              <div className="tiq-mockup-dot" style={{ background: '#FF5F57' }}></div>
              <div className="tiq-mockup-dot" style={{ background: '#FEBC2E' }}></div>
              <div className="tiq-mockup-dot" style={{ background: '#28C840' }}></div>
            </div>
            <div className="tiq-mockup-url">app.tenantiq.ai/workspace/chat</div>
          </div>
          <div className="tiq-mockup-body">
            <div className="tiq-mock-sidebar">
              <div className="tiq-mock-sidebar-label">Navigation</div>
              {[['💬', 'AI Chatbot', true], ['📄', 'Knowledge Base', false], ['👥', 'Team Management', false], ['⚙️', 'Workspace Settings', false]].map(([icon, label, active]) => (
                <div key={label} className={`tiq-mock-item ${active ? 'act' : ''}`}>
                  <span>{icon}</span> {label}
                </div>
              ))}
            </div>
            <div className="tiq-mock-content">
              <div className="tiq-mock-chat">
                <div className="tiq-mock-msg">
                  <div className="tiq-mock-av ai">AI</div>
                  <div className="tiq-mock-bub ai">I've finished indexing the <strong>Lease Agreement</strong> and <strong>Policy Handbook</strong>. I'm ready to answer any questions about them.</div>
                </div>
                <div className="tiq-mock-msg right">
                  <div className="tiq-mock-av u">U</div>
                  <div className="tiq-mock-bub u">What is the notice period for contract termination?</div>
                </div>
                <div className="tiq-mock-msg">
                  <div className="tiq-mock-av ai">AI</div>
                  <div className="tiq-mock-bub ai">According to Section 14.2 of the <strong>Lease Agreement</strong>, the mandatory notice period is <strong>60 days</strong>. This must be submitted in writing.</div>
                </div>
              </div>
              <div className="tiq-mock-input">
                <div className="tiq-mock-input-text">Ask a question about your documents...</div>
                <div className="tiq-mock-send">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section className="tiq-stats-section">
      <div className="tiq-stats-grid">
        {[['250k+', 'Documents Processed'], ['99.9%', 'Uptime Guarantee'], ['15ms', 'Search Latency'], ['2.5k', 'Active Workspaces']].map(([val, label]) => (
          <div className="tiq-stat-card" key={label}>
            <div className="tiq-stat-val">{val}</div>
            <div className="tiq-stat-label">{label}</div>
          </div>
        ))}
      </div>
    </section>

    <section className="tiq-features">
      <div className="tiq-feat-header">
        <h2>Enterprise-Grade Capability</h2>
        <p>TenantIQ combines powerful AI with secure, multi-tenant architecture to deliver the ultimate document platform.</p>
      </div>
      <div className="tiq-feat-grid">
        {[
          ['🧠', 'Instant Intelligence', 'Automatic document chunking and embedding allows you to query complex files in seconds, not hours.'],
          ['🛡️', 'Secure Isolation', 'Bank-grade security with strict tenant isolation. Your data is encrypted and never used for training.'],
          ['🤝', 'Team Collaboration', 'Scalable role-based access control (RBAC). Manage permissions for viewers, editors, and admins seamlessly.'],
          ['⚡', 'Real-time Processing', 'Background workers ensure your documents are indexed and ready without slowing down your computer.'],
          ['📁', 'Multi-format Support', 'Full support for PDF, DOCX, CSV, and Text files. Uniform processing across all your knowledge assets.'],
          ['🌐', 'API Connectivity', 'Connect TenantIQ to your existing stack with our robust API and webhook system.'],
        ].map(([icon, title, desc]) => (
          <div className="tiq-feat-card" key={title}>
            <div className="tiq-feat-icon">{icon}</div>
            <h3 className="tiq-feat-title">{title}</h3>
            <p className="tiq-feat-desc">{desc}</p>
          </div>
        ))}
      </div>
    </section>

    <section className="tiq-cta-section">
      <div className="tiq-cta-card">
        <h2>Ready to upgrade your workflow?</h2>
        <p>Join the future of document management today. Sign up for a free 14-day trial, no credit card required.</p>
        <button className="tiq-cta-btn" onClick={onSignup}>Get Started for Free</button>
      </div>
    </section>

    <footer className="tiq-footer">
      <div className="tiq-footer-content">
        <div className="tiq-footer-brand">Tenant<span>IQ</span></div>
        <div className="tiq-footer-links">
          <a href="#" className="tiq-footer-link">Privacy Policy</a>
          <a href="#" className="tiq-footer-link">Terms of Service</a>
          <a href="#" className="tiq-footer-link">Security</a>
          <a href="#" className="tiq-footer-link">Contact Support</a>
        </div>
      </div>
      <div className="tiq-footer-copy">© {new Date().getFullYear()} TenantIQ Intelligence. All rights reserved.</div>
    </footer>
  </div>
);

export default LandingPage;
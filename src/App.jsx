// src/App.jsx
import React, { useState, useRef, useEffect } from 'react';
import { StoreProvider, useStore } from './data/store';
import { AuthProvider, useAuth } from './data/auth';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import JobDetail from './pages/JobDetail';
import JobSetup from './pages/JobSetup';
import PackageDetail from './pages/PackageDetail';
import TicketEditor from './pages/TicketEditor';
import PackagePreview from './pages/PackagePreview';
import Directory from './pages/Directory';
import Settings from './pages/Settings';

function AppInner() {
  const { state, dispatch } = useStore();
  const { logout } = useAuth();
  const [page, setPage] = useState('dashboard');
  const [params, setParams] = useState({});
  const [showJobSwitcher, setShowJobSwitcher] = useState(false);
  const [showJobMenu, setShowJobMenu] = useState(false);
  const switcherRef = useRef(null);
  const menuRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handle(e) {
      if (switcherRef.current && !switcherRef.current.contains(e.target)) setShowJobSwitcher(false);
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowJobMenu(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  function navigate(newPage, newParams = {}) {
    setPage(newPage);
    setParams(newParams);
    window.scrollTo(0, 0);
  }

  function openJob(jobId) {
    dispatch({ type: 'SET_CURRENT_JOB', id: jobId });
    navigate('job-detail', { jobId });
    setShowJobSwitcher(false);
  }

  const currentJob = state.currentJobId ? state.jobs.find(j => j.id === state.currentJobId) : null;
  const recentJobs = state.recentJobIds.map(id => state.jobs.find(j => j.id === id)).filter(Boolean);
  const isInJob = ['job-detail', 'job-setup', 'package-detail', 'ticket-editor', 'package-preview', 'job-directory'].includes(page);

  const pageTitles = {
    dashboard: 'Dashboard',
    'job-detail': currentJob ? currentJob.num + ' — ' + currentJob.name : 'Job Detail',
    'job-setup': 'Job Setup',
    'package-detail': 'T&M Package',
    'ticket-editor': 'T&M Ticket',
    'package-preview': 'Package Preview',
    directory: 'Directory',
    settings: 'Settings',
    'job-directory': 'Job Directory'
  };

  function renderPage() {
    switch (page) {
      case 'dashboard': return <Dashboard navigate={navigate} />;
      case 'job-detail': return <JobDetail jobId={params.jobId} navigate={navigate} initialView={params.view || null} />;
      case 'job-setup': return <JobSetup jobId={params.jobId} navigate={navigate} />;
      case 'package-detail': return <PackageDetail jobId={params.jobId} pkgId={params.pkgId} navigate={navigate} />;
      case 'ticket-editor': return <TicketEditor jobId={params.jobId} pkgId={params.pkgId} ticketId={params.ticketId} navigate={navigate} />;
      case 'package-preview': return <PackagePreview jobId={params.jobId} pkgId={params.pkgId} navigate={navigate} />;
      case 'directory': return <Directory navigate={navigate} />;
      case 'settings': return <Settings />;
      default: return <Dashboard navigate={navigate} />;
    }
  }

  return (
    <div className="app">
      {/* SIDEBAR */}
      <div className="sidebar">
        <div className="logo">
          <div className="logo-text">Builden</div>
          <div className="logo-sub">T&M Management</div>
        </div>
        <div className="nav">
          <div className={`nav-item ${page === 'dashboard' ? 'active' : ''}`} onClick={() => navigate('dashboard')}>
            <i className="ti ti-layout-dashboard" /> Dashboard
          </div>
          <div className="nav-sep" />
          <div className={`nav-item ${page === 'directory' ? 'active' : ''}`} onClick={() => navigate('directory')}>
            <i className="ti ti-address-book" /> Directory
          </div>
          <div className={`nav-item ${page === 'settings' ? 'active' : ''}`} onClick={() => navigate('settings')}>
            <i className="ti ti-settings" /> Settings
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div className="main">
        <div className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
            <div className="topbar-title">{pageTitles[page] || 'Builden'}</div>

            {/* JOB SWITCHER DROPDOWN */}
            <div ref={switcherRef} style={{ position: 'relative' }}>
              <button className="btn btn-sm" onClick={() => setShowJobSwitcher(v => !v)} style={{ gap: 4 }}>
                <i className="ti ti-briefcase" style={{ fontSize: 14 }} />
                {recentJobs.length > 0 ? 'Jobs' : 'Select job'}
                <i className="ti ti-chevron-down" style={{ fontSize: 11 }} />
              </button>
              {showJobSwitcher && (
                <div style={{ position: 'absolute', left: 0, top: '110%', background: '#fff', border: '1px solid #e8e8e6', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 200, minWidth: 260, overflow: 'hidden' }}>
                  <div style={{ padding: '8px 14px 6px', fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: 0.5 }}>Recent jobs</div>
                  {recentJobs.length === 0 ? (
                    <div style={{ padding: '8px 14px 12px', fontSize: 13, color: '#aaa' }}>No recent jobs</div>
                  ) : recentJobs.map(j => (
                    <div key={j.id} onClick={() => openJob(j.id)}
                      style={{ padding: '9px 14px', fontSize: 13, cursor: 'pointer', display: 'flex', flexDirection: 'column', borderBottom: '1px solid #f2f2f0' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f4f4f2'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <span style={{ fontWeight: 800, fontSize: 14, color: '#185FA5' }}>{j.num}</span>
                      <span style={{ fontSize: 12, color: '#444', marginTop: 1, fontWeight: 600 }}>{j.name}</span>
                      <span style={{ fontSize: 11, color: '#aaa', marginTop: 1 }}>{j.gc}</span>
                    </div>
                  ))}
                  <div style={{ borderTop: '1px solid #e8e8e6', padding: '8px 14px' }}>
                    <div onClick={() => { navigate('dashboard'); setShowJobSwitcher(false); }}
                      style={{ fontSize: 12, color: '#185FA5', fontWeight: 600, cursor: 'pointer' }}>
                      View all jobs →
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* IN-JOB MENU DROPDOWN */}
            {isInJob && currentJob && (
              <div ref={menuRef} style={{ position: 'relative' }}>
                <button className="btn btn-sm btn-primary" onClick={() => setShowJobMenu(v => !v)} style={{ gap: 4 }}>
                  {page === 'job-detail' && params.view === 'packages' ? 'T&M Packages' :
                   page === 'job-detail' && params.view === 'directory' ? 'Directory' :
                   currentJob.num}
                  <i className="ti ti-chevron-down" style={{ fontSize: 11 }} />
                </button>
                {showJobMenu && (
                  <div style={{ position: 'absolute', left: 0, top: '110%', background: '#fff', border: '1px solid #e8e8e6', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 200, minWidth: 200, overflow: 'hidden' }}>
                    <div style={{ padding: '8px 14px 6px', fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: 0.5 }}>{currentJob.name}</div>
                    <div onClick={() => { navigate('job-detail', { jobId: currentJob.id, view: 'packages' }); setShowJobMenu(false); }}
                      style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, borderTop: '1px solid #f2f2f0' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f4f4f2'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <i className="ti ti-folders" style={{ color: '#185FA5' }} /> T&M Packages
                    </div>
                    <div onClick={() => { navigate('job-detail', { jobId: currentJob.id, view: 'directory' }); setShowJobMenu(false); }}
                      style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f4f4f2'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <i className="ti ti-address-book" style={{ color: '#185FA5' }} /> Directory
                    </div>
                    <div style={{ borderTop: '1px solid #e8e8e6' }}>
                      <div onClick={() => { navigate('job-setup', { jobId: currentJob.id }); setShowJobMenu(false); }}
                        style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f4f4f2'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <i className="ti ti-settings" style={{ color: '#888' }} /> Job Setup
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#EBF3FB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#185FA5', flexShrink: 0, cursor: 'pointer' }}
                onClick={() => { if (window.confirm('Log out?')) logout(); }}
                title="Log out">JS</div>
            </div>
          </div>
        </div>

        <div className="content">{renderPage()}</div>
      </div>
    </div>
  );
}

function AuthGate() {
  const { user, userDoc, loading } = useAuth();
  const [authView, setAuthView] = useState('login'); // 'login' | 'signup'

  // While Firebase checks if someone's already logged in (e.g. on page refresh),
  // show nothing rather than flashing the login screen first.
  if (loading) return null;

  if (!user) {
    return authView === 'signup'
      ? <Signup goToLogin={() => setAuthView('login')} />
      : <Login goToSignup={() => setAuthView('signup')} />;
  }

  // Logged in via Firebase Auth, but we're still waiting on their company/role lookup
  // to finish (or, in rare cases, it's missing entirely — e.g. an account that never
  // got linked to a company). Either way, don't show the app without it.
  if (!userDoc) return null;

  return (
    <StoreProvider companyId={userDoc.companyId}>
      <AppInner />
    </StoreProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}

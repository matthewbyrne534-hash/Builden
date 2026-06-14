// src/App.jsx
import React, { useState } from 'react';
import { StoreProvider } from './data/store';
import Dashboard from './pages/Dashboard';
import Jobs from './pages/Jobs';
import JobDetail from './pages/JobDetail';
import JobSetup from './pages/JobSetup';
import PackageDetail from './pages/PackageDetail';
import TicketEditor from './pages/TicketEditor';
import PackagePreview from './pages/PackagePreview';
import Directory from './pages/Directory';

function App() {
  const [page, setPage] = useState('dashboard');
  const [params, setParams] = useState({});

  function navigate(newPage, newParams = {}) {
    setPage(newPage);
    setParams(newParams);
    window.scrollTo(0, 0);
  }

  const pageTitles = {
    dashboard: 'Dashboard',
    jobs: 'Jobs',
    'job-detail': 'Job Detail',
    'job-setup': 'Job Setup',
    'package-detail': 'T&M Package',
    'ticket-editor': 'T&M Ticket',
    'package-preview': 'Package Preview',
    directory: 'Directory'
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard' },
    { id: 'jobs', label: 'Jobs', icon: 'building' },
    { id: 'directory', label: 'Directory', icon: 'address-book' }
  ];

  const activeNav = ['job-detail', 'job-setup', 'package-detail', 'ticket-editor', 'package-preview'].includes(page) ? 'jobs' : page;

  function renderPage() {
    switch (page) {
      case 'dashboard': return <Dashboard navigate={navigate} />;
      case 'jobs': return <Jobs navigate={navigate} />;
      case 'job-detail': return <JobDetail jobId={params.jobId} navigate={navigate} />;
      case 'job-setup': return <JobSetup jobId={params.jobId} navigate={navigate} />;
      case 'package-detail': return <PackageDetail jobId={params.jobId} pkgId={params.pkgId} navigate={navigate} />;
      case 'ticket-editor': return <TicketEditor jobId={params.jobId} pkgId={params.pkgId} ticketId={params.ticketId} navigate={navigate} />;
      case 'package-preview': return <PackagePreview jobId={params.jobId} pkgId={params.pkgId} navigate={navigate} />;
      case 'directory': return <Directory navigate={navigate} />;
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
          {navItems.map(item => (
            <div
              key={item.id}
              className={`nav-item ${activeNav === item.id ? 'active' : ''}`}
              onClick={() => navigate(item.id)}
            >
              <i className={`ti ti-${item.icon}`} />
              {item.label}
            </div>
          ))}
          <div className="nav-sep" />
          <div className="nav-item" onClick={() => navigate('jobs')} style={{ fontSize: 12, color: '#aaa', cursor: 'default', paddingLeft: 10 }}>
            <i className="ti ti-settings" /> Settings
            <span style={{ fontSize: 10, marginLeft: 4, background: '#f0f0ee', borderRadius: 4, padding: '1px 5px' }}>soon</span>
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div className="main">
        <div className="topbar">
          <div className="topbar-title">{pageTitles[page] || 'Builden'}</div>
          <div className="topbar-right">
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#EBF3FB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#185FA5', cursor: 'default' }}>
              JS
            </div>
          </div>
        </div>
        <div className="content">
          {renderPage()}
        </div>
      </div>
    </div>
  );
}

export default function Root() {
  return (
    <StoreProvider>
      <App />
    </StoreProvider>
  );
}

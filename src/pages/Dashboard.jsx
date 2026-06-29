// src/pages/Dashboard.jsx
import React, { useState } from 'react';
import { useStore } from '../data/store';
import { fmt, calcPackageTotals } from '../utils/helpers';
import { Modal, FormGroup, Input, Tabs } from '../components/UI';
import { genId } from '../utils/helpers';
import { useAuth } from '../data/auth';

export default function Dashboard({ navigate }) {
  const { state, dispatch } = useStore();
  const { user, userDoc } = useAuth();
  const isAdmin = userDoc?.role === 'admin';

  // Admins see every job in the company. Anyone else (PMs, Foremen) only sees jobs
  // they've actually been invited onto and accepted — matched by their own uid showing
  // up in that job's members list (set when they accept their invite).
  const visibleJobs = isAdmin
    ? state.jobs
    : state.jobs.filter(j => (j.members || []).some(m => m.uid === user?.uid));

  const { jobs } = { jobs: visibleJobs };
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState('active'); // 'active' | 'completed' | 'archived'
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ name: '', num: '', address: '', city: '', state: '', zip: '', gc: '', owner: '', ae: '' });

  // Jobs created before this feature existed have no `status` field at all — treat
  // that as 'active' so nothing old silently disappears from the list.
  const activeJobs = jobs.filter(j => (j.status || 'active') === 'active');
  const completedJobs = jobs.filter(j => j.status === 'completed');
  const archivedJobs = jobs.filter(j => j.status === 'archived');

  const tabJobs = statusTab === 'active' ? activeJobs : statusTab === 'completed' ? completedJobs : archivedJobs;

  // Summary metrics — only counted across ACTIVE jobs, so a pile of old completed/archived
  // jobs doesn't distort what's actually happening right now.
  let totalOpenVal = 0, totalOpenPkgs = 0;
  let totalPendingVal = 0, totalPendingPkgs = 0;
  let totalExecutedVal = 0, totalExecutedPkgs = 0;

  activeJobs.forEach(j => {
    j.packages.forEach(p => {
      const tots = calcPackageTotals(p);
      const status = p.pkgStatus || 'open';
      if (status === 'open') { totalOpenVal += tots.grand; totalOpenPkgs++; }
      if (status === 'pending') { totalPendingVal += tots.grand; totalPendingPkgs++; }
      if (status === 'executed') { totalExecutedVal += tots.executed; totalExecutedPkgs++; }
    });
  });

  const filtered = tabJobs.filter(j =>
    (j.name + j.num + j.address + j.city + j.gc).toLowerCase().includes(search.toLowerCase())
  );

  function createJob() {
    if (!form.name || !form.num) return alert('Job name and number are required.');
    const job = {
      id: genId(), name: form.name, num: form.num, address: form.address, city: form.city,
      state: form.state, zip: form.zip, gc: form.gc, owner: form.owner, ae: form.ae,
      status: 'active',
      removedRosterIds: [], classificationRates: [], members: [], packages: []
    };
    dispatch({ type: 'ADD_JOB', job });
    dispatch({ type: 'SET_CURRENT_JOB', id: job.id });
    setShowNew(false);
    setForm({ name: '', num: '', address: '', city: '', state: '', zip: '', gc: '', owner: '', ae: '' });
    navigate('job-setup', { jobId: job.id });
  }

  function openJob(jobId) {
    dispatch({ type: 'SET_CURRENT_JOB', id: jobId });
    navigate('job-detail', { jobId });
  }

  return (
    <div>
      {/* SUMMARY METRICS */}
      <div className="metrics">
        <div className="metric">
          <div className="metric-label">Active Jobs</div>
          <div className="metric-value">{activeJobs.length}</div>
          <div className="metric-sub">{activeJobs.reduce((s, j) => s + j.packages.length, 0)} total packages</div>
        </div>
        <div className="metric">
          <div className="metric-label">Open / In Progress</div>
          <div className="metric-value">{fmt(totalOpenVal)}</div>
          <div className="metric-sub" style={{ color: '#185FA5' }}>{totalOpenPkgs} pkg{totalOpenPkgs !== 1 ? 's' : ''} open</div>
        </div>
        <div className="metric">
          <div className="metric-label">Pending GC Approval</div>
          <div className="metric-value">{fmt(totalPendingVal)}</div>
          <div className="metric-sub" style={{ color: '#8A5000' }}>{totalPendingPkgs} pkg{totalPendingPkgs !== 1 ? 's' : ''} submitted</div>
        </div>
        <div className="metric">
          <div className="metric-label">Executed Value</div>
          <div className="metric-value">{fmt(totalExecutedVal)}</div>
          <div className="metric-sub" style={{ color: '#2A6008' }}>{totalExecutedPkgs} pkg{totalExecutedPkgs !== 1 ? 's' : ''} approved</div>
        </div>
      </div>

      {/* JOB TABLE */}
      <div className="card">
        <div className="card-header">
          <div className="card-header-left">
            <div className="card-title">Jobs</div>
          </div>
          <div className="card-actions">
            <div className="search-wrap" style={{ marginBottom: 0 }}>
              <i className="ti ti-search search-icon" />
              <input className="search-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search jobs..." style={{ width: 200 }} />
            </div>
            {isAdmin && (
              <button className="btn btn-primary btn-sm" onClick={() => setShowNew(true)}>
                <i className="ti ti-plus" /> New job
              </button>
            )}
          </div>
        </div>

        {isAdmin ? (
          <Tabs tabs={[
            { id: 'active', label: `Active (${activeJobs.length})` },
            { id: 'completed', label: `Completed (${completedJobs.length})` },
            { id: 'archived', label: `Archived (${archivedJobs.length})` }
          ]} active={statusTab} onChange={setStatusTab} />
        ) : null}

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#fafaf8' }}>
                <th style={{ textAlign: 'left', padding: '9px 12px', borderBottom: '2px solid #e8e8e6', fontSize: 11, fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: '0.4px', whiteSpace: 'nowrap' }}>Job Name</th>
                <th style={{ textAlign: 'left', padding: '9px 12px', borderBottom: '2px solid #e8e8e6', fontSize: 11, fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: '0.4px', whiteSpace: 'nowrap' }}>Job #</th>
                <th style={{ textAlign: 'left', padding: '9px 12px', borderBottom: '2px solid #e8e8e6', fontSize: 11, fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: '0.4px', whiteSpace: 'nowrap' }}>Address</th>
                <th style={{ textAlign: 'left', padding: '9px 12px', borderBottom: '2px solid #e8e8e6', fontSize: 11, fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: '0.4px' }}>City</th>
                <th style={{ textAlign: 'left', padding: '9px 12px', borderBottom: '2px solid #e8e8e6', fontSize: 11, fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: '0.4px' }}>State</th>
                <th style={{ textAlign: 'left', padding: '9px 12px', borderBottom: '2px solid #e8e8e6', fontSize: 11, fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: '0.4px' }}>ZIP</th>
                <th style={{ textAlign: 'right', padding: '9px 12px', borderBottom: '2px solid #e8e8e6', fontSize: 11, fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: '0.4px', whiteSpace: 'nowrap' }}>Open</th>
                <th style={{ textAlign: 'right', padding: '9px 12px', borderBottom: '2px solid #e8e8e6', fontSize: 11, fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: '0.4px', whiteSpace: 'nowrap' }}>Pending GC</th>
                <th style={{ textAlign: 'right', padding: '9px 12px', borderBottom: '2px solid #e8e8e6', fontSize: 11, fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Executed</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9} style={{ padding: '24px 12px', textAlign: 'center', color: '#aaa', fontStyle: 'italic' }}>No {statusTab} jobs found.</td></tr>
              ) : filtered.map(j => {
                const openPkgs = j.packages.filter(p => (p.pkgStatus || 'open') === 'open');
                const openVal = openPkgs.reduce((s, p) => s + calcPackageTotals(p).grand, 0);
                const pendingPkgs = j.packages.filter(p => (p.pkgStatus || 'open') === 'pending');
                const pendingVal = pendingPkgs.reduce((s, p) => s + calcPackageTotals(p).grand, 0);
                const executedPkgs = j.packages.filter(p => (p.pkgStatus || 'open') === 'executed');
                const executedVal = j.packages.reduce((s, p) => s + calcPackageTotals(p).executed, 0);
                return (
                  <tr key={j.id} style={{ borderBottom: '1px solid #f2f2f0', cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fafaf8'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    onClick={() => openJob(j.id)}>
                    <td style={{ padding: '10px 12px', fontWeight: 700, color: '#185FA5', whiteSpace: 'nowrap' }}>{j.name}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 700, color: '#185FA5' }}>{j.num}</td>
                    <td style={{ padding: '10px 12px', color: '#555', whiteSpace: 'nowrap' }}>{j.address}</td>
                    <td style={{ padding: '10px 12px', color: '#555' }}>{j.city}</td>
                    <td style={{ padding: '10px 12px', color: '#555' }}>{j.state}</td>
                    <td style={{ padding: '10px 12px', color: '#555' }}>{j.zip}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                      <div style={{ fontWeight: 600, color: '#444' }}>{fmt(openVal)}</div>
                      <div style={{ fontSize: 11, color: '#185FA5', fontWeight: 600 }}>{openPkgs.length} pkg{openPkgs.length !== 1 ? 's' : ''}</div>
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                      <div style={{ fontWeight: 600, color: '#8A5000' }}>{fmt(pendingVal)}</div>
                      <div style={{ fontSize: 11, color: '#8A5000', fontWeight: 600 }}>{pendingPkgs.length} pkg{pendingPkgs.length !== 1 ? 's' : ''}</div>
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                      <div style={{ fontWeight: 600, color: '#2A6008' }}>{fmt(executedVal)}</div>
                      <div style={{ fontSize: 11, color: '#2A6008', fontWeight: 600 }}>{executedPkgs.length} pkg{executedPkgs.length !== 1 ? 's' : ''}</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* NEW JOB MODAL */}
      <Modal open={showNew} onClose={() => setShowNew(false)} title="New Job" wide
        footer={<><button className="btn" onClick={() => setShowNew(false)}>Cancel</button><button className="btn btn-primary" onClick={createJob}><i className="ti ti-plus" /> Create job</button></>}>
        <div className="form-grid form-grid-2">
          <FormGroup label="Job name *"><Input value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="e.g. Riverside Trade School" /></FormGroup>
          <FormGroup label="Job number *"><Input value={form.num} onChange={v => setForm(f => ({ ...f, num: v }))} placeholder="e.g. 261047" /></FormGroup>
          <FormGroup label="Address"><Input value={form.address} onChange={v => setForm(f => ({ ...f, address: v }))} placeholder="Street address" /></FormGroup>
          <FormGroup label="City"><Input value={form.city} onChange={v => setForm(f => ({ ...f, city: v }))} placeholder="City" /></FormGroup>
          <FormGroup label="State"><Input value={form.state} onChange={v => setForm(f => ({ ...f, state: v }))} placeholder="NY" /></FormGroup>
          <FormGroup label="ZIP"><Input value={form.zip} onChange={v => setForm(f => ({ ...f, zip: v }))} placeholder="12205" /></FormGroup>
          <FormGroup label="General contractor"><Input value={form.gc} onChange={v => setForm(f => ({ ...f, gc: v }))} /></FormGroup>
          <FormGroup label="Owner"><Input value={form.owner} onChange={v => setForm(f => ({ ...f, owner: v }))} /></FormGroup>
          <FormGroup label="Architect / engineer" span="2"><Input value={form.ae} onChange={v => setForm(f => ({ ...f, ae: v }))} /></FormGroup>
        </div>
      </Modal>
    </div>
  );
}

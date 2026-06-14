// src/pages/Dashboard.jsx
import React from 'react';
import { useStore } from '../data/store';
import { fmt, calcPackageTotals } from '../utils/helpers';
import { EmptyState } from '../components/UI';

export default function Dashboard({ navigate }) {
  const { state } = useStore();
  const { jobs } = state;

  let totalExecuted = 0, totalPending = 0, totalOpen = 0;
  jobs.forEach(j => {
    j.packages.forEach(p => {
      const tots = calcPackageTotals(p, j);
      totalExecuted += tots.executed;
      if (p.tickets.some(t => t.status === 'submitted')) totalPending += tots.grand;
      if (p.tickets.some(t => ['draft', 'pending-sig'].includes(t.status))) totalOpen++;
    });
  });

  return (
    <div>
      <div className="metrics">
        <div className="metric">
          <div className="metric-label">Active Jobs</div>
          <div className="metric-value">{jobs.filter(j => !j.voided).length}</div>
          <div className="metric-sub">{totalOpen > 0 ? `${totalOpen} open package${totalOpen !== 1 ? 's' : ''}` : 'All packages closed'}</div>
        </div>
        <div className="metric">
          <div className="metric-label">Open Packages</div>
          <div className="metric-value">{totalOpen}</div>
          <div className="metric-sub metric-sub blue">In progress</div>
        </div>
        <div className="metric">
          <div className="metric-label">Pending GC Approval</div>
          <div className="metric-value">{fmt(totalPending)}</div>
          <div className="metric-sub">Submitted packages</div>
        </div>
        <div className="metric">
          <div className="metric-label">Executed Value</div>
          <div className="metric-value">{fmt(totalExecuted)}</div>
          <div className="metric-sub">Fully signed & approved</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-header-left">
            <div className="card-title">Active Jobs</div>
          </div>
          <div className="card-actions">
            <button className="btn btn-primary btn-sm" onClick={() => navigate('new-job')}>
              <i className="ti ti-plus" /> New job
            </button>
          </div>
        </div>

        {jobs.length === 0 ? (
          <EmptyState icon="building" message="No jobs yet. Create your first job to get started." />
        ) : (
          jobs.map(j => {
            const executed = j.packages.reduce((s, p) => s + calcPackageTotals(p, j).executed, 0);
            const inProgress = j.packages.filter(p => p.tickets.some(t => ['draft', 'pending-sig'].includes(t.status)));
            const pending = j.packages.filter(p => p.tickets.some(t => t.status === 'submitted'));
            const approved = j.packages.filter(p => p.tickets.length > 0 && p.tickets.every(t => t.status === 'approved' || t.status === 'signed'));
            return (
              <div key={j.id} className="list-row clickable" onClick={() => navigate('job-detail', { jobId: j.id })}>
                <div className="row-body">
                  <div className="row-title">{j.num} — {j.desc}</div>
                  <div className="row-sub">{j.gc}</div>
                </div>
                <div style={{ display: 'flex', gap: 16, marginRight: 12 }}>
                  <div className="row-right">
                    <div className="row-amount" style={{ color: '#666' }}>{inProgress.length} open</div>
                    <div className="row-meta blue" style={{ color: '#185FA5' }}>{inProgress.length} pkg{inProgress.length !== 1 ? 's' : ''}</div>
                  </div>
                  <div className="row-right">
                    <div className="row-amount" style={{ color: '#8A5000' }}>{fmt(j.packages.filter(p => p.tickets.some(t => t.status === 'submitted')).reduce((s, p) => s + calcPackageTotals(p, j).grand, 0))}</div>
                    <div className="row-meta" style={{ color: '#8A5000' }}>{pending.length} pending GC</div>
                  </div>
                  <div className="row-right">
                    <div className="row-amount" style={{ color: '#2A6008' }}>{fmt(executed)}</div>
                    <div className="row-meta" style={{ color: '#2A6008' }}>{approved.length} executed</div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

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
        </div>

        {jobs.length === 0 ? (
          <EmptyState icon="building" message="No jobs yet. Create your first job to get started." />
        ) : (
          jobs.map(j => {
            const openPkgs = j.packages.filter(p => p.tickets.some(t => ['draft', 'pending-sig'].includes(t.status)));
            const openVal = openPkgs.reduce((s, p) => s + calcPackageTotals(p, j).grand, 0);
            const pendingPkgs = j.packages.filter(p => p.tickets.some(t => t.status === 'submitted'));
            const pendingVal = pendingPkgs.reduce((s, p) => s + calcPackageTotals(p, j).grand, 0);
            const executedPkgs = j.packages.filter(p => p.tickets.length > 0 && p.tickets.every(t => ['signed', 'approved'].includes(t.status)));
            const executedVal = j.packages.reduce((s, p) => s + calcPackageTotals(p, j).executed, 0);
            return (
              <div key={j.id} className="list-row clickable" onClick={() => navigate('job-detail', { jobId: j.id })}>
                <div className="row-body">
                  <div className="row-title">{j.num} — {j.desc}</div>
                  <div className="row-sub">{j.gc}</div>
                </div>
                <div style={{ display: 'flex', gap: 20, marginRight: 12 }}>
                  <div className="row-right">
                    <div className="row-amount" style={{ color: '#666' }}>{fmt(openVal)}</div>
                    <div className="row-meta" style={{ color: '#185FA5' }}>{openPkgs.length} pkg{openPkgs.length !== 1 ? 's' : ''} open</div>
                  </div>
                  <div className="row-right">
                    <div className="row-amount" style={{ color: '#8A5000' }}>{fmt(pendingVal)}</div>
                    <div className="row-meta" style={{ color: '#8A5000' }}>{pendingPkgs.length} pkg{pendingPkgs.length !== 1 ? 's' : ''} pending GC</div>
                  </div>
                  <div className="row-right">
                    <div className="row-amount" style={{ color: '#2A6008' }}>{fmt(executedVal)}</div>
                    <div className="row-meta" style={{ color: '#2A6008' }}>{executedPkgs.length} pkg{executedPkgs.length !== 1 ? 's' : ''} executed</div>
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

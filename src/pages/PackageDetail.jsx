// src/pages/PackageDetail.jsx
import React, { useState } from 'react';
import { useStore } from '../data/store';
import { genId, fmt, calcPackageTotals, calcTicketTotals, ticketStatusInfo, pkgStatusInfo } from '../utils/helpers';
import { Breadcrumb, Badge, Notice, EmptyState, ConfirmModal } from '../components/UI';

export default function PackageDetail({ jobId, pkgId, navigate }) {
  const { state, dispatch } = useStore();
  const job = state.jobs.find(j => j.id === jobId);
  const pkg = job?.packages.find(p => p.id === pkgId);
  const [confirmDelete, setConfirmDelete] = useState(null);

  if (!job || !pkg) return <div className="card"><p style={{ color: '#999' }}>Package not found.</p></div>;

  const tots = calcPackageTotals(pkg, job);
  const signedCount = pkg.tickets.filter(t => t.status === 'signed' || t.status === 'approved').length;
  const pendingCount = pkg.tickets.filter(t => t.status === 'pending-sig').length;
  const draftCount = pkg.tickets.filter(t => t.status === 'draft').length;
  const st = pkgStatusInfo(pkg);

  function addTicket() {
    const seq = pkg.tickets.length + 1;
    const lastTicket = pkg.tickets[pkg.tickets.length - 1];
    const numBase = pkg.numSystem || 'TM-{seq}';
    const pkgSeq = parseInt((pkg.num.match(/\d+$/) || [1])[0]);
    const ticketNum = pkg.num + '.' + seq;
    const newTicket = {
      id: genId(),
      num: ticketNum,
      date: new Date().toISOString().substr(0, 10),
      desc: lastTicket ? lastTicket.desc : '',
      labor: [],
      materials: [],
      vendors: [],
      photos: [],
      foremanId: '',
      foremanName: '',
      superId: '',
      superName: '',
      status: 'draft'
    };
    dispatch({ type: 'ADD_TICKET', jobId: job.id, pkgId: pkg.id, ticket: newTicket });
    navigate('ticket-editor', { jobId: job.id, pkgId: pkg.id, ticketId: newTicket.id });
  }

  function deleteTicket(ticket) {
    if (ticket.status !== 'draft') {
      alert('Cannot delete a signed or submitted ticket. Use void instead.');
      return;
    }
    setConfirmDelete(ticket);
  }

  function submitPackage() {
    const unsignedTickets = pkg.tickets.filter(t => t.status === 'draft' || t.status === 'pending-sig');
    if (unsignedTickets.length > 0) {
      alert(`${unsignedTickets.length} ticket(s) are not yet signed. All tickets must be signed before submitting to GC.`);
      return;
    }
    pkg.tickets.forEach(t => {
      dispatch({ type: 'UPDATE_TICKET', jobId: job.id, pkgId: pkg.id, ticketId: t.id, data: { status: 'submitted' } });
    });
    alert('Package submitted to GC. The compiled PDF package is ready to send.');
  }

  function markApproved() {
    const amount = prompt('Enter the GC-approved amount (numbers only, no $):');
    if (!amount) return;
    pkg.tickets.forEach(t => {
      dispatch({ type: 'UPDATE_TICKET', jobId: job.id, pkgId: pkg.id, ticketId: t.id, data: { status: 'approved' } });
    });
    dispatch({ type: 'UPDATE_PACKAGE', jobId: job.id, pkgId: pkg.id, data: { approvedAmount: parseFloat(amount) || 0 } });
    alert('Package marked as GC approved. Approved amount: $' + parseFloat(amount).toFixed(2));
  }

  return (
    <div>
      <Breadcrumb items={[
        { label: 'Jobs', onClick: () => navigate('jobs') },
        { label: job.num, onClick: () => navigate('job-detail', { jobId: job.id }) },
        { label: pkg.num + ' — ' + pkg.title }
      ]} />

      <div className="stats-row">
        <div className="stat-item">
          <div className="stat-label">Total Value</div>
          <div className="stat-val">{fmt(tots.grand)}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Executed</div>
          <div className="stat-val" style={{ color: '#2A6008' }}>{fmt(tots.executed)}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Tickets</div>
          <div className="stat-val">{pkg.tickets.length}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Status</div>
          <div className="stat-val" style={{ fontSize: 13, paddingTop: 4 }}><Badge label={st.label} cls={st.cls} /></div>
        </div>
      </div>

      {pkg.approvedAmount && (
        <Notice type="success">GC approved amount: {fmt(pkg.approvedAmount)}{pkg.approvedAmount !== tots.grand ? ` (submitted: ${fmt(tots.grand)})` : ''}</Notice>
      )}

      <div className="card">
        <div className="card-header">
          <div className="card-header-left">
            <div className="card-title">{pkg.num} — {pkg.title}</div>
            <div className="card-subtitle">{pkg.authType}{pkg.authRef ? ' · ' + pkg.authRef : ''}{pkg.authFileName ? ' · 📎 ' + pkg.authFileName : ''}</div>
          </div>
          <div className="card-actions">
            <button className="btn btn-sm" onClick={() => navigate('package-preview', { jobId: job.id, pkgId: pkg.id })}><i className="ti ti-eye" /> Preview</button>
            {signedCount === pkg.tickets.length && pkg.tickets.length > 0 && (
              <button className="btn btn-sm" onClick={submitPackage}><i className="ti ti-send" /> Submit to GC</button>
            )}
            {pkg.tickets.some(t => t.status === 'submitted') && (
              <button className="btn btn-primary btn-sm" onClick={markApproved}><i className="ti ti-check" /> Mark approved</button>
            )}
            <button className="btn btn-primary btn-sm" onClick={addTicket}><i className="ti ti-plus" /> Add ticket</button>
          </div>
        </div>

        {pkg.tickets.length === 0 ? (
          <EmptyState icon="file-plus" message="No tickets yet. Add your first daily ticket." action={<button className="btn btn-primary btn-sm" onClick={addTicket}><i className="ti ti-plus" /> Add ticket</button>} />
        ) : (
          pkg.tickets.map(t => {
            const ttots = calcTicketTotals(t, job);
            const tst = ticketStatusInfo(t.status);
            return (
              <div key={t.id} className="list-row">
                <div className="row-icon" style={{ background: '#E8F5DA', color: '#2A6008', fontSize: 10 }}>{t.num}</div>
                <div className="row-body clickable" onClick={() => navigate('ticket-editor', { jobId: job.id, pkgId: pkg.id, ticketId: t.id })}>
                  <div className="row-title">{t.desc || '(no description)'}</div>
                  <div className="row-sub">{t.date} · {t.labor.length} labor · {t.materials.length} material · {t.photos.length} photo{t.photos.length !== 1 ? 's' : ''}</div>
                </div>
                <div className="row-right" style={{ marginRight: 8 }}>
                  <div className="row-amount">{fmt(ttots.grand)}</div>
                  <div className="row-meta">{t.foremanName || 'No foreman'}</div>
                </div>
                <Badge label={tst.label} cls={tst.cls} />
                <div className="row-actions">
                  <button className="btn btn-icon btn-sm btn-danger" onClick={() => deleteTicket(t)}><i className="ti ti-trash" /></button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <ConfirmModal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Delete ticket"
        message={`Delete ticket ${confirmDelete?.num}? This cannot be undone.`} danger
        onConfirm={() => { dispatch({ type: 'DELETE_TICKET', jobId: job.id, pkgId: pkg.id, ticketId: confirmDelete.id }); setConfirmDelete(null); }} />
    </div>
  );
}

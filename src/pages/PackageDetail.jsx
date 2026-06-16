// src/pages/PackageDetail.jsx
import React, { useState } from 'react';
import { useStore } from '../data/store';
import { genId, fmt, calcPackageTotalsWithOhp } from '../utils/helpers';
import { Breadcrumb, Badge, Notice, EmptyState, ConfirmModal, Modal, FormGroup, Input } from '../components/UI';

function ticketStatusInfo(status) {
  const map = {
    draft: { label: 'Draft', cls: 'badge-gray' },
    'pending-sig': { label: 'Awaiting sig', cls: 'badge-warning' },
    signed: { label: 'Signed', cls: 'badge-success' },
    submitted: { label: 'Submitted', cls: 'badge-info' },
    approved: { label: 'Approved', cls: 'badge-success' },
    void: { label: 'Void', cls: 'badge-red' }
  };
  return map[status] || { label: status, cls: 'badge-gray' };
}

export default function PackageDetail({ jobId, pkgId, navigate }) {
  const { state, dispatch } = useStore();
  const job = state.jobs.find(j => j.id === jobId);
  const pkg = job?.packages.find(p => p.id === pkgId);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [showPrep, setShowPrep] = useState(false);
  const [prepForm, setPrepForm] = useState({
    laborOhp: pkg?.prepSettings?.laborOhp || 10,
    matOhp: pkg?.prepSettings?.matOhp || 15,
    vendorMarkup: pkg?.prepSettings?.vendorMarkup || 2.5
  });

  if (!job || !pkg) return <div className="card"><p style={{ color: '#999' }}>Package not found.</p></div>;

  const prepSettings = pkg.prepSettings || null;
  const tots = calcPackageTotalsWithOhp(pkg, prepSettings);
  const executed = pkg.tickets.filter(t => ['signed', 'submitted', 'approved'].includes(t.status))
    .reduce((s, t) => {
      let base = 0;
      (t.labor || []).forEach(r => { base += (r.reg||0)*(r.regRate||0) + (r.ot||0)*(r.otRate||0) + (r.dt||0)*(r.dtRate||0); });
      (t.materials || []).forEach(r => { base += (r.qty||0)*(r.unitPrice||r.rate||0); });
      (t.vendors || []).forEach(r => { base += (r.amount||0); });
      return s + base;
    }, 0);

  // Labor hours summary by classification for prep modal
  const laborByClass = {};
  pkg.tickets.forEach(t => {
    t.labor.forEach(r => {
      const k = r.className || r.classId;
      if (!laborByClass[k]) laborByClass[k] = { name: r.className, reg: 0, ot: 0, dt: 0, regRate: r.regRate || 0, otRate: r.otRate || 0, dtRate: r.dtRate || 0 };
      laborByClass[k].reg += r.reg || 0;
      laborByClass[k].ot += r.ot || 0;
      laborByClass[k].dt += r.dt || 0;
    });
  });

  // Materials summary for prep modal
  const matSummary = {};
  pkg.tickets.forEach(t => {
    (t.materials || []).forEach(r => {
      const k = r.desc + '|' + r.unit;
      if (!matSummary[k]) matSummary[k] = { desc: r.desc, unit: r.unit, qty: 0, unitPrice: r.unitPrice || r.rate || 0 };
      matSummary[k].qty += r.qty || 0;
    });
  });

  function addTicket() {
    const seq = pkg.tickets.length + 1;
    const last = pkg.tickets[pkg.tickets.length - 1];
    const ticket = {
      id: genId(), num: pkg.num + '.' + seq,
      date: new Date().toISOString().substr(0, 10),
      desc: last ? last.desc : '',
      labor: [], materials: [], vendors: [], photos: [],
      foremanId: '', foremanName: '', superId: '', superName: '',
      status: 'draft'
    };
    dispatch({ type: 'ADD_TICKET', jobId: job.id, pkgId: pkg.id, ticket });
    navigate('ticket-editor', { jobId: job.id, pkgId: pkg.id, ticketId: ticket.id });
  }

  function deleteTicket(ticket) {
    if (ticket.status !== 'draft') { alert('Cannot delete a signed or submitted ticket.'); return; }
    setConfirmDelete(ticket);
  }

  function savePrep() {
    dispatch({ type: 'UPDATE_PKG', jobId: job.id, pkgId: pkg.id, data: { prepSettings: { laborOhp: parseFloat(prepForm.laborOhp) || 0, matOhp: parseFloat(prepForm.matOhp) || 0, vendorMarkup: parseFloat(prepForm.vendorMarkup) || 0 } } });
    setShowPrep(false);
  }

  function setPkgStatus(status) {
    dispatch({ type: 'UPDATE_PKG', jobId: job.id, pkgId: pkg.id, data: { pkgStatus: status } });
  }

  const prepPreview = calcPackageTotalsWithOhp(pkg, {
    laborOhp: parseFloat(prepForm.laborOhp) || 0,
    matOhp: parseFloat(prepForm.matOhp) || 0,
    vendorMarkup: parseFloat(prepForm.vendorMarkup) || 0
  });

  return (
    <div>
      <Breadcrumb items={[
        { label: 'Dashboard', onClick: () => navigate('dashboard') },
        { label: job.num, onClick: () => navigate('job-detail', { jobId: job.id, view: 'packages' }) },
        { label: pkg.num + ' - ' + pkg.title }
      ]} />

      <div className="stats-row">
        <div className="stat-item">
          <div className="stat-label">Package value</div>
          <div className="stat-val">{prepSettings ? fmt(tots.grand) : '—'}</div>
          <div style={{ fontSize: 11, color: prepSettings ? '#185FA5' : '#aaa', marginTop: 3, fontWeight: 600 }}>
            {prepSettings ? 'Rates & OH&P applied' : 'Pending prep'}
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Executed</div>
          <div className="stat-val" style={{ color: '#2A6008' }}>{fmt(executed)}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Tickets</div>
          <div className="stat-val">{pkg.tickets.length}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Package status</div>
          <div style={{ marginTop: 6 }}>
            <select className="form-input" value={pkg.pkgStatus || 'open'} onChange={e => setPkgStatus(e.target.value)} style={{ fontSize: 12 }}>
              <option value="open">Open / In Progress</option>
              <option value="pending">Pending GC Approval</option>
              <option value="executed">Executed</option>
            </select>
          </div>
        </div>
      </div>

      {pkg.approvedAmount && <Notice type="success">GC approved: {fmt(pkg.approvedAmount)}</Notice>}
      {!prepSettings && pkg.tickets.some(t => t.status === 'signed') && (
        <Notice type="warn">All tickets signed. <strong>Prepare the package</strong> to apply rates and OH&P before generating the PDF.</Notice>
      )}

      <div className="card">
        <div className="card-header">
          <div className="card-header-left">
            <div className="card-title">{pkg.num} - {pkg.title}</div>
            <div className="card-subtitle">{pkg.authType}{pkg.authRef ? ' · ' + pkg.authRef : ''}{pkg.authFileName ? ' · 📎 ' + pkg.authFileName : ''}</div>
          </div>
          <div className="card-actions">
            <button className="btn btn-sm" onClick={() => { setPrepForm({ laborOhp: prepSettings?.laborOhp || 10, matOhp: prepSettings?.matOhp || 15, vendorMarkup: prepSettings?.vendorMarkup || 2.5 }); setShowPrep(true); }}>
              <i className="ti ti-calculator" /> {prepSettings ? 'Edit prep' : 'Prepare package'}
            </button>
            {prepSettings && (
              <button className="btn btn-sm" onClick={() => navigate('package-preview', { jobId: job.id, pkgId: pkg.id })}>
                <i className="ti ti-eye" /> Preview & PDF
              </button>
            )}
            <button className="btn btn-primary btn-sm" onClick={addTicket}><i className="ti ti-plus" /> Add ticket</button>
          </div>
        </div>

        {pkg.tickets.length === 0 ? (
          <EmptyState icon="file-plus" message="No tickets yet. Add your first daily ticket."
            action={<button className="btn btn-primary btn-sm" onClick={addTicket}><i className="ti ti-plus" /> Add ticket</button>} />
        ) : (
          pkg.tickets.map(t => {
            const tst = ticketStatusInfo(t.status);
            const totalHrs = t.labor.reduce((s, r) => s + (r.reg || 0) + (r.ot || 0) + (r.dt || 0), 0);
            const matTotal = (t.materials || []).reduce((s, r) => s + (r.qty||0)*(r.unitPrice||r.rate||0), 0);
            return (
              <div key={t.id} className="list-row">
                <div className="row-icon" style={{ background: '#E8F5DA', color: '#2A6008', fontSize: 10 }}>{t.num}</div>
                <div className="row-body clickable" onClick={() => navigate('ticket-editor', { jobId: job.id, pkgId: pkg.id, ticketId: t.id })}>
                  <div className="row-title">{t.desc || '(no description)'}</div>
                  <div className="row-sub">{t.date} · {t.labor.length} worker{t.labor.length !== 1 ? 's' : ''} · {totalHrs} hrs{matTotal > 0 ? ' · ' + fmt(matTotal) + ' materials' : ''}</div>
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

      {/* PREPARE PACKAGE MODAL */}
      <Modal open={showPrep} onClose={() => setShowPrep(false)} title="Prepare Package - Apply Rates & OH&P" wide
        footer={<>
          <button className="btn" onClick={() => setShowPrep(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={savePrep}><i className="ti ti-check" /> Save & apply</button>
        </>}>

        <Notice type="info">Rates from job setup are pre-filled. Adjust if needed. OH&P applied on the summary sheet.</Notice>

        {Object.keys(laborByClass).length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Labor hours by classification</div>
            <div className="tbl-wrap">
              <table className="tbl">
                <thead><tr><th>Classification</th><th>Reg hrs</th><th>OT hrs</th><th>DT hrs</th><th>Reg rate</th><th>OT rate</th><th>DT rate</th><th>Subtotal</th></tr></thead>
                <tbody>
                  {Object.values(laborByClass).map((c, i) => {
                    const sub = c.reg * c.regRate + c.ot * c.otRate + c.dt * c.dtRate;
                    return (
                      <tr key={i}>
                        <td style={{ fontWeight: 600 }}>{c.name}</td>
                        <td>{c.reg}</td><td>{c.ot}</td><td>{c.dt}</td>
                        <td>{fmt(c.regRate)}</td><td>{fmt(c.otRate)}</td><td>{fmt(c.dtRate)}</td>
                        <td style={{ fontWeight: 600 }}>{fmt(sub)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {Object.keys(matSummary).length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Materials summary</div>
            <div className="tbl-wrap">
              <table className="tbl">
                <thead><tr><th>Description</th><th>Unit</th><th>Qty</th><th>Unit price</th><th>Subtotal</th></tr></thead>
                <tbody>
                  {Object.values(matSummary).map((m, i) => {
                    const sub = m.qty * m.unitPrice;
                    return (
                      <tr key={i}>
                        <td>{m.desc}</td><td>{m.unit}</td><td>{m.qty}</td>
                        <td>{fmt(m.unitPrice)}</td><td style={{ fontWeight: 600 }}>{fmt(sub)}</td>
                      </tr>
                    );
                  })}
                  <tr style={{ background: '#f8f8f6' }}>
                    <td colSpan={4} style={{ fontWeight: 700, textAlign: 'right', fontSize: 12 }}>Material subtotal</td>
                    <td style={{ fontWeight: 700 }}>{fmt(Object.values(matSummary).reduce((s, m) => s + m.qty * m.unitPrice, 0))}</td>
                  </tr>
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'right', fontSize: 12, color: '#888' }}>OH&P ({prepForm.matOhp}%)</td>
                    <td style={{ color: '#888' }}>{fmt(Object.values(matSummary).reduce((s, m) => s + m.qty * m.unitPrice, 0) * (parseFloat(prepForm.matOhp) || 0) / 100)}</td>
                  </tr>
                  <tr style={{ background: '#E8F5DA' }}>
                    <td colSpan={4} style={{ fontWeight: 800, textAlign: 'right', fontSize: 12, color: '#2A6008' }}>Material total</td>
                    <td style={{ fontWeight: 800, color: '#2A6008' }}>{fmt(Object.values(matSummary).reduce((s, m) => s + m.qty * m.unitPrice, 0) * (1 + (parseFloat(prepForm.matOhp) || 0) / 100))}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>OH&P percentages</div>
        <div className="form-grid form-grid-3">
          <FormGroup label="Labor OH&P %"><Input type="number" value={prepForm.laborOhp} onChange={v => setPrepForm(f => ({ ...f, laborOhp: v }))} placeholder="10" /></FormGroup>
          <FormGroup label="Material OH&P %"><Input type="number" value={prepForm.matOhp} onChange={v => setPrepForm(f => ({ ...f, matOhp: v }))} placeholder="15" /></FormGroup>
          <FormGroup label="Vendor markup %"><Input type="number" value={prepForm.vendorMarkup} onChange={v => setPrepForm(f => ({ ...f, vendorMarkup: v }))} placeholder="2.5" /></FormGroup>
        </div>

        <div style={{ marginTop: 16, padding: '14px 16px', background: '#f8f8f6', borderRadius: 10, border: '1px solid #e8e8e6' }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Package total preview</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}><span style={{ color: '#888' }}>Labor subtotal</span><span style={{ fontWeight: 600 }}>{fmt(prepPreview.laborBase)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}><span style={{ color: '#aaa' }}>Labor OH&P ({prepForm.laborOhp}%)</span><span style={{ color: '#aaa' }}>{fmt(prepPreview.laborOhp)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, color: '#185FA5' }}><span>Labor total</span><span>{fmt(prepPreview.laborTotal)}</span></div>
            <div style={{ height: 1, background: '#e8e8e6', margin: '4px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}><span style={{ color: '#888' }}>Material subtotal</span><span style={{ fontWeight: 600 }}>{fmt(prepPreview.matBase)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}><span style={{ color: '#aaa' }}>Material OH&P ({prepForm.matOhp}%)</span><span style={{ color: '#aaa' }}>{fmt(prepPreview.matOhp)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, color: '#2A6008' }}><span>Material total</span><span>{fmt(prepPreview.matTotal)}</span></div>
            {prepPreview.vendorBase > 0 && <>
              <div style={{ height: 1, background: '#e8e8e6', margin: '4px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, color: '#6B21A8' }}><span>Vendor total (incl. {prepForm.vendorMarkup}% markup)</span><span>{fmt(prepPreview.vendorTotal)}</span></div>
            </>}
            <div style={{ height: 2, background: '#185FA5', margin: '8px 0 4px' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 800, color: '#185FA5' }}><span>Package grand total</span><span>{fmt(prepPreview.grand)}</span></div>
          </div>
        </div>
      </Modal>

      <ConfirmModal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Delete ticket"
        message={`Delete ticket ${confirmDelete?.num}? This cannot be undone.`} danger
        onConfirm={() => { dispatch({ type: 'DELETE_TICKET', jobId: job.id, pkgId: pkg.id, ticketId: confirmDelete.id }); setConfirmDelete(null); }} />
    </div>
  );
}

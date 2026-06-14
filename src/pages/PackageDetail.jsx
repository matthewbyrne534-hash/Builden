// src/pages/PackageDetail.jsx
import React, { useState } from 'react';
import { useStore } from '../data/store';
import { genId, fmt, calcPackageTotalsWithOhp, ticketStatusInfo, pkgStatusInfo } from '../utils/helpers';
import { Breadcrumb, Badge, Notice, EmptyState, ConfirmModal, Modal, FormGroup, Input } from '../components/UI';

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
    .reduce((s, t) => s + calcPackageTotalsWithOhp({ tickets: [t] }, prepSettings).grand, 0);
  const signedAll = pkg.tickets.length > 0 && pkg.tickets.every(t => ['signed', 'approved'].includes(t.status));
  const st = pkgStatusInfo(pkg);

  // Labor hours summary by classification
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

  function submitPackage() {
    const unsigned = pkg.tickets.filter(t => !['signed', 'approved'].includes(t.status));
    if (unsigned.length > 0) { alert(unsigned.length + ' ticket(s) not yet signed. All tickets must be signed before submitting to GC.'); return; }
    if (!prepSettings) { alert('Please prepare the package first to apply rates and OH&P before submitting.'); return; }
    pkg.tickets.forEach(t => dispatch({ type: 'UPDATE_TICKET', jobId: job.id, pkgId: pkg.id, ticketId: t.id, data: { status: 'submitted' } }));
    alert('Package submitted to GC. Generate the PDF and send to your GC contact.');
  }

  function markApproved() {
    const amount = prompt('Enter the GC-approved amount (numbers only, no $):');
    if (!amount) return;
    pkg.tickets.forEach(t => dispatch({ type: 'UPDATE_TICKET', jobId: job.id, pkgId: pkg.id, ticketId: t.id, data: { status: 'approved' } }));
    dispatch({ type: 'UPDATE_PKG', jobId: job.id, pkgId: pkg.id, data: { approvedAmount: parseFloat(amount) || 0 } });
    alert('Package marked as GC approved. Approved amount: $' + parseFloat(amount).toFixed(2));
  }

  // Preview of prep calculations
  const prepPreview = calcPackageTotalsWithOhp(pkg, { laborOhp: parseFloat(prepForm.laborOhp) || 0, matOhp: parseFloat(prepForm.matOhp) || 0, vendorMarkup: parseFloat(prepForm.vendorMarkup) || 0 });

  return (
    <div>
      <Breadcrumb items={[
        { label: 'Jobs', onClick: () => navigate('jobs') },
        { label: job.num, onClick: () => navigate('job-detail', { jobId: job.id }) },
        { label: pkg.num + ' — ' + pkg.title }
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
          <div className="stat-label">Status</div>
          <div className="stat-val" style={{ fontSize: 13, paddingTop: 4 }}><Badge label={st.label} cls={st.cls} /></div>
        </div>
      </div>

      {pkg.approvedAmount && <Notice type="success">GC approved: {fmt(pkg.approvedAmount)}{pkg.approvedAmount !== tots.grand ? ` (submitted: ${fmt(tots.grand)})` : ''}</Notice>}

      {!prepSettings && pkg.tickets.some(t => t.status === 'signed') && (
        <Notice type="warn">All tickets are signed. <strong>Prepare the package</strong> to apply rates and OH&P before generating the PDF.</Notice>
      )}

      <div className="card">
        <div className="card-header">
          <div className="card-header-left">
            <div className="card-title">{pkg.num} — {pkg.title}</div>
            <div className="card-subtitle">{pkg.authType}{pkg.authRef ? ' · ' + pkg.authRef : ''}{pkg.authFileName ? ' · 📎 ' + pkg.authFileName : ''}</div>
          </div>
          <div className="card-actions">
            <button className="btn btn-sm" onClick={() => { setPrepForm({ laborOhp: prepSettings?.laborOhp || 10, matOhp: prepSettings?.matOhp || 15, vendorMarkup: prepSettings?.vendorMarkup || 2.5 }); setShowPrep(true); }}>
              <i className="ti ti-calculator" /> {prepSettings ? 'Edit prep' : 'Prepare package'}
            </button>
            {prepSettings && <button className="btn btn-sm" onClick={() => navigate('package-preview', { jobId: job.id, pkgId: pkg.id })}><i className="ti ti-eye" /> Preview</button>}
            {signedAll && !pkg.tickets.some(t => t.status === 'submitted') && (
              <button className="btn btn-sm" onClick={submitPackage}><i className="ti ti-send" /> Submit to GC</button>
            )}
            {pkg.tickets.some(t => t.status === 'submitted') && (
              <button className="btn btn-primary btn-sm" onClick={markApproved}><i className="ti ti-check" /> Mark approved</button>
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
            return (
              <div key={t.id} className="list-row">
                <div className="row-icon" style={{ background: '#E8F5DA', color: '#2A6008', fontSize: 10 }}>{t.num}</div>
                <div className="row-body clickable" onClick={() => navigate('ticket-editor', { jobId: job.id, pkgId: pkg.id, ticketId: t.id })}>
                  <div className="row-title">{t.desc || '(no description)'}</div>
                  <div className="row-sub">{t.date} · {t.labor.length} worker{t.labor.length !== 1 ? 's' : ''} · {totalHrs} total hrs · {t.materials.length} material{t.materials.length !== 1 ? 's' : ''}</div>
                </div>
                <div className="row-right" style={{ marginRight: 8 }}>
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

      {/* PREPARE PACKAGE MODAL */}
      <Modal open={showPrep} onClose={() => setShowPrep(false)} title="Prepare Package — Apply Rates & OH&P" wide
        footer={<>
          <button className="btn" onClick={() => setShowPrep(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={savePrep}><i className="ti ti-check" /> Save &amp; apply</button>
        </>}>

        <Notice type="info">
          Rates from job setup are pre-filled below. Adjust if needed. OH&P will be applied when generating the summary sheet.
        </Notice>

        {/* Labor hours summary */}
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
                        <td>{c.reg}</td>
                        <td>{c.ot}</td>
                        <td>{c.dt}</td>
                        <td>${c.regRate.toFixed(2)}</td>
                        <td>${c.otRate.toFixed(2)}</td>
                        <td>${c.dtRate.toFixed(2)}</td>
                        <td style={{ fontWeight: 600 }}>{fmt(sub)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* OH&P inputs */}
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>OH&P percentages</div>
        <div className="form-grid form-grid-3">
          <FormGroup label="Labor OH&P %">
            <Input type="number" value={prepForm.laborOhp} onChange={v => setPrepForm(f => ({ ...f, laborOhp: v }))} placeholder="10" />
          </FormGroup>
          <FormGroup label="Material OH&P %">
            <Input type="number" value={prepForm.matOhp} onChange={v => setPrepForm(f => ({ ...f, matOhp: v }))} placeholder="15" />
          </FormGroup>
          <FormGroup label="Vendor markup %">
            <Input type="number" value={prepForm.vendorMarkup} onChange={v => setPrepForm(f => ({ ...f, vendorMarkup: v }))} placeholder="2.5" />
          </FormGroup>
        </div>

        {/* Live preview */}
        <div style={{ marginTop: 16, padding: '14px 16px', background: '#f8f8f6', borderRadius: 10, border: '1px solid #e8e8e6' }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Package total preview</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: '#666' }}>Labor subtotal</span><span style={{ fontWeight: 600 }}>{fmt(prepPreview.laborBase)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: '#888' }}>Labor OH&P ({prepForm.laborOhp}%)</span><span style={{ color: '#888' }}>{fmt(prepPreview.laborOhp)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, color: '#185FA5' }}>
              <span>Labor total</span><span>{fmt(prepPreview.laborTotal)}</span>
            </div>
            <div style={{ height: 1, background: '#e8e8e6', margin: '4px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: '#666' }}>Material subtotal</span><span style={{ fontWeight: 600 }}>{fmt(prepPreview.matBase)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: '#888' }}>Material OH&P ({prepForm.matOhp}%)</span><span style={{ color: '#888' }}>{fmt(prepPreview.matOhp)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, color: '#2A6008' }}>
              <span>Material total</span><span>{fmt(prepPreview.matTotal)}</span>
            </div>
            {prepPreview.vendorBase > 0 && <>
              <div style={{ height: 1, background: '#e8e8e6', margin: '4px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, color: '#6B21A8' }}>
                <span>Vendor total (incl. {prepForm.vendorMarkup}% markup)</span><span>{fmt(prepPreview.vendorTotal)}</span>
              </div>
            </>}
            <div style={{ height: 2, background: '#185FA5', margin: '8px 0 4px' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 800, color: '#185FA5' }}>
              <span>Package grand total</span><span>{fmt(prepPreview.grand)}</span>
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmModal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Delete ticket"
        message={`Delete ticket ${confirmDelete?.num}? This cannot be undone.`} danger
        onConfirm={() => { dispatch({ type: 'DELETE_TICKET', jobId: job.id, pkgId: pkg.id, ticketId: confirmDelete.id }); setConfirmDelete(null); }} />
    </div>
  );
}

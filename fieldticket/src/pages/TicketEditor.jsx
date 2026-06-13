// src/pages/TicketEditor.jsx
import React, { useState, useCallback, useEffect } from 'react';
import { useStore } from '../data/store';
import { genId, fmt, calcTicketTotals } from '../utils/helpers';
import { Breadcrumb, Notice, FormGroup, Input, Select } from '../components/UI';

// ─── LABOR ROW ────────────────────────────────────────────────────────────────
function LaborRow({ row, index, workers, classifications, onChange, onRemove }) {
  const handleWorkerChange = (workerId) => {
    const worker = workers.find(w => w.id === workerId);
    if (!worker) { onChange(index, { ...row, workerId: '', workerName: '', classId: '', className: '', rate: 0 }); return; }
    const cls = classifications.find(c => c.id === worker.classId);
    onChange(index, {
      ...row,
      workerId: worker.id,
      workerName: worker.first + ' ' + worker.last,
      classId: worker.classId,
      className: cls?.name || '',
      rate: cls?.rate || 0,
      ohp: cls?.ohp || 10
    });
  };

  const base = (row.reg || 0) * (row.rate || 0) + (row.ot || 0) * (row.rate || 0) * 1.5 + (row.dt || 0) * (row.rate || 0) * 2;
  const total = base * (1 + (row.ohp || 0) / 100);

  return (
    <tr>
      <td>
        <select className="tbl-input" value={row.workerId || ''} onChange={e => handleWorkerChange(e.target.value)} style={{ minWidth: 150 }}>
          <option value="">— Select worker —</option>
          {workers.map(w => {
            const cls = classifications.find(c => c.id === w.classId);
            return <option key={w.id} value={w.id}>{w.first} {w.last}{cls ? ' (' + cls.name + ')' : ''}</option>;
          })}
        </select>
      </td>
      <td><input className="tbl-input" type="number" min="0" step="0.5" value={row.reg || 0} onChange={e => onChange(index, { ...row, reg: parseFloat(e.target.value) || 0 })} style={{ width: 65 }} /></td>
      <td><input className="tbl-input" type="number" min="0" step="0.5" value={row.ot || 0} onChange={e => onChange(index, { ...row, ot: parseFloat(e.target.value) || 0 })} style={{ width: 65 }} /></td>
      <td><input className="tbl-input" type="number" min="0" step="0.5" value={row.dt || 0} onChange={e => onChange(index, { ...row, dt: parseFloat(e.target.value) || 0 })} style={{ width: 65 }} /></td>
      <td style={{ fontWeight: 600, color: '#444' }}>{fmt(total)}</td>
      <td><button onClick={() => onRemove(index)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#bbb', padding: 4 }}><i className="ti ti-x" /></button></td>
    </tr>
  );
}

// ─── MATERIAL ROW ─────────────────────────────────────────────────────────────
function MaterialRow({ row, index, onChange, onRemove }) {
  const base = (row.qty || 0) * (row.rate || 0);
  const total = base * (1 + (row.ohp || 15) / 100);
  const units = ['Each', 'Linear ft', 'Square ft', 'Lump sum', 'CY', 'LF', 'SF', 'LB', 'Ton'];

  return (
    <tr>
      <td>
        <input className="tbl-input" type="text" value={row.desc || ''} placeholder="Material description"
          onChange={e => onChange(index, { ...row, desc: e.target.value })} style={{ minWidth: 140 }} />
      </td>
      <td>
        <select className="tbl-input" value={row.unit || 'Each'} onChange={e => onChange(index, { ...row, unit: e.target.value })} style={{ minWidth: 90 }}>
          {units.map(u => <option key={u}>{u}</option>)}
        </select>
      </td>
      <td><input className="tbl-input" type="number" min="0" step="0.01" value={row.qty || 0} onChange={e => onChange(index, { ...row, qty: parseFloat(e.target.value) || 0 })} style={{ width: 70 }} /></td>
      <td><input className="tbl-input" type="number" min="0" step="0.01" value={row.rate || 0} onChange={e => onChange(index, { ...row, rate: parseFloat(e.target.value) || 0 })} style={{ width: 80 }} /></td>
      <td style={{ fontWeight: 600, color: '#444' }}>{fmt(total)}</td>
      <td>
        <button className="btn btn-sm" style={{ fontSize: 11 }} onClick={() => document.getElementById('inv-' + index).click()}>
          <i className="ti ti-paperclip" /> Attach
        </button>
        <input type="file" id={'inv-' + index} style={{ display: 'none' }} accept=".pdf,.jpg,.png"
          onChange={e => onChange(index, { ...row, invoiceName: e.target.files[0]?.name || row.invoiceName })} />
        {row.invoiceName && <div style={{ fontSize: 10, color: '#185FA5', marginTop: 3 }}>{row.invoiceName}</div>}
      </td>
      <td><button onClick={() => onRemove(index)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#bbb', padding: 4 }}><i className="ti ti-x" /></button></td>
    </tr>
  );
}

// ─── VENDOR ROW ───────────────────────────────────────────────────────────────
function VendorRow({ row, index, onChange, onRemove }) {
  const total = (row.amount || 0) * (1 + (row.markup || 2.5) / 100);
  return (
    <tr>
      <td><input className="tbl-input" type="text" value={row.name || ''} placeholder="Vendor / sub name" onChange={e => onChange(index, { ...row, name: e.target.value })} style={{ minWidth: 130 }} /></td>
      <td><input className="tbl-input" type="text" value={row.desc || ''} placeholder="Description" onChange={e => onChange(index, { ...row, desc: e.target.value })} style={{ minWidth: 130 }} /></td>
      <td><input className="tbl-input" type="number" min="0" step="0.01" value={row.amount || 0} onChange={e => onChange(index, { ...row, amount: parseFloat(e.target.value) || 0 })} style={{ width: 90 }} /></td>
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <input className="tbl-input" type="number" min="0" max="100" step="0.5" value={row.markup || 2.5} onChange={e => onChange(index, { ...row, markup: parseFloat(e.target.value) || 0 })} style={{ width: 60 }} />
          <span style={{ fontSize: 12, color: '#888' }}>%</span>
        </div>
      </td>
      <td style={{ fontWeight: 600, color: '#444' }}>{fmt(total)}</td>
      <td><button onClick={() => onRemove(index)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#bbb', padding: 4 }}><i className="ti ti-x" /></button></td>
    </tr>
  );
}

// ─── TICKET EDITOR ────────────────────────────────────────────────────────────
export default function TicketEditor({ jobId, pkgId, ticketId, navigate }) {
  const { state, dispatch } = useStore();
  const job = state.jobs.find(j => j.id === jobId);
  const pkg = job?.packages.find(p => p.id === pkgId);
  const savedTicket = pkg?.tickets.find(t => t.id === ticketId);

  // Local editable state — separate from store until save
  const [ticket, setTicket] = useState(() => savedTicket ? { ...savedTicket, labor: [...(savedTicket.labor || [])], materials: [...(savedTicket.materials || [])], vendors: [...(savedTicket.vendors || [])], photos: [...(savedTicket.photos || [])] } : null);

  useEffect(() => {
    if (savedTicket) {
      setTicket({ ...savedTicket, labor: [...(savedTicket.labor || [])], materials: [...(savedTicket.materials || [])], vendors: [...(savedTicket.vendors || [])], photos: [...(savedTicket.photos || [])] });
    }
  }, [ticketId]);

  if (!job || !pkg || !ticket) return <div className="card"><p style={{ color: '#999' }}>Ticket not found.</p></div>;

  const tots = calcTicketTotals(ticket, job);
  const prevDescs = [...new Set(pkg.tickets.filter(t => t.id !== ticketId).map(t => t.desc).filter(Boolean))];

  // ── Field setters ──
  const setField = (field, value) => setTicket(t => ({ ...t, [field]: value }));

  // ── Labor ──
  const setLabor = useCallback((idx, row) => setTicket(t => { const a = [...t.labor]; a[idx] = row; return { ...t, labor: a }; }), []);
  const removeLabor = useCallback((idx) => setTicket(t => ({ ...t, labor: t.labor.filter((_, i) => i !== idx) })), []);
  const addLabor = () => setTicket(t => ({ ...t, labor: [...t.labor, { id: genId(), workerId: '', workerName: '', classId: '', className: '', reg: 0, ot: 0, dt: 0, rate: 0, ohp: 10 }] }));

  // ── Materials ──
  const setMaterial = useCallback((idx, row) => setTicket(t => { const a = [...t.materials]; a[idx] = row; return { ...t, materials: a }; }), []);
  const removeMaterial = useCallback((idx) => setTicket(t => ({ ...t, materials: t.materials.filter((_, i) => i !== idx) })), []);
  const addMaterial = () => setTicket(t => ({ ...t, materials: [...t.materials, { id: genId(), desc: '', unit: 'Each', qty: 0, rate: 0, ohp: 15, invoiceName: '' }] }));

  // ── Vendors ──
  const setVendor = useCallback((idx, row) => setTicket(t => { const a = [...t.vendors]; a[idx] = row; return { ...t, vendors: a }; }), []);
  const removeVendor = useCallback((idx) => setTicket(t => ({ ...t, vendors: t.vendors.filter((_, i) => i !== idx) })), []);
  const addVendor = () => setTicket(t => ({ ...t, vendors: [...t.vendors, { id: genId(), name: '', desc: '', amount: 0, markup: 2.5 }] }));

  // ── Photos ──
  const addPhotos = (files) => {
    const newPhotos = Array.from(files).map(f => ({ id: genId(), name: f.name, date: new Date().toLocaleDateString(), timestamp: new Date().toLocaleString() }));
    setTicket(t => ({ ...t, photos: [...t.photos, ...newPhotos] }));
  };
  const removePhoto = (idx) => setTicket(t => ({ ...t, photos: t.photos.filter((_, i) => i !== idx) }));

  // ── Save ──
  function saveToStore(newStatus) {
    const data = { ...ticket };
    if (newStatus) data.status = newStatus;
    dispatch({ type: 'UPDATE_TICKET', jobId: job.id, pkgId: pkg.id, ticketId: ticket.id, data });
  }

  function saveDraft() {
    saveToStore('draft');
    navigate('package-detail', { jobId: job.id, pkgId: pkg.id });
  }

  function submitForSig() {
    if (!ticket.foremanName) { alert('Please select a foreman before submitting.'); return; }
    if (!ticket.superName) { alert('Please select a superintendent before submitting.'); return; }
    saveToStore('pending-sig');
    alert(`Ticket ${ticket.num} submitted.\n\nDocuSign sent to ${ticket.foremanName} (Foreman).\nOnce signed, it routes to ${ticket.superName} for superintendent sign-off.`);
    navigate('package-detail', { jobId: job.id, pkgId: pkg.id });
  }

  function markSigned() {
    saveToStore('signed');
    alert(`Ticket ${ticket.num} marked as signed.`);
    navigate('package-detail', { jobId: job.id, pkgId: pkg.id });
  }

  const isReadOnly = ticket.status === 'signed' || ticket.status === 'approved' || ticket.status === 'submitted';

  // ── OH&P overrides (local only for display purposes) ──
  const [laborOhpOverride, setLaborOhpOverride] = useState(null);
  const [matOhpOverride, setMatOhpOverride] = useState(null);
  const [vendorOhpOverride, setVendorOhpOverride] = useState(null);

  const laborOhpPct = laborOhpOverride !== null ? laborOhpOverride : (ticket.labor[0]?.ohp || 10);
  const matOhpPct = matOhpOverride !== null ? matOhpOverride : (ticket.materials[0]?.ohp || 15);
  const vendorOhpPct = vendorOhpOverride !== null ? vendorOhpOverride : 2.5;

  return (
    <div>
      <Breadcrumb items={[
        { label: 'Jobs', onClick: () => navigate('jobs') },
        { label: job.num, onClick: () => navigate('job-detail', { jobId: job.id }) },
        { label: pkg.num, onClick: () => navigate('package-detail', { jobId: job.id, pkgId: pkg.id }) },
        { label: ticket.num }
      ]} />

      <Notice type="info">
        <strong>{pkg.num}</strong> — {pkg.title} &nbsp;·&nbsp; Running package total: <strong>{fmt(pkg.tickets.reduce((s, t) => { const tot = calcTicketTotals(t, job); return s + tot.grand; }, 0))}</strong>
      </Notice>

      {isReadOnly && <Notice type="warn">This ticket is <strong>{ticket.status}</strong> and cannot be edited.</Notice>}

      {/* HEADER */}
      <div className="card">
        <div className="form-grid form-grid-2">
          <FormGroup label="Ticket number">
            <Input value={ticket.num} onChange={v => setField('num', v)} disabled={isReadOnly} />
          </FormGroup>
          <FormGroup label="Date">
            <Input type="date" value={ticket.date} onChange={v => setField('date', v)} disabled={isReadOnly} />
          </FormGroup>
        </div>
        <FormGroup label="Description of work">
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                className="form-input"
                list="desc-suggestions"
                value={ticket.desc}
                onChange={e => setField('desc', e.target.value)}
                placeholder="Describe work performed — start typing for suggestions from previous tickets"
                disabled={isReadOnly}
                style={{ width: '100%' }}
              />
              <datalist id="desc-suggestions">
                {prevDescs.map((d, i) => <option key={i} value={d} />)}
              </datalist>
            </div>
            {!isReadOnly && (
              <button className="btn" onClick={() => {
                if (!ticket.desc.trim()) { alert('Enter a description first.'); return; }
                setField('desc', 'Furnished and installed ' + ticket.desc.replace(/^(ran |installed |did )/i, '') + ' per GC direction and applicable contract documents.');
              }} title="Improve with AI">
                <i className="ti ti-sparkles" /> Improve
              </button>
            )}
          </div>
        </FormGroup>
      </div>

      {/* ─── LABOR ─────────────────────────────────────────────────────── */}
      <div className="card">
        <div className="sec-hdr" style={{ borderTop: 'none', paddingTop: 0, marginTop: 0 }}>
          <div className="sec-icon sec-icon-labor"><i className="ti ti-users" /></div>
          <div><div className="sec-title">Labor</div><div className="sec-sub">Select workers from job roster — rates auto-fill from job setup</div></div>
        </div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ minWidth: 160 }}>Worker</th>
                <th style={{ width: 75 }}>Reg hrs</th>
                <th style={{ width: 75 }}>OT (1.5x)</th>
                <th style={{ width: 75 }}>DT (2x)</th>
                <th style={{ width: 100 }}>Subtotal</th>
                <th style={{ width: 36 }}></th>
              </tr>
            </thead>
            <tbody>
              {ticket.labor.map((row, i) => (
                <LaborRow key={row.id || i} row={row} index={i} workers={job.workers} classifications={job.classifications} onChange={setLabor} onRemove={removeLabor} />
              ))}
              {ticket.labor.length === 0 && (
                <tr><td colSpan={6} style={{ color: '#bbb', fontSize: 12, fontStyle: 'italic', padding: '12px 10px' }}>No labor added yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Labor totals */}
        {ticket.labor.length > 0 && (
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', fontSize: 13 }}>
              <span style={{ color: '#888', fontWeight: 600 }}>Labor subtotal</span>
              <span style={{ fontWeight: 700, minWidth: 90, textAlign: 'right' }}>{fmt(tots.laborBase)}</span>
            </div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', fontSize: 13 }}>
              <span style={{ color: '#888', fontWeight: 600 }}>OH&P</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <input className="tbl-input" type="number" min="0" max="100" step="1" value={laborOhpPct}
                  onChange={e => {
                    const v = parseFloat(e.target.value) || 0;
                    setLaborOhpOverride(v);
                    setTicket(t => ({ ...t, labor: t.labor.map(r => ({ ...r, ohp: v })) }));
                  }}
                  style={{ width: 55 }} />
                <span style={{ fontSize: 12, color: '#888' }}>%</span>
              </div>
              <span style={{ fontWeight: 600, minWidth: 90, textAlign: 'right', color: '#888' }}>{fmt(tots.laborOhpAmt)}</span>
            </div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', fontSize: 13, paddingTop: 6, borderTop: '2px solid #EBF3FB' }}>
              <span style={{ color: '#185FA5', fontWeight: 700 }}>Labor total</span>
              <span style={{ fontWeight: 800, minWidth: 90, textAlign: 'right', color: '#185FA5' }}>{fmt(tots.laborTotal)}</span>
            </div>
          </div>
        )}
        {!isReadOnly && <button className="add-btn" onClick={addLabor}><i className="ti ti-plus" /> Add worker</button>}
      </div>

      {/* ─── MATERIALS ─────────────────────────────────────────────────── */}
      <div className="card">
        <div className="sec-hdr" style={{ borderTop: 'none', paddingTop: 0, marginTop: 0 }}>
          <div className="sec-icon sec-icon-material"><i className="ti ti-package" /></div>
          <div><div className="sec-title">Materials</div><div className="sec-sub">Attach invoices to line items for backup documentation</div></div>
        </div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Description</th>
                <th style={{ width: 95 }}>Unit</th>
                <th style={{ width: 75 }}>Qty</th>
                <th style={{ width: 85 }}>Unit rate</th>
                <th style={{ width: 100 }}>Subtotal</th>
                <th style={{ width: 120 }}>Invoice</th>
                <th style={{ width: 36 }}></th>
              </tr>
            </thead>
            <tbody>
              {ticket.materials.map((row, i) => (
                <MaterialRow key={row.id || i} row={row} index={i} onChange={setMaterial} onRemove={removeMaterial} />
              ))}
              {ticket.materials.length === 0 && (
                <tr><td colSpan={7} style={{ color: '#bbb', fontSize: 12, fontStyle: 'italic', padding: '12px 10px' }}>No materials added yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {ticket.materials.length > 0 && (
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', fontSize: 13 }}>
              <span style={{ color: '#888', fontWeight: 600 }}>Material subtotal</span>
              <span style={{ fontWeight: 700, minWidth: 90, textAlign: 'right' }}>{fmt(tots.matBase)}</span>
            </div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', fontSize: 13 }}>
              <span style={{ color: '#888', fontWeight: 600 }}>OH&P</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <input className="tbl-input" type="number" min="0" max="100" step="1" value={matOhpPct}
                  onChange={e => {
                    const v = parseFloat(e.target.value) || 0;
                    setMatOhpOverride(v);
                    setTicket(t => ({ ...t, materials: t.materials.map(r => ({ ...r, ohp: v })) }));
                  }}
                  style={{ width: 55 }} />
                <span style={{ fontSize: 12, color: '#888' }}>%</span>
              </div>
              <span style={{ fontWeight: 600, minWidth: 90, textAlign: 'right', color: '#888' }}>{fmt(tots.matOhpAmt)}</span>
            </div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', fontSize: 13, paddingTop: 6, borderTop: '2px solid #E8F5DA' }}>
              <span style={{ color: '#2A6008', fontWeight: 700 }}>Material total</span>
              <span style={{ fontWeight: 800, minWidth: 90, textAlign: 'right', color: '#2A6008' }}>{fmt(tots.matTotal)}</span>
            </div>
          </div>
        )}
        {!isReadOnly && <button className="add-btn" onClick={addMaterial}><i className="ti ti-plus" /> Add material</button>}
      </div>

      {/* ─── VENDORS ───────────────────────────────────────────────────── */}
      <div className="card">
        <div className="sec-hdr" style={{ borderTop: 'none', paddingTop: 0, marginTop: 0 }}>
          <div className="sec-icon sec-icon-vendor"><i className="ti ti-users-group" /></div>
          <div><div className="sec-title">Additional Subs / Vendors</div><div className="sec-sub">Third-party vendors or subcontractors — markup applied to their cost</div></div>
        </div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Vendor / sub name</th>
                <th>Description</th>
                <th style={{ width: 95 }}>Amount</th>
                <th style={{ width: 110 }}>Markup %</th>
                <th style={{ width: 100 }}>Total</th>
                <th style={{ width: 36 }}></th>
              </tr>
            </thead>
            <tbody>
              {ticket.vendors.map((row, i) => (
                <VendorRow key={row.id || i} row={row} index={i} onChange={setVendor} onRemove={removeVendor} />
              ))}
              {ticket.vendors.length === 0 && (
                <tr><td colSpan={6} style={{ color: '#bbb', fontSize: 12, fontStyle: 'italic', padding: '12px 10px' }}>No vendors added yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {ticket.vendors.length > 0 && (
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', fontSize: 13 }}>
              <span style={{ color: '#888', fontWeight: 600 }}>Vendor subtotal</span>
              <span style={{ fontWeight: 700, minWidth: 90, textAlign: 'right' }}>{fmt(tots.vendorBase)}</span>
            </div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', fontSize: 13 }}>
              <span style={{ color: '#888', fontWeight: 600 }}>Markup total</span>
              <span style={{ fontWeight: 600, minWidth: 90, textAlign: 'right', color: '#888' }}>{fmt(tots.vendorOhpAmt)}</span>
            </div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', fontSize: 13, paddingTop: 6, borderTop: '2px solid #F2EAFC' }}>
              <span style={{ color: '#6B21A8', fontWeight: 700 }}>Vendor total</span>
              <span style={{ fontWeight: 800, minWidth: 90, textAlign: 'right', color: '#6B21A8' }}>{fmt(tots.vendorTotal)}</span>
            </div>
          </div>
        )}
        {!isReadOnly && <button className="add-btn" onClick={addVendor}><i className="ti ti-plus" /> Add vendor / sub</button>}
      </div>

      {/* ─── PHOTOS ────────────────────────────────────────────────────── */}
      <div className="card">
        <div className="sec-hdr" style={{ borderTop: 'none', paddingTop: 0, marginTop: 0 }}>
          <div className="sec-icon sec-icon-photos"><i className="ti ti-camera" /></div>
          <div><div className="sec-title">Photo Documentation</div><div className="sec-sub">Before/after photos with timestamps — optional but recommended</div></div>
        </div>
        {!isReadOnly && (
          <div className="photo-drop" onClick={() => document.getElementById('photo-upload-input').click()}>
            <i className="ti ti-upload" style={{ fontSize: 28, display: 'block', marginBottom: 8 }} />
            Click to upload photos or drag and drop
            <br /><span style={{ fontSize: 11, color: '#ccc' }}>JPG, PNG — date and timestamp will be recorded</span>
          </div>
        )}
        <input type="file" id="photo-upload-input" multiple accept="image/*" style={{ display: 'none' }} onChange={e => addPhotos(e.target.files)} />
        {ticket.photos.length > 0 && (
          <div className="photo-grid" style={{ marginTop: 12 }}>
            {ticket.photos.map((ph, i) => (
              <div key={i} className="photo-thumb">
                <i className="ti ti-photo" style={{ fontSize: 22, marginBottom: 4 }} />
                <div style={{ fontSize: 10, textAlign: 'center', wordBreak: 'break-all' }}>{ph.name}</div>
                <div style={{ fontSize: 9, color: '#aaa', marginTop: 2 }}>{ph.date}</div>
                {!isReadOnly && <button className="photo-remove" onClick={() => removePhoto(i)}>×</button>}
              </div>
            ))}
          </div>
        )}
        {ticket.photos.length === 0 && <p style={{ fontSize: 12, color: '#bbb', marginTop: 12, fontStyle: 'italic' }}>No photos attached.</p>}
      </div>

      {/* ─── GRAND TOTAL ───────────────────────────────────────────────── */}
      <div className="grand-box">
        <div className="grand-label">Ticket grand total</div>
        <div className="grand-value">{fmt(tots.grand)}</div>
      </div>

      {/* ─── SIGNATURES ────────────────────────────────────────────────── */}
      <div className="card" style={{ marginTop: 16 }}>
        <div className="sec-hdr" style={{ borderTop: 'none', paddingTop: 0, marginTop: 0 }}>
          <div className="sec-icon sec-icon-sig"><i className="ti ti-writing" /></div>
          <div><div className="sec-title">Signatures</div><div className="sec-sub">Foreman signs first via DocuSign, then routes to GC superintendent</div></div>
        </div>
        <div className="sig-block">
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#FFF3DC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#8A5000', flexShrink: 0 }}>
            {ticket.foremanName ? ticket.foremanName.split(' ').map(w => w[0]).join('').substr(0, 2).toUpperCase() : '?'}
          </div>
          <div className="sig-info">
            <div className="sig-name">Foreman / Contractor Representative</div>
            <div style={{ marginTop: 6 }}>
              <select className="form-input" style={{ maxWidth: 300 }} value={ticket.foremanId || ''}
                disabled={isReadOnly}
                onChange={e => {
                  const w = job.workers.find(x => x.id === e.target.value);
                  setField('foremanId', e.target.value);
                  setField('foremanName', w ? w.first + ' ' + w.last : '');
                }}>
                <option value="">— Select foreman —</option>
                {job.workers.map(w => <option key={w.id} value={w.id}>{w.first} {w.last}</option>)}
              </select>
            </div>
          </div>
          <span className={`badge ${ticket.status === 'signed' || ticket.status === 'approved' ? 'badge-success' : 'badge-warning'}`}>
            {ticket.status === 'signed' || ticket.status === 'approved' ? 'Signed' : 'Signs first'}
          </span>
        </div>
        <div className="sig-block">
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#EBF3FB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#185FA5', flexShrink: 0 }}>
            {ticket.superName ? ticket.superName.split(' ').map(w => w[0]).join('').substr(0, 2).toUpperCase() : '?'}
          </div>
          <div className="sig-info">
            <div className="sig-name">GC / Owner Superintendent</div>
            <div style={{ marginTop: 6 }}>
              <select className="form-input" style={{ maxWidth: 300 }} value={ticket.superId || ''}
                disabled={isReadOnly}
                onChange={e => {
                  const s = job.supers.find(x => x.id === e.target.value);
                  setField('superId', e.target.value);
                  setField('superName', s ? s.name : '');
                }}>
                <option value="">— Select superintendent —</option>
                {job.supers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
          <span className="badge badge-gray">After foreman</span>
        </div>

        {/* ACTION BUTTONS */}
        {!isReadOnly && (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
            <button className="btn" onClick={() => navigate('package-detail', { jobId: job.id, pkgId: pkg.id })}>Cancel</button>
            <button className="btn" onClick={saveDraft}><i className="ti ti-device-floppy" /> Save draft</button>
            <button className="btn btn-primary" onClick={submitForSig}><i className="ti ti-send" /> Submit for signature</button>
          </div>
        )}
        {ticket.status === 'pending-sig' && (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
            <button className="btn" onClick={() => navigate('package-detail', { jobId: job.id, pkgId: pkg.id })}>Back</button>
            <button className="btn btn-primary" onClick={markSigned}><i className="ti ti-check" /> Mark as signed</button>
          </div>
        )}
        {isReadOnly && ticket.status !== 'pending-sig' && (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
            <button className="btn" onClick={() => navigate('package-detail', { jobId: job.id, pkgId: pkg.id })}>Back to package</button>
          </div>
        )}
      </div>
    </div>
  );
}

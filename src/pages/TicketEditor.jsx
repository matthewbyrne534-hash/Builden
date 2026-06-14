// src/pages/TicketEditor.jsx
import React, { useState, useCallback, useEffect } from 'react';
import { useStore } from '../data/store';
import { genId } from '../utils/helpers';
import { Breadcrumb, Notice, FormGroup, Input } from '../components/UI';

// ─── LABOR ROW (foreman view - hours only, no rates shown) ───────────────────
function LaborRow({ row, index, workers, classifications, onChange, onRemove, isReadOnly }) {
  const handleWorkerChange = (workerId) => {
    const worker = workers.find(w => w.id === workerId);
    if (!worker) {
      onChange(index, { ...row, workerId: '', workerName: '', classId: '', className: '', regRate: 0, otRate: 0, dtRate: 0 });
      return;
    }
    const cls = classifications.find(c => c.id === worker.classId);
    onChange(index, {
      ...row,
      workerId: worker.id,
      workerName: worker.first + ' ' + worker.last,
      classId: worker.classId,
      className: cls?.name || '',
      regRate: cls?.regRate || 0,
      otRate: cls?.otRate || 0,
      dtRate: cls?.dtRate || 0
    });
  };

  return (
    <tr>
      <td>
        <select className="tbl-input" value={row.workerId || ''} onChange={e => handleWorkerChange(e.target.value)} style={{ minWidth: 160 }} disabled={isReadOnly}>
          <option value="">— Select worker —</option>
          {workers.map(w => {
            const cls = classifications.find(c => c.id === w.classId);
            return <option key={w.id} value={w.id}>{w.first} {w.last}{cls ? ' (' + cls.name + ')' : ''}</option>;
          })}
        </select>
      </td>
      <td style={{ color: '#888', fontSize: 12, fontWeight: 500 }}>{row.className || '—'}</td>
      <td><input className="tbl-input" type="number" min="0" step="0.5" value={row.reg || 0} onChange={e => onChange(index, { ...row, reg: parseFloat(e.target.value) || 0 })} style={{ width: 70 }} disabled={isReadOnly} /></td>
      <td><input className="tbl-input" type="number" min="0" step="0.5" value={row.ot || 0} onChange={e => onChange(index, { ...row, ot: parseFloat(e.target.value) || 0 })} style={{ width: 70 }} disabled={isReadOnly} /></td>
      <td><input className="tbl-input" type="number" min="0" step="0.5" value={row.dt || 0} onChange={e => onChange(index, { ...row, dt: parseFloat(e.target.value) || 0 })} style={{ width: 70 }} disabled={isReadOnly} /></td>
      <td>{!isReadOnly && <button onClick={() => onRemove(index)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#bbb', padding: 4 }}><i className="ti ti-x" /></button>}</td>
    </tr>
  );
}

// ─── MATERIAL ROW (description and quantity only for foreman) ─────────────────
function MaterialRow({ row, index, onChange, onRemove, isReadOnly }) {
  const units = ['Each', 'Linear ft', 'Square ft', 'Lump sum', 'CY', 'LF', 'SF', 'LB', 'Ton'];
  return (
    <tr>
      <td>
        <input className="tbl-input" type="text" value={row.desc || ''} placeholder="Material description"
          onChange={e => onChange(index, { ...row, desc: e.target.value })} style={{ minWidth: 160 }} disabled={isReadOnly} />
      </td>
      <td>
        <select className="tbl-input" value={row.unit || 'Each'} onChange={e => onChange(index, { ...row, unit: e.target.value })} style={{ minWidth: 90 }} disabled={isReadOnly}>
          {units.map(u => <option key={u}>{u}</option>)}
        </select>
      </td>
      <td>
        <input className="tbl-input" type="number" min="0" step="0.01" value={row.qty || 0}
          onChange={e => onChange(index, { ...row, qty: parseFloat(e.target.value) || 0 })} style={{ width: 80 }} disabled={isReadOnly} />
      </td>
      <td>
        <button className="btn btn-sm" style={{ fontSize: 11 }} onClick={() => document.getElementById('inv-' + index).click()} disabled={isReadOnly}>
          <i className="ti ti-paperclip" /> {row.invoiceName ? 'Change' : 'Attach'}
        </button>
        <input type="file" id={'inv-' + index} style={{ display: 'none' }} accept=".pdf,.jpg,.png"
          onChange={e => onChange(index, { ...row, invoiceName: e.target.files[0]?.name || row.invoiceName })} />
        {row.invoiceName && <div style={{ fontSize: 10, color: '#185FA5', marginTop: 3 }}>{row.invoiceName}</div>}
      </td>
      <td>{!isReadOnly && <button onClick={() => onRemove(index)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#bbb', padding: 4 }}><i className="ti ti-x" /></button>}</td>
    </tr>
  );
}

// ─── VENDOR ROW ───────────────────────────────────────────────────────────────
function VendorRow({ row, index, onChange, onRemove, isReadOnly }) {
  return (
    <tr>
      <td><input className="tbl-input" type="text" value={row.name || ''} placeholder="Vendor / sub name" onChange={e => onChange(index, { ...row, name: e.target.value })} style={{ minWidth: 130 }} disabled={isReadOnly} /></td>
      <td><input className="tbl-input" type="text" value={row.desc || ''} placeholder="Description" onChange={e => onChange(index, { ...row, desc: e.target.value })} style={{ minWidth: 130 }} disabled={isReadOnly} /></td>
      <td><input className="tbl-input" type="number" min="0" step="0.01" value={row.amount || 0} onChange={e => onChange(index, { ...row, amount: parseFloat(e.target.value) || 0 })} style={{ width: 90 }} disabled={isReadOnly} /></td>
      <td>{!isReadOnly && <button onClick={() => onRemove(index)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#bbb', padding: 4 }}><i className="ti ti-x" /></button>}</td>
    </tr>
  );
}

// ─── TICKET EDITOR ────────────────────────────────────────────────────────────
export default function TicketEditor({ jobId, pkgId, ticketId, navigate }) {
  const { state, dispatch } = useStore();
  const job = state.jobs.find(j => j.id === jobId);
  const pkg = job?.packages.find(p => p.id === pkgId);
  const savedTicket = pkg?.tickets.find(t => t.id === ticketId);

  // All hooks before any early return
  const [ticket, setTicket] = useState(() =>
    savedTicket ? JSON.parse(JSON.stringify(savedTicket)) : null
  );

  useEffect(() => {
    if (savedTicket) setTicket(JSON.parse(JSON.stringify(savedTicket)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

  const setLabor = useCallback((idx, row) =>
    setTicket(t => { const a = [...t.labor]; a[idx] = row; return { ...t, labor: a }; }), []);
  const removeLabor = useCallback((idx) =>
    setTicket(t => ({ ...t, labor: t.labor.filter((_, i) => i !== idx) })), []);
  const setMaterial = useCallback((idx, row) =>
    setTicket(t => { const a = [...t.materials]; a[idx] = row; return { ...t, materials: a }; }), []);
  const removeMaterial = useCallback((idx) =>
    setTicket(t => ({ ...t, materials: t.materials.filter((_, i) => i !== idx) })), []);
  const setVendor = useCallback((idx, row) =>
    setTicket(t => { const a = [...t.vendors]; a[idx] = row; return { ...t, vendors: a }; }), []);
  const removeVendor = useCallback((idx) =>
    setTicket(t => ({ ...t, vendors: t.vendors.filter((_, i) => i !== idx) })), []);

  if (!job || !pkg || !ticket) return <div className="card"><p style={{ color: '#999' }}>Ticket not found.</p></div>;

  const isReadOnly = ['signed', 'approved', 'submitted'].includes(ticket.status);
  const prevDescs = [...new Set(pkg.tickets.filter(t => t.id !== ticketId).map(t => t.desc).filter(Boolean))];

  const setField = (field, value) => setTicket(t => ({ ...t, [field]: value }));
  const addLabor = () => setTicket(t => ({ ...t, labor: [...t.labor, { id: genId(), workerId: '', workerName: '', classId: '', className: '', reg: 0, ot: 0, dt: 0, regRate: 0, otRate: 0, dtRate: 0 }] }));
  const addMaterial = () => setTicket(t => ({ ...t, materials: [...t.materials, { id: genId(), desc: '', unit: 'Each', qty: 0, rate: 0, invoiceName: '' }] }));
  const addVendor = () => setTicket(t => ({ ...t, vendors: [...t.vendors, { id: genId(), name: '', desc: '', amount: 0 }] }));
  const addPhotos = (files) => {
    const newPhotos = Array.from(files).map(f => ({ id: genId(), name: f.name, date: new Date().toLocaleDateString(), timestamp: new Date().toLocaleString() }));
    setTicket(t => ({ ...t, photos: [...t.photos, ...newPhotos] }));
  };
  const removePhoto = (idx) => setTicket(t => ({ ...t, photos: t.photos.filter((_, i) => i !== idx) }));

  function saveToStore(newStatus) {
    const data = { ...ticket };
    if (newStatus) data.status = newStatus;
    dispatch({ type: 'UPDATE_TICKET', jobId: job.id, pkgId: pkg.id, ticketId: ticket.id, data });
  }
  function saveDraft() { saveToStore('draft'); navigate('package-detail', { jobId: job.id, pkgId: pkg.id }); }
  function submitForSig() {
    if (!ticket.foremanName) { alert('Please select a foreman before submitting.'); return; }
    if (!ticket.superName) { alert('Please select a superintendent before submitting.'); return; }
    saveToStore('pending-sig');
    alert(`Ticket ${ticket.num} submitted.\n\nDocuSign sent to ${ticket.foremanName} (Foreman).\nOnce signed, it routes to ${ticket.superName} for superintendent sign-off.`);
    navigate('package-detail', { jobId: job.id, pkgId: pkg.id });
  }
  function markSigned() { saveToStore('signed'); navigate('package-detail', { jobId: job.id, pkgId: pkg.id }); }

  // Total hours summary for display
  const totalReg = ticket.labor.reduce((s, r) => s + (r.reg || 0), 0);
  const totalOt = ticket.labor.reduce((s, r) => s + (r.ot || 0), 0);
  const totalDt = ticket.labor.reduce((s, r) => s + (r.dt || 0), 0);

  return (
    <div>
      <Breadcrumb items={[
        { label: 'Jobs', onClick: () => navigate('jobs') },
        { label: job.num, onClick: () => navigate('job-detail', { jobId: job.id }) },
        { label: pkg.num, onClick: () => navigate('package-detail', { jobId: job.id, pkgId: pkg.id }) },
        { label: ticket.num }
      ]} />

      <Notice type="info">
        <strong>{pkg.num}</strong> — {pkg.title} &nbsp;·&nbsp; Ticket {ticket.num}
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
            <div style={{ flex: 1 }}>
              <input className="form-input" list="desc-suggestions" value={ticket.desc}
                onChange={e => setField('desc', e.target.value)}
                placeholder="Describe work performed — start typing for suggestions"
                disabled={isReadOnly} style={{ width: '100%' }} />
              <datalist id="desc-suggestions">
                {prevDescs.map((d, i) => <option key={i} value={d} />)}
              </datalist>
            </div>
            {!isReadOnly && (
              <button className="btn" onClick={() => {
                if (!ticket.desc.trim()) { alert('Enter a description first.'); return; }
                setField('desc', 'Furnished and installed ' + ticket.desc.replace(/^(ran |installed |did )/i, '') + ' per GC direction and applicable contract documents.');
              }}><i className="ti ti-sparkles" /> Improve</button>
            )}
          </div>
        </FormGroup>
      </div>

      {/* LABOR — hours only, no rates */}
      <div className="card">
        <div className="sec-hdr" style={{ borderTop: 'none', paddingTop: 0, marginTop: 0 }}>
          <div className="sec-icon sec-icon-labor"><i className="ti ti-users" /></div>
          <div>
            <div className="sec-title">Labor</div>
            <div className="sec-sub">Select workers and enter hours — rates applied by PM during package preparation</div>
          </div>
        </div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ minWidth: 160 }}>Worker</th>
                <th style={{ width: 120 }}>Classification</th>
                <th style={{ width: 85 }}>Reg hrs</th>
                <th style={{ width: 85 }}>OT hrs</th>
                <th style={{ width: 85 }}>DT hrs</th>
                <th style={{ width: 36 }}></th>
              </tr>
            </thead>
            <tbody>
              {ticket.labor.map((row, i) => (
                <LaborRow key={row.id || i} row={row} index={i} workers={job.workers}
                  classifications={job.classifications} onChange={setLabor} onRemove={removeLabor} isReadOnly={isReadOnly} />
              ))}
              {ticket.labor.length === 0 && (
                <tr><td colSpan={6} style={{ color: '#bbb', fontSize: 12, fontStyle: 'italic', padding: '12px 10px' }}>No workers added yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {ticket.labor.length > 0 && (
          <div style={{ marginTop: 10, padding: '8px 12px', background: '#f8f8f6', borderRadius: 8, fontSize: 12, color: '#666', display: 'flex', gap: 20 }}>
            <span><strong style={{ color: '#1a1a1a' }}>{totalReg}</strong> reg hrs</span>
            <span><strong style={{ color: '#1a1a1a' }}>{totalOt}</strong> OT hrs</span>
            <span><strong style={{ color: '#1a1a1a' }}>{totalDt}</strong> DT hrs</span>
            <span style={{ color: '#aaa' }}>Rates & OH&P applied by PM</span>
          </div>
        )}
        {!isReadOnly && <button className="add-btn" onClick={addLabor}><i className="ti ti-plus" /> Add worker</button>}
      </div>

      {/* MATERIALS — description and qty only */}
      <div className="card">
        <div className="sec-hdr" style={{ borderTop: 'none', paddingTop: 0, marginTop: 0 }}>
          <div className="sec-icon sec-icon-material"><i className="ti ti-package" /></div>
          <div>
            <div className="sec-title">Materials</div>
            <div className="sec-sub">Describe materials used and attach receipts — pricing added by PM</div>
          </div>
        </div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Description</th>
                <th style={{ width: 100 }}>Unit</th>
                <th style={{ width: 85 }}>Qty</th>
                <th style={{ width: 120 }}>Receipt</th>
                <th style={{ width: 36 }}></th>
              </tr>
            </thead>
            <tbody>
              {ticket.materials.map((row, i) => (
                <MaterialRow key={row.id || i} row={row} index={i} onChange={setMaterial} onRemove={removeMaterial} isReadOnly={isReadOnly} />
              ))}
              {ticket.materials.length === 0 && (
                <tr><td colSpan={5} style={{ color: '#bbb', fontSize: 12, fontStyle: 'italic', padding: '12px 10px' }}>No materials added yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {!isReadOnly && <button className="add-btn" onClick={addMaterial}><i className="ti ti-plus" /> Add material</button>}
      </div>

      {/* VENDORS */}
      <div className="card">
        <div className="sec-hdr" style={{ borderTop: 'none', paddingTop: 0, marginTop: 0 }}>
          <div className="sec-icon sec-icon-vendor"><i className="ti ti-users-group" /></div>
          <div>
            <div className="sec-title">Additional Subs / Vendors</div>
            <div className="sec-sub">Third-party vendors or subcontractors used on this work</div>
          </div>
        </div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Vendor / sub name</th>
                <th>Description</th>
                <th style={{ width: 110 }}>Amount ($)</th>
                <th style={{ width: 36 }}></th>
              </tr>
            </thead>
            <tbody>
              {ticket.vendors.map((row, i) => (
                <VendorRow key={row.id || i} row={row} index={i} onChange={setVendor} onRemove={removeVendor} isReadOnly={isReadOnly} />
              ))}
              {ticket.vendors.length === 0 && (
                <tr><td colSpan={4} style={{ color: '#bbb', fontSize: 12, fontStyle: 'italic', padding: '12px 10px' }}>No vendors added yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {!isReadOnly && <button className="add-btn" onClick={addVendor}><i className="ti ti-plus" /> Add vendor / sub</button>}
      </div>

      {/* PHOTOS */}
      <div className="card">
        <div className="sec-hdr" style={{ borderTop: 'none', paddingTop: 0, marginTop: 0 }}>
          <div className="sec-icon sec-icon-photos"><i className="ti ti-camera" /></div>
          <div>
            <div className="sec-title">Photo Documentation</div>
            <div className="sec-sub">Before/after photos with timestamps — optional but recommended</div>
          </div>
        </div>
        {!isReadOnly && (
          <div className="photo-drop" onClick={() => document.getElementById('photo-upload-input').click()}>
            <i className="ti ti-upload" style={{ fontSize: 28, display: 'block', marginBottom: 8 }} />
            Click to upload photos<br /><span style={{ fontSize: 11, color: '#ccc' }}>JPG, PNG — timestamp recorded</span>
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

      {/* SIGNATURES */}
      <div className="card" style={{ marginTop: 16 }}>
        <div className="sec-hdr" style={{ borderTop: 'none', paddingTop: 0, marginTop: 0 }}>
          <div className="sec-icon sec-icon-sig"><i className="ti ti-writing" /></div>
          <div>
            <div className="sec-title">Signatures</div>
            <div className="sec-sub">Foreman signs first via DocuSign, then routes to GC superintendent</div>
          </div>
        </div>
        <div className="sig-block">
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#FFF3DC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#8A5000', flexShrink: 0 }}>
            {ticket.foremanName ? ticket.foremanName.split(' ').map(w => w[0]).join('').substr(0, 2).toUpperCase() : '?'}
          </div>
          <div className="sig-info">
            <div className="sig-name">Foreman / Contractor Representative</div>
            <div style={{ marginTop: 6 }}>
              <select className="form-input" style={{ maxWidth: 300 }} value={ticket.foremanId || ''} disabled={isReadOnly}
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
          <span className={`badge ${['signed', 'approved'].includes(ticket.status) ? 'badge-success' : 'badge-warning'}`}>
            {['signed', 'approved'].includes(ticket.status) ? 'Signed' : 'Signs first'}
          </span>
        </div>
        <div className="sig-block">
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#EBF3FB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#185FA5', flexShrink: 0 }}>
            {ticket.superName ? ticket.superName.split(' ').map(w => w[0]).join('').substr(0, 2).toUpperCase() : '?'}
          </div>
          <div className="sig-info">
            <div className="sig-name">GC Superintendent</div>
            <div style={{ marginTop: 6 }}>
              <select className="form-input" style={{ maxWidth: 300 }} value={ticket.superId || ''} disabled={isReadOnly}
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

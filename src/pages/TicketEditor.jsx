// src/pages/TicketEditor.jsx
import React, { useState, useCallback, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useStore } from '../data/store';
import { genId } from '../utils/helpers';
import { Breadcrumb, Notice, FormGroup, Input } from '../components/UI';

// ─── WORKER SELECT (searchable dropdown) ─────────────────────────────────────
function WorkerSelect({ value, onChange, workers, classifications, disabled }) {
  const [search, setSearch] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const [coords, setCoords] = React.useState({ top: 0, left: 0, width: 220 });
  const triggerRef = React.useRef(null);
  const panelRef = React.useRef(null);
  const selected = workers.find(w => w.id === value);
  const selectedCls = selected ? classifications.find(c => c.id === selected.classId) : null;
  const filtered = workers.filter(w => {
    const name = (w.first + ' ' + w.last).toLowerCase();
    const cls = classifications.find(c => c.id === w.classId);
    return name.includes(search.toLowerCase()) || (cls?.name || '').toLowerCase().includes(search.toLowerCase());
  });

  function openPanel() {
    if (triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect();
      setCoords({ top: r.bottom + 4, left: r.left, width: Math.max(r.width, 220) });
    }
    setOpen(true);
  }

  React.useEffect(() => {
    function handle(e) {
      if (triggerRef.current && triggerRef.current.contains(e.target)) return;
      if (panelRef.current && panelRef.current.contains(e.target)) return;
      setOpen(false);
    }
    function handleScroll(e) {
      // Don't close if the scroll happened inside the dropdown panel itself
      if (panelRef.current && panelRef.current.contains(e.target)) return;
      setOpen(false);
    }
    document.addEventListener('mousedown', handle);
    window.addEventListener('scroll', handleScroll, true);
    return () => { document.removeEventListener('mousedown', handle); window.removeEventListener('scroll', handleScroll, true); };
  }, []);

  if (disabled) {
    return <div style={{ fontSize: 13, fontWeight: 500, padding: '6px 8px' }}>{selected ? selected.first + ' ' + selected.last : '—'}</div>;
  }
  return (
    <>
      <div ref={triggerRef} className="tbl-input" onClick={() => (open ? setOpen(false) : openPanel())}
        style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', userSelect: 'none', minWidth: 180 }}>
        <span style={{ color: selected ? '#1a1a1a' : '#bbb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selected ? selected.first + ' ' + selected.last + (selectedCls ? ' (' + selectedCls.name + ')' : '') : '— Select worker —'}
        </span>
        <i className="ti ti-chevron-down" style={{ fontSize: 11, color: '#aaa', marginLeft: 6 }} />
      </div>
      {open && ReactDOM.createPortal(
        <div ref={panelRef} style={{ position: 'fixed', top: coords.top, left: coords.left, width: coords.width, background: '#fff', border: '1px solid #d8d8d6', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.18)', zIndex: 9999 }}>
          <div style={{ padding: 8 }}>
            <input autoFocus className="form-input" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search workers..." style={{ fontSize: 12, padding: '6px 10px' }} />
          </div>
          <div style={{ maxHeight: 240, overflowY: 'scroll' }}>
            <div onClick={() => { onChange(''); setOpen(false); setSearch(''); }}
              style={{ padding: '8px 12px', fontSize: 13, cursor: 'pointer', color: '#aaa', borderBottom: '1px solid #f2f2f0' }}
              onMouseEnter={e => e.currentTarget.style.background = '#f4f4f2'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              — Clear selection —
            </div>
            {filtered.length === 0
              ? <div style={{ padding: '8px 12px', fontSize: 12, color: '#aaa', fontStyle: 'italic' }}>No workers found</div>
              : filtered.map(w => {
                const cls = classifications.find(c => c.id === w.classId);
                const isSelected = w.id === value;
                return (
                  <div key={w.id} onClick={() => { onChange(w.id); setOpen(false); setSearch(''); }}
                    style={{ padding: '8px 12px', fontSize: 13, cursor: 'pointer', background: isSelected ? '#EBF3FB' : 'transparent', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#f4f4f2'; }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}>
                    <span style={{ fontWeight: isSelected ? 700 : 500 }}>{w.first} {w.last}</span>
                    <span style={{ fontSize: 11, color: '#888' }}>{cls?.name || ''}</span>
                  </div>
                );
              })
            }
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

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
        <WorkerSelect
          value={row.workerId || ''}
          onChange={wid => handleWorkerChange(wid)}
          workers={workers}
          classifications={classifications}
          disabled={isReadOnly}
        />
      </td>
      <td style={{ color: '#888', fontSize: 12, fontWeight: 500 }}>{row.className || '—'}</td>
      <td><input className="tbl-input" type="number" min="0" step="0.5" value={row.reg || 0} onChange={e => onChange(index, { ...row, reg: parseFloat(e.target.value) || 0 })} style={{ width: 70 }} disabled={isReadOnly} /></td>
      <td><input className="tbl-input" type="number" min="0" step="0.5" value={row.ot || 0} onChange={e => onChange(index, { ...row, ot: parseFloat(e.target.value) || 0 })} style={{ width: 70 }} disabled={isReadOnly} /></td>
      <td><input className="tbl-input" type="number" min="0" step="0.5" value={row.dt || 0} onChange={e => onChange(index, { ...row, dt: parseFloat(e.target.value) || 0 })} style={{ width: 70 }} disabled={isReadOnly} /></td>
      <td>{!isReadOnly && <button onClick={() => onRemove(index)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#bbb', padding: 4 }}><i className="ti ti-x" /></button>}</td>
    </tr>
  );
}

// ─── MATERIAL SELECT (searchable, pulls from existing package materials) ────
function MaterialSelect({ value, onChange, existingMaterials, disabled }) {
  const [search, setSearch] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const [addingNew, setAddingNew] = React.useState(false);
  const [coords, setCoords] = React.useState({ top: 0, left: 0, width: 220 });
  const triggerRef = React.useRef(null);
  const panelRef = React.useRef(null);

  const filtered = existingMaterials.filter(m => m.desc.toLowerCase().includes(search.toLowerCase()));

  function openPanel() {
    if (triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect();
      setCoords({ top: r.bottom + 4, left: r.left, width: Math.max(r.width, 240) });
    }
    setOpen(true);
  }

  React.useEffect(() => {
    function handle(e) {
      if (triggerRef.current && triggerRef.current.contains(e.target)) return;
      if (panelRef.current && panelRef.current.contains(e.target)) return;
      setOpen(false);
    }
    function handleScroll(e) {
      // Don't close if the scroll happened inside the dropdown panel itself
      if (panelRef.current && panelRef.current.contains(e.target)) return;
      setOpen(false);
    }
    document.addEventListener('mousedown', handle);
    window.addEventListener('scroll', handleScroll, true);
    return () => { document.removeEventListener('mousedown', handle); window.removeEventListener('scroll', handleScroll, true); };
  }, []);

  if (disabled) {
    return <div style={{ fontSize: 13, fontWeight: 500, padding: '6px 8px' }}>{value || '—'}</div>;
  }

  if (existingMaterials.length === 0 && !addingNew) {
    return (
      <input className="tbl-input" type="text" value={value || ''} placeholder="Material description"
        onChange={e => onChange({ desc: e.target.value, unit: null })} style={{ minWidth: 160 }} />
    );
  }

  return (
    <>
      <div ref={triggerRef} className="tbl-input" onClick={() => (open ? setOpen(false) : openPanel())}
        style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', userSelect: 'none', minWidth: 160 }}>
        <span style={{ color: value ? '#1a1a1a' : '#bbb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {value || '— Select material —'}
        </span>
        <i className="ti ti-chevron-down" style={{ fontSize: 11, color: '#aaa', flexShrink: 0, marginLeft: 6 }} />
      </div>
      {open && ReactDOM.createPortal(
        <div ref={panelRef} style={{ position: 'fixed', top: coords.top, left: coords.left, width: coords.width, background: '#fff', border: '1px solid #d8d8d6', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.18)', zIndex: 9999 }}>
          <div style={{ padding: 8 }}>
            <input autoFocus className="form-input" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search materials..." style={{ fontSize: 12, padding: '6px 10px' }} />
          </div>
          <div style={{ maxHeight: 240, overflowY: 'scroll' }}>
            {filtered.length === 0
              ? <div style={{ padding: '8px 12px', fontSize: 12, color: '#aaa', fontStyle: 'italic' }}>No matches</div>
              : filtered.map((m, i) => (
                <div key={i} onClick={() => { onChange({ desc: m.desc, unit: m.unit }); setOpen(false); setSearch(''); }}
                  style={{ padding: '8px 12px', fontSize: 13, cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f4f4f2'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ fontWeight: 500 }}>{m.desc}</div>
                  <div style={{ fontSize: 11, color: '#888' }}>Unit: {m.unit}</div>
                </div>
              ))
            }
          </div>
          <div style={{ borderTop: '1px solid #f0f0ee' }}>
            <div onClick={() => { setOpen(false); setAddingNew(true); onChange({ desc: '', unit: null }); }}
              style={{ padding: '10px 12px', fontSize: 13, fontWeight: 600, color: '#185FA5', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
              onMouseEnter={e => e.currentTarget.style.background = '#f4f4f2'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <i className="ti ti-plus" /> Add new material
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

// ─── MATERIAL ROW ────────────────────────────────────────────────────────────
const UNIT_GROUPS = [
  { label: 'Time', units: ['days', 'hours', 'months', 'weeks', 'years'] },
  { label: 'Amount', units: ['ea', 'ls'] },
  { label: 'Length', units: ['lf', 'm', 'mm'] },
  { label: 'Area', units: ['sf', 'sy', 's\u00B2'] },
  { label: 'Volume', units: ['cy', 'm\u00B3'] },
  { label: 'Mass', units: ['kg', 'lbs', 'ton'] }
];

function MaterialRow({ row, index, onChange, onRemove, isReadOnly, isSignedPM, existingMaterials }) {
  const total = (row.qty || 0) * (row.unitPrice || 0);
  const canEdit = !isReadOnly || isSignedPM; // PM can edit invoices on signed tickets
  const [freeTextMode, setFreeTextMode] = React.useState(!row.desc && existingMaterials.length > 0 ? null : true);

  function handleMaterialPick(picked) {
    if (picked.unit) {
      // Existing material selected — autofill desc + unit only
      onChange(index, { ...row, desc: picked.desc, unit: picked.unit });
      setFreeTextMode(false);
    } else {
      // "Add new material" chosen — switch to free text entry
      onChange(index, { ...row, desc: '' });
      setFreeTextMode(true);
    }
  }

  return (
    <tr>
      <td>
        {freeTextMode === true || existingMaterials.length === 0 ? (
          <input className="tbl-input" type="text" value={row.desc || ''} placeholder="Material description"
            onChange={e => onChange(index, { ...row, desc: e.target.value })} style={{ minWidth: 160 }} disabled={isReadOnly} />
        ) : (
          <MaterialSelect value={row.desc} onChange={handleMaterialPick} existingMaterials={existingMaterials} disabled={isReadOnly} />
        )}
      </td>
      <td>
        <select className="tbl-input" value={row.unit || 'ea'} onChange={e => onChange(index, { ...row, unit: e.target.value })} style={{ minWidth: 80 }} disabled={isReadOnly}>
          {UNIT_GROUPS.map(g => (
            <optgroup key={g.label} label={g.label}>
              {g.units.map(u => <option key={u} value={u}>{u}</option>)}
            </optgroup>
          ))}
        </select>
      </td>
      <td>
        <input className="tbl-input" type="number" min="0" step="0.01" value={row.unitPrice || 0}
          onChange={e => onChange(index, { ...row, unitPrice: parseFloat(e.target.value) || 0 })} style={{ width: 80 }} disabled={isReadOnly} placeholder="0.00" />
      </td>
      <td>
        <input className="tbl-input" type="number" min="0" step="1" value={row.qty || 0}
          onChange={e => onChange(index, { ...row, qty: parseFloat(e.target.value) || 0 })} style={{ width: 70 }} disabled={isReadOnly} />
      </td>
      <td style={{ fontWeight: 600, color: '#444', whiteSpace: 'nowrap' }}>${total.toFixed(2)}</td>
      <td>
        <button className="btn btn-sm" style={{ fontSize: 11 }} onClick={() => document.getElementById('inv-' + index).click()} disabled={!canEdit}>
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
      <td>
        <button className="btn btn-sm" style={{ fontSize: 11 }} onClick={() => document.getElementById('vinv-' + index).click()}>
          <i className="ti ti-paperclip" /> {row.invoiceName ? 'Change' : 'Attach'}
        </button>
        <input type="file" id={'vinv-' + index} style={{ display: 'none' }} accept=".pdf,.jpg,.png"
          onChange={e => onChange(index, { ...row, invoiceName: e.target.files[0]?.name || row.invoiceName })} />
        {row.invoiceName && <div style={{ fontSize: 10, color: '#185FA5', marginTop: 3 }}>{row.invoiceName}</div>}
      </td>
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

  const isReadOnly = ticket.status === 'executed' || ticket.status === 'void';
  const prevDescs = [...new Set(pkg.tickets.filter(t => t.id !== ticketId).map(t => t.desc).filter(Boolean))];

  // Unique materials (desc + unit) used anywhere else in this package, for the material picker dropdown
  const existingMaterialsMap = {};
  pkg.tickets.forEach(t => {
    if (t.id === ticketId) return; // skip current ticket's own rows
    (t.materials || []).forEach(m => {
      if (!m.desc) return;
      const k = m.desc + '|' + m.unit;
      if (!existingMaterialsMap[k]) existingMaterialsMap[k] = { desc: m.desc, unit: m.unit };
    });
  });
  const existingMaterials = Object.values(existingMaterialsMap);

  const setField = (field, value) => setTicket(t => ({ ...t, [field]: value }));
  const addLabor = () => setTicket(t => ({ ...t, labor: [...t.labor, { id: genId(), workerId: '', workerName: '', classId: '', className: '', reg: 0, ot: 0, dt: 0, regRate: 0, otRate: 0, dtRate: 0 }] }));
  const addMaterial = () => setTicket(t => ({ ...t, materials: [...t.materials, { id: genId(), desc: '', unit: 'ea', qty: 0, unitPrice: 0, invoiceName: '' }] }));
  const addVendor = () => setTicket(t => ({ ...t, vendors: [...t.vendors, { id: genId(), name: '', desc: '', amount: 0 }] }));
  const addPhotos = (files) => {
    const newPhotos = Array.from(files).map(f => ({ id: genId(), name: f.name, date: new Date().toLocaleDateString(), timestamp: new Date().toLocaleString() }));
    setTicket(t => ({ ...t, photos: [...t.photos, ...newPhotos] }));
  };
  const removePhoto = (idx) => setTicket(t => ({ ...t, photos: t.photos.filter((_, i) => i !== idx) }));

  function saveToStore(newStatus, extra) {
    const data = { ...ticket, ...(extra || {}) };
    if (newStatus) data.status = newStatus;
    dispatch({ type: 'UPDATE_TICKET', jobId: job.id, pkgId: pkg.id, ticketId: ticket.id, data });
  }
  function saveDraft() { saveToStore('draft'); navigate('package-detail', { jobId: job.id, pkgId: pkg.id }); }

  function submitForSig() {
    if (!ticket.foremanName) { alert('Please select a foreman before submitting.'); return; }
    if (!ticket.superName) { alert('Please select a superintendent before submitting.'); return; }
    saveToStore('awaiting-foreman-sig');
    alert(`Ticket ${ticket.num} submitted.\n\nDocuSign sent to ${ticket.foremanName} (Foreman).\nOnce signed, it routes to ${ticket.superName} for superintendent sign-off.`);
    navigate('package-detail', { jobId: job.id, pkgId: pkg.id });
  }

  // Foreman signs -> auto-advances to awaiting Super signature.
  // (This is the manual stand-in today for what a DocuSign webhook will trigger automatically later.)
  function recordForemanSignature() {
    const now = new Date().toLocaleString();
    saveToStore('awaiting-super-sig', { foremanSignedAt: now });
    navigate('package-detail', { jobId: job.id, pkgId: pkg.id });
  }

  // Super signs -> ticket becomes Executed, fully final.
  function recordSuperSignature() {
    const now = new Date().toLocaleString();
    saveToStore('executed', { superSignedAt: now });
    navigate('package-detail', { jobId: job.id, pkgId: pkg.id });
  }

  // VOID — used while Awaiting Foreman/Super Signature.
  // Simply resets the ticket back to Draft so it can be corrected, resubmitted,
  // or deleted. No revision is created since nothing has been executed yet.
  function voidToDraft() {
    const ok = window.confirm('This will bring the ticket back to draft mode. Are you sure you want to void?');
    if (!ok) return;
    const data = { ...ticket, status: 'draft', foremanSignedAt: null, superSignedAt: null };
    setTicket(data);
    dispatch({ type: 'UPDATE_TICKET', jobId: job.id, pkgId: pkg.id, ticketId: ticket.id, data });
  }

  // VOID — used on an EXECUTED ticket.
  // The ticket is permanently marked void (never resets to draft), with a
  // required explanation for the record. It drops out of all totals and the
  // printed PDF, but stays visible if you click into it, where a "Create
  // Revision" option remains available later if it turns out one is needed.
  function voidExecuted() {
    const reason = window.prompt('Please explain why this executed ticket is being voided (this will be saved for the record):');
    if (reason === null) return; // cancelled
    if (!reason.trim()) { alert('A reason is required to void an executed ticket.'); return; }
    saveToStore('void', { voidedAt: new Date().toLocaleString(), voidReason: reason.trim() });
    navigate('package-detail', { jobId: job.id, pkgId: pkg.id });
  }

  // VOID & CREATE REVISION — used on an EXECUTED ticket.
  // Same permanent void as above, plus immediately creates a new
  // {original} Rev N ticket starting at Draft for resubmission.
  function voidAndCreateRevision() {
    const ok = window.confirm('This will void the original ticket and create a revision for resubmission. Are you sure you want to void and create a revision?');
    if (!ok) return;
    const reason = window.prompt('Please explain why this ticket needs a revision (this will be saved for the record):');
    if (reason === null) return; // cancelled
    if (!reason.trim()) { alert('A reason is required.'); return; }

    const baseNum = ticket.num.replace(/\s+Rev\s+\d+$/i, '');
    const nextRevNum = (ticket.revisionNum || 0) + 1;
    const revisedTicket = {
      ...ticket,
      id: genId(),
      num: `${baseNum} Rev ${nextRevNum}`,
      status: 'draft',
      revisionOf: ticket.revisionOf || ticket.id,
      revisionNum: nextRevNum,
      foremanSignedAt: null,
      superSignedAt: null,
      docusignEnvelopeId: null,
      voidedAt: null,
      voidReason: null
    };
    saveToStore('void', { voidedAt: new Date().toLocaleString(), voidReason: reason.trim() });
    dispatch({ type: 'ADD_TICKET', jobId: job.id, pkgId: pkg.id, ticket: revisedTicket });
    navigate('ticket-editor', { jobId: job.id, pkgId: pkg.id, ticketId: revisedTicket.id });
  }

  // Available only when viewing an already-voided ticket that was NOT created via
  // "Void & Create Revision" — lets the PM create a revision later if it turns
  // out one is needed after all.
  function createRevisionLater() {
    const alreadyHasRevision = pkg.tickets.some(t => t.revisionOf === ticket.id);
    if (alreadyHasRevision) { alert('A revision already exists for this ticket.'); return; }
    const ok = window.confirm('Create a revision of this voided ticket now?');
    if (!ok) return;
    const baseNum = ticket.num.replace(/\s+Rev\s+\d+$/i, '');
    const nextRevNum = (ticket.revisionNum || 0) + 1;
    const revisedTicket = {
      ...ticket,
      id: genId(),
      num: `${baseNum} Rev ${nextRevNum}`,
      status: 'draft',
      revisionOf: ticket.revisionOf || ticket.id,
      revisionNum: nextRevNum,
      foremanSignedAt: null,
      superSignedAt: null,
      docusignEnvelopeId: null,
      voidedAt: null,
      voidReason: null
    };
    dispatch({ type: 'ADD_TICKET', jobId: job.id, pkgId: pkg.id, ticket: revisedTicket });
    navigate('ticket-editor', { jobId: job.id, pkgId: pkg.id, ticketId: revisedTicket.id });
  }

  // Total hours summary for display
  const totalReg = ticket.labor.reduce((s, r) => s + (r.reg || 0), 0);
  const totalOt = ticket.labor.reduce((s, r) => s + (r.ot || 0), 0);
  const totalDt = ticket.labor.reduce((s, r) => s + (r.dt || 0), 0);

  return (
    <div>
      <Breadcrumb items={[
        { label: 'Dashboard', onClick: () => navigate('dashboard') },
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
            <div className="sec-title">Material &amp; Other Expenses</div>
            <div className="sec-sub">Materials, per diem, lodging, fuel, or other reimbursable expenses — attach receipts; pricing added by PM</div>
          </div>
        </div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Description</th>
                <th style={{ width: 90 }}>Unit</th>
                <th style={{ width: 90 }}>Unit price</th>
                <th style={{ width: 70 }}>Qty</th>
                <th style={{ width: 80 }}>Total</th>
                <th style={{ width: 110 }}>Receipt</th>
                <th style={{ width: 36 }}></th>
              </tr>
            </thead>
            <tbody>
              {ticket.materials.map((row, i) => (
                <MaterialRow key={row.id || i} row={row} index={i} onChange={setMaterial} onRemove={removeMaterial} isReadOnly={isReadOnly} isSignedPM={isReadOnly} existingMaterials={existingMaterials} />
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
                <th style={{ width: 100 }}>Amount ($)</th>
                <th style={{ width: 110 }}>Receipt</th>
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

        {/* FOREMAN ROW */}
        <div style={{ display: 'grid', gridTemplateColumns: '34px 1fr 140px 130px', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid #f2f2f0' }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#FFF3DC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#8A5000', flexShrink: 0 }}>
            {ticket.foremanName ? ticket.foremanName.split(' ').map(w => w[0]).join('').substr(0, 2).toUpperCase() : '?'}
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#666', marginBottom: 6 }}>Foreman / Contractor Representative</div>
            <select className="form-input" style={{ maxWidth: 300 }} value={ticket.foremanId || ''} disabled={isReadOnly}
              onChange={e => {
                const m = (job.members || []).find(x => x.id === e.target.value);
                setField('foremanId', e.target.value);
                setField('foremanName', m ? m.name : '');
              }}>
              <option value="">— Select foreman —</option>
              {(job.members || []).filter(m => m.role === 'foreman').map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div style={{ fontSize: 11, color: '#888' }}>
            {ticket.foremanSignedAt
              ? <><div style={{ fontWeight: 600, color: '#2A6008' }}>Signed</div><div>{ticket.foremanSignedAt}</div></>
              : <div style={{ color: '#bbb', fontStyle: 'italic' }}>Not yet signed</div>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <span className={`badge ${ticket.foremanSignedAt ? 'badge-success' : 'badge-warning'}`}>
              {ticket.foremanSignedAt ? 'Signed' : 'Signs first'}
            </span>
          </div>
        </div>

        {/* SUPERINTENDENT ROW */}
        <div style={{ display: 'grid', gridTemplateColumns: '34px 1fr 140px 130px', alignItems: 'center', gap: 12, padding: '12px 0' }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#EBF3FB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#185FA5', flexShrink: 0 }}>
            {ticket.superName ? ticket.superName.split(' ').map(w => w[0]).join('').substr(0, 2).toUpperCase() : '?'}
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#666', marginBottom: 6 }}>GC Superintendent</div>
            <select className="form-input" style={{ maxWidth: 300 }} value={ticket.superId || ''} disabled={isReadOnly}
              onChange={e => {
                const s = (job.members || []).find(x => x.id === e.target.value);
                setField('superId', e.target.value);
                setField('superName', s ? s.name : '');
              }}>
              <option value="">— Select superintendent —</option>
              {(job.members || []).filter(m => m.role === 'super').map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div style={{ fontSize: 11, color: '#888' }}>
            {ticket.superSignedAt
              ? <><div style={{ fontWeight: 600, color: '#2A6008' }}>Signed</div><div>{ticket.superSignedAt}</div></>
              : <div style={{ color: '#bbb', fontStyle: 'italic' }}>Not yet signed</div>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <span className={`badge ${ticket.superSignedAt ? 'badge-success' : 'badge-gray'}`}>
              {ticket.superSignedAt ? 'Signed' : 'After foreman'}
            </span>
          </div>
        </div>

        {ticket.status === 'void' && (
          <Notice type="warn">
            This ticket was voided{ticket.voidedAt ? ' on ' + ticket.voidedAt : ''}.
            {ticket.voidReason && <><br /><strong>Reason:</strong> {ticket.voidReason}</>}
            {pkg.tickets.some(t => t.revisionOf === ticket.id)
              ? <><br />See its revision below for the corrected version.</>
              : ''}
          </Notice>
        )}

        {ticket.status === 'draft' && (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
            <button className="btn" onClick={() => navigate('package-detail', { jobId: job.id, pkgId: pkg.id })}>Cancel</button>
            <button className="btn" onClick={saveDraft}><i className="ti ti-device-floppy" /> Save draft</button>
            <button className="btn btn-primary" onClick={submitForSig}><i className="ti ti-send" /> Submit for signature</button>
          </div>
        )}

        {ticket.status === 'awaiting-foreman-sig' && (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
            <button className="btn" onClick={() => navigate('package-detail', { jobId: job.id, pkgId: pkg.id })}>Back</button>
            <button className="btn btn-danger" onClick={voidToDraft}><i className="ti ti-ban" /> Void</button>
            <button className="btn btn-primary" onClick={recordForemanSignature}><i className="ti ti-signature" /> Record Foreman Signature</button>
          </div>
        )}

        {ticket.status === 'awaiting-super-sig' && (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
            <button className="btn" onClick={() => navigate('package-detail', { jobId: job.id, pkgId: pkg.id })}>Back</button>
            <button className="btn btn-danger" onClick={voidToDraft}><i className="ti ti-ban" /> Void</button>
            <button className="btn btn-primary" onClick={recordSuperSignature}><i className="ti ti-signature" /> Record Super Signature</button>
          </div>
        )}

        {ticket.status === 'executed' && (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
            <button className="btn" onClick={() => navigate('package-detail', { jobId: job.id, pkgId: pkg.id })}>Back to package</button>
            <button className="btn btn-danger" onClick={voidExecuted}><i className="ti ti-ban" /> Void</button>
            <button className="btn btn-danger" onClick={voidAndCreateRevision}><i className="ti ti-edit" /> Void &amp; Create Revision</button>
          </div>
        )}

        {ticket.status === 'void' && (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
            <button className="btn" onClick={() => navigate('package-detail', { jobId: job.id, pkgId: pkg.id })}>Back to package</button>
            {!pkg.tickets.some(t => t.revisionOf === ticket.id) && (
              <button className="btn btn-primary" onClick={createRevisionLater}><i className="ti ti-edit" /> Create Revision</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

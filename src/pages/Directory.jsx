// src/pages/Directory.jsx
import React, { useState } from 'react';
import { useStore } from '../data/store';
import { genId, initials } from '../utils/helpers';
import { Modal, FormGroup, Input, Select, ConfirmModal, Tabs, SearchBar, Badge } from '../components/UI';

export default function Directory() {
  const { state } = useStore();
  const [section, setSection] = useState('internal'); // 'internal' | 'roster' | 'gc'

  return (
    <div>
      <Tabs tabs={[
        { id: 'internal', label: `Internal Team (${state.internalTeam.length})` },
        { id: 'roster', label: `Personnel Roster (${state.personnelRoster.length})` },
        { id: 'gc', label: `GC Directory (${state.gcSupers.length})` }
      ]} active={section} onChange={setSection} />

      {section === 'internal' && <InternalTeamSection />}
      {section === 'roster' && <PersonnelRosterSection />}
      {section === 'gc' && <GcDirectorySection />}
    </div>
  );
}

// ─── INTERNAL TEAM ────────────────────────────────────────────────────────────
function InternalTeamSection() {
  const { state, dispatch } = useStore();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ first: '', last: '', email: '', phone: '', role: 'pm' });
  const [confirmDelete, setConfirmDelete] = useState(null);

  const filtered = state.internalTeam.filter(m =>
    (m.first + ' ' + m.last + ' ' + m.email).toLowerCase().includes(search.toLowerCase())
  );

  function openAdd() { setForm({ first: '', last: '', email: '', phone: '', role: 'pm' }); setEditing(null); setShowModal(true); }
  function openEdit(m) { setForm({ first: m.first, last: m.last, email: m.email, phone: m.phone, role: m.role }); setEditing(m); setShowModal(true); }
  function save() {
    if (!form.first || !form.last || !form.email) return alert('First name, last name, and email are required.');
    if (editing) {
      dispatch({ type: 'UPDATE_INTERNAL_TEAM_MEMBER', member: { ...editing, ...form } });
    } else {
      dispatch({ type: 'ADD_INTERNAL_TEAM_MEMBER', member: { id: genId(), ...form, inviteStatus: 'not-sent' } });
    }
    setShowModal(false);
  }

  const roleLabel = { pm: 'Project Manager', foreman: 'Foreman' };

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center' }}>
        <div className="search-wrap" style={{ flex: 1, marginBottom: 0 }}>
          <i className="ti ti-search search-icon" />
          <input className="search-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search internal team..." />
        </div>
        <button className="btn btn-primary" onClick={openAdd}><i className="ti ti-plus" /> Add team member</button>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-header-left">
            <div className="card-title">Internal Team</div>
            <div className="card-subtitle">Your company's PMs and Foremen — platform users with login access. Assign to specific jobs from the Job Directory.</div>
          </div>
        </div>
        {filtered.length === 0 ? <p style={{ color: '#aaa', fontSize: 13, padding: '12px 0' }}>No team members found.</p> : (
          <table className="dir-table" style={{ tableLayout: 'fixed', width: '100%' }}>
            <colgroup>
              <col style={{ width: '22%' }} /><col style={{ width: '28%' }} /><col style={{ width: '16%' }} />
              <col style={{ width: '14%' }} /><col style={{ width: '12%' }} /><col style={{ width: '8%' }} />
            </colgroup>
            <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {filtered.map(m => (
                <tr key={m.id}>
                  <td><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="av" style={{ width: 28, height: 28, fontSize: 10 }}>{initials(m.first + ' ' + m.last)}</div>
                    <span style={{ fontWeight: 600 }}>{m.first} {m.last}</span>
                  </div></td>
                  <td>{m.email}</td>
                  <td>{m.phone}</td>
                  <td><Badge label={roleLabel[m.role] || m.role} cls={m.role === 'pm' ? 'badge-info' : 'badge-gray'} /></td>
                  <td><Badge label={m.inviteStatus === 'active' ? 'Active' : m.inviteStatus === 'invited' ? 'Invite sent' : 'Not invited'} cls={m.inviteStatus === 'active' ? 'badge-success' : m.inviteStatus === 'invited' ? 'badge-info' : 'badge-gray'} /></td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-icon btn-sm" onClick={() => openEdit(m)}><i className="ti ti-edit" /></button>
                      <button className="btn btn-icon btn-sm btn-danger" onClick={() => setConfirmDelete(m)}><i className="ti ti-trash" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Team Member' : 'Add Team Member'}
        footer={<><button className="btn" onClick={() => setShowModal(false)}>Cancel</button><button className="btn btn-primary" onClick={save}><i className="ti ti-check" /> Save</button></>}>
        <div className="form-grid form-grid-2">
          <FormGroup label="First name *"><Input value={form.first} onChange={v => setForm(f => ({ ...f, first: v }))} /></FormGroup>
          <FormGroup label="Last name *"><Input value={form.last} onChange={v => setForm(f => ({ ...f, last: v }))} /></FormGroup>
          <FormGroup label="Role *">
            <Select value={form.role} onChange={v => setForm(f => ({ ...f, role: v }))} options={[{ value: 'pm', label: 'Project Manager' }, { value: 'foreman', label: 'Foreman' }]} />
          </FormGroup>
          <FormGroup label="Phone"><Input value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} placeholder="(555) 000-0000" /></FormGroup>
          <FormGroup label="Email *" span="2"><Input value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} placeholder="name@company.com" /></FormGroup>
        </div>
      </Modal>

      <ConfirmModal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Remove team member"
        message={`Remove ${confirmDelete?.first} ${confirmDelete?.last} from the internal team? They will also be removed from any jobs they're currently assigned to.`} danger
        onConfirm={() => { dispatch({ type: 'REMOVE_INTERNAL_TEAM_MEMBER', id: confirmDelete.id }); setConfirmDelete(null); }} />
    </div>
  );
}

// ─── PERSONNEL ROSTER ─────────────────────────────────────────────────────────
function PersonnelRosterSection() {
  const { state, dispatch } = useStore();
  const [search, setSearch] = useState('');

  const [showCls, setShowCls] = useState(false);
  const [editCls, setEditCls] = useState(null);
  const [clsForm, setClsForm] = useState({ name: '', regRate: '', otRate: '', dtRate: '' });
  const [confirmRemoveCls, setConfirmRemoveCls] = useState(null);

  const [showWorker, setShowWorker] = useState(false);
  const [editWorker, setEditWorker] = useState(null);
  const [workerForm, setWorkerForm] = useState({ first: '', last: '', classId: '' });
  const [confirmRemoveWorker, setConfirmRemoveWorker] = useState(null);

  function openAddCls() { setClsForm({ name: '', regRate: '', otRate: '', dtRate: '' }); setEditCls(null); setShowCls(true); }
  function openEditCls(c) { setClsForm({ name: c.name, regRate: String(c.regRate || ''), otRate: String(c.otRate || ''), dtRate: String(c.dtRate || '') }); setEditCls(c); setShowCls(true); }
  function saveCls() {
    if (!clsForm.name || !clsForm.regRate) return alert('Name and regular rate are required.');
    const cls = { id: editCls?.id || genId(), name: clsForm.name, regRate: parseFloat(clsForm.regRate) || 0, otRate: parseFloat(clsForm.otRate) || 0, dtRate: parseFloat(clsForm.dtRate) || 0 };
    dispatch({ type: editCls ? 'UPDATE_CLS' : 'ADD_CLS', cls });
    setShowCls(false);
  }

  function openAddWorker() { setWorkerForm({ first: '', last: '', classId: state.classifications[0]?.id || '' }); setEditWorker(null); setShowWorker(true); }
  function openEditWorker(w) { setWorkerForm({ first: w.first, last: w.last, classId: w.classId }); setEditWorker(w); setShowWorker(true); }
  function saveWorker() {
    if (!workerForm.first || !workerForm.last) return alert('First and last name are required.');
    const worker = { id: editWorker?.id || genId(), first: workerForm.first, last: workerForm.last, classId: workerForm.classId };
    dispatch({ type: editWorker ? 'UPDATE_WORKER' : 'ADD_WORKER', worker });
    setShowWorker(false);
  }

  const filteredWorkers = state.personnelRoster.filter(w => (w.first + ' ' + w.last).toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="notice notice-info" style={{ marginBottom: 16 }}>
        <i className="ti ti-info-circle" />
        <span>This is your company-wide crew list. It automatically carries over to every new job. PMs can remove someone from an individual job without affecting this master list — but adding or editing a worker must happen here.</span>
      </div>

      {/* CLASSIFICATIONS */}
      <div className="card">
        <div className="card-header">
          <div className="card-header-left">
            <div className="card-title">Labor Classifications &amp; Rates</div>
            <div className="card-subtitle">Wages are tied to classification, applied by the PM during package preparation</div>
          </div>
          <button className="btn btn-sm" onClick={openAddCls}><i className="ti ti-plus" /> Add classification</button>
        </div>
        {state.classifications.length === 0 ? <p style={{ color: '#aaa', fontSize: 13, padding: '8px 0' }}>No classifications added yet.</p> : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>Classification</th><th>Regular rate</th><th>OT rate</th><th>DT rate</th><th style={{ width: 80 }}></th></tr></thead>
              <tbody>
                {state.classifications.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600 }}>{c.name}</td>
                    <td>${(c.regRate || 0).toFixed(2)}/hr</td>
                    <td>${(c.otRate || 0).toFixed(2)}/hr</td>
                    <td>${(c.dtRate || 0).toFixed(2)}/hr</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-icon btn-sm" onClick={() => openEditCls(c)}><i className="ti ti-edit" /></button>
                        <button className="btn btn-icon btn-sm btn-danger" onClick={() => setConfirmRemoveCls(c)}><i className="ti ti-trash" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PERSONNEL */}
      <div className="card">
        <div className="card-header">
          <div className="card-header-left">
            <div className="card-title">Personnel Roster</div>
            <div className="card-subtitle">Field crew available for ticket labor hours — no login required</div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={openAddWorker}><i className="ti ti-plus" /> Add worker</button>
        </div>
        <SearchBar value={search} onChange={setSearch} placeholder="Search roster..." />
        {filteredWorkers.length === 0 ? <p style={{ color: '#aaa', fontSize: 13, padding: '8px 0' }}>No workers found.</p> : (
          filteredWorkers.map(w => {
            const cls = state.classifications.find(c => c.id === w.classId);
            return (
              <div key={w.id} className="list-row">
                <div className="row-icon">{initials(w.first + ' ' + w.last)}</div>
                <div className="row-body">
                  <div className="row-title">{w.first} {w.last}</div>
                  <div className="row-sub">{cls ? cls.name + ' - $' + (cls.regRate || 0).toFixed(2) + '/hr' : 'No classification'}</div>
                </div>
                <div className="row-actions">
                  <button className="btn btn-icon btn-sm" onClick={() => openEditWorker(w)}><i className="ti ti-edit" /></button>
                  <button className="btn btn-icon btn-sm btn-danger" onClick={() => setConfirmRemoveWorker(w)}><i className="ti ti-trash" /></button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <Modal open={showCls} onClose={() => setShowCls(false)} title={editCls ? 'Edit Classification' : 'Add Classification'}
        footer={<><button className="btn" onClick={() => setShowCls(false)}>Cancel</button><button className="btn btn-primary" onClick={saveCls}><i className="ti ti-check" /> Save</button></>}>
        <div className="form-grid form-grid-2">
          <FormGroup label="Classification name *" span="2"><Input value={clsForm.name} onChange={v => setClsForm(f => ({ ...f, name: v }))} placeholder="e.g. Foreman, Carpenter, Laborer, Electrician" /></FormGroup>
          <FormGroup label="Regular rate ($/hr) *"><Input type="number" value={clsForm.regRate} onChange={v => setClsForm(f => ({ ...f, regRate: v }))} placeholder="0.00" /></FormGroup>
          <FormGroup label="OT rate ($/hr)"><Input type="number" value={clsForm.otRate} onChange={v => setClsForm(f => ({ ...f, otRate: v }))} placeholder="0.00" /></FormGroup>
          <FormGroup label="DT rate ($/hr)"><Input type="number" value={clsForm.dtRate} onChange={v => setClsForm(f => ({ ...f, dtRate: v }))} placeholder="0.00" /></FormGroup>
        </div>
      </Modal>

      <Modal open={showWorker} onClose={() => setShowWorker(false)} title={editWorker ? 'Edit Worker' : 'Add Worker'}
        footer={<><button className="btn" onClick={() => setShowWorker(false)}>Cancel</button><button className="btn btn-primary" onClick={saveWorker}><i className="ti ti-check" /> Save</button></>}>
        <div className="form-grid form-grid-2">
          <FormGroup label="First name *"><Input value={workerForm.first} onChange={v => setWorkerForm(f => ({ ...f, first: v }))} /></FormGroup>
          <FormGroup label="Last name *"><Input value={workerForm.last} onChange={v => setWorkerForm(f => ({ ...f, last: v }))} /></FormGroup>
          <FormGroup label="Classification" span="2">
            <Select value={workerForm.classId} onChange={v => setWorkerForm(f => ({ ...f, classId: v }))}
              options={state.classifications.map(c => ({ value: c.id, label: c.name + ' - $' + (c.regRate || 0).toFixed(2) + '/hr' }))}
              placeholder="- Select classification -" />
          </FormGroup>
        </div>
      </Modal>

      <ConfirmModal open={!!confirmRemoveCls} onClose={() => setConfirmRemoveCls(null)} title="Remove classification"
        message={`Remove "${confirmRemoveCls?.name}" from the company-wide list?`} danger
        onConfirm={() => { dispatch({ type: 'REMOVE_CLS', clsId: confirmRemoveCls.id }); setConfirmRemoveCls(null); }} />
      <ConfirmModal open={!!confirmRemoveWorker} onClose={() => setConfirmRemoveWorker(null)} title="Remove worker"
        message={`Remove ${confirmRemoveWorker?.first} ${confirmRemoveWorker?.last} from the company-wide roster? They will no longer appear on any job's ticket dropdowns.`} danger
        onConfirm={() => { dispatch({ type: 'REMOVE_WORKER', workerId: confirmRemoveWorker.id }); setConfirmRemoveWorker(null); }} />
    </div>
  );
}

// ─── GC DIRECTORY ─────────────────────────────────────────────────────────────
function GcDirectorySection() {
  const { state, dispatch } = useStore();
  const [search, setSearch] = useState('');
  const [selectedCompany, setSelectedCompany] = useState(null);

  const [showAddDropdown, setShowAddDropdown] = useState(false);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [editCompany, setEditCompany] = useState(null);
  const [companyForm, setCompanyForm] = useState({ name: '', phone: '', email: '', address: '' });
  const [confirmDeleteCompany, setConfirmDeleteCompany] = useState(null);

  const [showSuperModal, setShowSuperModal] = useState(false);
  const [editSuper, setEditSuper] = useState(null);
  const [superForm, setSuperForm] = useState({ first: '', last: '', email: '', phone: '', gcCompanyId: '' });
  const [showInlineCompany, setShowInlineCompany] = useState(false);
  const [inlineCompanyForm, setInlineCompanyForm] = useState({ name: '', phone: '', email: '', address: '' });
  const [confirmDeleteSuper, setConfirmDeleteSuper] = useState(null);

  function openAddCompany() { setCompanyForm({ name: '', phone: '', email: '', address: '' }); setEditCompany(null); setShowCompanyModal(true); setShowAddDropdown(false); }
  function openEditCompany(c) { setCompanyForm({ name: c.name, phone: c.phone, email: c.email, address: c.address }); setEditCompany(c); setShowCompanyModal(true); }
  function saveCompany() {
    if (!companyForm.name) return alert('Company name is required.');
    if (editCompany) dispatch({ type: 'UPDATE_GC_COMPANY', company: { ...editCompany, ...companyForm } });
    else dispatch({ type: 'ADD_GC_COMPANY', company: { id: genId(), ...companyForm } });
    setShowCompanyModal(false);
  }

  function openAddSuper(prefilledCompanyId = '') {
    setSuperForm({ first: '', last: '', email: '', phone: '', gcCompanyId: prefilledCompanyId });
    setEditSuper(null);
    setShowInlineCompany(false);
    setInlineCompanyForm({ name: '', phone: '', email: '', address: '' });
    setShowSuperModal(true);
    setShowAddDropdown(false);
  }
  function openEditSuper(s) { setSuperForm({ first: s.first, last: s.last, email: s.email, phone: s.phone, gcCompanyId: s.gcCompanyId }); setEditSuper(s); setShowInlineCompany(false); setShowSuperModal(true); }
  function handleCompanySelect(val) {
    if (val === 'not-listed') { setShowInlineCompany(true); setSuperForm(f => ({ ...f, gcCompanyId: '' })); }
    else { setShowInlineCompany(false); setSuperForm(f => ({ ...f, gcCompanyId: val })); }
  }
  function saveSuper() {
    if (!superForm.first || !superForm.last || !superForm.email) return alert('First name, last name, and email are required.');
    let gcCompanyId = superForm.gcCompanyId;
    if (showInlineCompany && inlineCompanyForm.name) {
      const newCo = { id: genId(), ...inlineCompanyForm };
      dispatch({ type: 'ADD_GC_COMPANY', company: newCo });
      gcCompanyId = newCo.id;
    } else if (!gcCompanyId) {
      return alert('Please select a GC company or add a new one.');
    }
    if (editSuper) dispatch({ type: 'UPDATE_GC_SUPER', super: { ...editSuper, first: superForm.first, last: superForm.last, email: superForm.email, phone: superForm.phone, gcCompanyId } });
    else dispatch({ type: 'ADD_GC_SUPER', super: { id: genId(), first: superForm.first, last: superForm.last, email: superForm.email, phone: superForm.phone, gcCompanyId } });
    setShowSuperModal(false);
  }

  const filteredCompanies = state.gcCompanies.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
  const companySupers = selectedCompany ? state.gcSupers.filter(s => s.gcCompanyId === selectedCompany.id) : [];

  function SuperFormFields() {
    return (
      <>
        <div className="form-grid form-grid-2">
          <FormGroup label="First name *"><Input value={superForm.first} onChange={v => setSuperForm(f => ({ ...f, first: v }))} /></FormGroup>
          <FormGroup label="Last name *"><Input value={superForm.last} onChange={v => setSuperForm(f => ({ ...f, last: v }))} /></FormGroup>
          <FormGroup label="Phone"><Input value={superForm.phone} onChange={v => setSuperForm(f => ({ ...f, phone: v }))} placeholder="(555) 000-0000" /></FormGroup>
          <FormGroup label="Email *"><Input value={superForm.email} onChange={v => setSuperForm(f => ({ ...f, email: v }))} placeholder="name@gc.com" /></FormGroup>
        </div>
        {!editSuper && (
          <FormGroup label="GC Company *">
            <select className="form-input" value={showInlineCompany ? 'not-listed' : superForm.gcCompanyId} onChange={e => handleCompanySelect(e.target.value)}>
              <option value="">- Select GC company -</option>
              {state.gcCompanies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              <option value="not-listed">+ Company not listed - add new</option>
            </select>
          </FormGroup>
        )}
        {showInlineCompany && (
          <div style={{ marginTop: 12, padding: '14px 16px', background: '#f8fbff', border: '1px solid #C5DEFA', borderRadius: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#185FA5', marginBottom: 12 }}><i className="ti ti-building" /> New GC company details</div>
            <div className="form-grid form-grid-2">
              <FormGroup label="Company name *" span="2"><Input value={inlineCompanyForm.name} onChange={v => setInlineCompanyForm(f => ({ ...f, name: v }))} placeholder="e.g. BBL Construction Services" /></FormGroup>
              <FormGroup label="Phone"><Input value={inlineCompanyForm.phone} onChange={v => setInlineCompanyForm(f => ({ ...f, phone: v }))} /></FormGroup>
              <FormGroup label="Email"><Input value={inlineCompanyForm.email} onChange={v => setInlineCompanyForm(f => ({ ...f, email: v }))} /></FormGroup>
              <FormGroup label="Address" span="2"><Input value={inlineCompanyForm.address} onChange={v => setInlineCompanyForm(f => ({ ...f, address: v }))} placeholder="Street, City, State ZIP" /></FormGroup>
            </div>
          </div>
        )}
      </>
    );
  }

  if (selectedCompany) {
    const co = state.gcCompanies.find(c => c.id === selectedCompany.id) || selectedCompany;
    return (
      <div>
        <div className="breadcrumb"><span className="bc-link" onClick={() => setSelectedCompany(null)}>GC Directory</span><span className="bc-sep">&rsaquo;</span><span className="bc-current">{co.name}</span></div>
        <div className="card">
          <div className="card-header">
            <div className="card-header-left">
              <div className="card-title">{co.name}</div>
              <div className="card-subtitle">{co.address}</div>
            </div>
            <div className="card-actions">
              <button className="btn btn-sm" onClick={() => openEditCompany(co)}><i className="ti ti-edit" /> Edit</button>
              <button className="btn btn-sm btn-danger" onClick={() => setConfirmDeleteCompany(co)}><i className="ti ti-trash" /></button>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Superintendents</div>
            <button className="btn btn-primary btn-sm" onClick={() => openAddSuper(co.id)}><i className="ti ti-plus" /> Add superintendent</button>
          </div>
          {companySupers.length === 0 ? <p style={{ color: '#aaa', fontSize: 13, padding: '8px 0' }}>No superintendents yet.</p> : (
            <table className="dir-table">
              <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th style={{ width: 80 }}></th></tr></thead>
              <tbody>
                {companySupers.map(s => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 600 }}>{s.first} {s.last}</td>
                    <td>{s.email}</td>
                    <td>{s.phone}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-icon btn-sm" onClick={() => openEditSuper(s)}><i className="ti ti-edit" /></button>
                        <button className="btn btn-icon btn-sm btn-danger" onClick={() => setConfirmDeleteSuper(s)}><i className="ti ti-trash" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <ConfirmModal open={!!confirmDeleteCompany} onClose={() => setConfirmDeleteCompany(null)} title="Delete GC company"
          message={`Delete "${confirmDeleteCompany?.name}" and all its superintendents?`} danger
          onConfirm={() => { dispatch({ type: 'DELETE_GC_COMPANY', id: confirmDeleteCompany.id }); setConfirmDeleteCompany(null); setSelectedCompany(null); }} />
        <ConfirmModal open={!!confirmDeleteSuper} onClose={() => setConfirmDeleteSuper(null)} title="Delete superintendent"
          message={`Delete ${confirmDeleteSuper?.first} ${confirmDeleteSuper?.last}?`} danger
          onConfirm={() => { dispatch({ type: 'DELETE_GC_SUPER', id: confirmDeleteSuper.id }); setConfirmDeleteSuper(null); }} />
        <Modal open={showCompanyModal} onClose={() => setShowCompanyModal(false)} title="Edit GC Company"
          footer={<><button className="btn" onClick={() => setShowCompanyModal(false)}>Cancel</button><button className="btn btn-primary" onClick={saveCompany}>Save</button></>}>
          <div className="form-grid form-grid-2">
            <FormGroup label="Company name *" span="2"><Input value={companyForm.name} onChange={v => setCompanyForm(f => ({ ...f, name: v }))} /></FormGroup>
            <FormGroup label="Phone"><Input value={companyForm.phone} onChange={v => setCompanyForm(f => ({ ...f, phone: v }))} /></FormGroup>
            <FormGroup label="Email"><Input value={companyForm.email} onChange={v => setCompanyForm(f => ({ ...f, email: v }))} /></FormGroup>
            <FormGroup label="Address" span="2"><Input value={companyForm.address} onChange={v => setCompanyForm(f => ({ ...f, address: v }))} /></FormGroup>
          </div>
        </Modal>
        <Modal open={showSuperModal} onClose={() => setShowSuperModal(false)} title={editSuper ? 'Edit Superintendent' : 'Add Superintendent'}
          footer={<><button className="btn" onClick={() => setShowSuperModal(false)}>Cancel</button><button className="btn btn-primary" onClick={saveSuper}>Save</button></>}>
          <SuperFormFields />
        </Modal>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center' }}>
        <div className="search-wrap" style={{ flex: 1, marginBottom: 0 }}>
          <i className="ti ti-search search-icon" />
          <input className="search-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search GC companies..." />
        </div>
        <div style={{ position: 'relative' }}>
          <button className="btn btn-primary" onClick={() => setShowAddDropdown(v => !v)}>
            <i className="ti ti-plus" /> Add <i className="ti ti-chevron-down" style={{ fontSize: 12 }} />
          </button>
          {showAddDropdown && (
            <div style={{ position: 'absolute', right: 0, top: '110%', background: '#fff', border: '1px solid #e8e8e6', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 100, minWidth: 180, overflow: 'hidden' }}>
              <div style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                onMouseEnter={e => e.currentTarget.style.background = '#f4f4f2'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                onClick={openAddCompany}><i className="ti ti-building" style={{ color: '#185FA5' }} /> Add GC company</div>
              <div style={{ height: 1, background: '#f0f0ee' }} />
              <div style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                onMouseEnter={e => e.currentTarget.style.background = '#f4f4f2'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                onClick={() => openAddSuper('')}><i className="ti ti-user-plus" style={{ color: '#185FA5' }} /> Add superintendent</div>
            </div>
          )}
        </div>
      </div>
      {showAddDropdown && <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setShowAddDropdown(false)} />}

      <div className="card">
        <div className="card-header">
          <div className="card-header-left">
            <div className="card-title">GC Companies</div>
            <div className="card-subtitle">Builds over time as you work with new general contractors</div>
          </div>
        </div>
        {filteredCompanies.length === 0 ? <p style={{ color: '#aaa', fontSize: 13, padding: '8px 0' }}>No GC companies found.</p> : (
          <table className="dir-table">
            <thead><tr><th>Company name</th><th>Superintendents</th><th>Phone</th></tr></thead>
            <tbody>
              {filteredCompanies.map(co => {
                const count = state.gcSupers.filter(s => s.gcCompanyId === co.id).length;
                return (
                  <tr key={co.id} onClick={() => setSelectedCompany(co)}>
                    <td style={{ fontWeight: 700, color: '#185FA5' }}>{co.name}</td>
                    <td>{count} super{count !== 1 ? 's' : ''}</td>
                    <td>{co.phone}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={showCompanyModal} onClose={() => setShowCompanyModal(false)} title="Add GC Company"
        footer={<><button className="btn" onClick={() => setShowCompanyModal(false)}>Cancel</button><button className="btn btn-primary" onClick={saveCompany}>Save company</button></>}>
        <div className="form-grid form-grid-2">
          <FormGroup label="Company name *" span="2"><Input value={companyForm.name} onChange={v => setCompanyForm(f => ({ ...f, name: v }))} placeholder="e.g. BBL Construction Services" /></FormGroup>
          <FormGroup label="Phone"><Input value={companyForm.phone} onChange={v => setCompanyForm(f => ({ ...f, phone: v }))} /></FormGroup>
          <FormGroup label="Email"><Input value={companyForm.email} onChange={v => setCompanyForm(f => ({ ...f, email: v }))} /></FormGroup>
          <FormGroup label="Address" span="2"><Input value={companyForm.address} onChange={v => setCompanyForm(f => ({ ...f, address: v }))} /></FormGroup>
        </div>
      </Modal>

      <Modal open={showSuperModal} onClose={() => setShowSuperModal(false)} title={editSuper ? 'Edit Superintendent' : 'Add Superintendent'}
        footer={<><button className="btn" onClick={() => setShowSuperModal(false)}>Cancel</button><button className="btn btn-primary" onClick={saveSuper}>Save superintendent</button></>}>
        <SuperFormFields />
      </Modal>
    </div>
  );
}

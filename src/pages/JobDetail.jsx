// src/pages/JobDetail.jsx
import React, { useState } from 'react';
import { useStore } from '../data/store';
import { genId, fmt, calcPackageTotals, pkgStatusInfo, buildPkgNum, AUTH_TYPES, initials } from '../utils/helpers';
import { Breadcrumb, Badge, Modal, FormGroup, Input, Select, EmptyState, ConfirmModal, Tabs, SearchBar } from '../components/UI';

export default function JobDetail({ jobId, navigate, initialView }) {
  const { state, dispatch } = useStore();
  const job = state.jobs.find(j => j.id === jobId);
  const view = initialView || null;

  // Package state
  const [showNewPkg, setShowNewPkg] = useState(false);
  const [editPkg, setEditPkg] = useState(null);
  const [confirmDeletePkg, setConfirmDeletePkg] = useState(null);
  const [pkgForm, setPkgForm] = useState({ title: '', authType: 'Change Event', authRef: '', authFileName: null, numSystem: 'TM-{seq}', customNum: '' });

  // Directory state
  const [showAddUser, setShowAddUser] = useState(false);
  const [addUserRole, setAddUserRole] = useState('super'); // 'pm', 'foreman', 'super'
  const [userTab, setUserTab] = useState('dir');
  const [userSearch, setUserSearch] = useState('');
  const [selectedDirContact, setSelectedDirContact] = useState(null);
  const [newUserForm, setNewUserForm] = useState({ first: '', last: '', email: '', phone: '', title: '' });
  const [showInlineCompany, setShowInlineCompany] = useState(false);
  const [inlineCompanyId, setInlineCompanyId] = useState('');
  const [inlineCompanyForm, setInlineCompanyForm] = useState({ name: '', phone: '', email: '', address: '' });
  const [confirmRemoveUser, setConfirmRemoveUser] = useState(null);

  if (!job) return <div className="card"><p style={{ color: '#999' }}>Job not found.</p></div>;

  const openPkgs = job.packages.filter(p => p.tickets.some(t => ['draft', 'pending-sig'].includes(t.status)));
  const pendingPkgs = job.packages.filter(p => p.tickets.some(t => t.status === 'submitted'));
  const executedPkgs = job.packages.filter(p => p.tickets.length > 0 && p.tickets.every(t => ['signed', 'approved'].includes(t.status)));
  const executed = job.packages.reduce((s, p) => s + calcPackageTotals(p).executed, 0);

  // Job directory members by role
  const jobMembers = job.members || [];
  const pms = jobMembers.filter(m => m.role === 'pm');
  const foremen = jobMembers.filter(m => m.role === 'foreman');
  const supers = jobMembers.filter(m => m.role === 'super');

  // ── Package functions ──
  function openNewPkg() { setPkgForm({ title: '', authType: 'Change Event', authRef: '', authFileName: null, numSystem: 'TM-{seq}', customNum: '' }); setEditPkg(null); setShowNewPkg(true); }
  function openEditPkg(pkg) { setPkgForm({ title: pkg.title, authType: pkg.authType, authRef: pkg.authRef || '', authFileName: pkg.authFileName, numSystem: pkg.numSystem || 'TM-{seq}', customNum: '' }); setEditPkg(pkg); setShowNewPkg(true); }
  function savePkg() {
    if (!pkgForm.title) return alert('Package title is required.');
    const numSys = pkgForm.numSystem === 'custom' ? pkgForm.customNum || 'TM-{seq}' : pkgForm.numSystem;
    if (editPkg) {
      dispatch({ type: 'UPDATE_PKG', jobId: job.id, pkgId: editPkg.id, data: { title: pkgForm.title, authType: pkgForm.authType, authRef: pkgForm.authRef, authFileName: pkgForm.authFileName, numSystem: numSys } });
      setShowNewPkg(false);
    } else {
      const seq = job.packages.length + 1;
      const num = buildPkgNum(numSys, seq);
      const pkg = { id: genId(), num, numSystem: numSys, title: pkgForm.title, authType: pkgForm.authType, authRef: pkgForm.authRef, authFileName: pkgForm.authFileName, prepSettings: null, tickets: [] };
      dispatch({ type: 'ADD_PKG', jobId: job.id, pkg });
      setShowNewPkg(false);
      navigate('package-detail', { jobId: job.id, pkgId: pkg.id });
    }
  }
  function deletePkg(pkg) {
    if (pkg.tickets.some(t => t.status !== 'draft')) { alert('Cannot delete a package with signed tickets.'); return; }
    setConfirmDeletePkg(pkg);
  }

  // ── Directory functions ──
  function openAddUserModal(role) {
    setAddUserRole(role);
    setUserTab('dir');
    setUserSearch('');
    setSelectedDirContact(null);
    setNewUserForm({ first: '', last: '', email: '', phone: '', title: role === 'super' ? 'Superintendent' : role === 'foreman' ? 'Foreman' : 'Project Manager' });
    setShowInlineCompany(false);
    setInlineCompanyId('');
    setInlineCompanyForm({ name: '', phone: '', email: '', address: '' });
    setShowAddUser(true);
  }

  function handleCompanySelect(val) {
    if (val === 'not-listed') { setShowInlineCompany(true); setInlineCompanyId(''); }
    else { setShowInlineCompany(false); setInlineCompanyId(val); }
  }

  function saveUser() {
    let contactId = null;
    if (userTab === 'dir') {
      if (!selectedDirContact) return alert('Please select a contact from the directory.');
      const c = state.directory.contacts.find(x => x.id === selectedDirContact);
      if (!c) return;
      const member = { id: genId(), contactId: c.id, name: c.first + ' ' + c.last, email: c.email, phone: c.phone, role: addUserRole, inviteSent: addUserRole !== 'super' };
      dispatch({ type: 'ADD_JOB_MEMBER', jobId: job.id, member });
    } else {
      if (!newUserForm.first || !newUserForm.last || !newUserForm.email) return alert('First name, last name, and email are required.');
      // Create company if needed
      let companyId = inlineCompanyId;
      if (showInlineCompany && inlineCompanyForm.name) {
        const newCo = { id: genId(), ...inlineCompanyForm };
        dispatch({ type: 'ADD_COMPANY', company: newCo });
        companyId = newCo.id;
      }
      // Add to platform directory
      const newContact = { id: genId(), companyId, first: newUserForm.first, last: newUserForm.last, title: newUserForm.title, phone: newUserForm.phone, email: newUserForm.email };
      dispatch({ type: 'ADD_CONTACT', contact: newContact });
      // Add to job
      const member = { id: genId(), contactId: newContact.id, name: newUserForm.first + ' ' + newUserForm.last, email: newUserForm.email, phone: newUserForm.phone, role: addUserRole, inviteSent: addUserRole !== 'super' };
      dispatch({ type: 'ADD_JOB_MEMBER', jobId: job.id, member });
    }
    setShowAddUser(false);
    if (addUserRole !== 'super') {
      alert(`Invite email will be sent to ${userTab === 'dir' ? state.directory.contacts.find(x => x.id === selectedDirContact)?.email : newUserForm.email} once authentication is set up.`);
    }
  }

  function removeUser(member) { setConfirmRemoveUser(member); }

  const filteredDirContacts = state.directory.contacts.filter(c =>
    (c.first + ' ' + c.last + ' ' + c.email).toLowerCase().includes(userSearch.toLowerCase())
  );

  const roleLabel = { pm: 'Sub Project Manager', foreman: 'Foreman', super: 'GC Superintendent' };

  // ── Member row component ──
  function MemberRow({ member }) {
    const co = state.directory.contacts.find(c => c.id === member.contactId);
    const company = co ? state.directory.companies.find(x => x.id === co.companyId) : null;
    return (
      <tr>
        <td><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="av" style={{ width: 28, height: 28, fontSize: 10 }}>{initials(member.name)}</div>
          <span style={{ fontWeight: 600 }}>{member.name}</span>
        </div></td>
        <td>{member.email}</td>
        <td>{member.phone}</td>
        <td>{company?.name || '—'}</td>
        <td>
          {member.role !== 'super' && (
            <span className={`badge ${member.inviteSent ? 'badge-info' : 'badge-gray'}`}>
              {member.inviteSent ? 'Invite pending' : 'Not invited'}
            </span>
          )}
        </td>
        <td><button className="btn btn-icon btn-sm btn-danger" onClick={() => removeUser(member)}><i className="ti ti-trash" /></button></td>
      </tr>
    );
  }

  return (
    <div>
      <Breadcrumb items={[
        { label: 'Dashboard', onClick: () => navigate('dashboard') },
        { label: job.num + ' - ' + job.name }
      ]} />

      {/* THREE SUMMARY BOXES */}
      <div className="stats-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-item">
          <div className="stat-label">Open / In Progress</div>
          <div className="stat-val" style={{ color: '#666' }}>{fmt(openPkgs.reduce((s, p) => s + calcPackageTotals(p).grand, 0))}</div>
          <div style={{ fontSize: 11, color: '#185FA5', marginTop: 3, fontWeight: 600 }}>{openPkgs.length} package{openPkgs.length !== 1 ? 's' : ''}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Pending GC Approval</div>
          <div className="stat-val" style={{ color: '#8A5000' }}>{fmt(pendingPkgs.reduce((s, p) => s + calcPackageTotals(p).grand, 0))}</div>
          <div style={{ fontSize: 11, color: '#8A5000', marginTop: 3, fontWeight: 600 }}>{pendingPkgs.length} package{pendingPkgs.length !== 1 ? 's' : ''}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Executed</div>
          <div className="stat-val" style={{ color: '#2A6008' }}>{fmt(executed)}</div>
          <div style={{ fontSize: 11, color: '#2A6008', marginTop: 3, fontWeight: 600 }}>{executedPkgs.length} package{executedPkgs.length !== 1 ? 's' : ''}</div>
        </div>
      </div>

      {/* NO VIEW SELECTED */}
      {!view && (
        <div className="card" style={{ textAlign: 'center', padding: '32px 20px', color: '#aaa' }}>
          <i className="ti ti-arrow-up" style={{ fontSize: 24, display: 'block', marginBottom: 8 }} />
          <p style={{ fontSize: 13, fontWeight: 500 }}>Select <strong>T&M Packages</strong> or <strong>Directory</strong> from the job dropdown above</p>
        </div>
      )}

      {/* T&M PACKAGES VIEW */}
      {view === 'packages' && (
        <div className="card">
          <div className="card-header">
            <div className="card-header-left">
              <div className="card-title">T&M Packages</div>
              <div className="card-subtitle">{job.num} - {job.name}</div>
            </div>
            <div className="card-actions">
              <button className="btn btn-sm" onClick={() => navigate('job-setup', { jobId: job.id })}><i className="ti ti-settings" /> Setup</button>
              <button className="btn btn-primary btn-sm" onClick={openNewPkg}><i className="ti ti-plus" /> New package</button>
            </div>
          </div>
          {job.packages.length === 0 ? (
            <EmptyState icon="folders" message="No T&M packages yet. Create your first package." />
          ) : (
            job.packages.map(p => {
              const tots = calcPackageTotals(p);
              const st = pkgStatusInfo(p);
              return (
                <div key={p.id} className="list-row">
                  <div className="row-icon" style={{ background: '#FFF3DC', color: '#8A5000', fontSize: 10, fontWeight: 800 }}>{p.num}</div>
                  <div className="row-body clickable" onClick={() => navigate('package-detail', { jobId: job.id, pkgId: p.id })}>
                    <div className="row-title">{p.title}</div>
                    <div className="row-sub">{p.authType}{p.authRef ? ' · ' + p.authRef : ''} · {p.tickets.length} ticket{p.tickets.length !== 1 ? 's' : ''}</div>
                  </div>
                  <div className="row-right" style={{ marginRight: 8 }}>
                    <div className="row-amount">{fmt(tots.grand)}</div>
                    <div className="row-meta">{fmt(tots.executed)} executed</div>
                  </div>
                  <Badge label={st.label} cls={st.cls} />
                  <div className="row-actions">
                    <button className="btn btn-icon btn-sm" onClick={() => openEditPkg(p)}><i className="ti ti-edit" /></button>
                    <button className="btn btn-icon btn-sm btn-danger" onClick={() => deletePkg(p)}><i className="ti ti-trash" /></button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* JOB DIRECTORY VIEW */}
      {view === 'directory' && (
        <div>
          {/* Sub Project Managers */}
          <div className="card">
            <div className="card-header">
              <div className="card-header-left">
                <div className="card-title">Sub Project Managers</div>
                <div className="card-subtitle">Internal PMs on this job — will receive email invite to Builden</div>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => openAddUserModal('pm')}><i className="ti ti-plus" /> Add PM</button>
            </div>
            {pms.length === 0 ? <p style={{ color: '#aaa', fontSize: 13, padding: '8px 0', fontStyle: 'italic' }}>No PMs added yet.</p> : (
              <table className="dir-table">
                <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Company</th><th>Status</th><th style={{ width: 50 }}></th></tr></thead>
                <tbody>{pms.map(m => <MemberRow key={m.id} member={m} />)}</tbody>
              </table>
            )}
          </div>

          {/* Foremen */}
          <div className="card">
            <div className="card-header">
              <div className="card-header-left">
                <div className="card-title">Foremen</div>
                <div className="card-subtitle">Field foremen on this job — will receive email invite to Builden</div>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => openAddUserModal('foreman')}><i className="ti ti-plus" /> Add foreman</button>
            </div>
            {foremen.length === 0 ? <p style={{ color: '#aaa', fontSize: 13, padding: '8px 0', fontStyle: 'italic' }}>No foremen added yet.</p> : (
              <table className="dir-table">
                <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Company</th><th>Status</th><th style={{ width: 50 }}></th></tr></thead>
                <tbody>{foremen.map(m => <MemberRow key={m.id} member={m} />)}</tbody>
              </table>
            )}
          </div>

          {/* GC Superintendents */}
          <div className="card">
            <div className="card-header">
              <div className="card-header-left">
                <div className="card-title">GC Superintendents</div>
                <div className="card-subtitle">Sign T&M tickets via DocuSign — no Builden login required</div>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => openAddUserModal('super')}><i className="ti ti-plus" /> Add superintendent</button>
            </div>
            {supers.length === 0 ? <p style={{ color: '#aaa', fontSize: 13, padding: '8px 0', fontStyle: 'italic' }}>No superintendents added yet.</p> : (
              <table className="dir-table">
                <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Company</th><th></th><th style={{ width: 50 }}></th></tr></thead>
                <tbody>{supers.map(m => <MemberRow key={m.id} member={m} />)}</tbody>
              </table>
            )}
          </div>

          {/* Project contacts */}
          <div className="card">
            <div className="card-header"><div className="card-title">Project contacts</div></div>
            <table className="dir-table">
              <thead><tr><th>Role</th><th>Company</th></tr></thead>
              <tbody>
                <tr><td style={{ fontWeight: 600 }}>General Contractor</td><td>{job.gc || '—'}</td></tr>
                <tr><td style={{ fontWeight: 600 }}>Owner</td><td>{job.owner || '—'}</td></tr>
                <tr><td style={{ fontWeight: 600 }}>Architect / Engineer</td><td>{job.ae || '—'}</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD USER MODAL */}
      <Modal open={showAddUser} onClose={() => setShowAddUser(false)} title={`Add ${roleLabel[addUserRole]}`} wide
        footer={<>
          <button className="btn" onClick={() => setShowAddUser(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={saveUser}>
            <i className="ti ti-check" /> {addUserRole !== 'super' ? 'Add & send invite' : 'Add to job'}
          </button>
        </>}>

        {addUserRole !== 'super' && (
          <div className="notice notice-info" style={{ marginBottom: 16 }}>
            <i className="ti ti-mail" />
            <span>This person will receive an email invite to join this job in Builden once authentication is enabled.</span>
          </div>
        )}

        <Tabs tabs={[{ id: 'dir', label: 'From directory' }, { id: 'new', label: 'Add new' }]} active={userTab} onChange={t => { setUserTab(t); setSelectedDirContact(null); setShowInlineCompany(false); }} />

        {userTab === 'dir' ? (
          <>
            <SearchBar value={userSearch} onChange={setUserSearch} placeholder="Search by name or email..." />
            <div style={{ maxHeight: 300, overflowY: 'auto' }}>
              {filteredDirContacts.length === 0
                ? <p style={{ color: '#aaa', fontSize: 13, padding: 12 }}>No contacts found. Switch to "Add new" to add someone.</p>
                : filteredDirContacts.map(c => {
                  const co = state.directory.companies.find(x => x.id === c.companyId);
                  const selected = selectedDirContact === c.id;
                  return (
                    <div key={c.id} className="list-row clickable" onClick={() => setSelectedDirContact(c.id)}
                      style={{ background: selected ? '#EBF3FB' : 'transparent', borderRadius: 8, padding: '10px 8px' }}>
                      <div className="row-icon">{initials(c.first + ' ' + c.last)}</div>
                      <div className="row-body">
                        <div className="row-title">{c.first} {c.last} {selected && <i className="ti ti-check" style={{ color: '#185FA5', marginLeft: 4 }} />}</div>
                        <div className="row-sub">{c.title}{co ? ' · ' + co.name : ''} · {c.email}</div>
                      </div>
                    </div>
                  );
                })
              }
            </div>
          </>
        ) : (
          <>
            <div className="form-grid form-grid-2">
              <FormGroup label="First name *"><Input value={newUserForm.first} onChange={v => setNewUserForm(f => ({ ...f, first: v }))} placeholder="First" /></FormGroup>
              <FormGroup label="Last name *"><Input value={newUserForm.last} onChange={v => setNewUserForm(f => ({ ...f, last: v }))} placeholder="Last" /></FormGroup>
              <FormGroup label="Title"><Input value={newUserForm.title} onChange={v => setNewUserForm(f => ({ ...f, title: v }))} /></FormGroup>
              <FormGroup label="Phone"><Input value={newUserForm.phone} onChange={v => setNewUserForm(f => ({ ...f, phone: v }))} placeholder="(555) 000-0000" /></FormGroup>
              <FormGroup label="Email *" span="2"><Input value={newUserForm.email} onChange={v => setNewUserForm(f => ({ ...f, email: v }))} placeholder="name@company.com" /></FormGroup>
            </div>
            <FormGroup label="Company">
              <select className="form-input" value={showInlineCompany ? 'not-listed' : inlineCompanyId} onChange={e => handleCompanySelect(e.target.value)}>
                <option value="">— Select company —</option>
                {state.directory.companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                <option value="not-listed">+ Company not listed — add new</option>
              </select>
            </FormGroup>
            {showInlineCompany && (
              <div style={{ marginTop: 12, padding: '14px 16px', background: '#f8fbff', border: '1px solid #C5DEFA', borderRadius: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#185FA5', marginBottom: 12 }}><i className="ti ti-building" /> New company details</div>
                <div className="form-grid form-grid-2">
                  <FormGroup label="Company name *" span="2"><Input value={inlineCompanyForm.name} onChange={v => setInlineCompanyForm(f => ({ ...f, name: v }))} placeholder="e.g. Apex Construction Group" /></FormGroup>
                  <FormGroup label="Phone"><Input value={inlineCompanyForm.phone} onChange={v => setInlineCompanyForm(f => ({ ...f, phone: v }))} /></FormGroup>
                  <FormGroup label="Email"><Input value={inlineCompanyForm.email} onChange={v => setInlineCompanyForm(f => ({ ...f, email: v }))} /></FormGroup>
                  <FormGroup label="Address" span="2"><Input value={inlineCompanyForm.address} onChange={v => setInlineCompanyForm(f => ({ ...f, address: v }))} placeholder="Street, City, State ZIP" /></FormGroup>
                </div>
              </div>
            )}
          </>
        )}
      </Modal>

      {/* PACKAGE MODAL */}
      <Modal open={showNewPkg} onClose={() => setShowNewPkg(false)} title={editPkg ? 'Edit Package' : 'New T&M Package'}
        footer={<><button className="btn" onClick={() => setShowNewPkg(false)}>Cancel</button><button className="btn btn-primary" onClick={savePkg}><i className="ti ti-check" /> {editPkg ? 'Save changes' : 'Create package'}</button></>}>
        <div className="form-grid">
          <FormGroup label="Package title *"><Input value={pkgForm.title} onChange={v => setPkgForm(f => ({ ...f, title: v }))} placeholder="e.g. Power to BAS control panel - Mech Room 1" /></FormGroup>
          <div className="form-grid form-grid-2">
            <FormGroup label="Authorization type"><Select value={pkgForm.authType} onChange={v => setPkgForm(f => ({ ...f, authType: v }))} options={AUTH_TYPES} /></FormGroup>
            <FormGroup label="Reference # (optional)"><Input value={pkgForm.authRef} onChange={v => setPkgForm(f => ({ ...f, authRef: v }))} placeholder="e.g. CE-047" /></FormGroup>
          </div>
          {!editPkg && (
            <FormGroup label="Ticket numbering system">
              <Select value={pkgForm.numSystem} onChange={v => setPkgForm(f => ({ ...f, numSystem: v }))} options={[
                { value: 'TM-{seq}', label: 'TM-001 (default)' },
                { value: job.num + '-TM-{seq}', label: job.num + '-TM-001' },
                { value: 'custom', label: 'Custom...' }
              ]} />
              {pkgForm.numSystem === 'custom' && <Input value={pkgForm.customNum} onChange={v => setPkgForm(f => ({ ...f, customNum: v }))} placeholder="e.g. PROJ-TM-{seq}" style={{ marginTop: 8 }} />}
              <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>Tickets numbered {(pkgForm.numSystem === 'custom' ? pkgForm.customNum || 'TM-{seq}' : pkgForm.numSystem).replace('{seq}', '001')}.1, .2, .3...</div>
            </FormGroup>
          )}
          <FormGroup label="Upload authorization document (optional)">
            <input type="file" className="form-input" accept=".pdf,.jpg,.png,.doc,.docx" onChange={e => setPkgForm(f => ({ ...f, authFileName: e.target.files[0]?.name || null }))} />
            {pkgForm.authFileName && <div style={{ fontSize: 11, color: '#185FA5', marginTop: 4 }}><i className="ti ti-paperclip" /> {pkgForm.authFileName}</div>}
          </FormGroup>
        </div>
      </Modal>

      <ConfirmModal open={!!confirmDeletePkg} onClose={() => setConfirmDeletePkg(null)}
        onConfirm={() => { dispatch({ type: 'DELETE_PKG', jobId: job.id, pkgId: confirmDeletePkg.id }); setConfirmDeletePkg(null); }}
        title="Delete package" message={`Delete "${confirmDeletePkg?.num} - ${confirmDeletePkg?.title}"? This cannot be undone.`} danger />

      <ConfirmModal open={!!confirmRemoveUser} onClose={() => setConfirmRemoveUser(null)}
        onConfirm={() => { dispatch({ type: 'REMOVE_JOB_MEMBER', jobId: job.id, memberId: confirmRemoveUser.id }); setConfirmRemoveUser(null); }}
        title="Remove from job" message={`Remove ${confirmRemoveUser?.name} from this job?`} danger />
    </div>
  );
}

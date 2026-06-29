// src/pages/JobDetail.jsx
import React, { useState } from 'react';
import { useStore } from '../data/store';
import { genId, fmt, calcPackageTotals, pkgStatusInfo, buildPkgNum, AUTH_TYPES, initials, getJobRoster, PERMISSION_LEVELS } from '../utils/helpers';
import { Breadcrumb, Badge, Modal, FormGroup, Input, Select, EmptyState, ConfirmModal, SearchBar } from '../components/UI';
import { createInvite } from '../data/inviteApi';
import { useAuth } from '../data/auth';

export default function JobDetail({ jobId, navigate, initialView }) {
  const { state, dispatch } = useStore();
  const { userDoc } = useAuth();
  const job = state.jobs.find(j => j.id === jobId);
  const view = initialView || null;

  const [inviteLink, setInviteLink] = useState(null); // shown after generating an invite, for the admin to copy/send

  const [pkgFilter, setPkgFilter] = useState('all');
  const [showNewPkg, setShowNewPkg] = useState(false);
  const [editPkg, setEditPkg] = useState(null);
  const [confirmDeletePkg, setConfirmDeletePkg] = useState(null);
  const [pkgForm, setPkgForm] = useState({ title: '', authType: 'Change Event', authRef: '', authFileName: null, numSystem: 'TM-{seq}', customNum: '' });

  const [showAddUser, setShowAddUser] = useState(false);
  const [addUserRole, setAddUserRole] = useState('super');
  const [userSearch, setUserSearch] = useState('');
  const [selectedSourceId, setSelectedSourceId] = useState(null);
  const [selectedPermission, setSelectedPermission] = useState('full');
  const [confirmRemoveUser, setConfirmRemoveUser] = useState(null);

  const [rosterSearch, setRosterSearch] = useState('');
  const [confirmRemoveRoster, setConfirmRemoveRoster] = useState(null);

  const [confirmStatusChange, setConfirmStatusChange] = useState(null); // { to: 'completed'|'active'|'archived' }

  if (!job) return <div className="card"><p style={{ color: '#999' }}>Job not found.</p></div>;

  const openPkgs = job.packages.filter(p => p.tickets.some(t => ['draft', 'awaiting-foreman-sig', 'awaiting-super-sig'].includes(t.status)));
  const pendingPkgs = job.packages.filter(p => (p.pkgStatus || 'open') === 'pending');
  const executedPkgs = job.packages.filter(p => (p.pkgStatus || 'open') === 'executed');
  const executed = job.packages.reduce((s, p) => s + calcPackageTotals(p).executed, 0);

  const jobMembers = job.members || [];
  const internalMembers = jobMembers.filter(m => m.sourceType === 'internal');
  const supers = jobMembers.filter(m => m.role === 'super');

  const jobRoster = getJobRoster(job, state.personnelRoster);

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
      const pkg = { id: genId(), num, numSystem: numSys, title: pkgForm.title, authType: pkgForm.authType, authRef: pkgForm.authRef, authFileName: pkgForm.authFileName, prepSettings: null, pkgStatus: 'open', tickets: [] };
      dispatch({ type: 'ADD_PKG', jobId: job.id, pkg });
      setShowNewPkg(false);
      navigate('package-detail', { jobId: job.id, pkgId: pkg.id });
    }
  }
  function deletePkg(pkg) {
    if (pkg.tickets.some(t => t.status !== 'draft')) { alert('Cannot delete a package with signed tickets.'); return; }
    setConfirmDeletePkg(pkg);
  }

  function openAddUserModal(role) {
    setAddUserRole(role);
    setUserSearch('');
    setSelectedSourceId(null);
    setSelectedPermission('standard');
    setShowAddUser(true);
  }

  function saveUser() {
    if (!selectedSourceId) return alert(`Please select a ${addUserRole === 'super' ? 'superintendent' : 'team member'}.`);
    if (addUserRole === 'super') {
      const s = state.gcSupers.find(x => x.id === selectedSourceId);
      if (!s) return;
      const member = { id: genId(), sourceType: 'gc', sourceId: s.id, name: s.first + ' ' + s.last, email: s.email, phone: s.phone, role: 'super' };
      dispatch({ type: 'ADD_JOB_MEMBER', jobId: job.id, member });
    } else {
      const it = state.internalTeam.find(x => x.id === selectedSourceId);
      if (!it) return;
      const member = { id: genId(), sourceType: 'internal', sourceId: it.id, name: it.first + ' ' + it.last, email: it.email, phone: it.phone, title: it.role, permission: selectedPermission, inviteSent: false, inviteStatus: 'not-sent' };
      dispatch({ type: 'ADD_JOB_MEMBER', jobId: job.id, member });
    }
    setShowAddUser(false);
  }

  function removeUser(member) { setConfirmRemoveUser(member); }

  async function sendInvite(member) {
    dispatch({ type: 'UPDATE_JOB_MEMBER', jobId: job.id, memberId: member.id, data: { inviteSent: true, inviteStatus: 'invited' } });
    const token = await createInvite({
      companyId: userDoc.companyId, jobId: job.id, jobNum: job.num, jobName: job.name,
      memberId: member.id, name: member.name, email: member.email, title: member.title
    });
    setInviteLink(`${window.location.origin}/invite/${token}`);
  }

  function updatePermission(member, level) {
    dispatch({ type: 'UPDATE_JOB_MEMBER', jobId: job.id, memberId: member.id, data: { permission: level } });
  }

  function changeJobStatus(to) {
    dispatch({ type: 'SET_JOB_STATUS', id: job.id, status: to });
    setConfirmStatusChange(null);
  }

  const alreadyOnJobIds = new Set(jobMembers.filter(m => m.sourceType === 'internal').map(m => m.sourceId));
  const alreadySuperIds = new Set(jobMembers.filter(m => m.sourceType === 'gc').map(m => m.sourceId));

  const availableInternal = state.internalTeam.filter(it => !alreadyOnJobIds.has(it.id) &&
    (it.first + ' ' + it.last).toLowerCase().includes(userSearch.toLowerCase()));
  const availableSupers = state.gcSupers.filter(s => !alreadySuperIds.has(s.id) &&
    (s.first + ' ' + s.last).toLowerCase().includes(userSearch.toLowerCase()));

  const roleLabel = { internal: 'Team Member', super: 'GC Superintendent' };

  function removeFromJobRoster(worker) { setConfirmRemoveRoster(worker); }
  const filteredJobRoster = jobRoster.filter(w => (w.first + ' ' + w.last).toLowerCase().includes(rosterSearch.toLowerCase()));

  function MemberRow({ member, showTitle }) {
    const statusMap = {
      'not-sent': { label: 'Not invited', cls: 'badge-gray' },
      'invited': { label: 'Invite sent', cls: 'badge-info' },
      'active': { label: 'Active', cls: 'badge-success' }
    };
    const status = statusMap[member.inviteStatus || 'not-sent'];
    return (
      <tr>
        <td><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="av" style={{ width: 28, height: 28, fontSize: 10 }}>{initials(member.name)}</div>
          <span style={{ fontWeight: 600 }}>{member.name}</span>
        </div></td>
        <td>{member.email}</td>
        <td>{member.phone}</td>
        {showTitle && <td style={{ color: '#666' }}>{member.title || '—'}</td>}
        <td>
          {member.role !== 'super' ? (
            <select className="form-input" style={{ fontSize: 12 }} value={member.permission || 'standard'} onChange={e => updatePermission(member, e.target.value)}>
              {PERMISSION_LEVELS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          ) : <span style={{ color: '#aaa', fontSize: 12 }}>N/A</span>}
        </td>
        <td>
          {member.role !== 'super'
            ? <span className={`badge ${status.cls}`}>{status.label}</span>
            : <span className="badge badge-gray">DocuSign only</span>
          }
        </td>
        <td>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'flex-end' }}>
            {member.role !== 'super' && member.inviteStatus !== 'active' && (
              <button className="btn btn-icon btn-sm" onClick={() => sendInvite(member)} title={member.inviteStatus === 'invited' ? 'Resend invite' : 'Send invite'}>
                <i className="ti ti-mail" />
              </button>
            )}
            <button className="btn btn-icon btn-sm btn-danger" onClick={() => removeUser(member)}><i className="ti ti-trash" /></button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Breadcrumb items={[
            { label: 'Dashboard', onClick: () => navigate('dashboard') },
            { label: job.num + ' - ' + job.name }
          ]} />
          {job.status === 'completed' && <span className="badge badge-success">Completed</span>}
          {job.status === 'archived' && <span className="badge badge-gray">Archived</span>}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {(job.status || 'active') === 'active' && (
            <button className="btn btn-sm" onClick={() => setConfirmStatusChange({ to: 'completed' })}>
              <i className="ti ti-check" /> Mark Complete
            </button>
          )}
          {job.status === 'completed' && (
            <>
              <button className="btn btn-sm" onClick={() => setConfirmStatusChange({ to: 'active' })}>
                <i className="ti ti-rotate" /> Reopen
              </button>
              <button className="btn btn-sm" onClick={() => setConfirmStatusChange({ to: 'archived' })}>
                <i className="ti ti-archive" /> Archive
              </button>
            </>
          )}
          {job.status === 'archived' && (
            <button className="btn btn-sm" onClick={() => setConfirmStatusChange({ to: 'completed' })}>
              <i className="ti ti-archive-off" /> Unarchive
            </button>
          )}
        </div>
      </div>

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

      {!view && (
        <div className="card" style={{ textAlign: 'center', padding: '32px 20px', color: '#aaa' }}>
          <i className="ti ti-arrow-up" style={{ fontSize: 24, display: 'block', marginBottom: 8 }} />
          <p style={{ fontSize: 13, fontWeight: 500 }}>Select <strong>T&M Packages</strong> or <strong>Directory</strong> from the job dropdown above</p>
        </div>
      )}

      {view === 'packages' && (
        <div className="card">
          <div className="card-header">
            <div className="card-header-left">
              <div className="card-title">T&M Packages</div>
              <div className="card-subtitle">{job.num} - {job.name}</div>
            </div>
            <div className="card-actions">
              <select className="form-input" value={pkgFilter} onChange={e => setPkgFilter(e.target.value)} style={{ fontSize: 12, width: 'auto', minWidth: 160 }}>
                <option value="all">All packages</option>
                <option value="open">Open / In Progress</option>
                <option value="pending">Pending GC Approval</option>
                <option value="executed">Executed</option>
              </select>
              <button className="btn btn-sm" onClick={() => navigate('job-setup', { jobId: job.id })}><i className="ti ti-settings" /> Setup</button>
              <button className="btn btn-primary btn-sm" onClick={openNewPkg}><i className="ti ti-plus" /> New package</button>
            </div>
          </div>
          {job.packages.length === 0 ? (
            <EmptyState icon="folders" message="No T&M packages yet. Create your first package." />
          ) : (
            job.packages.filter(p => pkgFilter === 'all' || (p.pkgStatus || 'open') === pkgFilter).map(p => {
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

      {view === 'directory' && (
        <div>
          <div className="card">
            <div className="card-header">
              <div className="card-header-left">
                <div className="card-title">Internal Team (this job)</div>
                <div className="card-subtitle">From your company's Internal Team — set permission level independently per job, regardless of title</div>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => openAddUserModal('internal')}><i className="ti ti-plus" /> Add team member</button>
            </div>
            {internalMembers.length === 0 ? <p style={{ color: '#aaa', fontSize: 13, padding: '8px 0', fontStyle: 'italic' }}>No team members added yet.</p> : (
              <table className="dir-table" style={{ tableLayout: 'fixed', width: '100%' }}>
                <colgroup>
                  <col style={{ width: '16%' }} /><col style={{ width: '20%' }} /><col style={{ width: '12%' }} />
                  <col style={{ width: '13%' }} /><col style={{ width: '14%' }} /><col style={{ width: '11%' }} /><col style={{ width: '14%' }} />
                </colgroup>
                <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Title</th><th>Permission</th><th>Status</th><th></th></tr></thead>
                <tbody>{internalMembers.map(m => <MemberRow key={m.id} member={m} showTitle />)}</tbody>
              </table>
            )}
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-header-left">
                <div className="card-title">GC Superintendents</div>
                <div className="card-subtitle">From your GC Directory — sign T&M tickets via DocuSign, no login required</div>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => openAddUserModal('super')}><i className="ti ti-plus" /> Add superintendent</button>
            </div>
            {supers.length === 0 ? <p style={{ color: '#aaa', fontSize: 13, padding: '8px 0', fontStyle: 'italic' }}>No superintendents added yet.</p> : (
              <table className="dir-table" style={{ tableLayout: 'fixed', width: '100%' }}>
                <colgroup>
                  <col style={{ width: '18%' }} /><col style={{ width: '24%' }} /><col style={{ width: '13%' }} />
                  <col style={{ width: '17%' }} /><col style={{ width: '14%' }} /><col style={{ width: '14%' }} />
                </colgroup>
                <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Permission</th><th>Status</th><th></th></tr></thead>
                <tbody>{supers.map(m => <MemberRow key={m.id} member={m} />)}</tbody>
              </table>
            )}
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-header-left">
                <div className="card-title">Personnel Roster (this job)</div>
                <div className="card-subtitle">Inherited automatically from the company-wide roster. Remove someone from just this job below — to add or edit roster members, go to the company Directory.</div>
              </div>
              <button className="btn btn-sm" onClick={() => navigate('directory')}><i className="ti ti-external-link" /> Manage company roster</button>
            </div>
            <SearchBar value={rosterSearch} onChange={setRosterSearch} placeholder="Search this job's roster..." />
            {filteredJobRoster.length === 0 ? <p style={{ color: '#aaa', fontSize: 13, padding: '8px 0', fontStyle: 'italic' }}>No personnel on this job's roster.</p> : (
              filteredJobRoster.map(w => {
                const cls = state.classifications.find(c => c.id === w.classId);
                return (
                  <div key={w.id} className="list-row">
                    <div className="row-icon">{initials(w.first + ' ' + w.last)}</div>
                    <div className="row-body">
                      <div className="row-title">{w.first} {w.last}</div>
                      <div className="row-sub">{cls?.name || 'No classification'}</div>
                    </div>
                    <div className="row-actions">
                      <button className="btn btn-sm btn-danger" onClick={() => removeFromJobRoster(w)}>Remove from job</button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="card">
            <div className="card-header"><div className="card-title">Project contacts</div></div>
            <table className="dir-table" style={{ tableLayout: 'fixed', width: '100%' }}>
              <colgroup>
                <col style={{ width: '20%' }} /><col style={{ width: '80%' }} />
              </colgroup>
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

      <Modal open={showAddUser} onClose={() => setShowAddUser(false)} title={`Add ${roleLabel[addUserRole]}`}
        footer={<>
          <button className="btn" onClick={() => setShowAddUser(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={saveUser}><i className="ti ti-check" /> Add to job</button>
        </>}>

        <SearchBar value={userSearch} onChange={setUserSearch} placeholder={addUserRole === 'super' ? 'Search GC superintendents...' : 'Search internal team...'} />

        <div style={{ maxHeight: 280, overflowY: 'auto', marginBottom: addUserRole !== 'super' ? 16 : 0 }}>
          {addUserRole === 'super' ? (
            availableSupers.length === 0
              ? <p style={{ color: '#aaa', fontSize: 13, padding: 12 }}>No available superintendents. Add one in the GC Directory first.</p>
              : availableSupers.map(s => {
                const co = state.gcCompanies.find(c => c.id === s.gcCompanyId);
                const selected = selectedSourceId === s.id;
                return (
                  <div key={s.id} className="list-row clickable" onClick={() => setSelectedSourceId(s.id)}
                    style={{ background: selected ? '#EBF3FB' : 'transparent', borderRadius: 8, padding: '10px 8px' }}>
                    <div className="row-icon">{initials(s.first + ' ' + s.last)}</div>
                    <div className="row-body">
                      <div className="row-title">{s.first} {s.last} {selected && <i className="ti ti-check" style={{ color: '#185FA5', marginLeft: 4 }} />}</div>
                      <div className="row-sub">{co?.name || ''} · {s.email}</div>
                    </div>
                  </div>
                );
              })
          ) : (
            availableInternal.length === 0
              ? <p style={{ color: '#aaa', fontSize: 13, padding: 12 }}>No available {roleLabel[addUserRole].toLowerCase()}s. Add one in the Internal Team directory first, or everyone available is already on this job.</p>
              : availableInternal.map(it => {
                const selected = selectedSourceId === it.id;
                return (
                  <div key={it.id} className="list-row clickable" onClick={() => setSelectedSourceId(it.id)}
                    style={{ background: selected ? '#EBF3FB' : 'transparent', borderRadius: 8, padding: '10px 8px' }}>
                    <div className="row-icon">{initials(it.first + ' ' + it.last)}</div>
                    <div className="row-body">
                      <div className="row-title">{it.first} {it.last} {selected && <i className="ti ti-check" style={{ color: '#185FA5', marginLeft: 4 }} />}</div>
                      <div className="row-sub">{it.role ? it.role + ' · ' : ''}{it.email}</div>
                    </div>
                  </div>
                );
              })
          )}
        </div>

        {addUserRole !== 'super' && (
          <FormGroup label="Permission level for this job">
            <Select value={selectedPermission} onChange={setSelectedPermission}
              options={PERMISSION_LEVELS.map(p => ({ value: p.value, label: p.label }))} />
            <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>
              {PERMISSION_LEVELS.find(p => p.value === selectedPermission)?.description}
            </div>
          </FormGroup>
        )}
      </Modal>

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

      <ConfirmModal open={!!confirmRemoveRoster} onClose={() => setConfirmRemoveRoster(null)}
        onConfirm={() => { dispatch({ type: 'REMOVE_ROSTER_FROM_JOB', jobId: job.id, workerId: confirmRemoveRoster.id }); setConfirmRemoveRoster(null); }}
        title="Remove from this job" message={`Remove ${confirmRemoveRoster?.first} ${confirmRemoveRoster?.last} from this job's roster? They'll remain in the company-wide Personnel Roster and can be re-added to this job later.`} danger />

      <ConfirmModal open={!!confirmStatusChange} onClose={() => setConfirmStatusChange(null)}
        onConfirm={() => changeJobStatus(confirmStatusChange.to)}
        title={
          confirmStatusChange?.to === 'completed' ? (job.status === 'archived' ? 'Unarchive job' : 'Mark job as Complete')
          : confirmStatusChange?.to === 'archived' ? 'Archive job'
          : 'Reopen job'
        }
        message={
          confirmStatusChange?.to === 'completed'
            ? (job.status === 'archived'
                ? `Move "${job.num} — ${job.name}" back to Completed? Nothing is deleted — it'll reappear in your Completed jobs list.`
                : `Mark "${job.num} — ${job.name}" as Complete? Nothing is deleted — all packages and tickets stay exactly as they are. It just moves out of the active job list.`)
            : confirmStatusChange?.to === 'archived'
            ? `Archive "${job.num} — ${job.name}"? Nothing is deleted — it'll be tucked away out of the main list, and can be unarchived anytime from the Archived tab.`
            : `Reopen "${job.num} — ${job.name}"? It'll move back into your active job list.`
        } />

      {/* Shows the real invite link after generating one — there's no automatic email
          sending yet (that needs a backend email service), so for now this is copy-and-send. */}
      <Modal open={!!inviteLink} onClose={() => setInviteLink(null)} title="Invite link ready"
        footer={<button className="btn btn-primary" onClick={() => setInviteLink(null)}>Done</button>}>
        <p style={{ fontSize: 13, color: '#666', marginBottom: 12 }}>
          Copy this link and send it to them yourself (email, text, however you'd like) — automatic email sending isn't built yet.
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <input className="form-input" readOnly value={inviteLink || ''} style={{ flex: 1, fontSize: 12 }} onClick={e => e.target.select()} />
          <button className="btn" onClick={() => { navigator.clipboard.writeText(inviteLink); alert('Copied!'); }}>
            <i className="ti ti-copy" /> Copy
          </button>
        </div>
      </Modal>
    </div>
  );
}

// src/pages/JobDetail.jsx
import React, { useState } from 'react';
import { useStore } from '../data/store';
import { genId, fmt, calcPackageTotals, pkgStatusInfo, buildPkgNum, AUTH_TYPES, initials } from '../utils/helpers';
import { Breadcrumb, Badge, Modal, FormGroup, Input, Select, EmptyState, ConfirmModal } from '../components/UI';

export default function JobDetail({ jobId, navigate, initialView }) {
  const { state, dispatch } = useStore();
  const job = state.jobs.find(j => j.id === jobId);
  const [view, setView] = useState(initialView || null); // null = summary only, 'packages', 'directory'
  const [showNewPkg, setShowNewPkg] = useState(false);
  const [editPkg, setEditPkg] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [pkgForm, setPkgForm] = useState({ title: '', authType: 'Change Event', authRef: '', authFileName: null, numSystem: 'TM-{seq}', customNum: '' });

  if (!job) return <div className="card"><p style={{ color: '#999' }}>Job not found.</p></div>;

  const openPkgs = job.packages.filter(p => p.tickets.some(t => ['draft', 'pending-sig'].includes(t.status)));
  const pendingPkgs = job.packages.filter(p => p.tickets.some(t => t.status === 'submitted'));
  const executedPkgs = job.packages.filter(p => p.tickets.length > 0 && p.tickets.every(t => ['signed', 'approved'].includes(t.status)));
  const executed = job.packages.reduce((s, p) => s + calcPackageTotals(p).executed, 0);

  function openNewPkg() {
    setPkgForm({ title: '', authType: 'Change Event', authRef: '', authFileName: null, numSystem: 'TM-{seq}', customNum: '' });
    setEditPkg(null);
    setShowNewPkg(true);
  }

  function openEditPkg(pkg) {
    setPkgForm({ title: pkg.title, authType: pkg.authType, authRef: pkg.authRef || '', authFileName: pkg.authFileName, numSystem: pkg.numSystem || 'TM-{seq}', customNum: '' });
    setEditPkg(pkg);
    setShowNewPkg(true);
  }

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
    setConfirmDelete(pkg);
  }

  return (
    <div>
      <Breadcrumb items={[
        { label: 'Dashboard', onClick: () => navigate('dashboard') },
        { label: job.num + ' - ' + job.name }
      ]} />

      {/* THREE SUMMARY BOXES — always visible */}
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

      {/* No content selected yet */}
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
          {/* Superintendents */}
          <div className="card">
            <div className="card-header">
              <div className="card-header-left">
                <div className="card-title">Superintendents</div>
                <div className="card-subtitle">GC field supervisors on {job.num}</div>
              </div>
              <button className="btn btn-sm" onClick={() => navigate('job-setup', { jobId: job.id })}>
                <i className="ti ti-settings" /> Manage
              </button>
            </div>
            {job.supers.length === 0 ? (
              <div style={{ color: '#aaa', fontSize: 13, padding: '12px 0', fontStyle: 'italic' }}>No superintendents assigned. Add them in Job Setup.</div>
            ) : (
              <table className="dir-table">
                <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Company</th></tr></thead>
                <tbody>
                  {job.supers.map(s => (
                    <tr key={s.id}>
                      <td><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="av" style={{ width: 28, height: 28, fontSize: 10 }}>{initials(s.name)}</div>
                        <span style={{ fontWeight: 600 }}>{s.name}</span>
                      </div></td>
                      <td>{s.email}</td>
                      <td>{s.phone}</td>
                      <td>{job.gc}</td>
                    </tr>
                  ))}
                </tbody>
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

          {/* Personnel roster */}
          <div className="card">
            <div className="card-header">
              <div className="card-header-left"><div className="card-title">Field personnel roster</div></div>
              <button className="btn btn-sm" onClick={() => navigate('job-setup', { jobId: job.id })}><i className="ti ti-settings" /> Manage</button>
            </div>
            {job.workers.length === 0 ? (
              <div style={{ color: '#aaa', fontSize: 13, padding: '12px 0', fontStyle: 'italic' }}>No workers assigned. Add them in Job Setup.</div>
            ) : (
              <table className="dir-table">
                <thead><tr><th>Name</th><th>Classification</th><th>Regular rate</th><th>OT rate</th></tr></thead>
                <tbody>
                  {job.workers.map(w => {
                    const cls = job.classifications.find(c => c.id === w.classId);
                    return (
                      <tr key={w.id}>
                        <td><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div className="av" style={{ width: 28, height: 28, fontSize: 10 }}>{initials(w.first + ' ' + w.last)}</div>
                          <span style={{ fontWeight: 600 }}>{w.first} {w.last}</span>
                        </div></td>
                        <td>{cls?.name || '—'}</td>
                        <td>{cls ? '$' + cls.regRate.toFixed(2) + '/hr' : '—'}</td>
                        <td>{cls ? '$' + cls.otRate.toFixed(2) + '/hr' : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

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

      <ConfirmModal open={!!confirmDelete} onClose={() => setConfirmDelete(null)}
        onConfirm={() => { dispatch({ type: 'DELETE_PKG', jobId: job.id, pkgId: confirmDelete.id }); setConfirmDelete(null); }}
        title="Delete package" message={`Delete "${confirmDelete?.num} - ${confirmDelete?.title}"? This cannot be undone.`} danger />
    </div>
  );
}

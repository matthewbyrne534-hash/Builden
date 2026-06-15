// src/pages/JobDetail.jsx
import React, { useState } from 'react';
import { useStore } from '../data/store';
import { genId, fmt, calcPackageTotals, pkgStatusInfo, buildPkgNum, AUTH_TYPES } from '../utils/helpers';
import { Breadcrumb, Badge, Modal, FormGroup, Input, Select, EmptyState, ConfirmModal } from '../components/UI';

export default function JobDetail({ jobId, navigate }) {
  const { state, dispatch } = useStore();
  const job = state.jobs.find(j => j.id === jobId);
  const [showNewPkg, setShowNewPkg] = useState(false);
  const [editPkg, setEditPkg] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [pkgForm, setPkgForm] = useState({ title: '', authType: 'Change Event', authRef: '', authFileName: null, numSystem: 'TM-{seq}', customNum: '' });

  if (!job) return <div className="card"><p style={{ color: '#999' }}>Job not found.</p></div>;

  const executed = job.packages.reduce((s, p) => s + calcPackageTotals(p, job).executed, 0);
  const openPkgs = job.packages.filter(p => p.tickets.some(t => ['draft', 'pending-sig'].includes(t.status)));
  const pendingPkgs = job.packages.filter(p => p.tickets.some(t => t.status === 'submitted'));
  const executedPkgs = job.packages.filter(p => p.tickets.length > 0 && p.tickets.every(t => ['signed', 'approved'].includes(t.status)));

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
      dispatch({ type: 'UPDATE_PACKAGE', jobId: job.id, pkgId: editPkg.id, data: { title: pkgForm.title, authType: pkgForm.authType, authRef: pkgForm.authRef, authFileName: pkgForm.authFileName, numSystem: numSys } });
      setShowNewPkg(false);
    } else {
      const seq = job.packages.length + 1;
      const num = buildPkgNum(numSys, seq);
      const pkg = { id: genId(), num, numSystem: numSys, title: pkgForm.title, authType: pkgForm.authType, authRef: pkgForm.authRef, authFileName: pkgForm.authFileName, locked: false, tickets: [] };
      dispatch({ type: 'ADD_PACKAGE', jobId: job.id, pkg });
      setShowNewPkg(false);
      navigate('package-detail', { jobId: job.id, pkgId: pkg.id });
    }
  }

  function deletePkg(pkg) {
    const hasSignedTickets = pkg.tickets.some(t => t.status !== 'draft');
    if (hasSignedTickets) { alert('Cannot delete a package with signed tickets. Use void instead.'); return; }
    setConfirmDelete(pkg);
  }

  return (
    <div>
      <Breadcrumb items={[
        { label: 'Jobs', onClick: () => navigate('jobs') },
        { label: job.num + ' — ' + job.name }
      ]} />

      <div className="stats-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-item">
          <div className="stat-label">Open / In Progress</div>
          <div className="stat-val" style={{ color: '#666' }}>{fmt(openPkgs.reduce((s, p) => s + calcPackageTotals(p, job).grand, 0))}</div>
          <div style={{ fontSize: 11, color: '#185FA5', marginTop: 3, fontWeight: 600 }}>{openPkgs.length} package{openPkgs.length !== 1 ? 's' : ''}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Pending GC Approval</div>
          <div className="stat-val" style={{ color: '#8A5000' }}>{fmt(pendingPkgs.reduce((s, p) => s + calcPackageTotals(p, job).grand, 0))}</div>
          <div style={{ fontSize: 11, color: '#8A5000', marginTop: 3, fontWeight: 600 }}>{pendingPkgs.length} package{pendingPkgs.length !== 1 ? 's' : ''}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Executed</div>
          <div className="stat-val" style={{ color: '#2A6008' }}>{fmt(executed)}</div>
          <div style={{ fontSize: 11, color: '#2A6008', marginTop: 3, fontWeight: 600 }}>{executedPkgs.length} package{executedPkgs.length !== 1 ? 's' : ''}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-header-left">
            <div className="card-title">{job.num} — {job.name}</div>
            <div className="card-subtitle">{job.gc}{job.owner ? ' · ' + job.owner : ''}{job.city ? ' · ' + job.city + ', ' + job.state : ''}</div>
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
            const tots = calcPackageTotals(p, job);
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
                  <button className="btn btn-icon btn-sm" title="Edit package" onClick={() => openEditPkg(p)}><i className="ti ti-edit" /></button>
                  <button className="btn btn-icon btn-sm btn-danger" title="Delete package" onClick={() => deletePkg(p)}><i className="ti ti-trash" /></button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* NEW / EDIT PACKAGE MODAL */}
      <Modal open={showNewPkg} onClose={() => setShowNewPkg(false)} title={editPkg ? 'Edit Package' : 'New T&M Package'}
        footer={<>
          <button className="btn" onClick={() => setShowNewPkg(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={savePkg}><i className="ti ti-check" /> {editPkg ? 'Save changes' : 'Create package'}</button>
        </>}>
        <div className="form-grid">
          <FormGroup label="Package title *"><Input value={pkgForm.title} onChange={v => setPkgForm(f => ({ ...f, title: v }))} placeholder="e.g. Power to BAS control panel — Mech Room 1" /></FormGroup>
          <div className="form-grid form-grid-2">
            <FormGroup label="Authorization type">
              <Select value={pkgForm.authType} onChange={v => setPkgForm(f => ({ ...f, authType: v }))} options={AUTH_TYPES} />
            </FormGroup>
            <FormGroup label="Reference # (optional)"><Input value={pkgForm.authRef} onChange={v => setPkgForm(f => ({ ...f, authRef: v }))} placeholder="e.g. CE-047 or RFI-022" /></FormGroup>
          </div>
          {!editPkg && (
            <FormGroup label="Ticket numbering system">
              <Select value={pkgForm.numSystem} onChange={v => setPkgForm(f => ({ ...f, numSystem: v }))} options={[
                { value: 'TM-{seq}', label: 'TM-001 (default)' },
                { value: job.num + '-TM-{seq}', label: job.num + '-TM-001' },
                { value: 'custom', label: 'Custom...' }
              ]} />
              {pkgForm.numSystem === 'custom' && (
                <Input value={pkgForm.customNum} onChange={v => setPkgForm(f => ({ ...f, customNum: v }))} placeholder="e.g. PROJ-TM-{seq}" style={{ marginTop: 8 }} />
              )}
              <div style={{ fontSize: 11, color: '#888', marginTop: 4, fontWeight: 500 }}>
                Tickets will be numbered {(pkgForm.numSystem === 'custom' ? pkgForm.customNum || 'TM-{seq}' : pkgForm.numSystem).replace('{seq}', '001')}.1, .2, .3...
              </div>
            </FormGroup>
          )}
          <FormGroup label="Upload authorization document (optional)">
            <input type="file" className="form-input" accept=".pdf,.jpg,.png,.doc,.docx"
              onChange={e => setPkgForm(f => ({ ...f, authFileName: e.target.files[0]?.name || null }))} />
            {pkgForm.authFileName && <div style={{ fontSize: 11, color: '#185FA5', marginTop: 4 }}><i className="ti ti-paperclip" /> {pkgForm.authFileName}</div>}
          </FormGroup>
        </div>
      </Modal>

      {/* CONFIRM DELETE */}
      <ConfirmModal open={!!confirmDelete} onClose={() => setConfirmDelete(null)}
        onConfirm={() => { dispatch({ type: 'DELETE_PACKAGE', jobId: job.id, pkgId: confirmDelete.id }); setConfirmDelete(null); }}
        title="Delete package" message={`Delete "${confirmDelete?.num} — ${confirmDelete?.title}"? This cannot be undone.`} danger />
    </div>
  );
}

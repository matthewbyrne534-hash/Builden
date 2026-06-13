// src/pages/Jobs.jsx
import React, { useState } from 'react';
import { useStore } from '../data/store';
import { genId, fmt, calcPackageTotals } from '../utils/helpers';
import { Modal, FormGroup, Input, EmptyState, SearchBar, ConfirmModal } from '../components/UI';

export default function Jobs({ navigate }) {
  const { state, dispatch } = useStore();
  const [showNew, setShowNew] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ num: '', desc: '', gc: '', owner: '', ae: '' });
  const [confirmDelete, setConfirmDelete] = useState(null);

  const filtered = state.jobs.filter(j =>
    !j.voided &&
    (j.num + j.desc + j.gc).toLowerCase().includes(search.toLowerCase())
  );

  function createJob() {
    if (!form.num || !form.desc) return alert('Job number and description are required.');
    const job = {
      id: genId(), num: form.num, desc: form.desc, gc: form.gc, owner: form.owner, ae: form.ae,
      locked: false, supers: [], classifications: [], workers: [], packages: []
    };
    dispatch({ type: 'ADD_JOB', job });
    setShowNew(false);
    setForm({ num: '', desc: '', gc: '', owner: '', ae: '' });
    navigate('job-setup', { jobId: job.id });
  }

  function handleDelete(job) {
    const hasSignedTickets = job.packages.some(p => p.tickets.some(t => t.status !== 'draft'));
    if (hasSignedTickets) {
      alert('This job has executed tickets and cannot be deleted. Use Void instead.');
      return;
    }
    setConfirmDelete(job);
  }

  return (
    <div>
      <SearchBar value={search} onChange={setSearch} placeholder="Search jobs by number, description, or GC..." />

      <div className="card">
        <div className="card-header">
          <div className="card-header-left">
            <div className="card-title">All Jobs</div>
          </div>
          <div className="card-actions">
            <button className="btn btn-primary btn-sm" onClick={() => setShowNew(true)}>
              <i className="ti ti-plus" /> New job
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon="building" message={search ? 'No jobs match your search.' : 'No jobs yet.'} />
        ) : (
          filtered.map(j => {
            const executed = j.packages.reduce((s, p) => s + calcPackageTotals(p, j).executed, 0);
            const inProgress = j.packages.filter(p => p.tickets.some(t => ['draft', 'pending-sig'].includes(t.status))).length;
            const pendingGC = j.packages.filter(p => p.tickets.some(t => t.status === 'submitted')).length;
            const executedPkgs = j.packages.filter(p => p.tickets.length > 0 && p.tickets.every(t => ['signed', 'approved'].includes(t.status))).length;
            return (
              <div key={j.id} className="list-row">
                <div className="row-body clickable" style={{ cursor: 'pointer' }} onClick={() => navigate('job-detail', { jobId: j.id })}>
                  <div className="row-title">{j.num} — {j.desc}</div>
                  <div className="row-sub">{j.gc}{j.owner ? ' · ' + j.owner : ''}</div>
                </div>
                <div style={{ display: 'flex', gap: 16, marginRight: 8 }}>
                  <div className="row-right">
                    <div className="row-amount" style={{ color: '#666' }}>{inProgress} open</div>
                    <div className="row-meta">{inProgress} pkg{inProgress !== 1 ? 's' : ''}</div>
                  </div>
                  <div className="row-right">
                    <div className="row-amount" style={{ color: '#8A5000' }}>{pendingGC} pending</div>
                    <div className="row-meta">{pendingGC} pkg{pendingGC !== 1 ? 's' : ''}</div>
                  </div>
                  <div className="row-right">
                    <div className="row-amount" style={{ color: '#2A6008' }}>{fmt(executed)}</div>
                    <div className="row-meta" style={{ color: '#2A6008' }}>{executedPkgs} executed</div>
                  </div>
                </div>
                <div className="row-actions">
                  <button className="btn btn-icon btn-sm" title="Job setup" onClick={() => navigate('job-setup', { jobId: j.id })}><i className="ti ti-settings" /></button>
                  <button className="btn btn-icon btn-sm btn-danger" title="Delete job" onClick={() => handleDelete(j)}><i className="ti ti-trash" /></button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* NEW JOB MODAL */}
      <Modal open={showNew} onClose={() => setShowNew(false)} title="New Job"
        footer={<>
          <button className="btn" onClick={() => setShowNew(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={createJob}><i className="ti ti-plus" /> Create job</button>
        </>}>
        <div className="form-grid form-grid-2">
          <FormGroup label="Job number *"><Input value={form.num} onChange={v => setForm(f => ({ ...f, num: v }))} placeholder="e.g. 2024-042" /></FormGroup>
          <FormGroup label="Job description *"><Input value={form.desc} onChange={v => setForm(f => ({ ...f, desc: v }))} placeholder="e.g. Downtown Hotel — Plumbing" /></FormGroup>
          <FormGroup label="General contractor"><Input value={form.gc} onChange={v => setForm(f => ({ ...f, gc: v }))} placeholder="GC company name" /></FormGroup>
          <FormGroup label="Owner"><Input value={form.owner} onChange={v => setForm(f => ({ ...f, owner: v }))} placeholder="Owner name" /></FormGroup>
          <FormGroup label="Architect / engineer" span="2"><Input value={form.ae} onChange={v => setForm(f => ({ ...f, ae: v }))} placeholder="Architect or engineer of record" /></FormGroup>
        </div>
      </Modal>

      {/* CONFIRM DELETE */}
      <ConfirmModal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => { dispatch({ type: 'DELETE_JOB', id: confirmDelete.id }); setConfirmDelete(null); }}
        title="Delete job"
        message={`Are you sure you want to delete "${confirmDelete?.num} — ${confirmDelete?.desc}"? This cannot be undone.`}
        danger
      />
    </div>
  );
}

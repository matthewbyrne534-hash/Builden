// src/pages/JobSetup.jsx
import React, { useState } from 'react';
import { useStore } from '../data/store';
import { Breadcrumb, FormGroup, Input } from '../components/UI';

export default function JobSetup({ jobId, navigate }) {
  const { state, dispatch } = useStore();
  const job = state.jobs.find(j => j.id === jobId);

  const [info, setInfo] = useState({
    name: job?.name || '', num: job?.num || '', address: job?.address || '',
    city: job?.city || '', state: job?.state || '', zip: job?.zip || '',
    gc: job?.gc || '', owner: job?.owner || '', ae: job?.ae || ''
  });

  if (!job) return <div className="card"><p style={{ color: '#999' }}>Job not found.</p></div>;

  function saveInfo() {
    dispatch({ type: 'UPDATE_JOB', id: job.id, data: { name: info.name, num: info.num, address: info.address, city: info.city, state: info.state, zip: info.zip, gc: info.gc, owner: info.owner, ae: info.ae } });
    navigate('job-detail', { jobId: job.id, view: 'packages' });
  }

  function cancel() {
    navigate('job-detail', { jobId: job.id, view: 'packages' });
  }

  return (
    <div>
      <Breadcrumb items={[
        { label: 'Dashboard', onClick: () => navigate('dashboard') },
        { label: job.num, onClick: () => navigate('job-detail', { jobId: job.id, view: 'packages' }) },
        { label: 'Job Setup' }
      ]} />

      <div className="card">
        <div className="card-header"><div className="card-title">Job Information</div></div>
        <div className="form-grid form-grid-2">
          <FormGroup label="Job name"><Input value={info.name} onChange={v => setInfo(f => ({ ...f, name: v }))} /></FormGroup>
          <FormGroup label="Job number"><Input value={info.num} onChange={v => setInfo(f => ({ ...f, num: v }))} /></FormGroup>
          <FormGroup label="Address" span="2"><Input value={info.address} onChange={v => setInfo(f => ({ ...f, address: v }))} /></FormGroup>
          <FormGroup label="City"><Input value={info.city} onChange={v => setInfo(f => ({ ...f, city: v }))} /></FormGroup>
          <FormGroup label="State"><Input value={info.state} onChange={v => setInfo(f => ({ ...f, state: v }))} /></FormGroup>
          <FormGroup label="ZIP"><Input value={info.zip} onChange={v => setInfo(f => ({ ...f, zip: v }))} /></FormGroup>
          <FormGroup label="General contractor"><Input value={info.gc} onChange={v => setInfo(f => ({ ...f, gc: v }))} /></FormGroup>
          <FormGroup label="Owner"><Input value={info.owner} onChange={v => setInfo(f => ({ ...f, owner: v }))} /></FormGroup>
          <FormGroup label="Architect / engineer" span="2"><Input value={info.ae} onChange={v => setInfo(f => ({ ...f, ae: v }))} /></FormGroup>
        </div>
      </div>

      <div className="notice notice-info">
        <i className="ti ti-info-circle" />
        <span>Labor classifications, rates, and the Personnel Roster are managed company-wide in the Directory, and automatically carry over to every job. To make changes, go to <strong>Directory &rarr; Personnel Roster</strong>.</span>
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
        <button className="btn" onClick={cancel}>Cancel</button>
        <button className="btn btn-primary" onClick={saveInfo}><i className="ti ti-check" /> Save job setup</button>
      </div>
    </div>
  );
}

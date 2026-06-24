// src/pages/JobSetup.jsx
import React, { useState } from 'react';
import { useStore } from '../data/store';
import { getJobRoster } from '../utils/helpers';
import { Breadcrumb, FormGroup, Input } from '../components/UI';

export default function JobSetup({ jobId, navigate }) {
  const { state, dispatch } = useStore();
  const job = state.jobs.find(j => j.id === jobId);

  const [info, setInfo] = useState({
    name: job?.name || '', num: job?.num || '', address: job?.address || '',
    city: job?.city || '', state: job?.state || '', zip: job?.zip || '',
    gc: job?.gc || '', owner: job?.owner || '', ae: job?.ae || ''
  });

  // Local editable copy of this job's rate table, keyed by classId
  const [rateForm, setRateForm] = useState(() => {
    const map = {};
    (job?.classificationRates || []).forEach(r => { map[r.classId] = { regRate: String(r.regRate ?? ''), otRate: String(r.otRate ?? ''), dtRate: String(r.dtRate ?? '') }; });
    return map;
  });

  if (!job) return <div className="card"><p style={{ color: '#999' }}>Job not found.</p></div>;

  // Which classifications actually appear in this job's inherited roster
  const jobRoster = getJobRoster(job, state.personnelRoster);
  const usedClassIds = [...new Set(jobRoster.map(w => w.classId).filter(Boolean))];
  const usedClassifications = usedClassIds
    .map(id => state.classifications.find(c => c.id === id))
    .filter(Boolean);

  function setRate(classId, field, value) {
    setRateForm(f => ({ ...f, [classId]: { ...(f[classId] || {}), [field]: value } }));
  }

  function saveInfo() {
    dispatch({ type: 'UPDATE_JOB', id: job.id, data: { name: info.name, num: info.num, address: info.address, city: info.city, state: info.state, zip: info.zip, gc: info.gc, owner: info.owner, ae: info.ae } });
    // Persist rate table for every classification used on this job's roster
    usedClassifications.forEach(c => {
      const r = rateForm[c.id] || {};
      dispatch({ type: 'SET_JOB_CLASSIFICATION_RATE', jobId: job.id, classId: c.id, rates: {
        regRate: parseFloat(r.regRate) || 0,
        otRate: parseFloat(r.otRate) || 0,
        dtRate: parseFloat(r.dtRate) || 0
      }});
    });
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

      <div className="card">
        <div className="card-header">
          <div className="card-header-left">
            <div className="card-title">Labor Classifications &amp; Rates</div>
            <div className="card-subtitle">Rates are set per job since they can vary by prevailing wage, union agreement, or region. Classifications shown here come from this job's inherited Personnel Roster.</div>
          </div>
        </div>
        {usedClassifications.length === 0 ? (
          <p style={{ color: '#aaa', fontSize: 13, padding: '8px 0' }}>
            This job's Personnel Roster doesn't have any classifications yet. Add workers to the company-wide roster in the Directory first — they'll automatically appear here once they're on this job.
          </p>
        ) : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>Classification</th><th>Regular rate ($/hr)</th><th>OT rate ($/hr)</th><th>DT rate ($/hr)</th></tr></thead>
              <tbody>
                {usedClassifications.map(c => {
                  const r = rateForm[c.id] || { regRate: '', otRate: '', dtRate: '' };
                  return (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 600 }}>{c.name}</td>
                      <td><input className="tbl-input" type="number" min="0" step="0.01" value={r.regRate} onChange={e => setRate(c.id, 'regRate', e.target.value)} placeholder="0.00" style={{ width: 100 }} /></td>
                      <td><input className="tbl-input" type="number" min="0" step="0.01" value={r.otRate} onChange={e => setRate(c.id, 'otRate', e.target.value)} placeholder="0.00" style={{ width: 100 }} /></td>
                      <td><input className="tbl-input" type="number" min="0" step="0.01" value={r.dtRate} onChange={e => setRate(c.id, 'dtRate', e.target.value)} placeholder="0.00" style={{ width: 100 }} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="notice notice-info">
        <i className="ti ti-info-circle" />
        <span>The Personnel Roster itself (names and classifications) is managed company-wide in the Directory and automatically carries over to every job. To add or edit workers, go to <strong>Directory &rarr; Personnel Roster</strong>.</span>
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
        <button className="btn" onClick={cancel}>Cancel</button>
        <button className="btn btn-primary" onClick={saveInfo}><i className="ti ti-check" /> Save job setup</button>
      </div>
    </div>
  );
}

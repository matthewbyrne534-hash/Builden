// src/pages/JobSetup.jsx
import React, { useState } from 'react';
import { useStore } from '../data/store';
import { genId, initials } from '../utils/helpers';
import { Breadcrumb, Modal, FormGroup, Input, Select, ConfirmModal } from '../components/UI';

export default function JobSetup({ jobId, navigate }) {
  const { state, dispatch } = useStore();
  const job = state.jobs.find(j => j.id === jobId);

  const [info, setInfo] = useState({
    name: job?.name || '', num: job?.num || '', address: job?.address || '',
    city: job?.city || '', state: job?.state || '', zip: job?.zip || '',
    gc: job?.gc || '', owner: job?.owner || '', ae: job?.ae || ''
  });

  const [showCls, setShowCls] = useState(false);
  const [editCls, setEditCls] = useState(null);
  const [clsForm, setClsForm] = useState({ name: '', regRate: '', otRate: '', dtRate: '' });

  const [showWorker, setShowWorker] = useState(false);
  const [editWorker, setEditWorker] = useState(null);
  const [workerForm, setWorkerForm] = useState({ first: '', last: '', classId: '' });

  const [confirmRemoveCls, setConfirmRemoveCls] = useState(null);
  const [confirmRemoveWorker, setConfirmRemoveWorker] = useState(null);

  if (!job) return <div className="card"><p style={{ color: '#999' }}>Job not found.</p></div>;

  function saveInfo() {
    dispatch({ type: 'UPDATE_JOB', id: job.id, data: { name: info.name, num: info.num, address: info.address, city: info.city, state: info.state, zip: info.zip, gc: info.gc, owner: info.owner, ae: info.ae } });
    navigate('job-detail', { jobId: job.id, view: 'packages' });
  }

  function cancel() {
    navigate('job-detail', { jobId: job.id, view: 'packages' });
  }

  // Classifications
  function openAddCls() { setClsForm({ name: '', regRate: '', otRate: '', dtRate: '' }); setEditCls(null); setShowCls(true); }
  function openEditCls(cls) { setClsForm({ name: cls.name, regRate: String(cls.regRate || ''), otRate: String(cls.otRate || ''), dtRate: String(cls.dtRate || '') }); setEditCls(cls); setShowCls(true); }
  function saveCls() {
    if (!clsForm.name || !clsForm.regRate) return alert('Name and regular rate are required.');
    const cls = { id: editCls?.id || genId(), name: clsForm.name, regRate: parseFloat(clsForm.regRate) || 0, otRate: parseFloat(clsForm.otRate) || 0, dtRate: parseFloat(clsForm.dtRate) || 0 };
    dispatch({ type: editCls ? 'UPDATE_CLS' : 'ADD_CLS', jobId: job.id, cls });
    setShowCls(false);
  }

  // Workers
  function openAddWorker() { setWorkerForm({ first: '', last: '', classId: job.classifications[0]?.id || '' }); setEditWorker(null); setShowWorker(true); }
  function openEditWorker(w) { setWorkerForm({ first: w.first, last: w.last, classId: w.classId }); setEditWorker(w); setShowWorker(true); }
  function saveWorker() {
    if (!workerForm.first || !workerForm.last) return alert('First and last name are required.');
    const worker = { id: editWorker?.id || genId(), first: workerForm.first, last: workerForm.last, classId: workerForm.classId };
    dispatch({ type: editWorker ? 'UPDATE_WORKER' : 'ADD_WORKER', jobId: job.id, worker });
    setShowWorker(false);
  }

  return (
    <div>
      <Breadcrumb items={[
        { label: 'Dashboard', onClick: () => navigate('dashboard') },
        { label: job.num, onClick: () => navigate('job-detail', { jobId: job.id, view: 'packages' }) },
        { label: 'Job Setup' }
      ]} />

      {/* JOB INFO */}
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

      {/* CLASSIFICATIONS */}
      <div className="card">
        <div className="card-header">
          <div className="card-header-left">
            <div className="card-title">Labor Classifications &amp; Rates</div>
            <div className="card-subtitle">Rates applied when PM prepares the package</div>
          </div>
          <div className="card-actions"><button className="btn btn-sm" onClick={openAddCls}><i className="ti ti-plus" /> Add classification</button></div>
        </div>
        {job.classifications.length === 0 ? (
          <p style={{ color: '#aaa', fontSize: 13, padding: '8px 0' }}>No classifications added yet.</p>
        ) : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>Classification</th><th>Regular rate</th><th>OT rate</th><th>DT rate</th><th style={{ width: 80 }}></th></tr></thead>
              <tbody>
                {job.classifications.map(c => (
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

      {/* PERSONNEL ROSTER */}
      <div className="card">
        <div className="card-header">
          <div className="card-header-left">
            <div className="card-title">Personnel Roster</div>
            <div className="card-subtitle">Field workers the foreman selects from when filling out T&M tickets — not platform users</div>
          </div>
          <div className="card-actions"><button className="btn btn-sm" onClick={openAddWorker}><i className="ti ti-plus" /> Add worker</button></div>
        </div>
        {job.workers.length === 0 ? (
          <p style={{ color: '#aaa', fontSize: 13, padding: '8px 0' }}>No workers added yet.</p>
        ) : (
          job.workers.map(w => {
            const cls = job.classifications.find(c => c.id === w.classId);
            return (
              <div key={w.id} className="list-row">
                <div className="row-icon">{initials(w.first + ' ' + w.last)}</div>
                <div className="row-body">
                  <div className="row-title">{w.first} {w.last}</div>
                  <div className="row-sub">{cls ? cls.name : 'No classification'}</div>
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

      {/* SAVE FOOTER */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
        <button className="btn" onClick={cancel}>Cancel</button>
        <button className="btn btn-primary" onClick={saveInfo}><i className="ti ti-check" /> Save job setup</button>
      </div>

      {/* CLASSIFICATION MODAL */}
      <Modal open={showCls} onClose={() => setShowCls(false)} title={editCls ? 'Edit Classification' : 'Add Classification'}
        footer={<><button className="btn" onClick={() => setShowCls(false)}>Cancel</button><button className="btn btn-primary" onClick={saveCls}><i className="ti ti-check" /> Save</button></>}>
        <div className="form-grid form-grid-2">
          <FormGroup label="Classification name *" span="2"><Input value={clsForm.name} onChange={v => setClsForm(f => ({ ...f, name: v }))} placeholder="e.g. Foreman, Electrician, Laborer" /></FormGroup>
          <FormGroup label="Regular rate ($/hr) *"><Input type="number" value={clsForm.regRate} onChange={v => setClsForm(f => ({ ...f, regRate: v }))} placeholder="0.00" /></FormGroup>
          <FormGroup label="OT rate ($/hr)"><Input type="number" value={clsForm.otRate} onChange={v => setClsForm(f => ({ ...f, otRate: v }))} placeholder="0.00" /></FormGroup>
          <FormGroup label="DT rate ($/hr)"><Input type="number" value={clsForm.dtRate} onChange={v => setClsForm(f => ({ ...f, dtRate: v }))} placeholder="0.00" /></FormGroup>
        </div>
      </Modal>

      {/* WORKER MODAL */}
      <Modal open={showWorker} onClose={() => setShowWorker(false)} title={editWorker ? 'Edit Worker' : 'Add Worker'}
        footer={<><button className="btn" onClick={() => setShowWorker(false)}>Cancel</button><button className="btn btn-primary" onClick={saveWorker}><i className="ti ti-check" /> Save</button></>}>
        <div className="form-grid form-grid-2">
          <FormGroup label="First name *"><Input value={workerForm.first} onChange={v => setWorkerForm(f => ({ ...f, first: v }))} placeholder="First" /></FormGroup>
          <FormGroup label="Last name *"><Input value={workerForm.last} onChange={v => setWorkerForm(f => ({ ...f, last: v }))} placeholder="Last" /></FormGroup>
          <FormGroup label="Classification" span="2">
            <Select value={workerForm.classId} onChange={v => setWorkerForm(f => ({ ...f, classId: v }))}
              options={job.classifications.map(c => ({ value: c.id, label: c.name + ' - $' + (c.regRate || 0).toFixed(2) + '/hr' }))}
              placeholder="- Select classification -" />
          </FormGroup>
        </div>
      </Modal>

      {/* CONFIRM MODALS */}
      <ConfirmModal open={!!confirmRemoveCls} onClose={() => setConfirmRemoveCls(null)} title="Remove classification"
        message={`Remove "${confirmRemoveCls?.name}" from this job?`} danger
        onConfirm={() => { dispatch({ type: 'REMOVE_CLS', jobId: job.id, clsId: confirmRemoveCls.id }); setConfirmRemoveCls(null); }} />
      <ConfirmModal open={!!confirmRemoveWorker} onClose={() => setConfirmRemoveWorker(null)} title="Remove worker"
        message={`Remove ${confirmRemoveWorker?.first} ${confirmRemoveWorker?.last} from this job?`} danger
        onConfirm={() => { dispatch({ type: 'REMOVE_WORKER', jobId: job.id, workerId: confirmRemoveWorker.id }); setConfirmRemoveWorker(null); }} />
    </div>
  );
}

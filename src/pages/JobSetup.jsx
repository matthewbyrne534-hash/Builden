// src/pages/JobSetup.jsx
import React, { useState } from 'react';
import { useStore } from '../data/store';
import { genId, initials } from '../utils/helpers';
import { Breadcrumb, Modal, FormGroup, Input, Select, ConfirmModal, Tabs, SearchBar } from '../components/UI';

export default function JobSetup({ jobId, navigate }) {
  const { state, dispatch } = useStore();
  const job = state.jobs.find(j => j.id === jobId);

  const [info, setInfo] = useState({ num: job?.num || '', desc: job?.desc || '', gc: job?.gc || '', owner: job?.owner || '', ae: job?.ae || '' });
  // Classification modal
  const [showCls, setShowCls] = useState(false);
  const [editCls, setEditCls] = useState(null);
  const [clsForm, setClsForm] = useState({ name: '', rate: '', ohp: '10' });

  // Worker modal
  const [showWorker, setShowWorker] = useState(false);
  const [editWorker, setEditWorker] = useState(null);
  const [workerForm, setWorkerForm] = useState({ first: '', last: '', classId: '' });

  // Super modal
  const [showSuper, setShowSuper] = useState(false);
  const [superTab, setSuperTab] = useState('dir');
  const [selectedDirContact, setSelectedDirContact] = useState(null);
  const [superSearch, setSuperSearch] = useState('');
  const [superForm, setSuperForm] = useState({ name: '', email: '', phone: '' });
  const [confirmRemoveSuper, setConfirmRemoveSuper] = useState(null);
  const [confirmRemoveCls, setConfirmRemoveCls] = useState(null);
  const [confirmRemoveWorker, setConfirmRemoveWorker] = useState(null);

  if (!job) return <div className="card"><p style={{ color: '#999' }}>Job not found.</p></div>;

  function saveInfo() {
    dispatch({ type: 'UPDATE_JOB', id: job.id, data: { num: info.num, desc: info.desc, gc: info.gc, owner: info.owner, ae: info.ae } });
    navigate('job-detail', { jobId: job.id });
  }

  // Classifications
  function openAddCls() { setClsForm({ name: '', rate: '', ohp: '10' }); setEditCls(null); setShowCls(true); }
  function openEditCls(cls) { setClsForm({ name: cls.name, rate: String(cls.rate), ohp: String(cls.ohp) }); setEditCls(cls); setShowCls(true); }
  function saveCls() {
    if (!clsForm.name || !clsForm.rate) return alert('Name and rate are required.');
    const cls = { id: editCls?.id || genId(), name: clsForm.name, rate: parseFloat(clsForm.rate) || 0, ohp: parseFloat(clsForm.ohp) || 0 };
    if (editCls) { dispatch({ type: 'UPDATE_CLASSIFICATION', jobId: job.id, cls }); }
    else { dispatch({ type: 'ADD_CLASSIFICATION', jobId: job.id, cls }); }
    setShowCls(false);
  }

  // Workers
  function openAddWorker() { setWorkerForm({ first: '', last: '', classId: job.classifications[0]?.id || '' }); setEditWorker(null); setShowWorker(true); }
  function openEditWorker(w) { setWorkerForm({ first: w.first, last: w.last, classId: w.classId }); setEditWorker(w); setShowWorker(true); }
  function saveWorker() {
    if (!workerForm.first || !workerForm.last) return alert('First and last name are required.');
    const worker = { id: editWorker?.id || genId(), first: workerForm.first, last: workerForm.last, classId: workerForm.classId };
    if (editWorker) { dispatch({ type: 'UPDATE_WORKER', jobId: job.id, worker }); }
    else { dispatch({ type: 'ADD_WORKER', jobId: job.id, worker }); }
    setShowWorker(false);
  }

  // Superintendents
  function openSuperModal() { setSelectedDirContact(null); setSuperForm({ name: '', email: '', phone: '' }); setSuperSearch(''); setSuperTab('dir'); setShowSuper(true); }
  function saveSuper() {
    if (superTab === 'dir') {
      if (!selectedDirContact) return alert('Please select a contact from the directory.');
      const c = state.directory.contacts.find(x => x.id === selectedDirContact);
      if (c) dispatch({ type: 'ADD_SUPER', jobId: job.id, super: { id: genId(), name: c.first + ' ' + c.last, email: c.email, phone: c.phone } });
    } else {
      if (!superForm.name) return alert('Name is required.');
      dispatch({ type: 'ADD_SUPER', jobId: job.id, super: { id: genId(), ...superForm } });
      // Also save to directory
      dispatch({ type: 'ADD_CONTACT', contact: { id: genId(), companyId: '', first: superForm.name.split(' ')[0] || superForm.name, last: superForm.name.split(' ').slice(1).join(' ') || '', title: 'Superintendent', phone: superForm.phone, email: superForm.email } });
    }
    setShowSuper(false);
  }

  const filteredDirContacts = state.directory.contacts.filter(c =>
    (c.first + ' ' + c.last + c.email).toLowerCase().includes(superSearch.toLowerCase())
  );

  return (
    <div>
      <Breadcrumb items={[
        { label: 'Jobs', onClick: () => navigate('jobs') },
        { label: job.num, onClick: () => navigate('job-detail', { jobId: job.id }) },
        { label: 'Job Setup' }
      ]} />

      {/* JOB INFO */}
      <div className="card">
        <div className="card-header"><div className="card-title">Job Information</div></div>
        <div className="form-grid form-grid-2">
          <FormGroup label="Job number"><Input value={info.num} onChange={v => setInfo(f => ({ ...f, num: v }))} /></FormGroup>
          <FormGroup label="Job description"><Input value={info.desc} onChange={v => setInfo(f => ({ ...f, desc: v }))} /></FormGroup>
          <FormGroup label="General contractor"><Input value={info.gc} onChange={v => setInfo(f => ({ ...f, gc: v }))} /></FormGroup>
          <FormGroup label="Owner"><Input value={info.owner} onChange={v => setInfo(f => ({ ...f, owner: v }))} /></FormGroup>
          <FormGroup label="Architect / engineer" span="2"><Input value={info.ae} onChange={v => setInfo(f => ({ ...f, ae: v }))} /></FormGroup>
        </div>
      </div>

      {/* SUPERINTENDENTS */}
      <div className="card">
        <div className="card-header">
          <div className="card-header-left"><div className="card-title">Superintendents</div><div className="card-subtitle">GC field supervisors who sign T&M tickets</div></div>
          <div className="card-actions"><button className="btn btn-sm" onClick={openSuperModal}><i className="ti ti-plus" /> Add superintendent</button></div>
        </div>
        {job.supers.length === 0 ? <p style={{ color: '#aaa', fontSize: 13, padding: '8px 0' }}>No superintendents added yet.</p> : (
          job.supers.map(s => (
            <div key={s.id} className="list-row">
              <div className="row-icon">{initials(s.name)}</div>
              <div className="row-body"><div className="row-title">{s.name}</div><div className="row-sub">{s.email}{s.phone ? ' · ' + s.phone : ''}</div></div>
              <div className="row-actions"><button className="btn btn-icon btn-sm btn-danger" onClick={() => setConfirmRemoveSuper(s)}><i className="ti ti-trash" /></button></div>
            </div>
          ))
        )}
      </div>

      {/* CLASSIFICATIONS */}
      <div className="card">
        <div className="card-header">
          <div className="card-header-left"><div className="card-title">Labor Classifications &amp; Rates</div><div className="card-subtitle">These rates auto-fill on T&M tickets</div></div>
          <div className="card-actions"><button className="btn btn-sm" onClick={openAddCls}><i className="ti ti-plus" /> Add classification</button></div>
        </div>
        {job.classifications.length === 0 ? <p style={{ color: '#aaa', fontSize: 13, padding: '8px 0' }}>No classifications added yet.</p> : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>Classification</th><th>Regular rate</th><th>OT rate (1.5x)</th><th>DT rate (2x)</th><th>OH&P %</th><th style={{ width: 80 }}></th></tr></thead>
              <tbody>
                {job.classifications.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600 }}>{c.name}</td>
                    <td>${c.rate.toFixed(2)}/hr</td>
                    <td>${(c.rate * 1.5).toFixed(2)}/hr</td>
                    <td>${(c.rate * 2).toFixed(2)}/hr</td>
                    <td>{c.ohp}%</td>
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

      {/* WORKERS */}
      <div className="card">
        <div className="card-header">
          <div className="card-header-left"><div className="card-title">Personnel Roster</div><div className="card-subtitle">Workers available for selection on field tickets</div></div>
          <div className="card-actions"><button className="btn btn-sm" onClick={openAddWorker}><i className="ti ti-plus" /> Add worker</button></div>
        </div>
        {job.workers.length === 0 ? <p style={{ color: '#aaa', fontSize: 13, padding: '8px 0' }}>No workers added yet.</p> : (
          job.workers.map(w => {
            const cls = job.classifications.find(c => c.id === w.classId);
            return (
              <div key={w.id} className="list-row">
                <div className="row-icon">{initials(w.first + ' ' + w.last)}</div>
                <div className="row-body"><div className="row-title">{w.first} {w.last}</div><div className="row-sub">{cls ? cls.name + ' · $' + cls.rate.toFixed(2) + '/hr' : 'No classification'}</div></div>
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
        <button className="btn" onClick={() => navigate('job-detail', { jobId: job.id })}>Cancel</button>
        <button className="btn btn-primary" onClick={saveInfo}><i className="ti ti-check" /> Save job setup</button>
      </div>

      {/* CLASSIFICATION MODAL */}
      <Modal open={showCls} onClose={() => setShowCls(false)} title={editCls ? 'Edit Classification' : 'Add Classification'}
        footer={<><button className="btn" onClick={() => setShowCls(false)}>Cancel</button><button className="btn btn-primary" onClick={saveCls}><i className="ti ti-check" /> Save</button></>}>
        <div className="form-grid form-grid-2">
          <FormGroup label="Classification name *" span="2"><Input value={clsForm.name} onChange={v => setClsForm(f => ({ ...f, name: v }))} placeholder="e.g. Foreman, Electrician, Laborer" /></FormGroup>
          <FormGroup label="Regular rate ($/hr) *"><Input type="number" value={clsForm.rate} onChange={v => setClsForm(f => ({ ...f, rate: v }))} placeholder="0.00" /></FormGroup>
          <FormGroup label="Default OH&P %"><Input type="number" value={clsForm.ohp} onChange={v => setClsForm(f => ({ ...f, ohp: v }))} placeholder="10" /></FormGroup>
        </div>
        {clsForm.rate && <div style={{ fontSize: 12, color: '#888', marginTop: 8, padding: '8px 12px', background: '#fafaf8', borderRadius: 8 }}>OT: ${(parseFloat(clsForm.rate || 0) * 1.5).toFixed(2)}/hr &nbsp;·&nbsp; DT: ${(parseFloat(clsForm.rate || 0) * 2).toFixed(2)}/hr</div>}
      </Modal>

      {/* WORKER MODAL */}
      <Modal open={showWorker} onClose={() => setShowWorker(false)} title={editWorker ? 'Edit Worker' : 'Add Worker'}
        footer={<><button className="btn" onClick={() => setShowWorker(false)}>Cancel</button><button className="btn btn-primary" onClick={saveWorker}><i className="ti ti-check" /> Save</button></>}>
        <div className="form-grid form-grid-2">
          <FormGroup label="First name *"><Input value={workerForm.first} onChange={v => setWorkerForm(f => ({ ...f, first: v }))} placeholder="First" /></FormGroup>
          <FormGroup label="Last name *"><Input value={workerForm.last} onChange={v => setWorkerForm(f => ({ ...f, last: v }))} placeholder="Last" /></FormGroup>
          <FormGroup label="Classification" span="2">
            <Select value={workerForm.classId} onChange={v => setWorkerForm(f => ({ ...f, classId: v }))}
              options={job.classifications.map(c => ({ value: c.id, label: c.name + ' — $' + c.rate.toFixed(2) + '/hr' }))}
              placeholder="— Select classification —" />
          </FormGroup>
        </div>
      </Modal>

      {/* SUPERINTENDENT MODAL */}
      <Modal open={showSuper} onClose={() => setShowSuper(false)} title="Add Superintendent"
        footer={<><button className="btn" onClick={() => setShowSuper(false)}>Cancel</button><button className="btn btn-primary" onClick={saveSuper}><i className="ti ti-check" /> Add to job</button></>}>
        <Tabs tabs={[{ id: 'dir', label: 'From directory' }, { id: 'new', label: 'Add new' }]} active={superTab} onChange={setSuperTab} />
        {superTab === 'dir' ? (
          <>
            <SearchBar value={superSearch} onChange={setSuperSearch} placeholder="Search contacts..." />
            <div style={{ maxHeight: 280, overflowY: 'auto' }}>
              {filteredDirContacts.length === 0 ? <p style={{ color: '#aaa', fontSize: 13, padding: 12 }}>No contacts found. Switch to "Add new" tab.</p> : (
                filteredDirContacts.map(c => {
                  const co = state.directory.companies.find(x => x.id === c.companyId);
                  const selected = selectedDirContact === c.id;
                  return (
                    <div key={c.id} className="list-row clickable" onClick={() => setSelectedDirContact(c.id)}
                      style={{ background: selected ? '#EBF3FB' : 'transparent', borderRadius: 8, padding: '10px 8px' }}>
                      <div className="row-icon">{initials(c.first + ' ' + c.last)}</div>
                      <div className="row-body">
                        <div className="row-title">{c.first} {c.last} {selected && <i className="ti ti-check" style={{ color: '#185FA5', marginLeft: 4 }} />}</div>
                        <div className="row-sub">{c.title}{co ? ' · ' + co.name : ''}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        ) : (
          <div className="form-grid form-grid-2">
            <FormGroup label="Full name *" span="2"><Input value={superForm.name} onChange={v => setSuperForm(f => ({ ...f, name: v }))} placeholder="First Last" /></FormGroup>
            <FormGroup label="Phone"><Input value={superForm.phone} onChange={v => setSuperForm(f => ({ ...f, phone: v }))} placeholder="(555) 000-0000" /></FormGroup>
            <FormGroup label="Email"><Input value={superForm.email} onChange={v => setSuperForm(f => ({ ...f, email: v }))} placeholder="name@company.com" /></FormGroup>
          </div>
        )}
      </Modal>

      {/* CONFIRM MODALS */}
      <ConfirmModal open={!!confirmRemoveSuper} onClose={() => setConfirmRemoveSuper(null)} title="Remove superintendent"
        message={`Remove ${confirmRemoveSuper?.name} from this job?`} danger
        onConfirm={() => { dispatch({ type: 'REMOVE_SUPER', jobId: job.id, superId: confirmRemoveSuper.id }); setConfirmRemoveSuper(null); }} />
      <ConfirmModal open={!!confirmRemoveCls} onClose={() => setConfirmRemoveCls(null)} title="Remove classification"
        message={`Remove "${confirmRemoveCls?.name}" from this job?`} danger
        onConfirm={() => { dispatch({ type: 'REMOVE_CLASSIFICATION', jobId: job.id, clsId: confirmRemoveCls.id }); setConfirmRemoveCls(null); }} />
      <ConfirmModal open={!!confirmRemoveWorker} onClose={() => setConfirmRemoveWorker(null)} title="Remove worker"
        message={`Remove ${confirmRemoveWorker?.first} ${confirmRemoveWorker?.last} from this job?`} danger
        onConfirm={() => { dispatch({ type: 'REMOVE_WORKER', jobId: job.id, workerId: confirmRemoveWorker.id }); setConfirmRemoveWorker(null); }} />
    </div>
  );
}

// src/pages/Directory.jsx
import React, { useState } from 'react';
import { useStore } from '../data/store';
import { genId } from '../utils/helpers';
import { Modal, FormGroup, Input, ConfirmModal, SearchBar, Tabs } from '../components/UI';

export default function Directory() {
  const { state, dispatch } = useStore();
  const [tab, setTab] = useState('companies');
  const [search, setSearch] = useState('');

  // Company modals
  const [showCompany, setShowCompany] = useState(false);
  const [editCompany, setEditCompany] = useState(null);
  const [companyForm, setCompanyForm] = useState({ name: '', phone: '', email: '', address: '' });
  const [confirmDeleteCompany, setConfirmDeleteCompany] = useState(null);

  // Contact modals
  const [showContact, setShowContact] = useState(false);
  const [editContact, setEditContact] = useState(null);
  const [contactForm, setContactForm] = useState({ companyId: '', first: '', last: '', title: '', phone: '', email: '' });
  const [confirmDeleteContact, setConfirmDeleteContact] = useState(null);

  // Selected company for drill-down
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [companyTab, setCompanyTab] = useState('general');

  // Column widths
  const [colWidths, setColWidths] = useState({ name: 220, email: 200, phone: 160, address: 280 });
  const [contactColWidths, setContactColWidths] = useState({ name: 180, email: 200, phone: 150, company: 200, title: 150 });

  function openAddCompany() { setCompanyForm({ name: '', phone: '', email: '', address: '' }); setEditCompany(null); setShowCompany(true); }
  function openEditCompany(co) { setCompanyForm({ name: co.name, phone: co.phone, email: co.email, address: co.address }); setEditCompany(co); setShowCompany(true); }
  function saveCompany() {
    if (!companyForm.name) return alert('Company name is required.');
    if (editCompany) {
      dispatch({ type: 'UPDATE_COMPANY', company: { ...editCompany, ...companyForm } });
      if (selectedCompany?.id === editCompany.id) setSelectedCompany({ ...editCompany, ...companyForm });
    } else {
      dispatch({ type: 'ADD_COMPANY', company: { id: genId(), ...companyForm } });
    }
    setShowCompany(false);
  }

  function openAddContact(companyId = '') { setContactForm({ companyId, first: '', last: '', title: '', phone: '', email: '' }); setEditContact(null); setShowContact(true); }
  function openEditContact(c) { setContactForm({ companyId: c.companyId, first: c.first, last: c.last, title: c.title, phone: c.phone, email: c.email }); setEditContact(c); setShowContact(true); }
  function saveContact() {
    if (!contactForm.first || !contactForm.last) return alert('First and last name are required.');
    if (editContact) {
      dispatch({ type: 'UPDATE_CONTACT', contact: { ...editContact, ...contactForm } });
    } else {
      dispatch({ type: 'ADD_CONTACT', contact: { id: genId(), ...contactForm } });
    }
    setShowContact(false);
  }

  const filteredCompanies = state.directory.companies.filter(c =>
    (c.name + c.email + c.phone + c.address).toLowerCase().includes(search.toLowerCase())
  );
  const filteredContacts = state.directory.contacts.filter(c => {
    const co = state.directory.companies.find(x => x.id === c.companyId);
    return (c.first + ' ' + c.last + c.email + c.phone + (co?.name || '')).toLowerCase().includes(search.toLowerCase());
  });
  const companyContacts = selectedCompany ? state.directory.contacts.filter(c => c.companyId === selectedCompany.id) : [];

  // Resizable column handler
  function startResize(e, col, widths, setWidths) {
    e.preventDefault();
    const startX = e.clientX;
    const startW = widths[col];
    function onMove(ev) { setWidths(w => ({ ...w, [col]: Math.max(80, startW + ev.clientX - startX) })); }
    function onUp() { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  const thStyle = (col, widths, setWidths) => ({
    width: widths[col],
    position: 'relative',
    userSelect: 'none'
  });

  const resizeHandle = (col, widths, setWidths) => (
    <span onMouseDown={e => startResize(e, col, widths, setWidths)}
      style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 6, cursor: 'col-resize', background: 'transparent' }} />
  );

  if (selectedCompany) {
    const co = state.directory.companies.find(c => c.id === selectedCompany.id) || selectedCompany;
    return (
      <div>
        <div className="breadcrumb">
          <span className="bc-link" onClick={() => setSelectedCompany(null)}>Directory</span>
          <span className="bc-sep">›</span>
          <span className="bc-current">{co.name}</span>
        </div>
        <Tabs tabs={[{ id: 'general', label: 'General' }, { id: 'users', label: `Users (${companyContacts.length})` }]} active={companyTab} onChange={setCompanyTab} />

        {companyTab === 'general' ? (
          <div className="card">
            <div className="card-header">
              <div className="card-title">{co.name}</div>
              <div className="card-actions">
                <button className="btn btn-sm" onClick={() => openEditCompany(co)}><i className="ti ti-edit" /> Edit</button>
                <button className="btn btn-sm btn-danger" onClick={() => setConfirmDeleteCompany(co)}><i className="ti ti-trash" /></button>
              </div>
            </div>
            <div className="form-grid form-grid-2">
              <FormGroup label="Company name"><Input value={co.name} disabled /></FormGroup>
              <FormGroup label="Phone"><Input value={co.phone} disabled /></FormGroup>
              <FormGroup label="Email"><Input value={co.email} disabled /></FormGroup>
              <FormGroup label="Address" span="2"><Input value={co.address} disabled /></FormGroup>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
              <button className="btn btn-primary btn-sm" onClick={() => openEditCompany(co)}><i className="ti ti-edit" /> Edit company</button>
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="card-header">
              <div className="card-title">Users — {co.name}</div>
              <button className="btn btn-primary btn-sm" onClick={() => openAddContact(co.id)}><i className="ti ti-plus" /> Add user</button>
            </div>
            {companyContacts.length === 0 ? (
              <p style={{ color: '#aaa', fontSize: 13, padding: '12px 0' }}>No contacts yet. Add the first one.</p>
            ) : (
              <div className="tbl-wrap">
                <table className="dir-table">
                  <thead>
                    <tr>
                      <th style={thStyle('name', contactColWidths, setContactColWidths)}>Name {resizeHandle('name', contactColWidths, setContactColWidths)}</th>
                      <th style={thStyle('email', contactColWidths, setContactColWidths)}>Email {resizeHandle('email', contactColWidths, setContactColWidths)}</th>
                      <th style={thStyle('phone', contactColWidths, setContactColWidths)}>Phone {resizeHandle('phone', contactColWidths, setContactColWidths)}</th>
                      <th style={thStyle('title', contactColWidths, setContactColWidths)}>Title {resizeHandle('title', contactColWidths, setContactColWidths)}</th>
                      <th style={{ width: 80 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {companyContacts.map(c => (
                      <tr key={c.id}>
                        <td style={{ fontWeight: 600 }}>{c.first} {c.last}</td>
                        <td>{c.email}</td>
                        <td>{c.phone}</td>
                        <td>{c.title}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button className="btn btn-icon btn-sm" onClick={() => openEditContact(c)}><i className="ti ti-edit" /></button>
                            <button className="btn btn-icon btn-sm btn-danger" onClick={() => setConfirmDeleteContact(c)}><i className="ti ti-trash" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        <ConfirmModal open={!!confirmDeleteCompany} onClose={() => setConfirmDeleteCompany(null)} title="Delete company"
          message={`Delete "${confirmDeleteCompany?.name}" and all associated contacts? This cannot be undone.`} danger
          onConfirm={() => { dispatch({ type: 'DELETE_COMPANY', id: confirmDeleteCompany.id }); setConfirmDeleteCompany(null); setSelectedCompany(null); }} />
        <ConfirmModal open={!!confirmDeleteContact} onClose={() => setConfirmDeleteContact(null)} title="Delete contact"
          message={`Delete ${confirmDeleteContact?.first} ${confirmDeleteContact?.last}?`} danger
          onConfirm={() => { dispatch({ type: 'DELETE_CONTACT', id: confirmDeleteContact.id }); setConfirmDeleteContact(null); }} />
        <Modal open={showContact} onClose={() => setShowContact(false)} title={editContact ? 'Edit Contact' : 'Add Contact'}
          footer={<><button className="btn" onClick={() => setShowContact(false)}>Cancel</button><button className="btn btn-primary" onClick={saveContact}><i className="ti ti-check" /> Save</button></>}>
          <div className="form-grid form-grid-2">
            <FormGroup label="First name *"><Input value={contactForm.first} onChange={v => setContactForm(f => ({ ...f, first: v }))} /></FormGroup>
            <FormGroup label="Last name *"><Input value={contactForm.last} onChange={v => setContactForm(f => ({ ...f, last: v }))} /></FormGroup>
            <FormGroup label="Title / role"><Input value={contactForm.title} onChange={v => setContactForm(f => ({ ...f, title: v }))} placeholder="e.g. Superintendent" /></FormGroup>
            <FormGroup label="Phone"><Input value={contactForm.phone} onChange={v => setContactForm(f => ({ ...f, phone: v }))} /></FormGroup>
            <FormGroup label="Email" span="2"><Input value={contactForm.email} onChange={v => setContactForm(f => ({ ...f, email: v }))} /></FormGroup>
          </div>
        </Modal>
        <Modal open={showCompany} onClose={() => setShowCompany(false)} title="Edit Company"
          footer={<><button className="btn" onClick={() => setShowCompany(false)}>Cancel</button><button className="btn btn-primary" onClick={saveCompany}><i className="ti ti-check" /> Save</button></>}>
          <div className="form-grid form-grid-2">
            <FormGroup label="Company name *" span="2"><Input value={companyForm.name} onChange={v => setCompanyForm(f => ({ ...f, name: v }))} /></FormGroup>
            <FormGroup label="Phone"><Input value={companyForm.phone} onChange={v => setCompanyForm(f => ({ ...f, phone: v }))} /></FormGroup>
            <FormGroup label="Email"><Input value={companyForm.email} onChange={v => setCompanyForm(f => ({ ...f, email: v }))} /></FormGroup>
            <FormGroup label="Address" span="2"><Input value={companyForm.address} onChange={v => setCompanyForm(f => ({ ...f, address: v }))} /></FormGroup>
          </div>
        </Modal>
      </div>
    );
  }

  return (
    <div>
      <SearchBar value={search} onChange={setSearch} placeholder={tab === 'companies' ? 'Search companies...' : 'Search contacts by name, email, or company...'} />
      <Tabs tabs={[{ id: 'companies', label: `Companies (${state.directory.companies.length})` }, { id: 'contacts', label: `All Contacts (${state.directory.contacts.length})` }]} active={tab} onChange={setTab} />

      {tab === 'companies' ? (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Companies</div>
            <button className="btn btn-primary btn-sm" onClick={openAddCompany}><i className="ti ti-plus" /> Add company</button>
          </div>
          {filteredCompanies.length === 0 ? <p style={{ color: '#aaa', fontSize: 13 }}>No companies found.</p> : (
            <div className="tbl-wrap">
              <table className="dir-table">
                <thead>
                  <tr>
                    <th style={thStyle('name', colWidths, setColWidths)}>Company name {resizeHandle('name', colWidths, setColWidths)}</th>
                    <th style={thStyle('email', colWidths, setColWidths)}>Email {resizeHandle('email', colWidths, setColWidths)}</th>
                    <th style={thStyle('phone', colWidths, setColWidths)}>Phone {resizeHandle('phone', colWidths, setColWidths)}</th>
                    <th style={thStyle('address', colWidths, setColWidths)}>Address {resizeHandle('address', colWidths, setColWidths)}</th>
                    <th style={{ width: 100 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCompanies.map(co => (
                    <tr key={co.id} onClick={() => setSelectedCompany(co)}>
                      <td style={{ fontWeight: 700, color: '#185FA5' }}>{co.name}</td>
                      <td>{co.email}</td>
                      <td>{co.phone}</td>
                      <td>{co.address}</td>
                      <td onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn-icon btn-sm" onClick={() => openEditCompany(co)}><i className="ti ti-edit" /></button>
                          <button className="btn btn-icon btn-sm btn-danger" onClick={() => setConfirmDeleteCompany(co)}><i className="ti ti-trash" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="card">
          <div className="card-header">
            <div className="card-title">All Contacts</div>
            <button className="btn btn-primary btn-sm" onClick={() => openAddContact('')}><i className="ti ti-plus" /> Add contact</button>
          </div>
          {filteredContacts.length === 0 ? <p style={{ color: '#aaa', fontSize: 13 }}>No contacts found.</p> : (
            <div className="tbl-wrap">
              <table className="dir-table">
                <thead>
                  <tr>
                    <th style={thStyle('name', contactColWidths, setContactColWidths)}>Name {resizeHandle('name', contactColWidths, setContactColWidths)}</th>
                    <th style={thStyle('email', contactColWidths, setContactColWidths)}>Email {resizeHandle('email', contactColWidths, setContactColWidths)}</th>
                    <th style={thStyle('phone', contactColWidths, setContactColWidths)}>Phone {resizeHandle('phone', contactColWidths, setContactColWidths)}</th>
                    <th style={thStyle('company', contactColWidths, setContactColWidths)}>Company {resizeHandle('company', contactColWidths, setContactColWidths)}</th>
                    <th style={thStyle('title', contactColWidths, setContactColWidths)}>Title {resizeHandle('title', contactColWidths, setContactColWidths)}</th>
                    <th style={{ width: 80 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContacts.map(c => {
                    const co = state.directory.companies.find(x => x.id === c.companyId);
                    return (
                      <tr key={c.id}>
                        <td style={{ fontWeight: 600 }}>{c.first} {c.last}</td>
                        <td>{c.email}</td>
                        <td>{c.phone}</td>
                        <td>{co?.name || '—'}</td>
                        <td>{c.title}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button className="btn btn-icon btn-sm" onClick={() => openEditContact(c)}><i className="ti ti-edit" /></button>
                            <button className="btn btn-icon btn-sm btn-danger" onClick={() => setConfirmDeleteContact(c)}><i className="ti ti-trash" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* COMPANY MODAL */}
      <Modal open={showCompany} onClose={() => setShowCompany(false)} title={editCompany ? 'Edit Company' : 'Add Company'}
        footer={<><button className="btn" onClick={() => setShowCompany(false)}>Cancel</button><button className="btn btn-primary" onClick={saveCompany}><i className="ti ti-check" /> Save company</button></>}>
        <div className="form-grid form-grid-2">
          <FormGroup label="Company name *" span="2"><Input value={companyForm.name} onChange={v => setCompanyForm(f => ({ ...f, name: v }))} placeholder="e.g. Apex Construction Group" /></FormGroup>
          <FormGroup label="Phone"><Input value={companyForm.phone} onChange={v => setCompanyForm(f => ({ ...f, phone: v }))} placeholder="(555) 000-0000" /></FormGroup>
          <FormGroup label="Email"><Input value={companyForm.email} onChange={v => setCompanyForm(f => ({ ...f, email: v }))} placeholder="contact@company.com" /></FormGroup>
          <FormGroup label="Address" span="2"><Input value={companyForm.address} onChange={v => setCompanyForm(f => ({ ...f, address: v }))} placeholder="Street, City, State ZIP" /></FormGroup>
        </div>
      </Modal>

      {/* CONTACT MODAL */}
      <Modal open={showContact} onClose={() => setShowContact(false)} title={editContact ? 'Edit Contact' : 'Add Contact'}
        footer={<><button className="btn" onClick={() => setShowContact(false)}>Cancel</button><button className="btn btn-primary" onClick={saveContact}><i className="ti ti-check" /> Save contact</button></>}>
        <div className="form-grid form-grid-2">
          <FormGroup label="First name *"><Input value={contactForm.first} onChange={v => setContactForm(f => ({ ...f, first: v }))} /></FormGroup>
          <FormGroup label="Last name *"><Input value={contactForm.last} onChange={v => setContactForm(f => ({ ...f, last: v }))} /></FormGroup>
          <FormGroup label="Title / role"><Input value={contactForm.title} onChange={v => setContactForm(f => ({ ...f, title: v }))} placeholder="e.g. Superintendent" /></FormGroup>
          <FormGroup label="Phone"><Input value={contactForm.phone} onChange={v => setContactForm(f => ({ ...f, phone: v }))} /></FormGroup>
          <FormGroup label="Email" span="2"><Input value={contactForm.email} onChange={v => setContactForm(f => ({ ...f, email: v }))} /></FormGroup>
          <FormGroup label="Company" span="2">
            <select className="form-input" value={contactForm.companyId} onChange={e => setContactForm(f => ({ ...f, companyId: e.target.value }))}>
              <option value="">— No company —</option>
              {state.directory.companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </FormGroup>
        </div>
      </Modal>

      <ConfirmModal open={!!confirmDeleteCompany} onClose={() => setConfirmDeleteCompany(null)} title="Delete company"
        message={`Delete "${confirmDeleteCompany?.name}" and all associated contacts?`} danger
        onConfirm={() => { dispatch({ type: 'DELETE_COMPANY', id: confirmDeleteCompany.id }); setConfirmDeleteCompany(null); }} />
      <ConfirmModal open={!!confirmDeleteContact} onClose={() => setConfirmDeleteContact(null)} title="Delete contact"
        message={`Delete ${confirmDeleteContact?.first} ${confirmDeleteContact?.last}?`} danger
        onConfirm={() => { dispatch({ type: 'DELETE_CONTACT', id: confirmDeleteContact.id }); setConfirmDeleteContact(null); }} />
    </div>
  );
}

// src/pages/Directory.jsx
import React, { useState } from 'react';
import { useStore } from '../data/store';
import { genId } from '../utils/helpers';
import { Modal, FormGroup, Input, ConfirmModal, Tabs } from '../components/UI';

export default function Directory() {
  const { state, dispatch } = useStore();
  const [tab, setTab] = useState('companies');
  const [search, setSearch] = useState('');
  const [showAddDropdown, setShowAddDropdown] = useState(false);

  // Company modal
  const [showCompany, setShowCompany] = useState(false);
  const [editCompany, setEditCompany] = useState(null);
  const [companyForm, setCompanyForm] = useState({ name: '', phone: '', email: '', address: '' });
  const [confirmDeleteCompany, setConfirmDeleteCompany] = useState(null);

  // Contact modal
  const [showContact, setShowContact] = useState(false);
  const [editContact, setEditContact] = useState(null);
  const [contactForm, setContactForm] = useState({ companyId: '', first: '', last: '', title: '', phone: '', email: '' });
  const [showInlineCompany, setShowInlineCompany] = useState(false);
  const [inlineCompanyForm, setInlineCompanyForm] = useState({ name: '', phone: '', email: '', address: '' });
  const [confirmDeleteContact, setConfirmDeleteContact] = useState(null);

  // Selected company drill-down
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [companyTab, setCompanyTab] = useState('general');

  function openAddCompany() {
    setCompanyForm({ name: '', phone: '', email: '', address: '' });
    setEditCompany(null);
    setShowCompany(true);
    setShowAddDropdown(false);
  }

  function openAddContact(prefilledCompanyId = '') {
    setContactForm({ companyId: prefilledCompanyId, first: '', last: '', title: '', phone: '', email: '' });
    setEditContact(null);
    setShowInlineCompany(false);
    setInlineCompanyForm({ name: '', phone: '', email: '', address: '' });
    setShowContact(true);
    setShowAddDropdown(false);
  }

  function openEditCompany(co) {
    setCompanyForm({ name: co.name, phone: co.phone, email: co.email, address: co.address });
    setEditCompany(co);
    setShowCompany(true);
  }

  function openEditContact(c) {
    setContactForm({ companyId: c.companyId, first: c.first, last: c.last, title: c.title, phone: c.phone, email: c.email });
    setEditContact(c);
    setShowInlineCompany(false);
    setShowContact(true);
  }

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

  function saveContact() {
    if (!contactForm.first || !contactForm.last) return alert('First and last name are required.');
    let companyId = contactForm.companyId;

    // If inline company form is showing and has a name, create company first
    if (showInlineCompany && inlineCompanyForm.name) {
      const newCompany = { id: genId(), ...inlineCompanyForm };
      dispatch({ type: 'ADD_COMPANY', company: newCompany });
      companyId = newCompany.id;
    } else if (!companyId) {
      return alert('Please select a company or add a new one.');
    }

    const contact = { companyId, first: contactForm.first, last: contactForm.last, title: contactForm.title, phone: contactForm.phone, email: contactForm.email };
    if (editContact) {
      dispatch({ type: 'UPDATE_CONTACT', contact: { ...editContact, ...contact } });
    } else {
      dispatch({ type: 'ADD_CONTACT', contact: { id: genId(), ...contact } });
    }
    setShowContact(false);
    setShowInlineCompany(false);
  }

  function handleCompanySelect(val) {
    if (val === 'not-listed') {
      setShowInlineCompany(true);
      setContactForm(f => ({ ...f, companyId: '' }));
    } else {
      setShowInlineCompany(false);
      setContactForm(f => ({ ...f, companyId: val }));
    }
  }

  const filteredCompanies = state.directory.companies.filter(c =>
    (c.name + c.email + c.phone + c.address).toLowerCase().includes(search.toLowerCase())
  );
  const filteredContacts = state.directory.contacts.filter(c => {
    const co = state.directory.companies.find(x => x.id === c.companyId);
    return (c.first + ' ' + c.last + c.email + c.phone + (co?.name || '')).toLowerCase().includes(search.toLowerCase());
  });
  const companyContacts = selectedCompany ? state.directory.contacts.filter(c => c.companyId === selectedCompany.id) : [];

  // Contact form modal content (reused in multiple places)
  function ContactFormContent() {
    return (
      <>
        <div className="form-grid form-grid-2">
          <FormGroup label="First name *"><Input value={contactForm.first} onChange={v => setContactForm(f => ({ ...f, first: v }))} placeholder="First" /></FormGroup>
          <FormGroup label="Last name *"><Input value={contactForm.last} onChange={v => setContactForm(f => ({ ...f, last: v }))} placeholder="Last" /></FormGroup>
          <FormGroup label="Title / role"><Input value={contactForm.title} onChange={v => setContactForm(f => ({ ...f, title: v }))} placeholder="e.g. Superintendent" /></FormGroup>
          <FormGroup label="Phone"><Input value={contactForm.phone} onChange={v => setContactForm(f => ({ ...f, phone: v }))} placeholder="(555) 000-0000" /></FormGroup>
          <FormGroup label="Email" span="2"><Input value={contactForm.email} onChange={v => setContactForm(f => ({ ...f, email: v }))} placeholder="name@company.com" /></FormGroup>
        </div>

        {!editContact && (
          <FormGroup label="Company *">
            <select className="form-input" value={showInlineCompany ? 'not-listed' : contactForm.companyId} onChange={e => handleCompanySelect(e.target.value)}>
              <option value="">— Select company —</option>
              {state.directory.companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              <option value="not-listed">+ Company not listed — add new</option>
            </select>
          </FormGroup>
        )}

        {/* Inline company form slides in when "not listed" selected */}
        {showInlineCompany && (
          <div style={{ marginTop: 12, padding: '14px 16px', background: '#f8fbff', border: '1px solid #C5DEFA', borderRadius: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#185FA5', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <i className="ti ti-building" /> New company details
            </div>
            <div className="form-grid form-grid-2">
              <FormGroup label="Company name *" span="2"><Input value={inlineCompanyForm.name} onChange={v => setInlineCompanyForm(f => ({ ...f, name: v }))} placeholder="e.g. Apex Construction Group" /></FormGroup>
              <FormGroup label="Phone"><Input value={inlineCompanyForm.phone} onChange={v => setInlineCompanyForm(f => ({ ...f, phone: v }))} placeholder="(555) 000-0000" /></FormGroup>
              <FormGroup label="Email"><Input value={inlineCompanyForm.email} onChange={v => setInlineCompanyForm(f => ({ ...f, email: v }))} placeholder="info@company.com" /></FormGroup>
              <FormGroup label="Address" span="2"><Input value={inlineCompanyForm.address} onChange={v => setInlineCompanyForm(f => ({ ...f, address: v }))} placeholder="Street, City, State ZIP" /></FormGroup>
            </div>
          </div>
        )}
      </>
    );
  }

  // COMPANY DRILL-DOWN VIEW
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
              <p style={{ color: '#aaa', fontSize: 13, padding: '12px 0' }}>No users yet. Add the first one.</p>
            ) : (
              <table className="dir-table">
                <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Title</th><th style={{ width: 80 }}></th></tr></thead>
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
            )}
          </div>
        )}

        <ConfirmModal open={!!confirmDeleteCompany} onClose={() => setConfirmDeleteCompany(null)} title="Delete company"
          message={`Delete "${confirmDeleteCompany?.name}" and all associated users? This cannot be undone.`} danger
          onConfirm={() => { dispatch({ type: 'DELETE_COMPANY', id: confirmDeleteCompany.id }); setConfirmDeleteCompany(null); setSelectedCompany(null); }} />
        <ConfirmModal open={!!confirmDeleteContact} onClose={() => setConfirmDeleteContact(null)} title="Delete user"
          message={`Delete ${confirmDeleteContact?.first} ${confirmDeleteContact?.last}?`} danger
          onConfirm={() => { dispatch({ type: 'DELETE_CONTACT', id: confirmDeleteContact.id }); setConfirmDeleteContact(null); }} />
        <Modal open={showCompany} onClose={() => setShowCompany(false)} title="Edit Company"
          footer={<><button className="btn" onClick={() => setShowCompany(false)}>Cancel</button><button className="btn btn-primary" onClick={saveCompany}><i className="ti ti-check" /> Save</button></>}>
          <div className="form-grid form-grid-2">
            <FormGroup label="Company name *" span="2"><Input value={companyForm.name} onChange={v => setCompanyForm(f => ({ ...f, name: v }))} /></FormGroup>
            <FormGroup label="Phone"><Input value={companyForm.phone} onChange={v => setCompanyForm(f => ({ ...f, phone: v }))} /></FormGroup>
            <FormGroup label="Email"><Input value={companyForm.email} onChange={v => setCompanyForm(f => ({ ...f, email: v }))} /></FormGroup>
            <FormGroup label="Address" span="2"><Input value={companyForm.address} onChange={v => setCompanyForm(f => ({ ...f, address: v }))} /></FormGroup>
          </div>
        </Modal>
        <Modal open={showContact} onClose={() => { setShowContact(false); setShowInlineCompany(false); }} title={editContact ? 'Edit User' : 'Add User'}
          footer={<><button className="btn" onClick={() => { setShowContact(false); setShowInlineCompany(false); }}>Cancel</button><button className="btn btn-primary" onClick={saveContact}><i className="ti ti-check" /> Save</button></>}>
          <ContactFormContent />
        </Modal>
      </div>
    );
  }

  // MAIN DIRECTORY VIEW
  return (
    <div>
      {/* Search + Add button */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center' }}>
        <div className="search-wrap" style={{ flex: 1, marginBottom: 0 }}>
          <i className="ti ti-search search-icon" />
          <input className="search-input" value={search} onChange={e => setSearch(e.target.value)}
            placeholder={tab === 'companies' ? 'Search companies...' : 'Search contacts by name, email, or company...'} />
        </div>

        {/* Add dropdown button */}
        <div style={{ position: 'relative' }}>
          <button className="btn btn-primary" onClick={() => setShowAddDropdown(v => !v)}>
            <i className="ti ti-plus" /> Add <i className="ti ti-chevron-down" style={{ fontSize: 12 }} />
          </button>
          {showAddDropdown && (
            <div style={{ position: 'absolute', right: 0, top: '110%', background: '#fff', border: '1px solid #e8e8e6', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 100, minWidth: 160, overflow: 'hidden' }}>
              <div style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                className="dropdown-item"
                onMouseEnter={e => e.currentTarget.style.background = '#f4f4f2'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                onClick={openAddCompany}>
                <i className="ti ti-building" style={{ color: '#185FA5' }} /> Add company
              </div>
              <div style={{ height: 1, background: '#f0f0ee' }} />
              <div style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                onMouseEnter={e => e.currentTarget.style.background = '#f4f4f2'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                onClick={() => openAddContact('')}>
                <i className="ti ti-user-plus" style={{ color: '#185FA5' }} /> Add user
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Close dropdown when clicking outside */}
      {showAddDropdown && <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setShowAddDropdown(false)} />}

      <Tabs tabs={[
        { id: 'companies', label: `Companies (${state.directory.companies.length})` },
        { id: 'contacts', label: `All Users (${state.directory.contacts.length})` }
      ]} active={tab} onChange={setTab} />

      {tab === 'companies' ? (
        <div className="card">
          <div className="card-header"><div className="card-title">Companies</div></div>
          {filteredCompanies.length === 0 ? <p style={{ color: '#aaa', fontSize: 13 }}>No companies found.</p> : (
            <table className="dir-table">
              <thead>
                <tr>
                  <th>Company name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Address</th>
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
          )}
        </div>
      ) : (
        <div className="card">
          <div className="card-header"><div className="card-title">All Users</div></div>
          {filteredContacts.length === 0 ? <p style={{ color: '#aaa', fontSize: 13 }}>No users found.</p> : (
            <table className="dir-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Company</th>
                  <th>Title</th>
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
      <Modal open={showContact} onClose={() => { setShowContact(false); setShowInlineCompany(false); }} title={editContact ? 'Edit User' : 'Add User'}
        footer={<><button className="btn" onClick={() => { setShowContact(false); setShowInlineCompany(false); }}>Cancel</button><button className="btn btn-primary" onClick={saveContact}><i className="ti ti-check" /> Save user</button></>}>
        <ContactFormContent />
      </Modal>

      {/* CONFIRM MODALS */}
      <ConfirmModal open={!!confirmDeleteCompany} onClose={() => setConfirmDeleteCompany(null)} title="Delete company"
        message={`Delete "${confirmDeleteCompany?.name}" and all associated users? This cannot be undone.`} danger
        onConfirm={() => { dispatch({ type: 'DELETE_COMPANY', id: confirmDeleteCompany.id }); setConfirmDeleteCompany(null); }} />
      <ConfirmModal open={!!confirmDeleteContact} onClose={() => setConfirmDeleteContact(null)} title="Delete user"
        message={`Delete ${confirmDeleteContact?.first} ${confirmDeleteContact?.last}?`} danger
        onConfirm={() => { dispatch({ type: 'DELETE_CONTACT', id: confirmDeleteContact.id }); setConfirmDeleteContact(null); }} />
    </div>
  );
}

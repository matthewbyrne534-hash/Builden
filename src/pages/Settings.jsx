// src/pages/Settings.jsx
import React, { useState, useEffect } from 'react';
import { useStore } from '../data/store';
import { useAuth } from '../data/auth';
import { updatePassword } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { Tabs, FormGroup, Input } from '../components/UI';

export default function Settings() {
  const [section, setSection] = useState('company'); // 'company' | 'login' | 'billing'
  return (
    <div>
      <Tabs tabs={[
        { id: 'company', label: 'Company Info' },
        { id: 'login', label: 'My Login' },
        { id: 'billing', label: 'Billing' }
      ]} active={section} onChange={setSection} />

      {section === 'company' && <CompanyInfoSection />}
      {section === 'login' && <MyLoginSection />}
      {section === 'billing' && <BillingSection />}
    </div>
  );
}

// ─── COMPANY INFO ─────────────────────────────────────────────────────────────
function CompanyInfoSection() {
  const { state, dispatch } = useStore();
  const [form, setForm] = useState({ name: '', address: '', city: '', phone: '', email: '' });
  const [saved, setSaved] = useState(false);

  // Sync local form with store profile once it's loaded from Firestore
  useEffect(() => {
    setForm({
      name: state.profile.name || '',
      address: state.profile.address || '',
      city: state.profile.city || '',
      phone: state.profile.phone || '',
      email: state.profile.email || ''
    });
  }, [state.profile]);

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }));
  }

  function save() {
    dispatch({ type: 'UPDATE_PROFILE', data: form });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-header-left">
          <div className="card-title">Company Info</div>
          <div className="card-subtitle">This appears on your T&M packages and tickets when shared with GCs.</div>
        </div>
      </div>
      <div className="form-grid form-grid-2">
        <FormGroup label="Company name" span="2"><Input value={form.name} onChange={v => set('name', v)} placeholder="e.g. Granite Peak Contracting" /></FormGroup>
        <FormGroup label="Address" span="2"><Input value={form.address} onChange={v => set('address', v)} placeholder="Street address" /></FormGroup>
        <FormGroup label="City, State ZIP"><Input value={form.city} onChange={v => set('city', v)} placeholder="e.g. Plattsburgh, NY 12901" /></FormGroup>
        <FormGroup label="Phone"><Input value={form.phone} onChange={v => set('phone', v)} placeholder="(555) 000-0000" /></FormGroup>
        <FormGroup label="Company email" span="2"><Input value={form.email} onChange={v => set('email', v)} placeholder="info@company.com" /></FormGroup>
      </div>
      <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button className="btn btn-primary" onClick={save}><i className="ti ti-check" /> Save changes</button>
        {saved && <span style={{ fontSize: 13, color: '#1a7f37', fontWeight: 600 }}>Saved</span>}
      </div>
      <div style={{ marginTop: 18, padding: '12px 14px', background: '#f8fbff', border: '1px solid #C5DEFA', borderRadius: 10, fontSize: 13, color: '#185FA5' }}>
        <i className="ti ti-info-circle" /> Logo upload is coming soon — it'll print on your T&M packages once that's built.
      </div>
    </div>
  );
}

// ─── MY LOGIN ──────────────────────────────────────────────────────────────────
function MyLoginSection() {
  const { user, userDoc, deleteAccountAndCompany } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [showDanger, setShowDanger] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  async function handleChangePassword() {
    setError('');
    setSuccess(false);
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      await updatePassword(auth.currentUser, newPassword);
      setSuccess(true);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      if (err.code === 'auth/requires-recent-login') {
        setError('For security, please log out and log back in before changing your password.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteCompany() {
    setDeleting(true);
    try {
      await deleteAccountAndCompany();
      // No need to navigate anywhere — deleteUser() signs them out automatically,
      // and the app's normal AuthGate logic takes it from there.
    } catch (err) {
      alert('Something went wrong deleting the company. You may need to log out and back in first, then try again.');
      setDeleting(false);
    }
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-header-left">
          <div className="card-title">My Login</div>
          <div className="card-subtitle">Manage the email and password you use to log in.</div>
        </div>
      </div>
      <div className="form-grid form-grid-2">
        <FormGroup label="Email" span="2">
          <Input value={user?.email || ''} disabled />
        </FormGroup>
      </div>
      <div style={{ height: 1, background: '#f0f0ee', margin: '16px 0' }} />
      <div className="form-grid form-grid-2">
        <FormGroup label="New password"><Input type="password" value={newPassword} onChange={setNewPassword} placeholder="At least 6 characters" /></FormGroup>
        <FormGroup label="Confirm new password"><Input type="password" value={confirmPassword} onChange={setConfirmPassword} placeholder="Re-enter password" /></FormGroup>
      </div>
      {error && (
        <div style={{ background: '#FDEEEE', color: '#B42318', fontSize: 13, padding: '8px 12px', borderRadius: 8, marginTop: 12 }}>{error}</div>
      )}
      <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button className="btn btn-primary" disabled={submitting} onClick={handleChangePassword}>
          {submitting ? 'Updating...' : 'Update password'}
        </button>
        {success && <span style={{ fontSize: 13, color: '#1a7f37', fontWeight: 600 }}>Password updated</span>}
      </div>

      {/* Dev-only cleanup tool — gated on BOTH being an admin AND actually running against
          the dev Firebase project, so this can never appear for a real paying customer in
          production, no matter their role. */}
      {userDoc?.role === 'admin' && process.env.REACT_APP_FIREBASE_PROJECT_ID === 'builden-dev' && (
        <>
          <div style={{ height: 1, background: '#f0f0ee', margin: '24px 0 16px' }} />
          <div style={{ fontSize: 13, fontWeight: 700, color: '#B42318', marginBottom: 8 }}>Danger Zone</div>
          {!showDanger ? (
            <button className="btn btn-sm btn-danger" onClick={() => { setShowDanger(true); setConfirmText(''); }}>
              <i className="ti ti-alert-triangle" /> Delete this company permanently
            </button>
          ) : (
            <div style={{ background: '#FDEEEE', border: '1px solid #f5c2c2', borderRadius: 10, padding: 14 }}>
              <p style={{ fontSize: 13, color: '#B42318', marginBottom: 10 }}>
                This permanently deletes every job, team member, roster entry, and GC contact for
                this company, plus your own login. There is no undo.
                Mainly useful for cleaning up test companies — not something a real, active company should do.
              </p>
              <FormGroup label='Type "DELETE" to confirm'>
                <Input value={confirmText} onChange={setConfirmText} placeholder="DELETE" />
              </FormGroup>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button className="btn btn-sm" onClick={() => setShowDanger(false)}>Cancel</button>
                <button className="btn btn-sm btn-danger" disabled={confirmText !== 'DELETE' || deleting} onClick={handleDeleteCompany}>
                  {deleting ? 'Deleting...' : 'Permanently delete'}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── BILLING (placeholder) ─────────────────────────────────────────────────────
function BillingSection() {
  return (
    <div className="card">
      <div className="card-header">
        <div className="card-header-left">
          <div className="card-title">Billing</div>
          <div className="card-subtitle">Coming soon.</div>
        </div>
      </div>
      <p style={{ color: '#aaa', fontSize: 13, padding: '12px 0' }}>
        Subscription and payment management will appear here once billing is built.
      </p>
    </div>
  );
}

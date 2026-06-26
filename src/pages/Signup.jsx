// src/pages/Signup.jsx
import React, { useState } from 'react';
import { useAuth } from '../data/auth';

export default function Signup({ goToLogin }) {
  const { signupAsCompanyAdmin } = useAuth();
  const [form, setForm] = useState({ companyName: '', first: '', last: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setSubmitting(true);
    try {
      await signupAsCompanyAdmin(form);
      // No navigation needed — App.jsx watches for a logged-in user and switches
      // to the main app automatically once this succeeds.
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError('An account with that email already exists.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak. Please use at least 6 characters.');
      } else {
        setError('Something went wrong. Please try again.');
      }
      setSubmitting(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f4f2' }}>
      <div style={{ width: 400, background: '#fff', borderRadius: 14, padding: '36px 32px', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#185FA5' }}>Builden</div>
          <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>Create your company account</div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#444', display: 'block', marginBottom: 6 }}>Company name</label>
            <input className="form-input" value={form.companyName} onChange={e => set('companyName', e.target.value)} placeholder="e.g. Granite Peak Contracting" required style={{ width: '100%' }} />
          </div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#444', display: 'block', marginBottom: 6 }}>First name</label>
              <input className="form-input" value={form.first} onChange={e => set('first', e.target.value)} required style={{ width: '100%' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#444', display: 'block', marginBottom: 6 }}>Last name</label>
              <input className="form-input" value={form.last} onChange={e => set('last', e.target.value)} required style={{ width: '100%' }} />
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#444', display: 'block', marginBottom: 6 }}>Email</label>
            <input type="email" className="form-input" value={form.email} onChange={e => set('email', e.target.value)} placeholder="name@company.com" required style={{ width: '100%' }} />
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#444', display: 'block', marginBottom: 6 }}>Password</label>
            <input type="password" className="form-input" value={form.password} onChange={e => set('password', e.target.value)} placeholder="At least 6 characters" required style={{ width: '100%' }} />
          </div>

          {error && (
            <div style={{ background: '#FDEEEE', color: '#B42318', fontSize: 13, padding: '8px 12px', borderRadius: 8, marginBottom: 14 }}>
              {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={submitting} style={{ width: '100%', justifyContent: 'center', marginBottom: 12 }}>
            {submitting ? 'Creating account...' : 'Create account'}
          </button>

          <div style={{ textAlign: 'center', fontSize: 13, color: '#666' }}>
            Already have an account?{' '}
            <span style={{ color: '#185FA5', fontWeight: 600, cursor: 'pointer' }} onClick={goToLogin}>Log in</span>
          </div>
        </form>
      </div>
    </div>
  );
}

// src/pages/Login.jsx
import React, { useState } from 'react';
import { useAuth } from '../data/auth';

export default function Login({ goToSignup }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setError('Incorrect email or password.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f4f2' }}>
      <div style={{ width: 360, background: '#fff', borderRadius: 14, padding: '36px 32px', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#185FA5' }}>Builden</div>
          <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>T&M Management</div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#444', display: 'block', marginBottom: 6 }}>Email</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="name@company.com"
              required
              autoFocus
              style={{ width: '100%' }}
            />
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#444', display: 'block', marginBottom: 6 }}>Password</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{ width: '100%' }}
            />
          </div>

          {error && (
            <div style={{ background: '#FDEEEE', color: '#B42318', fontSize: 13, padding: '8px 12px', borderRadius: 8, marginBottom: 14 }}>
              {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={submitting} style={{ width: '100%', justifyContent: 'center', marginBottom: 12 }}>
            {submitting ? 'Logging in...' : 'Log in'}
          </button>

          <div style={{ textAlign: 'center', fontSize: 13, color: '#666' }}>
            New company?{' '}
            <span style={{ color: '#185FA5', fontWeight: 600, cursor: 'pointer' }} onClick={goToSignup}>Create an account</span>
          </div>
        </form>
      </div>
    </div>
  );
}

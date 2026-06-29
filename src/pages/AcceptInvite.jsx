// src/pages/AcceptInvite.jsx
import React, { useState, useEffect } from 'react';
import { fetchInvite, markInviteAccepted } from '../data/inviteApi';
import { createUserDoc } from '../data/companyApi';
import { linkMemberToUser } from '../data/jobsApi';
import { auth } from '../firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';

export default function AcceptInvite({ token }) {
  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetchInvite(token).then(inv => {
      if (!inv) setNotFound(true);
      else setInvite(inv);
      setLoading(false);
    });
  }, [token]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    setSubmitting(true);
    try {
      const credential = await createUserWithEmailAndPassword(auth, invite.email, password);
      // Anyone accepting a job invite is "staff" — a logged-in user without company-wide
      // admin rights. Their actual access is scoped per-job via job.members[], not this role.
      await createUserDoc(credential.user.uid, {
        companyId: invite.companyId, role: 'staff', first: invite.name.split(' ')[0] || invite.name,
        last: invite.name.split(' ').slice(1).join(' '), email: invite.email
      });
      await linkMemberToUser(invite.jobId, invite.memberId, credential.user.uid);
      await markInviteAccepted(token);
      setDone(true);
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists. Try logging in instead, then ask whoever invited you to re-link your access.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  const wrap = { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f4f2' };
  const card = { width: 380, background: '#fff', borderRadius: 14, padding: '36px 32px', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' };

  if (loading) return <div style={wrap} />;

  if (notFound) {
    return (
      <div style={wrap}>
        <div style={card}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#B42318', marginBottom: 8 }}>Invite not found</div>
          <p style={{ fontSize: 13, color: '#666' }}>This invite link is invalid or has expired. Ask whoever invited you to send a new one.</p>
        </div>
      </div>
    );
  }

  if (invite.status === 'accepted' && !done) {
    return (
      <div style={wrap}>
        <div style={card}>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Already accepted</div>
          <p style={{ fontSize: 13, color: '#666' }}>This invite has already been used. If this is your account, just log in normally instead.</p>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div style={wrap}>
        <div style={card}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#1a7f37', marginBottom: 8 }}>You're all set</div>
          <p style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>
            Your account is ready and you've been added to <strong>{invite.jobNum} — {invite.jobName}</strong>.
          </p>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => window.location.href = '/'}>
            Go to Builden
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={wrap}>
      <div style={card}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#185FA5' }}>Builden</div>
          <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>You've been invited to a job</div>
        </div>
        <div style={{ padding: '12px 14px', background: '#f8fbff', border: '1px solid #C5DEFA', borderRadius: 10, marginBottom: 18, fontSize: 13 }}>
          <strong>{invite.jobNum} — {invite.jobName}</strong>
          <div style={{ color: '#666', marginTop: 2 }}>{invite.title || 'Team member'} · {invite.email}</div>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#444', display: 'block', marginBottom: 6 }}>Set a password</label>
            <input type="password" className="form-input" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 6 characters" required style={{ width: '100%' }} />
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#444', display: 'block', marginBottom: 6 }}>Confirm password</label>
            <input type="password" className="form-input" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Re-enter password" required style={{ width: '100%' }} />
          </div>
          {error && (
            <div style={{ background: '#FDEEEE', color: '#B42318', fontSize: 13, padding: '8px 12px', borderRadius: 8, marginBottom: 14 }}>{error}</div>
          )}
          <button type="submit" className="btn btn-primary" disabled={submitting} style={{ width: '100%', justifyContent: 'center' }}>
            {submitting ? 'Setting up your account...' : 'Create account & join job'}
          </button>
        </form>
      </div>
    </div>
  );
}

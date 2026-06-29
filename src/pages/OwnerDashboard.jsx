// src/pages/OwnerDashboard.jsx
import React from 'react';
import { useAuth } from '../data/auth';

export default function OwnerDashboard() {
  const { logout, userDoc } = useAuth();

  return (
    <div style={{ minHeight: '100vh', background: '#f4f4f2', padding: 40 }}>
      <div style={{ maxWidth: 600, margin: '0 auto', background: '#fff', borderRadius: 14, padding: 32, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#185FA5' }}>Builden — Owner</div>
            <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>Signed in as {userDoc?.first} {userDoc?.last}</div>
          </div>
          <button className="btn btn-sm" onClick={logout}>Log out</button>
        </div>
        <div style={{ padding: '14px 16px', background: '#f8fbff', border: '1px solid #C5DEFA', borderRadius: 10, fontSize: 13, color: '#185FA5' }}>
          <i className="ti ti-info-circle" /> This is a placeholder. The real Owner Dashboard (cross-company visibility,
          usage, billing status) is planned but not yet built — see Section 11 of the handoff doc.
          For now, this page just confirms the owner role routes correctly and is separate from every
          customer company's workspace.
        </div>
      </div>
    </div>
  );
}

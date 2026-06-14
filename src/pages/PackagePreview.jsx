// src/pages/PackagePreview.jsx
import React from 'react';
import { useStore } from '../data/store';
import { fmt } from '../utils/helpers';
import { Breadcrumb } from '../components/UI';

export default function PackagePreview({ jobId, pkgId, navigate }) {
  const { state } = useStore();
  const job = state.jobs.find(j => j.id === jobId);
  const pkg = job?.packages.find(p => p.id === pkgId);
  const profile = state.companyProfile;

  if (!job || !pkg) return <div className="card"><p style={{ color: '#999' }}>Package not found.</p></div>;

  // Aggregate labor by classification
  const laborByClass = {};
  pkg.tickets.forEach(t => {
    t.labor.forEach(r => {
      const key = r.className || r.classId;
      if (!laborByClass[key]) laborByClass[key] = { className: r.className, workers: new Set(), reg: 0, ot: 0, dt: 0, rate: r.rate, ohp: r.ohp || 10 };
      laborByClass[key].reg += r.reg || 0;
      laborByClass[key].ot += r.ot || 0;
      laborByClass[key].dt += r.dt || 0;
      if (r.workerName) laborByClass[key].workers.add(r.workerName);
    });
  });

  // Aggregate materials
  const matByDesc = {};
  pkg.tickets.forEach(t => {
    t.materials.forEach(r => {
      const key = r.desc + '|' + r.unit;
      if (!matByDesc[key]) matByDesc[key] = { desc: r.desc, unit: r.unit, qty: 0, rate: r.rate, ohp: r.ohp || 15 };
      matByDesc[key].qty += r.qty || 0;
    });
  });

  let grandLaborTotal = 0;
  Object.values(laborByClass).forEach(c => {
    const base = c.reg * c.rate + c.ot * c.rate * 1.5 + c.dt * c.rate * 2;
    grandLaborTotal += base * (1 + c.ohp / 100);
  });

  let grandMatTotal = 0;
  Object.values(matByDesc).forEach(m => {
    grandMatTotal += m.qty * m.rate * (1 + m.ohp / 100);
  });

  const grandTotal = grandLaborTotal + grandMatTotal;

  return (
    <div>
      <Breadcrumb items={[
        { label: 'Jobs', onClick: () => navigate('jobs') },
        { label: job.num, onClick: () => navigate('job-detail', { jobId: job.id }) },
        { label: pkg.num, onClick: () => navigate('package-detail', { jobId: job.id, pkgId: pkg.id }) },
        { label: 'Package Preview' }
      ]} />

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button className="btn" onClick={() => navigate('package-detail', { jobId: job.id, pkgId: pkg.id })}><i className="ti ti-arrow-left" /> Back to package</button>
        <button className="btn btn-primary" onClick={() => window.print()}><i className="ti ti-printer" /> Print / Save PDF</button>
      </div>

      {/* ── SUMMARY PAGE ── */}
      <div className="ticket-preview" style={{ marginBottom: 24 }}>
        <div className="tp-header">
          <div>
            {profile.logo ? <img src={profile.logo} alt="logo" style={{ maxWidth: 140, maxHeight: 60 }} /> :
              <div className="tp-logo"><i className="ti ti-photo" style={{ marginRight: 4 }} /> Upload logo in Settings</div>}
          </div>
          <div className="tp-company">
            <strong>{profile.name}</strong><br />
            {profile.address}<br />
            {profile.city}<br />
            {profile.phone && <>Phone: {profile.phone}<br /></>}
            {profile.fax && <>Fax: {profile.fax}</>}
          </div>
        </div>

        <div style={{ textAlign: 'center', fontWeight: 800, fontSize: 14, marginBottom: 14, textTransform: 'uppercase', letterSpacing: 1, color: '#185FA5' }}>
          Time &amp; Material Summary — {pkg.num}
        </div>

        <div className="tp-field-row"><span className="tp-field-label">Project:</span><span className="tp-field-line">{job.desc}</span><span className="tp-field-label" style={{ marginLeft: 20 }}>Date:</span><span className="tp-field-line" style={{ maxWidth: 100 }}>{new Date().toLocaleDateString()}</span></div>
        <div className="tp-field-row"><span className="tp-field-label">Owner:</span><span className="tp-field-line">{job.owner}</span></div>
        <div className="tp-field-row"><span className="tp-field-label">Architect/Engineer:</span><span className="tp-field-line">{job.ae}</span></div>
        <div className="tp-field-row"><span className="tp-field-label">Prime Contractor:</span><span className="tp-field-line">{job.gc}</span></div>
        <div className="tp-field-row"><span className="tp-field-label">Authorization:</span><span className="tp-field-line">{pkg.authType}{pkg.authRef ? ' — ' + pkg.authRef : ''}</span></div>
        <div className="tp-field-row"><span className="tp-field-label">Description:</span><span className="tp-field-line">{pkg.title}</span></div>

        {/* LABOR SUMMARY */}
        <div className="tp-section">
          <div className="tp-section-title">Labor Summary</div>
          <table className="tp-tbl">
            <thead><tr><th>Classification</th><th>Worker(s)</th><th>Reg hrs</th><th>OT hrs</th><th>DT hrs</th><th>Rate</th><th>Subtotal</th><th>OH&P</th><th>Total</th></tr></thead>
            <tbody>
              {Object.values(laborByClass).map((c, i) => {
                const base = c.reg * c.rate + c.ot * c.rate * 1.5 + c.dt * c.rate * 2;
                const ohpAmt = base * (c.ohp / 100);
                const total = base + ohpAmt;
                return (
                  <tr key={i}>
                    <td style={{ fontWeight: 700 }}>{c.className}</td>
                    <td>{[...c.workers].join(', ')}</td>
                    <td>{c.reg}</td>
                    <td>{c.ot}</td>
                    <td>{c.dt}</td>
                    <td>{fmt(c.rate)}</td>
                    <td>{fmt(base)}</td>
                    <td>{c.ohp}%</td>
                    <td style={{ fontWeight: 700 }}>{fmt(total)}</td>
                  </tr>
                );
              })}
              <tr style={{ background: '#EBF3FB' }}>
                <td colSpan={8} style={{ fontWeight: 700, textAlign: 'right' }}>Labor Total</td>
                <td style={{ fontWeight: 800, color: '#185FA5' }}>{fmt(grandLaborTotal)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* MATERIAL SUMMARY */}
        {Object.values(matByDesc).length > 0 && (
          <div className="tp-section">
            <div className="tp-section-title">Material Summary</div>
            <table className="tp-tbl">
              <thead><tr><th>Description</th><th>Unit</th><th>Qty</th><th>Rate</th><th>Subtotal</th><th>OH&P</th><th>Total</th></tr></thead>
              <tbody>
                {Object.values(matByDesc).map((m, i) => {
                  const base = m.qty * m.rate;
                  const ohpAmt = base * (m.ohp / 100);
                  const total = base + ohpAmt;
                  return (
                    <tr key={i}>
                      <td>{m.desc}</td>
                      <td>{m.unit}</td>
                      <td>{m.qty}</td>
                      <td>{fmt(m.rate)}</td>
                      <td>{fmt(base)}</td>
                      <td>{m.ohp}%</td>
                      <td style={{ fontWeight: 700 }}>{fmt(total)}</td>
                    </tr>
                  );
                })}
                <tr style={{ background: '#E8F5DA' }}>
                  <td colSpan={6} style={{ fontWeight: 700, textAlign: 'right' }}>Material Total</td>
                  <td style={{ fontWeight: 800, color: '#2A6008' }}>{fmt(grandMatTotal)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* GRAND TOTAL */}
        <table className="tp-tbl" style={{ marginTop: 16 }}>
          <tbody>
            <tr style={{ background: '#185FA5', color: '#fff' }}>
              <td colSpan={8} style={{ fontWeight: 800, fontSize: 14, padding: '10px 8px', textAlign: 'right' }}>PACKAGE GRAND TOTAL</td>
              <td style={{ fontWeight: 800, fontSize: 16, padding: '10px 8px' }}>{fmt(grandTotal)}</td>
            </tr>
          </tbody>
        </table>

        <div className="tp-watermark">Generated by FieldTicket · T&M Management Platform</div>
      </div>

      {/* ── DAILY TICKETS ── */}
      {pkg.tickets.map((t, ti) => {
        return (
          <div key={t.id} className="ticket-preview" style={{ marginBottom: 24 }}>
            <div className="tp-header">
              <div>
                {profile.logo ? <img src={profile.logo} alt="logo" style={{ maxWidth: 140, maxHeight: 60 }} /> :
                  <div className="tp-logo"><i className="ti ti-photo" style={{ marginRight: 4 }} /> Upload logo</div>}
              </div>
              <div className="tp-company">
                <strong>{profile.name}</strong><br />
                {profile.address}<br />
                {profile.city}<br />
                {profile.phone && <>Phone: {profile.phone}</>}
              </div>
            </div>

            <div style={{ textAlign: 'center', fontWeight: 800, fontSize: 13, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Time &amp; Material Ticket — {t.num}
            </div>

            <div className="tp-field-row"><span className="tp-field-label">Project:</span><span className="tp-field-line">{job.desc}</span><span className="tp-field-label" style={{ marginLeft: 20 }}>Date:</span><span className="tp-field-line" style={{ maxWidth: 100 }}>{t.date}</span></div>
            <div className="tp-field-row"><span className="tp-field-label">Owner:</span><span className="tp-field-line">{job.owner}</span></div>
            <div className="tp-field-row"><span className="tp-field-label">Architect/Engineer:</span><span className="tp-field-line">{job.ae}</span></div>
            <div className="tp-field-row"><span className="tp-field-label">Prime Contractor:</span><span className="tp-field-line">{job.gc}</span></div>
            <div className="tp-field-row"><span className="tp-field-label">Description of Work:</span></div>
            <div style={{ border: '1px solid #aaa', padding: '6px 8px', fontSize: 12, minHeight: 36, marginBottom: 8 }}>{t.desc}</div>

            {/* LABOR */}
            <div className="tp-section">
              <div className="tp-section-title">Labor</div>
              <table className="tp-tbl">
                <thead><tr><th>Name</th><th>Position</th><th>Hours</th><th>Rate</th><th>Amount</th></tr></thead>
                <tbody>
                  {t.labor.length > 0 ? t.labor.map((r, i) => (
                    <tr key={i}><td>{r.workerName}</td><td>{r.className}</td><td>{r.reg}{r.ot > 0 ? ' + ' + r.ot + ' OT' : ''}{r.dt > 0 ? ' + ' + r.dt + ' DT' : ''}</td><td></td><td></td></tr>
                  )) : null}
                  {/* Empty rows to fill page */}
                  {Array.from({ length: Math.max(0, 6 - t.labor.length) }).map((_, i) => (
                    <tr key={'empty-' + i}><td style={{ height: 22 }}></td><td></td><td></td><td></td><td></td></tr>
                  ))}
                  <tr style={{ background: '#f8f8f8' }}><td colSpan={4} style={{ fontWeight: 700, textAlign: 'right', fontSize: 11 }}>Labor Total</td><td style={{ fontWeight: 700 }}></td></tr>
                </tbody>
              </table>
              <div className="tp-note">***Rates and amounts calculated on summary sheet***</div>
            </div>

            {/* MATERIAL */}
            <div className="tp-section">
              <div className="tp-section-title">Material</div>
              <table className="tp-tbl">
                <thead><tr><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead>
                <tbody>
                  {t.materials.map((r, i) => (
                    <tr key={i}><td>{r.desc}</td><td>{r.qty} {r.unit}</td><td></td><td></td></tr>
                  ))}
                  {Array.from({ length: Math.max(0, 5 - t.materials.length) }).map((_, i) => (
                    <tr key={'empty-' + i}><td style={{ height: 22 }}></td><td></td><td></td><td></td></tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* SUBCONTRACTORS */}
            <div className="tp-section">
              <div className="tp-section-title">Subcontractors / Other</div>
              <table className="tp-tbl">
                <thead><tr><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead>
                <tbody>
                  {t.vendors.map((r, i) => (
                    <tr key={i}><td>{r.name} — {r.desc}</td><td></td><td></td><td>{fmt(r.amount)}</td></tr>
                  ))}
                  {Array.from({ length: Math.max(0, 4 - t.vendors.length) }).map((_, i) => (
                    <tr key={'empty-' + i}><td style={{ height: 22 }}></td><td></td><td></td><td></td></tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* PHOTOS */}
            {t.photos.length > 0 && (
              <div className="tp-section">
                <div className="tp-section-title">Photo Documentation — {t.date}</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 8 }}>
                  {t.photos.map((ph, i) => (
                    <div key={i} style={{ border: '1px solid #ccc', borderRadius: 4, padding: '12px 8px', textAlign: 'center', fontSize: 10, color: '#888' }}>
                      <i className="ti ti-photo" style={{ fontSize: 20, display: 'block', marginBottom: 4 }} />
                      {ph.name}<br />{ph.timestamp}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SIGNATURES */}
            <div className="tp-sig-section">
              <div className="tp-sig-box">
                <p><strong>Contractor's Representative Certification:</strong><br />I hereby acknowledge that the above quantities and descriptions are accurate.</p>
                <div className="tp-sig-line">
                  <div className="tp-sig-underline">{t.foremanName || ''}<br />Contractor Rep (Print Name)</div>
                  <div className="tp-sig-underline" style={{ maxWidth: 120 }}><br />Signature</div>
                </div>
              </div>
              <div className="tp-sig-box">
                <p><strong>Owner's / Owner's Representative Certification:</strong><br />We have verified that the above quantities are accurate and acknowledge satisfactory completion of the work described above.</p>
                <div className="tp-sig-line">
                  <div className="tp-sig-underline">{t.superName || ''}<br />Owner / Owner's Rep (Print Name)</div>
                  <div className="tp-sig-underline" style={{ maxWidth: 120 }}><br />Signature</div>
                </div>
              </div>
            </div>

            <div className="tp-watermark">Generated by FieldTicket · T&M Management Platform</div>
          </div>
        );
      })}
    </div>
  );
}

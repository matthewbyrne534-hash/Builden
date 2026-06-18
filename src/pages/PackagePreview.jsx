// src/pages/PackagePreview.jsx
import React from 'react';
import { useStore } from '../data/store';
import { fmt } from '../utils/helpers';
import { Breadcrumb } from '../components/UI';

export default function PackagePreview({ jobId, pkgId, navigate }) {
  const { state } = useStore();
  const job = state.jobs.find(j => j.id === jobId);
  const pkg = job?.packages.find(p => p.id === pkgId);
  const profile = state.profile || {};

  if (!job || !pkg) return <div className="card"><p style={{ color: '#999' }}>Package not found.</p></div>;

  const prepSettings = pkg.prepSettings || { laborOhp: 0, matOhp: 0, vendorMarkup: 0 };

  // Aggregate labor by classification
  const laborByClass = {};
  pkg.tickets.forEach(t => {
    (t.labor || []).forEach(r => {
      const k = r.className || r.classId || 'Unknown';
      if (!laborByClass[k]) laborByClass[k] = { name: r.className || k, workers: new Set(), reg: 0, ot: 0, dt: 0, regRate: r.regRate || 0, otRate: r.otRate || 0, dtRate: r.dtRate || 0 };
      laborByClass[k].reg += r.reg || 0;
      laborByClass[k].ot += r.ot || 0;
      laborByClass[k].dt += r.dt || 0;
      if (r.workerName) laborByClass[k].workers.add(r.workerName);
    });
  });

  // Aggregate materials
  const matByDesc = {};
  pkg.tickets.forEach(t => {
    (t.materials || []).forEach(r => {
      const k = r.desc + '|' + r.unit;
      if (!matByDesc[k]) matByDesc[k] = { desc: r.desc, unit: r.unit, qty: 0, unitPrice: r.unitPrice || r.rate || 0 };
      matByDesc[k].qty += r.qty || 0;
    });
  });

  // Totals
  let grandLaborBase = 0, grandLaborOhp = 0;
  Object.values(laborByClass).forEach(c => {
    const base = c.reg * c.regRate + c.ot * c.otRate + c.dt * c.dtRate;
    grandLaborBase += base;
    grandLaborOhp += base * (prepSettings.laborOhp / 100);
  });
  const grandLaborTotal = grandLaborBase + grandLaborOhp;

  let grandMatBase = 0, grandMatOhp = 0;
  Object.values(matByDesc).forEach(m => {
    const base = m.qty * m.unitPrice;
    grandMatBase += base;
    grandMatOhp += base * (prepSettings.matOhp / 100);
  });
  const grandMatTotal = grandMatBase + grandMatOhp;
  const grandTotal = grandLaborTotal + grandMatTotal;

  const s = { // print styles
    page: { background: '#fff', border: '1px solid #ccc', maxWidth: 780, padding: '32px 40px', fontFamily: 'Arial, sans-serif', fontSize: 12, lineHeight: 1.5, marginBottom: 24 },
    hdr: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, paddingBottom: 16, borderBottom: '2px solid #1a1a1a' },
    logoBox: { width: 140, height: 60, border: '1px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#aaa', borderRadius: 4 },
    co: { textAlign: 'right', fontSize: 11, lineHeight: 1.7 },
    secTitle: { textAlign: 'center', fontWeight: 700, fontSize: 13, background: '#f0f0f0', border: '1px solid #aaa', padding: 5, marginTop: 16, marginBottom: 0, textTransform: 'uppercase' },
    tbl: { width: '100%', borderCollapse: 'collapse', fontSize: 11, marginBottom: 0 },
    th: { background: '#185FA5', color: '#fff', padding: '5px 8px', textAlign: 'left', fontWeight: 700, border: '1px solid #1a5490' },
    td: { padding: '5px 8px', borderBottom: '1px solid #f0f0ee', verticalAlign: 'middle' },
    tdBold: { padding: '5px 8px', borderBottom: '1px solid #f0f0ee', fontWeight: 700 },
    totalRow: { background: '#EBF3FB', fontWeight: 800 },
    grandRow: { background: '#185FA5', color: '#fff', fontWeight: 800 },
    wm: { textAlign: 'center', fontSize: 9, color: '#ccc', marginTop: 14, letterSpacing: 1, fontStyle: 'italic' },
    fieldRow: { display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 6 },
    fieldLabel: { fontWeight: 700, whiteSpace: 'nowrap', fontSize: 12 },
    fieldLine: { flex: 1, borderBottom: '1px solid #aaa', paddingBottom: 1, fontSize: 12 },
    sigBox: { border: '1px solid #aaa', padding: '10px 12px', fontSize: 11 },
    sigLine: { flex: 1, borderBottom: '1px solid #aaa', paddingBottom: 2, fontSize: 10, color: '#555' }
  };

  function FieldRow({ label, value, label2, value2 }) {
    return (
      <div style={s.fieldRow}>
        <span style={s.fieldLabel}>{label}:</span>
        <span style={s.fieldLine}>{value}</span>
        {label2 && <><span style={{ ...s.fieldLabel, marginLeft: 20 }}>{label2}:</span><span style={{ ...s.fieldLine, maxWidth: 100 }}>{value2}</span></>}
      </div>
    );
  }

  return (
    <div>
      <Breadcrumb items={[
        { label: 'Dashboard', onClick: () => navigate('dashboard') },
        { label: job.num, onClick: () => navigate('job-detail', { jobId: job.id, view: 'packages' }) },
        { label: pkg.num, onClick: () => navigate('package-detail', { jobId: job.id, pkgId: pkg.id }) },
        { label: 'Preview' }
      ]} />

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
        <button className="btn" onClick={() => navigate('package-detail', { jobId: job.id, pkgId: pkg.id })}><i className="ti ti-arrow-left" /> Back</button>
        <button className="btn btn-primary" onClick={() => window.print()}><i className="ti ti-printer" /> Print / Export PDF</button>
        <span style={{ fontSize: 12, color: '#888', marginLeft: 4 }}>Use "Save as PDF" in the print dialog to export</span>
      </div>

      {/* ── SUMMARY PAGE ── */}
      <div style={s.page}>
        <div style={s.hdr}>
          {profile.logo
            ? <img src={profile.logo} alt="logo" style={{ maxWidth: 140, maxHeight: 60 }} />
            : <div style={s.logoBox}><i className="ti ti-photo" style={{ marginRight: 4 }} /> Upload logo in Settings</div>}
          <div style={s.co}>
            <strong>{profile.name || 'Your Company Name'}</strong><br />
            {profile.address}<br />{profile.city}<br />
            {profile.phone && <>Phone: {profile.phone}</>}
          </div>
        </div>

        <div style={{ textAlign: 'center', fontWeight: 800, fontSize: 15, marginBottom: 14, textTransform: 'uppercase', letterSpacing: 1, color: '#185FA5' }}>
          Time &amp; Material Summary — {pkg.num}
        </div>

        <FieldRow label="Project" value={job.name} label2="Date" value2={new Date().toLocaleDateString()} />
        <FieldRow label="Owner" value={job.owner} />
        <FieldRow label="Architect / Engineer" value={job.ae} />
        <FieldRow label="Prime Contractor" value={job.gc} />
        <FieldRow label="Authorization" value={pkg.authType + (pkg.authRef ? ' - ' + pkg.authRef : '')} />
        <FieldRow label="Description" value={pkg.title} />

        {/* LABOR SUMMARY */}
        {Object.keys(laborByClass).length > 0 && (
          <>
            <div style={s.secTitle}>Labor Summary</div>
            <table style={s.tbl}>
              <thead><tr>
                <th style={s.th}>Classification</th><th style={s.th}>Worker(s)</th>
                <th style={s.th}>Reg hrs</th><th style={s.th}>OT hrs</th><th style={s.th}>DT hrs</th>
                <th style={s.th}>Reg rate</th><th style={s.th}>OT rate</th><th style={s.th}>DT rate</th>
                <th style={{ ...s.th, width: 110 }}>Subtotal</th>
              </tr></thead>
              <tbody>
                {Object.values(laborByClass).map((c, i) => {
                  const base = c.reg * c.regRate + c.ot * c.otRate + c.dt * c.dtRate;
                  return (
                    <tr key={i}>
                      <td style={s.tdBold}>{c.name}</td>
                      <td style={s.td}>{[...c.workers].join(', ')}</td>
                      <td style={s.td}>{c.reg}</td><td style={s.td}>{c.ot}</td><td style={s.td}>{c.dt}</td>
                      <td style={s.td}>{fmt(c.regRate)}</td><td style={s.td}>{fmt(c.otRate)}</td><td style={s.td}>{fmt(c.dtRate)}</td>
                      <td style={s.tdBold}>{fmt(base)}</td>
                    </tr>
                  );
                })}
                <tr style={s.totalRow}><td colSpan={8} style={{ ...s.td, textAlign: 'right' }}>Labor subtotal</td><td style={s.td}>{fmt(grandLaborBase)}</td></tr>
                <tr><td colSpan={8} style={{ ...s.td, textAlign: 'right', color: '#888' }}>OH&P ({prepSettings.laborOhp}%)</td><td style={{ ...s.td, color: '#888' }}>{fmt(grandLaborOhp)}</td></tr>
                <tr style={{ ...s.totalRow, background: '#EBF3FB' }}><td colSpan={8} style={{ ...s.td, textAlign: 'right', fontWeight: 800, color: '#185FA5' }}>Labor total</td><td style={{ ...s.td, fontWeight: 800, color: '#185FA5' }}>{fmt(grandLaborTotal)}</td></tr>
              </tbody>
            </table>
          </>
        )}

        {/* MATERIAL SUMMARY */}
        {Object.keys(matByDesc).length > 0 && (
          <>
            <div style={s.secTitle}>Material Summary</div>
            <table style={s.tbl}>
              <thead><tr>
                <th style={s.th}>Description</th><th style={s.th}>Unit</th>
                <th style={s.th}>Qty</th><th style={s.th}>Unit price</th><th style={{ ...s.th, width: 110 }}>Subtotal</th>
              </tr></thead>
              <tbody>
                {Object.values(matByDesc).map((m, i) => {
                  const base = m.qty * m.unitPrice;
                  return (
                    <tr key={i}>
                      <td style={s.td}>{m.desc}</td><td style={s.td}>{m.unit}</td>
                      <td style={s.td}>{m.qty}</td><td style={s.td}>{fmt(m.unitPrice)}</td>
                      <td style={s.tdBold}>{fmt(base)}</td>
                    </tr>
                  );
                })}
                <tr style={s.totalRow}>
                  <td colSpan={4} style={{ ...s.td, textAlign: 'right' }}>Material subtotal</td>
                  <td style={s.td}>{fmt(grandMatBase)}</td>
                </tr>
                <tr>
                  <td colSpan={4} style={{ ...s.td, textAlign: 'right', color: '#888' }}>OH&P ({prepSettings.matOhp}%)</td>
                  <td style={{ ...s.td, color: '#888' }}>{fmt(grandMatOhp)}</td>
                </tr>
                <tr style={{ background: '#E8F5DA' }}>
                  <td colSpan={4} style={{ ...s.td, textAlign: 'right', fontWeight: 800, color: '#2A6008' }}>Material total</td>
                  <td style={{ ...s.td, fontWeight: 800, color: '#2A6008' }}>{fmt(grandMatTotal)}</td>
                </tr>
              </tbody>
            </table>
          </>
        )}

        {/* GRAND TOTAL */}
        <table style={{ ...s.tbl, marginTop: 16 }}>
          <tbody>
            <tr style={s.grandRow}>
              <td colSpan={8} style={{ fontWeight: 800, fontSize: 14, padding: '10px 8px', textAlign: 'right' }}>PACKAGE GRAND TOTAL</td>
              <td style={{ fontWeight: 800, fontSize: 16, padding: '10px 8px' }}>{fmt(grandTotal)}</td>
            </tr>
          </tbody>
        </table>
        <div style={s.wm}>Generated by Builden · T&M Management Platform</div>
      </div>

      {/* ── DAILY TICKETS ── */}
      {pkg.tickets.map((t, ti) => (
        <div key={t.id} style={s.page}>
          <div style={s.hdr}>
            {profile.logo
              ? <img src={profile.logo} alt="logo" style={{ maxWidth: 140, maxHeight: 55 }} />
              : <div style={s.logoBox}>Logo</div>}
            <div style={s.co}>
              <strong>{profile.name || 'Your Company Name'}</strong><br />
              {profile.address}<br />{profile.city}<br />
              {profile.phone && <>Phone: {profile.phone}</>}
            </div>
          </div>

          <div style={{ textAlign: 'center', fontWeight: 800, fontSize: 14, marginBottom: 12, textTransform: 'uppercase' }}>
            Time &amp; Material Ticket — {t.num}
          </div>

          <FieldRow label="Project" value={job.name} label2="Date" value2={t.date} />
          <FieldRow label="Owner" value={job.owner} />
          <FieldRow label="Prime Contractor" value={job.gc} />
          <div style={{ fontWeight: 700, fontSize: 12, marginTop: 8 }}>Description of Work:</div>
          <div style={{ border: '1px solid #aaa', padding: '6px 8px', fontSize: 12, minHeight: 36, marginBottom: 12 }}>{t.desc}</div>

          {/* LABOR */}
          <div style={s.secTitle}>Labor</div>
          <table style={s.tbl}>
            <thead><tr>
              <th style={s.th}>Name</th><th style={s.th}>Position</th>
              <th style={s.th}>Reg hrs</th><th style={s.th}>OT hrs</th><th style={s.th}>DT hrs</th>
            </tr></thead>
            <tbody>
              {(t.labor || []).map((r, i) => (
                <tr key={i}>
                  <td style={s.td}>{r.workerName}</td><td style={s.td}>{r.className}</td>
                  <td style={s.td}>{r.reg}</td><td style={s.td}>{r.ot || 0}</td><td style={s.td}>{r.dt || 0}</td>
                </tr>
              ))}
              {Array.from({ length: Math.max(0, 8 - (t.labor || []).length) }).map((_, i) => (
                <tr key={'e' + i}><td style={{ ...s.td, height: 22 }}></td><td style={s.td}></td><td style={s.td}></td><td style={s.td}></td><td style={s.td}></td></tr>
              ))}
            </tbody>
          </table>

          {/* MATERIAL */}
          <div style={s.secTitle}>Material</div>
          <table style={s.tbl}>
            <thead><tr>
              <th style={s.th}>Description</th><th style={s.th}>Unit</th>
              <th style={s.th}>Unit price</th><th style={s.th}>Qty</th><th style={s.th}>Total</th>
            </tr></thead>
            <tbody>
              {(t.materials || []).map((r, i) => (
                <tr key={i}>
                  <td style={s.td}>{r.desc}</td><td style={s.td}>{r.unit}</td>
                  <td style={s.td}>{r.unitPrice ? fmt(r.unitPrice) : ''}</td>
                  <td style={s.td}>{r.qty}</td>
                  <td style={s.td}>{r.unitPrice && r.qty ? fmt(r.qty * r.unitPrice) : ''}</td>
                </tr>
              ))}
              {Array.from({ length: Math.max(0, 5 - (t.materials || []).length) }).map((_, i) => (
                <tr key={'e' + i}><td style={{ ...s.td, height: 22 }}></td><td style={s.td}></td><td style={s.td}></td><td style={s.td}></td><td style={s.td}></td></tr>
              ))}
            </tbody>
          </table>

          {/* SUBCONTRACTORS */}
          {(t.vendors || []).length > 0 && (
            <>
              <div style={s.secTitle}>Subcontractors / Other</div>
              <table style={s.tbl}>
                <thead><tr><th style={s.th}>Vendor / Sub name</th><th style={s.th}>Description</th><th style={s.th}>Amount</th></tr></thead>
                <tbody>
                  {t.vendors.map((v, i) => (
                    <tr key={i}>
                      <td style={s.td}>{v.name}</td><td style={s.td}>{v.desc}</td><td style={s.td}>{v.amount ? fmt(v.amount) : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {/* PHOTOS */}
          {(t.photos || []).length > 0 && (
            <>
              <div style={s.secTitle}>Photo Documentation — {t.date}</div>
              <div style={{ fontSize: 10, color: '#888', fontStyle: 'italic', margin: '6px 0 8px', padding: '4px 8px', background: '#fffdf0', border: '1px solid #f5d87a', borderRadius: 4 }}>
                Photos will display here when image storage is enabled in Phase 2. {t.photos.length} photo{t.photos.length !== 1 ? 's' : ''} attached.
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 4 }}>
                {t.photos.map((ph, i) => (
                  <div key={i} style={{ border: '1px dashed #ccc', borderRadius: 4, padding: '16px 8px', textAlign: 'center', fontSize: 10, color: '#aaa', background: '#fafaf8' }}>
                    <i className="ti ti-photo" style={{ fontSize: 24, display: 'block', marginBottom: 6, color: '#ccc' }} />
                    <div style={{ fontWeight: 600, color: '#888' }}>{ph.name}</div>
                    <div style={{ marginTop: 2 }}>{ph.date}</div>
                    <div style={{ marginTop: 2, fontSize: 9 }}>{ph.timestamp}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* SIGNATURES */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
            <div style={{ ...s.sigBox, display: 'flex', flexDirection: 'column' }}>
              <p style={{ marginBottom: 8, lineHeight: 1.5, minHeight: 44 }}><strong>Contractor's Representative Certification:</strong><br />I hereby acknowledge that the above quantities and descriptions are accurate.</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto', gap: 12 }}>
                <div style={{ ...s.sigLine, flex: 2 }}>{t.foremanName || ''}<br />Print Name</div>
                <div style={{ ...s.sigLine, flex: 2 }}><br />Signature</div>
                <div style={{ ...s.sigLine, flex: 1, maxWidth: 70 }}>{t.foremanSignedAt ? t.foremanSignedAt.split(',')[0] : ''}<br />Date</div>
              </div>
            </div>
            <div style={{ ...s.sigBox, display: 'flex', flexDirection: 'column' }}>
              <p style={{ marginBottom: 8, lineHeight: 1.5, minHeight: 44 }}><strong>Owner's / GC Representative Certification:</strong><br />We have verified that the above quantities are accurate.</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto', gap: 12 }}>
                <div style={{ ...s.sigLine, flex: 2 }}>{t.superName || ''}<br />Print Name</div>
                <div style={{ ...s.sigLine, flex: 2 }}><br />Signature</div>
                <div style={{ ...s.sigLine, flex: 1, maxWidth: 70 }}>{t.superSignedAt ? t.superSignedAt.split(',')[0] : ''}<br />Date</div>
              </div>
            </div>
          </div>
          <div style={s.wm}>Generated by Builden · T&M Management Platform</div>
        </div>
      ))}
    </div>
  );
}

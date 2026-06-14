// src/utils/helpers.js

export function genId() {
  return 'id_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

export function fmt(n) {
  if (n === undefined || n === null || isNaN(n)) return '$0.00';
  return '$' + Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function initials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().substr(0, 2);
}

export function calcTicketTotals(ticket, job) {
  let laborBase = 0;
  let laborOhpAmt = 0;
  (ticket.labor || []).forEach(r => {
    const base = (r.reg || 0) * (r.rate || 0) + (r.ot || 0) * (r.rate || 0) * 1.5 + (r.dt || 0) * (r.rate || 0) * 2;
    laborBase += base;
    laborOhpAmt += base * ((r.ohp || 0) / 100);
  });
  const laborTotal = laborBase + laborOhpAmt;

  let matBase = 0;
  let matOhpAmt = 0;
  (ticket.materials || []).forEach(r => {
    const base = (r.qty || 0) * (r.rate || 0);
    matBase += base;
    matOhpAmt += base * ((r.ohp || 0) / 100);
  });
  const matTotal = matBase + matOhpAmt;

  let vendorBase = 0;
  let vendorOhpAmt = 0;
  (ticket.vendors || []).forEach(r => {
    vendorBase += (r.amount || 0);
    vendorOhpAmt += (r.amount || 0) * ((r.markup || 0) / 100);
  });
  const vendorTotal = vendorBase + vendorOhpAmt;

  return {
    laborBase, laborOhpAmt, laborTotal,
    matBase, matOhpAmt, matTotal,
    vendorBase, vendorOhpAmt, vendorTotal,
    grand: laborTotal + matTotal + vendorTotal
  };
}

export function calcPackageTotals(pkg, job) {
  let grand = 0;
  let executed = 0;
  (pkg.tickets || []).forEach(t => {
    const tots = calcTicketTotals(t, job);
    grand += tots.grand;
    if (t.status === 'signed' || t.status === 'submitted' || t.status === 'approved') {
      executed += tots.grand;
    }
  });
  return { grand, executed };
}

export function pkgStatusInfo(pkg) {
  const statuses = (pkg.tickets || []).map(t => t.status);
  if (pkg.voided) return { label: 'Voided', cls: 'badge-red' };
  if (statuses.length === 0) return { label: 'No tickets', cls: 'badge-gray' };
  if (statuses.every(s => s === 'approved')) return { label: 'GC Approved', cls: 'badge-success' };
  if (statuses.some(s => s === 'submitted')) return { label: 'Submitted to GC', cls: 'badge-info' };
  if (statuses.every(s => s === 'signed')) return { label: 'All signed', cls: 'badge-success' };
  if (statuses.some(s => s === 'pending-sig')) return { label: 'Awaiting signature', cls: 'badge-warning' };
  return { label: 'In progress', cls: 'badge-gray' };
}

export function ticketStatusInfo(status) {
  const map = {
    draft: { label: 'Draft', cls: 'badge-gray' },
    'pending-sig': { label: 'Awaiting sig', cls: 'badge-warning' },
    signed: { label: 'Signed', cls: 'badge-success' },
    submitted: { label: 'Submitted', cls: 'badge-info' },
    approved: { label: 'Approved', cls: 'badge-success' },
    void: { label: 'Void', cls: 'badge-red' }
  };
  return map[status] || { label: status, cls: 'badge-gray' };
}

export function buildTicketNum(numSystem, pkgSeq, ticketSeq) {
  const base = numSystem
    .replace('{seq}', String(pkgSeq).padStart(3, '0'))
    .replace('{year}', new Date().getFullYear());
  return base + '.' + ticketSeq;
}

export function buildPkgNum(numSystem, pkgSeq) {
  return numSystem
    .replace('{seq}', String(pkgSeq).padStart(3, '0'))
    .replace('{year}', new Date().getFullYear());
}

export const AUTH_TYPES = [
  'Approved Submittal Revision',
  'Authorization Email',
  'Change Event',
  'Design Team Clarification',
  'Emergency Work Authorization',
  'Field Work Order',
  'Meeting Minutes Directing the Work',
  'Notice to Proceed on T&M Basis',
  'Other',
  'Revised Drawing',
  'Revised Specification',
  'RFI Response',
  'Sketch or Bulletin'
];

export const NUM_SYSTEMS = [
  { label: 'TM-001 (default)', value: 'TM-{seq}' },
  { label: 'Job#-TM-001', value: '{jobnum}-TM-{seq}' },
  { label: 'Custom (type below)', value: 'custom' }
];

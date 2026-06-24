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

// Ticket totals — no OH&P applied here, just raw hours x rates
// OH&P is applied at package level by the PM during package preparation
export function calcTicketTotals(ticket) {
  let laborBase = 0;
  (ticket.labor || []).forEach(r => {
    const base = (r.reg || 0) * (r.regRate || 0)
               + (r.ot || 0) * (r.otRate || 0)
               + (r.dt || 0) * (r.dtRate || 0);
    laborBase += base;
  });

  let matBase = 0;
  (ticket.materials || []).forEach(r => {
    matBase += (r.qty || 0) * (r.unitPrice || r.rate || 0);
  });

  let vendorBase = 0;
  (ticket.vendors || []).forEach(r => {
    vendorBase += (r.amount || 0);
  });

  return {
    laborBase,
    matBase,
    vendorBase,
    grand: laborBase + matBase + vendorBase
  };
}

// Package totals with OH&P applied at package level
export function calcPackageTotalsWithOhp(pkg, prepSettings) {
  let laborBase = 0;
  let matBase = 0;
  let vendorBase = 0;

  (pkg.tickets || []).forEach(t => {
    if (t.status === 'void') return; // voided tickets never count toward totals
    const tots = calcTicketTotals(t);
    laborBase += tots.laborBase;
    matBase += tots.matBase;
    vendorBase += tots.vendorBase;
  });

  const laborOhp = laborBase * ((prepSettings?.laborOhp || 0) / 100);
  const matOhp = matBase * ((prepSettings?.matOhp || 0) / 100);
  const vendorOhp = vendorBase * ((prepSettings?.vendorMarkup || 0) / 100);

  return {
    laborBase, laborOhp, laborTotal: laborBase + laborOhp,
    matBase, matOhp, matTotal: matBase + matOhp,
    vendorBase, vendorOhp, vendorTotal: vendorBase + vendorOhp,
    grand: laborBase + laborOhp + matBase + matOhp + vendorBase + vendorOhp
  };
}

// Simple package totals without OH&P (for dashboard/list views)
export function calcPackageTotals(pkg) {
  let grand = 0;
  let executed = 0;
  (pkg.tickets || []).forEach(t => {
    if (t.status === 'void') return; // voided tickets never count toward totals
    const tots = calcTicketTotals(t);
    grand += tots.grand;
    if (t.status === 'executed') {
      executed += tots.grand;
    }
  });
  return { grand, executed };
}

export function pkgStatusInfo(pkg) {
  const map = {
    open: { label: 'Open / In Progress', cls: 'badge-gray' },
    pending: { label: 'Pending GC Approval', cls: 'badge-warning' },
    executed: { label: 'Executed', cls: 'badge-success' }
  };
  return map[pkg.pkgStatus || 'open'] || map.open;
}

export function ticketStatusInfo(status) {
  const map = {
    draft: { label: 'Draft', cls: 'badge-gray' },
    'awaiting-foreman-sig': { label: 'Awaiting Foreman Signature', cls: 'badge-warning' },
    'awaiting-super-sig': { label: 'Awaiting Super Signature', cls: 'badge-info' },
    executed: { label: 'Executed', cls: 'badge-success' },
    void: { label: 'Void', cls: 'badge-red' }
  };
  return map[status] || { label: status, cls: 'badge-gray' };
}

export function buildPkgNum(numSystem, pkgSeq) {
  return numSystem
    .replace('{seq}', String(pkgSeq).padStart(3, '0'))
    .replace('{year}', new Date().getFullYear());
}

// Resolves the active personnel roster for a job: the full company-wide roster,
// minus anyone the PM has removed from this specific job. One-way subtraction only —
// adding/editing workers always happens at the company level, never inside a job.
export function getJobRoster(job, companyRoster) {
  const removed = new Set(job.removedRosterIds || []);
  return (companyRoster || []).filter(w => !removed.has(w.id));
}

export const PERMISSION_LEVELS = [
  { value: 'full', label: 'Full Access', description: 'Create/edit/delete packages, prepare packages, manage job setup and directory' },
  { value: 'standard', label: 'Standard Access', description: 'Create and edit T&M tickets only, within packages that already exist' }
];

export const AUTH_TYPES = [
  'Authorization Email',
  'Change Event',
  'Emergency Work Authorization',
  'Meeting Minutes Directing the Work',
  'RFI Response',
  'Other'
];

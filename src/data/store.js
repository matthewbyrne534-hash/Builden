// src/data/store.js
import React, { createContext, useContext, useReducer } from 'react';
import { useEffect } from 'react';
import { fetchInternalTeam, fetchInternalRoles, addInternalTeamMember, updateInternalTeamMember, removeInternalTeamMember, addInternalRole } from './internalTeamApi';
import { fetchClassifications, fetchPersonnelRoster, addClassification, updateClassification, removeClassification, addWorker, updateWorker, removeWorker } from './personnelRosterApi';

const initialState = {
  currentJobId: null,
  recentJobIds: [],

  profile: { name: 'Granite Peak Contracting', address: '14 Industrial Park Rd', city: 'Plattsburgh, NY 12901', phone: '(518) 555-7700', logo: null },

  // Company-wide list of role TITLES used across the Internal Team — grows organically,
  // same picker pattern as labor classifications and materials (type new, or pick existing).
  internalRoles: [],

  internalTeam: [],

  classifications: [],
  personnelRoster: [],

  gcCompanies: [
    { id: 'gc1', name: 'BBL Construction Services, LLC', phone: '(518) 555-3300', email: 'info@bblcs.com', address: '100 Construction Way, Albany, NY 12205' },
    { id: 'gc2', name: 'Hayner Hoyt Corporation', phone: '(315) 555-4400', email: 'info@haynerhoyt.com', address: '601 South Crouse Ave, Syracuse, NY 13210' },
    { id: 'gc3', name: 'Christa Construction LLC', phone: '(585) 555-5500', email: 'info@christabuilds.com', address: '5500 Main St, Williamsville, NY 14221' }
  ],
  gcSupers: [
    { id: 'gs1', gcCompanyId: 'gc1', first: 'Scott', last: 'Hamilton', email: 'shamilton@bblcs.com', phone: '(518) 555-3301' },
    { id: 'gs2', gcCompanyId: 'gc1', first: 'Paul', last: 'Wilson', email: 'pwilson@bblcs.com', phone: '(518) 555-3302' },
    { id: 'gs3', gcCompanyId: 'gc2', first: 'Karen', last: 'Boyce', email: 'kboyce@haynerhoyt.com', phone: '(315) 555-4401' },
    { id: 'gs4', gcCompanyId: 'gc2', first: 'Rick', last: 'Delgado', email: 'rdelgado@haynerhoyt.com', phone: '(315) 555-4402' },
    { id: 'gs5', gcCompanyId: 'gc3', first: 'Wendy', last: 'Tran', email: 'wtran@christabuilds.com', phone: '(585) 555-5501' },
    { id: 'gs6', gcCompanyId: 'gc3', first: 'Greg', last: 'Palumbo', email: 'gpalumbo@christabuilds.com', phone: '(585) 555-5502' }
  ],

  jobs: [
    {
      id: 'j1', num: '241026', name: 'BOCES - Plattsburgh', address: '32 Bow Arrow Point Drive', city: 'Plattsburgh', state: 'NY', zip: '12901',
      gc: 'BBL Construction Services, LLC', owner: 'CIDC, Inc.', ae: 'WCGS / Huston',
      removedRosterIds: [],
      classificationRates: [
        { classId: 'c1', regRate: 48.50, otRate: 72.75, dtRate: 97.00 },
        { classId: 'c2', regRate: 38.00, otRate: 57.00, dtRate: 76.00 },
        { classId: 'c3', regRate: 32.00, otRate: 48.00, dtRate: 64.00 }
      ],
      members: [
        { id: 'jm1', sourceType: 'internal', sourceId: 'it1', name: 'Chris Ruggles', email: 'cruggles@granitepeak.com', phone: '(518) 555-2210', title: 'Project Manager', permission: 'full', inviteSent: false, inviteStatus: 'not-sent' },
        { id: 'jm2', sourceType: 'gc', sourceId: 'gs1', name: 'Scott Hamilton', email: 'shamilton@bblcs.com', phone: '(518) 555-3301', role: 'super' },
        { id: 'jm3', sourceType: 'gc', sourceId: 'gs2', name: 'Paul Wilson', email: 'pwilson@bblcs.com', phone: '(518) 555-3302', role: 'super' }
      ],
      packages: [
        { id: 'p1', num: 'TM-001', numSystem: 'TM-{seq}', title: 'FRP Furnish and Install in the CTE Building', authType: 'Change Event', authRef: 'CE-003', authFileName: null, prepSettings: null, pkgStatus: 'open',
          tickets: [{ id: 't1', num: 'TM-001.1', date: '2026-02-02', desc: 'Installed FRP wall panels in CTE classroom 102.', labor: [{ id: 'l1_0', workerId: 'w1', workerName: 'Mike Donovan', classId: 'c1', className: 'Foreman', reg: 6, ot: 3, dt: 0, regRate: 48.5, otRate: 72.75, dtRate: 97.0 }, { id: 'l1_1', workerId: 'w5', workerName: 'Carlos Mendez', classId: 'c2', className: 'Carpenter', reg: 6, ot: 3, dt: 0, regRate: 38.0, otRate: 57.0, dtRate: 76.0 }, { id: 'l1_2', workerId: 'w4', workerName: 'Jake Whitford', classId: 'c2', className: 'Carpenter', reg: 8, ot: 0, dt: 0, regRate: 38.0, otRate: 57.0, dtRate: 76.0 }], materials: [], vendors: [], photos: [], foremanId: '', foremanName: '', superId: '', superName: '', status: 'draft' }, { id: 't2', num: 'TM-001.2', date: '2026-02-03', desc: 'Furnished and installed FRP corner guards along main corridor.', labor: [{ id: 'l2_0', workerId: 'w1', workerName: 'Mike Donovan', classId: 'c1', className: 'Foreman', reg: 8, ot: 0, dt: 0, regRate: 48.5, otRate: 72.75, dtRate: 97.0 }, { id: 'l2_1', workerId: 'w7', workerName: 'Tyler Brooks', classId: 'c2', className: 'Carpenter', reg: 6, ot: 0, dt: 0, regRate: 38.0, otRate: 57.0, dtRate: 76.0 }, { id: 'l2_2', workerId: 'w6', workerName: 'Brian Foley', classId: 'c2', className: 'Carpenter', reg: 8, ot: 0, dt: 0, regRate: 38.0, otRate: 57.0, dtRate: 76.0 }], materials: [], vendors: [], photos: [], foremanId: '', foremanName: '', superId: '', superName: '', status: 'awaiting-foreman-sig' }, { id: 't3', num: 'TM-001.3', date: '2026-02-04', desc: 'Installed FRP panels in welding lab wash-down area.', labor: [{ id: 'l3_0', workerId: 'w2', workerName: 'Tony Marchetti', classId: 'c1', className: 'Foreman', reg: 8, ot: 3, dt: 0, regRate: 48.5, otRate: 72.75, dtRate: 97.0 }, { id: 'l3_1', workerId: 'w3', workerName: 'Dave Sullivan', classId: 'c2', className: 'Carpenter', reg: 8, ot: 0, dt: 0, regRate: 38.0, otRate: 57.0, dtRate: 76.0 }, { id: 'l3_2', workerId: 'w6', workerName: 'Brian Foley', classId: 'c2', className: 'Carpenter', reg: 8, ot: 3, dt: 0, regRate: 38.0, otRate: 57.0, dtRate: 76.0 }], materials: [{ id: 'm3_2', desc: 'FRP adhesive caulk', unit: 'ea', qty: 2, unitPrice: 14.75, invoiceName: '' }], vendors: [], photos: [], foremanId: '', foremanName: '', superId: '', superName: '', status: 'draft' }, { id: 't4', num: 'TM-001.4', date: '2026-02-05', desc: 'Continued FRP panel installation in CTE classroom 104.', labor: [{ id: 'l4_0', workerId: 'w2', workerName: 'Tony Marchetti', classId: 'c1', className: 'Foreman', reg: 7, ot: 0, dt: 0, regRate: 48.5, otRate: 72.75, dtRate: 97.0 }, { id: 'l4_1', workerId: 'w7', workerName: 'Tyler Brooks', classId: 'c2', className: 'Carpenter', reg: 6, ot: 0, dt: 0, regRate: 38.0, otRate: 57.0, dtRate: 76.0 }, { id: 'l4_2', workerId: 'w4', workerName: 'Jake Whitford', classId: 'c2', className: 'Carpenter', reg: 6, ot: 2, dt: 0, regRate: 38.0, otRate: 57.0, dtRate: 76.0 }, { id: 'l4_3', workerId: 'w5', workerName: 'Carlos Mendez', classId: 'c2', className: 'Carpenter', reg: 8, ot: 2, dt: 0, regRate: 38.0, otRate: 57.0, dtRate: 76.0 }], materials: [{ id: 'm4_1', desc: 'FRP wall panel 4x8 sheet', unit: 'ea', qty: 8, unitPrice: 62.5, invoiceName: '' }], vendors: [], photos: [], foremanId: '', foremanName: '', superId: '', superName: '', status: 'awaiting-foreman-sig' }, { id: 't5', num: 'TM-001.5', date: '2026-02-06', desc: 'Installed FRP base trim and J-channel in CTE shop area.', labor: [{ id: 'l5_0', workerId: 'w2', workerName: 'Tony Marchetti', classId: 'c1', className: 'Foreman', reg: 8, ot: 0, dt: 0, regRate: 48.5, otRate: 72.75, dtRate: 97.0 }, { id: 'l5_1', workerId: 'w5', workerName: 'Carlos Mendez', classId: 'c2', className: 'Carpenter', reg: 7, ot: 2, dt: 0, regRate: 38.0, otRate: 57.0, dtRate: 76.0 }, { id: 'l5_2', workerId: 'w3', workerName: 'Dave Sullivan', classId: 'c2', className: 'Carpenter', reg: 8, ot: 0, dt: 0, regRate: 38.0, otRate: 57.0, dtRate: 76.0 }, { id: 'l5_3', workerId: 'w8', workerName: 'Sean Murphy', classId: 'c3', className: 'Laborer', reg: 8, ot: 0, dt: 0, regRate: 32.0, otRate: 48.0, dtRate: 64.0 }], materials: [{ id: 'm5_1', desc: 'FRP wall panel 4x8 sheet', unit: 'ea', qty: 4, unitPrice: 62.5, invoiceName: '' }], vendors: [], photos: [], foremanId: '', foremanName: '', superId: '', superName: '', status: 'draft' }, { id: 't6', num: 'TM-001.6', date: '2026-02-09', desc: 'Furnished and installed FRP panels in culinary arts classroom.', labor: [{ id: 'l6_0', workerId: 'w1', workerName: 'Mike Donovan', classId: 'c1', className: 'Foreman', reg: 8, ot: 0, dt: 0, regRate: 48.5, otRate: 72.75, dtRate: 97.0 }, { id: 'l6_1', workerId: 'w6', workerName: 'Brian Foley', classId: 'c2', className: 'Carpenter', reg: 7, ot: 2, dt: 0, regRate: 38.0, otRate: 57.0, dtRate: 76.0 }, { id: 'l6_2', workerId: 'w5', workerName: 'Carlos Mendez', classId: 'c2', className: 'Carpenter', reg: 8, ot: 2, dt: 0, regRate: 38.0, otRate: 57.0, dtRate: 76.0 }, { id: 'l6_3', workerId: 'w3', workerName: 'Dave Sullivan', classId: 'c2', className: 'Carpenter', reg: 7, ot: 0, dt: 0, regRate: 38.0, otRate: 57.0, dtRate: 76.0 }], materials: [{ id: 'm6_2', desc: 'FRP adhesive caulk', unit: 'ea', qty: 4, unitPrice: 14.75, invoiceName: '' }], vendors: [], photos: [], foremanId: '', foremanName: '', superId: '', superName: '', status: 'awaiting-foreman-sig' }, { id: 't7', num: 'TM-001.7', date: '2026-02-10', desc: 'Installed FRP panels and trim in automotive tech bay.', labor: [{ id: 'l7_0', workerId: 'w2', workerName: 'Tony Marchetti', classId: 'c1', className: 'Foreman', reg: 7, ot: 3, dt: 0, regRate: 48.5, otRate: 72.75, dtRate: 97.0 }, { id: 'l7_1', workerId: 'w7', workerName: 'Tyler Brooks', classId: 'c2', className: 'Carpenter', reg: 8, ot: 0, dt: 0, regRate: 38.0, otRate: 57.0, dtRate: 76.0 }, { id: 'l7_2', workerId: 'w6', workerName: 'Brian Foley', classId: 'c2', className: 'Carpenter', reg: 6, ot: 0, dt: 0, regRate: 38.0, otRate: 57.0, dtRate: 76.0 }, { id: 'l7_3', workerId: 'w4', workerName: 'Jake Whitford', classId: 'c2', className: 'Carpenter', reg: 7, ot: 0, dt: 0, regRate: 38.0, otRate: 57.0, dtRate: 76.0 }], materials: [{ id: 'm7_1', desc: 'FRP wall panel 4x8 sheet', unit: 'ea', qty: 10, unitPrice: 62.5, invoiceName: '' }], vendors: [], photos: [], foremanId: '', foremanName: '', superId: '', superName: '', status: 'draft' }, { id: 't8', num: 'TM-001.8', date: '2026-02-11', desc: 'Completed FRP panel installation in CTE corridor B.', labor: [{ id: 'l8_0', workerId: 'w2', workerName: 'Tony Marchetti', classId: 'c1', className: 'Foreman', reg: 8, ot: 0, dt: 0, regRate: 48.5, otRate: 72.75, dtRate: 97.0 }, { id: 'l8_1', workerId: 'w7', workerName: 'Tyler Brooks', classId: 'c2', className: 'Carpenter', reg: 6, ot: 3, dt: 0, regRate: 38.0, otRate: 57.0, dtRate: 76.0 }, { id: 'l8_2', workerId: 'w6', workerName: 'Brian Foley', classId: 'c2', className: 'Carpenter', reg: 8, ot: 0, dt: 0, regRate: 38.0, otRate: 57.0, dtRate: 76.0 }, { id: 'l8_3', workerId: 'w5', workerName: 'Carlos Mendez', classId: 'c2', className: 'Carpenter', reg: 6, ot: 0, dt: 0, regRate: 38.0, otRate: 57.0, dtRate: 76.0 }], materials: [{ id: 'm8_1', desc: 'FRP wall panel 4x8 sheet', unit: 'ea', qty: 10, unitPrice: 62.5, invoiceName: '' }], vendors: [], photos: [], foremanId: '', foremanName: '', superId: '', superName: '', status: 'awaiting-foreman-sig' }, { id: 't9', num: 'TM-001.9', date: '2026-02-12', desc: 'Installed FRP panels in cosmetology classroom wet area.', labor: [{ id: 'l9_0', workerId: 'w2', workerName: 'Tony Marchetti', classId: 'c1', className: 'Foreman', reg: 8, ot: 3, dt: 0, regRate: 48.5, otRate: 72.75, dtRate: 97.0 }, { id: 'l9_1', workerId: 'w7', workerName: 'Tyler Brooks', classId: 'c2', className: 'Carpenter', reg: 7, ot: 0, dt: 0, regRate: 38.0, otRate: 57.0, dtRate: 76.0 }, { id: 'l9_2', workerId: 'w3', workerName: 'Dave Sullivan', classId: 'c2', className: 'Carpenter', reg: 8, ot: 0, dt: 0, regRate: 38.0, otRate: 57.0, dtRate: 76.0 }, { id: 'l9_3', workerId: 'w9', workerName: 'Adam Lefebvre', classId: 'c3', className: 'Laborer', reg: 8, ot: 3, dt: 0, regRate: 32.0, otRate: 48.0, dtRate: 64.0 }], materials: [{ id: 'm9_1', desc: 'FRP wall panel 4x8 sheet', unit: 'ea', qty: 8, unitPrice: 62.5, invoiceName: '' }], vendors: [], photos: [], foremanId: '', foremanName: '', superId: '', superName: '', status: 'draft' }, { id: 't10', num: 'TM-001.10', date: '2026-02-13', desc: 'Final FRP panel installation and trim work in CTE shop 3.', labor: [{ id: 'l10_0', workerId: 'w1', workerName: 'Mike Donovan', classId: 'c1', className: 'Foreman', reg: 8, ot: 0, dt: 0, regRate: 48.5, otRate: 72.75, dtRate: 97.0 }, { id: 'l10_1', workerId: 'w5', workerName: 'Carlos Mendez', classId: 'c2', className: 'Carpenter', reg: 6, ot: 2, dt: 0, regRate: 38.0, otRate: 57.0, dtRate: 76.0 }, { id: 'l10_2', workerId: 'w4', workerName: 'Jake Whitford', classId: 'c2', className: 'Carpenter', reg: 6, ot: 3, dt: 0, regRate: 38.0, otRate: 57.0, dtRate: 76.0 }, { id: 'l10_3', workerId: 'w3', workerName: 'Dave Sullivan', classId: 'c2', className: 'Carpenter', reg: 7, ot: 0, dt: 0, regRate: 38.0, otRate: 57.0, dtRate: 76.0 }], materials: [{ id: 'm10_1', desc: 'FRP wall panel 4x8 sheet', unit: 'ea', qty: 6, unitPrice: 62.5, invoiceName: '' }], vendors: [], photos: [], foremanId: '', foremanName: '', superId: '', superName: '', status: 'awaiting-foreman-sig' }]
        }
      ]
    }
  ]
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_CURRENT_JOB': return { ...state, currentJobId: action.id, recentJobIds: [action.id, ...state.recentJobIds.filter(id => id !== action.id)].slice(0, 5) };
    case 'ADD_JOB': return { ...state, jobs: [...state.jobs, action.job] };
    case 'UPDATE_JOB': return { ...state, jobs: state.jobs.map(j => j.id === action.id ? { ...j, ...action.data } : j) };
    case 'DELETE_JOB': return { ...state, jobs: state.jobs.filter(j => j.id !== action.id) };

    case 'ADD_INTERNAL_TEAM_MEMBER': return { ...state, internalTeam: [...state.internalTeam, action.member] };
    case 'UPDATE_INTERNAL_TEAM_MEMBER': return { ...state, internalTeam: state.internalTeam.map(m => m.id === action.member.id ? action.member : m) };
    case 'REMOVE_INTERNAL_TEAM_MEMBER': return { ...state, internalTeam: state.internalTeam.filter(m => m.id !== action.id) };
    case 'ADD_INTERNAL_ROLE': return { ...state, internalRoles: state.internalRoles.includes(action.role) ? state.internalRoles : [...state.internalRoles, action.role] };

    case 'ADD_CLS': return { ...state, classifications: [...state.classifications, action.cls] };
    case 'UPDATE_CLS': return { ...state, classifications: state.classifications.map(c => c.id === action.cls.id ? action.cls : c) };
    case 'REMOVE_CLS': return { ...state, classifications: state.classifications.filter(c => c.id !== action.clsId) };
    case 'ADD_WORKER': return { ...state, personnelRoster: [...state.personnelRoster, action.worker] };
    case 'UPDATE_WORKER': return { ...state, personnelRoster: state.personnelRoster.map(w => w.id === action.worker.id ? action.worker : w) };
    case 'REMOVE_WORKER': return { ...state, personnelRoster: state.personnelRoster.filter(w => w.id !== action.workerId) };

    case 'REMOVE_ROSTER_FROM_JOB': return { ...state, jobs: state.jobs.map(j => j.id === action.jobId ? { ...j, removedRosterIds: [...(j.removedRosterIds || []), action.workerId] } : j) };
    case 'RESTORE_ROSTER_TO_JOB': return { ...state, jobs: state.jobs.map(j => j.id === action.jobId ? { ...j, removedRosterIds: (j.removedRosterIds || []).filter(id => id !== action.workerId) } : j) };

    // Job-level rate for a classification (Regular/OT/DT) - rates always live per job, never company-wide
    case 'SET_JOB_CLASSIFICATION_RATE': return { ...state, jobs: state.jobs.map(j => {
        if (j.id !== action.jobId) return j;
        const existing = (j.classificationRates || []).find(r => r.classId === action.classId);
        const rates = existing
          ? (j.classificationRates || []).map(r => r.classId === action.classId ? { ...r, ...action.rates } : r)
          : [...(j.classificationRates || []), { classId: action.classId, ...action.rates }];
        return { ...j, classificationRates: rates };
      }) };

    case 'ADD_GC_COMPANY': return { ...state, gcCompanies: [...state.gcCompanies, action.company] };
    case 'UPDATE_GC_COMPANY': return { ...state, gcCompanies: state.gcCompanies.map(c => c.id === action.company.id ? action.company : c) };
    case 'DELETE_GC_COMPANY': return { ...state, gcCompanies: state.gcCompanies.filter(c => c.id !== action.id), gcSupers: state.gcSupers.filter(s => s.gcCompanyId !== action.id) };
    case 'ADD_GC_SUPER': return { ...state, gcSupers: [...state.gcSupers, action.super] };
    case 'UPDATE_GC_SUPER': return { ...state, gcSupers: state.gcSupers.map(s => s.id === action.super.id ? action.super : s) };
    case 'DELETE_GC_SUPER': return { ...state, gcSupers: state.gcSupers.filter(s => s.id !== action.id) };

    case 'ADD_JOB_MEMBER': return { ...state, jobs: state.jobs.map(j => j.id === action.jobId ? { ...j, members: [...(j.members || []), action.member] } : j) };
    case 'UPDATE_JOB_MEMBER': return { ...state, jobs: state.jobs.map(j => j.id === action.jobId ? { ...j, members: (j.members || []).map(m => m.id === action.memberId ? { ...m, ...action.data } : m) } : j) };
    case 'REMOVE_JOB_MEMBER': return { ...state, jobs: state.jobs.map(j => j.id === action.jobId ? { ...j, members: (j.members || []).filter(m => m.id !== action.memberId) } : j) };

    case 'ADD_PKG': return { ...state, jobs: state.jobs.map(j => j.id === action.jobId ? { ...j, packages: [...j.packages, action.pkg] } : j) };
    case 'UPDATE_PKG': return { ...state, jobs: state.jobs.map(j => j.id === action.jobId ? { ...j, packages: j.packages.map(p => p.id === action.pkgId ? { ...p, ...action.data } : p) } : j) };
    case 'DELETE_PKG': return { ...state, jobs: state.jobs.map(j => j.id === action.jobId ? { ...j, packages: j.packages.filter(p => p.id !== action.pkgId) } : j) };
    case 'ADD_TICKET': return { ...state, jobs: state.jobs.map(j => j.id === action.jobId ? { ...j, packages: j.packages.map(p => p.id === action.pkgId ? { ...p, tickets: [...p.tickets, action.ticket] } : p) } : j) };
    case 'UPDATE_TICKET': return { ...state, jobs: state.jobs.map(j => j.id === action.jobId ? { ...j, packages: j.packages.map(p => p.id === action.pkgId ? { ...p, tickets: p.tickets.map(t => t.id === action.ticketId ? { ...t, ...action.data } : t) } : p) } : j) };
    case 'DELETE_TICKET': return { ...state, jobs: state.jobs.map(j => j.id === action.jobId ? { ...j, packages: j.packages.map(p => p.id === action.pkgId ? { ...p, tickets: p.tickets.filter(t => t.id !== action.ticketId) } : p) } : j) };

    default: return state;
  }
}

const Ctx = createContext(null);
export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // On first load, pull Internal Team and Personnel Roster data from Firestore instead of starting empty forever
  useEffect(() => {
    fetchInternalTeam().then(team => {
      team.forEach(member => dispatch({ type: 'ADD_INTERNAL_TEAM_MEMBER', member }));
    });
    fetchInternalRoles().then(roles => {
      roles.forEach(role => dispatch({ type: 'ADD_INTERNAL_ROLE', role }));
    });
    fetchClassifications().then(classes => {
      classes.forEach(cls => dispatch({ type: 'ADD_CLS', cls }));
    });
    fetchPersonnelRoster().then(workers => {
      workers.forEach(worker => dispatch({ type: 'ADD_WORKER', worker }));
    });
  }, []);

  // Wrap dispatch so certain actions also write through to Firestore
  function dispatchAndSync(action) {
    dispatch(action);
    if (action.type === 'ADD_INTERNAL_TEAM_MEMBER') addInternalTeamMember(action.member);
    if (action.type === 'UPDATE_INTERNAL_TEAM_MEMBER') updateInternalTeamMember(action.member);
    if (action.type === 'REMOVE_INTERNAL_TEAM_MEMBER') removeInternalTeamMember(action.id);
    if (action.type === 'ADD_INTERNAL_ROLE') addInternalRole(action.role);

    if (action.type === 'ADD_CLS') addClassification(action.cls);
    if (action.type === 'UPDATE_CLS') updateClassification(action.cls);
    if (action.type === 'REMOVE_CLS') removeClassification(action.clsId);
    if (action.type === 'ADD_WORKER') addWorker(action.worker);
    if (action.type === 'UPDATE_WORKER') updateWorker(action.worker);
    if (action.type === 'REMOVE_WORKER') removeWorker(action.workerId);
  }

  return <Ctx.Provider value={{ state, dispatch: dispatchAndSync }}>{children}</Ctx.Provider>;
}
export function useStore() { return useContext(Ctx); }

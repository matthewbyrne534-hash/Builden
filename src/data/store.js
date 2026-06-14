// src/data/store.js
// Central state management using React Context

import React, { createContext, useContext, useReducer } from 'react';

// ─── INITIAL DATA ────────────────────────────────────────────────────────────
const initialState = {
  jobs: [
    {
      id: 'j1',
      num: '2024-041',
      desc: 'Riverside Trade School — Electrical',
      gc: 'Apex Construction Group',
      owner: 'Riverside School District',
      ae: 'Davies & Holt Architecture',
      locked: false,
      supers: [
        { id: 's1', name: 'R. Kowalski', email: 'rkowalski@apexcg.com', phone: '(215) 555-0134' },
        { id: 's2', name: 'T. Brandt', email: 'tbrandt@apexcg.com', phone: '(215) 555-0187' }
      ],
      classifications: [
        { id: 'c1', name: 'Foreman', rate: 95, ohp: 10 },
        { id: 'c2', name: 'Electrician', rate: 75, ohp: 10 },
        { id: 'c3', name: 'Laborer', rate: 55, ohp: 10 }
      ],
      workers: [
        { id: 'w1', first: 'Mike', last: 'Torres', classId: 'c1' },
        { id: 'w2', first: 'Dan', last: 'Reyes', classId: 'c2' },
        { id: 'w3', first: 'Chris', last: 'Walsh', classId: 'c3' }
      ],
      packages: [
        {
          id: 'p1',
          num: 'TM-001',
          numSystem: 'TM-{seq}',
          title: 'Power to BAS control panel — Mech Room 1',
          authType: 'Change Event',
          authRef: 'CE-047',
          authFileName: null,
          locked: true,
          tickets: [
            {
              id: 't1',
              num: 'TM-001.1',
              date: '2024-10-07',
              desc: 'Ran conduit from panel room to BAS unit location, installed junction boxes and pulled wire.',
              labor: [
                { id: 'l1', workerId: 'w1', workerName: 'Mike Torres', classId: 'c1', className: 'Foreman', reg: 8, ot: 0, dt: 0, rate: 95, ohp: 10 }
              ],
              materials: [],
              vendors: [],
              photos: [],
              foremanId: 'w1',
              foremanName: 'Mike Torres',
              superId: 's1',
              superName: 'R. Kowalski',
              status: 'signed'
            },
            {
              id: 't2',
              num: 'TM-001.2',
              date: '2024-10-08',
              desc: 'Pulled wire and terminated connections at BAS control panel.',
              labor: [
                { id: 'l2', workerId: 'w2', workerName: 'Dan Reyes', classId: 'c2', className: 'Electrician', reg: 8, ot: 2, dt: 0, rate: 75, ohp: 10 }
              ],
              materials: [
                { id: 'm1', desc: '12/2 wire', unit: 'Linear ft', qty: 60, rate: 1.80, ohp: 15, invoiceRef: 'INV-001', invoiceName: 'invoice_oct8.pdf' }
              ],
              vendors: [],
              photos: [],
              foremanId: 'w2',
              foremanName: 'Dan Reyes',
              superId: 's1',
              superName: 'R. Kowalski',
              status: 'signed'
            }
          ]
        },
        {
          id: 'p2',
          num: 'TM-002',
          numSystem: 'TM-{seq}',
          title: 'Additional conduit runs — Level 3 corridor',
          authType: 'RFI Response',
          authRef: 'RFI-022',
          authFileName: null,
          locked: false,
          tickets: [
            {
              id: 't3',
              num: 'TM-002.1',
              date: '2024-10-14',
              desc: 'Installed additional conduit runs per RFI-022 response.',
              labor: [
                { id: 'l3', workerId: 'w2', workerName: 'Dan Reyes', classId: 'c2', className: 'Electrician', reg: 8, ot: 0, dt: 0, rate: 75, ohp: 10 }
              ],
              materials: [],
              vendors: [],
              photos: [],
              foremanId: 'w2',
              foremanName: 'Dan Reyes',
              superId: 's1',
              superName: 'R. Kowalski',
              status: 'draft'
            }
          ]
        }
      ]
    }
  ],
  directory: {
    companies: [
      { id: 'co1', name: 'Apex Construction Group', phone: '(215) 555-0100', email: 'info@apexcg.com', address: '1200 Market St, Philadelphia, PA 19107' },
      { id: 'co2', name: 'Summit GC Partners', phone: '(215) 555-0200', email: 'info@summitgc.com', address: '450 N 3rd St, Philadelphia, PA 19123' }
    ],
    contacts: [
      { id: 'ct1', companyId: 'co1', first: 'R.', last: 'Kowalski', title: 'Superintendent', phone: '(215) 555-0134', email: 'rkowalski@apexcg.com' },
      { id: 'ct2', companyId: 'co1', first: 'T.', last: 'Brandt', title: 'Superintendent', phone: '(215) 555-0187', email: 'tbrandt@apexcg.com' },
      { id: 'ct3', companyId: 'co2', first: 'J.', last: 'Martinez', title: 'Project Superintendent', phone: '(215) 555-0221', email: 'jmartinez@summitgc.com' }
    ]
  },
  companyProfile: {
    name: 'Your Company Name',
    address: '123 Main Street',
    city: 'City, State 00000',
    phone: '(555) 000-0000',
    fax: '',
    logo: null
  }
};

// ─── REDUCER ─────────────────────────────────────────────────────────────────
function reducer(state, action) {
  switch (action.type) {

    // JOBS
    case 'ADD_JOB':
      return { ...state, jobs: [...state.jobs, action.job] };
    case 'UPDATE_JOB': {
      return { ...state, jobs: state.jobs.map(j => j.id === action.id ? { ...j, ...action.data } : j) };
    }
    case 'DELETE_JOB':
      return { ...state, jobs: state.jobs.filter(j => j.id !== action.id) };
    case 'VOID_JOB':
      return { ...state, jobs: state.jobs.map(j => j.id === action.id ? { ...j, voided: true } : j) };

    // JOB SETUP
    case 'UPDATE_JOB_SETUP': {
      const { jobId, field, value } = action;
      return { ...state, jobs: state.jobs.map(j => j.id === jobId ? { ...j, [field]: value } : j) };
    }
    case 'ADD_SUPER': {
      return { ...state, jobs: state.jobs.map(j => j.id === action.jobId ? { ...j, supers: [...j.supers, action.super] } : j) };
    }
    case 'REMOVE_SUPER': {
      return { ...state, jobs: state.jobs.map(j => j.id === action.jobId ? { ...j, supers: j.supers.filter(s => s.id !== action.superId) } : j) };
    }
    case 'ADD_CLASSIFICATION': {
      return { ...state, jobs: state.jobs.map(j => j.id === action.jobId ? { ...j, classifications: [...j.classifications, action.cls] } : j) };
    }
    case 'UPDATE_CLASSIFICATION': {
      return { ...state, jobs: state.jobs.map(j => j.id === action.jobId ? { ...j, classifications: j.classifications.map(c => c.id === action.cls.id ? action.cls : c) } : j) };
    }
    case 'REMOVE_CLASSIFICATION': {
      return { ...state, jobs: state.jobs.map(j => j.id === action.jobId ? { ...j, classifications: j.classifications.filter(c => c.id !== action.clsId) } : j) };
    }
    case 'ADD_WORKER': {
      return { ...state, jobs: state.jobs.map(j => j.id === action.jobId ? { ...j, workers: [...j.workers, action.worker] } : j) };
    }
    case 'UPDATE_WORKER': {
      return { ...state, jobs: state.jobs.map(j => j.id === action.jobId ? { ...j, workers: j.workers.map(w => w.id === action.worker.id ? action.worker : w) } : j) };
    }
    case 'REMOVE_WORKER': {
      return { ...state, jobs: state.jobs.map(j => j.id === action.jobId ? { ...j, workers: j.workers.filter(w => w.id !== action.workerId) } : j) };
    }

    // PACKAGES
    case 'ADD_PACKAGE': {
      return { ...state, jobs: state.jobs.map(j => j.id === action.jobId ? { ...j, packages: [...j.packages, action.pkg] } : j) };
    }
    case 'UPDATE_PACKAGE': {
      return { ...state, jobs: state.jobs.map(j => j.id === action.jobId ? { ...j, packages: j.packages.map(p => p.id === action.pkgId ? { ...p, ...action.data } : p) } : j) };
    }
    case 'DELETE_PACKAGE': {
      return { ...state, jobs: state.jobs.map(j => j.id === action.jobId ? { ...j, packages: j.packages.filter(p => p.id !== action.pkgId) } : j) };
    }

    // TICKETS
    case 'ADD_TICKET': {
      return { ...state, jobs: state.jobs.map(j => j.id === action.jobId ? { ...j, packages: j.packages.map(p => p.id === action.pkgId ? { ...p, tickets: [...p.tickets, action.ticket] } : p) } : j) };
    }
    case 'UPDATE_TICKET': {
      return { ...state, jobs: state.jobs.map(j => j.id === action.jobId ? { ...j, packages: j.packages.map(p => p.id === action.pkgId ? { ...p, tickets: p.tickets.map(t => t.id === action.ticketId ? { ...t, ...action.data } : t) } : p) } : j) };
    }
    case 'DELETE_TICKET': {
      return { ...state, jobs: state.jobs.map(j => j.id === action.jobId ? { ...j, packages: j.packages.map(p => p.id === action.pkgId ? { ...p, tickets: p.tickets.filter(t => t.id !== action.ticketId) } : p) } : j) };
    }

    // DIRECTORY
    case 'ADD_COMPANY':
      return { ...state, directory: { ...state.directory, companies: [...state.directory.companies, action.company] } };
    case 'UPDATE_COMPANY':
      return { ...state, directory: { ...state.directory, companies: state.directory.companies.map(c => c.id === action.company.id ? action.company : c) } };
    case 'DELETE_COMPANY':
      return { ...state, directory: { ...state.directory, companies: state.directory.companies.filter(c => c.id !== action.id), contacts: state.directory.contacts.filter(c => c.companyId !== action.id) } };
    case 'ADD_CONTACT':
      return { ...state, directory: { ...state.directory, contacts: [...state.directory.contacts, action.contact] } };
    case 'UPDATE_CONTACT':
      return { ...state, directory: { ...state.directory, contacts: state.directory.contacts.map(c => c.id === action.contact.id ? action.contact : c) } };
    case 'DELETE_CONTACT':
      return { ...state, directory: { ...state.directory, contacts: state.directory.contacts.filter(c => c.id !== action.id) } };

    // COMPANY PROFILE
    case 'UPDATE_PROFILE':
      return { ...state, companyProfile: { ...state.companyProfile, ...action.data } };

    default:
      return state;
  }
}

// ─── CONTEXT ─────────────────────────────────────────────────────────────────
const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return <StoreContext.Provider value={{ state, dispatch }}>{children}</StoreContext.Provider>;
}

export function useStore() {
  return useContext(StoreContext);
}

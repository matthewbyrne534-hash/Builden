// src/data/store.js
import React, { createContext, useContext, useReducer } from 'react';
import { useEffect } from 'react';
import { fetchInternalTeam, fetchInternalRoles, addInternalTeamMember, updateInternalTeamMember, removeInternalTeamMember, addInternalRole } from './internalTeamApi';
import { fetchClassifications, fetchPersonnelRoster, addClassification, updateClassification, removeClassification, addWorker, updateWorker, removeWorker } from './personnelRosterApi';
import { fetchGcCompanies, fetchGcSupers, addGcCompany, updateGcCompany, deleteGcCompany, addGcSuper, updateGcSuper, deleteGcSuper } from './gcDirectoryApi';
import { fetchJobs, saveJob, deleteJob } from './jobsApi';
import { fetchCompany, updateCompany } from './companyApi';

const initialState = {
  currentJobId: null,
  recentJobIds: [],

  profile: { name: '', address: '', city: '', phone: '', email: '', logo: null },

  internalRoles: [],
  internalTeam: [],
  classifications: [],
  personnelRoster: [],
  gcCompanies: [],
  gcSupers: [],
  jobs: []
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_CURRENT_JOB': return { ...state, currentJobId: action.id, recentJobIds: [action.id, ...state.recentJobIds.filter(id => id !== action.id)].slice(0, 5) };
    case 'UPDATE_PROFILE': return { ...state, profile: { ...state.profile, ...action.data } };
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

const JOB_TOUCHING_ACTIONS = {
  UPDATE_JOB: a => a.id,
  REMOVE_ROSTER_FROM_JOB: a => a.jobId,
  RESTORE_ROSTER_TO_JOB: a => a.jobId,
  SET_JOB_CLASSIFICATION_RATE: a => a.jobId,
  ADD_JOB_MEMBER: a => a.jobId,
  UPDATE_JOB_MEMBER: a => a.jobId,
  REMOVE_JOB_MEMBER: a => a.jobId,
  ADD_PKG: a => a.jobId,
  UPDATE_PKG: a => a.jobId,
  DELETE_PKG: a => a.jobId,
  ADD_TICKET: a => a.jobId,
  UPDATE_TICKET: a => a.jobId,
  DELETE_TICKET: a => a.jobId,
};

const Ctx = createContext(null);

// StoreProvider now requires companyId — App.jsx passes it in once the logged-in
// user's company has been looked up. Without a companyId, we don't know whose data to load.
export function StoreProvider({ companyId, children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    fetchCompany(companyId).then(company => {
      if (company) dispatch({ type: 'UPDATE_PROFILE', data: company });
    });
    fetchInternalTeam(companyId).then(team => {
      team.forEach(member => dispatch({ type: 'ADD_INTERNAL_TEAM_MEMBER', member }));
    });
    fetchInternalRoles(companyId).then(roles => {
      roles.forEach(role => dispatch({ type: 'ADD_INTERNAL_ROLE', role }));
    });
    fetchClassifications(companyId).then(classes => {
      classes.forEach(cls => dispatch({ type: 'ADD_CLS', cls }));
    });
    fetchPersonnelRoster(companyId).then(workers => {
      workers.forEach(worker => dispatch({ type: 'ADD_WORKER', worker }));
    });
    fetchGcCompanies(companyId).then(companies => {
      companies.forEach(company => dispatch({ type: 'ADD_GC_COMPANY', company }));
    });
    fetchGcSupers(companyId).then(supers => {
      supers.forEach(sup => dispatch({ type: 'ADD_GC_SUPER', super: sup }));
    });
    fetchJobs(companyId).then(jobs => {
      jobs.forEach(job => dispatch({ type: 'ADD_JOB', job }));
    });
  }, [companyId]);

  function dispatchAndSync(action) {
    dispatch(action);

    if (action.type === 'UPDATE_PROFILE') updateCompany(companyId, action.data);

    if (action.type === 'ADD_INTERNAL_TEAM_MEMBER') addInternalTeamMember(action.member, companyId);
    if (action.type === 'UPDATE_INTERNAL_TEAM_MEMBER') updateInternalTeamMember(action.member, companyId);
    if (action.type === 'REMOVE_INTERNAL_TEAM_MEMBER') removeInternalTeamMember(action.id);
    if (action.type === 'ADD_INTERNAL_ROLE') addInternalRole(action.role, companyId);

    if (action.type === 'ADD_CLS') addClassification(action.cls, companyId);
    if (action.type === 'UPDATE_CLS') updateClassification(action.cls, companyId);
    if (action.type === 'REMOVE_CLS') removeClassification(action.clsId);
    if (action.type === 'ADD_WORKER') addWorker(action.worker, companyId);
    if (action.type === 'UPDATE_WORKER') updateWorker(action.worker, companyId);
    if (action.type === 'REMOVE_WORKER') removeWorker(action.workerId);

    if (action.type === 'ADD_GC_COMPANY') addGcCompany(action.company, companyId);
    if (action.type === 'UPDATE_GC_COMPANY') updateGcCompany(action.company, companyId);
    if (action.type === 'DELETE_GC_COMPANY') deleteGcCompany(action.id, companyId);
    if (action.type === 'ADD_GC_SUPER') addGcSuper(action.super, companyId);
    if (action.type === 'UPDATE_GC_SUPER') updateGcSuper(action.super, companyId);
    if (action.type === 'DELETE_GC_SUPER') deleteGcSuper(action.id);

    if (action.type === 'ADD_JOB') saveJob(action.job, companyId);
    if (action.type === 'DELETE_JOB') deleteJob(action.id);
    if (JOB_TOUCHING_ACTIONS[action.type]) {
      const jobId = JOB_TOUCHING_ACTIONS[action.type](action);
      const newState = reducer(state, action);
      const updatedJob = newState.jobs.find(j => j.id === jobId);
      if (updatedJob) saveJob(updatedJob, companyId);
    }
  }

  return <Ctx.Provider value={{ state, dispatch: dispatchAndSync }}>{children}</Ctx.Provider>;
}
export function useStore() { return useContext(Ctx); }

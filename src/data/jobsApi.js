// src/data/jobsApi.js
import { db } from '../firebaseConfig';
import { collection, doc, getDocs, getDoc, setDoc, deleteDoc, query, where } from 'firebase/firestore';

const jobsCol = collection(db, 'jobs');

export async function fetchJobs(companyId) {
  const snap = await getDocs(query(jobsCol, where('companyId', '==', companyId)));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function saveJob(job, companyId) {
  const { id, ...data } = job;
  await setDoc(doc(jobsCol, id), { ...data, companyId });
  return job;
}

export async function deleteJob(jobId) {
  await deleteDoc(doc(jobsCol, jobId));
}

export async function fetchJobById(jobId) {
  const snap = await getDoc(doc(jobsCol, jobId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// Called when someone accepts an invite — finds the matching member entry inside the
// job's members array and marks it active, linked to their new Firebase Auth account.
export async function linkMemberToUser(jobId, memberId, uid) {
  const job = await fetchJobById(jobId);
  if (!job) return;
  const members = (job.members || []).map(m =>
    m.id === memberId ? { ...m, uid, inviteStatus: 'active' } : m
  );
  await setDoc(doc(jobsCol, jobId), { members }, { merge: true });
}

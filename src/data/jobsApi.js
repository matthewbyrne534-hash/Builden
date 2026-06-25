// src/data/jobsApi.js
import { db } from '../firebaseConfig';
import { collection, doc, getDocs, setDoc, deleteDoc } from 'firebase/firestore';

// Jobs are stored differently than the other collections: each job's packages and tickets
// live nested INSIDE the same document (matching the in-memory shape exactly), rather than
// as separate collections. So instead of one function per field, we just re-save the whole
// job object every time anything inside it changes. Simpler, and totally fine at this size.

const jobsCol = collection(db, 'jobs');

export async function fetchJobs() {
  const snap = await getDocs(jobsCol);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function saveJob(job) {
  const { id, ...data } = job;
  await setDoc(doc(jobsCol, id), data);
  return job;
}

export async function deleteJob(jobId) {
  await deleteDoc(doc(jobsCol, jobId));
}

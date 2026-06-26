// src/data/jobsApi.js
import { db } from '../firebaseConfig';
import { collection, doc, getDocs, setDoc, deleteDoc, query, where } from 'firebase/firestore';

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

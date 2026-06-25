// src/data/personnelRosterApi.js
import { db } from '../firebaseConfig';
import { collection, doc, getDocs, setDoc, deleteDoc } from 'firebase/firestore';

// Same approach as internalTeamApi.js: single shared collection for now,
// multi-tenancy (per-company data) comes in Step 3.

const classCol = collection(db, 'classifications');
const workerCol = collection(db, 'personnelRoster');

export async function fetchClassifications() {
  const snap = await getDocs(classCol);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function fetchPersonnelRoster() {
  const snap = await getDocs(workerCol);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function addClassification(cls) {
  const { id, ...data } = cls;
  await setDoc(doc(classCol, id), data);
  return cls;
}

export async function updateClassification(cls) {
  const { id, ...data } = cls;
  await setDoc(doc(classCol, id), data);
  return cls;
}

export async function removeClassification(clsId) {
  await deleteDoc(doc(classCol, clsId));
}

export async function addWorker(worker) {
  const { id, ...data } = worker;
  await setDoc(doc(workerCol, id), data);
  return worker;
}

export async function updateWorker(worker) {
  const { id, ...data } = worker;
  await setDoc(doc(workerCol, id), data);
  return worker;
}

export async function removeWorker(workerId) {
  await deleteDoc(doc(workerCol, workerId));
}

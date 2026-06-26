// src/data/personnelRosterApi.js
import { db } from '../firebaseConfig';
import { collection, doc, getDocs, setDoc, deleteDoc, query, where } from 'firebase/firestore';

const classCol = collection(db, 'classifications');
const workerCol = collection(db, 'personnelRoster');

export async function fetchClassifications(companyId) {
  const snap = await getDocs(query(classCol, where('companyId', '==', companyId)));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function fetchPersonnelRoster(companyId) {
  const snap = await getDocs(query(workerCol, where('companyId', '==', companyId)));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function addClassification(cls, companyId) {
  const { id, ...data } = cls;
  await setDoc(doc(classCol, id), { ...data, companyId });
  return cls;
}

export async function updateClassification(cls, companyId) {
  const { id, ...data } = cls;
  await setDoc(doc(classCol, id), { ...data, companyId });
  return cls;
}

export async function removeClassification(clsId) {
  await deleteDoc(doc(classCol, clsId));
}

export async function addWorker(worker, companyId) {
  const { id, ...data } = worker;
  await setDoc(doc(workerCol, id), { ...data, companyId });
  return worker;
}

export async function updateWorker(worker, companyId) {
  const { id, ...data } = worker;
  await setDoc(doc(workerCol, id), { ...data, companyId });
  return worker;
}

export async function removeWorker(workerId) {
  await deleteDoc(doc(workerCol, workerId));
}

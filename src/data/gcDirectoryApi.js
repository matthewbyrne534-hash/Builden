// src/data/gcDirectoryApi.js
import { db } from '../firebaseConfig';
import { collection, doc, getDocs, setDoc, deleteDoc, query, where, getDocs as getDocsQ } from 'firebase/firestore';

const gcCol = collection(db, 'gcCompanies');
const supCol = collection(db, 'gcSupers');

export async function fetchGcCompanies() {
  const snap = await getDocs(gcCol);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function fetchGcSupers() {
  const snap = await getDocs(supCol);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function addGcCompany(company) {
  const { id, ...data } = company;
  await setDoc(doc(gcCol, id), data);
  return company;
}

export async function updateGcCompany(company) {
  const { id, ...data } = company;
  await setDoc(doc(gcCol, id), data);
  return company;
}

export async function deleteGcCompany(companyId) {
  await deleteDoc(doc(gcCol, companyId));
  // also remove any supers tied to this company
  const q = query(supCol, where('gcCompanyId', '==', companyId));
  const snap = await getDocsQ(q);
  await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
}

export async function addGcSuper(sup) {
  const { id, ...data } = sup;
  await setDoc(doc(supCol, id), data);
  return sup;
}

export async function updateGcSuper(sup) {
  const { id, ...data } = sup;
  await setDoc(doc(supCol, id), data);
  return sup;
}

export async function deleteGcSuper(supId) {
  await deleteDoc(doc(supCol, supId));
}

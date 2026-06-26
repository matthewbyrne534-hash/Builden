// src/data/gcDirectoryApi.js
import { db } from '../firebaseConfig';
import { collection, doc, getDocs, setDoc, deleteDoc, query, where } from 'firebase/firestore';

const gcCol = collection(db, 'gcCompanies');
const supCol = collection(db, 'gcSupers');

export async function fetchGcCompanies(companyId) {
  const snap = await getDocs(query(gcCol, where('companyId', '==', companyId)));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function fetchGcSupers(companyId) {
  const snap = await getDocs(query(supCol, where('companyId', '==', companyId)));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function addGcCompany(company, companyId) {
  const { id, ...data } = company;
  await setDoc(doc(gcCol, id), { ...data, companyId });
  return company;
}

export async function updateGcCompany(company, companyId) {
  const { id, ...data } = company;
  await setDoc(doc(gcCol, id), { ...data, companyId });
  return company;
}

export async function deleteGcCompany(companyDocId, companyId) {
  await deleteDoc(doc(gcCol, companyDocId));
  // also remove any supers tied to this GC company (scoped to this Builden company too,
  // though gcCompanyId alone is already unique enough in practice)
  const q = query(supCol, where('gcCompanyId', '==', companyDocId), where('companyId', '==', companyId));
  const snap = await getDocs(q);
  await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
}

export async function addGcSuper(sup, companyId) {
  const { id, ...data } = sup;
  await setDoc(doc(supCol, id), { ...data, companyId });
  return sup;
}

export async function updateGcSuper(sup, companyId) {
  const { id, ...data } = sup;
  await setDoc(doc(supCol, id), { ...data, companyId });
  return sup;
}

export async function deleteGcSuper(supId) {
  await deleteDoc(doc(supCol, supId));
}

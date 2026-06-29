// src/data/internalTeamApi.js
import { db } from '../firebaseConfig';
import { collection, doc, getDocs, setDoc, deleteDoc, query, where } from 'firebase/firestore';

const teamCol = collection(db, 'internalTeam');
const rolesCol = collection(db, 'internalRoles');

export async function fetchInternalTeam(companyId) {
  const snap = await getDocs(query(teamCol, where('companyId', '==', companyId)));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function fetchInternalRoles(companyId) {
  const snap = await getDocs(query(rolesCol, where('companyId', '==', companyId)));
  return snap.docs.map(d => d.data().name);
}

export async function addInternalTeamMember(member, companyId) {
  const { id, ...data } = member;
  await setDoc(doc(teamCol, id), { ...data, companyId });
  return member;
}

export async function updateInternalTeamMember(member, companyId) {
  const { id, ...data } = member;
  await setDoc(doc(teamCol, id), { ...data, companyId });
  return member;
}

export async function removeInternalTeamMember(id) {
  await deleteDoc(doc(teamCol, id));
}

export async function addInternalRole(role, companyId) {
  await setDoc(doc(rolesCol), { name: role, companyId });
}

export async function removeInternalRole(role, companyId) {
  const q = query(rolesCol, where('name', '==', role), where('companyId', '==', companyId));
  const snap = await getDocs(q);
  await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
}

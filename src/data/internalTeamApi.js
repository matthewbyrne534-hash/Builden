// src/data/internalTeamApi.js
import { db } from '../firebaseConfig';
import {
  collection, doc, getDocs, setDoc, deleteDoc, addDoc
} from 'firebase/firestore';

// NOTE: hardcoded to the one sandbox company for now (Granite Peak).
// Multi-tenancy (per-company collections) is Step 3 work — for now everyone
// reads/writes the same single set of documents, same as the in-memory version did.

const teamCol = collection(db, 'internalTeam');
const rolesCol = collection(db, 'internalRoles');

export async function fetchInternalTeam() {
  const snap = await getDocs(teamCol);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function fetchInternalRoles() {
  const snap = await getDocs(rolesCol);
  return snap.docs.map(d => d.data().name);
}

export async function addInternalTeamMember(member) {
  // member.id is generated client-side (genId()) same as before — we just use it as the doc id
  const { id, ...data } = member;
  await setDoc(doc(teamCol, id), data);
  return member;
}

export async function updateInternalTeamMember(member) {
  const { id, ...data } = member;
  await setDoc(doc(teamCol, id), data);
  return member;
}

export async function removeInternalTeamMember(id) {
  await deleteDoc(doc(teamCol, id));
}

export async function addInternalRole(role) {
  // store role titles as their own tiny docs so they persist too
  await addDoc(rolesCol, { name: role });
}

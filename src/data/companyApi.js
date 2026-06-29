// src/data/companyApi.js
import { db } from '../firebaseConfig';
import { doc, setDoc, getDoc, collection, getDocs, deleteDoc, query, where } from 'firebase/firestore';

const companiesCol = collection(db, 'companies');
const usersCol = collection(db, 'users');

// Creates a brand new company record. Returns the new company's id.
export async function createCompany(companyName) {
  const companyRef = doc(companiesCol);
  await setDoc(companyRef, {
    name: companyName,
    createdAt: new Date().toISOString()
  });
  return companyRef.id;
}

// Links a Firebase Auth user (by their uid) to a company + role.
// This is the document the rest of the app checks to know "who is this person,
// which company are they on, and what role do they have."
export async function createUserDoc(uid, { companyId, role, first, last, email }) {
  await setDoc(doc(usersCol, uid), { companyId, role, first, last, email });
}

// Fetches a company's profile info (name, address, phone, etc.)
export async function fetchCompany(companyId) {
  const snap = await getDoc(doc(companiesCol, companyId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// Updates a company's profile info (does NOT touch createdAt or anything else not passed in)
export async function updateCompany(companyId, data) {
  await setDoc(doc(companiesCol, companyId), data, { merge: true });
}

// Deletes EVERY document tagged with this companyId, across every company-data
// collection, plus the company record itself and the caller's own user doc.
// Does NOT delete the caller's Firebase Auth login — that's a separate, final step
// (see deleteOwnLogin below), since Auth and Firestore are different systems.
export async function deleteCompanyEntirely(companyId) {
  const collections = ['internalTeam', 'internalRoles', 'classifications', 'personnelRoster', 'gcCompanies', 'gcSupers', 'jobs', 'invites'];
  for (const colName of collections) {
    const snap = await getDocs(query(collection(db, colName), where('companyId', '==', companyId)));
    await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
  }
  await deleteDoc(doc(companiesCol, companyId));
}

// Looks up a logged-in user's company/role info by their uid.
export async function fetchUserDoc(uid) {
  const snap = await getDoc(doc(usersCol, uid));
  return snap.exists() ? snap.data() : null;
}

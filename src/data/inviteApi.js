// src/data/inviteApi.js
import { db } from '../firebaseConfig';
import { doc, setDoc, getDoc, collection } from 'firebase/firestore';
import { genId } from '../utils/helpers';

const invitesCol = collection(db, 'invites');

// Creates an invite tied to one specific job member. The token IS the document id —
// it's also what goes in the shareable link, so it needs to be unguessable.
export async function createInvite({ companyId, jobId, jobNum, jobName, memberId, name, email, title }) {
  const token = genId() + genId(); // extra length since this is a real access credential, not just a UI key
  await setDoc(doc(invitesCol, token), {
    companyId, jobId, jobNum, jobName, memberId, name, email, title,
    status: 'pending',
    createdAt: new Date().toISOString()
  });
  return token;
}

export async function fetchInvite(token) {
  const snap = await getDoc(doc(invitesCol, token));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function markInviteAccepted(token) {
  await setDoc(doc(invitesCol, token), { status: 'accepted', acceptedAt: new Date().toISOString() }, { merge: true });
}

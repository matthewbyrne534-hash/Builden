// src/data/auth.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../firebaseConfig';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { createCompany, createUserDoc, fetchUserDoc, deleteCompanyEntirely } from './companyApi';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { deleteUser } from 'firebase/auth';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // userDoc holds { companyId, role, first, last, email } once loaded — this is
  // separate from the Firebase Auth user object, which only knows email/password stuff.
  const [userDoc, setUserDoc] = useState(null);
  // loading = true until we've checked both "is anyone logged in" AND (if so)
  // "what company/role do they belong to."
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async firebaseUser => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const doc = await fetchUserDoc(firebaseUser.uid);
        setUserDoc(doc);
      } else {
        setUserDoc(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  async function login(email, password) {
    await signInWithEmailAndPassword(auth, email, password);
  }

  // Company Admin self-registration: creates the login, a brand new company,
  // and links the two together with role 'admin'. This is the ONLY signup path for now —
  // PMs/Foremen get accounts via invite later (Auth Step 4), not this form.
  async function signupAsCompanyAdmin({ companyName, first, last, email, password }) {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    const companyId = await createCompany(companyName);
    await createUserDoc(credential.user.uid, { companyId, role: 'admin', first, last, email });
    const doc = await fetchUserDoc(credential.user.uid);
    setUserDoc(doc);
  }

  async function logout() {
    await signOut(auth);
  }

  // Permanently wipes the current Admin's entire company (every job, team member,
  // roster entry, GC, invite) plus their own account. Used for cleaning up test
  // companies — NOT something a real customer should ever be able to click without
  // serious confirmation, since there's no undo.
  async function deleteAccountAndCompany() {
    const companyId = userDoc.companyId;
    await deleteCompanyEntirely(companyId);
    await deleteDoc(doc(db, 'users', user.uid));
    await deleteUser(auth.currentUser); // also signs them out automatically
  }

  return (
    <AuthCtx.Provider value={{ user, userDoc, loading, login, signupAsCompanyAdmin, logout, deleteAccountAndCompany }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  return useContext(AuthCtx);
}

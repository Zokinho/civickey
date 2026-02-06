// Firebase configuration for CivicKey Admin Console
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "REDACTED",
  authDomain: "REDACTED_AUTH_DOMAIN",
  projectId: "civickey-prod",
  storageBucket: "REDACTED_STORAGE_BUCKET",
  messagingSenderId: "REDACTED_SENDER_ID",
  appId: "1:REDACTED_SENDER_ID:web:28806abe5d16d574532f2b",
  measurementId: "REDACTED_MEASUREMENT_ID"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Expose for console scripting
if (typeof window !== 'undefined') {
  window.__FIREBASE_DB__ = db;
  window.__FIREBASE_AUTH__ = auth;
  // Also expose Firestore functions for scripting
  import('firebase/firestore').then(firestore => {
    window.__FIRESTORE__ = firestore;
  });
}

// Secondary app for creating users without affecting current auth state
const secondaryApp = initializeApp(firebaseConfig, 'secondary');
export const secondaryAuth = getAuth(secondaryApp);

export default app;

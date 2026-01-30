// Firebase configuration for CivicKey Mobile App
// This is READ-ONLY access - the mobile app cannot modify data
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

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
export default app;

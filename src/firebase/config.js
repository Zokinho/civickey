// Firebase configuration for CivicKey Mobile App
// This is READ-ONLY access - the mobile app cannot modify data
// Note: Firebase API keys are safe to include in client code — access is controlled by Security Rules
import { initializeApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyCPuATgVzN-kor_KQZ7bHimObwUjRd3Qo4',
  authDomain: 'civickey-prod.firebaseapp.com',
  projectId: 'civickey-prod',
  storageBucket: 'civickey-prod.firebasestorage.app',
  messagingSenderId: '262133106994',
  appId: '1:262133106994:web:28806abe5d16d574532f2b',
  measurementId: 'G-TPYVKVYM0N',
};

const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});
export default app;

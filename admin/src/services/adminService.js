// Admin user management (super-admin only)
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  where,
  serverTimestamp
} from 'firebase/firestore';
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut
} from 'firebase/auth';
import { auth, db, secondaryAuth } from '../firebase/config';

// ============================================
// ADMIN USER MANAGEMENT (Super-admin only)
// ============================================

/**
 * Get all admins (super-admin only)
 */
export async function getAllAdmins() {
  const adminsCol = collection(db, 'admins');
  const snapshot = await getDocs(adminsCol);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Get admins for a specific municipality
 */
export async function getAdminsByMunicipality(municipalityId) {
  const adminsCol = collection(db, 'admins');
  const q = query(adminsCol, where('municipalityId', '==', municipalityId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Get a single admin by ID
 */
export async function getAdmin(adminId) {
  const adminRef = doc(db, 'admins', adminId);
  const docSnap = await getDoc(adminRef);

  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  }
  return null;
}

/**
 * Create a new admin user
 * NOTE: In production, consider using Firebase Admin SDK in a Cloud Function
 */
export async function createAdmin({ email, password, name, municipalityId, role = 'editor' }) {
  const validRoles = ['viewer', 'editor', 'admin', 'super-admin'];
  if (!validRoles.includes(role)) {
    throw new Error(`Invalid role: ${role}`);
  }

  // Create Firebase Auth user using secondary auth to avoid logging out current admin
  const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
  const userId = userCredential.user.uid;

  // Create admin record in Firestore
  await setDoc(doc(db, 'admins', userId), {
    email,
    name,
    municipalityId,
    role,
    active: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastLogin: null
  });

  // Send password reset email so user can set their own password
  await sendPasswordResetEmail(secondaryAuth, email);

  // Sign out of secondary auth instance to clean up
  await signOut(secondaryAuth);

  return userId;
}

/**
 * Update admin user details
 */
export async function updateAdmin(adminId, data) {
  const adminRef = doc(db, 'admins', adminId);

  // Don't allow updating certain fields
  const { email, createdAt, lastLogin, ...safeData } = data;

  await updateDoc(adminRef, {
    ...safeData,
    updatedAt: serverTimestamp()
  });
}

/**
 * Deactivate an admin (soft delete)
 */
export async function deactivateAdmin(adminId) {
  const adminRef = doc(db, 'admins', adminId);
  await updateDoc(adminRef, {
    active: false,
    deactivatedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

/**
 * Reactivate an admin
 */
export async function reactivateAdmin(adminId) {
  const adminRef = doc(db, 'admins', adminId);
  await updateDoc(adminRef, {
    active: true,
    deactivatedAt: null,
    updatedAt: serverTimestamp()
  });
}

/**
 * Send password reset email to an admin
 */
export async function sendAdminPasswordReset(email) {
  await sendPasswordResetEmail(auth, email);
}

// ============================================
// MUNICIPALITY MANAGEMENT (Super-admin only)
// ============================================

/**
 * Get all municipalities
 */
export async function getAllMunicipalities() {
  const municipalitiesCol = collection(db, 'municipalities');
  const snapshot = await getDocs(municipalitiesCol);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Create a new municipality
 */
export async function createMunicipality(municipalityId, data) {
  const municipalityRef = doc(db, 'municipalities', municipalityId);

  // Check if already exists
  const existing = await getDoc(municipalityRef);
  if (existing.exists()) {
    throw new Error(`Municipality ${municipalityId} already exists`);
  }

  // Create the municipality document with default structure
  await setDoc(municipalityRef, {
    name: data.name,
    nameEn: data.nameEn || data.name,
    nameFr: data.nameFr || data.name,
    province: data.province || 'QC',
    population: data.population || 0,
    logo: data.logo || null,
    colors: data.colors || {
      primary: '#0D5C63',
      secondary: '#E07A5F',
      background: '#F5F0E8'
    },
    contact: data.contact || {
      phone: '',
      email: '',
      website: ''
    },
    active: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  // Create default schedule document
  await setDoc(doc(db, 'municipalities', municipalityId, 'data', 'schedule'), {
    collectionTypes: [
      {
        id: 'recycling',
        name: { en: 'Recycling', fr: 'Recyclage' },
        binName: { en: 'Blue Bin', fr: 'Bac bleu' },
        color: '#2E86AB'
      },
      {
        id: 'compost',
        name: { en: 'Compost', fr: 'Compost' },
        binName: { en: 'Brown Bin', fr: 'Bac brun' },
        color: '#8B5A2B'
      },
      {
        id: 'garbage',
        name: { en: 'Garbage', fr: 'Ordures' },
        binName: { en: 'Black Bin', fr: 'Bac noir' },
        color: '#4A4A4A'
      }
    ],
    schedules: {},
    guidelines: {
      timing: {
        en: 'Put out by 7:00 AM on collection day.',
        fr: 'Sortir avant 7h00 le jour de collecte.'
      },
      position: {
        en: ['Cover closed', 'Handle facing your home'],
        fr: ['Couvercle ferme', 'Poignee face a votre maison']
      }
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  return municipalityId;
}

/**
 * Deactivate a municipality
 */
export async function deactivateMunicipality(municipalityId) {
  const municipalityRef = doc(db, 'municipalities', municipalityId);
  await updateDoc(municipalityRef, {
    active: false,
    deactivatedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

// ============================================
// ROLE HELPERS
// ============================================

export const ROLES = {
  VIEWER: 'viewer',
  EDITOR: 'editor',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super-admin'
};

export function canEditSchedule(role) {
  return ['admin', 'super-admin'].includes(role);
}

export function canEditEvents(role) {
  return ['editor', 'admin', 'super-admin'].includes(role);
}

export function canEditAlerts(role) {
  return ['editor', 'admin', 'super-admin'].includes(role);
}

export function canManageAdmins(role) {
  return ['admin', 'super-admin'].includes(role);
}

export function canManageMunicipalities(role) {
  return role === 'super-admin';
}

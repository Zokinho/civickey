// Firestore queries for mobile app (read-only)
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  orderBy,
  where
} from 'firebase/firestore';
import { db } from '../firebase/config';

// ============================================
// MUNICIPALITY LIST (for selection screen)
// ============================================

/**
 * Get all active municipalities for the selection screen
 */
export async function getAllMunicipalities() {
  const municipalitiesCol = collection(db, 'municipalities');
  const q = query(municipalitiesCol, where('active', '==', true));
  const snapshot = await getDocs(q);

  // Helper to extract string from potentially localized name
  const getNameString = (name, lang = 'en') => {
    if (!name) return '';
    if (typeof name === 'string') return name;
    return name[lang] || name.en || name.fr || '';
  };

  const municipalities = snapshot.docs.map(doc => {
    const data = doc.data();
    const name = data.name;
    return {
      id: doc.id,
      name: name, // Keep original for backwards compat
      nameEn: data.nameEn || getNameString(name, 'en'),
      nameFr: data.nameFr || getNameString(name, 'fr'),
      province: data.province,
      logo: data.logo,
      colors: data.colors
    };
  });

  // Sort alphabetically by English name
  municipalities.sort((a, b) => (a.nameEn || '').localeCompare(b.nameEn || ''));

  return municipalities;
}

// ============================================
// MUNICIPALITY CONFIG
// ============================================

/**
 * Get full config for a municipality (colors, contact, etc.)
 */
export async function getMunicipalityConfig(municipalityId) {
  const docRef = doc(db, 'municipalities', municipalityId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  }
  return null;
}

// ============================================
// ZONES
// ============================================

/**
 * Get all zones for a municipality
 */
export async function getZones(municipalityId) {
  const zonesCol = collection(db, 'municipalities', municipalityId, 'zones');
  const snapshot = await getDocs(zonesCol);

  // Helper to extract string from potentially localized field
  const getLocalizedString = (field, lang = 'en') => {
    if (!field) return '';
    if (typeof field === 'string') return field;
    return field[lang] || field.en || field.fr || '';
  };

  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      // Ensure nameEn and nameFr are always strings
      nameEn: data.nameEn || getLocalizedString(data.name, 'en'),
      nameFr: data.nameFr || getLocalizedString(data.name, 'fr'),
      // Ensure description is safe to use
      descriptionEn: data.descriptionEn || getLocalizedString(data.description, 'en'),
      descriptionFr: data.descriptionFr || getLocalizedString(data.description, 'fr')
    };
  });
}

// ============================================
// SCHEDULE
// ============================================

/**
 * Get collection schedule for a municipality
 */
export async function getSchedule(municipalityId) {
  const scheduleRef = doc(db, 'municipalities', municipalityId, 'data', 'schedule');
  const docSnap = await getDoc(scheduleRef);

  if (docSnap.exists()) {
    return docSnap.data();
  }
  return null;
}

// ============================================
// EVENTS
// ============================================

/**
 * Get upcoming events for a municipality
 */
export async function getUpcomingEvents(municipalityId, limit = 10) {
  const eventsCol = collection(db, 'municipalities', municipalityId, 'events');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const q = query(
    eventsCol,
    where('date', '>=', today.toISOString().split('T')[0]),
    orderBy('date', 'asc')
  );

  const snapshot = await getDocs(q);
  const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  return limit ? events.slice(0, limit) : events;
}

/**
 * Get all events for a municipality
 */
export async function getAllEvents(municipalityId) {
  const eventsCol = collection(db, 'municipalities', municipalityId, 'events');
  const q = query(eventsCol, orderBy('date', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// ============================================
// FACILITIES
// ============================================

/**
 * Get all facilities for a municipality
 */
export async function getFacilities(municipalityId) {
  const facilitiesCol = collection(db, 'municipalities', municipalityId, 'facilities');
  const snapshot = await getDocs(facilitiesCol);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// ============================================
// ALERTS
// ============================================

/**
 * Get active alerts for a municipality
 */
export async function getActiveAlerts(municipalityId) {
  const alertsCol = collection(db, 'municipalities', municipalityId, 'alerts');

  const q = query(
    alertsCol,
    where('active', '==', true)
  );

  const snapshot = await getDocs(q);
  const today = new Date().toISOString().split('T')[0];

  // Filter by date on client side
  return snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(alert => !alert.endDate || alert.endDate >= today);
}

// ============================================
// COMBINED DATA FETCH (for app startup)
// ============================================

/**
 * Fetch all data needed for a municipality in one call
 * Use this on app launch to minimize requests
 */
export async function fetchMunicipalityData(municipalityId) {
  try {
    const [config, zones, schedule, events, alerts, facilities] = await Promise.all([
      getMunicipalityConfig(municipalityId),
      getZones(municipalityId),
      getSchedule(municipalityId),
      getUpcomingEvents(municipalityId, 5),
      getActiveAlerts(municipalityId),
      getFacilities(municipalityId)
    ]);

    return {
      config,
      zones,
      schedule,
      events,
      alerts,
      facilities,
      fetchedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error fetching municipality data:', error);
    throw error;
  }
}

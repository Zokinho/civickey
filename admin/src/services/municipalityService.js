// Firestore operations for municipality data
// All operations are scoped to the user's assigned municipality
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  addDoc,
  query,
  orderBy,
  where,
  serverTimestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase/config';

// ============================================
// MUNICIPALITY CONFIG
// ============================================

export async function getMunicipalityConfig(municipalityId) {
  const docRef = doc(db, 'municipalities', municipalityId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  }
  return null;
}

export async function updateMunicipalityConfig(municipalityId, data) {
  const docRef = doc(db, 'municipalities', municipalityId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp()
  });
}

// ============================================
// ZONES
// ============================================

export async function getZones(municipalityId) {
  const zonesCol = collection(db, 'municipalities', municipalityId, 'zones');
  const snapshot = await getDocs(zonesCol);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function addZone(municipalityId, zoneData) {
  const zonesCol = collection(db, 'municipalities', municipalityId, 'zones');
  const docRef = await addDoc(zonesCol, {
    ...zoneData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return docRef.id;
}

export async function updateZone(municipalityId, zoneId, zoneData) {
  const zoneRef = doc(db, 'municipalities', municipalityId, 'zones', zoneId);
  await updateDoc(zoneRef, {
    ...zoneData,
    updatedAt: serverTimestamp()
  });
}

export async function deleteZone(municipalityId, zoneId) {
  const zoneRef = doc(db, 'municipalities', municipalityId, 'zones', zoneId);
  await deleteDoc(zoneRef);
}

// ============================================
// SCHEDULE
// ============================================

export async function getSchedule(municipalityId) {
  const scheduleRef = doc(db, 'municipalities', municipalityId, 'data', 'schedule');
  const docSnap = await getDoc(scheduleRef);

  if (docSnap.exists()) {
    return docSnap.data();
  }
  return null;
}

export async function updateSchedule(municipalityId, scheduleData) {
  const scheduleRef = doc(db, 'municipalities', municipalityId, 'data', 'schedule');
  await setDoc(scheduleRef, {
    ...scheduleData,
    updatedAt: serverTimestamp()
  }, { merge: true });
}

export async function updateCollectionType(municipalityId, collectionTypeId, data) {
  const schedule = await getSchedule(municipalityId);

  if (schedule && schedule.collectionTypes) {
    const updatedTypes = schedule.collectionTypes.map(type =>
      type.id === collectionTypeId ? { ...type, ...data } : type
    );

    await updateSchedule(municipalityId, {
      ...schedule,
      collectionTypes: updatedTypes
    });
  }
}

export async function updateZoneSchedule(municipalityId, zoneId, scheduleData) {
  const schedule = await getSchedule(municipalityId);

  await updateSchedule(municipalityId, {
    ...schedule,
    schedules: {
      ...schedule?.schedules,
      [zoneId]: scheduleData
    }
  });
}

// ============================================
// EVENTS
// ============================================

export async function getEvents(municipalityId) {
  const eventsCol = collection(db, 'municipalities', municipalityId, 'events');
  const q = query(eventsCol, orderBy('date', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getUpcomingEvents(municipalityId) {
  const eventsCol = collection(db, 'municipalities', municipalityId, 'events');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const q = query(
    eventsCol,
    where('date', '>=', today.toISOString().split('T')[0]),
    orderBy('date', 'asc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function addEvent(municipalityId, eventData) {
  const eventsCol = collection(db, 'municipalities', municipalityId, 'events');
  const docRef = await addDoc(eventsCol, {
    ...eventData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return docRef.id;
}

export async function updateEvent(municipalityId, eventId, eventData) {
  const eventRef = doc(db, 'municipalities', municipalityId, 'events', eventId);
  await updateDoc(eventRef, {
    ...eventData,
    updatedAt: serverTimestamp()
  });
}

export async function deleteEvent(municipalityId, eventId) {
  const eventRef = doc(db, 'municipalities', municipalityId, 'events', eventId);
  await deleteDoc(eventRef);
}

// ============================================
// ALERTS / ANNOUNCEMENTS
// ============================================

export async function getAlerts(municipalityId) {
  const alertsCol = collection(db, 'municipalities', municipalityId, 'alerts');
  const q = query(alertsCol, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getActiveAlerts(municipalityId) {
  const alertsCol = collection(db, 'municipalities', municipalityId, 'alerts');
  const today = new Date().toISOString().split('T')[0];

  const q = query(
    alertsCol,
    where('active', '==', true)
  );
  const snapshot = await getDocs(q);
  // Filter by date on client side (Firestore doesn't support OR queries well)
  return snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(alert => !alert.endDate || alert.endDate >= today);
}

export async function addAlert(municipalityId, alertData) {
  const alertsCol = collection(db, 'municipalities', municipalityId, 'alerts');
  const docRef = await addDoc(alertsCol, {
    ...alertData,
    active: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return docRef.id;
}

export async function updateAlert(municipalityId, alertId, alertData) {
  const alertRef = doc(db, 'municipalities', municipalityId, 'alerts', alertId);
  await updateDoc(alertRef, {
    ...alertData,
    updatedAt: serverTimestamp()
  });
}

export async function deleteAlert(municipalityId, alertId) {
  const alertRef = doc(db, 'municipalities', municipalityId, 'alerts', alertId);
  await deleteDoc(alertRef);
}

// ============================================
// FILE UPLOADS (Logos, Images)
// ============================================

export async function uploadLogo(municipalityId, file) {
  const fileExtension = file.name.split('.').pop();
  const fileName = `logo.${fileExtension}`;
  const storageRef = ref(storage, `municipalities/${municipalityId}/${fileName}`);

  await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(storageRef);

  // Update municipality config with new logo URL
  await updateMunicipalityConfig(municipalityId, { logo: downloadURL });

  return downloadURL;
}

export async function uploadEventImage(municipalityId, eventId, file) {
  const fileExtension = file.name.split('.').pop();
  const fileName = `${eventId}.${fileExtension}`;
  const storageRef = ref(storage, `municipalities/${municipalityId}/events/${fileName}`);

  await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(storageRef);

  return downloadURL;
}

export async function deleteFile(filePath) {
  const fileRef = ref(storage, filePath);
  await deleteObject(fileRef);
}

// ============================================
// STATISTICS (Read-only)
// ============================================

export async function getMunicipalityStats(municipalityId) {
  const [events, alerts, zones] = await Promise.all([
    getEvents(municipalityId),
    getAlerts(municipalityId),
    getZones(municipalityId)
  ]);

  const now = new Date();
  const upcomingEvents = events.filter(e => new Date(e.date) >= now);
  const activeAlerts = alerts.filter(a => a.active);

  return {
    totalEvents: events.length,
    upcomingEvents: upcomingEvents.length,
    totalAlerts: alerts.length,
    activeAlerts: activeAlerts.length,
    totalZones: zones.length
  };
}

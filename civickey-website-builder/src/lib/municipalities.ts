import { db } from './firebase';
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  orderBy,
  where,
} from 'firebase/firestore/lite';
import type {
  MunicipalityConfig,
  Event,
  Alert,
  Facility,
  ScheduleData,
  Zone,
  CustomPage,
} from './types';

export async function getMunicipalityConfig(
  id: string
): Promise<MunicipalityConfig | null> {
  const docSnap = await getDoc(doc(db, 'municipalities', id));
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as MunicipalityConfig;
}

export async function getEvents(id: string): Promise<Event[]> {
  const q = query(
    collection(db, 'municipalities', id, 'events'),
    orderBy('date', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Event);
}

export async function getUpcomingEvents(id: string): Promise<Event[]> {
  const today = new Date().toISOString().split('T')[0];
  const q = query(
    collection(db, 'municipalities', id, 'events'),
    where('date', '>=', today),
    orderBy('date', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Event);
}

export async function getEvent(
  id: string,
  eventId: string
): Promise<Event | null> {
  const docSnap = await getDoc(
    doc(db, 'municipalities', id, 'events', eventId)
  );
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as Event;
}

export async function getAlerts(id: string): Promise<Alert[]> {
  const q = query(
    collection(db, 'municipalities', id, 'alerts'),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Alert);
}

export async function getActiveAlerts(id: string): Promise<Alert[]> {
  const q = query(
    collection(db, 'municipalities', id, 'alerts'),
    where('active', '==', true)
  );
  const snap = await getDocs(q);
  const today = new Date().toISOString().split('T')[0];
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as Alert)
    .filter((a) => !a.endDate || a.endDate >= today);
}

export async function getFacilities(id: string): Promise<Facility[]> {
  const snap = await getDocs(
    collection(db, 'municipalities', id, 'facilities')
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Facility);
}

export async function getFacility(
  id: string,
  facilityId: string
): Promise<Facility | null> {
  const docSnap = await getDoc(
    doc(db, 'municipalities', id, 'facilities', facilityId)
  );
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as Facility;
}

export async function getScheduleData(
  id: string
): Promise<ScheduleData | null> {
  const docSnap = await getDoc(
    doc(db, 'municipalities', id, 'data', 'schedule')
  );
  if (!docSnap.exists()) return null;
  return docSnap.data() as ScheduleData;
}

export async function getZones(id: string): Promise<Zone[]> {
  const snap = await getDocs(collection(db, 'municipalities', id, 'zones'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Zone);
}

export async function getPages(id: string): Promise<CustomPage[]> {
  const q = query(
    collection(db, 'municipalities', id, 'pages'),
    orderBy('menuOrder', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as CustomPage);
}

export async function getPublishedPages(id: string): Promise<CustomPage[]> {
  const q = query(
    collection(db, 'municipalities', id, 'pages'),
    where('status', '==', 'published'),
    orderBy('menuOrder', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as CustomPage);
}

export async function getPageBySlug(
  id: string,
  slug: string
): Promise<CustomPage | null> {
  const q = query(
    collection(db, 'municipalities', id, 'pages'),
    where('slug', '==', slug),
    where('status', '==', 'published')
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as CustomPage;
}

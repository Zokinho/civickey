import { getDocument, listDocuments, queryCollection, toFirestoreValue } from './firebase-admin';
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
  const doc = await getDocument(`municipalities/${id}`);
  if (!doc) return null;
  return { id: doc.id, ...doc.data } as MunicipalityConfig;
}

export async function getEvents(id: string): Promise<Event[]> {
  const docs = await queryCollection(`municipalities/${id}/events`, {
    orderBy: [{ field: 'date', direction: 'ASCENDING' }],
  });
  return docs.map((d) => ({ id: d.id, ...d.data }) as Event);
}

export async function getUpcomingEvents(id: string): Promise<Event[]> {
  const today = new Date().toISOString().split('T')[0];
  const docs = await queryCollection(`municipalities/${id}/events`, {
    filters: [{
      fieldFilter: {
        field: { fieldPath: 'date' },
        op: 'GREATER_THAN_OR_EQUAL',
        value: toFirestoreValue(today),
      },
    }],
    orderBy: [{ field: 'date', direction: 'ASCENDING' }],
  });
  return docs.map((d) => ({ id: d.id, ...d.data }) as Event);
}

export async function getEvent(
  id: string,
  eventId: string
): Promise<Event | null> {
  const doc = await getDocument(`municipalities/${id}/events/${eventId}`);
  if (!doc) return null;
  return { id: doc.id, ...doc.data } as Event;
}

export async function getAlerts(id: string): Promise<Alert[]> {
  const docs = await queryCollection(`municipalities/${id}/alerts`, {
    orderBy: [{ field: 'createdAt', direction: 'DESCENDING' }],
  });
  return docs.map((d) => ({ id: d.id, ...d.data }) as Alert);
}

export async function getActiveAlerts(id: string): Promise<Alert[]> {
  const docs = await queryCollection(`municipalities/${id}/alerts`, {
    filters: [{
      fieldFilter: {
        field: { fieldPath: 'active' },
        op: 'EQUAL',
        value: toFirestoreValue(true),
      },
    }],
  });
  const today = new Date().toISOString().split('T')[0];
  return docs
    .map((d) => ({ id: d.id, ...d.data }) as Alert)
    .filter((a) => !a.endDate || a.endDate >= today);
}

export async function getFacilities(id: string): Promise<Facility[]> {
  const docs = await listDocuments(`municipalities/${id}/facilities`);
  return docs.map((d) => ({ id: d.id, ...d.data }) as Facility);
}

export async function getFacility(
  id: string,
  facilityId: string
): Promise<Facility | null> {
  const doc = await getDocument(`municipalities/${id}/facilities/${facilityId}`);
  if (!doc) return null;
  return { id: doc.id, ...doc.data } as Facility;
}

export async function getScheduleData(
  id: string
): Promise<ScheduleData | null> {
  const doc = await getDocument(`municipalities/${id}/data/schedule`);
  if (!doc) return null;
  return doc.data as ScheduleData;
}

export async function getZones(id: string): Promise<Zone[]> {
  const docs = await listDocuments(`municipalities/${id}/zones`);
  return docs.map((d) => ({ id: d.id, ...d.data }) as Zone);
}

export async function getPages(id: string): Promise<CustomPage[]> {
  const docs = await queryCollection(`municipalities/${id}/pages`, {
    orderBy: [{ field: 'menuOrder', direction: 'ASCENDING' }],
  });
  return docs.map((d) => ({ id: d.id, ...d.data }) as CustomPage);
}

export async function getPublishedPages(id: string): Promise<CustomPage[]> {
  const docs = await queryCollection(`municipalities/${id}/pages`, {
    filters: [{
      fieldFilter: {
        field: { fieldPath: 'status' },
        op: 'EQUAL',
        value: toFirestoreValue('published'),
      },
    }],
    orderBy: [{ field: 'menuOrder', direction: 'ASCENDING' }],
  });
  return docs.map((d) => ({ id: d.id, ...d.data }) as CustomPage);
}

export async function getPageBySlug(
  id: string,
  slug: string
): Promise<CustomPage | null> {
  const docs = await queryCollection(`municipalities/${id}/pages`, {
    filters: [
      {
        fieldFilter: {
          field: { fieldPath: 'slug' },
          op: 'EQUAL',
          value: toFirestoreValue(slug),
        },
      },
      {
        fieldFilter: {
          field: { fieldPath: 'status' },
          op: 'EQUAL',
          value: toFirestoreValue('published'),
        },
      },
    ],
    limit: 1,
  });
  if (docs.length === 0) return null;
  return { id: docs[0].id, ...docs[0].data } as CustomPage;
}

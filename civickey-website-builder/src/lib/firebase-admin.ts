/**
 * Server-side Firestore client using the REST API.
 * This avoids API key restrictions that block the client SDK on serverless functions.
 * Works because Firestore security rules allow `read: if true` for municipality data.
 */

export interface FirestoreDoc {
  id: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>;
}

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'civickey-prod';
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseFirestoreValue(value: any): any {
  if (value === undefined || value === null) return null;
  if ('stringValue' in value) return value.stringValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return value.doubleValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('nullValue' in value) return null;
  if ('timestampValue' in value) return value.timestampValue;
  if ('mapValue' in value) return parseFirestoreFields(value.mapValue.fields || {});
  if ('arrayValue' in value) {
    return (value.arrayValue.values || []).map(parseFirestoreValue);
  }
  return null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseFirestoreFields(fields: Record<string, any>): Record<string, any> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    result[key] = parseFirestoreValue(value);
  }
  return result;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseDocument(doc: any): FirestoreDoc | null {
  if (!doc?.name || !doc?.fields) return null;
  const pathParts = doc.name.split('/');
  const id = pathParts[pathParts.length - 1];
  return { id, data: parseFirestoreFields(doc.fields) };
}

export async function getDocument(path: string): Promise<FirestoreDoc | null> {
  const resp = await fetch(`${BASE_URL}/${path}`, { next: { revalidate: 300 } });
  if (resp.status === 404) return null;
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Firestore GET ${path} failed (${resp.status}): ${text}`);
  }
  const doc = await resp.json();
  return parseDocument(doc);
}

export async function listDocuments(collectionPath: string, pageSize = 100): Promise<FirestoreDoc[]> {
  const resp = await fetch(
    `${BASE_URL}/${collectionPath}?pageSize=${pageSize}`,
    { next: { revalidate: 300 } }
  );
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Firestore LIST ${collectionPath} failed (${resp.status}): ${text}`);
  }
  const data = await resp.json();
  const docs = (data.documents || [])
    .map(parseDocument)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((d: any): d is NonNullable<typeof d> => d !== null);
  return docs;
}

interface StructuredQueryFilter {
  fieldFilter: {
    field: { fieldPath: string };
    op: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value: any;
  };
}

interface QueryOptions {
  filters?: StructuredQueryFilter[];
  orderBy?: { field: string; direction?: 'ASCENDING' | 'DESCENDING' }[];
  limit?: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toFirestoreValue(value: any): any {
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'number') return Number.isInteger(value)
    ? { integerValue: String(value) }
    : { doubleValue: value };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (value === null) return { nullValue: 'NULL_VALUE' };
  return { stringValue: String(value) };
}

export async function queryCollection(collectionPath: string, options: QueryOptions = {}): Promise<FirestoreDoc[]> {
  // Extract parent path and collection ID
  const parts = collectionPath.split('/');
  const collectionId = parts.pop()!;
  const parentPath = parts.length > 0 ? parts.join('/') : '';

  const url = parentPath
    ? `${BASE_URL}/${parentPath}:runQuery`
    : `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:runQuery`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const structuredQuery: any = {
    from: [{ collectionId }],
  };

  if (options.filters && options.filters.length > 0) {
    if (options.filters.length === 1) {
      structuredQuery.where = options.filters[0];
    } else {
      structuredQuery.where = {
        compositeFilter: {
          op: 'AND',
          filters: options.filters,
        },
      };
    }
  }

  if (options.orderBy && options.orderBy.length > 0) {
    structuredQuery.orderBy = options.orderBy.map((o) => ({
      field: { fieldPath: o.field },
      direction: o.direction || 'ASCENDING',
    }));
  }

  if (options.limit) {
    structuredQuery.limit = options.limit;
  }

  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ structuredQuery }),
    next: { revalidate: 300 },
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Firestore QUERY ${collectionPath} failed (${resp.status}): ${text}`);
  }

  const results = await resp.json();
  if (!Array.isArray(results)) return [];

  return results
    .filter((r: { document?: unknown }) => r.document)
    .map((r: { document: unknown }) => parseDocument(r.document))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((d: any): d is NonNullable<typeof d> => d !== null);
}

export { toFirestoreValue };

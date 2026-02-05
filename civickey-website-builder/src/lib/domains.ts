import { queryCollection, toFirestoreValue } from './firebase-admin';
import type { MunicipalityConfig } from './types';

export async function getMunicipalityByDomain(
  domain: string
): Promise<MunicipalityConfig | null> {
  const docs = await queryCollection('municipalities', {
    filters: [{
      fieldFilter: {
        field: { fieldPath: 'website.customDomain' },
        op: 'EQUAL',
        value: toFirestoreValue(domain),
      },
    }],
    limit: 1,
  });
  if (docs.length === 0) return null;
  return { id: docs[0].id, ...docs[0].data } as MunicipalityConfig;
}

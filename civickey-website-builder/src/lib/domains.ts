import { db } from './firebase';
import { collection, getDocs, query, where } from 'firebase/firestore/lite';
import type { MunicipalityConfig } from './types';

export async function getMunicipalityByDomain(
  domain: string
): Promise<MunicipalityConfig | null> {
  const q = query(
    collection(db, 'municipalities'),
    where('website.customDomain', '==', domain)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as MunicipalityConfig;
}

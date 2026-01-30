import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useMunicipality } from '../contexts/MunicipalityContext';

export function useRoadClosures() {
  const { municipalityId } = useMunicipality();
  const [closures, setClosures] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchClosures = useCallback(async () => {
    if (!municipalityId) {
      setLoading(false);
      return;
    }

    try {
      const today = new Date().toISOString().split('T')[0];

      // Get active and scheduled road closures
      const q = query(
        collection(db, 'municipalities', municipalityId, 'roadClosures'),
        where('status', 'in', ['active', 'scheduled']),
        orderBy('startDate', 'asc')
      );

      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        // Filter out closures that have ended
        .filter(closure => {
          if (closure.endDate && closure.endDate < today) return false;
          return true;
        });

      setClosures(data);
    } catch (error) {
      console.log('Error fetching road closures:', error.message);
    } finally {
      setLoading(false);
    }
  }, [municipalityId]);

  useEffect(() => {
    fetchClosures();
  }, [fetchClosures]);

  return { closures, loading, refresh: fetchClosures };
}

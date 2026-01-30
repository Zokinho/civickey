import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useMunicipality } from '../contexts/MunicipalityContext';

export function useAnnouncements() {
  const { municipalityId } = useMunicipality();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAnnouncements = useCallback(async () => {
    if (!municipalityId) {
      setLoading(false);
      return;
    }

    try {
      const today = new Date().toISOString().split('T')[0];

      // Get all active announcements from municipality's alerts collection
      const q = query(
        collection(db, 'municipalities', municipalityId, 'alerts'),
        where('active', '==', true)
      );

      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        // Filter by date range (if set)
        .filter(announcement => {
          if (announcement.startDate && announcement.startDate > today) return false;
          if (announcement.endDate && announcement.endDate < today) return false;
          return true;
        })
        // Sort by creation date (newest first)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setAnnouncements(data);
    } catch (error) {
      console.log('Error fetching announcements:', error.message);
    } finally {
      setLoading(false);
    }
  }, [municipalityId]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  return { announcements, loading, refresh: fetchAnnouncements };
}

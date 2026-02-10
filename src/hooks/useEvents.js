import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useMunicipality } from '../contexts/MunicipalityContext';
import { useAppFocusRefresh } from './useAppFocusRefresh';
import localEvents from '../data/events.json';

export function useEvents() {
  const { municipalityId } = useMunicipality();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEvents = useCallback(async () => {
    if (!municipalityId) {
      setEvents(localEvents.events || []);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const eventsCol = collection(db, 'municipalities', municipalityId, 'events');
      const q = query(eventsCol, orderBy('date', 'asc'));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        // No events in Firebase, use local data as fallback
        setEvents(localEvents.events || []);
      } else {
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setEvents(data);
      }
    } catch (error) {
      console.error('Error fetching events, using local data:', error.message);
      setError(error.message);
      // Fall back to local events
      setEvents(localEvents.events || []);
    } finally {
      setLoading(false);
    }
  }, [municipalityId]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Refresh when app returns to foreground after 15+ minutes
  useAppFocusRefresh(fetchEvents);

  return { events, loading, error, refresh: fetchEvents };
}

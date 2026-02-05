import { useState, useEffect, useCallback, useRef } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useMunicipality } from '../contexts/MunicipalityContext';
import { normalizeText } from '../utils/textNormalize';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY = '@civickey_waste_items';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export function useWasteItems() {
  const { municipalityId } = useMunicipality();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const municipalityIdRef = useRef(municipalityId);

  useEffect(() => {
    municipalityIdRef.current = municipalityId;
  }, [municipalityId]);

  const getCacheKey = useCallback(() => {
    return `${CACHE_KEY}_${municipalityId}`;
  }, [municipalityId]);

  const loadFromCache = useCallback(async () => {
    try {
      const cached = await AsyncStorage.getItem(getCacheKey());
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const isStale = Date.now() - timestamp > CACHE_TTL;
        return { data, isStale };
      }
    } catch (e) {
      console.error('Error reading waste items cache:', e.message);
    }
    return { data: null, isStale: true };
  }, [getCacheKey]);

  const saveToCache = useCallback(async (data) => {
    try {
      await AsyncStorage.setItem(getCacheKey(), JSON.stringify({
        data,
        timestamp: Date.now(),
      }));
    } catch (e) {
      console.error('Error saving waste items cache:', e.message);
    }
  }, [getCacheKey]);

  const fetchItems = useCallback(async () => {
    if (!municipalityId) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      setError(null);

      // Load from cache first for instant display
      const { data: cachedData, isStale } = await loadFromCache();
      if (cachedData) {
        setItems(cachedData);
        setLoading(false);
        if (!isStale) return; // Cache is fresh, no need to fetch
      }

      // Fetch from Firestore
      const wasteItemsCol = collection(db, 'municipalities', municipalityId, 'wasteItems');
      const querySnapshot = await getDocs(wasteItemsCol);
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Only update if municipality hasn't changed during fetch
      if (municipalityIdRef.current === municipalityId) {
        setItems(data);
        await saveToCache(data);
      }
    } catch (err) {
      console.error('Error fetching waste items:', err.message);
      setError(err.message);
      // Keep cached data if available
    } finally {
      setLoading(false);
    }
  }, [municipalityId, loadFromCache, saveToCache]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const searchItems = useCallback((queryText) => {
    if (!queryText || queryText.length < 2) return [];

    const normalized = normalizeText(queryText);
    const prefixMatches = [];
    const substringMatches = [];

    for (const item of items) {
      const terms = item.searchTerms || [];
      let isPrefix = false;
      let isSubstring = false;

      for (const term of terms) {
        if (term.startsWith(normalized)) {
          isPrefix = true;
          break;
        } else if (term.includes(normalized)) {
          isSubstring = true;
        }
      }

      if (isPrefix) {
        prefixMatches.push(item);
      } else if (isSubstring) {
        substringMatches.push(item);
      }
    }

    return [...prefixMatches, ...substringMatches];
  }, [items]);

  return { items, loading, error, searchItems, refresh: fetchItems };
}

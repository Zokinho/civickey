// Manages selected municipality state and data caching
import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchMunicipalityData, getAllMunicipalities } from '../services/municipalityService';

const MunicipalityContext = createContext(null);

const STORAGE_KEYS = {
  MUNICIPALITY_ID: '@civickey_municipality_id',
  MUNICIPALITY_DATA: '@civickey_municipality_data',
  ZONE_ID: '@civickey_zone_id',
  LEGACY_ZONE_ID: '@civickey_zone' // Old key for backwards compatibility
};

// Cache version - increment this to force cache refresh on format changes
const CACHE_VERSION = 2;

// Cache data for 1 hour
const CACHE_DURATION = 60 * 60 * 1000;

export function MunicipalityProvider({ children }) {
  const [municipalityId, setMunicipalityId] = useState(null);
  const [zoneId, setZoneId] = useState(null);
  const [municipalityData, setMunicipalityData] = useState(null);
  const [municipalitiesList, setMunicipalitiesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load saved selections on startup
  useEffect(() => {
    loadSavedState();
  }, []);

  const loadSavedState = async () => {
    try {
      const [savedMunicipalityId, savedZoneId, legacyZoneId, savedDataJson] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.MUNICIPALITY_ID),
        AsyncStorage.getItem(STORAGE_KEYS.ZONE_ID),
        AsyncStorage.getItem(STORAGE_KEYS.LEGACY_ZONE_ID),
        AsyncStorage.getItem(STORAGE_KEYS.MUNICIPALITY_DATA)
      ]);

      // Use legacy zone if new zone not set
      const effectiveZoneId = savedZoneId || legacyZoneId;

      // Default to saint-lazare if no municipality selected (for existing installs)
      const effectiveMunicipalityId = savedMunicipalityId || (legacyZoneId ? 'saint-lazare' : null);

      if (effectiveMunicipalityId) {
        setMunicipalityId(effectiveMunicipalityId);
        setZoneId(effectiveZoneId);

        // Migrate legacy data to new keys if needed
        if (!savedMunicipalityId && legacyZoneId) {
          await AsyncStorage.setItem(STORAGE_KEYS.MUNICIPALITY_ID, effectiveMunicipalityId);
        }
        if (!savedZoneId && legacyZoneId) {
          await AsyncStorage.setItem(STORAGE_KEYS.ZONE_ID, legacyZoneId);
        }

        // Check if cached data is still fresh and correct version
        let needsFetch = true;
        if (savedDataJson) {
          const savedData = JSON.parse(savedDataJson);
          const cacheAge = Date.now() - new Date(savedData.fetchedAt).getTime();
          const cacheVersionMatch = savedData.cacheVersion === CACHE_VERSION;

          if (cacheAge < CACHE_DURATION && cacheVersionMatch) {
            setMunicipalityData(savedData);
            needsFetch = false;
          }
        }

        // Fetch fresh data if cache expired or missing
        if (needsFetch) {
          const data = await fetchMunicipalityData(effectiveMunicipalityId);
          data.cacheVersion = CACHE_VERSION;
          setMunicipalityData(data);
          await AsyncStorage.setItem(STORAGE_KEYS.MUNICIPALITY_DATA, JSON.stringify(data));
        }
      }
    } catch (err) {
      console.error('Error loading saved state:', err);
      setError('Failed to load saved settings');
    } finally {
      setLoading(false);
    }
  };

  // Fetch municipalities list for selection screen
  const loadMunicipalitiesList = useCallback(async () => {
    try {
      const list = await getAllMunicipalities();
      setMunicipalitiesList(list);
      return list;
    } catch (err) {
      console.error('Error loading municipalities:', err);
      setError('Failed to load municipalities');
      return [];
    }
  }, []);

  // Refresh data from Firestore
  const refreshMunicipalityData = useCallback(async (id) => {
    const targetId = id || municipalityId;
    if (!targetId) return;

    try {
      setLoading(true);
      const data = await fetchMunicipalityData(targetId);
      data.cacheVersion = CACHE_VERSION;
      setMunicipalityData(data);

      // Cache the data
      await AsyncStorage.setItem(
        STORAGE_KEYS.MUNICIPALITY_DATA,
        JSON.stringify(data)
      );

      return data;
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError('Failed to refresh data');
    } finally {
      setLoading(false);
    }
  }, [municipalityId]);

  // Select a municipality
  const selectMunicipality = useCallback(async (id) => {
    try {
      setLoading(true);
      setMunicipalityId(id);
      setZoneId(null);

      await AsyncStorage.setItem(STORAGE_KEYS.MUNICIPALITY_ID, id);
      await AsyncStorage.removeItem(STORAGE_KEYS.ZONE_ID);

      await refreshMunicipalityData(id);
    } catch (err) {
      console.error('Error selecting municipality:', err);
      setError('Failed to select municipality');
    }
  }, [refreshMunicipalityData]);

  // Select a zone within the municipality
  const selectZone = useCallback(async (id) => {
    try {
      setZoneId(id);
      await AsyncStorage.setItem(STORAGE_KEYS.ZONE_ID, id);
    } catch (err) {
      console.error('Error selecting zone:', err);
    }
  }, []);

  // Clear all selections (for reset)
  const clearSelection = useCallback(async () => {
    try {
      setMunicipalityId(null);
      setZoneId(null);
      setMunicipalityData(null);

      await AsyncStorage.multiRemove([
        STORAGE_KEYS.MUNICIPALITY_ID,
        STORAGE_KEYS.ZONE_ID,
        STORAGE_KEYS.MUNICIPALITY_DATA
      ]);
    } catch (err) {
      console.error('Error clearing selection:', err);
    }
  }, []);

  // Get current zone's schedule
  const getZoneSchedule = useCallback(() => {
    if (!municipalityData?.schedule?.schedules || !zoneId) return null;
    return municipalityData.schedule.schedules[zoneId];
  }, [municipalityData, zoneId]);

  // Get theme colors from municipality config
  const getThemeColors = useCallback(() => {
    return municipalityData?.config?.colors || {
      primary: '#0D5C63',
      secondary: '#E07A5F',
      background: '#F5F0E8'
    };
  }, [municipalityData]);

  // Get upcoming special collections for user's zone
  const getUpcomingSpecialCollections = useCallback(() => {
    const specialCollections = municipalityData?.schedule?.specialCollections || [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return specialCollections
      .filter(sc => {
        // Must be active
        if (!sc.active) return false;

        // Must be today or in the future
        const scDate = new Date(sc.date);
        scDate.setHours(0, 0, 0, 0);
        if (scDate < today) return false;

        // Zone filter: empty zones array means all zones
        if (sc.zones && sc.zones.length > 0 && zoneId) {
          if (!sc.zones.includes(zoneId)) return false;
        }

        return true;
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [municipalityData, zoneId]);

  const value = useMemo(() => ({
    // State
    municipalityId,
    zoneId,
    municipalityData,
    municipalitiesList,
    loading,
    error,

    // Actions
    loadMunicipalitiesList,
    selectMunicipality,
    selectZone,
    refreshMunicipalityData,
    clearSelection,

    // Helpers
    getZoneSchedule,
    getThemeColors,
    getUpcomingSpecialCollections,

    // Convenience accessors
    config: municipalityData?.config,
    zones: municipalityData?.zones || [],
    schedule: municipalityData?.schedule,
    events: municipalityData?.events || [],
    alerts: municipalityData?.alerts || [],
    facilities: municipalityData?.facilities || [],
    specialCollections: municipalityData?.schedule?.specialCollections || []
  }), [
    municipalityId,
    zoneId,
    municipalityData,
    municipalitiesList,
    loading,
    error,
    loadMunicipalitiesList,
    selectMunicipality,
    selectZone,
    refreshMunicipalityData,
    clearSelection,
    getZoneSchedule,
    getThemeColors,
    getUpcomingSpecialCollections
  ]);

  return (
    <MunicipalityContext.Provider value={value}>
      {children}
    </MunicipalityContext.Provider>
  );
}

export function useMunicipality() {
  const context = useContext(MunicipalityContext);
  if (!context) {
    throw new Error('useMunicipality must be used within a MunicipalityProvider');
  }
  return context;
}

import { useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';
import { Platform } from 'react-native';

const STORAGE_KEYS = {
  OPEN_COUNT: '@civickey_open_count',
  FIRST_OPEN: '@civickey_first_open',
  LAST_PROMPT: '@civickey_last_prompt',
};

// Configuration
const MIN_OPENS = 5;
const MIN_DAYS_SINCE_INSTALL = 3;
const MIN_DAYS_BETWEEN_PROMPTS = 60;

export function useAppRating() {
  useEffect(() => {
    trackAppOpen();
  }, []);

  const trackAppOpen = async () => {
    try {
      // Get current count
      const countStr = await AsyncStorage.getItem(STORAGE_KEYS.OPEN_COUNT);
      const count = countStr ? parseInt(countStr, 10) : 0;

      // Increment and save
      await AsyncStorage.setItem(STORAGE_KEYS.OPEN_COUNT, String(count + 1));

      // Set first open date if not set
      const firstOpen = await AsyncStorage.getItem(STORAGE_KEYS.FIRST_OPEN);
      if (!firstOpen) {
        await AsyncStorage.setItem(STORAGE_KEYS.FIRST_OPEN, new Date().toISOString());
      }
    } catch (error) {
      console.log('Error tracking app open:', error);
    }
  };

  const shouldPromptForReview = async () => {
    try {
      // Check if store review is available
      const isAvailable = await StoreReview.isAvailableAsync();
      if (!isAvailable) return false;

      // Get stored values
      const [countStr, firstOpenStr, lastPromptStr] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.OPEN_COUNT),
        AsyncStorage.getItem(STORAGE_KEYS.FIRST_OPEN),
        AsyncStorage.getItem(STORAGE_KEYS.LAST_PROMPT),
      ]);

      const count = countStr ? parseInt(countStr, 10) : 0;
      const firstOpen = firstOpenStr ? new Date(firstOpenStr) : new Date();
      const lastPrompt = lastPromptStr ? new Date(lastPromptStr) : null;

      const now = new Date();
      const daysSinceInstall = (now - firstOpen) / (1000 * 60 * 60 * 24);
      const daysSinceLastPrompt = lastPrompt
        ? (now - lastPrompt) / (1000 * 60 * 60 * 24)
        : Infinity;

      // Check all conditions
      if (count < MIN_OPENS) return false;
      if (daysSinceInstall < MIN_DAYS_SINCE_INSTALL) return false;
      if (daysSinceLastPrompt < MIN_DAYS_BETWEEN_PROMPTS) return false;

      return true;
    } catch (error) {
      console.log('Error checking review conditions:', error);
      return false;
    }
  };

  const requestReview = useCallback(async () => {
    try {
      const shouldPrompt = await shouldPromptForReview();
      if (!shouldPrompt) return false;

      // Record that we prompted
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_PROMPT, new Date().toISOString());

      // Request the review
      if (await StoreReview.hasAction()) {
        await StoreReview.requestReview();
        return true;
      }
    } catch (error) {
      console.log('Error requesting review:', error);
    }
    return false;
  }, []);

  return { requestReview };
}

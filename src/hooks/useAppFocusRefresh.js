import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

/**
 * Calls the provided refresh function when the app returns to foreground
 * after being in the background for at least `thresholdMs` milliseconds.
 *
 * @param {Function} refresh - Function to call on refresh
 * @param {number} thresholdMs - Minimum background time before refresh (default: 15 min)
 */
export function useAppFocusRefresh(refresh, thresholdMs = 15 * 60 * 1000) {
  const backgroundTimeRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      // App going to background
      if (appStateRef.current === 'active' && nextAppState.match(/inactive|background/)) {
        backgroundTimeRef.current = Date.now();
      }

      // App coming to foreground
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        if (backgroundTimeRef.current) {
          const elapsed = Date.now() - backgroundTimeRef.current;
          if (elapsed >= thresholdMs) {
            refresh();
          }
        }
      }

      appStateRef.current = nextAppState;
    });

    return () => subscription.remove();
  }, [refresh, thresholdMs]);
}

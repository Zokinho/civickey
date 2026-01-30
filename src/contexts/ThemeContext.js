// Manages app theme (light/dark mode)
import { createContext, useState, useEffect, useContext, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

const THEME_KEY = '@civickey_theme';

// Theme options: 'light', 'dark', 'system'
const ThemeContext = createContext();

// Color definitions
const lightColors = {
  // Backgrounds
  background: '#F5F0E8',
  surface: '#FFFFFF',
  card: '#FFFFFF',

  // Text
  text: '#1A1A2E',
  textSecondary: '#5A6C7D',
  textMuted: '#8A9CAD',

  // Borders
  border: '#E8E4DC',
  borderLight: '#F0EDE8',

  // Status
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#E07A5F',
  info: '#2196F3',

  // Tab bar
  tabBar: '#FFFFFF',
  tabBarBorder: '#E8E4DC',
  tabInactive: '#5A6C7D',

  // Inputs
  inputBackground: '#FFFFFF',
  inputBorder: '#E8E4DC',
  placeholder: '#5A6C7D',

  // Overlays
  overlay: 'rgba(0, 0, 0, 0.5)',

  // Misc
  shadow: 'rgba(0, 0, 0, 0.1)',
  divider: '#E8E4DC',
};

const darkColors = {
  // Backgrounds
  background: '#121212',
  surface: '#1E1E1E',
  card: '#2C2C2C',

  // Text
  text: '#FFFFFF',
  textSecondary: '#B0B0B0',
  textMuted: '#808080',

  // Borders
  border: '#3C3C3C',
  borderLight: '#2C2C2C',

  // Status
  success: '#66BB6A',
  warning: '#FFA726',
  error: '#EF5350',
  info: '#42A5F5',

  // Tab bar
  tabBar: '#1E1E1E',
  tabBarBorder: '#3C3C3C',
  tabInactive: '#808080',

  // Inputs
  inputBackground: '#2C2C2C',
  inputBorder: '#3C3C3C',
  placeholder: '#808080',

  // Overlays
  overlay: 'rgba(0, 0, 0, 0.7)',

  // Misc
  shadow: 'rgba(0, 0, 0, 0.3)',
  divider: '#3C3C3C',
};

export function ThemeProvider({ children }) {
  const systemColorScheme = useColorScheme();
  const [themePreference, setThemePreference] = useState('system'); // 'light', 'dark', 'system'
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const saved = await AsyncStorage.getItem(THEME_KEY);
      if (saved) {
        setThemePreference(saved);
      }
    } catch (e) {
      console.error('Failed to load theme', e);
    } finally {
      setIsLoading(false);
    }
  };

  const setTheme = async (theme) => {
    try {
      await AsyncStorage.setItem(THEME_KEY, theme);
      setThemePreference(theme);
    } catch (e) {
      console.error('Failed to save theme', e);
    }
  };

  // Determine actual theme based on preference
  const isDark = useMemo(() => {
    if (themePreference === 'system') {
      return systemColorScheme === 'dark';
    }
    return themePreference === 'dark';
  }, [themePreference, systemColorScheme]);

  // Get the appropriate color set
  const colors = useMemo(() => {
    return isDark ? darkColors : lightColors;
  }, [isDark]);

  const value = useMemo(() => ({
    themePreference,
    setTheme,
    isDark,
    colors,
    isLoading,
  }), [themePreference, isDark, colors, isLoading]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

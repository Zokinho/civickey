import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useEffect, useState, useCallback } from 'react';
import { Text, TextInput, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import ErrorBoundary from './src/components/ErrorBoundary';
import { LanguageProvider, useLanguage } from './src/contexts/LanguageContext';
import { MunicipalityProvider, useMunicipality } from './src/contexts/MunicipalityContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import ProvinceSelectScreen from './src/screens/ProvinceSelectScreen';
import MunicipalitySelectScreen from './src/screens/MunicipalitySelectScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import HomeScreen from './src/screens/HomeScreen';
import ScheduleScreen from './src/screens/ScheduleScreen';
import EventsScreen from './src/screens/EventsScreen';
import FacilitiesScreen from './src/screens/FacilitiesScreen';
import SettingsScreen from './src/screens/SettingsScreen';

// Cap font scaling to prevent layout overflow on devices with large font/zoom settings
Text.defaultProps = Text.defaultProps || {};
Text.defaultProps.maxFontSizeMultiplier = 1.2;
TextInput.defaultProps = TextInput.defaultProps || {};
TextInput.defaultProps.maxFontSizeMultiplier = 1.2;

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const LEGACY_ZONE_KEY = '@civickey_zone';
const ZONE_KEY = '@civickey_zone_id';

function TabNavigator({ onReset }) {
  const { getThemeColors } = useMunicipality();
  const { t } = useLanguage();
  const { colors: themeColors } = useTheme();
  const municipalityColors = getThemeColors();
  const insets = useSafeAreaInsets();

  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'ios' ? 20 : 10);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: municipalityColors.primary,
        tabBarInactiveTintColor: themeColors.tabInactive,
        tabBarStyle: {
          backgroundColor: themeColors.tabBar,
          borderTopColor: themeColors.tabBarBorder,
          paddingBottom: bottomPadding,
          paddingTop: 10,
          height: 60 + bottomPadding,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: t('home'),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>🏠</Text>,
        }}
      />
      <Tab.Screen
        name="Schedule"
        component={ScheduleScreen}
        options={{
          tabBarLabel: t('schedule'),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>📅</Text>,
        }}
      />
      <Tab.Screen
        name="Events"
        component={EventsScreen}
        options={{
          tabBarLabel: t('events'),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>📣</Text>,
        }}
      />
      <Tab.Screen
        name="Facilities"
        component={FacilitiesScreen}
        options={{
          tabBarLabel: t('facilities'),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>🏛️</Text>,
        }}
      />
      <Tab.Screen
        name="Settings"
        options={{
          tabBarLabel: t('settings'),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>⚙️</Text>,
        }}
      >
        {(props) => <SettingsScreen {...props} onReset={onReset} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

function AppContent() {
  const { municipalityId, zoneId, zones, loading: municipalityLoading, clearSelection, selectZone } = useMunicipality();
  const { isDark, colors: themeColors } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [hasZone, setHasZone] = useState(false);
  const [hasMunicipality, setHasMunicipality] = useState(false);
  const [selectedProvince, setSelectedProvince] = useState(null);

  // Custom navigation theme
  const navigationTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: themeColors.background,
      card: themeColors.card,
      text: themeColors.text,
      border: themeColors.border,
    },
  };

  const checkZone = useCallback(async () => {
    try {
      const [zone, legacyZone] = await Promise.all([
        AsyncStorage.getItem(ZONE_KEY),
        AsyncStorage.getItem(LEGACY_ZONE_KEY),
      ]);
      setHasZone(zone !== null || legacyZone !== null);
    } catch (e) {
      console.error('Failed to load zone', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkZone();
  }, [checkZone]);

  // Update hasMunicipality when municipalityId changes
  useEffect(() => {
    setHasMunicipality(!!municipalityId);
  }, [municipalityId]);

  // Auto-select zone if there's only one zone for the municipality
  useEffect(() => {
    const autoSelectSingleZone = async () => {
      if (hasMunicipality && !hasZone && zones && zones.length === 1) {
        try {
          await selectZone(zones[0].id);
          setHasZone(true);
        } catch (e) {
          console.error('Failed to auto-select zone', e);
        }
      }
    };
    autoSelectSingleZone();
  }, [hasMunicipality, hasZone, zones, selectZone]);

  const handleProvinceSelect = (province) => {
    setSelectedProvince(province);
  };

  const handleBackToProvince = () => {
    setSelectedProvince(null);
  };

  const handleMunicipalitySet = () => {
    setHasMunicipality(true);
    setSelectedProvince(null); // Clear province after selection
  };

  const handleZoneSet = () => {
    setHasZone(true);
  };

  const handleReset = async () => {
    // Clear both municipality and zone
    await clearSelection();
    await AsyncStorage.multiRemove([ZONE_KEY, LEGACY_ZONE_KEY]);
    setHasMunicipality(false);
    setHasZone(false);
    setSelectedProvince(null);
  };

  if (isLoading || municipalityLoading) {
    return null;
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      {!hasMunicipality ? (
        // Step 1: Select province, then municipality
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!selectedProvince ? (
            <Stack.Screen name="ProvinceSelect">
              {(props) => <ProvinceSelectScreen {...props} onSelectProvince={handleProvinceSelect} />}
            </Stack.Screen>
          ) : (
            <Stack.Screen name="MunicipalitySelect">
              {(props) => (
                <MunicipalitySelectScreen
                  {...props}
                  selectedProvince={selectedProvince}
                  onBack={handleBackToProvince}
                  onComplete={handleMunicipalitySet}
                />
              )}
            </Stack.Screen>
          )}
        </Stack.Navigator>
      ) : !hasZone ? (
        // Step 2: Select zone within municipality
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Welcome">
            {(props) => <WelcomeScreen {...props} onZoneSet={handleZoneSet} />}
          </Stack.Screen>
        </Stack.Navigator>
      ) : (
        // Step 3: Main app
        <TabNavigator onReset={handleReset} />
      )}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <ThemeProvider>
          <LanguageProvider>
            <MunicipalityProvider>
              <AppContent />
            </MunicipalityProvider>
          </LanguageProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

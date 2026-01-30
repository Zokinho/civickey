import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useEffect, useState, useCallback } from 'react';
import { Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const STORAGE_KEY = '@civickey_zone';

function TabNavigator({ onReset }) {
  const { getThemeColors } = useMunicipality();
  const { t } = useLanguage();
  const { colors: themeColors } = useTheme();
  const municipalityColors = getThemeColors();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: municipalityColors.primary,
        tabBarInactiveTintColor: themeColors.tabInactive,
        tabBarStyle: {
          backgroundColor: themeColors.tabBar,
          borderTopColor: themeColors.tabBarBorder,
          paddingBottom: 20,
          paddingTop: 10,
          height: 80,
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
  const { municipalityId, zoneId, loading: municipalityLoading, clearSelection } = useMunicipality();
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
      const zone = await AsyncStorage.getItem(STORAGE_KEY);
      setHasZone(zone !== null);
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
    await AsyncStorage.removeItem(STORAGE_KEY);
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
    <ThemeProvider>
      <LanguageProvider>
        <MunicipalityProvider>
          <AppContent />
        </MunicipalityProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

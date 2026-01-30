import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Linking
} from 'react-native';

import { useLanguage } from '../hooks/useLanguage';
import { useMunicipality } from '../contexts/MunicipalityContext';
import { useTheme } from '../contexts/ThemeContext';

export default function WelcomeScreen({ navigation, onZoneSet }) {
  const [selectedZone, setSelectedZone] = useState(null);
  const { t, language } = useLanguage();
  const { zones, schedule, selectZone, getThemeColors } = useMunicipality();
  const { colors: themeColors, isDark } = useTheme();

  // Get zone map URL from schedule data
  const zoneMapUrl = schedule?.zoneMapUrl;

  // Get theme colors from municipality config
  const colors = getThemeColors();

  // Helper to safely get localized text from object or string
  const getLocalizedText = (obj, fallback = '') => {
    if (!obj) return fallback;
    if (typeof obj === 'string') return obj;
    return obj[language] || obj.en || obj.fr || fallback;
  };

  // Get zone display name
  const getZoneName = (zone) => {
    if (zone.nameEn || zone.nameFr) {
      return language === 'fr' ? (zone.nameFr || zone.nameEn || '') : (zone.nameEn || zone.nameFr || '');
    }
    return getLocalizedText(zone.name, '');
  };

  const handleContinue = async () => {
    if (!selectedZone) return;

    try {
      await selectZone(selectedZone);
      onZoneSet();
    } catch (e) {
      console.error('Failed to save zone', e);
    }
  };

  const openZoneMap = () => {
    if (zoneMapUrl) {
      Linking.openURL(zoneMapUrl);
    }
  };

  // Show map button only when there's more than one zone and a URL is provided
  const showMapButton = zones && zones.length > 1 && zoneMapUrl;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.primary }]}>{t('welcome')}</Text>
        <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
          {t('selectZone')}
        </Text>

        <View style={styles.zoneList}>
          {(zones || []).map((zone) => (
            <TouchableOpacity
              key={zone.id}
              style={[
                styles.zoneButton,
                { backgroundColor: themeColors.card },
                selectedZone === zone.id && [styles.zoneButtonSelected, { borderColor: colors.primary, backgroundColor: isDark ? `${colors.primary}30` : `${colors.primary}15` }],
              ]}
              onPress={() => setSelectedZone(zone.id)}
            >
              <Text
                style={[
                  styles.zoneName,
                  { color: themeColors.text },
                  selectedZone === zone.id && { color: colors.primary },
                ]}
              >
                {getZoneName(zone)}
              </Text>
              <Text style={[styles.zoneDescription, { color: themeColors.textSecondary }]}>
                {language === 'fr'
                  ? (zone.descriptionFr || zone.descriptionEn || getLocalizedText(zone.description, ''))
                  : (zone.descriptionEn || zone.descriptionFr || getLocalizedText(zone.description, ''))}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {showMapButton && (
          <TouchableOpacity style={styles.mapLinkButton} onPress={openZoneMap}>
            <Text style={[styles.mapLinkText, { color: colors.primary }]}>
              {language === 'fr' ? 'Voir la carte des zones' : 'View zone map'} →
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.continueButton,
            { backgroundColor: colors.primary },
            !selectedZone && { backgroundColor: isDark ? '#4A5568' : '#B0C4C8' },
          ]}
          onPress={handleContinue}
          disabled={!selectedZone}
        >
          <Text style={styles.continueButtonText}>{t('continue')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F0E8',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0D5C63',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#5A6C7D',
    textAlign: 'center',
    marginBottom: 32,
  },
  zoneList: {
    gap: 12,
    marginBottom: 16,
  },
  mapLinkButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  mapLinkText: {
    fontSize: 14,
    fontWeight: '600',
  },
  zoneButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  zoneButtonSelected: {
    borderColor: '#0D5C63',
    backgroundColor: '#E8F4F5',
  },
  zoneName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A2E',
    marginBottom: 4,
  },
  zoneNameSelected: {
    color: '#0D5C63',
  },
  zoneDescription: {
    fontSize: 14,
    color: '#5A6C7D',
  },
  continueButton: {
    backgroundColor: '#0D5C63',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: '#B0C4C8',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});

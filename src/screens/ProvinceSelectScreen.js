// Province selection screen - first step before municipality selection
import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { useMunicipality } from '../contexts/MunicipalityContext';
import { useLanguage } from '../hooks/useLanguage';
import { useTheme } from '../contexts/ThemeContext';

// Province display names
const PROVINCE_NAMES = {
  en: {
    'QC': 'Québec',
    'BC': 'British Columbia',
    'ON': 'Ontario',
    'AB': 'Alberta',
    'MB': 'Manitoba',
    'SK': 'Saskatchewan',
    'NS': 'Nova Scotia',
    'NB': 'New Brunswick',
    'NL': 'Newfoundland and Labrador',
    'PE': 'Prince Edward Island',
    'NT': 'Northwest Territories',
    'YT': 'Yukon',
    'NU': 'Nunavut'
  },
  fr: {
    'QC': 'Québec',
    'BC': 'Colombie-Britannique',
    'ON': 'Ontario',
    'AB': 'Alberta',
    'MB': 'Manitoba',
    'SK': 'Saskatchewan',
    'NS': 'Nouvelle-Écosse',
    'NB': 'Nouveau-Brunswick',
    'NL': 'Terre-Neuve-et-Labrador',
    'PE': 'Île-du-Prince-Édouard',
    'NT': 'Territoires du Nord-Ouest',
    'YT': 'Yukon',
    'NU': 'Nunavut'
  }
};

export default function ProvinceSelectScreen({ onSelectProvince }) {
  const { municipalitiesList, loadMunicipalitiesList, loading } = useMunicipality();
  const { language } = useLanguage();
  const { colors: themeColors } = useTheme();
  const [availableProvinces, setAvailableProvinces] = useState([]);

  useEffect(() => {
    loadMunicipalitiesList();
  }, []);

  useEffect(() => {
    // Extract unique provinces from municipalities list
    const provinces = [...new Set(municipalitiesList.map(m => m.province))].filter(Boolean);

    // Sort provinces alphabetically by display name
    const names = PROVINCE_NAMES[language] || PROVINCE_NAMES.en;
    provinces.sort((a, b) => {
      const nameA = names[a] || a;
      const nameB = names[b] || b;
      return nameA.localeCompare(nameB);
    });

    setAvailableProvinces(provinces);
  }, [municipalitiesList, language]);

  const getProvinceName = (code) => {
    const names = PROVINCE_NAMES[language] || PROVINCE_NAMES.en;
    return names[code] || code;
  };

  const renderProvinceItem = ({ item: provinceCode }) => {
    return (
      <TouchableOpacity
        style={[styles.provinceItem, { backgroundColor: themeColors.card }]}
        onPress={() => onSelectProvince(provinceCode)}
        activeOpacity={0.7}
      >
        <View style={styles.provinceInfo}>
          <Text style={[styles.provinceName, { color: themeColors.text }]}>
            {getProvinceName(provinceCode)}
          </Text>
        </View>
        <Text style={[styles.chevron, { color: themeColors.border }]}>›</Text>
      </TouchableOpacity>
    );
  };

  if (loading && municipalitiesList.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0D5C63" />
          <Text style={[styles.loadingText, { color: themeColors.textSecondary }]}>
            {language === 'fr' ? 'Chargement...' : 'Loading...'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <View style={styles.header}>
        <Text style={styles.title}>CivicKey</Text>
        <Text style={styles.subtitle}>
          {language === 'fr'
            ? 'Sélectionnez votre province'
            : 'Select your province'}
        </Text>
      </View>

      <FlatList
        data={availableProvinces}
        renderItem={renderProvinceItem}
        keyExtractor={(item) => item}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {language === 'fr'
                ? 'Aucune province disponible'
                : 'No provinces available'}
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F0E8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#5A6C7D',
  },
  header: {
    backgroundColor: '#0D5C63',
    padding: 24,
    paddingTop: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 8,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  provinceItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  provinceInfo: {
    flex: 1,
  },
  provinceName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  chevron: {
    fontSize: 24,
    color: '#D1CBC3',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#5A6C7D',
    textAlign: 'center',
  },
});

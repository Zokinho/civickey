// First-launch screen for selecting municipality
import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  TextInput,
  Linking
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

export default function MunicipalitySelectScreen({ onComplete, selectedProvince, onBack }) {
  const {
    municipalitiesList,
    loadMunicipalitiesList,
    selectMunicipality,
    loading
  } = useMunicipality();
  const { language } = useLanguage();
  const { colors: themeColors } = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [filteredList, setFilteredList] = useState([]);
  const [provinceMunicipalities, setProvinceMunicipalities] = useState([]);

  const getProvinceName = (code) => {
    const names = PROVINCE_NAMES[language] || PROVINCE_NAMES.en;
    return names[code] || code;
  };

  // Helper to safely get localized text from object or string
  const getLocalizedText = (obj, fallback = '') => {
    if (!obj) return fallback;
    if (typeof obj === 'string') return obj;
    return obj[language] || obj.en || obj.fr || fallback;
  };

  // Get name string for searching/display
  const getNameString = (m) => {
    if (m.nameEn || m.nameFr) {
      return language === 'fr' ? (m.nameFr || m.nameEn || '') : (m.nameEn || m.nameFr || '');
    }
    return getLocalizedText(m.name, '');
  };

  useEffect(() => {
    loadMunicipalitiesList();
  }, []);

  // Filter municipalities by selected province
  useEffect(() => {
    if (selectedProvince) {
      const filtered = municipalitiesList.filter(m => m.province === selectedProvince);
      setProvinceMunicipalities(filtered);
    } else {
      setProvinceMunicipalities(municipalitiesList);
    }
  }, [municipalitiesList, selectedProvince]);

  // Apply search filter on top of province filter
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredList(provinceMunicipalities);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = provinceMunicipalities.filter(m => {
        const nameStr = getNameString(m).toLowerCase();
        return nameStr.includes(query) ||
          m.nameEn?.toLowerCase().includes(query) ||
          m.nameFr?.toLowerCase().includes(query);
      });
      setFilteredList(filtered);
    }
  }, [searchQuery, provinceMunicipalities]);

  const handleContactCity = () => {
    Linking.openURL('https://civickey.ca/#contact');
  };

  const handleSelect = async (municipalityId) => {
    await selectMunicipality(municipalityId);
    onComplete?.();
  };

  const renderMunicipalityItem = ({ item }) => {
    const primaryColor = item.colors?.primary || '#0D5C63';
    const displayName = getNameString(item);

    return (
      <TouchableOpacity
        style={[styles.municipalityItem, { backgroundColor: themeColors.card }]}
        onPress={() => handleSelect(item.id)}
        activeOpacity={0.7}
      >
        {item.logo ? (
          <Image source={{ uri: item.logo }} style={[styles.logo, { backgroundColor: themeColors.background }]} />
        ) : (
          <View style={[styles.logoPlaceholder, { backgroundColor: primaryColor }]}>
            <Text style={styles.logoPlaceholderText}>
              {(displayName || '?').charAt(0)}
            </Text>
          </View>
        )}
        <View style={styles.municipalityInfo}>
          <Text style={[styles.municipalityName, { color: themeColors.text }]}>
            {displayName}
          </Text>
          <Text style={[styles.municipalityProvince, { color: themeColors.textSecondary }]}>
            {item.province}
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
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>‹ {language === 'fr' ? 'Retour' : 'Back'}</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.title}>
          {selectedProvince ? getProvinceName(selectedProvince) : 'CivicKey'}
        </Text>
        <Text style={styles.subtitle}>
          {language === 'fr'
            ? 'Sélectionnez votre municipalité'
            : 'Select your municipality'}
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={[styles.searchInput, { backgroundColor: themeColors.inputBackground, borderColor: themeColors.border, color: themeColors.text }]}
          placeholder={language === 'fr' ? 'Rechercher...' : 'Search...'}
          placeholderTextColor={themeColors.placeholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCorrect={false}
        />
      </View>

      <FlatList
        data={filteredList}
        renderItem={renderMunicipalityItem}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            {searchQuery.trim() !== '' ? (
              <>
                <Text style={[styles.emptyTitle, { color: themeColors.text }]}>
                  {language === 'fr'
                    ? 'Ville non disponible'
                    : 'City not available'}
                </Text>
                <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
                  {language === 'fr'
                    ? 'CivicKey n\'est peut-être pas encore disponible dans votre ville. Contactez votre municipalité et faites-leur savoir que vous aimeriez voir CivicKey dans votre communauté!'
                    : 'CivicKey may not be available in your city yet. Contact your municipality and let them know you\'d like to see CivicKey in your community!'}
                </Text>
                <TouchableOpacity style={styles.contactButton} onPress={handleContactCity}>
                  <Text style={styles.contactButtonText}>
                    {language === 'fr' ? 'En savoir plus' : 'Learn More'}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
                {language === 'fr'
                  ? 'Aucune municipalité trouvée'
                  : 'No municipalities found'}
              </Text>
            )}
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
  backButton: {
    marginBottom: 8,
  },
  backButtonText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
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
  searchContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    borderWidth: 2,
    borderColor: '#E8E4DC',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  municipalityItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#F5F0E8',
  },
  logoPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#0D5C63',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoPlaceholderText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  municipalityInfo: {
    flex: 1,
    marginLeft: 16,
  },
  municipalityName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  municipalityProvince: {
    fontSize: 14,
    color: '#5A6C7D',
    marginTop: 2,
  },
  chevron: {
    fontSize: 24,
    color: '#D1CBC3',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A2E',
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#5A6C7D',
    textAlign: 'center',
    lineHeight: 24,
  },
  contactButton: {
    marginTop: 24,
    backgroundColor: '#0D5C63',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  contactButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useLanguage } from '../../hooks/useLanguage';
import { useTheme } from '../../contexts/ThemeContext';
import { useMunicipality } from '../../contexts/MunicipalityContext';

export default function WasteSearchBar({ onPress }) {
  const { t } = useLanguage();
  const { colors: themeColors } = useTheme();
  const { getThemeColors } = useMunicipality();
  const colors = getThemeColors();

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.icon}>?</Text>
      <Text style={[styles.placeholder, { color: themeColors.placeholder }]}>
        {t('search.placeholder')}
      </Text>
      <View style={[styles.badge, { backgroundColor: colors.primary }]}>
        <Text style={styles.badgeText}>{t('search.title')}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 4,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  icon: {
    fontSize: 18,
    marginRight: 10,
  },
  placeholder: {
    flex: 1,
    fontSize: 15,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
});

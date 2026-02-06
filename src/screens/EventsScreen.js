import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Linking } from 'react-native';

import { useLanguage } from '../hooks/useLanguage';
import { useEvents } from '../hooks/useEvents';
import { useMunicipality } from '../contexts/MunicipalityContext';
import { useTheme } from '../contexts/ThemeContext';
import OfflineBanner from '../components/OfflineBanner';

// Parse date string as local date (not UTC)
const parseLocalDate = (dateStr) => {
  if (!dateStr) return new Date();
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export default function EventsScreen() {
  const { language, t } = useLanguage();
  const { events } = useEvents();
  const { config, getThemeColors } = useMunicipality();
  const { colors: themeColors, isDark } = useTheme();

  // Get theme colors from municipality config
  const colors = getThemeColors();

  // Helper to safely get localized text
  const getLocalizedText = (obj, fallback = '') => {
    if (!obj) return fallback;
    if (typeof obj === 'string') return obj;
    return obj[language] || obj.en || obj.fr || fallback;
  };

  // Get municipality name from config (may be localized object or string)
  const municipalityName = getLocalizedText(config?.name, 'Municipality');

  const formatTime = (time, endTime) => {
    const format = (t) => {
      const [hours, minutes] = t.split(':');
      const h = parseInt(hours);
      const suffix = h >= 12 ? 'PM' : 'AM';
      const hour12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
      return `${hour12}:${minutes} ${suffix}`;
    };

    if (endTime) {
      return `${format(time)} - ${format(endTime)}`;
    }
    return format(time);
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'workshop': return '#8B5A2B';
      case 'community': return '#0D5C63';
      case 'family': return '#E07A5F';
      case 'municipal': return '#2E86AB';
      default: return '#5A6C7D';
    }
  };

  const openCityEvents = () => {
    const url = config?.contact?.website;
    if (url) Linking.openURL(url);
  };

  // Sort events by date and filter to upcoming only
  const now = new Date();
  const sortedEvents = [...events]
    .filter(e => new Date(e.date) >= now)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Text style={styles.title}>{t('events')}</Text>
        <Text style={styles.subtitle}>{municipalityName}</Text>
      </View>

      <OfflineBanner />

      <ScrollView style={styles.content}>
        {sortedEvents.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>{t('noUpcomingEvents')}</Text>
          </View>
        ) : (
          sortedEvents.map((event) => (
            <View key={event.id} style={[styles.card, { backgroundColor: themeColors.card }]}>
              <View style={[styles.dateBox, { backgroundColor: colors.primary }]}>
                <Text style={styles.dateMonth}>
                  {parseLocalDate(event.date).toLocaleDateString(language === 'fr' ? 'fr-CA' : 'en-CA', { month: 'short' }).toUpperCase()}
                </Text>
                <Text style={styles.dateDay}>
                  {parseLocalDate(event.date).getDate()}
                </Text>
                {event.multiDay && (
                  <Text style={styles.multiDay}>+</Text>
                )}
              </View>

              <View style={styles.cardContent}>
                <View style={styles.cardTop}>
                  <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(event.category) }]}>
                    <Text style={styles.categoryText}>{t(`categories.${event.category}`)}</Text>
                  </View>
                  {event.residents && (
                    <View style={[styles.residentBadge, { backgroundColor: isDark ? `${colors.primary}30` : `${colors.primary}15` }]}>
                      <Text style={[styles.residentText, { color: colors.primary }]}>{language === 'fr' ? 'Résidents' : 'Residents'}</Text>
                    </View>
                  )}
                </View>

                <Text style={[styles.eventTitle, { color: themeColors.text }]}>{getLocalizedText(event.title, '')}</Text>
                <Text style={[styles.eventDescription, { color: themeColors.textSecondary }]}>{getLocalizedText(event.description, '')}</Text>

                <View style={styles.eventMeta}>
                  <Text style={[styles.metaText, { color: themeColors.textSecondary }]}>🕐 {formatTime(event.time, event.endTime)}</Text>
                </View>
                <View style={styles.eventMeta}>
                  <Text style={[styles.metaText, { color: themeColors.textSecondary }]}>📍 {getLocalizedText(event.location, '')}</Text>
                </View>
                {event.ageGroup && (
                  <View style={styles.eventMeta}>
                    <Text style={[styles.metaText, { color: themeColors.textSecondary }]}>👥 {language === 'fr' ? 'Âges' : 'Ages'}: {event.ageGroup}</Text>
                  </View>
                )}
                {event.maxParticipants && (
                  <View style={styles.eventMeta}>
                    <Text style={[styles.metaText, { color: themeColors.textSecondary }]}>⚠️ Max {event.maxParticipants} {language === 'fr' ? 'participants' : 'participants'}</Text>
                  </View>
                )}
              </View>
            </View>
          ))
        )}

        <TouchableOpacity style={styles.linkButton} onPress={openCityEvents}>
          <Text style={[styles.linkButtonText, { color: colors.primary }]}>{t('viewAllEvents')} →</Text>
        </TouchableOpacity>

        <Text style={[styles.source, { color: themeColors.textMuted }]}>{t('source')}: {config?.contact?.website || 'Municipality Website'}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F0E8',
  },
  header: {
    backgroundColor: '#0D5C63',
    padding: 24,
    paddingTop: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#5A6C7D',
    fontStyle: 'italic',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  dateBox: {
    backgroundColor: '#0D5C63',
    width: 60,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateMonth: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    fontWeight: '600',
  },
  dateDay: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  multiDay: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: 'bold',
  },
  cardContent: {
    flex: 1,
    padding: 12,
  },
  cardTop: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  categoryText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  residentBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#E8F4F5',
  },
  residentText: {
    color: '#0D5C63',
    fontSize: 10,
    fontWeight: '600',
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A2E',
    marginBottom: 4,
  },
  eventDescription: {
    fontSize: 13,
    color: '#5A6C7D',
    lineHeight: 18,
    marginBottom: 10,
  },
  eventMeta: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  metaText: {
    fontSize: 12,
    color: '#5A6C7D',
  },
  linkButton: {
    padding: 16,
    alignItems: 'center',
  },
  linkButtonText: {
    color: '#0D5C63',
    fontSize: 14,
    fontWeight: '600',
  },
  source: {
    fontSize: 11,
    color: '#5A6C7D',
    textAlign: 'center',
    marginBottom: 32,
  },
});

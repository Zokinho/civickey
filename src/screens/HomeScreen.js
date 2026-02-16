import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert, ScrollView, Modal, Image } from 'react-native';
import { useState, useCallback, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { requestPermissions, scheduleCollectionReminder } from '../utils/notifications';
import { useLanguage } from '../hooks/useLanguage';
import { useAnnouncements } from '../hooks/useAnnouncements';
import { useRoadClosures } from '../hooks/useRoadClosures';
import { useMunicipality } from '../contexts/MunicipalityContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAppRating } from '../hooks/useAppRating';
import OfflineBanner from '../components/OfflineBanner';

const NOTIFICATIONS_SETUP_KEY = '@civickey_notifications_setup';

// Parse date string as local date (not UTC)
const parseLocalDate = (dateStr) => {
  if (!dateStr) return new Date();
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const DAYS = {
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  fr: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
};

export default function HomeScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedClosure, setSelectedClosure] = useState(null);
  const [closureModalVisible, setClosureModalVisible] = useState(false);
  const { language, t } = useLanguage();
  const { announcements, refresh: refreshAnnouncements } = useAnnouncements();
  const { closures } = useRoadClosures();
  const { zoneId, zones, schedule, events, config, getZoneSchedule, getThemeColors, getUpcomingSpecialCollections } = useMunicipality();
  const { colors: themeColors, isDark } = useTheme();
  const { requestReview } = useAppRating();
  const insets = useSafeAreaInsets();

  // Check if we should prompt for app review
  useEffect(() => {
    requestReview();
  }, []);

  // Get theme colors from municipality config
  const colors = getThemeColors();

  // Get the schedule for current zone
  const zoneSchedule = getZoneSchedule();
  const collectionTypes = schedule?.collectionTypes || [];

  // Helper to safely get localized text
  const getLocalizedText = (obj, fallback = '') => {
    if (!obj) return fallback;
    if (typeof obj === 'string') return obj;
    return obj[language] || obj.en || obj.fr || fallback;
  };

  // Check notification status when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      checkNotificationStatus();
    }, [])
  );

  const checkNotificationStatus = async () => {
    const setup = await AsyncStorage.getItem(NOTIFICATIONS_SETUP_KEY);
    setNotificationsEnabled(setup === 'true');
  };

  const setupNotifications = async () => {
    const granted = await requestPermissions();

    if (!granted) {
      Alert.alert(
        t('permissionsRequired'),
        t('permissionsMessage')
      );
      return;
    }

    if (zoneSchedule) {
      for (const type of collectionTypes) {
        const typeSchedule = zoneSchedule[type.id];
        if (typeSchedule) {
          await scheduleCollectionReminder({
            type: type.id,
            dayOfWeek: typeSchedule.dayOfWeek,
            color: type.color,
            name: type.name,
          });
        }
      }
    }

    await AsyncStorage.setItem(NOTIFICATIONS_SETUP_KEY, 'true');
    setNotificationsEnabled(true);

    Alert.alert(
      t('notificationsEnabled'),
      t('notificationsEnabledMessage')
    );
  };

  const getNextCollectionDate = (dayOfWeek, frequency, startDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find the next occurrence of this day of week
    let nextDate = new Date(today);
    const todayDay = today.getDay();
    let daysUntil = dayOfWeek - todayDay;
    if (daysUntil < 0) daysUntil += 7;
    nextDate.setDate(today.getDate() + daysUntil);

    // For biweekly, check if this is a collection week
    if (frequency === 'biweekly' && startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);

      // Calculate weeks difference from start date
      const msPerWeek = 7 * 24 * 60 * 60 * 1000;
      const weeksDiff = Math.floor((nextDate - start) / msPerWeek);

      // If not a collection week, add 7 days
      if (weeksDiff % 2 !== 0) {
        nextDate.setDate(nextDate.getDate() + 7);
      }
    }

    // For monthly, find first biweekly-aligned occurrence of dayOfWeek in current/next month
    if (frequency === 'monthly' && startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const msPerWeek = 7 * 24 * 60 * 60 * 1000;

      for (let monthOffset = 0; monthOffset <= 1; monthOffset++) {
        const monthStart = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
        let diff = dayOfWeek - monthStart.getDay();
        if (diff < 0) diff += 7;
        const firstOccurrence = new Date(monthStart);
        firstOccurrence.setDate(1 + diff);
        const weeksDiff = Math.round((firstOccurrence - start) / msPerWeek);
        if (weeksDiff % 2 !== 0) {
          firstOccurrence.setDate(firstOccurrence.getDate() + 7);
        }
        if (firstOccurrence >= today) {
          nextDate = firstOccurrence;
          break;
        }
      }
    }

    return nextDate;
  };

  const getNextCollectionLabel = (dayOfWeek, frequency, startDate) => {
    const nextDate = getNextCollectionDate(dayOfWeek, frequency, startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffDays = Math.round((nextDate - today) / (24 * 60 * 60 * 1000));

    if (diffDays === 0) return t('today');
    if (diffDays === 1) return t('tomorrow');
    return DAYS[language][nextDate.getDay()];
  };

  // Format date label for special collections
  const formatSpecialCollectionDate = (dateStr) => {
    const date = parseLocalDate(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.round((date - today) / (24 * 60 * 60 * 1000));

    if (diffDays === 0) return t('today');
    if (diffDays === 1) return t('tomorrow');
    return date.toLocaleDateString(language === 'fr' ? 'fr-CA' : 'en-CA', { month: 'short', day: 'numeric' });
  };

  // Get name for special collection
  const getSpecialCollectionName = (sc) => {
    if (sc.collectionTypeId) {
      const type = collectionTypes.find(t => t.id === sc.collectionTypeId);
      return type ? getLocalizedText(type.name, sc.collectionTypeId) : sc.collectionTypeId;
    }
    return getLocalizedText(sc.customName, '');
  };

  // Get color for special collection
  const getSpecialCollectionColor = (sc) => {
    if (sc.collectionTypeId) {
      const type = collectionTypes.find(t => t.id === sc.collectionTypeId);
      return type?.color || '#888888';
    }
    return sc.customColor || '#888888';
  };

  // Combine regular and special collections for display
  const getCombinedUpcomingCollections = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const items = [];

    // Add regular collections
    if (zoneSchedule) {
      collectionTypes.forEach(type => {
        const typeSchedule = zoneSchedule[type.id];
        if (typeSchedule) {
          // Resolve piggybackOn: use referenced collection's dayOfWeek/startDate
          let effectiveDayOfWeek = typeSchedule.dayOfWeek;
          let effectiveStartDate = typeSchedule.startDate;
          if (typeSchedule.frequency === 'monthly' && typeSchedule.piggybackOn) {
            const ref = zoneSchedule[typeSchedule.piggybackOn];
            if (ref) {
              effectiveDayOfWeek = ref.dayOfWeek;
              effectiveStartDate = ref.startDate;
            }
          }

          const nextDate = getNextCollectionDate(effectiveDayOfWeek, typeSchedule.frequency, effectiveStartDate);
          items.push({
            type: 'regular',
            data: type,
            schedule: typeSchedule,
            effectiveDayOfWeek,
            effectiveStartDate,
            date: nextDate,
            sortDate: nextDate.getTime()
          });
        }
      });
    }

    // Add special collections
    const upcomingSpecial = getUpcomingSpecialCollections();
    upcomingSpecial.forEach(sc => {
      const scDate = parseLocalDate(sc.date);
      items.push({
        type: 'special',
        data: sc,
        date: scDate,
        sortDate: scDate.getTime()
      });
    });

    // Sort by date and return top 3
    return items.sort((a, b) => a.sortDate - b.sortDate).slice(0, 3);
  };

  const combinedCollections = getCombinedUpcomingCollections();

  const openDetails = (type) => {
    setSelectedType(type);
    setModalVisible(true);
  };

  const getZoneLabel = () => {
    const zone = zones?.find(z => z.id === zoneId);
    if (zone) {
      return language === 'fr' ? (zone.nameFr || zone.nameEn || zoneId) : (zone.nameEn || zone.nameFr || zoneId);
    }
    // Fallback for legacy 'east'/'west' zones
    return zoneId === 'east' ? t('eastSector') : t('westSector');
  };

  // Get municipality name from config (may be localized object or string)
  const municipalityName = getLocalizedText(config?.name, 'Municipality');

  // Get next upcoming event
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const eventsList = events || [];
  const nextEvent = eventsList
    .filter(e => parseLocalDate(e.date) >= now)
    .sort((a, b) => parseLocalDate(a.date) - parseLocalDate(b.date))[0];

  // Get daily tip
  const tips = [
    { en: "Rinse containers before recycling - no need for perfect cleaning!", fr: "Rincez les contenants avant de recycler - pas besoin d'être parfait!" },
    { en: "Flatten cardboard boxes to save space in your blue bin.", fr: "Aplatissez les boîtes en carton pour économiser de l'espace dans votre bac bleu." },
    { en: "Coffee grounds and filters can go in your brown bin!", fr: "Le marc de café et les filtres vont dans votre bac brun!" },
    { en: "No plastic bags in the compost - even 'compostable' ones!", fr: "Pas de sacs de plastique dans le compost - même les 'compostables'!" },
    { en: "Electronics don't go in the garbage - check for drop-off locations.", fr: "Les électroniques ne vont pas aux ordures - vérifiez les points de dépôt." },
  ];
  const dailyTip = tips[new Date().getDay() % tips.length];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Text style={styles.title}>{t('appName')}</Text>
        <Text style={styles.subtitle}>{municipalityName} • {getZoneLabel()}</Text>
      </View>

      <OfflineBanner />

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {!notificationsEnabled && (
          <TouchableOpacity style={styles.notifBanner} onPress={setupNotifications}>
            <Text style={styles.notifBannerText}>{t('enableReminders')}</Text>
          </TouchableOpacity>
        )}

        {/* Announcements from Firebase */}
        {announcements.length > 0 && announcements.map((announcement) => (
          <View
            key={announcement.id}
            style={[
              styles.announcementBox,
              announcement.type === 'warning' && styles.announcementWarning,
              announcement.type === 'alert' && styles.announcementAlert,
              announcement.type === 'success' && styles.announcementSuccess,
            ]}
          >
            <Text style={styles.announcementTitle}>
              {announcement.title?.[language] || announcement.title?.en}
            </Text>
            <Text style={styles.announcementMessage}>
              {announcement.message?.[language] || announcement.message?.en}
            </Text>
          </View>
        ))}

        {/* Road Closures Section */}
        {closures.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
              {language === 'fr' ? 'Fermetures de routes' : 'Road Closures'}
            </Text>
            {closures.slice(0, 3).map((closure) => (
              <TouchableOpacity
                key={closure.id}
                style={[
                  styles.closureCard,
                  { backgroundColor: themeColors.card },
                  closure.severity === 'full-closure' && styles.closureSevere,
                  closure.severity === 'partial' && styles.closurePartial,
                  closure.severity === 'detour' && styles.closureDetour,
                ]}
                onPress={() => {
                  setSelectedClosure(closure);
                  setClosureModalVisible(true);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.closureIcon}>
                  <Text style={styles.closureIconText}>
                    {closure.severity === 'full-closure' ? '🚫' : closure.severity === 'partial' ? '🚧' : '↪️'}
                  </Text>
                </View>
                <View style={styles.closureContent}>
                  <Text style={[styles.closureTitle, { color: themeColors.text }]}>
                    {closure.title?.[language] || closure.title?.en || closure.title?.fr || ''}
                  </Text>
                  <Text style={[styles.closureLocation, { color: themeColors.textSecondary }]}>📍 {closure.location}</Text>
                  <Text style={[styles.closureDates, { color: themeColors.textMuted }]}>
                    {closure.startDate} - {closure.endDate || (language === 'fr' ? 'En cours' : 'Ongoing')}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}

        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>{t('upcomingCollections')}</Text>

        {combinedCollections.map((item, index) => {
          if (item.type === 'regular') {
            const type = item.data;
            const typeSchedule = item.schedule;
            return (
              <TouchableOpacity
                key={`regular-${type.id}`}
                style={[styles.card, { borderLeftColor: type.color, backgroundColor: themeColors.card }]}
                onPress={() => openDetails(type)}
                activeOpacity={0.7}
              >
                <View style={styles.cardContent}>
                  <Text style={[styles.cardTitle, { color: themeColors.text }]}>{getLocalizedText(type.name, type.id)}</Text>
                  {getLocalizedText(type.binName, '') ? (
                    <Text style={[styles.cardDay, { color: themeColors.textSecondary }]}>{getLocalizedText(type.binName, '')}</Text>
                  ) : null}
                </View>
                <View style={[styles.badge, { backgroundColor: type.color }]}>
                  <Text style={styles.badgeText}>
                    {getNextCollectionLabel(item.effectiveDayOfWeek, typeSchedule.frequency, item.effectiveStartDate)}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          } else {
            // Special collection
            const sc = item.data;
            const scColor = getSpecialCollectionColor(sc);
            return (
              <View
                key={`special-${sc.id}`}
                style={[styles.specialCard, { borderColor: scColor, backgroundColor: themeColors.card }]}
              >
                <View style={styles.cardContent}>
                  <View style={styles.specialTitleRow}>
                    <Text style={styles.specialBadgeIcon}>⭐</Text>
                    <Text style={[styles.cardTitle, { color: themeColors.text }]}>{getSpecialCollectionName(sc)}</Text>
                  </View>
                  {sc.location ? (
                    <Text style={[styles.cardDay, { color: themeColors.textSecondary }]}>📍 {sc.location}</Text>
                  ) : sc.description?.[language] || sc.description?.en ? (
                    <Text style={[styles.cardDay, { color: themeColors.textSecondary }]} numberOfLines={1}>
                      {getLocalizedText(sc.description, '')}
                    </Text>
                  ) : null}
                </View>
                <View style={styles.specialBadgeContainer}>
                  <View style={[styles.badge, { backgroundColor: scColor }]}>
                    <Text style={styles.badgeText}>{formatSpecialCollectionDate(sc.date)}</Text>
                  </View>
                  {sc.time && (
                    <Text style={[styles.specialTime, { color: themeColors.textMuted }]}>
                      {sc.time}{sc.endTime ? ` - ${sc.endTime}` : ''}
                    </Text>
                  )}
                </View>
              </View>
            );
          }
        })}

        {nextEvent && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 24, color: themeColors.text }]}>
              {language === 'fr' ? 'Prochain événement' : 'Next Event'}
            </Text>
            <View style={[styles.eventCard, { backgroundColor: themeColors.card }]}>
              <View style={[styles.eventDate, { backgroundColor: colors.primary }]}>
                <Text style={styles.eventMonth}>
                  {parseLocalDate(nextEvent.date).toLocaleDateString(language === 'fr' ? 'fr-CA' : 'en-CA', { month: 'short' }).toUpperCase()}
                </Text>
                <Text style={styles.eventDay}>
                  {parseLocalDate(nextEvent.date).getDate()}
                </Text>
              </View>
              <View style={styles.eventContent}>
                <Text style={[styles.eventTitle, { color: themeColors.text }]}>{getLocalizedText(nextEvent.title, '')}</Text>
                <Text style={[styles.eventLocation, { color: themeColors.textSecondary }]}>📍 {nextEvent.location}</Text>
              </View>
            </View>
          </>
        )}

        <View style={[styles.tipBox, isDark && { backgroundColor: '#3D3A30' }]}>
          <Text style={[styles.tipLabel, isDark && { color: '#D4A574' }]}>💡 {language === 'fr' ? 'Conseil du jour' : 'Daily Tip'}</Text>
          <Text style={[styles.tipText, isDark && { color: '#C4B4A4' }]}>{dailyTip[language]}</Text>
        </View>

        {notificationsEnabled && (
          <View style={[styles.statusBox, { backgroundColor: `${colors.primary}15` }]}>
            <Text style={[styles.statusText, { color: colors.primary }]}>{t('remindersEnabled')}</Text>
          </View>
        )}
      </ScrollView>

      {/* Details Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: themeColors.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.surface }]}>
            {selectedType && (
              <>
                <View style={[styles.modalHeader, { backgroundColor: selectedType.color }]}>
                  <Text style={styles.modalTitle}>{getLocalizedText(selectedType.binName, '')}</Text>
                  <Text style={styles.modalSubtitle}>{getLocalizedText(selectedType.name, '')} • {selectedType.binSize || ''}</Text>
                </View>

                <ScrollView style={styles.modalBody}>
                  {getLocalizedText(selectedType.tip) ? (
                    <View style={styles.modalTipBox}>
                      <Text style={styles.modalTipText}>💡 {getLocalizedText(selectedType.tip)}</Text>
                    </View>
                  ) : null}

                  {(getLocalizedText(selectedType.accepted, []) || []).length > 0 && (
                    <>
                      <Text style={styles.sectionLabel}>✓ {t('accepted')}</Text>
                      {(getLocalizedText(selectedType.accepted, []) || []).map((item, index) => {
                        const isBullet = item.startsWith('- ') || item.startsWith('-');
                        return (
                          <Text key={index} style={[isBullet ? styles.acceptedItem : styles.acceptedIntro, { color: themeColors.text }]}>
                            {isBullet ? `• ${item.replace(/^-\s*/, '')}` : item}
                          </Text>
                        );
                      })}
                    </>
                  )}

                  {(getLocalizedText(selectedType.notAccepted, []) || []).length > 0 && (
                    <>
                      <Text style={[styles.sectionLabel, { color: themeColors.error, marginTop: 20 }]}>✗ {t('notAccepted')}</Text>
                      {(getLocalizedText(selectedType.notAccepted, []) || []).map((item, index) => {
                        const isBullet = item.startsWith('- ') || item.startsWith('-');
                        return (
                          <Text key={index} style={[isBullet ? styles.notAcceptedItem : styles.acceptedIntro, { color: themeColors.textSecondary }]}>
                            {isBullet ? `• ${item.replace(/^-\s*/, '')}` : item}
                          </Text>
                        );
                      })}
                    </>
                  )}
                </ScrollView>

                <TouchableOpacity
                  style={[styles.closeButton, { backgroundColor: colors.primary, marginBottom: 20 + insets.bottom }]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.closeButtonText}>{t('close')}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Road Closure Details Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={closureModalVisible}
        onRequestClose={() => setClosureModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: themeColors.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.surface }]}>
            {selectedClosure && (
              <>
                <View style={[
                  styles.closureModalHeader,
                  selectedClosure.severity === 'full-closure' && { backgroundColor: '#E07A5F' },
                  selectedClosure.severity === 'partial' && { backgroundColor: '#D4A017' },
                  selectedClosure.severity === 'detour' && { backgroundColor: '#0D5C63' },
                ]}>
                  <Text style={styles.modalTitle}>
                    {selectedClosure.title?.[language] || selectedClosure.title?.en || selectedClosure.title?.fr || ''}
                  </Text>
                  <Text style={styles.modalSubtitle}>
                    {selectedClosure.severity === 'full-closure'
                      ? (language === 'fr' ? 'Fermeture complète' : 'Full Closure')
                      : selectedClosure.severity === 'partial'
                        ? (language === 'fr' ? 'Fermeture partielle' : 'Partial Closure')
                        : (language === 'fr' ? 'Détour' : 'Detour')}
                  </Text>
                </View>

                <ScrollView style={styles.modalBody}>
                  <View style={styles.closureDetailRow}>
                    <Text style={[styles.closureDetailLabel, { color: themeColors.textSecondary }]}>📍 {language === 'fr' ? 'Emplacement' : 'Location'}</Text>
                    <Text style={[styles.closureDetailText, { color: themeColors.text }]}>{selectedClosure.location}</Text>
                  </View>

                  <View style={styles.closureDetailRow}>
                    <Text style={[styles.closureDetailLabel, { color: themeColors.textSecondary }]}>📅 {language === 'fr' ? 'Dates' : 'Dates'}</Text>
                    <Text style={[styles.closureDetailText, { color: themeColors.text }]}>
                      {selectedClosure.startDate} - {selectedClosure.endDate || (language === 'fr' ? 'En cours' : 'Ongoing')}
                    </Text>
                  </View>

                  {(selectedClosure.description?.[language] || selectedClosure.description?.en || selectedClosure.description?.fr) && (
                    <View style={styles.closureDetailRow}>
                      <Text style={[styles.closureDetailLabel, { color: themeColors.textSecondary }]}>📝 {language === 'fr' ? 'Description' : 'Description'}</Text>
                      <Text style={[styles.closureDetailText, { color: themeColors.text }]}>
                        {selectedClosure.description?.[language] || selectedClosure.description?.en || selectedClosure.description?.fr}
                      </Text>
                    </View>
                  )}

                  {selectedClosure.imageUrl && (
                    <View style={styles.closureImageContainer}>
                      <Text style={[styles.closureDetailLabel, { color: themeColors.textSecondary }]}>🗺️ {language === 'fr' ? 'Carte' : 'Map'}</Text>
                      <Image
                        source={{ uri: selectedClosure.imageUrl }}
                        style={styles.closureImage}
                        resizeMode="contain"
                      />
                    </View>
                  )}
                </ScrollView>

                <TouchableOpacity
                  style={[styles.closeButton, { backgroundColor: colors.primary, marginBottom: 20 + insets.bottom }]}
                  onPress={() => setClosureModalVisible(false)}
                >
                  <Text style={styles.closeButtonText}>{t('close')}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
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
    fontSize: 28,
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
  contentContainer: {
    paddingBottom: 70,
  },
  notifBanner: {
    backgroundColor: '#E07A5F',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  notifBannerText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  announcementBox: {
    backgroundColor: '#0D5C63',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    marginTop: 4,
  },
  announcementWarning: {
    backgroundColor: '#D4A017',
  },
  announcementAlert: {
    backgroundColor: '#E07A5F',
  },
  announcementSuccess: {
    backgroundColor: '#27AE60',
  },
  announcementTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  announcementMessage: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A2E',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  cardDay: {
    fontSize: 14,
    color: '#5A6C7D',
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  // Special collection card styles
  specialCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  specialTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  specialBadgeIcon: {
    fontSize: 14,
  },
  specialBadgeContainer: {
    alignItems: 'flex-end',
  },
  specialTime: {
    fontSize: 11,
    marginTop: 4,
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 16,
  },
  eventDate: {
    backgroundColor: '#0D5C63',
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
  },
  eventMonth: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    fontWeight: '600',
  },
  eventDay: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  eventContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A2E',
    marginBottom: 4,
  },
  eventLocation: {
    fontSize: 12,
    color: '#5A6C7D',
  },
  tipBox: {
    backgroundColor: '#FEF3E7',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  tipLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8B5A2B',
    marginBottom: 6,
  },
  tipText: {
    fontSize: 14,
    color: '#5A4A3A',
    lineHeight: 20,
  },
  statusBox: {
    backgroundColor: '#E8F4F5',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  statusText: {
    color: '#0D5C63',
    fontSize: 14,
    textAlign: 'center',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    padding: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  modalBody: {
    padding: 20,
    maxHeight: 400,
  },
  modalTipBox: {
    backgroundColor: '#FEF3E7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  modalTipText: {
    fontSize: 13,
    color: '#8B5A2B',
    lineHeight: 18,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#27AE60',
    marginBottom: 12,
  },
  acceptedItem: {
    fontSize: 14,
    color: '#1A1A2E',
    marginBottom: 6,
    paddingLeft: 8,
  },
  acceptedIntro: {
    fontSize: 14,
    color: '#1A1A2E',
    marginBottom: 8,
    lineHeight: 20,
  },
  notAcceptedItem: {
    fontSize: 14,
    color: '#5A6C7D',
    marginBottom: 6,
    paddingLeft: 8,
  },
  closeButton: {
    backgroundColor: '#0D5C63',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Road Closure styles
  closureCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderLeftWidth: 4,
    borderLeftColor: '#D4A017',
  },
  closureSevere: {
    borderLeftColor: '#E07A5F',
  },
  closurePartial: {
    borderLeftColor: '#D4A017',
  },
  closureDetour: {
    borderLeftColor: '#0D5C63',
  },
  closureIcon: {
    marginRight: 12,
  },
  closureIconText: {
    fontSize: 24,
  },
  closureContent: {
    flex: 1,
  },
  closureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A2E',
    marginBottom: 4,
  },
  closureLocation: {
    fontSize: 13,
    color: '#5A6C7D',
    marginBottom: 2,
  },
  closureDates: {
    fontSize: 12,
    color: '#8B8B8B',
  },
  closureModalHeader: {
    padding: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#D4A017',
  },
  closureDetailRow: {
    marginBottom: 16,
  },
  closureDetailLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5A6C7D',
    marginBottom: 4,
  },
  closureDetailText: {
    fontSize: 15,
    color: '#1A1A2E',
    lineHeight: 22,
  },
  closureImageContainer: {
    marginTop: 8,
  },
  closureImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginTop: 8,
    backgroundColor: '#F0F0F0',
  },
});

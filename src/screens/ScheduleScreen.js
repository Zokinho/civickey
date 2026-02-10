import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Modal, Linking } from 'react-native';
import { useState } from 'react';

import { useLanguage } from '../hooks/useLanguage';
import { useMunicipality } from '../contexts/MunicipalityContext';
import { useTheme } from '../contexts/ThemeContext';
import OfflineBanner from '../components/OfflineBanner';
import WasteSearchBar from '../components/waste-search/WasteSearchBar';
import WasteSearchOverlay from '../components/waste-search/WasteSearchOverlay';
import { useWasteItems } from '../hooks/useWasteItems';

const DAYS = {
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  fr: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
};

export default function ScheduleScreen() {
  const [selectedType, setSelectedType] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const { language, t } = useLanguage();
  const { zoneId, zones, schedule, config, getZoneSchedule, getThemeColors, getUpcomingSpecialCollections } = useMunicipality();
  const { colors: themeColors, isDark } = useTheme();

  // Get theme colors from municipality config
  const colors = getThemeColors();

  // Get the schedule for current zone
  const zoneSchedule = getZoneSchedule();
  const collectionTypes = schedule?.collectionTypes || [];
  const guidelines = schedule?.guidelines || {};
  const { items: wasteItems, searchItems } = useWasteItems();

  // Helper to safely get localized text
  const getLocalizedText = (obj, fallback = '') => {
    if (!obj) return fallback;
    if (typeof obj === 'string') return obj;
    return obj[language] || obj.en || obj.fr || fallback;
  };

  const getNextDate = (dayOfWeek, frequency, startDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let nextDate = new Date(today);
    const todayDay = today.getDay();
    let daysUntil = dayOfWeek - todayDay;
    if (daysUntil < 0) daysUntil += 7;
    nextDate.setDate(today.getDate() + daysUntil);

    // For biweekly, check if this is a collection week
    if (frequency === 'biweekly' && startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);

      const msPerWeek = 7 * 24 * 60 * 60 * 1000;
      const weeksDiff = Math.floor((nextDate - start) / msPerWeek);

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

    return nextDate.toLocaleDateString(language === 'fr' ? 'fr-CA' : 'en-CA', {
      month: 'short',
      day: 'numeric'
    });
  };

  // Parse date string as local date
  const parseLocalDate = (dateStr) => {
    if (!dateStr) return new Date();
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
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

  // Get upcoming special collections
  const upcomingSpecialCollections = getUpcomingSpecialCollections();

  const openDetails = (type) => {
    setSelectedType(type);
    setModalVisible(true);
  };

  const openCityWebsite = () => {
    const url = config?.contact?.website;
    if (url) Linking.openURL(url);
  };

  const openSectorMap = () => {
    const url = schedule?.zoneMapUrl;
    if (url) Linking.openURL(url);
  };

  const getZoneLabel = () => {
    const zone = zones?.find(z => z.id === zoneId);
    if (zone) {
      return language === 'fr' ? (zone.nameFr || zone.nameEn || zoneId) : (zone.nameEn || zone.nameFr || zoneId);
    }
    // Fallback for legacy 'east'/'west' zones
    return zoneId === 'east' ? t('eastSector') : t('westSector');
  };

  // Get website URL from municipality config
  const websiteUrl = config?.contact?.website || 'https://www.ville.saint-lazare.qc.ca';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Text style={styles.title}>{t('collectionSchedule')}</Text>
        <Text style={styles.subtitle}>{getZoneLabel()}</Text>
      </View>

      <OfflineBanner />

      {wasteItems.length > 0 && (
        <WasteSearchBar onPress={() => setSearchVisible(true)} />
      )}

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Text style={[styles.hint, { color: themeColors.textSecondary }]}>{t('tapForDetails')}</Text>

        {zoneSchedule && collectionTypes.map((type) => {
          const typeSchedule = zoneSchedule[type.id];
          if (!typeSchedule) return null;

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

          const frequencyText = typeSchedule.frequency === 'monthly'
            ? (language === 'fr' ? 'Mensuel' : 'Monthly')
            : typeSchedule.frequency === 'biweekly'
              ? (language === 'fr' ? 'Aux 2 semaines' : 'Every 2 weeks')
              : (language === 'fr' ? 'Chaque semaine' : 'Weekly');

          return (
            <TouchableOpacity
              key={type.id}
              style={[styles.card, { backgroundColor: themeColors.card }]}
              onPress={() => openDetails(type)}
              activeOpacity={0.7}
            >
              <View style={[styles.colorBar, { backgroundColor: type.color }]} />
              <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <Text style={[styles.cardTitle, { color: themeColors.text }]}>{getLocalizedText(type.name, type.id)}</Text>
                  {getLocalizedText(type.binName, '') ? (
                    <Text style={[styles.binName, { color: themeColors.textSecondary, backgroundColor: themeColors.background }]}>{getLocalizedText(type.binName, '')}</Text>
                  ) : null}
                </View>
                {type.binSize ? (
                  <Text style={[styles.cardSubtitle, { color: themeColors.textSecondary }]}>{type.binSize}</Text>
                ) : null}
                <View style={styles.scheduleInfo}>
                  <Text style={[styles.dayLabel, { color: themeColors.text }]}>{DAYS[language][effectiveDayOfWeek]}s • {frequencyText}</Text>
                  <Text style={[styles.nextDate, { color: colors.primary }]}>{t('next')}: {getNextDate(effectiveDayOfWeek, typeSchedule.frequency, effectiveStartDate)}</Text>
                </View>
              </View>
              <Text style={[styles.chevron, { color: themeColors.border }]}>›</Text>
            </TouchableOpacity>
          );
        })}

{zones?.length > 1 && schedule?.zoneMapUrl && (
          <TouchableOpacity style={[styles.mapButton, { backgroundColor: colors.primary }]} onPress={openSectorMap}>
            <Text style={styles.mapButtonText}>{t('viewSectorMap')}</Text>
          </TouchableOpacity>
        )}

        {/* Special Collections Section */}
        {upcomingSpecialCollections.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 24, color: themeColors.text }]}>
              {t('specialCollections')}
            </Text>
            <Text style={[styles.specialHint, { color: themeColors.textSecondary }]}>
              {t('oneTimeEvent')}
            </Text>
            {upcomingSpecialCollections.map((sc) => {
              const scColor = getSpecialCollectionColor(sc);
              const scDate = parseLocalDate(sc.date);
              return (
                <View
                  key={sc.id}
                  style={[styles.specialCard, { borderColor: scColor, backgroundColor: themeColors.card }]}
                >
                  <View style={[styles.specialDateBadge, { backgroundColor: scColor }]}>
                    <Text style={styles.specialDateMonth}>
                      {scDate.toLocaleDateString(language === 'fr' ? 'fr-CA' : 'en-CA', { month: 'short' }).toUpperCase()}
                    </Text>
                    <Text style={styles.specialDateDay}>{scDate.getDate()}</Text>
                  </View>
                  <View style={styles.specialContent}>
                    <View style={styles.specialHeader}>
                      <Text style={[styles.specialTitle, { color: themeColors.text }]}>
                        ⭐ {getSpecialCollectionName(sc)}
                      </Text>
                    </View>
                    {sc.time && (
                      <Text style={[styles.specialInfo, { color: themeColors.textSecondary }]}>
                        🕐 {sc.time}{sc.endTime ? ` - ${sc.endTime}` : ''}
                      </Text>
                    )}
                    {sc.location && (
                      <Text style={[styles.specialInfo, { color: themeColors.textSecondary }]}>
                        📍 {sc.location}
                      </Text>
                    )}
                    {(sc.description?.[language] || sc.description?.en) && (
                      <Text style={[styles.specialDescription, { color: themeColors.textMuted }]} numberOfLines={2}>
                        {getLocalizedText(sc.description, '')}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </>
        )}

        {getLocalizedText(guidelines.timing, '') && (getLocalizedText(guidelines.position, []) || []).length > 0 && (
          <View style={[styles.infoBox, { backgroundColor: isDark ? `${colors.primary}30` : `${colors.primary}15` }]}>
            <Text style={[styles.infoTitle, { color: colors.primary }]}>{t('binPlacement')}</Text>
            <Text style={[styles.infoText, { color: themeColors.text }]}>{getLocalizedText(guidelines.timing, '')}</Text>
            {(getLocalizedText(guidelines.position, []) || []).map((item, index) => (
              <Text key={index} style={[styles.infoItem, { color: themeColors.textSecondary }]}>• {item}</Text>
            ))}
          </View>
        )}

        <TouchableOpacity style={styles.linkButton} onPress={openCityWebsite}>
          <Text style={[styles.linkButtonText, { color: colors.primary }]}>{t('viewOnCityWebsite')} →</Text>
        </TouchableOpacity>

        <Text style={[styles.source, { color: themeColors.textMuted }]}>{t('source')}: {config?.contact?.website?.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '') || t('municipalityWebsite')}</Text>
      </ScrollView>

      <WasteSearchOverlay
        visible={searchVisible}
        onClose={() => setSearchVisible(false)}
        searchItems={searchItems}
        collectionTypes={collectionTypes}
      />

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
                    <View style={styles.tipBox}>
                      <Text style={styles.tipText}>💡 {getLocalizedText(selectedType.tip)}</Text>
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
                  style={[styles.closeButton, { backgroundColor: colors.primary }]}
                  onPress={() => setModalVisible(false)}
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
  contentContainer: {
    paddingBottom: 70,
  },
  hint: {
    fontSize: 13,
    color: '#5A6C7D',
    textAlign: 'center',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorBar: {
    width: 6,
    alignSelf: 'stretch',
  },
  cardContent: {
    flex: 1,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  binName: {
    fontSize: 12,
    color: '#5A6C7D',
    backgroundColor: '#F5F0E8',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#5A6C7D',
    marginTop: 2,
  },
  scheduleInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  dayLabel: {
    fontSize: 14,
    color: '#1A1A2E',
  },
  nextDate: {
    fontSize: 14,
    color: '#0D5C63',
    fontWeight: '600',
  },
  chevron: {
    fontSize: 24,
    color: '#D1CBC3',
    paddingRight: 16,
  },
  mapButton: {
    backgroundColor: '#0D5C63',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  mapButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  infoBox: {
    backgroundColor: '#E8F4F5',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0D5C63',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#1A1A2E',
    marginBottom: 12,
    lineHeight: 18,
  },
  infoItem: {
    fontSize: 12,
    color: '#5A6C7D',
    marginBottom: 4,
  },
  linkButton: {
    marginTop: 16,
    padding: 12,
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
    marginTop: 8,
    marginBottom: 32,
  },
  // Special Collections styles
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  specialHint: {
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  specialCard: {
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  specialDateBadge: {
    width: 60,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  specialDateMonth: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    fontWeight: '600',
  },
  specialDateDay: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  specialContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  specialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  specialTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  specialInfo: {
    fontSize: 13,
    marginBottom: 2,
  },
  specialDescription: {
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
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
  tipBox: {
    backgroundColor: '#FEF3E7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  tipText: {
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
  acceptedIntro: {
    fontSize: 14,
    marginBottom: 10,
    lineHeight: 20,
  },
  acceptedItem: {
    fontSize: 14,
    color: '#1A1A2E',
    marginBottom: 6,
    paddingLeft: 8,
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
});

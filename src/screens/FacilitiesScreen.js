import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Modal, Linking } from 'react-native';
import { useState } from 'react';

import { useLanguage } from '../hooks/useLanguage';
import { useMunicipality } from '../contexts/MunicipalityContext';
import { useTheme } from '../contexts/ThemeContext';
import OfflineBanner from '../components/OfflineBanner';

const DAYS = {
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  fr: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
};

const SHORT_DAYS = {
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  fr: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
};

export default function FacilitiesScreen() {
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const { language, t } = useLanguage();
  const { facilities, config, getThemeColors } = useMunicipality();
  const { colors: themeColors, isDark } = useTheme();

  // Get theme colors from municipality config
  const colors = getThemeColors();

  // Helper to safely get localized text
  const getLocalizedText = (obj, fallback = '') => {
    if (!obj) return fallback;
    if (typeof obj === 'string') return obj;
    return obj[language] || obj.en || obj.fr || fallback;
  };

  // Get municipality name from config
  const municipalityName = getLocalizedText(config?.name, 'Municipality');

  // Format time from 24h to 12h format
  const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const suffix = h >= 12 ? 'PM' : 'AM';
    const hour12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${hour12}:${minutes} ${suffix}`;
  };

  // Get current day of week (0 = Sunday)
  const today = new Date().getDay();

  // Check if facility is currently open
  const isOpen = (facility) => {
    const todayHours = facility.hours?.[today];
    if (!todayHours || todayHours.closed) return false;

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const [openH, openM] = todayHours.open.split(':').map(Number);
    const [closeH, closeM] = todayHours.close.split(':').map(Number);
    const openMinutes = openH * 60 + openM;
    const closeMinutes = closeH * 60 + closeM;

    return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
  };

  // Get today's hours string
  const getTodayHours = (facility) => {
    const todayHours = facility.hours?.[today];
    if (!todayHours || todayHours.closed) {
      return t('closed');
    }
    return `${formatTime(todayHours.open)} - ${formatTime(todayHours.close)}`;
  };

  // Get status details
  const getStatus = (facility) => {
    const todayHours = facility.hours?.[today];
    if (!todayHours || todayHours.closed) {
      // Find next open day
      for (let i = 1; i <= 7; i++) {
        const nextDay = (today + i) % 7;
        const nextHours = facility.hours?.[nextDay];
        if (nextHours && !nextHours.closed) {
          return {
            isOpen: false,
            text: `${t('opensAt')} ${formatTime(nextHours.open)} ${SHORT_DAYS[language][nextDay]}`,
            color: themeColors.textSecondary
          };
        }
      }
      return { isOpen: false, text: t('closedNow'), color: themeColors.error };
    }

    const open = isOpen(facility);
    if (open) {
      return { isOpen: true, text: t('openNow'), color: '#27AE60' };
    } else {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const [openH, openM] = todayHours.open.split(':').map(Number);
      const openMinutes = openH * 60 + openM;

      if (currentMinutes < openMinutes) {
        return {
          isOpen: false,
          text: `${t('opensAt')} ${formatTime(todayHours.open)}`,
          color: themeColors.textSecondary
        };
      }
      return { isOpen: false, text: t('closedNow'), color: themeColors.error };
    }
  };

  const openDetails = (facility) => {
    setSelectedFacility(facility);
    setModalVisible(true);
  };

  const handleCall = (phone) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleWebsite = (url) => {
    Linking.openURL(url);
  };

  const handleAddress = (address) => {
    const encoded = encodeURIComponent(address);
    Linking.openURL(`https://maps.google.com/?q=${encoded}`);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Text style={styles.title}>{t('facilities')}</Text>
        <Text style={styles.subtitle}>{municipalityName}</Text>
      </View>

      <OfflineBanner />

      <ScrollView style={styles.content}>
        {facilities.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>{t('noFacilities')}</Text>
          </View>
        ) : (
          facilities.map((facility) => {
            const status = getStatus(facility);
            return (
              <TouchableOpacity
                key={facility.id}
                style={[styles.card, { backgroundColor: themeColors.card }]}
                onPress={() => openDetails(facility)}
                activeOpacity={0.7}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.cardTitleRow}>
                    <Text style={[styles.facilityIcon]}>{facility.icon || '🏛️'}</Text>
                    <Text style={[styles.facilityName, { color: themeColors.text }]}>
                      {getLocalizedText(facility.name, '')}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: status.isOpen ? '#E8F5E9' : (isDark ? '#3D2C2C' : '#FFEBEE') }]}>
                    <Text style={[styles.statusText, { color: status.color }]}>{status.text}</Text>
                  </View>
                </View>

                <View style={styles.cardBody}>
                  <Text style={[styles.hoursLabel, { color: themeColors.textSecondary }]}>
                    {t('todayHours')}:
                  </Text>
                  <Text style={[styles.hoursText, { color: themeColors.text }]}>
                    {getTodayHours(facility)}
                  </Text>
                </View>

                {facility.address && (
                  <Text style={[styles.addressText, { color: themeColors.textSecondary }]}>
                    {facility.address}
                  </Text>
                )}

                <Text style={[styles.chevron, { color: themeColors.border }]}>›</Text>
              </TouchableOpacity>
            );
          })
        )}

        <Text style={[styles.source, { color: themeColors.textMuted }]}>
          {t('source')}: {config?.contact?.website || 'Municipality Website'}
        </Text>
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
            {selectedFacility && (
              <>
                <View style={[styles.modalHeader, { backgroundColor: colors.primary }]}>
                  <Text style={styles.modalIcon}>{selectedFacility.icon || '🏛️'}</Text>
                  <Text style={styles.modalTitle}>{getLocalizedText(selectedFacility.name, '')}</Text>
                  {selectedFacility.description && (
                    <Text style={styles.modalSubtitle}>{getLocalizedText(selectedFacility.description, '')}</Text>
                  )}
                </View>

                <ScrollView style={styles.modalBody}>
                  {/* Weekly Hours */}
                  <Text style={[styles.sectionLabel, { color: themeColors.text }]}>{t('weeklyHours')}</Text>
                  <View style={[styles.hoursTable, { backgroundColor: isDark ? themeColors.card : '#F8F8F8' }]}>
                    {DAYS[language].map((day, index) => {
                      const dayHours = selectedFacility.hours?.[index];
                      const isToday = index === today;
                      return (
                        <View
                          key={index}
                          style={[
                            styles.hoursRow,
                            isToday && { backgroundColor: isDark ? `${colors.primary}30` : `${colors.primary}15` }
                          ]}
                        >
                          <Text style={[
                            styles.dayName,
                            { color: themeColors.text },
                            isToday && { fontWeight: '700', color: colors.primary }
                          ]}>
                            {day}
                          </Text>
                          <Text style={[
                            styles.dayHours,
                            { color: themeColors.textSecondary },
                            isToday && { fontWeight: '600', color: colors.primary }
                          ]}>
                            {dayHours && !dayHours.closed
                              ? `${formatTime(dayHours.open)} - ${formatTime(dayHours.close)}`
                              : t('closed')}
                          </Text>
                        </View>
                      );
                    })}
                  </View>

                  {/* Contact Info */}
                  {(selectedFacility.phone || selectedFacility.address || selectedFacility.website) && (
                    <View style={styles.contactSection}>
                      {selectedFacility.phone && (
                        <TouchableOpacity
                          style={[styles.contactButton, { backgroundColor: isDark ? themeColors.card : '#F0F0F0' }]}
                          onPress={() => handleCall(selectedFacility.phone)}
                        >
                          <Text style={styles.contactIcon}>📞</Text>
                          <Text style={[styles.contactText, { color: colors.primary }]}>{selectedFacility.phone}</Text>
                        </TouchableOpacity>
                      )}

                      {selectedFacility.address && (
                        <TouchableOpacity
                          style={[styles.contactButton, { backgroundColor: isDark ? themeColors.card : '#F0F0F0' }]}
                          onPress={() => handleAddress(selectedFacility.address)}
                        >
                          <Text style={styles.contactIcon}>📍</Text>
                          <Text style={[styles.contactText, { color: colors.primary }]}>{selectedFacility.address}</Text>
                        </TouchableOpacity>
                      )}

                      {selectedFacility.website && (
                        <TouchableOpacity
                          style={[styles.contactButton, { backgroundColor: isDark ? themeColors.card : '#F0F0F0' }]}
                          onPress={() => handleWebsite(selectedFacility.website)}
                        >
                          <Text style={styles.contactIcon}>🌐</Text>
                          <Text style={[styles.contactText, { color: colors.primary }]}>{t('website')}</Text>
                        </TouchableOpacity>
                      )}
                    </View>
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
    padding: 16,
    marginBottom: 12,
    position: 'relative',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  facilityIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  facilityName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A2E',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  hoursLabel: {
    fontSize: 13,
    color: '#5A6C7D',
    marginRight: 6,
  },
  hoursText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A2E',
  },
  addressText: {
    fontSize: 13,
    color: '#5A6C7D',
  },
  chevron: {
    position: 'absolute',
    right: 16,
    top: '50%',
    fontSize: 24,
    color: '#D1CBC3',
  },
  source: {
    fontSize: 11,
    color: '#5A6C7D',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 32,
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
    alignItems: 'center',
  },
  modalIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
    textAlign: 'center',
  },
  modalBody: {
    padding: 20,
    maxHeight: 400,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A2E',
    marginBottom: 12,
  },
  hoursTable: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  dayName: {
    fontSize: 14,
    color: '#1A1A2E',
  },
  dayHours: {
    fontSize: 14,
    color: '#5A6C7D',
  },
  contactSection: {
    gap: 10,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#F0F0F0',
  },
  contactIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  contactText: {
    fontSize: 15,
    color: '#0D5C63',
    fontWeight: '500',
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

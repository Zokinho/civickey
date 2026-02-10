import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert, Modal, ScrollView, Linking } from 'react-native';
import { useEffect, useState } from 'react';

import { useLanguage } from '../hooks/useLanguage';
import { getNotificationPrefs, setNotificationPrefs, sendTestNotification } from '../utils/notifications';
import { useMunicipality } from '../contexts/MunicipalityContext';
import { useTheme } from '../contexts/ThemeContext';

const EVENING_TIMES = [
  { hour: 19, label: '7:00 PM' },
  { hour: 20, label: '8:00 PM' },
  { hour: 21, label: '9:00 PM' },
  { hour: 22, label: '10:00 PM' },
];

const MORNING_TIMES = [
  { hour: 5, label: '5:00 AM' },
  { hour: 6, label: '6:00 AM' },
  { hour: 7, label: '7:00 AM' },
];

export default function SettingsScreen({ navigation, onReset }) {
  const [reminderTime, setReminderTime] = useState({ hour: 19, minute: 0 });
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [themeModalVisible, setThemeModalVisible] = useState(false);
  const { language, changeLanguage, t } = useLanguage();
  const { zoneId, zones, config, selectZone, clearSelection, refreshMunicipalityData, getThemeColors } = useMunicipality();
  const { themePreference, setTheme, colors: themeColors, isDark } = useTheme();

  // Get municipality theme colors
  const colors = getThemeColors();

  const getThemeLabel = () => {
    if (themePreference === 'system') {
      return language === 'fr' ? 'Système' : 'System';
    } else if (themePreference === 'dark') {
      return language === 'fr' ? 'Sombre' : 'Dark';
    }
    return language === 'fr' ? 'Clair' : 'Light';
  };

  const handleChangeTheme = () => {
    setThemeModalVisible(true);
  };

  const selectTheme = (theme) => {
    setTheme(theme);
    setThemeModalVisible(false);
  };

  // Helper to safely get localized text
  const getLocalizedText = (obj, fallback = '') => {
    if (!obj) return fallback;
    if (typeof obj === 'string') return obj;
    return obj[language] || obj.en || obj.fr || fallback;
  };

  // Get municipality name from config (may be localized object or string)
  const municipalityName = getLocalizedText(config?.name, 'Municipality');

  useEffect(() => {
    loadReminderTime();
  }, []);

  const loadReminderTime = async () => {
    const prefs = await getNotificationPrefs();
    setReminderTime(prefs);
  };

  const handleChangeZone = () => {
    Alert.alert(
      t('changeZone'),
      t('selectNewZone'),
      zones.map((zone) => ({
        text: language === 'fr'
          ? (zone.nameFr || zone.nameEn || getLocalizedText(zone.name, ''))
          : (zone.nameEn || zone.nameFr || getLocalizedText(zone.name, '')),
        onPress: async () => {
          await selectZone(zone.id);
        },
      })).concat([{ text: t('cancel'), style: 'cancel' }])
    );
  };

  const handleChangeLanguage = () => {
    setLanguageModalVisible(true);
  };

  const selectLanguage = (lang) => {
    changeLanguage(lang);
    setLanguageModalVisible(false);
  };

  const handleChangeReminderTime = () => {
    setTimePickerVisible(true);
  };

  const selectTime = async (hour) => {
    const newPrefs = { hour, minute: 0 };
    await setNotificationPrefs(newPrefs);
    setReminderTime(newPrefs);
    setTimePickerVisible(false);
  };

  const formatTime = (hour) => {
    const suffix = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour;
    return `${displayHour}:00 ${suffix}`;
  };

  const handleTestNotification = async () => {
    const result = await sendTestNotification();
    if (result.success) {
      Alert.alert(
        language === 'fr' ? 'Programmé!' : 'Scheduled!',
        language === 'fr'
          ? 'Notification dans 30 secondes. Minimisez l\'app maintenant.'
          : 'Notification arriving in 30 seconds. Minimize the app now.'
      );
    } else {
      Alert.alert(
        language === 'fr' ? 'Échec' : 'Failed',
        `${language === 'fr' ? 'Raison' : 'Reason'}: ${result.reason}`
      );
    }
  };

  const handleClearData = () => {
    Alert.alert(
      t('clearAllData'),
      t('clearConfirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('clear'),
          style: 'destructive',
          onPress: async () => {
            await clearSelection();
            onReset();
          },
        },
      ]
    );
  };

  const getZoneName = (zoneId) => {
    if (zoneId === 'east') {
      return language === 'fr' ? 'Secteur Est' : 'East Sector';
    }
    return language === 'fr' ? 'Secteur Ouest' : 'West Sector';
  };

  const handleRefreshData = async () => {
    setRefreshing(true);
    try {
      await refreshMunicipalityData();
      Alert.alert(
        language === 'fr' ? 'Succès' : 'Success',
        language === 'fr' ? 'Données mises à jour!' : 'Data refreshed!'
      );
    } catch (error) {
      Alert.alert(
        language === 'fr' ? 'Erreur' : 'Error',
        language === 'fr' ? 'Impossible de rafraîchir les données' : 'Failed to refresh data'
      );
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Text style={styles.title}>{t('settings')}</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Only show zone selection if municipality has multiple zones */}
        {zones && zones.length > 1 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: themeColors.textSecondary }]}>{t('yourZone')}</Text>
            <TouchableOpacity style={[styles.settingRow, { backgroundColor: themeColors.card }]} onPress={handleChangeZone}>
              <Text style={[styles.settingLabel, { color: themeColors.text }]}>{t('currentZone')}</Text>
              <Text style={[styles.settingValue, { color: themeColors.textSecondary }]}>{getZoneName(zoneId)} →</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.textSecondary }]}>{language === 'fr' ? 'Apparence' : 'Appearance'}</Text>
          <TouchableOpacity style={[styles.settingRow, { backgroundColor: themeColors.card }]} onPress={handleChangeTheme}>
            <Text style={[styles.settingLabel, { color: themeColors.text }]}>{language === 'fr' ? 'Thème' : 'Theme'}</Text>
            <Text style={[styles.settingValue, { color: themeColors.textSecondary }]}>{getThemeLabel()} →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.textSecondary }]}>Language / Langue</Text>
          <TouchableOpacity style={[styles.settingRow, { backgroundColor: themeColors.card }]} onPress={handleChangeLanguage}>
            <Text style={[styles.settingLabel, { color: themeColors.text }]}>{language === 'en' ? 'English' : 'Français'}</Text>
            <Text style={[styles.settingValue, { color: themeColors.textSecondary }]}>→</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.textSecondary }]}>{t('notifications')}</Text>
          <TouchableOpacity style={[styles.settingRow, { backgroundColor: themeColors.card }]} onPress={handleChangeReminderTime}>
            <Text style={[styles.settingLabel, { color: themeColors.text }]}>{t('reminderTime')}</Text>
            <Text style={[styles.settingValue, { color: themeColors.textSecondary }]}>{formatTime(reminderTime.hour)} →</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.testLink} onPress={handleTestNotification}>
            <Text style={[styles.testLinkText, { color: colors.primary }]}>
              {language === 'fr' ? 'Tester les notifications' : 'Test notifications'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.textSecondary }]}>{t('about')}</Text>
          <View style={[styles.settingRow, { backgroundColor: themeColors.card }]}>
            <Text style={[styles.settingLabel, { color: themeColors.text }]}>{t('version')}</Text>
            <Text style={[styles.settingValue, { color: themeColors.textSecondary }]}>1.0.0</Text>
          </View>
          <View style={[styles.settingRow, { backgroundColor: themeColors.card }]}>
            <Text style={[styles.settingLabel, { color: themeColors.text }]}>{t('municipality')}</Text>
            <Text style={[styles.settingValue, { color: themeColors.textSecondary }]}>{municipalityName}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.textSecondary }]}>{t('legal')}</Text>
          <TouchableOpacity
            style={[styles.settingRow, { backgroundColor: themeColors.card }]}
            onPress={() => Linking.openURL('https://civickey.ca/privacy')}
          >
            <Text style={[styles.settingLabel, { color: themeColors.text }]}>{t('privacyPolicy')}</Text>
            <Text style={[styles.settingValue, { color: themeColors.textSecondary }]}>→</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.settingRow, { backgroundColor: themeColors.card }]}
            onPress={() => Linking.openURL('https://civickey.ca/terms')}
          >
            <Text style={[styles.settingLabel, { color: themeColors.text }]}>{t('termsOfService')}</Text>
            <Text style={[styles.settingValue, { color: themeColors.textSecondary }]}>→</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.textSecondary }]}>{t('support')}</Text>
          <TouchableOpacity
            style={[styles.settingRow, { backgroundColor: themeColors.card }]}
            onPress={() => Linking.openURL('mailto:team@civickey.ca')}
          >
            <Text style={[styles.settingLabel, { color: themeColors.text }]}>{t('contactSupport')}</Text>
            <Text style={[styles.settingValue, { color: themeColors.textSecondary }]}>team@civickey.ca →</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.refreshButton, { backgroundColor: colors.primary }]}
          onPress={handleRefreshData}
          disabled={refreshing}
        >
          <Text style={styles.refreshButtonText}>
            {refreshing
              ? (language === 'fr' ? 'Chargement...' : 'Loading...')
              : (language === 'fr' ? 'Rafraîchir les données' : 'Refresh Data')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.dangerButton} onPress={handleClearData}>
          <Text style={styles.dangerButtonText}>{t('resetApp')}</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={timePickerVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setTimePickerVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: themeColors.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: themeColors.border }]}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>{t('setReminderTime')}</Text>
              <TouchableOpacity onPress={() => setTimePickerVisible(false)}>
                <Text style={[styles.modalClose, { color: themeColors.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.timeList}>
              <Text style={[styles.timeGroupTitle, { color: themeColors.textSecondary }]}>{t('eveningBefore')}</Text>
              {EVENING_TIMES.map((time) => (
                <TouchableOpacity
                  key={time.hour}
                  style={[
                    styles.timeOption,
                    { backgroundColor: themeColors.card },
                    reminderTime.hour === time.hour && [styles.timeOptionSelected, { backgroundColor: colors.primary }],
                  ]}
                  onPress={() => selectTime(time.hour)}
                >
                  <Text
                    style={[
                      styles.timeOptionText,
                      { color: themeColors.text },
                      reminderTime.hour === time.hour && styles.timeOptionTextSelected,
                    ]}
                  >
                    {time.label}
                  </Text>
                  {reminderTime.hour === time.hour && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}

              <Text style={[styles.timeGroupTitle, { marginTop: 20, color: themeColors.textSecondary }]}>{t('morningOf')}</Text>
              {MORNING_TIMES.map((time) => (
                <TouchableOpacity
                  key={time.hour}
                  style={[
                    styles.timeOption,
                    { backgroundColor: themeColors.card },
                    reminderTime.hour === time.hour && [styles.timeOptionSelected, { backgroundColor: colors.primary }],
                  ]}
                  onPress={() => selectTime(time.hour)}
                >
                  <Text
                    style={[
                      styles.timeOptionText,
                      { color: themeColors.text },
                      reminderTime.hour === time.hour && styles.timeOptionTextSelected,
                    ]}
                  >
                    {time.label}
                  </Text>
                  {reminderTime.hour === time.hour && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Language Selection Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={languageModalVisible}
        onRequestClose={() => setLanguageModalVisible(false)}
      >
        <View style={[styles.pickerOverlay, { backgroundColor: themeColors.overlay }]}>
          <View style={[styles.pickerContent, { backgroundColor: themeColors.surface }]}>
            <Text style={[styles.pickerTitle, { color: themeColors.text }]}>Language / Langue</Text>
            <TouchableOpacity
              style={[
                styles.optionButton,
                { backgroundColor: themeColors.card },
                language === 'en' && [styles.optionButtonSelected, { backgroundColor: colors.primary }],
              ]}
              onPress={() => selectLanguage('en')}
            >
              <Text style={[styles.optionButtonText, { color: themeColors.text }, language === 'en' && styles.optionButtonTextSelected]}>
                English
              </Text>
              {language === 'en' && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.optionButton,
                { backgroundColor: themeColors.card },
                language === 'fr' && [styles.optionButtonSelected, { backgroundColor: colors.primary }],
              ]}
              onPress={() => selectLanguage('fr')}
            >
              <Text style={[styles.optionButtonText, { color: themeColors.text }, language === 'fr' && styles.optionButtonTextSelected]}>
                Français
              </Text>
              {language === 'fr' && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: themeColors.border }]}
              onPress={() => setLanguageModalVisible(false)}
            >
              <Text style={[styles.cancelButtonText, { color: themeColors.textSecondary }]}>{t('cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Theme Selection Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={themeModalVisible}
        onRequestClose={() => setThemeModalVisible(false)}
      >
        <View style={[styles.pickerOverlay, { backgroundColor: themeColors.overlay }]}>
          <View style={[styles.pickerContent, { backgroundColor: themeColors.surface }]}>
            <Text style={[styles.pickerTitle, { color: themeColors.text }]}>{language === 'fr' ? 'Apparence' : 'Appearance'}</Text>
            <TouchableOpacity
              style={[
                styles.optionButton,
                { backgroundColor: themeColors.card },
                themePreference === 'light' && [styles.optionButtonSelected, { backgroundColor: colors.primary }],
              ]}
              onPress={() => selectTheme('light')}
            >
              <Text style={[styles.optionButtonText, { color: themeColors.text }, themePreference === 'light' && styles.optionButtonTextSelected]}>
                {language === 'fr' ? 'Clair' : 'Light'}
              </Text>
              {themePreference === 'light' && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.optionButton,
                { backgroundColor: themeColors.card },
                themePreference === 'dark' && [styles.optionButtonSelected, { backgroundColor: colors.primary }],
              ]}
              onPress={() => selectTheme('dark')}
            >
              <Text style={[styles.optionButtonText, { color: themeColors.text }, themePreference === 'dark' && styles.optionButtonTextSelected]}>
                {language === 'fr' ? 'Sombre' : 'Dark'}
              </Text>
              {themePreference === 'dark' && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.optionButton,
                { backgroundColor: themeColors.card },
                themePreference === 'system' && [styles.optionButtonSelected, { backgroundColor: colors.primary }],
              ]}
              onPress={() => selectTheme('system')}
            >
              <Text style={[styles.optionButtonText, { color: themeColors.text }, themePreference === 'system' && styles.optionButtonTextSelected]}>
                {language === 'fr' ? 'Système' : 'System'}
              </Text>
              {themePreference === 'system' && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: themeColors.border }]}
              onPress={() => setThemeModalVisible(false)}
            >
              <Text style={[styles.cancelButtonText, { color: themeColors.textSecondary }]}>{t('cancel')}</Text>
            </TouchableOpacity>
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
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5A6C7D',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  settingRow: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  settingLabel: {
    fontSize: 16,
    color: '#1A1A2E',
  },
  settingValue: {
    fontSize: 16,
    color: '#5A6C7D',
  },
  testLink: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  testLinkText: {
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  refreshButton: {
    backgroundColor: '#0D5C63',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  refreshButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  dangerButton: {
    backgroundColor: '#E07A5F',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 32,
  },
  dangerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E4DC',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  modalClose: {
    fontSize: 20,
    color: '#5A6C7D',
    padding: 4,
  },
  timeList: {
    padding: 20,
  },
  timeGroupTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5A6C7D',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  timeOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F5F0E8',
    borderRadius: 12,
    marginBottom: 8,
  },
  timeOptionSelected: {
    backgroundColor: '#0D5C63',
  },
  timeOptionText: {
    fontSize: 16,
    color: '#1A1A2E',
  },
  timeOptionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pickerContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 320,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A2E',
    textAlign: 'center',
    marginBottom: 20,
  },
  optionButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: '#F5F5F5',
  },
  optionButtonSelected: {
    backgroundColor: '#0D5C63',
  },
  optionButtonText: {
    fontSize: 16,
    color: '#1A1A2E',
  },
  optionButtonTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  cancelButton: {
    padding: 16,
    borderRadius: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#5A6C7D',
  },
});

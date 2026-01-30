import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert, Modal, ScrollView, Linking } from 'react-native';
import { useEffect, useState } from 'react';

import { useLanguage } from '../hooks/useLanguage';
import { getNotificationPrefs, setNotificationPrefs } from '../utils/notifications';
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
    Alert.alert(
      language === 'fr' ? 'Apparence' : 'Appearance',
      '',
      [
        {
          text: language === 'fr' ? 'Clair' : 'Light',
          onPress: () => setTheme('light')
        },
        {
          text: language === 'fr' ? 'Sombre' : 'Dark',
          onPress: () => setTheme('dark')
        },
        {
          text: language === 'fr' ? 'Système' : 'System',
          onPress: () => setTheme('system')
        },
        { text: t('cancel'), style: 'cancel' },
      ]
    );
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
    Alert.alert(
      'Language / Langue',
      '',
      [
        { text: 'English', onPress: () => changeLanguage('en') },
        { text: 'Français', onPress: () => changeLanguage('fr') },
        { text: t('cancel'), style: 'cancel' },
      ]
    );
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
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.textSecondary }]}>{t('yourZone')}</Text>
          <TouchableOpacity style={[styles.settingRow, { backgroundColor: themeColors.card }]} onPress={handleChangeZone}>
            <Text style={[styles.settingLabel, { color: themeColors.text }]}>{t('currentZone')}</Text>
            <Text style={[styles.settingValue, { color: themeColors.textSecondary }]}>{getZoneName(zoneId)} →</Text>
          </TouchableOpacity>
        </View>

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
});

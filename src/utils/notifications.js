import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIFICATION_PREFS_KEY = '@civickey_notification_prefs';
const LANGUAGE_KEY = '@civickey_language';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Get current language from storage
async function getLanguage() {
  const lang = await AsyncStorage.getItem(LANGUAGE_KEY);
  return lang || 'en';
}

// Bilingual notification content
const notificationStrings = {
  en: {
    collectionTomorrow: (type) => `${type} tomorrow`,
    putOutBin: (bin) => `Put out your ${bin.toLowerCase()} tonight.`,
    testTitle: 'Test Notification',
    testBody: 'Notifications are working correctly!',
    specialCollectionTomorrow: (name) => `Special: ${name} tomorrow`,
    specialCollectionBody: (name, location) => location
      ? `Don't miss the ${name.toLowerCase()} event at ${location}.`
      : `Don't miss the ${name.toLowerCase()} event tomorrow.`,
  },
  fr: {
    collectionTomorrow: (type) => `${type} demain`,
    putOutBin: (bin) => `Sortez votre ${bin.toLowerCase()} ce soir.`,
    testTitle: 'Notification test',
    testBody: 'Les notifications fonctionnent correctement!',
    specialCollectionTomorrow: (name) => `Spécial: ${name} demain`,
    specialCollectionBody: (name, location) => location
      ? `Ne manquez pas l'événement ${name.toLowerCase()} à ${location}.`
      : `Ne manquez pas l'événement ${name.toLowerCase()} demain.`,
  },
};

export async function requestPermissions() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === 'granted';
}

export async function scheduleCollectionReminder({ type, dayOfWeek, color, name }) {
  // Cancel existing notifications for this type
  await cancelNotificationsForType(type);

  // Get user preferences and language
  const prefs = await getNotificationPrefs();
  const language = await getLanguage();
  const strings = notificationStrings[language] || notificationStrings.en;

  // Calculate trigger
  // dayOfWeek: 0=Sun, 1=Mon, etc.
  // We want to notify the night before, so subtract 1 (wrap around)
  const notifyDayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  const trigger = {
    type: 'weekly',
    weekday: notifyDayOfWeek + 1, // Expo uses 1-7 (Sun=1)
    hour: prefs.hour || 19,
    minute: prefs.minute || 0,
  };

  const typeName = name[language] || name.en;

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: strings.collectionTomorrow(typeName),
      body: strings.putOutBin(typeName),
      data: { type, dayOfWeek, language },
    },
    trigger,
  });

  // Store the notification ID so we can cancel it later
  await storeNotificationId(type, notificationId);

  return notificationId;
}

export async function scheduleSpecialCollectionReminder({ id, name, date, location }) {
  // Cancel existing notification for this special collection
  await cancelNotificationsForType(`special_${id}`);

  // Get user preferences and language
  const prefs = await getNotificationPrefs();
  const language = await getLanguage();
  const strings = notificationStrings[language] || notificationStrings.en;

  // Parse the date and schedule for the evening before
  const [year, month, day] = date.split('-').map(Number);
  const collectionDate = new Date(year, month - 1, day);

  // Schedule for the day before
  const notifyDate = new Date(collectionDate);
  notifyDate.setDate(notifyDate.getDate() - 1);
  notifyDate.setHours(prefs.hour || 19, prefs.minute || 0, 0, 0);

  // Don't schedule if the notify date is in the past
  if (notifyDate <= new Date()) {
    return null;
  }

  const localizedName = name[language] || name.en || name;

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: strings.specialCollectionTomorrow(localizedName),
      body: strings.specialCollectionBody(localizedName, location),
      data: { type: 'special', specialId: id, language },
    },
    trigger: {
      type: 'date',
      date: notifyDate,
    },
  });

  // Store the notification ID so we can cancel it later
  await storeNotificationId(`special_${id}`, notificationId);

  return notificationId;
}

export async function sendTestNotification() {
  try {
    const granted = await requestPermissions();

    if (!granted) {
      return { success: false, reason: 'permissions_denied' };
    }

    const language = await getLanguage();
    const strings = notificationStrings[language] || notificationStrings.en;

    // Schedule notification for 30 seconds from now
    const notifId = await Notifications.scheduleNotificationAsync({
      content: {
        title: strings.testTitle,
        body: strings.testBody,
        sound: true,
        data: { test: true },
      },
      trigger: {
        type: 'timeInterval',
        seconds: 30,
      },
    });

    return { success: true, id: notifId };
  } catch (error) {
    return { success: false, reason: error.message };
  }
}

export async function cancelNotificationsForType(type) {
  const stored = await AsyncStorage.getItem(`@civickey_notif_${type}`);
  if (stored) {
    await Notifications.cancelScheduledNotificationAsync(stored);
  }
}

export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

async function storeNotificationId(type, id) {
  await AsyncStorage.setItem(`@civickey_notif_${type}`, id);
}

export async function getNotificationPrefs() {
  const prefs = await AsyncStorage.getItem(NOTIFICATION_PREFS_KEY);
  return prefs ? JSON.parse(prefs) : { hour: 19, minute: 0 };
}

export async function setNotificationPrefs(prefs) {
  await AsyncStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(prefs));
}

export async function getScheduledNotifications() {
  return await Notifications.getAllScheduledNotificationsAsync();
}

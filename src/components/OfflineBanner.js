// Banner component shown when app is offline
import { View, Text, StyleSheet } from 'react-native';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useLanguage } from '../hooks/useLanguage';

export default function OfflineBanner() {
  const { isOffline } = useNetworkStatus();
  const { language } = useLanguage();

  if (!isOffline) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>
        {language === 'fr'
          ? '📡 Mode hors ligne - Affichage des données en cache'
          : '📡 Offline - Showing cached data'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#5A6C7D',
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
});

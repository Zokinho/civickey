import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Modal, Image, RefreshControl } from 'react-native';
import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useLanguage } from '../hooks/useLanguage';
import { useRoadClosures } from '../hooks/useRoadClosures';
import { useMunicipality } from '../contexts/MunicipalityContext';

export default function RoadClosuresScreen() {
  const [selectedClosure, setSelectedClosure] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { language, t } = useLanguage();
  const { closures, loading, refresh } = useRoadClosures();
  const { getThemeColors } = useMunicipality();

  const insets = useSafeAreaInsets();
  const colors = getThemeColors();

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const openDetails = (closure) => {
    setSelectedClosure(closure);
    setModalVisible(true);
  };

  const getSeverityLabel = (severity) => {
    const labels = {
      'full-closure': language === 'fr' ? 'Fermeture complète' : 'Full Closure',
      'partial': language === 'fr' ? 'Fermeture partielle' : 'Partial Closure',
      'detour': language === 'fr' ? 'Détour' : 'Detour',
    };
    return labels[severity] || severity;
  };

  const getSeverityIcon = (severity) => {
    const icons = {
      'full-closure': '🚫',
      'partial': '🚧',
      'detour': '↪️',
    };
    return icons[severity] || '🚧';
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Text style={styles.title}>
          {language === 'fr' ? 'Fermetures de routes' : 'Road Closures'}
        </Text>
        <Text style={styles.subtitle}>
          {language === 'fr' ? 'Travaux et blocages routiers' : 'Construction & road blockages'}
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {loading && closures.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>⏳</Text>
            <Text style={styles.emptyText}>
              {language === 'fr' ? 'Chargement...' : 'Loading...'}
            </Text>
          </View>
        ) : closures.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>✅</Text>
            <Text style={styles.emptyText}>
              {language === 'fr'
                ? 'Aucune fermeture de route active'
                : 'No active road closures'}
            </Text>
            <Text style={styles.emptySubtext}>
              {language === 'fr'
                ? 'Toutes les routes sont ouvertes'
                : 'All roads are open'}
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.countText}>
              {closures.length} {closures.length === 1
                ? (language === 'fr' ? 'fermeture active' : 'active closure')
                : (language === 'fr' ? 'fermetures actives' : 'active closures')}
            </Text>

            {closures.map((closure) => (
              <TouchableOpacity
                key={closure.id}
                style={[
                  styles.closureCard,
                  closure.severity === 'full-closure' && styles.closureSevere,
                  closure.severity === 'partial' && styles.closurePartial,
                  closure.severity === 'detour' && styles.closureDetour,
                ]}
                onPress={() => openDetails(closure)}
                activeOpacity={0.7}
              >
                <View style={styles.closureHeader}>
                  <Text style={styles.closureIcon}>{getSeverityIcon(closure.severity)}</Text>
                  <View style={[
                    styles.severityBadge,
                    closure.severity === 'full-closure' && styles.badgeSevere,
                    closure.severity === 'partial' && styles.badgePartial,
                    closure.severity === 'detour' && styles.badgeDetour,
                  ]}>
                    <Text style={styles.severityText}>{getSeverityLabel(closure.severity)}</Text>
                  </View>
                </View>

                <Text style={styles.closureTitle}>
                  {closure.title?.[language] || closure.title?.en || closure.title?.fr || ''}
                </Text>

                <View style={styles.closureDetails}>
                  <Text style={styles.closureLocation}>📍 {closure.location}</Text>
                  <Text style={styles.closureDates}>
                    📅 {closure.startDate} - {closure.endDate || (language === 'fr' ? 'En cours' : 'Ongoing')}
                  </Text>
                </View>

                {closure.imageUrl && (
                  <View style={styles.hasImageIndicator}>
                    <Text style={styles.hasImageText}>🗺️ {language === 'fr' ? 'Carte disponible' : 'Map available'}</Text>
                  </View>
                )}

                <Text style={styles.tapHint}>
                  {language === 'fr' ? 'Appuyez pour plus de détails' : 'Tap for details'}
                </Text>
              </TouchableOpacity>
            ))}
          </>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Closure Details Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedClosure && (
              <>
                <View style={[
                  styles.modalHeader,
                  selectedClosure.severity === 'full-closure' && { backgroundColor: '#E07A5F' },
                  selectedClosure.severity === 'partial' && { backgroundColor: '#D4A017' },
                  selectedClosure.severity === 'detour' && { backgroundColor: colors.primary },
                ]}>
                  <Text style={styles.modalTitle}>
                    {selectedClosure.title?.[language] || selectedClosure.title?.en || selectedClosure.title?.fr || ''}
                  </Text>
                  <Text style={styles.modalSubtitle}>
                    {getSeverityLabel(selectedClosure.severity)}
                  </Text>
                </View>

                <ScrollView style={styles.modalBody}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>📍 {language === 'fr' ? 'Emplacement' : 'Location'}</Text>
                    <Text style={styles.detailText}>{selectedClosure.location}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>📅 {language === 'fr' ? 'Dates' : 'Dates'}</Text>
                    <Text style={styles.detailText}>
                      {selectedClosure.startDate} - {selectedClosure.endDate || (language === 'fr' ? 'En cours' : 'Ongoing')}
                    </Text>
                  </View>

                  {(selectedClosure.description?.[language] || selectedClosure.description?.en || selectedClosure.description?.fr) && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>📝 {language === 'fr' ? 'Description' : 'Description'}</Text>
                      <Text style={styles.detailText}>
                        {selectedClosure.description?.[language] || selectedClosure.description?.en || selectedClosure.description?.fr}
                      </Text>
                    </View>
                  )}

                  {selectedClosure.imageUrl && (
                    <View style={styles.imageContainer}>
                      <Text style={styles.detailLabel}>🗺️ {language === 'fr' ? 'Carte' : 'Map'}</Text>
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
  countText: {
    fontSize: 14,
    color: '#5A6C7D',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A2E',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#5A6C7D',
  },
  closureCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
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
  closureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  closureIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  severityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#FEF3E7',
  },
  badgeSevere: {
    backgroundColor: '#FDEAEA',
  },
  badgePartial: {
    backgroundColor: '#FEF3E7',
  },
  badgeDetour: {
    backgroundColor: '#E8F4F5',
  },
  severityText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5A4A3A',
  },
  closureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A2E',
    marginBottom: 12,
  },
  closureDetails: {
    marginBottom: 8,
  },
  closureLocation: {
    fontSize: 14,
    color: '#5A6C7D',
    marginBottom: 4,
  },
  closureDates: {
    fontSize: 13,
    color: '#8B8B8B',
  },
  hasImageIndicator: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E8E4DC',
  },
  hasImageText: {
    fontSize: 13,
    color: '#0D5C63',
  },
  tapHint: {
    fontSize: 12,
    color: '#8B8B8B',
    marginTop: 12,
    textAlign: 'center',
  },
  bottomPadding: {
    height: 40,
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
    fontSize: 22,
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
  detailRow: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5A6C7D',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 15,
    color: '#1A1A2E',
    lineHeight: 22,
  },
  imageContainer: {
    marginTop: 8,
  },
  closureImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginTop: 8,
    backgroundColor: '#F0F0F0',
  },
  closeButton: {
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

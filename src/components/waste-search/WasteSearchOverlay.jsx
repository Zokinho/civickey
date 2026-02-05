import { View, Text, TextInput, FlatList, TouchableOpacity, Modal, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useState, useRef, useCallback } from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import { useTheme } from '../../contexts/ThemeContext';
import { useMunicipality } from '../../contexts/MunicipalityContext';
import WasteSearchResult from './WasteSearchResult';

export default function WasteSearchOverlay({ visible, onClose, searchItems, collectionTypes }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const inputRef = useRef(null);
  const { language, t } = useLanguage();
  const { colors: themeColors, isDark } = useTheme();
  const { getThemeColors } = useMunicipality();
  const colors = getThemeColors();

  const getLocalizedText = (obj, fallback = '') => {
    if (!obj) return fallback;
    if (typeof obj === 'string') return obj;
    return obj[language] || obj.en || obj.fr || fallback;
  };

  const getBinInfo = useCallback((binId) => {
    const type = collectionTypes.find(ct => ct.id === binId);
    if (type) {
      return {
        name: getLocalizedText(type.name, binId),
        color: type.color || '#888888',
      };
    }
    return { name: binId || '?', color: '#888888' };
  }, [collectionTypes, language]);

  const handleChangeText = useCallback((text) => {
    setQuery(text);
    if (text.length >= 2) {
      setResults(searchItems(text));
    } else {
      setResults([]);
    }
  }, [searchItems]);

  const handleClose = useCallback(() => {
    setQuery('');
    setResults([]);
    onClose();
  }, [onClose]);

  const renderItem = useCallback(({ item }) => {
    const bin = getBinInfo(item.binId);
    return (
      <WasteSearchResult
        item={item}
        binName={bin.name}
        binColor={bin.color}
      />
    );
  }, [getBinInfo]);

  const renderEmpty = () => {
    if (query.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyIcon]}>?</Text>
          <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
            {t('search.placeholder')}
          </Text>
        </View>
      );
    }
    if (query.length < 2) {
      return (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
            {t('search.minChars')}
          </Text>
        </View>
      );
    }
    return (
      <View style={styles.emptyState}>
        <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
          {t('search.noResults')}
        </Text>
        <Text style={[styles.emptyHint, { color: themeColors.textMuted }]}>
          {t('search.noResultsHelp')}
        </Text>
      </View>
    );
  };

  return (
    <Modal
      animationType="slide"
      visible={visible}
      onRequestClose={handleClose}
      onShow={() => {
        setTimeout(() => inputRef.current?.focus(), 100);
      }}
    >
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: themeColors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={handleClose} style={styles.backButton}>
              <Text style={styles.backText}>{'<'}</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('search.title')}</Text>
            <View style={styles.backButton} />
          </View>
          <View style={[styles.inputContainer, { backgroundColor: isDark ? themeColors.inputBackground : 'rgba(255,255,255,0.2)' }]}>
            <TextInput
              ref={inputRef}
              style={[styles.input, { color: '#FFFFFF' }]}
              placeholder={t('search.placeholder')}
              placeholderTextColor="rgba(255,255,255,0.6)"
              value={query}
              onChangeText={handleChangeText}
              autoCorrect={false}
              returnKeyType="search"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => handleChangeText('')} style={styles.clearButton}>
                <Text style={styles.clearText}>X</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {query.length >= 2 && results.length > 0 ? (
          <FlatList
            data={results}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
          />
        ) : (
          renderEmpty()
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '300',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
  },
  clearButton: {
    padding: 8,
  },
  clearText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    fontWeight: '600',
  },
  list: {
    padding: 16,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});

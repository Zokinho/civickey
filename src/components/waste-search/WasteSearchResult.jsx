import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useState } from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import { useTheme } from '../../contexts/ThemeContext';

export default function WasteSearchResult({ item, binName, binColor }) {
  const [expanded, setExpanded] = useState(false);
  const { language } = useLanguage();
  const { colors: themeColors } = useTheme();

  const itemName = language === 'fr'
    ? (item.nameFr || item.nameEn || '')
    : (item.nameEn || item.nameFr || '');

  const note = language === 'fr'
    ? (item.noteFr || item.noteEn || '')
    : (item.noteEn || item.noteFr || '');

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: themeColors.card }]}
      onPress={() => note && setExpanded(!expanded)}
      activeOpacity={note ? 0.7 : 1}
    >
      <View style={[styles.dot, { backgroundColor: binColor }]} />
      <View style={styles.content}>
        <Text style={[styles.itemName, { color: themeColors.text }]}>{itemName}</Text>
        <Text style={[styles.binLabel, { color: binColor }]}>{binName}</Text>
        {expanded && note ? (
          <Text style={[styles.note, { color: themeColors.textSecondary }]}>{note}</Text>
        ) : null}
      </View>
      {note ? (
        <Text style={[styles.chevron, { color: themeColors.border }]}>
          {expanded ? '...' : '...'}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '500',
  },
  binLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  note: {
    fontSize: 13,
    marginTop: 6,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  chevron: {
    fontSize: 16,
    paddingLeft: 8,
    marginTop: 2,
  },
});

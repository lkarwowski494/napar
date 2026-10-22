// ============================================================================
// Napar (Steepwise) — JournalFilterBar Component
// Search input and category filter chips for brew journal sessions
// ============================================================================

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SearchField } from '../ui';
import { theme } from '../../core/theme';
import { BeveragePreference } from '../../core/database';

interface JournalFilterBarProps {
  searchQuery: string;
  onSearchChange: (text: string) => void;
  filterType: 'all' | 'coffee' | 'tea' | 'high_rated';
  onFilterChange: (type: 'all' | 'coffee' | 'tea' | 'high_rated') => void;
  beveragePreference: BeveragePreference;
  t: any;
}

export const JournalFilterBar: React.FC<JournalFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  filterType,
  onFilterChange,
  beveragePreference,
  t,
}) => {
  const chips = [
    { key: 'all', label: t.journal.filterAll },
    ...(beveragePreference !== 'tea' ? [{ key: 'coffee', label: t.journal.filterCoffee }] : []),
    ...(beveragePreference !== 'coffee' ? [{ key: 'tea', label: t.journal.filterTea }] : []),
    { key: 'high_rated', label: t.journal.filterHighRated },
  ];

  return (
    <>
      {/* Wyszukiwarka sesji (search bar) */}
      <View style={styles.searchBarContainer}>
        <SearchField
          placeholder={t.journal.searchPlaceholder}
          value={searchQuery}
          onChangeText={onSearchChange}
        />
      </View>

      {/* Szybkie filtry */}
      <View style={styles.filterChipsRow}>
        {chips.map((f) => (
          <Pressable
            key={f.key}
            style={[
              styles.filterChip,
              filterType === f.key && styles.filterChipActive, styles.touchTarget,
            ]}
            onPress={() => onFilterChange(f.key as any)}
            accessibilityRole="button"
            accessibilityLabel={f.label}
          >
            <Text
              style={[
                styles.filterChipText,
                filterType === f.key && styles.filterChipTextActive,
              ]}
            >
              {f.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  touchTarget: { minWidth: 44, minHeight: 44 },
  searchBarContainer: {
    marginBottom: theme.spacing.md,
  },
  filterChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: theme.spacing.md,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.bgCardSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minHeight: 44,
    justifyContent: 'center',
  },
  filterChipActive: {
    backgroundColor: theme.colors.copper,
    borderColor: theme.colors.copper,
  },
  filterChipText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

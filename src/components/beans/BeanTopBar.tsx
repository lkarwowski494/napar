// ============================================================================
// Napar (Steepwise) — BeanTopBar Component
// Filter bar with Compendium and Add button
// ============================================================================

import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { InventoryItem } from '../../core/database-schema';
import { theme } from '../../core/theme';
import { BookIcon } from '../icons/CraftIcons';

interface BeanTopBarProps {
  items: InventoryItem[];
  filter: 'all' | 'coffee' | 'tea' | 'archived';
  onFilterChange: (f: 'all' | 'coffee' | 'tea' | 'archived') => void;
  onOpenCompendium: () => void;
  onOpenAdd: () => void;
}

export const BeanTopBar: React.FC<BeanTopBarProps> = ({
  items,
  filter,
  onFilterChange,
  onOpenCompendium,
  onOpenAdd,
}) => {
  const safeItems = Array.isArray(items) ? items : [];

  return (
    <View style={styles.topBar}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        <Pressable
          style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}
          onPress={() => onFilterChange('all')}
          accessibilityRole="button"
          accessibilityState={{ selected: filter === 'all' }}
          accessibilityLabel="Filtr: Wszystkie pozycje"
        >
          <Text style={[styles.filterChipText, filter === 'all' && styles.filterChipTextActive]}>
            Wszystkie ({safeItems.filter((i) => !i?.isArchived).length})
          </Text>
        </Pressable>
        <Pressable
          style={[styles.filterChip, filter === 'coffee' && styles.filterChipActive]}
          onPress={() => onFilterChange('coffee')}
          accessibilityRole="button"
          accessibilityState={{ selected: filter === 'coffee' }}
          accessibilityLabel="Filtr: Kawa"
        >
          <Text style={[styles.filterChipText, filter === 'coffee' && styles.filterChipTextActive]}>
            Kawa ({safeItems.filter((i) => !i?.isArchived && i?.type === 'coffee').length})
          </Text>
        </Pressable>
        <Pressable
          style={[styles.filterChip, filter === 'tea' && styles.filterChipActive]}
          onPress={() => onFilterChange('tea')}
          accessibilityRole="button"
          accessibilityState={{ selected: filter === 'tea' }}
          accessibilityLabel="Filtr: Herbata"
        >
          <Text style={[styles.filterChipText, filter === 'tea' && styles.filterChipTextActive]}>
            Herbata ({safeItems.filter((i) => !i?.isArchived && i?.type === 'tea').length})
          </Text>
        </Pressable>
        <Pressable
          style={[styles.filterChip, filter === 'archived' && styles.filterChipActive]}
          onPress={() => onFilterChange('archived')}
          accessibilityRole="button"
          accessibilityState={{ selected: filter === 'archived' }}
          accessibilityLabel="Filtr: Archiwum"
        >
          <Text style={[styles.filterChipText, filter === 'archived' && styles.filterChipTextActive]}>
            Archiwum ({safeItems.filter((i) => Boolean(i?.isArchived)).length})
          </Text>
        </Pressable>
      </ScrollView>

      {/* Przycisk Bazy Wiedzy */}
      <Pressable
        testID="compendium-open-button"
        style={styles.compendiumButton}
        onPress={onOpenCompendium}
        accessibilityRole="button"
        accessibilityLabel="Otwórz kompendium wiedzy"
      >
        <BookIcon size={14} color={theme.colors.copper} />
        <Text style={styles.compendiumButtonText}>Kompendium</Text>
      </Pressable>

      {/* Przycisk dodawania nowej paczki */}
      <Pressable
        testID="beans-add-button"
        style={styles.addButton}
        onPress={onOpenAdd}
        accessibilityRole="button"
        accessibilityLabel="Dodaj nową kawę lub herbatę do spiżarni"
      >
        <Text style={styles.addButtonText}>+ Dodaj</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.bgCard,
  },
  filterScroll: {
    flex: 1,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.bgCardSecondary,
    marginRight: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
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
  compendiumButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.bgCardSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
    marginRight: 8,
    gap: 4,
  },
  compendiumButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  addButton: {
    backgroundColor: theme.colors.copper,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});

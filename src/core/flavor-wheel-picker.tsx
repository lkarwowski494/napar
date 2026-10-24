// ============================================================================
// Napar (Steepwise) — Komponent Wyboru Nut Smakowych (SCA Flavor Wheel Picker)
// Hierarchiczny selektor z kategoriami, podkategoriami i wybranymi tagami
// ============================================================================

import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SCA_FLAVOR_WHEEL, FlavorCategory } from './flavor-wheel-data';
import { theme } from './theme';

export interface FlavorWheelPickerProps {
  selectedDescriptors: string[];
  onToggleDescriptor: (descriptor: string) => void;
  language?: 'pl' | 'en';
}

export const FlavorWheelPicker: React.FC<FlavorWheelPickerProps> = ({
  selectedDescriptors,
  onToggleDescriptor,
  language = 'pl',
}) => {
  const isEn = language === 'en';
  const [activeCategoryId, setActiveCategoryId] = useState<string>('fruity');

  const activeCategory =
    SCA_FLAVOR_WHEEL.find((c) => c.id === activeCategoryId) || SCA_FLAVOR_WHEEL[0];

  return (
    <View style={styles.container}>
      {/* Wybrane nuty (aktywne chipy) */}
      {selectedDescriptors.length > 0 && (
        <View style={styles.selectedRow}>
          <Text style={styles.selectedLabel}>
            {isEn
              ? `Selected notes (${selectedDescriptors.length}):`
              : `Wybrane nuty (${selectedDescriptors.length}):`}
          </Text>
          <View style={styles.selectedChipsContainer}>
            {selectedDescriptors.map((desc) => (
              <Pressable
                key={desc}
                style={styles.activeChip}
                onPress={() => onToggleDescriptor(desc)}
                hitSlop={6}
              >
                <Text style={styles.activeChipText}>{desc} ✕</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* Główne kategorie koła (Poziom 1) */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
      >
        {SCA_FLAVOR_WHEEL.map((cat) => {
          const isActive = cat.id === activeCategoryId;
          const categoryName = isEn ? cat.nameEn || cat.namePl : cat.namePl;
          return (
            <Pressable
              key={cat.id}
              style={[
                styles.categoryTab,
                isActive && {
                  borderColor: cat.color,
                  backgroundColor: 'rgba(255,255,255,0.08)',
                },
              ]}
              onPress={() => setActiveCategoryId(cat.id)}
            >
              <Text
                style={[
                  styles.categoryTabText,
                  isActive && { color: cat.color, fontWeight: '700' },
                ]}
              >
                {categoryName}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Deskryptory wybranej kategorii (Poziom 2 i 3) */}
      <View style={styles.descriptorsContainer}>
        {activeCategory.subcategories.map((sub) => {
          const subcategoryName = isEn ? sub.nameEn || sub.namePl : sub.namePl;
          return (
            <View key={sub.namePl} style={styles.subcategoryBlock}>
              <Text style={[styles.subcategoryTitle, { color: activeCategory.color }]}>
                {subcategoryName}
              </Text>
              <View style={styles.descriptorsGrid}>
                {sub.descriptors.map((desc) => {
                  const isSelected = selectedDescriptors.includes(desc);
                  return (
                    <Pressable
                      key={desc}
                      style={[
                        styles.descriptorChip,
                        isSelected && {
                          backgroundColor: activeCategory.color,
                          borderColor: activeCategory.color,
                        },
                      ]}
                      onPress={() => onToggleDescriptor(desc)}
                    >
                      <Text
                        style={[
                          styles.descriptorText,
                          isSelected && styles.descriptorTextSelected,
                        ]}
                      >
                        {desc}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
  },
  selectedRow: {
    marginBottom: 10,
  },
  selectedLabel: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginBottom: 6,
    fontWeight: '600',
  },
  selectedChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  activeChip: {
    backgroundColor: theme.colors.copperMuted,
    borderColor: theme.colors.copper,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
  },
  activeChipText: {
    fontSize: 12,
    color: theme.colors.copperLight,
    fontWeight: '700',
  },
  categoryScroll: {
    marginBottom: 10,
  },
  categoryTab: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.bgCardSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginRight: 8,
  },
  categoryTabText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  descriptorsContainer: {
    backgroundColor: theme.colors.bgCardSecondary,
    borderRadius: theme.borderRadius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    maxHeight: 220,
  },
  subcategoryBlock: {
    marginBottom: 10,
  },
  subcategoryTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  descriptorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  descriptorChip: {
    backgroundColor: theme.colors.bgCard,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.borderRadius.sm,
  },
  descriptorText: {
    fontSize: 12,
    color: theme.colors.textPrimary,
  },
  descriptorTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

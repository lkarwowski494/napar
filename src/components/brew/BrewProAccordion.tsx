// ============================================================================
// Napar (Steepwise) — BrewProAccordion Component (Progressive Disclosure)
// Hides Barista Hustle water chemistry and TDS behind a clean fold.
// Apps4Brew Studio — 100% Offline-First.
// ============================================================================

import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput } from 'react-native';
import { theme } from '../../core/theme';
import { WATER_RECIPES } from '../../core/water-chemistry';
import { LabIcon } from '../icons/CraftIcons';

interface BrewProAccordionProps {
  waterProfile: string;
  onSelectWaterProfile: (id: string) => void;
  tdsInput: string;
  onChangeTds: (val: string) => void;
}

export function BrewProAccordion({
  waterProfile,
  onSelectWaterProfile,
  tdsInput,
  onChangeTds,
}: BrewProAccordionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <View style={styles.container} testID="pro-accordion">
      <Pressable
        testID="pro-accordion-toggle-btn"
        style={styles.header}
        onPress={() => setIsExpanded(!isExpanded)}
        accessibilityRole="button"
        accessibilityLabel="Rozwiń parametry wody i mineralizację"
      >
        <View style={styles.headerTitleRow}>
          <LabIcon size={18} color={theme.colors.copper} />
          <Text style={styles.headerTitle}>Zaawansowane: Woda & TDS</Text>
        </View>
        <Text style={styles.headerArrow}>{isExpanded ? '▴' : '▾'}</Text>
      </Pressable>

      {isExpanded && (
        <View style={styles.body} testID="pro-accordion-body">
          {/* Chemia wody Barista Hustle / SCA */}
          <Text style={styles.sectionLabel}>Profil Wody (Barista Hustle / SCA)</Text>
          <View style={styles.chipsRow}>
            {WATER_RECIPES.map((w) => {
              const active = waterProfile === w.id;
              return (
                <Pressable
                  key={w.id}
                  testID={`pro-water-chip-${w.id}`}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => onSelectWaterProfile(w.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Profil wody ${w.namePl}`}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {w.namePl}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* TDS Refractometr */}
          <View style={styles.tdsRow}>
            <Text style={styles.tdsLabel}>Odczyt refractometru TDS (%):</Text>
            <TextInput
              testID="pro-tds-input"
              style={styles.tdsInput}
              placeholder="np. 1.35"
              placeholderTextColor={theme.colors.textMuted}
              keyboardType="numeric"
              value={tdsInput}
              onChangeText={onChangeTds}
            />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: theme.colors.bgCardSecondary,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.copper,
    letterSpacing: 0.3,
  },
  headerArrow: {
    fontSize: 16,
    color: theme.colors.textMuted,
    fontWeight: '800',
  },
  body: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.copper,
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  chip: {
    backgroundColor: theme.colors.bgCardSecondary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  chipActive: {
    borderColor: theme.colors.copper,
    backgroundColor: theme.colors.copperMuted,
  },
  chipText: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  chipTextActive: {
    color: theme.colors.copper,
    fontWeight: '700',
  },
  tdsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.bgCardSecondary,
    padding: 10,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  tdsLabel: {
    fontSize: 12,
    color: theme.colors.textPrimary,
    fontWeight: '500',
  },
  tdsInput: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 10,
    paddingVertical: 4,
    color: theme.colors.textPrimary,
    width: 75,
    textAlign: 'center',
    fontSize: 13,
  },
});

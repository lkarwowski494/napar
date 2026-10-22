import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import {
  SUPPORTED_GRINDERS,
  GRIND_CATEGORIES,
  convertMicronsToGrinder,
} from '../../core/grinder-converter';
import { theme } from '../../core/theme';
import { GrinderCalibrationCard } from './GrinderCalibrationCard';

export interface GrinderConverterCardProps {
  language: string;
  t: any;
}

export const GrinderConverterCard: React.FC<GrinderConverterCardProps> = ({ language, t }) => {
  const [selectedGrindCategoryId, setSelectedGrindCategoryId] = useState<string>('pourover_v60');
  const activeGrindCategory =
    GRIND_CATEGORIES.find((c) => c.id === selectedGrindCategoryId) || GRIND_CATEGORIES[2];

  return (
    <View style={[styles.calcCard, { marginTop: 16 }]}>
      <Text style={styles.sectionHeader}>{t.grinder.title}</Text>
      <Text style={styles.sectionSub}>{t.grinder.subtitle}</Text>

      <Text style={styles.inputTitle}>{t.grinder.categorySelect}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
        {GRIND_CATEGORIES.map((cat) => (
          <Pressable
            key={cat.id}
            style={[
              styles.grindCategoryChip,
              selectedGrindCategoryId === cat.id && styles.grindCategoryChipActive, styles.touchTarget,
            ]}
            onPress={() => setSelectedGrindCategoryId(cat.id)}
          >
            <Text
              style={[
                styles.grindCategoryChipText,
                selectedGrindCategoryId === cat.id && styles.grindCategoryChipTextActive,
              ]}
            >
              {language === 'pl' ? cat.namePl : cat.nameEn}
            </Text>
            <Text style={styles.grindCategoryChipSub}>
              ~{cat.defaultMicrons} µm
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.grinderCategoryDetailsCard}>
        <Text style={styles.grinderMethodsText}>
          Metody: {language === 'pl' ? activeGrindCategory.methodsPl : activeGrindCategory.methodsEn}
        </Text>
        <Text style={styles.grinderMicronsRange}>
          Średnia cząstek: {activeGrindCategory.micronMin} – {activeGrindCategory.micronMax} µm (punkt odniesienia: {activeGrindCategory.defaultMicrons} µm)
        </Text>
      </View>

      <Text style={[styles.inputTitle, { marginTop: 12 }]}>
        {t.grinder.allGrindersHeader}
      </Text>

      <View style={styles.grindersGrid}>
        {SUPPORTED_GRINDERS.map((grinder) => {
          const setting = convertMicronsToGrinder(activeGrindCategory.defaultMicrons, grinder.id);
          return (
            <View key={grinder.id} style={styles.grinderSettingCard}>
              <Text style={styles.grinderNameText}>{grinder.name}</Text>
              <Text style={styles.grinderBurrText}>{grinder.burrType}</Text>
              <Text style={styles.grinderSettingValue}>{setting.formatted}</Text>
            </View>
          );
        })}
      </View>

      {/* KALIBRACJA Z WŁASNYCH PARZEŃ (poz. 12) */}
      <GrinderCalibrationCard t={t} />
    </View>
  );
};

const styles = StyleSheet.create({
  touchTarget: { minWidth: 44, minHeight: 44 },
  calcCard: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  sectionSub: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginBottom: 16,
    lineHeight: 18,
  },
  inputTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  grindCategoryChip: {
    backgroundColor: theme.colors.bgCardSecondary,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  grindCategoryChipActive: {
    backgroundColor: theme.colors.copperMuted,
    borderColor: theme.colors.copper,
  },
  grindCategoryChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  grindCategoryChipTextActive: {
    color: theme.colors.copperLight,
    fontWeight: '700',
  },
  grindCategoryChipSub: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  grinderCategoryDetailsCard: {
    backgroundColor: theme.colors.bgCardSecondary,
    borderRadius: theme.borderRadius.sm,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 8,
  },
  grinderMethodsText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  grinderMicronsRange: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  grindersGrid: {
    gap: 8,
  },
  grinderSettingCard: {
    backgroundColor: theme.colors.bgCardSecondary,
    borderRadius: theme.borderRadius.sm,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  grinderNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    flex: 1,
  },
  grinderBurrText: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginRight: 12,
  },
  grinderSettingValue: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.copper,
  },
});

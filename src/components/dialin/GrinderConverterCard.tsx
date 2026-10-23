import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import {
  SUPPORTED_GRINDERS,
  GRIND_CATEGORIES,
  convertMicronsToGrinder,
} from '../../core/grinder-converter';
import { getCustomGrinderModels } from '../../core/database';
import { theme } from '../../core/theme';
import { GrinderCalibrationCard } from './GrinderCalibrationCard';
import { CustomGrinderCard } from './CustomGrinderCard';
import { pickBilingual } from '../../core/i18n-loader';
import { fillTemplate } from '../../core/access-policy';

export interface GrinderConverterCardProps {
  language: string;
  t: any;
}

export const GrinderConverterCard: React.FC<GrinderConverterCardProps> = ({ language, t }) => {
  const [selectedGrindCategoryId, setSelectedGrindCategoryId] = useState<string>('pourover_v60');
  const activeGrindCategory =
    GRIND_CATEGORIES.find((c) => c.id === selectedGrindCategoryId) || GRIND_CATEGORIES[2];

  // Własne młynki (poz. 11) są w przeliczniku obok tabeli; zmiana listy odświeża odczyt
  const [customRevision, setCustomRevision] = useState<number>(0);
  const customModels = useMemo(() => getCustomGrinderModels(), [customRevision]);
  const grinders = useMemo(() => [...SUPPORTED_GRINDERS, ...customModels], [customModels]);

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
              {pickBilingual(language, cat.namePl, cat.nameEn)}
            </Text>
            <Text style={styles.grindCategoryChipSub}>
              ~{cat.defaultMicrons} µm
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.grinderCategoryDetailsCard}>
        <Text style={styles.grinderMethodsText}>
          {t.grinder.methodsPrefix}{' '}
          {pickBilingual(language, activeGrindCategory.methodsPl, activeGrindCategory.methodsEn)}
        </Text>
        <Text style={styles.grinderMicronsRange}>
          {fillTemplate(t.grinder.micronsRangeText, {
            min: activeGrindCategory.micronMin,
            max: activeGrindCategory.micronMax,
            reference: activeGrindCategory.defaultMicrons,
          })}
        </Text>
      </View>

      <Text style={[styles.inputTitle, { marginTop: 12 }]}>
        {t.grinder.allGrindersHeader}
      </Text>

      <View style={styles.grindersGrid}>
        {grinders.map((grinder) => {
          const setting = convertMicronsToGrinder(
            activeGrindCategory.defaultMicrons,
            grinder.id,
            customModels
          );
          return (
            <View key={grinder.id} style={styles.grinderSettingCard}>
              <Text style={styles.grinderNameText}>{grinder.name}</Text>
              <Text style={styles.grinderBurrText}>{grinder.burrType}</Text>
              <Text style={styles.grinderSettingValue}>{setting.formatted}</Text>
            </View>
          );
        })}
      </View>

      {/* WŁASNY MŁYNEK (poz. 11) */}
      <CustomGrinderCard t={t} onChanged={() => setCustomRevision((rev) => rev + 1)} />

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

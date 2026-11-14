// ============================================================================
// Napar (Steepwise) — BedtimeCurfewCard Component
// Szacunek kofeiny o porze snu i czas półtrwania (t1/2) — bez progu i oceny snu (M1-audytor-generalny-015, DEC-05 a)
// ============================================================================

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { theme } from '../../core/theme';
import { useTranslation } from '../../core/i18n';

interface BedtimeCurfewCardProps {
  bedtimeHour: number;
  onBedtimeChange: (hour: number) => void;
  halfLifeHours: number;
  onHalfLifeChange: (halfLife: number) => void;
  /** Szacowana kofeina w organizmie o porze snu (mg) — wynik modelu, bez oceny */
  bedtimeMg: number;
}

export const BedtimeCurfewCard: React.FC<BedtimeCurfewCardProps> = ({
  bedtimeHour,
  onBedtimeChange,
  halfLifeHours,
  onHalfLifeChange,
  bedtimeMg,
}) => {
  const { t } = useTranslation();
  return (
    <View style={styles.curfewCard}>
      <View style={styles.curfewHeader}>
        <Text style={styles.curfewTitle}>{t.caffeine.bedtimeCardTitle}</Text>
        <View style={styles.bedtimeStepper}>
          <Pressable
            testID="bedtime-dec-btn"
            style={styles.hourBtn}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t.caffeine.bedtimeEarlierA11y}
            onPress={() => onBedtimeChange(bedtimeHour - 1)}
          >
            <Text style={styles.hourBtnText}>−</Text>
          </Pressable>
          <Text style={styles.bedtimeHourText}>{`${bedtimeHour}:00`}</Text>
          <Pressable
            testID="bedtime-inc-btn"
            style={styles.hourBtn}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t.caffeine.bedtimeLaterA11y}
            onPress={() => onBedtimeChange(bedtimeHour + 1)}
          >
            <Text style={styles.hourBtnText}>+</Text>
          </Pressable>
        </View>
      </View>

      {/* Metabolizm Kofeiny (t1/2) D-02 */}
      <View style={styles.metabolismRow}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text style={styles.metabolismTitle}>Metabolizm kofeiny (t₁/₂)</Text>
          <Text style={styles.metabolismSubtitle}>
            {halfLifeHours <= 3.5
              ? 'Szybki metabolizm (orientacyjnie)'
              : halfLifeHours >= 6.5
              ? 'Wolny metabolizm (orientacyjnie)'
              : 'Standardowy metabolizm (EFSA)'}
          </Text>
        </View>
        <View style={styles.bedtimeStepper}>
          <Pressable
            testID="halflife-dec-btn"
            style={styles.hourBtn}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Krótszy czas półtrwania kofeiny"
            onPress={() => onHalfLifeChange(halfLifeHours - 0.5)}
          >
            <Text style={styles.hourBtnText}>−</Text>
          </Pressable>
          <Text style={styles.bedtimeHourText}>{halfLifeHours.toFixed(1)}h</Text>
          <Pressable
            testID="halflife-inc-btn"
            style={styles.hourBtn}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Dłuższy czas półtrwania kofeiny"
            onPress={() => onHalfLifeChange(halfLifeHours + 0.5)}
          >
            <Text style={styles.hourBtnText}>+</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.estimateBox} testID="bedtime-estimate">
        <Text style={styles.estimateText}>
          {t.caffeine.bedtimeEstimate.replace('{hour}', String(bedtimeHour)).replace('{mg}', String(bedtimeMg))}
        </Text>
      </View>

      <Text style={styles.curfewDescription}>{t.caffeine.bedtimeEstimateNote}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  curfewCard: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.lg,
  },
  curfewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  curfewTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  bedtimeStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.bgCardSecondary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  hourBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    minHeight: 36,
    minWidth: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hourBtnText: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.copper,
  },
  bedtimeHourText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    minWidth: 48,
    textAlign: 'center',
  },
  metabolismRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    marginBottom: 12,
  },
  metabolismTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  metabolismSubtitle: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  estimateBox: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: theme.colors.bgCardSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  estimateText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  curfewDescription: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
    marginBottom: 0,
  },
});

// ============================================================================
// Napar (Steepwise) — BedtimeCurfewCard Component
// Bedtime Curfew & Caffeine Elimination Kinetics (t1/2) Card
// ============================================================================

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { theme } from '../../core/theme';

interface BedtimeCurfewCardProps {
  bedtimeHour: number;
  onBedtimeChange: (hour: number) => void;
  halfLifeHours: number;
  onHalfLifeChange: (halfLife: number) => void;
  bedtimeEval: {
    totalRemainingMg: number;
    isSafeForSleep: boolean;
    messagePl: string;
  };
  curfewTimeString: string;
}

export const BedtimeCurfewCard: React.FC<BedtimeCurfewCardProps> = ({
  bedtimeHour,
  onBedtimeChange,
  halfLifeHours,
  onHalfLifeChange,
  bedtimeEval,
  curfewTimeString,
}) => {
  return (
    <View style={styles.curfewCard}>
      <View style={styles.curfewHeader}>
        <Text style={styles.curfewTitle}>Predykcja Jakości Snu</Text>
        <View style={styles.bedtimeStepper}>
          <Pressable
            testID="bedtime-dec-btn"
            style={styles.hourBtn}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Wcześniejsza godzina snu"
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
            accessibilityLabel="Późniejsza godzina snu"
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
              ? 'Szybki klirens (CYP1A2 *1A)'
              : halfLifeHours >= 6.5
              ? 'Wolny klirens wątrobowy'
              : 'Standardowy klirens (EFSA)'}
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

      <View
        style={[
          styles.curfewVerdictBadge,
          bedtimeEval.isSafeForSleep
            ? styles.curfewVerdictSafe
            : styles.curfewVerdictDanger,
        ]}
      >
        <Text style={styles.curfewVerdictText}>
          Poziom kofeiny o {bedtimeHour}:00: {bedtimeEval.totalRemainingMg} mg
        </Text>
      </View>

      <Text style={styles.curfewDescription}>
        {bedtimeEval.messagePl} Próg bezpieczeństwa dla fazy NREM wynosi 25 mg.
      </Text>

      <View style={styles.curfewAdviceBox}>
        <Text style={styles.curfewAdviceLabel}>BEZPIECZNA GODZINA (CURFEW)</Text>
        <Text style={styles.curfewAdviceVal}>
          Ostatni przelew (140 mg) wypij do {curfewTimeString}
        </Text>
      </View>
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
  curfewVerdictBadge: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  curfewVerdictSafe: {
    backgroundColor: 'rgba(42, 123, 98, 0.15)',
    borderWidth: 1,
    borderColor: theme.colors.emerald,
  },
  curfewVerdictDanger: {
    backgroundColor: 'rgba(217, 83, 79, 0.15)',
    borderWidth: 1,
    borderColor: theme.colors.danger,
  },
  curfewVerdictText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  curfewDescription: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  curfewAdviceBox: {
    backgroundColor: theme.colors.bgCardSecondary,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  curfewAdviceLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  curfewAdviceVal: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.copper,
  },
});

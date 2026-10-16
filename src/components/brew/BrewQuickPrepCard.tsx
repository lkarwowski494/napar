// ============================================================================
// Napar (Steepwise) — BrewQuickPrepCard Component (Kitchen-Proof UI 1-Tap)
// "Do drippera na wagę": Instant prep and batch scaling under 15 seconds.
// Apps4Brew Studio — 100% Offline-First.
// ============================================================================

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { theme } from '../../core/theme';
import { useTranslation } from '../../core/i18n';

interface BrewQuickPrepCardProps {
  doseGrams: number;
  waterGrams: number;
  waterTempCelsius: number;
  grindSetting?: string;
  servings: number;
  onServingsChange: (n: number) => void;
  onDoseChange: (dose: number) => void;
  disabled?: boolean;
  batchScaling: {
    grindAdjustmentClicks: number;
    recommendationPl: string;
  };
}

export function BrewQuickPrepCard({
  doseGrams,
  waterGrams,
  waterTempCelsius,
  grindSetting,
  servings,
  onServingsChange,
  onDoseChange,
  disabled = false,
  batchScaling,
}: BrewQuickPrepCardProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.card} testID="quick-prep-card">
      {/* Skalowanie porcji (Batch Scaling dla 1–4 osób) */}
      <View style={styles.batchSection}>
        <View style={styles.batchHeaderRow}>
          <Text style={styles.batchTitle}>{`👥 ${t.batch.label}`}</Text>
          {servings > 1 && (
            <View style={styles.batchBadge}>
              <Text style={styles.batchBadgeText}>
                {`+${batchScaling.grindAdjustmentClicks} kliki grubiej`}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.batchChipsRow}>
          {[1, 2, 3, 4].map((n) => (
            <Pressable
              key={n}
              style={[
                styles.batchChip,
                servings === n && styles.batchChipActive,
              ]}
              onPress={() => onServingsChange(n)}
              disabled={disabled}
            >
              <Text
                style={[
                  styles.batchChipText,
                  servings === n && styles.batchChipTextActive,
                ]}
              >
                {n === 1
                  ? t.batch.cup1
                  : n === 2
                  ? t.batch.cup2
                  : n === 3
                  ? t.batch.cup3
                  : t.batch.cup4}
              </Text>
            </Pressable>
          ))}
        </View>

        {servings > 1 && (
          <Text style={styles.batchAdviceText}>
            {`💡 ${batchScaling.recommendationPl}`}
          </Text>
        )}
      </View>

      {/* Skalowanie dozy i wody */}
      <View style={styles.parametersRow}>
        <View style={styles.paramBox}>
          <Text style={styles.paramLabel}>DOZA</Text>
          <View style={styles.stepperRow}>
            <Pressable
              style={styles.stepBtn}
              onPress={() => onDoseChange(Math.max(1, doseGrams - 1))}
              disabled={disabled}
              accessibilityRole="button"
              accessibilityLabel="Zmniejsz dozę kawy"
            >
              <Text style={styles.stepBtnText}>−</Text>
            </Pressable>
            <Text style={styles.paramValue}>{`${doseGrams}g`}</Text>
            <Pressable
              style={styles.stepBtn}
              onPress={() => onDoseChange(doseGrams + 1)}
              disabled={disabled}
              accessibilityRole="button"
              accessibilityLabel="Zwiększ dozę kawy"
            >
              <Text style={styles.stepBtnText}>+</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.paramBox}>
          <Text style={styles.paramLabel}>WODA ŁĄCZNIE</Text>
          <Text style={styles.paramValueLarge}>{`${waterGrams}g`}</Text>
        </View>

        <View style={styles.paramBox}>
          <Text style={styles.paramLabel}>TEMP / MIELENIE</Text>
          <Text style={styles.paramSubValue}>
            {`${waterTempCelsius}°C · ${grindSetting || 'Średnio'}`}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 4,
  },
  batchSection: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.md,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  batchHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  batchTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  batchBadge: {
    backgroundColor: 'rgba(217, 119, 54, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  batchBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.copper,
  },
  batchChipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  batchChip: {
    flex: 1,
    backgroundColor: theme.colors.bgCardSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    paddingVertical: 8,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  batchChipActive: {
    backgroundColor: 'rgba(217, 119, 54, 0.2)',
    borderColor: theme.colors.copper,
  },
  batchChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  batchChipTextActive: {
    color: theme.colors.copper,
    fontWeight: '800',
  },
  batchAdviceText: {
    fontSize: 11,
    color: theme.colors.copper,
    marginTop: 8,
    lineHeight: 15,
  },
  parametersRow: {
    flexDirection: 'row',
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 14,
    alignItems: 'center',
  },
  paramBox: {
    flex: 1,
    alignItems: 'center',
  },
  paramLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.textMuted,
    marginBottom: 4,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.bgCardSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    lineHeight: 20,
    fontWeight: '600',
  },
  paramValue: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  paramValueLarge: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.copper,
  },
  paramSubValue: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});

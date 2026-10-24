// ============================================================================
// Napar (Steepwise) — BrewQuickPrepCard Component (Apps4Craft Design System)
// "The Three Numbers": Dose, Water, Grind/Temp with batch scaling under 15 seconds.
// 100% Offline-First.
// ============================================================================

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { theme } from '../../core/theme';
import { useTranslation } from '../../core/i18n';
import {
  formatDoseWeight,
  formatWaterWeight,
  formatTemperature,
  UnitSystem,
} from '../../core/unit-converter';

interface BrewQuickPrepCardProps {
  doseGrams: number;
  waterGrams: number;
  waterTempCelsius: number;
  grindSetting?: string;
  servings: number;
  onServingsChange: (n: number) => void;
  onDoseChange: (dose: number) => void;
  onWaterChange?: (water: number) => void;
  disabled?: boolean;
  batchScaling: {
    grindAdjustmentClicks: number;
    recommendationPl: string;
  };
  unitSystem?: UnitSystem;
}

export function BrewQuickPrepCard({
  doseGrams,
  waterGrams,
  waterTempCelsius,
  grindSetting,
  servings,
  onServingsChange,
  onDoseChange,
  onWaterChange,
  disabled = false,
  batchScaling,
  unitSystem = 'metric',
}: BrewQuickPrepCardProps) {
  const { t, language } = useTranslation();
  const currentRatioNum = doseGrams > 0 ? (waterGrams / doseGrams).toFixed(1) : '16.7';
  const currentRatioVal = parseFloat(currentRatioNum);

  return (
    <View style={styles.card} testID="quick-prep-card">
      {/* Skalowanie porcji (Batch Scaling dla 1–4 osób) */}
      <View style={styles.batchSection}>
        <View style={styles.batchHeaderRow}>
          <Text style={styles.batchTitle}>{t.batch.label}</Text>
          {servings > 1 && (
            <View style={styles.batchBadge}>
              <Text style={styles.batchBadgeText}>
                {language === 'en'
                  ? `+${batchScaling.grindAdjustmentClicks} clicks coarser`
                  : `+${batchScaling.grindAdjustmentClicks} kliki grubiej`}
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
            {batchScaling.recommendationPl}
          </Text>
        )}
      </View>

      {/* Święta Trójca Parametrów: Doza, Woda, Mielenie & Temperatura */}
      <View style={styles.parametersRow}>
        {/* 1. Doza */}
        <View style={styles.paramBox}>
          <Text style={styles.paramEyebrow}>{language === 'en' ? 'DOSE' : 'DOZA'}</Text>
          <View style={styles.stepperRow}>
            <Pressable
              style={styles.stepBtn}
              onPress={() => onDoseChange(Math.max(1, doseGrams - 1))}
              disabled={disabled}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel={language === 'en' ? 'Decrease coffee dose' : 'Zmniejsz dozę kawy'}
            >
              <Text style={styles.stepBtnText}>−</Text>
            </Pressable>
            <Text style={styles.paramValue}>{formatDoseWeight(doseGrams, unitSystem)}</Text>
            <Pressable
              style={styles.stepBtn}
              onPress={() => onDoseChange(doseGrams + 1)}
              disabled={disabled}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel={language === 'en' ? 'Increase coffee dose' : 'Zwiększ dozę kawy'}
            >
              <Text style={styles.stepBtnText}>+</Text>
            </Pressable>
          </View>
        </View>

        {/* Separator pionowy */}
        <View style={styles.paramDivider} />

        {/* 2. Woda łącznie ze stepperem ±10g */}
        <View style={styles.paramBox}>
          <Text style={styles.paramEyebrow}>{language === 'en' ? 'WATER' : 'WODA'}</Text>
          <View style={styles.stepperRow}>
            {onWaterChange && (
              <Pressable
                style={styles.stepBtn}
                onPress={() => onWaterChange(Math.max(10, waterGrams - 10))}
                disabled={disabled}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityRole="button"
                accessibilityLabel={language === 'en' ? 'Decrease water' : 'Zmniejsz ilość wody'}
              >
                <Text style={styles.stepBtnText}>−</Text>
              </Pressable>
            )}
            <Text style={styles.paramValueLarge}>
              {formatWaterWeight(waterGrams, unitSystem)}
            </Text>
            {onWaterChange && (
              <Pressable
                style={styles.stepBtn}
                onPress={() => onWaterChange(waterGrams + 10)}
                disabled={disabled}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityRole="button"
                accessibilityLabel={language === 'en' ? 'Increase water' : 'Zwiększ ilość wody'}
              >
                <Text style={styles.stepBtnText}>+</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Separator pionowy */}
        <View style={styles.paramDivider} />

        {/* 3. Temperatura i profil zmielenia */}
        <View style={styles.paramBox}>
          <Text style={styles.paramEyebrow}>{language === 'en' ? 'TEMP / GRIND' : 'TEMP / MIELENIE'}</Text>
          <Text style={styles.paramSubValue}>
            {`${formatTemperature(waterTempCelsius, unitSystem)} · ${grindSetting || (language === 'en' ? 'Medium' : 'Średnio')}`}
          </Text>
        </View>
      </View>

      {/* Szybki Wybór Proporcji SCA (Golden Ratio Selector) */}
      {onWaterChange && (
        <View style={styles.ratioSection}>
          <View style={styles.ratioHeaderRow}>
            <Text style={styles.ratioSectionTitle}>{language === 'en' ? 'RATIO' : 'PROPORCJA (RATIO)'}</Text>
            <Text style={styles.currentRatioBadge}>{`1 : ${currentRatioNum}`}</Text>
          </View>
          <View style={styles.ratioChipsRow}>
            {[
              { ratio: 15.0, label: '1:15', desc: language === 'en' ? 'Strong' : 'Mocna' },
              { ratio: 16.7, label: '1:16.7', desc: language === 'en' ? 'Golden Standard' : 'Złoty Standard' },
              { ratio: 18.0, label: '1:18', desc: language === 'en' ? 'Light' : 'Lekka' },
            ].map((r) => {
              const isActive = Math.abs(currentRatioVal - r.ratio) < 0.35;
              return (
                <Pressable
                  key={r.label}
                  style={[styles.ratioChip, isActive && styles.ratioChipActive]}
                  onPress={() => onWaterChange(Math.round(doseGrams * r.ratio))}
                  disabled={disabled}
                >
                  <Text style={[styles.ratioChipText, isActive && styles.ratioChipTextActive]}>
                    {r.label}
                  </Text>
                  <Text style={[styles.ratioChipDesc, isActive && styles.ratioChipDescActive]}>
                    {r.desc}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}
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
    marginBottom: 10,
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
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.copper,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  batchBadge: {
    backgroundColor: 'rgba(217, 119, 54, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
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
    borderRadius: theme.borderRadius.md,
    paddingVertical: 8,
    alignItems: 'center',
    minHeight: 46,
    justifyContent: 'center',
  },
  batchChipActive: {
    backgroundColor: 'rgba(217, 119, 54, 0.15)',
    borderColor: theme.colors.copper,
  },
  batchChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  batchChipTextActive: {
    color: theme.colors.copper,
    fontWeight: '700',
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
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 12,
    alignItems: 'center',
  },
  paramBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paramDivider: {
    width: 1,
    height: 36,
    backgroundColor: theme.colors.border,
  },
  paramEyebrow: {
    fontSize: 9,
    fontWeight: '700',
    color: theme.colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stepBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.bgCardSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    lineHeight: 18,
    fontWeight: '600',
  },
  paramValue: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    fontVariant: ['tabular-nums'],
    marginHorizontal: 4,
  },
  paramValueLarge: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.copper,
    fontVariant: ['tabular-nums'],
  },
  paramSubValue: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  ratioSection: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 8,
  },
  ratioHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratioSectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.copper,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  currentRatioBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.copper,
    fontVariant: ['tabular-nums'],
  },
  ratioChipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  ratioChip: {
    flex: 1,
    backgroundColor: theme.colors.bgCardSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratioChipActive: {
    backgroundColor: 'rgba(217, 119, 54, 0.15)',
    borderColor: theme.colors.copper,
  },
  ratioChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  ratioChipTextActive: {
    color: theme.colors.copper,
  },
  ratioChipDesc: {
    fontSize: 9,
    fontWeight: '500',
    color: theme.colors.textMuted,
  },
  ratioChipDescActive: {
    color: theme.colors.copperLight,
  },
});

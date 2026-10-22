// ============================================================================
// Napar (Steepwise) — RecipeParamsCard Component
// Parameters, ratio badge, unit converter preview, and grind setting
// ============================================================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Field, NumInput } from '../ui';
import { theme } from '../../core/theme';
import { parseDecimal } from '../../core/parse-decimal';
import { formatTemperature, formatDoseWeight, formatWaterWeight } from '../../core/unit-converter';

interface RecipeParamsCardProps {
  doseGrams: string;
  onChangeDose: (dose: string) => void;
  waterGrams: string;
  onChangeWater: (water: string) => void;
  waterTempCelsius: string;
  onChangeWaterTemp: (temp: string) => void;
  grindSize: string;
  onChangeGrindSize: (grind: string) => void;
  currentRatio: number;
  unitSystem: 'metric' | 'imperial';
  t: any;
}

export const RecipeParamsCard: React.FC<RecipeParamsCardProps> = ({
  doseGrams,
  onChangeDose,
  waterGrams,
  onChangeWater,
  waterTempCelsius,
  onChangeWaterTemp,
  grindSize,
  onChangeGrindSize,
  currentRatio,
  unitSystem,
  t,
}) => {
  const doseNum = parseDecimal(doseGrams) || 0;
  const waterNum = parseDecimal(waterGrams) || 0;

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Parametry & Proporcja</Text>

      <View style={styles.row}>
        <View style={styles.flex1}>
          <Text style={styles.fieldLabel}>{t.recipeBuilder.doseLabel}</Text>
          <NumInput
            value={doseNum}
            onChangeNumber={(n) => onChangeDose(n.toString())}
            unit="g"
          />
        </View>
        <View style={[styles.flex1, { marginHorizontal: 10 }]}>
          <Text style={styles.fieldLabel}>{t.recipeBuilder.waterLabel}</Text>
          <NumInput
            value={waterNum}
            onChangeNumber={(n) => onChangeWater(n.toString())}
            unit="g"
          />
        </View>
        <View style={styles.flex1}>
          <Text style={styles.fieldLabel}>{t.recipeBuilder.tempLabel}</Text>
          <NumInput
            value={parseDecimal(waterTempCelsius) || 0}
            onChangeNumber={(n) => onChangeWaterTemp(n.toString())}
            unit="°C"
          />
        </View>
      </View>

      {/* Badge wyliczonego ratio */}
      <View style={styles.ratioBadge}>
        <Text style={styles.ratioBadgeText}>
          Wyliczona proporcja: <Text style={styles.ratioValue}>1 : {currentRatio}</Text>
        </Text>
      </View>

      {/* Podgląd w wybranym układzie jednostek */}
      <View style={styles.unitPreviewBadge}>
        <Text style={styles.unitPreviewBadgeText}>
          {formatDoseWeight(doseNum, unitSystem)} / {formatWaterWeight(waterNum, unitSystem)} · {formatTemperature(parseDecimal(waterTempCelsius) || 93, unitSystem)}
        </Text>
      </View>

      <Text style={styles.fieldLabel}>{t.recipeBuilder.grindLabel}</Text>
      <Field
        value={grindSize}
        onChangeText={onChangeGrindSize}
        placeholder={t.recipeBuilder.grindPlaceholder}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  flex1: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 6,
  },
  ratioBadge: {
    backgroundColor: theme.colors.copperMuted,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginVertical: 10,
    borderWidth: 1,
    borderColor: theme.colors.copper,
  },
  ratioBadgeText: {
    fontSize: 13,
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  ratioValue: {
    color: theme.colors.copper,
    fontWeight: '800',
    fontSize: 15,
  },
  unitPreviewBadge: {
    backgroundColor: theme.colors.bgCardSecondary,
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  unitPreviewBadgeText: {
    fontSize: 11,
    color: theme.colors.textMuted,
    fontWeight: '600',
  },
});

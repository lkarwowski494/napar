// ============================================================================
// Napar (Steepwise) — RecipeParamsCard Component
// Parameters, ratio badge, unit converter preview, and grind setting
// ============================================================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Field, NumInput } from '../ui';
import { theme } from '../../core/theme';
import { formatTemperature, formatDoseWeight, formatWaterWeight, gramsToOunces, mlToFluidOunces, celsiusToFahrenheit } from '../../core/unit-converter';

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
  const parsedDose = typeof doseGrams === 'number' ? doseGrams : parseFloat(String(doseGrams).replace(',', '.'));
  const doseNum = Number.isFinite(parsedDose) && parsedDose >= 0 ? Math.min(1000, parsedDose) : 0;

  const parsedWater = typeof waterGrams === 'number' ? waterGrams : parseFloat(String(waterGrams).replace(',', '.'));
  const waterNum = Number.isFinite(parsedWater) && parsedWater >= 0 ? Math.min(50000, parsedWater) : 0;

  const parsedTemp = typeof waterTempCelsius === 'number' ? waterTempCelsius : parseFloat(String(waterTempCelsius).replace(',', '.'));
  const tempNum = Number.isFinite(parsedTemp) && parsedTemp >= 0 ? Math.min(100, Math.max(0, parsedTemp)) : 93;

  const parsedRatio = typeof currentRatio === 'number'
    ? currentRatio
    : (typeof (currentRatio as any) === 'string'
      ? parseFloat(String(currentRatio).replace(',', '.'))
      : NaN);
  const safeRatio = Number.isFinite(parsedRatio) && parsedRatio > 0 && !Object.is(parsedRatio, -0)
    ? parsedRatio
    : 16.7;

  const isEn = typeof t?.brew?.recipe === 'string' && t?.brew?.recipe.toLowerCase() === 'recipe';
  const doseLabel = unitSystem === 'imperial'
    ? (t?.recipeBuilder?.doseLabelImperial || (isEn ? 'Dose (oz)' : 'Doza surowca (oz)'))
    : (t?.recipeBuilder?.doseLabel || (isEn ? 'Dose (g)' : 'Doza surowca (g)'));

  const waterLabel = unitSystem === 'imperial'
    ? (t?.recipeBuilder?.waterLabelImperial || (isEn ? 'Water (fl oz)' : 'Objętość wody (fl oz)'))
    : (t?.recipeBuilder?.waterLabel || (isEn ? 'Water (g)' : 'Objętość wody (g)'));

  const tempLabel = unitSystem === 'imperial'
    ? (t?.recipeBuilder?.tempLabelImperial || (isEn ? 'Temperature (°F)' : 'Temperatura (°F)'))
    : (t?.recipeBuilder?.tempLabel || (isEn ? 'Temperature (°C)' : 'Temperatura (°C)'));

  const grindLabel = t?.recipeBuilder?.grindLabel || (isEn ? 'Grind size' : 'Grubość mielenia');
  const grindPlaceholder = t?.recipeBuilder?.grindPlaceholder || (isEn ? 'e.g. Medium (22 clicks)' : 'np. Średnio (22 kliki)');
  const cardTitle = t?.recipeBuilder?.paramsAndRatio || (isEn ? 'Parameters & Ratio' : 'Parametry & Proporcja');
  const calculatedRatio = t?.recipeBuilder?.calculatedRatio || (isEn ? 'Calculated ratio' : 'Wyliczona proporcja');

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle} accessibilityRole="header">
        {cardTitle}
      </Text>

      <View style={styles.row}>
        <View style={styles.flex1}>
          <Text style={styles.fieldLabel}>{doseLabel}</Text>
          <NumInput
            value={unitSystem === 'imperial' ? gramsToOunces(doseNum) : doseNum}
            stored={doseNum}
            onChangeNumber={(n) => {
              const safe = Number.isFinite(n) && n >= 0 ? Math.min(1000, n) : 0;
              onChangeDose(safe.toString());
            }}
            unit={unitSystem === 'imperial' ? 'oz' : 'g'}
          />
        </View>
        <View style={[styles.flex1, { marginHorizontal: 10 }]}>
          <Text style={styles.fieldLabel}>{waterLabel}</Text>
          <NumInput
            value={unitSystem === 'imperial' ? mlToFluidOunces(waterNum) : waterNum}
            stored={waterNum}
            onChangeNumber={(n) => {
              const safe = Number.isFinite(n) && n >= 0 ? Math.min(50000, n) : 0;
              onChangeWater(safe.toString());
            }}
            unit={unitSystem === 'imperial' ? 'fl oz' : 'g'}
          />
        </View>
        <View style={styles.flex1}>
          <Text style={styles.fieldLabel}>{tempLabel}</Text>
          <NumInput
            value={
              unitSystem === 'imperial'
                ? celsiusToFahrenheit(tempNum)
                : tempNum
            }
            stored={tempNum}
            onChangeNumber={(n) => {
              const safe = Number.isFinite(n) && n >= 0 ? Math.min(100, Math.max(0, n)) : 0;
              onChangeWaterTemp(safe.toString());
            }}
            unit={unitSystem === 'imperial' ? '°F' : '°C'}
          />
        </View>
      </View>

      {/* Badge wyliczonego ratio */}
      <View
        style={styles.ratioBadge}
        accessibilityRole="summary"
        accessibilityLabel={`${calculatedRatio}: 1 do ${safeRatio}`}
        testID="recipe-ratio-badge"
      >
        <Text style={styles.ratioBadgeText}>
          {calculatedRatio}: <Text style={styles.ratioValue}>1 : {safeRatio}</Text>
        </Text>
      </View>

      {/* Podgląd w wybranym układzie jednostek */}
      <View
        style={styles.unitPreviewBadge}
        accessibilityRole="text"
        accessibilityLabel={`Podsumowanie jednostek: ${formatDoseWeight(doseNum, unitSystem)}, ${formatWaterWeight(waterNum, unitSystem)}, ${formatTemperature(tempNum, unitSystem)}`}
        testID="recipe-unit-preview-badge"
      >
        <Text style={styles.unitPreviewBadgeText}>
          {formatDoseWeight(doseNum, unitSystem)} / {formatWaterWeight(waterNum, unitSystem)} · {formatTemperature(tempNum, unitSystem)}
        </Text>
      </View>

      <Text style={styles.fieldLabel}>{grindLabel}</Text>
      <Field
        value={grindSize}
        onChangeText={(val) => onChangeGrindSize(typeof val === 'string' ? val.slice(0, 200) : '')}
        placeholder={grindPlaceholder}
        accessibilityLabel={grindLabel}
        accessibilityHint={isEn ? 'Enter grind size description or grinder setting' : 'Wpisz opis grubości mielenia lub nastawę młynka'}
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

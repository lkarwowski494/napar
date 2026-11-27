import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput } from 'react-native';
import {
  calculateBrewWater,
  calculateBrewDose,
  calculateLiquidYield,
} from '../../core/domain-rules';
import {
  formatDoseWeight,
  formatWaterWeight,
  gramsToOunces,
  mlToFluidOunces,
  ouncesToGramsExact,
  fluidOuncesToMl,
  parseLocaleFloat,
} from '../../core/unit-converter';
import { theme } from '../../core/theme';
import { formatTemplate } from '../../core/i18n';
import { GrinderConverterCard } from './GrinderConverterCard';

export interface BrewRatioTabProps {
  language: string;
  t: any;
  unitSystem: 'metric' | 'imperial';
  beveragePreference: 'coffee' | 'tea' | 'both';
}

function computeCupYield(waterGrams: number, doseGrams: number, ratio: number): number {
  // Espresso (ratio <= 3.0) określa docelową masę naparu w filiżance (nie wody przed absorpcją).
  if (ratio <= 3.0) {
    return Number(waterGrams.toFixed(1));
  }
  return calculateLiquidYield(waterGrams, doseGrams);
}

export const BrewRatioTab: React.FC<BrewRatioTabProps> = ({
  language,
  t,
  unitSystem,
  beveragePreference,
}) => {
  const isImperial = unitSystem === 'imperial';
  const [calcDirection, setCalcDirection] = useState<'doseToWater' | 'waterToDose'>('doseToWater');
  const [doseInput, setDoseInput] = useState(() => (isImperial ? String(gramsToOunces(18)) : '18'));
  const [waterInput, setWaterInput] = useState(() => (isImperial ? String(mlToFluidOunces(300)) : '300'));
  const [ratioVal, setRatioVal] = useState(16.6);
  const [waterCalcResult, setWaterCalcResult] = useState<number>(() =>
    calculateBrewWater(18, 16.6)
  );
  const [doseCalcResult, setDoseCalcResult] = useState<number>(() =>
    calculateBrewDose(300, 16.6)
  );
  const [yieldResult, setYieldResult] = useState<number>(() =>
    computeCupYield(calculateBrewWater(18, 16.6), 18, 16.6)
  );

  const toDoseGrams = (rawVal: number) => (isImperial ? ouncesToGramsExact(rawVal) : rawVal);
  const toWaterGrams = (rawVal: number) => (isImperial ? fluidOuncesToMl(rawVal) : rawVal);

  useEffect(() => {
    const nextDose = isImperial ? String(gramsToOunces(18)) : '18';
    const nextWater = isImperial ? String(mlToFluidOunces(300)) : '300';
    setDoseInput(nextDose);
    setWaterInput(nextWater);
    if (calcDirection === 'doseToWater') {
      const w = calculateBrewWater(18, ratioVal);
      setWaterCalcResult(w);
      setYieldResult(computeCupYield(w, 18, ratioVal));
    } else {
      const d = calculateBrewDose(300, ratioVal);
      setDoseCalcResult(d);
      setYieldResult(computeCupYield(300, d, ratioVal));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isImperial]);

  const handleDoseChange = (text: string) => {
    setDoseInput(text);
    const parsed = parseLocaleFloat(text);
    if (!isNaN(parsed) && parsed > 0) {
      const d = toDoseGrams(parsed);
      if (d > 0) {
        const w = calculateBrewWater(d, ratioVal);
        setWaterCalcResult(w);
        setYieldResult(computeCupYield(w, d, ratioVal));
      }
    }
  };

  const handleWaterChange = (text: string) => {
    setWaterInput(text);
    const parsed = parseLocaleFloat(text);
    if (!isNaN(parsed) && parsed > 0) {
      const w = toWaterGrams(parsed);
      if (w > 0) {
        const d = calculateBrewDose(w, ratioVal);
        setDoseCalcResult(d);
        setYieldResult(computeCupYield(w, d, ratioVal));
      }
    }
  };

  const handleRatioSelect = (newRatio: number) => {
    setRatioVal(newRatio);
    if (calcDirection === 'doseToWater') {
      const parsed = parseLocaleFloat(doseInput);
      if (!isNaN(parsed) && parsed > 0) {
        const d = toDoseGrams(parsed);
        if (d > 0) {
          const w = calculateBrewWater(d, newRatio);
          setWaterCalcResult(w);
          setYieldResult(computeCupYield(w, d, newRatio));
        }
      }
    } else {
      const parsed = parseLocaleFloat(waterInput);
      if (!isNaN(parsed) && parsed > 0) {
        const w = toWaterGrams(parsed);
        if (w > 0) {
          const d = calculateBrewDose(w, newRatio);
          setDoseCalcResult(d);
          setYieldResult(computeCupYield(w, d, newRatio));
        }
      }
    }
  };

  const handleDirectionChange = (dir: 'doseToWater' | 'waterToDose') => {
    setCalcDirection(dir);
    if (dir === 'doseToWater') {
      const parsed = parseLocaleFloat(doseInput);
      if (!isNaN(parsed) && parsed > 0) {
        const d = toDoseGrams(parsed);
        if (d > 0) {
          const w = calculateBrewWater(d, ratioVal);
          setWaterCalcResult(w);
          setYieldResult(computeCupYield(w, d, ratioVal));
        }
      }
    } else {
      const parsed = parseLocaleFloat(waterInput);
      if (!isNaN(parsed) && parsed > 0) {
        const w = toWaterGrams(parsed);
        if (w > 0) {
          const d = calculateBrewDose(w, ratioVal);
          setDoseCalcResult(d);
          setYieldResult(computeCupYield(w, d, ratioVal));
        }
      }
    }
  };

  return (
    <View>
      <Text style={styles.sectionHeader}>{t.dialin.ratioTitle || 'Kalkulator Proporcji (Brew Ratio)'}</Text>
      <Text style={styles.sectionSub}>
        {t.dialin.ratioSubtitle || 'Wprowadź gramaturę ziaren, aby otrzymać precyzyjną wagę wody i szacowany uzysk w filiżance.'}
      </Text>

      <View style={styles.calcCard}>
        {/* Przełącznik kierunku przeliczania */}
        <View style={styles.directionToggleRow}>
          <Pressable
            testID="calc-dir-doseToWater"
            accessibilityRole="button"
            accessibilityLabel={t.dialin.directionDoseToWater || 'Doza → Woda'}
            accessibilityState={{ selected: calcDirection === 'doseToWater' }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={[
              styles.directionBtn,
              calcDirection === 'doseToWater' && styles.directionBtnActive,
            ]}
            onPress={() => handleDirectionChange('doseToWater')}
          >
            <Text
              style={[
                styles.directionBtnText,
                calcDirection === 'doseToWater' && styles.directionBtnTextActive,
              ]}
            >
              {t.dialin.directionDoseToWater || 'Doza → Woda'}
            </Text>
          </Pressable>
          <Pressable
            testID="calc-dir-waterToDose"
            accessibilityRole="button"
            accessibilityLabel={t.dialin.directionWaterToDose || 'Woda → Doza'}
            accessibilityState={{ selected: calcDirection === 'waterToDose' }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={[
              styles.directionBtn,
              calcDirection === 'waterToDose' && styles.directionBtnActive,
            ]}
            onPress={() => handleDirectionChange('waterToDose')}
          >
            <Text
              style={[
                styles.directionBtnText,
                calcDirection === 'waterToDose' && styles.directionBtnTextActive,
              ]}
            >
              {t.dialin.directionWaterToDose || 'Woda → Doza'}
            </Text>
          </Pressable>
        </View>

        {calcDirection === 'doseToWater' ? (
          <>
            <Text style={styles.inputTitle}>{isImperial ? (t.dialin.doseInputLabelImperial || 'Doza suchej kawy / herbaty (oz)') : (t.dialin.doseInputLabel || 'Doza suchej kawy / herbaty (g)')}</Text>
            <TextInput
              testID="dose-input"
              accessibilityLabel={t.dialin.doseInputLabel || 'Doza suchej kawy / herbaty'}
              style={styles.calcInput}
              keyboardType="decimal-pad"
              value={doseInput}
              onChangeText={handleDoseChange}
              placeholder={isImperial ? '0.63' : '18'}
              placeholderTextColor={theme.colors.textMuted}
            />
          </>
        ) : (
          <>
            <Text style={styles.inputTitle}>{isImperial ? (t.dialin.waterInputLabelImperial || 'Docelowa objętość wody (fl oz)') : (t.dialin.waterInputLabel || 'Docelowa objętość wody (g)')}</Text>
            <TextInput
              testID="water-input"
              accessibilityLabel={t.dialin.waterInputLabel || 'Docelowa objętość wody'}
              style={styles.calcInput}
              keyboardType="decimal-pad"
              value={waterInput}
              onChangeText={handleWaterChange}
              placeholder={isImperial ? '10.14' : '300'}
              placeholderTextColor={theme.colors.textMuted}
            />
          </>
        )}

        <Text style={styles.inputTitle}>{t.dialin.ratioSelectLabel || 'Wybierz Ratio (Kawa : Woda)'}</Text>
        <View style={styles.ratioPresetsRow}>
          {[
            ...(beveragePreference !== 'tea' ? [{ r: 15.0, label: '1:15 (Mocna)' }] : []),
            ...(beveragePreference !== 'tea' ? [{ r: 16.6, label: '1:16.6 (Standard)' }] : []),
            ...(beveragePreference !== 'tea' ? [{ r: 17.5, label: '1:17.5 (Lekka)' }] : []),
            ...(beveragePreference !== 'coffee' ? [{ r: 20.0, label: '1:20 (Gongfu)' }] : []),
            ...(beveragePreference !== 'tea' ? [{ r: 2.0, label: '1:2 (Espresso)' }] : []),
            ...(beveragePreference !== 'coffee' ? [{ r: 50.0, label: '1:50 (Herbata)' }] : []),
          ].map((item) => (
            <Pressable
              key={item.r}
              testID={`ratio-chip-${item.r}`}
              accessibilityRole="button"
              accessibilityLabel={formatTemplate(t.dialin.ratioChipA11y, { ratio: item.label })}
              accessibilityState={{ selected: ratioVal === item.r }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={[
                styles.ratioChip,
                ratioVal === item.r && styles.ratioChipActive,
              ]}
              onPress={() => handleRatioSelect(item.r)}
            >
              <Text
                style={[
                  styles.ratioChipText,
                  ratioVal === item.r && styles.ratioChipTextActive,
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.resultsBox}>
          <View style={styles.resultItem}>
            <Text style={styles.resultLabel}>
              {calcDirection === 'doseToWater'
                ? (t.dialin.calculatedWater || 'WODA DO ZALANIA')
                : (t.dialin.calculatedDose || 'WYMAGANA DOZA ZIAREN')}
            </Text>
            <Text
              style={styles.resultVal}
              testID={calcDirection === 'doseToWater' ? 'calculated-water-output' : 'calculated-dose-output'}
            >
              {calcDirection === 'doseToWater'
                ? formatWaterWeight(waterCalcResult, unitSystem, language)
                : formatDoseWeight(doseCalcResult, unitSystem, language)}
            </Text>
          </View>
          <View style={styles.resultItem}>
            <Text style={styles.resultLabel}>{t.dialin.calculatedYield || 'UZYSK W FILIŻANCE'}</Text>
            <Text style={styles.resultValSecondary} testID="calculated-yield-output">
              {formatWaterWeight(yieldResult, unitSystem, language)}
            </Text>
            {ratioVal > 3.0 && (
              <Text style={styles.resultNote}>
                {t.dialin.absorptionNote || 'Po absorpcji 2.0g/g przez ciastko'}
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* PRZELICZNIK MŁYNKÓW (GRINDER DIAL-IN CONVERTER) */}
      <GrinderConverterCard language={language} t={t} />
    </View>
  );
};

const styles = StyleSheet.create({
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
  calcCard: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  directionToggleRow: {
    flexDirection: 'row',
    marginBottom: 14,
    backgroundColor: theme.colors.bgCardSecondary,
    borderRadius: theme.borderRadius.sm,
    padding: 3,
  },
  directionBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: theme.borderRadius.sm,
  },
  directionBtnActive: {
    backgroundColor: theme.colors.copper,
  },
  directionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  directionBtnTextActive: {
    color: theme.colors.onAccent,
    fontWeight: '700',
  },
  inputTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  calcInput: {
    backgroundColor: theme.colors.bgCardSecondary,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 14,
  },
  ratioPresetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  ratioChip: {
    backgroundColor: theme.colors.bgCardSecondary,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
  },
  ratioChipActive: {
    backgroundColor: theme.colors.copperMuted,
    borderColor: theme.colors.copper,
  },
  ratioChipText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  ratioChipTextActive: {
    color: theme.colors.copperLight,
    fontWeight: '700',
  },
  resultsBox: {
    backgroundColor: theme.colors.bgCardSecondary,
    borderRadius: theme.borderRadius.sm,
    padding: 14,
    gap: 12,
  },
  resultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  resultLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    letterSpacing: 0.5,
  },
  resultVal: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.copper,
  },
  resultValSecondary: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  resultNote: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
});

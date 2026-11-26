import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable } from 'react-native';
import { calculateExtractionYield, calculateLiquidYield } from '../../core/domain-rules';
import { parseLocaleFloat, formatDecimal } from '../../core/unit-converter';
import { theme, withAlpha } from '../../core/theme';

const EY_DEFAULTS = {
  pourover: { water: '250', dose: '15', tds: '1.35' },
  espresso: { water: '36', dose: '18', tds: '9.5' },
} as const;

export interface ExtractionYieldTabProps {
  language: string;
  t: any;
}

export const ExtractionYieldTab: React.FC<ExtractionYieldTabProps> = ({ language, t }) => {
  const [methodMode, setMethodMode] = useState<'pourover' | 'espresso'>('pourover');
  const [eyWater, setEyWater] = useState<string>(EY_DEFAULTS.pourover.water);
  const [eyDose, setEyDose] = useState<string>(EY_DEFAULTS.pourover.dose);
  const [eyTds, setEyTds] = useState<string>(EY_DEFAULTS.pourover.tds);

  const handleModeChange = (nextMode: 'pourover' | 'espresso') => {
    if (nextMode === methodMode) return;
    const prevDefaults = EY_DEFAULTS[methodMode];
    const nextDefaults = EY_DEFAULTS[nextMode];
    // Zamień wartości domyślne tylko gdy użytkownik nie wpisał własnych pomiarów
    if (
      eyWater.trim() === prevDefaults.water &&
      eyDose.trim() === prevDefaults.dose &&
      eyTds.trim() === prevDefaults.tds
    ) {
      setEyWater(nextDefaults.water);
      setEyDose(nextDefaults.dose);
      setEyTds(nextDefaults.tds);
    }
    setMethodMode(nextMode);
  };

  const eyResult = useMemo(() => {
    const w = parseLocaleFloat(eyWater);
    const d = parseLocaleFloat(eyDose);
    const tds = parseLocaleFloat(eyTds);
    if (!isNaN(w) && !isNaN(d) && !isNaN(tds) && w > 0 && d > 0 && tds > 0) {
      try {
        const beverageWeightGrams =
          methodMode === 'pourover' ? calculateLiquidYield(w, d) : w;
        return calculateExtractionYield(beverageWeightGrams, tds, d);
      } catch {
        return null;
      }
    }
    return null;
  }, [eyWater, eyDose, eyTds, methodMode]);

  const activePlaceholders = EY_DEFAULTS[methodMode];

  return (
    <View>
      <Text style={styles.sectionHeader}>{t.dialin.eyTitle || 'Kalkulator Wydajności Ekstrakcji (EY%)'}</Text>
      <Text style={styles.sectionSub}>
        {t.dialin.eySubtitle || 'Oblicz ekstrakcję (Extraction Yield) na podstawie TDS z refraktometru lub szacunków.'}
      </Text>

      <View style={styles.calcCard}>
        <View style={styles.modeRow}>
          <Pressable
            testID="ey-mode-pourover"
            accessibilityRole="button"
            accessibilityLabel={t?.dialin?.eyPouroverMode || 'Przelew (Pour-over)'}
            accessibilityState={{ selected: methodMode === 'pourover' }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={[styles.modeBtn, methodMode === 'pourover' && styles.modeBtnActive]}
            onPress={() => handleModeChange('pourover')}
          >
            <Text style={[styles.modeBtnText, methodMode === 'pourover' && styles.modeBtnTextActive]}>
              {t?.dialin?.eyPouroverMode || 'Przelew (Pour-over)'}
            </Text>
          </Pressable>
          <Pressable
            testID="ey-mode-espresso"
            accessibilityRole="button"
            accessibilityLabel={t?.dialin?.eyEspressoMode || 'Espresso'}
            accessibilityState={{ selected: methodMode === 'espresso' }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={[styles.modeBtn, methodMode === 'espresso' && styles.modeBtnActive]}
            onPress={() => handleModeChange('espresso')}
          >
            <Text style={[styles.modeBtnText, methodMode === 'espresso' && styles.modeBtnTextActive]}>
              {t?.dialin?.eyEspressoMode || 'Espresso'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.eyInputsRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.inputTitle}>
              {methodMode === 'pourover'
                ? t.dialin?.eyWaterInput || 'Woda zalana (g)'
                : t.dialin.eyEspressoYieldInput}
            </Text>
            <TextInput
              style={styles.calcInput}
              keyboardType="decimal-pad"
              value={eyWater}
              onChangeText={setEyWater}
              placeholder={activePlaceholders.water}
              placeholderTextColor={theme.colors.textMuted}
            />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.inputTitle}>{t.dialin.eyDoseInput || 'Doza ziaren (g)'}</Text>
            <TextInput
              style={styles.calcInput}
              keyboardType="decimal-pad"
              value={eyDose}
              onChangeText={setEyDose}
              placeholder={activePlaceholders.dose}
              placeholderTextColor={theme.colors.textMuted}
            />
          </View>
        </View>

        <Text style={[styles.inputTitle, { marginTop: 12 }]}>
          {t.dialin.eyTdsInput || (language === 'en' ? 'Refractometer TDS (%)' : 'TDS (%) z refraktometru')}
        </Text>
        <TextInput
          style={styles.calcInput}
          keyboardType="decimal-pad"
          value={eyTds}
          onChangeText={setEyTds}
          placeholder={activePlaceholders.tds}
          placeholderTextColor={theme.colors.textMuted}
        />

        {eyResult && (
          <View style={styles.eyResultBox}>
            <Text style={styles.resultLabel}>{t.dialin.eyResultLabel}</Text>
            <Text style={styles.eyLargeNumber}>
              {formatDecimal(eyResult.extractionYieldPercent, 1, language)}%
            </Text>

            {/* Ocena SCA (18–22% EY) dotyczy naparu przelewowego; dla espresso tylko wynik EY (M1-audytor-generalny-018, 06-tresci-011) */}
            {methodMode === 'pourover' && (
              <>
              <View
                style={[
                  styles.eyRatingBadge,
                  eyResult.rating === 'ideal'
                    ? styles.eyIdeal
                    : styles.eyWarning,
                ]}
              >
                <Text style={styles.eyRatingText}>
                  {eyResult.rating === 'ideal'
                    ? t.dialin.eyRatingIdeal
                    : eyResult.rating === 'under'
                    ? t.dialin.eyRatingUnder
                    : t.dialin.eyRatingOver}
                </Text>
              </View>

              <Text style={styles.eyDescriptionText}>
                {language === 'en' ? eyResult.descriptionEn : eyResult.descriptionPl}
              </Text>
              </>
            )}
          </View>
        )}
      </View>
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
  modeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    backgroundColor: theme.colors.bgCardSecondary,
  },
  modeBtnActive: {
    borderColor: theme.colors.copper,
    backgroundColor: theme.colors.copperMuted,
  },
  modeBtnText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  modeBtnTextActive: {
    color: theme.colors.copper,
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
  eyInputsRow: {
    flexDirection: 'row',
  },
  eyResultBox: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    alignItems: 'center',
  },
  resultLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  eyLargeNumber: {
    fontSize: 36,
    fontWeight: '800',
    color: theme.colors.copperLight,
    marginBottom: 8,
  },
  eyRatingBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
    marginBottom: 12,
  },
  eyIdeal: {
    backgroundColor: withAlpha(theme.colors.statusPeak, 0.2),
  },
  eyWarning: {
    backgroundColor: withAlpha(theme.colors.warning, 0.2),
  },
  eyRatingText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  eyDescriptionText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});

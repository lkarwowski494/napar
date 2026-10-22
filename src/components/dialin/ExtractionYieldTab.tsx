import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { calculateExtractionYield } from '../../core/domain-rules';
import { theme } from '../../core/theme';
import { parseDecimal } from '../../core/parse-decimal';

export interface ExtractionYieldTabProps {
  language: string;
  t: any;
}

export const ExtractionYieldTab: React.FC<ExtractionYieldTabProps> = ({ language, t }) => {
  const [eyWater, setEyWater] = useState('250');
  const [eyDose, setEyDose] = useState('15');
  const [eyTds, setEyTds] = useState('1.35');

  const eyResult = useMemo(() => {
    const w = parseDecimal(eyWater);
    const d = parseDecimal(eyDose);
    const tds = parseDecimal(eyTds);
    if (!isNaN(w) && !isNaN(d) && !isNaN(tds) && w > 0 && d > 0 && tds > 0) {
      try {
        return calculateExtractionYield({ beverageWeightGrams: w, tdsPercent: tds, doseGrams: d });
      } catch {
        return null;
      }
    }
    return null;
  }, [eyWater, eyDose, eyTds]);

  return (
    <View>
      <Text style={styles.sectionHeader}>{t.dialin.eyTitle || 'Kalkulator Wydajności Ekstrakcji (EY%)'}</Text>
      <Text style={styles.sectionSub}>
        {t.dialin.eySubtitle || 'Oblicz ekstrakcję (Extraction Yield) na podstawie TDS z refraktometru lub szacunków.'}
      </Text>

      <View style={styles.calcCard}>
        <View style={styles.eyInputsRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.inputTitle}>{t.dialin.eyWaterInput || 'Woda zalana (g)'}</Text>
            <TextInput
              style={styles.calcInput}
              keyboardType="numeric"
              value={eyWater}
              onChangeText={setEyWater}
              placeholder="250"
              placeholderTextColor={theme.colors.textMuted}
            />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.inputTitle}>{t.dialin.eyDoseInput || 'Doza ziaren (g)'}</Text>
            <TextInput
              style={styles.calcInput}
              keyboardType="numeric"
              value={eyDose}
              onChangeText={setEyDose}
              placeholder="15"
              placeholderTextColor={theme.colors.textMuted}
            />
          </View>
        </View>

        <Text style={[styles.inputTitle, { marginTop: 12 }]}>{t.dialin.eyTdsInput || 'TDS (%) z refraktometru'}</Text>
        <TextInput
          style={styles.calcInput}
          keyboardType="numeric"
          value={eyTds}
          onChangeText={setEyTds}
          placeholder="1.35"
          placeholderTextColor={theme.colors.textMuted}
        />

        {eyResult && (
          <View style={styles.eyResultBox}>
            <Text style={styles.resultLabel}>WYDAJNOŚĆ EKSTRAKCJI (EY)</Text>
            <Text style={styles.eyLargeNumber}>
              {eyResult.extractionYieldPercent}%
            </Text>

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
                  ? 'Złote Okno SCA (Idealna ekstrakcja)'
                  : eyResult.rating === 'under'
                  ? 'Niedoparzenie (< 18%)'
                  : 'Przeparzenie (> 22%)'}
              </Text>
            </View>

            <Text style={styles.eyDescriptionText}>
              {eyResult.descriptionPl}
            </Text>
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
    borderColor: theme.colors.border,
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
    backgroundColor: 'rgba(78, 159, 61, 0.2)',
  },
  eyWarning: {
    backgroundColor: 'rgba(217, 119, 6, 0.2)',
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

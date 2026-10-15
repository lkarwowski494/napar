// ============================================================================
// Napar (Steepwise) — Dial-in Doctor & Kalkulatory Ekstrakcji
// Deterministyczny kompas sensoryczny, dwukierunkowe Ratio i TDS / EY%
// ============================================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
} from 'react-native';
import {
  diagnoseExtractionTaste,
  calculateBrewWater,
  calculateBrewDose,
  calculateLiquidYield,
  calculateExtractionYield,
} from '../../src/core/domain-rules';
import { theme } from '../../src/core/theme';

export default function DialInScreen() {
  const [activeTab, setActiveTab] = useState<'doctor' | 'ratio' | 'ey'>('doctor');

  // Stan: Dial-in Doctor
  const [selectedIssue, setSelectedIssue] = useState<string>('sour');

  // Stan: Kalkulator Ratio
  const [doseInput, setDoseInput] = useState('18');
  const [ratioVal, setRatioVal] = useState(16.6);
  const [waterCalcResult, setWaterCalcResult] = useState<number>(() =>
    calculateBrewWater(18, 16.6)
  );
  const [yieldResult, setYieldResult] = useState<number>(() =>
    calculateLiquidYield(300, 18)
  );

  // Stan: Kalkulator TDS / EY
  const [eyWater, setEyWater] = useState('250');
  const [eyDose, setEyDose] = useState('15');
  const [eyTds, setEyTds] = useState('1.35');

  // Diagnoza kompasu
  const diagnosis = React.useMemo(() => {
    let list = [];
    switch (selectedIssue) {
      case 'sour':
        list = diagnoseExtractionTaste({ isSour: true });
        break;
      case 'bitter':
        list = diagnoseExtractionTaste({ isBitter: true });
        break;
      case 'weak':
        list = diagnoseExtractionTaste({ isWatery: true });
        break;
      case 'astringent_tea':
        list = diagnoseExtractionTaste({ isAstringent: true });
        break;
      default:
        list = diagnoseExtractionTaste({});
        break;
    }
    return list[0] || {
      issue: 'Balans w normie',
      recommendationPl: 'Filiżanka mieści się w standardowym oknie ekstrakcji.',
    };
  }, [selectedIssue]);

  const handleDoseChange = (text: string) => {
    setDoseInput(text);
    const d = parseFloat(text);
    if (!isNaN(d) && d > 0) {
      const w = calculateBrewWater(d, ratioVal);
      setWaterCalcResult(w);
      setYieldResult(calculateLiquidYield(w, d));
    }
  };

  const handleRatioSelect = (newRatio: number) => {
    setRatioVal(newRatio);
    const d = parseFloat(doseInput);
    if (!isNaN(d) && d > 0) {
      const w = calculateBrewWater(d, newRatio);
      setWaterCalcResult(w);
      setYieldResult(calculateLiquidYield(w, d));
    }
  };

  // Obliczenie EY%
  const eyResult = React.useMemo(() => {
    const w = parseFloat(eyWater);
    const d = parseFloat(eyDose);
    const tds = parseFloat(eyTds);
    if (!isNaN(w) && !isNaN(d) && !isNaN(tds) && w > 0 && d > 0 && tds > 0) {
      try {
        return calculateExtractionYield(w, d, tds);
      } catch {
        return null;
      }
    }
    return null;
  }, [eyWater, eyDose, eyTds]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Przełącznik zakładek */}
      <View style={styles.segmentBar}>
        <Pressable
          style={[styles.segmentBtn, activeTab === 'doctor' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('doctor')}
        >
          <Text
            style={[
              styles.segmentBtnText,
              activeTab === 'doctor' && styles.segmentBtnTextActive,
            ]}
          >
            🧭 Dial-in Doctor
          </Text>
        </Pressable>

        <Pressable
          style={[styles.segmentBtn, activeTab === 'ratio' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('ratio')}
        >
          <Text
            style={[
              styles.segmentBtnText,
              activeTab === 'ratio' && styles.segmentBtnTextActive,
            ]}
          >
            ⚖️ Ratio & Uzysk
          </Text>
        </Pressable>

        <Pressable
          style={[styles.segmentBtn, activeTab === 'ey' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('ey')}
        >
          <Text
            style={[
              styles.segmentBtnText,
              activeTab === 'ey' && styles.segmentBtnTextActive,
            ]}
          >
            🔬 TDS & EY%
          </Text>
        </Pressable>
      </View>

      {/* 1. DIAL-IN DOCTOR */}
      {activeTab === 'doctor' && (
        <View>
          <Text style={styles.sectionHeader}>Diagnoza Niepożądanego Smaku</Text>
          <Text style={styles.sectionSub}>
            Wybierz dominujący problem w filiżance. Kompas ekstrakcji wskaże precyzyjną korektę mielenia i temperatury.
          </Text>

          <View style={styles.issuesList}>
            {[
              {
                id: 'sour',
                title: '🍋 Zbyt kwaśna / ostra / trawiasta',
                desc: 'Brak słodyczy, cierpki finisz, cytrynowa kwasowość.',
              },
              {
                id: 'bitter',
                title: '🍫 Za gorzka / ściągająca / sucha',
                desc: 'Wrażenie suchości na języku (ashy), popiołowość, ciemna gorycz.',
              },
              {
                id: 'weak',
                title: '💧 Płaska / mdła / wodnista',
                desc: 'Brak ciała, herbaciana konsystencja bez wyrazistej słodyczy.',
              },
              {
                id: 'astringent_tea',
                title: '🍵 Herbata ściągająca gardło',
                desc: 'Zbyt wysoka temperatura zniszczyła subtelne katechiny i l-teaninę.',
              },
            ].map((issue) => (
              <Pressable
                key={issue.id}
                style={[
                  styles.issueCard,
                  selectedIssue === issue.id && styles.issueCardActive,
                ]}
                onPress={() => setSelectedIssue(issue.id)}
              >
                <Text style={styles.issueTitle}>{issue.title}</Text>
                <Text style={styles.issueDesc}>{issue.desc}</Text>
              </Pressable>
            ))}
          </View>

          {/* Wynik diagnozy */}
          <View style={styles.diagnosisCard}>
            <View style={styles.diagHeaderRow}>
              <Text style={styles.diagBadge}>RECEPTA SENSORYCZNA</Text>
              <Text style={styles.diagProblem}>{diagnosis.issue}</Text>
            </View>

            <Text style={styles.diagRecommendation}>
              {diagnosis.recommendationPl}
            </Text>

            <View style={styles.diagActionRow}>
              {diagnosis.grindAdjustment && (
                <View style={styles.diagActionBox}>
                  <Text style={styles.diagActionLabel}>KOREKTA MIELENIA</Text>
                  <Text style={styles.diagActionVal}>
                    {diagnosis.grindAdjustment === 'finer'
                      ? '▼ Zmiel drobniej (o 2–3 kliki)'
                      : '▲ Zmiel grubiej (o 2–4 kliki)'}
                  </Text>
                </View>
              )}

              {diagnosis.tempAdjustment && (
                <View style={styles.diagActionBox}>
                  <Text style={styles.diagActionLabel}>TEMPERATURA WODY</Text>
                  <Text style={styles.diagActionVal}>
                    {diagnosis.tempAdjustment === 'higher'
                      ? '🔥 Podnieś o +2°C do 95°C'
                      : '❄️ Obniż o 2–4°C'}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      )}

      {/* 2. KALKULATOR RATIO */}
      {activeTab === 'ratio' && (
        <View>
          <Text style={styles.sectionHeader}>Kalkulator Proporcji (Brew Ratio)</Text>
          <Text style={styles.sectionSub}>
            Wprowadź gramaturę ziaren, aby otrzymać precyzyjną wagę wody i szacowany uzysk w filiżance.
          </Text>

          <View style={styles.calcCard}>
            <Text style={styles.inputTitle}>Doza suchej kawy / herbaty (g)</Text>
            <TextInput
              style={styles.calcInput}
              keyboardType="numeric"
              value={doseInput}
              onChangeText={handleDoseChange}
              placeholder="18"
              placeholderTextColor={theme.colors.textMuted}
            />

            <Text style={styles.inputTitle}>Wybierz Ratio (Kawa : Woda)</Text>
            <View style={styles.ratioPresetsRow}>
              {[
                { r: 15.0, label: '1:15 (Mocna)' },
                { r: 16.6, label: '1:16.6 (Standard)' },
                { r: 17.5, label: '1:17.5 (Lekka)' },
                { r: 2.0, label: '1:2 (Espresso)' },
                { r: 50.0, label: '1:50 (Herbata)' },
              ].map((item) => (
                <Pressable
                  key={item.r}
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
                <Text style={styles.resultLabel}>WODA DO ZALANIA</Text>
                <Text style={styles.resultVal}>{waterCalcResult} g</Text>
              </View>
              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>UZYSK W FILIŻANCE</Text>
                <Text style={styles.resultValSecondary}>{yieldResult} g</Text>
                <Text style={styles.resultNote}>
                  Po absorpcji 2.0g/g przez ciastko
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* 3. KALKULATOR TDS & EY */}
      {activeTab === 'ey' && (
        <View>
          <Text style={styles.sectionHeader}>Extraction Yield (Wydajność Ekstrakcji)</Text>
          <Text style={styles.sectionSub}>
            Wprowadź parametry i odczyt refractometru TDS, aby zweryfikować czy Twoja filiżanka mieści się w złotym oknie SCA (18.0% – 22.0%).
          </Text>

          <View style={styles.calcCard}>
            <View style={styles.formRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputTitle}>Woda zalana (g)</Text>
                <TextInput
                  style={styles.calcInputSmall}
                  keyboardType="numeric"
                  value={eyWater}
                  onChangeText={setEyWater}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.inputTitle}>Doza kawy (g)</Text>
                <TextInput
                  style={styles.calcInputSmall}
                  keyboardType="numeric"
                  value={eyDose}
                  onChangeText={setEyDose}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.inputTitle}>TDS (%)</Text>
                <TextInput
                  style={styles.calcInputSmall}
                  keyboardType="numeric"
                  value={eyTds}
                  onChangeText={setEyTds}
                />
              </View>
            </View>

            {eyResult && (
              <View style={styles.eyResultBox}>
                <Text style={styles.eyTitle}>WYDAJNOŚĆ EKSTRAKCJI (EY)</Text>
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
                      ? '✓ Złote Okno SCA (Idealna ekstrakcja)'
                      : eyResult.rating === 'under'
                      ? '⚠ Niedoparzenie (< 18%)'
                      : '⚠ Przeparzenie (> 22%)'}
                  </Text>
                </View>

                <Text style={styles.eyDescriptionText}>
                  {eyResult.descriptionPl}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  content: {
    padding: theme.spacing.md,
    paddingBottom: 40,
  },
  segmentBar: {
    flexDirection: 'row',
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.md,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: theme.borderRadius.sm,
  },
  segmentBtnActive: {
    backgroundColor: theme.colors.copper,
  },
  segmentBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  segmentBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
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
  issuesList: {
    gap: 10,
    marginBottom: 16,
  },
  issueCard: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  issueCardActive: {
    borderColor: theme.colors.copper,
    backgroundColor: theme.colors.copperMuted,
  },
  issueTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  issueDesc: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  diagnosisCard: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: theme.colors.copper,
    marginBottom: 20,
  },
  diagHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  diagBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.copper,
    letterSpacing: 0.5,
  },
  diagProblem: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  diagRecommendation: {
    fontSize: 15,
    color: theme.colors.textPrimary,
    lineHeight: 22,
    marginBottom: 14,
  },
  diagActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  diagActionBox: {
    flex: 1,
    backgroundColor: theme.colors.bgCardSecondary,
    padding: 10,
    borderRadius: theme.borderRadius.sm,
  },
  diagActionLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: theme.colors.textMuted,
    marginBottom: 2,
  },
  diagActionVal: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.copperLight,
  },
  calcCard: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  inputTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 6,
    marginTop: 6,
  },
  calcInput: {
    backgroundColor: theme.colors.bgCardSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 14,
  },
  calcInputSmall: {
    backgroundColor: theme.colors.bgCardSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: 14,
  },
  ratioPresetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
  },
  ratioChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.bgCardSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  ratioChipActive: {
    backgroundColor: theme.colors.copperMuted,
    borderColor: theme.colors.copper,
  },
  ratioChipText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  ratioChipTextActive: {
    color: theme.colors.copper,
    fontWeight: '700',
  },
  resultsBox: {
    backgroundColor: theme.colors.bgCardSecondary,
    borderRadius: theme.borderRadius.md,
    padding: 16,
    flexDirection: 'row',
  },
  resultItem: {
    flex: 1,
    alignItems: 'center',
  },
  resultLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.textMuted,
    marginBottom: 4,
  },
  resultVal: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.copper,
  },
  resultValSecondary: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  resultNote: {
    fontSize: 10,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: 2,
  },
  formRow: {
    flexDirection: 'row',
  },
  eyResultBox: {
    backgroundColor: theme.colors.bgCardSecondary,
    borderRadius: theme.borderRadius.md,
    padding: 18,
    alignItems: 'center',
    marginTop: 10,
  },
  eyTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textMuted,
    letterSpacing: 0.5,
  },
  eyLargeNumber: {
    fontSize: 44,
    fontWeight: '800',
    color: theme.colors.copper,
    marginVertical: 4,
    fontVariant: ['tabular-nums'],
  },
  eyRatingBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: theme.borderRadius.full,
    marginBottom: 10,
  },
  eyIdeal: {
    backgroundColor: theme.colors.statusPeakMuted,
  },
  eyWarning: {
    backgroundColor: theme.colors.copperMuted,
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

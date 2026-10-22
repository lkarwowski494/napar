// ============================================================================
// Napar (Steepwise) — BrewFinishModal Component (Cupping Sheet & Dial-in Doctor)
// Evaluates taste, suggests 1-tap dial-in diagnosis, shows craft economics.
// Apps4Brew Studio — 100% Offline-First.
// ============================================================================

import React, { useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
} from 'react-native';
import { theme } from '../../core/theme';
import { useTranslation } from '../../core/i18n';
import { BrewCostMetrics } from '../../core/cost-calculator';
import {
  SensoryProfile,
  SensoryRadarChart,
  SensoryScoreEditor,
} from '../../core/radar-chart';
import { FlavorWheelPicker } from '../../core/flavor-wheel-picker';
import { WATER_RECIPES } from '../../core/water-chemistry';
import { diagnoseExtractionTaste } from '../../core/domain-rules';
import { CompassIcon, StarIcon } from '../icons/CraftIcons';

interface BrewFinishModalProps {
  visible: boolean;
  /** Typ napoju parzenia: kawa (RD-05) lub herbata (RD-05b, poz. 24 MVP). */
  beverageType: 'COFFEE' | 'TEA';
  totalElapsedSeconds: number;
  waterGrams: number;
  rating: number;
  onChangeRating: (stars: number) => void;
  tasteBalance: string;
  onChangeTasteBalance: (balance: string) => void;
  sensoryProfile: SensoryProfile;
  onChangeSensoryProfile: (profile: SensoryProfile) => void;
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  waterProfile: string;
  onChangeWaterProfile: (id: string) => void;
  tdsInput: string;
  onChangeTdsInput: (tds: string) => void;
  notes: string;
  onChangeNotes: (notes: string) => void;
  brewCost: BrewCostMetrics;
  onSkip: () => void;
  onSave: () => void;
}

export function BrewFinishModal({
  visible,
  beverageType,
  totalElapsedSeconds,
  waterGrams,
  rating,
  onChangeRating,
  tasteBalance,
  onChangeTasteBalance,
  sensoryProfile,
  onChangeSensoryProfile,
  selectedTags,
  onToggleTag,
  waterProfile,
  onChangeWaterProfile,
  tdsInput,
  onChangeTdsInput,
  notes,
  onChangeNotes,
  brewCost,
  onSkip,
  onSave,
}: BrewFinishModalProps) {
  const { t } = useTranslation();

  // Dial-in Doctor: ta sama diagnoza co w zakładce dial-in (RD-05 dla kawy, RD-05b dla herbaty, domain-rules.ts).
  // Herbata nie ma reguły dla „za kwaśnej” (tylko cierpkość i wodnistość), więc takie wpisy nie dają diagnozy.
  const doctorDiagnosis = useMemo(() => {
    if (tasteBalance === 'sour') return diagnoseExtractionTaste({ beverageType, isSour: true })[0];
    if (tasteBalance === 'bitter') return diagnoseExtractionTaste({ beverageType, isBitter: true })[0];
    if (tasteBalance === 'weak') return diagnoseExtractionTaste({ beverageType, isWatery: true })[0];
    return undefined;
  }, [tasteBalance, beverageType]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 }}
          >
            <Text style={styles.modalTitle}>Zakończono Parzenie!</Text>
            <Text style={styles.modalSub}>
              {`Czas: ${formatTime(totalElapsedSeconds)} · Woda: ${Math.round(waterGrams)}g`}
            </Text>

            {/* Ocena w gwiazdkach */}
            <Text style={styles.sectionLabel}>Twoja Ocena</Text>
            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Pressable style={styles.touchTarget}
                  key={s}
                  testID={`star-rating-${s}`}
                  onPress={() => onChangeRating(s)}
                  accessibilityRole="button"
                  accessibilityLabel={`Ocena ${s} z 5`}
                >
                  <Text style={[styles.starIcon, rating >= s && styles.starActive]}>
                    ★
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Balans smaku */}
            <Text style={styles.sectionLabel}>Profil Balansu</Text>
            <View style={styles.balanceRow}>
              {[
                { key: 'balanced', label: 'Zbalansowana' },
                { key: 'sour', label: 'Za kwaśna' },
                { key: 'bitter', label: 'Za gorzka' },
                { key: 'weak', label: 'Wodnista' },
              ].map((b) => (
                <Pressable
                  key={b.key}
                  testID={`taste-chip-${b.key}`}
                  style={[
                    styles.balanceChip,
                    tasteBalance === b.key && styles.balanceChipActive, styles.touchTarget,
                  ]}
                  onPress={() => onChangeTasteBalance(b.key)}
                  accessibilityRole="button"
                  accessibilityLabel={`Balans: ${b.label}`}
                >
                  <Text
                    style={[
                      styles.balanceChipText,
                      tasteBalance === b.key && styles.balanceChipTextActive,
                    ]}
                  >
                    {b.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Dial-in Doctor: 1-Tap Diagnoza i Recepta Ratunkowa */}
            {doctorDiagnosis && (
              <View style={styles.doctorAdviceCard} testID={`doctor-advice-${tasteBalance}`}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <CompassIcon size={14} color={theme.colors.copper} />
                  <Text style={styles.doctorTitle}>Recepta Dial-in Doctor:</Text>
                </View>
                <Text style={styles.doctorBold}>{doctorDiagnosis.issue}</Text>
                <Text style={styles.doctorText}>{doctorDiagnosis.recommendationPl}</Text>
              </View>
            )}

            {tasteBalance === 'balanced' && (
              <View style={[styles.doctorAdviceCard, styles.doctorAdviceSuccess]} testID="doctor-advice-balanced">
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <StarIcon size={14} color="#4CAF50" filled />
                  <Text style={styles.doctorTitleSuccess}>Idealny Balans:</Text>
                </View>
                <Text style={styles.doctorText}>
                  Wzorcowa ekstrakcja specialty. Zapisz tę sesję w Dzienniku, aby powtórzyć parametry!
                </Text>
              </View>
            )}

            {/* Wykres Sensoryki SCA Spider Graph */}
            <Text style={[styles.sectionLabel, { marginTop: 14 }]}>
              {t.sensory.title}
            </Text>
            <Text style={styles.sectionSub}>
              {t.sensory.subtitle}
            </Text>
            <SensoryRadarChart profile={sensoryProfile} size={190} />
            <SensoryScoreEditor
              profile={sensoryProfile}
              onChange={onChangeSensoryProfile}
            />

            {/* Hierarchiczne Koło Smaków SCA */}
            <Text style={[styles.sectionLabel, { marginTop: 14 }]}>Koło Smaków SCA</Text>
            <FlavorWheelPicker
              selectedDescriptors={selectedTags}
              onToggleDescriptor={onToggleTag}
            />

            {/* Profil wody użytej do parzenia */}
            <Text style={[styles.sectionLabel, { marginTop: 14 }]}>Woda użyta do parzenia</Text>
            <View style={styles.waterChipsRow}>
              {WATER_RECIPES.map((w) => {
                const active = waterProfile === w.id;
                return (
                  <Pressable
                    key={w.id}
                    testID={`water-chip-${w.id}`}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={`Woda ${w.namePl}, GH ${w.targetGhPpm}, KH ${w.targetKhPpm}`}
                    style={[styles.waterChip, active && styles.waterChipActive, styles.touchTarget]}
                    onPress={() => onChangeWaterProfile(w.id)}
                  >
                    <Text style={[styles.waterChipText, active && styles.waterChipTextActive]}>
                      {w.namePl}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Opcjonalny TDS */}
            <View style={styles.tdsInputRow}>
              <Text style={styles.tdsInputLabel}>Odczyt TDS refractometru (%):</Text>
              <TextInput
                style={styles.tdsTextInput}
                placeholder="np. 1.35"
                placeholderTextColor={theme.colors.textMuted}
                keyboardType="numeric"
                value={tdsInput}
                onChangeText={onChangeTdsInput}
              />
            </View>

            {/* Notatki baristy */}
            <Text style={styles.sectionLabel}>Notatki Baristy</Text>
            <TextInput
              testID="finish-notes-input"
              style={styles.notesInput}
              placeholder="np. słodka brzoskwinia, delikatna jaśminowa kwasowość..."
              placeholderTextColor={theme.colors.textMuted}
              value={notes}
              onChangeText={onChangeNotes}
              multiline
            />

            {/* Ekonomia Rzemiosła (Koszt vs Kawiarnia) */}
            <View style={styles.finishCostCard} testID="finish-cost-card">
              <Text style={styles.finishCostTitle}>Ekonomia Rzemiosła</Text>
              <Text style={styles.finishCostSubtitle}>
                {`Koszt tego naparu: ${brewCost.totalHomeCost.toFixed(2)} PLN (ziarna: ${brewCost.coffeeCost.toFixed(2)} zł, woda: ${brewCost.waterCost.toFixed(2)} zł)`}
              </Text>
              <Text style={styles.finishCostSavings}>
                {`Oszczędność vs kawiarnia specialty (18 zł): `}
                <Text style={styles.finishCostSavingsBold}>
                  {`+${brewCost.savingsPerCup.toFixed(2)} PLN`}
                </Text>
              </Text>
            </View>

            {/* Przyciski Pomiń / Zapisz */}
            <View style={styles.finishButtonsRow}>
              <Pressable
                testID="finish-skip-btn"
                style={[styles.finishCancelBtn, styles.touchTarget]}
                onPress={onSkip}
                accessibilityRole="button"
                accessibilityLabel="Pomiń zapis"
              >
                <Text style={styles.finishCancelText}>Pomiń</Text>
              </Pressable>
              <Pressable
                testID="finish-save-btn"
                style={[styles.finishSaveBtn, styles.touchTarget]}
                onPress={onSave}
                accessibilityRole="button"
                accessibilityLabel="Zapisz w Dzienniku"
              >
                <Text style={styles.finishSaveText}>Zapisz w Dzienniku</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  touchTarget: { minWidth: 44, minHeight: 44 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.bgCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderTopWidth: 1,
    borderColor: theme.colors.border,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  modalSub: {
    fontSize: 14,
    color: theme.colors.copper,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 18,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 8,
    marginTop: 10,
  },
  sectionSub: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginBottom: 8,
  },
  starRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 10,
  },
  starIcon: {
    fontSize: 32,
    color: theme.colors.border,
  },
  starActive: {
    color: '#FFD700',
  },
  balanceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  balanceChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.bgCardSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  balanceChipActive: {
    backgroundColor: theme.colors.copperMuted,
    borderColor: theme.colors.copper,
  },
  balanceChipText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  balanceChipTextActive: {
    color: theme.colors.copper,
    fontWeight: '600',
  },
  doctorAdviceCard: {
    backgroundColor: 'rgba(217, 119, 54, 0.12)',
    borderWidth: 1,
    borderColor: theme.colors.copper,
    borderRadius: theme.borderRadius.md,
    padding: 12,
    marginBottom: 14,
  },
  doctorAdviceSuccess: {
    backgroundColor: 'rgba(76, 175, 80, 0.12)',
    borderColor: '#4CAF50',
  },
  doctorTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.copper,
    marginBottom: 4,
  },
  doctorTitleSuccess: {
    fontSize: 13,
    fontWeight: '800',
    color: '#4CAF50',
    marginBottom: 4,
  },
  doctorText: {
    fontSize: 13,
    color: theme.colors.textPrimary,
    lineHeight: 18,
  },
  doctorBold: {
    fontWeight: '800',
    color: theme.colors.copper,
  },
  waterChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  waterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.bgCardSecondary,
  },
  waterChipActive: {
    borderColor: theme.colors.copper,
    backgroundColor: theme.colors.copperMuted,
  },
  waterChipText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  waterChipTextActive: {
    color: theme.colors.textPrimary,
    fontWeight: '700',
  },
  tdsInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 14,
  },
  tdsInputLabel: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  tdsTextInput: {
    backgroundColor: theme.colors.bgCardSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: 12,
    paddingVertical: 6,
    color: theme.colors.textPrimary,
    width: 90,
    textAlign: 'center',
    fontSize: 14,
  },
  notesInput: {
    backgroundColor: theme.colors.bgCardSecondary,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 12,
    color: theme.colors.textPrimary,
    fontSize: 13,
    minHeight: 60,
    marginBottom: 14,
  },
  finishCostCard: {
    backgroundColor: theme.colors.bgCardSecondary,
    borderRadius: theme.borderRadius.md,
    padding: 14,
    marginTop: 6,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  finishCostTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.copper,
    marginBottom: 4,
  },
  finishCostSubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 6,
  },
  finishCostSavings: {
    fontSize: 13,
    color: theme.colors.textPrimary,
  },
  finishCostSavingsBold: {
    fontWeight: '700',
    color: '#4CAF50',
  },
  finishButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  finishCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.bgCardSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  finishCancelText: {
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  finishSaveBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.copper,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  finishSaveText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

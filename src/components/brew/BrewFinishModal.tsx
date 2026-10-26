// ============================================================================
// Napar (Steepwise) — BrewFinishModal Component (Cupping Sheet & Dial-in Doctor)
// Evaluates taste, suggests 1-tap dial-in diagnosis, shows craft economics.
// Apps4Brew Studio — 100% Offline-First.
// ============================================================================

import React from 'react';
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
import { CompassIcon, StarIcon } from '../icons/CraftIcons';

interface BrewFinishModalProps {
  visible: boolean;
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
  language?: 'pl' | 'en';
  onSkip: () => void;
  onSave: () => void;
}

export function BrewFinishModal({
  visible,
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
  language: propLanguage,
  onSkip,
  onSave,
}: BrewFinishModalProps) {
  const { t, language: contextLang } = useTranslation();
  const language = propLanguage || contextLang || 'pl';
  const curr = language === 'pl' ? 'PLN' : '$';

  if (!visible) return null;

  const formatTime = (seconds: number) => {
    const s = Math.max(0, Math.floor(Number(seconds) || 0));
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const safeTotalHomeCost = (brewCost?.totalHomeCost ?? 0).toFixed(2);
  const safeCoffeeCost = (brewCost?.coffeeCost ?? 0).toFixed(2);
  const safeWaterCost = (brewCost?.waterCost ?? 0).toFixed(2);
  const safeCafePrice = (brewCost?.cafePrice ?? 0).toFixed(0);
  const safeSavingsPerCup = (brewCost?.savingsPerCup ?? 0).toFixed(2);

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 }}
          >
            <Text style={styles.modalTitle}>{t.brew?.finishModalTitle || 'Zakończono Parzenie!'}</Text>
            <Text style={styles.modalSub}>
              {(t.brew?.finishTimeWater || (language === 'pl' ? 'Czas: {time} · Woda: {water}g' : 'Time: {time} · Water: {water}g'))
                .replace('{time}', formatTime(totalElapsedSeconds))
                .replace('{water}', String(Math.round(waterGrams)))}
            </Text>

            {/* Ocena w gwiazdkach */}
            <Text style={styles.sectionLabel}>{t.brew?.yourRating || 'Twoja Ocena'}</Text>
            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Pressable
                  key={s}
                  testID={`star-rating-${s}`}
                  onPress={() => onChangeRating(s)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: rating >= s }}
                  accessibilityLabel={(t.brew?.starRatingLabel || (language === 'pl' ? 'Ocena {rating} z 5' : 'Rating {rating} of 5')).replace('{rating}', String(s))}
                >
                  <Text style={[styles.starIcon, rating >= s && styles.starActive]}>
                    ★
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Balans smaku */}
            <Text style={styles.sectionLabel}>{t.brew?.tasteProfileLabel || 'Profil Balansu'}</Text>
            <View style={styles.balanceRow} accessibilityRole="radiogroup">
              {[
                { key: 'balanced', label: t.brew?.tasteBalanced || 'Zbalansowana' },
                { key: 'sour', label: t.brew?.tasteSour || 'Za kwaśna' },
                { key: 'bitter', label: t.brew?.tasteBitter || 'Za gorzka' },
                { key: 'weak', label: t.brew?.tasteWeak || 'Wodnista' },
              ].map((b) => (
                <Pressable
                  key={b.key}
                  testID={`taste-chip-${b.key}`}
                  style={[
                    styles.balanceChip,
                    tasteBalance === b.key && styles.balanceChipActive,
                  ]}
                  onPress={() => onChangeTasteBalance(b.key)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: tasteBalance === b.key }}
                  accessibilityLabel={b.label}
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
            {tasteBalance === 'sour' && (
              <View style={styles.doctorAdviceCard} testID="doctor-advice-sour">
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <CompassIcon size={14} color={theme.colors.copper} />
                  <Text style={styles.doctorTitle}>{t.brew?.doctorRecipeTitle || 'Recepta Dial-in Doctor:'}</Text>
                </View>
                <Text style={styles.doctorText}>
                  {t.brew?.doctorSourAdvice ||
                    (language === 'en'
                      ? 'Too sour (under-extracted)? Next time: grind finer by 2 clicks or raise water temperature by +2°C.'
                      : 'Za kwaśna (niedoparzenie)? Następnym razem: zmiel drobniej o 2 kliki lub podnieś temperaturę wody o +2°C.')}
                </Text>
              </View>
            )}

            {tasteBalance === 'bitter' && (
              <View style={styles.doctorAdviceCard} testID="doctor-advice-bitter">
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <CompassIcon size={14} color={theme.colors.copper} />
                  <Text style={styles.doctorTitle}>{t.brew?.doctorRecipeTitle || 'Recepta Dial-in Doctor:'}</Text>
                </View>
                <Text style={styles.doctorText}>
                  {t.brew?.doctorBitterAdvice ||
                    (language === 'en'
                      ? 'Too bitter / astringent (over-extracted)? Next time: grind coarser by 2 clicks or lower water temperature by -2°C.'
                      : 'Za gorzka / ściągająca (przeparzenie)? Następnym razem: zmiel grubiej o 2 kliki lub obniż temperaturę wody o -2°C.')}
                </Text>
              </View>
            )}

            {tasteBalance === 'weak' && (
              <View style={styles.doctorAdviceCard} testID="doctor-advice-weak">
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <CompassIcon size={14} color={theme.colors.copper} />
                  <Text style={styles.doctorTitle}>{t.brew?.doctorRecipeTitle || 'Recepta Dial-in Doctor:'}</Text>
                </View>
                <Text style={styles.doctorText}>
                  {t.brew?.doctorWeakAdvice ||
                    (language === 'en'
                      ? 'Too watery (low extraction)? Increase dose by +1.5g or extend water contact time.'
                      : 'Zbyt wodnista (niska ekstrakcja)? Zwiększ dozę o +1.5g lub wydłuż czas kontaktu z wodą.')}
                </Text>
              </View>
            )}

            {tasteBalance === 'balanced' && (
              <View style={[styles.doctorAdviceCard, styles.doctorAdviceSuccess]} testID="doctor-advice-balanced">
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <StarIcon size={14} color="#4CAF50" filled />
                  <Text style={styles.doctorTitleSuccess}>{t.brew?.doctorBalancedTitle || 'Idealny Balans:'}</Text>
                </View>
                <Text style={styles.doctorText}>
                  {t.brew?.doctorBalancedAdvice || 'Wzorcowa ekstrakcja specialty. Zapisz tę sesję w Dzienniku, aby powtórzyć parametry!'}
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
            <Text style={[styles.sectionLabel, { marginTop: 14 }]}>{t.brew?.flavorWheelTitle || 'Koło Smaków SCA'}</Text>
            <FlavorWheelPicker
              selectedDescriptors={selectedTags}
              onToggleDescriptor={onToggleTag}
              language={language}
            />

            {/* Profil wody użytej do parzenia */}
            <Text style={[styles.sectionLabel, { marginTop: 14 }]}>{t.brew?.waterUsedTitle || 'Woda użyta do parzenia'}</Text>
            <View style={styles.waterChipsRow}>
              {WATER_RECIPES.map((w) => {
                const active = waterProfile === w.id;
                const waterName = language === 'pl' ? w.namePl : w.nameEn;
                return (
                  <Pressable
                    key={w.id}
                    testID={`water-chip-${w.id}`}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={`${language === 'pl' ? 'Woda' : 'Water'} ${waterName}, GH ${w.targetGhPpm}, KH ${w.targetKhPpm}`}
                    style={[styles.waterChip, active && styles.waterChipActive]}
                    onPress={() => onChangeWaterProfile(w.id)}
                  >
                    <Text style={[styles.waterChipText, active && styles.waterChipTextActive]}>
                      {waterName}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Opcjonalny TDS */}
            <View style={styles.tdsInputRow}>
              <Text style={styles.tdsInputLabel}>{t.brew?.tdsLabel || 'Odczyt TDS refractometru (%):'}</Text>
              <TextInput
                testID="tds-input"
                style={styles.tdsTextInput}
                placeholder={t.brew?.tdsPlaceholder || 'np. 1.35'}
                placeholderTextColor={theme.colors.textMuted}
                keyboardType="numeric"
                maxLength={6}
                accessibilityLabel={t.brew?.tdsLabel || 'Odczyt TDS refractometru (%)'}
                value={tdsInput}
                onChangeText={onChangeTdsInput}
              />
            </View>

            {/* Notatki baristy */}
            <Text style={styles.sectionLabel}>{t.brew?.baristaNotesTitle || 'Notatki Baristy'}</Text>
            <TextInput
              testID="finish-notes-input"
              style={styles.notesInput}
              placeholder={t.brew?.baristaNotesPlaceholder || 'np. słodka brzoskwinia, delikatna jaśminowa kwasowość...'}
              placeholderTextColor={theme.colors.textMuted}
              value={notes}
              onChangeText={onChangeNotes}
              maxLength={1000}
              accessibilityLabel={t.brew?.baristaNotesTitle || 'Notatki Baristy'}
              multiline
            />

            {/* Ekonomia Rzemiosła (Koszt vs Kawiarnia) */}
            <View style={styles.finishCostCard} testID="finish-cost-card">
              <Text style={styles.finishCostTitle}>{t.brew?.craftEconomicsTitle || 'Ekonomia Rzemiosła'}</Text>
              <Text style={styles.finishCostSubtitle}>
                {language === 'pl'
                  ? `Koszt tego naparu: ${safeTotalHomeCost} PLN (ziarna: ${safeCoffeeCost} zł, woda: ${safeWaterCost} zł)`
                  : (t.brew?.craftCostPerCup || 'Cost of this brew: {total} {curr} (beans: {beans} {curr}, water: {water} {curr})')
                      .replace('{total}', safeTotalHomeCost)
                      .replace('{beans}', safeCoffeeCost)
                      .replace('{water}', safeWaterCost)
                      .replace(/{curr}/g, curr)}
              </Text>
              <Text style={styles.finishCostSavings}>
                {language === 'pl'
                  ? `Oszczędność vs kawiarnia specialty (${safeCafePrice} zł): `
                  : (t.brew?.craftSavingsLabel || `Savings vs cafe cup (${curr}${safeCafePrice}): `) + ' '}
                <Text style={styles.finishCostSavingsBold}>
                  {language === 'pl'
                    ? `+${safeSavingsPerCup} PLN`
                    : `+${curr}${safeSavingsPerCup}`}
                </Text>
              </Text>
            </View>

            {/* Przyciski Pomiń / Zapisz */}
            <View style={styles.finishButtonsRow}>
              <Pressable
                testID="finish-skip-btn"
                style={styles.finishCancelBtn}
                onPress={onSkip}
                accessibilityRole="button"
                accessibilityLabel={t.brew?.skipBtn || 'Pomiń'}
              >
                <Text style={styles.finishCancelText}>{t.brew?.skipBtn || 'Pomiń'}</Text>
              </Pressable>
              <Pressable
                testID="finish-save-btn"
                style={styles.finishSaveBtn}
                onPress={onSave}
                accessibilityRole="button"
                accessibilityLabel={t.brew?.saveToJournalBtn || 'Zapisz w Dzienniku'}
              >
                <Text style={styles.finishSaveText}>{t.brew?.saveToJournalBtn || 'Zapisz w Dzienniku'}</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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

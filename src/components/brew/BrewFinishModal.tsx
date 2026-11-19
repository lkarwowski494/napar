// ============================================================================
// Napar — BrewFinishModal Component (Cupping Sheet & Dial-in Doctor)
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
import { theme, withAlpha } from '../../core/theme';
import { useTranslation, formatTemplate } from '../../core/i18n';
import { formatTemperatureDelta, UnitSystem } from '../../core/unit-converter';
import {
  SensoryProfile,
  SensoryRadarChart,
  SensoryScoreEditor,
} from '../../core/radar-chart';
import { FlavorWheelPicker } from '../../core/flavor-wheel-picker';
import { WATER_RECIPES } from '../../core/water-chemistry';
import { CompassIcon, StarIcon } from '../icons/CraftIcons';
import { ModalHeader } from '../ui';

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
  notes: string;
  onChangeNotes: (notes: string) => void;
  language?: 'pl' | 'en';
  /** M1-audytor-generalny-034: jednostka różnicy temperatury w poradach */
  unitSystem?: UnitSystem;
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
  notes,
  onChangeNotes,
  language: propLanguage,
  onSkip,
  onSave,
  unitSystem = 'metric',
}: BrewFinishModalProps) {
  const { t, language: contextLang } = useTranslation();
  const language = propLanguage || contextLang || 'pl';

  if (!visible) return null;

  const formatTime = (seconds: number | string) => {
    let rawS = 0;
    if (typeof seconds === 'number') {
      rawS = seconds;
    } else if (typeof seconds === 'string') {
      const match = seconds.replace(',', '.').trim().match(/^[+-]?\d+(?:\.\d+)?/);
      rawS = match ? parseFloat(match[0]) : 0;
    }
    const s = Number.isFinite(rawS) && rawS > 0 && !Object.is(rawS, -0) ? Math.min(86400, Math.floor(rawS)) : 0;
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const rawWater =
    typeof waterGrams === 'number'
      ? waterGrams
      : typeof (waterGrams as any) === 'string'
      ? (() => {
          const m = String(waterGrams).replace(/,/g, '.').trim().match(/^[+-]?\d+(?:\.\d+)?/);
          return m ? parseFloat(m[0]) : 0;
        })()
      : 0;
  const safeWater = Number.isFinite(rawWater) && rawWater > 0 && !Object.is(rawWater, -0) ? Math.min(50000, Math.round(rawWater)) : 0;

  const rawRating = typeof rating === 'number' ? rating : (typeof rating === 'string' ? parseFloat(rating) : 0);
  const safeRating = Number.isFinite(rawRating) && rawRating > 0 && !Object.is(rawRating, -0) ? Math.max(0, Math.min(5, Math.floor(rawRating))) : 0;

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ModalHeader
            onClose={onSkip}
            closeLabel={t.brew?.skipBtn || 'Pomiń'}
            closeTestID="finish-skip-btn"
            onSave={onSave}
            saveLabel={t.brew?.saveToJournalBtn || 'Zapisz w Dzienniku'}
            saveTestID="finish-save-btn"
            style={styles.sheetHeader}
          >
            <Text style={styles.modalTitle}>{t.brew?.finishModalTitle || 'Zakończono Parzenie!'}</Text>
          </ModalHeader>
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 24 }}
          >
            <Text style={styles.modalSub}>
              {(t.brew?.finishTimeWater || (language === 'pl' ? 'Czas: {time} · Woda: {water}g' : 'Time: {time} · Water: {water}g'))
                .replace('{time}', formatTime(totalElapsedSeconds))
                .replace('{water}', String(safeWater))}
            </Text>

            {/* Ocena w gwiazdkach */}
            <Text style={styles.sectionLabel}>{t.brew?.yourRating || 'Twoja Ocena'}</Text>
            <View
              testID="star-rating-row"
              style={styles.starRow}
              accessibilityRole="radiogroup"
              accessibilityLabel={t.brew?.yourRating || 'Twoja Ocena'}
              accessibilityValue={{ min: 1, max: 5, now: safeRating }}
            >
              {[1, 2, 3, 4, 5].map((s) => (
                <Pressable
                  key={s}
                  testID={`star-rating-${s}`}
                  style={styles.starBtn}
                  onPress={() => onChangeRating(s)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: safeRating >= s }}
                  accessibilityValue={{ min: 1, max: 5, now: s }}
                  accessibilityLabel={(t.brew?.starRatingLabel || (language === 'pl' ? 'Ocena {rating} z 5' : 'Rating {rating} of 5')).replace('{rating}', String(s))}
                >
                  <Text style={[styles.starIcon, safeRating >= s && styles.starActive]}>
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
                  {formatTemplate(t.brew.doctorSourAdvice, { delta: formatTemperatureDelta(2, unitSystem) })}
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
                  {formatTemplate(t.brew.doctorBitterAdvice, { delta: formatTemperatureDelta(2, unitSystem) })}
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
                  <StarIcon size={14} color={theme.colors.success} filled />
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
              selectedDescriptors={Array.isArray(selectedTags) ? selectedTags : []}
              onToggleDescriptor={onToggleTag}
              language={language}
            />

            {/* Profil wody użytej do parzenia */}
            <Text style={[styles.sectionLabel, { marginTop: 14 }]}>{t.brew?.waterUsedTitle || 'Woda użyta do parzenia'}</Text>
            <View
              testID="water-chips-row"
              style={styles.waterChipsRow}
              accessibilityRole="radiogroup"
              accessibilityLabel={t.brew?.waterUsedTitle || 'Woda użyta do parzenia'}
            >
              {WATER_RECIPES.map((w) => {
                const active = waterProfile === w.id;
                const waterName = language === 'pl' ? w.namePl : w.nameEn;
                return (
                  <Pressable
                    key={w.id}
                    testID={`water-chip-${w.id}`}
                    accessibilityRole="radio"
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

            {/* Notatki baristy */}
            <Text style={styles.sectionLabel}>{t.brew?.baristaNotesTitle || 'Notatki Baristy'}</Text>
            <TextInput
              testID="finish-notes-input"
              style={styles.notesInput}
              placeholder={t.brew?.baristaNotesPlaceholder || 'np. słodka brzoskwinia, delikatna jaśminowa kwasowość...'}
              placeholderTextColor={theme.colors.textMuted}
              value={(notes ?? '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')}
              onChangeText={(val) => onChangeNotes((val || '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').slice(0, 1000))}
              maxLength={1000}
              accessibilityLabel={t.brew?.baristaNotesTitle || 'Notatki Baristy'}
              accessibilityHint={language === 'en' ? 'Enter tasting notes and sensory feedback' : 'Wprowadź notatki sensoryczne z zaparzonego naparu'}
              multiline
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: withAlpha(theme.colors.black, 0.7),
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
  sheetHeader: {
    paddingHorizontal: 0,
    paddingTop: 0,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
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
    gap: 4,
    marginBottom: 10,
  },
  // 029: pole dotyku gwiazdki 44×44 (glif 32 pt miał ok. 30 pt)
  starBtn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starIcon: {
    fontSize: 32,
    color: theme.colors.borderStrong,
  },
  starActive: {
    color: theme.colors.rating,
  },
  balanceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  balanceChip: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.bgCardSecondary,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
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
    color: theme.colors.copperLight,
    fontWeight: '600',
  },
  doctorAdviceCard: {
    backgroundColor: withAlpha(theme.colors.copper, 0.12),
    borderWidth: 1,
    borderColor: theme.colors.copper,
    borderRadius: theme.borderRadius.md,
    padding: 12,
    marginBottom: 14,
  },
  doctorAdviceSuccess: {
    backgroundColor: withAlpha(theme.colors.success, 0.12),
    borderColor: theme.colors.success,
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
    color: theme.colors.success,
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
    borderColor: theme.colors.borderStrong,
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
  notesInput: {
    backgroundColor: theme.colors.bgCardSecondary,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    padding: 12,
    color: theme.colors.textPrimary,
    fontSize: 13,
    minHeight: 60,
    marginBottom: 14,
  },
});

// ============================================================================
// Napar (Steepwise) — ProcedureModal (Asystent Procedury Krok po Kroku)
// Zero-Click Context Tools:
// - Automatycznie parsuje czas z opisu kroku (parseStepDurationSeconds)
// - Automatycznie uruchamia stoper odliczający przy wejściu w krok
// - Szybkie korekty czasu (-1 min, -10 s, Pauza/Wznów, +10 s, +1 min, Reset)
// - Na ostatnim kroku jednoznaczne CTA "Zakończ i zapisz"
// ============================================================================

import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../core/theme';
import { RecipeStep } from '../../core/recipes-data';
import { parseStepDurationSeconds } from '../../core/bpr-engine';
import { formatWaterWeight } from '../../core/unit-converter';

export interface ProcedureModalProps {
  visible: boolean;
  recipeName: string;
  steps: RecipeStep[];
  currentStepIndex: number;
  isRunning: boolean;
  stepRemainingSeconds: number;
  totalElapsedSeconds: number;
  unitSystem: 'metric' | 'imperial';
  language?: 'pl' | 'en';
  onPauseResume: () => void;
  onAdjustTimeSeconds: (deltaSeconds: number) => void;
  onResetCurrentStep: (parsedDurationSeconds: number) => void;
  onPrevStep: () => void;
  onNextStep: () => void;
  onFinishAndSave: () => void;
  onClose: () => void;
  t?: any;
}

export function ProcedureModal({
  visible,
  recipeName,
  steps,
  currentStepIndex,
  isRunning,
  stepRemainingSeconds,
  totalElapsedSeconds,
  unitSystem,
  language = 'pl',
  t,
  onPauseResume,
  onAdjustTimeSeconds,
  onResetCurrentStep,
  onPrevStep,
  onNextStep,
  onFinishAndSave,
  onClose,
}: ProcedureModalProps) {
  const cleanLang = typeof language === 'string' ? language.trim().toLowerCase() : 'pl';
  const isEn = cleanLang === 'en' || cleanLang.startsWith('en');
  const filteredSteps = Array.isArray(steps) ? steps.filter(Boolean) : [];
  const safeSteps: RecipeStep[] =
    filteredSteps.length > 0
      ? filteredSteps
      : [
          {
            stepNumber: 1,
            namePl: 'Ekstrakcja główna',
            nameEn: 'Main Extraction',
            targetWaterGrams: 250,
            durationSeconds: 120,
            instructionPl: 'Zalej równomiernie przez 2 minuty.',
            instructionEn: 'Pour evenly over 2 minutes.',
          },
        ];

  const boundedIdx = Math.max(0, Math.min(currentStepIndex, safeSteps.length - 1));
  const currentStep = safeSteps[boundedIdx];
  const isLastStep = boundedIdx >= safeSteps.length - 1;

  // Parsowany czas z tekstu kroku (Zero-Click Context Tool)
  const parsedDurationSec = parseStepDurationSeconds(
    currentStep?.instructionPl,
    currentStep?.durationSeconds,
    true
  );

  const [localRemaining, setLocalRemaining] = useState<number>(
    Number.isFinite(stepRemainingSeconds) && stepRemainingSeconds > 0
      ? stepRemainingSeconds
      : Number.isFinite(parsedDurationSec) && parsedDurationSec > 0
      ? parsedDurationSec
      : 0
  );

  useEffect(() => {
    setLocalRemaining(
      Number.isFinite(stepRemainingSeconds) && stepRemainingSeconds >= 0
        ? stepRemainingSeconds
        : Number.isFinite(parsedDurationSec) && parsedDurationSec >= 0
        ? parsedDurationSec
        : 0
    );
  }, [stepRemainingSeconds, boundedIdx, parsedDurationSec]);

  if (!visible) {
    return null;
  }

  const formatClock = (sec: number | string) => {
    const rawVal = typeof sec === 'number' ? sec : (typeof sec === 'string' ? parseFloat(sec) : NaN);
    if (!Number.isFinite(rawVal) || rawVal <= 0 || Object.is(rawVal, -0)) return '00:00';
    const clamped = Math.min(86400, Math.max(0, Math.round(rawVal)));
    const m = Math.floor(clamped / 60);
    const s = clamped % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const assistantTitle =
    t?.brew?.procedureAssistantTitle ||
    (isEn ? 'STEP-BY-STEP PROCEDURE ASSISTANT' : 'ASYSTENT PROCEDURY KROK PO KROKU');
  const elapsedText = t?.brew?.totalBrewTime
    ? t.brew.totalBrewTime.replace('{time}', formatClock(totalElapsedSeconds))
    : isEn
    ? `Total brew time: ${formatClock(totalElapsedSeconds)}`
    : `Całkowity czas parzenia: ${formatClock(totalElapsedSeconds)}`;

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView
        style={styles.container}
        edges={['top', 'bottom', 'left', 'right']}
        testID="procedure-modal"
      >
        {/* Górny pasek Asystenta Procedury */}
        <View style={styles.topHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>
              {assistantTitle}
            </Text>
            <Text style={styles.recipeTitle} numberOfLines={1}>
              {recipeName}
            </Text>
          </View>
          <Pressable
            testID="procedure-close-btn"
            style={styles.abortBtn}
            onPress={onClose}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={isEn ? 'Exit procedure' : 'Zamknij asystenta procedury'}
          >
            <Text style={styles.abortBtnText}>
              {isEn ? 'Close' : 'Zamknij'}
            </Text>
          </Pressable>
        </View>

        {/* Pasek postępu kroków (1 .. N) */}
        <View
          style={styles.progressTrackRow}
          testID="procedure-progress-track"
          accessible={true}
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 1, max: safeSteps.length, now: boundedIdx + 1 }}
          accessibilityLabel={
            isEn
              ? `Step ${boundedIdx + 1} of ${safeSteps.length}`
              : `Krok ${boundedIdx + 1} z ${safeSteps.length}`
          }
        >
          {safeSteps.map((st, idx) => (
            <View
              key={st.stepNumber || idx}
              style={[
                styles.progressSegment,
                idx < boundedIdx && styles.progressSegmentDone,
                idx === boundedIdx && styles.progressSegmentActive,
              ]}
            />
          ))}
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollBody}
          showsVerticalScrollIndicator={false}
        >
          {/* Karta aktywnego kroku */}
          <View style={styles.stepCard}>
            <View style={styles.stepHeaderRow}>
              <Text style={styles.stepCounterBadge} testID="procedure-step-counter">
                {isEn
                  ? `STEP ${boundedIdx + 1} OF ${safeSteps.length}`
                  : `KROK ${boundedIdx + 1} Z ${safeSteps.length}`}
              </Text>
              <Text style={styles.autoTimerTag}>
                {isEn
                  ? `⏱ Auto-parsed: ${parsedDurationSec}s`
                  : `⏱ Auto-czas z kroku: ${parsedDurationSec}s`}
              </Text>
            </View>

            <Text style={styles.stepName} testID="procedure-step-name">
              {isEn && currentStep.nameEn ? currentStep.nameEn : currentStep.namePl}
            </Text>

            <View style={styles.targetWaterBanner}>
              <Text style={styles.targetWaterLabel}>
                {isEn ? 'POUR TO WEIGHT ON SCALE:' : 'ZALEJ DO WAGI NA WADZE:'}
              </Text>
              <Text style={styles.targetWaterValue} testID="procedure-target-water">
                {formatWaterWeight(currentStep.targetWaterGrams, unitSystem)}
              </Text>
            </View>

            <Text style={styles.stepInstruction} testID="procedure-step-instruction">
              {isEn && currentStep.instructionEn ? currentStep.instructionEn : currentStep.instructionPl}
            </Text>
          </View>

          {/* Zero-Click Context Timer — uruchamiany automatycznie po wejściu w krok */}
          <View style={styles.timerCard}>
            <Text style={styles.timerStatusLabel}>
              {isRunning
                ? isEn
                  ? '● AUTO-TIMER RUNNING'
                  : '● STOPER KROKU AKTYWNY (AUTO-START)'
                : isEn
                ? '⏸ TIMER PAUSED'
                : '⏸ STOPER WSTRZYMANY'}
            </Text>

            <Text style={styles.giantClock} testID="procedure-countdown-display">
              {formatClock(localRemaining)}
            </Text>

            <Text style={styles.totalElapsedSub}>
              {elapsedText}
            </Text>

            {/* Przyciski szybkiej korekty czasu (-1 min, -10 s, Pauza/Wznów, +10 s, +1 min, Reset) */}
            <View style={styles.quickAdjustRow}>
              <Pressable
                testID="procedure-sub-60-btn"
                style={styles.adjustChip}
                onPress={() => onAdjustTimeSeconds(-60)}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel="-1 min"
                accessibilityHint={isEn ? "Subtracts 60 seconds from current step" : "Odejmuje 60 sekund od bieżącego kroku"}
              >
                <Text style={styles.adjustChipText}>-1 min</Text>
              </Pressable>

              <Pressable
                testID="procedure-sub-10-btn"
                style={styles.adjustChip}
                onPress={() => onAdjustTimeSeconds(-10)}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel="-10 s"
                accessibilityHint={isEn ? "Subtracts 10 seconds from current step" : "Odejmuje 10 sekund od bieżącego kroku"}
              >
                <Text style={styles.adjustChipText}>-10 s</Text>
              </Pressable>

              <Pressable
                testID="procedure-pause-resume-btn"
                hitSlop={6}
                style={[
                  styles.pauseResumeBtn,
                  !isRunning && styles.pauseResumeBtnPaused,
                ]}
                onPress={onPauseResume}
                accessibilityRole="button"
                accessibilityLabel={isRunning ? (isEn ? 'Pause' : 'Pauza') : (isEn ? 'Resume' : 'Wznów')}
              >
                <Text style={styles.pauseResumeBtnText}>
                  {isRunning
                    ? isEn
                      ? '⏸ Pause'
                      : '⏸ Pauza'
                    : isEn
                    ? '▶ Resume'
                    : '▶ Wznów'}
                </Text>
              </Pressable>

              <Pressable
                testID="procedure-add-10-btn"
                style={styles.adjustChip}
                onPress={() => onAdjustTimeSeconds(10)}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel="+10 s"
                accessibilityHint={isEn ? "Adds 10 seconds to current step" : "Dodaje 10 sekund do bieżącego kroku"}
              >
                <Text style={styles.adjustChipText}>+10 s</Text>
              </Pressable>

              <Pressable
                testID="procedure-add-60-btn"
                style={styles.adjustChip}
                onPress={() => onAdjustTimeSeconds(60)}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel="+1 min"
                accessibilityHint={isEn ? "Adds 60 seconds to current step" : "Dodaje 60 sekund do bieżącego kroku"}
              >
                <Text style={styles.adjustChipText}>+1 min</Text>
              </Pressable>
            </View>

            <Pressable
              testID="procedure-reset-step-btn"
              style={styles.resetStepBtn}
              onPress={() => onResetCurrentStep(parsedDurationSec)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={isEn ? 'Reset step timer' : 'Resetuj czas kroku'}
            >
              <Text style={styles.resetStepBtnText}>
                {isEn
                  ? `↺ Reset step (${parsedDurationSec}s)`
                  : `↺ Resetuj krok (${parsedDurationSec}s)`}
              </Text>
            </Pressable>
          </View>
        </ScrollView>

        {/* Dolny pasek nawigacji po krokach (Poprzedni / Następny lub Zakończ i zapisz) */}
        <View style={styles.bottomFooter}>
          <Pressable
            testID="procedure-prev-step-btn"
            style={[
              styles.secondaryNavBtn,
              boundedIdx === 0 && styles.secondaryNavBtnDisabled,
            ]}
            disabled={boundedIdx === 0}
            onPress={onPrevStep}
            accessibilityRole="button"
            accessibilityLabel={isEn ? 'Previous step' : 'Poprzedni krok'}
          >
            <Text style={styles.secondaryNavBtnText}>
              {isEn ? '◀ Prev' : '◀ Wstecz'}
            </Text>
          </Pressable>

          {!isLastStep ? (
            <Pressable
              testID="procedure-next-step-btn"
              style={styles.primaryNextBtn}
              onPress={onNextStep}
              accessibilityRole="button"
              accessibilityLabel={isEn ? 'Next step' : 'Następny krok'}
            >
              <Text style={styles.primaryNextBtnText}>
                {isEn ? 'Next Step ▶' : 'Następny krok ▶'}
              </Text>
            </Pressable>
          ) : (
            <Pressable
              testID="procedure-finish-save-btn"
              style={styles.finishSaveBtn}
              onPress={onFinishAndSave}
              accessibilityRole="button"
              accessibilityLabel={isEn ? 'Finish and save' : 'Zakończ i zapisz'}
            >
              <Text style={styles.finishSaveBtnText}>
                {isEn ? '✓ Finish & Save' : '✓ Zakończ i zapisz'}
              </Text>
            </Pressable>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.copper,
    letterSpacing: 1.1,
  },
  recipeTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    marginTop: 2,
  },
  abortBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.bgCard,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  abortBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  progressTrackRow: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 18,
    paddingTop: 10,
  },
  progressSegment: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    backgroundColor: theme.colors.bgCardSecondary,
  },
  progressSegmentDone: {
    backgroundColor: theme.colors.emerald,
  },
  progressSegmentActive: {
    backgroundColor: theme.colors.copper,
  },
  scrollBody: {
    padding: 18,
    gap: 14,
  },
  stepCard: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.copper,
    padding: 16,
  },
  stepHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepCounterBadge: {
    fontSize: 11,
    fontWeight: '900',
    color: theme.colors.copper,
    letterSpacing: 0.8,
  },
  autoTimerTag: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  stepName: {
    fontSize: 22,
    fontWeight: '900',
    color: theme.colors.textPrimary,
    marginBottom: 12,
  },
  targetWaterBanner: {
    backgroundColor: theme.colors.copperMuted,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.copper,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  targetWaterLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.copper,
    letterSpacing: 0.6,
  },
  targetWaterValue: {
    fontSize: 20,
    fontWeight: '900',
    color: theme.colors.textPrimary,
  },
  stepInstruction: {
    fontSize: 15,
    color: theme.colors.textPrimary,
    lineHeight: 22,
  },
  timerCard: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 18,
    alignItems: 'center',
  },
  timerStatusLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.copper,
    letterSpacing: 0.9,
    marginBottom: 4,
  },
  giantClock: {
    fontSize: 64,
    fontWeight: '900',
    color: theme.colors.textPrimary,
    fontVariant: ['tabular-nums'],
    letterSpacing: 2,
  },
  totalElapsedSub: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 14,
  },
  quickAdjustRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  adjustChip: {
    backgroundColor: theme.colors.bgCardSecondary,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 11,
    paddingVertical: 9,
  },
  adjustChipText: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  pauseResumeBtn: {
    backgroundColor: theme.colors.copper,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  pauseResumeBtnPaused: {
    backgroundColor: theme.colors.emerald,
  },
  pauseResumeBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  resetStepBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  resetStepBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  bottomFooter: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.bgCard,
  },
  secondaryNavBtn: {
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.bgCardSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryNavBtnDisabled: {
    opacity: 0.4,
  },
  secondaryNavBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  primaryNextBtn: {
    flex: 1,
    backgroundColor: theme.colors.copper,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryNextBtnText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  finishSaveBtn: {
    flex: 1,
    backgroundColor: theme.colors.emerald,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  finishSaveBtnText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
  },
});

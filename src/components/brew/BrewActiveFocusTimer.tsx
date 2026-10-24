// ============================================================================
// Napar (Steepwise) — BrewActiveFocusTimer Component (Apps4Craft Design System)
// Immersive Focus Mode: Clear typography readable from 1 meter, fat thumb controls.
// 100% Offline-First.
// ============================================================================

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { theme } from '../../core/theme';
import { useTranslation } from '../../core/i18n';

interface BrewActiveFocusTimerProps {
  snapshot: any;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onNextStep: () => void;
  onPreviousStep: () => void;
  onAdjustStepDuration: (delta: number) => void;
  onFinish: () => void;
}

export function BrewActiveFocusTimer({
  snapshot,
  onStart,
  onPause,
  onResume,
  onReset,
  onNextStep,
  onPreviousStep,
  onAdjustStepDuration,
  onFinish,
}: BrewActiveFocusTimerProps) {
  const { t, language } = useTranslation();
  const isEn = language === 'en';

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isRunning = snapshot.status === 'running';
  const isPaused = snapshot.status === 'paused';
  const isIdle = snapshot.status === 'idle';

  return (
    <View style={styles.container} testID="active-focus-timer">
      {/* Główna karta stopera: Duże cyfry czytelne z 1,5 metra */}
      <View
        style={[
          styles.timerCard,
          (isRunning || isPaused) && styles.timerCardActive,
        ]}
        accessible={true}
        accessibilityRole="timer"
        accessibilityLabel={`${t.brew.totalTimeAccessibility || 'Całkowity czas'}: ${formatTime(snapshot.totalElapsedSeconds)}`}
      >
        <Text style={styles.timerTotalLabel}>{t.brew.totalTimeLabel || 'CAŁKOWITY CZAS'}</Text>
        <Text style={styles.timerDisplay}>
          {formatTime(snapshot.totalElapsedSeconds)}
        </Text>

        {/* Pasek postępu kroku */}
        <View style={styles.stepProgressContainer}>
          <View
            style={[
              styles.stepProgressBar,
              { width: `${Math.round(snapshot.stepProgress * 100)}%` },
            ]}
          />
        </View>

        {/* Informacja o bieżącym etapie */}
        {snapshot.currentStep && (
          <View
            style={styles.activeStepBox}
            accessible={true}
            accessibilityLiveRegion="assertive"
            accessibilityLabel={
              t.brew.stepAccessibility
                ? t.brew.stepAccessibility
                    .replace('{current}', String(snapshot.currentStepIndex + 1))
                    .replace('{total}', String(snapshot.totalSteps))
                    .replace('{stepName}', (isEn && snapshot.currentStep?.nameEn) ? snapshot.currentStep.nameEn : snapshot.currentStep?.namePl)
                    .replace('{water}', String(snapshot.targetWaterGrams))
                    .replace('{seconds}', String(snapshot.stepRemainingSeconds))
                : `Krok ${snapshot.currentStepIndex + 1} z ${snapshot.totalSteps}`
            }
          >
            <View style={styles.stepHeaderRow}>
              <Text style={styles.stepBadge}>
                {t.brew.stepBadge
                  ? t.brew.stepBadge
                      .replace('{current}', String(snapshot.currentStepIndex + 1))
                      .replace('{total}', String(snapshot.totalSteps))
                  : `Krok ${snapshot.currentStepIndex + 1} z ${snapshot.totalSteps}`}
              </Text>
              <View style={styles.countdownAdjustRow}>
                {(isRunning || isPaused) && (
                  <Pressable
                    style={styles.timeAdjustPill}
                    onPress={() => onAdjustStepDuration(-10)}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={t.brew.subTime10Accessibility || 'Odejmij 10 sekund'}
                  >
                    <Text style={styles.timeAdjustPillText}>{t.brew.subTime10}</Text>
                  </Pressable>
                )}
                <Text style={styles.stepCountdown}>
                  {snapshot.stepRemainingSeconds}s
                </Text>
                {(isRunning || isPaused) && (
                  <Pressable
                    style={styles.timeAdjustPill}
                    onPress={() => onAdjustStepDuration(10)}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={t.brew.addTime10Accessibility || 'Dodaj 10 sekund'}
                  >
                    <Text style={styles.timeAdjustPillText}>{t.brew.addTime10}</Text>
                  </Pressable>
                )}
              </View>
            </View>

            <View style={styles.heroTargetContainer}>
              <Text style={styles.heroTargetText}>
                {`${t.brew.pourUpTo || "Zalej do"}: ${snapshot.targetWaterGrams} g`}
              </Text>
              <View style={styles.heroTargetSubRow}>
                <Text style={styles.heroTargetSubText}>
                  {(isEn && snapshot.currentStep.nameEn) ? snapshot.currentStep.nameEn : snapshot.currentStep.namePl}
                </Text>
                {snapshot.recommendedPourRate > 0 && (
                  <Text style={styles.pourRateBadge}>
                    {`~${snapshot.recommendedPourRate} g/s`}
                  </Text>
                )}
              </View>
            </View>

            <Text style={styles.stepInstruction}>
              {(isEn && snapshot.currentStep.instructionEn) ? snapshot.currentStep.instructionEn : snapshot.currentStep.instructionPl}
            </Text>
          </View>
        )}
      </View>

      {/* Przyciski kontroli parzenia Brudnego Kciuka (min 52pt) */}
      <View style={styles.controlsRow}>
        {isIdle && (
          <Pressable
            style={styles.mainStartButton}
            onPress={onStart}
            accessibilityRole="button"
            accessibilityLabel={t.brew.startBrewAccessibility || 'Rozpocznij parzenie'}
            accessibilityHint={t.brew.startBrewHint || 'Uruchamia stoper i pierwszy etap parzenia'}
            testID="start-brew-btn"
          >
            <Text style={styles.mainStartButtonText}>{t.brew.startBrewBtn || 'ROZPOCZNIJ PARZENIE'}</Text>
          </Pressable>
        )}

        {isRunning && (
          <>
            <Pressable
              style={styles.secondaryButton}
              onPress={onPreviousStep}
              disabled={snapshot.currentStepIndex === 0}
              accessibilityRole="button"
              accessibilityLabel={t.brew.previousStepAccessibility || 'Poprzedni krok'}
              accessibilityHint={t.brew.previousStepHint || 'Cofa do poprzedniego etapu parzenia'}
            >
              <Text style={styles.secondaryButtonText}>{t.brew.previousStepBtn || '◀ Wstecz'}</Text>
            </Pressable>

            <Pressable
              style={styles.pauseButton}
              onPress={onPause}
              accessibilityRole="button"
              accessibilityLabel={t.brew.pauseBrewAccessibility || 'Wstrzymaj parzenie'}
              accessibilityHint={t.brew.pauseBrewHint || 'Zatrzymuje odliczanie czasu'}
            >
              <Text style={styles.pauseButtonText}>{t.brew.pauseBrewBtn || 'PAUZA'}</Text>
            </Pressable>

            <Pressable
              style={styles.nextButton}
              onPress={onNextStep}
              accessibilityRole="button"
              accessibilityLabel={
                snapshot.isLastStep
                  ? (t.brew.finishBrewAccessibility || 'Zakończ parzenie')
                  : (t.brew.nextStepAccessibility || 'Następny krok')
              }
              accessibilityHint={
                snapshot.isLastStep
                  ? (t.brew.finishBrewHint || 'Kończy parzenie i otwiera arkusz oceny')
                  : (t.brew.nextStepHint || 'Przechodzi do kolejnego etapu zalewania')
              }
            >
              <Text style={styles.nextButtonText}>
                {snapshot.isLastStep ? (t.brew.finishBrewBtn || 'Zakończ ▶') : (t.brew.nextStepBtn || 'Dalej ▶')}
              </Text>
            </Pressable>
          </>
        )}

        {isPaused && (
          <>
            <Pressable
              style={styles.resetButton}
              onPress={onReset}
              accessibilityRole="button"
              accessibilityLabel={t.brew.resetTimerAccessibility || 'Zresetuj stoper'}
              accessibilityHint={t.brew.resetTimerHint || 'Zeruje czas i wraca do stanu początkowego'}
            >
              <Text style={styles.resetButtonText}>{t.brew.resetBrew || 'Reset'}</Text>
            </Pressable>

            <Pressable
              style={styles.mainStartButton}
              onPress={onResume}
              accessibilityRole="button"
              accessibilityLabel={t.brew.resumeBrewAccessibility || 'Wznów parzenie'}
              accessibilityHint={t.brew.resumeBrewHint || 'Wznawia odliczanie czasu parzenia'}
            >
              <Text style={styles.mainStartButtonText}>{t.brew.resumeBrew || 'WZNÓW'}</Text>
            </Pressable>

            <Pressable
              style={styles.secondaryButton}
              onPress={onFinish}
              accessibilityRole="button"
              accessibilityLabel={t.brew.saveSessionAccessibility || 'Zapisz sesję'}
              accessibilityHint={t.brew.saveSessionHint || 'Otwiera arkusz degustacyjny do zapisu notatek'}
            >
              <Text style={styles.secondaryButtonText}>{t.brew.saveSessionBtn || 'Zapisz'}</Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  timerCard: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.lg,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 14,
  },
  timerCardActive: {
    borderColor: theme.colors.copper,
  },
  timerTotalLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
  },
  timerDisplay: {
    ...theme.typography.timerDisplay,
    fontSize: 68,
    marginVertical: 4,
    color: theme.colors.textPrimary,
  },
  stepProgressContainer: {
    width: '100%',
    height: 6,
    backgroundColor: theme.colors.bgCardSecondary,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 16,
  },
  stepProgressBar: {
    height: '100%',
    backgroundColor: theme.colors.copper,
  },
  activeStepBox: {
    width: '100%',
    backgroundColor: theme.colors.bgCardSecondary,
    borderRadius: theme.borderRadius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  stepHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  stepBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.copper,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  countdownAdjustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeAdjustPill: {
    backgroundColor: theme.colors.bgCard,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
    minHeight: 32,
    justifyContent: 'center',
  },
  timeAdjustPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.copperLight,
  },
  stepCountdown: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  heroTargetContainer: {
    marginVertical: 6,
    alignItems: 'center',
  },
  heroTargetText: {
    fontSize: 26,
    fontWeight: '800',
    color: theme.colors.copper,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  heroTargetSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  heroTargetSubText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  stepName: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  targetWaterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  targetWaterLabel: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  targetWaterValue: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.copper,
    fontVariant: ['tabular-nums'],
  },
  pourRateBadge: {
    fontSize: 11,
    color: theme.colors.copperLight,
    backgroundColor: 'rgba(217, 119, 54, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    fontWeight: '600',
  },
  stepInstruction: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
  },
  mainStartButton: {
    flex: 1,
    backgroundColor: theme.colors.copper,
    paddingVertical: 16,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  mainStartButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  pauseButton: {
    flex: 1,
    backgroundColor: '#8C4C23',
    paddingVertical: 14,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  pauseButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  nextButton: {
    flex: 1,
    backgroundColor: theme.colors.bgCard,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.copper,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  nextButtonText: {
    color: theme.colors.copper,
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: theme.colors.bgCard,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  secondaryButtonText: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  resetButton: {
    backgroundColor: theme.colors.bgCard,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  resetButtonText: {
    color: theme.colors.danger,
    fontSize: 14,
    fontWeight: '600',
  },
});

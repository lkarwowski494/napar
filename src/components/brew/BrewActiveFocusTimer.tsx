// ============================================================================
// Napar (Steepwise) — BrewActiveFocusTimer Component (Focus Mode UI)
// Giant digits readable from 1 meter, live flow-rate, dirty thumb controls.
// Apps4Brew Studio — 100% Offline-First.
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
  const { t } = useTranslation();

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
      {/* Główny stoper parzenia: Duże cyfry czytelne z 1 metra */}
      <View
        style={styles.timerCard}
        accessible={true}
        accessibilityRole="timer"
        accessibilityLabel={`Całkowity czas: ${formatTime(snapshot.totalElapsedSeconds)}`}
      >
        <Text style={styles.timerTotalLabel}>CAŁKOWITY CZAS</Text>
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
            accessibilityLabel={`Krok ${snapshot.currentStepIndex + 1} z ${snapshot.totalSteps}: ${snapshot.currentStep.namePl}. Cel wody: ${snapshot.targetWaterGrams} gramów, pozostało ${snapshot.stepRemainingSeconds} sekund.`}
          >
            <View style={styles.stepHeaderRow}>
              <Text style={styles.stepBadge}>
                {`Krok ${snapshot.currentStepIndex + 1} z ${snapshot.totalSteps}`}
              </Text>
              <View style={styles.countdownAdjustRow}>
                {(isRunning || isPaused) && (
                  <Pressable
                    style={styles.timeAdjustPill}
                    onPress={() => onAdjustStepDuration(-10)}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Odejmij 10 sekund"
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
                    accessibilityLabel="Dodaj 10 sekund"
                  >
                    <Text style={styles.timeAdjustPillText}>{t.brew.addTime10}</Text>
                  </Pressable>
                )}
              </View>
            </View>

            <Text style={styles.stepName}>
              {snapshot.currentStep.namePl}
            </Text>

            <View style={styles.targetWaterRow}>
              <Text style={styles.targetWaterLabel}>Cel wody w tym kroku:</Text>
              <Text style={styles.targetWaterValue}>
                {`${snapshot.targetWaterGrams} g`}
              </Text>
              {snapshot.recommendedPourRate > 0 && (
                <Text style={styles.pourRateBadge}>
                  {`~${snapshot.recommendedPourRate} g/s`}
                </Text>
              )}
            </View>

            <Text style={styles.stepInstruction}>
              {snapshot.currentStep.instructionPl}
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
            accessibilityLabel="Rozpocznij parzenie"
            accessibilityHint="Uruchamia stoper i pierwszy etap parzenia"
            testID="start-brew-btn"
          >
            <Text style={styles.mainStartButtonText}>ROZPOCZNIJ PARZENIE</Text>
          </Pressable>
        )}

        {isRunning && (
          <>
            <Pressable
              style={styles.secondaryButton}
              onPress={onPreviousStep}
              disabled={snapshot.currentStepIndex === 0}
              accessibilityRole="button"
              accessibilityLabel="Poprzedni krok"
              accessibilityHint="Cofa do poprzedniego etapu parzenia"
            >
              <Text style={styles.secondaryButtonText}>◀ Wstecz</Text>
            </Pressable>

            <Pressable
              style={styles.pauseButton}
              onPress={onPause}
              accessibilityRole="button"
              accessibilityLabel="Wstrzymaj parzenie"
              accessibilityHint="Zatrzymuje odliczanie czasu"
            >
              <Text style={styles.pauseButtonText}>PAUZA</Text>
            </Pressable>

            <Pressable
              style={styles.secondaryButton}
              onPress={onNextStep}
              accessibilityRole="button"
              accessibilityLabel={
                snapshot.isLastStep ? 'Zakończ parzenie' : 'Następny krok'
              }
              accessibilityHint={
                snapshot.isLastStep
                  ? 'Kończy parzenie i otwiera arkusz oceny'
                  : 'Przechodzi do kolejnego etapu zalewania'
              }
            >
              <Text style={styles.secondaryButtonText}>
                {snapshot.isLastStep ? 'Zakończ ▶' : 'Dalej ▶'}
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
              accessibilityLabel="Zresetuj stoper"
              accessibilityHint="Zeruje czas i wraca do stanu początkowego"
            >
              <Text style={styles.resetButtonText}>Reset</Text>
            </Pressable>

            <Pressable
              style={styles.mainStartButton}
              onPress={onResume}
              accessibilityRole="button"
              accessibilityLabel="Wznów parzenie"
              accessibilityHint="Wznawia odliczanie czasu parzenia"
            >
              <Text style={styles.mainStartButtonText}>WZNÓW</Text>
            </Pressable>

            <Pressable
              style={styles.secondaryButton}
              onPress={onFinish}
              accessibilityRole="button"
              accessibilityLabel="Zapisz sesję"
              accessibilityHint="Otwiera arkusz degustacyjny do zapisu notatek"
            >
              <Text style={styles.secondaryButtonText}>Zapisz</Text>
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
    borderColor: theme.colors.copper,
    marginBottom: 16,
  },
  timerTotalLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    color: theme.colors.textMuted,
  },
  timerDisplay: {
    ...theme.typography.timerDisplay,
    fontSize: 64,
    marginVertical: 8,
  },
  stepProgressContainer: {
    width: '100%',
    height: 8,
    backgroundColor: theme.colors.border,
    borderRadius: 4,
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
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.copper,
  },
  countdownAdjustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeAdjustPill: {
    backgroundColor: theme.colors.bgCardSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 8,
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
  stepName: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 6,
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
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  pourRateBadge: {
    fontSize: 11,
    color: theme.colors.copperLight,
    backgroundColor: theme.colors.copperMuted,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontWeight: '600',
  },
  stepInstruction: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  mainStartButton: {
    flex: 1,
    backgroundColor: theme.colors.copper,
    paddingVertical: 18,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  mainStartButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  pauseButton: {
    flex: 1,
    backgroundColor: '#8C4C23',
    paddingVertical: 16,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  pauseButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: theme.colors.bgCard,
    paddingVertical: 16,
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
    paddingVertical: 16,
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

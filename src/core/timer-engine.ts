// ============================================================================
// Napar (Steepwise) — Timer Engine & State Machine (BR-PAR-002, BR-PAR-003)
// Deterministic active brew timer, pour rate calculator, haptics and awake lock
// ============================================================================

import * as Haptics from 'expo-haptics';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { AppState, AppStateStatus, NativeEventSubscription } from 'react-native';
import { RecipeStep } from './recipes-data';
import { playTimerChime, stopTimerChime } from './timer-audio';

export type TimerStatus = 'idle' | 'running' | 'paused' | 'finished';

export interface TimerSnapshot {
  status: TimerStatus;
  currentStepIndex: number;
  currentStep: RecipeStep | null;
  totalSteps: number;
  stepElapsedSeconds: number;
  stepRemainingSeconds: number;
  stepProgress: number; // 0.0 to 1.0
  totalElapsedSeconds: number;
  currentWaterGrams: number;
  previousWaterGrams: number;
  targetWaterGrams: number;
  recommendedPourRate: number; // g/s
  isLastStep: boolean;
}

export interface TimerCallbacks {
  onTick?: (snapshot: TimerSnapshot) => void;
  onStepChange?: (stepIndex: number, step: RecipeStep) => void;
  onWarning?: (secondsRemaining: number) => void;
  onFinish?: () => void;
}

/**
 * RD-ENG-06 & NFR-PERF-004: Wyliczanie czasu timera odporne na uśpienie w tle
 * r = max(0, ceil((endAtMs - nowMs) / 1000))
 */
export function remainingTimerSec(endAtMs: number, nowMs: number = Date.now()): number {
  if (!Number.isFinite(endAtMs) || !Number.isFinite(nowMs)) {
    return 0;
  }
  return Math.max(0, Math.ceil((endAtMs - nowMs) / 1000));
}

export class BrewTimerEngine {
  private steps: RecipeStep[] = [];
  private status: TimerStatus = 'idle';
  private currentStepIndex = 0;
  private stepElapsedSeconds = 0;
  private totalElapsedSeconds = 0;
  private intervalId: any = null;
  private callbacks: TimerCallbacks = {};
  private soundEnabled = true;
  private hapticsEnabled = true;

  // Znaczniki czasu odporne na uśpienie w tle (RD-ENG-06, NFR-PERF-004)
  private stepEndAtMs: number | null = null;
  private pausedRemainingMs: number | null = null;
  private totalStartAtMs: number | null = null;
  private pausedTotalElapsedMs = 0;
  private appStateSubscription: NativeEventSubscription | null = null;

  /**
   * Oblicza sumaryczny czas trwania receptury w sekundach bez alokacji stanu silnika.
   */
  public static calculateTotalRecipeDuration(steps?: RecipeStep[] | null): number {
    if (!Array.isArray(steps) || steps.length === 0) return 0;
    let total = 0;
    for (const step of steps) {
      if (step && Number.isFinite(step.durationSeconds) && step.durationSeconds > 0) {
        total += Math.floor(step.durationSeconds);
      }
    }
    return Math.min(86400, Math.max(0, total));
  }

  /**
   * Oblicza maksymalną / docelową objętość wody w recepturze (g) bez alokacji stanu silnika.
   */
  public static calculateTotalTargetWater(steps?: RecipeStep[] | null): number {
    if (!Array.isArray(steps) || steps.length === 0) return 0;
    let maxWater = 0;
    for (const step of steps) {
      if (step && Number.isFinite(step.targetWaterGrams) && step.targetWaterGrams > 0) {
        if (step.targetWaterGrams > maxWater) {
          maxWater = step.targetWaterGrams;
        }
      }
    }
    return Number(maxWater.toFixed(1));
  }

  constructor(steps: RecipeStep[], callbacks: TimerCallbacks = {}) {
    this.steps = steps.map((s) => ({ ...s }));
    this.callbacks = callbacks;
  }

  public setSteps(steps: RecipeStep[]): void {
    this.steps = steps.map((s) => ({ ...s }));
    this.reset();
  }

  public setCallbacks(callbacks: TimerCallbacks): void {
    this.callbacks = callbacks;
  }

  public setHapticsEnabled(enabled: boolean): void {
    this.hapticsEnabled = enabled;
  }

  public setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
  }

  public start(): void {
    if (this.status === 'running') return;
    if (this.steps.length === 0) return;

    const now = Date.now();
    if (this.status === 'idle') {
      this.currentStepIndex = 0;
      this.stepElapsedSeconds = 0;
      this.totalElapsedSeconds = 0;
      this.pausedRemainingMs = null;
      this.pausedTotalElapsedMs = 0;
      this.totalStartAtMs = now;
      this.triggerHaptic('start');
      const step = this.getCurrentStep();
      if (step && this.callbacks.onStepChange) {
        this.callbacks.onStepChange(this.currentStepIndex, step);
      }
    } else if (this.status === 'paused') {
      this.totalStartAtMs = now;
    }

    const currentStep = this.getCurrentStep();
    const durationMs = currentStep ? currentStep.durationSeconds * 1000 : 0;
    const msLeft =
      this.pausedRemainingMs !== null
        ? this.pausedRemainingMs
        : Math.max(0, durationMs - this.stepElapsedSeconds * 1000);

    this.stepEndAtMs = now + msLeft;
    this.pausedRemainingMs = null;

    this.status = 'running';
    this.setupAppStateListener();
    try {
      activateKeepAwakeAsync();
    } catch {
      // expo-keep-awake safe fallback
    }

    this.clearInterval();
    this.intervalId = setInterval(() => this.tick(), 1000);
    this.notifyTick();
  }

  public pause(): void {
    if (this.status !== 'running') return;
    this.status = 'paused';
    const now = Date.now();
    if (this.stepEndAtMs !== null) {
      this.pausedRemainingMs = Math.max(0, this.stepEndAtMs - now);
      this.stepEndAtMs = null;
    }
    if (this.totalStartAtMs !== null) {
      this.pausedTotalElapsedMs += Math.max(0, now - this.totalStartAtMs);
      this.totalStartAtMs = null;
    }
    this.removeAppStateListener();
    this.clearInterval();
    try {
      deactivateKeepAwake();
    } catch {
      // safe fallback
    }
    this.notifyTick();
  }

  public resume(): void {
    if (this.status !== 'paused') return;
    this.start();
  }

  public reset(): void {
    this.removeAppStateListener();
    this.clearInterval();
    stopTimerChime();
    this.status = 'idle';
    this.currentStepIndex = 0;
    this.stepElapsedSeconds = 0;
    this.totalElapsedSeconds = 0;
    this.stepEndAtMs = null;
    this.pausedRemainingMs = null;
    this.totalStartAtMs = null;
    this.pausedTotalElapsedMs = 0;
    try {
      deactivateKeepAwake();
    } catch {
      // safe fallback
    }
    this.notifyTick();
  }

  public nextStep(): void {
    if (this.currentStepIndex < this.steps.length - 1) {
      this.currentStepIndex++;
      this.stepElapsedSeconds = 0;
      const currentStep = this.getCurrentStep();
      if (currentStep && this.status === 'running') {
        this.stepEndAtMs = Date.now() + currentStep.durationSeconds * 1000;
        this.pausedRemainingMs = null;
      }
      this.triggerHaptic('step');
      if (currentStep && this.callbacks.onStepChange) {
        this.callbacks.onStepChange(this.currentStepIndex, currentStep);
      }
      this.notifyTick();
    } else {
      this.finish();
    }
  }

  public previousStep(): void {
    if (this.currentStepIndex > 0) {
      this.currentStepIndex--;
      this.stepElapsedSeconds = 0;
      const currentStep = this.getCurrentStep();
      if (currentStep && this.status === 'running') {
        this.stepEndAtMs = Date.now() + currentStep.durationSeconds * 1000;
        this.pausedRemainingMs = null;
      }
      if (currentStep && this.callbacks.onStepChange) {
        this.callbacks.onStepChange(this.currentStepIndex, currentStep);
      }
      this.notifyTick();
    }
  }

  public adjustStepDuration(deltaSeconds: number): void {
    const currentStep = this.getCurrentStep();
    if (!currentStep) return;
    const newDuration = Math.max(this.stepElapsedSeconds + 1, currentStep.durationSeconds + deltaSeconds);
    currentStep.durationSeconds = newDuration;
    if (this.status === 'running') {
      const remSec = Math.max(1, currentStep.durationSeconds - this.stepElapsedSeconds);
      this.stepEndAtMs = Date.now() + remSec * 1000;
      this.pausedRemainingMs = null;
    } else if (this.status === 'paused' && this.pausedRemainingMs !== null) {
      const maxAllowedMs = Math.max(1000, (newDuration - this.stepElapsedSeconds) * 1000);
      this.pausedRemainingMs = Math.min(maxAllowedMs, Math.max(1000, this.pausedRemainingMs + deltaSeconds * 1000));
    }
    this.notifyTick();
  }

  public finish(): void {
    this.removeAppStateListener();
    this.clearInterval();
    this.status = 'finished';
    this.stepEndAtMs = null;
    this.pausedRemainingMs = null;
    this.totalStartAtMs = null;
    try {
      deactivateKeepAwake();
    } catch {
      // safe fallback
    }
    this.triggerHaptic('finish');
    if (this.soundEnabled) {
      void playTimerChime();
    }
    if (this.callbacks.onFinish) {
      this.callbacks.onFinish();
    }
    this.notifyTick();
  }

  public destroy(): void {
    this.removeAppStateListener();
    this.clearInterval();
    stopTimerChime();
    this.callbacks = {};
    this.steps = [];
    try {
      deactivateKeepAwake();
    } catch {
      // safe fallback
    }
  }

  private setupAppStateListener(): void {
    if (this.appStateSubscription) return;
    try {
      if (typeof AppState?.addEventListener === 'function') {
        this.appStateSubscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
          if (nextState === 'active' && this.status === 'running') {
            this.syncWithRealTime();
          }
        });
      }
    } catch {
      // safe fallback for non-react-native environments
    }
  }

  private removeAppStateListener(): void {
    if (this.appStateSubscription) {
      try {
        if (typeof this.appStateSubscription.remove === 'function') {
          this.appStateSubscription.remove();
        }
      } catch {
        // safe fallback
      }
      this.appStateSubscription = null;
    }
  }

  public syncWithRealTime(): void {
    if (this.status === 'running') {
      this.tick();
    }
  }

  private tick(): void {
    if (this.status !== 'running') return;

    const now = Date.now();
    if (this.totalStartAtMs !== null) {
      this.totalElapsedSeconds = Math.floor(
        (this.pausedTotalElapsedMs + (now - this.totalStartAtMs)) / 1000
      );
    }

    while (this.status === 'running') {
      const currentStep = this.getCurrentStep();
      if (!currentStep) break;

      const remaining = this.stepEndAtMs !== null
        ? remainingTimerSec(this.stepEndAtMs, now)
        : Math.max(0, currentStep.durationSeconds - this.stepElapsedSeconds);

      if (remaining > 0) {
        this.stepElapsedSeconds = Math.max(0, currentStep.durationSeconds - remaining);
        if (remaining <= 3) {
          this.triggerHaptic('warning');
          if (this.soundEnabled && remaining === 3) {
            void playTimerChime();
          }
          if (this.callbacks.onWarning) {
            this.callbacks.onWarning(remaining);
          }
        }
        break;
      }

      // Krok wygasł (remaining <= 0)
      if (this.currentStepIndex < this.steps.length - 1) {
        this.currentStepIndex++;
        const nextStep = this.getCurrentStep();
        const nextDurationMs = nextStep ? nextStep.durationSeconds * 1000 : 0;
        this.stepEndAtMs = (this.stepEndAtMs !== null ? this.stepEndAtMs : now) + nextDurationMs;
        this.stepElapsedSeconds = 0;
        this.triggerHaptic('step');
        if (nextStep && this.callbacks.onStepChange) {
          this.callbacks.onStepChange(this.currentStepIndex, nextStep);
        }
      } else {
        this.finish();
        return;
      }
    }

    this.notifyTick();
  }

  public getSnapshot(): TimerSnapshot {
    const currentStep = this.getCurrentStep();
    const prevStep = this.currentStepIndex > 0 ? this.steps[this.currentStepIndex - 1] : null;
    const prevWater =
      prevStep && Number.isFinite(prevStep.targetWaterGrams) && prevStep.targetWaterGrams >= 0
        ? prevStep.targetWaterGrams
        : 0;
    const targetWater =
      currentStep && Number.isFinite(currentStep.targetWaterGrams) && currentStep.targetWaterGrams >= 0
        ? currentStep.targetWaterGrams
        : 0;
    const duration =
      currentStep && Number.isFinite(currentStep.durationSeconds) && currentStep.durationSeconds > 0
        ? currentStep.durationSeconds
        : 1;
    const remaining = Math.max(0, duration - this.stepElapsedSeconds);
    const progress = Math.min(1.0, Math.max(0, this.stepElapsedSeconds / Math.max(1, duration)));

    // Dynamiczne obliczanie zalecanego tempa nalewania (g/s)
    const deltaWater = Math.max(0, targetWater - prevWater);
    const recommendedPourRate =
      duration > 0 && deltaWater > 0
        ? Number((deltaWater / duration).toFixed(1))
        : 0;

    // Szacowana woda w danej sekundzie
    const currentEstimatedWater = Math.round(prevWater + deltaWater * progress);

    return {
      status: this.status,
      currentStepIndex: this.currentStepIndex,
      currentStep,
      totalSteps: this.steps.length,
      stepElapsedSeconds: this.stepElapsedSeconds,
      stepRemainingSeconds: remaining,
      stepProgress: progress,
      totalElapsedSeconds: this.totalElapsedSeconds,
      currentWaterGrams: Number(currentEstimatedWater.toFixed(1)),
      previousWaterGrams: prevWater,
      targetWaterGrams: targetWater,
      recommendedPourRate,
      isLastStep: this.currentStepIndex >= this.steps.length - 1,
    };
  }

  private getCurrentStep(): RecipeStep | null {
    if (this.currentStepIndex >= 0 && this.currentStepIndex < this.steps.length) {
      return this.steps[this.currentStepIndex];
    }
    return null;
  }

  private clearInterval(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private notifyTick(): void {
    if (this.callbacks.onTick) {
      this.callbacks.onTick(this.getSnapshot());
    }
  }

  private triggerHaptic(type: 'start' | 'step' | 'warning' | 'finish'): void {
    if (!this.hapticsEnabled) return;
    try {
      if (type === 'start' || type === 'step') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } else if (type === 'warning') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else if (type === 'finish') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch {
      // Haptics safe fallback for web / unsupported devices
    }
  }
}

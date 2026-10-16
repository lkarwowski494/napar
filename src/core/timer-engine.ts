// ============================================================================
// Napar (Steepwise) — Timer Engine & State Machine (BR-PAR-002, BR-PAR-003)
// Deterministic active brew timer, pour rate calculator, haptics and awake lock
// ============================================================================

import * as Haptics from 'expo-haptics';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { RecipeStep } from './recipes-data';

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

  constructor(steps: RecipeStep[], callbacks: TimerCallbacks = {}) {
    this.steps = steps;
    this.callbacks = callbacks;
  }

  public setSteps(steps: RecipeStep[]): void {
    this.steps = steps;
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

    if (this.status === 'idle') {
      this.currentStepIndex = 0;
      this.stepElapsedSeconds = 0;
      this.totalElapsedSeconds = 0;
      this.triggerHaptic('start');
      const step = this.getCurrentStep();
      if (step && this.callbacks.onStepChange) {
        this.callbacks.onStepChange(this.currentStepIndex, step);
      }
    }

    this.status = 'running';
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
    this.clearInterval();
    this.status = 'idle';
    this.currentStepIndex = 0;
    this.stepElapsedSeconds = 0;
    this.totalElapsedSeconds = 0;
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
      this.triggerHaptic('step');
      const step = this.getCurrentStep();
      if (step && this.callbacks.onStepChange) {
        this.callbacks.onStepChange(this.currentStepIndex, step);
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
      const step = this.getCurrentStep();
      if (step && this.callbacks.onStepChange) {
        this.callbacks.onStepChange(this.currentStepIndex, step);
      }
      this.notifyTick();
    }
  }

  public adjustStepDuration(deltaSeconds: number): void {
    const currentStep = this.getCurrentStep();
    if (!currentStep) return;
    const newDuration = Math.max(this.stepElapsedSeconds + 1, currentStep.durationSeconds + deltaSeconds);
    currentStep.durationSeconds = newDuration;
    this.notifyTick();
  }

  public finish(): void {
    this.clearInterval();
    this.status = 'finished';
    try {
      deactivateKeepAwake();
    } catch {
      // safe fallback
    }
    this.triggerHaptic('finish');
    if (this.callbacks.onFinish) {
      this.callbacks.onFinish();
    }
    this.notifyTick();
  }

  public destroy(): void {
    this.clearInterval();
    try {
      deactivateKeepAwake();
    } catch {
      // safe fallback
    }
  }

  private tick(): void {
    if (this.status !== 'running') return;

    this.stepElapsedSeconds++;
    this.totalElapsedSeconds++;

    const currentStep = this.getCurrentStep();
    if (!currentStep) return;

    const remaining = currentStep.durationSeconds - this.stepElapsedSeconds;

    // Odliczanie ostatnich 3 sekund etapu
    if (remaining > 0 && remaining <= 3) {
      this.triggerHaptic('warning');
      if (this.callbacks.onWarning) {
        this.callbacks.onWarning(remaining);
      }
    }

    if (this.stepElapsedSeconds >= currentStep.durationSeconds) {
      if (this.currentStepIndex < this.steps.length - 1) {
        this.nextStep();
        return;
      } else {
        this.finish();
        return;
      }
    }

    this.notifyTick();
  }

  public getSnapshot(): TimerSnapshot {
    const currentStep = this.getCurrentStep();
    const prevWater =
      this.currentStepIndex > 0
        ? this.steps[this.currentStepIndex - 1].targetWaterGrams
        : 0;
    const targetWater = currentStep ? currentStep.targetWaterGrams : 0;
    const duration = currentStep ? currentStep.durationSeconds : 1;
    const remaining = Math.max(0, duration - this.stepElapsedSeconds);
    const progress = Math.min(1.0, this.stepElapsedSeconds / Math.max(1, duration));

    // Dynamiczne obliczanie zalecanego tempa nalewania (g/s)
    const deltaWater = Math.max(0, targetWater - prevWater);
    const recommendedPourRate =
      duration > 0 && deltaWater > 0
        ? Number((deltaWater / duration).toFixed(1))
        : 0;

    // Szacowana woda w danej sekundzie
    const currentEstimatedWater =
      prevWater + deltaWater * progress;

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

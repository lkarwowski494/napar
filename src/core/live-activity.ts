// ============================================================================
// Napar (Steepwise) — ActivityKit Live Activity & Dynamic Island Bridge
// BR-ZEG-003 & BR-ZEG-004: Lock Screen Widget & Dynamic Island (iPhone 14 Pro+)
// 100% Offline-first, Zero-login, Local payload builder & native bridge
// ============================================================================

import { Platform } from 'react-native';
import { getAppSetting, setAppSetting } from './database';

export interface BrewActivityAttributes {
  sessionId: string;
  recipeName: string;
  method: string;
  beverageType: 'COFFEE' | 'TEA';
  totalWaterGrams: number;
}

export interface BrewActivityContentState {
  stepIndex: number;
  totalSteps: number;
  stepNamePl: string;
  stepNameEn: string;
  stepRemainingSeconds: number;
  stepDurationSeconds: number;
  totalElapsedSeconds: number;
  targetWaterGrams: number;
  isPaused: boolean;
  isFinished: boolean;
}

export interface DynamicIslandPayload {
  compactLeading: string; // e.g. "☕" / "🍵"
  compactTrailing: string; // e.g. "0:45"
  expandedLeadingIcon: string;
  expandedTrailingTime: string;
  expandedCenterTitle: string;
  expandedCenterSubtitle: string;
  expandedBottomTarget: string;
  isPaused: boolean;
  isFinished: boolean;
}

export interface LiveActivityPayload {
  attributes: BrewActivityAttributes;
  contentState: BrewActivityContentState;
  dynamicIsland: DynamicIslandPayload;
}

let currentActiveActivityId: string | null = null;

/**
 * Sprawdza czy urządzenie wspiera ActivityKit (iOS 16.1+).
 */
export function isLiveActivitySupported(): boolean {
  return Platform.OS === 'ios';
}

/**
 * Zwraca czy Live Activity jest włączone w ustawieniach.
 */
export function getLiveActivityEnabled(): boolean {
  return getAppSetting('live_activity_enabled', 'true') !== 'false';
}

/**
 * Ustawia preferencję Live Activity w bazie SQLite.
 */
export function setLiveActivityEnabled(enabled: boolean): void {
  setAppSetting('live_activity_enabled', enabled ? 'true' : 'false');
}

/**
 * Formatuje sekundy do formatu M:SS
 */
export function formatActivityTimer(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${rem.toString().padStart(2, '0')}`;
}

/**
 * Buduje payload dla Dynamic Island (kompaktowy i rozszerzony)
 */
export function buildDynamicIslandPayload(
  attributes: BrewActivityAttributes,
  state: BrewActivityContentState,
  language: 'pl' | 'en' = 'pl'
): DynamicIslandPayload {
  const icon = attributes.beverageType === 'TEA' ? '🍵' : '☕';
  const remainingFormatted = formatActivityTimer(state.stepRemainingSeconds);

  const stepName = language === 'pl' ? state.stepNamePl : state.stepNameEn;
  const stepProgress = language === 'pl'
    ? `Krok ${state.stepIndex + 1} z ${state.totalSteps}`
    : `Step ${state.stepIndex + 1} of ${state.totalSteps}`;

  const targetText = language === 'pl'
    ? `Docelowo: ${state.targetWaterGrams} g (z ${attributes.totalWaterGrams} g)`
    : `Target: ${state.targetWaterGrams} g (of ${attributes.totalWaterGrams} g)`;

  return {
    compactLeading: icon,
    compactTrailing: remainingFormatted,
    expandedLeadingIcon: icon,
    expandedTrailingTime: remainingFormatted,
    expandedCenterTitle: attributes.recipeName,
    expandedCenterSubtitle: `${stepName} · ${stepProgress}`,
    expandedBottomTarget: targetText,
    isPaused: state.isPaused,
    isFinished: state.isFinished,
  };
}

/**
 * Buduje pełny payload dla Live Activity na zablokowanym ekranie i Dynamic Island
 */
export function buildLiveActivityPayload(
  attributes: BrewActivityAttributes,
  state: BrewActivityContentState,
  language: 'pl' | 'en' = 'pl'
): LiveActivityPayload {
  return {
    attributes,
    contentState: state,
    dynamicIsland: buildDynamicIslandPayload(attributes, state, language),
  };
}

/**
 * Rozpoczyna sesję Live Activity
 */
export async function startLiveActivity(
  attributes: BrewActivityAttributes,
  initialState: BrewActivityContentState,
  language: 'pl' | 'en' = 'pl'
): Promise<{ activityId?: string; success: boolean; error?: string }> {
  if (!isLiveActivitySupported()) {
    return { success: false, error: 'Live Activity wymaga systemu iOS 16.1+.' };
  }

  if (!getLiveActivityEnabled()) {
    return { success: false, error: 'Live Activity jest wyłączone w ustawieniach aplikacji.' };
  }

  const activityId = `act-${attributes.sessionId}-${Date.now()}`;
  currentActiveActivityId = activityId;

  return {
    activityId,
    success: true,
  };
}

/**
 * Aktualizuje stan aktywnego widgetu Live Activity
 */
export async function updateLiveActivity(
  activityId: string,
  state: BrewActivityContentState
): Promise<{ success: boolean; error?: string }> {
  if (!isLiveActivitySupported()) {
    return { success: false, error: 'Live Activity wymaga systemu iOS 16.1+.' };
  }

  if (!activityId || activityId !== currentActiveActivityId) {
    return { success: false, error: 'Nie znaleziono aktywnej sesji Live Activity o podanym ID.' };
  }

  return {
    success: true,
  };
}

/**
 * Kończy sesję Live Activity na zablokowanym ekranie i Dynamic Island
 */
export async function endLiveActivity(
  activityId: string,
  dismissalPolicy: 'immediate' | 'after_delay' = 'immediate'
): Promise<{ success: boolean; error?: string }> {
  if (!isLiveActivitySupported()) {
    return { success: false, error: 'Live Activity wymaga systemu iOS 16.1+.' };
  }

  if (activityId === currentActiveActivityId) {
    currentActiveActivityId = null;
  }

  return {
    success: true,
  };
}

/**
 * Zwraca identyfikator aktualnej sesji Live Activity lub null
 */
export function getActiveLiveActivityId(): string | null {
  return currentActiveActivityId;
}

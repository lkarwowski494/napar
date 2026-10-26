// ============================================================================
// Napar (Steepwise) — ActivityKit Live Activity & Dynamic Island Bridge
// Status v1.0: Deferred to v1.2 per Architectural Decision DEC-01 (Scope Contract).
// Safe stub with zero fake identifiers, 100% type-safe, zero mock state.
// Apps4Brew Studio — 100% Offline-First, Zero Telemetry.
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

/**
 * Sprawdza czy Live Activity jest wspierane w bieżącym wydaniu.
 * Zgodnie z decyzją architektoniczną DEC-01 (opcja a) mostek ActivityKit
 * został odłożony do wydania v1.2 po wdrożeniu natywnego targetu WidgetKit.
 */
export function isLiveActivitySupported(): boolean {
  return false;
}

export function getLiveActivityEnabled(): boolean {
  return getAppSetting('live_activity_enabled', 'false') === 'true';
}

export function setLiveActivityEnabled(enabled: boolean): void {
  setAppSetting('live_activity_enabled', enabled ? 'true' : 'false');
}

export function formatActivityTimer(seconds: number): string {
  if (typeof seconds !== 'number' && typeof (seconds as any) !== 'string') {
    return '0:00';
  }
  if (typeof (seconds as any) === 'string' && !(seconds as any).trim()) {
    return '0:00';
  }
  const numSeconds = typeof seconds === 'number' ? seconds : Number(seconds);
  if (!Number.isFinite(numSeconds) || numSeconds <= 0 || Object.is(numSeconds, -0)) {
    return '0:00';
  }
  const safeSec = Math.max(0, Math.min(86400, Math.floor(numSeconds)));
  if (Object.is(safeSec, -0) || safeSec <= 0) {
    return '0:00';
  }
  const totalMins = Math.floor(safeSec / 60);
  const remSec = safeSec % 60;
  if (totalMins >= 60) {
    const hrs = Math.floor(totalMins / 60);
    const remMins = totalMins % 60;
    return `${hrs}:${remMins.toString().padStart(2, '0')}:${remSec.toString().padStart(2, '0')}`;
  }
  return `${totalMins}:${remSec.toString().padStart(2, '0')}`;
}

export function buildDynamicIslandPayload(
  attributes?: BrewActivityAttributes | null,
  state?: BrewActivityContentState | null,
  language: 'pl' | 'en' | string = 'pl'
): DynamicIslandPayload {
  const safeSessionId =
    attributes && typeof attributes.sessionId === 'string' && attributes.sessionId.trim()
      ? attributes.sessionId.trim()
      : 'sess_unknown';
  const safeRecipeName =
    attributes && typeof attributes.recipeName === 'string' && attributes.recipeName.trim()
      ? attributes.recipeName.trim().slice(0, 40)
      : 'Napar';
  const safeMethod =
    attributes && typeof attributes.method === 'string' && attributes.method.trim()
      ? attributes.method.trim()
      : 'Drip';
  const safeBevType =
    attributes && attributes.beverageType === 'TEA' ? 'TEA' : 'COFFEE';
  const rawTotWater =
    attributes
      ? (typeof attributes.totalWaterGrams === 'number'
          ? attributes.totalWaterGrams
          : typeof attributes.totalWaterGrams === 'string'
          ? parseFloat(attributes.totalWaterGrams)
          : NaN)
      : 0;
  let safeTotalWater =
    Number.isFinite(rawTotWater) && rawTotWater >= 0
      ? Math.min(50000, Math.round(rawTotWater))
      : 0;
  if (Object.is(safeTotalWater, -0)) safeTotalWater = 0;

  const safeAttr: BrewActivityAttributes = {
    sessionId: safeSessionId,
    recipeName: safeRecipeName,
    method: safeMethod,
    beverageType: safeBevType,
    totalWaterGrams: safeTotalWater,
  };
  const safeState: BrewActivityContentState = state || {
    stepIndex: 0,
    totalSteps: 1,
    stepNamePl: 'Parzenie',
    stepNameEn: 'Brewing',
    stepRemainingSeconds: 0,
    stepDurationSeconds: 0,
    totalElapsedSeconds: 0,
    targetWaterGrams: 0,
    isPaused: false,
    isFinished: false,
  };

  const cleanLang = typeof language === 'string' ? language.trim().toLowerCase() : 'pl';
  const isEn = cleanLang === 'en' || cleanLang.startsWith('en');

  const icon = safeAttr.beverageType === 'TEA' ? '🍵' : '☕';
  const rawDurVal = typeof safeState.stepDurationSeconds === 'number' ? safeState.stepDurationSeconds : (typeof safeState.stepDurationSeconds === 'string' ? parseFloat(safeState.stepDurationSeconds) : NaN);
  let rawDuration = Math.max(0, Number.isFinite(rawDurVal) ? Math.round(rawDurVal) : 0);
  if (Object.is(rawDuration, -0)) rawDuration = 0;
  const rawRemVal = typeof safeState.stepRemainingSeconds === 'number' ? safeState.stepRemainingSeconds : (typeof safeState.stepRemainingSeconds === 'string' ? parseFloat(safeState.stepRemainingSeconds) : NaN);
  let rawRemaining = Math.max(0, Number.isFinite(rawRemVal) ? Math.round(rawRemVal) : 0);
  if (Object.is(rawRemaining, -0)) rawRemaining = 0;
  let safeRemaining = safeState.isFinished ? 0 : (rawDuration > 0 ? Math.min(rawDuration, rawRemaining) : rawRemaining);
  if (Object.is(safeRemaining, -0)) safeRemaining = 0;
  const timeFormatted = formatActivityTimer(safeRemaining);
  const rawStepName =
    (isEn ? safeState.stepNameEn : safeState.stepNamePl) ||
    safeState.stepNamePl ||
    safeState.stepNameEn ||
    (isEn ? 'Step' : 'Krok');
  const stepName = typeof rawStepName === 'string' ? rawStepName.trim().slice(0, 30) : (isEn ? 'Step' : 'Krok');
  const safeTotalSteps = Math.max(1, safeState.totalSteps || 1);
  const safeStepIdx = Math.min(safeTotalSteps - 1, Math.max(0, safeState.stepIndex || 0));
  const subtitle =
    isEn
      ? `${stepName} · Step ${safeStepIdx + 1} of ${safeTotalSteps}`
      : `${stepName} · Krok ${safeStepIdx + 1} z ${safeTotalSteps}`;

  const rawTargetWater =
    typeof safeState.targetWaterGrams === 'number'
      ? safeState.targetWaterGrams
      : typeof safeState.targetWaterGrams === 'string'
      ? parseFloat(safeState.targetWaterGrams)
      : NaN;
  let safeTargetWater =
    Number.isFinite(rawTargetWater) && rawTargetWater >= 0
      ? Math.min(50000, Math.round(rawTargetWater))
      : 0;
  if (Object.is(safeTargetWater, -0)) safeTargetWater = 0;

  const targetWater =
    isEn
      ? `Target: ${safeTargetWater} g (of ${safeTotalWater} g)`
      : `Docelowo: ${safeTargetWater} g (z ${safeTotalWater} g)`;

  return {
    compactLeading: icon,
    compactTrailing: timeFormatted,
    expandedLeadingIcon: icon,
    expandedTrailingTime: timeFormatted,
    expandedCenterTitle: safeRecipeName,
    expandedCenterSubtitle: subtitle,
    expandedBottomTarget: targetWater,
    isPaused: Boolean(safeState.isPaused && !safeState.isFinished),
    isFinished: Boolean(safeState.isFinished),
  };
}

export function buildLiveActivityPayload(
  attributes?: BrewActivityAttributes | null,
  state?: BrewActivityContentState | null,
  language: 'pl' | 'en' | string = 'pl'
): LiveActivityPayload {
  const dynamicIsland = buildDynamicIslandPayload(attributes, state, language);
  const safeAttr: BrewActivityAttributes = {
    sessionId:
      attributes && typeof attributes.sessionId === 'string' && attributes.sessionId.trim()
        ? attributes.sessionId.trim()
        : 'sess_unknown',
    recipeName:
      attributes && typeof attributes.recipeName === 'string' && attributes.recipeName.trim()
        ? attributes.recipeName.trim().slice(0, 40)
        : 'Napar',
    method:
      attributes && typeof attributes.method === 'string' && attributes.method.trim()
        ? attributes.method.trim()
        : 'Drip',
    beverageType: attributes && attributes.beverageType === 'TEA' ? 'TEA' : 'COFFEE',
    totalWaterGrams: (() => {
      const rawW =
        attributes
          ? typeof attributes.totalWaterGrams === 'number'
            ? attributes.totalWaterGrams
            : typeof attributes.totalWaterGrams === 'string'
            ? parseFloat(attributes.totalWaterGrams)
            : NaN
          : NaN;
      const res = Math.max(0, Math.min(50000, Number.isFinite(rawW) ? Math.round(rawW) : 0));
      return Object.is(res, -0) ? 0 : res;
    })(),
  };

  const safeTotalSteps = state ? Math.max(1, Number.isFinite(state.totalSteps) ? Math.round(state.totalSteps) : 1) : 1;
  const rawStepIdx = state ? Math.max(0, Number.isFinite(state.stepIndex) ? Math.round(state.stepIndex) : 0) : 0;
  const safeStepIdx = Math.min(safeTotalSteps - 1, rawStepIdx);

  const safeState: BrewActivityContentState = state
    ? {
        stepIndex: safeStepIdx,
        totalSteps: safeTotalSteps,
        stepNamePl: state.stepNamePl || 'Parzenie',
        stepNameEn: state.stepNameEn || 'Brewing',
        stepRemainingSeconds: (() => {
          if (state.isFinished) return 0;
          const rawDurVal = typeof state.stepDurationSeconds === 'number' ? state.stepDurationSeconds : (typeof state.stepDurationSeconds === 'string' ? parseFloat(state.stepDurationSeconds) : NaN);
          const rawDur = Math.max(0, Number.isFinite(rawDurVal) ? Math.round(rawDurVal) : 0);
          const rawRemVal = typeof state.stepRemainingSeconds === 'number' ? state.stepRemainingSeconds : (typeof state.stepRemainingSeconds === 'string' ? parseFloat(state.stepRemainingSeconds) : NaN);
          const rawRem = Math.max(0, Number.isFinite(rawRemVal) ? Math.round(rawRemVal) : 0);
          const res = rawDur > 0 ? Math.min(rawDur, rawRem) : rawRem;
          return Object.is(res, -0) ? 0 : res;
        })(),
        stepDurationSeconds: (() => {
          const rawVal = typeof state.stepDurationSeconds === 'number' ? state.stepDurationSeconds : (typeof state.stepDurationSeconds === 'string' ? parseFloat(state.stepDurationSeconds) : NaN);
          const res = Math.max(0, Number.isFinite(rawVal) ? Math.round(rawVal) : 0);
          return Object.is(res, -0) ? 0 : res;
        })(),
        totalElapsedSeconds: (() => {
          const rawVal = typeof state.totalElapsedSeconds === 'number' ? state.totalElapsedSeconds : (typeof state.totalElapsedSeconds === 'string' ? parseFloat(state.totalElapsedSeconds) : NaN);
          const res = Math.max(0, Math.min(86400, Number.isFinite(rawVal) ? Math.round(rawVal) : 0));
          return Object.is(res, -0) ? 0 : res;
        })(),
        targetWaterGrams: (() => {
          const rawW = typeof state.targetWaterGrams === 'number' ? state.targetWaterGrams : (typeof state.targetWaterGrams === 'string' ? parseFloat(state.targetWaterGrams) : NaN);
          const res = Math.max(0, Math.min(50000, Number.isFinite(rawW) ? Math.round(rawW) : 0));
          return Object.is(res, -0) ? 0 : res;
        })(),
        isPaused: Boolean(state.isPaused && !state.isFinished),
        isFinished: Boolean(state.isFinished),
      }
    : {
        stepIndex: 0,
        totalSteps: 1,
        stepNamePl: 'Parzenie',
        stepNameEn: 'Brewing',
        stepRemainingSeconds: 0,
        stepDurationSeconds: 0,
        totalElapsedSeconds: 0,
        targetWaterGrams: 0,
        isPaused: false,
        isFinished: false,
      };

  return {
    attributes: safeAttr,
    contentState: safeState,
    dynamicIsland,
  };
}

export async function startLiveActivity(
  attributes: BrewActivityAttributes,
  initialState: BrewActivityContentState,
  _language: 'pl' | 'en' = 'pl'
): Promise<{ activityId?: string; success: boolean; error?: string }> {
  if (!attributes || typeof attributes !== 'object') {
    return {
      success: false,
      error: 'Nieprawidłowe atrybuty aktywności Live Activity.',
    };
  }
  if (!attributes.recipeName || typeof attributes.recipeName !== 'string' || !attributes.recipeName.trim() || attributes.recipeName.trim().length > 100) {
    return {
      success: false,
      error: 'Nieprawidłowa nazwa receptury w atrybutach Live Activity.',
    };
  }
  const rawBev = typeof attributes.beverageType === 'string' ? attributes.beverageType.trim().toUpperCase() : attributes.beverageType;
  if (rawBev !== undefined && rawBev !== 'COFFEE' && rawBev !== 'TEA') {
    return {
      success: false,
      error: 'Nieprawidłowy typ naparu w atrybutach Live Activity (musi być COFFEE lub TEA).',
    };
  }
  if (
    attributes.method !== undefined &&
    (typeof attributes.method !== 'string' || !attributes.method.trim() || attributes.method.trim().length > 50)
  ) {
    return {
      success: false,
      error: 'Nieprawidłowa metoda parzenia w atrybutach Live Activity.',
    };
  }
  const rawWater = typeof attributes.totalWaterGrams === 'number' ? attributes.totalWaterGrams : (typeof attributes.totalWaterGrams === 'string' ? parseFloat(attributes.totalWaterGrams) : NaN);
  if (!Number.isFinite(rawWater) || rawWater <= 0 || rawWater > 50000 || Object.is(rawWater, -0)) {
    return {
      success: false,
      error: 'Nieprawidłowa gramatura wody w atrybutach Live Activity.',
    };
  }
  if (!initialState || typeof initialState !== 'object') {
    return {
      success: false,
      error: 'Nieprawidłowy stan początkowy aktywności Live Activity.',
    };
  }
  if (!Number.isFinite(initialState.stepIndex) || initialState.stepIndex < 0) {
    return {
      success: false,
      error: 'Nieprawidłowy indeks kroku w stanie Live Activity.',
    };
  }
  if (!Number.isFinite(initialState.totalSteps) || initialState.totalSteps <= 0) {
    return {
      success: false,
      error: 'Nieprawidłowa łączna liczba kroków w stanie Live Activity.',
    };
  }
  const rawRemaining = typeof initialState.stepRemainingSeconds === 'number'
    ? initialState.stepRemainingSeconds
    : (typeof initialState.stepRemainingSeconds === 'string' ? parseFloat(initialState.stepRemainingSeconds) : NaN);
  if (!Number.isFinite(rawRemaining) || rawRemaining < 0 || Object.is(rawRemaining, -0) || rawRemaining > 86400) {
    return {
      success: false,
      error: 'Nieprawidłowy pozostały czas kroku w stanie Live Activity (wymagany zakres [0, 86400]).',
    };
  }
  const rawTargetWater = typeof initialState.targetWaterGrams === 'number'
    ? initialState.targetWaterGrams
    : (typeof initialState.targetWaterGrams === 'string' ? parseFloat(initialState.targetWaterGrams) : NaN);
  if (!Number.isFinite(rawTargetWater) || rawTargetWater < 0 || Object.is(rawTargetWater, -0) || rawTargetWater > 50000) {
    return {
      success: false,
      error: 'Nieprawidłowa docelowa waga wody w stanie Live Activity (wymagany zakres [0, 50000]).',
    };
  }
  return {
    success: false,
    error: 'ActivityKit Live Activity niedostępne w v1.0 (DEC-01).',
  };
}

export async function updateLiveActivity(
  activityId: string,
  _state: BrewActivityContentState
): Promise<{ success: boolean; error?: string }> {
  if (!activityId || typeof activityId !== 'string' || !activityId.trim()) {
    return {
      success: false,
      error: 'Nieprawidłowy identyfikator aktywności Live Activity.',
    };
  }
  if (!_state || typeof _state !== 'object') {
    return {
      success: false,
      error: 'Nieprawidłowy stan aktywności Live Activity.',
    };
  }
  if (!Number.isFinite(_state.stepIndex) || _state.stepIndex < 0) {
    return {
      success: false,
      error: 'Nieprawidłowy indeks kroku w stanie Live Activity.',
    };
  }
  if (!Number.isFinite(_state.totalSteps) || _state.totalSteps <= 0) {
    return {
      success: false,
      error: 'Nieprawidłowa łączna liczba kroków w stanie Live Activity.',
    };
  }
  const rawRemaining = typeof _state.stepRemainingSeconds === 'number'
    ? _state.stepRemainingSeconds
    : (typeof _state.stepRemainingSeconds === 'string' ? parseFloat(_state.stepRemainingSeconds) : NaN);
  if (!Number.isFinite(rawRemaining) || rawRemaining < 0 || Object.is(rawRemaining, -0) || rawRemaining > 86400) {
    return {
      success: false,
      error: 'Nieprawidłowy pozostały czas kroku w stanie Live Activity (wymagany zakres [0, 86400]).',
    };
  }
  const rawTargetWater = typeof _state.targetWaterGrams === 'number'
    ? _state.targetWaterGrams
    : (typeof _state.targetWaterGrams === 'string' ? parseFloat(_state.targetWaterGrams) : NaN);
  if (!Number.isFinite(rawTargetWater) || rawTargetWater < 0 || Object.is(rawTargetWater, -0) || rawTargetWater > 50000) {
    return {
      success: false,
      error: 'Nieprawidłowa docelowa waga wody w stanie Live Activity (wymagany zakres [0, 50000]).',
    };
  }
  return {
    success: false,
    error: 'ActivityKit Live Activity niedostępne w v1.0 (DEC-01).',
  };
}

export async function endLiveActivity(
  activityId: string,
  dismissalPolicy: 'immediate' | 'after_delay' = 'immediate'
): Promise<{ success: boolean; error?: string }> {
  if (!activityId || typeof activityId !== 'string' || !activityId.trim()) {
    return {
      success: false,
      error: 'Nieprawidłowy identyfikator aktywności Live Activity.',
    };
  }
  const cleanPolicy = typeof dismissalPolicy === 'string' ? dismissalPolicy.trim().toLowerCase() : 'immediate';
  if (cleanPolicy !== 'immediate' && cleanPolicy !== 'after_delay') {
    return {
      success: false,
      error: 'Nieprawidłowa polityka zakończenia Live Activity (dozwolone: immediate, after_delay).',
    };
  }
  return {
    success: false,
    error: 'ActivityKit Live Activity niedostępne w v1.0 (DEC-01).',
  };
}

export function getActiveLiveActivityId(): string | null {
  return null;
}

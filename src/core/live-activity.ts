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
  if (!Number.isFinite(seconds) || seconds < 0) {
    return '0:00';
  }
  const safeSec = Math.floor(seconds);
  const mins = Math.floor(safeSec / 60);
  const remSec = safeSec % 60;
  return `${mins}:${remSec.toString().padStart(2, '0')}`;
}

export function buildDynamicIslandPayload(
  attributes: BrewActivityAttributes,
  state: BrewActivityContentState,
  language: 'pl' | 'en' = 'pl'
): DynamicIslandPayload {
  const icon = attributes.beverageType === 'COFFEE' ? '☕' : '🍵';
  const timeFormatted = formatActivityTimer(state.stepRemainingSeconds);
  const stepName =
    (language === 'en' ? state.stepNameEn : state.stepNamePl) ||
    state.stepNamePl ||
    state.stepNameEn ||
    (language === 'en' ? 'Step' : 'Krok');
  const safeStepIdx = Math.max(0, state.stepIndex);
  const safeTotalSteps = Math.max(1, state.totalSteps);
  const subtitle =
    language === 'en'
      ? `${stepName} · Step ${safeStepIdx + 1} of ${safeTotalSteps}`
      : `${stepName} · Krok ${safeStepIdx + 1} z ${safeTotalSteps}`;

  const safeTargetWater =
    Number.isFinite(state.targetWaterGrams) && state.targetWaterGrams >= 0
      ? Math.round(state.targetWaterGrams)
      : 0;
  const safeTotalWater =
    Number.isFinite(attributes.totalWaterGrams) && attributes.totalWaterGrams >= 0
      ? Math.round(attributes.totalWaterGrams)
      : 0;

  const targetWater =
    language === 'en'
      ? `Target: ${safeTargetWater} g (of ${safeTotalWater} g)`
      : `Docelowo: ${safeTargetWater} g (z ${safeTotalWater} g)`;

  return {
    compactLeading: icon,
    compactTrailing: timeFormatted,
    expandedLeadingIcon: icon,
    expandedTrailingTime: timeFormatted,
    expandedCenterTitle: attributes.recipeName,
    expandedCenterSubtitle: subtitle,
    expandedBottomTarget: targetWater,
    isPaused: state.isPaused,
    isFinished: state.isFinished,
  };
}

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

export async function startLiveActivity(
  _attributes: BrewActivityAttributes,
  _initialState: BrewActivityContentState,
  _language: 'pl' | 'en' = 'pl'
): Promise<{ activityId?: string; success: boolean; error?: string }> {
  return {
    success: false,
    error: 'ActivityKit Live Activity niedostępne w v1.0 (DEC-01).',
  };
}

export async function updateLiveActivity(
  _activityId: string,
  _state: BrewActivityContentState
): Promise<{ success: boolean; error?: string }> {
  return {
    success: false,
    error: 'ActivityKit Live Activity niedostępne w v1.0 (DEC-01).',
  };
}

export async function endLiveActivity(
  _activityId: string,
  _dismissalPolicy: 'immediate' | 'after_delay' = 'immediate'
): Promise<{ success: boolean; error?: string }> {
  return {
    success: false,
    error: 'ActivityKit Live Activity niedostępne w v1.0 (DEC-01).',
  };
}

export function getActiveLiveActivityId(): string | null {
  return null;
}

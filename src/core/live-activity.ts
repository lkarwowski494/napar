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
  const safeSec = Math.max(0, Math.floor(seconds));
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
  const stepName = language === 'en' ? state.stepNameEn : state.stepNamePl;
  const subtitle =
    language === 'en'
      ? `${stepName} · Step ${state.stepIndex + 1} of ${state.totalSteps}`
      : `${stepName} · Krok ${state.stepIndex + 1} z ${state.totalSteps}`;

  const targetWater =
    language === 'en'
      ? `Target: ${state.targetWaterGrams} g (of ${attributes.totalWaterGrams} g)`
      : `Docelowo: ${state.targetWaterGrams} g (z ${attributes.totalWaterGrams} g)`;

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

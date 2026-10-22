// ============================================================================
// Napar (Steepwise) — Most Live Activity (ActivityKit) dla modułu napar-live-activity
// Na iOS bez ActivityKit, na Androidzie i w Expo Go natywny moduł nie istnieje (null):
// wszystkie funkcje są wtedy no-op i nigdy nie rzucają wyjątku.
// ============================================================================

import { requireOptionalNativeModule } from 'expo-modules-core';

/** Pola zgodne z rekordami Swift (StartRecord, ContentRecord). */
export interface NativeContentPayload {
  stepName: string;
  endAtMs: number;
  pourIndex: number;
  pourTotal: number;
  isPaused: boolean;
  pausedRemainingMs: number;
}

export interface NativeStartPayload extends NativeContentPayload {
  recipeName: string;
  beverageType: string;
  language: string;
}

interface NativeLiveActivityModule {
  start(payload: NativeStartPayload): Promise<string | null>;
  update(activityId: string, payload: NativeContentPayload): Promise<boolean>;
  end(activityId: string): Promise<boolean>;
  endAll(): Promise<boolean>;
}

const native = requireOptionalNativeModule<NativeLiveActivityModule>('NaparLiveActivity');

/** Zwraca identyfikator aktywności albo null (brak modułu, wyłączone Live Activity, błąd). */
export async function startLiveActivity(payload: NativeStartPayload): Promise<string | null> {
  if (!native) return null;
  try {
    return await native.start(payload);
  } catch {
    return null;
  }
}

export async function updateLiveActivity(activityId: string, payload: NativeContentPayload): Promise<boolean> {
  if (!native) return false;
  try {
    return await native.update(activityId, payload);
  } catch {
    return false;
  }
}

export async function endLiveActivity(activityId: string): Promise<boolean> {
  if (!native) return false;
  try {
    return await native.end(activityId);
  } catch {
    return false;
  }
}

/** Kończy wszystkie aktywności tej aplikacji (sprzątanie po zabiciu procesu przy starcie). */
export async function endAllLiveActivities(): Promise<boolean> {
  if (!native) return false;
  try {
    return await native.endAll();
  } catch {
    return false;
  }
}

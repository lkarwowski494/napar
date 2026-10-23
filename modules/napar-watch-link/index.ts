// ============================================================================
// Napar (Steepwise) — Most WatchConnectivity (iPhone) dla zegarka Napar.
// Bez natywnego modułu (Expo Go, Android, testy) albo bez zegarka wszystkie funkcje są no-op:
// zwracają wartości zastępcze i nigdy nie rzucają wyjątku. Decyzje są w core/watch-state.ts.
// ============================================================================

import { EventEmitter, requireOptionalNativeModule } from 'expo-modules-core';

/** Pola zgodne z rekordem Swift StateRecord (klucze wiadomości do zegarka). */
export interface NativeWatchPayload {
  v: number;
  phase: string;
  stepName: string;
  endAtMs: number;
  pausedRemainingMs: number;
  pourIndex: number;
  pourTotal: number;
  language: string;
}

interface NativeWatchLinkModule {
  activate(): Promise<boolean>;
  sendState(payload: NativeWatchPayload): Promise<boolean>;
  clearState(): Promise<boolean>;
}

const native = requireOptionalNativeModule<NativeWatchLinkModule>('NaparWatchLink');
type WatchEvents = { onWatchCommand: (event: unknown) => void };
const emitter = native ? new EventEmitter<WatchEvents>(native as never) : null;

/** Uruchamia sesję WatchConnectivity. Zwraca false, gdy nie ma modułu lub WCSession nie jest obsługiwana. */
export async function activateWatchLink(): Promise<boolean> {
  if (!native) return false;
  try {
    return await native.activate();
  } catch {
    return false;
  }
}

/** Wysyła bieżący stan stoptera (applicationContext: zegarek dostaje ostatni stan). */
export async function sendWatchState(payload: NativeWatchPayload): Promise<boolean> {
  if (!native) return false;
  try {
    return await native.sendState(payload);
  } catch {
    return false;
  }
}

/** Czyści stan na zegarku (powrót do ekranu „brak parzenia”). */
export async function clearWatchState(): Promise<boolean> {
  if (!native) return false;
  try {
    return await native.clearState();
  } catch {
    return false;
  }
}

/**
 * Nasłuch poleceń z zegarka (pause / resume / next jako pole cmd). Zwraca funkcję wyrejestrowującą.
 * Bez modułu nasłuch nie powstaje, a wyrejestrowanie nic nie robi.
 */
export function subscribeWatchCommands(listener: (event: unknown) => void): () => void {
  if (!emitter) return () => undefined;
  const subscription = emitter.addListener('onWatchCommand', listener);
  return () => subscription.remove();
}

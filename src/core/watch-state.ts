// ============================================================================
// Napar (Steepwise) — Apple Watch: czysty model stanu stoptera i sterowanie z zegarka
// (pozycja 22 MVP). Zegarek pokazuje etap, czas do końca etapu, numer zalania i stan
// (parzenie / pauza / koniec). Ten moduł nie importuje React ani expo: wyłącznie dane
// i decyzje. Most WatchConnectivity jest w modules/napar-watch-link, a komponent
// synchronizacji w src/platform/watch-sync.tsx.
// ============================================================================

import type { RecipeStep } from './recipes-data';
import type { TimerSnapshot, TimerStatus } from './timer-engine';

/** Wersja formatu wiadomości. Zegarek odrzuca inne wartości. */
export const WATCH_PAYLOAD_VERSION = 1;

export type WatchLanguage = 'pl' | 'en';
/** Stan widoczny na zegarku. Brak stanu (bezczynny stoper) to null, nie osobna faza. */
export type WatchPhase = 'brewing' | 'paused' | 'finished';
/** Polecenia wysyłane z zegarka do iPhone'a. */
export type WatchCommandKind = 'pause' | 'resume' | 'next';

/** Stan pokazywany na zegarku. */
export interface WatchState {
  phase: WatchPhase;
  stepName: string;
  /** Koniec bieżącego etapu (epoch ms) podczas parzenia; 0 w pauzie i po zakończeniu. */
  endAtMs: number;
  /** Pozostały czas etapu w pauzie (ms); 0 poza pauzą. */
  pausedRemainingMs: number;
  /** Numer zalania (etapu), od 1. */
  pourIndex: number;
  pourTotal: number;
  language: WatchLanguage;
}

/** Wycinek stanu silnika stopera potrzebny do zbudowania WatchState (z TimerSnapshot). */
export interface WatchTimerInput
  extends Pick<
    TimerSnapshot,
    'status' | 'currentStepIndex' | 'totalSteps' | 'stepRemainingSeconds' | 'stepEndAtMs'
  > {
  currentStep: Pick<RecipeStep, 'namePl' | 'nameEn'> | null;
}

/** Język aplikacji zawężony do obsługiwanych przez zegarek (PL / EN). */
export function watchLanguage(language: string): WatchLanguage {
  return language === 'en' ? 'en' : 'pl';
}

/**
 * Mapuje stan stopera na WatchState. Zwraca null, gdy nie ma czego pokazywać
 * (bezczynny stoper albo brak etapu): zegarek wtedy wraca do ekranu „brak parzenia”.
 * Po zakończeniu parzenia stan „koniec” trwa, aż stoper wróci do bezczynności.
 */
export function buildWatchState(
  timer: WatchTimerInput,
  nowMs: number,
  language: WatchLanguage
): WatchState | null {
  const step = timer.currentStep;
  if (timer.status === 'idle' || !step) return null;

  const remainingMs = Math.max(0, Math.round(timer.stepRemainingSeconds * 1000));
  const shared = {
    stepName: language === 'en' ? step.nameEn || step.namePl : step.namePl,
    pourIndex: timer.currentStepIndex + 1,
    pourTotal: timer.totalSteps,
    language,
  };

  if (timer.status === 'finished') {
    return { ...shared, phase: 'finished', endAtMs: 0, pausedRemainingMs: 0 };
  }
  if (timer.status === 'paused') {
    return { ...shared, phase: 'paused', endAtMs: 0, pausedRemainingMs: remainingMs };
  }
  const endAtMs = timer.stepEndAtMs ?? nowMs + remainingMs;
  return { ...shared, phase: 'brewing', endAtMs: Math.round(endAtMs), pausedRemainingMs: 0 };
}

/** Wiadomość do zegarka. Klucze są stałe; zegarek czyta je po nazwie (kontrakt w tests/napar-watch-link.test.ts). */
export interface WatchPayload {
  v: number;
  phase: WatchPhase;
  stepName: string;
  endAtMs: number;
  pausedRemainingMs: number;
  pourIndex: number;
  pourTotal: number;
  language: WatchLanguage;
}

export function toWatchPayload(state: WatchState): WatchPayload {
  return {
    v: WATCH_PAYLOAD_VERSION,
    phase: state.phase,
    stepName: state.stepName,
    endAtMs: state.endAtMs,
    pausedRemainingMs: state.pausedRemainingMs,
    pourIndex: state.pourIndex,
    pourTotal: state.pourTotal,
    language: state.language,
  };
}

/** Postać porównywalna: dwa identyczne stany dają identyczny ciąg (stała kolejność kluczy). */
export function serializeWatchState(state: WatchState): string {
  return JSON.stringify(toWatchPayload(state));
}

export type WatchSendCommand =
  | { kind: 'none' }
  | { kind: 'send'; key: string; payload: WatchPayload }
  | { kind: 'clear' };

/**
 * Decyzja wysyłki. lastKey: undefined = nic jeszcze nie wysłano w tym procesie (zegarek może
 * trzymać stary stan z poprzedniego uruchomienia), null = wyczyszczono, ciąg = ostatnio wysłany stan.
 * Wysyłka tylko przy zmianie stanu: etap, pauza, wznowienie, koniec. Ticki sekundowe nie zmieniają klucza.
 */
export function decideWatchSend(
  lastKey: string | null | undefined,
  next: WatchState | null
): WatchSendCommand {
  if (next === null) {
    return lastKey === null ? { kind: 'none' } : { kind: 'clear' };
  }
  const key = serializeWatchState(next);
  if (key === lastKey) return { kind: 'none' };
  return { kind: 'send', key, payload: toWatchPayload(next) };
}

/** Odczytuje polecenie z wiadomości zegarka. Nieznane lub zniekształcone dane dają null. */
export function parseWatchCommand(raw: unknown): WatchCommandKind | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const cmd = (raw as { cmd?: unknown }).cmd;
  if (cmd === 'pause' || cmd === 'resume' || cmd === 'next') return cmd;
  return null;
}

/**
 * Decyzja, czy polecenie z zegarka wykonać przy bieżącym stanie stopera.
 * „Dalej” tylko podczas parzenia: silnik przy nextStep() w pauzie zostawia czas poprzedniego
 * etapu (pausedRemainingMs), więc nowy etap ruszyłby z błędnym czasem. Zegarek w pauzie
 * nie pokazuje „Dalej”, a polecenie z zewnątrz jest tu odrzucane.
 */
export function decideWatchCommand(
  cmd: WatchCommandKind,
  status: TimerStatus
): WatchCommandKind | null {
  if (cmd === 'pause') return status === 'running' ? 'pause' : null;
  if (cmd === 'resume') return status === 'paused' ? 'resume' : null;
  return status === 'running' ? 'next' : null;
}

/** Most natywny do zegarka (podawany do kontrolera; w testach atrapa). */
export interface WatchTransport {
  sendState(payload: WatchPayload): Promise<boolean>;
  clearState(): Promise<boolean>;
}

export interface WatchSyncController {
  /** Zleca zmianę stanu. Wywołania idą kolejką, więc kolejność wysyłek jest zachowana. */
  sync(next: WatchState | null): Promise<void>;
}

/**
 * Kontroler: pamięta ostatni zlecony stan i wysyła tylko zmiany. Błąd mostu nie przerywa
 * parzenia: zegarek po prostu nie dostaje aktualizacji, a kolejna zmiana stanu spróbuje ponownie.
 */
export function createWatchSyncController(transport: WatchTransport): WatchSyncController {
  let lastKey: string | null | undefined = undefined;
  let queue: Promise<void> = Promise.resolve();

  const enqueue = (job: () => Promise<boolean>): Promise<void> => {
    queue = queue.then(job).then(
      () => undefined,
      () => undefined
    );
    return queue;
  };

  return {
    sync(next) {
      const command = decideWatchSend(lastKey, next);
      switch (command.kind) {
        case 'none':
          return queue;
        case 'clear':
          lastKey = null;
          return enqueue(() => transport.clearState());
        case 'send': {
          lastKey = command.key;
          const payload = command.payload;
          return enqueue(() => transport.sendState(payload));
        }
      }
    },
  };
}

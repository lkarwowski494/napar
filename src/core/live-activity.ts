// ============================================================================
// Napar (Steepwise) — Live Activity: czysty model stanu i sterowanie wywołaniami
// Ekran blokady i Dynamic Island pokazują stan stoptera parzenia (BR-ZEG-003, BR-ZEG-004).
// Ten moduł nie importuje React ani expo: wyłącznie dane i decyzje. Most ActivityKit
// jest w modules/napar-live-activity i podawany tu jako LiveActivityBridge.
// ============================================================================

import type { RecipeStep } from './recipes-data';
import type { TimerSnapshot } from './timer-engine';
import { pickBilingual } from './i18n-loader';

export type LiveActivityLanguage = 'pl' | 'en';
export type LiveBeverageType = 'COFFEE' | 'TEA';

/** Stałe dla jednej aktywności, ustawiane przy starcie. */
export interface LiveActivityAttributes {
  recipeName: string;
  beverageType: LiveBeverageType;
  language: LiveActivityLanguage;
}

/** Zmienny stan wyświetlany na ekranie blokady i w Dynamic Island. */
export interface LiveActivityContentState {
  stepName: string;
  /** Koniec bieżącego etapu (epoch ms). 0 podczas pauzy: wtedy liczy się pausedRemainingMs. */
  endAtMs: number;
  /** Numer zalania (etapu), od 1. */
  pourIndex: number;
  pourTotal: number;
  isPaused: boolean;
  /** Pozostały czas etapu przy pauzie (ms). 0, gdy timer biegnie. */
  pausedRemainingMs: number;
}

/** Wycinek stanu silnika stopera potrzebny do zbudowania ContentState (z TimerSnapshot). */
export interface LiveTimerInput
  extends Pick<
    TimerSnapshot,
    'status' | 'currentStepIndex' | 'totalSteps' | 'stepRemainingSeconds' | 'stepEndAtMs'
  > {
  currentStep: Pick<RecipeStep, 'namePl' | 'nameEn'> | null;
}

/** Język aplikacji zawężony do obsługiwanych przez widżet (PL / EN). */
export function liveActivityLanguage(language: string): LiveActivityLanguage {
  return language === 'pl' ? 'pl' : 'en';
}

/**
 * Mapuje stan stopera na ContentState. Zwraca null, gdy nie ma czego pokazywać
 * (bezczynny timer, zakończone parzenie lub brak etapu): wtedy aktywność się kończy.
 * Podczas pauzy endAtMs jest stałe (0), więc kolejne ticki nie generują zmian.
 */
export function buildLiveActivityContentState(
  timer: LiveTimerInput,
  nowMs: number,
  language: LiveActivityLanguage
): LiveActivityContentState | null {
  if (timer.status !== 'running' && timer.status !== 'paused') return null;
  const step = timer.currentStep;
  if (!step) return null;

  const remainingMs = Math.max(0, Math.round(timer.stepRemainingSeconds * 1000));
  const shared = {
    stepName: pickBilingual(language, step.namePl, step.nameEn || step.namePl),
    pourIndex: timer.currentStepIndex + 1,
    pourTotal: timer.totalSteps,
  };

  if (timer.status === 'paused') {
    return { ...shared, endAtMs: 0, isPaused: true, pausedRemainingMs: remainingMs };
  }

  const endAtMs = timer.stepEndAtMs ?? nowMs + remainingMs;
  return { ...shared, endAtMs: Math.round(endAtMs), isPaused: false, pausedRemainingMs: 0 };
}

/**
 * Serializacja stanu do postaci porównywalnej. Klucze w stałej kolejności,
 * więc dwa identyczne stany dają identyczny ciąg.
 */
export function serializeLiveActivityState(state: LiveActivityContentState): string {
  return JSON.stringify({
    stepName: state.stepName,
    endAtMs: state.endAtMs,
    pourIndex: state.pourIndex,
    pourTotal: state.pourTotal,
    isPaused: state.isPaused,
    pausedRemainingMs: state.pausedRemainingMs,
  });
}

export type LiveActivityCommand =
  | { kind: 'none' }
  | { kind: 'start'; key: string; content: LiveActivityContentState }
  | { kind: 'update'; key: string; content: LiveActivityContentState }
  | { kind: 'end' };

/**
 * Decyzja przejścia. lastKey to klucz ostatnio zleconego stanu (null = brak aktywności).
 * Start, aktualizacja i koniec wykonują się tylko przy zmianie stanu, nie w każdym ticku.
 */
export function decideLiveActivityCommand(
  lastKey: string | null,
  next: LiveActivityContentState | null
): LiveActivityCommand {
  if (next === null) {
    return lastKey === null ? { kind: 'none' } : { kind: 'end' };
  }
  const key = serializeLiveActivityState(next);
  if (key === lastKey) return { kind: 'none' };
  return lastKey === null
    ? { kind: 'start', key, content: next }
    : { kind: 'update', key, content: next };
}

/** Most natywny: identyfikatorem aktywności jest wartość zwracana przez start. */
export interface LiveActivityBridge {
  start(attributes: LiveActivityAttributes, content: LiveActivityContentState): Promise<string | null>;
  update(activityId: string, content: LiveActivityContentState): Promise<boolean>;
  end(activityId: string): Promise<boolean>;
}

export interface LiveActivityController {
  /** Zleca zmianę stanu. Wywołania idą kolejką, więc start zawsze poprzedza update i end. */
  sync(next: LiveActivityContentState | null, attributes: LiveActivityAttributes): Promise<void>;
}

/**
 * Kontroler: pamięta ostatni zlecony stan i kolejkuje wywołania mostu.
 * Błąd mostu (np. wyłączone Live Activity) nie przerywa parzenia: aktywność po prostu nie powstaje.
 */
export function createLiveActivityController(bridge: LiveActivityBridge): LiveActivityController {
  let lastKey: string | null = null;
  let activityId: string | null = null;
  let queue: Promise<void> = Promise.resolve();

  const enqueue = (job: () => Promise<void>): Promise<void> => {
    queue = queue.then(job).catch(() => undefined);
    return queue;
  };

  return {
    sync(next, attributes) {
      const command = decideLiveActivityCommand(lastKey, next);
      switch (command.kind) {
        case 'none':
          return queue;
        case 'start': {
          lastKey = command.key;
          const content = command.content;
          return enqueue(async () => {
            activityId = await bridge.start(attributes, content);
          });
        }
        case 'update': {
          lastKey = command.key;
          const content = command.content;
          return enqueue(async () => {
            if (activityId !== null) await bridge.update(activityId, content);
          });
        }
        case 'end':
          lastKey = null;
          return enqueue(async () => {
            const id = activityId;
            activityId = null;
            if (id !== null) await bridge.end(id);
          });
      }
    },
  };
}

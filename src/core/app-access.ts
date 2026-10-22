// ============================================================================
// Napar (Steepwise) — Dostęp do parzenia (most: polityka <-> baza <-> UI)
// Model M5 S1: darmowy poziom to 7 dni parzenia w miesiącu, Pro znosi limit.
// Historia, edycja, dopisywanie wstecz, eksport, kopia i import są zawsze dostępne.
// Brak okresu próbnego i brak ofert wprowadzających.
// Zakup w aplikacji NIE jest tu zaimplementowany (etap 4b, StoreAdapter).
// Stan Pro (is_pro_active) pochodzi wyłącznie z zakupu i jest poza kopią zapasową.
// Apps4Brew Studio — 100% Offline-First, Zero Telemetry.
// ============================================================================

import { useEffect, useState } from 'react';
import { getCountedBrewDays, getIsProUser, recordCountedBrewDay } from './database';
import {
  FREE_BREW_DAYS_PER_MONTH,
  canStartBrew,
  getDayKey,
  getMonthKey,
  type BrewStartDecision,
  type BrewStartInput,
} from './access-policy';

export interface BrewAccessState {
  isPro: boolean;
  monthDaysUsed: number;
  todayCounted: boolean;
  /** Dni parzenia, które zostały w tym miesiącu (Infinity dla Pro). */
  remainingDays: number;
  freeDaysPerMonth: number;
}

function readBrewStartInput(now: Date, sessionInProgress: boolean): BrewStartInput {
  const today = getDayKey(now);
  const counted = getCountedBrewDays(getMonthKey(today));
  return {
    monthDaysUsed: counted.length,
    todayCounted: counted.includes(today),
    isPro: getIsProUser(),
    sessionInProgress,
  };
}

/** Decyzja o rozpoczęciu parzenia w tej chwili (czyta stan z bazy). */
export function getBrewStartDecision(sessionInProgress: boolean, now: Date = new Date()): BrewStartDecision {
  return canStartBrew(readBrewStartInput(now, sessionInProgress));
}

export function getBrewAccessState(now: Date = new Date()): BrewAccessState {
  const input = readBrewStartInput(now, false);
  const decision = canStartBrew(input);
  return {
    isPro: input.isPro,
    monthDaysUsed: input.monthDaysUsed,
    todayCounted: input.todayCounted,
    remainingDays: decision.remainingDays,
    freeDaysPerMonth: FREE_BREW_DAYS_PER_MONTH,
  };
}

// Każda zamontowana instancja useAppAccess trzyma własną kopię stanu.
// Zmiana licznika powiadamia wszystkie, żeby banery i karty nie pokazywały starych dni.
type AccessListener = () => void;
const accessListeners = new Set<AccessListener>();

function notifyAccessChanged(): void {
  accessListeners.forEach((listener) => listener());
}

/**
 * Wlicza dzień po ukończeniu parzenia zmierzonego timerem.
 * Wpisy ręczne, import i edycja wstecz NIE wywołują tej funkcji.
 */
export function recordTimerBrewCompleted(now: Date = new Date()): void {
  recordCountedBrewDay(getDayKey(now));
  notifyAccessChanged();
}

export function useAppAccess() {
  const [access, setAccess] = useState<BrewAccessState>(() => getBrewAccessState());

  useEffect(() => {
    const listener: AccessListener = () => setAccess(getBrewAccessState());
    accessListeners.add(listener);
    return () => {
      accessListeners.delete(listener);
    };
  }, []);

  const refresh = () => {
    setAccess(getBrewAccessState());
  };

  const checkBrewStart = (sessionInProgress: boolean): BrewStartDecision =>
    getBrewStartDecision(sessionInProgress);

  const recordTimerBrew = () => {
    recordTimerBrewCompleted();
  };

  return {
    ...access,
    refresh,
    checkBrewStart,
    recordTimerBrew,
  };
}

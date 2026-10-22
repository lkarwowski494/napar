// ============================================================================
// Napar (Steepwise) — Dostęp do parzenia (most: polityka <-> baza <-> UI)
// Model M5 S1: darmowy poziom to 7 dni parzenia w miesiącu, Pro znosi limit.
// Historia, edycja, dopisywanie wstecz, eksport, kopia i import są zawsze dostępne.
// Brak okresu próbnego i brak ofert wprowadzających.
// Zakup przez StoreAdapter (etap 4b): stan Pro (is_pro_active) wynika wyłącznie z uprawnień
// sklepu (getAvailablePurchases) i jest poza kopią zapasową. Bez sklepu zakup jest „unavailable”.
// Apps4Brew Studio — 100% Offline-First, Zero Telemetry.
// ============================================================================

import { useEffect, useState } from 'react';
import { getCountedBrewDays, getIsProUser, recordCountedBrewDay, setIsProUser } from './database';
import {
  FREE_BREW_DAYS_PER_MONTH,
  canStartBrew,
  getDayKey,
  getMonthKey,
  hasProEntitlement,
  type BrewStartDecision,
  type BrewStartInput,
  type Entitlement,
} from './access-policy';
import { getStoreAdapter, type PurchaseStatus, type StoreAdapter, type StoreProduct } from './store-port';

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

export type SyncOutcome = 'pro' | 'free' | 'error' | 'unavailable';
export type RestoreOutcome = 'restored' | 'none' | 'error' | 'unavailable';

let storeSync: { adapter: StoreAdapter; stop: () => void } | null = null;

/**
 * Odczytuje uprawnienia ze sklepu i zapisuje stan Pro (is_pro_active).
 * Błąd odczytu nie zmienia stanu: lepiej zostawić poprzedni wynik niż zgubić Pro przez awarię.
 */
export async function syncProEntitlement(): Promise<SyncOutcome> {
  const adapter = getStoreAdapter();
  if (adapter === null) {
    return 'unavailable';
  }
  let entitlements: Entitlement[];
  try {
    entitlements = await adapter.restore();
  } catch {
    return 'error';
  }
  const isPro = hasProEntitlement(entitlements);
  setIsProUser(isPro);
  notifyAccessChanged();
  return isPro ? 'pro' : 'free';
}

/** Nasłuch zmian transakcji i pierwsze uzgodnienie stanu; powtórne wywołanie dla tego samego adaptera nic nie robi. */
export function ensureStoreSync(): void {
  const adapter = getStoreAdapter();
  if (adapter === null) {
    return;
  }
  if (storeSync !== null && storeSync.adapter === adapter) {
    return;
  }
  storeSync?.stop();
  storeSync = {
    adapter,
    stop: adapter.observe(() => {
      void syncProEntitlement();
    }),
  };
  void syncProEntitlement();
}

/**
 * Zakup produktu. Sukces wyłącznie przy potwierdzonej transakcji sklepu.
 * Po sukcesie uprawnienia są uzgadniane z getAvailablePurchases; gdy odczyt się nie uda,
 * Pro wynika z samej transakcji (sklep ją potwierdził).
 */
export async function purchaseProduct(productId: string): Promise<PurchaseStatus> {
  const adapter = getStoreAdapter();
  if (adapter === null) {
    return 'unavailable';
  }
  let status: PurchaseStatus;
  try {
    status = (await adapter.purchase(productId)).status;
  } catch {
    return 'error';
  }
  if (status !== 'success') {
    return status;
  }
  if ((await syncProEntitlement()) === 'error') {
    setIsProUser(true);
    notifyAccessChanged();
  }
  return 'success';
}

/** Przywracanie zakupów: odtwarza Pro z getAvailablePurchases (bez zapisu w kopii). */
export async function restoreProPurchases(): Promise<RestoreOutcome> {
  const outcome = await syncProEntitlement();
  switch (outcome) {
    case 'pro':
      return 'restored';
    case 'free':
      return 'none';
    case 'error':
      return 'error';
    case 'unavailable':
      return 'unavailable';
  }
}

/** Produkty ze sklepu; pusta lista, gdy sklep nie zna żadnego (stan startowy) lub nie odpowiada. */
export async function listStoreProducts(): Promise<StoreProduct[]> {
  const adapter = getStoreAdapter();
  if (adapter === null) {
    return [];
  }
  try {
    return await adapter.listProducts();
  } catch {
    return [];
  }
}

/** Ceny z App Store (displayPrice); w stanie startowym lista pusta i widok pokazuje tekst zastępczy. */
export function useStoreProducts(): StoreProduct[] {
  const [products, setProducts] = useState<StoreProduct[]>([]);

  useEffect(() => {
    let active = true;
    void listStoreProducts().then((list) => {
      if (active && list.length > 0) {
        setProducts(list);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  return products;
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

  useEffect(() => {
    ensureStoreSync();
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

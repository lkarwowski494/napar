// ============================================================================
// Napar (Steepwise) — Polityka dostępu do parzenia (model M5 S1, czysta logika)
// Darmowy poziom: 7 dni parzenia w miesiącu kalendarzowym (decyzja właściciela, 22.10.2026;
// wpis D-001 w docs/research/rejestr-twierdzen.json, źródło: docs/lista-funkcji-mvp.md).
// Dzień parzenia = dzień, w którym ukończono co najmniej jedno parzenie zmierzone timerem.
// Blokada dotyczy wyłącznie ROZPOCZĘCIA parzenia w dniu, którego jeszcze nie wliczono,
// gdy limit jest wyczerpany. Nigdy nie przerywa trwającego parzenia.
// Ten moduł nie zna zegara ani bazy: wszystko przychodzi jako argumenty.
// ============================================================================

/** Limit dni parzenia w miesiącu na darmowym poziomie (D-001). */
export const FREE_BREW_DAYS_PER_MONTH = 7;

/** Plan Pro: dwa plany subskrypcyjne w jednej grupie i jeden zakup dożywotni (produkty w store-products.ts). */
export type ProPlan = 'monthly' | 'yearly' | 'lifetime';

/**
 * Aktywne uprawnienie zwrócone przez sklep (StoreKit, getAvailablePurchases).
 * Stan Pro = co najmniej jedno uprawnienie; ceny i daty nie wchodzą do polityki.
 */
export interface Entitlement {
  productId: string;
  plan: ProPlan;
}

export function hasProEntitlement(entitlements: readonly Entitlement[]): boolean {
  return entitlements.length > 0;
}

/** Dzień lokalny w formacie YYYY-MM-DD. */
export type DayKey = string;

/** Miesiąc lokalny w formacie YYYY-MM. */
export type MonthKey = string;

export type BrewStartReason =
  | 'pro'
  | 'session_in_progress'
  | 'today_counted'
  | 'within_limit'
  | 'limit_reached';

export interface BrewStartInput {
  /** Ile dni parzenia wliczono już w bieżącym miesiącu. */
  monthDaysUsed: number;
  /** Czy dzisiejszy dzień jest już wliczony (kolejne parzenia tego dnia nie zużywają limitu). */
  todayCounted: boolean;
  /** Aktywna subskrypcja (miesięczna, roczna) lub dożywotnia: znosi limit. */
  isPro: boolean;
  /** Trwa parzenie (uruchomiony lub wstrzymany timer). Nigdy nie jest przerywane blokadą. */
  sessionInProgress: boolean;
}

export interface BrewStartDecision {
  allowed: boolean;
  reason: BrewStartReason;
  /** Dni parzenia, które zostały w tym miesiącu (Infinity dla Pro). */
  remainingDays: number;
}

const pad2 = (value: number): string => String(value).padStart(2, '0');

/** Dzień lokalny (nie UTC): użytkownik liczy dni według swojego kalendarza. */
export function getDayKey(date: Date): DayKey {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function getMonthKey(day: DayKey): MonthKey {
  return day.slice(0, 7);
}

/** Dni parzenia, które zostały na darmowym poziomie w miesiącu (nigdy poniżej zera). */
export function remainingFreeBrewDays(monthDaysUsed: number): number {
  return Math.max(0, FREE_BREW_DAYS_PER_MONTH - monthDaysUsed);
}

/**
 * Czy wolno rozpocząć parzenie. Kolejność reguł ma znaczenie:
 * Pro, trwające parzenie i dzień już wliczony są zawsze dozwolone; dopiero nowy dzień ponad limit jest blokowany.
 */
export function canStartBrew(input: BrewStartInput): BrewStartDecision {
  if (input.isPro) {
    return { allowed: true, reason: 'pro', remainingDays: Infinity };
  }
  const remainingDays = remainingFreeBrewDays(input.monthDaysUsed);
  if (input.sessionInProgress) {
    return { allowed: true, reason: 'session_in_progress', remainingDays };
  }
  if (input.todayCounted) {
    return { allowed: true, reason: 'today_counted', remainingDays };
  }
  if (remainingDays === 0) {
    return { allowed: false, reason: 'limit_reached', remainingDays: 0 };
  }
  return { allowed: true, reason: 'within_limit', remainingDays };
}

/**
 * Dopisuje dzień do listy wliczonych dni. Idempotentne (drugie parzenie tego dnia nic nie zmienia)
 * i nigdy nie usuwa dnia: usunięcie parzenia nie zwraca limitu.
 */
export function addCountedBrewDay(countedDays: readonly DayKey[], day: DayKey): DayKey[] {
  if (countedDays.includes(day)) {
    return [...countedDays];
  }
  return [...countedDays, day].sort();
}

/** Podstawia {klucz} w tekście tłumaczenia; nieznane klucze zostają bez zmian. */
export function fillTemplate(template: string, values: Readonly<Record<string, string | number>>): string {
  return template.replace(/\{(\w+)\}/g, (placeholder: string, key: string) =>
    Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : placeholder
  );
}

export interface FreeDaysSnapshot {
  isPro: boolean;
  monthDaysUsed: number;
  remainingDays: number;
  freeDaysPerMonth: number;
}

export interface FreeDaysTemplates {
  freeDaysStatus: string;
  limitReachedStatus: string;
}

/** Tekst stanu darmowego limitu (baner, modal). Dla Pro null: brak informacji o limicie. */
export function describeFreeDays(snapshot: FreeDaysSnapshot, templates: FreeDaysTemplates): string | null {
  if (snapshot.isPro) {
    return null;
  }
  const template = snapshot.remainingDays > 0 ? templates.freeDaysStatus : templates.limitReachedStatus;
  return fillTemplate(template, {
    used: snapshot.monthDaysUsed,
    limit: snapshot.freeDaysPerMonth,
    remaining: snapshot.remainingDays,
  });
}

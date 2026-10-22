// ============================================================================
// Napar (Steepwise) — Repozytorium: dni parzenia wliczone do darmowego limitu
// Stan trzymany w app_settings jako JSON { "RRRR-MM": ["RRRR-MM-DD", ...] }.
// Wpis dnia jest tylko dopisywany: usunięcie parzenia nie zwraca dnia (D-001).
// Klucz jest niepenetrowalny (NON_PORTABLE_SETTING_KEYS): nie wraca z kopii,
// więc import pliku nie może wyzerować licznika.
// ============================================================================

import type { DbPort } from '../db-port';
import { addCountedBrewDay, getMonthKey, type DayKey, type MonthKey } from '../access-policy';
import { getAppSetting, setAppSetting } from './app-settings';

export const FREE_BREW_DAYS_SETTING_KEY = 'free_brew_days';

const MONTH_KEY_PATTERN = /^\d{4}-\d{2}$/;

type CountedDaysByMonth = Record<MonthKey, DayKey[]>;

/** Odczyt z odporną obsługą uszkodzonej wartości: zła wartość daje pusty stan, nie błąd. */
function readAllCountedDays(db: DbPort): CountedDaysByMonth {
  const raw = getAppSetting(db, FREE_BREW_DAYS_SETTING_KEY, '');
  if (!raw) {
    return {};
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {};
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return {};
  }
  const result: CountedDaysByMonth = {};
  for (const [month, days] of Object.entries(parsed as Record<string, unknown>)) {
    if (MONTH_KEY_PATTERN.test(month) && Array.isArray(days)) {
      result[month] = days.filter((day): day is DayKey => typeof day === 'string');
    }
  }
  return result;
}

/** Dni wliczone w podanym miesiącu (posortowane rosnąco). */
export function getCountedBrewDays(db: DbPort, month: MonthKey): DayKey[] {
  return [...(readAllCountedDays(db)[month] ?? [])];
}

/** Wlicza dzień parzenia (timer ukończony). Zwraca listę dni miesiąca po zapisie. */
export function recordCountedBrewDay(db: DbPort, day: DayKey): DayKey[] {
  const all = readAllCountedDays(db);
  const month = getMonthKey(day);
  const next = addCountedBrewDay(all[month] ?? [], day);
  all[month] = next;
  setAppSetting(db, FREE_BREW_DAYS_SETTING_KEY, JSON.stringify(all));
  return next;
}

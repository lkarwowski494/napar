// ============================================================================
// Napar (Steepwise) — Pomocnik testów: stan licznika darmowego limitu (free_brew_days)
// Buduje wartość ustawienia z podaną liczbą wliczonych dni bieżącego miesiąca,
// pomijając dzisiejszy dzień (dzisiejszy dzień zmieniałby wynik testu).
// ============================================================================

import { FREE_BREW_DAYS_PER_MONTH, getDayKey, getMonthKey } from '../../src/core/access-policy';

/** Wartość JSON dla `free_brew_days` z `count` wliczonymi dniami w miesiącu `now`. */
export function freeBrewDaysValue(count: number, now: Date = new Date()): string {
  const today = getDayKey(now);
  const month = getMonthKey(today);
  const days: string[] = [];
  for (let day = 1; days.length < count && day <= 31; day++) {
    const key = `${month}-${String(day).padStart(2, '0')}`;
    if (key !== today) {
      days.push(key);
    }
  }
  return JSON.stringify({ [month]: days });
}

/** Limit wyczerpany: wszystkie dni darmowego poziomu wliczone, dzisiejszy dzień nie. */
export function exhaustedFreeBrewDaysValue(now: Date = new Date()): string {
  return freeBrewDaysValue(FREE_BREW_DAYS_PER_MONTH, now);
}

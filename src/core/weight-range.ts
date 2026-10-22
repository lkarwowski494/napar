// ============================================================================
// Napar (Steepwise) — Zakres wagi bez sztywnego minimum (poz. 14 MVP)
// Steper dozy i wody zmienia wagę o krok. Nie ma sztywnego minimum (dawniej 1 g dla dozy
// i 10 g dla wody), więc użytkownik może zejść do dowolnej wagi dodatniej, np. 5 g.
// Wartości wpisane z klawiatury nie są przycinane (NumInput bez min/max).
// ============================================================================

/** Najmniejsza wartość, do której zbiega steper: 0 g. Nie ma innego dolnego progu. */
export const WEIGHT_FLOOR_GRAMS = 0;

/** Zmienia wagę o krok (g). Wynik zaokrąglony do 0,1 g, nie niższy niż WEIGHT_FLOOR_GRAMS. */
export function stepWeightGrams(current: number, deltaGrams: number): number {
  const next = Math.round((current + deltaGrams) * 10) / 10;
  return Math.max(WEIGHT_FLOOR_GRAMS, next);
}

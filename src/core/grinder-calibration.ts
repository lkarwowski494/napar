// ============================================================================
// Napar (Steepwise) — Kalibracja przelicznika kliknięć z własnych parzeń (poz. 12 MVP)
//
// METODA (decyzja techniczna D-003 w rejestrze):
// Para j to parzenie kawy z zapisanymi klikami (dialed_j), klikami bazowymi modelu
// dla tej metody (base_j) i wynikiem EY_j (%). Cel EY = 20,0 % (środek zakresu 18–22 %,
// rejestr S-001/S-002). Przy przyjętej czułości 0,5 % EY na 1 klik (rejestr S-092):
//   offset_j = (dialed_j − base_j) + (EY_j − 20,0) / 0,5
// offset_j to przesunięcie od tabeli modelu, przy którym ta para trafiłaby w cel.
// Wynik: średnia ważona offset_j z wagą w_j = 1 / (1 + |EY_j − 20,0|). Waga maleje dla
// skrajnych wyników, gdzie liniowe przybliżenie przestaje być wiarygodne.
// Przy mniej niż 3 parach kalibracja nie zmienia nastaw. Przesunięcie jest ograniczone
// do ±5 klików (rejestr S-093), żeby pojedynczy błędny wpis nie przesunął nastawy drastycznie.
// Tabela modeli (grinder-converter.ts) nie jest zmieniana.
// Dane pochodzą z dziennika (brew_sessions). Każda para dotyczy jednego młynka.
// ============================================================================

/** Minimalna liczba par z wynikiem EY, przy której kalibracja jest stosowana (decyzja D-003). */
export const GRINDER_CALIBRATION_MIN_PAIRS = 3;

/** Cel ekstrakcji EY w procentach: środek zakresu Golden Cup 18–22 % (rejestr S-001, S-002). */
export const GRINDER_TARGET_EY_PERCENT = 20.0;

/** Czułość ekstrakcji: zmiana EY na 1 klik (wartość nieźródłowa, rejestr S-092). */
export const GRINDER_EY_PER_CLICK = 0.5;

/** Maksymalne przesunięcie kalibracji w klikach, w obu kierunkach (rejestr S-093). */
export const GRINDER_MAX_SHIFT_CLICKS = 5;

export interface CalibrationPair {
  dialedClicks: number; // kliki zapisane z parzeniem (nastawa wyświetlona w chwili zapisu)
  baseClicks: number; // nastawa bazowa modelu dla tej metody (bez kalibracji)
  extractionYieldPercent: number; // EY z TDS, w procentach
}

export interface GrinderCalibration {
  shiftClicks: number; // przesunięcie względem tabeli modelu (0 gdy nieaktywna)
  pairCount: number; // liczba par, które stworzyły kalibrację
  isActive: boolean; // czy przy tej liczbie par przesunięcie jest stosowane
}

/** Przesunięcie od tabeli modelu, przy którym ta para trafiłaby w cel EY (w klikach). */
export function pairOffsetClicks(pair: CalibrationPair): number {
  const deviation = pair.extractionYieldPercent - GRINDER_TARGET_EY_PERCENT;
  return pair.dialedClicks - pair.baseClicks + deviation / GRINDER_EY_PER_CLICK;
}

/** Waga pary: maleje wraz z odchyleniem EY od celu. */
export function pairWeight(pair: CalibrationPair): number {
  return 1 / (1 + Math.abs(pair.extractionYieldPercent - GRINDER_TARGET_EY_PERCENT));
}

/** Szacuje przesunięcie kliknięć z par jednego młynka. Poniżej progu zwraca 0 (bez zmiany). */
export function estimateGrinderCalibration(pairs: CalibrationPair[]): GrinderCalibration {
  const pairCount = pairs.length;
  if (pairCount < GRINDER_CALIBRATION_MIN_PAIRS) {
    return { shiftClicks: 0, pairCount, isActive: false };
  }

  let weightSum = 0;
  let weightedOffsetSum = 0;
  for (const pair of pairs) {
    const weight = pairWeight(pair);
    weightSum += weight;
    weightedOffsetSum += weight * pairOffsetClicks(pair);
  }

  const mean = weightedOffsetSum / weightSum;
  const limited = Math.max(-GRINDER_MAX_SHIFT_CLICKS, Math.min(GRINDER_MAX_SHIFT_CLICKS, mean));
  return { shiftClicks: Math.round(limited * 100) / 100, pairCount, isActive: true };
}

// ----------------------------------------------------------------------------
// Powiadomienia o zmianie kalibracji (zapis parzenia lub wyzerowanie)
// Ekran parzenia przelicza zalecenie po zmianie; bez tego trzymałby starą nastawę.
// ----------------------------------------------------------------------------

type CalibrationListener = () => void;
const listeners = new Set<CalibrationListener>();

/** Rejestruje słuchacza zmian kalibracji. Zwraca funkcję wyrejestrowującą. */
export function onGrinderCalibrationChanged(listener: CalibrationListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Informuje słuchaczy, że dane kalibracji się zmieniły. */
export function notifyGrinderCalibrationChanged(): void {
  listeners.forEach((listener) => listener());
}

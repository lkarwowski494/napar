// ============================================================================
// Napar (Steepwise) — Własna woda z raportu wodociągów (poz. 9 MVP)
// Czysta logika: walidacja pól formularza i przeliczanie jednostek twardości.
// Jednostka wewnętrzna: mg CaCO₃/L (ppm CaCO₃), tak jak w water-chemistry.ts.
// Wpis w docs/research/rejestr-twierdzen.json: S-091 (przelicznik), D-002 (metoda).
// ============================================================================

import { parseDecimal } from './parse-decimal';

/** 1 °dH (niemiecki stopień twardości) = 17,848 mg CaCO₃/L (rejestr S-091). */
export const MG_CACO3_PER_DEGREE_DH = 17.848;

export type HardnessUnit = 'mgCaCO3' | 'dH';

export interface OwnWaterProfile {
  sourceName: string;
  ghPpm: number; // twardość ogólna, mg CaCO₃/L
  khPpm: number; // zasadowość (KH), mg CaCO₃/L
  updatedAt: string; // ISO 8601
}

export type WaterFieldError = 'empty' | 'invalid' | 'negative';

export type OwnWaterFormField = 'sourceName' | 'gh' | 'kh';

export interface OwnWaterFormInput {
  sourceName: string;
  gh: string;
  kh: string;
  ghUnit: HardnessUnit;
  khUnit: HardnessUnit;
}

export type OwnWaterValidation =
  | { ok: true; profile: OwnWaterProfile }
  | { ok: false; errors: Partial<Record<OwnWaterFormField, WaterFieldError>> };

/** Zaokrąglenie do 0,1 mg CaCO₃/L (dokładność odczytu z raportu). */
export function roundPpm(value: number): number {
  return Math.round(value * 10) / 10;
}

/** Zamienia wartość z wybraną jednostką na mg CaCO₃/L, zaokrąglone do 0,1. */
export function hardnessToPpm(value: number, unit: HardnessUnit): number {
  return unit === 'dH' ? roundPpm(value * MG_CACO3_PER_DEGREE_DH) : roundPpm(value);
}

/**
 * Odczytuje jedno pole liczbowe. Puste (także same spacje) i nieliczbowe wartości są odrzucane,
 * ujemne też. Przecinek jest separatorem dziesiętnym (parseDecimal).
 */
export function parseHardnessField(
  text: string
): { ok: true; value: number } | { ok: false; error: WaterFieldError } {
  if (text.trim() === '') return { ok: false, error: 'empty' };
  const value = parseDecimal(text);
  if (Number.isNaN(value)) return { ok: false, error: 'invalid' };
  if (value < 0) return { ok: false, error: 'negative' };
  return { ok: true, value };
}

/** Waliduje cały formularz i buduje profil z przeliczonymi wartościami ppm. */
export function validateOwnWaterForm(input: OwnWaterFormInput, updatedAt: string): OwnWaterValidation {
  const errors: Partial<Record<OwnWaterFormField, WaterFieldError>> = {};
  const sourceName = input.sourceName.trim();
  if (sourceName === '') errors.sourceName = 'empty';

  const gh = parseHardnessField(input.gh);
  const kh = parseHardnessField(input.kh);
  if (!gh.ok) errors.gh = gh.error;
  if (!kh.ok) errors.kh = kh.error;

  if (sourceName === '' || !gh.ok || !kh.ok) {
    return { ok: false, errors };
  }
  return {
    ok: true,
    profile: {
      sourceName,
      ghPpm: hardnessToPpm(gh.value, input.ghUnit),
      khPpm: hardnessToPpm(kh.value, input.khUnit),
      updatedAt,
    },
  };
}

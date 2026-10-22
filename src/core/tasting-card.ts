// ============================================================================
// Napar (Steepwise) — Karta degustacyjna jako obraz (poz. 31 MVP)
// Czysty model karty z sesji parzenia: nazwa, parametry, ocena, balans, EY,
// nuty i notatki. Renderowanie (TastingCardView) i zapis PNG są poza core.
// ============================================================================

import type { BrewSession } from './database-schema';

export const TASTING_BALANCE_CODES = [
  'balanced',
  'sour',
  'bitter',
  'astringent',
  'weak',
  'too_strong',
] as const;

export type TastingBalanceCode = (typeof TASTING_BALANCE_CODES)[number];

export interface TastingCardModel {
  title: string;
  beverageType: 'COFFEE' | 'TEA';
  method: string;
  brewedAtIso: string;
  inventoryName: string | null;
  doseGrams: number;
  waterGrams: number;
  waterTempCelsius: number;
  totalTimeSeconds: number;
  rating: number | null;
  balance: TastingBalanceCode | null;
  extractionYieldPercent: number | null;
  flavorTags: string[];
  notes: string | null;
}

function nonEmptyOrNull(value: string | undefined | null): string | null {
  if (value === undefined || value === null) return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

function isBalanceCode(value: string | undefined): value is TastingBalanceCode {
  return (TASTING_BALANCE_CODES as readonly string[]).includes(value ?? '');
}

/**
 * Składa model karty z zapisanej sesji. Pola opcjonalne (ocena, EY, balans,
 * nuty, notatki) trafiają do modelu jako null albo pusta lista, gdy brak
 * danych; karta ich wtedy nie pokazuje.
 */
export function buildTastingCardModel(session: BrewSession): TastingCardModel {
  return {
    title: nonEmptyOrNull(session.recipeName) ?? session.method,
    beverageType: session.beverageType,
    method: session.method,
    brewedAtIso: session.brewedAt,
    inventoryName: nonEmptyOrNull(session.inventoryItemName),
    doseGrams: session.doseGrams,
    waterGrams: session.waterGrams,
    waterTempCelsius: session.waterTempCelsius,
    totalTimeSeconds: session.totalTimeSeconds,
    rating: session.rating ? session.rating : null,
    balance: isBalanceCode(session.tasteBalance) ? session.tasteBalance : null,
    extractionYieldPercent:
      session.extractionYieldPercentage && session.extractionYieldPercentage > 0
        ? session.extractionYieldPercentage
        : null,
    flavorTags: [...(session.flavorTags ?? [])],
    notes: nonEmptyOrNull(session.notes),
  };
}

/** Czas parzenia w formacie m:ss (minuty mogą przekraczać 59). */
export function formatTastingDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/** Ocena w skali 0–5 z jednym miejscem po przecinku. */
export function formatTastingRating(rating: number): string {
  return rating.toFixed(1);
}

/** Ekstrakcja (EY) z jednym miejscem po przecinku, bez znaku procenta. */
export function formatTastingYield(percent: number): string {
  return percent.toFixed(1);
}

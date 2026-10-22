// ============================================================================
// Napar (Steepwise) — Repozytorium: pary do kalibracji młynka (poz. 12 MVP)
// Pary czytane z dziennika (brew_sessions). Wyzerowanie kalibracji nie kasuje parzeń:
// zapisuje znacznik czasu w app_settings i liczy tylko parzenia od tego momentu.
// ============================================================================

import type { DbPort } from '../db-port';
import {
  estimateGrinderCalibration,
  type CalibrationPair,
  type GrinderCalibration,
} from '../grinder-calibration';
import { getAppSetting, upsertAppSetting } from './app-settings';

export const CALIBRATION_RESET_PREFIX = 'grinder_calibration_reset_';

const NO_CALIBRATION: GrinderCalibration = { shiftClicks: 0, pairCount: 0, isActive: false };

interface CalibrationPairRow {
  dialed: number;
  base: number;
  ey: number;
}

function resetKey(grinderId: string): string {
  return `${CALIBRATION_RESET_PREFIX}${grinderId}`;
}

/**
 * Pary kawy dla danego młynka, zapisane po `sinceIso` (pusty tekst = wszystkie).
 * Wymagane: kliki, kliki bazowe i EY > 0 (EY wymaga wpisanego TDS).
 */
export function getGrinderCalibrationPairs(
  db: DbPort,
  grinderId: string,
  sinceIso = ''
): CalibrationPair[] {
  const rows = db.getAllSync<CalibrationPairRow>(
    `SELECT grinder_clicks AS dialed, grinder_base_clicks AS base, extraction_yield_percentage AS ey
     FROM brew_sessions
     WHERE grinder_id = ?
       AND grinder_clicks IS NOT NULL
       AND grinder_base_clicks IS NOT NULL
       AND extraction_yield_percentage > 0
       AND brewed_at > ?`,
    [grinderId, sinceIso]
  );
  return rows.map((row) => ({
    dialedClicks: row.dialed,
    baseClicks: row.base,
    extractionYieldPercent: row.ey,
  }));
}

/** Bieżąca kalibracja młynka. Błąd odczytu daje brak kalibracji (nastawy bazowe). */
export function getGrinderCalibration(db: DbPort, grinderId: string): GrinderCalibration {
  try {
    const since = getAppSetting(db, resetKey(grinderId), '');
    return estimateGrinderCalibration(getGrinderCalibrationPairs(db, grinderId, since));
  } catch {
    return NO_CALIBRATION;
  }
}

/** Wyzerowanie: od tej chwili liczą się tylko nowe parzenia tego młynka. */
export function resetGrinderCalibration(db: DbPort, grinderId: string, now: Date = new Date()): void {
  upsertAppSetting(db, resetKey(grinderId), now.toISOString());
}

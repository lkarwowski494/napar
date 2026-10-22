// ============================================================================
// Napar (Steepwise) — Repozytorium: własna woda z raportu wodociągów (poz. 9 MVP)
// Profil zapisany jako jedno ustawienie (JSON) w app_settings. Dzięki temu
// eksport i import kopii zapasowej obejmują go bez zmiany formatu kopii.
// ============================================================================

import type { DbPort } from '../db-port';
import type { OwnWaterProfile } from '../own-water';
import { getAppSetting, upsertAppSetting } from './app-settings';

export const OWN_WATER_SETTING_KEY = 'own_water_profile';

function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

/** Zwraca zapisany profil albo null (brak, uszkodzony JSON lub niepoprawne pola). */
export function getOwnWaterProfile(db: DbPort): OwnWaterProfile | null {
  const raw = getAppSetting(db, OWN_WATER_SETTING_KEY, '');
  if (raw === '') return null;
  try {
    const parsed = JSON.parse(raw) as Partial<OwnWaterProfile>;
    if (
      typeof parsed.sourceName !== 'string' ||
      !isNonNegativeNumber(parsed.ghPpm) ||
      !isNonNegativeNumber(parsed.khPpm) ||
      typeof parsed.updatedAt !== 'string'
    ) {
      return null;
    }
    return {
      sourceName: parsed.sourceName,
      ghPpm: parsed.ghPpm,
      khPpm: parsed.khPpm,
      updatedAt: parsed.updatedAt,
    };
  } catch {
    return null;
  }
}

/** Zapis wprost; błąd propaguje się do wywołującego (formularz pokaże komunikat). */
export function saveOwnWaterProfile(db: DbPort, profile: OwnWaterProfile): void {
  upsertAppSetting(db, OWN_WATER_SETTING_KEY, JSON.stringify(profile));
}

export function deleteOwnWaterProfile(db: DbPort): void {
  db.runSync('DELETE FROM app_settings WHERE key = ?', [OWN_WATER_SETTING_KEY]);
}

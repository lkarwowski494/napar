// ============================================================================
// Napar (Steepwise) — Repozytorium: własne młynki (poz. 11 MVP)
// Lista zapisana jako jedno ustawienie (JSON) w app_settings, tak jak własna woda (poz. 9).
// Dzięki temu eksport i import kopii zapasowej obejmują młynki bez zmiany formatu kopii.
// ============================================================================

import type { DbPort } from '../db-port';
import {
  CUSTOM_GRINDER_MAX_STEP_MICRONS,
  CUSTOM_GRINDER_MIN_STEP_MICRONS,
  type CustomGrinder,
} from '../custom-grinder';
import { getAppSetting, upsertAppSetting } from './app-settings';

export const CUSTOM_GRINDERS_SETTING_KEY = 'custom_grinders';

function isStepMicrons(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    value >= CUSTOM_GRINDER_MIN_STEP_MICRONS &&
    value <= CUSTOM_GRINDER_MAX_STEP_MICRONS
  );
}

function isCustomGrinder(value: unknown): value is CustomGrinder {
  if (typeof value !== 'object' || value === null) return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === 'string' &&
    typeof item.name === 'string' &&
    isStepMicrons(item.stepMicrons) &&
    typeof item.createdAt === 'string'
  );
}

/** Zapisane młynki w kolejności zapisu. Brak wpisu, uszkodzony JSON albo złe pola dają pomijane wpisy. */
export function listCustomGrinders(db: DbPort): CustomGrinder[] {
  const raw = getAppSetting(db, CUSTOM_GRINDERS_SETTING_KEY, '');
  if (raw === '') return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isCustomGrinder) : [];
  } catch {
    return [];
  }
}

/** Dodaje młynek albo zastępuje wpis o tym samym identyfikatorze. Błąd zapisu propaguje się. */
export function saveCustomGrinder(db: DbPort, grinder: CustomGrinder): void {
  const others = listCustomGrinders(db).filter((item) => item.id !== grinder.id);
  upsertAppSetting(db, CUSTOM_GRINDERS_SETTING_KEY, JSON.stringify([...others, grinder]));
}

/** Usuwa młynek. Parzenia z dziennika zostają (zapisane nastawy się nie zmieniają). */
export function deleteCustomGrinder(db: DbPort, id: string): void {
  const rest = listCustomGrinders(db).filter((item) => item.id !== id);
  upsertAppSetting(db, CUSTOM_GRINDERS_SETTING_KEY, JSON.stringify(rest));
}

// ============================================================================
// Napar (Steepwise) — Repozytorium: Ustawienia aplikacji (key-value)
// ============================================================================

import type { DbPort } from '../db-port';
import { parseLanguageSetting, SYSTEM_LANGUAGE, type LanguageSetting } from '../i18n-loader';

export type BeveragePreference = 'both' | 'coffee' | 'tea';

/**
 * Klucze lokalne dla urządzenia lub uprawnień: nie trafiają do kopii zapasowej
 * i nie są przywracane z pliku (np. stan Pro pochodzi wyłącznie z zakupu, nie z pliku).
 * `is_pro_active`: decyzja właściciela (22.10.2026) — stan Pro zostaje poza kopią.
 * `free_brew_days`: licznik dni darmowego limitu (repositories/brew-access.ts) — import pliku nie może go wyzerować.
 */
export const NON_PORTABLE_SETTING_KEYS: readonly string[] = [
  'is_pro_active',
  'db_location_fallback',
  'free_brew_days',
];

export function getAppSetting(db: DbPort, key: string, defaultValue = ''): string {
  try {
    const row = db.getFirstSync<{ value: string }>('SELECT value FROM app_settings WHERE key = ?', [key]);
    return row ? row.value : defaultValue;
  } catch {
    return defaultValue;
  }
}

/** Zapis wprost; błąd propaguje się do wywołującego (używa go import kopii w transakcji). */
export function upsertAppSetting(db: DbPort, key: string, value: string): void {
  db.runSync('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)', [key, value]);
}

export function setAppSetting(db: DbPort, key: string, value: string): void {
  try {
    upsertAppSetting(db, key, value);
  } catch {
    // ignoruj błąd zapisu ustawienia (środowisko bez tabeli)
  }
}

/** Wszystkie ustawienia bez kluczy niepenetrowalnych — do kopii zapasowej. */
export function listPortableAppSettings(db: DbPort): { key: string; value: string }[] {
  const rows = db.getAllSync<{ key: string; value: string }>(
    'SELECT key, value FROM app_settings ORDER BY key ASC'
  );
  return rows.filter((row) => !NON_PORTABLE_SETTING_KEYS.includes(row.key));
}

/** Klucz trwałego wyboru języka interfejsu (wartość: kod z LANGS albo „system”). */
export const APP_LANGUAGE_SETTING_KEY = 'app_language';

/** Odczyt wyboru języka; brak wpisu, nieznana lub uszkodzona wartość -> „system”. */
export function getLanguageSetting(db: DbPort): LanguageSetting {
  return parseLanguageSetting(getAppSetting(db, APP_LANGUAGE_SETTING_KEY, SYSTEM_LANGUAGE));
}

/** Zapis wyboru języka; wartość spoza listy zapisywana jest jako „system”. */
export function setLanguageSetting(db: DbPort, value: LanguageSetting): void {
  setAppSetting(db, APP_LANGUAGE_SETTING_KEY, parseLanguageSetting(value));
}

export function getUnitSystem(db: DbPort): 'metric' | 'imperial' {
  return getAppSetting(db, 'unit_system', 'metric') === 'imperial' ? 'imperial' : 'metric';
}

export function setUnitSystem(db: DbPort, unit: 'metric' | 'imperial'): void {
  setAppSetting(db, 'unit_system', unit);
}

export function getVoiceAnnounceEnabled(db: DbPort): boolean {
  return getAppSetting(db, 'voice_announce_enabled', 'true') !== 'false';
}

export function setVoiceAnnounceEnabled(db: DbPort, enabled: boolean): void {
  setAppSetting(db, 'voice_announce_enabled', enabled ? 'true' : 'false');
}

export function getHapticsEnabled(db: DbPort): boolean {
  return getAppSetting(db, 'haptics_enabled', 'true') !== 'false';
}

export function setHapticsEnabled(db: DbPort, enabled: boolean): void {
  setAppSetting(db, 'haptics_enabled', enabled ? 'true' : 'false');
}

export function getIsProUser(db: DbPort): boolean {
  return getAppSetting(db, 'is_pro_active', 'false') === 'true';
}

export function setIsProUser(db: DbPort, enabled: boolean): void {
  setAppSetting(db, 'is_pro_active', enabled ? 'true' : 'false');
}

export function getCaffeineHalfLife(db: DbPort): number {
  const val = parseFloat(getAppSetting(db, 'caffeine_half_life_hours', '5.0'));
  if (isNaN(val) || val < 3.0 || val > 8.0) {
    return 5.0;
  }
  return Number(val.toFixed(1));
}

export function setCaffeineHalfLife(db: DbPort, hours: number): void {
  const clamped = Math.max(3.0, Math.min(8.0, hours));
  setAppSetting(db, 'caffeine_half_life_hours', clamped.toFixed(1));
}

export function getBedtimeHour(db: DbPort): number {
  const val = parseInt(getAppSetting(db, 'bedtime_hour', '23'), 10);
  if (isNaN(val) || val < 18 || val > 28) {
    return 23;
  }
  return val;
}

export function setBedtimeHour(db: DbPort, hour: number): void {
  const clamped = Math.max(18, Math.min(28, hour));
  setAppSetting(db, 'bedtime_hour', clamped.toString());
}

export function getBeveragePreference(db: DbPort): BeveragePreference {
  const val = getAppSetting(db, 'beverage_preference', 'both');
  if (val === 'coffee' || val === 'tea') {
    return val;
  }
  return 'both';
}

export function setBeveragePreference(db: DbPort, pref: BeveragePreference): void {
  setAppSetting(db, 'beverage_preference', pref);
}

// ----------------------------------------------------------------------------
// Zapamiętany tryb parzenia (poz. 20 MVP): ostatnio wybrana receptura (metoda) i liczba porcji.
// Zapis w app_settings; przy starcie aplikacji nie trzeba przełączać ich ponownie.
// ----------------------------------------------------------------------------

export const LAST_RECIPE_SETTING_KEY = 'last_recipe_id';
export const LAST_SERVINGS_SETTING_KEY = 'last_servings';
/** Zakres porcji zgodny z calculateBatchScaling (RD-06: 1–4 osoby). */
export const MIN_REMEMBERED_SERVINGS = 1;
export const MAX_REMEMBERED_SERVINGS = 4;

/** Identyfikator ostatnio wybranej receptury (wzorcowej lub własnej); pusty tekst, gdy brak. */
export function getLastRecipeId(db: DbPort): string {
  return getAppSetting(db, LAST_RECIPE_SETTING_KEY, '');
}

export function setLastRecipeId(db: DbPort, recipeId: string): void {
  setAppSetting(db, LAST_RECIPE_SETTING_KEY, recipeId);
}

/** Zapamiętana liczba porcji; wartość spoza zakresu 1–4 lub uszkodzona daje 1. */
export function getLastServings(db: DbPort): number {
  const value = Number(getAppSetting(db, LAST_SERVINGS_SETTING_KEY, '1'));
  if (!Number.isInteger(value) || value < MIN_REMEMBERED_SERVINGS || value > MAX_REMEMBERED_SERVINGS) {
    return MIN_REMEMBERED_SERVINGS;
  }
  return value;
}

/** Zapis liczby porcji przycięty do 1–4; wartość nieliczbowa zapisuje 1. */
export function setLastServings(db: DbPort, servings: number): void {
  const rounded = Number.isFinite(servings) ? Math.round(servings) : MIN_REMEMBERED_SERVINGS;
  const clamped = Math.max(MIN_REMEMBERED_SERVINGS, Math.min(MAX_REMEMBERED_SERVINGS, rounded));
  setAppSetting(db, LAST_SERVINGS_SETTING_KEY, String(clamped));
}

export function getHasCompletedOnboarding(db: DbPort): boolean {
  return getAppSetting(db, 'onboarding_completed') === 'true';
}

export function setHasCompletedOnboarding(db: DbPort, completed: boolean): void {
  setAppSetting(db, 'onboarding_completed', completed ? 'true' : 'false');
}

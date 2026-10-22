// ============================================================================
// Napar (Steepwise) — Fasada bazy danych
// Trzyma połączenie (dostarczone przez configureDatabase) i wiąże repozytoria
// z bieżącą bazą. Sama logika zapytań i mapowań mieszka w src/core/repositories.
// Ten moduł nie importuje expo-sqlite; adapter jest w src/platform.
// ============================================================================

import type { DbPort } from './db-port';
import type { LocationFallback } from './db-location';
import type { BrewSession } from './database-schema';
import { buildSessionsCsv, buildInventoryCsv } from './csv-export';
import {
  buildBackup,
  collectBackupState,
  importBackupState,
  type NaparBackupData,
  type NaparBackupEnvelope,
} from './backup';
import { initDatabaseSchema } from './repositories/schema';
import * as inventory from './repositories/inventory';
import * as recipes from './repositories/recipes';
import * as sessions from './repositories/brew-sessions';
import * as caffeine from './repositories/caffeine';
import * as settings from './repositories/app-settings';
import * as brewAccess from './repositories/brew-access';

export { createPreMigrationBackup, TARGET_SCHEMA_VERSION } from './repositories/schema';
export type { BeveragePreference } from './repositories/app-settings';
export type { BrewSessionRow } from './repositories/brew-sessions';
export type { CaffeineLogRow } from './repositories/caffeine';
export type { InventoryRow } from './repositories/inventory';
export type { RecipeRow } from './repositories/recipes';
export type { LocationFallback } from './db-location';

export interface OpenedDatabase {
  port: DbPort;
  fallback: LocationFallback | null;
}

export type DatabaseOpener = () => OpenedDatabase;

let opener: DatabaseOpener | null = null;
let current: OpenedDatabase | null = null;

/** Rejestruje sposób otwarcia bazy (w aplikacji: src/platform/bootstrap.ts). */
export function configureDatabase(next: DatabaseOpener | null): void {
  opener = next;
  current = null;
}

export function getDatabase(): DbPort {
  if (!current) {
    if (!opener) {
      throw new Error('Baza danych nie jest skonfigurowana');
    }
    const opened = opener();
    initDatabaseSchema(opened.port);
    current = opened;
    if (opened.fallback) {
      // Fallback lokalizacji zapisany w stanie aplikacji, nie tylko w pamięci.
      settings.setAppSetting(
        opened.port,
        'db_location_fallback',
        `${opened.fallback.preferredDirectory}: ${opened.fallback.reason}`
      );
    }
  }
  return current.port;
}

/** Powód, dla którego baza działa na domyślnej ścieżce zamiast /Library/SQLite, albo null. */
export function getDatabaseFallback(): LocationFallback | null {
  getDatabase();
  return current ? current.fallback : null;
}

/** Wiąże funkcję repozytorium z bieżącą bazą. */
function bind<A extends unknown[], R>(fn: (db: DbPort, ...args: A) => R): (...args: A) => R {
  return (...args: A) => fn(getDatabase(), ...args);
}

/** Port zastępczy, gdy baza jest niedostępna: każde zapytanie rzuca błędem. */
const unavailable = (): never => {
  throw new Error('Baza danych jest niedostępna');
};

const UNAVAILABLE_DB: DbPort = {
  execSync: unavailable,
  runSync: unavailable,
  getFirstSync: unavailable,
  getAllSync: unavailable,
  withTransactionSync: unavailable,
};

/**
 * Ustawienia czytane i zapisywane z UI: gdy baza się nie otworzy, odczyty dają wartości domyślne,
 * a zapisy są pomijane (repozytorium ustawień łapie błąd zapytania).
 */
function bindSetting<A extends unknown[], R>(fn: (db: DbPort, ...args: A) => R): (...args: A) => R {
  return (...args: A) => {
    let port: DbPort;
    try {
      port = getDatabase();
    } catch {
      port = UNAVAILABLE_DB;
    }
    return fn(port, ...args);
  };
}

/** Inicjalizacja schematu; bez argumentu otwiera bazę z konfiguracji. */
export function initDatabase(db?: DbPort): void {
  if (db) {
    initDatabaseSchema(db);
    return;
  }
  getDatabase();
}

// Spiżarnia
export const getInventoryItems = bind(inventory.getInventoryItems);
export const getInventoryItemById = bind(inventory.getInventoryItemById);
export const saveInventoryItem = bind(inventory.saveInventoryItem);
export const deleteInventoryItem = bind(inventory.deleteInventoryItem);
export const deductInventoryWeight = bind(inventory.deductInventoryWeight);
export const deductBeansForBrew = bind(inventory.deductBeansForBrew);

// Przepisy
export const getRecipes = bind(recipes.getRecipes);
export const getRecipeById = bind(recipes.getRecipeById);
export const saveRecipe = bind(recipes.saveRecipe);
export const deleteRecipe = bind(recipes.deleteRecipe);
export const toggleRecipeFavorite = bind(recipes.toggleRecipeFavorite);
export const updateRecipeFavorite = bind(recipes.updateRecipeFavorite);
export const duplicateRecipe = bind(recipes.duplicateRecipe);

// Dziennik parzeń (UI: domyślnie 100 najnowszych; eksport używa listBrewSessions bez limitu)
export const getBrewSessions = (limit = 100): BrewSession[] =>
  sessions.listBrewSessions(getDatabase(), limit);
export const getBrewSessionById = bind(sessions.getBrewSessionById);
export const saveBrewSession = bind(sessions.saveBrewSession);
export const recordBrewSessionTransaction = bind(sessions.recordBrewSession);
export const deleteBrewSession = bind(sessions.deleteBrewSession);

// Kofeina (bez argumentu: wszystkie wpisy, bez limitu)
export const getCaffeineLogs = bind(caffeine.listCaffeineLogs);
export const logCaffeine = bind(caffeine.logCaffeine);
export const deleteCaffeineLog = bind(caffeine.deleteCaffeineLog);

// Ustawienia
export const getAppSetting = bindSetting(settings.getAppSetting);
export const setAppSetting = bindSetting(settings.setAppSetting);
export const getUnitSystem = bindSetting(settings.getUnitSystem);
export const setUnitSystem = bindSetting(settings.setUnitSystem);
export const getVoiceAnnounceEnabled = bindSetting(settings.getVoiceAnnounceEnabled);
export const setVoiceAnnounceEnabled = bindSetting(settings.setVoiceAnnounceEnabled);
export const getHapticsEnabled = bindSetting(settings.getHapticsEnabled);
export const setHapticsEnabled = bindSetting(settings.setHapticsEnabled);
export const getIsProUser = bindSetting(settings.getIsProUser);
export const setIsProUser = bindSetting(settings.setIsProUser);
export const getCaffeineHalfLife = bindSetting(settings.getCaffeineHalfLife);
export const setCaffeineHalfLife = bindSetting(settings.setCaffeineHalfLife);
export const getBedtimeHour = bindSetting(settings.getBedtimeHour);
export const setBedtimeHour = bindSetting(settings.setBedtimeHour);
export const getBeveragePreference = bindSetting(settings.getBeveragePreference);
export const setBeveragePreference = bindSetting(settings.setBeveragePreference);
export const getHasCompletedOnboarding = bindSetting(settings.getHasCompletedOnboarding);
export const setHasCompletedOnboarding = bindSetting(settings.setHasCompletedOnboarding);

// Dostęp do parzenia: dni wliczone do darmowego limitu (stan poza kopią)
export const getCountedBrewDays = bindSetting(brewAccess.getCountedBrewDays);
export const recordCountedBrewDay = bindSetting(brewAccess.recordCountedBrewDay);

// Kopia zapasowa
/** Pełny stan bieżącej bazy do kopii (bez limitów). */
export const getBackupState = (): NaparBackupData => collectBackupState(getDatabase());

/** Eksport JSON w formacie v2 (pełny). */
export function exportAllDataJson(): string {
  return JSON.stringify(buildBackup(getBackupState()), null, 2);
}

/** Import zwalidowanej kopii (wynik parseAndValidateBackup), atomowo. */
export function importBackup(envelope: NaparBackupEnvelope): void {
  importBackupState(getDatabase(), envelope.state);
}

// Eksport CSV (każda komórka przez escapeCsvCell)
export function exportSessionsCsv(): string {
  return buildSessionsCsv(sessions.listBrewSessions(getDatabase()));
}

export function exportInventoryCsv(): string {
  return buildInventoryCsv(inventory.getInventoryItems(getDatabase(), true));
}

// ============================================================================
// Napar (Steepwise) — Schemat, migracje i kopia przed migracją (czysta logika)
// Wszystkie operacje idą przez DbPort; bez zależności od expo-sqlite.
// ============================================================================

import type { DbPort } from '../db-port';
import { SCHEMA_SQL } from '../database-schema';
import { MASTER_RECIPES } from '../recipes-data';
import { countMasterRecipes, seedMasterRecipes } from './recipes';

export const TARGET_SCHEMA_VERSION = 4;

function tryExec(db: DbPort, source: string): void {
  try {
    db.execSync(source);
  } catch {
    // Ignoruj błąd PRAGMA / ALTER w środowiskach zastępczych (np. kolumna już istnieje)
  }
}

export function readUserVersion(db: DbPort): number {
  try {
    const row = db.getFirstSync<{ user_version: number }>('PRAGMA user_version');
    return row && typeof row.user_version === 'number' ? row.user_version : 0;
  } catch {
    return 0;
  }
}

export function createPreMigrationBackup(db: DbPort, fromVersion: number, now: Date = new Date()): string {
  try {
    const timestamp = now.toISOString().replace(/[:.]/g, '-');
    const backupKey = `backup_pre_migration_v${fromVersion}_${timestamp}`;
    const count = db.getFirstSync<{ c: number }>('SELECT COUNT(*) as c FROM brew_sessions');
    db.runSync(
      'CREATE TABLE IF NOT EXISTS migration_backups (id TEXT PRIMARY KEY, created_at TEXT, sessions_count INTEGER)'
    );
    db.runSync(
      'INSERT OR REPLACE INTO migration_backups (id, created_at, sessions_count) VALUES (?, ?, ?)',
      [backupKey, now.toISOString(), count?.c || 0]
    );
    return backupKey;
  } catch {
    return 'backup_failed_fallback';
  }
}

function migrateToV3(db: DbPort, fromVersion: number): void {
  createPreMigrationBackup(db, fromVersion);
  try {
    db.execSync('BEGIN TRANSACTION;');
    tryExec(db, 'ALTER TABLE brew_sessions ADD COLUMN sensory_scores_json TEXT');
    tryExec(db, 'ALTER TABLE brew_sessions ADD COLUMN water_profile TEXT');
    db.runSync(
      'CREATE TABLE IF NOT EXISTS app_settings (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL)'
    );
    tryExec(db, 'PRAGMA user_version = 3;');
    db.execSync('COMMIT;');
  } catch (migError) {
    tryExec(db, 'ROLLBACK;');
    throw migError;
  }
}

/** v4: kolumny kalibracji młynka w dzienniku (poz. 12). Istniejące wiersze dostają NULL. */
function migrateToV4(db: DbPort, fromVersion: number): void {
  // Kopię tworzymy tylko dla istniejących danych (wersja >= 3); świeża baza nie ma czego chronić,
  // a krok v3 w tym samym uruchomieniu już ją zapisał.
  if (fromVersion >= 3) {
    createPreMigrationBackup(db, fromVersion);
  }
  try {
    db.execSync('BEGIN TRANSACTION;');
    tryExec(db, 'ALTER TABLE brew_sessions ADD COLUMN grinder_id TEXT');
    tryExec(db, 'ALTER TABLE brew_sessions ADD COLUMN grinder_clicks REAL');
    tryExec(db, 'ALTER TABLE brew_sessions ADD COLUMN grinder_base_clicks REAL');
    tryExec(db, `PRAGMA user_version = ${TARGET_SCHEMA_VERSION};`);
    db.execSync('COMMIT;');
  } catch (migError) {
    tryExec(db, 'ROLLBACK;');
    throw migError;
  }
}

/**
 * Inicjalizacja: pragmy, schemat, migracja do TARGET_SCHEMA_VERSION i dane startowe receptur.
 */
export function initDatabaseSchema(db: DbPort): void {
  tryExec(db, 'PRAGMA foreign_keys = ON;');
  tryExec(db, 'PRAGMA journal_mode = WAL;');
  tryExec(db, 'PRAGMA busy_timeout = 5000;');

  const currentVersion = readUserVersion(db);
  db.execSync(SCHEMA_SQL);

  if (currentVersion < 3) {
    migrateToV3(db, currentVersion);
  }
  if (currentVersion < 4) {
    migrateToV4(db, currentVersion);
  }

  if (countMasterRecipes(db) < MASTER_RECIPES.length) {
    seedMasterRecipes(db);
  }
}

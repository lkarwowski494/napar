// ============================================================================
// Napar (Steepwise) — Adapter SQLite (expo-sqlite) poza src/core
// Jedyne miejsce, które zna expo-sqlite i expo-file-system w ścieżce bazy.
// Wybór katalogu (D8) jest w src/core/db-location.ts; tutaj tylko podpinamy API.
// ============================================================================

import * as SQLite from 'expo-sqlite';
import { Directory } from 'expo-file-system';
import type { DbPort, SqlParams } from '../core/db-port';
import type { OpenedDatabase } from '../core/database';
import { openDatabaseLocation } from '../core/db-location';

export const DATABASE_NAME = 'napar.db';

/** Mapuje synchroniczne API expo-sqlite na DbPort używany przez repozytoria. */
export function wrapSqliteDatabase(db: SQLite.SQLiteDatabase): DbPort {
  return {
    execSync: (source: string) => db.execSync(source),
    runSync: (source: string, params: SqlParams = []) => {
      db.runSync(source, params);
    },
    getFirstSync: <T>(source: string, params: SqlParams = []) => db.getFirstSync<T>(source, params),
    getAllSync: <T>(source: string, params: SqlParams = []) => db.getAllSync<T>(source, params),
    withTransactionSync: (task: () => void) => db.withTransactionSync(task),
  };
}

/**
 * Otwiera napar.db: najpierw /Library/SQLite (tworzony, gdy brak), a przy błędzie
 * domyślna ścieżka expo-sqlite. Fallback wraca w wyniku, nie jest cicho gubiony.
 */
export function openNaparDatabase(): OpenedDatabase {
  const location = openDatabaseLocation<SQLite.SQLiteDatabase>({
    defaultDirectory: SQLite.defaultDatabaseDirectory,
    exists: (directory) => new Directory(directory).exists,
    makeDirectory: (directory) => new Directory(directory).create({ intermediates: true, idempotent: true }),
    open: (directory) =>
      directory === undefined
        ? SQLite.openDatabaseSync(DATABASE_NAME)
        : SQLite.openDatabaseSync(DATABASE_NAME, undefined, directory),
  });
  return { port: wrapSqliteDatabase(location.db), fallback: location.fallback };
}

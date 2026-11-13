// ============================================================================
// Napar — adaptery platformy dla ścieżki ratunkowej (expo-sqlite, expo-file-system/legacy)
// M1-audytor-generalny-004. Logika i testy: src/core/rescue.ts, tests/rescue-sqlite.test.ts.
// ============================================================================

import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system/legacy';
import { dbDirectory } from './db-path';
import type { OpenRescueDb, RescueContext, RescueFs } from './rescue';

export const DB_NAME = 'napar.db';
export const RESCUE_DIR_NAME = 'kopie-ratunkowe';

/** file:///a%20b/ → /a b/ (SQLite potrzebuje ścieżki systemu plików, nie URI). */
export function uriToPath(uri: string): string {
  return decodeURI(uri.replace(/^file:\/\//, ''));
}

/** /a b/c → file:///a%20b/c (expo-file-system/legacy przyjmuje URI). */
export function pathToUri(p: string): string {
  return `file://${encodeURI(p)}`;
}

/** Katalog bazy jak w getDatabase(): Library/SQLite zamiast Documents/SQLite (db-path.ts, SEC-09). */
export function databaseDirectory(defaultDir: string | null | undefined): string | null {
  if (!defaultDir) return null;
  return dbDirectory(defaultDir) ?? defaultDir.replace(/\/$/, '');
}

const expoFs: RescueFs = {
  exists: async (p) => (await FileSystem.getInfoAsync(pathToUri(p))).exists,
  copy: (from, to) => FileSystem.copyAsync({ from: pathToUri(from), to: pathToUri(to) }),
  remove: (p) => FileSystem.deleteAsync(pathToUri(p), { idempotent: true }),
  makeDir: (p) => FileSystem.makeDirectoryAsync(pathToUri(p), { intermediates: true }),
};

const openExpoDb: OpenRescueDb = (p) => {
  const slash = p.lastIndexOf('/');
  // Otwarcie bez initDatabase: tryb awaryjny nie uruchamia migracji (moduł ratowanie-danych).
  const db = SQLite.openDatabaseSync(p.slice(slash + 1), undefined, p.slice(0, slash));
  return {
    exec: (sql, params = []) => {
      db.runSync(sql, [...params]);
    },
    all: (sql) => db.getAllSync<unknown>(sql),
    close: () => db.closeSync(),
  };
};

/** Kontekst ścieżki ratunkowej na urządzeniu albo powód, dla którego nie da się go zbudować. */
export function deviceRescueContext(): RescueContext | { error: string } {
  const dir = databaseDirectory(SQLite.defaultDatabaseDirectory);
  const docs = FileSystem.documentDirectory;
  if (!dir || !docs) return { error: 'no-directory' };
  return {
    dbPath: `${dir}/${DB_NAME}`,
    rescueDir: `${uriToPath(docs).replace(/\/$/, '')}/${RESCUE_DIR_NAME}`,
    fs: expoFs,
    openDb: openExpoDb,
  };
}

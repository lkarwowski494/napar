// ============================================================================
// Napar (Steepwise) — Test helper: prawdziwy silnik SQL (sql.js) pod DbPort.
// sql.js to build SQLite w WebAssembly; służy do testów na prawdziwym SQL w Node.
// Nie zastępuje testu na expo-sqlite na urządzeniu (D8, weryfikacja na symulatorze).
// ============================================================================

import initSqlJs, { type Database } from 'sql.js';
import type { DbPort, SqlParams } from '../../src/core/db-port';

export type SqlJsModule = Awaited<ReturnType<typeof initSqlJs>>;

let modulePromise: Promise<SqlJsModule> | null = null;

export function loadSqlJs(): Promise<SqlJsModule> {
  if (!modulePromise) {
    modulePromise = initSqlJs();
  }
  return modulePromise;
}

function queryRows<T>(db: Database, source: string, params: SqlParams): T[] {
  const stmt = db.prepare(source);
  try {
    stmt.bind(params);
    const rows: T[] = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject() as T);
    }
    return rows;
  } finally {
    stmt.free();
  }
}

export interface MemoryDb {
  port: DbPort;
  raw: Database;
}

/** Nowa baza w pamięci, z portem o tym samym kształcie co expo-sqlite (API synchroniczne). */
export function createMemoryDb(SQL: SqlJsModule): MemoryDb {
  const raw = new SQL.Database();
  const port: DbPort = {
    execSync: (source) => {
      raw.exec(source);
    },
    runSync: (source, params = []) => {
      raw.run(source, params);
    },
    getFirstSync: <T>(source: string, params: SqlParams = []) => {
      const rows = queryRows<T>(raw, source, params);
      return rows.length > 0 ? rows[0] : null;
    },
    getAllSync: <T>(source: string, params: SqlParams = []) => queryRows<T>(raw, source, params),
    withTransactionSync: (task) => {
      raw.exec('BEGIN TRANSACTION;');
      try {
        task();
        raw.exec('COMMIT;');
      } catch (error) {
        raw.exec('ROLLBACK;');
        throw error;
      }
    },
  };
  return { port, raw };
}

/** Pełny zrzut tabeli: wiersze posortowane po wszystkich kolumnach (do porównań równości). */
export function dumpTable(port: DbPort, table: string): Record<string, unknown>[] {
  const rows = port.getAllSync<Record<string, unknown>>(`SELECT * FROM ${table}`);
  const key = (row: Record<string, unknown>): string => JSON.stringify(Object.entries(row).sort());
  return rows.sort((a, b) => (key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0));
}

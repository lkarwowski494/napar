// ============================================================================
// Adapter testowy: synchroniczne API expo-sqlite na prawdziwym SQLite (node:sqlite).
// M1-audytor-generalny-001 (08-programista-008): testy warstwy danych mają wykonywać
// prawdziwy SQL (klucze obce, kaskady, REPLACE, transakcje), a nie emulację na Map.
//
// Baza otwierana jest z enableForeignKeyConstraints: false, czyli tak jak SQLite
// w aplikacji: klucze obce włącza kod produkcyjny (PRAGMA foreign_keys = ON),
// nie sterownik testowy (moduł sqlite-expo roli 08; nodejs.org/api/sqlite.html).
// ============================================================================

const { DatabaseSync } = require('node:sqlite');

function toParams(args) {
  // expo-sqlite: runSync(sql, [a, b]) | runSync(sql, a, b) | runSync(sql, { $x: 1 })
  if (args.length === 0) return [];
  if (args.length === 1 && Array.isArray(args[0])) return args[0];
  if (args.length === 1 && args[0] !== null && typeof args[0] === 'object') return [args[0]];
  return args;
}

function normalize(value) {
  // expo-sqlite przyjmuje boolean i undefined; node:sqlite nie.
  if (value === undefined) return null;
  if (typeof value === 'boolean') return value ? 1 : 0;
  return value;
}

function bind(params) {
  if (params.length === 1 && params[0] !== null && typeof params[0] === 'object' && !Array.isArray(params[0])) {
    const named = {};
    for (const [k, v] of Object.entries(params[0])) named[k] = normalize(v);
    return [named];
  }
  return params.map(normalize);
}

function plain(row) {
  // node:sqlite zwraca obiekty z prototypem null; expo-sqlite zwykłe obiekty.
  return row === undefined ? null : { ...row };
}

const failures = [];

function maybeFail(sql) {
  for (const f of failures) {
    if (f.test(sql)) throw new Error(`disk I/O error (wstrzyknięty w teście): ${sql.slice(0, 60)}`);
  }
}

class NodeSQLiteDatabase {
  constructor(path) {
    this.databasePath = path;
    this.native = new DatabaseSync(path, { enableForeignKeyConstraints: false });
  }

  execSync(source) {
    maybeFail(source);
    this.native.exec(source);
  }

  runSync(sql, ...args) {
    maybeFail(sql);
    const r = this.native.prepare(sql).run(...bind(toParams(args)));
    return { lastInsertRowId: Number(r.lastInsertRowid), changes: Number(r.changes) };
  }

  getFirstSync(sql, ...args) {
    maybeFail(sql);
    return plain(this.native.prepare(sql).get(...bind(toParams(args))));
  }

  getAllSync(sql, ...args) {
    maybeFail(sql);
    return this.native.prepare(sql).all(...bind(toParams(args))).map(plain);
  }

  prepareSync(sql) {
    const stmt = this.native.prepare(sql);
    return {
      executeSync: (...args) => {
        const p = bind(toParams(args));
        const r = stmt.run(...p);
        return {
          lastInsertRowId: Number(r.lastInsertRowid),
          changes: Number(r.changes),
          getFirstSync: () => plain(stmt.get(...p)),
          getAllSync: () => stmt.all(...p).map(plain),
        };
      },
      finalizeSync: () => undefined,
    };
  }

  withTransactionSync(task) {
    this.native.exec('BEGIN');
    try {
      task();
      this.native.exec('COMMIT');
    } catch (e) {
      this.native.exec('ROLLBACK');
      throw e;
    }
  }

  closeSync() {
    this.native.close();
  }
}

/**
 * Fabryka modułu do jest.mock('expo-sqlite', ...).
 * openDatabaseSync otwiera plik podany w opts.path testu albo bazę w pamięci.
 */
function createExpoSqliteMock() {
  const state = { nextPath: ':memory:', opened: [] };
  return {
    __esModule: true,
    defaultDatabaseDirectory: undefined,
    openDatabaseSync: (name, _options, dir) => {
      // Z katalogiem: plik dir/name (np. weryfikacja kopii); bez katalogu: ścieżka ustawiona przez test.
      const db = new NodeSQLiteDatabase(dir ? `${dir.replace(/\/$/, '')}/${name}` : state.nextPath);
      state.opened.push(db);
      return db;
    },
    __setNextPath: (p) => {
      state.nextPath = p;
    },
    __failOn: (re) => {
      failures.push(re);
    },
    __clearFailures: () => {
      failures.length = 0;
    },
    __closeAll: () => {
      for (const db of state.opened.splice(0)) {
        try {
          db.closeSync();
        } catch {
          // już zamknięta
        }
      }
    },
  };
}

module.exports = { NodeSQLiteDatabase, createExpoSqliteMock };

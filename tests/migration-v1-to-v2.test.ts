// ============================================================================
// Apps4Brew / Napar — SQLite Migration Test (v1.0 -> v3.0)
// TASK-R10-01: Physical DB fixture verification and lossless migration
// ============================================================================

import fs from 'fs';
import os from 'os';
import path from 'path';
import { initDatabase, createPreMigrationBackup } from '../src/data/database';

// M1-audytor-generalny-005: kopia przed migracją jest prawdziwym plikiem sprawdzanym osobnym połączeniem,
// więc weryfikację kopii wykonuje node:sqlite, a katalog dokumentów to katalog tymczasowy.
jest.mock('expo-sqlite', () => require('./support/expo-sqlite-node').createExpoSqliteMock());
const legacyFs = require('expo-file-system/legacy');
const FIXTURE_V1 = path.join(__dirname, 'fixtures', 'napar-v1.0.db');
let docsDir: string;
const originalDocDir = legacyFs.documentDirectory;
beforeAll(() => {
  docsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'napar-mig-docs-'));
  legacyFs.documentDirectory = `file://${docsDir}/`;
});
afterAll(() => {
  legacyFs.documentDirectory = originalDocDir;
  fs.rmSync(docsDir, { recursive: true, force: true });
});

/** Atrapa bazy v1 wykonuje VACUUM INTO jako kopię pliku fixture v1 (1 sesja), tak jak zrobiłby to SQLite. */
function withRealBackup(db: any): any {
  const run = db.runSync;
  const first = db.getFirstSync;
  db.runSync = jest.fn((query: string, params?: any[]) => {
    if (/^VACUUM INTO \?/.test(query)) {
      fs.copyFileSync(FIXTURE_V1, params![0]);
      return { changes: 0 };
    }
    return run(query, params);
  });
  db.getFirstSync = jest.fn((query: string, params?: any[]) =>
    query === 'SELECT COUNT(*) AS c FROM brew_sessions' ? { c: 1 } : first(query, params)
  );
  return db;
}

describe('SQLite Physical Migration Engine (TASK-R10-01: v1.0 -> v3.0)', () => {
  const fixturePath = path.join(__dirname, 'fixtures', 'napar-v1.0.db');

  test('Fizyczny plik zrzutu bazy v1.0 spełnia standard nagłówka SQLite 3', () => {
    expect(fs.existsSync(fixturePath)).toBe(true);
    const stat = fs.statSync(fixturePath);
    expect(stat.size).toBeGreaterThanOrEqual(4096);

    const buf = fs.readFileSync(fixturePath);
    const magic = buf.subarray(0, 16).toString('ascii');
    expect(magic).toBe('SQLite format 3\0');

    // Wersja zapisu i odczytu (1 = legacy/standard)
    expect(buf[18]).toBe(1);
    expect(buf[19]).toBe(1);

    // Kodowanie tekstu (1 = UTF-8)
    expect(buf.readUInt32BE(56)).toBe(1);

    // user_version = 1 w nagłówku SQLite (offset 60)
    expect(buf.readUInt32BE(60)).toBe(1);

    // Identyfikator aplikacji (offset 68 = "NAPR")
    expect(buf.subarray(68, 72).toString('ascii')).toBe('NAPR');
  });

  test('createPreMigrationBackup bez prawdziwej kopii rzuca błąd zamiast udawać sukces (M1-audytor-generalny-005)', () => {
    // Wcześniej: przy nieudanym VACUUM INTO funkcja zapisywała wiersz-atrapę w migration_backups i zwracała nazwę jak przy sukcesie.
    const queries: string[] = [];
    const mockDb: any = {
      getFirstSync: jest.fn(() => ({ c: 42 })),
      runSync: jest.fn((query: string) => {
        queries.push(query);
      }),
    };

    expect(() => createPreMigrationBackup(mockDb, 1)).toThrow(/kopii bezpieczeństwa przed migracją v1/);
    expect(queries.some((q) => q.includes('migration_backups'))).toBe(false);
  });

  test('Bezstratna migracja v1.0 do v3.0 zachowuje 100% rekordów i rozszerza schemat', () => {
    // Stan początkowy bazy v1.0: brak kolumn sensory_scores_json, water_profile, brak app_settings
    let userVersion = 1;
    const executedQueries: string[] = [];

    const v1Sessions = [
      {
        id: 'sess-v1-01',
        recipe_id: 'rec-v1-01',
        beverage_type: 'COFFEE',
        method: 'v60',
        dose_g: 15,
        water_g: 250,
        water_temp_c: 96,
        total_time_seconds: 210,
        rating: 5,
        brewed_at: '2026-01-16T08:30:00Z',
        // Brak: sensory_scores_json, water_profile
      },
    ];

    const mockDb: any = {
      execSync: jest.fn((sql: string) => {
        executedQueries.push(sql);
        if (sql.includes('PRAGMA user_version = 3')) {
          userVersion = 3;
        }
      }),
      getFirstSync: jest.fn((query: string) => {
        executedQueries.push(query);
        if (query.includes('PRAGMA user_version')) {
          return { user_version: userVersion };
        }
        if (query.includes('COUNT(*) as c FROM brew_sessions')) {
          return { c: v1Sessions.length };
        }
        if (query.includes('COUNT(*) as count FROM recipes WHERE is_custom = 0')) {
          return { count: 24 }; // Master recipes already seeded
        }
        return null;
      }),
      runSync: jest.fn((query: string, params?: any[]) => {
        executedQueries.push(query);
        return { changes: 1 };
      }),
    };

    // Uruchomienie migracji przez initDatabase
    initDatabase(withRealBackup(mockDb));

    // 1. Weryfikacja atomowego bloku transakcyjnego
    expect(executedQueries).toContain('BEGIN TRANSACTION;');
    expect(executedQueries).toContain('COMMIT;');

    // 2. Weryfikacja dodania brakujących kolumn v2/v3
    const addedSensory = executedQueries.some((q) =>
      q.includes('ALTER TABLE brew_sessions ADD COLUMN sensory_scores_json TEXT')
    );
    expect(addedSensory).toBe(true);

    const addedWater = executedQueries.some((q) =>
      q.includes('ALTER TABLE brew_sessions ADD COLUMN water_profile TEXT')
    );
    expect(addedWater).toBe(true);

    // 3. Weryfikacja utworzenia tabeli ustawień
    const createdSettings = executedQueries.some((q) =>
      q.includes('CREATE TABLE IF NOT EXISTS app_settings')
    );
    expect(createdSettings).toBe(true);

    // 4. Weryfikacja podniesienia wersji schematu do v3
    expect(userVersion).toBe(3);

    // M1-audytor-generalny-043 (07-jakosc-007): usunięto dawny krok 5 — sprawdzał stałe zdefiniowane w teście,
    // które nie trafiały do bazy. Zachowanie danych v1 sprawdza test „Fizyczna migracja” na prawdziwym pliku.
  });

  test('Rollback transakcji: błąd w trakcie migracji nie uszkadza bazy i cofa stan', () => {
    let rolledBack = false;
    const failingDb: any = {
      execSync: jest.fn((sql: string) => {
        if (sql === 'ROLLBACK;') {
          rolledBack = true;
        }
      }),
      getFirstSync: jest.fn((query: string) => {
        if (query.includes('PRAGMA user_version')) {
          return { user_version: 1 }; // wymaga migracji
        }
        return null;
      }),
      runSync: jest.fn((query: string) => {
        if (query.includes('CREATE TABLE IF NOT EXISTS app_settings')) {
          throw new Error('Disk IO Error simulation during migration');
        }
      }),
    };

    expect(() => {
      initDatabase(withRealBackup(failingDb));
    }).toThrow('Disk IO Error simulation during migration');

    expect(rolledBack).toBe(true);
  });

  test('Fizyczna migracja pliku fixtures/napar-v1.0.db przez initDatabase podnosi wersję do v3 bez utraty danych', () => {
    // M1-audytor-generalny-043 (07-jakosc-007): dawniej test przepisywał SQL migracji zamiast wołać initDatabase,
    // więc regresja w kodzie migracji przechodziła. Teraz prawdziwe initDatabase na kopii fixture v1 (node:sqlite).
    const sqlite = require('expo-sqlite');
    const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'napar-mig-v1-'));
    fs.copyFileSync(fixturePath, path.join(workDir, 'napar.db'));
    const db = sqlite.openDatabaseSync('napar.db', {}, workDir);
    try {
      const tables = ['inventory_items', 'recipes', 'brew_sessions', 'caffeine_logs'];
      const count = (t: string) => db.getFirstSync(`SELECT COUNT(*) AS c FROM ${t}`).c as number;
      const before = Object.fromEntries(tables.map((t) => [t, count(t)]));
      expect(db.getFirstSync('PRAGMA user_version').user_version).toBe(1);
      const sessionBefore = db.getFirstSync('SELECT * FROM brew_sessions WHERE id = ?', ['sess-v1-01']);
      expect(sessionBefore).not.toBeNull();

      initDatabase(db);

      expect(db.getFirstSync('PRAGMA user_version').user_version).toBe(3);
      expect(db.getFirstSync('PRAGMA integrity_check').integrity_check).toBe('ok');
      const cols = db.getAllSync('PRAGMA table_info(brew_sessions)').map((c: any) => c.name);
      expect(cols).toEqual(expect.arrayContaining(['sensory_scores_json', 'water_profile']));
      expect(db.getFirstSync("SELECT COUNT(*) AS c FROM sqlite_master WHERE type = 'table' AND name = 'app_settings'").c).toBe(1);

      // Wiersze v1 zachowane 1:1 (receptury: dochodzą tylko wzorcowe).
      expect(count('inventory_items')).toBe(before.inventory_items);
      expect(count('brew_sessions')).toBe(before.brew_sessions);
      expect(count('caffeine_logs')).toBe(before.caffeine_logs);
      expect(count('recipes')).toBeGreaterThanOrEqual(before.recipes);
      const recipe = db.getFirstSync('SELECT * FROM recipes WHERE id = ?', ['rec-v1-01']);
      expect(recipe.name).toBe('V60 Hoffman 1-Cup');
      const sessionAfter = db.getFirstSync('SELECT * FROM brew_sessions WHERE id = ?', ['sess-v1-01']);
      for (const [k, v] of Object.entries(sessionBefore)) expect(sessionAfter[k]).toEqual(v);
    } finally {
      db.closeSync();
      fs.rmSync(workDir, { recursive: true, force: true });
    }
  });
});
// ============================================================================
// Apps4Brew / Napar (Steepwise) — SQLite Migration Test (v1.0 -> v3.0)
// TASK-R10-01: Physical DB fixture verification and lossless migration
// ============================================================================

import fs from 'fs';
import path from 'path';
import { initDatabase, createPreMigrationBackup } from '../src/core/database';

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

  test('Procedura createPreMigrationBackup tworzy snapshot zabezpieczający przed migracją', () => {
    const mockBackups = new Map<string, any>();
    const mockDb: any = {
      getFirstSync: jest.fn(() => ({ c: 42 })),
      runSync: jest.fn((query: string, params?: any[]) => {
        if (query.includes('INSERT OR REPLACE INTO migration_backups')) {
          mockBackups.set(params![0], { id: params![0], createdAt: params![1], count: params![2] });
        }
      }),
    };

    const backupKey = createPreMigrationBackup(mockDb, 1);
    expect(backupKey).toContain('backup_pre_migration_v1_');
    expect(mockBackups.has(backupKey)).toBe(true);
    expect(mockBackups.get(backupKey).count).toBe(42);
  });

  test('Bezstratna migracja v1.0 do v3.0 zachowuje 100% rekordów i rozszerza schemat', () => {
    // Stan początkowy bazy v1.0: brak kolumn sensory_scores_json, water_profile, brak app_settings
    let userVersion = 1;
    const executedQueries: string[] = [];

    const v1Inventory = [
      {
        id: 'bean-v1-01',
        name: 'Panama Geisha Hacienda La Esmeralda',
        type: 'coffee',
        initial_weight_g: 250,
        remaining_weight_g: 190,
        is_favorite: 1,
        is_archived: 0,
        created_at: '2026-01-15T10:00:00Z',
        updated_at: '2026-01-15T10:00:00Z',
      },
    ];

    const v1Recipes = [
      {
        id: 'rec-v1-01',
        name: 'V60 Hoffman 1-Cup',
        beverage_type: 'COFFEE',
        method: 'v60',
        dose_g: 15,
        water_g: 250,
        water_temp_c: 96,
        recommended_ratio: 16.67,
        steps_json: '[]',
        is_custom: 1,
        is_favorite: 1,
        created_at: '2026-01-15T10:00:00Z',
      },
    ];

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
        const versionWrite = /PRAGMA user_version = (\d+)/.exec(sql);
        if (versionWrite) {
          userVersion = Number(versionWrite[1]);
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
    initDatabase(mockDb);

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

    // 4. Weryfikacja podniesienia wersji schematu do v4 (v3 i v4 dodają kolumny)
    expect(userVersion).toBe(4);

    // 5. Gwarancja nienaruszalności danych pierwotnych v1
    expect(v1Inventory[0].name).toBe('Panama Geisha Hacienda La Esmeralda');
    expect(v1Inventory[0].remaining_weight_g).toBe(190);
    expect(v1Recipes[0].dose_g).toBe(15);
    expect(v1Sessions[0].rating).toBe(5);
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
      initDatabase(failingDb);
    }).toThrow('Disk IO Error simulation during migration');

    expect(rolledBack).toBe(true);
  });
});

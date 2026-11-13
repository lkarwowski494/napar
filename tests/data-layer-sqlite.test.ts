// ============================================================================
// Warstwa danych na prawdziwym SQLite (node:sqlite) — M1-audytor-generalny-001 (08-programista-008)
// Testy wołają kod produkcyjny z src/core/database.ts przez adapter expo-sqlite
// z tests/support/expo-sqlite-node.js. Kaskady, klucze obce i transakcje są prawdziwe.
// ============================================================================

import fs from 'fs';
import os from 'os';
import path from 'path';

jest.mock('expo-sqlite', () => require('./support/expo-sqlite-node').createExpoSqliteMock());

type DbModule = typeof import('../src/core/database');
type SqliteMock = {
  __setNextPath: (p: string) => void;
  __closeAll: () => void;
};

const FIXTURE_V1 = path.join(__dirname, 'fixtures', 'napar-v1.0.db');

let tmpDir: string;

function loadDatabase(dbPath = ':memory:'): { db: DbModule; sqlite: SqliteMock } {
  let db!: DbModule;
  let sqlite!: SqliteMock;
  jest.isolateModules(() => {
    sqlite = require('expo-sqlite');
    sqlite.__setNextPath(dbPath);
    db = require('../src/core/database');
  });
  return { db, sqlite };
}

function count(db: DbModule, sql: string, ...params: (string | number)[]): number {
  const row = db.getDatabase().getFirstSync<{ c: number }>(sql, params);
  return row ? row.c : -1;
}

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'napar-sqlite-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('Warstwa danych na node:sqlite (M1-audytor-generalny-001)', () => {
  test('świeża baza: kod produkcyjny włącza klucze obce, schemat w wersji 3, receptury wzorcowe', () => {
    const { db, sqlite } = loadDatabase();
    const conn = db.getDatabase();
    expect(conn.getFirstSync<{ foreign_keys: number }>('PRAGMA foreign_keys')).toEqual({ foreign_keys: 1 });
    expect(conn.getFirstSync<{ user_version: number }>('PRAGMA user_version')).toEqual({ user_version: 3 });
    expect(count(db, 'SELECT COUNT(*) AS c FROM recipes WHERE is_custom = 0')).toBeGreaterThan(0);
    sqlite.__closeAll();
  });

  test('zapis i odczyt paczki, sesji i logu kofeiny przechodzi przez prawdziwy SQL', () => {
    const { db, sqlite } = loadDatabase();
    db.saveInventoryItem({
      id: 'bean-1',
      name: 'Etiopia Guji',
      type: 'coffee',
      initialWeightGrams: 250,
      remainingWeightGrams: 250,
      flavorNotes: ['jaśmin'],
      isFavorite: false,
      isArchived: false,
      createdAt: '2026-11-01T08:00:00.000Z',
      updatedAt: '2026-11-01T08:00:00.000Z',
    });
    db.recordBrewSessionTransaction(
      {
        id: 'session-1',
        inventoryItemId: 'bean-1',
        inventoryItemName: 'Etiopia Guji',
        beverageType: 'COFFEE',
        method: 'V60',
        doseGrams: 15,
        waterGrams: 250,
        waterTempCelsius: 94,
        totalTimeSeconds: 180,
        flavorTags: [],
        brewedAt: '2026-11-02T08:00:00.000Z',
      },
      { itemId: 'bean-1', doseGrams: 15 },
      {
        id: 'log-1',
        brewSessionId: 'session-1',
        beverageName: 'V60',
        beverageType: 'coffee',
        consumedAt: '2026-11-02T08:00:00.000Z',
        doseGrams: 15,
        caffeineMg: 120,
      }
    );

    expect(db.getInventoryItemById('bean-1')?.remainingWeightGrams).toBe(235);
    const sessions = db.getBrewSessions();
    expect(sessions.map((s) => [s.id, s.inventoryItemId, s.doseGrams])).toEqual([['session-1', 'bean-1', 15]]);
    expect(db.getCaffeineLogs().map((l) => [l.id, l.brewSessionId, l.caffeineMg])).toEqual([['log-1', 'session-1', 120]]);
    sqlite.__closeAll();
  });

  test('migracja kopii bazy v1.0 (fixture) do v3 zachowuje wiersze i daje spójną bazę', () => {
    const copy = path.join(tmpDir, 'napar.db');
    fs.copyFileSync(FIXTURE_V1, copy);
    const { DatabaseSync } = require('node:sqlite');
    const before = new DatabaseSync(copy, { readOnly: true });
    const tables = ['inventory_items', 'recipes', 'brew_sessions', 'caffeine_logs'];
    const countsBefore: Record<string, number> = {};
    for (const t of tables) countsBefore[t] = Number(before.prepare(`SELECT COUNT(*) AS c FROM ${t}`).get().c);
    const customBefore = Number(before.prepare('SELECT COUNT(*) AS c FROM recipes WHERE is_custom = 1').get().c);
    before.close();

    const { db, sqlite } = loadDatabase(copy);
    const conn = db.getDatabase();

    expect(conn.getFirstSync<{ user_version: number }>('PRAGMA user_version')).toEqual({ user_version: 3 });
    for (const t of ['inventory_items', 'brew_sessions', 'caffeine_logs']) {
      expect([t, count(db, `SELECT COUNT(*) AS c FROM ${t}`)]).toEqual([t, countsBefore[t]]);
    }
    expect(count(db, 'SELECT COUNT(*) AS c FROM recipes WHERE is_custom = 1')).toBe(customBefore);
    const columns = conn.getAllSync<{ name: string }>('PRAGMA table_info(brew_sessions)').map((c) => c.name);
    expect(columns).toEqual(expect.arrayContaining(['sensory_scores_json', 'water_profile']));
    expect(conn.getFirstSync<{ integrity_check: string }>('PRAGMA integrity_check')).toEqual({ integrity_check: 'ok' });
    expect(conn.getAllSync('PRAGMA foreign_key_check')).toEqual([]);
    sqlite.__closeAll();
  });
});

describe('Zapis rodzica nie kasuje dzieci (M1-audytor-generalny-002; 05-architekt-002, 08-programista-001, 12-niezawodnosc-005)', () => {
  const bean = {
    id: 'bean-1',
    name: 'Kenia AA',
    type: 'coffee' as const,
    initialWeightGrams: 250,
    remainingWeightGrams: 250,
    flavorNotes: [],
    isFavorite: false,
    isArchived: false,
    createdAt: '2026-11-01T08:00:00.000Z',
    updatedAt: '2026-11-01T08:00:00.000Z',
  };
  const session = (n: number) => ({
    id: `s${n}`,
    inventoryItemId: 'bean-1',
    inventoryItemName: 'Kenia AA',
    beverageType: 'COFFEE' as const,
    method: 'V60',
    doseGrams: 15,
    waterGrams: 250,
    waterTempCelsius: 94,
    totalTimeSeconds: 180,
    flavorTags: [],
    brewedAt: `2026-11-0${n}T08:00:00.000Z`,
  });
  const log = (n: number) => ({
    id: `log${n}`,
    brewSessionId: `s${n}`,
    beverageName: 'V60',
    beverageType: 'coffee' as const,
    consumedAt: `2026-11-0${n}T08:00:00.000Z`,
    doseGrams: 15,
    caffeineMg: 100,
  });

  function seed(db: DbModule) {
    db.saveInventoryItem(bean);
    for (const n of [1, 2, 3]) db.recordBrewSessionTransaction(session(n), undefined, log(n));
  }

  test('ulubiona, archiwum i edycja paczki zostawiają jej 3 sesje powiązane (3/3)', () => {
    const { db, sqlite } = loadDatabase();
    seed(db);
    const linked = () => count(db, 'SELECT COUNT(*) AS c FROM brew_sessions WHERE inventory_item_id = ?', 'bean-1');
    expect(linked()).toBe(3);
    db.saveInventoryItem({ ...bean, isFavorite: true });
    expect(linked()).toBe(3);
    db.saveInventoryItem({ ...bean, isFavorite: true, isArchived: true });
    db.saveInventoryItem({ ...bean, name: 'Kenia AA (2)', remainingWeightGrams: 100 });
    expect(linked()).toBe(3);
    expect(db.getInventoryItemById('bean-1')?.name).toBe('Kenia AA (2)');
    sqlite.__closeAll();
  });

  test('ponowny zapis tej samej sesji zostawia jej log kofeiny (3/3)', () => {
    const { db, sqlite } = loadDatabase();
    seed(db);
    expect(count(db, 'SELECT COUNT(*) AS c FROM caffeine_logs')).toBe(3);
    db.saveBrewSession({ ...session(1), notes: 'poprawka notatki' });
    expect(count(db, 'SELECT COUNT(*) AS c FROM caffeine_logs')).toBe(3);
    expect(db.getBrewSessionById('s1')?.notes).toBe('poprawka notatki');
    sqlite.__closeAll();
  });

  test('trwała kontrola: w src i app nie ma INSERT OR REPLACE', () => {
    const roots = ['src', 'app'].map((d) => path.join(__dirname, '..', d));
    const hits: string[] = [];
    const walk = (dir: string) => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) {
          if (e.name !== '__tests__' && e.name !== 'node_modules') walk(p);
        } else if (/\.(ts|tsx)$/.test(e.name)) {
          fs.readFileSync(p, 'utf8').split('\n').forEach((line, i) => {
            if (/INSERT\s+OR\s+REPLACE/i.test(line)) hits.push(`${path.relative(path.join(__dirname, '..'), p)}:${i + 1}`);
          });
        }
      }
    };
    roots.forEach(walk);
    expect(hits).toEqual([]);
  });
});

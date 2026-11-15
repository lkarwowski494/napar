// ============================================================================
// Strażnik startu, kopia przed migracją i runner migracji — M1-audytor-generalny-005
// (12-niezawodnosc-003, 12-niezawodnosc-004, 05-architekt-004, 08-programista-005, 05-architekt-010)
// Strażnik działa na prawdziwym głównym module expo-file-system (bez aliasu na atrapę legacy):
// metody legacy z głównego modułu rzucają w SDK 57, więc tylko import z /legacy przechodzi.
// ============================================================================

import fs from 'fs';
import os from 'os';
import path from 'path';
import { DatabaseSync } from 'node:sqlite';

jest.unmock('expo-file-system');
jest.mock('expo-sqlite', () => require('./support/expo-sqlite-node').createExpoSqliteMock());

type DbModule = typeof import('../src/data/database');
type SqliteMock = {
  __setNextPath: (p: string) => void;
  __closeAll: () => void;
  __failOn: (re: RegExp) => void;
  __clearFailures: () => void;
};

const legacy = require('expo-file-system/legacy');
const FIXTURE_V1 = path.join(__dirname, 'fixtures', 'napar-v1.0.db');
const originalDocDir = legacy.documentDirectory;
let tmp: string;
let docs: string;

function loadDatabase(dbPath: string): { db: DbModule; sqlite: SqliteMock } {
  let db!: DbModule;
  let sqlite!: SqliteMock;
  jest.isolateModules(() => {
    sqlite = require('expo-sqlite');
    sqlite.__setNextPath(dbPath);
    db = require('../src/data/database');
  });
  return { db, sqlite };
}

function inspect(file: string) {
  const d = new DatabaseSync(file, { readOnly: true });
  try {
    const version = Number(d.prepare('PRAGMA user_version').get()!.user_version);
    const tables = d.prepare("SELECT name FROM sqlite_schema WHERE type = 'table' ORDER BY name").all().map((r) => String(r.name));
    const sessions = tables.includes('brew_sessions') ? Number(d.prepare('SELECT COUNT(*) AS c FROM brew_sessions').get()!.c) : -1;
    const cols = tables.includes('brew_sessions')
      ? d.prepare('PRAGMA table_info(brew_sessions)').all().map((r) => String(r.name))
      : [];
    return { version, tables, sessions, cols };
  } finally {
    d.close();
  }
}

beforeEach(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'napar-start-'));
  docs = path.join(tmp, 'Documents');
  fs.mkdirSync(docs);
  legacy.documentDirectory = `file://${docs}/`;
  legacy.__reset();
});

afterEach(() => {
  legacy.documentDirectory = originalDocDir;
  fs.rmSync(tmp, { recursive: true, force: true });
});

describe('Strażnik pętli startu (M1-audytor-generalny-005; 12-niezawodnosc-003)', () => {
  function guard() {
    let g!: typeof import('../src/data/startup-guard');
    jest.isolateModules(() => {
      g = require('../src/data/startup-guard');
    });
    return g.crashLoopGuard;
  }

  test('trzy starty bez kamienia milowego włączają tryb awaryjny', async () => {
    const g = guard();
    const r1 = await g.recordStartupAttempt();
    const r2 = await g.recordStartupAttempt();
    const r3 = await g.recordStartupAttempt();
    expect([r1.crashCount, r2.crashCount, r3.crashCount]).toEqual([1, 2, 3]);
    expect(r3.shouldEnterSafeMode).toBe(true);
  });

  test('„spróbuj normalnie” i znów start bez kamienia milowego → od razu tryb awaryjny', async () => {
    const g = guard();
    for (let i = 0; i < 3; i++) await g.recordStartupAttempt();
    await g.recordRetry();
    const next = await g.recordStartupAttempt();
    expect(next.shouldEnterSafeMode).toBe(true);
  });

  test('„spróbuj normalnie” i kamień milowy → licznik 0', async () => {
    const g = guard();
    for (let i = 0; i < 3; i++) await g.recordStartupAttempt();
    await g.recordRetry();
    await g.recordStartupSuccess();
    expect(await g.getCrashCount()).toBe(0);
  });
});

describe('Kopia przed migracją i runner (M1-audytor-generalny-005; 12-niezawodnosc-004, 05-architekt-004, 05-architekt-010)', () => {
  function v1Copy(): string {
    const p = path.join(tmp, 'napar.db');
    fs.copyFileSync(FIXTURE_V1, p);
    return p;
  }

  test('przed migracją powstaje plik kopii w Documents, który się otwiera i ma te same wiersze; brak tabeli-atrapy', () => {
    const dbPath = v1Copy();
    const before = inspect(dbPath);
    const { db, sqlite } = loadDatabase(dbPath);
    db.getDatabase();
    const backups = fs.readdirSync(docs).filter((f) => /^napar-pre-v1-\d+\.db$/.test(f));
    expect(backups).toHaveLength(1);
    const copy = inspect(path.join(docs, backups[0]));
    expect(copy.version).toBe(1);
    expect(copy.sessions).toBe(before.sessions);
    const after = inspect(dbPath);
    expect(after.version).toBe(3);
    expect(after.tables).not.toContain('migration_backups');
    sqlite.__closeAll();
  });

  test('gdy kopia się nie uda, migracja się nie wykonuje i start kończy się błędem', () => {
    const dbPath = v1Copy();
    legacy.documentDirectory = `file://${path.join(tmp, 'nie-istnieje')}/`;
    const { db, sqlite } = loadDatabase(dbPath);
    expect(() => db.getDatabase()).toThrow();
    sqlite.__closeAll();
    const after = inspect(dbPath);
    expect(after.version).toBe(1);
    expect(after.tables).not.toContain('migration_backups');
    expect(after.cols).not.toContain('water_profile');
  });

  test('błąd migracji (inny niż „duplicate column”) wycofuje całość, a kolejne getDatabase nie oddaje pół-zmigrowanej bazy', () => {
    const dbPath = v1Copy();
    const tablesBefore = inspect(dbPath).tables;
    const { db, sqlite } = loadDatabase(dbPath);
    sqlite.__failOn(/ADD COLUMN water_profile/);
    expect(() => db.getDatabase()).toThrow(/disk I\/O error/);
    expect(() => db.getDatabase()).toThrow();
    sqlite.__clearFailures();
    sqlite.__closeAll();
    const after = inspect(dbPath);
    expect(after.version).toBe(1);
    expect(after.cols).not.toContain('sensory_scores_json');
    expect(after.tables).toEqual(tablesBefore);
    const idx = new DatabaseSync(dbPath, { readOnly: true });
    const indexes = idx.prepare("SELECT name FROM sqlite_schema WHERE type = 'index' AND name LIKE 'idx_%'").all();
    idx.close();
    expect(indexes).toEqual([]);
  });

  test('baza nowsza niż aplikacja (user_version 99) jest odrzucana bez zmian', () => {
    const dbPath = path.join(tmp, 'napar.db');
    const d = new DatabaseSync(dbPath);
    d.exec('CREATE TABLE przyszla (id TEXT); PRAGMA user_version = 99;');
    d.close();
    const { db, sqlite } = loadDatabase(dbPath);
    expect(() => db.getDatabase()).toThrow(/99/);
    sqlite.__closeAll();
    const after = inspect(dbPath);
    expect(after.version).toBe(99);
    expect(after.tables).toEqual(['przyszla']);
    const j = new DatabaseSync(dbPath, { readOnly: true });
    expect(String(j.prepare('PRAGMA journal_mode').get()!.journal_mode)).toBe('delete');
    j.close();
  });
});

describe('Start z błędem bazy → tryb awaryjny z przyczyną (M1-audytor-generalny-005)', () => {
  test('openDatabaseAtStartup: baza nowsza → too-new, błąd migracji → database, poprawna → ok', () => {
    const newer = path.join(tmp, 'newer.db');
    const d = new DatabaseSync(newer);
    d.exec('PRAGMA user_version = 99;');
    d.close();
    let r = loadDatabase(newer);
    expect(r.db.openDatabaseAtStartup()).toEqual(expect.objectContaining({ ok: false, reason: 'too-new' }));
    expect(r.db.DatabaseTooNewError).toBeDefined();
    expect(r.db.TARGET_SCHEMA_VERSION).toBe(3);
    r.sqlite.__closeAll();

    const v1 = path.join(tmp, 'v1.db');
    fs.copyFileSync(FIXTURE_V1, v1);
    r = loadDatabase(v1);
    r.sqlite.__failOn(/ADD COLUMN sensory_scores_json/);
    expect(r.db.openDatabaseAtStartup()).toEqual(expect.objectContaining({ ok: false, reason: 'database' }));
    r.sqlite.__clearFailures();
    const okResult: import('../src/data/database').StartupDatabaseResult = r.db.openDatabaseAtStartup();
    expect(okResult).toEqual({ ok: true });
    r.sqlite.__closeAll();
  });

  test('SAFE_MODE_THRESHOLD to 3 starty', () => {
    const g = require('../src/data/startup-guard');
    expect(g.SAFE_MODE_THRESHOLD).toBe(3);
  });
});

test('trwała kontrola: kod aplikacji nie importuje głównego modułu expo-file-system (metody legacy rzucają w SDK 57)', () => {
  const root = path.join(__dirname, '..');
  const hits: string[] = [];
  const walk = (dir: string) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (!['__tests__', 'node_modules'].includes(e.name)) walk(p);
      } else if (/\.(ts|tsx)$/.test(e.name)) {
        fs.readFileSync(p, 'utf8').split('\n').forEach((line, i) => {
          if (/from\s+['"]expo-file-system['"]/.test(line)) hits.push(`${path.relative(root, p)}:${i + 1}`);
        });
      }
    }
  };
  ['app', 'src', 'lib'].map((d) => path.join(root, d)).filter((d) => fs.existsSync(d)).forEach(walk);
  expect(hits).toEqual([]);
});

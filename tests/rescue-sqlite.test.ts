// ============================================================================
// Ścieżka ratunkowa na prawdziwym SQLite w trybie WAL — M1-audytor-generalny-004
// (12-niezawodnosc-001: eksport ratunkowy bez -wal; 12-niezawodnosc-002: reset bez kopii)
// ============================================================================

import fs from 'fs';
import os from 'os';
import path from 'path';
import { DatabaseSync } from 'node:sqlite';
import { SCHEMA_SQL } from '../src/core/database-schema';
import {
  createRescueExport,
  resetDatabaseSafely,
  type RescueContext,
  type RescueExport,
  type RescueReset,
  type RescueDb,
  type RescueFs,
} from '../src/core/rescue';

let dir: string;
let live: DatabaseSync | null;

const nodeFs: RescueFs = {
  exists: async (p) => fs.existsSync(p),
  copy: async (from, to) => fs.copyFileSync(from, to),
  remove: async (p) => fs.rmSync(p, { force: true }),
  makeDir: async (p) => {
    fs.mkdirSync(p, { recursive: true });
  },
};

const openNode = (p: string): RescueDb => {
  const db = new DatabaseSync(p, { enableForeignKeyConstraints: false });
  return {
    exec: (sql, params = []) => {
      db.prepare(sql).run(...params);
    },
    all: (sql) => db.prepare(sql).all().map((r) => ({ ...r })),
    close: () => db.close(),
  };
};

function rows(file: string, table: string): number {
  const db = new DatabaseSync(file, { readOnly: true });
  try {
    return Number(db.prepare(`SELECT COUNT(*) AS c FROM ${table}`).get()!.c);
  } finally {
    db.close();
  }
}

/** Baza aplikacji w WAL, zapisy po ostatnim checkpoincie zostają tylko w -wal; połączenie pozostaje otwarte jak przy awarii. */
function liveWalDatabase(dbPath: string, sessions: number) {
  live = new DatabaseSync(dbPath);
  live.exec('PRAGMA journal_mode = WAL; PRAGMA wal_autocheckpoint = 0;');
  live.exec(SCHEMA_SQL);
  live.exec('PRAGMA user_version = 3;');
  live.exec('PRAGMA wal_checkpoint(TRUNCATE);');
  for (let i = 0; i < sessions; i++) {
    live.prepare(
      `INSERT INTO brew_sessions (id, beverage_type, method, dose_g, water_g, water_temp_c, total_time_seconds, brewed_at)
       VALUES (?, 'COFFEE', 'V60', 15, 250, 94, 180, '2026-11-01T08:00:00.000Z')`
    ).run(`s${i}`);
  }
}

function ctx(dbPath: string, extra: Partial<RescueContext> = {}): RescueContext {
  return {
    dbPath,
    rescueDir: path.join(dir, 'Documents', 'kopie-ratunkowe'),
    fs: nodeFs,
    openDb: openNode,
    now: () => new Date('2026-11-13T10:00:00.000Z'),
    ...extra,
  };
}

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'napar-rescue-'));
  fs.mkdirSync(path.join(dir, 'Library', 'SQLite'), { recursive: true });
  live = null;
});

afterEach(() => {
  try {
    live?.close();
  } catch {
    // zamknięta w teście
  }
  fs.rmSync(dir, { recursive: true, force: true });
});

describe('Eksport ratunkowy (M1-audytor-generalny-004; 12-niezawodnosc-001)', () => {
  test('zapisy obecne tylko w -wal trafiają do sprawdzonej kopii (5/5, integrity_check ok, liczności)', async () => {
    const dbPath = path.join(dir, 'Library', 'SQLite', 'napar.db');
    liveWalDatabase(dbPath, 5);
    expect(fs.statSync(`${dbPath}-wal`).size).toBeGreaterThan(0);

    const result: RescueExport = await createRescueExport(ctx(dbPath));

    expect(result.ok && result.kind).toBe('snapshot');
    if (!result.ok || result.kind !== 'snapshot') return;
    expect(result.file.startsWith(path.join(dir, 'Documents', 'kopie-ratunkowe'))).toBe(true);
    expect(rows(result.file, 'brew_sessions')).toBe(5);
    expect(result.counts.sessions).toBe(5);
    const check = new DatabaseSync(result.file, { readOnly: true });
    expect({ ...check.prepare('PRAGMA integrity_check').get() }).toEqual({ integrity_check: 'ok' });
    check.close();
    // surowy komplet zachowany przed otwarciem bazy (wal.html: plik bez -wal traci zapisy)
    expect(result.rawCopyDir).not.toBeNull();
    for (const s of ['', '-wal']) expect(fs.existsSync(path.join(result.rawCopyDir!, `napar.db${s}`))).toBe(true);
  });

  test('gdy bazy nie da się otworzyć, zostaje surowy komplet .db/-wal/-shm, a wynik mówi o tym wprost', async () => {
    const dbPath = path.join(dir, 'Library', 'SQLite', 'napar.db');
    liveWalDatabase(dbPath, 3);
    const broken = (): RescueDb => {
      throw new Error('database disk image is malformed');
    };

    const result = await createRescueExport(ctx(dbPath, { openDb: broken }));

    expect(result.ok && result.kind).toBe('raw');
    if (!result.ok || result.kind !== 'raw') return;
    expect(result.files.map((f) => path.basename(f)).sort()).toEqual(['napar.db', 'napar.db-shm', 'napar.db-wal']);
    expect(result.files.every((f) => f.startsWith(path.join(dir, 'Documents', 'kopie-ratunkowe')))).toBe(true);
    expect(result.reason).toContain('malformed');
  });
});

describe('Reset w trybie awaryjnym (M1-audytor-generalny-004; 12-niezawodnosc-002)', () => {
  test('bez udanej kopii reset nie usuwa niczego i zwraca błąd', async () => {
    const dbPath = path.join(dir, 'Library', 'SQLite', 'napar.db');
    liveWalDatabase(dbPath, 3);
    const failingFs: RescueFs = { ...nodeFs, makeDir: async () => Promise.reject(new Error('ENOSPC')) };

    const result = await resetDatabaseSafely(ctx(dbPath, { fs: failingFs }));

    expect(result.ok).toBe(false);
    expect(fs.existsSync(dbPath)).toBe(true);
    expect(fs.existsSync(`${dbPath}-wal`)).toBe(true);
  });

  test('po sprawdzonej kopii reset usuwa .db, -wal i -shm, a kopia ma liczności bazy', async () => {
    const dbPath = path.join(dir, 'Library', 'SQLite', 'napar.db');
    liveWalDatabase(dbPath, 4);
    live!.close(); // reset odbywa się bez otwartych połączeń aplikacji
    live = null;

    const result: RescueReset = await resetDatabaseSafely(ctx(dbPath));

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    for (const s of ['', '-wal', '-shm']) expect(fs.existsSync(`${dbPath}${s}`)).toBe(false);
    expect(result.backup.ok && result.backup.kind).toBe('snapshot');
    if (result.backup.ok && result.backup.kind === 'snapshot') {
      expect(result.backup.counts.sessions).toBe(4);
      expect(rows(result.backup.file, 'brew_sessions')).toBe(4);
    }
  });
});

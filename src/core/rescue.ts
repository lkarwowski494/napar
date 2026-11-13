// ============================================================================
// Napar — ścieżka ratunkowa bazy SQLite (tryb awaryjny)
// M1-audytor-generalny-004 (12-niezawodnosc-001, 12-niezawodnosc-002)
// Czysta logika na portach plików i bazy: testowalna na node:sqlite, bez importów expo.
// ============================================================================

export interface RescueFs {
  exists(path: string): Promise<boolean>;
  copy(from: string, to: string): Promise<void>;
  remove(path: string): Promise<void>;
  makeDir(path: string): Promise<void>;
}

export interface RescueDb {
  exec(sql: string, params?: readonly (string | number | null)[]): void;
  all(sql: string): unknown[];
  close(): void;
}

export type OpenRescueDb = (path: string) => RescueDb;

export interface RescueCounts {
  inventory: number;
  sessions: number;
  caffeineLogs: number;
  customRecipes: number;
}

export type RescueExport =
  | { ok: true; kind: 'snapshot'; file: string; counts: RescueCounts; rawCopyDir: string | null }
  | { ok: true; kind: 'raw'; files: string[]; reason: string }
  | { ok: false; reason: string };

export type RescueReset =
  | { ok: true; backup: RescueExport; removed: string[] }
  | { ok: false; reason: string; backup?: RescueExport };

export interface RescueContext {
  dbPath: string; // ścieżka POSIX do napar.db (bez file://)
  rescueDir: string; // katalog trwały na kopie ratunkowe (POSIX)
  fs: RescueFs;
  openDb: OpenRescueDb;
  now?: () => Date;
}

const WAL_SUFFIXES = ['', '-wal', '-shm'] as const;

function message(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

function field(row: unknown, name: string): unknown {
  return typeof row === 'object' && row !== null ? Reflect.get(row, name) : undefined;
}

function baseName(p: string): string {
  return p.slice(p.lastIndexOf('/') + 1);
}

/** Sprawdza plik kopii osobnym połączeniem: integrity_check = ok, wersja schematu ≥ 1, liczności tabel. */
function verifySnapshot(openDb: OpenRescueDb, file: string): RescueCounts {
  const db = openDb(file);
  try {
    const integrity = db.all('PRAGMA integrity_check').map((r) => field(r, 'integrity_check'));
    if (integrity.length !== 1 || integrity[0] !== 'ok') {
      throw new Error(`integrity_check: ${integrity.slice(0, 3).join('; ')}`);
    }
    const version = field(db.all('PRAGMA user_version')[0], 'user_version');
    if (typeof version !== 'number' || version < 1) {
      throw new Error(`user_version kopii: ${String(version)}`);
    }
    const count = (sql: string): number => {
      const c = field(db.all(sql)[0], 'c');
      if (typeof c !== 'number') throw new Error(`liczność: ${sql}`);
      return c;
    };
    return {
      inventory: count('SELECT COUNT(*) AS c FROM inventory_items'),
      sessions: count('SELECT COUNT(*) AS c FROM brew_sessions'),
      caffeineLogs: count('SELECT COUNT(*) AS c FROM caffeine_logs'),
      customRecipes: count('SELECT COUNT(*) AS c FROM recipes WHERE is_custom = 1'),
    };
  } finally {
    db.close();
  }
}

/**
 * Kopia ratunkowa bazy (moduł ratowanie-danych roli 12):
 * 1. zanim cokolwiek otworzy bazę: surowy komplet .db, -wal, -shm do katalogu trwałego
 *    (zamknięcie ostatniego połączenia robi checkpoint i usuwa -wal; sqlite.org/wal.html);
 * 2. bez migracji: VACUUM INTO do nowego pliku (spójny obraz razem z -wal; lang_vacuum.html);
 * 3. sprawdzenie kopii osobnym połączeniem; zła kopia nie jest zgłaszana jako sukces.
 * Gdy baza się nie otwiera, wynikiem jest surowy komplet plików z powodem.
 */
export async function createRescueExport(ctx: RescueContext): Promise<RescueExport> {
  const { dbPath, rescueDir, fs, openDb } = ctx;
  const stamp = (ctx.now ? ctx.now() : new Date()).toISOString().replace(/[:.]/g, '-');
  try {
    if (!(await fs.exists(dbPath))) return { ok: false, reason: 'no-database' };
    await fs.makeDir(rescueDir);
  } catch (e) {
    return { ok: false, reason: message(e) };
  }

  const rawDir = `${rescueDir}/surowa-${stamp}`;
  const rawFiles: string[] = [];
  try {
    await fs.makeDir(rawDir);
    for (const suffix of WAL_SUFFIXES) {
      const from = `${dbPath}${suffix}`;
      if (await fs.exists(from)) {
        const to = `${rawDir}/${baseName(from)}`;
        await fs.copy(from, to);
        rawFiles.push(to);
      }
    }
  } catch {
    rawFiles.length = 0;
  }

  const snapshot = `${rescueDir}/napar-kopia-${stamp}.db`;
  try {
    const source = openDb(dbPath);
    try {
      source.exec('VACUUM INTO ?', [snapshot]);
    } finally {
      source.close();
    }
    const counts = verifySnapshot(openDb, snapshot);
    return { ok: true, kind: 'snapshot', file: snapshot, counts, rawCopyDir: rawFiles.length ? rawDir : null };
  } catch (e) {
    try {
      await fs.remove(snapshot);
    } catch {
      // brak częściowej kopii do usunięcia
    }
    if (rawFiles.some((f) => baseName(f) === baseName(dbPath))) {
      return { ok: true, kind: 'raw', files: rawFiles, reason: message(e) };
    }
    return { ok: false, reason: message(e) };
  }
}

/**
 * Reset uszkodzonej bazy: najpierw kopia ratunkowa (createRescueExport), dopiero po jej powodzeniu
 * usunięcie kompletu .db, -wal, -shm i sprawdzenie, że pliki zniknęły. Bez kopii nic nie jest usuwane.
 */
export async function resetDatabaseSafely(ctx: RescueContext): Promise<RescueReset> {
  const backup = await createRescueExport(ctx);
  if (!backup.ok) return { ok: false, reason: backup.reason, backup };
  const removed: string[] = [];
  try {
    for (const suffix of WAL_SUFFIXES) {
      const p = `${ctx.dbPath}${suffix}`;
      if (await ctx.fs.exists(p)) {
        await ctx.fs.remove(p);
        removed.push(p);
      }
    }
    for (const suffix of WAL_SUFFIXES) {
      if (await ctx.fs.exists(`${ctx.dbPath}${suffix}`)) {
        return { ok: false, reason: `still-exists: ${baseName(ctx.dbPath)}${suffix}`, backup };
      }
    }
  } catch (e) {
    return { ok: false, reason: message(e), backup };
  }
  return { ok: true, backup, removed };
}

// Adaptery ścieżki ratunkowej (M1-audytor-generalny-004): przeliczenie URI ↔ ścieżka i katalog bazy jak w getDatabase().
jest.mock('expo-sqlite', () => ({
  defaultDatabaseDirectory: '/var/mobile/Containers/Data/Application/ABC/Documents/SQLite',
  openDatabaseSync: jest.fn(),
}));

import { DB_NAME, RESCUE_DIR_NAME, databaseDirectory, deviceRescueContext, pathToUri, uriToPath } from '../src/data/rescue-expo';

describe('rescue-expo (M1-audytor-generalny-004)', () => {
  test('URI expo-file-system i ścieżka SQLite przeliczają się w obie strony', () => {
    expect(uriToPath('file:///var/a%20b/Documents/')).toBe('/var/a b/Documents/');
    expect(pathToUri('/var/a b/x.db')).toBe('file:///var/a%20b/x.db');
  });

  test('katalog bazy to Library/SQLite, jak w getDatabase()', () => {
    expect(databaseDirectory('/v/Documents/SQLite')).toBe('/v/Library/SQLite');
    expect(databaseDirectory('/v/cache/SQLite/')).toBe('/v/cache/SQLite');
    expect(databaseDirectory(null)).toBeNull();
  });

  test('kontekst urządzenia wskazuje napar.db w Library/SQLite i kopie w Documents/kopie-ratunkowe', () => {
    const ctx = deviceRescueContext();
    expect('error' in ctx).toBe(false);
    if ('error' in ctx) return;
    expect(ctx.dbPath).toBe('/var/mobile/Containers/Data/Application/ABC/Library/SQLite/napar.db');
    expect(ctx.rescueDir).toBe('/data/user/0/pl.lukasz.napar/files/kopie-ratunkowe');
    expect(ctx.dbPath.endsWith(`/${DB_NAME}`)).toBe(true);
    expect(ctx.rescueDir.endsWith(`/${RESCUE_DIR_NAME}`)).toBe(true);
  });

  // M1-audytor-generalny-045: plik przeszedł do src/data (próg katalogu jak src/core) — adaptery
  // urządzenia sprawdzone wprost: ścieżki zamieniane na URI dla plików, nazwa i katalog bazy dla SQLite.
  test('adaptery urządzenia: pliki przez URI expo-file-system, baza przez openDatabaseSync(nazwa, katalog)', async () => {
    const FileSystem = jest.requireMock('expo-file-system/legacy');
    const SQLite = jest.requireMock('expo-sqlite');
    FileSystem.copyAsync = jest.fn().mockResolvedValue(undefined);
    const ctx = deviceRescueContext();
    if ('error' in ctx) throw new Error(ctx.error);

    FileSystem.__files['file:///x%20y/a.db'] = '1';
    await expect(ctx.fs.exists('/x y/a.db')).resolves.toBe(true);
    await expect(ctx.fs.exists('/x y/b.db')).resolves.toBe(false);
    await ctx.fs.copy('/x y/a.db', '/k/a.db');
    expect(FileSystem.copyAsync).toHaveBeenCalledWith({ from: 'file:///x%20y/a.db', to: 'file:///k/a.db' });
    await ctx.fs.remove('/x y/a.db');
    expect(FileSystem.deleteAsync).toHaveBeenCalledWith('file:///x%20y/a.db', { idempotent: true });
    await ctx.fs.makeDir('/k/r');
    expect(FileSystem.makeDirectoryAsync).toHaveBeenCalledWith('file:///k/r', { intermediates: true });

    const db = { runSync: jest.fn(), getAllSync: jest.fn(() => [{ n: 1 }]), closeSync: jest.fn() };
    SQLite.openDatabaseSync.mockReturnValue(db);
    const h = ctx.openDb('/lib/SQLite/napar.db');
    expect(SQLite.openDatabaseSync).toHaveBeenCalledWith('napar.db', undefined, '/lib/SQLite');
    h.exec('DELETE FROM t WHERE id = ?', [7]);
    h.exec('VACUUM');
    expect(db.runSync).toHaveBeenNthCalledWith(1, 'DELETE FROM t WHERE id = ?', [7]);
    expect(db.runSync).toHaveBeenNthCalledWith(2, 'VACUUM', []);
    expect(h.all('SELECT 1')).toEqual([{ n: 1 }]);
    h.close();
    expect(db.closeSync).toHaveBeenCalledTimes(1);
  });

  test('bez katalogu dokumentów kontekst zwraca powód no-directory', () => {
    const FileSystem = jest.requireMock('expo-file-system/legacy');
    const docs = FileSystem.documentDirectory;
    FileSystem.documentDirectory = null;
    try {
      expect(deviceRescueContext()).toEqual({ error: 'no-directory' });
    } finally {
      FileSystem.documentDirectory = docs;
    }
  });
});

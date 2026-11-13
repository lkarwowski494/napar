// Adaptery ścieżki ratunkowej (M1-audytor-generalny-004): przeliczenie URI ↔ ścieżka i katalog bazy jak w getDatabase().
jest.mock('expo-sqlite', () => ({
  defaultDatabaseDirectory: '/var/mobile/Containers/Data/Application/ABC/Documents/SQLite',
  openDatabaseSync: jest.fn(),
}));

import { DB_NAME, RESCUE_DIR_NAME, databaseDirectory, deviceRescueContext, pathToUri, uriToPath } from '../src/core/rescue-expo';

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
});

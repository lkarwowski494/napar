import { dbDirectory } from '../db-path';

describe('dbDirectory (SEC-09)', () => {
  test('Zastępuje /Documents/SQLite przez /Library/SQLite', () => {
    expect(dbDirectory('/var/mobile/Containers/Data/Application/XYZ/Documents/SQLite')).toBe(
      '/var/mobile/Containers/Data/Application/XYZ/Library/SQLite'
    );
    expect(dbDirectory('/var/mobile/Containers/Data/Application/XYZ/Documents/SQLite/')).toBe(
      '/var/mobile/Containers/Data/Application/XYZ/Library/SQLite'
    );
  });

  test('Zwraca undefined dla ścieżek niezawierających Documents/SQLite', () => {
    expect(dbDirectory('/var/mobile/Containers/Data/Application/XYZ/Library/SQLite')).toBeUndefined();
    expect(dbDirectory('/data/user/0/pl.lukasz.napar/databases')).toBeUndefined();
    expect(dbDirectory(null)).toBeUndefined();
    expect(dbDirectory(undefined)).toBeUndefined();
    expect(dbDirectory('')).toBeUndefined();
  });
});

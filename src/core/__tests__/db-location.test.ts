// ============================================================================
// Napar (Steepwise) — Unit Tests: wybór lokalizacji bazy (D8, wariant B)
// ============================================================================

import { errorReason, openDatabaseLocation, type LocationDeps } from '../db-location';

const DOCS = 'file:///var/mobile/Containers/Data/Application/X/Documents/SQLite';
const LIBRARY = 'file:///var/mobile/Containers/Data/Application/X/Library/SQLite';
const DEFAULT_SQLITE = { handle: 'default' };

function deps(overrides: Partial<LocationDeps<{ handle: string }>> = {}): LocationDeps<{ handle: string }> {
  return {
    defaultDirectory: DOCS,
    exists: jest.fn(() => true),
    makeDirectory: jest.fn(),
    open: jest.fn((directory?: string) => ({ handle: directory ?? 'default' })),
    ...overrides,
  };
}

describe('openDatabaseLocation (D8)', () => {
  test('otwiera /Library/SQLite, gdy katalog istnieje, bez fallbacku', () => {
    const d = deps();
    const result = openDatabaseLocation(d);
    expect(result).toEqual({ db: { handle: LIBRARY }, directory: LIBRARY, fallback: null });
    expect(d.makeDirectory).not.toHaveBeenCalled();
  });

  test('tworzy brakujący katalog /Library/SQLite przed otwarciem', () => {
    const exists = jest.fn(() => false);
    const makeDirectory = jest.fn();
    const result = openDatabaseLocation(deps({ exists, makeDirectory }));
    expect(exists).toHaveBeenCalledWith(LIBRARY);
    expect(makeDirectory).toHaveBeenCalledWith(LIBRARY);
    expect(result.directory).toBe(LIBRARY);
    expect(result.fallback).toBeNull();
  });

  test('przy błędzie otwarcia przechodzi na domyślną ścieżkę i zapisuje powód', () => {
    const open = jest.fn((directory?: string) => {
      if (directory !== undefined) throw new Error('brak uprawnień do katalogu');
      return { handle: 'default' };
    });
    const result = openDatabaseLocation(deps({ open }));
    expect(result).toEqual({
      db: DEFAULT_SQLITE,
      directory: undefined,
      fallback: { preferredDirectory: LIBRARY, reason: 'brak uprawnień do katalogu' },
    });
  });

  test('przy błędzie tworzenia katalogu również wybiera fallback', () => {
    const makeDirectory = jest.fn(() => {
      throw 'nie można utworzyć';
    });
    const result = openDatabaseLocation(deps({ exists: () => false, makeDirectory }));
    expect(result.db).toEqual(DEFAULT_SQLITE);
    expect(result.fallback).toEqual({ preferredDirectory: LIBRARY, reason: 'nie można utworzyć' });
  });

  test('gdy domyślna ścieżka też się nie uda, błąd jest zgłaszany dalej', () => {
    const open = jest.fn(() => {
      throw new Error('brak bazy');
    });
    expect(() => openDatabaseLocation(deps({ open }))).toThrow('brak bazy');
  });

  test('bez katalogu domyślnego otwiera bazę bez podawania katalogu', () => {
    const d = deps({ defaultDirectory: undefined });
    expect(openDatabaseLocation(d)).toEqual({ db: DEFAULT_SQLITE, directory: undefined, fallback: null });
    expect(d.exists).not.toHaveBeenCalled();
  });

  test('katalog domyślny spoza Documents/SQLite nie jest przekierowywany', () => {
    const d = deps({ defaultDirectory: null });
    expect(openDatabaseLocation(d).directory).toBeUndefined();
    expect(d.open).toHaveBeenCalledWith(undefined);
  });
});

describe('errorReason', () => {
  test('zwraca komunikat błędu lub tekst dla wartości innych niż Error', () => {
    expect(errorReason(new Error('x'))).toBe('x');
    expect(errorReason('y')).toBe('y');
    expect(errorReason(42)).toBe('42');
  });
});

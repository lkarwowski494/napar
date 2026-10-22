// ============================================================================
// Napar (Steepwise) — Unit Tests: adapter expo-sqlite (mocki natywnych modułów)
// ============================================================================

const mockOpenDatabaseSync = jest.fn();
const mockExists = jest.fn();
const mockCreate = jest.fn();
const mockDirectory = jest.fn();

jest.mock('expo-sqlite', () => ({
  defaultDatabaseDirectory: 'file:///var/mobile/Containers/Data/Application/X/Documents/SQLite/',
  openDatabaseSync: (...args: unknown[]) => mockOpenDatabaseSync(...args),
}));

jest.mock('expo-file-system', () => ({
  Directory: class {
    constructor(uri: string) {
      mockDirectory(uri);
    }
    get exists(): boolean {
      return mockExists();
    }
    create(options: unknown): void {
      mockCreate(options);
    }
  },
}));

import { openNaparDatabase, wrapSqliteDatabase } from '../sqlite-adapter';

const LIBRARY = 'file:///var/mobile/Containers/Data/Application/X/Library/SQLite';

function nativeDb() {
  return {
    execSync: jest.fn(),
    runSync: jest.fn(),
    getFirstSync: jest.fn(() => ({ v: 1 })),
    getAllSync: jest.fn(() => [{ v: 1 }]),
    withTransactionSync: jest.fn((task: () => void) => task()),
  };
}

describe('wrapSqliteDatabase', () => {
  test('przekazuje wywołania do natywnej bazy z domyślnymi parametrami', () => {
    const native = nativeDb();
    const port = wrapSqliteDatabase(native as never);

    port.execSync('SELECT 1');
    port.runSync('UPDATE t SET a = ?', [1]);
    port.runSync('DELETE FROM t');
    expect(port.getFirstSync('SELECT v FROM t WHERE id = ?', ['x'])).toEqual({ v: 1 });
    expect(port.getAllSync('SELECT v FROM t')).toEqual([{ v: 1 }]);
    port.withTransactionSync(() => undefined);

    expect(native.execSync).toHaveBeenCalledWith('SELECT 1');
    expect(native.runSync).toHaveBeenCalledWith('UPDATE t SET a = ?', [1]);
    expect(native.runSync).toHaveBeenCalledWith('DELETE FROM t', []);
    expect(native.getFirstSync).toHaveBeenCalledWith('SELECT v FROM t WHERE id = ?', ['x']);
    expect(native.getAllSync).toHaveBeenCalledWith('SELECT v FROM t', []);
    expect(native.withTransactionSync).toHaveBeenCalledTimes(1);
  });
});

describe('openNaparDatabase (D8)', () => {
  beforeEach(() => {
    mockOpenDatabaseSync.mockReset();
    mockExists.mockReset();
    mockCreate.mockReset();
    mockDirectory.mockReset();
  });

  test('tworzy /Library/SQLite gdy brak i otwiera napar.db w tym katalogu', () => {
    mockExists.mockReturnValue(false);
    mockOpenDatabaseSync.mockReturnValue(nativeDb());

    const opened = openNaparDatabase();

    expect(mockDirectory).toHaveBeenCalledWith(LIBRARY);
    expect(mockCreate).toHaveBeenCalledWith({ intermediates: true, idempotent: true });
    expect(mockOpenDatabaseSync).toHaveBeenCalledWith('napar.db', undefined, LIBRARY);
    expect(opened.fallback).toBeNull();
    expect(typeof opened.port.getAllSync).toBe('function');
  });

  test('istniejący katalog nie jest tworzony ponownie', () => {
    mockExists.mockReturnValue(true);
    mockOpenDatabaseSync.mockReturnValue(nativeDb());
    openNaparDatabase();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  test('gdy otwarcie w Library się nie uda, używa domyślnej ścieżki i zapisuje powód', () => {
    mockExists.mockReturnValue(true);
    mockOpenDatabaseSync.mockImplementation((_name: string, _opts: unknown, dir?: string) => {
      if (dir !== undefined) throw new Error('zablokowane');
      return nativeDb();
    });

    const opened = openNaparDatabase();

    expect(mockOpenDatabaseSync).toHaveBeenLastCalledWith('napar.db');
    expect(opened.fallback).toEqual({ preferredDirectory: LIBRARY, reason: 'zablokowane' });
  });
});

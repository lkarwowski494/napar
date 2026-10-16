// ============================================================================
// Napar (Steepwise) — Unit Tests: Backup Engine
// ============================================================================

import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import {
  buildBackup,
  localISODate,
  stampOf,
  parseAndValidateBackup,
  exportBackup,
  autoBackup,
  safetyBackup,
  NaparBackupData,
  SCHEMA_VERSION,
} from '../backup';

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  shareAsync: jest.fn().mockResolvedValue(true),
}));

jest.mock('expo-file-system', () => {
  const files: Record<string, string> = {};
  return {
    documentDirectory: 'file:///data/user/0/pl.lukasz.napar/files/',
    cacheDirectory: 'file:///data/user/0/pl.lukasz.napar/cache/',
    getInfoAsync: jest.fn(async (path: string) => ({
      exists: path in files || path.endsWith('/'),
      isDirectory: path.endsWith('/'),
    })),
    makeDirectoryAsync: jest.fn().mockResolvedValue(undefined),
    writeAsStringAsync: jest.fn(async (path: string, content: string) => {
      files[path] = content;
    }),
    deleteAsync: jest.fn(async (path: string) => {
      delete files[path];
    }),
    readDirectoryAsync: jest.fn(async () =>
      Object.keys(files).map((p) => p.split('/').pop()!)
    ),
    __files: files,
    __reset: () => {
      for (const k of Object.keys(files)) {
        delete files[k];
      }
    },
  };
});

describe('Backup Engine (Apps4Brew SEC-09)', () => {
  const dummyState: NaparBackupData = {
    inventory: [],
    customRecipes: [],
    sessions: [],
    caffeineLogs: [],
  };

  beforeEach(() => {
    (FileSystem as any).__reset();
    jest.clearAllMocks();
  });

  test('buildBackup tworzy poprawną kopertę BackupEnvelope', () => {
    const envelope = buildBackup(dummyState);
    expect(envelope.format).toBe('napar-backup');
    expect(envelope.schemaVersion).toBe(SCHEMA_VERSION);
    expect(envelope.exportedAt).toBeDefined();
    expect(envelope.state).toEqual(dummyState);
  });

  test('localISODate i stampOf generują poprawne formaty dat', () => {
    const d = new Date(2026, 9, 16, 11, 30, 45); // 16 Oct 2026 11:30:45
    expect(localISODate(d)).toBe('2026-10-16');
    expect(stampOf(d)).toBe('2026-10-16-113045');
  });

  test('parseAndValidateBackup poprawnie waliduje poprawny JSON', () => {
    const envelope = buildBackup(dummyState);
    const parsed = parseAndValidateBackup(JSON.stringify(envelope));
    expect(parsed.format).toBe('napar-backup');
    expect(parsed.state.inventory).toEqual([]);
  });

  test('parseAndValidateBackup rzuca błąd przy uszkodzonym lub niewłaściwym formacie', () => {
    expect(() => parseAndValidateBackup('{ bad json')).toThrow('Nieprawidłowy format JSON');
    expect(() => parseAndValidateBackup('null')).toThrow('Plik kopii musi być obiektem JSON');
    expect(() => parseAndValidateBackup(JSON.stringify({ format: 'wrong-backup' }))).toThrow(
      'Nieznany format pliku'
    );
    expect(() =>
      parseAndValidateBackup(JSON.stringify({ format: 'napar-backup', schemaVersion: -1 }))
    ).toThrow('Nieprawidłowa wersja schematu');
    expect(() =>
      parseAndValidateBackup(JSON.stringify({ format: 'napar-backup', schemaVersion: 999 }))
    ).toThrow('Kopia pochodzi z nowszej wersji');
    expect(() =>
      parseAndValidateBackup(
        JSON.stringify({ format: 'napar-backup', schemaVersion: 1, state: null })
      )
    ).toThrow('Brak danych stanu');
    expect(() =>
      parseAndValidateBackup(
        JSON.stringify({
          format: 'napar-backup',
          schemaVersion: 1,
          state: { inventory: 'not an array' },
        })
      )
    ).toThrow('Nieprawidłowa struktura spiżarni');
    expect(() =>
      parseAndValidateBackup(
        JSON.stringify({
          format: 'napar-backup',
          schemaVersion: 1,
          state: { inventory: [], customRecipes: 'not an array' },
        })
      )
    ).toThrow('Nieprawidłowa struktura przepisów');
    expect(() =>
      parseAndValidateBackup(
        JSON.stringify({
          format: 'napar-backup',
          schemaVersion: 1,
          state: { inventory: [], customRecipes: [], sessions: 'not an array' },
        })
      )
    ).toThrow('Nieprawidłowa struktura sesji');
  });

  test('exportBackup udostępnia plik przez Sharing.shareAsync', async () => {
    const success = await exportBackup(dummyState);
    expect(success).toBe(true);
    expect(Sharing.shareAsync).toHaveBeenCalledWith(
      expect.stringContaining('napar-backup-'),
      expect.objectContaining({ mimeType: 'application/json' })
    );
  });

  test('exportBackup zwraca false gdy Sharing jest niedostępny', async () => {
    (Sharing.isAvailableAsync as jest.Mock).mockResolvedValueOnce(false);
    const success = await exportBackup(dummyState);
    expect(success).toBe(false);
  });

  test('autoBackup zapisuje plik z prefiksem napar- i rotuje do 10 kopii', async () => {
    const path = await autoBackup(dummyState);
    expect(path).toContain('Backup/napar-');

    // Utwórz 12 plików kopii i sprawdź czy wywołano deleteAsync dla nadmiarowych
    const mockFiles: Record<string, string> = (FileSystem as any).__files;
    for (let i = 1; i <= 12; i++) {
      const stamp = `2026-10-16-1100${i.toString().padStart(2, '0')}`;
      mockFiles[`file:///data/user/0/pl.lukasz.napar/files/Backup/napar-${stamp}.json`] = '{}';
    }

    await autoBackup(dummyState);
    expect(FileSystem.deleteAsync).toHaveBeenCalled();
  });

  test('safetyBackup tworzy kopię przed importem lub czyszczeniem', async () => {
    const importPath = await safetyBackup('import', dummyState);
    expect(importPath).toContain('Backup/napar-przed-importem-');

    const resetPath = await safetyBackup('reset', dummyState);
    expect(resetPath).toContain('Backup/napar-przed-czyszczeniem-');
  });
});

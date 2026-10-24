// ============================================================================
// Napar (Steepwise) — Unit Tests: Backup Engine
// ============================================================================

import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { importDataJson, getRecipes, saveRecipe } from '../database';
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
  saveCorruptState,
  checkCorruptState,
  dismissCorruptState,
  rotateBackupFiles,
  AUTO_RE,
  SAFETY_RE,
} from '../backup';

jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn(() => ({
    runSync: jest.fn(),
    execSync: jest.fn(),
    getFirstSync: jest.fn(),
    getAllSync: jest.fn(() => []),
    withTransactionSync: jest.fn((cb: () => void) => cb()),
    prepareSync: jest.fn(() => ({
      executeSync: jest.fn(),
      finalizeSync: jest.fn(),
    })),
  })),
}));

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  shareAsync: jest.fn().mockResolvedValue(true),
}));

jest.mock('expo-file-system/legacy', () => {
  const files: Record<string, string> = {};
  return {
    __esModule: true,
    documentDirectory: 'file:///data/user/0/pl.lukasz.napar/files/',
    cacheDirectory: 'file:///data/user/0/pl.lukasz.napar/cache/',
    getInfoAsync: jest.fn(async (path: string) => ({
      exists: path in files || path.endsWith('/'),
      isDirectory: path.endsWith('/'),
    })),
    makeDirectoryAsync: jest.fn().mockResolvedValue(undefined),
    readAsStringAsync: jest.fn(async (path: string) => files[path] || ''),
    writeAsStringAsync: jest.fn(async (path: string, content: string) => {
      files[path] = content;
    }),
    moveAsync: jest.fn(async ({ from, to }: { from: string; to: string }) => {
      files[to] = files[from];
      delete files[from];
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

  test('importDataJson akceptuje kopertę NaparBackupEnvelope (M1-audytor-generalny-005)', () => {
    const testState: NaparBackupData = {
      inventory: [],
      customRecipes: [{
        id: 'rec-custom-envelope',
        name: 'Envelope Recipe',
        beverageType: 'COFFEE',
        method: 'v60',
        doseGrams: 15,
        waterGrams: 250,
        waterTempCelsius: 93,
        recommendedRatio: 16.6,
        stepsJson: '[]',
        isCustom: true,
        isFavorite: false,
        createdAt: new Date().toISOString(),
      }],
      sessions: [],
      caffeineLogs: [],
    };
    const envelope = buildBackup(testState);
    expect(() => importDataJson(JSON.stringify(envelope))).not.toThrow();
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

  describe('RD-ENG-12: Rotacja dwóch rozdzielnych pul kopii zapasowych', () => {
    test('Wektory testowe: 10 kopii przed-importem + 15 kopii bieżących', () => {
      // 10 kopii bezpiecznych
      const safeFiles: string[] = [];
      for (let i = 1; i <= 10; i++) {
        safeFiles.push(`napar-przed-importem-2026-10-17-0800${i.toString().padStart(2, '0')}.json`);
      }
      // 15 kopii bieżących
      const autoFiles: string[] = [];
      for (let i = 1; i <= 15; i++) {
        autoFiles.push(`napar-kopia-2026-10-17-0900${i.toString().padStart(2, '0')}.json`);
      }

      const allFiles = [...safeFiles, ...autoFiles];

      // Rotacja puli auto: powinno usunąć 5 najstarszych kopii z puli auto i 0 z safe
      const toDeleteAuto = rotateBackupFiles(allFiles, AUTO_RE, 10);
      expect(toDeleteAuto).toHaveLength(5);
      expect(toDeleteAuto.every((f) => f.includes('kopia'))).toBe(true);

      // Rotacja puli safe: ma dokładnie 10 plików, więc 0 do usunięcia
      const toDeleteSafe = rotateBackupFiles(allFiles, SAFETY_RE, 10);
      expect(toDeleteSafe).toHaveLength(0);
    });

    test('Wektory testowe: kolizja w tej samej sekundzie dodaje przyrostek -2, -3', () => {
      const files = [
        'napar-kopia-2026-10-17-080000.json',
        'napar-kopia-2026-10-17-080000-2.json',
        'napar-kopia-2026-10-17-080000-3.json',
      ];
      const toDelete = rotateBackupFiles(files, AUTO_RE, 2);
      // Najstarszy to ten bez przyrostka (-3 jest najnowszy, potem -2, potem bazowy)
      expect(toDelete).toEqual(['napar-kopia-2026-10-17-080000.json']);
    });
  });

  describe('BR-TEST-023: Ochrona uszkodzonego stanu (state_corrupt_*)', () => {
    test('Zapisuje, sprawdza i odrzuca uszkodzony stan po awarii', async () => {
      const corruptJson = '{"broken": [1, 2, 3';
      const path = await saveCorruptState(corruptJson, 'SyntaxError w JSON');
      expect(path).toContain('state_corrupt_');

      const recovery = await checkCorruptState();
      expect(recovery).not.toBeNull();
      expect(recovery?.corruptFile).toContain('state_corrupt_');
      expect(recovery?.rawSnippet).toContain('{"broken":');

      // Odrzucenie banera
      await dismissCorruptState(recovery!.corruptFile);
      const afterDismiss = await checkCorruptState();
      expect(afterDismiss).toBeNull();
    });
  });
});

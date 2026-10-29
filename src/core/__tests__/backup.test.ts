// ============================================================================
// Napar (Steepwise) — Unit Tests: Backup Engine
// ============================================================================

import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { importDataJson, getRecipes, saveRecipe } from '../database';
import {
  buildBackup,
  getBackupStats,
  formatBackupSummary,
  validateBackupEnvelope,
  filterBackupEnvelope,
  BackupFilterOptions,
  diffBackupEnvelopes,
  BackupDiffResult,
  mergeBackupEnvelopes,
  BackupMergeOptions,
  getBackupRecordCounts,
  BackupRecordCounts,
  isBackupEmpty,
  validateBackupEnvelopeIntegrity,
  BackupIntegrityReport,
  auditBackupRelationalIntegrity,
  BackupRelationalIntegrityReport,
  RelationalOrphanItem,
  computeBackupChecksum,
  BackupChecksumResult,
  detectBackupDuplicates,
  BackupDuplicateReport,
  BackupDuplicateItem,
  simulateBackupRestore,
  BackupRestoreSimulationResult,
  BackupRestoreConflictType,
  sanitizeBackupEnvelope,
  estimateBackupFileSize,
  BackupFileSizeEstimate,
  compareBackupVersions,
  BackupVersionComparison,
  BackupComparisonStatus,
  generateBackupMigrationPlan,
  BackupMigrationPlan,
  BackupMigrationStep,
  calculateBackupHealthScore,
  BackupHealthScore,
  BackupHealthGrade,
  compactBackupEnvelope,
  CompactBackupResult,
  NaparBackupEnvelope,
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
    expect(() =>
      parseAndValidateBackup(
        JSON.stringify({
          format: 'napar-backup',
          schemaVersion: 1,
          state: { inventory: [], customRecipes: [], sessions: [], caffeineLogs: 'not an array' },
        })
      )
    ).toThrow('Nieprawidłowa struktura logu kofeiny');
    expect(() =>
      parseAndValidateBackup(
        JSON.stringify({
          format: 'napar-backup',
          schemaVersion: 1,
          state: { inventory: [], customRecipes: [], sessions: [] },
          // brak exportedAt
        })
      )
    ).toThrow('Nieprawidłowy lub brakujący znacznik czasu eksportu');
    expect(() =>
      parseAndValidateBackup(
        JSON.stringify({
          format: 'napar-backup',
          schemaVersion: 1,
          state: { inventory: [], customRecipes: [], sessions: [] },
          exportedAt: 12345,
        })
      )
    ).toThrow('Nieprawidłowy lub brakujący znacznik czasu eksportu');

    // TASK-P8-05-ARC: Walidacja typu pola settings
    expect(() =>
      parseAndValidateBackup(
        JSON.stringify({
          format: 'napar-backup',
          schemaVersion: 1,
          exportedAt: '2026-10-25T20:00:00.000Z',
          state: {
            inventory: [],
            customRecipes: [],
            sessions: [],
            settings: 'invalid-string-settings',
          },
        })
      )
    ).toThrow('Nieprawidłowa struktura ustawień ("settings" musi być obiektem)');
    expect(() =>
      parseAndValidateBackup(
        JSON.stringify({
          format: 'napar-backup',
          schemaVersion: 1,
          exportedAt: '2026-10-25T20:00:00.000Z',
          state: {
            inventory: [],
            customRecipes: [],
            sessions: [],
            settings: [1, 2, 3],
          },
        })
      )
    ).toThrow('Nieprawidłowa struktura ustawień ("settings" musi być obiektem)');
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

  describe('TASK-P57-05-ARC: Odpornosc parseAndValidateBackup i rotateBackupFiles na dane brzegowe', () => {
    test('parseAndValidateBackup parsuje JSON z BOM, odrzuca nie-stringi i weryfikuje calkowitoliczbowy schemaVersion', () => {
      const validEnvelope = buildBackup({
        inventory: [],
        customRecipes: [],
        sessions: [],
        caffeineLogs: [],
      });

      // 1. BOM na początku pliku JSON
      const jsonWithBom = '\uFEFF' + JSON.stringify(validEnvelope);
      const parsedBom = parseAndValidateBackup(jsonWithBom);
      expect(parsedBom.format).toBe('napar-backup');
      expect(parsedBom.schemaVersion).toBe(SCHEMA_VERSION);

      // 2. Wejścia niebędące stringiem
      expect(() => parseAndValidateBackup(null as any)).toThrow();
      expect(() => parseAndValidateBackup(undefined as any)).toThrow();
      expect(() => parseAndValidateBackup({} as any)).toThrow();

      // 3. Float lub nieprawidłowy schemaVersion
      const envelopeFloatVersion = { ...validEnvelope, schemaVersion: 1.5 };
      expect(() => parseAndValidateBackup(JSON.stringify(envelopeFloatVersion))).toThrow(
        'Nieprawidłowa wersja schematu kopii'
      );

      const envelopeNegativeZero = { ...validEnvelope, schemaVersion: -0 };
      expect(() => parseAndValidateBackup(JSON.stringify(envelopeNegativeZero))).toThrow(
        'Nieprawidłowa wersja schematu kopii'
      );
    });

    test('rotateBackupFiles radzi sobie z keepCount=0, NaN, ujemnymi liczbami i brudna lista plikow', () => {
      const files = [
        'napar-kopia-2026-10-17-080000.json',
        'napar-kopia-2026-10-17-080001.json',
      ];

      // keepCount = 0 -> wszystkie pliki do usunięcia
      expect(rotateBackupFiles(files, AUTO_RE, 0)).toHaveLength(2);

      // keepCount = NaN lub ujemny -> bezpieczny fallback do AUTO_KEEP
      expect(rotateBackupFiles(files, AUTO_RE, NaN as any)).toHaveLength(0);
      expect(rotateBackupFiles(files, AUTO_RE, -5)).toHaveLength(0);

      // Brudne / puste wejście
      expect(rotateBackupFiles([] as any, AUTO_RE, 5)).toEqual([]);
    });

    test('TASK-P59-05-ARC: parseAndValidateBackup odrzuca nieliczbowe exportedAt a buildBackup bezpiecznie obsluguje null/undefined state', () => {
      const validEnvelope = buildBackup({
        inventory: [],
        customRecipes: [],
        sessions: [],
        caffeineLogs: [],
      });

      // 1. Niepoprawny znacznik czasu exportedAt
      const corruptTimeEnvelope = { ...validEnvelope, exportedAt: 'invalid-date-format' };
      expect(() => parseAndValidateBackup(JSON.stringify(corruptTimeEnvelope))).toThrow(
        'Nieprawidłowy lub brakujący znacznik czasu eksportu (exportedAt)'
      );

      // 2. buildBackup z null/undefined
      const fallbackNull = buildBackup(null as any);
      expect(fallbackNull.state).toBeDefined();
      expect(Array.isArray(fallbackNull.state.inventory)).toBe(true);
      expect(fallbackNull.schemaVersion).toBe(SCHEMA_VERSION);

      const fallbackUndefined = buildBackup(undefined as any);
      expect(fallbackUndefined.state).toBeDefined();
      expect(Array.isArray(fallbackUndefined.state.customRecipes)).toBe(true);
    });

    test('TASK-P62-05-ARC: getBackupStats poprawnie zlicza elementy kopii zapasowej i chroni przed null/undefined', () => {
      const envelope = buildBackup({
        inventory: [{ id: 'inv-1' } as any, { id: 'inv-2' } as any],
        customRecipes: [{ id: 'rec-1' } as any],
        sessions: [{ id: 'sess-1' } as any, { id: 'sess-2' } as any, { id: 'sess-3' } as any],
        caffeineLogs: [],
      });

      const stats = getBackupStats(envelope);
      expect(stats.inventoryCount).toBe(2);
      expect(stats.recipesCount).toBe(1);
      expect(stats.sessionsCount).toBe(3);
      expect(stats.caffeineLogsCount).toBe(0);

      // Null i undefined
      expect(getBackupStats(null)).toEqual({
        inventoryCount: 0,
        recipesCount: 0,
        sessionsCount: 0,
        caffeineLogsCount: 0,
      });
      expect(getBackupStats(undefined)).toEqual({
        inventoryCount: 0,
        recipesCount: 0,
        sessionsCount: 0,
        caffeineLogsCount: 0,
      });
      expect(getBackupStats({} as any)).toEqual({
        inventoryCount: 0,
        recipesCount: 0,
        sessionsCount: 0,
        caffeineLogsCount: 0,
      });
    });

    test('TASK-P64-05-ARC: formatBackupSummary generuje czytelne podsumowanie kopii zapasowej w jezyku PL i EN', () => {
      const envelope = buildBackup({
        inventory: [{ id: 'inv-1' } as any, { id: 'inv-2' } as any],
        customRecipes: [{ id: 'rec-1' } as any],
        sessions: [{ id: 'sess-1' } as any, { id: 'sess-2' } as any, { id: 'sess-3' } as any],
        caffeineLogs: [],
      });

      // Język polski
      const summaryPl = formatBackupSummary(envelope, 'pl');
      expect(summaryPl).toContain('2 pozycje');
      expect(summaryPl).toContain('1 receptura');
      expect(summaryPl).toContain('3 sesje');

      // Język angielski
      const summaryEn = formatBackupSummary(envelope, 'en');
      expect(summaryEn).toContain('2 items');
      expect(summaryEn).toContain('1 recipe');
      expect(summaryEn).toContain('3 sessions');

      // Obsługa pustego obiektu i null
      expect(formatBackupSummary(null, 'pl')).toBe('Brak danych kopii zapasowej');
      expect(formatBackupSummary(null, 'en')).toBe('No backup data available');
    });

    test('TASK-P66-05-ARC: validateBackupEnvelope bezpiecznie weryfikuje koperty bez rzucania wyjątków', () => {
      const validEnvelope = buildBackup({
        inventory: [{ id: 'inv-1' } as any],
        customRecipes: [],
        sessions: [],
        caffeineLogs: [],
      });

      // 1. Poprawny obiekt koperty
      const resObj = validateBackupEnvelope(validEnvelope);
      expect(resObj.isValid).toBe(true);
      expect(resObj.envelope).toBeDefined();
      expect(resObj.error).toBeUndefined();

      // 2. Poprawny string JSON z kopertą
      const resJson = validateBackupEnvelope(JSON.stringify(validEnvelope));
      expect(resJson.isValid).toBe(true);
      expect(resJson.envelope).toBeDefined();

      // 3. Niepoprawny format lub schemat
      expect(validateBackupEnvelope(null).isValid).toBe(false);
      expect(validateBackupEnvelope(undefined).isValid).toBe(false);
      expect(validateBackupEnvelope('invalid-json').isValid).toBe(false);
      expect(validateBackupEnvelope({ format: 'other-format' }).isValid).toBe(false);
      expect(validateBackupEnvelope({ format: 'napar-backup', schemaVersion: 999 }).isValid).toBe(false);
      expect(validateBackupEnvelope({ format: 'napar-backup', schemaVersion: 1, state: 'not-an-object' }).isValid).toBe(false);
    });

    test('TASK-P69-05-ARC: filterBackupEnvelope umozliwia selektywne filtrowanie danych koperty', () => {
      const envelope = buildBackup({
        inventory: [{ id: 'i1' }, { id: 'i2' }] as any,
        customRecipes: [{ id: 'r1' }] as any,
        sessions: [{ id: 's1' }, { id: 's2' }, { id: 's3' }] as any,
        caffeineLogs: [{ id: 'c1' }] as any,
      });

      // 1. Filtrowanie tylko receptur (np. udostępnienie przepisów)
      const recipesOnly = filterBackupEnvelope(envelope, {
        includeInventory: false,
        includeSessions: false,
        includeCaffeine: false,
      });
      expect(recipesOnly.state.customRecipes.length).toBe(1);
      expect(recipesOnly.state.inventory.length).toBe(0);
      expect(recipesOnly.state.sessions.length).toBe(0);
      expect(recipesOnly.state.caffeineLogs.length).toBe(0);

      // 2. Domyślnie zachowuje wszystkie tablice
      const fullCopy = filterBackupEnvelope(envelope, {});
      expect(fullCopy.state.inventory.length).toBe(2);
      expect(fullCopy.state.customRecipes.length).toBe(1);
      expect(fullCopy.state.sessions.length).toBe(3);
      expect(fullCopy.state.caffeineLogs.length).toBe(1);

      // 3. Typy i odporność na null
      const filterOpts: BackupFilterOptions = { includeRecipes: true };
      expect(filterOpts.includeRecipes).toBe(true);
      expect(() => filterBackupEnvelope(null as any)).toThrow();
    });

    test('TASK-P71-05-ARC: diffBackupEnvelopes porównuje dwie koperty i liczy delty', () => {
      const sourceEnv = buildBackup({
        inventory: [{ id: 'i1' }] as any,
        customRecipes: [{ id: 'r1' }, { id: 'r2' }] as any,
        sessions: [{ id: 's1' }] as any,
        caffeineLogs: [] as any,
      });

      const targetEnv = buildBackup({
        inventory: [{ id: 'i1' }, { id: 'i2' }, { id: 'i3' }] as any,
        customRecipes: [{ id: 'r1' }, { id: 'r2' }] as any,
        sessions: [{ id: 's1' }, { id: 's2' }] as any,
        caffeineLogs: [{ id: 'c1' }] as any,
      });

      const diff: BackupDiffResult = diffBackupEnvelopes(sourceEnv, targetEnv);
      expect(diff.isIdentical).toBe(false);
      expect(diff.inventory).toEqual({ source: 1, target: 3, delta: 2 });
      expect(diff.recipes).toEqual({ source: 2, target: 2, delta: 0 });
      expect(diff.sessions).toEqual({ source: 1, target: 2, delta: 1 });
      expect(diff.caffeine).toEqual({ source: 0, target: 1, delta: 1 });

      // Identyczne koperty
      const identicalDiff = diffBackupEnvelopes(sourceEnv, sourceEnv);
      expect(identicalDiff.isIdentical).toBe(true);
      expect(identicalDiff.inventory.delta).toBe(0);

      // Odporność na null/undefined
      const fallbackDiff = diffBackupEnvelopes(null, undefined);
      expect(fallbackDiff.isIdentical).toBe(true);
      expect(fallbackDiff.inventory.source).toBe(0);
      expect(fallbackDiff.inventory.target).toBe(0);
    });

    test('TASK-P74-05-ARC: mergeBackupEnvelopes scala dwie koperty z deduplikacja ID i strategiami konfliktow', () => {
      const primary = buildBackup({
        inventory: [{ id: 'i1', name: 'Original I1' }, { id: 'i2', name: 'Original I2' }] as any,
        customRecipes: [{ id: 'r1', name: 'V60 Original' }] as any,
        sessions: [{ id: 's1' }] as any,
        caffeineLogs: [] as any,
      });

      const incoming = buildBackup({
        inventory: [{ id: 'i2', name: 'Updated I2' }, { id: 'i3', name: 'New I3' }] as any,
        customRecipes: [{ id: 'r2', name: 'AeroPress New' }] as any,
        sessions: [{ id: 's2' }] as any,
        caffeineLogs: [{ id: 'c1' }] as any,
      });

      // 1. Domyślna strategia: keep_primary (nie nadpisuje istniejących ID)
      const mergedKeep = mergeBackupEnvelopes(primary, incoming);
      expect(mergedKeep.state.inventory.length).toBe(3);
      expect(mergedKeep.state.inventory.find((i) => i.id === 'i2')?.name).toBe('Original I2');
      expect(mergedKeep.state.customRecipes.length).toBe(2);
      expect(mergedKeep.state.sessions.length).toBe(2);
      expect(mergedKeep.state.caffeineLogs.length).toBe(1);

      // 2. Strategia overwrite_primary (nadpisuje istniejące ID nowymi danymi z incoming)
      const opts: BackupMergeOptions = { conflictStrategy: 'overwrite_primary' };
      const mergedOverwrite = mergeBackupEnvelopes(primary, incoming, opts);
      expect(mergedOverwrite.state.inventory.length).toBe(3);
      expect(mergedOverwrite.state.inventory.find((i) => i.id === 'i2')?.name).toBe('Updated I2');

      // 3. Odporność na błędy (brak parametrów)
      expect(() => mergeBackupEnvelopes(null as any, incoming)).toThrow();
      expect(() => mergeBackupEnvelopes(primary, null as any)).toThrow();
    });

    test('TASK-P76-05-ARC: getBackupRecordCounts zlicza całkowitą liczbę rekordów i metadane kopii', () => {
      const envelope = buildBackup({
        inventory: [{ id: 'i1' }, { id: 'i2' }] as any,
        customRecipes: [{ id: 'r1' }] as any,
        sessions: [{ id: 's1' }, { id: 's2' }, { id: 's3' }] as any,
        caffeineLogs: [{ id: 'c1' }] as any,
      });

      const counts: BackupRecordCounts = getBackupRecordCounts(envelope);
      expect(counts.inventoryCount).toBe(2);
      expect(counts.recipesCount).toBe(1);
      expect(counts.sessionsCount).toBe(3);
      expect(counts.caffeineLogsCount).toBe(1);
      expect(counts.totalRecords).toBe(7);
      expect(counts.exportedAt).toBeDefined();

      // Odporność na brakujące kolekcje i null/undefined
      const emptyCounts = getBackupRecordCounts(null);
      expect(emptyCounts.totalRecords).toBe(0);
      expect(emptyCounts.exportedAt).toBe('');
      expect(getBackupRecordCounts({} as any).totalRecords).toBe(0);
    });

    test('TASK-P78-05-ARC: isBackupEmpty weryfikuje czy koperta zawiera jakiekolwiek dane', () => {
      // 1. Pusta koperta (zerowe kolekcje)
      const emptyEnvelope = buildBackup({
        inventory: [],
        customRecipes: [],
        sessions: [],
        caffeineLogs: [],
      });
      expect(isBackupEmpty(emptyEnvelope)).toBe(true);

      // 2. Koperta z pojedynczym elementem
      const withItem = buildBackup({
        inventory: [{ id: 'bean-1' }] as any,
        customRecipes: [],
        sessions: [],
        caffeineLogs: [],
      });
      expect(isBackupEmpty(withItem)).toBe(false);

      // 3. Koperta z sesją
      const withSession = buildBackup({
        inventory: [],
        customRecipes: [],
        sessions: [{ id: 'sess-1' }] as any,
        caffeineLogs: [],
      });
      expect(isBackupEmpty(withSession)).toBe(false);

      // 4. Odporność na null, undefined, pusty obiekt
      expect(isBackupEmpty(null)).toBe(true);
      expect(isBackupEmpty(undefined)).toBe(true);
      expect(isBackupEmpty({} as any)).toBe(true);
      expect(isBackupEmpty({ state: {} } as any)).toBe(true);
    });

    test('TASK-P81-05-ARC: validateBackupEnvelopeIntegrity szczegółowo weryfikuje poprawność i integralność kopii', () => {
      // 1. Poprawna koperta
      const validEnvelope = buildBackup({
        inventory: [{ id: 'bean-1' }, { id: 'bean-2' }] as any,
        customRecipes: [{ id: 'rec-1' }] as any,
        sessions: [{ id: 'sess-1' }, { id: 'sess-2' }] as any,
        caffeineLogs: [{ id: 'caff-1' }] as any,
      });

      const report: BackupIntegrityReport = validateBackupEnvelopeIntegrity(validEnvelope);
      expect(report.isValid).toBe(true);
      expect(report.totalRecords).toBe(6);
      expect(report.inventoryCount).toBe(2);
      expect(report.recipesCount).toBe(1);
      expect(report.sessionsCount).toBe(2);
      expect(report.caffeineLogsCount).toBe(1);
      expect(report.issues).toHaveLength(0);

      // 2. Uszkodzona koperta (brak app, nieprawidłowy schemat)
      const corrupted = {
        format: 'wrong-format',
        version: 99,
        data: { inventory: 'not-an-array' },
      };
      const badReport = validateBackupEnvelopeIntegrity(corrupted);
      expect(badReport.isValid).toBe(false);
      expect(badReport.issues.length).toBeGreaterThan(0);

      // 3. Odporność na null, undefined i ciągi niebędące JSON
      const nullReport = validateBackupEnvelopeIntegrity(null);
      expect(nullReport.isValid).toBe(false);
      expect(nullReport.totalRecords).toBe(0);

      const invalidJsonReport = validateBackupEnvelopeIntegrity('not a json');
      expect(invalidJsonReport.isValid).toBe(false);
      expect(invalidJsonReport.issues.length).toBeGreaterThan(0);
    });

    test('TASK-P83-05-ARC: sanitizeBackupEnvelope naprawia i normalizuje strukturę koperty kopii zapasowej', () => {
      // 1. Zwykła poprawna koperta z zanieczyszczonymi rekordami (brakujące id, nie-obiekty)
      const dirty = {
        format: 'napar-backup',
        schemaVersion: 1,
        exportedAt: '2026-10-27T10:00:00Z',
        state: {
          inventory: [{ id: 'valid-1', name: 'Kenya' }, null, { name: 'No ID' }, 'string-item'],
          customRecipes: [{ id: 'rec-1', name: 'V60' }],
          sessions: [{ id: 'sess-1' }],
          caffeineLogs: [{ id: 'caff-1' }],
        },
      };

      const sanitized: NaparBackupEnvelope = sanitizeBackupEnvelope(dirty);
      expect(sanitized.format).toBe('napar-backup');
      expect(sanitized.schemaVersion).toBe(1);
      expect(sanitized.state.inventory).toHaveLength(1);
      expect(sanitized.state.inventory[0].id).toBe('valid-1');
      expect(sanitized.state.customRecipes).toHaveLength(1);

      // 2. Format legacy (użycie .data zamiast .state oraz .recipes zamiast .customRecipes)
      const legacy = {
        version: 1,
        data: {
          inventory: [{ id: 'leg-inv-1' }],
          recipes: [{ id: 'leg-rec-1' }],
        },
      };
      const fromLegacy = sanitizeBackupEnvelope(legacy);
      expect(fromLegacy.format).toBe('napar-backup');
      expect(fromLegacy.state.inventory).toHaveLength(1);
      expect(fromLegacy.state.customRecipes).toHaveLength(1);
      expect(fromLegacy.state.sessions).toEqual([]);

      // 3. Odporność na null, undefined, nie-obiekt
      const fromNull = sanitizeBackupEnvelope(null);
      expect(fromNull.format).toBe('napar-backup');
      expect(Array.isArray(fromNull.state.inventory)).toBe(true);
      expect(Array.isArray(fromNull.state.sessions)).toBe(true);
      expect(fromNull.schemaVersion).toBe(SCHEMA_VERSION);
    });

    test('TASK-P86-05-ARC: estimateBackupFileSize wylicza szacunkowy rozmiar pliku i rozbicie kolekcji', () => {
      const envelope = buildBackup({
        inventory: [{ id: 'inv-1', name: 'Ethiopia Yirgacheffe Washed 250g' }] as any,
        customRecipes: [{ id: 'rec-1', name: 'V60 4:6 Method Kasuya Specialty' }] as any,
        sessions: [{ id: 'sess-1', notes: 'Very sweet cup with citrus notes' }] as any,
        caffeineLogs: [{ id: 'caff-1', doseMg: 150 }] as any,
      });

      // 1. Prawidłowa koperta z danymi
      const sizeEst: BackupFileSizeEstimate = estimateBackupFileSize(envelope);
      expect(sizeEst.estimatedBytes).toBeGreaterThan(100);
      expect(sizeEst.estimatedKilobytes).toBeGreaterThan(0);
      expect(sizeEst.formattedSize).toMatch(/KB$|B$/);
      expect(sizeEst.collectionBreakdownBytes.inventory).toBeGreaterThan(0);
      expect(sizeEst.collectionBreakdownBytes.recipes).toBeGreaterThan(0);
      expect(sizeEst.collectionBreakdownBytes.sessions).toBeGreaterThan(0);
      expect(sizeEst.collectionBreakdownBytes.caffeine).toBeGreaterThan(0);
      expect(sizeEst.collectionBreakdownPercent.inventory).toBeGreaterThan(0);

      // 2. Pusta koperta (nullish lub empty)
      const emptyEst = estimateBackupFileSize(null);
      expect(emptyEst.estimatedBytes).toBe(0);
      expect(emptyEst.estimatedKilobytes).toBe(0);
      expect(emptyEst.formattedSize).toBe('0 B');
      expect(emptyEst.collectionBreakdownBytes.inventory).toBe(0);
      expect(emptyEst.collectionBreakdownPercent.inventory).toBe(0);
    });

    test('TASK-P88-05-ARC: compareBackupVersions porównuje wersje kopii zapasowych i wykrywa konflikty', () => {
      const baseEnv: NaparBackupEnvelope = buildBackup({
        inventory: [{ id: 'inv-1', name: 'Ethiopia' }] as any,
        customRecipes: [{ id: 'rec-1', name: 'V60' }] as any,
        sessions: [],
        caffeineLogs: [],
      });
      baseEnv.exportedAt = '2026-10-25T12:00:00Z';

      // 1. Identyczne kopie
      const sameComparison: BackupVersionComparison = compareBackupVersions(baseEnv, baseEnv);
      const sameStatus: BackupComparisonStatus = sameComparison.status;
      expect(sameStatus).toBe('identical');
      expect(sameComparison.recommendedAction).toBe('keep_local');
      expect(sameComparison.differenceItemCount).toBe(0);
      expect(sameComparison.summaryMessagePl).toContain('identyczne');

      // 2. Local ahead (lokalna kopia nowsza i z większą liczbą rekordów)
      const newerLocal: NaparBackupEnvelope = {
        ...baseEnv,
        exportedAt: '2026-10-27T12:00:00Z',
        state: {
          ...baseEnv.state,
          sessions: [{ id: 'sess-1', notes: 'Great brew' }] as any,
        },
      };
      const localAhead = compareBackupVersions(newerLocal, baseEnv);
      expect(localAhead.status).toBe('local_ahead');
      expect(localAhead.recommendedAction).toBe('keep_local');
      expect(localAhead.differenceItemCount).toBe(1);
      expect(localAhead.summaryMessagePl).toContain('Lokalna');

      // 3. Remote ahead (zdalna kopia nowsza i z większą liczbą rekordów)
      const remoteAhead = compareBackupVersions(baseEnv, newerLocal);
      expect(remoteAhead.status).toBe('remote_ahead');
      expect(remoteAhead.recommendedAction).toBe('restore_remote');
      expect(remoteAhead.differenceItemCount).toBe(-1);
      expect(remoteAhead.summaryMessagePl).toContain('Zdalna');

      // 4. Divergent conflict (zdalna nowsza data, ale lokalna ma więcej rekordów)
      const olderMoreItems: NaparBackupEnvelope = {
        ...baseEnv,
        exportedAt: '2026-10-24T12:00:00Z',
        state: {
          ...baseEnv.state,
          sessions: [{ id: 'sess-1' }, { id: 'sess-2' }] as any,
        },
      };
      const newerFewerItems: NaparBackupEnvelope = {
        ...baseEnv,
        exportedAt: '2026-10-27T12:00:00Z',
        state: {
          inventory: [],
          customRecipes: [],
          sessions: [],
          caffeineLogs: [],
        },
      };
      const conflict = compareBackupVersions(olderMoreItems, newerFewerItems);
      expect(conflict.status).toBe('divergent_conflict');
      expect(conflict.recommendedAction).toBe('merge_required');
      expect(conflict.summaryMessagePl).toContain('konflikt');

      // 5. Corrupt / missing input
      const corrupt = compareBackupVersions(null, null);
      expect(corrupt.status).toBe('corrupt');
      expect(corrupt.recommendedAction).toBe('reject');
    });

    test('TASK-P90-05-ARC: generateBackupMigrationPlan generuje precyzyjny plan migracji schematu kopii', () => {
      // 1. Kopia zgodna z bieżącą wersją schematu (SCHEMA_VERSION = 1)
      const currentEnv = buildBackup({
        inventory: [{ id: 'i1' }] as any,
        customRecipes: [{ id: 'r1' }, { id: 'r2' }] as any,
        sessions: [{ id: 's1' }] as any,
        caffeineLogs: [] as any,
      });

      const currentPlan: BackupMigrationPlan = generateBackupMigrationPlan(currentEnv);
      expect(currentPlan.fromSchemaVersion).toBe(SCHEMA_VERSION);
      expect(currentPlan.toSchemaVersion).toBe(SCHEMA_VERSION);
      expect(currentPlan.isMigrationRequired).toBe(false);
      expect(currentPlan.canSafelyMigrate).toBe(true);
      expect(currentPlan.totalItemsToMigrate).toBe(0);
      expect(currentPlan.steps.every((s: BackupMigrationStep) => s.action === 'noop')).toBe(true);
      expect(currentPlan.summaryPl).toContain('zgodna');

      // 2. Starsza wersja schematu (v0) wymagająca migracji
      const legacyEnv = {
        format: 'napar-backup',
        schemaVersion: 0,
        exportedAt: '2025-01-01T00:00:00Z',
        state: {
          inventory: [{ id: 'legacy-1' }],
          customRecipes: [{ id: 'rec-1' }],
          sessions: [],
          caffeineLogs: [],
        },
      };

      const legacyPlan = generateBackupMigrationPlan(legacyEnv);
      expect(legacyPlan.fromSchemaVersion).toBe(0);
      expect(legacyPlan.toSchemaVersion).toBe(SCHEMA_VERSION);
      expect(legacyPlan.isMigrationRequired).toBe(true);
      expect(legacyPlan.canSafelyMigrate).toBe(true);
      expect(legacyPlan.totalItemsToMigrate).toBe(2);
      expect(legacyPlan.steps.some((s) => s.action === 'migrate_schema' && s.collection === 'inventory')).toBe(true);
      expect(legacyPlan.summaryPl).toContain('starszą wersję');

      // 3. Nowsza wersja schematu (v99) z przyszłości
      const futureEnv = {
        ...currentEnv,
        schemaVersion: 99,
      };
      const futurePlan = generateBackupMigrationPlan(futureEnv);
      expect(futurePlan.canSafelyMigrate).toBe(false);
      expect(futurePlan.isMigrationRequired).toBe(false);
      expect(futurePlan.summaryPl).toContain('nowszej');

      // 4. Uszkodzone dane / null
      const corruptPlan = generateBackupMigrationPlan(null);
      expect(corruptPlan.canSafelyMigrate).toBe(false);
      expect(corruptPlan.isMigrationRequired).toBe(false);
      expect(corruptPlan.summaryPl).toContain('uszkodzona');
    });

    test('TASK-P93-05-ARC: calculateBackupHealthScore ocenia integralność i jakość kopii zapasowej', () => {
      // 1. Doskonała kopia (healthy backup)
      const healthyEnv = buildBackup({
        inventory: [{ id: 'i1', name: 'Ethiopia Yirgacheffe', remainingWeightGrams: 250 }] as any,
        customRecipes: [{ id: 'r1', name: 'V60 Sweet Brew' }] as any,
        sessions: [{ id: 's1', recipeName: 'V60', createdAt: '2026-01-01T10:00:00Z' }] as any,
        caffeineLogs: [],
      });

      const health: BackupHealthScore = calculateBackupHealthScore(healthyEnv);
      const testGrade: BackupHealthGrade = health.grade;
      expect(testGrade).toBe('excellent');
      expect(health.score).toBeGreaterThanOrEqual(90);
      expect(health.issues.length).toBe(0);
      expect(health.hasInventory).toBe(true);
      expect(health.hasCustomRecipes).toBe(true);
      expect(health.hasSessions).toBe(true);
      expect(health.totalRecords).toBe(3);
      expect(health.summaryPl).toContain('Stan doskonały');
      expect(health.summaryEn).toBeDefined();

      // 2. Pusta kopia (brak rekordów)
      const emptyEnv = buildBackup({
        inventory: [],
        customRecipes: [],
        sessions: [],
        caffeineLogs: [],
      });
      const emptyHealth = calculateBackupHealthScore(emptyEnv);
      expect(emptyHealth.grade).toBe('fair');
      expect(emptyHealth.totalRecords).toBe(0);
      expect(emptyHealth.issues.some((i) => i.includes('pusta'))).toBe(true);

      // 3. Kopia uszkodzona / null
      const invalidHealth = calculateBackupHealthScore(null);
      expect(invalidHealth.grade).toBe('invalid');
      expect(invalidHealth.score).toBe(0);
      expect(invalidHealth.totalRecords).toBe(0);
      expect(invalidHealth.summaryPl).toContain('uszkodzona');
    });

    test('TASK-P95-05-ARC: compactBackupEnvelope usuwa duplikaty ID, oczyszcza białe znaki i optymalizuje stan', () => {
      const rawEnv = buildBackup({
        inventory: [
          { id: 'i1', name: '  Ethiopia Yirgacheffe  ', remainingWeightGrams: 250 },
          { id: 'i1', name: 'Ethiopia Duplikat', remainingWeightGrams: 200 },
          { id: 'i2', name: 'Kenya Nyeri', remainingWeightGrams: 100 },
        ] as any,
        customRecipes: [
          { id: 'r1', name: '  V60 Recipe  ' },
        ] as any,
        sessions: [
          { id: 's1', recipeName: '  V60  ' },
          { id: 's1', recipeName: 'V60 Dubel' },
        ] as any,
        caffeineLogs: [],
      });

      const res: CompactBackupResult = compactBackupEnvelope(rawEnv);
      expect(res.originalRecordCount).toBe(6);
      expect(res.compactedRecordCount).toBe(4);
      expect(res.removedDuplicatesCount).toBe(2);
      expect(res.cleanedFieldsCount).toBeGreaterThan(0);
      expect(res.summaryPl).toContain('Zoptymalizowano kopię');
      expect(res.summaryEn).toBeDefined();

      const compactedState = (res.compactedEnvelope as any).state;
      expect(compactedState.inventory.length).toBe(2);
      expect(compactedState.inventory[0].name).toBe('Ethiopia Yirgacheffe');
      expect(compactedState.sessions.length).toBe(1);
      expect(compactedState.sessions[0].recipeName).toBe('V60');

      // Null / pusty envelope
      const emptyRes = compactBackupEnvelope(null);
      expect(emptyRes.originalRecordCount).toBe(0);
      expect(emptyRes.compactedRecordCount).toBe(0);
      expect(emptyRes.summaryPl).toContain('Nieprawidłowa');
    });

    test('TASK-P98-05-ARC: auditBackupRelationalIntegrity wykrywa osierocone referencje do inwentarza i receptur', () => {
      const backupData = buildBackup({
        inventory: [
          { id: 'inv-1', name: 'Kenya Nyeri' },
          { id: 'inv-2', name: 'Ethiopia Guji' },
        ] as any,
        customRecipes: [
          { id: 'rec-custom-1', name: 'My V60' },
        ] as any,
        sessions: [
          // Sesja poprawnie powiązana z istniejącą paczką i przepisem
          { id: 'ses-1', inventoryItemId: 'inv-1', recipeId: 'rec-custom-1', recipeName: 'My V60' },
          // Sesja powiązana z przepisem wzorcowym (master-)
          { id: 'ses-2', inventoryItemId: 'inv-2', recipeId: 'master-aeropress', recipeName: 'AeroPress Standard' },
          // Sesja ze skasowaną paczką (orphan inventory)
          { id: 'ses-3', inventoryItemId: 'inv-deleted-999', recipeId: 'rec-custom-1' },
          // Sesja ze skasowaną recepturą autorską (orphan recipe)
          { id: 'ses-4', inventoryItemId: 'inv-1', recipeId: 'rec-unknown-404' },
        ] as any,
        caffeineLogs: [],
      });

      const report: BackupRelationalIntegrityReport = auditBackupRelationalIntegrity(backupData);
      expect(report.totalSessionsAudited).toBe(4);
      expect(report.isFullyConsistent).toBe(false);
      expect(report.linkedInventoryCount).toBe(3);
      expect(report.linkedRecipeCount).toBe(3);
      expect(report.orphanedInventoryReferences).toBe(1);
      expect(report.orphanedRecipeReferences).toBe(1);
      expect(report.orphans).toHaveLength(2);

      const invOrphan: RelationalOrphanItem | undefined = report.orphans.find((o) => o.orphanType === 'missing_inventory_item');
      expect(invOrphan).toBeDefined();
      expect(invOrphan?.referenceId).toBe('inv-deleted-999');

      const recOrphan: RelationalOrphanItem | undefined = report.orphans.find((o) => o.orphanType === 'missing_recipe');
      expect(recOrphan).toBeDefined();
      expect(recOrphan?.referenceId).toBe('rec-unknown-404');

      expect(report.relationalConsistencyScore).toBeLessThan(100);
      expect(report.summaryPl).toContain('Wykryto 2 osieroconych relacji');
      expect(report.summaryEn).toBeDefined();

      // Odporność na pusty / uszkodzony obiekt
      const emptyAudit = auditBackupRelationalIntegrity(null);
      expect(emptyAudit.isFullyConsistent).toBe(true);
      expect(emptyAudit.relationalConsistencyScore).toBe(100);
      expect(emptyAudit.orphans).toEqual([]);
    });

    test('TASK-P100-05-ARC: computeBackupChecksum wylicza deterministyczną sumę kontrolną i jest odporny na kolejność pól', () => {
      const dataA = buildBackup({
        inventory: [{ id: 'inv-1', name: 'Ethiopia Yirgacheffe' }] as any,
        customRecipes: [{ id: 'rec-1', name: 'V60 4:6' }] as any,
        sessions: [],
        caffeineLogs: [],
      });

      // Ta sama zawartość w innej kolejności pól w obiekcie
      const dataB = buildBackup({
        inventory: [{ name: 'Ethiopia Yirgacheffe', id: 'inv-1' }] as any,
        customRecipes: [{ name: 'V60 4:6', id: 'rec-1' }] as any,
        sessions: [],
        caffeineLogs: [],
      });

      const resA: BackupChecksumResult = computeBackupChecksum(dataA);
      const resB = computeBackupChecksum(dataB);

      expect(resA.checksumHex).toBe(resB.checksumHex);
      expect(resA.checksumHex.length).toBe(8);
      expect(resA.recordCount).toBe(2);
      expect(resA.collectionBreakdown.inventory).toBe(1);
      expect(resA.collectionBreakdown.customRecipes).toBe(1);
      expect(resA.bytesHashed).toBeGreaterThan(0);
      expect(resA.summaryPl).toContain(resA.checksumHex.toUpperCase());
      expect(resA.summaryEn).toBeDefined();

      // Zmiana danych powoduje zmianę sumy kontrolnej
      const dataC = buildBackup({
        inventory: [{ id: 'inv-1', name: 'Kenya Nyeri' }] as any,
        customRecipes: [{ id: 'rec-1', name: 'V60 4:6' }] as any,
        sessions: [],
        caffeineLogs: [],
      });
      const resC = computeBackupChecksum(dataC);
      expect(resC.checksumHex).not.toBe(resA.checksumHex);

      // Pusty / uszkodzony payload
      const empty = computeBackupChecksum(null);
      expect(empty.checksumHex).toBe('00000000');
      expect(empty.bytesHashed).toBe(0);
      expect(empty.recordCount).toBe(0);
    });

    it('TASK-P102-05-ARC: detectBackupDuplicates wykrywa zduplikowane rekordy w kopii zapasowej', () => {
      // 1. Kopia z duplikatami (powtórzone ID oraz ten sam model kawy z innym ID)
      const dirtyBackup = {
        state: {
          inventory: [
            { id: 'inv-1', name: 'Ethiopia Yirgacheffe', brand: 'Specialty Roastery' },
            { id: 'inv-1', name: 'Ethiopia Yirgacheffe', brand: 'Specialty Roastery' }, // duplicate ID
            { id: 'inv-2', name: 'Ethiopia Yirgacheffe', brand: 'Specialty Roastery' }, // duplicate content
            { id: 'inv-3', name: 'Colombia Geisha', brand: 'Origin Roasters' },
          ],
          customRecipes: [
            { id: 'rec-1', name: 'V60 4:6 Standard', method: 'V60' },
            { id: 'rec-2', name: 'V60 4:6 Standard', method: 'V60' }, // duplicate recipe name+method
          ],
          sessions: [
            { id: 'ses-1', createdAt: '2026-10-25T10:00:00Z', recipeId: 'rec-1', doseGrams: 15 },
            { id: 'ses-1', createdAt: '2026-10-25T10:00:00Z', recipeId: 'rec-1', doseGrams: 15 }, // duplicate ID
          ],
          caffeineLogs: [],
        },
      };

      const report: BackupDuplicateReport = detectBackupDuplicates(dirtyBackup);
      expect(report.hasDuplicates).toBe(true);
      expect(report.totalDuplicateCount).toBeGreaterThan(0);
      expect(report.duplicateInventoryCount).toBeGreaterThan(0);
      expect(report.duplicateRecipesCount).toBe(1);
      expect(report.duplicateSessionsCount).toBe(1);
      expect(report.summaryPl).toContain('Wykryto');
      expect(report.duplicates.length).toBe(report.totalDuplicateCount);
      const firstDup: BackupDuplicateItem = report.duplicates[0];
      expect(firstDup.collection).toBeDefined();

      // 2. Czysta kopia bez duplikatów
      const cleanBackup = {
        state: {
          inventory: [{ id: 'inv-1', name: 'Kenya Nyeri' }],
          customRecipes: [{ id: 'rec-1', name: 'AeroPress Champion' }],
          sessions: [{ id: 'ses-1' }],
          caffeineLogs: [],
        },
      };
      const cleanReport = detectBackupDuplicates(cleanBackup);
      expect(cleanReport.hasDuplicates).toBe(false);
      expect(cleanReport.totalDuplicateCount).toBe(0);
      expect(cleanReport.summaryPl).toContain('Brak zduplikowanych');

      // 3. Odporność na null i puste obiekty
      const fallback = detectBackupDuplicates(null);
      expect(fallback.hasDuplicates).toBe(false);
      expect(fallback.totalDuplicateCount).toBe(0);
      expect(fallback.summaryEn).toBeDefined();
    });

    test('TASK-P105-05-ARC: simulateBackupRestore symuluje przywracanie kopii z typami BackupRestoreSimulationResult i BackupRestoreConflictType', () => {
      // 1. Bezpieczne przywracanie do pustej bazy
      const incomingEnvelope = {
        version: 1,
        data: {
          inventory: [{ id: 'b1' }, { id: 'b2' }],
          customRecipes: [{ id: 'r1' }],
          sessions: [{ id: 's1' }, { id: 's2' }, { id: 's3' }],
          caffeineLogs: [{ id: 'c1' }],
        },
      };

      const simClean: BackupRestoreSimulationResult = simulateBackupRestore(incomingEnvelope, {
        inventory: 0,
        recipes: 0,
        sessions: 0,
        caffeineLogs: 0,
      });
      const conflict: BackupRestoreConflictType = simClean.conflictType;
      expect(conflict).toBe('none');
      expect(simClean.canRestoreSafely).toBe(true);
      expect(simClean.totalIncomingRecords).toBe(7);
      expect(simClean.itemsToInsert).toBe(7);
      expect(simClean.itemsToUpdate).toBe(0);
      expect(simClean.recordsBreakdown.inventory).toBe(2);
      expect(simClean.recordsBreakdown.recipes).toBe(1);
      expect(simClean.recordsBreakdown.sessions).toBe(3);
      expect(simClean.summaryPl).toContain('7 do wstawienia');

      // 2. Przywracanie z nakładającymi się rekordami (merge / id_collision)
      const simMerge = simulateBackupRestore(incomingEnvelope, {
        inventory: 2,
        recipes: 1,
        sessions: 1,
        caffeineLogs: 0,
      });
      expect(simMerge.conflictType).toBe('id_collision');
      expect(simMerge.canRestoreSafely).toBe(true);
      expect(simMerge.itemsToUpdate).toBe(4);
      expect(simMerge.itemsToInsert).toBe(3);
      expect(simMerge.recommendationPl).toContain('trybie łączenia');

      // 3. Niezgodny schemat przyszłości (np. version 99)
      const futureEnv = { version: 99, data: { inventory: [{ id: '1' }] } };
      const simFuture = simulateBackupRestore(futureEnv);
      expect(simFuture.conflictType).toBe('schema_mismatch');
      expect(simFuture.canRestoreSafely).toBe(false);
      expect(simFuture.recommendationEn).toContain('Unsupported schema');

      // 4. Pusty ładunek lub null
      const simEmpty = simulateBackupRestore({ data: {} });
      expect(simEmpty.conflictType).toBe('empty_payload');
      expect(simEmpty.canRestoreSafely).toBe(false);

      const simNull = simulateBackupRestore(null);
      expect(simNull.conflictType).toBe('empty_payload');
      expect(simNull.canRestoreSafely).toBe(false);
      const resType: BackupRestoreSimulationResult = simNull;
      expect(resType.summaryEn).toBeTruthy();
    });
  });
});


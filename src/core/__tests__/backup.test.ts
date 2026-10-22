// ============================================================================
// Napar (Steepwise) — Unit Tests: Kopia zapasowa (format v2, walidacja, rotacja, pliki)
// ============================================================================

import {
  AUTO_KEEP,
  BACKUP_FORMAT,
  BACKUP_VERSION,
  LEGACY_BACKUP_VERSION,
  AUTO_RE,
  SAFETY_RE,
  autoBackup,
  buildBackup,
  checkCorruptState,
  configureBackupStorage,
  dismissCorruptState,
  exportBackup,
  localISODate,
  parseAndValidateBackup,
  poolKey,
  rotateBackupFiles,
  safetyBackup,
  saveCorruptState,
  stampOf,
  type BackupStorage,
  type NaparBackupData,
} from '../backup';

const EMPTY_STATE: NaparBackupData = {
  inventory: [],
  customRecipes: [],
  sessions: [],
  caffeineLogs: [],
  settings: {},
};

function v2(state: unknown, extra: Record<string, unknown> = {}): string {
  return JSON.stringify({ format: 'napar-backup', version: 2, exportedAt: '2026-10-22T08:00:00.000Z', state, ...extra });
}

function expectParseError(raw: string, message: string): void {
  expect(() => parseAndValidateBackup(raw)).toThrow(message);
}

describe('buildBackup', () => {
  test('stałe formatu: nazwa, wersja bieżąca i wersja dawna', () => {
    expect(BACKUP_FORMAT).toBe('napar-backup');
    expect(BACKUP_VERSION).toBe(2);
    expect(LEGACY_BACKUP_VERSION).toBe(1);
  });

  test('tworzy envelope w formacie v2 z czasem eksportu', () => {
    const envelope = buildBackup(EMPTY_STATE, new Date('2026-10-22T08:00:00.000Z'));
    expect(envelope).toEqual({
      format: 'napar-backup',
      version: 2,
      exportedAt: '2026-10-22T08:00:00.000Z',
      state: EMPTY_STATE,
    });
  });

  test('bez jawnej daty używa bieżącego czasu', () => {
    expect(buildBackup(EMPTY_STATE).exportedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});

describe('parseAndValidateBackup: format v2', () => {
  test('akceptuje poprawny envelope v2 i zwraca go bez zmian', () => {
    const state = { inventory: [{ id: 'a' }], customRecipes: [], sessions: [], caffeineLogs: [], settings: { unit_system: 'metric' } };
    const result = parseAndValidateBackup(v2(state));
    expect(result).toEqual({
      format: 'napar-backup',
      version: 2,
      exportedAt: '2026-10-22T08:00:00.000Z',
      state,
    });
  });

  test('brak sekcji caffeineLogs i settings daje wartości domyślne', () => {
    const result = parseAndValidateBackup(v2({ inventory: [], customRecipes: [], sessions: [] }));
    expect(result.state.caffeineLogs).toEqual([]);
    expect(result.state.settings).toEqual({});
  });

  test('brak exportedAt daje pusty znacznik czasu', () => {
    const raw = JSON.stringify({ format: 'napar-backup', version: 2, state: { inventory: [], customRecipes: [], sessions: [] } });
    expect(parseAndValidateBackup(raw).exportedAt).toBe('');
  });

  test('wersja nowsza niż obsługiwana jest odrzucana z komunikatem o aktualizacji', () => {
    const raw = JSON.stringify({ format: 'napar-backup', version: 3, state: {} });
    expectParseError(raw, 'Kopia pochodzi z nowszej wersji aplikacji (v3). Zaktualizuj aplikację.');
  });

  test('nieznana wersja z poprawnym formatem jest odrzucana', () => {
    expectParseError(JSON.stringify({ format: 'napar-backup', version: 'abc' }), 'Nieobsługiwana wersja kopii zapasowej (abc)');
    expectParseError(JSON.stringify({ format: 'napar-backup', schemaVersion: 2 }), 'Nieobsługiwana wersja kopii zapasowej (2)');
  });

  test('brak sekcji state lub state nie będący obiektem jest odrzucany', () => {
    const noState = JSON.stringify({ format: 'napar-backup', version: 2 });
    expectParseError(noState, 'Brak danych stanu (sekcja "state") w pliku kopii');
    expectParseError(v2(5), 'Brak danych stanu (sekcja "state") w pliku kopii');
    expectParseError(v2([]), 'Brak danych stanu (sekcja "state") w pliku kopii');
  });
});

describe('parseAndValidateBackup: format v1 (kompatybilność wstecz)', () => {
  test('wariant z zapisu automatycznego (format + schemaVersion 1 + state) jest przeliczany na v2', () => {
    const raw = JSON.stringify({
      format: 'napar-backup',
      schemaVersion: 1,
      exportedAt: '2025-01-01T00:00:00.000Z',
      state: { inventory: [{ id: 'i1' }], customRecipes: [], sessions: [], caffeineLogs: [{ id: 'c1' }] },
    });
    const result = parseAndValidateBackup(raw);
    expect(result.version).toBe(2);
    expect(result.exportedAt).toBe('2025-01-01T00:00:00.000Z');
    expect(result.state.inventory).toEqual([{ id: 'i1' }]);
    expect(result.state.caffeineLogs).toEqual([{ id: 'c1' }]);
    expect(result.state.settings).toEqual({});
  });

  test('wariant z eksportu JSON (version 1, bez pola format) jest przeliczany na v2', () => {
    const raw = JSON.stringify({
      version: 1,
      exportedAt: '2025-02-02T00:00:00.000Z',
      inventory: [],
      customRecipes: [{ id: 'r1' }],
      sessions: [{ id: 's1' }],
    });
    const result = parseAndValidateBackup(raw);
    expect(result.version).toBe(2);
    expect(result.state.customRecipes).toEqual([{ id: 'r1' }]);
    expect(result.state.sessions).toEqual([{ id: 's1' }]);
    expect(result.state.caffeineLogs).toEqual([]);
  });

  test('wariant v1 bez sekcji state jest odrzucany', () => {
    expectParseError(JSON.stringify({ format: 'napar-backup', schemaVersion: 1 }), 'Brak danych stanu');
  });

  test('wariant v1 z exportedAt niebędącym tekstem dostaje pusty znacznik', () => {
    const raw = JSON.stringify({ version: 1, exportedAt: 123, inventory: [], customRecipes: [], sessions: [] });
    expect(parseAndValidateBackup(raw).exportedAt).toBe('');
  });
});

describe('parseAndValidateBackup: odrzucanie błędnych plików', () => {
  test('niepoprawny JSON', () => {
    expectParseError('{nie-json', 'Nieprawidłowy format JSON');
  });

  test('wartość, która nie jest obiektem JSON', () => {
    expectParseError('[]', 'Plik kopii musi być obiektem JSON');
    expectParseError('null', 'Plik kopii musi być obiektem JSON');
    expectParseError('42', 'Plik kopii musi być obiektem JSON');
  });

  test('nieznany format', () => {
    expectParseError(JSON.stringify({ format: 'inny', version: 2 }), 'Nieznany format pliku (oczekiwano "napar-backup")');
    expectParseError(JSON.stringify({ version: 2, state: {} }), 'Nieznany format pliku (oczekiwano "napar-backup")');
    expectParseError(JSON.stringify({ format: 'napar-backup', version: 1 }), 'Nieobsługiwana wersja kopii zapasowej (1)');
  });

  test('błędne tablice w stanie', () => {
    expectParseError(v2({ inventory: {}, customRecipes: [], sessions: [] }), 'Nieprawidłowa struktura spiżarni');
    expectParseError(v2({ inventory: [], customRecipes: 'x', sessions: [] }), 'Nieprawidłowa struktura przepisów');
    expectParseError(v2({ inventory: [], customRecipes: [], sessions: null }), 'Nieprawidłowa struktura sesji');
    expectParseError(v2({ inventory: [], customRecipes: [], sessions: [], caffeineLogs: {} }), 'Nieprawidłowa struktura kofeiny');
  });

  test('wpis bez identyfikatora (lub z pustym) jest odrzucany', () => {
    const msg = 'Nieprawidłowa struktura sesji ("sessions" musi być tablicą) (każdy wpis musi mieć identyfikator)';
    expectParseError(v2({ inventory: [], customRecipes: [], sessions: [{ name: 'x' }] }), msg);
    expectParseError(v2({ inventory: [], customRecipes: [], sessions: [{ id: '' }] }), msg);
    expectParseError(v2({ inventory: [], customRecipes: [], sessions: [null] }), msg);
    expectParseError(v2({ inventory: [], customRecipes: [], sessions: [5] }), msg);
  });

  test('ustawienia muszą być obiektem tekstów', () => {
    const base = { inventory: [], customRecipes: [], sessions: [] };
    expectParseError(v2({ ...base, settings: null }), 'Nieprawidłowa sekcja ustawień');
    expectParseError(v2({ ...base, settings: ['a'] }), 'Nieprawidłowa sekcja ustawień');
    expectParseError(v2({ ...base, settings: { unit_system: 1 } }), 'Nieprawidłowa wartość ustawienia');
  });

  test('poprawne ustawienia są kopiowane', () => {
    const result = parseAndValidateBackup(v2({ inventory: [], customRecipes: [], sessions: [], settings: { a: 'b' } }));
    expect(result.state.settings).toEqual({ a: 'b' });
  });
});

describe('nazwy plików i rotacja', () => {
  test('localISODate i stampOf używają czasu lokalnego', () => {
    const d = new Date(2026, 9, 2, 7, 5, 9);
    expect(localISODate(d)).toBe('2026-10-02');
    expect(stampOf(d)).toBe('2026-10-02-070509');
    expect(localISODate()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(stampOf()).toMatch(/^\d{4}-\d{2}-\d{2}-\d{6}$/);
  });

  test('wzorce nazw rozdzielają pule automatyczną i bezpieczeństwa', () => {
    expect(AUTO_RE.test('napar-2026-10-22-070509.json')).toBe(true);
    expect(AUTO_RE.test('napar-kopia-2026-10-22-070509-2.json')).toBe(true);
    expect(AUTO_RE.test('napar-przed-importem-2026-10-22-070509.json')).toBe(false);
    expect(SAFETY_RE.test('napar-przed-importem-2026-10-22-070509.json')).toBe(true);
    expect(SAFETY_RE.test('napar-przed-czyszczeniem-2026-10-22-070509-3.json')).toBe(true);
    expect(SAFETY_RE.test('napar-2026-10-22-070509.json')).toBe(false);
  });

  test('poolKey dopełnia kolizje do trzech cyfr i domyślnie używa 001', () => {
    expect(poolKey(AUTO_RE.exec('napar-2026-10-22-070509.json') as RegExpExecArray)).toBe('2026-10-22-070509-001');
    expect(poolKey(AUTO_RE.exec('napar-2026-10-22-070509-12.json') as RegExpExecArray)).toBe('2026-10-22-070509-012');
  });

  test('rotacja zachowuje najnowsze pliki w puli i ignoruje cudze', () => {
    const files = Array.from({ length: 12 }, (_, i) => `napar-2026-10-22-0701${String(i).padStart(2, '0')}.json`);
    files.push('inny.txt', 'napar-przed-importem-2026-10-22-070000.json');
    const toDelete = rotateBackupFiles(files, AUTO_RE);
    expect(toDelete).toHaveLength(12 - AUTO_KEEP);
    expect(toDelete).toContain('napar-2026-10-22-070100.json');
    expect(toDelete).toContain('napar-2026-10-22-070101.json');
    expect(toDelete).not.toContain('napar-2026-10-22-070111.json');
    expect(toDelete).not.toContain('inny.txt');
  });

  test('rotacja wybiera najstarsze niezależnie od kolejności listy', () => {
    const names = Array.from({ length: 12 }, (_, i) => `napar-2026-10-22-0701${String(i).padStart(2, '0')}.json`);
    const mixed = [...names.filter((_, i) => i % 2 === 1).reverse(), ...names.filter((_, i) => i % 2 === 0)];
    expect(rotateBackupFiles(mixed, AUTO_RE).sort()).toEqual([names[0], names[1]].sort());
  });

  test('rotacja: pliki o tym samym kluczu czasu nie zmieniają kolejności', () => {
    const same = Array.from({ length: 11 }, () => 'napar-2026-10-22-070500.json');
    expect(rotateBackupFiles(same, AUTO_RE)).toHaveLength(1);
  });

  test('rotacja nie usuwa niczego, gdy pula mieści się w limicie', () => {
    expect(rotateBackupFiles(['napar-2026-10-22-070500.json'], AUTO_RE)).toEqual([]);
    expect(rotateBackupFiles(['a.json'], AUTO_RE, 1)).toEqual([]);
  });

  test('rotacja z podanym limitem', () => {
    const files = ['napar-2026-10-22-070500.json', 'napar-2026-10-22-070600.json', 'napar-2026-10-22-070700.json'];
    expect(rotateBackupFiles(files, AUTO_RE, 2)).toEqual(['napar-2026-10-22-070500.json']);
  });
});

// ----------------------------------------------------------------------------
// Operacje na plikach przez port BackupStorage (fałszywy magazyn w pamięci)
// ----------------------------------------------------------------------------

interface FakeStorage {
  storage: BackupStorage;
  files: Map<string, string>;
  dirs: Set<string>;
  shared: string[];
}

function fakeStorage(overrides: Partial<BackupStorage> = {}): FakeStorage {
  const files = new Map<string, string>();
  const dirs = new Set<string>();
  const shared: string[] = [];
  const storage: BackupStorage = {
    documentDirectory: 'file:///docs/',
    cacheDirectory: 'file:///cache/',
    exists: async (path) => files.has(path) || dirs.has(path),
    makeDirectory: async (path) => {
      dirs.add(path);
    },
    writeText: async (path, text) => {
      files.set(path, text);
    },
    readText: async (path) => {
      const value = files.get(path);
      if (value === undefined) throw new Error('ENOENT');
      return value;
    },
    listDirectory: async (dir) =>
      [...files.keys()].filter((k) => k.startsWith(dir)).map((k) => k.slice(dir.length)),
    remove: async (path) => {
      files.delete(path);
    },
    share: async (path) => {
      shared.push(path);
      return true;
    },
    ...overrides,
  };
  return { storage, files, dirs, shared };
}

describe('operacje na plikach kopii', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 9, 22, 7, 5, 9));
  });

  afterEach(() => {
    jest.useRealTimers();
    configureBackupStorage(null);
  });

  test('exportBackup zapisuje plik tymczasowy w Caches, udostępnia go i usuwa', async () => {
    const fake = fakeStorage();
    configureBackupStorage(fake.storage);
    await expect(exportBackup(EMPTY_STATE)).resolves.toBe(true);
    expect(fake.shared).toEqual(['file:///cache/napar-backup-2026-10-22.json']);
    expect(fake.files.size).toBe(0);
  });

  test('exportBackup bez Caches używa Dokumentów, a gdy brak obu, ścieżki względnej', async () => {
    const withDocs = fakeStorage({ cacheDirectory: null });
    configureBackupStorage(withDocs.storage);
    await exportBackup(EMPTY_STATE);
    expect(withDocs.shared[0]).toBe('file:///docs/napar-backup-2026-10-22.json');

    const none = fakeStorage({ cacheDirectory: null, documentDirectory: null });
    configureBackupStorage(none.storage);
    await exportBackup(EMPTY_STATE);
    expect(none.shared[0]).toBe('napar-backup-2026-10-22.json');
  });

  test('exportBackup zwraca false, gdy udostępnianie niedostępne, i sprząta plik', async () => {
    const fake = fakeStorage({ share: async () => false });
    configureBackupStorage(fake.storage);
    await expect(exportBackup(EMPTY_STATE)).resolves.toBe(false);
    expect(fake.files.size).toBe(0);
  });

  test('exportBackup ignoruje błąd sprzątania pliku tymczasowego', async () => {
    const fake = fakeStorage({
      remove: async () => {
        throw new Error('brak uprawnień');
      },
    });
    configureBackupStorage(fake.storage);
    await expect(exportBackup(EMPTY_STATE)).resolves.toBe(true);
  });

  test('exportBackup propaguje błąd zapisu', async () => {
    const fake = fakeStorage({
      writeText: async () => {
        throw new Error('dysk pełny');
      },
    });
    configureBackupStorage(fake.storage);
    await expect(exportBackup(EMPTY_STATE)).rejects.toThrow('dysk pełny');
  });

  test('exportBackup bez skonfigurowanego magazynu zgłasza błąd', async () => {
    await expect(exportBackup(EMPTY_STATE)).rejects.toThrow('Brak magazynu kopii zapasowych');
  });

  test('autoBackup tworzy katalog Backup i zapisuje envelope v2', async () => {
    const fake = fakeStorage();
    configureBackupStorage(fake.storage);
    const path = await autoBackup(EMPTY_STATE);
    expect(path).toBe('file:///docs/Backup/napar-2026-10-22-070509.json');
    expect(fake.dirs.has('file:///docs/Backup/')).toBe(true);
    const saved = JSON.parse(fake.files.get(path as string) as string);
    expect(saved.format).toBe('napar-backup');
    expect(saved.version).toBe(2);
  });

  test('autoBackup nie tworzy katalogu, gdy już istnieje', async () => {
    const fake = fakeStorage();
    fake.dirs.add('file:///docs/Backup/');
    const makeDirectory = jest.spyOn(fake.storage, 'makeDirectory');
    configureBackupStorage(fake.storage);
    await autoBackup(EMPTY_STATE);
    expect(makeDirectory).not.toHaveBeenCalled();
  });

  test('autoBackup dodaje przyrostek przy kolizji nazw w tej samej sekundzie', async () => {
    const fake = fakeStorage();
    configureBackupStorage(fake.storage);
    const first = await autoBackup(EMPTY_STATE);
    const second = await autoBackup(EMPTY_STATE);
    const third = await autoBackup(EMPTY_STATE);
    expect(first).toMatch(/napar-2026-10-22-070509\.json$/);
    expect(second).toMatch(/napar-2026-10-22-070509-2\.json$/);
    expect(third).toMatch(/napar-2026-10-22-070509-3\.json$/);
  });

  test('autoBackup rotuje pulę do AUTO_KEEP i nie rusza puli bezpieczeństwa', async () => {
    const fake = fakeStorage();
    fake.dirs.add('file:///docs/Backup/');
    for (let i = 0; i < AUTO_KEEP + 2; i++) {
      fake.files.set(`file:///docs/Backup/napar-2026-10-21-0600${String(i).padStart(2, '0')}.json`, '{}');
    }
    fake.files.set('file:///docs/Backup/napar-przed-importem-2026-10-20-080000.json', '{}');
    configureBackupStorage(fake.storage);
    await autoBackup(EMPTY_STATE);
    const autoLeft = [...fake.files.keys()].filter((k) => AUTO_RE.test(k.split('/').pop() as string));
    expect(autoLeft).toHaveLength(AUTO_KEEP);
    expect(fake.files.has('file:///docs/Backup/napar-przed-importem-2026-10-20-080000.json')).toBe(true);
  });

  test('błąd rotacji nie przerywa zapisu kopii', async () => {
    const fake = fakeStorage({
      listDirectory: async () => {
        throw new Error('lista niedostępna');
      },
    });
    configureBackupStorage(fake.storage);
    await expect(autoBackup(EMPTY_STATE)).resolves.toMatch(/napar-2026-10-22-070509\.json$/);
  });

  test('błąd usuwania starej kopii podczas rotacji jest ignorowany', async () => {
    const fake = fakeStorage({
      remove: async () => {
        throw new Error('zablokowany');
      },
    });
    fake.dirs.add('file:///docs/Backup/');
    for (let i = 0; i < AUTO_KEEP + 1; i++) {
      fake.files.set(`file:///docs/Backup/napar-2026-10-21-0600${String(i).padStart(2, '0')}.json`, '{}');
    }
    configureBackupStorage(fake.storage);
    await expect(autoBackup(EMPTY_STATE)).resolves.not.toBeNull();
  });

  test('autoBackup zwraca null przy braku magazynu lub katalogu dokumentów', async () => {
    await expect(autoBackup(EMPTY_STATE)).resolves.toBeNull();
    configureBackupStorage(fakeStorage({ documentDirectory: null }).storage);
    await expect(autoBackup(EMPTY_STATE)).resolves.toBeNull();
  });

  test('autoBackup przy błędzie zapisu usuwa uszkodzony plik i zwraca null', async () => {
    const remove = jest.fn(async () => {});
    const fake = fakeStorage({
      writeText: async () => {
        throw new Error('zapis nieudany');
      },
      remove,
    });
    configureBackupStorage(fake.storage);
    await expect(autoBackup(EMPTY_STATE)).resolves.toBeNull();
    expect(remove).toHaveBeenCalledWith('file:///docs/Backup/napar-2026-10-22-070509.json');
  });

  test('błąd usuwania po nieudanym zapisie jest ignorowany', async () => {
    const fake = fakeStorage({
      writeText: async () => {
        throw new Error('zapis nieudany');
      },
      remove: async () => {
        throw new Error('też nieudane');
      },
    });
    configureBackupStorage(fake.storage);
    await expect(autoBackup(EMPTY_STATE)).resolves.toBeNull();
  });

  test('safetyBackup używa przedrostka zależnego od rodzaju operacji', async () => {
    const fake = fakeStorage();
    configureBackupStorage(fake.storage);
    await expect(safetyBackup('import', EMPTY_STATE)).resolves.toBe(
      'file:///docs/Backup/napar-przed-importem-2026-10-22-070509.json'
    );
    await expect(safetyBackup('reset', EMPTY_STATE)).resolves.toBe(
      'file:///docs/Backup/napar-przed-czyszczeniem-2026-10-22-070509.json'
    );
  });

  test('safetyBackup rzuca błąd, żeby wywołujący mógł przerwać operację niszczącą', async () => {
    await expect(safetyBackup('import', EMPTY_STATE)).rejects.toThrow('Brak magazynu');
    configureBackupStorage(fakeStorage({ documentDirectory: null }).storage);
    await expect(safetyBackup('import', EMPTY_STATE)).rejects.toThrow('Brak katalogu dokumentów');
  });

  test('saveCorruptState zapisuje plik ratunkowy z payloadem', async () => {
    const fake = fakeStorage();
    configureBackupStorage(fake.storage);
    const path = await saveCorruptState('{"uszkodzone":', 'błąd bazy');
    expect(path).toBe('file:///docs/Backup/state_corrupt_2026-10-22-070509.json');
    const saved = JSON.parse(fake.files.get(path) as string);
    expect(saved.format).toBe('napar-corrupt-state');
    expect(saved.reason).toBe('błąd bazy');
    expect(saved.recovery.rawPayload).toBe('{"uszkodzone":');
  });

  test('saveCorruptState tworzy katalog gdy go brak i wymaga katalogu dokumentów', async () => {
    const fake = fakeStorage();
    configureBackupStorage(fake.storage);
    await saveCorruptState('x', 'y');
    expect(fake.dirs.has('file:///docs/Backup/')).toBe(true);

    configureBackupStorage(fakeStorage({ documentDirectory: null }).storage);
    await expect(saveCorruptState('x', 'y')).rejects.toThrow('Brak katalogu dokumentów');
  });

  test('checkCorruptState zwraca najnowszy plik ratunkowy z wycinkiem payloadu', async () => {
    const fake = fakeStorage();
    fake.dirs.add('file:///docs/Backup/');
    fake.files.set(
      'file:///docs/Backup/state_corrupt_2026-10-20-100000.json',
      JSON.stringify({ timestamp: 'stary', recovery: { rawPayload: 'a' } })
    );
    fake.files.set(
      'file:///docs/Backup/state_corrupt_2026-10-21-100000.json',
      JSON.stringify({ timestamp: 'nowy', recovery: { rawPayload: 'x'.repeat(150) } })
    );
    configureBackupStorage(fake.storage);
    const recovery = await checkCorruptState();
    expect(recovery).toEqual({
      corruptFile: 'state_corrupt_2026-10-21-100000.json',
      timestamp: 'nowy',
      rawSnippet: 'x'.repeat(100),
    });
  });

  test('checkCorruptState zwraca wartości domyślne przy niepełnym pliku', async () => {
    const fake = fakeStorage();
    fake.dirs.add('file:///docs/Backup/');
    fake.files.set('file:///docs/Backup/state_corrupt_2026-10-21-100000.json', '{}');
    configureBackupStorage(fake.storage);
    await expect(checkCorruptState()).resolves.toEqual({
      corruptFile: 'state_corrupt_2026-10-21-100000.json',
      timestamp: '',
      rawSnippet: '',
    });
  });

  test('checkCorruptState zwraca null, gdy nic nie ma lub plik jest nieczytelny', async () => {
    await expect(checkCorruptState()).resolves.toBeNull();

    configureBackupStorage(fakeStorage({ documentDirectory: null }).storage);
    await expect(checkCorruptState()).resolves.toBeNull();

    const noDir = fakeStorage();
    configureBackupStorage(noDir.storage);
    await expect(checkCorruptState()).resolves.toBeNull();

    const noCorrupt = fakeStorage();
    noCorrupt.dirs.add('file:///docs/Backup/');
    noCorrupt.files.set('file:///docs/Backup/napar-2026-10-21-060000.json', '{}');
    configureBackupStorage(noCorrupt.storage);
    await expect(checkCorruptState()).resolves.toBeNull();

    const broken = fakeStorage();
    broken.dirs.add('file:///docs/Backup/');
    broken.files.set('file:///docs/Backup/state_corrupt_2026-10-21-100000.json', '{nie-json');
    configureBackupStorage(broken.storage);
    await expect(checkCorruptState()).resolves.toBeNull();
  });

  test('dismissCorruptState usuwa plik banera i nie zgłasza błędów', async () => {
    const fake = fakeStorage();
    fake.files.set('file:///docs/Backup/state_corrupt_2026-10-21-100000.json', '{}');
    configureBackupStorage(fake.storage);
    await dismissCorruptState('state_corrupt_2026-10-21-100000.json');
    expect(fake.files.size).toBe(0);

    await expect(dismissCorruptState('brak.json')).resolves.toBeUndefined();

    configureBackupStorage(fakeStorage({ documentDirectory: null }).storage);
    await expect(dismissCorruptState('x.json')).resolves.toBeUndefined();

    configureBackupStorage(
      fakeStorage({
        remove: async () => {
          throw new Error('zablokowany');
        },
      }).storage
    );
    await expect(dismissCorruptState('x.json')).resolves.toBeUndefined();

    configureBackupStorage(null);
    await expect(dismissCorruptState('x.json')).resolves.toBeUndefined();
  });
});

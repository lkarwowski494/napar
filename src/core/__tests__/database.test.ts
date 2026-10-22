// ============================================================================
// Napar (Steepwise) — Unit Tests: Fasada bazy i repozytoria (prawdziwy SQL, sql.js)
// ============================================================================

import {
  configureDatabase,
  deductBeansForBrew,
  deductInventoryWeight,
  deleteBrewSession,
  deleteCaffeineLog,
  deleteInventoryItem,
  deleteRecipe,
  duplicateRecipe,
  exportAllDataJson,
  exportInventoryCsv,
  exportSessionsCsv,
  getAppSetting,
  getBedtimeHour,
  getBeveragePreference,
  getBrewSessionById,
  getBackupState,
  getBrewSessions,
  getCaffeineHalfLife,
  getCaffeineLogs,
  getDatabase,
  getDatabaseFallback,
  getHapticsEnabled,
  getHasCompletedOnboarding,
  getHealthKitSyncEnabled,
  getInventoryItemById,
  getInventoryItems,
  getIsProUser,
  getRecipeById,
  getRecipes,
  getUnitSystem,
  getVoiceAnnounceEnabled,
  initDatabase,
  logCaffeine,
  recordBrewSessionTransaction,
  saveBrewSession,
  saveInventoryItem,
  saveRecipe,
  setAppSetting,
  setBedtimeHour,
  setBeveragePreference,
  setCaffeineHalfLife,
  setHapticsEnabled,
  setHasCompletedOnboarding,
  setHealthKitSyncEnabled,
  setIsProUser,
  setUnitSystem,
  setVoiceAnnounceEnabled,
  toggleRecipeFavorite,
  updateRecipeFavorite,
} from '../database';
import type { BrewSession, CaffeineLog, InventoryItem, SavedRecipe } from '../database-schema';
import { MASTER_RECIPES } from '../recipes-data';
import { createMemoryDb, dumpTable, loadSqlJs, type MemoryDb, type SqlJsModule } from '../../../tests/helpers/sqljs-port';

let SQL: SqlJsModule;
let db: MemoryDb;

beforeAll(async () => {
  SQL = await loadSqlJs();
});

beforeEach(() => {
  db = createMemoryDb(SQL);
  configureDatabase(() => ({ port: db.port, fallback: null }));
});

afterAll(() => {
  configureDatabase(null);
});

function item(overrides: Partial<InventoryItem> = {}): InventoryItem {
  return {
    id: 'inv-1',
    name: 'Kenia AA',
    type: 'coffee',
    roasterOrProducer: 'Palarnia',
    origin: 'Kenia',
    roastOrHarvestDate: '2026-10-01',
    roastProfile: 'light',
    process: 'washed',
    variety: 'SL28',
    initialWeightGrams: 250,
    remainingWeightGrams: 100,
    flavorNotes: ['cytrus'],
    rating: 4,
    isFavorite: true,
    isArchived: false,
    createdAt: '2026-10-01T00:00:00.000Z',
    ...overrides,
  };
}

function recipe(overrides: Partial<SavedRecipe> = {}): SavedRecipe {
  return {
    id: 'rec-1',
    name: 'Moje V60',
    beverageType: 'COFFEE',
    method: 'V60',
    author: 'Ja',
    description: 'opis',
    doseGrams: 15,
    waterGrams: 250,
    waterTempCelsius: 94,
    grindSizeDescription: 'średni',
    recommendedRatio: 16.7,
    stepsJson: '[]',
    isCustom: true,
    isFavorite: false,
    createdAt: '2026-10-02T00:00:00.000Z',
    ...overrides,
  };
}

function session(overrides: Partial<BrewSession> = {}): BrewSession {
  return {
    id: 'ses-1',
    beverageType: 'COFFEE',
    method: 'V60',
    doseGrams: 15,
    waterGrams: 250,
    waterTempCelsius: 94,
    totalTimeSeconds: 180,
    flavorTags: ['owoce'],
    brewedAt: '2026-10-22T07:00:00.000Z',
    ...overrides,
  };
}

function caffeine(overrides: Partial<CaffeineLog> = {}): CaffeineLog {
  return {
    id: 'caf-1',
    beverageName: 'Espresso',
    beverageType: 'coffee',
    consumedAt: '2026-10-22T08:00:00.000Z',
    doseGrams: 18,
    caffeineMg: 120,
    ...overrides,
  };
}

describe('inicjalizacja i dane startowe', () => {
  test('schemat w wersji 3 z wszystkimi receptami startowymi', () => {
    initDatabase(db.port);
    expect(db.port.getFirstSync<{ user_version: number }>('PRAGMA user_version')?.user_version).toBe(3);
    expect(db.port.getFirstSync<{ c: number }>('SELECT COUNT(*) AS c FROM recipes WHERE is_custom = 0')?.c).toBe(
      MASTER_RECIPES.length
    );
  });

  test('ponowna inicjalizacja nie dubluje receptur startowych', () => {
    initDatabase(db.port);
    const before = dumpTable(db.port, 'recipes');
    initDatabase(db.port);
    expect(dumpTable(db.port, 'recipes')).toEqual(before);
  });

  test('brakująca receptura startowa jest odtwarzana przy inicjalizacji', () => {
    initDatabase(db.port);
    const first = MASTER_RECIPES[0];
    db.port.runSync('DELETE FROM recipes WHERE id = ?', [first.id]);
    initDatabase(db.port);
    expect(getRecipeById(first.id)?.name).toBe(first.name);
  });

  test('getDatabase otwiera bazę z konfiguracji i zwraca ten sam port', () => {
    expect(getDatabase()).toBe(getDatabase());
    expect(getDatabase()).toBe(db.port);
  });

  test('initDatabase bez argumentu otwiera bazę z konfiguracji', () => {
    initDatabase();
    expect(getRecipes().length).toBeGreaterThanOrEqual(MASTER_RECIPES.length);
  });

  test('bez konfiguracji bazy dostęp zgłasza błąd', () => {
    configureDatabase(null);
    expect(() => getDatabase()).toThrow('Baza danych nie jest skonfigurowana');
  });

  test('fallback lokalizacji jest zapisany w ustawieniach aplikacji', () => {
    configureDatabase(() => ({
      port: db.port,
      fallback: { preferredDirectory: 'file:///Library/SQLite', reason: 'brak katalogu' },
    }));
    expect(getDatabaseFallback()).toEqual({ preferredDirectory: 'file:///Library/SQLite', reason: 'brak katalogu' });
    expect(getAppSetting('db_location_fallback')).toBe('file:///Library/SQLite: brak katalogu');
  });

  test('bez fallbacku nic nie jest zapisywane i brak informacji o fallbacku', () => {
    expect(getDatabaseFallback()).toBeNull();
    expect(getAppSetting('db_location_fallback', 'brak')).toBe('brak');
  });
});

describe('spiżarnia', () => {
  test('zapis, odczyt, lista i archiwum', () => {
    saveInventoryItem(item());
    saveInventoryItem(item({ id: 'inv-2', name: 'Archiwum', isArchived: true }));
    expect(getInventoryItemById('inv-1')).toMatchObject({ name: 'Kenia AA', flavorNotes: ['cytrus'], isFavorite: true });
    expect(getInventoryItemById('brak')).toBeNull();
    expect(getInventoryItems().map((i) => i.id)).toEqual(['inv-1']);
    expect(getInventoryItems(true)).toHaveLength(2);
  });

  test('zapis z UI ustawia updatedAt na moment zapisu', () => {
    saveInventoryItem(item({ updatedAt: '2000-01-01T00:00:00.000Z' }));
    expect(getInventoryItemById('inv-1')?.updatedAt).not.toBe('2000-01-01T00:00:00.000Z');
  });

  test('odjęcie gramatury zaokrągla do 0,1 g i nie schodzi poniżej zera', () => {
    saveInventoryItem(item({ remainingWeightGrams: 20 }));
    deductInventoryWeight('inv-1', 15.25);
    expect(getInventoryItemById('inv-1')?.remainingWeightGrams).toBe(4.8);
    deductBeansForBrew('inv-1', 100);
    expect(getInventoryItemById('inv-1')?.remainingWeightGrams).toBe(0);
  });

  test('odjęcie dla nieistniejącej paczki nic nie zmienia', () => {
    expect(() => deductInventoryWeight('brak', 5)).not.toThrow();
    expect(getInventoryItems(true)).toEqual([]);
  });

  test('usunięcie paczki', () => {
    saveInventoryItem(item());
    deleteInventoryItem('inv-1');
    expect(getInventoryItemById('inv-1')).toBeNull();
  });
});

describe('przepisy', () => {
  test('filtrowanie po rodzaju napoju i sortowanie ulubionych', () => {
    saveRecipe(recipe({ id: 'r-tea', name: 'Herbata', beverageType: 'TEA' }));
    saveRecipe(recipe({ id: 'r-fav', name: 'Ulubiona', isFavorite: true }));
    expect(getRecipes('TEA').map((r) => r.id)).toContain('r-tea');
    expect(getRecipes('TEA').every((r) => r.beverageType === 'TEA')).toBe(true);
    expect(getRecipes('COFFEE')[0].id).toBe('r-fav');
  });

  test('ulubione: przełączanie, jawne ustawienie i brak receptury', () => {
    saveRecipe(recipe());
    expect(toggleRecipeFavorite('rec-1')).toBe(true);
    expect(getRecipeById('rec-1')?.isFavorite).toBe(true);
    updateRecipeFavorite('rec-1', false);
    expect(getRecipeById('rec-1')?.isFavorite).toBe(false);
    expect(toggleRecipeFavorite('brak')).toBe(false);
  });

  test('duplikat tworzy recepturę własną z sufiksem', () => {
    const copy = duplicateRecipe(
      {
        id: 'src',
        name: 'Wzorzec',
        type: 'TEA',
        method: 'Gong Fu',
        author: 'Źródło',
        coffeeOrTeaDoseGrams: 5,
        waterWeightGrams: 100,
        waterTemperatureCelsius: 90,
        grindSettingDescriptionPl: 'liście',
        recommendedRatio: 20,
        steps: [{ t: 1 }],
      },
      ' (Test)'
    );
    expect(copy).toMatchObject({
      name: 'Wzorzec (Test)',
      beverageType: 'TEA',
      author: 'Źródło (Modyfikacja)',
      doseGrams: 5,
      waterGrams: 100,
      waterTempCelsius: 90,
      grindSizeDescription: 'liście',
      stepsJson: '[{"t":1}]',
      isCustom: true,
    });
    expect(getRecipeById(copy.id)?.name).toBe('Wzorzec (Test)');
  });

  test('usunięcie receptury', () => {
    saveRecipe(recipe());
    deleteRecipe('rec-1');
    expect(getRecipeById('rec-1')).toBeNull();
  });
});

describe('dziennik parzeń', () => {
  test('zapis i odczyt sesji z profilem sensorycznym', () => {
    saveBrewSession(
      session({ sensory: { acidity: 3, sweetness: 4, body: 2, clarity: 5, finish: 3 }, tdsPercentage: 1.4, rating: 5, infusionNumber: 2 })
    );
    expect(getBrewSessionById('ses-1')).toMatchObject({
      flavorTags: ['owoce'],
      sensory: { acidity: 3, sweetness: 4, body: 2, clarity: 5, finish: 3 },
      tdsPercentage: 1.4,
      rating: 5,
      infusionNumber: 2,
    });
    expect(getBrewSessionById('brak')).toBeNull();
  });

  test('lista dziennika domyślnie zwraca 100 najnowszych sesji', () => {
    for (let i = 0; i < 105; i++) {
      saveBrewSession(session({ id: `s-${i}`, brewedAt: `2026-10-22T07:${String(i % 60).padStart(2, '0')}:00.000Z` }));
    }
    expect(getBrewSessions()).toHaveLength(100);
    expect(getBrewSessions(3)).toHaveLength(3);
  });

  test('transakcja: sesja i zdjęcie z zapasu razem, a bez odjęcia tylko sesja', () => {
    saveInventoryItem(item({ remainingWeightGrams: 30 }));
    recordBrewSessionTransaction(session({ id: 'tx-1' }), { itemId: 'inv-1', doseGrams: 15 });
    expect(getInventoryItemById('inv-1')?.remainingWeightGrams).toBe(15);

    recordBrewSessionTransaction(session({ id: 'tx-2' }), { itemId: '', doseGrams: 15 });
    recordBrewSessionTransaction(session({ id: 'tx-3' }), { itemId: 'inv-1', doseGrams: 0 });
    recordBrewSessionTransaction(session({ id: 'tx-4' }));
    expect(getInventoryItemById('inv-1')?.remainingWeightGrams).toBe(15);
    expect(getBrewSessionById('tx-4')).not.toBeNull();
  });

  test('usunięcie sesji', () => {
    saveBrewSession(session());
    deleteBrewSession('ses-1');
    expect(getBrewSessionById('ses-1')).toBeNull();
  });
});

describe('kofeina', () => {
  test('filtr od podanej chwili i pełna lista bez argumentu', () => {
    logCaffeine(caffeine({ id: 'old', consumedAt: '2026-10-20T08:00:00.000Z' }));
    logCaffeine(caffeine({ id: 'new', consumedAt: '2026-10-22T08:00:00.000Z', brewSessionId: 'ses-9' }));
    expect(getCaffeineLogs('2026-10-21T00:00:00.000Z').map((l) => l.id)).toEqual(['new']);
    expect(getCaffeineLogs().map((l) => l.id)).toEqual(['new', 'old']);
    expect(getCaffeineLogs()[0].brewSessionId).toBe('ses-9');
    expect(getCaffeineLogs()[1].brewSessionId).toBeUndefined();
  });

  test('usunięcie wpisu', () => {
    logCaffeine(caffeine());
    deleteCaffeineLog('caf-1');
    expect(getCaffeineLogs()).toEqual([]);
  });
});

describe('ustawienia aplikacji', () => {
  test('ogólne odczyty i zapisy', () => {
    expect(getAppSetting('brak', 'domyślna')).toBe('domyślna');
    setAppSetting('klucz', 'wartość');
    expect(getAppSetting('klucz')).toBe('wartość');
  });

  test('przełączniki działają w obu kierunkach (HealthKit, Pro, onboarding, haptyka)', () => {
    setHapticsEnabled(true);
    expect(getHapticsEnabled()).toBe(true);
    setIsProUser(false);
    expect(getIsProUser()).toBe(false);
    setHealthKitSyncEnabled(false);
    expect(getHealthKitSyncEnabled()).toBe(false);
    setHasCompletedOnboarding(false);
    expect(getHasCompletedOnboarding()).toBe(false);
  });

  test('jednostki, powiadomienia, haptyka i Pro', () => {
    expect(getUnitSystem()).toBe('metric');
    setUnitSystem('imperial');
    expect(getUnitSystem()).toBe('imperial');
    expect(getVoiceAnnounceEnabled()).toBe(true);
    setVoiceAnnounceEnabled(false);
    expect(getVoiceAnnounceEnabled()).toBe(false);
    expect(getHapticsEnabled()).toBe(true);
    setHapticsEnabled(false);
    expect(getHapticsEnabled()).toBe(false);
    expect(getIsProUser()).toBe(false);
    setIsProUser(true);
    expect(getIsProUser()).toBe(true);
  });

  test('metabolizm kofeiny i godzina snu są ograniczane do dozwolonych zakresów', () => {
    expect(getCaffeineHalfLife()).toBe(5);
    setCaffeineHalfLife(9);
    expect(getCaffeineHalfLife()).toBe(8);
    setCaffeineHalfLife(1);
    expect(getCaffeineHalfLife()).toBe(3);
    setAppSetting('caffeine_half_life_hours', 'abc');
    expect(getCaffeineHalfLife()).toBe(5);

    expect(getBedtimeHour()).toBe(23);
    setBedtimeHour(30);
    expect(getBedtimeHour()).toBe(28);
    setBedtimeHour(10);
    expect(getBedtimeHour()).toBe(18);
    setAppSetting('bedtime_hour', 'x');
    expect(getBedtimeHour()).toBe(23);
  });

  test('HealthKit, onboarding i preferencje naparów', () => {
    expect(getHealthKitSyncEnabled()).toBe(false);
    setHealthKitSyncEnabled(true);
    expect(getHealthKitSyncEnabled()).toBe(true);

    expect(getHasCompletedOnboarding()).toBe(false);
    setHasCompletedOnboarding(true);
    expect(getHasCompletedOnboarding()).toBe(true);

    expect(getBeveragePreference()).toBe('both');
    setBeveragePreference('tea');
    expect(getBeveragePreference()).toBe('tea');
    setAppSetting('beverage_preference', 'inne');
    expect(getBeveragePreference()).toBe('both');
  });
});

describe('eksport danych', () => {
  test('stan do kopii zawiera wszystkie dane bez kluczy niepenetrowalnych', () => {
    saveInventoryItem(item());
    setAppSetting('unit_system', 'imperial');
    setIsProUser(true);
    const state = getBackupState();
    expect(state.inventory.map((i) => i.id)).toEqual(['inv-1']);
    expect(state.settings).toEqual({ unit_system: 'imperial' });
  });

  test('kopia JSON w formacie v2 zawiera dane i pomija klucze niepenetrowalne', () => {
    saveInventoryItem(item());
    saveRecipe(recipe());
    saveBrewSession(session());
    logCaffeine(caffeine());
    setIsProUser(true);
    setUnitSystem('imperial');

    const parsed = JSON.parse(exportAllDataJson());
    expect(parsed).toMatchObject({ format: 'napar-backup', version: 2 });
    expect(parsed.state.inventory).toHaveLength(1);
    expect(parsed.state.customRecipes.map((r: SavedRecipe) => r.id)).toEqual(['rec-1']);
    expect(parsed.state.sessions).toHaveLength(1);
    expect(parsed.state.caffeineLogs).toHaveLength(1);
    expect(parsed.state.settings).toEqual({ unit_system: 'imperial' });
  });

  test('eksport CSV sesji i spiżarni zawiera nagłówki i wiersze', () => {
    saveInventoryItem(item());
    saveBrewSession(session({ notes: '=HYPERLINK("x")' }));
    expect(exportSessionsCsv().split('\n')[0]).toMatch(/^id,brewed_at,/);
    expect(exportSessionsCsv()).toContain(`"'=HYPERLINK(""x"")"`);
    expect(exportInventoryCsv().split('\n')[1]).toMatch(/^inv-1,Kenia AA,coffee,/);
  });

  test('eksport CSV nie obcina wyników do 100 wierszy', () => {
    for (let i = 0; i < 120; i++) {
      saveBrewSession(session({ id: `e-${i}`, brewedAt: `2026-10-22T06:00:${String(i % 60).padStart(2, '0')}.000Z` }));
    }
    expect(exportSessionsCsv().split('\n')).toHaveLength(121);
  });
});

describe('ustawienia przy niedostępnej bazie', () => {
  test('odczyty dają wartości domyślne, a zapisy są pomijane bez błędu', () => {
    configureDatabase(() => {
      throw new Error('brak pliku');
    });
    expect(getUnitSystem()).toBe('metric');
    expect(getAppSetting('brak', 'dom')).toBe('dom');
    expect(() => setUnitSystem('imperial')).not.toThrow();
    expect(() => setAppSetting('x', 'y')).not.toThrow();
    expect(() => getDatabase()).toThrow('brak pliku');
  });
});

// ============================================================================
// Napar (Steepwise) — Test okrągły kopii zapasowej na prawdziwym SQL (sql.js).
// UWAGA: to test na sql.js w Node, nie na expo-sqlite na urządzeniu (D8).
// Eksport -> import do świeżej bazy -> równość wszystkich tabel użytkownika.
// ============================================================================

import { configureDatabase, exportAllDataJson, getDatabase, importBackup, saveBrewSession, saveInventoryItem, saveRecipe, logCaffeine, setAppSetting, setUnitSystem, setIsProUser, setHapticsEnabled, setCaffeineHalfLife, getAppSetting, getInventoryItemById, deleteInventoryItem, getBrewSessionById, getCaffeineLogs, recordBrewSessionTransaction, toggleRecipeFavorite } from '../src/core/database';
import { parseAndValidateBackup } from '../src/core/backup';
import type { BrewSession, CaffeineLog, InventoryItem, SavedRecipe } from '../src/core/database-schema';
import { createMemoryDb, dumpTable, loadSqlJs, type MemoryDb, type SqlJsModule } from './helpers/sqljs-port';

const SESSION_COUNT = 5100; // powyżej dawnych limitów (100 / 200 / 5000)
const CAFFEINE_COUNT = 260; // powyżej dawnego LIMIT 200

let SQL: SqlJsModule;

beforeAll(async () => {
  SQL = await loadSqlJs();
});

function useDb(db: MemoryDb): void {
  configureDatabase(() => ({ port: db.port, fallback: null }));
}

function inventory(overrides: Partial<InventoryItem> = {}): InventoryItem {
  return {
    id: 'inv-1',
    name: 'Ethiopia Yirgacheffe',
    type: 'coffee',
    roasterOrProducer: 'Lokalna palarnia',
    origin: 'Etiopia',
    roastOrHarvestDate: '2026-10-01',
    roastProfile: 'light',
    process: 'washed',
    variety: 'Heirloom',
    initialWeightGrams: 250,
    remainingWeightGrams: 187.5,
    flavorNotes: ['cytrusy', 'jaśmin'],
    rating: 4.5,
    isFavorite: true,
    isArchived: false,
    createdAt: '2026-10-02T08:00:00.000Z',
    updatedAt: '2026-10-20T09:30:00.000Z',
    ...overrides,
  };
}

function recipe(overrides: Partial<SavedRecipe> = {}): SavedRecipe {
  return {
    id: 'custom-1',
    name: 'Mój V60',
    beverageType: 'COFFEE',
    method: 'V60',
    author: undefined,
    description: 'Własna receptura',
    doseGrams: 15,
    waterGrams: 250,
    waterTempCelsius: 94,
    grindSizeDescription: 'średnio-drobny',
    recommendedRatio: 16.7,
    stepsJson: JSON.stringify([{ title: 'Zalanie', seconds: 30 }]),
    isCustom: true,
    isFavorite: false,
    createdAt: '2026-10-03T10:00:00.000Z',
    ...overrides,
  };
}

function session(i: number, overrides: Partial<BrewSession> = {}): BrewSession {
  const day = String((i % 28) + 1).padStart(2, '0');
  return {
    id: `session-${i}`,
    recipeId: i % 2 === 0 ? 'custom-1' : undefined,
    recipeName: i % 2 === 0 ? 'Mój V60' : undefined,
    inventoryItemId: 'inv-1',
    inventoryItemName: 'Ethiopia Yirgacheffe',
    beverageType: 'COFFEE',
    method: 'V60',
    doseGrams: 15,
    waterGrams: 250,
    waterTempCelsius: 94,
    waterProfile: 'soft',
    grindSetting: '15 klików',
    totalTimeSeconds: 180 + (i % 60),
    rating: 4,
    flavorTags: ['słodycz', 'owoce; jagody'],
    tasteBalance: 'balanced',
    tdsPercentage: 1.38,
    extractionYieldPercentage: 20.5,
    caffeineContentMg: 95.25,
    notes: i % 3 === 0 ? 'Notatka, z "cudzysłowem"\nDruga linia' : undefined,
    infusionNumber: 1,
    sensory: { acidity: 3, sweetness: 4, body: 2, clarity: 5, finish: 3 },
    brewedAt: `2026-10-${day}T07:${String(i % 60).padStart(2, '0')}:00.000Z`,
    ...overrides,
  };
}

function caffeine(i: number): CaffeineLog {
  return {
    id: `caf-${i}`,
    brewSessionId: i % 2 === 0 ? 'session-1' : undefined,
    beverageName: `Napój ${i}`,
    beverageType: i % 2 === 0 ? 'coffee' : 'tea',
    consumedAt: `2026-09-${String((i % 28) + 1).padStart(2, '0')}T12:00:00.000Z`,
    doseGrams: 12,
    caffeineMg: 80.5 + i,
  };
}

/** Pełny zestaw danych użytkownika: wszystkie tabeli, duże liczności, wartości brzegowe. */
function populate(db: MemoryDb): void {
  useDb(db);
  saveInventoryItem(inventory());
  saveInventoryItem(
    inventory({
      id: 'inv-2',
      name: 'Zarchiwizowana paczka',
      type: 'tea',
      roasterOrProducer: undefined,
      origin: undefined,
      flavorNotes: [],
      rating: undefined,
      isFavorite: false,
      isArchived: true,
      remainingWeightGrams: 0,
    })
  );
  saveRecipe(recipe());
  saveRecipe(recipe({ id: 'custom-2', name: 'Espresso domowe', beverageType: 'COFFEE', method: 'Espresso', author: 'Ja', grindSizeDescription: undefined, description: undefined, createdAt: '2026-10-04T10:00:00.000Z' }));
  for (let i = 0; i < SESSION_COUNT; i++) {
    saveBrewSession(session(i));
  }
  for (let i = 0; i < CAFFEINE_COUNT; i++) {
    logCaffeine(caffeine(i));
  }
  setUnitSystem('imperial');
  setHapticsEnabled(false);
  setCaffeineHalfLife(6.5);
  setAppSetting('bedtime_hour', '24');
  setAppSetting('beverage_preference', 'tea');
  setIsProUser(true); // klucz niepenetrowalny: nie wraca z pliku
}

const TABLES = ['inventory_items', 'brew_sessions', 'caffeine_logs'] as const;

/** Receptury startowe (is_custom = 0) zapisuje aplikacja przy każdej instalacji (created_at = czas instalacji),
 *  więc nie są częścią kopii. Porównujemy je po identyfikatorach, a receptury własne co do pola. */
function customRecipes(rows: Record<string, unknown>[]): Record<string, unknown>[] {
  return rows.filter((row) => row.is_custom === 1);
}

describe('Test okrągły kopii zapasowej (sql.js)', () => {
  test('eksport -> import do świeżej bazy zachowuje wszystkie tabele użytkownika', () => {
    const source = createMemoryDb(SQL);
    populate(source);
    const exported = exportAllDataJson();

    const target = createMemoryDb(SQL);
    useDb(target);
    importBackup(parseAndValidateBackup(exported));

    for (const table of TABLES) {
      expect({ table, rows: dumpTable(target.port, table) }).toEqual({
        table,
        rows: dumpTable(source.port, table),
      });
    }
    expect(customRecipes(dumpTable(target.port, 'recipes'))).toEqual(customRecipes(dumpTable(source.port, 'recipes')));
    expect(dumpTable(target.port, 'recipes').map((r) => r.id)).toEqual(dumpTable(source.port, 'recipes').map((r) => r.id));
    // Ustawienia: wszystko poza kluczem niepenetrowalnym (is_pro_active) wraca z pliku.
    // migration_backups pomijamy: to wpis techniczny tworzony przy każdej inicjalizacji bazy.
    expect(dumpTable(target.port, 'app_settings')).toEqual(
      dumpTable(source.port, 'app_settings').filter((row) => row.key !== 'is_pro_active')
    );
  });

  test('eksport obejmuje wszystkie sesje i wpisy kofeiny (bez limitów)', () => {
    const source = createMemoryDb(SQL);
    populate(source);
    const envelope = parseAndValidateBackup(exportAllDataJson());

    expect(envelope.state.sessions).toHaveLength(SESSION_COUNT);
    expect(envelope.state.caffeineLogs).toHaveLength(CAFFEINE_COUNT);
    expect(envelope.state.inventory).toHaveLength(2);
    expect(envelope.state.customRecipes).toHaveLength(2);
  });

  test('ustawienia wracają z pliku, a klucze niepenetrowalne (stan Pro) nie', () => {
    const source = createMemoryDb(SQL);
    populate(source);
    const exported = exportAllDataJson();

    const target = createMemoryDb(SQL);
    useDb(target);
    importBackup(parseAndValidateBackup(exported));

    expect(getAppSetting('unit_system')).toBe('imperial');
    expect(getAppSetting('haptics_enabled')).toBe('false');
    expect(getAppSetting('caffeine_half_life_hours')).toBe('6.5');
    expect(getAppSetting('is_pro_active', 'brak')).toBe('brak');
  });

  test('import na istniejącej bazie nadpisuje tylko rekordy z pliku i nie rusza reszty', () => {
    const source = createMemoryDb(SQL);
    populate(source);
    const exported = exportAllDataJson();

    const target = createMemoryDb(SQL);
    useDb(target);
    // Dane spoza pliku: inne paczka, sesja, kofeina i ustawienie
    saveInventoryItem(inventory({ id: 'inv-lokalna', name: 'Lokalna paczka', initialWeightGrams: 100, remainingWeightGrams: 40 }));
    saveBrewSession(session(9999, { id: 'session-lokalna', notes: 'tylko tutaj' }));
    logCaffeine(caffeine(9999));
    setAppSetting('unit_system', 'metric');
    // Rekord z tym samym id co w pliku, ale innym stanem: ma zostać nadpisany
    saveInventoryItem(inventory({ remainingWeightGrams: 1 }));

    const before = {
      local: getInventoryItemById('inv-lokalna'),
      localSession: getBrewSessionById('session-lokalna'),
      localCaffeine: getCaffeineLogs().find((l) => l.id === 'caf-9999'),
    };

    importBackup(parseAndValidateBackup(exported));

    expect(getInventoryItemById('inv-lokalna')).toEqual(before.local);
    expect(getBrewSessionById('session-lokalna')).toEqual(before.localSession);
    expect(getCaffeineLogs().find((l) => l.id === 'caf-9999')).toEqual(before.localCaffeine);
    expect(getInventoryItemById('inv-1')?.remainingWeightGrams).toBe(187.5);
    expect(getAppSetting('unit_system')).toBe('imperial');
  });

  test('rekord usunięty lokalnie wraca z kopii; import jest atomowy przy błędnym wierszu', () => {
    const source = createMemoryDb(SQL);
    populate(source);
    const exported = exportAllDataJson();

    const target = createMemoryDb(SQL);
    useDb(target);
    importBackup(parseAndValidateBackup(exported));
    deleteInventoryItem('inv-1');
    expect(getInventoryItemById('inv-1')).toBeNull();

    importBackup(parseAndValidateBackup(exported));
    expect(getInventoryItemById('inv-1')).not.toBeNull();

    // Wiersz z brakującym wymaganym polem łamie NOT NULL: cała transakcja się cofa
    const broken = JSON.parse(exported);
    broken.state.inventory = [{ ...inventory({ id: 'inv-zla' }), initialWeightGrams: null }];
    broken.state.sessions = [];
    const before = dumpTable(target.port, 'inventory_items');

    expect(() => importBackup(parseAndValidateBackup(JSON.stringify(broken)))).toThrow(
      'Import nie powiódł się, dane nie zostały zmienione'
    );
    expect(dumpTable(target.port, 'inventory_items')).toEqual(before);
    expect(getInventoryItemById('inv-zla')).toBeNull();
  });

  test('transakcja TASK-R08-04 (sesja + zdjęcie z zapasu) działa na prawdziwym SQL', () => {
    const db = createMemoryDb(SQL);
    useDb(db);
    saveInventoryItem(inventory({ id: 'inv-tx', remainingWeightGrams: 50 }));
    recordBrewSessionTransaction(session(1, { id: 'tx-1', inventoryItemId: 'inv-tx' }), {
      itemId: 'inv-tx',
      doseGrams: 15,
    });
    expect(getBrewSessionById('tx-1')).not.toBeNull();
    expect(getInventoryItemById('inv-tx')?.remainingWeightGrams).toBe(35);
  });

  test('przełączenie ulubionej receptury zapisuje się w bazie', () => {
    const db = createMemoryDb(SQL);
    useDb(db);
    saveRecipe(recipe({ id: 'fav-1' }));
    expect(toggleRecipeFavorite('fav-1')).toBe(true);
    expect(dumpTable(getDatabase(), 'recipes').find((r) => r.id === 'fav-1')?.is_favorite).toBe(1);
  });
});

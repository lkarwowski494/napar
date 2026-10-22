// ============================================================================
// Napar (Steepwise) — Unit Tests: gałęzie repozytoriów (błędy, dane uszkodzone, wartości brzegowe)
// Używa prawdziwego SQL (sql.js) z portem, w którym wybrane wywołania można wymusić na błąd.
// ============================================================================

import { createMemoryDb, loadSqlJs, type MemoryDb, type SqlJsModule } from '../../../tests/helpers/sqljs-port';
import type { DbPort } from '../db-port';
import { SCHEMA_SQL, type BrewSession, type InventoryItem, type SavedRecipe } from '../database-schema';
import { MASTER_RECIPES } from '../recipes-data';
import { createPreMigrationBackup, initDatabaseSchema, readUserVersion, TARGET_SCHEMA_VERSION } from '../repositories/schema';
import { countMasterRecipes, duplicateRecipe, getRecipeById, getRecipes, listCustomRecipes, saveRecipe, seedMasterRecipes } from '../repositories/recipes';
import { getInventoryItemById, getInventoryItems, restoreInventoryItem, saveInventoryItem, deductInventoryWeight } from '../repositories/inventory';
import { getBrewSessionById, listBrewSessions, recordBrewSession, saveBrewSession } from '../repositories/brew-sessions';
import { getAppSetting, getBeveragePreference, getCaffeineHalfLife, getBedtimeHour, setAppSetting, upsertAppSetting, listPortableAppSettings, NON_PORTABLE_SETTING_KEYS } from '../repositories/app-settings';
import { listCaffeineLogs } from '../repositories/caffeine';
import { collectBackupState, importBackupState, type NaparBackupData } from '../backup';

let SQL: SqlJsModule;

beforeAll(async () => {
  SQL = await loadSqlJs();
});

/** Port z nadpisanymi metodami; pozostałe idą do prawdziwej bazy. */
function portWith(base: DbPort, overrides: Partial<DbPort>): DbPort {
  return { ...base, ...overrides };
}

function fresh(): MemoryDb {
  const db = createMemoryDb(SQL);
  initDatabaseSchema(db.port);
  return db;
}

const BASE_ITEM: InventoryItem = {
  id: 'i',
  name: 'n',
  type: 'coffee',
  initialWeightGrams: 10,
  remainingWeightGrams: 10,
  flavorNotes: [],
  isFavorite: false,
  isArchived: false,
  createdAt: '2026-10-01T00:00:00.000Z',
};

const BASE_SESSION: BrewSession = {
  id: 's',
  beverageType: 'COFFEE',
  method: 'V60',
  doseGrams: 15,
  waterGrams: 250,
  waterTempCelsius: 94,
  totalTimeSeconds: 180,
  flavorTags: [],
  brewedAt: '2026-10-22T07:00:00.000Z',
};

const BASE_RECIPE: SavedRecipe = {
  id: 'r',
  name: 'R',
  beverageType: 'COFFEE',
  method: 'V60',
  doseGrams: 15,
  waterGrams: 250,
  waterTempCelsius: 94,
  recommendedRatio: 16,
  stepsJson: '[]',
  isCustom: true,
  isFavorite: false,
  createdAt: '2026-10-01T00:00:00.000Z',
};

describe('schemat i migracje', () => {
  test('wersja użytkownika: wartość, brak wiersza, brak liczby i błąd zapytania', () => {
    const { port } = fresh();
    expect(readUserVersion(port)).toBe(3);
    expect(readUserVersion(portWith(port, { getFirstSync: () => null }))).toBe(0);
    expect(readUserVersion(portWith(port, { getFirstSync: <T>() => ({ user_version: 'x' } as T) }))).toBe(0);
    expect(
      readUserVersion(
        portWith(port, {
          getFirstSync: () => {
            throw new Error('brak PRAGMA');
          },
        })
      )
    ).toBe(0);
  });

  test('błędy PRAGMA są ignorowane, a schemat i tak powstaje', () => {
    const { port: base } = createMemoryDb(SQL);
    const port = portWith(base, {
      execSync: (source) => {
        if (source.startsWith('PRAGMA')) throw new Error('nieobsługiwane');
        base.execSync(source);
      },
    });
    expect(() => initDatabaseSchema(port)).not.toThrow();
    expect(countMasterRecipes(port)).toBe(MASTER_RECIPES.length);
  });

  test('pełna migracja z wersji 0 tworzy kopię przed migracją i zapisuje wersję 3', () => {
    const db = createMemoryDb(SQL);
    initDatabaseSchema(db.port);
    expect(db.port.getAllSync('SELECT id FROM migration_backups').length).toBe(1);
  });

  test('błąd podczas migracji wycofuje transakcję i zgłasza błąd', () => {
    const base = createMemoryDb(SQL).port;
    const failing = portWith(base, {
      execSync: (source) => {
        if (source === 'COMMIT;' || source === 'ROLLBACK;') throw new Error(`awaria ${source}`);
        base.execSync(source);
      },
    });
    expect(() => initDatabaseSchema(failing)).toThrow('awaria COMMIT;');
  });

  test('kopia przed migracją: domyślna data, brak licznika i błąd zapisu', () => {
    const { port } = fresh();
    expect(createPreMigrationBackup(port, 0)).toMatch(/^backup_pre_migration_v0_\d{4}-/);
    expect(createPreMigrationBackup(port, 2, new Date('2026-10-22T07:00:00.000Z'))).toBe(
      'backup_pre_migration_v2_2026-10-22T07-00-00-000Z'
    );
    const noCount = portWith(port, { getFirstSync: () => null });
    expect(createPreMigrationBackup(noCount, 1, new Date('2026-10-22T07:00:00.000Z'))).toMatch(/^backup_pre_migration_v1_/);
    const broken = portWith(port, {
      runSync: () => {
        throw new Error('zablokowana');
      },
    });
    expect(createPreMigrationBackup(broken, 1)).toBe('backup_failed_fallback');
  });

  test('liczba receptur startowych: brak wiersza daje zero', () => {
    const { port } = fresh();
    expect(countMasterRecipes(portWith(port, { getFirstSync: () => null }))).toBe(0);
  });
});

describe('receptury', () => {
  test('mapowanie wartości pustych i wypełnionych', () => {
    const { port } = fresh();
    saveRecipe(port, { ...BASE_RECIPE, id: 'a', author: undefined, description: undefined, grindSizeDescription: undefined });
    saveRecipe(port, { ...BASE_RECIPE, id: 'b', author: '', description: 'd', grindSizeDescription: 'g', createdAt: '' });
    expect(getRecipeById(port, 'a')).toMatchObject({ author: undefined, description: undefined, grindSizeDescription: undefined });
    expect(getRecipeById(port, 'b')).toMatchObject({ author: '', description: 'd', grindSizeDescription: 'g' });
    expect(getRecipeById(port, 'b')?.createdAt).toMatch(/^\d{4}-/);
  });

  test('receptura nie będąca własną zapisuje flagę isCustom = 0', () => {
    const { port } = fresh();
    saveRecipe(port, { ...BASE_RECIPE, id: 'nie-wlasna', isCustom: false });
    expect(getRecipeById(port, 'nie-wlasna')?.isCustom).toBe(false);
  });

  test('lista receptur własnych pomija startowe', () => {
    const { port } = fresh();
    expect(listCustomRecipes(port)).toEqual([]);
    saveRecipe(port, { ...BASE_RECIPE, id: 'wlasna' });
    expect(listCustomRecipes(port).map((r) => r.id)).toEqual(['wlasna']);
    expect(TARGET_SCHEMA_VERSION).toBe(3);
  });

  test('filtrowanie po rodzaju napoju', () => {
    const { port } = fresh();
    expect(getRecipes(port, 'TEA').every((r) => r.beverageType === 'TEA')).toBe(true);
    expect(getRecipes(port).length).toBeGreaterThan(0);
  });

  test('duplikat: wszystkie warianty pól wejściowych', () => {
    const { port } = fresh();
    const minimal = duplicateRecipe(port, { id: 'x', name: 'A', method: 'M', recommendedRatio: 15 }, undefined);
    expect(minimal).toMatchObject({
      name: 'A (Kopia)',
      beverageType: 'COFFEE',
      author: 'Własna',
      doseGrams: 15,
      waterGrams: 250,
      waterTempCelsius: 93,
      grindSizeDescription: undefined,
      stepsJson: '[]',
    });

    const full = duplicateRecipe(
      port,
      {
        id: 'y',
        name: 'B',
        beverageType: 'TEA',
        type: 'COFFEE',
        method: 'M',
        author: 'Autor',
        description: 'opis',
        doseGrams: 5,
        waterGrams: 100,
        waterTempCelsius: 80,
        grindSizeDescription: 'g1',
        grindSettingDescriptionPl: 'g2',
        recommendedRatio: 20,
        stepsJson: '[{"a":1}]',
        steps: [{ b: 2 }],
      },
      ' (X)'
    );
    expect(full).toMatchObject({
      name: 'B (X)',
      beverageType: 'TEA',
      author: 'Autor (Modyfikacja)',
      description: 'opis',
      doseGrams: 5,
      waterGrams: 100,
      waterTempCelsius: 80,
      grindSizeDescription: 'g1',
      stepsJson: '[{"a":1}]',
    });

    const legacy = duplicateRecipe(
      port,
      {
        id: 'z',
        name: 'C',
        type: 'TEA',
        method: 'M',
        coffeeOrTeaDoseGrams: 4,
        waterWeightGrams: 90,
        waterTemperatureCelsius: 85,
        grindSettingDescriptionPl: 'g3',
        recommendedRatio: 22,
        steps: [{ c: 3 }],
      },
      ''
    );
    expect(legacy).toMatchObject({ name: 'C', beverageType: 'TEA', doseGrams: 4, waterGrams: 90, waterTempCelsius: 85, grindSizeDescription: 'g3', stepsJson: '[{"c":3}]' });
  });

  test('seed: domyślny czas utworzenia i jawny', () => {
    const base = createMemoryDb(SQL).port;
    base.execSync(SCHEMA_SQL);
    seedMasterRecipes(base);
    expect(countMasterRecipes(base)).toBe(MASTER_RECIPES.length);
    const other = createMemoryDb(SQL).port;
    other.execSync(SCHEMA_SQL);
    seedMasterRecipes(other, '2020-01-01T00:00:00.000Z');
    expect(other.getFirstSync<{ created_at: string }>('SELECT created_at FROM recipes LIMIT 1')?.created_at).toBe('2020-01-01T00:00:00.000Z');
  });
});

describe('spiżarnia', () => {
  test('mapowanie uszkodzonego JSON notatek i wartości opcjonalne', () => {
    const { port } = fresh();
    port.runSync(
      `INSERT INTO inventory_items (id, name, type, initial_weight_g, remaining_weight_g, flavor_notes_json, created_at, updated_at, is_favorite, is_archived)
       VALUES ('bad', 'Zepsuta', 'other', 1, 1, '{nie-json', '2026-10-01', '2026-10-01', 0, 0)`
    );
    port.runSync(
      `INSERT INTO inventory_items (id, name, type, initial_weight_g, remaining_weight_g, flavor_notes_json, created_at, updated_at, is_favorite, is_archived, rating, origin)
       VALUES ('ok', 'Dobra', 'tea', 1, 1, '["a"]', '2026-10-01', '2026-10-01', 1, 1, 4.5, 'Chiny')`
    );
    port.runSync(
      `INSERT INTO inventory_items (id, name, type, initial_weight_g, remaining_weight_g, flavor_notes_json, created_at, updated_at, is_favorite, is_archived)
       VALUES ('empty', 'Pusta', 'coffee', 1, 1, NULL, '2026-10-01', '2026-10-01', 0, 0)`
    );
    expect(getInventoryItemById(port, 'bad')).toMatchObject({ type: 'coffee', flavorNotes: [], rating: undefined });
    expect(getInventoryItemById(port, 'ok')).toMatchObject({ type: 'tea', flavorNotes: ['a'], rating: 4.5, origin: 'Chiny', isFavorite: true, isArchived: true });
    expect(getInventoryItemById(port, 'empty')).toMatchObject({ flavorNotes: [], origin: undefined });
    expect(getInventoryItems(port, true)).toHaveLength(3);
  });

  test('zapis: pusty znacznik czasu, brak notatek i brak ocen', () => {
    const { port } = fresh();
    saveInventoryItem(port, { ...BASE_ITEM, id: 'p', createdAt: '', flavorNotes: undefined as unknown as string[] }); // dane spoza typu (stary zapis)
    expect(getInventoryItemById(port, 'p')).toMatchObject({ flavorNotes: [], rating: undefined, roasterOrProducer: undefined });
  });

  test('przywracanie zachowuje updatedAt z pliku lub ustawia bieżący czas', () => {
    const { port } = fresh();
    restoreInventoryItem(port, { ...BASE_ITEM, id: 'r1', updatedAt: '2001-02-03T04:05:06.000Z' });
    expect(getInventoryItemById(port, 'r1')?.updatedAt).toBe('2001-02-03T04:05:06.000Z');
    restoreInventoryItem(port, { ...BASE_ITEM, id: 'r2' });
    expect(getInventoryItemById(port, 'r2')?.updatedAt).toMatch(/^\d{4}-/);
  });

  test('odjęcie gramatury dla brakującej paczki nic nie robi', () => {
    const { port } = fresh();
    expect(() => deductInventoryWeight(port, 'brak', 3)).not.toThrow();
  });
});

describe('sesje parzenia', () => {
  test('mapowanie: uszkodzone JSON tagów i czuciowych, wartości null i zerowa liczba infuzji', () => {
    const { port } = fresh();
    port.runSync(
      `INSERT INTO brew_sessions (id, beverage_type, method, dose_g, water_g, water_temp_c, total_time_seconds, flavor_tags_json, sensory_scores_json, brewed_at, infusion_number)
       VALUES ('bad', 'COFFEE', 'V60', 1, 1, 1, 1, '{x', '{y', '2026-10-22', 0)`
    );
    port.runSync(
      `INSERT INTO brew_sessions (id, beverage_type, method, dose_g, water_g, water_temp_c, total_time_seconds, flavor_tags_json, sensory_scores_json, brewed_at, infusion_number, rating, tds_percentage, extraction_yield_percentage, caffeine_content_mg, recipe_id, notes)
       VALUES ('full', 'TEA', 'Gong Fu', 1, 1, 1, 1, '["a"]', '{"acidity":1,"sweetness":2,"body":3,"clarity":4,"finish":5}', '2026-10-22', NULL, 3, 1.2, 20, 90, 'rec', 'uwaga')`
    );
    const bad = getBrewSessionById(port, 'bad');
    expect(bad).toMatchObject({ flavorTags: [], sensory: undefined, infusionNumber: 0, rating: undefined, tdsPercentage: undefined });
    const full = getBrewSessionById(port, 'full');
    expect(full).toMatchObject({ flavorTags: ['a'], sensory: { acidity: 1 }, rating: 3, tdsPercentage: 1.2, recipeId: 'rec', notes: 'uwaga', infusionNumber: 1 });
    expect(listBrewSessions(port).map((s) => s.id).sort()).toEqual(['bad', 'full']);
    expect(listBrewSessions(port, 1)).toHaveLength(1);
  });

  test('zapis: brak tagów, brak czucia, pusty czas i brak numeru infuzji', () => {
    const { port } = fresh();
    saveBrewSession(port, { ...BASE_SESSION, id: 'z', flavorTags: undefined as unknown as string[], brewedAt: '' }); // dane spoza typu (stary zapis)
    const saved = getBrewSessionById(port, 'z');
    expect(saved).toMatchObject({ flavorTags: [], sensory: undefined, infusionNumber: 1 });
    expect(saved?.brewedAt).toMatch(/^\d{4}-/);
  });

  test('transakcja z odjęciem zapasu i bez niego', () => {
    const { port } = fresh();
    saveInventoryItem(port, { ...BASE_ITEM, id: 'tx', remainingWeightGrams: 20 });
    recordBrewSession(port, { ...BASE_SESSION, id: 'tx1' }, { itemId: 'tx', doseGrams: 5 });
    recordBrewSession(port, { ...BASE_SESSION, id: 'tx2' });
    expect(getInventoryItemById(port, 'tx')?.remainingWeightGrams).toBe(15);
  });
});

describe('kofeina i ustawienia', () => {
  test('wpisy kofeiny: wartości opcjonalne w obu kierunkach', () => {
    const { port } = fresh();
    port.runSync(
      `INSERT INTO caffeine_logs (id, brew_session_id, beverage_name, beverage_type, consumed_at, dose_g, caffeine_mg)
       VALUES ('c1', NULL, 'Herbata', 'tea', '2026-10-22T08:00:00.000Z', 2, 20)`
    );
    port.runSync(
      `INSERT INTO caffeine_logs (id, brew_session_id, beverage_name, beverage_type, consumed_at, dose_g, caffeine_mg)
       VALUES ('c2', 'ses', 'Kawa', 'coffee', '2026-10-21T08:00:00.000Z', 18, 120)`
    );
    expect(listCaffeineLogs(port).map((l) => [l.id, l.brewSessionId])).toEqual([
      ['c1', undefined],
      ['c2', 'ses'],
    ]);
    expect(listCaffeineLogs(port, '2026-10-22T00:00:00.000Z').map((l) => l.id)).toEqual(['c1']);
  });

  test('odczyt ustawienia: brak wiersza, błąd zapytania i wartości domyślne', () => {
    const { port } = fresh();
    expect(getAppSetting(port, 'brak', 'dom')).toBe('dom');
    expect(getAppSetting(portWith(port, { getFirstSync: () => null }), 'x', 'd')).toBe('d');
    expect(
      getAppSetting(
        portWith(port, {
          getFirstSync: () => {
            throw new Error('błąd');
          },
        }),
        'x',
        'fallback'
      )
    ).toBe('fallback');
  });

  test('zapis ustawienia ignoruje błąd, a upsert go zgłasza', () => {
    const { port } = fresh();
    const broken = portWith(port, {
      runSync: () => {
        throw new Error('tylko do odczytu');
      },
    });
    expect(() => setAppSetting(broken, 'k', 'v')).not.toThrow();
    expect(() => upsertAppSetting(broken, 'k', 'v')).toThrow('tylko do odczytu');
  });

  test('preferencje, połówkowy okres kofeiny i godzina snu: gałęzie wartości nieprawidłowych', () => {
    const { port } = fresh();
    setAppSetting(port, 'beverage_preference', 'coffee');
    expect(getBeveragePreference(port)).toBe('coffee');
    setAppSetting(port, 'caffeine_half_life_hours', '4.44');
    expect(getCaffeineHalfLife(port)).toBe(4.4);
    setAppSetting(port, 'bedtime_hour', '20');
    expect(getBedtimeHour(port)).toBe(20);
  });

  test('lista ustawień przenośnych pomija klucze niepenetrowalne', () => {
    const { port } = fresh();
    setAppSetting(port, 'unit_system', 'metric');
    for (const key of NON_PORTABLE_SETTING_KEYS) setAppSetting(port, key, 'x');
    expect(listPortableAppSettings(port)).toEqual([{ key: 'unit_system', value: 'metric' }]);
  });
});

describe('import i eksport stanu (backup)', () => {
  test('stan z bazy zawiera ustawienia bez kluczy niepenetrowalnych', () => {
    const { port } = fresh();
    setAppSetting(port, 'unit_system', 'imperial');
    setAppSetting(port, 'is_pro_active', 'true');
    const state = collectBackupState(port);
    expect(state.settings).toEqual({ unit_system: 'imperial' });
    expect(state.customRecipes).toEqual([]);
    expect(state.sessions).toEqual([]);
    expect(state.caffeineLogs).toEqual([]);
    expect(state.inventory).toEqual([]);
  });

  test('import przy pustym zestawie ustawień i wpisów nie zmienia bazy', () => {
    const { port } = fresh();
    const empty: NaparBackupData = { inventory: [], customRecipes: [], sessions: [], caffeineLogs: [], settings: {} };
    importBackupState(port, empty);
    expect(collectBackupState(port)).toEqual({ ...empty, customRecipes: [], settings: {} });
  });

  test('import pomija klucze niepenetrowalne z pliku', () => {
    const { port } = fresh();
    importBackupState(port, {
      inventory: [],
      customRecipes: [],
      sessions: [],
      caffeineLogs: [],
      settings: { is_pro_active: 'true', unit_system: 'imperial' },
    });
    expect(getAppSetting(port, 'is_pro_active', 'brak')).toBe('brak');
    expect(getAppSetting(port, 'unit_system')).toBe('imperial');
  });

  test('import wymusza isCustom dla receptur z pliku', () => {
    const { port } = fresh();
    importBackupState(port, {
      inventory: [],
      customRecipes: [{ ...BASE_RECIPE, id: 'nie-wlasna', isCustom: false }],
      sessions: [],
      caffeineLogs: [],
      settings: {},
    });
    expect(getRecipeById(port, 'nie-wlasna')?.isCustom).toBe(true);
  });

  test('błąd importu jest opakowany komunikatem i cofa zmiany', () => {
    const { port } = fresh();
    const failing = portWith(port, {
      runSync: () => {
        throw new Error('zapis odrzucony');
      },
    });
    expect(() =>
      importBackupState(failing, {
        inventory: [],
        customRecipes: [],
        sessions: [],
        caffeineLogs: [],
        settings: { a: 'b' },
      })
    ).toThrow('Import nie powiódł się, dane nie zostały zmienione (zapis odrzucony)');
  });
});

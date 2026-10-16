// ============================================================================
// Napar (Steepwise) — Unit Tests: Database & Repositories
// ============================================================================

import {
  initDatabase,
  getInventoryItems,
  getInventoryItemById,
  saveInventoryItem,
  deductInventoryWeight,
  deleteInventoryItem,
  getRecipes,
  getRecipeById,
  saveRecipe,
  toggleRecipeFavorite,
  updateRecipeFavorite,
  duplicateRecipe,
  getBrewSessions,
  getBrewSessionById,
  saveBrewSession,
  deleteBrewSession,
  getCaffeineLogs,
  logCaffeine,
  deleteCaffeineLog,
  exportAllDataJson,
  importDataJson,
  exportSessionsCsv,
  exportInventoryCsv,
  escapeCsvValue,
  getAppSetting,
  setAppSetting,
  getUnitSystem,
  setUnitSystem,
  getVoiceAnnounceEnabled,
  setVoiceAnnounceEnabled,
  getHapticsEnabled,
  setHapticsEnabled,
} from '../database';
import { InventoryItem, SavedRecipe, BrewSession, CaffeineLog } from '../database-schema';

// Mock expo-sqlite with in-memory SQLite emulation
const mockDb: any = {
  inventory: new Map<string, any>(),
  recipes: new Map<string, any>(),
  sessions: new Map<string, any>(),
  caffeine: new Map<string, any>(),
  settings: new Map<string, string>(),

  execSync: jest.fn(),
  getFirstSync: jest.fn((query: string, params?: any[]) => {
    if (query.includes('COUNT(*) as count FROM recipes')) {
      return { count: mockDb.recipes.size };
    }
    if (query.includes('FROM inventory_items WHERE id = ?')) {
      return mockDb.inventory.get(params?.[0]) || null;
    }
    if (query.includes('FROM recipes WHERE id = ?')) {
      return mockDb.recipes.get(params?.[0]) || null;
    }
    if (query.includes('FROM app_settings WHERE key = ?')) {
      const val = mockDb.settings.get(params?.[0]);
      return val ? { value: val } : null;
    }
    if (query.includes('FROM brew_sessions WHERE id = ?')) {
      return mockDb.sessions.get(params?.[0]) || null;
    }
    return null;
  }),
  getAllSync: jest.fn((query: string, params?: any[]) => {
    if (query.includes('FROM inventory_items')) {
      return Array.from(mockDb.inventory.values());
    }
    if (query.includes('FROM recipes')) {
      return Array.from(mockDb.recipes.values());
    }
    if (query.includes('FROM brew_sessions')) {
      return Array.from(mockDb.sessions.values());
    }
    if (query.includes('FROM caffeine_logs')) {
      let rows = Array.from(mockDb.caffeine.values());
      if (query.includes('WHERE consumed_at >= ?') && params && params[0]) {
        rows = rows.filter((r: any) => r.consumed_at >= params[0]);
      }
      return rows;
    }
    return [];
  }),
  runSync: jest.fn((query: string, params?: any[]) => {
    if (query.includes('INSERT OR REPLACE INTO inventory_items')) {
      const [id, name, type, roaster, origin, roastDate, profile, process, variety, initW, remW, notes, rating, isFav, isArch, created, updated] = params!;
      mockDb.inventory.set(id, {
        id, name, type, roaster_or_producer: roaster, origin, roast_or_harvest_date: roastDate,
        roast_profile: profile, process, variety, initial_weight_g: initW, remaining_weight_g: remW,
        flavor_notes_json: notes, rating, is_favorite: isFav, is_archived: isArch, created_at: created, updated_at: updated
      });
    } else if (query.includes('UPDATE inventory_items SET remaining_weight_g = ?')) {
      const [newW, updated, id] = params!;
      const existing = mockDb.inventory.get(id);
      if (existing) {
        existing.remaining_weight_g = newW;
        existing.updated_at = updated;
      }
    } else if (query.includes('DELETE FROM inventory_items WHERE id = ?')) {
      mockDb.inventory.delete(params![0]);
    } else if (query.includes('INSERT OR REPLACE INTO recipes')) {
      const [id, name, type, method, author, desc, dose, water, temp, grind, ratio, steps, custom, fav, created] = params!;
      mockDb.recipes.set(id, {
        id, name, beverage_type: type, method, author, description: desc,
        dose_g: dose, water_g: water, water_temp_c: temp, grind_size_description: grind,
        recommended_ratio: ratio, steps_json: steps, is_custom: custom, is_favorite: fav, created_at: created
      });
    } else if (query.includes('UPDATE recipes SET is_favorite = ?')) {
      const [fav, id] = params!;
      const existing = mockDb.recipes.get(id);
      if (existing) {
        existing.is_favorite = fav;
      }
    } else if (query.includes('DELETE FROM recipes WHERE id = ?')) {
      mockDb.recipes.delete(params![0]);
    } else if (query.includes('INSERT OR REPLACE INTO brew_sessions')) {
      const [id, rId, rName, iId, iName, type, method, dose, water, temp, waterProfile, grind, time, rating, tags, balance, tds, ey, caff, notes, inf, sensory, brewed] = params!;
      mockDb.sessions.set(id, {
        id, recipe_id: rId, recipe_name: rName, inventory_item_id: iId, inventory_item_name: iName,
        beverage_type: type, method, dose_g: dose, water_g: water, water_temp_c: temp, water_profile: waterProfile, grind_setting: grind,
        total_time_seconds: time, rating, flavor_tags_json: tags, taste_balance: balance, tds_percentage: tds,
        extraction_yield_percentage: ey, caffeine_content_mg: caff, notes, infusion_number: inf,
        sensory_scores_json: sensory, brewed_at: brewed
      });
    } else if (query.includes('DELETE FROM brew_sessions WHERE id = ?')) {
      mockDb.sessions.delete(params![0]);
    } else if (query.includes('INSERT OR REPLACE INTO caffeine_logs')) {
      const [id, bId, name, type, consumed, dose, caff] = params!;
      mockDb.caffeine.set(id, {
        id, brew_session_id: bId, beverage_name: name, beverage_type: type,
        consumed_at: consumed, dose_g: dose, caffeine_mg: caff
      });
    } else if (query.includes('DELETE FROM caffeine_logs WHERE id = ?')) {
      mockDb.caffeine.delete(params![0]);
    } else if (query.includes('INSERT OR REPLACE INTO app_settings')) {
      const [key, value] = params!;
      mockDb.settings.set(key, value);
    }
  }),
  prepareSync: jest.fn(() => ({
    executeSync: jest.fn((params: any) => {
      mockDb.recipes.set(params.$id, {
        id: params.$id,
        name: params.$name,
        beverage_type: params.$beverageType,
        method: params.$method,
        author: params.$author,
        description: params.$description,
        dose_g: params.$doseG,
        water_g: params.$waterG,
        water_temp_c: params.$waterTempC,
        grind_size_description: params.$grindSize,
        recommended_ratio: params.$ratio,
        steps_json: params.$stepsJson,
        is_custom: 0,
        is_favorite: 0,
        created_at: params.$createdAt,
      });
    }),
    finalizeSync: jest.fn(),
  })),
};

jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn(() => mockDb),
}));

describe('Napar SQLite Database & Repositories', () => {
  beforeEach(() => {
    mockDb.inventory.clear();
    mockDb.recipes.clear();
    mockDb.sessions.clear();
    mockDb.caffeine.clear();
    mockDb.settings.clear();
  });

  test('Inicjalizacja bazy i seeding domyślnych przepisów', () => {
    initDatabase(mockDb as any);
    expect(mockDb.execSync).toHaveBeenCalled();
    // Powinno zainicjalizować przepisy wzorcowe
    expect(mockDb.recipes.size).toBeGreaterThanOrEqual(10);
  });

  test('Operacje na spiżarni (Inventory): dodanie, odjęcie gramatury, pobranie, usunięcie', () => {
    const item: InventoryItem = {
      id: 'bean-1',
      name: 'Etiopia Yirgacheffe Washed',
      type: 'coffee',
      roasterOrProducer: 'Hard Beans',
      origin: 'Yirgacheffe, Etiopia',
      roastOrHarvestDate: '2026-10-01',
      roastProfile: 'light',
      initialWeightGrams: 250,
      remainingWeightGrams: 250,
      flavorNotes: ['jaśmin', 'brzoskwinia', 'bergamotka'],
      rating: 5,
      isFavorite: true,
      isArchived: false,
      createdAt: '2026-10-10T10:00:00Z',
      updatedAt: '2026-10-10T10:00:00Z',
    };

    saveInventoryItem(item);
    let items = getInventoryItems();
    expect(items.length).toBe(1);
    expect(items[0].name).toBe('Etiopia Yirgacheffe Washed');
    expect(items[0].flavorNotes).toContain('jaśmin');

    // Odjęcie gramatury po parzeniu (np. 18g)
    deductInventoryWeight('bean-1', 18);
    items = getInventoryItems();
    expect(items[0].remainingWeightGrams).toBe(232);

    deleteInventoryItem('bean-1');
    expect(getInventoryItems().length).toBe(0);
  });

  test('Zarządzanie ulubionymi recepturami (toggleRecipeFavorite)', () => {
    const recipe: SavedRecipe = {
      id: 'rec-fav-1',
      name: 'Aeropress Inverted',
      beverageType: 'COFFEE',
      method: 'Aeropress',
      doseGrams: 15,
      waterGrams: 200,
      waterTempCelsius: 85,
      recommendedRatio: 13.3,
      stepsJson: '[]',
      isCustom: true,
      isFavorite: false,
      createdAt: '2026-10-10T10:00:00Z',
    };
    saveRecipe(recipe);
    expect(getRecipes().length).toBe(1);
    const toggled = toggleRecipeFavorite('rec-fav-1');
    expect(toggled).toBe(true);
    expect(getRecipes()[0].isFavorite).toBe(true);
  });

  test('Duplikowanie receptury tworzy nową recepturę autorską ze statusem isCustom=true', () => {
    const original: SavedRecipe = {
      id: 'rec-orig-1',
      name: 'V60 Sweet Bloom',
      beverageType: 'COFFEE',
      method: 'V60',
      author: 'James H',
      doseGrams: 15,
      waterGrams: 250,
      waterTempCelsius: 93,
      recommendedRatio: 16.67,
      stepsJson: '[]',
      isCustom: false,
      isFavorite: false,
      createdAt: '2026-10-10T10:00:00Z',
    };
    saveRecipe(original);

    const cloned = duplicateRecipe(original);
    expect(cloned.id).not.toBe(original.id);
    expect(cloned.name).toBe('V60 Sweet Bloom (Kopia)');
    expect(cloned.isCustom).toBe(true);
    expect(cloned.isFavorite).toBe(false);
    expect(cloned.author).toBe('James H (Modyfikacja)');

    const recipes = getRecipes();
    expect(recipes.find((r) => r.id === cloned.id)).toBeTruthy();

    // Pokrycie gałęzi z MasterRecipe (pola alternatywne: type, coffeeOrTeaDoseGrams, steps, brak autora)
    const masterLike = {
      id: 'master-tea-1',
      name: 'Gyokuro Shizuku',
      type: 'TEA' as const,
      method: 'Kyusu',
      coffeeOrTeaDoseGrams: 6,
      waterWeightGrams: 60,
      waterTemperatureCelsius: 50,
      grindSettingDescriptionPl: 'Liście całe',
      recommendedRatio: 10,
      steps: [{ stepNamePl: 'Infuzja 1', durationSeconds: 90, waterGrams: 60 }],
    };
    const clonedTea = duplicateRecipe(masterLike, ' [Klon]');
    expect(clonedTea.name).toBe('Gyokuro Shizuku [Klon]');
    expect(clonedTea.beverageType).toBe('TEA');
    expect(clonedTea.doseGrams).toBe(6);
    expect(clonedTea.waterGrams).toBe(60);
    expect(clonedTea.waterTempCelsius).toBe(50);
    expect(clonedTea.author).toBe('Własna');
    expect(clonedTea.stepsJson).toContain('Infuzja 1');

    // Minimalny obiekt z wartościami domyślnymi
    const minimal = {
      id: 'minimal-1',
      name: 'Minimal',
      method: 'Drip',
      recommendedRatio: 15,
    };
    const clonedMin = duplicateRecipe(minimal);
    expect(clonedMin.beverageType).toBe('COFFEE');
    expect(clonedMin.doseGrams).toBe(15);
    expect(clonedMin.waterGrams).toBe(250);
    expect(clonedMin.waterTempCelsius).toBe(93);
  });

  test('toggleRecipeFavorite zwraca false gdy receptura nie istnieje', () => {
    expect(toggleRecipeFavorite('non-existent-rec-id')).toBe(false);
  });

  test('getCaffeineLogs filtruje według sinceIso', () => {
    const log1: CaffeineLog = {
      id: 'caff-iso-1',
      beverageName: 'Kawa 1',
      beverageType: 'coffee',
      consumedAt: '2026-10-01T10:00:00Z',
      doseGrams: 15,
      caffeineMg: 100,
    };
    const log2: CaffeineLog = {
      id: 'caff-iso-2',
      beverageName: 'Kawa 2',
      beverageType: 'coffee',
      consumedAt: '2026-10-15T10:00:00Z',
      doseGrams: 18,
      caffeineMg: 130,
    };
    logCaffeine(log1);
    logCaffeine(log2);

    const filtered = getCaffeineLogs('2026-10-10T00:00:00Z');
    expect(filtered.length).toBe(1);
    expect(filtered[0].id).toBe('caff-iso-2');
  });

  test('Zapis sesji parzenia i rejestru kofeiny z profilem sensorycznym', () => {
    const session: BrewSession = {
      id: 'sess-100',
      beverageType: 'COFFEE',
      method: 'V60',
      recipeName: 'V60 Kasuya 4:6',
      doseGrams: 20,
      waterGrams: 300,
      waterTempCelsius: 92,
      totalTimeSeconds: 210,
      rating: 4.8,
      flavorTags: ['brzoskwinia', 'miód'],
      tasteBalance: 'balanced',
      tdsPercentage: 1.35,
      extractionYieldPercentage: 19.8,
      caffeineContentMg: 140,
      sensory: {
        acidity: 4,
        sweetness: 5,
        body: 3,
        clarity: 4,
        finish: 4,
      },
      brewedAt: new Date().toISOString(),
    };

    saveBrewSession(session);
    const sessions = getBrewSessions();
    expect(sessions.length).toBe(1);
    expect(sessions[0].method).toBe('V60');
    expect(sessions[0].caffeineContentMg).toBe(140);
    expect(sessions[0].sensory?.acidity).toBe(4);
    expect(sessions[0].sensory?.sweetness).toBe(5);

    const caffLog: CaffeineLog = {
      id: 'caff-1',
      brewSessionId: session.id,
      beverageName: 'V60 Kasuya',
      beverageType: 'coffee',
      consumedAt: new Date().toISOString(),
      doseGrams: 20,
      caffeineMg: 140,
    };

    logCaffeine(caffLog);
    const logs = getCaffeineLogs();
    expect(logs.length).toBe(1);
    expect(logs[0].caffeineMg).toBe(140);
  });

  test('Eksport i import kopii zapasowej w formacie JSON (inventory, recipes, sessions, caffeine)', () => {
    const item: InventoryItem = {
      id: 'tea-1',
      name: 'Da Hong Pao Oolong',
      type: 'tea',
      initialWeightGrams: 50,
      remainingWeightGrams: 42,
      flavorNotes: ['dym', 'prażony orzech'],
      isFavorite: false,
      isArchived: false,
      createdAt: '2026-10-12T10:00:00Z',
      updatedAt: '2026-10-12T10:00:00Z',
    };
    saveInventoryItem(item);

    const recipe: SavedRecipe = {
      id: 'rec-custom-backup',
      name: 'Backup Recipe',
      beverageType: 'COFFEE',
      method: 'Kalita',
      doseGrams: 16,
      waterGrams: 260,
      waterTempCelsius: 92,
      recommendedRatio: 16.25,
      stepsJson: '[]',
      isCustom: true,
      isFavorite: false,
      createdAt: new Date().toISOString(),
    };
    saveRecipe(recipe);

    const session: BrewSession = {
      id: 'sess-backup-1',
      beverageType: 'COFFEE',
      method: 'Kalita',
      recipeName: 'Backup Recipe',
      doseGrams: 16,
      waterGrams: 260,
      waterTempCelsius: 92,
      totalTimeSeconds: 180,
      flavorTags: [],
      brewedAt: new Date().toISOString(),
    };
    saveBrewSession(session);

    const caffLog: CaffeineLog = {
      id: 'caff-backup-1',
      beverageName: 'Backup Recipe',
      beverageType: 'coffee',
      consumedAt: new Date().toISOString(),
      doseGrams: 16,
      caffeineMg: 110,
    };
    logCaffeine(caffLog);

    const exportedJson = exportAllDataJson();
    expect(exportedJson).toContain('Da Hong Pao Oolong');
    expect(exportedJson).toContain('Backup Recipe');
    expect(exportedJson).toContain('"version": 1');

    // Wyczyść i zaimportuj
    mockDb.inventory.clear();
    mockDb.recipes.clear();
    mockDb.sessions.clear();
    mockDb.caffeine.clear();
    expect(getInventoryItems().length).toBe(0);
    expect(getRecipes().length).toBe(0);
    expect(getBrewSessions().length).toBe(0);
    expect(getCaffeineLogs().length).toBe(0);

    importDataJson(exportedJson);
    expect(getInventoryItems().length).toBe(1);
    expect(getInventoryItems()[0].name).toBe('Da Hong Pao Oolong');
    expect(getRecipes().length).toBe(1);
    expect(getRecipes()[0].name).toBe('Backup Recipe');
    expect(getBrewSessions().length).toBe(1);
    expect(getCaffeineLogs().length).toBe(1);
  });

  test('escapeCsvValue prawidłowo zabezpiecza znaki specjalne (przecinki, cudzysłowy, entery)', () => {
    expect(escapeCsvValue(null)).toBe('');
    expect(escapeCsvValue(undefined)).toBe('');
    expect(escapeCsvValue('normal_text')).toBe('normal_text');
    expect(escapeCsvValue('text,with,comma')).toBe('"text,with,comma"');
    expect(escapeCsvValue('text"with"quotes')).toBe('"text""with""quotes"');
    expect(escapeCsvValue("text\nwith\nnewline")).toBe("\"text\nwith\nnewline\"");
  });

  test('exportSessionsCsv generuje poprawny plik CSV z nagłówkami i wierszami sesji', () => {
    const session: BrewSession = {
      id: 'sess-csv-1',
      recipeName: 'V60 Sweet Bloom',
      inventoryItemName: 'Etiopia Guji, Natural',
      beverageType: 'COFFEE',
      method: 'V60',
      doseGrams: 15,
      waterGrams: 250,
      waterTempCelsius: 93,
      totalTimeSeconds: 165,
      rating: 4.8,
      tasteBalance: 'balanced',
      tdsPercentage: 1.38,
      extractionYieldPercentage: 23.0,
      caffeineContentMg: 135,
      flavorTags: ['brzoskwinia', 'jaśmin'],
      notes: 'Bardzo czysty napar, słodki finisz',
      brewedAt: '2026-10-15T10:00:00Z',
    };
    saveBrewSession(session);

    // Minimalna sesja bez opcjonalnych pól
    const sessionMinimal: BrewSession = {
      id: 'sess-csv-min',
      beverageType: 'TEA',
      method: 'Gongfu',
      doseGrams: 5,
      waterGrams: 100,
      waterTempCelsius: 95,
      totalTimeSeconds: 20,
      flavorTags: [],
      brewedAt: '2026-10-15T11:00:00Z',
    };
    saveBrewSession(sessionMinimal);

    const csv = exportSessionsCsv();
    expect(csv).toContain('id,brewed_at,beverage_type,method');
    expect(csv).toContain('sess-csv-1');
    expect(csv).toContain('sess-csv-min');
    expect(csv).toContain('V60 Sweet Bloom');
    expect(csv).toContain('"Etiopia Guji, Natural"');
    expect(csv).toContain('15,250,93,165,4.8,balanced,1.38,23,135');
    expect(csv).toContain('brzoskwinia; jaśmin');
  });

  test('exportInventoryCsv generuje poprawny plik CSV z pozycjami spiżarni', () => {
    const item: InventoryItem = {
      id: 'inv-csv-1',
      name: 'Kenya Nyeri Peaberry',
      type: 'coffee',
      roasterOrProducer: 'Specialty Roastery, Warsaw',
      origin: 'Kenia',
      roastOrHarvestDate: '2026-10-01',
      roastProfile: 'light',
      initialWeightGrams: 250,
      remainingWeightGrams: 210,
      flavorNotes: ['czarna porzeczka', 'rabarbar'],
      isFavorite: true,
      isArchived: false,
      createdAt: '2026-10-01T10:00:00Z',
      updatedAt: '2026-10-01T10:00:00Z',
    };
    saveInventoryItem(item);

    // Pozycja bez opcjonalnych właściwości
    const itemMinimal: InventoryItem = {
      id: 'inv-csv-min',
      name: 'Simple Tea',
      type: 'tea',
      initialWeightGrams: 100,
      remainingWeightGrams: 100,
      flavorNotes: [],
      isFavorite: false,
      isArchived: false,
      createdAt: '2026-10-01T10:00:00Z',
      updatedAt: '2026-10-01T10:00:00Z',
    };
    saveInventoryItem(itemMinimal);

    const csv = exportInventoryCsv();
    expect(csv).toContain('id,name,type,roaster_or_producer');
    expect(csv).toContain('inv-csv-1');
    expect(csv).toContain('inv-csv-min');
    expect(csv).toContain('Kenya Nyeri Peaberry');
    expect(csv).toContain('"Specialty Roastery, Warsaw"');
    expect(csv).toContain('250,210');
    expect(csv).toContain('czarna porzeczka; rabarbar');
    expect(csv).toContain(',1,0'); // isFavorite: 1, isArchived: 0
    expect(csv).toContain(',0,0'); // isFavorite: 0, isArchived: 0
  });

  test('getInventoryItemById pobiera paczkę lub zwraca null gdy brak', () => {
    const itemToSave: InventoryItem = {
      id: 'inv-get-test',
      name: 'Kenya Nyeri Peaberry',
      type: 'coffee',
      initialWeightGrams: 250,
      remainingWeightGrams: 210,
      flavorNotes: ['porzeczka'],
      isFavorite: false,
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveInventoryItem(itemToSave);

    const item = getInventoryItemById('inv-get-test');
    expect(item).not.toBeNull();
    expect(item?.name).toBe('Kenya Nyeri Peaberry');

    const notFound = getInventoryItemById('non-existent-id-999');
    expect(notFound).toBeNull();
  });

  test('getBrewSessionById pobiera sesję lub zwraca null gdy brak', () => {
    const sessionToSave: BrewSession = {
      id: 'sess-get-test',
      recipeName: 'V60 Sweet Bloom',
      beverageType: 'COFFEE',
      method: 'V60',
      doseGrams: 15,
      waterGrams: 250,
      waterTempCelsius: 93,
      totalTimeSeconds: 165,
      flavorTags: [],
      brewedAt: new Date().toISOString(),
    };
    saveBrewSession(sessionToSave);

    const session = getBrewSessionById('sess-get-test');
    expect(session).not.toBeNull();
    expect(session?.recipeName).toBe('V60 Sweet Bloom');

    const notFound = getBrewSessionById('non-existent-sess-999');
    expect(notFound).toBeNull();
  });

  test('updateRecipeFavorite jawnie aktualizuje flagę isFavorite', () => {
    const recipe: SavedRecipe = {
      id: 'rec-fav-test',
      name: 'Test Fav Recipe',
      beverageType: 'COFFEE',
      method: 'V60',
      doseGrams: 15,
      waterGrams: 250,
      waterTempCelsius: 93,
      recommendedRatio: 16.6,
      stepsJson: '[]',
      isCustom: true,
      isFavorite: false,
      createdAt: new Date().toISOString(),
    };
    saveRecipe(recipe);

    updateRecipeFavorite('rec-fav-test', true);
    expect(getRecipeById('rec-fav-test')?.isFavorite).toBe(true);

    updateRecipeFavorite('rec-fav-test', false);
    expect(getRecipeById('rec-fav-test')?.isFavorite).toBe(false);
  });

  test('deleteBrewSession usuwa sesję z bazy', () => {
    const sessionToSave: BrewSession = {
      id: 'sess-del-test',
      recipeName: 'V60 Delete Test',
      beverageType: 'COFFEE',
      method: 'V60',
      doseGrams: 15,
      waterGrams: 250,
      waterTempCelsius: 93,
      totalTimeSeconds: 165,
      flavorTags: [],
      brewedAt: new Date().toISOString(),
    };
    saveBrewSession(sessionToSave);
    expect(mockDb.sessions.has('sess-del-test')).toBe(true);

    deleteBrewSession('sess-del-test');
    expect(mockDb.sessions.has('sess-del-test')).toBe(false);
  });

  test('deleteCaffeineLog usuwa wpis kofeiny z bazy', () => {
    const log: CaffeineLog = {
      id: 'caff-del-test',
      beverageName: 'Espresso',
      beverageType: 'coffee',
      consumedAt: new Date().toISOString(),
      doseGrams: 18,
      caffeineMg: 130,
    };
    logCaffeine(log);
    expect(mockDb.caffeine.has('caff-del-test')).toBe(true);

    deleteCaffeineLog('caff-del-test');
    expect(mockDb.caffeine.has('caff-del-test')).toBe(false);
  });

  test('importDataJson walidacja błędów: niepoprawny JSON oraz version !== 1', () => {
    expect(() => importDataJson('invalid json string :::')).toThrow();
    expect(() => importDataJson(JSON.stringify({ version: 2 }))).toThrow(
      'Nieprawidłowy format pliku kopii zapasowej'
    );
  });

  test('mapowanie uszkodzonego JSON w flavor_notes_json oraz sensory_scores_json zwraca wartości domyślne', () => {
    mockDb.inventory.set('corrupted-bean', {
      id: 'corrupted-bean',
      name: 'Corrupted Bean',
      type: 'coffee',
      initial_weight_g: 250,
      remaining_weight_g: 200,
      flavor_notes_json: '{ bad json',
      is_favorite: 0,
      is_archived: 0,
      created_at: '2026-10-15',
      updated_at: '2026-10-15',
    });

    const item = getInventoryItemById('corrupted-bean');
    expect(item).not.toBeNull();
    expect(item?.flavorNotes).toEqual([]);

    mockDb.sessions.set('corrupted-sess', {
      id: 'corrupted-sess',
      recipe_name: 'Corrupted Session',
      beverage_type: 'COFFEE',
      method: 'V60',
      dose_g: 15,
      water_g: 250,
      water_temp_c: 93,
      total_time_seconds: 180,
      flavor_tags_json: '{ bad tags',
      sensory_scores_json: '{ bad sensory',
      brewed_at: '2026-10-15T12:00:00Z',
    });

    const session = getBrewSessionById('corrupted-sess');
    expect(session).not.toBeNull();
    expect(session?.flavorTags).toEqual([]);
    expect(session?.sensory).toBeUndefined();
  });

  test('Pobiera i zapisuje ustawienia aplikacji (getAppSetting, setAppSetting)', () => {
    // Domyślna wartość gdy brak klucza
    expect(getAppSetting('default_grinder', 'comandante_c40')).toBe('comandante_c40');

    // Zapisz nowe ustawienie
    setAppSetting('default_grinder', 'fellow_ode_gen2');
    expect(getAppSetting('default_grinder', 'comandante_c40')).toBe('fellow_ode_gen2');
  });

  test('Pobiera i zapisuje jednostki miar (getUnitSystem, setUnitSystem)', () => {
    expect(getUnitSystem()).toBe('metric');
    setUnitSystem('imperial');
    expect(getUnitSystem()).toBe('imperial');
    setUnitSystem('metric');
    expect(getUnitSystem()).toBe('metric');
  });

  test('Pobiera i zapisuje ustawienia dostępności i haptyki (getVoiceAnnounceEnabled, getHapticsEnabled)', () => {
    // Domyślnie włączone
    expect(getVoiceAnnounceEnabled()).toBe(true);
    expect(getHapticsEnabled()).toBe(true);

    // Wyłączenie
    setVoiceAnnounceEnabled(false);
    expect(getVoiceAnnounceEnabled()).toBe(false);

    setHapticsEnabled(false);
    expect(getHapticsEnabled()).toBe(false);

    // Ponowne włączenie
    setVoiceAnnounceEnabled(true);
    expect(getVoiceAnnounceEnabled()).toBe(true);

    setHapticsEnabled(true);
    expect(getHapticsEnabled()).toBe(true);
  });
});

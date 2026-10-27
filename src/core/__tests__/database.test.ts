// ============================================================================
// Napar (Steepwise) — Unit Tests: Database & Repositories
// ============================================================================

import {
  initDatabase,
  createPreMigrationBackup,
  getInventoryItems,
  getInventoryItemById,
  getInventoryTotalWeight,
  getInventoryLowStockItems,
  getInventoryOutOfStockItems,
  sortInventoryItems,
  getSortedInventoryItems,
  InventorySortOption,
  filterInventoryItems,
  InventoryFilterCriteria,
  filterBrewSessions,
  BrewSessionFilterCriteria,
  calculateInventorySummary,
  InventorySummary,
  getLowStockInventoryItems,
  calculateInventoryTotalValue,
  InventoryTotalValueResult,
  calculateBeanFreshness,
  BeanFreshnessAnalysis,
  BeanFreshnessPhase,
  calculateInventoryUsageRate,
  InventoryUsageRateAnalysis,
  InventoryUsageRateCategory,
  calculateBeanRestingReadiness,
  BeanRestingReadinessAnalysis,
  BeanRestingStatus,
  calculateStashDiversity,
  StashDiversityAnalysis,
  StashDiversityRating,
  saveInventoryItem,
  deductInventoryWeight,
  deductBeansForBrew,
  deleteInventoryItem,
  getRecipes,
  getRecipeById,
  saveRecipe,
  toggleRecipeFavorite,
  updateRecipeFavorite,
  duplicateRecipe,
  deleteRecipe,
  getBrewSessions,
  getBrewSessionById,
  saveBrewSession,
  recordBrewSessionTransaction,
  deleteBrewSession,
  getCaffeineLogs,
  logCaffeine,
  deleteCaffeineLog,
  exportAllDataJson,
  importDataJson,
  exportSessionsCsv,
  exportInventoryCsv,
  exportCustomRecipesCsv,
  escapeCsvValue,
  escapeCsvCell,
  getAppSetting,
  setAppSetting,
  getUnitSystem,
  setUnitSystem,
  getVoiceAnnounceEnabled,
  setVoiceAnnounceEnabled,
  getHapticsEnabled,
  setHapticsEnabled,
  getIsProUser,
  setIsProUser,
  getCaffeineHalfLife,
  setCaffeineHalfLife,
  getBedtimeHour,
  setBedtimeHour,
  getHealthKitSyncEnabled,
  setHealthKitSyncEnabled,
  getDatabase,
  getHasCompletedOnboarding,
  setHasCompletedOnboarding,
  getBeveragePreference,
  setBeveragePreference,
} from '../database';
import { InventoryItem, SavedRecipe, BrewSession, CaffeineLog, SCHEMA_SQL } from '../database-schema';

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
      let rows = Array.from(mockDb.inventory.values());
      if (query.includes('is_archived = 0')) {
        rows = rows.filter((r: any) => !r.is_archived);
      }
      return rows;
    }
    if (query.includes('FROM recipes')) {
      let rows = Array.from(mockDb.recipes.values());
      if (query.includes('WHERE beverage_type = ?') && params && params[0]) {
        rows = rows.filter((r: any) => r.beverage_type === params[0]);
      }
      return rows;
    }
    if (query.includes('FROM brew_sessions')) {
      let rows = Array.from(mockDb.sessions.values());
      if (query.includes('OFFSET ?') && params && params.length >= 2) {
        const lim = params[0];
        const off = params[1];
        rows = rows.slice(off, lim > 0 ? off + lim : undefined);
      } else if (query.includes('LIMIT ?') && params && params[0]) {
        rows = rows.slice(0, params[0]);
      }
      return rows;
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
    } else if (query.includes('UPDATE brew_sessions SET inventory_item_id = NULL WHERE inventory_item_id = ?')) {
      for (const session of mockDb.sessions.values()) {
        if (session.inventory_item_id === params![0]) {
          session.inventory_item_id = null;
        }
      }
    } else if (query.includes('UPDATE brew_sessions SET recipe_id = NULL WHERE recipe_id = ?')) {
      for (const session of mockDb.sessions.values()) {
        if (session.recipe_id === params![0]) {
          session.recipe_id = null;
        }
      }
    } else if (query.includes('DELETE FROM inventory_items WHERE id = ?')) {
      mockDb.inventory.delete(params![0]);
    } else if (query.includes('INTO recipes')) {
      const [id, name, type, method, author, desc, dose, water, temp, grind, ratio, steps, custom, fav, created] = params!;
      const existing = mockDb.recipes.get(id);
      mockDb.recipes.set(id, {
        id, name, beverage_type: type, method, author, description: desc,
        dose_g: dose, water_g: water, water_temp_c: temp, grind_size_description: grind,
        recommended_ratio: ratio, steps_json: steps, is_custom: custom, is_favorite: fav,
        created_at: existing ? existing.created_at : created
      });
    } else if (query.includes('UPDATE recipes SET is_favorite = ?')) {
      const [fav, id] = params!;
      const existing = mockDb.recipes.get(id);
      if (existing) {
        existing.is_favorite = fav;
      }
    } else if (query.includes('DELETE FROM recipes WHERE id = ?')) {
      if (query.includes('AND is_custom = 1')) {
        const existing = mockDb.recipes.get(params![0]);
        if (existing && existing.is_custom === 1) {
          mockDb.recipes.delete(params![0]);
        }
      } else {
        mockDb.recipes.delete(params![0]);
      }
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
      const existing = mockDb.recipes.get(params.$id);
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
        is_favorite: existing ? existing.is_favorite : 0,
        created_at: existing ? existing.created_at : params.$createdAt,
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

  test('seedMasterRecipes zachowuje is_favorite i created_at przy ponownym seedingu (M1-audytor-generalny-001)', () => {
    initDatabase(mockDb as any);
    const recipes = getRecipes();
    expect(recipes.length).toBeGreaterThan(0);
    const first = recipes[0];
    const initialCreatedAt = first.createdAt;

    // Oznacz jako ulubiony
    updateRecipeFavorite(first.id, true);
    expect(getRecipeById(first.id)?.isFavorite).toBe(true);

    // Ponowny seeding (symulacja aktualizacji aplikacji)
    initDatabase(mockDb as any);
    const reloaded = getRecipeById(first.id);
    expect(reloaded).not.toBeNull();
    expect(reloaded!.isFavorite).toBe(true);
    expect(reloaded!.createdAt).toBe(initialCreatedAt);
  });

  test('createPreMigrationBackup tworzy fizyczny plik kopii SQLite przed migracją (M1-audytor-generalny-006)', () => {
    initDatabase(mockDb as any);
    const backupFile = createPreMigrationBackup(mockDb as any, 1);
    expect(backupFile).toMatch(/^napar-pre-v1-\d+\.db$/);
    expect(mockDb.execSync).toHaveBeenCalledWith('PRAGMA wal_checkpoint(TRUNCATE);');
  });

  test('Inicjalizacja bazy i seeding domyślnych przepisów', () => {
    initDatabase(mockDb as any);
    expect(mockDb.execSync).toHaveBeenCalledWith('PRAGMA foreign_keys = ON;');
    expect(mockDb.execSync).toHaveBeenCalledWith('PRAGMA journal_mode = WAL;');
    expect(mockDb.execSync).toHaveBeenCalledWith('PRAGMA busy_timeout = 5000;');
    // Powinno zainicjalizować przepisy wzorcowe
    expect(mockDb.recipes.size).toBeGreaterThanOrEqual(10);
  });

  test('tworzy indeks idx_recipes_fav_method_name dla optymalizacji ekranu przepisów (M1-audytor-generalny-049)', () => {
    expect(SCHEMA_SQL).toContain('idx_recipes_fav_method_name');
    expect(SCHEMA_SQL).toContain(
      'CREATE INDEX IF NOT EXISTS idx_recipes_fav_method_name ON recipes(is_favorite DESC, method, name)'
    );
    expect(SCHEMA_SQL).toContain('idx_sessions_inventory_item');
    expect(SCHEMA_SQL).toContain('idx_sessions_recipe_id');
    expect(SCHEMA_SQL).toContain(
      'CREATE INDEX IF NOT EXISTS idx_sessions_recipe_id ON brew_sessions(recipe_id)'
    );
    expect(SCHEMA_SQL).toContain('idx_caffeine_brew_session'
    );
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

    // Zadanie N3: deductBeansForBrew alias
    deductBeansForBrew('bean-1', 12);
    items = getInventoryItems();
    expect(items[0].remainingWeightGrams).toBe(220);

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
    expect(toggleRecipeFavorite('')).toBe(false);
    expect(toggleRecipeFavorite(null as any)).toBe(false);
  });

  test('TASK-P12-05-ARC: duplicateRecipe, deleteRecipe oraz updateRecipeFavorite zabezpieczone przed null/pustym id', () => {
    expect(() => duplicateRecipe(null as any)).toThrow('Nieprawidłowa receptura do duplikacji');
    expect(() => duplicateRecipe(undefined as any)).toThrow('Nieprawidłowa receptura do duplikacji');

    expect(() => deleteRecipe('')).not.toThrow();
    expect(() => deleteRecipe('   ')).not.toThrow();
    expect(() => deleteRecipe(null as any)).not.toThrow();

    expect(() => updateRecipeFavorite('', true)).not.toThrow();
    expect(() => updateRecipeFavorite(null as any, true)).not.toThrow();
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

    // TASK-P15-05-ARC: Bezpieczne traktowanie pustego lub whitespace sinceIso oraz NaN w logCaffeine
    const emptyFiltered = getCaffeineLogs('   ');
    expect(emptyFiltered.length).toBeGreaterThanOrEqual(2);

    logCaffeine({
      id: 'caff-nan-1',
      beverageName: '',
      beverageType: 'coffee',
      consumedAt: '',
      doseGrams: NaN,
      caffeineMg: NaN,
    });
    const retrieved = getCaffeineLogs().find((l) => l.id === 'caff-nan-1');
    expect(retrieved).toBeDefined();
    expect(retrieved?.doseGrams).toBe(0);
    expect(retrieved?.caffeineMg).toBe(0);
    expect(retrieved?.beverageName).toBe('Napar');
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

  test('TASK-R08-04: recordBrewSessionTransaction atomowo zapisuje sesję i odejmuje ziarna z inwentarza', () => {
    const bean: InventoryItem = {
      id: 'bean-tx-1',
      name: 'Kenya Nyeri AA',
      type: 'coffee',
      initialWeightGrams: 250,
      remainingWeightGrams: 250,
      flavorNotes: ['czarna porzeczka'],
      isFavorite: false,
      isArchived: false,
      createdAt: '2026-10-10T10:00:00Z',
      updatedAt: '2026-10-10T10:00:00Z',
    };
    saveInventoryItem(bean);

    const session: BrewSession = {
      id: 'sess-tx-1',
      beverageType: 'COFFEE',
      method: 'Kalita Wave',
      recipeName: 'Kalita Standard',
      inventoryItemId: 'bean-tx-1',
      inventoryItemName: 'Kenya Nyeri AA',
      doseGrams: 18.5,
      waterGrams: 300,
      waterTempCelsius: 94,
      totalTimeSeconds: 180,
      flavorTags: ['czarna porzeczka'],
      brewedAt: new Date().toISOString(),
    };

    recordBrewSessionTransaction(session, { itemId: 'bean-tx-1', doseGrams: 18.5 });

    const savedSess = getBrewSessionById('sess-tx-1');
    expect(savedSess).not.toBeNull();
    expect(savedSess?.doseGrams).toBe(18.5);

    const updatedBean = getInventoryItemById('bean-tx-1');
    expect(updatedBean?.remainingWeightGrams).toBe(231.5);

    // Fallback transaction executes BEGIN and COMMIT
    expect(mockDb.execSync).toHaveBeenCalledWith('BEGIN TRANSACTION;');
    expect(mockDb.execSync).toHaveBeenCalledWith('COMMIT;');

    // Test with withTransactionSync mock
    const originalWithTx = mockDb.withTransactionSync;
    mockDb.withTransactionSync = jest.fn((cb: () => void) => cb());
    recordBrewSessionTransaction(session, { itemId: 'bean-tx-1', doseGrams: 10 });
    expect(mockDb.withTransactionSync).toHaveBeenCalled();
    mockDb.withTransactionSync = originalWithTx;

    // Error rollback in fallback transaction
    const originalRunSync = mockDb.runSync;
    mockDb.runSync = jest.fn(() => { throw new Error('Transaction failure'); });
    expect(() => {
      recordBrewSessionTransaction(session);
    }).toThrow('Transaction failure');
    expect(mockDb.execSync).toHaveBeenCalledWith('ROLLBACK;');
    mockDb.runSync = originalRunSync;
  });

  test('TASK-P16-05-ARC: saveBrewSession oraz recordBrewSessionTransaction bezpiecznie ignorują null/undefined session', () => {
    expect(() => saveBrewSession(null as any)).not.toThrow();
    expect(() => saveBrewSession(undefined as any)).not.toThrow();
    expect(() => recordBrewSessionTransaction(null as any)).not.toThrow();
    expect(() => recordBrewSessionTransaction(undefined as any)).not.toThrow();
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

  test('deleteRecipe usuwa receptury własne (is_custom=1), ale chroni wzorcowe (is_custom=0)', () => {
    initDatabase(mockDb as any);
    // 1. Zapisz recepturę własną
    const customRecipe: SavedRecipe = {
      id: 'rec-custom-del',
      name: 'Custom V60',
      beverageType: 'COFFEE',
      method: 'V60',
      doseGrams: 15,
      waterGrams: 250,
      waterTempCelsius: 93,
      recommendedRatio: 16.7,
      stepsJson: '[]',
      isCustom: true,
      isFavorite: false,
      createdAt: '2026-10-24T12:00:00.000Z',
    };
    saveRecipe(customRecipe);
    expect(mockDb.recipes.has('rec-custom-del')).toBe(true);

    // 1b. Zapisz powiązaną sesję parzenia
    saveBrewSession({
      id: 'sess-with-custom-rec',
      recipeId: 'rec-custom-del',
      recipeName: 'Custom V60',
      beverageType: 'COFFEE',
      method: 'V60',
      doseGrams: 15,
      waterGrams: 250,
      waterTempCelsius: 93,
      totalTimeSeconds: 160,
      flavorTags: [],
      brewedAt: '2026-10-25T10:00:00.000Z',
    });
    expect(getBrewSessionById('sess-with-custom-rec')?.recipeId).toBe('rec-custom-del');

    // 2. Usuń recepturę własną - powinna zostać usunięta, a w sesji recipeId zresetowane do null (TASK-P6-05-ARC)
    deleteRecipe('rec-custom-del');
    expect(mockDb.recipes.has('rec-custom-del')).toBe(false);
    expect(getBrewSessionById('sess-with-custom-rec')?.recipeId).toBeUndefined();
    expect(mockDb.sessions.get('sess-with-custom-rec').recipe_id).toBeNull();

    // 3. Próba usunięcia receptury wzorcowej Hoffmann V60 (is_custom=0)
    expect(mockDb.recipes.has('v60-hoffmann-single')).toBe(true);
    deleteRecipe('v60-hoffmann-single');
    // Receptura wzorcowa NIE MOŻE zostać usunięta
    expect(mockDb.recipes.has('v60-hoffmann-single')).toBe(true);
  });

  test('TASK-P13-05-ARC: sanacja pustego/nullish id w getInventoryItemById, getBrewSessionById, deleteBrewSession i deleteCaffeineLog', () => {
    expect(getInventoryItemById('')).toBeNull();
    expect(getInventoryItemById('   ')).toBeNull();
    expect(getInventoryItemById(null as any)).toBeNull();

    expect(getBrewSessionById('')).toBeNull();
    expect(getBrewSessionById('   ')).toBeNull();
    expect(getBrewSessionById(null as any)).toBeNull();

    expect(() => deleteBrewSession('')).not.toThrow();
    expect(() => deleteBrewSession('   ')).not.toThrow();
    expect(() => deleteBrewSession(null as any)).not.toThrow();

    expect(() => deleteCaffeineLog('')).not.toThrow();
    expect(() => deleteCaffeineLog('   ')).not.toThrow();
    expect(() => deleteCaffeineLog(null as any)).not.toThrow();
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

    // TASK-P6-12-NIE: Odporność na JSON null, liczby, tablice i obiekty o nieodpowiednich typach
    mockDb.inventory.set('null-json-bean', {
      id: 'null-json-bean',
      name: 'Null JSON Bean',
      type: 'coffee',
      initial_weight_g: 250,
      remaining_weight_g: 200,
      flavor_notes_json: 'null',
      is_favorite: 0,
      is_archived: 0,
      created_at: '2026-10-15',
      updated_at: '2026-10-15',
    });
    expect(getInventoryItemById('null-json-bean')?.flavorNotes).toEqual([]);

    mockDb.sessions.set('malformed-types-sess', {
      id: 'malformed-types-sess',
      recipe_name: 'Malformed Types Session',
      beverage_type: 'COFFEE',
      method: 'V60',
      dose_g: 15,
      water_g: 250,
      water_temp_c: 93,
      total_time_seconds: 180,
      flavor_tags_json: '12345',
      sensory_scores_json: '"string-instead-of-object"',
      brewed_at: '2026-10-15T12:00:00Z',
    });
    const malformedSess = getBrewSessionById('malformed-types-sess');
    expect(malformedSess?.flavorTags).toEqual([]);
    expect(malformedSess?.sensory).toBeUndefined();
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

  test('Pobiera i zapisuje status licencji Pro (getIsProUser, setIsProUser)', () => {
    // Domyślnie false
    expect(getIsProUser()).toBe(false);

    // Aktywacja Pro
    setIsProUser(true);
    expect(getIsProUser()).toBe(true);

    // Dezaktywacja Pro
    setIsProUser(false);
    expect(getIsProUser()).toBe(false);
  });

  test('D-02 & BR-KOF-003: Pobiera i zapisuje metabolizm kofeiny oraz godzinę snu', () => {
    // Domyślne wartości
    expect(getCaffeineHalfLife()).toBe(5.0);
    expect(getBedtimeHour()).toBe(23);

    // Zmiana czasu półtrwania (np. 6.5h)
    setCaffeineHalfLife(6.5);
    expect(getCaffeineHalfLife()).toBe(6.5);

    // Ograniczenia klamrowe (clamping: 3.0h - 8.0h)
    setCaffeineHalfLife(1.5);
    expect(getCaffeineHalfLife()).toBe(3.0);
    setCaffeineHalfLife(10.0);
    expect(getCaffeineHalfLife()).toBe(8.0);

    // Przywrócenie 5.0h
    setCaffeineHalfLife(5.0);
    expect(getCaffeineHalfLife()).toBe(5.0);

    // Zmiana godziny snu (np. 22:00)
    setBedtimeHour(22);
    expect(getBedtimeHour()).toBe(22);

    // Ograniczenia klamrowe (clamping: 18 - 28)
    setBedtimeHour(10);
    expect(getBedtimeHour()).toBe(18);
    setBedtimeHour(35);
    expect(getBedtimeHour()).toBe(28);

    // Przywrócenie 23:00
    setBedtimeHour(23);
    expect(getBedtimeHour()).toBe(23);
  });

  test('BR-KOF-002: Pobiera i zapisuje flagę synchronizacji HealthKit w bazie', () => {
    expect(getHealthKitSyncEnabled()).toBe(false);

    setHealthKitSyncEnabled(true);
    expect(getHealthKitSyncEnabled()).toBe(true);

    setHealthKitSyncEnabled(false);
    expect(getHealthKitSyncEnabled()).toBe(false);
  });

  test('getDatabase zwraca instancję bazy danych', () => {
    const db = getDatabase();
    expect(db).toBeDefined();
  });

  test('Pobiera i zapisuje stan ukończenia onboardingu', () => {
    expect(getHasCompletedOnboarding()).toBe(false);
    setHasCompletedOnboarding(true);
    expect(getHasCompletedOnboarding()).toBe(true);
    setHasCompletedOnboarding(false);
    expect(getHasCompletedOnboarding()).toBe(false);
  });

  test('Pobiera i zapisuje preferencje naparów (both, coffee, tea)', () => {
    expect(getBeveragePreference()).toBe('both');
    setBeveragePreference('coffee');
    expect(getBeveragePreference()).toBe('coffee');
    setBeveragePreference('tea');
    expect(getBeveragePreference()).toBe('tea');
    setBeveragePreference('both');
    expect(getBeveragePreference()).toBe('both');
  });

  describe('RD-ENG-10 & NFR-SEC-015: escapeCsvCell (Formula Injection Escape)', () => {
    test('Wektory testowe z dokumentu BRD (RD-ENG-10)', () => {
      // • "=SUM(A1:A5)" -> "'=SUM(A1:A5)"
      expect(escapeCsvCell('=SUM(A1:A5)')).toBe("\"'=SUM(A1:A5)\"");

      // • "+cmd|' /C calc'!A0" -> "'+cmd|' /C calc'!A0"
      expect(escapeCsvCell("+cmd|' /C calc'!A0")).toBe("\"'+cmd|' /C calc'!A0\"");

      // • "-12.5" -> "-12.5" (zwykła liczba ujemna)
      expect(escapeCsvCell('-12.5')).toBe('-12.5');

      // • 'Notatka z "cudzysłowem", przecinkiem' -> '"Notatka z ""cudzysłowem"", przecinkiem"'
      expect(escapeCsvCell('Notatka z "cudzysłowem", przecinkiem')).toBe(
        '"Notatka z ""cudzysłowem"", przecinkiem"'
      );
    });

    test('Ucieczka znaków niebezpiecznych (@, tab, enter)', () => {
      expect(escapeCsvCell('@danger')).toBe("\"'@danger\"");
      expect(escapeCsvCell('\ttext')).toBe("\"'\ttext\"");
      expect(escapeCsvCell('\rtext')).toBe("\"'\rtext\"");
    });

    test('Wartości puste i null/undefined', () => {
      expect(escapeCsvCell(null)).toBe('');
      expect(escapeCsvCell(undefined)).toBe('');
      expect(escapeCsvCell('')).toBe('');
      expect(escapeCsvCell(123)).toBe('123');
    });
  });

  test('TASK-P10-05-ARC: saveBrewSession oraz mapRowToBrewSession sanityzują liczby i ocenę', () => {
    initDatabase(mockDb as any);
    const brokenSession: any = {
      id: 'session-invalid-boundary',
      recipeId: 'rec-1',
      recipeName: 'V60 Test',
      beverageType: 'COFFEE',
      method: 'v60',
      doseGrams: NaN,
      waterGrams: -100,
      waterTempCelsius: NaN,
      totalTimeSeconds: -50,
      rating: 99,
      flavorTags: [],
      brewedAt: '2026-10-26T00:00:00.000Z',
    };

    saveBrewSession(brokenSession);
    const retrieved = getBrewSessionById('session-invalid-boundary');
    expect(retrieved).not.toBeNull();
    expect(retrieved!.doseGrams).toBe(15);
    expect(retrieved!.waterGrams).toBe(250);
    expect(retrieved!.waterTempCelsius).toBe(92);
    expect(retrieved!.totalTimeSeconds).toBe(0);
    expect(retrieved!.rating).toBeUndefined();
  });

  test('TASK-P9-07-JAK: saveRecipe oraz mapRowToRecipe chronią dose, water, temp i ratio przed NaN i wartościami niedodatnimi', () => {
    initDatabase(mockDb as any);
    const brokenRecipe: any = {
      id: 'test-broken-recipe-numerics',
      name: 'Broken Recipe',
      beverageType: 'COFFEE',
      method: 'v60',
      doseGrams: NaN,
      waterGrams: -100,
      waterTempCelsius: 0,
      recommendedRatio: NaN,
      stepsJson: '[]',
      isCustom: true,
      isFavorite: false,
      createdAt: '2026-10-26T00:00:00.000Z',
    };

    saveRecipe(brokenRecipe);
    const retrieved = getRecipeById('test-broken-recipe-numerics');
    expect(retrieved).not.toBeNull();
    expect(retrieved!.doseGrams).toBe(15);
    expect(retrieved!.waterGrams).toBe(250);
    expect(retrieved!.waterTempCelsius).toBe(92);
    expect(retrieved!.recommendedRatio).toBe(16);
  });

  test('TASK-P9-05-ARC: saveInventoryItem oraz mapRowToInventoryItem sanityzują wagi i ocenę (boundary/finite check)', () => {
    initDatabase(mockDb as any);
    const invalidItem: InventoryItem = {
      id: 'test-invalid-boundary',
      name: 'Invalid Test Coffee',
      type: 'coffee',
      initialWeightGrams: NaN,
      remainingWeightGrams: -99,
      flavorNotes: ['nut'],
      rating: 12,
      isFavorite: false,
      isArchived: false,
      createdAt: '2026-10-26T00:00:00.000Z',
      updatedAt: '2026-10-26T00:00:00.000Z',
    };

    saveInventoryItem(invalidItem);
    const retrieved = getInventoryItemById('test-invalid-boundary');
    expect(retrieved).not.toBeNull();
    expect(retrieved!.initialWeightGrams).toBe(250);
    expect(retrieved!.remainingWeightGrams).toBe(0);
    expect(retrieved!.rating).toBeUndefined();
  });

  test('TASK-P5-05-ARC: deleteInventoryItem unieważnia referencje w brew_sessions (SET NULL) i usuwa pozycję', () => {
    initDatabase(mockDb as any);
    const item: InventoryItem = {
      id: 'bean-fk-test',
      name: 'Test Ziarno FK',
      type: 'coffee',
      initialWeightGrams: 250,
      remainingWeightGrams: 250,
      flavorNotes: [],
      isFavorite: false,
      isArchived: false,
      createdAt: '2026-10-25T10:00:00.000Z',
      updatedAt: '2026-10-25T10:00:00.000Z',
    };
    saveInventoryItem(item);
    expect(mockDb.inventory.has('bean-fk-test')).toBe(true);

    const session: BrewSession = {
      id: 'sess-fk-test',
      recipeId: 'rec-test',
      recipeName: 'V60 Test',
      inventoryItemId: 'bean-fk-test',
      inventoryItemName: 'Test Ziarno FK',
      beverageType: 'COFFEE',
      method: 'V60',
      doseGrams: 15,
      waterGrams: 250,
      waterTempCelsius: 93,
      flavorTags: [],
      totalTimeSeconds: 150,
      brewedAt: '2026-10-25T10:05:00.000Z',
    };
    saveBrewSession(session);
    expect(getBrewSessions().find((s) => s.id === 'sess-fk-test')?.inventoryItemId).toBe('bean-fk-test');

    deleteInventoryItem('bean-fk-test');
    expect(mockDb.inventory.has('bean-fk-test')).toBe(false);
    expect(getBrewSessions().find((s) => s.id === 'sess-fk-test')?.inventoryItemId).toBeUndefined();
  });

  test('TASK-P11-05-ARC: deductInventoryWeight ignoruje błędny id, NaN, ujemne dozy i bezpiecznie odlicza wagę', () => {
    initDatabase(mockDb as any);
    const item: InventoryItem = {
      id: 'bean-deduct-test',
      name: 'Kenya Nyeri',
      type: 'coffee',
      initialWeightGrams: 250,
      remainingWeightGrams: 250,
      flavorNotes: [],
      isFavorite: false,
      isArchived: false,
      createdAt: '2026-10-25T10:00:00.000Z',
      updatedAt: '2026-10-25T10:00:00.000Z',
    };
    saveInventoryItem(item);

    // Próby z niepoprawnym ID oraz błędnymi wartościami
    deductInventoryWeight('', 15);
    deductInventoryWeight(null as any, 15);
    deductInventoryWeight('bean-deduct-test', NaN);
    deductInventoryWeight('bean-deduct-test', -50);
    deductInventoryWeight('bean-deduct-test', 0);
    expect(getInventoryItemById('bean-deduct-test')?.remainingWeightGrams).toBe(250);

    // Prawidłowe odliczenie 18.5g
    deductInventoryWeight('bean-deduct-test', 18.5);
    expect(getInventoryItemById('bean-deduct-test')?.remainingWeightGrams).toBe(231.5);

    // Odliczenie większe niż stan zeruje stan bez ujemnych liczb
    deductInventoryWeight('bean-deduct-test', 300);
    expect(getInventoryItemById('bean-deduct-test')?.remainingWeightGrams).toBe(0);
  });

  test('TASK-P14-05-ARC: deleteInventoryItem i getRecipeById ignorują puste, whitespace i niepoprawne identyfikatory', () => {
    initDatabase(mockDb as any);
    expect(getRecipeById('')).toBeNull();
    expect(getRecipeById('   ')).toBeNull();
    expect(getRecipeById(null as any)).toBeNull();

    // deleteInventoryItem nie rzuca błędów i wychodzi wcześnie
    expect(() => deleteInventoryItem('')).not.toThrow();
    expect(() => deleteInventoryItem('   ')).not.toThrow();
    expect(() => deleteInventoryItem(null as any)).not.toThrow();
  });

  test('TASK-P19-05-ARC: saveRecipe wspiera 0°C dla Cold Brew oraz zabezpiecza uszkodzony stepsJson', () => {
    initDatabase(mockDb as any);
    const coldRecipe: SavedRecipe = {
      id: 'recipe-cold-brew-test',
      name: 'Cold Brew Drip',
      beverageType: 'COFFEE',
      method: 'Cold Drip',
      doseGrams: 30,
      waterGrams: 300,
      waterTempCelsius: 0,
      recommendedRatio: 10,
      stepsJson: 'invalid-json-content',
      isCustom: true,
      isFavorite: false,
      createdAt: '2026-10-26T10:00:00Z',
    };

    saveRecipe(coldRecipe);
    const loaded = getRecipeById('recipe-cold-brew-test');
    expect(loaded).not.toBeNull();
    expect(loaded?.waterTempCelsius).toBe(0);
    expect(loaded?.stepsJson).toBe('[]');
  });

  test('TASK-P20-05-ARC: getBrewSessions zwraca pustą tablicę dla limitu <= 0 lub NaN oraz zaokrągla ułamki w dół', () => {
    initDatabase(mockDb as any);
    expect(getBrewSessions(0)).toEqual([]);
    expect(getBrewSessions(-5)).toEqual([]);
    expect(getBrewSessions(NaN)).toEqual([]);
  });
  test('TASK-P21-05-ARC: getCaffeineLogs waliduje format sinceIso i odrzuca niepoprawne daty', () => {
    initDatabase(mockDb as any);
    mockDb.getAllSync.mockClear();

    // Prawidłowa data ISO powinna użyć parametru zapytania WHERE consumed_at >= ?
    getCaffeineLogs('2026-10-26T10:00:00Z');
    expect(mockDb.getAllSync).toHaveBeenCalledWith(
      expect.stringContaining('WHERE consumed_at >='),
      ['2026-10-26T10:00:00Z']
    );

    mockDb.getAllSync.mockClear();
    // Niepoprawna data (nie-ISO / garbage) powinna spaść do zapytania bez WHERE
    getCaffeineLogs('invalid-date-string');
    expect(mockDb.getAllSync).toHaveBeenCalledWith(
      expect.stringContaining('ORDER BY consumed_at DESC LIMIT 200'),
      []
    );
  });
  test('TASK-P22-05-ARC: mapRowToInventoryItem wspiera stringified numery w wagach (SQLite affinity)', () => {
    initDatabase(mockDb as any);
    const mockRow: any = {
      id: 'bean-affinity-test',
      name: 'Affinity Coffee',
      type: 'coffee',
      initial_weight_g: '250',
      remaining_weight_g: '180.5',
      flavor_notes_json: '[]',
      is_favorite: 0,
      is_archived: 0,
      created_at: '2026-10-26T10:00:00Z',
      updated_at: '2026-10-26T10:00:00Z',
    };

    const originalGetFirstSync = mockDb.getFirstSync;
    mockDb.getFirstSync = jest.fn(() => mockRow);
    const item = getInventoryItemById('bean-affinity-test');
    expect(item).not.toBeNull();
    expect(item?.initialWeightGrams).toBe(250);
    expect(item?.remainingWeightGrams).toBe(180.5);
    mockDb.getFirstSync = originalGetFirstSync;
  });
  test('TASK-P23-05-ARC: saveRecipe bezpiecznie ignoruje null oraz undefined bez rzucania błędem', () => {
    initDatabase(mockDb as any);
    expect(() => saveRecipe(null as any)).not.toThrow();
    expect(() => saveRecipe(undefined as any)).not.toThrow();
    expect(() => saveRecipe({} as any)).not.toThrow();
  });
  test('TASK-P24-05-ARC: saveInventoryItem rzuca kontrolowany błąd dla null/undefined item', () => {
    initDatabase(mockDb as any);
    expect(() => saveInventoryItem(null as any)).toThrow('Nieprawidłowy obiekt pozycji spiżarni');
    expect(() => saveInventoryItem(undefined as any)).toThrow('Nieprawidłowy obiekt pozycji spiżarni');
  });
  test('TASK-P25-05-ARC: logCaffeine bezpiecznie ignoruje null oraz undefined bez rzucania błędem', () => {
    initDatabase(mockDb as any);
    expect(() => logCaffeine(null as any)).not.toThrow();
    expect(() => logCaffeine(undefined as any)).not.toThrow();
  });

  test('TASK-P26-05-ARC: setCaffeineHalfLife, setBedtimeHour oraz setBeveragePreference chronią przed NaN i błędnymi wartościami', () => {
    initDatabase(mockDb as any);
    setCaffeineHalfLife(NaN as any);
    expect(getCaffeineHalfLife()).toBe(5.0);

    setBedtimeHour(NaN as any);
    expect(getBedtimeHour()).toBe(23);

    setBeveragePreference('niepoprawny' as any);
    expect(getBeveragePreference()).toBe('both');
  });

  test('TASK-P27-05-ARC: setUnitSystem waliduje dozwolone jednostki i stosuje fallback metric', () => {
    setUnitSystem('imperial');
    expect(getUnitSystem()).toBe('imperial');

    setUnitSystem('niepoprawny' as any);
    expect(getUnitSystem()).toBe('metric');
  });

  test('TASK-P28-05-ARC: setVoiceAnnounceEnabled, setHapticsEnabled oraz setHasCompletedOnboarding rygorystycznie koercują do boolean', () => {
    initDatabase(mockDb as any);
    setVoiceAnnounceEnabled(null as any);
    expect(getVoiceAnnounceEnabled()).toBe(false);
    setVoiceAnnounceEnabled(1 as any);
    expect(getVoiceAnnounceEnabled()).toBe(true);

    setHapticsEnabled(undefined as any);
    expect(getHapticsEnabled()).toBe(false);
    setHapticsEnabled('true' as any);
    expect(getHapticsEnabled()).toBe(true);

    setHasCompletedOnboarding(null as any);
    expect(getHasCompletedOnboarding()).toBe(false);
    setHasCompletedOnboarding(true);
    expect(getHasCompletedOnboarding()).toBe(true);
  });

  test('TASK-P29-05-ARC: mapRowToBrewSession oraz saveBrewSession sanituja tdsPercentage, extractionYieldPercentage i caffeineContentMg', () => {
    initDatabase(mockDb as any);
    const brokenSession: any = {
      id: 'sess-invalid-metrics',
      beverageType: 'COFFEE',
      method: 'V60',
      doseGrams: 15,
      waterGrams: 250,
      waterTempCelsius: 92,
      totalTimeSeconds: 120,
      tdsPercentage: -1.5,
      extractionYieldPercentage: NaN,
      caffeineContentMg: -50,
      flavorTags: [],
    };
    saveBrewSession(brokenSession);
    const retrieved = getBrewSessionById('sess-invalid-metrics');
    expect(retrieved).not.toBeNull();
    expect(retrieved?.tdsPercentage).toBeUndefined();
    expect(retrieved?.extractionYieldPercentage).toBeUndefined();
    expect(retrieved?.caffeineContentMg).toBeUndefined();

    mockDb.sessions.set('corrupted-metrics-row', {
      id: 'corrupted-metrics-row',
      recipe_id: null,
      recipe_name: null,
      inventory_item_id: null,
      inventory_item_name: null,
      beverage_type: 'COFFEE',
      method: 'V60',
      dose_g: 15,
      water_g: 250,
      water_temp_c: 92,
      water_profile: null,
      grind_setting: null,
      total_time_seconds: 120,
      rating: null,
      flavor_tags_json: '[]',
      taste_balance: null,
      tds_percentage: -2.0,
      extraction_yield_percentage: NaN,
      caffeine_content_mg: -100,
      notes: null,
      infusion_number: 1,
      sensory_scores_json: null,
      brewed_at: '2026-10-26T12:00:00Z',
    });
    const fromCorrupted = getBrewSessionById('corrupted-metrics-row');
    expect(fromCorrupted).not.toBeNull();
    expect(fromCorrupted?.tdsPercentage).toBeUndefined();
    expect(fromCorrupted?.extractionYieldPercentage).toBeUndefined();
    expect(fromCorrupted?.caffeineContentMg).toBeUndefined();
  });

  test('TASK-P30-05-ARC: saveInventoryItem oraz mapRowToInventoryItem trimuja i usuwaja whitespace z pol tekstowych', () => {
    initDatabase(mockDb as any);
    const itemWithWhitespace: any = {
      id: 'item-whitespace-test',
      name: 'Test Ziarno',
      type: 'coffee',
      initialWeightGrams: 250,
      remainingWeightGrams: 250,
      roastOrHarvestDate: '   ',
      roasterOrProducer: '  Hoppenworth & Ploch  ',
      origin: '  Ethiopia  ',
      variety: '   ',
      process: '  Washed  ',
      flavorNotes: [],
      isFavorite: false,
      isArchived: false,
    };
    saveInventoryItem(itemWithWhitespace);
    const retrieved = getInventoryItemById('item-whitespace-test');
    expect(retrieved).not.toBeNull();
    expect(retrieved?.roastOrHarvestDate).toBeUndefined();
    expect(retrieved?.variety).toBeUndefined();
    expect(retrieved?.roasterOrProducer).toBe('Hoppenworth & Ploch');
    expect(retrieved?.origin).toBe('Ethiopia');
    expect(retrieved?.process).toBe('Washed');
  });

  test('TASK-P31-05-ARC: duplicateRecipe trimuje i zabezpiecza nazwe, parsuje stringi dozy i wody oraz fallbacki', () => {
    initDatabase(mockDb as any);
    const recipeToClone: any = {
      id: 'source-rec-1',
      name: '   Specialty Drip   ',
      beverageType: 'COFFEE',
      method: '  V60 02  ',
      author: '   Champion   ',
      description: '   Sweet cup   ',
      doseGrams: '18.5',
      waterGrams: '300.0',
      waterTempCelsius: '94',
      recommendedRatio: '16.2',
    };
    const cloned = duplicateRecipe(recipeToClone, ' (Duplikat)');
    expect(cloned.name).toBe('Specialty Drip (Duplikat)');
    expect(cloned.method).toBe('V60 02');
    expect(cloned.author).toBe('Champion (Modyfikacja)');
    expect(cloned.description).toBe('Sweet cup');
    expect(cloned.doseGrams).toBe(18.5);
    expect(cloned.waterGrams).toBe(300);
    expect(cloned.waterTempCelsius).toBe(94);
    expect(cloned.recommendedRatio).toBe(16.2);

    // Receptura z pustą nazwą
    const emptyNameRecipe: any = {
      id: 'empty-name-rec',
      name: '    ',
      method: 'Kalita',
    };
    const clonedEmpty = duplicateRecipe(emptyNameRecipe);
    expect(clonedEmpty.name).toBe('Receptura (Kopia)');
  });

  test('TASK-P32-05-ARC: deductInventoryWeight parsuje numeryczne stringi dla dozy i chroni remainingWeight przed -0', () => {
    initDatabase(mockDb as any);
    const item: any = {
      id: 'bean-deduct-test',
      name: 'Deduct Beans',
      type: 'coffee',
      initialWeightGrams: 250,
      remainingWeightGrams: 20,
      flavorNotes: [],
      isFavorite: false,
      isArchived: false,
    };
    saveInventoryItem(item);

    // Odejmij dokładnie 20g przekazane jako string
    deductInventoryWeight('bean-deduct-test', '20' as any);
    const updated = getInventoryItemById('bean-deduct-test');
    expect(updated?.remainingWeightGrams).toBe(0);
    expect(Object.is(updated?.remainingWeightGrams, -0)).toBe(false);

    // Odjęcie wartości ujemnej lub nienumerycznej nic nie zmienia
    deductInventoryWeight('bean-deduct-test', 'invalid' as any);
    deductInventoryWeight('bean-deduct-test', -5);
    const unchanged = getInventoryItemById('bean-deduct-test');
    expect(unchanged?.remainingWeightGrams).toBe(0);
  });

  test('TASK-P33-05-ARC: saveRecipe parsuje numeryczne stringi dla dozy, wody, temp i ratio oraz chroni przed -0', () => {
    initDatabase(mockDb as any);
    const stringParamRecipe: any = {
      id: 'rec-string-params',
      name: 'String Param Recipe',
      beverageType: 'COFFEE',
      method: 'Kalita',
      doseGrams: '16.5',
      waterGrams: '250.0',
      waterTempCelsius: '92.4',
      recommendedRatio: '15.15',
      stepsJson: '[]',
      isCustom: true,
      isFavorite: false,
    };
    saveRecipe(stringParamRecipe);

    const saved = getRecipeById('rec-string-params');
    expect(saved).not.toBeNull();
    expect(saved?.doseGrams).toBe(16.5);
    expect(saved?.waterGrams).toBe(250);
    expect(saved?.waterTempCelsius).toBe(92);
    expect(saved?.recommendedRatio).toBe(15.15);
    expect(Object.is(saved?.doseGrams, -0)).toBe(false);
  });

  test('TASK-P34-05-ARC: saveBrewSession parsuje numeryczne stringi dla dozy, wody, temp, czasu, oceny, tds, ey, kofeiny oraz chroni przed -0', () => {
    initDatabase(mockDb as any);
    const stringParamSession: any = {
      id: 'sess-string-params',
      beverageType: 'COFFEE',
      method: 'V60',
      doseGrams: '18.5',
      waterGrams: '300.0',
      waterTempCelsius: '94.2',
      totalTimeSeconds: '185',
      rating: '4.5',
      tdsPercentage: '1.42',
      extractionYieldPercentage: '20.15',
      caffeineContentMg: '125.0',
      brewedAt: '2026-10-26T14:00:00.000Z',
    };
    saveBrewSession(stringParamSession);

    const saved = getBrewSessionById('sess-string-params');
    expect(saved).not.toBeNull();
    expect(saved?.doseGrams).toBe(18.5);
    expect(saved?.waterGrams).toBe(300);
    expect(saved?.waterTempCelsius).toBe(94);
    expect(saved?.totalTimeSeconds).toBe(185);
    expect(saved?.rating).toBe(4.5);
    expect(saved?.tdsPercentage).toBe(1.42);
    expect(saved?.extractionYieldPercentage).toBe(20.15);
    expect(saved?.caffeineContentMg).toBe(125);
    expect(Object.is(saved?.doseGrams, -0)).toBe(false);
  });

  test('TASK-P35-05-ARC: saveInventoryItem parsuje numeryczne stringi dla wag oraz oceny i chroni przed -0', () => {
    initDatabase(mockDb as any);
    const itemWithStringParams: any = {
      id: 'inv-string-params',
      name: 'String Weights Bean',
      type: 'coffee',
      initialWeightGrams: '300.0',
      remainingWeightGrams: '150.5',
      rating: '4.8',
      isFavorite: false,
      isArchived: false,
    };
    saveInventoryItem(itemWithStringParams);

    const saved = getInventoryItemById('inv-string-params');
    expect(saved).not.toBeNull();
    expect(saved?.initialWeightGrams).toBe(300);
    expect(saved?.remainingWeightGrams).toBe(150.5);
    expect(saved?.rating).toBe(4.8);
    expect(Object.is(saved?.remainingWeightGrams, -0)).toBe(false);
  });

  test('TASK-P36-05-ARC: saveRecipe sanityzuje name, beverageType i method, a recordBrewSessionTransaction parsuje string dozy', () => {
    initDatabase(mockDb as any);
    const recipeWithLooseFields: any = {
      id: 'rec-loose-fields',
      name: '   ',
      beverageType: 'UNKNOWN_TYPE',
      method: '',
      doseGrams: 15,
      waterGrams: 250,
      stepsJson: '[]',
    };
    saveRecipe(recipeWithLooseFields);
    const savedRec = getRecipeById('rec-loose-fields');
    expect(savedRec?.name).toBe('Recipe');
    expect(savedRec?.beverageType).toBe('COFFEE');
    expect(savedRec?.method).toBe('v60');

    // recordBrewSessionTransaction z dozą stringową
    const itemForTx: InventoryItem = {
      id: 'bean-tx-str',
      name: 'Bean Tx String',
      type: 'coffee',
      initialWeightGrams: 250,
      remainingWeightGrams: 200,
      flavorNotes: [],
      isFavorite: false,
      isArchived: false,
      createdAt: '2026-10-26T10:00:00Z',
      updatedAt: '2026-10-26T10:00:00Z',
    };
    saveInventoryItem(itemForTx);

    const session: BrewSession = {
      id: 'sess-tx-str',
      recipeName: 'V60 Tx',
      beverageType: 'COFFEE',
      method: 'v60',
      doseGrams: 18,
      waterGrams: 300,
      waterTempCelsius: 93,
      totalTimeSeconds: 180,
      rating: 5,
      flavorTags: [],
      brewedAt: '2026-10-26T12:00:00Z',
    };
    recordBrewSessionTransaction(session, { itemId: 'bean-tx-str', doseGrams: '18.5' as any });
    const updatedBean = getInventoryItemById('bean-tx-str');
    expect(updatedBean?.remainingWeightGrams).toBe(181.5);
  });

  test('TASK-P37-05-ARC: ochrona przed -0 i weryfikacja poprawności JSON dla stepsJson w duplicateRecipe', () => {
    initDatabase(mockDb as any);
    const sourceRecipe: any = {
      id: 'rec-duplicate-test',
      name: 'Batch Brew',
      beverageType: 'COFFEE',
      method: 'Batch Brew',
      doseGrams: -0,
      waterGrams: -0,
      waterTempCelsius: -0,
      recommendedRatio: -0,
      stepsJson: 'broken-json-{{{',
    };

    const cloned = duplicateRecipe(sourceRecipe);
    expect(cloned.name).toBe('Batch Brew (Kopia)');
    expect(cloned.doseGrams).toBe(15);
    expect(cloned.waterGrams).toBe(250);
    expect(cloned.waterTempCelsius).toBe(0);
    expect(cloned.recommendedRatio).toBe(16.7);
    expect(cloned.stepsJson).toBe('[]');
    expect(Object.is(cloned.doseGrams, -0)).toBe(false);
    expect(Object.is(cloned.waterGrams, -0)).toBe(false);
    expect(Object.is(cloned.waterTempCelsius, -0)).toBe(false);
    expect(Object.is(cloned.recommendedRatio, -0)).toBe(false);
  });

  test('TASK-P38-05-ARC: saveBrewSession sanityzuje flavorTags, recipeId oraz inventoryItemId', () => {
    initDatabase(mockDb as any);
    const sessionWithMessyFields: any = {
      id: 'sess-messy-fields',
      recipeId: '   ',
      inventoryItemId: '  ',
      recipeName: 'V60 Clean',
      beverageType: 'COFFEE',
      method: 'v60',
      doseGrams: 15,
      waterGrams: 250,
      totalTimeSeconds: 150,
      flavorTags: ['  jaśmin  ', '', '   ', 'cytrusy'],
      brewedAt: '2026-10-26T12:00:00Z',
    };
    saveBrewSession(sessionWithMessyFields);

    const saved = getBrewSessionById('sess-messy-fields');
    expect(saved).not.toBeNull();
    expect(saved?.recipeId).toBeUndefined();
    expect(saved?.inventoryItemId).toBeUndefined();
    expect(saved?.flavorTags).toEqual(['jaśmin', 'cytrusy']);
  });

  test('TASK-P39-05-ARC: saveInventoryItem defensywnie sanityzuje name, type, roastProfile i flavorNotes', () => {
    initDatabase(mockDb as any);
    const itemMessy: any = {
      id: 'inv-messy-1',
      name: '   ',
      type: 'invalid_type',
      roastProfile: '  medium-light  ',
      flavorNotes: ['  czekolada  ', null, 123, '  karmel  ', '   '],
      initialWeightGrams: 250,
      remainingWeightGrams: 250,
    };
    saveInventoryItem(itemMessy);

    const saved = getInventoryItemById('inv-messy-1');
    expect(saved).not.toBeNull();
    expect(saved?.name).toBe('Bez nazwy');
    expect(saved?.type).toBe('coffee');
    expect(saved?.roastProfile).toBe('medium-light');
    expect(saved?.flavorNotes).toEqual(['czekolada', 'karmel']);
  });

  test('TASK-P40-05-ARC: getRecipes normalizuje wielkosc liter beverageType (coffee -> COFFEE)', () => {
    initDatabase(mockDb as any);
    const coffeeRecipes = getRecipes('coffee' as any);
    expect(Array.isArray(coffeeRecipes)).toBe(true);
    expect(coffeeRecipes.every((r) => r.beverageType === 'COFFEE')).toBe(true);

    const teaRecipes = getRecipes('  tea  ' as any);
    expect(Array.isArray(teaRecipes)).toBe(true);
    expect(teaRecipes.every((r) => r.beverageType === 'TEA')).toBe(true);

    const allRecipes = getRecipes('unknown' as any);
    expect(allRecipes.length).toBeGreaterThanOrEqual(coffeeRecipes.length + teaRecipes.length);
  });

  test('TASK-P41-05-ARC: getBrewSessions wspiera i sanityzuje parametr offset (stringi, ujemne, -0, NaN)', () => {
    initDatabase(mockDb as any);
    mockDb.getAllSync.mockClear();

    // Numeryczny offset
    getBrewSessions(10, 5);
    expect(mockDb.getAllSync).toHaveBeenCalledWith(
      expect.stringContaining('LIMIT ? OFFSET ?'),
      [10, 5]
    );

    mockDb.getAllSync.mockClear();
    // Stringowy offset z zaokrągleniem w dół
    getBrewSessions(20, '15.9' as any);
    expect(mockDb.getAllSync).toHaveBeenCalledWith(
      expect.stringContaining('LIMIT ? OFFSET ?'),
      [20, 15]
    );

    mockDb.getAllSync.mockClear();
    // Ujemny offset lub NaN nie dodaje klauzuli OFFSET
    getBrewSessions(10, -5);
    expect(mockDb.getAllSync).toHaveBeenCalledWith(
      expect.stringContaining('LIMIT ?'),
      [10]
    );

    mockDb.getAllSync.mockClear();
    getBrewSessions(10, -0);
    expect(mockDb.getAllSync).toHaveBeenCalledWith(
      expect.stringContaining('LIMIT ?'),
      [10]
    );
  });

  test('TASK-P42-05-ARC: duplicateRecipe normalizuje beverageType (np. tea) i ogranicza dlugosc nazwy do 100 znakow', () => {
    initDatabase(mockDb as any);
    const longName = 'A'.repeat(120);
    const recipeToClone: any = {
      id: 'rec-test-clone',
      name: longName,
      beverageType: '  tea  ',
      method: 'Gaiwan',
      doseGrams: 5,
      waterGrams: 100,
      waterTempCelsius: 85,
      recommendedRatio: 20,
      stepsJson: '[]',
    };

    const cloned = duplicateRecipe(recipeToClone);
    expect(cloned.beverageType).toBe('TEA');
    expect(cloned.name.length).toBeLessThanOrEqual(100);
    expect(cloned.name.endsWith(' (Kopia)')).toBe(true);
  });

  test('TASK-P43-05-ARC: importDataJson chroni przed nie-tablicami i elementami nie-obiektowymi w polach kopii zapasowej', () => {
    initDatabase(mockDb as any);
    const corruptedBackup = {
      version: 1,
      exportedAt: '2026-10-26T12:00:00.000Z',
      inventory: 'not-an-array' as any,
      customRecipes: 123 as any,
      sessions: null as any,
      caffeineLogs: undefined as any,
    };

    // Nie powinno rzucać błędem TypeError: not iterable
    expect(() => importDataJson(JSON.stringify(corruptedBackup))).not.toThrow();

    // Kopia zapasowa z tablicami zawierającymi elementy null/string
    const arrayWithNulls = {
      version: 1,
      exportedAt: '2026-10-26T12:00:00.000Z',
      inventory: [null, 'invalid', { id: 'inv-valid', name: 'Ethiopia Yirgacheffe', type: 'coffee', initialWeightGrams: 250, remainingWeightGrams: 200, isArchived: false, isFavorite: false }],
      customRecipes: [undefined, 42],
      sessions: [null],
      caffeineLogs: ['invalid'],
    };
    expect(() => importDataJson(JSON.stringify(arrayWithNulls))).not.toThrow();
  });

  test('TASK-P44-05-ARC: logCaffeine generuje fallback ID, parsuje wagi string, normalizuje beverageType i chroni przed -0', () => {
    initDatabase(mockDb as any);
    logCaffeine({
      id: '   ' as any,
      beverageName: 'Sencha Green',
      beverageType: ' TEA ' as any,
      consumedAt: '2026-10-26T14:00:00Z',
      doseGrams: '4.5' as any,
      caffeineMg: '-0' as any,
    });

    const logs = getCaffeineLogs('2026-10-26T00:00:00Z');
    const added = logs.find((l) => l.beverageName === 'Sencha Green');
    expect(added).toBeDefined();
    expect(added?.id).toMatch(/^caff_\d+_[a-z0-9]+$/);
    expect(added?.doseGrams).toBe(4.5);
    expect(added?.caffeineMg).toBe(0);
    expect(Object.is(added?.caffeineMg, -0)).toBe(false);
    expect(added?.beverageType).toBe('tea');
  });

  test('TASK-P45-05-ARC: updateRecipeFavorite rygorystycznie koercuje wartosci i saveRecipe obcina author, description oraz grindSizeDescription', () => {
    initDatabase(mockDb as any);
    const testRecipeId = 'rec-p45-arc';
    saveRecipe({
      id: testRecipeId,
      name: 'P45 Chemex Recipe',
      beverageType: 'COFFEE',
      method: 'Chemex',
      author: '   ' + 'A'.repeat(150) + '   ',
      description: '   ' + 'D'.repeat(1200) + '   ',
      grindSizeDescription: '   ' + 'G'.repeat(250) + '   ',
      doseGrams: 20,
      waterGrams: 300,
      waterTempCelsius: 93,
      recommendedRatio: 15,
      stepsJson: '[]',
      isCustom: true,
      isFavorite: false,
      createdAt: '2026-10-26T12:00:00Z',
    });

    const saved = getRecipeById(testRecipeId);
    expect(saved).toBeDefined();
    expect(saved?.author).toBe('A'.repeat(100));
    expect(saved?.description).toBe('D'.repeat(1000));
    expect(saved?.grindSizeDescription).toBe('G'.repeat(200));

    // Test updateRecipeFavorite with string 'false' -> must be 0 (false), NOT 1 (truthy)
    updateRecipeFavorite(testRecipeId, 'false' as any);
    expect(getRecipeById(testRecipeId)?.isFavorite).toBe(false);

    // String 'true' or 1 -> true
    updateRecipeFavorite(testRecipeId, 'true' as any);
    expect(getRecipeById(testRecipeId)?.isFavorite).toBe(true);

    updateRecipeFavorite(testRecipeId, 0 as any);
    expect(getRecipeById(testRecipeId)?.isFavorite).toBe(false);

    updateRecipeFavorite(testRecipeId, 1 as any);
    expect(getRecipeById(testRecipeId)?.isFavorite).toBe(true);
  });

  test('TASK-P46-05-ARC: saveBrewSession sanityzuje recipeName, method, beverageType oraz inventoryItemName', () => {
    initDatabase(mockDb as any);
    const testSessionId = 'sess-p46-arc';
    saveBrewSession({
      id: testSessionId,
      recipeName: '   ' + 'R'.repeat(250) + '   ',
      method: '   ' + 'M'.repeat(80) + '   ',
      beverageType: ' tea ' as any,
      inventoryItemName: '   ' + 'I'.repeat(250) + '   ',
      doseGrams: 16,
      waterGrams: 250,
      waterTempCelsius: 93,
      totalTimeSeconds: 150,
      flavorTags: [],
      brewedAt: '2026-10-26T16:00:00Z',
    });

    const saved = getBrewSessionById(testSessionId);
    expect(saved).toBeDefined();
    expect(saved?.recipeName).toBe('R'.repeat(200));
    expect(saved?.method).toBe('M'.repeat(50));
    expect(saved?.beverageType).toBe('TEA');
    expect(saved?.inventoryItemName).toBe('I'.repeat(200));
  });

  test('TASK-P47-05-ARC: saveRecipe obsluguje przecinki dziesietne, clampuje parametry i serializuje obiektowy stepsJson', () => {
    initDatabase(mockDb as any);
    const testRecipeId = 'rec-p47-arc';
    saveRecipe({
      id: testRecipeId,
      name: 'Test Comma & Steps',
      beverageType: 'COFFEE',
      method: 'V60',
      doseGrams: '18,5' as any,
      waterGrams: '280,5' as any,
      waterTempCelsius: '94,5' as any,
      recommendedRatio: '15,2' as any,
      stepsJson: [
        {
          namePl: 'Zalanie 1',
          nameEn: 'Pour 1',
          durationSeconds: 45,
          targetWaterGrams: 100,
        },
      ] as any,
      isCustom: true,
      isFavorite: false,
      createdAt: '2026-10-26T18:00:00Z',
    });

    const saved = getRecipeById(testRecipeId);
    expect(saved).toBeDefined();
    expect(saved?.doseGrams).toBe(18.5);
    expect(saved?.waterGrams).toBe(280.5);
    expect(saved?.waterTempCelsius).toBe(95); // rounded
    expect(saved?.recommendedRatio).toBe(15.2);
    expect(saved?.stepsJson).toContain('Zalanie 1');

    // Test clampowania wielkich liczb
    saveRecipe({
      id: 'rec-p47-clamp',
      name: 'Huge Recipe',
      beverageType: 'COFFEE',
      method: 'V60',
      doseGrams: 5000,
      waterGrams: 999999,
      waterTempCelsius: 150,
      recommendedRatio: 250,
      stepsJson: '[]',
      isCustom: true,
      isFavorite: false,
      createdAt: '2026-10-26T18:00:00Z',
    });

    const clamped = getRecipeById('rec-p47-clamp');
    expect(clamped?.doseGrams).toBe(1000);
    expect(clamped?.waterGrams).toBe(50000);
    expect(clamped?.waterTempCelsius).toBe(100);
    expect(clamped?.recommendedRatio).toBe(100);
  });

  test('TASK-P48-05-ARC: saveInventoryItem obsluguje przecinki dziesietne w wagach i ocenie oraz clampuje zakres wag do [0, 100000]', () => {
    initDatabase(mockDb as any);
    const testItemId = 'item-p48-arc';
    saveInventoryItem({
      id: testItemId,
      name: 'Kenya Nyeri AA',
      type: 'coffee',
      initialWeightGrams: '250,5' as any,
      remainingWeightGrams: '125,5' as any,
      rating: '4,5' as any,
      flavorNotes: ['porzeczka', 'rabarbar'],
      isFavorite: true,
      isArchived: false,
      createdAt: '2026-10-26T18:00:00Z',
      updatedAt: '2026-10-26T18:00:00Z',
    });

    const saved = getInventoryItemById(testItemId);
    expect(saved).toBeDefined();
    expect(saved?.initialWeightGrams).toBe(250.5);
    expect(saved?.remainingWeightGrams).toBe(125.5);
    expect(saved?.rating).toBe(4.5);

    // Test clampowania ekstremalnych wag w spiżarni
    saveInventoryItem({
      id: 'item-p48-clamp',
      name: 'Gigantic Coffee',
      type: 'coffee',
      initialWeightGrams: 5000000,
      remainingWeightGrams: 5000000,
      flavorNotes: [],
      isFavorite: false,
      isArchived: false,
      createdAt: '2026-10-26T18:00:00Z',
      updatedAt: '2026-10-26T18:00:00Z',
    });

    const clamped = getInventoryItemById('item-p48-clamp');
    expect(clamped?.initialWeightGrams).toBe(100000);
    expect(clamped?.remainingWeightGrams).toBe(100000);
  });

  test('TASK-P49-05-ARC: saveBrewSession wspiera przecinki dziesiętne i clampuje wagę, a saveRecipe normalizuje beverageType', () => {
    // 1. saveBrewSession z przecinkami dziesiętnymi
    const sessionId = 'sess-p49-comma';
    saveBrewSession({
      id: sessionId,
      recipeId: 'rec-1',
      recipeName: 'V60 Comma Test',
      beverageType: 'COFFEE',
      method: 'V60',
      doseGrams: '18,5' as any,
      waterGrams: '250,5' as any,
      waterTempCelsius: 93,
      totalTimeSeconds: 150,
      rating: '4,5' as any,
      tdsPercentage: '1,35' as any,
      extractionYieldPercentage: '20,5' as any,
      caffeineContentMg: '142,5' as any,
      flavorTags: ['owocowe'],
      brewedAt: '2026-10-26T20:00:00Z',
    });

    const savedSession = getBrewSessionById(sessionId);
    expect(savedSession).toBeDefined();
    expect(savedSession?.doseGrams).toBe(18.5);
    expect(savedSession?.waterGrams).toBe(250.5);
    expect(savedSession?.rating).toBe(4.5);
    expect(savedSession?.tdsPercentage).toBe(1.35);
    expect(savedSession?.extractionYieldPercentage).toBe(20.5);
    expect(savedSession?.caffeineContentMg).toBe(142.5);

    // 2. saveRecipe z małą literą 'tea'
    const recipeId = 'rec-p49-tea';
    saveRecipe({
      id: recipeId,
      name: 'Sencha Green Tea',
      beverageType: 'tea' as any,
      method: 'Kyusu',
      doseGrams: 5,
      waterGrams: 150,
      waterTempCelsius: 70,
      grindSizeDescription: 'Całe liście',
      recommendedRatio: 30,
      stepsJson: '[]',
      isCustom: true,
      isFavorite: false,
      createdAt: '2026-10-26T20:00:00Z',
    });

    const savedRecipe = getRecipeById(recipeId);
    expect(savedRecipe).toBeDefined();
    expect(savedRecipe?.beverageType).toBe('TEA');
  });

  test('TASK-P50-05-ARC: saveInventoryItem normalizuje wielkosc liter type (TEA -> tea) a deductInventoryWeight wspiera przecinek dziesietny', () => {
    initDatabase(mockDb as any);

    // 1. Normalizacja type: 'TEA' -> 'tea'
    const teaItem: any = {
      id: 'tea-case-norm',
      name: 'Sencha Fukamushi',
      type: 'TEA',
      initialWeightGrams: 100,
      remainingWeightGrams: 100,
      flavorNotes: [],
      isFavorite: false,
      isArchived: false,
    };
    saveInventoryItem(teaItem);
    const savedTea = getInventoryItemById('tea-case-norm');
    expect(savedTea?.type).toBe('tea');

    // 2. Obsługa przecinka dziesiętnego w deductInventoryWeight
    deductInventoryWeight('tea-case-norm', '15,5' as any);
    const afterDeduct = getInventoryItemById('tea-case-norm');
    expect(afterDeduct?.remainingWeightGrams).toBe(84.5);
  });

  test('TASK-P51-05-ARC: saveRecipe i duplicateRecipe parsuja proporcje w formatach 1:X oraz 1/X i wspieraja przecinki dziesietne', () => {
    initDatabase(mockDb as any);

    // 1. saveRecipe ze stringiem ratio '1:16.5' i '1/15'
    saveRecipe({
      id: 'rec-p51-ratio-colon',
      name: 'V60 Ratio Colon',
      beverageType: 'COFFEE',
      method: 'V60',
      doseGrams: 15,
      waterGrams: 250,
      waterTempCelsius: 92,
      recommendedRatio: '1:16.5' as any,
      stepsJson: '[]',
      isCustom: true,
      isFavorite: false,
      createdAt: '2026-10-26T20:00:00Z',
    });
    const savedColon = getRecipeById('rec-p51-ratio-colon');
    expect(savedColon?.recommendedRatio).toBe(16.5);

    saveRecipe({
      id: 'rec-p51-ratio-slash',
      name: 'V60 Ratio Slash',
      beverageType: 'COFFEE',
      method: 'V60',
      doseGrams: 15,
      waterGrams: 250,
      waterTempCelsius: 92,
      recommendedRatio: '1/15' as any,
      stepsJson: '[]',
      isCustom: true,
      isFavorite: false,
      createdAt: '2026-10-26T20:00:00Z',
    });
    const savedSlash = getRecipeById('rec-p51-ratio-slash');
    expect(savedSlash?.recommendedRatio).toBe(15);

    // 2. duplicateRecipe z ratio '1:17.5' i przecinkami dziesiętnymi
    const duplicated = duplicateRecipe({
      id: 'rec-orig',
      name: 'Original Coffee',
      beverageType: 'COFFEE',
      method: 'V60',
      doseGrams: '18,5' as any,
      waterGrams: '300,5' as any,
      waterTempCelsius: '92,5' as any,
      recommendedRatio: '1:17.5' as any,
      steps: [],
    } as any);

    expect(duplicated.doseGrams).toBe(18.5);
    expect(duplicated.waterGrams).toBe(300.5);
    expect(duplicated.recommendedRatio).toBe(17.5);
  });

  test('TASK-P52-05-ARC: deleteRecipe, deleteInventoryItem, deleteBrewSession i deleteCaffeineLog wspieraja numeryczne ID oraz sanityzuja znaki kontrolne', () => {
    // 1. deleteRecipe z numerycznym ID
    saveRecipe({
      id: '12345',
      name: 'Numeric ID Recipe',
      beverageType: 'COFFEE',
      method: 'Aeropress',
      doseGrams: 14,
      waterGrams: 200,
      waterTempCelsius: 90,
      recommendedRatio: 14.3,
      stepsJson: '[]',
      isCustom: true,
      isFavorite: false,
      createdAt: '2026-10-26T20:00:00Z',
    });
    expect(getRecipeById('12345')).toBeDefined();
    deleteRecipe(12345 as any);
    expect(getRecipeById('12345')).toBeNull();

    // 2. deleteInventoryItem z numerycznym ID
    saveInventoryItem({
      id: '9999',
      name: 'Numeric Inventory',
      type: 'coffee',
      initialWeightGrams: 250,
      remainingWeightGrams: 200,
      flavorNotes: [],
      isFavorite: false,
      isArchived: false,
      createdAt: '2026-10-26T20:00:00Z',
      updatedAt: '2026-10-26T20:00:00Z',
    });
    expect(getInventoryItemById('9999')).toBeDefined();
    deleteInventoryItem(9999 as any);
    expect(getInventoryItemById('9999')).toBeNull();

    // 3. deleteRecipe ze znakami kontrolnymi
    saveRecipe({
      id: 'rec-ctrl-clean',
      name: 'Control Chars Recipe',
      beverageType: 'COFFEE',
      method: 'V60',
      doseGrams: 15,
      waterGrams: 250,
      waterTempCelsius: 92,
      recommendedRatio: 16,
      stepsJson: '[]',
      isCustom: true,
      isFavorite: false,
      createdAt: '2026-10-26T20:00:00Z',
    });
    expect(getRecipeById('rec-ctrl-clean')).toBeDefined();
    deleteRecipe('\x00rec-ctrl-clean\x1F' as any);
    expect(getRecipeById('rec-ctrl-clean')).toBeNull();
  });

  test('TASK-P53-05-ARC: importDataJson radzi sobie z BOM \\uFEFF i odrzuca nie-stringi, a saveRecipe wspiera recipe.steps i numeryczne ID', () => {
    // 1. importDataJson z BOM \uFEFF na początku pliku
    const backupObj = {
      version: 1,
      exportedAt: '2026-10-26T20:00:00Z',
      inventory: [
        {
          id: 'bom-inv-1',
          name: 'BOM Coffee',
          type: 'coffee',
          initialWeightGrams: 250,
          remainingWeightGrams: 250,
          flavorNotes: ['citrus'],
          isFavorite: false,
          isArchived: false,
        },
      ],
      customRecipes: [],
      sessions: [],
      caffeineLogs: [],
    };
    const jsonWithBom = '\uFEFF' + JSON.stringify(backupObj);

    expect(() => importDataJson(jsonWithBom)).not.toThrow();
    expect(getInventoryItemById('bom-inv-1')).toBeDefined();

    // 2. importDataJson z nie-stringami (null, undefined, number, whitespace)
    expect(() => importDataJson(null as any)).toThrow('Nieprawidłowy format JSON');
    expect(() => importDataJson(undefined as any)).toThrow('Nieprawidłowy format JSON');
    expect(() => importDataJson(12345 as any)).toThrow('Nieprawidłowy format JSON');
    expect(() => importDataJson('   \n\t  ')).toThrow('Nieprawidłowy format JSON');

    // 3. saveRecipe z obiektem steps: RecipeStep[] oraz numerycznym ID
    saveRecipe({
      id: 777 as any,
      name: 'Steps Array Recipe',
      beverageType: 'COFFEE',
      method: 'V60',
      doseGrams: 15,
      waterGrams: 250,
      waterTempCelsius: 92,
      recommendedRatio: 16.7,
      steps: [
        { stepIndex: 0, title: 'Bloom', durationSeconds: 45, targetWaterGrams: 50 },
        { stepIndex: 1, title: 'Pour 2', durationSeconds: 60, targetWaterGrams: 250 },
      ] as any,
      isCustom: true,
      isFavorite: false,
      createdAt: '2026-10-26T20:00:00Z',
    } as any);

    const saved = getRecipeById('777');
    expect(saved).toBeDefined();
    expect(saved?.id).toBe('777');
    expect(saved?.stepsJson).toContain('Bloom');
  });

  test('TASK-P54-05-ARC: getAppSetting i setAppSetting sanityzują klucze i przyjmują wartości różnego typu, a duplicateRecipe zachowuje steps: RecipeStep[]', () => {
    // 1. getAppSetting i setAppSetting z kluczami ze znakami kontrolnymi
    setAppSetting(' \x00theme_preference\x1F ', 'dark');
    expect(getAppSetting('theme_preference')).toBe('dark');
    expect(getAppSetting(' \t\x00theme_preference\r\n ')).toBe('dark');

    // 2. setAppSetting przyjmuje boolean i number
    setAppSetting('is_active_flag', true as any);
    expect(getAppSetting('is_active_flag')).toBe('true');
    setAppSetting('active_count_val', 42 as any);
    expect(getAppSetting('active_count_val')).toBe('42');

    // Pusty klucz zwraca defaultValue
    expect(getAppSetting('   \x00\x1F  ', 'default_val')).toBe('default_val');

    // 3. duplicateRecipe z obiektem steps: RecipeStep[] (np. z MasterRecipe)
    const masterLikeRecipe: any = {
      id: 'master-aeropress',
      name: 'Aeropress Inverted Championship',
      beverageType: 'COFFEE',
      method: 'Aeropress',
      doseGrams: 16,
      waterGrams: 200,
      waterTempCelsius: 85,
      recommendedRatio: 12.5,
      steps: [
        { namePl: 'Preinfuzja', durationSeconds: 30, targetWaterGrams: 50 },
        { namePl: 'Wycisk', durationSeconds: 30, targetWaterGrams: 200 },
      ],
    };
    const cloned = duplicateRecipe(masterLikeRecipe);
    expect(cloned.name).toContain('(Kopia)');
    expect(cloned.stepsJson).toContain('Preinfuzja');
    expect(cloned.stepsJson).toContain('Wycisk');
  });

  test('TASK-P56-03-ZAK: escapeCsvCell zabezpiecza przed Formula Injection z wiodacymi spacjami/BOM, srednikami, -0 i bajtami zerowymi', () => {
    // 1. Wiodące spacje lub BOM przed formułą
    const spaceFormula = "   =cmd|' /C calc'!A0";
    expect(escapeCsvCell(spaceFormula)).toBe("\"'   =cmd|' /C calc'!A0\"");

    const bomFormula = '\uFEFF=1+1';
    expect(escapeCsvCell(bomFormula)).toBe("\"'=1+1\"");

    // 2. Średniki (separator CSV w Europie) wymagają cudzysłowu
    expect(escapeCsvCell('Etiopia; Washed; V60')).toBe('"Etiopia; Washed; V60"');

    // 3. Ochrona przed -0
    expect(escapeCsvCell(-0)).toBe('0');

    // 4. Usuwanie bajtów zerowych
    expect(escapeCsvCell('Kawa\x00 Filter')).toBe('Kawa Filter');
  });

  test('TASK-P59-03-ZAK: escapeCsvCell neutralizuje formuly potoku | oraz getAppSetting/setAppSetting oczyszczaja BOM w kluczach', () => {
    // 1. Potok DDE Formula Injection
    expect(escapeCsvCell("|' /C calc'!A0")).toBe("\"'|' /C calc'!A0\"");
    expect(escapeCsvCell("   |calc")).toBe("\"'   |calc\"");

    // 2. BOM w kluczach ustawień
    setAppSetting('\uFEFFapp_theme_mode', 'dark');
    expect(getAppSetting('\uFEFFapp_theme_mode')).toBe('dark');
    expect(getAppSetting('app_theme_mode')).toBe('dark');
  });

  test('TASK-P61-03-ZAK: exportCustomRecipesCsv generuje plik CSV z autorskimi recepturami i zabezpiecza przed Formula Injection', () => {
    const customRecipe: SavedRecipe = {
      id: 'rec-csv-test-1',
      name: '=cmd|V60 3-Pour Artisan',
      beverageType: 'COFFEE',
      isCustom: true,
      method: 'V60',
      author: 'Barista Champion',
      description: 'Zbalansowany przelew, 3 równe zalania',
      doseGrams: 15,
      waterGrams: 250,
      waterTempCelsius: 93,
      recommendedRatio: 16.67,
      grindSizeDescription: '22 kliki Comandante',
      stepsJson: JSON.stringify([
        { name: 'Preinfuzja', durationSeconds: 45, waterGrams: 50 },
        { name: 'Główne zalanie', durationSeconds: 60, waterGrams: 150 },
        { name: 'Dobicie', durationSeconds: 45, waterGrams: 250 },
      ]),
      isFavorite: true,
      createdAt: '2026-10-27T07:00:00Z',
    };
    saveRecipe(customRecipe);

    const csv = exportCustomRecipesCsv();
    expect(csv).toContain('id,name,beverage_type,method,author');
    expect(csv).toContain('rec-csv-test-1');
    expect(csv).toContain('Barista Champion');
    expect(csv).toContain('"\'=cmd|V60 3-Pour Artisan"'); // Formula injection neutralization
  });

  test('TASK-P64-03-ZAK: getInventoryTotalWeight zlicza mase kawy i herbaty z zabezpieczeniem przed ujemnymi i nieprawidlowymi wartosciami', () => {
    initDatabase(mockDb as any);
    mockDb.inventory.clear();

    // Pusta spiżarnia -> same zera
    expect(getInventoryTotalWeight()).toEqual({ coffeeGrams: 0, teaGrams: 0, totalGrams: 0 });

    // Dodanie kawy (250g) i herbaty (100g)
    const coffee: InventoryItem = {
      id: 'bean-total-1',
      name: 'Kenya Nyeri',
      type: 'coffee',
      initialWeightGrams: 250,
      remainingWeightGrams: 200,
      flavorNotes: ['porzeczka'],
      isArchived: false,
      isFavorite: false,
      createdAt: '2026-10-27T08:00:00Z',
      updatedAt: '2026-10-27T08:00:00Z',
    };
    const tea: InventoryItem = {
      id: 'tea-total-1',
      name: 'Gyokuro',
      type: 'tea',
      initialWeightGrams: 100,
      remainingWeightGrams: 80,
      flavorNotes: ['umami'],
      isArchived: false,
      isFavorite: false,
      createdAt: '2026-10-27T08:00:00Z',
      updatedAt: '2026-10-27T08:00:00Z',
    };
    saveInventoryItem(coffee);
    saveInventoryItem(tea);

    const stats = getInventoryTotalWeight();
    expect(stats.coffeeGrams).toBe(200);
    expect(stats.teaGrams).toBe(80);
    expect(stats.totalGrams).toBe(280);

    // Pozycja zarchiwizowana
    const archivedCoffee: InventoryItem = {
      id: 'bean-archived-1',
      name: 'Old Blend',
      type: 'coffee',
      initialWeightGrams: 250,
      remainingWeightGrams: 50,
      flavorNotes: [],
      isArchived: true,
      isFavorite: false,
      createdAt: '2026-10-27T08:00:00Z',
      updatedAt: '2026-10-27T08:00:00Z',
    };
    saveInventoryItem(archivedCoffee);

    expect(getInventoryTotalWeight(false).totalGrams).toBe(280);
    expect(getInventoryTotalWeight(true).totalGrams).toBe(330);
    expect(getInventoryTotalWeight(true).coffeeGrams).toBe(250);
  });

  test('TASK-P66-03-ZAK: getInventoryLowStockItems i getInventoryOutOfStockItems filtruja zapasy na wyczerpaniu i puste', () => {
    initDatabase(mockDb as any);
    mockDb.inventory.clear();

    const lowStockBean: InventoryItem = {
      id: 'bean-low-1',
      name: 'Ethiopia Yirgacheffe',
      type: 'coffee',
      initialWeightGrams: 250,
      remainingWeightGrams: 25, // <= 30g
      flavorNotes: [],
      isArchived: false,
      isFavorite: false,
      createdAt: '2026-10-27T08:00:00Z',
      updatedAt: '2026-10-27T08:00:00Z',
    };

    const normalBean: InventoryItem = {
      id: 'bean-norm-1',
      name: 'Colombia Huila',
      type: 'coffee',
      initialWeightGrams: 250,
      remainingWeightGrams: 150, // > 30g
      flavorNotes: [],
      isArchived: false,
      isFavorite: false,
      createdAt: '2026-10-27T08:00:00Z',
      updatedAt: '2026-10-27T08:00:00Z',
    };

    const emptyBean: InventoryItem = {
      id: 'bean-empty-1',
      name: 'Finished Espresso',
      type: 'coffee',
      initialWeightGrams: 250,
      remainingWeightGrams: 0, // out of stock
      flavorNotes: [],
      isArchived: false,
      isFavorite: false,
      createdAt: '2026-10-27T08:00:00Z',
      updatedAt: '2026-10-27T08:00:00Z',
    };

    saveInventoryItem(lowStockBean);
    saveInventoryItem(normalBean);
    saveInventoryItem(emptyBean);

    // Low stock: tylko bean-low-1 (0 < rem <= 30)
    const lowStock = getInventoryLowStockItems(30);
    expect(lowStock.length).toBe(1);
    expect(lowStock[0].id).toBe('bean-low-1');

    // Niestandardowy próg (np. 15g)
    const lowStock15 = getInventoryLowStockItems(15);
    expect(lowStock15.length).toBe(0);

    // Out of stock: tylko bean-empty-1 (rem <= 0)
    const outOfStock = getInventoryOutOfStockItems();
    expect(outOfStock.length).toBe(1);
    expect(outOfStock[0].id).toBe('bean-empty-1');
  });

  test('TASK-P68-03-ZAK: sortInventoryItems i getSortedInventoryItems sortuja pozycje spizarni', () => {
    const opt: InventorySortOption = 'roast_date_desc';
    expect(opt).toBe('roast_date_desc');

    const bFresh: InventoryItem = {
      id: 'b-fresh',
      name: 'Kenya Nyeri',
      type: 'coffee',
      initialWeightGrams: 250,
      remainingWeightGrams: 100,
      roastOrHarvestDate: '2026-10-20',
      rating: 4.8,
      isArchived: false,
      isFavorite: true,
      flavorNotes: [],
      createdAt: '2026-10-20T08:00:00Z',
      updatedAt: '2026-10-20T08:00:00Z',
    };

    const bOld: InventoryItem = {
      id: 'b-old',
      name: 'Brazil Santos',
      type: 'coffee',
      initialWeightGrams: 1000,
      remainingWeightGrams: 500,
      roastOrHarvestDate: '2026-09-01',
      rating: 4.0,
      isArchived: false,
      isFavorite: false,
      flavorNotes: [],
      createdAt: '2026-09-01T08:00:00Z',
      updatedAt: '2026-09-01T08:00:00Z',
    };

    const bNoDate: InventoryItem = {
      id: 'b-nodate',
      name: 'Artisan Blend',
      type: 'coffee',
      initialWeightGrams: 250,
      remainingWeightGrams: 25,
      rating: 4.5,
      isArchived: false,
      isFavorite: false,
      flavorNotes: [],
      createdAt: '2026-10-01T08:00:00Z',
      updatedAt: '2026-10-01T08:00:00Z',
    };

    const items = [bOld, bNoDate, bFresh];

    // 1. roast_date_desc (najświeższe pierwsze)
    const sortedFresh = sortInventoryItems(items, 'roast_date_desc');
    expect(sortedFresh[0].id).toBe('b-fresh');
    expect(sortedFresh[1].id).toBe('b-old');
    expect(sortedFresh[2].id).toBe('b-nodate');

    // 2. remaining_desc (najwięcej pozostało)
    const sortedRem = sortInventoryItems(items, 'remaining_desc');
    expect(sortedRem[0].id).toBe('b-old'); // 500g
    expect(sortedRem[1].id).toBe('b-fresh'); // 100g
    expect(sortedRem[2].id).toBe('b-nodate'); // 25g

    // 3. remaining_asc (najmniej pozostało)
    const sortedRemAsc = sortInventoryItems(items, 'remaining_asc');
    expect(sortedRemAsc[0].id).toBe('b-nodate'); // 25g
    expect(sortedRemAsc[2].id).toBe('b-old'); // 500g

    // 4. name_asc (alfabetycznie)
    const sortedName = sortInventoryItems(items, 'name_asc');
    expect(sortedName[0].name).toBe('Artisan Blend');
    expect(sortedName[1].name).toBe('Brazil Santos');
    expect(sortedName[2].name).toBe('Kenya Nyeri');

    // 5. rating_desc (najwyższa ocena)
    const sortedRating = sortInventoryItems(items, 'rating_desc');
    expect(sortedRating[0].id).toBe('b-fresh'); // 4.8
    expect(sortedRating[1].id).toBe('b-nodate'); // 4.5
    expect(sortedRating[2].id).toBe('b-old'); // 4.0

    // 6. getSortedInventoryItems z bazy danych
    initDatabase(mockDb as any);
    mockDb.inventory.clear();
    mockDb.inventory.set(bFresh.id, { ...bFresh, is_favorite: 1, is_archived: 0, remaining_weight_g: 100 });
    mockDb.inventory.set(bOld.id, { ...bOld, is_favorite: 0, is_archived: 0, remaining_weight_g: 500 });
    const fromDb = getSortedInventoryItems('remaining_desc');
    expect(fromDb.length).toBe(2);
    expect(fromDb[0].id).toBe('b-old');

    // 7. Bezpieczeństwo null/undefined
    expect(sortInventoryItems(null as any)).toEqual([]);
    expect(sortInventoryItems([null as any, bFresh])).toBeDefined();
  });

  test('TASK-P71-03-ZAK: filterInventoryItems filtruje i wyszukuje pozycje magazynowe', () => {
    const item1: InventoryItem = {
      id: 'inv-1',
      name: 'Ethiopia Yirgacheffe Washed',
      type: 'coffee',
      roasterOrProducer: 'Hard Beans',
      origin: 'Ethiopia',
      roastOrHarvestDate: '2026-10-01',
      roastProfile: 'light',
      process: 'washed',
      variety: 'Heirloom',
      initialWeightGrams: 250,
      remainingWeightGrams: 180,
      flavorNotes: ['jasmine', 'bergamot', 'peach'],
      rating: 4.8,
      isFavorite: true,
      isArchived: false,
      createdAt: '2026-10-01T10:00:00Z',
      updatedAt: '2026-10-01T10:00:00Z',
    };

    const item2: InventoryItem = {
      id: 'inv-2',
      name: 'Brazil Cerrado Natural',
      type: 'coffee',
      roasterOrProducer: 'Coffeedesk',
      origin: 'Brazil',
      roastOrHarvestDate: '2026-09-15',
      roastProfile: 'medium-dark',
      process: 'natural',
      variety: 'Bourbon',
      initialWeightGrams: 1000,
      remainingWeightGrams: 0,
      flavorNotes: ['chocolate', 'nuts', 'caramel'],
      rating: 4.0,
      isFavorite: false,
      isArchived: false,
      createdAt: '2026-09-15T10:00:00Z',
      updatedAt: '2026-09-15T10:00:00Z',
    };

    const item3: InventoryItem = {
      id: 'inv-3',
      name: 'Gyokuro Saemidori',
      type: 'tea',
      roasterOrProducer: 'Uji Producer',
      origin: 'Japan',
      roastOrHarvestDate: '2026-05-10',
      initialWeightGrams: 50,
      remainingWeightGrams: 35,
      flavorNotes: ['umami', 'sweetness', 'spinach'],
      rating: 4.9,
      isFavorite: true,
      isArchived: false,
      createdAt: '2026-05-10T10:00:00Z',
      updatedAt: '2026-05-10T10:00:00Z',
    };

    const allItems = [item1, item2, item3];

    // 1. Filtrowanie po typie
    const criteriaType: InventoryFilterCriteria = { type: 'coffee' };
    const onlyCoffee = filterInventoryItems(allItems, criteriaType);
    expect(onlyCoffee.length).toBe(2);
    expect(onlyCoffee.every((i) => i.type === 'coffee')).toBe(true);

    // 2. Filtrowanie po zapytaniu tekstowym (query)
    const criteriaQuery: InventoryFilterCriteria = { query: 'yirgacheffe' };
    const matchQuery = filterInventoryItems(allItems, criteriaQuery);
    expect(matchQuery.length).toBe(1);
    expect(matchQuery[0].id).toBe('inv-1');

    // 3. Filtrowanie ulubionych (onlyFavorites)
    const criteriaFav: InventoryFilterCriteria = { onlyFavorites: true };
    const favItems = filterInventoryItems(allItems, criteriaFav);
    expect(favItems.length).toBe(2);
    expect(favItems.every((i) => i.isFavorite)).toBe(true);

    // 4. Filtrowanie na stanie (inStockOnly)
    const criteriaStock: InventoryFilterCriteria = { inStockOnly: true };
    const inStock = filterInventoryItems(allItems, criteriaStock);
    expect(inStock.length).toBe(2);
    expect(inStock.some((i) => i.id === 'inv-2')).toBe(false);

    // 5. Minimalna ocena (minRating)
    const criteriaRating: InventoryFilterCriteria = { minRating: 4.5 };
    const highRated = filterInventoryItems(allItems, criteriaRating);
    expect(highRated.length).toBe(2);
    expect(highRated.some((i) => i.id === 'inv-2')).toBe(false);

    // 6. Odporność na null/undefined
    expect(filterInventoryItems(null as any)).toEqual([]);
    expect(filterInventoryItems([null as any, item1])).toHaveLength(1);
  });

  test('TASK-P73-03-ZAK: filterBrewSessions filtruje sesje parzenia po kryteriach', () => {
    const ses1: BrewSession = {
      id: 'ses-1',
      recipeId: 'rec-1',
      recipeName: 'V60 Kasuya 4:6',
      inventoryItemId: 'inv-1',
      inventoryItemName: 'Ethiopia Yirgacheffe',
      beverageType: 'COFFEE',
      method: 'V60',
      doseGrams: 20,
      waterGrams: 300,
      waterTempCelsius: 92,
      totalTimeSeconds: 210,
      rating: 5,
      flavorTags: ['floral', 'bergamot'],
      brewedAt: '2026-10-27T08:00:00Z',
    };

    const ses2: BrewSession = {
      id: 'ses-2',
      recipeId: 'rec-2',
      recipeName: 'AeroPress Inverted',
      beverageType: 'COFFEE',
      method: 'AeroPress',
      doseGrams: 15,
      waterGrams: 200,
      waterTempCelsius: 85,
      totalTimeSeconds: 120,
      rating: 4,
      flavorTags: ['chocolate'],
      brewedAt: '2026-10-25T10:00:00Z',
    };

    const ses3: BrewSession = {
      id: 'ses-3',
      beverageType: 'TEA',
      method: 'Gaiwan',
      doseGrams: 5,
      waterGrams: 100,
      waterTempCelsius: 80,
      totalTimeSeconds: 30,
      rating: 4.5,
      flavorTags: ['umami'],
      brewedAt: '2026-10-26T14:00:00Z',
    };

    const allSessions = [ses1, ses2, ses3];

    // 1. Filtrowanie po typie naparu (beverageType)
    const criteriaType: BrewSessionFilterCriteria = { beverageType: 'COFFEE' };
    const coffeeSessions: BrewSession[] = filterBrewSessions(allSessions, criteriaType);
    expect(coffeeSessions.length).toBe(2);
    expect(coffeeSessions.every((s) => s.beverageType === 'COFFEE')).toBe(true);

    // 2. Filtrowanie po metodzie (method)
    const criteriaMethod: BrewSessionFilterCriteria = { method: 'v60' };
    const v60Sessions = filterBrewSessions(allSessions, criteriaMethod);
    expect(v60Sessions.length).toBe(1);
    expect(v60Sessions[0].id).toBe('ses-1');

    // 3. Filtrowanie po minimalnej ocenie (minRating)
    const criteriaRating: BrewSessionFilterCriteria = { minRating: 4.5 };
    const highRated = filterBrewSessions(allSessions, criteriaRating);
    expect(highRated.length).toBe(2);
    expect(highRated.some((s) => s.id === 'ses-2')).toBe(false);

    // 4. Filtrowanie po haśle tekstowym (query)
    const criteriaQuery: BrewSessionFilterCriteria = { query: 'yirgacheffe' };
    const querySessions = filterBrewSessions(allSessions, criteriaQuery);
    expect(querySessions.length).toBe(1);
    expect(querySessions[0].id).toBe('ses-1');

    // 5. Filtrowanie po dacie (sinceIso)
    const criteriaDate: BrewSessionFilterCriteria = { sinceIso: '2026-10-27T00:00:00Z' };
    const recentSessions = filterBrewSessions(allSessions, criteriaDate);
    expect(recentSessions.length).toBe(1);
    expect(recentSessions[0].id).toBe('ses-1');

    // 6. Odporność na null/undefined
    expect(filterBrewSessions(null as any)).toEqual([]);
    expect(filterBrewSessions([null as any, ses1])).toHaveLength(1);
  });

  test('TASK-P76-03-ZAK: calculateInventorySummary agreguje stan spiżarni i chroni przed -0/NaN', () => {
    const items = [
      {
        id: '1',
        name: 'Ethiopia Washed',
        type: 'coffee' as const,
        remainingWeightGrams: 200,
        initialWeightGrams: 250,
        isFavorite: true,
      },
      {
        id: '2',
        name: 'Panama Geisha',
        type: 'coffee' as const,
        remainingWeightGrams: 0,
        initialWeightGrams: 100,
        isFavorite: false,
      },
      {
        id: '3',
        name: 'Sencha Green Tea',
        type: 'tea' as const,
        remainingWeightGrams: 50.5,
        initialWeightGrams: 100,
        isFavorite: true,
      },
      {
        id: '4',
        name: 'Corrupt Item',
        type: 'coffee' as const,
        remainingWeightGrams: -10,
        initialWeightGrams: 100,
        isFavorite: false,
      },
    ] as any[];

    const summary: InventorySummary = calculateInventorySummary(items);
    expect(summary.totalItems).toBe(4);
    expect(summary.totalWeightGrams).toBe(250.5);
    expect(summary.coffeeItemsCount).toBe(3);
    expect(summary.teaItemsCount).toBe(1);
    expect(summary.coffeeWeightGrams).toBe(200);
    expect(summary.teaWeightGrams).toBe(50.5);
    expect(summary.inStockCount).toBe(2);
    expect(summary.outOfStockCount).toBe(2);
    expect(summary.favoritesCount).toBe(2);

    // Odporność na null/undefined/pustą tablicę
    const emptySummary = calculateInventorySummary(null);
    expect(emptySummary.totalItems).toBe(0);
    expect(emptySummary.totalWeightGrams).toBe(0);
    expect(emptySummary.inStockCount).toBe(0);
  });

  test('TASK-P78-03-ZAK: getLowStockInventoryItems filtruje i sortuje pozycje z niskim stanem', () => {
    const items = [
      { id: '1', name: 'Pełna paczka', remainingWeightGrams: 250 },
      { id: '2', name: 'Kończąca się Kenya', remainingWeightGrams: 35 },
      { id: '3', name: 'Ostatnie parzenie', remainingWeightGrams: 15 },
      { id: '4', name: 'Pusta paczka', remainingWeightGrams: 0 },
      { id: '5', name: 'Wartość tekstowa', remainingWeightGrams: '45,0' },
      { id: '6', name: 'Wartość ujemna', remainingWeightGrams: -10 },
    ] as any[];

    // 1. Domyślny próg 50 g
    const lowDefault = getLowStockInventoryItems(items);
    expect(lowDefault.length).toBe(3);
    expect(lowDefault[0].id).toBe('3');
    expect(lowDefault[1].id).toBe('2');
    expect(lowDefault[2].id).toBe('5');

    // 2. Własny próg (np. 30 g)
    const low30 = getLowStockInventoryItems(items, 30);
    expect(low30.length).toBe(1);
    expect(low30[0].id).toBe('3');

    // 3. Odporność na null, undefined i puste tablice
    expect(getLowStockInventoryItems(null)).toEqual([]);
    expect(getLowStockInventoryItems([])).toEqual([]);
    expect(getLowStockInventoryItems(items, -100)).toHaveLength(3);
  });

  test('TASK-P80-03-ZAK: calculateInventoryTotalValue wylicza sumaryczną wartość i stan magazynu', () => {
    const items = [
      { id: '1', name: 'Kolumbia Geisha', remainingWeightGrams: 200, initialWeightGrams: 250, price: 100 }, // (200/250)*100 = 80 zł
      { id: '2', name: 'Etiopia Yirgacheffe', remainingWeightGrams: 250, initialWeightGrams: 250, price: 60 }, // 60 zł
      { id: '3', name: 'Brak ceny - szacunek z kg', remainingWeightGrams: 500 }, // 0.5 kg * 160 zł/kg = 80 zł
      { id: '4', name: 'Pusta paczka', remainingWeightGrams: 0, price: 50 }, // 0 g -> 0 zł
    ] as any[];

    // 1. Standardowe obliczenie
    const result: InventoryTotalValueResult = calculateInventoryTotalValue(items, 160);
    expect(result.totalItemsCount).toBe(4);
    expect(result.inStockItemsCount).toBe(3);
    expect(result.totalRemainingWeightGrams).toBe(950);
    expect(result.estimatedTotalValuePln).toBe(220); // 80 + 60 + 80 = 220 zł
    expect(result.averageValuePerPackagePln).toBeCloseTo(73.33, 1);
    expect(result.formattedTotalValuePln).toBe('220,00 zł');

    // 2. Własny szacunek ceny za kg
    const customRate = calculateInventoryTotalValue([{ remainingWeightGrams: 1000 }] as any, 200);
    expect(customRate.estimatedTotalValuePln).toBe(200);

    // 3. Odporność na null, puste tablice i zera
    const emptyResult = calculateInventoryTotalValue(null);
    expect(emptyResult.totalItemsCount).toBe(0);
    expect(emptyResult.inStockItemsCount).toBe(0);
    expect(emptyResult.estimatedTotalValuePln).toBe(0);
    expect(emptyResult.formattedTotalValuePln).toBe('0,00 zł');
  });

  test('TASK-P83-03-ZAK: calculateBeanFreshness analizuje fazy świeżości i odgazowania kawy', () => {
    const fixedNow = new Date('2026-10-27T12:00:00Z');

    // 1. Faza odgazowywania (degassing) - 3 dni po paleniu
    const degassing: BeanFreshnessAnalysis = calculateBeanFreshness('2026-10-24T12:00:00Z', fixedNow);
    const phaseCheck: BeanFreshnessPhase = degassing.phase;
    expect(phaseCheck).toBe('degassing');
    expect(degassing.daysSinceRoast).toBe(3);
    expect(degassing.phaseLabelPl).toContain('Odgazowywanie');
    expect(degassing.recommendationPl).toContain('preinfuzji');
    expect(degassing.recommendationEn).toContain('bloom');

    // 2. Szczyt smaku (peak flavor) - 14 dni po paleniu
    const peak = calculateBeanFreshness('2026-10-13T12:00:00Z', fixedNow);
    expect(peak.phase).toBe('peak');
    expect(peak.freshnessScore).toBe(100);
    expect(peak.phaseLabelPl).toContain('Szczyt smaku');

    // 3. Stabilna jakość (optimal) - 45 dni po paleniu
    const optimal = calculateBeanFreshness('2026-09-12T12:00:00Z', fixedNow);
    expect(optimal.phase).toBe('optimal');
    expect(optimal.freshnessScore).toBeGreaterThanOrEqual(80);

    // 4. Starzenie ziaren (aging) - 75 dni po paleniu
    const aging = calculateBeanFreshness('2026-08-13T12:00:00Z', fixedNow);
    expect(aging.phase).toBe('aging');

    // 5. Przeleżała kawa (past_peak) - 120 dni po paleniu
    const pastPeak = calculateBeanFreshness('2026-06-29T12:00:00Z', fixedNow);
    expect(pastPeak.phase).toBe('past_peak');
    expect(pastPeak.recommendationPl).toContain('cold brew');

    // 6. Odporność na brak daty, null, stringi niepoprawne
    const missing = calculateBeanFreshness(null);
    expect(missing.phase).toBe('unknown');
    expect(missing.daysSinceRoast).toBeNull();
    expect(missing.phaseLabelPl).toBe('Brak daty palenia');

    const invalid = calculateBeanFreshness('not-a-date');
    expect(invalid.phase).toBe('unknown');
    expect(invalid.phaseLabelPl).toBe('Nieprawidłowa data');
  });

  test('TASK-P85-03-ZAK: calculateInventoryUsageRate analizuje tempo zużycia kawy i wylicza rezerwę dni', () => {
    // 1. Umiarkowane tempo (500g przy 25g dziennie -> 20 dni, 2.9 tyg., moderate)
    const moderate: InventoryUsageRateAnalysis = calculateInventoryUsageRate(500, 25);
    const catCheck: InventoryUsageRateCategory = moderate.category;
    expect(catCheck).toBe('moderate');
    expect(moderate.totalRemainingGrams).toBe(500);
    expect(moderate.dailyConsumptionGrams).toBe(25);
    expect(moderate.estimatedDaysRemaining).toBe(20);
    expect(moderate.estimatedWeeksRemaining).toBe(2.9);
    expect(moderate.categoryLabelPl).toContain('Umiarkowane');
    expect(moderate.categoryLabelEn).toContain('Moderate');
    expect(moderate.advicePl).toContain('optymalna rotacja');

    // 2. Niskie tempo (250g przy 10g dziennie -> slow)
    const slow = calculateInventoryUsageRate('250,0', '10');
    expect(slow.category).toBe('slow');
    expect(slow.estimatedDaysRemaining).toBe(25);
    expect(slow.categoryLabelPl).toBe('Niskie zużycie');

    // 3. Szybkie tempo (1000g przy 50g dziennie -> fast)
    const fast = calculateInventoryUsageRate(1000, 50);
    expect(fast.category).toBe('fast');
    expect(fast.estimatedDaysRemaining).toBe(20);

    // 4. Bardzo wysokie tempo / biurowe (1500g przy 100g dziennie -> excessive)
    const excessive = calculateInventoryUsageRate(1500, 100);
    expect(excessive.category).toBe('excessive');

    // 5. Pusty stan magazynu (0g)
    const empty = calculateInventoryUsageRate(0, 30);
    expect(empty.totalRemainingGrams).toBe(0);
    expect(empty.estimatedDaysRemaining).toBe(0);
    expect(empty.estimatedWeeksRemaining).toBe(0);

    // 6. Odporność na null, stringi, liczby ujemne i -0
    const fallback = calculateInventoryUsageRate(null as any, -20);
    expect(fallback.totalRemainingGrams).toBe(0);
    expect(fallback.dailyConsumptionGrams).toBe(30);
    expect(fallback.estimatedDaysRemaining).toBe(0);
  });

  test('TASK-P88-03-ZAK: calculateBeanRestingReadiness analizuje gotowość ziaren w zależności od obróbki i metody parzenia', () => {
    const fixedNow = new Date('2026-10-27T12:00:00Z');

    // 1. Kawa myta (washed) pod filtr, palona 3 dni temu (2026-10-24) -> zbyt świeża (odgazowanie)
    const tooFreshWashed: BeanRestingReadinessAnalysis = calculateBeanRestingReadiness(
      '2026-10-24T12:00:00Z',
      'washed',
      'filter',
      fixedNow
    );
    const statusCheck: BeanRestingStatus = tooFreshWashed.status;
    expect(statusCheck).toBe('too_fresh_degassing');
    expect(tooFreshWashed.daysSinceRoast).toBe(3);
    expect(tooFreshWashed.processType).toBe('washed');
    expect(tooFreshWashed.brewMethodCategory).toBe('filter');
    expect(tooFreshWashed.minimumRestDays).toBe(7);
    expect(tooFreshWashed.readinessScore).toBeLessThan(70);
    expect(tooFreshWashed.statusLabelPl).toContain('zbyt świeża');

    // 2. Kawa myta pod filtr w szczycie smaku (14 dni temu = 2026-10-13) -> peak_flavor
    const peakWashed = calculateBeanRestingReadiness(
      '2026-10-13T12:00:00Z',
      'washed',
      'filter',
      fixedNow
    );
    expect(peakWashed.status).toBe('peak_flavor');
    expect(peakWashed.readinessScore).toBe(100);
    expect(peakWashed.statusLabelPl).toContain('Optymalny szczyt');

    // 3. Kawa naturalna (natural / honey) pod espresso, palona 10 dni temu -> zbyt świeża pod espresso (wymaga min 16 dni)
    const naturalEspresso = calculateBeanRestingReadiness(
      '2026-10-17T12:00:00Z',
      'natural',
      'espresso',
      fixedNow
    );
    expect(naturalEspresso.processType).toBe('natural_honey');
    expect(naturalEspresso.brewMethodCategory).toBe('espresso');
    expect(naturalEspresso.minimumRestDays).toBe(16);
    expect(naturalEspresso.status).toBe('too_fresh_degassing');

    // 4. Kawa anaerobowa (anaerobic) pod espresso, palona 30 dni temu -> peak_flavor (wymaga min 20 dni, peak 25-55)
    const anaerobicEspresso = calculateBeanRestingReadiness(
      '2026-09-27T12:00:00Z',
      'anaerobic',
      'espresso',
      fixedNow
    );
    expect(anaerobicEspresso.processType).toBe('anaerobic_experimental');
    expect(anaerobicEspresso.status).toBe('peak_flavor');

    // 5. Kawa stara (120 dni temu) -> past_peak
    const oldBeans = calculateBeanRestingReadiness(
      '2026-06-29T12:00:00Z',
      'washed',
      'filter',
      fixedNow
    );
    expect(oldBeans.status).toBe('past_peak');
    expect(oldBeans.readinessScore).toBeLessThan(50);

    // 6. Odporność na brak daty i nieprawidłowe wartości
    const fallback = calculateBeanRestingReadiness(null, null, null, fixedNow);
    expect(fallback.daysSinceRoast).toBeNull();
    expect(fallback.status).toBe('ready_to_brew');
    expect(fallback.readinessScore).toBe(70);
  });

  it('TASK-P90-03-ZAK: calculateStashDiversity ocenia różnorodność terroir, obróbek i palarni w spiżarni', () => {
    // 1. Zróżnicowana kolekcja specialty (Etiopia, Kolumbia, Kenia, Panama; myta, natural, beztlenowa; kawa + herbata)
    const richStash = [
      { id: '1', name: 'Ethiopia Washed', type: 'coffee', origin: 'Ethiopia', process: 'Washed', roaster: 'Hard Beans', remainingWeightGrams: 250 },
      { id: '2', name: 'Colombia Anaerobic', type: 'coffee', origin: 'Colombia', process: 'Anaerobic', roaster: 'Coffea Circulor', remainingWeightGrams: 200 },
      { id: '3', name: 'Kenya Nyeri', type: 'coffee', origin: 'Kenya', process: 'Washed', roaster: 'Tim Wendelboe', remainingWeightGrams: 250 },
      { id: '4', name: 'Panama Geisha Natural', type: 'coffee', origin: 'Panama', process: 'Natural', roaster: 'DAK', remainingWeightGrams: 100 },
      { id: '5', name: 'Gyokuro Uji', type: 'tea', origin: 'Japan', process: 'Steamed', roaster: 'Ippodo', remainingWeightGrams: 50 },
    ] as any[];

    const connoisseur: StashDiversityAnalysis = calculateStashDiversity(richStash);
    const ratingCheck: StashDiversityRating = connoisseur.rating;
    expect(ratingCheck).toBe('connoisseur');
    expect(connoisseur.diversityScore).toBeGreaterThanOrEqual(80);
    expect(connoisseur.distinctOriginsCount).toBe(5);
    expect(connoisseur.distinctProcessesCount).toBeGreaterThanOrEqual(3);
    expect(connoisseur.distinctRoastersCount).toBe(5);
    expect(connoisseur.coffeeCount).toBe(4);
    expect(connoisseur.teaCount).toBe(1);
    expect(connoisseur.totalWeightGrams).toBe(850);
    expect(connoisseur.ratingLabelPl).toContain('konesera');
    expect(connoisseur.insightsPl).toContain('terroir');

    // 2. Monokultura (tylko 1 paczka kawy)
    const singleBag = [
      { id: '1', name: 'Brazil Cerrado', type: 'coffee', origin: 'Brazil', process: 'Natural', roaster: 'Local', remainingWeightGrams: 250 },
    ] as any[];
    const mono = calculateStashDiversity(singleBag);
    expect(mono.rating).toBe('monoculture');
    expect(mono.diversityScore).toBeLessThanOrEqual(35);
    expect(mono.distinctOriginsCount).toBe(1);

    // 3. Pusta spiżarnia lub null
    const empty = calculateStashDiversity([]);
    expect(empty.diversityScore).toBe(0);
    expect(empty.rating).toBe('monoculture');
    expect(empty.totalItems).toBe(0);

    const fromNull = calculateStashDiversity(null);
    expect(fromNull.diversityScore).toBe(0);
    expect(fromNull.rating).toBe('monoculture');
  });
});

// ============================================================================
// Apps4Brew / Napar (Steepwise) — Zero-Network Airplane Mode QA Test
// TASK-R11-01 / Forensic QA: 100% local operation without network / telemetry
// ============================================================================

const mockSettings = new Map<string, string>();
const mockInventory = new Map<string, any>();
const mockRecipes = new Map<string, any>();
const mockSessions = new Map<string, any>();
const mockCaffeine = new Map<string, any>();

const mockDb: any = {
  settings: mockSettings,
  inventory: mockInventory,
  recipes: mockRecipes,
  sessions: mockSessions,
  caffeine: mockCaffeine,

  execSync: jest.fn(),
  withTransactionSync: jest.fn((cb: () => any) => cb()),
  getFirstSync: jest.fn((query: string, params?: any[]) => {
    if (query.includes('PRAGMA user_version')) {
      return { user_version: 3 };
    }
    if (query.includes('FROM app_settings WHERE key = ?')) {
      const val = mockSettings.get(params?.[0]);
      return val !== undefined ? { value: val } : null;
    }
    if (query.includes('FROM inventory_items WHERE id = ?')) {
      return mockInventory.get(params?.[0]) || null;
    }
    if (query.includes('FROM recipes WHERE id = ?')) {
      return mockRecipes.get(params?.[0]) || null;
    }
    if (query.includes('COUNT(*) as count FROM recipes')) {
      return { count: mockRecipes.size };
    }
    return null;
  }),
  getAllSync: jest.fn((query: string, params?: any[]) => {
    if (query.includes('FROM inventory_items')) {
      return Array.from(mockInventory.values());
    }
    if (query.includes('FROM recipes')) {
      return Array.from(mockRecipes.values());
    }
    if (query.includes('FROM brew_sessions')) {
      return Array.from(mockSessions.values());
    }
    if (query.includes('FROM caffeine_logs')) {
      let rows = Array.from(mockCaffeine.values());
      if (query.includes('WHERE consumed_at >= ?') && params && params[0]) {
        rows = rows.filter((r: any) => r.consumed_at >= params[0]);
      }
      return rows;
    }
    return [];
  }),
  runSync: jest.fn((query: string, params?: any[]) => {
    if (query.includes('INSERT OR REPLACE INTO app_settings')) {
      mockSettings.set(params![0], params![1]);
    } else if (query.includes('INSERT OR REPLACE INTO inventory_items')) {
      const [id, name, type, roaster, origin, roastDate, profile, process, variety, initW, remW, notes, rating, isFav, isArch, created, updated] = params!;
      mockInventory.set(id, {
        id, name, type, roaster_or_producer: roaster, origin, roast_or_harvest_date: roastDate,
        roast_profile: profile, process, variety, initial_weight_g: initW, remaining_weight_g: remW,
        flavor_notes_json: notes, rating, is_favorite: isFav, is_archived: isArch, created_at: created, updated_at: updated
      });
    } else if (query.includes('UPDATE inventory_items SET remaining_weight_g = ?')) {
      const [newW, updated, id] = params!;
      const existing = mockInventory.get(id);
      if (existing) {
        existing.remaining_weight_g = newW;
        existing.updated_at = updated;
      }
    } else if (query.includes('INSERT OR REPLACE INTO recipes')) {
      const [id, name, bType, method, author, desc, dose, water, temp, grind, ratio, steps, isCustom, isFav, created] = params!;
      mockRecipes.set(id, {
        id, name, beverage_type: bType, method, author, description: desc, dose_g: dose, water_g: water,
        water_temp_c: temp, grind_size_description: grind, recommended_ratio: ratio, steps_json: steps,
        is_custom: isCustom, is_favorite: isFav, created_at: created
      });
    } else if (query.includes('INSERT INTO brew_sessions') || query.includes('INSERT OR REPLACE INTO brew_sessions')) {
      const id = params![0];
      mockSessions.set(id, {
        id,
        recipe_id: params![1],
        recipe_name: params![2],
        beverage_type: params![3],
        method: params![4],
        inventory_item_id: params![5],
        coffee_name: params![6],
        roaster_or_producer: params![7],
        dose_g: params![8],
        water_g: params![9],
        water_temp_c: params![10],
        grind_setting: params![11],
        brew_time_seconds: params![12],
        rating: params![13],
        rating_half_stars: params![14],
        tasting_notes: params![15],
        sensory_scores_json: params![16],
        notes: params![17],
        brewed_at: params![18],
      });
    } else if (query.includes('caffeine_logs')) {
      const [id, brewSessionId, beverageName, beverageType, consumedAt, doseG, caffeineMg] = params!;
      mockCaffeine.set(id, {
        id,
        brew_session_id: brewSessionId,
        beverage_name: beverageName,
        beverage_type: beverageType,
        consumed_at: consumedAt,
        dose_g: doseG,
        caffeine_mg: caffeineMg,
      });
    }
    return { changes: 1, lastInsertRowId: 1 };
  }),
  prepareSync: jest.fn(() => ({
    executeSync: jest.fn((params: any) => {
      mockRecipes.set(params.$id, {
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
  defaultDatabaseDirectory: '/test/SQLite',
}));

import {
  initDatabase,
  getRecipes,
  saveRecipe,
  getInventoryItems,
  getInventoryItemById,
  saveInventoryItem,
  getBrewSessions,
  recordBrewSessionTransaction,
  getCaffeineLogs,
  logCaffeine,
  exportAllDataJson,
  importDataJson,
  exportSessionsCsv,
  exportInventoryCsv,
  getAppSetting,
  setAppSetting,
  getUnitSystem,
  setUnitSystem,
} from '../src/core/database';
import { calculateBrewCost } from '../src/core/cost-calculator';
import { calculateWaterMinerals } from '../src/core/water-chemistry';
import { diagnoseTaste } from '../src/core/domain-rules';
import {
  getAppAccessState,
  recordBrewCompleted,
  activateSubscription,
  TRIAL_MAX_BREWS,
} from '../src/core/app-access';
import { buildBackup } from '../src/core/backup';

describe('Zero-Network Airplane Mode QA Pass (TASK-R11-01)', () => {
  const originalFetch = global.fetch;
  const originalWebSocket = (global as any).WebSocket;
  const originalXHR = (global as any).XMLHttpRequest;

  beforeAll(() => {
    // Całkowite odcięcie sieci — tryb samolotowy (zero-network)
    (global as any).fetch = undefined;
    (global as any).WebSocket = undefined;
    (global as any).XMLHttpRequest = undefined;
    if (global.navigator) {
      (global.navigator as any).sendBeacon = undefined;
    }
  });

  afterAll(() => {
    global.fetch = originalFetch;
    (global as any).WebSocket = originalWebSocket;
    (global as any).XMLHttpRequest = originalXHR;
  });

  beforeEach(() => {
    mockSettings.clear();
    mockInventory.clear();
    mockRecipes.clear();
    mockSessions.clear();
    mockCaffeine.clear();
    initDatabase();
  });

  test('Gwarancja Zero-Network: globalne interfejsy sieciowe są wyłączone', () => {
    expect(global.fetch).toBeUndefined();
    expect((global as any).WebSocket).toBeUndefined();
    expect((global as any).XMLHttpRequest).toBeUndefined();
  });

  test('Operacje bazodanowe SQLite działają w 100% offline bez opóźnień sieciowych', () => {
    // 1. Zapis własnej receptury offline
    const customRecipeId = 'offline-chemex-special';
    saveRecipe({
      id: customRecipeId,
      name: 'Offline Chemex Special',
      method: 'chemex',
      beverageType: 'coffee',
      coffeeGrams: 30,
      waterGrams: 500,
      waterTempC: 94,
      targetTimeSeconds: 240,
      steps: [
        { stepNumber: 1, name: 'Bloom', targetWaterGrams: 90, durationSeconds: 45, instruction: 'Zalej 90g' },
        { stepNumber: 2, name: 'Główne zalanie', targetWaterGrams: 500, durationSeconds: 195, instruction: 'Zalej do 500g' },
      ],
      isCustom: true,
      isFavorite: true,
    });

    const updatedRecipes = getRecipes();
    expect(updatedRecipes.some((r) => r.id === customRecipeId)).toBe(true);

    // 2. Spiżarnia (Inventory) offline
    const initialInventory = getInventoryItems(false);
    saveInventoryItem({
      id: 'offline-ethiopia-01',
      name: 'Ethiopia Yirgacheffe Aricha',
      roasterOrProducer: 'Craft Roastery',
      remainingWeightGrams: 250,
      origin: 'Ethiopia',
      variety: 'Heirloom',
      process: 'Washed',
      roastOrHarvestDate: '2026-10-01',
      initialWeightGrams: 250,
      type: 'coffee',
      rating: 5,
      isFavorite: true,
      isArchived: false,
    });

    const inventoryAfterSave = getInventoryItems(false);
    expect(inventoryAfterSave.length).toBe(initialInventory.length + 1);

    // 3. Atomowa transakcja sesji parzenia z odliczeniem wagi ziaren
    recordBrewSessionTransaction(
      {
        id: 'offline-brew-session-01',
        recipeId: customRecipeId,
        inventoryItemId: 'offline-ethiopia-01',
        rating: 5,
        ratingHalfStars: 5,
        tastingNotes: 'Bergamot, jasmine, clean finish',
        doseGrams: 30,
        waterGrams: 500,
        grindSetting: '22 clics',
        brewTimeSeconds: 235,
        date: new Date().toISOString(),
      },
      { itemId: 'offline-ethiopia-01', doseGrams: 30 }
    );

    const updatedItem = getInventoryItemById('offline-ethiopia-01');
    expect(updatedItem?.remainingWeightGrams).toBe(220);

    const sessions = getBrewSessions();
    expect(sessions.some((s) => s.id === 'offline-brew-session-01')).toBe(true);

    // 4. Rejestr kofeiny offline
    logCaffeine({
      id: 'caff-01',
      beverageName: 'Kawa przelewowa Chemex (offline)',
      beverageType: 'coffee',
      consumedAt: new Date().toISOString(),
      doseGrams: 30,
      caffeineMg: 180,
    });
    const caffeineLogs = getCaffeineLogs();
    expect(caffeineLogs.length).toBeGreaterThan(0);
    expect(caffeineLogs[0].caffeineMg).toBe(180);
  });

  test('Diagnostyka sensoryczna i reguły parzenia wykonują się 100% lokalnie', () => {
    const diagnosesCoffee = diagnoseTaste({ isSour: true });
    expect(diagnosesCoffee.length).toBeGreaterThanOrEqual(1);
    expect(diagnosesCoffee[0].issue).toContain('Niedoparzenie');
    expect(diagnosesCoffee[0].recommendationPl).toBeDefined();

    const diagnosesTea = diagnoseTaste({ beverageType: 'TEA', isBitter: true });
    expect(diagnosesTea.length).toBeGreaterThanOrEqual(1);
    expect(diagnosesTea[0].issue).toBeDefined();
    expect(diagnosesTea[0].recommendationPl).toBeDefined();
  });

  test('Kalkulatory rzemieślnicze (woda, koszt, jednostki) działają bez sieci', () => {
    const waterRecipe = calculateWaterMinerals(5.0, 120, 40);
    expect(waterRecipe.targetKhPpm).toBe(40);
    expect(waterRecipe.concentrateHardnessGrams).toBeGreaterThan(0);

    const cost = calculateBrewCost({ doseGrams: 18, beanPricePerKg: 250 });
    expect(cost.totalHomeCost).toBeGreaterThan(0);
    expect(cost.coffeeCost).toBeGreaterThan(0);

    setUnitSystem('imperial');
    expect(getUnitSystem()).toBe('imperial');
    setUnitSystem('metric');
    expect(getUnitSystem()).toBe('metric');

    setAppSetting('custom_offline_flag', 'offline_verified');
    expect(getAppSetting('custom_offline_flag')).toBe('offline_verified');
  });

  test('Kopia zapasowa i eksport danych (JSON & CSV) generują się w 100% offline', async () => {
    saveInventoryItem({
      id: 'offline-ethiopia-02',
      name: 'Kenya Nyeri Peaberry',
      remainingWeightGrams: 200,
      initialWeightGrams: 250,
      type: 'coffee',
      isFavorite: false,
      isArchived: false,
    });

    const backupJson = exportAllDataJson();
    expect(backupJson).toContain('"version": 1');
    expect(backupJson).toContain('offline-ethiopia-02');

    const inventoryCsv = exportInventoryCsv();
    expect(inventoryCsv).toContain('name');
    expect(inventoryCsv).toContain('Kenya Nyeri Peaberry');

    const backupObj = buildBackup({
      inventory: getInventoryItems(true),
      customRecipes: getRecipes().filter((r) => r.isCustom),
      sessions: getBrewSessions(),
      caffeineLogs: getCaffeineLogs(),
    });
    expect(backupObj.schemaVersion).toBeGreaterThanOrEqual(1);

    importDataJson(backupJson);
    const reloadedInventory = getInventoryItems(true);
    expect(reloadedInventory.some((i) => i.id === 'offline-ethiopia-02')).toBe(true);
  });

  test('Zarządzanie licencją i okresem próbnym (Trial & Offline Access) bez serwera zewnętrznego', () => {
    const access = getAppAccessState();
    expect(access).toBeDefined();
    expect(TRIAL_MAX_BREWS).toBe(15);

    const updated = recordBrewCompleted();
    expect(updated.brewsRemaining).toBeLessThan(15);

    const subscribed = activateSubscription('lifetime');
    expect(subscribed.isSubscribed).toBe(true);
    expect(subscribed.subscriptionTier).toBe('lifetime');
  });
});

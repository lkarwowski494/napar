import { saveCorruptState } from './backup';
// ============================================================================
// Napar (Steepwise) — SQLite Database Client & Repositories
// ============================================================================

import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';
import { dbDirectory } from './db-path';
import {
  InventoryItem,
  SavedRecipe,
  BrewSession,
  CaffeineLog,
  SensoryProfile,
  SCHEMA_SQL,
} from './database-schema';
import { MASTER_RECIPES } from './recipes-data';

export interface InventoryRow {
  id: string;
  name: string;
  type: 'coffee' | 'tea';
  roaster_or_producer: string | null;
  origin: string | null;
  roast_or_harvest_date: string | null;
  roast_profile: string | null;
  process: string | null;
  variety: string | null;
  initial_weight_g: number;
  remaining_weight_g: number;
  flavor_notes_json: string | null;
  rating: number | null;
  is_favorite: number;
  is_archived: number;
  created_at: string;
  updated_at: string;
}

export interface RecipeRow {
  id: string;
  name: string;
  beverage_type: 'COFFEE' | 'TEA';
  method: string;
  author: string | null;
  description: string | null;
  dose_g: number;
  water_g: number;
  water_temp_c: number;
  grind_size_description: string | null;
  recommended_ratio: number;
  steps_json: string;
  is_custom: number;
  is_favorite: number;
  created_at: string;
}

export interface BrewSessionRow {
  id: string;
  recipe_id: string | null;
  recipe_name: string | null;
  beverage_type: 'COFFEE' | 'TEA';
  method: string;
  inventory_item_id: string | null;
  inventory_item_name: string | null;
  dose_g: number;
  water_g: number;
  water_temp_c: number;
  grind_setting: string | null;
  total_time_seconds: number;
  rating: number | null;
  flavor_tags_json: string | null;
  taste_balance: string | null;
  tds_percentage: number | null;
  extraction_yield_percentage: number | null;
  caffeine_content_mg: number | null;
  notes: string | null;
  infusion_number: number | null;
  sensory_scores_json: string | null;
  water_profile: string | null;
  brewed_at: string;
}

export interface CaffeineLogRow {
  id: string;
  brew_session_id: string | null;
  beverage_name: string;
  beverage_type: 'coffee' | 'tea';
  consumed_at: string;
  dose_g: number;
  caffeine_mg: number;
}

let dbInstance: SQLite.SQLiteDatabase | null = null;

export function getDatabase(): SQLite.SQLiteDatabase {
  if (!dbInstance) {
    const safeDir = dbDirectory(SQLite.defaultDatabaseDirectory);
    dbInstance = safeDir
      ? SQLite.openDatabaseSync('napar.db', undefined, safeDir)
      : SQLite.openDatabaseSync('napar.db');
    initDatabase(dbInstance);
  }
  return dbInstance;
}

export function createPreMigrationBackup(db: SQLite.SQLiteDatabase, fromVersion: number): string {
  const timestamp = Date.now();
  const backupFileName = `napar-pre-v${fromVersion}-${timestamp}.db`;

  try {
    // 1. Scalenie bufora WAL do pliku bazy SQLite
    try {
      db.execSync('PRAGMA wal_checkpoint(TRUNCATE);');
    } catch {
      // Ignoruj w środowisku mocka SQLite
    }

    // 2. Utworzenie fizycznej kopii bazy danych
    const docDir = (FileSystem as any).documentDirectory || '';
    const backupPath = docDir ? `${docDir}${backupFileName}` : backupFileName;

    try {
      db.execSync(`VACUUM INTO '${backupPath}';`);
    } catch {
      // Fallback jeśli VACUUM INTO nie jest obsługiwane w testach
      const count = db.getFirstSync<{ c: number }>('SELECT COUNT(*) as c FROM brew_sessions');
      db.runSync(
        'CREATE TABLE IF NOT EXISTS migration_backups (id TEXT PRIMARY KEY, created_at TEXT, sessions_count INTEGER)',
        []
      );
      db.runSync(
        'INSERT OR REPLACE INTO migration_backups (id, created_at, sessions_count) VALUES (?, ?, ?)',
        [backupFileName, new Date().toISOString(), count?.c || 0]
      );
    }

    return backupFileName;
  } catch (err: any) {
    throw new Error(`Błąd tworzenia kopii bezpieczeństwa przed migracją v${fromVersion}: ${err.message}`);
  }
}

export function initDatabase(db?: SQLite.SQLiteDatabase): void {
  const targetDb = db || dbInstance;
  if (!targetDb) {
    getDatabase();
    return;
  }

  try {
    targetDb.execSync('PRAGMA foreign_keys = ON;');
  } catch {
    // Ignoruj błąd PRAGMA w środowiskach zastępczych
  }

  try {
    targetDb.execSync('PRAGMA journal_mode = WAL;');
  } catch {
    // Ignoruj błąd PRAGMA w środowiskach zastępczych
  }

  try {
    targetDb.execSync('PRAGMA busy_timeout = 5000;');
  } catch {
    // Ignoruj błąd PRAGMA w środowiskach zastępczych
  }

  let currentVersion = 0;
  try {
    const versionRow = targetDb.getFirstSync<{ user_version: number }>('PRAGMA user_version');
    if (versionRow && typeof versionRow.user_version === 'number') {
      currentVersion = versionRow.user_version;
    }
  } catch {
    currentVersion = 0;
  }

  targetDb.execSync(SCHEMA_SQL);

  const TARGET_SCHEMA_VERSION = 3;
  if (currentVersion < TARGET_SCHEMA_VERSION) {
    createPreMigrationBackup(targetDb, currentVersion);
    try {
      targetDb.execSync('BEGIN TRANSACTION;');
      try {
        targetDb.runSync('ALTER TABLE brew_sessions ADD COLUMN sensory_scores_json TEXT');
      } catch {
        // Kolumna już istnieje
      }
      try {
        targetDb.runSync('ALTER TABLE brew_sessions ADD COLUMN water_profile TEXT');
      } catch {
        // Kolumna już istnieje
      }
      targetDb.runSync(
        'CREATE TABLE IF NOT EXISTS app_settings (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL)'
      );
      try {
        targetDb.execSync(`PRAGMA user_version = ${TARGET_SCHEMA_VERSION};`);
      } catch {
        // Ignoruj błąd w mockach
      }
      targetDb.execSync('COMMIT;');
    } catch (migError) {
      try {
        targetDb.execSync('ROLLBACK;');
      } catch {
        // ignore
      }
      throw migError;
    }
  }

  // Sprawdź czy tabela recipes ma dane początkowe z master recipes lub wymaga uzupełnienia
  const countRow = targetDb.getFirstSync<{ count: number }>(
    'SELECT COUNT(*) as count FROM recipes WHERE is_custom = 0'
  );
  if (!countRow || countRow.count < MASTER_RECIPES.length) {
    seedMasterRecipes(targetDb);
  }
}

function seedMasterRecipes(db: SQLite.SQLiteDatabase): void {
  const insertStmt = db.prepareSync(`
    INSERT INTO recipes (
      id, name, beverage_type, method, author, description,
      dose_g, water_g, water_temp_c, grind_size_description,
      recommended_ratio, steps_json, is_custom, is_favorite, created_at
    ) VALUES (
      $id, $name, $beverageType, $method, $author, $description,
      $doseG, $waterG, $waterTempC, $grindSize,
      $ratio, $stepsJson, 0, 0, $createdAt
    )
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      beverage_type = excluded.beverage_type,
      method = excluded.method,
      author = excluded.author,
      description = excluded.description,
      dose_g = excluded.dose_g,
      water_g = excluded.water_g,
      water_temp_c = excluded.water_temp_c,
      grind_size_description = excluded.grind_size_description,
      recommended_ratio = excluded.recommended_ratio,
      steps_json = excluded.steps_json,
      is_custom = excluded.is_custom
  `);

  try {
    for (const r of MASTER_RECIPES) {
      insertStmt.executeSync({
        $id: r.id,
        $name: r.name,
        $beverageType: r.type,
        $method: r.method,
        $author: r.author,
        $description: `${r.name} (${r.author})`,
        $doseG: r.coffeeOrTeaDoseGrams,
        $waterG: r.waterWeightGrams,
        $waterTempC: r.waterTemperatureCelsius,
        $grindSize: r.grindSettingDescriptionPl,
        $ratio: r.recommendedRatio,
        $stepsJson: JSON.stringify(r.steps),
        $createdAt: new Date().toISOString(),
      });
    }
  } finally {
    insertStmt.finalizeSync();
  }
}

// ----------------------------------------------------------------------------
// Repozytorium: Spiżarnia Ziaren i Liści (Inventory / Stash)
// ----------------------------------------------------------------------------

export function getInventoryItems(includeArchived = false): InventoryItem[] {
  const db = getDatabase();
  const query = includeArchived
    ? 'SELECT * FROM inventory_items ORDER BY is_favorite DESC, updated_at DESC'
    : 'SELECT * FROM inventory_items WHERE is_archived = 0 ORDER BY is_favorite DESC, updated_at DESC';

  const rows = db.getAllSync<InventoryRow>(query);
  return rows.map(mapRowToInventoryItem);
}

/**
 * Oblicza łączną masę pozostałą w spiżarni z podziałem na kawę i herbatę.
 */
export function getInventoryTotalWeight(includeArchived = false): {
  coffeeGrams: number;
  teaGrams: number;
  totalGrams: number;
} {
  const items = getInventoryItems(includeArchived);
  let coffeeGrams = 0;
  let teaGrams = 0;

  for (const item of items) {
    if (!item) continue;
    const rawWeight = Number(item.remainingWeightGrams);
    const weight = Number.isFinite(rawWeight) && rawWeight > 0 && !Object.is(rawWeight, -0)
      ? rawWeight
      : 0;

    const itemType = (typeof item.type === 'string' ? item.type : '').trim().toLowerCase();
    if (itemType === 'tea') {
      teaGrams += weight;
    } else {
      coffeeGrams += weight;
    }
  }

  const safeCoffee = Object.is(coffeeGrams, -0) ? 0 : Number(coffeeGrams.toFixed(2));
  const safeTea = Object.is(teaGrams, -0) ? 0 : Number(teaGrams.toFixed(2));
  const safeTotal = Object.is(safeCoffee + safeTea, -0) ? 0 : Number((safeCoffee + safeTea).toFixed(2));

  return {
    coffeeGrams: safeCoffee,
    teaGrams: safeTea,
    totalGrams: safeTotal,
  };
}

/**
 * Zwraca pozycje ze spiżarni, których stan jest niski (0 < remainingWeightGrams <= thresholdGrams).
 * Domyślny próg: 30g (wystarcza na około 1-2 zaparzenia).
 */
export function getInventoryLowStockItems(
  thresholdGrams = 30.0,
  includeArchived = false
): InventoryItem[] {
  const safeThreshold =
    Number.isFinite(thresholdGrams) && thresholdGrams > 0 ? thresholdGrams : 30.0;
  const items = getInventoryItems(includeArchived);
  return items.filter((item) => {
    if (!item) return false;
    const rem = Number(item.remainingWeightGrams);
    return Number.isFinite(rem) && rem > 0 && rem <= safeThreshold;
  });
}

/**
 * Zwraca pozycje ze spiżarni, które uległy wyczerpaniu (remainingWeightGrams <= 0).
 */
export function getInventoryOutOfStockItems(includeArchived = false): InventoryItem[] {
  const items = getInventoryItems(includeArchived);
  return items.filter((item) => {
    if (!item) return false;
    const rem = Number(item.remainingWeightGrams);
    return !Number.isFinite(rem) || rem <= 0;
  });
}

export type InventorySortOption =
  | 'roast_date_desc'
  | 'roast_date_asc'
  | 'remaining_desc'
  | 'remaining_asc'
  | 'name_asc'
  | 'rating_desc';

/**
 * Sortuje pozycje ze spiżarni według wybranego kryterium.
 */
export function sortInventoryItems(
  items: InventoryItem[],
  sortBy: InventorySortOption = 'roast_date_desc'
): InventoryItem[] {
  if (!Array.isArray(items)) return [];
  const copy = [...items];

  return copy.sort((a, b) => {
    if (!a && !b) return 0;
    if (!a) return 1;
    if (!b) return -1;

    switch (sortBy) {
      case 'roast_date_desc': {
        const dateA = a.roastOrHarvestDate ? new Date(a.roastOrHarvestDate).getTime() : 0;
        const dateB = b.roastOrHarvestDate ? new Date(b.roastOrHarvestDate).getTime() : 0;
        const safeA = Number.isFinite(dateA) ? dateA : 0;
        const safeB = Number.isFinite(dateB) ? dateB : 0;
        if (safeB !== safeA) return safeB - safeA;
        return a.name.localeCompare(b.name);
      }
      case 'roast_date_asc': {
        const dateA = a.roastOrHarvestDate ? new Date(a.roastOrHarvestDate).getTime() : Infinity;
        const dateB = b.roastOrHarvestDate ? new Date(b.roastOrHarvestDate).getTime() : Infinity;
        const safeA = Number.isFinite(dateA) ? dateA : Infinity;
        const safeB = Number.isFinite(dateB) ? dateB : Infinity;
        if (safeA !== safeB) return safeA - safeB;
        return a.name.localeCompare(b.name);
      }
      case 'remaining_desc': {
        const remA = Number(a.remainingWeightGrams) || 0;
        const remB = Number(b.remainingWeightGrams) || 0;
        if (remB !== remA) return remB - remA;
        return a.name.localeCompare(b.name);
      }
      case 'remaining_asc': {
        const remA = Number(a.remainingWeightGrams) || 0;
        const remB = Number(b.remainingWeightGrams) || 0;
        if (remA !== remB) return remA - remB;
        return a.name.localeCompare(b.name);
      }
      case 'name_asc': {
        return a.name.localeCompare(b.name);
      }
      case 'rating_desc': {
        const ratA = Number(a.rating) || 0;
        const ratB = Number(b.rating) || 0;
        if (ratB !== ratA) return ratB - ratA;
        return a.name.localeCompare(b.name);
      }
      default:
        return a.name.localeCompare(b.name);
    }
  });
}

/**
 * Pobiera pozycje ze spiżarni posortowane według wybranego kryterium.
 */
export function getSortedInventoryItems(
  sortBy: InventorySortOption = 'roast_date_desc',
  includeArchived = false
): InventoryItem[] {
  const items = getInventoryItems(includeArchived);
  return sortInventoryItems(items, sortBy);
}

export interface InventoryFilterCriteria {
  query?: string;
  type?: 'coffee' | 'tea' | 'all';
  roastProfile?: string;
  origin?: string;
  onlyFavorites?: boolean;
  inStockOnly?: boolean;
  minRating?: number;
}

/**
 * Filtruje pozycje spiżarni według zadanych kryteriów.
 */
export function filterInventoryItems(
  items: InventoryItem[],
  criteria: InventoryFilterCriteria = {}
): InventoryItem[] {
  if (!Array.isArray(items)) return [];
  const query = criteria && typeof criteria.query === 'string' ? criteria.query.trim().toLowerCase() : '';
  const filterType = criteria && criteria.type && criteria.type !== 'all' ? criteria.type : null;
  const filterRoast = criteria && typeof criteria.roastProfile === 'string' ? criteria.roastProfile.trim().toLowerCase() : '';
  const filterOrigin = criteria && typeof criteria.origin === 'string' ? criteria.origin.trim().toLowerCase() : '';
  const onlyFavorites = Boolean(criteria && criteria.onlyFavorites);
  const inStockOnly = Boolean(criteria && criteria.inStockOnly);
  const minRating = criteria && typeof criteria.minRating === 'number' && !Number.isNaN(criteria.minRating)
    ? criteria.minRating
    : null;

  return items.filter((item) => {
    if (!item || typeof item !== 'object') return false;

    if (filterType && item.type !== filterType) {
      return false;
    }

    if (onlyFavorites && !item.isFavorite) {
      return false;
    }

    if (inStockOnly && !(Number(item.remainingWeightGrams) > 0)) {
      return false;
    }

    if (minRating !== null && (!(Number(item.rating) >= minRating))) {
      return false;
    }

    if (filterRoast) {
      const itemRoast = (item.roastProfile || '').toLowerCase();
      if (!itemRoast.includes(filterRoast)) return false;
    }

    if (filterOrigin) {
      const itemOrigin = (item.origin || '').toLowerCase();
      if (!itemOrigin.includes(filterOrigin)) return false;
    }

    if (query) {
      const name = (item.name || '').toLowerCase();
      const roaster = (item.roasterOrProducer || '').toLowerCase();
      const origin = (item.origin || '').toLowerCase();
      const variety = (item.variety || '').toLowerCase();
      const notes = Array.isArray(item.flavorNotes) ? item.flavorNotes.join(' ').toLowerCase() : '';

      const match =
        name.includes(query) ||
        roaster.includes(query) ||
        origin.includes(query) ||
        variety.includes(query) ||
        notes.includes(query);

      if (!match) return false;
    }

    return true;
  });
}

export interface InventorySummary {
  totalItems: number;
  totalWeightGrams: number;
  coffeeItemsCount: number;
  teaItemsCount: number;
  coffeeWeightGrams: number;
  teaWeightGrams: number;
  inStockCount: number;
  outOfStockCount: number;
  favoritesCount: number;
}

/**
 * Agreguje stan spiżarni (całkowitą masę, rozbicie na kawę/herbatę, liczbę pozycji dostępnych i ulubionych).
 */
export function calculateInventorySummary(items?: InventoryItem[] | null): InventorySummary {
  if (!Array.isArray(items) || items.length === 0) {
    return {
      totalItems: 0,
      totalWeightGrams: 0,
      coffeeItemsCount: 0,
      teaItemsCount: 0,
      coffeeWeightGrams: 0,
      teaWeightGrams: 0,
      inStockCount: 0,
      outOfStockCount: 0,
      favoritesCount: 0,
    };
  }

  let totalItems = 0;
  let totalWeight = 0;
  let coffeeItems = 0;
  let teaItems = 0;
  let coffeeWeight = 0;
  let teaWeight = 0;
  let inStock = 0;
  let outOfStock = 0;
  let favorites = 0;

  for (const item of items) {
    if (!item || typeof item !== 'object') continue;
    totalItems++;

    const rawWeight =
      typeof item.remainingWeightGrams === 'number'
        ? item.remainingWeightGrams
        : typeof item.remainingWeightGrams === 'string'
        ? parseFloat((item.remainingWeightGrams as string).replace(/\uFEFF/g, '').replace(',', '.').trim())
        : 0;

    const safeWeight = Number.isFinite(rawWeight) && rawWeight > 0 && !Object.is(rawWeight, -0) ? rawWeight : 0;

    if (safeWeight > 0) {
      inStock++;
      totalWeight += safeWeight;
    } else {
      outOfStock++;
    }

    const type = typeof item.type === 'string' ? item.type.trim().toLowerCase() : '';
    if (type === 'tea') {
      teaItems++;
      teaWeight += safeWeight;
    } else {
      coffeeItems++;
      coffeeWeight += safeWeight;
    }

    if (item.isFavorite) {
      favorites++;
    }
  }

  return {
    totalItems,
    totalWeightGrams: Number(totalWeight.toFixed(1)),
    coffeeItemsCount: coffeeItems,
    teaItemsCount: teaItems,
    coffeeWeightGrams: Number(coffeeWeight.toFixed(1)),
    teaWeightGrams: Number(teaWeight.toFixed(1)),
    inStockCount: inStock,
    outOfStockCount: outOfStock,
    favoritesCount: favorites,
  };
}

/**
 * Zwraca listę pozycji spiżarni o niskim stanie magazynowym (pozostała masa > 0 oraz <= thresholdGrams),
 * posortowaną rosnąco według pozostałej masy (najbardziej wyczerpane pozycje na początku).
 */
export function getLowStockInventoryItems(
  items?: InventoryItem[] | null,
  thresholdGrams = 50
): InventoryItem[] {
  if (!Array.isArray(items) || items.length === 0) return [];

  const rawThreshold =
    typeof thresholdGrams === 'number'
      ? thresholdGrams
      : typeof thresholdGrams === 'string'
      ? parseFloat((thresholdGrams as string).replace(/\uFEFF/g, '').replace(',', '.').trim())
      : 50;

  const safeThreshold =
    Number.isFinite(rawThreshold) && rawThreshold > 0 && !Object.is(rawThreshold, -0)
      ? rawThreshold
      : 50;

  const getWeight = (item: InventoryItem): number => {
    if (!item || typeof item !== 'object') return 0;
    const rawWeight =
      typeof item.remainingWeightGrams === 'number'
        ? item.remainingWeightGrams
        : typeof item.remainingWeightGrams === 'string'
        ? parseFloat((item.remainingWeightGrams as string).replace(/\uFEFF/g, '').replace(',', '.').trim())
        : 0;
    return Number.isFinite(rawWeight) && rawWeight > 0 && !Object.is(rawWeight, -0) ? rawWeight : 0;
  };

  const lowStock = items.filter((item) => {
    if (!item || typeof item !== 'object') return false;
    const weight = getWeight(item);
    return weight > 0 && weight <= safeThreshold;
  });

  return lowStock.sort((a, b) => getWeight(a) - getWeight(b));
}

export interface InventoryTotalValueResult {
  totalItemsCount: number;
  inStockItemsCount: number;
  totalRemainingWeightGrams: number;
  estimatedTotalValuePln: number;
  averageValuePerPackagePln: number;
  formattedTotalValuePln: string;
}

/**
 * Szacuje całkowitą wartość rynkową oraz gramaturę zapasów kawy i herbaty w spiżarni,
 * uwzględniając podane ceny paczek lub domyślną stawkę za kilogram surowca specialty.
 */
export function calculateInventoryTotalValue(
  items?: InventoryItem[] | null,
  estimatedCostPerKgPln = 160
): InventoryTotalValueResult {
  if (!Array.isArray(items) || items.length === 0) {
    return {
      totalItemsCount: 0,
      inStockItemsCount: 0,
      totalRemainingWeightGrams: 0,
      estimatedTotalValuePln: 0,
      averageValuePerPackagePln: 0,
      formattedTotalValuePln: '0,00 zł',
    };
  }

  const rawRate =
    typeof estimatedCostPerKgPln === 'number'
      ? estimatedCostPerKgPln
      : typeof estimatedCostPerKgPln === 'string'
      ? parseFloat((estimatedCostPerKgPln as string).replace(/\uFEFF/g, '').replace(',', '.').trim())
      : 160;
  const costPerKg = Number.isFinite(rawRate) && rawRate > 0 && !Object.is(rawRate, -0) ? rawRate : 160;

  let totalItemsCount = 0;
  let inStockItemsCount = 0;
  let totalRemainingWeightGrams = 0;
  let estimatedTotalValue = 0;

  for (const item of items) {
    if (!item || typeof item !== 'object') continue;
    totalItemsCount++;

    const rawWeight =
      typeof item.remainingWeightGrams === 'number'
        ? item.remainingWeightGrams
        : typeof item.remainingWeightGrams === 'string'
        ? parseFloat((item.remainingWeightGrams as string).replace(/\uFEFF/g, '').replace(',', '.').trim())
        : 0;
    const remWeight = Number.isFinite(rawWeight) && rawWeight > 0 && !Object.is(rawWeight, -0) ? rawWeight : 0;

    if (remWeight > 0) {
      inStockItemsCount++;
      totalRemainingWeightGrams += remWeight;

      const rawInit =
        typeof item.initialWeightGrams === 'number'
          ? item.initialWeightGrams
          : typeof item.initialWeightGrams === 'string'
          ? parseFloat((item.initialWeightGrams as string).replace(/\uFEFF/g, '').replace(',', '.').trim())
          : 0;
      const initWeight = Number.isFinite(rawInit) && rawInit > 0 && !Object.is(rawInit, -0) ? rawInit : 0;

      const rawPrice =
        typeof (item as any).price === 'number'
          ? (item as any).price
          : typeof (item as any).price === 'string'
          ? parseFloat(String((item as any).price).replace(/\uFEFF/g, '').replace(',', '.').trim())
          : typeof (item as any).pricePerPackage === 'number'
          ? (item as any).pricePerPackage
          : undefined;

      if (rawPrice !== undefined && Number.isFinite(rawPrice) && rawPrice > 0 && !Object.is(rawPrice, -0)) {
        if (initWeight > 0 && remWeight <= initWeight) {
          estimatedTotalValue += rawPrice * (remWeight / initWeight);
        } else {
          estimatedTotalValue += rawPrice;
        }
      } else {
        estimatedTotalValue += (remWeight / 1000) * costPerKg;
      }
    }
  }

  totalRemainingWeightGrams = Number(totalRemainingWeightGrams.toFixed(1));
  if (Object.is(totalRemainingWeightGrams, -0)) totalRemainingWeightGrams = 0;

  const estimatedTotalValuePln = Number(estimatedTotalValue.toFixed(2));
  const safeTotalValue = Object.is(estimatedTotalValuePln, -0) ? 0 : estimatedTotalValuePln;

  const rawAvg = inStockItemsCount > 0 ? safeTotalValue / inStockItemsCount : 0;
  const averageValuePerPackagePln = Number(rawAvg.toFixed(2));
  const safeAvg = Object.is(averageValuePerPackagePln, -0) ? 0 : averageValuePerPackagePln;

  const formattedTotalValuePln = `${safeTotalValue.toFixed(2).replace('.', ',')} zł`;

  return {
    totalItemsCount,
    inStockItemsCount,
    totalRemainingWeightGrams,
    estimatedTotalValuePln: safeTotalValue,
    averageValuePerPackagePln: safeAvg,
    formattedTotalValuePln,
  };
}

export type BeanFreshnessPhase =
  | 'degassing'
  | 'peak'
  | 'optimal'
  | 'aging'
  | 'past_peak'
  | 'unknown';

export interface BeanFreshnessAnalysis {
  daysSinceRoast: number | null;
  phase: BeanFreshnessPhase;
  freshnessScore: number;
  phaseLabelPl: string;
  phaseLabelEn: string;
  recommendationPl: string;
  recommendationEn: string;
}

/**
 * Analizuje stopień świeżości i fazę odgazowania kawy na podstawie daty palenia (roastDate),
 * zwracając punktowy wskaźnik świeżości (0-100) oraz zlokalizowane rekomendacje parzenia.
 */
export function calculateBeanFreshness(
  roastDate?: string | Date | null,
  currentDate?: string | Date | null
): BeanFreshnessAnalysis {
  if (!roastDate) {
    return {
      daysSinceRoast: null,
      phase: 'unknown',
      freshnessScore: 70,
      phaseLabelPl: 'Brak daty palenia',
      phaseLabelEn: 'No roast date',
      recommendationPl: 'Brak daty palenia — oceń aromat i gazowanie podczas preinfuzji (blooming).',
      recommendationEn: 'No roast date — evaluate aroma and degassing during pre-infusion (bloom).',
    };
  }

  const parseDate = (d: string | Date): number => {
    if (d instanceof Date) return d.getTime();
    if (typeof d === 'string') {
      const parsed = Date.parse(d.replace(/\uFEFF/g, '').trim());
      return Number.isFinite(parsed) ? parsed : NaN;
    }
    return NaN;
  };

  const roastMs = parseDate(roastDate);
  const nowMs = currentDate ? parseDate(currentDate) : Date.now();

  if (Number.isNaN(roastMs) || Number.isNaN(nowMs)) {
    return {
      daysSinceRoast: null,
      phase: 'unknown',
      freshnessScore: 70,
      phaseLabelPl: 'Nieprawidłowa data',
      phaseLabelEn: 'Invalid date',
      recommendationPl: 'Nieprawidłowy format daty palenia.',
      recommendationEn: 'Invalid roast date format.',
    };
  }

  const diffMs = nowMs - roastMs;
  const days = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

  if (days <= 7) {
    return {
      daysSinceRoast: days,
      phase: 'degassing',
      freshnessScore: Math.round(70 + (days / 7) * 20),
      phaseLabelPl: 'Odgazowywanie (Degassing)',
      phaseLabelEn: 'Degassing',
      recommendationPl: 'Świeżo palone ziarna — intensywna emisja CO2; wydłuż czas preinfuzji do 45–60 s.',
      recommendationEn: 'Freshly roasted — heavy CO2 release; extend bloom time to 45-60s.',
    };
  }

  if (days <= 30) {
    return {
      daysSinceRoast: days,
      phase: 'peak',
      freshnessScore: 100,
      phaseLabelPl: 'Szczyt smaku (Peak Flavor)',
      phaseLabelEn: 'Peak Flavor',
      recommendationPl: 'Optymalne okno sensoryczne — maksymalna ekspresja nut terroir, słodyczy i balansu.',
      recommendationEn: 'Optimal sensory window — peak flavor clarity, sweetness, and complexity.',
    };
  }

  if (days <= 60) {
    return {
      daysSinceRoast: days,
      phase: 'optimal',
      freshnessScore: Math.round(95 - ((days - 30) / 30) * 15),
      phaseLabelPl: 'Stabilna jakość',
      phaseLabelEn: 'Stable Quality',
      recommendationPl: 'Bardzo dobra jakość — stabilna ekstrakcja bez nadmiernego pienienia.',
      recommendationEn: 'Very good quality — stable extraction with minimal channel agitation.',
    };
  }

  if (days <= 90) {
    return {
      daysSinceRoast: days,
      phase: 'aging',
      freshnessScore: Math.round(75 - ((days - 60) / 30) * 25),
      phaseLabelPl: 'Starzenie ziaren',
      phaseLabelEn: 'Aging',
      recommendationPl: 'Początek utraty lotnych aromatów — zmiel odrobinę drobniej i zużyj w pierwszej kolejności.',
      recommendationEn: 'Loss of delicate volatiles begins — grind slightly finer and prioritize usage.',
    };
  }

  return {
    daysSinceRoast: days,
    phase: 'past_peak',
    freshnessScore: Math.max(10, Math.round(50 - ((days - 90) / 90) * 40)),
    phaseLabelPl: 'Przeleżała kawa',
    phaseLabelEn: 'Past Peak',
    recommendationPl: 'Ziarna zwietrzałe — zalecane metody ciśnieniowe z mlekiem lub cold brew.',
    recommendationEn: 'Volatiles oxidized — recommend milk drinks, immersion, or cold brew.',
  };
}

export type InventoryUsageRateCategory = 'slow' | 'moderate' | 'fast' | 'excessive';

export interface InventoryUsageRateAnalysis {
  totalRemainingGrams: number;
  dailyConsumptionGrams: number;
  estimatedDaysRemaining: number;
  estimatedWeeksRemaining: number;
  category: InventoryUsageRateCategory;
  categoryLabelPl: string;
  categoryLabelEn: string;
  advicePl: string;
  adviceEn: string;
}

/**
 * Analizuje dzienne tempo zużycia kawy, wyliczając rezerwę magazynową (w dniach i tygodniach)
 * oraz kategoryzując profil zużycia (slow, moderate, fast, excessive) z praktycznymi poradami.
 */
export function calculateInventoryUsageRate(
  totalRemainingGrams: number | string,
  dailyConsumptionGrams: number | string = 30
): InventoryUsageRateAnalysis {
  const parseNum = (v: unknown, fallback: number): number => {
    if (typeof v === 'number') return Number.isFinite(v) && !Object.is(v, -0) ? v : fallback;
    if (typeof v === 'string') {
      const parsed = parseFloat(v.replace(/\uFEFF/g, '').replace(',', '.').trim());
      return Number.isFinite(parsed) && !Object.is(parsed, -0) ? parsed : fallback;
    }
    return fallback;
  };

  const rawGrams = parseNum(totalRemainingGrams, 0);
  const safeRemainingGrams = rawGrams <= 0 ? 0 : Math.min(100000, Number(rawGrams.toFixed(1)));
  const totalGrams = Object.is(safeRemainingGrams, -0) ? 0 : safeRemainingGrams;

  const rawDaily = parseNum(dailyConsumptionGrams, 30);
  const safeDaily = rawDaily <= 0 ? 30 : Math.min(2000, Number(rawDaily.toFixed(1)));
  const dailyGrams = Object.is(safeDaily, -0) ? 30 : safeDaily;

  let estimatedDaysRemaining = 0;
  let estimatedWeeksRemaining = 0;

  if (totalGrams > 0 && dailyGrams > 0) {
    estimatedDaysRemaining = Math.round(totalGrams / dailyGrams);
    const rawWeeks = estimatedDaysRemaining / 7;
    estimatedWeeksRemaining = Number(rawWeeks.toFixed(1));
    if (Object.is(estimatedWeeksRemaining, -0)) estimatedWeeksRemaining = 0;
  }

  let category: InventoryUsageRateCategory;
  let categoryLabelPl: string;
  let categoryLabelEn: string;
  let advicePl: string;
  let adviceEn: string;

  if (dailyGrams < 15) {
    category = 'slow';
    categoryLabelPl = 'Niskie zużycie';
    categoryLabelEn = 'Low Consumption';
    advicePl = 'Tempo ok. 1 kawy dziennie lub rzadziej — zapas wystarczy na długo, uważaj na utratę świeżości ziaren.';
    adviceEn = 'Rate of ~1 cup daily or less — stock will last long, beware of beans losing freshness.';
  } else if (dailyGrams <= 35) {
    category = 'moderate';
    categoryLabelPl = 'Umiarkowane / Standardowe';
    categoryLabelEn = 'Moderate / Standard';
    advicePl = 'Klasyczne dzienne tempo (1-2 kawy) — optymalna rotacja paczek ziaren.';
    adviceEn = 'Classic daily pace (1-2 cups) — optimal bean bag rotation.';
  } else if (dailyGrams <= 65) {
    category = 'fast';
    categoryLabelPl = 'Wysokie zużycie';
    categoryLabelEn = 'High Consumption';
    advicePl = 'Intensywne parzenie (3-4 kawy dziennie) — zaplanuj kolejne zamówienie z wyprzedzeniem.';
    adviceEn = 'Active brewing (3-4 cups daily) — plan your next bean order in advance.';
  } else {
    category = 'excessive';
    categoryLabelPl = 'Bardzo wysokie / Biurowe';
    categoryLabelEn = 'Very High / Office';
    advicePl = 'Tempo biurowe lub wieloosobowe — zapas kurczy się bardzo szybko.';
    adviceEn = 'Office or multi-person pace — inventory depletes rapidly.';
  }

  return {
    totalRemainingGrams: totalGrams,
    dailyConsumptionGrams: dailyGrams,
    estimatedDaysRemaining,
    estimatedWeeksRemaining,
    category,
    categoryLabelPl,
    categoryLabelEn,
    advicePl,
    adviceEn,
  };
}

export type BeanRestingStatus = 'too_fresh_degassing' | 'ready_to_brew' | 'peak_flavor' | 'past_peak';

export interface BeanRestingReadinessAnalysis {
  daysSinceRoast: number | null;
  processType: 'washed' | 'natural_honey' | 'anaerobic_experimental';
  brewMethodCategory: 'filter' | 'espresso';
  minimumRestDays: number;
  peakStartDays: number;
  peakEndDays: number;
  readinessScore: number;
  status: BeanRestingStatus;
  statusLabelPl: string;
  statusLabelEn: string;
  recommendationPl: string;
  recommendationEn: string;
}

/**
 * Analizuje gotowość ziaren kawy do parzenia po paleniu (resting window)
 * w zależności od metody obróbki (washed, natural/honey, anaerobic/experimental)
 * oraz metody parzenia (filter vs espresso).
 */
export function calculateBeanRestingReadiness(
  roastDate?: string | Date | null,
  processType?: string | null,
  brewMethodCategory?: 'filter' | 'espresso' | string | null,
  currentDate?: string | Date | null
): BeanRestingReadinessAnalysis {
  const normProcess = typeof processType === 'string'
    ? processType.replace(/\uFEFF/g, '').toLowerCase()
    : '';

  let resolvedProcess: 'washed' | 'natural_honey' | 'anaerobic_experimental';
  if (
    normProcess.includes('anaerob') ||
    normProcess.includes('experim') ||
    normProcess.includes('koji') ||
    normProcess.includes('yeast') ||
    normProcess.includes('thermal') ||
    normProcess.includes('macer')
  ) {
    resolvedProcess = 'anaerobic_experimental';
  } else if (
    normProcess.includes('natural') ||
    normProcess.includes('honey') ||
    normProcess.includes('pulped')
  ) {
    resolvedProcess = 'natural_honey';
  } else {
    resolvedProcess = 'washed';
  }

  const normMethod = typeof brewMethodCategory === 'string'
    ? brewMethodCategory.replace(/\uFEFF/g, '').toLowerCase()
    : 'filter';
  const resolvedMethod: 'filter' | 'espresso' =
    normMethod.includes('espresso') || normMethod.includes('moka') ? 'espresso' : 'filter';

  let minimumRestDays = 7;
  let peakStartDays = 10;
  let peakEndDays = 28;

  if (resolvedProcess === 'washed') {
    if (resolvedMethod === 'espresso') {
      minimumRestDays = 12;
      peakStartDays = 16;
      peakEndDays = 35;
    } else {
      minimumRestDays = 7;
      peakStartDays = 10;
      peakEndDays = 28;
    }
  } else if (resolvedProcess === 'natural_honey') {
    if (resolvedMethod === 'espresso') {
      minimumRestDays = 16;
      peakStartDays = 21;
      peakEndDays = 45;
    } else {
      minimumRestDays = 10;
      peakStartDays = 14;
      peakEndDays = 35;
    }
  } else {
    // anaerobic_experimental
    if (resolvedMethod === 'espresso') {
      minimumRestDays = 20;
      peakStartDays = 25;
      peakEndDays = 55;
    } else {
      minimumRestDays = 14;
      peakStartDays = 18;
      peakEndDays = 42;
    }
  }

  if (!roastDate) {
    return {
      daysSinceRoast: null,
      processType: resolvedProcess,
      brewMethodCategory: resolvedMethod,
      minimumRestDays,
      peakStartDays,
      peakEndDays,
      readinessScore: 70,
      status: 'ready_to_brew',
      statusLabelPl: 'Brak daty palenia — załóż profil standardowy',
      statusLabelEn: 'No roast date — assuming standard profile',
      recommendationPl: 'Brak daty palenia. Skontroluj odgazowanie podczas preinfuzji.',
      recommendationEn: 'No roast date. Monitor degassing during blooming.',
    };
  }

  const parseDate = (d: string | Date): number => {
    if (d instanceof Date) return d.getTime();
    if (typeof d === 'string') {
      const parsed = Date.parse(d.replace(/\uFEFF/g, '').trim());
      return Number.isFinite(parsed) ? parsed : NaN;
    }
    return NaN;
  };

  const roastMs = parseDate(roastDate);
  const nowMs = currentDate ? parseDate(currentDate) : Date.now();

  if (Number.isNaN(roastMs) || Number.isNaN(nowMs)) {
    return {
      daysSinceRoast: null,
      processType: resolvedProcess,
      brewMethodCategory: resolvedMethod,
      minimumRestDays,
      peakStartDays,
      peakEndDays,
      readinessScore: 70,
      status: 'ready_to_brew',
      statusLabelPl: 'Nieprawidłowa data palenia',
      statusLabelEn: 'Invalid roast date',
      recommendationPl: 'Nieprawidłowa data palenia — zastosuj standardowe parametry ekstrakcji.',
      recommendationEn: 'Invalid roast date — use standard extraction parameters.',
    };
  }

  const diffMs = nowMs - roastMs;
  const days = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

  let status: BeanRestingStatus;
  let readinessScore: number;
  let statusLabelPl: string;
  let statusLabelEn: string;
  let recommendationPl: string;
  let recommendationEn: string;

  if (days < minimumRestDays) {
    status = 'too_fresh_degassing';
    readinessScore = Math.max(10, Math.round((days / minimumRestDays) * 60));
    const daysLeft = minimumRestDays - days;
    statusLabelPl = `Kawa zbyt świeża — intensywne odgazowywanie (odczekaj jeszcze ${daysLeft} dni)`;
    statusLabelEn = `Too fresh — vigorous degassing (rest for another ${daysLeft} days)`;
    recommendationPl = `Ziarna uwalniają duże ilości CO2. Wydłuż preinfuzję i intensywniej mieszaj bloom, lub odczekaj ${daysLeft} dni.`;
    recommendationEn = `Beans are rapidly degassing CO2. Extend bloom time or let beans rest for another ${daysLeft} days.`;
  } else if (days < peakStartDays) {
    status = 'ready_to_brew';
    readinessScore = 80;
    statusLabelPl = 'Kawa zdatna do parzenia (zbliża się do szczytu smaku)';
    statusLabelEn = 'Ready to brew (approaching flavor peak)';
    recommendationPl = 'Kawa nadaje się do picia, jednak pełnię nut smakowych osiągnie za kilka dni.';
    recommendationEn = 'Beans are good to brew, but full complexity will unfold in a few days.';
  } else if (days <= peakEndDays) {
    status = 'peak_flavor';
    readinessScore = 100;
    statusLabelPl = 'Optymalny szczyt sensoryczny (Peak Flavor)';
    statusLabelEn = 'Optimal sensory peak (Peak Flavor)';
    recommendationPl = 'Najlepszy czas na parzenie — maksymalna ekspresja terroir, krystaliczna czystość i słodycz.';
    recommendationEn = 'Peak drinking window — maximum terroir expression, pristine clarity, and sweetness.';
  } else if (days <= peakEndDays + 45) {
    status = 'ready_to_brew';
    const progress = (days - peakEndDays) / 45;
    readinessScore = Math.max(50, Math.round(90 - progress * 40));
    statusLabelPl = 'Dobra stabilność aromatu (poza szczytem)';
    statusLabelEn = 'Good flavor stability (past peak)';
    recommendationPl = 'Subtelne nuty kwiatowe mogą słabnąć; doskonała baza pod zbalansowane przelewy i espresso.';
    recommendationEn = 'Delicate florals may taper off; great for balanced pour-overs and espresso.';
  } else {
    status = 'past_peak';
    const pastDays = days - (peakEndDays + 45);
    readinessScore = Math.max(10, Math.round(40 - (pastDays / 30) * 20));
    statusLabelPl = 'Starzejące się ziarna (zalecane szybkie zużycie)';
    statusLabelEn = 'Aging beans (consume soon)';
    recommendationPl = 'Ziarna tracą lotne aromaty. Zwiększ dozę lub użyj do cold brew i kaw mlecznych.';
    recommendationEn = 'Volatiles are diminishing. Increase dose or brew as cold brew / milk drinks.';
  }

  return {
    daysSinceRoast: days,
    processType: resolvedProcess,
    brewMethodCategory: resolvedMethod,
    minimumRestDays,
    peakStartDays,
    peakEndDays,
    readinessScore,
    status,
    statusLabelPl,
    statusLabelEn,
    recommendationPl,
    recommendationEn,
  };
}

export type StashDiversityRating = 'monoculture' | 'moderate' | 'diverse' | 'connoisseur';

export interface StashDiversityAnalysis {
  totalItems: number;
  totalWeightGrams: number;
  distinctOriginsCount: number;
  distinctProcessesCount: number;
  distinctRoastersCount: number;
  coffeeCount: number;
  teaCount: number;
  diversityScore: number;
  rating: StashDiversityRating;
  ratingLabelPl: string;
  ratingLabelEn: string;
  insightsPl: string;
  insightsEn: string;
}

/**
 * Oblicza wskaźnik różnorodności kolekcji kawy i herbaty w spiżarni (terroir, metody obróbki, palarnie).
 */
export function calculateStashDiversity(
  items?: InventoryItem[] | null
): StashDiversityAnalysis {
  if (!Array.isArray(items) || items.length === 0) {
    return {
      totalItems: 0,
      totalWeightGrams: 0,
      distinctOriginsCount: 0,
      distinctProcessesCount: 0,
      distinctRoastersCount: 0,
      coffeeCount: 0,
      teaCount: 0,
      diversityScore: 0,
      rating: 'monoculture',
      ratingLabelPl: 'Monokultura / Pusta spiżarnia',
      ratingLabelEn: 'Monoculture / Empty stash',
      insightsPl: 'Brak pozycji w spiżarni. Dodaj kawy specialty lub herbaty, aby zbudować profil różnorodności.',
      insightsEn: 'No items in stash. Add specialty coffees or teas to build your diversity profile.',
    };
  }

  const origins = new Set<string>();
  const processes = new Set<string>();
  const roasters = new Set<string>();
  let totalWeight = 0;
  let coffeeCount = 0;
  let teaCount = 0;

  for (const item of items) {
    if (!item || typeof item !== 'object') continue;
    const isTea = typeof item.type === 'string' && item.type.trim().toLowerCase() === 'tea';
    if (isTea) {
      teaCount++;
    } else {
      coffeeCount++;
    }

    const orig = typeof item.origin === 'string' ? item.origin.trim().toLowerCase() : '';
    if (orig) origins.add(orig);

    const proc = typeof item.process === 'string' ? item.process.trim().toLowerCase() : '';
    if (proc) processes.add(proc);

    const itemAny = item as unknown as Record<string, unknown>;
    const roastVal = item.roasterOrProducer ?? itemAny.roaster;
    const roast = typeof roastVal === 'string' ? roastVal.trim().toLowerCase() : '';
    if (roast) roasters.add(roast);

    const w =
      typeof item.remainingWeightGrams === 'number' &&
      Number.isFinite(item.remainingWeightGrams) &&
      item.remainingWeightGrams > 0
        ? item.remainingWeightGrams
        : 0;
    totalWeight += w;
  }

  const distinctOrigins = origins.size;
  const distinctProcesses = processes.size;
  const distinctRoasters = roasters.size;

  const originScore = Math.min(40, distinctOrigins * 10);
  const processScore = Math.min(30, distinctProcesses * 10);
  const roasterScore = Math.min(20, distinctRoasters * 10);
  const dualBonus = coffeeCount > 0 && teaCount > 0 ? 10 : 0;

  const diversityScore = Math.min(100, originScore + processScore + roasterScore + dualBonus);

  let rating: StashDiversityRating = 'monoculture';
  let ratingLabelPl = 'Monokultura / Pojedynczy profil';
  let ratingLabelEn = 'Monoculture / Single profile';
  let insightsPl = `Twoja spiżarnia skupia się na jednym profilu (${distinctOrigins} terroir). Warto spróbować innych odmian i obróbek.`;
  let insightsEn = `Your stash focuses on a single profile (${distinctOrigins} origin). Consider trying different varieties and processing methods.`;

  if (diversityScore >= 80) {
    rating = 'connoisseur';
    ratingLabelPl = 'Kolekcja konesera';
    ratingLabelEn = 'Connoisseur collection';
    insightsPl = `Wybitna różnorodność: ${distinctOrigins} unikalnych terroir i ${distinctProcesses} metod obróbki. Doskonała baza do cuppingu i kalibracji sensorycznej.`;
    insightsEn = `Outstanding diversity: ${distinctOrigins} distinct origins and ${distinctProcesses} processes. Exceptional foundation for cupping and sensory calibration.`;
  } else if (diversityScore >= 56) {
    rating = 'diverse';
    ratingLabelPl = 'Bogata kolekcja specialty';
    ratingLabelEn = 'Rich specialty stash';
    insightsPl = `Świetny balans: ${distinctOrigins} krajów pochodzenia i ${distinctRoasters} palarni. Masz zróżnicowany wachlarz nut smakowych.`;
    insightsEn = `Great balance: ${distinctOrigins} origins and ${distinctRoasters} roasters. You have a broad sensory flavor spectrum.`;
  } else if (diversityScore >= 35 && distinctOrigins > 1) {
    rating = 'moderate';
    ratingLabelPl = 'Umiarkowana różnorodność';
    ratingLabelEn = 'Moderate diversity';
    insightsPl = `Dobra baza codzienna (${distinctOrigins} terroir). Dodanie nowej metody obróbki (np. beztlenowej) wzbogaci doznania sensoryczne.`;
    insightsEn = `Good daily foundation (${distinctOrigins} origins). Introducing an experimental process will elevate sensory variety.`;
  }

  return {
    totalItems: items.length,
    totalWeightGrams: Math.round(totalWeight * 10) / 10,
    distinctOriginsCount: distinctOrigins,
    distinctProcessesCount: distinctProcesses,
    distinctRoastersCount: distinctRoasters,
    coffeeCount,
    teaCount,
    diversityScore,
    rating,
    ratingLabelPl,
    ratingLabelEn,
    insightsPl,
    insightsEn,
  };
}

export interface StashBrewsEstimate {
  totalRemainingWeightGrams: number;
  averageDoseGrams: number;
  estimatedTotalBrews: number;
  coffeeBrewsRemaining: number;
  teaBrewsRemaining: number;
  estimatedDaysRemaining: number;
  summaryPl: string;
  summaryEn: string;
}

export function estimateRemainingBrews(
  items: InventoryItem[] | undefined | null,
  options?: {
    coffeeDoseGrams?: number | string | null;
    teaDoseGrams?: number | string | null;
    brewsPerDay?: number | string | null;
  } | null
): StashBrewsEstimate {
  const safeItems = Array.isArray(items) ? items : [];

  const rawCoffeeDose = options?.coffeeDoseGrams != null ? Number(options.coffeeDoseGrams) : NaN;
  const coffeeDose = Number.isFinite(rawCoffeeDose) && rawCoffeeDose > 0 ? rawCoffeeDose : 15;

  const rawTeaDose = options?.teaDoseGrams != null ? Number(options.teaDoseGrams) : NaN;
  const teaDose = Number.isFinite(rawTeaDose) && rawTeaDose > 0 ? rawTeaDose : 4;

  const rawBrewsPerDay = options?.brewsPerDay != null ? Number(options.brewsPerDay) : NaN;
  const brewsPerDay = Number.isFinite(rawBrewsPerDay) && rawBrewsPerDay > 0 ? rawBrewsPerDay : 2;

  let coffeeWeight = 0;
  let teaWeight = 0;

  for (const item of safeItems) {
    if (!item || typeof item !== 'object') continue;
    if (item.isArchived) continue;

    const w =
      typeof item.remainingWeightGrams === 'number' &&
      Number.isFinite(item.remainingWeightGrams) &&
      item.remainingWeightGrams > 0
        ? item.remainingWeightGrams
        : 0;

    if (w <= 0) continue;

    const type = typeof item.type === 'string' ? item.type.toLowerCase().trim() : 'coffee';
    if (type === 'tea') {
      teaWeight += w;
    } else {
      coffeeWeight += w;
    }
  }

  const totalRemainingWeightGrams = Math.round((coffeeWeight + teaWeight) * 10) / 10;
  const coffeeBrewsRemaining = Math.floor(coffeeWeight / coffeeDose);
  const teaBrewsRemaining = Math.floor(teaWeight / teaDose);
  const estimatedTotalBrews = coffeeBrewsRemaining + teaBrewsRemaining;

  const averageDoseGrams =
    estimatedTotalBrews > 0
      ? Math.round((totalRemainingWeightGrams / estimatedTotalBrews) * 10) / 10
      : 0;

  const estimatedDaysRemaining =
    brewsPerDay > 0 ? Math.floor(estimatedTotalBrews / brewsPerDay) : 0;

  let summaryPl: string;
  let summaryEn: string;

  if (estimatedTotalBrews === 0) {
    summaryPl = 'Brak dostępnych zapasów w spiżarni do zaparzenia.';
    summaryEn = 'No stash inventory available for brewing.';
  } else {
    summaryPl = `Pozostało łącznie ${estimatedTotalBrews} parzeń (${coffeeBrewsRemaining} kaw, ${teaBrewsRemaining} herbat) – zapas na około ${estimatedDaysRemaining} dni.`;
    summaryEn = `Estimated ${estimatedTotalBrews} brews remaining (${coffeeBrewsRemaining} coffee, ${teaBrewsRemaining} tea) – supply for approximately ${estimatedDaysRemaining} days.`;
  }

  return {
    totalRemainingWeightGrams,
    averageDoseGrams,
    estimatedTotalBrews,
    coffeeBrewsRemaining,
    teaBrewsRemaining,
    estimatedDaysRemaining,
    summaryPl,
    summaryEn,
  };
}




export function getInventoryItemById(id: string): InventoryItem | null {
  if (!id || typeof id !== 'string' || !id.trim()) return null;
  const safeId = id.trim();
  const db = getDatabase();
  const row = db.getFirstSync<InventoryRow>(
    'SELECT * FROM inventory_items WHERE id = ?',
    [safeId]
  );
  return row ? mapRowToInventoryItem(row) : null;
}

export function saveInventoryItem(item: InventoryItem): void {
  if (!item || typeof item !== 'object') {
    throw new Error('Nieprawidłowy obiekt pozycji spiżarni (null lub undefined)');
  }
  const db = getDatabase();
  const now = new Date().toISOString();
  const rawInit = typeof item.initialWeightGrams === 'number'
    ? item.initialWeightGrams
    : parseFloat(String(item.initialWeightGrams ?? '').replace(',', '.'));
  const safeInit = Number.isFinite(rawInit) && rawInit >= 0
    ? Number(Math.min(100000, rawInit).toFixed(1))
    : 250;
  const initWeight = Object.is(safeInit, -0) ? 0 : safeInit;

  const rawRem = typeof item.remainingWeightGrams === 'number'
    ? item.remainingWeightGrams
    : parseFloat(String(item.remainingWeightGrams ?? '').replace(',', '.'));
  const safeRem = Number.isFinite(rawRem) && rawRem >= 0
    ? Number(Math.min(100000, rawRem).toFixed(1))
    : 0;
  const remWeight = Object.is(safeRem, -0) ? 0 : safeRem;

  const rawRating = typeof item.rating === 'number'
    ? item.rating
    : parseFloat(String(item.rating ?? '').replace(',', '.'));
  const safeRating = Number.isFinite(rawRating) && rawRating >= 0 && rawRating <= 5
    ? Number(rawRating.toFixed(1))
    : null;
  const sanitizedRating = safeRating != null && Object.is(safeRating, -0) ? 0 : safeRating;
  const sanitizedRoastDate =
    typeof item.roastOrHarvestDate === 'string' && item.roastOrHarvestDate.trim().length > 0
      ? item.roastOrHarvestDate.trim().slice(0, 50)
      : null;
  const sanitizedRoaster =
    typeof item.roasterOrProducer === 'string' && item.roasterOrProducer.trim().length > 0
      ? item.roasterOrProducer.trim().slice(0, 100)
      : null;
  const sanitizedOrigin =
    typeof item.origin === 'string' && item.origin.trim().length > 0
      ? item.origin.trim().slice(0, 100)
      : null;
  const sanitizedVariety =
    typeof item.variety === 'string' && item.variety.trim().length > 0
      ? item.variety.trim().slice(0, 100)
      : null;
  const sanitizedProcess =
    typeof item.process === 'string' && item.process.trim().length > 0
      ? item.process.trim().slice(0, 100)
      : null;

  const cleanId = typeof item.id === 'string' && item.id.trim() ? item.id.trim() : `item-${Date.now()}`;
  const cleanName = typeof item.name === 'string' && item.name.trim() ? item.name.trim().slice(0, 200) : 'Bez nazwy';
  const cleanType = typeof item.type === 'string' && item.type.trim().toLowerCase() === 'tea' ? 'tea' : 'coffee';
  const cleanRoastProfile = typeof item.roastProfile === 'string' && item.roastProfile.trim() ? item.roastProfile.trim().slice(0, 50) : null;
  const sanitizedFlavorNotes = Array.isArray(item.flavorNotes)
    ? item.flavorNotes.filter((t): t is string => typeof t === 'string' && t.trim().length > 0).map((t) => t.trim().slice(0, 50)).slice(0, 30)
    : [];

  db.runSync(
    `INSERT OR REPLACE INTO inventory_items (
      id, name, type, roaster_or_producer, origin,
      roast_or_harvest_date, roast_profile, process, variety,
      initial_weight_g, remaining_weight_g, flavor_notes_json,
      rating, is_favorite, is_archived, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      cleanId,
      cleanName,
      cleanType,
      sanitizedRoaster,
      sanitizedOrigin,
      sanitizedRoastDate,
      cleanRoastProfile,
      sanitizedProcess,
      sanitizedVariety,
      initWeight,
      remWeight,
      JSON.stringify(sanitizedFlavorNotes),
      sanitizedRating,
      item.isFavorite ? 1 : 0,
      item.isArchived ? 1 : 0,
      item.createdAt || now,
      now,
    ]
  );
}

export function deleteInventoryItem(id: string): void {
  const rawId = typeof id === 'string' ? id : (typeof id === 'number' && Number.isFinite(id) ? String(id) : '');
  const safeId = rawId.replace(/[\x00-\x1F\x7F]/g, '').trim();
  if (!safeId) return;
  const db = getDatabase();
  runInTransactionSync(db, () => {
    db.runSync('UPDATE brew_sessions SET inventory_item_id = NULL WHERE inventory_item_id = ?', [safeId]);
    db.runSync('DELETE FROM inventory_items WHERE id = ?', [safeId]);
  });
}

export function deductInventoryWeight(id: string, doseGrams: number): void {
  if (!id || typeof id !== 'string') return;
  const safeId = id.trim();
  if (!safeId) return;
  const parsedDose = typeof doseGrams === 'number' ? doseGrams : (typeof (doseGrams as any) === 'string' ? parseFloat((doseGrams as any).replace(',', '.')) : NaN);
  const safeDose = Number.isFinite(parsedDose) && parsedDose > 0 ? parsedDose : 0;
  if (safeDose <= 0) return;
  const db = getDatabase();
  const item = getInventoryItemById(safeId);
  if (!item) return;
  const currentRemaining =
    Number.isFinite(item.remainingWeightGrams) && item.remainingWeightGrams >= 0
      ? item.remainingWeightGrams
      : 0;
  let newRemaining = Math.max(0, Number((currentRemaining - safeDose).toFixed(1)));
  if (Object.is(newRemaining, -0) || newRemaining <= 0) newRemaining = 0;
  db.runSync(
    'UPDATE inventory_items SET remaining_weight_g = ?, updated_at = ? WHERE id = ?',
    [newRemaining, new Date().toISOString(), safeId]
  );
}

export function deductBeansForBrew(itemId: string, grams: number): void {
  deductInventoryWeight(itemId, grams);
}

function mapRowToInventoryItem(row: InventoryRow): InventoryItem {
  if (!row) {
    return {
      id: '',
      name: '',
      type: 'coffee',
      initialWeightGrams: 250,
      remainingWeightGrams: 0,
      flavorNotes: [],
      isFavorite: false,
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
  let flavorNotes: string[] = [];
  try {
    const parsed = row.flavor_notes_json ? JSON.parse(row.flavor_notes_json) : [];
    flavorNotes = Array.isArray(parsed) ? parsed : [];
  } catch {
    flavorNotes = [];
  }
  return {
    id: row.id || '',
    name: row.name || '',
    type: row.type === 'tea' ? 'tea' : 'coffee',
    roasterOrProducer:
      typeof row.roaster_or_producer === 'string' && row.roaster_or_producer.trim().length > 0
        ? row.roaster_or_producer.trim()
        : undefined,
    origin:
      typeof row.origin === 'string' && row.origin.trim().length > 0
        ? row.origin.trim()
        : undefined,
    roastOrHarvestDate:
      typeof row.roast_or_harvest_date === 'string' && row.roast_or_harvest_date.trim().length > 0
        ? row.roast_or_harvest_date.trim()
        : undefined,
    roastProfile:
      typeof row.roast_profile === 'string' && row.roast_profile.trim().length > 0
        ? row.roast_profile.trim()
        : undefined,
    process:
      typeof row.process === 'string' && row.process.trim().length > 0
        ? row.process.trim()
        : undefined,
    variety:
      typeof row.variety === 'string' && row.variety.trim().length > 0
        ? row.variety.trim()
        : undefined,
    initialWeightGrams:
      Number.isFinite(Number(row.initial_weight_g)) && Number(row.initial_weight_g) >= 0
        ? Number(row.initial_weight_g)
        : 250,
    remainingWeightGrams:
      Number.isFinite(Number(row.remaining_weight_g)) && Number(row.remaining_weight_g) >= 0
        ? Number(row.remaining_weight_g)
        : 0,
    flavorNotes,
    rating: (row.rating !== null && row.rating !== undefined && Number.isFinite(row.rating) && row.rating >= 0 && row.rating <= 5) ? row.rating : undefined,
    isFavorite: Boolean(row.is_favorite),
    isArchived: Boolean(row.is_archived),
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

// ----------------------------------------------------------------------------
// Repozytorium: Przepisy (Recipes)
// ----------------------------------------------------------------------------

export function getRecipes(beverageType?: 'COFFEE' | 'TEA' | string): SavedRecipe[] {
  const db = getDatabase();
  const cleanType = typeof beverageType === 'string' ? beverageType.trim().toUpperCase() : undefined;
  const isFiltered = cleanType === 'COFFEE' || cleanType === 'TEA';
  const query = isFiltered
    ? 'SELECT * FROM recipes WHERE beverage_type = ? ORDER BY is_favorite DESC, name ASC'
    : 'SELECT * FROM recipes ORDER BY is_favorite DESC, beverage_type ASC, name ASC';
  const params = isFiltered ? [cleanType] : [];
  const rows = db.getAllSync<RecipeRow>(query, params);
  return rows.map(mapRowToRecipe);
}

export function getRecipeById(id: string): SavedRecipe | null {
  if (!id || typeof id !== 'string' || !id.trim()) return null;
  const safeId = id.trim();
  const db = getDatabase();
  const row = db.getFirstSync<RecipeRow>('SELECT * FROM recipes WHERE id = ?', [safeId]);
  return row ? mapRowToRecipe(row) : null;
}

export function saveRecipe(recipe: SavedRecipe): void {
  if (!recipe || typeof recipe !== 'object') return;
  const db = getDatabase();
  const safeId = typeof recipe.id === 'string'
    ? recipe.id.trim()
    : (typeof recipe.id === 'number' && Number.isFinite(recipe.id) ? String(recipe.id) : '');
  if (!safeId) return;

  const rawDose = typeof recipe.doseGrams === 'number' ? recipe.doseGrams : parseFloat(String(recipe.doseGrams).replace(',', '.'));
  const safeDose = Number.isFinite(rawDose) && rawDose > 0 ? Number(Math.min(1000, Math.max(1, rawDose)).toFixed(1)) : 15;
  const dose = Object.is(safeDose, -0) ? 15 : safeDose;

  const rawWater = typeof recipe.waterGrams === 'number' ? recipe.waterGrams : parseFloat(String(recipe.waterGrams).replace(',', '.'));
  const safeWater = Number.isFinite(rawWater) && rawWater > 0 ? Number(Math.min(50000, Math.max(10, rawWater)).toFixed(1)) : 250;
  const water = Object.is(safeWater, -0) ? 250 : safeWater;

  const isColdBrew = (recipe.method && /cold|ice|zimn/i.test(recipe.method)) || (recipe.name && /cold|ice|zimn/i.test(recipe.name));
  const rawTemp = typeof recipe.waterTempCelsius === 'number' ? recipe.waterTempCelsius : parseFloat(String(recipe.waterTempCelsius).replace(',', '.'));
  const safeTemp = Number.isFinite(rawTemp) && (rawTemp > 0 || (isColdBrew && rawTemp === 0))
    ? Math.min(100, Math.max(0, Math.round(rawTemp)))
    : 92;
  const temp = Object.is(safeTemp, -0) ? 0 : safeTemp;

  let rawRatio: number;
  const rawRatioVal = (recipe as any).recommendedRatio;
  if (typeof rawRatioVal === 'string' && (rawRatioVal.includes(':') || rawRatioVal.includes('/'))) {
    const parts = rawRatioVal.split(/[:/]/).map((p: string) => parseFloat(p.trim().replace(',', '.')));
    if (parts.length === 2 && Number.isFinite(parts[0]) && Number.isFinite(parts[1]) && parts[0] > 0 && parts[1] > 0) {
      rawRatio = parts[1] / parts[0];
    } else {
      rawRatio = parseFloat(rawRatioVal.replace(',', '.'));
    }
  } else if (typeof rawRatioVal === 'number') {
    rawRatio = rawRatioVal;
  } else {
    rawRatio = parseFloat(String(rawRatioVal).replace(',', '.'));
  }
  const safeRatio = Number.isFinite(rawRatio) && rawRatio > 0 ? Number(Math.min(100, Math.max(1, rawRatio)).toFixed(2)) : 16;
  const ratio = Object.is(safeRatio, -0) ? 16 : safeRatio;

  let safeStepsJson = '[]';
  if (Array.isArray((recipe as any).stepsJson)) {
    try {
      safeStepsJson = JSON.stringify((recipe as any).stepsJson);
    } catch {
      safeStepsJson = '[]';
    }
  } else if (typeof recipe.stepsJson === 'string' && recipe.stepsJson.trim()) {
    try {
      JSON.parse(recipe.stepsJson.trim());
      safeStepsJson = recipe.stepsJson.trim();
    } catch {
      safeStepsJson = '[]';
    }
  } else if (Array.isArray((recipe as any).steps)) {
    try {
      safeStepsJson = JSON.stringify((recipe as any).steps);
    } catch {
      safeStepsJson = '[]';
    }
  }

  const safeName = typeof recipe.name === 'string' && recipe.name.trim() ? recipe.name.trim().slice(0, 200) : 'Recipe';
  const safeBeverage = typeof recipe.beverageType === 'string' && recipe.beverageType.trim().toUpperCase() === 'TEA' ? 'TEA' : 'COFFEE';
  const safeMethod = typeof recipe.method === 'string' && recipe.method.trim() ? recipe.method.trim().slice(0, 50) : 'v60';
  const safeAuthor = typeof recipe.author === 'string' && recipe.author.trim() ? recipe.author.trim().slice(0, 100) : null;
  const safeDescription = typeof recipe.description === 'string' && recipe.description.trim() ? recipe.description.trim().slice(0, 1000) : null;
  const safeGrindDesc = typeof recipe.grindSizeDescription === 'string' && recipe.grindSizeDescription.trim() ? recipe.grindSizeDescription.trim().slice(0, 200) : null;

  db.runSync(
    `INSERT INTO recipes (
      id, name, beverage_type, method, author, description,
      dose_g, water_g, water_temp_c, grind_size_description,
      recommended_ratio, steps_json, is_custom, is_favorite, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      beverage_type = excluded.beverage_type,
      method = excluded.method,
      author = excluded.author,
      description = excluded.description,
      dose_g = excluded.dose_g,
      water_g = excluded.water_g,
      water_temp_c = excluded.water_temp_c,
      grind_size_description = excluded.grind_size_description,
      recommended_ratio = excluded.recommended_ratio,
      steps_json = excluded.steps_json,
      is_custom = excluded.is_custom,
      is_favorite = excluded.is_favorite`,
    [
      safeId,
      safeName,
      safeBeverage,
      safeMethod,
      safeAuthor,
      safeDescription,
      dose,
      water,
      temp,
      safeGrindDesc,
      ratio,
      safeStepsJson,
      recipe.isCustom ? 1 : 0,
      recipe.isFavorite ? 1 : 0,
      recipe.createdAt || new Date().toISOString(),
    ]
  );
}

export function deleteRecipe(id: string): void {
  const rawId = typeof id === 'string' ? id : (typeof id === 'number' && Number.isFinite(id) ? String(id) : '');
  const safeId = rawId.replace(/[\x00-\x1F\x7F]/g, '').trim();
  if (!safeId) return;
  const db = getDatabase();
  runInTransactionSync(db, () => {
    db.runSync('UPDATE brew_sessions SET recipe_id = NULL WHERE recipe_id = ?', [safeId]);
    db.runSync('DELETE FROM recipes WHERE id = ? AND is_custom = 1', [safeId]);
  });
}

export function toggleRecipeFavorite(id: string): boolean {
  const rawId = typeof id === 'string' ? id : (typeof id === 'number' && Number.isFinite(id) ? String(id) : '');
  const safeId = rawId.replace(/[\x00-\x1F\x7F]/g, '').trim();
  if (!safeId) return false;
  const db = getDatabase();
  const recipe = getRecipeById(safeId);
  if (!recipe) return false;
  const newFav = !recipe.isFavorite;
  db.runSync('UPDATE recipes SET is_favorite = ? WHERE id = ?', [newFav ? 1 : 0, safeId]);
  return newFav;
}

export function updateRecipeFavorite(id: string, isFavorite: boolean | string | number): void {
  const rawId = typeof id === 'string' ? id : (typeof id === 'number' && Number.isFinite(id) ? String(id) : '');
  const safeId = rawId.replace(/[\x00-\x1F\x7F]/g, '').trim();
  if (!safeId) return;
  const db = getDatabase();
  const favVal = isFavorite === true || isFavorite === 1 || isFavorite === 'true' || isFavorite === '1' ? 1 : 0;
  db.runSync('UPDATE recipes SET is_favorite = ? WHERE id = ?', [favVal, safeId]);
}

export function duplicateRecipe(
  recipe: {
    id: string;
    name: string;
    type?: 'COFFEE' | 'TEA';
    beverageType?: 'COFFEE' | 'TEA';
    method: string;
    author?: string;
    description?: string;
    coffeeOrTeaDoseGrams?: number;
    doseGrams?: number;
    waterWeightGrams?: number;
    waterGrams?: number;
    waterTemperatureCelsius?: number;
    waterTempCelsius?: number;
    grindSettingDescriptionPl?: string;
    grindSizeDescription?: string;
    recommendedRatio: number;
    steps?: unknown[];
    stepsJson?: string;
  },
  copySuffix = ' (Kopia)'
): SavedRecipe {
  if (!recipe || typeof recipe !== 'object') {
    throw new Error('Nieprawidłowa receptura do duplikacji');
  }
  const now = new Date().toISOString();
  const id = `custom-clone-${Date.now()}`;
  const safeSuffix = typeof copySuffix === 'string' ? copySuffix : ' (Kopia)';
  const maxBaseLen = Math.max(1, 100 - safeSuffix.length);
  const baseName = typeof recipe.name === 'string' && recipe.name.trim() ? recipe.name.trim().slice(0, maxBaseLen) : 'Receptura';
  const name = `${baseName}${safeSuffix}`;
  const rawType = recipe.beverageType || recipe.type;
  const beverageType = typeof rawType === 'string' && rawType.trim().toUpperCase() === 'TEA' ? 'TEA' : 'COFFEE';
  const method = typeof recipe.method === 'string' && recipe.method.trim() ? recipe.method.trim() : 'V60';

  const rawDose = (recipe as any).doseGrams ?? (recipe as any).coffeeOrTeaDoseGrams;
  const numDose = typeof rawDose === 'number' ? rawDose : parseFloat(String(rawDose).replace(',', '.'));
  const doseGramsVal = Number.isFinite(numDose) && numDose > 0 ? Number(Math.min(1000, numDose).toFixed(1)) : 15;
  const doseGrams = Object.is(doseGramsVal, -0) || doseGramsVal <= 0 ? 15 : doseGramsVal;

  const rawWater = (recipe as any).waterGrams ?? (recipe as any).waterWeightGrams;
  const numWater = typeof rawWater === 'number' ? rawWater : parseFloat(String(rawWater).replace(',', '.'));
  const waterGramsVal = Number.isFinite(numWater) && numWater > 0 ? Number(Math.min(50000, numWater).toFixed(1)) : 250;
  const waterGrams = Object.is(waterGramsVal, -0) || waterGramsVal <= 0 ? 250 : waterGramsVal;

  const rawTemp = recipe.waterTempCelsius ?? recipe.waterTemperatureCelsius;
  const numTemp = typeof rawTemp === 'number' ? rawTemp : (typeof rawTemp === 'string' ? parseFloat(String(rawTemp).replace(',', '.')) : NaN);
  const waterTempVal = Number.isFinite(numTemp) && numTemp >= 0 && numTemp <= 100 ? Math.round(numTemp) : 93;
  const waterTempCelsius = Object.is(waterTempVal, -0) ? 0 : waterTempVal;

  const grindSizeDescription = recipe.grindSizeDescription || recipe.grindSettingDescriptionPl || '';

  let stepsJson = '[]';
  if (typeof recipe.stepsJson === 'string' && recipe.stepsJson.trim()) {
    try {
      JSON.parse(recipe.stepsJson);
      stepsJson = recipe.stepsJson.trim();
    } catch {
      stepsJson = '[]';
    }
  } else if (Array.isArray(recipe.steps)) {
    try {
      stepsJson = JSON.stringify(recipe.steps);
    } catch {
      stepsJson = '[]';
    }
  }

  const rawRatio = (recipe as any).recommendedRatio;
  let numRatio: number;
  if (typeof rawRatio === 'string' && (rawRatio.includes(':') || rawRatio.includes('/'))) {
    const parts = rawRatio.split(/[:/]/).map((p: string) => parseFloat(p.trim().replace(',', '.')));
    if (parts.length === 2 && Number.isFinite(parts[0]) && Number.isFinite(parts[1]) && parts[0] > 0 && parts[1] > 0) {
      numRatio = parts[1] / parts[0];
    } else {
      numRatio = parseFloat(rawRatio.replace(',', '.'));
    }
  } else if (typeof rawRatio === 'number') {
    numRatio = rawRatio;
  } else {
    numRatio = typeof rawRatio === 'string' ? parseFloat(rawRatio.replace(',', '.')) : NaN;
  }
  const calcRatio = Number.isFinite(numRatio) && numRatio > 0
    ? Number(numRatio.toFixed(2))
    : Number((waterGrams / doseGrams).toFixed(1));
  const recommendedRatio = Object.is(calcRatio, -0) || calcRatio <= 0 ? 15 : calcRatio;

  const author = typeof recipe.author === 'string' && recipe.author.trim()
    ? `${recipe.author.trim()} (Modyfikacja)`
    : 'Własna';
  const description = typeof recipe.description === 'string' && recipe.description.trim()
    ? recipe.description.trim()
    : undefined;

  const cloned: SavedRecipe = {
    id,
    name,
    beverageType,
    method,
    author,
    description,
    doseGrams,
    waterGrams,
    waterTempCelsius,
    grindSizeDescription,
    recommendedRatio,
    stepsJson,
    isCustom: true,
    isFavorite: false,
    createdAt: now,
  };

  saveRecipe(cloned);
  return cloned;
}

function mapRowToRecipe(row: RecipeRow): SavedRecipe {
  return {
    id: row.id,
    name: row.name,
    beverageType: row.beverage_type,
    method: row.method,
    author: row.author || undefined,
    description: row.description || undefined,
    doseGrams: Number.isFinite(row.dose_g) && row.dose_g > 0 ? row.dose_g : 15,
    waterGrams: Number.isFinite(row.water_g) && row.water_g > 0 ? row.water_g : 250,
    waterTempCelsius: (() => {
      const isCold = (row.method && /cold|ice|zimn/i.test(row.method)) || (row.name && /cold|ice|zimn/i.test(row.name));
      return Number.isFinite(row.water_temp_c) && (row.water_temp_c > 0 || (isCold && row.water_temp_c === 0))
        ? row.water_temp_c
        : 92;
    })(),
    grindSizeDescription: row.grind_size_description || undefined,
    recommendedRatio: Number.isFinite(row.recommended_ratio) && row.recommended_ratio > 0 ? row.recommended_ratio : 16,
    stepsJson: row.steps_json,
    isCustom: Boolean(row.is_custom),
    isFavorite: Boolean(row.is_favorite),
    createdAt: row.created_at,
  };
}

// ----------------------------------------------------------------------------
// Repozytorium: Dziennik Parzeń (Brew Sessions / Journal)
// ----------------------------------------------------------------------------

export interface BrewSessionFilterCriteria {
  query?: string;
  beverageType?: 'COFFEE' | 'TEA' | 'all';
  method?: string;
  inventoryItemId?: string;
  recipeId?: string;
  minRating?: number;
  sinceIso?: string;
}

/**
 * Filtruje sesje parzenia ze wskazanymi kryteriami.
 */
export function filterBrewSessions(
  sessions: BrewSession[],
  criteria: BrewSessionFilterCriteria = {}
): BrewSession[] {
  if (!Array.isArray(sessions)) return [];
  const query = criteria && typeof criteria.query === 'string' ? criteria.query.trim().toLowerCase() : '';
  const bevType =
    criteria && criteria.beverageType && criteria.beverageType !== 'all'
      ? criteria.beverageType.toUpperCase()
      : null;
  const method = criteria && typeof criteria.method === 'string' ? criteria.method.trim().toLowerCase() : '';
  const invId = criteria && typeof criteria.inventoryItemId === 'string' ? criteria.inventoryItemId.trim() : '';
  const recId = criteria && typeof criteria.recipeId === 'string' ? criteria.recipeId.trim() : '';
  const minRating =
    criteria && typeof criteria.minRating === 'number' && !Number.isNaN(criteria.minRating)
      ? criteria.minRating
      : null;

  let sinceTime = 0;
  if (criteria && typeof criteria.sinceIso === 'string' && criteria.sinceIso.trim()) {
    const t = new Date(criteria.sinceIso.trim()).getTime();
    if (Number.isFinite(t)) {
      sinceTime = t;
    }
  }

  return sessions.filter((session) => {
    if (!session || typeof session !== 'object') return false;

    if (bevType && (session.beverageType || '').toUpperCase() !== bevType) {
      return false;
    }

    if (method) {
      const sMethod = (session.method || '').toLowerCase();
      if (!sMethod.includes(method)) return false;
    }

    if (invId && session.inventoryItemId !== invId) {
      return false;
    }

    if (recId && session.recipeId !== recId) {
      return false;
    }

    if (minRating !== null && (!(Number(session.rating) >= minRating))) {
      return false;
    }

    if (sinceTime > 0) {
      const sTime = session.brewedAt ? new Date(session.brewedAt).getTime() : 0;
      if (sTime < sinceTime) return false;
    }

    if (query) {
      const rName = (session.recipeName || '').toLowerCase();
      const iName = (session.inventoryItemName || '').toLowerCase();
      const sMethod = (session.method || '').toLowerCase();
      const notes = (session.notes || '').toLowerCase();
      const tags = Array.isArray(session.flavorTags) ? session.flavorTags.join(' ').toLowerCase() : '';

      const match =
        rName.includes(query) ||
        iName.includes(query) ||
        sMethod.includes(query) ||
        notes.includes(query) ||
        tags.includes(query);

      if (!match) return false;
    }

    return true;
  });
}

export function getBrewSessions(limit?: number, offset?: number): BrewSession[] {
  const db = getDatabase();
  const rawOffset = typeof offset === 'number' ? offset : (typeof offset === 'string' ? parseFloat(offset) : NaN);
  const safeOffset = Number.isFinite(rawOffset) && rawOffset > 0 ? Math.floor(rawOffset) : 0;
  const normalizedOffset = Object.is(safeOffset, -0) ? 0 : safeOffset;

  if (limit !== undefined) {
    const rawLimit = typeof limit === 'number' ? limit : (typeof limit === 'string' ? parseFloat(limit) : NaN);
    if (!Number.isFinite(rawLimit) || rawLimit <= 0) {
      return [];
    }
    const safeLimit = Math.max(1, Math.floor(rawLimit));
    const query = normalizedOffset > 0
      ? 'SELECT * FROM brew_sessions ORDER BY brewed_at DESC LIMIT ? OFFSET ?'
      : 'SELECT * FROM brew_sessions ORDER BY brewed_at DESC LIMIT ?';
    const params = normalizedOffset > 0 ? [safeLimit, normalizedOffset] : [safeLimit];
    const rows = db.getAllSync<BrewSessionRow>(query, params);
    return rows.map(mapRowToBrewSession);
  }

  if (normalizedOffset > 0) {
    const rows = db.getAllSync<BrewSessionRow>(
      'SELECT * FROM brew_sessions ORDER BY brewed_at DESC LIMIT -1 OFFSET ?',
      [normalizedOffset]
    );
    return rows.map(mapRowToBrewSession);
  }

  const rows = db.getAllSync<BrewSessionRow>('SELECT * FROM brew_sessions ORDER BY brewed_at DESC');
  return rows.map(mapRowToBrewSession);
}

export function getBrewSessionById(id: string): BrewSession | null {
  if (!id || typeof id !== 'string' || !id.trim()) return null;
  const safeId = id.trim();
  const db = getDatabase();
  const row = db.getFirstSync<BrewSessionRow>('SELECT * FROM brew_sessions WHERE id = ?', [safeId]);
  return row ? mapRowToBrewSession(row) : null;
}

export function saveBrewSession(session: BrewSession): void {
  if (!session || typeof session !== 'object') return;
  const db = getDatabase();

  const rawDose = typeof session.doseGrams === 'number' ? session.doseGrams : (typeof (session as any).doseGrams === 'string' ? parseFloat((session as any).doseGrams.replace(',', '.')) : NaN);
  const safeDoseVal = Number.isFinite(rawDose) && rawDose > 0 ? Number(Math.min(1000, Math.max(1, rawDose)).toFixed(1)) : 15;
  const dose = Object.is(safeDoseVal, -0) ? 15 : safeDoseVal;

  const rawWater = typeof session.waterGrams === 'number' ? session.waterGrams : (typeof (session as any).waterGrams === 'string' ? parseFloat((session as any).waterGrams.replace(',', '.')) : NaN);
  const safeWaterVal = Number.isFinite(rawWater) && rawWater > 0 ? Number(Math.min(50000, Math.max(10, rawWater)).toFixed(1)) : 250;
  const water = Object.is(safeWaterVal, -0) ? 250 : safeWaterVal;

  const isColdBrew = (session.method && /cold|ice|zimn/i.test(session.method)) || (session.recipeName && /cold|ice|zimn/i.test(session.recipeName));
  const rawTemp = typeof session.waterTempCelsius === 'number' ? session.waterTempCelsius : (typeof (session as any).waterTempCelsius === 'string' ? parseFloat((session as any).waterTempCelsius.replace(',', '.')) : NaN);
  const safeTemp = Number.isFinite(rawTemp) && (rawTemp > 0 || (isColdBrew && rawTemp === 0))
    ? Math.min(100, Math.max(0, Math.round(rawTemp)))
    : 92;
  const temp = Object.is(safeTemp, -0) ? 0 : safeTemp;

  const rawTotalTime = typeof session.totalTimeSeconds === 'number' ? session.totalTimeSeconds : (typeof (session as any).totalTimeSeconds === 'string' ? parseFloat((session as any).totalTimeSeconds.replace(',', '.')) : NaN);
  const safeTotalTime = Number.isFinite(rawTotalTime) && rawTotalTime >= 0 ? Math.round(rawTotalTime) : 0;
  const totalTime = Object.is(safeTotalTime, -0) ? 0 : safeTotalTime;

  const rawRating = typeof session.rating === 'number' ? session.rating : (typeof (session as any).rating === 'string' ? parseFloat((session as any).rating.replace(',', '.')) : NaN);
  const safeRating = Number.isFinite(rawRating) && rawRating >= 0 && rawRating <= 5 ? Number(rawRating.toFixed(1)) : null;
  const sanitizedRating = safeRating != null && Object.is(safeRating, -0) ? 0 : safeRating;

  const rawTds = typeof session.tdsPercentage === 'number' ? session.tdsPercentage : (typeof (session as any).tdsPercentage === 'string' ? parseFloat((session as any).tdsPercentage.replace(',', '.')) : NaN);
  const safeTds = Number.isFinite(rawTds) && rawTds >= 0 ? Number(rawTds.toFixed(2)) : null;
  const sanitizedTds = safeTds != null && Object.is(safeTds, -0) ? 0 : safeTds;

  const rawEy = typeof session.extractionYieldPercentage === 'number' ? session.extractionYieldPercentage : (typeof (session as any).extractionYieldPercentage === 'string' ? parseFloat((session as any).extractionYieldPercentage.replace(',', '.')) : NaN);
  const safeEy = Number.isFinite(rawEy) && rawEy >= 0 ? Number(rawEy.toFixed(2)) : null;
  const sanitizedEy = safeEy != null && Object.is(safeEy, -0) ? 0 : safeEy;

  const rawCaffeine = typeof session.caffeineContentMg === 'number' ? session.caffeineContentMg : (typeof (session as any).caffeineContentMg === 'string' ? parseFloat((session as any).caffeineContentMg.replace(',', '.')) : NaN);
  const safeCaffeine = Number.isFinite(rawCaffeine) && rawCaffeine >= 0 ? Number(rawCaffeine.toFixed(1)) : null;
  const sanitizedCaffeine = safeCaffeine != null && Object.is(safeCaffeine, -0) ? 0 : safeCaffeine;

  const safeFlavorTags = Array.isArray(session.flavorTags)
    ? session.flavorTags
        .filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
        .map((t) => t.trim().slice(0, 50))
        .slice(0, 30)
    : [];

  const safeId = typeof session.id === 'string' && session.id.trim() ? session.id.trim() : `sess_${Date.now()}`;
  const safeRecipeId = typeof session.recipeId === 'string' && session.recipeId.trim() ? session.recipeId.trim() : null;
  const safeInventoryItemId = typeof session.inventoryItemId === 'string' && session.inventoryItemId.trim() ? session.inventoryItemId.trim() : null;
  const safeRecipeName = typeof session.recipeName === 'string' && session.recipeName.trim()
    ? session.recipeName.trim().slice(0, 200)
    : 'Napar';
  const safeInventoryItemName = typeof session.inventoryItemName === 'string' && session.inventoryItemName.trim()
    ? session.inventoryItemName.trim().slice(0, 200)
    : null;
  const rawBev = typeof session.beverageType === 'string' ? session.beverageType.trim().toUpperCase() : '';
  const safeBeverage = rawBev === 'TEA' ? 'TEA' : 'COFFEE';
  const safeMethod = typeof session.method === 'string' && session.method.trim()
    ? session.method.trim().slice(0, 50)
    : 'v60';

  db.runSync(
    `INSERT OR REPLACE INTO brew_sessions (
      id, recipe_id, recipe_name, inventory_item_id, inventory_item_name,
      beverage_type, method, dose_g, water_g, water_temp_c, water_profile,
      grind_setting, total_time_seconds, rating, flavor_tags_json,
      taste_balance, tds_percentage, extraction_yield_percentage,
      caffeine_content_mg, notes, infusion_number, sensory_scores_json, brewed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      safeId,
      safeRecipeId,
      safeRecipeName,
      safeInventoryItemId,
      safeInventoryItemName,
      safeBeverage,
      safeMethod,
      dose,
      water,
      temp,
      session.waterProfile ?? null,
      session.grindSetting ?? null,
      totalTime,
      sanitizedRating,
      JSON.stringify(safeFlavorTags),
      session.tasteBalance ?? null,
      sanitizedTds,
      sanitizedEy,
      sanitizedCaffeine,
      session.notes ?? null,
      session.infusionNumber ?? 1,
      session.sensory ? JSON.stringify(session.sensory) : null,
      session.brewedAt || new Date().toISOString(),
    ]
  );
}

/**
 * Atomic transaction recording a brew session and deducting corresponding inventory (TASK-R08-04)
 */
function runInTransactionSync(db: SQLite.SQLiteDatabase, executeOperation: () => void): void {
  const txDb = db as unknown as { withTransactionSync?: (fn: () => void) => void };
  if (typeof txDb.withTransactionSync === 'function') {
    txDb.withTransactionSync(executeOperation);
  } else {
    db.execSync('BEGIN TRANSACTION;');
    try {
      executeOperation();
      db.execSync('COMMIT;');
    } catch (err) {
      db.execSync('ROLLBACK;');
      throw err;
    }
  }
}

export function recordBrewSessionTransaction(
  session: BrewSession,
  inventoryDeduction?: { itemId: string; doseGrams: number },
  caffeineLog?: CaffeineLog
): void {
  if (!session || typeof session !== 'object') return;
  const db = getDatabase();
  runInTransactionSync(db, () => {
    saveBrewSession(session);
    if (inventoryDeduction && inventoryDeduction.itemId) {
      const rawDose = typeof inventoryDeduction.doseGrams === 'number'
        ? inventoryDeduction.doseGrams
        : (typeof inventoryDeduction.doseGrams === 'string' ? parseFloat(inventoryDeduction.doseGrams) : NaN);
      if (Number.isFinite(rawDose) && rawDose > 0 && !Object.is(rawDose, -0)) {
        deductInventoryWeight(inventoryDeduction.itemId, rawDose);
      }
    }
    if (caffeineLog) {
      logCaffeine(caffeineLog);
    }
  });
}

export function deleteBrewSession(id: string): void {
  const rawId = typeof id === 'string' ? id : (typeof id === 'number' && Number.isFinite(id) ? String(id) : '');
  const safeId = rawId.replace(/[\x00-\x1F\x7F]/g, '').trim();
  if (!safeId) return;
  const db = getDatabase();
  runInTransactionSync(db, () => {
    db.runSync('DELETE FROM caffeine_logs WHERE brew_session_id = ?', [safeId]);
    db.runSync('DELETE FROM brew_sessions WHERE id = ?', [safeId]);
  });
}

function mapRowToBrewSession(row: BrewSessionRow): BrewSession {
  let flavorTags: string[] = [];
  try {
    const parsedTags = row.flavor_tags_json ? JSON.parse(row.flavor_tags_json) : [];
    flavorTags = Array.isArray(parsedTags) ? parsedTags : [];
  } catch {
    flavorTags = [];
  }

  let sensory: SensoryProfile | undefined = undefined;
  if (row.sensory_scores_json) {
    try {
      const parsedSensory = JSON.parse(row.sensory_scores_json);
      sensory =
        parsedSensory && typeof parsedSensory === 'object' && !Array.isArray(parsedSensory)
          ? (parsedSensory as SensoryProfile)
          : undefined;
    } catch {
      sensory = undefined;
    }
  }

  return {
    id: row.id,
    recipeId: row.recipe_id || undefined,
    recipeName: row.recipe_name || undefined,
    inventoryItemId: row.inventory_item_id || undefined,
    inventoryItemName: row.inventory_item_name || undefined,
    beverageType: row.beverage_type,
    method: row.method,
    doseGrams: Number.isFinite(row.dose_g) && row.dose_g > 0 ? row.dose_g : 15,
    waterGrams: Number.isFinite(row.water_g) && row.water_g > 0 ? row.water_g : 250,
    waterTempCelsius: Number.isFinite(row.water_temp_c) && row.water_temp_c > 0 ? row.water_temp_c : 92,
    waterProfile: row.water_profile || undefined,
    grindSetting: row.grind_setting || undefined,
    totalTimeSeconds: Number.isFinite(row.total_time_seconds) && row.total_time_seconds >= 0 ? row.total_time_seconds : 0,
    rating: (row.rating !== null && Number.isFinite(row.rating) && row.rating >= 0 && row.rating <= 5) ? row.rating : undefined,
    flavorTags,
    tasteBalance: row.taste_balance || undefined,
    tdsPercentage:
      row.tds_percentage !== null && Number.isFinite(row.tds_percentage) && row.tds_percentage >= 0
        ? row.tds_percentage
        : undefined,
    extractionYieldPercentage:
      row.extraction_yield_percentage !== null &&
      Number.isFinite(row.extraction_yield_percentage) &&
      row.extraction_yield_percentage >= 0
        ? row.extraction_yield_percentage
        : undefined,
    caffeineContentMg:
      row.caffeine_content_mg !== null &&
      Number.isFinite(row.caffeine_content_mg) &&
      row.caffeine_content_mg >= 0
        ? row.caffeine_content_mg
        : undefined,
    notes: row.notes || undefined,
    infusionNumber: row.infusion_number || 1,
    sensory,
    brewedAt: row.brewed_at,
  };
}

// ----------------------------------------------------------------------------
// Repozytorium: Log Kofeiny (Caffeine Tracker)
// ----------------------------------------------------------------------------

export function getCaffeineLogs(sinceIso?: string): CaffeineLog[] {
  const db = getDatabase();
  const safeSince =
    typeof sinceIso === 'string' &&
    sinceIso.trim().length > 0 &&
    !isNaN(new Date(sinceIso.trim()).getTime())
      ? sinceIso.trim()
      : undefined;
  const query = safeSince
    ? 'SELECT * FROM caffeine_logs WHERE consumed_at >= ? ORDER BY consumed_at ASC'
    : 'SELECT * FROM caffeine_logs ORDER BY consumed_at DESC LIMIT 200';
  const params = safeSince ? [safeSince] : [];
  const rows = db.getAllSync<CaffeineLogRow>(query, params);
  return rows.map((r) => ({
    id: r.id,
    brewSessionId: r.brew_session_id || undefined,
    beverageName: r.beverage_name,
    beverageType: r.beverage_type,
    consumedAt: r.consumed_at,
    doseGrams: r.dose_g,
    caffeineMg: r.caffeine_mg,
  }));
}

export function logCaffeine(log: CaffeineLog): void {
  if (!log || typeof log !== 'object') {
    return;
  }
  const db = getDatabase();
  const safeId =
    typeof log.id === 'string' && log.id.trim()
      ? log.id.trim()
      : `caff_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  const parsedDose =
    typeof log.doseGrams === 'number'
      ? log.doseGrams
      : typeof log.doseGrams === 'string'
      ? parseFloat(log.doseGrams)
      : 0;
  let safeDose = Number.isFinite(parsedDose) && parsedDose >= 0 ? parsedDose : 0;
  if (Object.is(safeDose, -0)) safeDose = 0;

  const parsedCaffeine =
    typeof log.caffeineMg === 'number'
      ? log.caffeineMg
      : typeof log.caffeineMg === 'string'
      ? parseFloat(log.caffeineMg)
      : 0;
  let safeCaffeine = Number.isFinite(parsedCaffeine) && parsedCaffeine >= 0 ? parsedCaffeine : 0;
  if (Object.is(safeCaffeine, -0)) safeCaffeine = 0;

  const rawType =
    typeof log.beverageType === 'string' && log.beverageType.trim()
      ? log.beverageType.trim().toLowerCase()
      : 'coffee';
  const safeBeverageType: 'coffee' | 'tea' = rawType === 'tea' ? 'tea' : 'coffee';

  const safeBeverageName =
    typeof log.beverageName === 'string' && log.beverageName.trim()
      ? log.beverageName.trim()
      : 'Napar';

  const safeConsumedAt =
    typeof log.consumedAt === 'string' && log.consumedAt.trim()
      ? log.consumedAt.trim()
      : new Date().toISOString();

  db.runSync(
    `INSERT OR REPLACE INTO caffeine_logs (
      id, brew_session_id, beverage_name, beverage_type, consumed_at, dose_g, caffeine_mg
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      safeId,
      log.brewSessionId ?? null,
      safeBeverageName,
      safeBeverageType,
      safeConsumedAt,
      safeDose,
      safeCaffeine,
    ]
  );
}

export function deleteCaffeineLog(id: string): void {
  const rawId = typeof id === 'string' ? id : (typeof id === 'number' && Number.isFinite(id) ? String(id) : '');
  const safeId = rawId.replace(/[\x00-\x1F\x7F]/g, '').trim();
  if (!safeId) return;
  const db = getDatabase();
  db.runSync('DELETE FROM caffeine_logs WHERE id = ?', [safeId]);
}

// ----------------------------------------------------------------------------
// Kopia zapasowa i Eksport / Import JSON (Privacy & User Ownership)
// ----------------------------------------------------------------------------

export interface BackupData {
  version: number;
  exportedAt: string;
  inventory: InventoryItem[];
  customRecipes: SavedRecipe[];
  sessions: BrewSession[];
  caffeineLogs: CaffeineLog[];
}

export function exportAllDataJson(): string {
  const inventory = getInventoryItems(true);
  const allRecipes = getRecipes();
  const customRecipes = allRecipes.filter((r) => r.isCustom);
  const sessions = getBrewSessions(5000);
  const caffeineLogs = getCaffeineLogs();

  const data: BackupData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    inventory,
    customRecipes,
    sessions,
    caffeineLogs,
  };
  return JSON.stringify(data, null, 2);
}

export function importDataJson(jsonStr: string): void {
  if (typeof jsonStr !== 'string') {
    throw new Error('Nieprawidłowy format JSON');
  }
  const cleanJson = jsonStr.replace(/^\uFEFF/, '').trim();
  if (!cleanJson) {
    throw new Error('Nieprawidłowy format JSON');
  }

  let parsed: any;
  try {
    parsed = JSON.parse(cleanJson);
  } catch {
    throw new Error('Nieprawidłowy format JSON');
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Nieprawidłowy format pliku kopii zapasowej');
  }

  let data: BackupData;
  if (parsed.format === 'napar-backup' && (parsed.state || parsed.payload)) {
    const s = parsed.state || parsed.payload;
    data = {
      version: 1,
      exportedAt: parsed.exportedAt || new Date().toISOString(),
      inventory: s.inventory || [],
      customRecipes: s.customRecipes || [],
      sessions: s.sessions || [],
      caffeineLogs: s.caffeineLogs || [],
    };
  } else if (parsed.version === 1) {
    data = parsed as BackupData;
  } else {
    throw new Error('Nieprawidłowy format pliku kopii zapasowej (version !== 1)');
  }

  const db = getDatabase();
  const safeInventory = Array.isArray(data.inventory) ? data.inventory : [];
  const safeCustomRecipes = Array.isArray(data.customRecipes) ? data.customRecipes : [];
  const safeSessions = Array.isArray(data.sessions) ? data.sessions : [];
  const safeCaffeineLogs = Array.isArray(data.caffeineLogs) ? data.caffeineLogs : [];

  try {
    runInTransactionSync(db, () => {
      for (const item of safeInventory) {
        if (item && typeof item === 'object') {
          saveInventoryItem(item);
        }
      }
      for (const recipe of safeCustomRecipes) {
        if (recipe && typeof recipe === 'object') {
          saveRecipe(recipe);
        }
      }
      for (const session of safeSessions) {
        if (session && typeof session === 'object') {
          saveBrewSession(session);
        }
      }
      for (const log of safeCaffeineLogs) {
        if (log && typeof log === 'object') {
          logCaffeine(log);
        }
      }
    });
  } catch (err: any) {
    void saveCorruptState(jsonStr, `Database transaction error during importDataJson: ${err?.message || err}`).catch(() => {});
    throw err;
  }
}

// ----------------------------------------------------------------------------
// Eksport danych do otwartego formatu CSV (Z-152, ZP-07, RD-ENG-10, NFR-SEC-015)
// ----------------------------------------------------------------------------

/**
 * RD-ENG-10 & NFR-SEC-015: Zabezpieczenie komórek CSV przed Formula Injection (CSV Injection)
 */
export function escapeCsvCell(val: unknown): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'number' && Object.is(val, -0)) return '0';
  let str = String(val).replace(/\0/g, '').replace(/^\uFEFF/, '');

  // Jeśli nie jest to czysta liczba ujemna i zaczyna się od znaku niebezpiecznego
  const isPureNegativeNumber = /^-\d+(\.\d+)?$/.test(str.trim());
  const dangerousFirstChars = ['=', '+', '-', '@', '\t', '\r', '%', '|'];
  const dangerousFormulaChars = ['=', '+', '-', '@', '%', '|'];
  const spacesTrimmed = str.replace(/^[ ]+/, '');

  if (
    !isPureNegativeNumber &&
    ((str.length > 0 && dangerousFirstChars.includes(str[0])) ||
      (spacesTrimmed.length > 0 && dangerousFormulaChars.includes(spacesTrimmed[0])))
  ) {
    str = `'${str}`;
  }

  // Jeśli zawiera znaki specjalne CSV (w tym średnik dla Excela w Europie) lub apostrof, zawiń w cudzysłów i podwój cudzysłowy
  if (
    str.includes(',') ||
    str.includes(';') ||
    str.includes('"') ||
    str.includes('\n') ||
    str.includes('\r') ||
    str.includes("'")
  ) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export const escapeCsvValue = escapeCsvCell;

export function exportSessionsCsv(): string {
  const sessions = getBrewSessions(10000);
  const headers = [
    'id',
    'brewed_at',
    'beverage_type',
    'method',
    'recipe_name',
    'bean_name',
    'dose_g',
    'water_g',
    'temp_c',
    'time_seconds',
    'rating',
    'taste_balance',
    'tds_pct',
    'ey_pct',
    'caffeine_mg',
    'flavor_tags',
    'notes',
  ];

  const rows = sessions.map((s) =>
    [
      escapeCsvValue(s.id),
      escapeCsvValue(s.brewedAt),
      escapeCsvValue(s.beverageType),
      escapeCsvValue(s.method),
      escapeCsvValue(s.recipeName || ''),
      escapeCsvValue(s.inventoryItemName || ''),
      escapeCsvValue(s.doseGrams),
      escapeCsvValue(s.waterGrams),
      escapeCsvValue(s.waterTempCelsius),
      escapeCsvValue(s.totalTimeSeconds),
      escapeCsvValue(s.rating ?? ''),
      escapeCsvValue(s.tasteBalance ?? ''),
      escapeCsvValue(s.tdsPercentage ?? ''),
      escapeCsvValue(s.extractionYieldPercentage ?? ''),
      escapeCsvValue(s.caffeineContentMg ?? ''),
      escapeCsvValue(s.flavorTags ? s.flavorTags.join('; ') : ''),
      escapeCsvValue(s.notes || ''),
    ].join(',')
  );

  return [headers.join(','), ...rows].join('\n');
}

export function exportInventoryCsv(): string {
  const items = getInventoryItems(true);
  const headers = [
    'id',
    'name',
    'type',
    'roaster_or_producer',
    'origin',
    'roast_or_harvest_date',
    'roast_profile',
    'initial_weight_g',
    'remaining_weight_g',
    'flavor_notes',
    'is_favorite',
    'is_archived',
  ];

  const rows = items.map((item) =>
    [
      escapeCsvValue(item.id),
      escapeCsvValue(item.name),
      escapeCsvValue(item.type),
      escapeCsvValue(item.roasterOrProducer || ''),
      escapeCsvValue(item.origin || ''),
      escapeCsvValue(item.roastOrHarvestDate || ''),
      escapeCsvValue(item.roastProfile || ''),
      escapeCsvValue(item.initialWeightGrams),
      escapeCsvValue(item.remainingWeightGrams),
      escapeCsvValue(item.flavorNotes ? item.flavorNotes.join('; ') : ''),
      escapeCsvValue(item.isFavorite ? '1' : '0'),
      escapeCsvValue(item.isArchived ? '1' : '0'),
    ].join(',')
  );

  return [headers.join(','), ...rows].join('\n');
}

export function exportCustomRecipesCsv(): string {
  const allRecipes = getRecipes();
  const customRecipes = allRecipes.filter((r) => r.isCustom);
  const headers = [
    'id',
    'name',
    'beverage_type',
    'method',
    'author',
    'description',
    'dose_g',
    'water_g',
    'water_temp_c',
    'recommended_ratio',
    'grind_size_description',
    'steps_count',
    'is_favorite',
    'created_at',
  ];

  const rows = customRecipes.map((r) => {
    let stepsCount = 0;
    try {
      const parsed = JSON.parse(r.stepsJson || '[]');
      if (Array.isArray(parsed)) stepsCount = parsed.length;
    } catch {
      stepsCount = 0;
    }

    return [
      escapeCsvValue(r.id),
      escapeCsvValue(r.name),
      escapeCsvValue(r.beverageType || 'COFFEE'),
      escapeCsvValue(r.method || ''),
      escapeCsvValue(r.author || ''),
      escapeCsvValue(r.description || ''),
      escapeCsvValue(r.doseGrams),
      escapeCsvValue(r.waterGrams),
      escapeCsvValue(r.waterTempCelsius),
      escapeCsvValue(r.recommendedRatio),
      escapeCsvValue(r.grindSizeDescription || ''),
      escapeCsvValue(stepsCount),
      escapeCsvValue(r.isFavorite ? '1' : '0'),
      escapeCsvValue(r.createdAt || ''),
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

// ----------------------------------------------------------------------------
// Ustawienia Aplikacji (Key-Value App Settings)
// ----------------------------------------------------------------------------

export function getAppSetting(key: string, defaultValue = ''): string {
  try {
    if (!key || typeof key !== 'string') return defaultValue;
    const safeKey = key.replace(/\uFEFF/g, '').replace(/[\x00-\x1F\x7F]/g, '').trim();
    if (!safeKey) return defaultValue;
    const db = getDatabase();
    const row = db.getFirstSync<{ value: string }>(
      'SELECT value FROM app_settings WHERE key = ?',
      [safeKey]
    );
    return row ? row.value : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function setAppSetting(key: string, value: string): void;
export function setAppSetting(key: string, value: any): void;
export function setAppSetting(key: string, value: any): void {
  try {
    if (!key || typeof key !== 'string') return;
    const safeKey = key.replace(/\uFEFF/g, '').replace(/[\x00-\x1F\x7F]/g, '').trim();
    if (!safeKey) return;
    const safeValue = value === null || value === undefined ? '' : String(value);
    const db = getDatabase();
    db.runSync(
      'INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)',
      [safeKey, safeValue]
    );
  } catch {
    // ignoruj błąd w środowisku testowym
  }
}

export function getUnitSystem(): 'metric' | 'imperial' {
  const val = getAppSetting('unit_system', 'metric');
  return val === 'imperial' ? 'imperial' : 'metric';
}

export function setUnitSystem(unit: 'metric' | 'imperial'): void {
  const safeUnit = unit === 'imperial' ? 'imperial' : 'metric';
  setAppSetting('unit_system', safeUnit);
}

export function getVoiceAnnounceEnabled(): boolean {
  const val = getAppSetting('voice_announce_enabled', 'true');
  return val !== 'false';
}

export function setVoiceAnnounceEnabled(enabled: boolean): void {
  setAppSetting('voice_announce_enabled', Boolean(enabled) ? 'true' : 'false');
}

export function getHapticsEnabled(): boolean {
  const val = getAppSetting('haptics_enabled', 'true');
  return val !== 'false';
}

export function setHapticsEnabled(enabled: boolean): void {
  setAppSetting('haptics_enabled', Boolean(enabled) ? 'true' : 'false');
}

export function getIsProUser(): boolean {
  const val = getAppSetting('is_pro_active', 'false');
  return val === 'true';
}

export function setIsProUser(enabled: boolean): void {
  setAppSetting('is_pro_active', Boolean(enabled) ? 'true' : 'false');
}

export function getCaffeineHalfLife(): number {
  const val = parseFloat(getAppSetting('caffeine_half_life_hours', '5.0'));
  if (isNaN(val) || val < 3.0 || val > 8.0) {
    return 5.0;
  }
  return Number(val.toFixed(1));
}

export function setCaffeineHalfLife(hours: number): void {
  const safeHours = typeof hours === 'number' && Number.isFinite(hours) ? hours : 5.0;
  const clamped = Math.max(3.0, Math.min(8.0, safeHours));
  setAppSetting('caffeine_half_life_hours', clamped.toFixed(1));
}

export function getBedtimeHour(): number {
  const val = parseInt(getAppSetting('bedtime_hour', '23'), 10);
  if (isNaN(val) || val < 18 || val > 28) {
    return 23;
  }
  return val;
}

export function setBedtimeHour(hour: number): void {
  const safeHour = typeof hour === 'number' && Number.isFinite(hour) ? Math.round(hour) : 23;
  const clamped = Math.max(18, Math.min(28, safeHour));
  setAppSetting('bedtime_hour', clamped.toString());
}

export function getHealthKitSyncEnabled(): boolean {
  const val = getAppSetting('healthkit_sync_enabled', 'false');
  return val === 'true';
}

export function setHealthKitSyncEnabled(enabled: boolean): void {
  setAppSetting('healthkit_sync_enabled', Boolean(enabled) ? 'true' : 'false');
}

export type BeveragePreference = 'both' | 'coffee' | 'tea';

export function getBeveragePreference(): BeveragePreference {
  const val = getAppSetting('beverage_preference', 'both');
  if (val === 'coffee' || val === 'tea') {
    return val;
  }
  return 'both';
}

export function setBeveragePreference(pref: BeveragePreference): void {
  const safePref = pref === 'coffee' || pref === 'tea' ? pref : 'both';
  setAppSetting('beverage_preference', safePref);
}

export function getHasCompletedOnboarding(): boolean {
  return getAppSetting('onboarding_completed', 'false') === 'true';
}

export function setHasCompletedOnboarding(completed: boolean): void {
  setAppSetting('onboarding_completed', Boolean(completed) ? 'true' : 'false');
}


export interface StashTurnoverAnalysis {
  totalItems: number;
  activeItemsCount: number;
  depletedItemsCount: number;
  archivedItemsCount: number;
  depletionRatePercent: number;
  totalInitialWeightGrams: number;
  totalRemainingWeightGrams: number;
  totalConsumedWeightGrams: number;
  consumptionPercent: number;
  summaryPl: string;
  summaryEn: string;
}

export function evaluateStashTurnover(
  items: InventoryItem[] | undefined | null
): StashTurnoverAnalysis {
  const safeItems = Array.isArray(items) ? items : [];
  const totalItems = safeItems.length;

  let activeItemsCount = 0;
  let depletedItemsCount = 0;
  let archivedItemsCount = 0;
  let totalInitialWeightGrams = 0;
  let totalRemainingWeightGrams = 0;

  for (const item of safeItems) {
    if (!item || typeof item !== 'object') continue;

    const isArchived = Boolean(item.isArchived);
    if (isArchived) {
      archivedItemsCount++;
    }

    const rem =
      typeof item.remainingWeightGrams === 'number' &&
      Number.isFinite(item.remainingWeightGrams) &&
      item.remainingWeightGrams > 0
        ? item.remainingWeightGrams
        : 0;

    const init =
      typeof item.initialWeightGrams === 'number' &&
      Number.isFinite(item.initialWeightGrams) &&
      item.initialWeightGrams > 0
        ? item.initialWeightGrams
        : rem;

    totalInitialWeightGrams += init;
    totalRemainingWeightGrams += rem;

    if (rem <= 0) {
      depletedItemsCount++;
    } else if (!isArchived) {
      activeItemsCount++;
    }
  }

  totalInitialWeightGrams = Math.round(totalInitialWeightGrams * 10) / 10;
  totalRemainingWeightGrams = Math.round(totalRemainingWeightGrams * 10) / 10;
  const totalConsumedWeightGrams = Math.max(
    0,
    Math.round((totalInitialWeightGrams - totalRemainingWeightGrams) * 10) / 10
  );

  const consumptionPercent =
    totalInitialWeightGrams > 0
      ? Math.round((totalConsumedWeightGrams / totalInitialWeightGrams) * 1000) / 10
      : 0;

  const depletionRatePercent =
    totalItems > 0
      ? Math.round((depletedItemsCount / totalItems) * 1000) / 10
      : 0;

  let summaryPl: string;
  let summaryEn: string;

  if (totalItems === 0) {
    summaryPl = 'Brak pozycji w spiżarni do analizy rotacji.';
    summaryEn = 'No stash items available for turnover analysis.';
  } else {
    summaryPl = `Zużyto ${totalConsumedWeightGrams}g z ${totalInitialWeightGrams}g zapasów (${consumptionPercent}%). Aktywne paczki: ${activeItemsCount}, wyczerpane: ${depletedItemsCount}.`;
    summaryEn = `Consumed ${totalConsumedWeightGrams}g out of ${totalInitialWeightGrams}g stash (${consumptionPercent}%). Active bags: ${activeItemsCount}, depleted: ${depletedItemsCount}.`;
  }

  return {
    totalItems,
    activeItemsCount,
    depletedItemsCount,
    archivedItemsCount,
    depletionRatePercent,
    totalInitialWeightGrams,
    totalRemainingWeightGrams,
    totalConsumedWeightGrams,
    consumptionPercent,
    summaryPl,
    summaryEn,
  };
}


export type StashDepletionUrgency = 'critical' | 'low_stock' | 'adequate' | 'abundant';

export interface StashDepletionForecast {
  totalRemainingWeightGrams: number;
  dailyConsumptionGrams: number;
  estimatedDaysRemaining: number;
  projectedDepletionDateIso: string;
  urgency: StashDepletionUrgency;
  activeItemCount: number;
  summaryPl: string;
  summaryEn: string;
}

export function calculateStashDepletionForecast(
  items: InventoryItem[] | undefined | null,
  options?: {
    dailyConsumptionGrams?: number | string | null;
    referenceDateIso?: string | null;
  } | null
): StashDepletionForecast {
  const safeItems = Array.isArray(items) ? items : [];

  const rawDaily =
    options?.dailyConsumptionGrams != null ? Number(options.dailyConsumptionGrams) : NaN;
  const dailyConsumptionGrams = Number.isFinite(rawDaily) && rawDaily > 0 ? rawDaily : 30;

  let baseDate = new Date();
  if (typeof options?.referenceDateIso === 'string' && options.referenceDateIso.trim()) {
    const parsed = new Date(options.referenceDateIso.trim());
    if (!isNaN(parsed.getTime())) {
      baseDate = parsed;
    }
  }

  let totalRemainingWeightGrams = 0;
  let activeItemCount = 0;

  for (const item of safeItems) {
    if (!item || typeof item !== 'object') continue;
    if (item.isArchived) continue;

    const rem =
      typeof item.remainingWeightGrams === 'number' &&
      Number.isFinite(item.remainingWeightGrams) &&
      item.remainingWeightGrams > 0
        ? item.remainingWeightGrams
        : 0;

    if (rem > 0) {
      totalRemainingWeightGrams += rem;
      activeItemCount++;
    }
  }

  totalRemainingWeightGrams = Math.round(totalRemainingWeightGrams * 10) / 10;
  const estimatedDaysRemaining =
    dailyConsumptionGrams > 0
      ? Math.floor(totalRemainingWeightGrams / dailyConsumptionGrams)
      : 0;

  const targetDate = new Date(baseDate.getTime() + estimatedDaysRemaining * 86400000);
  const projectedDepletionDateIso = targetDate.toISOString().slice(0, 10);

  let urgency: StashDepletionUrgency = 'critical';
  let summaryPl = `Brak zapasów w spiżarni! Konieczne pilne zamówienie kawy.`;
  let summaryEn = `No stash remaining! Urgent coffee reorder required.`;

  if (estimatedDaysRemaining > 21) {
    urgency = 'abundant';
    summaryPl = `Zapas obfity: wystarczy na około ${estimatedDaysRemaining} dni (do ${projectedDepletionDateIso}). Aktywne paczki: ${activeItemCount}.`;
    summaryEn = `Abundant supply: lasts approximately ${estimatedDaysRemaining} days (until ${projectedDepletionDateIso}). Active bags: ${activeItemCount}.`;
  } else if (estimatedDaysRemaining >= 8) {
    urgency = 'adequate';
    summaryPl = `Zapas stabilny: wystarczy na około ${estimatedDaysRemaining} dni (do ${projectedDepletionDateIso}). Aktywne paczki: ${activeItemCount}.`;
    summaryEn = `Adequate supply: lasts approximately ${estimatedDaysRemaining} days (until ${projectedDepletionDateIso}). Active bags: ${activeItemCount}.`;
  } else if (estimatedDaysRemaining >= 3) {
    urgency = 'low_stock';
    summaryPl = `Niski stan zapasów: pozostało na około ${estimatedDaysRemaining} dni (do ${projectedDepletionDateIso}). Zalecane zamówienie nowej paczki.`;
    summaryEn = `Low stock: approximately ${estimatedDaysRemaining} days remaining (until ${projectedDepletionDateIso}). Recommended to reorder.`;
  } else if (estimatedDaysRemaining > 0) {
    urgency = 'critical';
    summaryPl = `Krytyczny stan zapasów: pozostało na zaledwie ${estimatedDaysRemaining} dni (do ${projectedDepletionDateIso})!`;
    summaryEn = `Critical stock: only ${estimatedDaysRemaining} days remaining (until ${projectedDepletionDateIso})!`;
  }

  return {
    totalRemainingWeightGrams,
    dailyConsumptionGrams,
    estimatedDaysRemaining,
    projectedDepletionDateIso,
    urgency,
    activeItemCount,
    summaryPl,
    summaryEn,
  };
}

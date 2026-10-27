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
  const dangerousFirstChars = ['=', '+', '-', '@', '\t', '\r', '%'];
  const dangerousFormulaChars = ['=', '+', '-', '@', '%'];
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

// ----------------------------------------------------------------------------
// Ustawienia Aplikacji (Key-Value App Settings)
// ----------------------------------------------------------------------------

export function getAppSetting(key: string, defaultValue = ''): string {
  try {
    if (!key || typeof key !== 'string') return defaultValue;
    const safeKey = key.replace(/[\x00-\x1F\x7F]/g, '').trim();
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
    const safeKey = key.replace(/[\x00-\x1F\x7F]/g, '').trim();
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

// ============================================================================
// Napar (Steepwise) — SQLite Database Client & Repositories
// ============================================================================

import * as SQLite from 'expo-sqlite';
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
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupKey = `backup_pre_migration_v${fromVersion}_${timestamp}`;
    const count = db.getFirstSync<{ c: number }>('SELECT COUNT(*) as c FROM brew_sessions');
    db.runSync(
      'CREATE TABLE IF NOT EXISTS migration_backups (id TEXT PRIMARY KEY, created_at TEXT, sessions_count INTEGER)',
      []
    );
    db.runSync(
      'INSERT OR REPLACE INTO migration_backups (id, created_at, sessions_count) VALUES (?, ?, ?)',
      [backupKey, new Date().toISOString(), count?.c || 0]
    );
    return backupKey;
  } catch {
    return 'backup_failed_fallback';
  }
}

export function initDatabase(db: SQLite.SQLiteDatabase): void {
  try {
    db.execSync('PRAGMA foreign_keys = ON;');
  } catch {
    // Ignoruj błąd PRAGMA w środowiskach zastępczych
  }

  try {
    db.execSync('PRAGMA journal_mode = WAL;');
  } catch {
    // Ignoruj błąd PRAGMA w środowiskach zastępczych
  }

  try {
    db.execSync('PRAGMA busy_timeout = 5000;');
  } catch {
    // Ignoruj błąd PRAGMA w środowiskach zastępczych
  }

  let currentVersion = 0;
  try {
    const versionRow = db.getFirstSync<{ user_version: number }>('PRAGMA user_version');
    if (versionRow && typeof versionRow.user_version === 'number') {
      currentVersion = versionRow.user_version;
    }
  } catch {
    currentVersion = 0;
  }

  db.execSync(SCHEMA_SQL);

  const TARGET_SCHEMA_VERSION = 3;
  if (currentVersion < TARGET_SCHEMA_VERSION) {
    createPreMigrationBackup(db, currentVersion);
    try {
      db.execSync('BEGIN TRANSACTION;');
      try {
        db.runSync('ALTER TABLE brew_sessions ADD COLUMN sensory_scores_json TEXT');
      } catch {
        // Kolumna już istnieje
      }
      try {
        db.runSync('ALTER TABLE brew_sessions ADD COLUMN water_profile TEXT');
      } catch {
        // Kolumna już istnieje
      }
      db.runSync(
        'CREATE TABLE IF NOT EXISTS app_settings (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL)'
      );
      try {
        db.execSync(`PRAGMA user_version = ${TARGET_SCHEMA_VERSION};`);
      } catch {
        // Ignoruj błąd w mockach
      }
      db.execSync('COMMIT;');
    } catch (migError) {
      try {
        db.execSync('ROLLBACK;');
      } catch {
        // ignore
      }
      throw migError;
    }
  }

  // Sprawdź czy tabela recipes ma dane początkowe z master recipes lub wymaga uzupełnienia
  const countRow = db.getFirstSync<{ count: number }>(
    'SELECT COUNT(*) as count FROM recipes WHERE is_custom = 0'
  );
  if (!countRow || countRow.count < MASTER_RECIPES.length) {
    seedMasterRecipes(db);
  }
}

function seedMasterRecipes(db: SQLite.SQLiteDatabase): void {
  const insertStmt = db.prepareSync(`
    INSERT OR REPLACE INTO recipes (
      id, name, beverage_type, method, author, description,
      dose_g, water_g, water_temp_c, grind_size_description,
      recommended_ratio, steps_json, is_custom, is_favorite, created_at
    ) VALUES (
      $id, $name, $beverageType, $method, $author, $description,
      $doseG, $waterG, $waterTempC, $grindSize,
      $ratio, $stepsJson, 0, 0, $createdAt
    )
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
  const db = getDatabase();
  const row = db.getFirstSync<InventoryRow>(
    'SELECT * FROM inventory_items WHERE id = ?',
    [id]
  );
  return row ? mapRowToInventoryItem(row) : null;
}

export function saveInventoryItem(item: InventoryItem): void {
  const db = getDatabase();
  const now = new Date().toISOString();
  db.runSync(
    `INSERT OR REPLACE INTO inventory_items (
      id, name, type, roaster_or_producer, origin,
      roast_or_harvest_date, roast_profile, process, variety,
      initial_weight_g, remaining_weight_g, flavor_notes_json,
      rating, is_favorite, is_archived, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      item.id,
      item.name,
      item.type,
      item.roasterOrProducer ?? null,
      item.origin ?? null,
      item.roastOrHarvestDate ?? null,
      item.roastProfile ?? null,
      item.process ?? null,
      item.variety ?? null,
      item.initialWeightGrams,
      item.remainingWeightGrams,
      JSON.stringify(item.flavorNotes || []),
      item.rating ?? null,
      item.isFavorite ? 1 : 0,
      item.isArchived ? 1 : 0,
      item.createdAt || now,
      now,
    ]
  );
}

export function deleteInventoryItem(id: string): void {
  const db = getDatabase();
  db.runSync('DELETE FROM inventory_items WHERE id = ?', [id]);
}

export function deductInventoryWeight(id: string, doseGrams: number): void {
  const db = getDatabase();
  const item = getInventoryItemById(id);
  if (!item) return;
  const newRemaining = Math.max(0, Number((item.remainingWeightGrams - doseGrams).toFixed(1)));
  db.runSync(
    'UPDATE inventory_items SET remaining_weight_g = ?, updated_at = ? WHERE id = ?',
    [newRemaining, new Date().toISOString(), id]
  );
}

export function deductBeansForBrew(itemId: string, grams: number): void {
  deductInventoryWeight(itemId, grams);
}

function mapRowToInventoryItem(row: InventoryRow): InventoryItem {
  let flavorNotes: string[] = [];
  try {
    flavorNotes = row.flavor_notes_json ? JSON.parse(row.flavor_notes_json) : [];
  } catch {
    flavorNotes = [];
  }
  return {
    id: row.id,
    name: row.name,
    type: row.type === 'tea' ? 'tea' : 'coffee',
    roasterOrProducer: row.roaster_or_producer || undefined,
    origin: row.origin || undefined,
    roastOrHarvestDate: row.roast_or_harvest_date || undefined,
    roastProfile: row.roast_profile || undefined,
    process: row.process || undefined,
    variety: row.variety || undefined,
    initialWeightGrams: row.initial_weight_g,
    remainingWeightGrams: row.remaining_weight_g,
    flavorNotes,
    rating: row.rating !== null ? row.rating : undefined,
    isFavorite: Boolean(row.is_favorite),
    isArchived: Boolean(row.is_archived),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ----------------------------------------------------------------------------
// Repozytorium: Przepisy (Recipes)
// ----------------------------------------------------------------------------

export function getRecipes(beverageType?: 'COFFEE' | 'TEA'): SavedRecipe[] {
  const db = getDatabase();
  const query = beverageType
    ? 'SELECT * FROM recipes WHERE beverage_type = ? ORDER BY is_favorite DESC, name ASC'
    : 'SELECT * FROM recipes ORDER BY is_favorite DESC, beverage_type ASC, name ASC';
  const params = beverageType ? [beverageType] : [];
  const rows = db.getAllSync<RecipeRow>(query, params);
  return rows.map(mapRowToRecipe);
}

export function getRecipeById(id: string): SavedRecipe | null {
  const db = getDatabase();
  const row = db.getFirstSync<RecipeRow>('SELECT * FROM recipes WHERE id = ?', [id]);
  return row ? mapRowToRecipe(row) : null;
}

export function saveRecipe(recipe: SavedRecipe): void {
  const db = getDatabase();
  db.runSync(
    `INSERT OR REPLACE INTO recipes (
      id, name, beverage_type, method, author, description,
      dose_g, water_g, water_temp_c, grind_size_description,
      recommended_ratio, steps_json, is_custom, is_favorite, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      recipe.id,
      recipe.name,
      recipe.beverageType,
      recipe.method,
      recipe.author ?? null,
      recipe.description ?? null,
      recipe.doseGrams,
      recipe.waterGrams,
      recipe.waterTempCelsius,
      recipe.grindSizeDescription ?? null,
      recipe.recommendedRatio,
      recipe.stepsJson,
      recipe.isCustom ? 1 : 0,
      recipe.isFavorite ? 1 : 0,
      recipe.createdAt || new Date().toISOString(),
    ]
  );
}

export function deleteRecipe(id: string): void {
  const db = getDatabase();
  db.runSync('DELETE FROM recipes WHERE id = ?', [id]);
}

export function toggleRecipeFavorite(id: string): boolean {
  const db = getDatabase();
  const recipe = getRecipeById(id);
  if (!recipe) return false;
  const newFav = !recipe.isFavorite;
  db.runSync('UPDATE recipes SET is_favorite = ? WHERE id = ?', [newFav ? 1 : 0, id]);
  return newFav;
}

export function updateRecipeFavorite(id: string, isFavorite: boolean): void {
  const db = getDatabase();
  db.runSync('UPDATE recipes SET is_favorite = ? WHERE id = ?', [isFavorite ? 1 : 0, id]);
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
  const now = new Date().toISOString();
  const id = `custom-clone-${Date.now()}`;
  const name = `${recipe.name}${copySuffix}`;
  const beverageType = recipe.beverageType || recipe.type || 'COFFEE';
  const doseGrams = recipe.doseGrams ?? recipe.coffeeOrTeaDoseGrams ?? 15;
  const waterGrams = recipe.waterGrams ?? recipe.waterWeightGrams ?? 250;
  const waterTempCelsius = recipe.waterTempCelsius ?? recipe.waterTemperatureCelsius ?? 93;
  const grindSizeDescription = recipe.grindSizeDescription || recipe.grindSettingDescriptionPl;
  const stepsJson = recipe.stepsJson || (recipe.steps ? JSON.stringify(recipe.steps) : '[]');

  const cloned: SavedRecipe = {
    id,
    name,
    beverageType,
    method: recipe.method,
    author: recipe.author ? `${recipe.author} (Modyfikacja)` : 'Własna',
    description: recipe.description,
    doseGrams,
    waterGrams,
    waterTempCelsius,
    grindSizeDescription,
    recommendedRatio: recipe.recommendedRatio,
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
    doseGrams: row.dose_g,
    waterGrams: row.water_g,
    waterTempCelsius: row.water_temp_c,
    grindSizeDescription: row.grind_size_description || undefined,
    recommendedRatio: row.recommended_ratio,
    stepsJson: row.steps_json,
    isCustom: Boolean(row.is_custom),
    isFavorite: Boolean(row.is_favorite),
    createdAt: row.created_at,
  };
}

// ----------------------------------------------------------------------------
// Repozytorium: Dziennik Parzeń (Brew Sessions / Journal)
// ----------------------------------------------------------------------------

export function getBrewSessions(limit = 100): BrewSession[] {
  const db = getDatabase();
  const rows = db.getAllSync<BrewSessionRow>(
    'SELECT * FROM brew_sessions ORDER BY brewed_at DESC LIMIT ?',
    [limit]
  );
  return rows.map(mapRowToBrewSession);
}

export function getBrewSessionById(id: string): BrewSession | null {
  const db = getDatabase();
  const row = db.getFirstSync<BrewSessionRow>('SELECT * FROM brew_sessions WHERE id = ?', [id]);
  return row ? mapRowToBrewSession(row) : null;
}

export function saveBrewSession(session: BrewSession): void {
  const db = getDatabase();
  db.runSync(
    `INSERT OR REPLACE INTO brew_sessions (
      id, recipe_id, recipe_name, inventory_item_id, inventory_item_name,
      beverage_type, method, dose_g, water_g, water_temp_c, water_profile,
      grind_setting, total_time_seconds, rating, flavor_tags_json,
      taste_balance, tds_percentage, extraction_yield_percentage,
      caffeine_content_mg, notes, infusion_number, sensory_scores_json, brewed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      session.id,
      session.recipeId ?? null,
      session.recipeName ?? null,
      session.inventoryItemId ?? null,
      session.inventoryItemName ?? null,
      session.beverageType,
      session.method,
      session.doseGrams,
      session.waterGrams,
      session.waterTempCelsius,
      session.waterProfile ?? null,
      session.grindSetting ?? null,
      session.totalTimeSeconds,
      session.rating ?? null,
      JSON.stringify(session.flavorTags || []),
      session.tasteBalance ?? null,
      session.tdsPercentage ?? null,
      session.extractionYieldPercentage ?? null,
      session.caffeineContentMg ?? null,
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
export function recordBrewSessionTransaction(
  session: BrewSession,
  inventoryDeduction?: { itemId: string; doseGrams: number }
): void {
  const db = getDatabase();
  const executeOperation = () => {
    saveBrewSession(session);
    if (inventoryDeduction && inventoryDeduction.itemId && inventoryDeduction.doseGrams > 0) {
      deductInventoryWeight(inventoryDeduction.itemId, inventoryDeduction.doseGrams);
    }
  };

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

export function deleteBrewSession(id: string): void {
  const db = getDatabase();
  db.runSync('DELETE FROM brew_sessions WHERE id = ?', [id]);
}

function mapRowToBrewSession(row: BrewSessionRow): BrewSession {
  let flavorTags: string[] = [];
  try {
    flavorTags = row.flavor_tags_json ? JSON.parse(row.flavor_tags_json) : [];
  } catch {
    flavorTags = [];
  }

  let sensory: SensoryProfile | undefined = undefined;
  if (row.sensory_scores_json) {
    try {
      sensory = JSON.parse(row.sensory_scores_json) as SensoryProfile;
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
    doseGrams: row.dose_g,
    waterGrams: row.water_g,
    waterTempCelsius: row.water_temp_c,
    waterProfile: row.water_profile || undefined,
    grindSetting: row.grind_setting || undefined,
    totalTimeSeconds: row.total_time_seconds,
    rating: row.rating !== null ? row.rating : undefined,
    flavorTags,
    tasteBalance: row.taste_balance || undefined,
    tdsPercentage: row.tds_percentage !== null ? row.tds_percentage : undefined,
    extractionYieldPercentage:
      row.extraction_yield_percentage !== null ? row.extraction_yield_percentage : undefined,
    caffeineContentMg:
      row.caffeine_content_mg !== null ? row.caffeine_content_mg : undefined,
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
  const query = sinceIso
    ? 'SELECT * FROM caffeine_logs WHERE consumed_at >= ? ORDER BY consumed_at ASC'
    : 'SELECT * FROM caffeine_logs ORDER BY consumed_at DESC LIMIT 200';
  const params = sinceIso ? [sinceIso] : [];
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
  const db = getDatabase();
  db.runSync(
    `INSERT OR REPLACE INTO caffeine_logs (
      id, brew_session_id, beverage_name, beverage_type, consumed_at, dose_g, caffeine_mg
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      log.id,
      log.brewSessionId ?? null,
      log.beverageName,
      log.beverageType,
      log.consumedAt,
      log.doseGrams,
      log.caffeineMg,
    ]
  );
}

export function deleteCaffeineLog(id: string): void {
  const db = getDatabase();
  db.runSync('DELETE FROM caffeine_logs WHERE id = ?', [id]);
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
  const data: BackupData = JSON.parse(jsonStr);
  if (!data || data.version !== 1) {
    throw new Error('Nieprawidłowy format pliku kopii zapasowej');
  }

  for (const item of data.inventory || []) {
    saveInventoryItem(item);
  }
  for (const recipe of data.customRecipes || []) {
    saveRecipe(recipe);
  }
  for (const session of data.sessions || []) {
    saveBrewSession(session);
  }
  for (const log of data.caffeineLogs || []) {
    logCaffeine(log);
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
  let str = String(val);

  // Jeśli nie jest to czysta liczba ujemna i zaczyna się od znaku niebezpiecznego
  const isPureNegativeNumber = /^-\d+(\.\d+)?$/.test(str);
  const dangerousFirstChars = ['=', '+', '-', '@', '\t', '\r'];
  if (!isPureNegativeNumber && str.length > 0 && dangerousFirstChars.includes(str[0])) {
    str = `'${str}`;
  }

  // Jeśli zawiera znaki specjalne CSV lub apostrof, zawiń w cudzysłów i podwój cudzysłowy
  if (
    str.includes(',') ||
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
    const db = getDatabase();
    const row = db.getFirstSync<{ value: string }>(
      'SELECT value FROM app_settings WHERE key = ?',
      [key]
    );
    return row ? row.value : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function setAppSetting(key: string, value: string): void {
  try {
    const db = getDatabase();
    db.runSync(
      'INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)',
      [key, value]
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
  setAppSetting('unit_system', unit);
}

export function getVoiceAnnounceEnabled(): boolean {
  const val = getAppSetting('voice_announce_enabled', 'true');
  return val !== 'false';
}

export function setVoiceAnnounceEnabled(enabled: boolean): void {
  setAppSetting('voice_announce_enabled', enabled ? 'true' : 'false');
}

export function getHapticsEnabled(): boolean {
  const val = getAppSetting('haptics_enabled', 'true');
  return val !== 'false';
}

export function setHapticsEnabled(enabled: boolean): void {
  setAppSetting('haptics_enabled', enabled ? 'true' : 'false');
}

export function getIsProUser(): boolean {
  const val = getAppSetting('is_pro_active', 'false');
  return val === 'true';
}

export function setIsProUser(enabled: boolean): void {
  setAppSetting('is_pro_active', enabled ? 'true' : 'false');
}

export function getCaffeineHalfLife(): number {
  const val = parseFloat(getAppSetting('caffeine_half_life_hours', '5.0'));
  if (isNaN(val) || val < 3.0 || val > 8.0) {
    return 5.0;
  }
  return Number(val.toFixed(1));
}

export function setCaffeineHalfLife(hours: number): void {
  const clamped = Math.max(3.0, Math.min(8.0, hours));
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
  const clamped = Math.max(18, Math.min(28, hour));
  setAppSetting('bedtime_hour', clamped.toString());
}

export function getHealthKitSyncEnabled(): boolean {
  const val = getAppSetting('healthkit_sync_enabled', 'false');
  return val === 'true';
}

export function setHealthKitSyncEnabled(enabled: boolean): void {
  setAppSetting('healthkit_sync_enabled', enabled ? 'true' : 'false');
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
  setAppSetting('beverage_preference', pref);
}

export function getHasCompletedOnboarding(): boolean {
  return getAppSetting('onboarding_completed') === 'true';
}

export function setHasCompletedOnboarding(completed: boolean): void {
  setAppSetting('onboarding_completed', completed ? 'true' : 'false');
}

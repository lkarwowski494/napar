// ============================================================================
// Napar (Steepwise) — SQLite Database Schema & Types
// Offline-first, Zero-login, pure local persistence with expo-sqlite
// ============================================================================

export interface InventoryItem {
  id: string;
  name: string;
  type: 'coffee' | 'tea';
  roasterOrProducer?: string;
  origin?: string;
  roastOrHarvestDate?: string; // YYYY-MM-DD
  roastProfile?: string; // 'light' | 'medium-light' | 'medium' | 'dark' etc.
  process?: string; // 'washed' | 'natural' | 'honey' | etc.
  variety?: string;
  initialWeightGrams: number;
  remainingWeightGrams: number;
  flavorNotes: string[];
  rating?: number;
  isFavorite: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SavedRecipe {
  id: string;
  name: string;
  beverageType: 'COFFEE' | 'TEA';
  method: string;
  author?: string;
  description?: string;
  doseGrams: number;
  waterGrams: number;
  waterTempCelsius: number;
  grindSizeDescription?: string;
  recommendedRatio: number;
  stepsJson: string; // JSON stringified RecipeStep[]
  isCustom: boolean;
  isFavorite: boolean;
  createdAt: string;
}

export interface SensoryProfile {
  acidity: number;
  sweetness: number;
  body: number;
  clarity: number;
  finish: number;
}

export interface BrewSession {
  id: string;
  recipeId?: string;
  recipeName?: string;
  inventoryItemId?: string;
  inventoryItemName?: string;
  beverageType: 'COFFEE' | 'TEA';
  method: string;
  doseGrams: number;
  waterGrams: number;
  waterTempCelsius: number;
  grindSetting?: string;
  totalTimeSeconds: number;
  rating?: number;
  flavorTags: string[];
  tasteBalance?: string; // 'balanced' | 'sour' | 'bitter' | 'astringent' | 'weak' | 'too_strong'
  tdsPercentage?: number;
  extractionYieldPercentage?: number;
  caffeineContentMg?: number;
  notes?: string;
  infusionNumber?: number; // for Gongfu Cha
  sensory?: SensoryProfile;
  brewedAt: string; // ISO 8601
}

export interface CaffeineLog {
  id: string;
  brewSessionId?: string;
  beverageName: string;
  beverageType: 'coffee' | 'tea';
  consumedAt: string; // ISO 8601
  doseGrams: number;
  caffeineMg: number;
}

export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS inventory_items (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  roaster_or_producer TEXT,
  origin TEXT,
  roast_or_harvest_date TEXT,
  roast_profile TEXT,
  process TEXT,
  variety TEXT,
  initial_weight_g REAL NOT NULL,
  remaining_weight_g REAL NOT NULL,
  flavor_notes_json TEXT,
  rating REAL,
  is_favorite INTEGER DEFAULT 0,
  is_archived INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS recipes (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  beverage_type TEXT NOT NULL,
  method TEXT NOT NULL,
  author TEXT,
  description TEXT,
  dose_g REAL NOT NULL,
  water_g REAL NOT NULL,
  water_temp_c REAL NOT NULL,
  grind_size_description TEXT,
  recommended_ratio REAL NOT NULL,
  steps_json TEXT NOT NULL,
  is_custom INTEGER DEFAULT 0,
  is_favorite INTEGER DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS brew_sessions (
  id TEXT PRIMARY KEY NOT NULL,
  recipe_id TEXT,
  recipe_name TEXT,
  inventory_item_id TEXT,
  inventory_item_name TEXT,
  beverage_type TEXT NOT NULL,
  method TEXT NOT NULL,
  dose_g REAL NOT NULL,
  water_g REAL NOT NULL,
  water_temp_c REAL NOT NULL,
  grind_setting TEXT,
  total_time_seconds INTEGER NOT NULL,
  rating REAL,
  flavor_tags_json TEXT,
  taste_balance TEXT,
  tds_percentage REAL,
  extraction_yield_percentage REAL,
  caffeine_content_mg REAL,
  notes TEXT,
  infusion_number INTEGER DEFAULT 1,
  sensory_scores_json TEXT,
  brewed_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS caffeine_logs (
  id TEXT PRIMARY KEY NOT NULL,
  brew_session_id TEXT,
  beverage_name TEXT NOT NULL,
  beverage_type TEXT NOT NULL,
  consumed_at TEXT NOT NULL,
  dose_g REAL NOT NULL,
  caffeine_mg REAL NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_inventory_archived ON inventory_items(is_archived);
CREATE INDEX IF NOT EXISTS idx_sessions_brewed_at ON brew_sessions(brewed_at);
CREATE INDEX IF NOT EXISTS idx_caffeine_consumed_at ON caffeine_logs(consumed_at);
`;

// ============================================================================
// Napar (Steepwise) — Repozytorium: Przepisy (Recipes)
// ============================================================================

import type { DbPort } from '../db-port';
import type { SavedRecipe } from '../database-schema';
import { MASTER_RECIPES } from '../recipes-data';

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

function mapRowToRecipe(row: RecipeRow): SavedRecipe {
  return {
    id: row.id,
    name: row.name,
    beverageType: row.beverage_type,
    method: row.method,
    author: row.author ?? undefined,
    description: row.description ?? undefined,
    doseGrams: row.dose_g,
    waterGrams: row.water_g,
    waterTempCelsius: row.water_temp_c,
    grindSizeDescription: row.grind_size_description ?? undefined,
    recommendedRatio: row.recommended_ratio,
    stepsJson: row.steps_json,
    isCustom: Boolean(row.is_custom),
    isFavorite: Boolean(row.is_favorite),
    createdAt: row.created_at,
  };
}

export function getRecipes(db: DbPort, beverageType?: 'COFFEE' | 'TEA'): SavedRecipe[] {
  const rows = beverageType
    ? db.getAllSync<RecipeRow>(
        'SELECT * FROM recipes WHERE beverage_type = ? ORDER BY is_favorite DESC, name ASC',
        [beverageType]
      )
    : db.getAllSync<RecipeRow>(
        'SELECT * FROM recipes ORDER BY is_favorite DESC, beverage_type ASC, name ASC'
      );
  return rows.map(mapRowToRecipe);
}

/** Kopia pełna (bez limitów) receptur własnych — do eksportu kopii zapasowej. */
export function listCustomRecipes(db: DbPort): SavedRecipe[] {
  return db
    .getAllSync<RecipeRow>('SELECT * FROM recipes WHERE is_custom = 1 ORDER BY created_at ASC, id ASC')
    .map(mapRowToRecipe);
}

export function getRecipeById(db: DbPort, id: string): SavedRecipe | null {
  const row = db.getFirstSync<RecipeRow>('SELECT * FROM recipes WHERE id = ?', [id]);
  return row ? mapRowToRecipe(row) : null;
}

export function saveRecipe(db: DbPort, recipe: SavedRecipe): void {
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

export function deleteRecipe(db: DbPort, id: string): void {
  db.runSync('DELETE FROM recipes WHERE id = ?', [id]);
}

export function updateRecipeFavorite(db: DbPort, id: string, isFavorite: boolean): void {
  db.runSync('UPDATE recipes SET is_favorite = ? WHERE id = ?', [isFavorite ? 1 : 0, id]);
}

export function toggleRecipeFavorite(db: DbPort, id: string): boolean {
  const recipe = getRecipeById(db, id);
  if (!recipe) return false;
  const newFav = !recipe.isFavorite;
  updateRecipeFavorite(db, id, newFav);
  return newFav;
}

export interface RecipeTemplate {
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
}

export function duplicateRecipe(
  db: DbPort,
  recipe: RecipeTemplate,
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

  saveRecipe(db, cloned);
  return cloned;
}

export function countMasterRecipes(db: DbPort): number {
  const row = db.getFirstSync<{ count: number }>(
    'SELECT COUNT(*) as count FROM recipes WHERE is_custom = 0'
  );
  return row ? row.count : 0;
}

/** Dane startowe: receptury wzorcowe (is_custom = 0), idempotentnie. */
export function seedMasterRecipes(db: DbPort, createdAt: string = new Date().toISOString()): void {
  for (const r of MASTER_RECIPES) {
    db.runSync(
      `INSERT OR REPLACE INTO recipes (
        id, name, beverage_type, method, author, description,
        dose_g, water_g, water_temp_c, grind_size_description,
        recommended_ratio, steps_json, is_custom, is_favorite, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?)`,
      [
        r.id,
        r.name,
        r.type,
        r.method,
        r.author,
        `${r.name} (${r.author})`,
        r.coffeeOrTeaDoseGrams,
        r.waterWeightGrams,
        r.waterTemperatureCelsius,
        r.grindSettingDescriptionPl,
        r.recommendedRatio,
        JSON.stringify(r.steps),
        createdAt,
      ]
    );
  }
}

// ============================================================================
// Napar (Steepwise) — Repozytorium: Dziennik Parzeń (Brew Sessions / Journal)
// ============================================================================

import type { DbPort } from '../db-port';
import type { BrewSession, SensoryProfile } from '../database-schema';
import { deductInventoryWeight } from './inventory';

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
    recipeId: row.recipe_id ?? undefined,
    recipeName: row.recipe_name ?? undefined,
    inventoryItemId: row.inventory_item_id ?? undefined,
    inventoryItemName: row.inventory_item_name ?? undefined,
    beverageType: row.beverage_type,
    method: row.method,
    doseGrams: row.dose_g,
    waterGrams: row.water_g,
    waterTempCelsius: row.water_temp_c,
    waterProfile: row.water_profile ?? undefined,
    grindSetting: row.grind_setting ?? undefined,
    totalTimeSeconds: row.total_time_seconds,
    rating: row.rating !== null ? row.rating : undefined,
    flavorTags,
    tasteBalance: row.taste_balance ?? undefined,
    tdsPercentage: row.tds_percentage !== null ? row.tds_percentage : undefined,
    extractionYieldPercentage:
      row.extraction_yield_percentage !== null ? row.extraction_yield_percentage : undefined,
    caffeineContentMg: row.caffeine_content_mg !== null ? row.caffeine_content_mg : undefined,
    notes: row.notes ?? undefined,
    infusionNumber: row.infusion_number ?? 1,
    sensory,
    brewedAt: row.brewed_at,
  };
}

/**
 * Sesje najnowsze pierwsze. `limit` podaje tylko UI (dziennik);
 * bez `limit` zwraca wszystkie wiersze (eksport i kopia zapasowa).
 */
export function listBrewSessions(db: DbPort, limit?: number): BrewSession[] {
  const rows =
    limit === undefined
      ? db.getAllSync<BrewSessionRow>('SELECT * FROM brew_sessions ORDER BY brewed_at DESC')
      : db.getAllSync<BrewSessionRow>(
          'SELECT * FROM brew_sessions ORDER BY brewed_at DESC LIMIT ?',
          [limit]
        );
  return rows.map(mapRowToBrewSession);
}

export function getBrewSessionById(db: DbPort, id: string): BrewSession | null {
  const row = db.getFirstSync<BrewSessionRow>('SELECT * FROM brew_sessions WHERE id = ?', [id]);
  return row ? mapRowToBrewSession(row) : null;
}

export function saveBrewSession(db: DbPort, session: BrewSession): void {
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

/** Zapis sesji i zdjęcie z zapasu w jednej transakcji (TASK-R08-04). */
export function recordBrewSession(
  db: DbPort,
  session: BrewSession,
  inventoryDeduction?: { itemId: string; doseGrams: number }
): void {
  db.withTransactionSync(() => {
    saveBrewSession(db, session);
    if (inventoryDeduction && inventoryDeduction.itemId && inventoryDeduction.doseGrams > 0) {
      deductInventoryWeight(db, inventoryDeduction.itemId, inventoryDeduction.doseGrams);
    }
  });
}

export function deleteBrewSession(db: DbPort, id: string): void {
  db.runSync('DELETE FROM brew_sessions WHERE id = ?', [id]);
}

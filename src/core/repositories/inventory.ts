// ============================================================================
// Napar (Steepwise) — Repozytorium: Spiżarnia Ziaren i Liści (Inventory / Stash)
// ============================================================================

import type { DbPort } from '../db-port';
import type { InventoryItem } from '../database-schema';

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
    roasterOrProducer: row.roaster_or_producer ?? undefined,
    origin: row.origin ?? undefined,
    roastOrHarvestDate: row.roast_or_harvest_date ?? undefined,
    roastProfile: row.roast_profile ?? undefined,
    process: row.process ?? undefined,
    variety: row.variety ?? undefined,
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

/** Lista spiżarni bez limitu (UI i eksport korzystają z tej samej, pełnej kwerendy). */
export function getInventoryItems(db: DbPort, includeArchived = false): InventoryItem[] {
  const query = includeArchived
    ? 'SELECT * FROM inventory_items ORDER BY is_favorite DESC, updated_at DESC'
    : 'SELECT * FROM inventory_items WHERE is_archived = 0 ORDER BY is_favorite DESC, updated_at DESC';
  return db.getAllSync<InventoryRow>(query).map(mapRowToInventoryItem);
}

export function getInventoryItemById(db: DbPort, id: string): InventoryItem | null {
  const row = db.getFirstSync<InventoryRow>('SELECT * FROM inventory_items WHERE id = ?', [id]);
  return row ? mapRowToInventoryItem(row) : null;
}

function writeInventoryRow(db: DbPort, item: InventoryItem, updatedAt: string): void {
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
      item.createdAt || updatedAt,
      updatedAt,
    ]
  );
}

/** Zapis z UI: znacznik `updated_at` ustawiany na moment zapisu. */
export function saveInventoryItem(db: DbPort, item: InventoryItem): void {
  writeInventoryRow(db, item, new Date().toISOString());
}

/** Przywracanie z kopii: zachowuje `updatedAt` z pliku (bez dryfu czasu). */
export function restoreInventoryItem(db: DbPort, item: InventoryItem): void {
  writeInventoryRow(db, item, item.updatedAt || new Date().toISOString());
}

export function deleteInventoryItem(db: DbPort, id: string): void {
  db.runSync('DELETE FROM inventory_items WHERE id = ?', [id]);
}

export function deductInventoryWeight(db: DbPort, id: string, doseGrams: number): void {
  const item = getInventoryItemById(db, id);
  if (!item) return;
  const newRemaining = Math.max(0, Number((item.remainingWeightGrams - doseGrams).toFixed(1)));
  db.runSync('UPDATE inventory_items SET remaining_weight_g = ?, updated_at = ? WHERE id = ?', [
    newRemaining,
    new Date().toISOString(),
    id,
  ]);
}

export function deductBeansForBrew(db: DbPort, itemId: string, grams: number): void {
  deductInventoryWeight(db, itemId, grams);
}

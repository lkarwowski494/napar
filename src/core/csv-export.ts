// ============================================================================
// Napar (Steepwise) — Eksport CSV (Z-152, ZP-07, RD-ENG-10, NFR-SEC-015)
// Każda komórka przechodzi przez escapeCsvCell, także nagłówki.
// ============================================================================

import type { BrewSession, InventoryItem } from './database-schema';

/** Znaki, od których zaczyna się formuła w arkuszu (CSV injection). */
export const FORMULA_PREFIX_CHARS: readonly string[] = ['=', '+', '-', '@', '\t', '\r'];

/**
 * RD-ENG-10 & NFR-SEC-015: neutralizacja formuł (prefiks apostrofu) i escapowanie CSV.
 */
export function escapeCsvCell(val: unknown): string {
  if (val === null || val === undefined) return '';
  let str = String(val);

  if (str.length > 0 && FORMULA_PREFIX_CHARS.includes(str[0])) {
    str = `'${str}`;
  }

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

function buildCsv(headers: readonly unknown[], rows: readonly (readonly unknown[])[]): string {
  const line = (cells: readonly unknown[]): string => cells.map((cell) => escapeCsvCell(cell)).join(',');
  return [line(headers), ...rows.map(line)].join('\n');
}

export const SESSIONS_CSV_HEADERS: readonly string[] = [
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

export function buildSessionsCsv(sessions: BrewSession[]): string {
  const rows = sessions.map((s) => [
    s.id,
    s.brewedAt,
    s.beverageType,
    s.method,
    s.recipeName || '',
    s.inventoryItemName || '',
    s.doseGrams,
    s.waterGrams,
    s.waterTempCelsius,
    s.totalTimeSeconds,
    s.rating ?? '',
    s.tasteBalance ?? '',
    s.tdsPercentage ?? '',
    s.extractionYieldPercentage ?? '',
    s.caffeineContentMg ?? '',
    s.flavorTags ? s.flavorTags.join('; ') : '',
    s.notes || '',
  ]);
  return buildCsv(SESSIONS_CSV_HEADERS, rows);
}

export const INVENTORY_CSV_HEADERS: readonly string[] = [
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

export function buildInventoryCsv(items: InventoryItem[]): string {
  const rows = items.map((item) => [
    item.id,
    item.name,
    item.type,
    item.roasterOrProducer || '',
    item.origin || '',
    item.roastOrHarvestDate || '',
    item.roastProfile || '',
    item.initialWeightGrams,
    item.remainingWeightGrams,
    item.flavorNotes ? item.flavorNotes.join('; ') : '',
    item.isFavorite ? '1' : '0',
    item.isArchived ? '1' : '0',
  ]);
  return buildCsv(INVENTORY_CSV_HEADERS, rows);
}

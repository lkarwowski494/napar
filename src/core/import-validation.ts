// ============================================================================
// Napar — parsowanie danych importu z unknown (M1-audytor-generalny-006; 08-programista-011)
// Plik importu pochodzi od użytkownika: każde pole sprawdzane przed zapisem, zły typ = błąd z nazwą pola,
// brak opcjonalnego pola zostaje brakiem. Bez asercji `as` na danych z zewnątrz.
// ============================================================================

import type { BrewSession, CaffeineLog, InventoryItem, SavedRecipe, SensoryProfile } from './database-schema';

export class ImportFieldError extends Error {
  constructor(
    public readonly field: string,
    public readonly expected: string
  ) {
    super(`Nieprawidłowe pole „${field}” w pliku kopii: oczekiwano ${expected}. Niczego nie zaimportowano.`);
    this.name = 'ImportFieldError';
  }
}

type Obj = Record<string, unknown>;

function isObj(v: unknown): v is Obj {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function obj(v: unknown, field: string): Obj {
  if (!isObj(v)) throw new ImportFieldError(field, 'obiektu');
  return v;
}

function str(o: Obj, key: string, path: string): string {
  const v = o[key];
  if (typeof v !== 'string') throw new ImportFieldError(`${path}.${key}`, 'tekstu');
  return v;
}

function optStr(o: Obj, key: string, path: string): string | undefined {
  const v = o[key];
  if (v === undefined || v === null) return undefined;
  if (typeof v !== 'string') throw new ImportFieldError(`${path}.${key}`, 'tekstu');
  return v;
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2}))?$/;

export function isValidIsoDate(v: string): boolean {
  return ISO_DATE_RE.test(v) && !Number.isNaN(Date.parse(v));
}

function isoDate(o: Obj, key: string, path: string): string {
  const v = str(o, key, path).trim();
  if (!isValidIsoDate(v)) {
    throw new ImportFieldError(`${path}.${key}`, 'poprawnej daty ISO');
  }
  return v;
}

function optIsoDate(o: Obj, key: string, path: string): string {
  const v = optStr(o, key, path);
  if (v === undefined || v.trim() === '') return '';
  const trimmed = v.trim();
  if (!isValidIsoDate(trimmed)) {
    throw new ImportFieldError(`${path}.${key}`, 'poprawnej daty ISO');
  }
  return trimmed;
}

function num(o: Obj, key: string, path: string): number {
  const v = o[key];
  if (typeof v !== 'number' || !Number.isFinite(v)) throw new ImportFieldError(`${path}.${key}`, 'liczby');
  return v;
}

function optNum(o: Obj, key: string, path: string): number | undefined {
  const v = o[key];
  if (v === undefined || v === null) return undefined;
  if (typeof v !== 'number' || !Number.isFinite(v)) throw new ImportFieldError(`${path}.${key}`, 'liczby');
  return v;
}

function optBool(o: Obj, key: string, path: string): boolean | undefined {
  const v = o[key];
  if (v === undefined || v === null) return undefined;
  if (typeof v !== 'boolean') throw new ImportFieldError(`${path}.${key}`, 'wartości tak/nie');
  return v;
}

function strList(o: Obj, key: string, path: string): string[] {
  const v = o[key];
  if (v === undefined || v === null) return [];
  if (!Array.isArray(v)) throw new ImportFieldError(`${path}.${key}`, 'listy tekstów');
  return v.map((x, i) => {
    if (typeof x !== 'string') throw new ImportFieldError(`${path}.${key}[${i}]`, 'tekstu');
    return x;
  });
}

function oneOf<T extends string>(o: Obj, key: string, path: string, allowed: readonly T[]): T {
  const v = o[key];
  const hit = allowed.find((a) => a === v);
  if (hit === undefined) throw new ImportFieldError(`${path}.${key}`, allowed.join(' | '));
  return hit;
}

function list(v: unknown, field: string): unknown[] {
  if (v === undefined || v === null) return [];
  if (!Array.isArray(v)) throw new ImportFieldError(field, 'listy');
  return v;
}

export function parseInventoryItem(v: unknown, path: string): InventoryItem {
  const o = obj(v, path);
  return {
    id: str(o, 'id', path),
    name: str(o, 'name', path),
    type: oneOf(o, 'type', path, ['coffee', 'tea'] as const),
    roasterOrProducer: optStr(o, 'roasterOrProducer', path),
    origin: optStr(o, 'origin', path),
    roastOrHarvestDate: optStr(o, 'roastOrHarvestDate', path),
    roastProfile: optStr(o, 'roastProfile', path),
    process: optStr(o, 'process', path),
    variety: optStr(o, 'variety', path),
    initialWeightGrams: num(o, 'initialWeightGrams', path),
    remainingWeightGrams: num(o, 'remainingWeightGrams', path),
    flavorNotes: strList(o, 'flavorNotes', path),
    rating: optNum(o, 'rating', path),
    isFavorite: optBool(o, 'isFavorite', path) ?? false,
    isArchived: optBool(o, 'isArchived', path) ?? false,
    // Brak dat paczki: zapis ustawia czas zapisu (saveInventoryItem: createdAt || now), więc '' = „brak”.
    createdAt: optIsoDate(o, 'createdAt', path),
    updatedAt: optIsoDate(o, 'updatedAt', path),
  };
}

export function parseSavedRecipe(v: unknown, path: string): SavedRecipe {
  const o = obj(v, path);
  return {
    id: str(o, 'id', path),
    name: str(o, 'name', path),
    beverageType: oneOf(o, 'beverageType', path, ['COFFEE', 'TEA'] as const),
    method: str(o, 'method', path),
    author: optStr(o, 'author', path),
    description: optStr(o, 'description', path),
    doseGrams: num(o, 'doseGrams', path),
    waterGrams: num(o, 'waterGrams', path),
    waterTempCelsius: num(o, 'waterTempCelsius', path),
    grindSizeDescription: optStr(o, 'grindSizeDescription', path),
    recommendedRatio: num(o, 'recommendedRatio', path),
    stepsJson: str(o, 'stepsJson', path),
    isCustom: optBool(o, 'isCustom', path) ?? true,
    isFavorite: optBool(o, 'isFavorite', path) ?? false,
    createdAt: optIsoDate(o, 'createdAt', path),
  };
}

function parseSensory(v: unknown, path: string): SensoryProfile | undefined {
  if (v === undefined || v === null) return undefined;
  const o = obj(v, path);
  return {
    acidity: num(o, 'acidity', path),
    sweetness: num(o, 'sweetness', path),
    body: num(o, 'body', path),
    clarity: num(o, 'clarity', path),
    finish: num(o, 'finish', path),
  };
}

export function parseBrewSession(v: unknown, path: string): BrewSession {
  const o = obj(v, path);
  return {
    id: str(o, 'id', path),
    recipeId: optStr(o, 'recipeId', path),
    recipeName: optStr(o, 'recipeName', path),
    inventoryItemId: optStr(o, 'inventoryItemId', path),
    inventoryItemName: optStr(o, 'inventoryItemName', path),
    beverageType: oneOf(o, 'beverageType', path, ['COFFEE', 'TEA'] as const),
    method: str(o, 'method', path),
    doseGrams: num(o, 'doseGrams', path),
    waterGrams: num(o, 'waterGrams', path),
    waterTempCelsius: num(o, 'waterTempCelsius', path),
    waterProfile: optStr(o, 'waterProfile', path),
    grindSetting: optStr(o, 'grindSetting', path),
    totalTimeSeconds: num(o, 'totalTimeSeconds', path),
    rating: optNum(o, 'rating', path),
    flavorTags: strList(o, 'flavorTags', path),
    tasteBalance: optStr(o, 'tasteBalance', path),
    tdsPercentage: optNum(o, 'tdsPercentage', path),
    extractionYieldPercentage: optNum(o, 'extractionYieldPercentage', path),
    caffeineContentMg: optNum(o, 'caffeineContentMg', path),
    notes: optStr(o, 'notes', path),
    infusionNumber: optNum(o, 'infusionNumber', path),
    sensory: parseSensory(o.sensory, `${path}.sensory`),
    brewedAt: isoDate(o, 'brewedAt', path),
  };
}

export function parseCaffeineLog(v: unknown, path: string): CaffeineLog {
  const o = obj(v, path);
  return {
    id: str(o, 'id', path),
    brewSessionId: optStr(o, 'brewSessionId', path),
    beverageName: str(o, 'beverageName', path),
    beverageType: oneOf(o, 'beverageType', path, ['coffee', 'tea'] as const),
    consumedAt: isoDate(o, 'consumedAt', path),
    doseGrams: num(o, 'doseGrams', path),
    caffeineMg: num(o, 'caffeineMg', path),
  };
}

const FORBIDDEN_SETTING_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

function parseSettings(v: unknown, field: string): Record<string, string> {
  if (v === undefined || v === null) return {};
  const o = obj(v, field);
  const out: Record<string, string> = {};
  for (const [k, val] of Object.entries(o)) {
    if (val === undefined || val === null) continue;
    if (
      (typeof val !== 'string' && typeof val !== 'number' && typeof val !== 'boolean') ||
      (typeof val === 'number' && !Number.isFinite(val))
    ) {
      throw new ImportFieldError(`${field}.${k}`, 'tekstu, liczby lub wartości tak/nie');
    }
    const cleanKey = k.replace(/\uFEFF/g, '').replace(/[\x00-\x1F\x7F]/g, '').trim();
    if (!cleanKey) continue;
    if (FORBIDDEN_SETTING_KEYS.has(cleanKey)) {
      throw new ImportFieldError(`${field}.${k}`, 'dozwolonego klucza ustawień');
    }
    out[cleanKey] = String(val);
  }
  return out;
}

export interface ParsedImport {
  inventory: InventoryItem[];
  customRecipes: SavedRecipe[];
  sessions: BrewSession[];
  caffeineLogs: CaffeineLog[];
  settings: Record<string, string>;
}

/** Dane kopii (sekcja state/payload albo plik version: 1) → typowane listy; pierwszy zły rekord przerywa całość. */
export function parseImportCollections(data: unknown): ParsedImport {
  const o = obj(data, 'dane');
  return {
    inventory: list(o.inventory, 'inventory').map((x, i) => parseInventoryItem(x, `inventory[${i}]`)),
    customRecipes: list(o.customRecipes, 'customRecipes').map((x, i) => parseSavedRecipe(x, `customRecipes[${i}]`)),
    sessions: list(o.sessions, 'sessions').map((x, i) => parseBrewSession(x, `sessions[${i}]`)),
    caffeineLogs: list(o.caffeineLogs, 'caffeineLogs').map((x, i) => parseCaffeineLog(x, `caffeineLogs[${i}]`)),
    settings: parseSettings(o.settings, 'settings'),
  };
}

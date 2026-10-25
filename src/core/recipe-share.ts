// ============================================================================
// Napar (Steepwise) — Wymiana Receptur Offline (Kody QR / Universal Links)
// ZP-02, ZP-06, DEC-20: 100% offline, zero-login, peer-to-peer recipe sharing
// ============================================================================

import { SavedRecipe } from './database-schema';
import { MasterRecipe, RecipeStep } from './recipes-data';

export const RECIPE_SHARE_PROTOCOL = 'napar://recipe';
export const RECIPE_SHARE_WEB_URL = 'https://napar.app/recipe';

export interface CompactRecipeStep {
  n: string; // Nazwa kroku (namePl)
  ne?: string; // Nazwa kroku (nameEn)
  d: number; // Czas trwania (durationSeconds)
  w: number; // Docelowa waga zalań (targetWaterGrams)
  i: string; // Instrukcja (instructionPl)
  ie?: string; // Instrukcja (instructionEn)
}

export interface CompactRecipePayload {
  v: 1; // Wersja schematu wymiany
  n: string; // Nazwa receptury
  b: 'COFFEE' | 'TEA'; // Typ naparu
  m: string; // Metoda parzenia (V60, AeroPress, etc.)
  a?: string; // Autor / Palarnia
  desc?: string; // Opis
  d: number; // Doza w gramach
  w: number; // Woda w gramach
  t: number; // Temperatura wody w °C
  g?: string; // Grubość mielenia
  r: number; // Proporcja (ratio 1:X)
  s: CompactRecipeStep[]; // Kroki parzenia
}

/**
 * Bezpieczne kodowanie UTF-8 do Base64 działające zarówno w Node, Hermes jak i przeglądarce
 */
export function utf8ToBase64(str: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(str, 'utf-8').toString('base64');
  }
  // Fallback dla czystego JavaScript / hermes bez globalnego Buffera
  return btoa(
    encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
      String.fromCharCode(parseInt(p1, 16))
    )
  );
}

/**
 * Normalizuje ciąg Base64:
 * 1. Zastępuje białe znaki/spacje znakami '+' (artefakt komunikatorów i dekodowania parametrów query)
 * 2. Zamienia wariant URL-Safe Base64 ('-' na '+', '_' na '/')
 * 3. Uzupełnia brakujący padding '='
 */
export function normalizeBase64(b64: string): string {
  let normalized = b64.trim().replace(/\s+/g, '+').replace(/-/g, '+').replace(/_/g, '/');
  const mod = normalized.length % 4;
  if (mod === 2) {
    normalized += '==';
  } else if (mod === 3) {
    normalized += '=';
  } else if (mod === 1) {
    normalized += '===';
  }
  return normalized;
}

/**
 * Bezpieczne dekodowanie Base64 do UTF-8
 */
export function base64ToUtf8(b64: string): string {
  const normalized = normalizeBase64(b64);
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(normalized, 'base64').toString('utf-8');
  }
  // Fallback
  const binary = atob(normalized);
  return decodeURIComponent(
    binary
      .split('')
      .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
}

/**
 * Przekształca obiekt przepisu do zwięzłego transferowego obiektu JSON
 */
export function recipeToCompactPayload(
  recipe: SavedRecipe | MasterRecipe
): CompactRecipePayload {
  const isSaved = 'stepsJson' in recipe;
  let rawSteps: RecipeStep[] = [];

  if (isSaved) {
    try {
      rawSteps = JSON.parse(recipe.stepsJson);
    } catch {
      rawSteps = [];
    }
  } else {
    rawSteps = (recipe as MasterRecipe).steps || [];
  }

  const compactSteps: CompactRecipeStep[] = rawSteps.map((st) => ({
    n: st.namePl,
    ...(st.nameEn ? { ne: st.nameEn } : {}),
    d: st.durationSeconds,
    w: st.targetWaterGrams,
    i: st.instructionPl,
    ...(st.instructionEn ? { ie: st.instructionEn } : {}),
  }));

  const name = recipe.name;
  const beverageType = isSaved
    ? recipe.beverageType
    : (recipe as MasterRecipe).type;
  const method = recipe.method;
  const author = recipe.author;
  const desc = isSaved ? recipe.description : `${recipe.name} (${recipe.author})`;
  const dose = isSaved ? recipe.doseGrams : (recipe as MasterRecipe).coffeeOrTeaDoseGrams;
  const water = isSaved ? recipe.waterGrams : (recipe as MasterRecipe).waterWeightGrams;
  const temp = isSaved ? recipe.waterTempCelsius : (recipe as MasterRecipe).waterTemperatureCelsius;
  const grind = isSaved ? recipe.grindSizeDescription : (recipe as MasterRecipe).grindSettingDescriptionPl;
  const ratio = recipe.recommendedRatio;

  return {
    v: 1,
    n: name,
    b: beverageType,
    m: method,
    a: author,
    desc: desc,
    d: dose,
    w: water,
    t: temp,
    g: grind,
    r: ratio,
    s: compactSteps,
  };
}

/**
 * Eksportuje recepturę do adresu Universal Link oraz schematu aplikacji (napar://)
 */
export function encodeRecipeToShareUrl(
  recipe: SavedRecipe | MasterRecipe,
  useWebScheme = false
): string {
  const payload = recipeToCompactPayload(recipe);
  const jsonStr = JSON.stringify(payload);
  const base64Str = utf8ToBase64(jsonStr);
  const base = useWebScheme ? RECIPE_SHARE_WEB_URL : RECIPE_SHARE_PROTOCOL;
  return `${base}?v=1&d=${encodeURIComponent(base64Str)}`;
}

/**
 * Importuje i weryfikuje przepis z linku lub surowego ciągu danych
 */
export function decodeRecipeFromShareUrl(
  urlOrRawData: string,
  language = 'pl'
): {
  recipe: SavedRecipe;
  originalSteps: RecipeStep[];
} | null {
  if (!urlOrRawData || typeof urlOrRawData !== 'string') {
    return null;
  }

  const trimmed = urlOrRawData.trim();
  let base64Data = trimmed;

  if (trimmed.includes('d=')) {
    try {
      const match = trimmed.match(/[?&]d=([^&#]+)/);
      if (match && match[1]) {
        base64Data = decodeURIComponent(match[1]);
      }
    } catch {
      return null;
    }
  }

  try {
    const jsonStr = base64ToUtf8(base64Data);
    const parsed: CompactRecipePayload = JSON.parse(jsonStr);

    if (
      parsed.v !== 1 ||
      !parsed.n ||
      !parsed.m ||
      typeof parsed.d !== 'number' ||
      !Number.isFinite(parsed.d) ||
      parsed.d <= 0 ||
      typeof parsed.w !== 'number' ||
      !Number.isFinite(parsed.w) ||
      parsed.w <= 0 ||
      (parsed.s !== undefined && !Array.isArray(parsed.s))
    ) {
      return null;
    }

    const isEn = language === 'en';
    const defaultAuthor = isEn ? 'Shared Recipe' : 'Udostępniona receptura';
    const defaultDesc = isEn
      ? `Imported via QR code / link (${parsed.m})`
      : `Zaimportowano przez kod QR / link (${parsed.m})`;
    const defaultStepName = (stepIdx: number) => (isEn ? `Step ${stepIdx}` : `Krok ${stepIdx}`);

    const steps: RecipeStep[] = (parsed.s || []).map((st, idx) => ({
      stepNumber: idx + 1,
      namePl: st.n || defaultStepName(idx + 1),
      ...(st.ne ? { nameEn: st.ne } : (isEn && st.n ? { nameEn: st.n } : {})),
      durationSeconds: Number(st.d) || 30,
      targetWaterGrams: Number(st.w) || 0,
      instructionPl: st.i || '',
      ...(st.ie ? { instructionEn: st.ie } : (isEn && st.i ? { instructionEn: st.i } : {})),
    }));

    const recipeId = `shared-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    const recipe: SavedRecipe = {
      id: recipeId,
      name: parsed.n,
      beverageType: parsed.b === 'TEA' ? 'TEA' : 'COFFEE',
      method: parsed.m,
      author: parsed.a || defaultAuthor,
      description: parsed.desc || defaultDesc,
      doseGrams: parsed.d,
      waterGrams: parsed.w,
      waterTempCelsius: parsed.t || 92,
      grindSizeDescription: parsed.g || '',
      recommendedRatio: parsed.r || Number((parsed.w / (parsed.d || 1)).toFixed(1)),
      stepsJson: JSON.stringify(steps),
      isCustom: true,
      isFavorite: false,
      createdAt: nowIso,
    };

    return { recipe, originalSteps: steps };
  } catch {
    return null;
  }
}

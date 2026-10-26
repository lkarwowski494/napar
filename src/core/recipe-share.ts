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
  if (!str || typeof str !== 'string') return '';
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
  if (!b64 || typeof b64 !== 'string') return '';
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
  if (!b64 || typeof b64 !== 'string') return '';
  const normalized = normalizeBase64(b64);
  if (!normalized) return '';
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
  if (!recipe || typeof recipe !== 'object') {
    return {
      v: 1,
      n: 'Recipe',
      b: 'COFFEE',
      m: 'v60',
      d: 15,
      w: 250,
      t: 92,
      r: 16.7,
      s: [],
    };
  }

  const isSaved = 'stepsJson' in recipe;
  let rawSteps: RecipeStep[] = [];

  if (isSaved) {
    try {
      const parsed = JSON.parse(recipe.stepsJson);
      rawSteps = Array.isArray(parsed) ? parsed : [];
    } catch {
      rawSteps = [];
    }
  } else {
    rawSteps = Array.isArray((recipe as MasterRecipe).steps) ? (recipe as MasterRecipe).steps : [];
  }

  const compactSteps: CompactRecipeStep[] = (rawSteps || [])
    .filter((st): st is RecipeStep => typeof st === 'object' && st !== null)
    .slice(0, 100)
    .map((st) => ({
      n: typeof st.namePl === 'string' && st.namePl.trim() ? st.namePl.trim().slice(0, 100) : 'Step',
      ...(typeof st.nameEn === 'string' && st.nameEn.trim() ? { ne: st.nameEn.trim().slice(0, 100) } : {}),
      d: Number.isFinite(st.durationSeconds) && st.durationSeconds > 0 ? Math.min(86400, Math.round(st.durationSeconds)) : 30,
      w: Number.isFinite(st.targetWaterGrams) && st.targetWaterGrams >= 0 ? Math.min(50000, Math.round(st.targetWaterGrams)) : 0,
      i: typeof st.instructionPl === 'string' ? st.instructionPl.trim().slice(0, 2000) : '',
      ...(typeof st.instructionEn === 'string' && st.instructionEn.trim() ? { ie: st.instructionEn.trim().slice(0, 2000) } : {}),
    }));

  const name =
    typeof recipe.name === 'string' && recipe.name.trim()
      ? recipe.name.trim()
      : 'Recipe';
  const rawBeverageType = isSaved
    ? recipe.beverageType
    : (recipe as MasterRecipe).type;
  const beverageType: 'COFFEE' | 'TEA' =
    rawBeverageType === 'TEA' ? 'TEA' : 'COFFEE';
  const method =
    typeof recipe.method === 'string' && recipe.method.trim()
      ? recipe.method.trim()
      : 'v60';
  const author =
    typeof recipe.author === 'string' && recipe.author.trim()
      ? recipe.author.trim()
      : undefined;
  const rawDesc = isSaved
    ? (typeof recipe.description === 'string' ? recipe.description : undefined)
    : `${name} (${author || 'Master'})`;
  const desc = typeof rawDesc === 'string' ? rawDesc.trim().slice(0, 1000) : undefined;
  const rawDose = isSaved
    ? recipe.doseGrams
    : (recipe as MasterRecipe).coffeeOrTeaDoseGrams;
  const rawWater = isSaved
    ? recipe.waterGrams
    : (recipe as MasterRecipe).waterWeightGrams;
  const rawTemp = isSaved
    ? recipe.waterTempCelsius
    : (recipe as MasterRecipe).waterTemperatureCelsius;
  const rawGrind = isSaved
    ? recipe.grindSizeDescription
    : (recipe as MasterRecipe).grindSettingDescriptionPl;
  const rawRatio = recipe.recommendedRatio;

  const dose =
    Number.isFinite(rawDose) && rawDose > 0 ? Number(rawDose.toFixed(1)) : 15;
  const water =
    Number.isFinite(rawWater) && rawWater > 0 ? Number(rawWater.toFixed(1)) : 250;
  const parsedTemp = typeof rawTemp === 'number' ? rawTemp : (typeof rawTemp === 'string' ? parseFloat(rawTemp) : NaN);
  const temp =
    Number.isFinite(parsedTemp) && parsedTemp >= 0 && parsedTemp <= 100
      ? Math.round(parsedTemp)
      : 92;
  const grind =
    typeof rawGrind === 'string' && rawGrind.trim() ? rawGrind.trim() : undefined;
  const computedRatio = Number((water / (dose || 1)).toFixed(1));
  const ratio =
    Number.isFinite(rawRatio) && rawRatio > 0
      ? Number(rawRatio.toFixed(2))
      : (Number.isFinite(computedRatio) && computedRatio > 0 ? computedRatio : 16.7);

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

  if (trimmed.includes('d=') || trimmed.includes('data=')) {
    try {
      const match = trimmed.match(/[?&#](?:d|data)=([^&#]+)/);
      if (match && match[1]) {
        base64Data = decodeURIComponent(match[1]);
      }
    } catch {
      return null;
    }
  }

  try {
    const jsonStr = base64ToUtf8(base64Data);
    if (!jsonStr || typeof jsonStr !== 'string' || !jsonStr.trim()) return null;
    const parsed: CompactRecipePayload = JSON.parse(jsonStr.trim());

    if (
      !parsed ||
      typeof parsed !== 'object' ||
      parsed.v !== 1 ||
      !parsed.n ||
      typeof parsed.n !== 'string' ||
      parsed.n.length > 200 ||
      (parsed.b !== 'COFFEE' && parsed.b !== 'TEA') ||
      !parsed.m ||
      typeof parsed.m !== 'string' ||
      parsed.m.length > 50 ||
      (parsed.a !== undefined && (typeof parsed.a !== 'string' || parsed.a.length > 100)) ||
      (parsed.desc !== undefined && (typeof parsed.desc !== 'string' || parsed.desc.length > 1000)) ||
      typeof parsed.d !== 'number' ||
      !Number.isFinite(parsed.d) ||
      parsed.d <= 0 ||
      parsed.d > 1000 ||
      typeof parsed.w !== 'number' ||
      !Number.isFinite(parsed.w) ||
      parsed.w <= 0 ||
      parsed.w > 50000 ||
      (parsed.s !== undefined && (!Array.isArray(parsed.s) || parsed.s.length > 100))
    ) {
      return null;
    }

    const isEn = language === 'en';
    const defaultAuthor = isEn ? 'Shared Recipe' : 'Udostępniona receptura';
    const defaultDesc = isEn
      ? `Imported via QR code / link (${parsed.m})`
      : `Zaimportowano przez kod QR / link (${parsed.m})`;
    const defaultStepName = (stepIdx: number) => (isEn ? `Step ${stepIdx}` : `Krok ${stepIdx}`);

    const steps: RecipeStep[] = (parsed.s || [])
      .filter((st): st is CompactRecipeStep => typeof st === 'object' && st !== null)
      .map((st, idx) => ({
        stepNumber: idx + 1,
        namePl: typeof st.n === 'string' && st.n.trim() ? st.n.trim().slice(0, 100) : defaultStepName(idx + 1),
        ...(st.ne && typeof st.ne === 'string' ? { nameEn: st.ne.trim().slice(0, 100) } : (isEn && typeof st.n === 'string' && st.n ? { nameEn: st.n.trim().slice(0, 100) } : {})),
        durationSeconds: typeof st.d === 'number' && Number.isFinite(st.d) && st.d > 0 ? Math.min(86400, Math.round(st.d)) : 30,
        targetWaterGrams: typeof st.w === 'number' && Number.isFinite(st.w) && st.w >= 0 ? Math.min(50000, Math.round(st.w)) : 0,
        instructionPl: typeof st.i === 'string' ? st.i.slice(0, 2000) : '',
        ...(st.ie && typeof st.ie === 'string' ? { instructionEn: st.ie.slice(0, 2000) } : (isEn && typeof st.i === 'string' && st.i ? { instructionEn: st.i.slice(0, 2000) } : {})),
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
      doseGrams: Number(parsed.d.toFixed(1)),
      waterGrams: Number(parsed.w.toFixed(1)),
      waterTempCelsius: (() => {
        const rawDecodedTemp = typeof parsed.t === 'number' ? parsed.t : (typeof parsed.t === 'string' ? parseFloat(parsed.t) : NaN);
        return Number.isFinite(rawDecodedTemp) && rawDecodedTemp >= 0 && rawDecodedTemp <= 100 ? Math.round(rawDecodedTemp) : 92;
      })(),
      grindSizeDescription: typeof parsed.g === 'string' ? parsed.g : '',
      recommendedRatio: typeof parsed.r === 'number' && Number.isFinite(parsed.r) && parsed.r > 0 ? Number(parsed.r.toFixed(2)) : Number((parsed.w / (parsed.d || 1)).toFixed(1)),
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

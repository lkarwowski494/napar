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
 * Pomocnicza funkcja oczyszczająca znaki kontrolne (ASCII 0x00-0x1F i 0x7F) z zachowaniem standardowego tekstu i emotikonów
 */
export function stripControlChars(str: unknown): string {
  if (typeof str !== 'string') return '';
  return str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();
}

/**
 * Pomocnicza funkcja parsująca liczbę z ewentualnymi jednostkami (np. "18,5 g", "250 ml", "93 °C")
 */
export function parseNumberWithUnit(val: unknown): number {
  if (typeof val === 'number') return val;
  if (typeof val !== 'string') return NaN;
  const cleaned = val.replace(',', '.').trim();
  const match = cleaned.match(/^[+-]?\d+(?:\.\d+)?/);
  return match ? parseFloat(match[0]) : NaN;
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
 * 1. Oczyszcza znaki BOM, zero-width i znaki nowej linii/tabulacji (np. z wklejania z maili/komunikatorów)
 * 2. Zastępuje białe znaki/spacje znakami '+' (artefakt komunikatorów i dekodowania parametrów query)
 * 3. Zamienia wariant URL-Safe Base64 ('-' na '+', '_' na '/')
 * 4. Uzupełnia brakujący padding '='
 */
export function normalizeBase64(b64: string): string {
  if (!b64 || typeof b64 !== 'string') return '';
  let cleaned = b64.replace(/[\uFEFF\u200B-\u200D]/g, '').replace(/[\r\n\t]/g, '');
  let normalized = cleaned.trim().replace(/\s+/g, '+').replace(/-/g, '+').replace(/_/g, '/');
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
      const parsed = typeof recipe.stepsJson === 'string' ? JSON.parse(recipe.stepsJson) : [];
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
    .map((st) => {
      const rawDur = parseNumberWithUnit(st.durationSeconds);
      const rawW = parseNumberWithUnit(st.targetWaterGrams);
      const safeW = Number.isFinite(rawW) && rawW >= 0 ? Math.min(50000, Math.round(rawW)) : 0;
      const cleanNamePl = stripControlChars(st.namePl);
      const cleanNameEn = stripControlChars(st.nameEn);
      const cleanInstrPl = stripControlChars(st.instructionPl);
      const cleanInstrEn = stripControlChars(st.instructionEn);
      const fallbackName = cleanNameEn ? cleanNameEn.slice(0, 100) : 'Step';
      const fallbackInstr = cleanInstrEn ? cleanInstrEn.slice(0, 2000) : '';
      return {
        n: cleanNamePl ? cleanNamePl.slice(0, 100) : fallbackName,
        ...(cleanNameEn ? { ne: cleanNameEn.slice(0, 100) } : {}),
        d: Number.isFinite(rawDur) && rawDur > 0 ? Math.min(86400, Math.round(rawDur)) : 30,
        w: Object.is(safeW, -0) || safeW <= 0 ? 0 : safeW,
        i: cleanInstrPl ? cleanInstrPl.slice(0, 2000) : fallbackInstr,
        ...(cleanInstrEn ? { ie: cleanInstrEn.slice(0, 2000) } : {}),
      };
    });

  const cleanName = stripControlChars(recipe.name);
  const name = cleanName ? cleanName.slice(0, 200) : 'Recipe';
  const rawBeverageType = isSaved
    ? recipe.beverageType
    : (recipe as MasterRecipe).type;
  const beverageType: 'COFFEE' | 'TEA' =
    typeof rawBeverageType === 'string' && rawBeverageType.trim().toUpperCase() === 'TEA' ? 'TEA' : 'COFFEE';
  const cleanMethod = stripControlChars(recipe.method);
  const method = cleanMethod ? cleanMethod.slice(0, 50) : 'v60';
  const cleanAuthor = stripControlChars(recipe.author);
  const author = cleanAuthor ? cleanAuthor.slice(0, 100) : undefined;
  const rawDesc = isSaved
    ? (typeof recipe.description === 'string' ? recipe.description : undefined)
    : `${name} (${author || 'Master'})`;
  const cleanDesc = stripControlChars(rawDesc);
  const desc = cleanDesc ? cleanDesc.slice(0, 1000) : undefined;
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

  const parsedDose = parseNumberWithUnit(rawDose);
  const parsedWater = parseNumberWithUnit(rawWater);
  const rawDoseVal =
    Number.isFinite(parsedDose) && parsedDose > 0 ? Number(Math.min(1000, Math.max(1, parsedDose)).toFixed(1)) : 15;
  const dose = Object.is(rawDoseVal, -0) ? 15 : rawDoseVal;

  const rawWaterVal =
    Number.isFinite(parsedWater) && parsedWater > 0 ? Number(Math.min(50000, Math.max(10, parsedWater)).toFixed(1)) : 250;
  const water = Object.is(rawWaterVal, -0) ? 250 : rawWaterVal;

  const parsedTemp = parseNumberWithUnit(rawTemp);
  const rawTempVal =
    Number.isFinite(parsedTemp) && parsedTemp >= 0 && parsedTemp <= 100
      ? Math.round(parsedTemp)
      : 92;
  const temp = Object.is(rawTempVal, -0) ? 0 : rawTempVal;

  const cleanGrind = stripControlChars(rawGrind);
  const grind =
    cleanGrind
      ? cleanGrind.slice(0, 200)
      : (typeof rawGrind === 'number' && Number.isFinite(rawGrind) ? String(rawGrind) : undefined);
  const computedRatio = Number((water / (dose || 1)).toFixed(1));
  let rawRatioNum = NaN;
  if (typeof rawRatio === 'number') {
    rawRatioNum = rawRatio;
  } else if (typeof (rawRatio as any) === 'string') {
    const cleanRatio = (rawRatio as any).trim().replace(/,/g, '.');
    if (cleanRatio.includes(':') || cleanRatio.includes('/') || /\b(?:do|to|na)\b/i.test(cleanRatio)) {
      const parts = cleanRatio.split(/[:/]|\b(?:do|to|na)\b/i).map((p: string) => parseFloat(p.trim())).filter(Number.isFinite);
      if (parts.length === 2 && parts[0] > 0 && parts[1] > 0) {
        if (parts[0] === 1) {
          rawRatioNum = parts[1];
        } else if (parts[1] === 1) {
          rawRatioNum = parts[0];
        } else {
          rawRatioNum = Math.max(parts[0], parts[1]) / Math.min(parts[0], parts[1]);
        }
      }
    } else {
      rawRatioNum = parseFloat(cleanRatio);
    }
  }
  const ratioCandidate =
    Number.isFinite(rawRatioNum) && rawRatioNum > 0
      ? Number(Math.min(100, Math.max(1, rawRatioNum)).toFixed(2))
      : (Number.isFinite(computedRatio) && computedRatio > 0 ? Number(Math.min(100, Math.max(1, computedRatio)).toFixed(2)) : 16.7);
  let ratio = Object.is(ratioCandidate, -0) ? 16.7 : ratioCandidate;
  if (ratio < 1) ratio = 1;
  if (ratio > 100) ratio = 100;

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
  useWebScheme: boolean | string = false
): string {
  const isWeb =
    useWebScheme === true ||
    (typeof useWebScheme === 'string' &&
      (useWebScheme.trim().toLowerCase() === 'true' || useWebScheme.trim() === '1'));
  const base = isWeb ? RECIPE_SHARE_WEB_URL : RECIPE_SHARE_PROTOCOL;

  if (!recipe || typeof recipe !== 'object') {
    return `${base}?v=1&d=`;
  }
  const payload = recipeToCompactPayload(recipe);
  const jsonStr = JSON.stringify(payload);
  const base64Str = utf8ToBase64(jsonStr);
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
  if (typeof urlOrRawData !== 'string' || urlOrRawData.length > 65536) {
    return null;
  }

  const trimmed = urlOrRawData.trim();
  if (!trimmed) {
    return null;
  }
  let base64Data = trimmed;

  if (/[?&#](?:d|data)=/i.test(trimmed)) {
    try {
      const match = trimmed.match(/[?&#](?:d|data)=([^&#]+)/i);
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

    const cleanName = stripControlChars(parsed.n);
    const rawB = typeof parsed.b === 'string' ? parsed.b.trim().toUpperCase() : '';
    const cleanMethod = stripControlChars(parsed.m);
    const cleanAuthor = stripControlChars(parsed.a);
    const cleanDesc = stripControlChars(parsed.desc);
    const rawParsedD = parseNumberWithUnit(parsed.d);
    const rawParsedW = parseNumberWithUnit(parsed.w);
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      parsed.v !== 1 ||
      !cleanName ||
      cleanName.length > 200 ||
      (rawB !== 'COFFEE' && rawB !== 'TEA') ||
      !cleanMethod ||
      cleanMethod.length > 50 ||
      (cleanAuthor && cleanAuthor.length > 100) ||
      (cleanDesc && cleanDesc.length > 1000) ||
      !Number.isFinite(rawParsedD) ||
      rawParsedD <= 0 ||
      rawParsedD > 1000 ||
      !Number.isFinite(rawParsedW) ||
      rawParsedW <= 0 ||
      rawParsedW > 50000 ||
      (parsed.s !== undefined && (!Array.isArray(parsed.s) || parsed.s.length > 100))
    ) {
      return null;
    }

    const cleanLang = typeof language === 'string' ? language.trim().toLowerCase() : 'pl';
    const isEn = cleanLang === 'en' || cleanLang.startsWith('en');
    const defaultAuthor = isEn ? 'Shared Recipe' : 'Udostępniona receptura';
    const defaultDesc = isEn
      ? `Imported via QR code / link (${cleanMethod})`
      : `Zaimportowano przez kod QR / link (${cleanMethod})`;
    const defaultStepName = (stepIdx: number) => (isEn ? `Step ${stepIdx}` : `Krok ${stepIdx}`);

    const steps: RecipeStep[] = (parsed.s || [])
      .filter((st): st is CompactRecipeStep => typeof st === 'object' && st !== null)
      .map((st, idx) => {
        const rawSec = parseNumberWithUnit(st.d);
        const rawWater = parseNumberWithUnit(st.w);
        const safeStepWater = Number.isFinite(rawWater) && rawWater >= 0 ? Math.max(0, Math.min(50000, Math.round(rawWater))) : 0;
        const cleanStepNamePl = stripControlChars(st.n);
        const cleanStepNameEn = stripControlChars(st.ne);
        const cleanStepInstrPl = stripControlChars(st.i);
        const cleanStepInstrEn = stripControlChars(st.ie);
        const fallbackStepPlName = cleanStepNameEn ? cleanStepNameEn.slice(0, 100) : defaultStepName(idx + 1);
        const fallbackStepInstrPl = cleanStepInstrEn ? cleanStepInstrEn.slice(0, 2000) : '';
        return {
          stepNumber: idx + 1,
          namePl: cleanStepNamePl ? cleanStepNamePl.slice(0, 100) : fallbackStepPlName,
          ...(cleanStepNameEn ? { nameEn: cleanStepNameEn.slice(0, 100) } : (isEn && cleanStepNamePl ? { nameEn: cleanStepNamePl.slice(0, 100) } : {})),
          durationSeconds: Number.isFinite(rawSec) && rawSec > 0 ? Math.max(1, Math.min(86400, Math.round(rawSec))) : 30,
          targetWaterGrams: Object.is(safeStepWater, -0) || safeStepWater <= 0 ? 0 : safeStepWater,
          instructionPl: cleanStepInstrPl ? cleanStepInstrPl.slice(0, 2000) : fallbackStepInstrPl,
          ...(cleanStepInstrEn ? { instructionEn: cleanStepInstrEn.slice(0, 2000) } : (isEn && cleanStepInstrPl ? { instructionEn: cleanStepInstrPl.slice(0, 2000) } : {})),
        };
      });

    const recipeId = `shared-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    const recipe: SavedRecipe = {
      id: recipeId,
      name: cleanName.slice(0, 200),
      beverageType: rawB === 'TEA' ? 'TEA' : 'COFFEE',
      method: cleanMethod.slice(0, 50),
      author: cleanAuthor ? cleanAuthor.slice(0, 100) : defaultAuthor,
      description: cleanDesc ? cleanDesc.slice(0, 1000) : defaultDesc,
      doseGrams: Object.is(Number(rawParsedD.toFixed(1)), -0) ? 0 : Number(rawParsedD.toFixed(1)),
      waterGrams: Object.is(Number(rawParsedW.toFixed(1)), -0) ? 0 : Number(rawParsedW.toFixed(1)),
      waterTempCelsius: (() => {
        const rawDecodedTemp = parseNumberWithUnit(parsed.t);
        return Number.isFinite(rawDecodedTemp) && rawDecodedTemp >= 0 && rawDecodedTemp <= 100 && !Object.is(rawDecodedTemp, -0) ? Math.max(0, Math.min(100, Math.round(rawDecodedTemp))) : 92;
      })(),
      grindSizeDescription: (() => {
        const cleanGrind = stripControlChars(parsed.g);
        if (cleanGrind) return cleanGrind.slice(0, 200);
        if (typeof parsed.g === 'number' && Number.isFinite(parsed.g)) return String(parsed.g);
        return isEn ? 'Medium' : 'Średnio';
      })(),
      recommendedRatio: (() => {
        let rawDecodedRatio = NaN;
        if (typeof parsed.r === 'number') {
          rawDecodedRatio = parsed.r;
        } else if (typeof parsed.r === 'string') {
          const clean = String(parsed.r).trim().replace(/,/g, '.');
          if (clean.includes(':') || clean.includes('/') || /\b(?:do|to|na)\b/i.test(clean)) {
            const parts = clean.split(/[:/]|\b(?:do|to|na)\b/i).map((p: string) => parseFloat(p.trim())).filter(Number.isFinite);
            if (parts.length === 2 && parts[0] > 0 && parts[1] > 0) {
              if (parts[0] === 1) {
                rawDecodedRatio = parts[1];
              } else if (parts[1] === 1) {
                rawDecodedRatio = parts[0];
              } else {
                rawDecodedRatio = Math.max(parts[0], parts[1]) / Math.min(parts[0], parts[1]);
              }
            }
          } else {
            rawDecodedRatio = parseFloat(clean);
          }
        }
        let ratioVal = Number.isFinite(rawDecodedRatio) && rawDecodedRatio > 0 && !Object.is(rawDecodedRatio, -0)
          ? Number(Math.min(100, Math.max(1, rawDecodedRatio)).toFixed(2))
          : Number(Math.min(100, Math.max(1, rawParsedW / (rawParsedD || 1))).toFixed(1));
        if (Object.is(ratioVal, -0) || !Number.isFinite(ratioVal) || ratioVal <= 0) ratioVal = 16.7;
        return ratioVal;
      })(),
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

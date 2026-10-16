// ============================================================================
// Napar (Steepwise) — Unit Tests: Offline Recipe Sharing & QR Code (DEC-20)
// ============================================================================

import {
  utf8ToBase64,
  base64ToUtf8,
  recipeToCompactPayload,
  encodeRecipeToShareUrl,
  decodeRecipeFromShareUrl,
  RECIPE_SHARE_PROTOCOL,
  RECIPE_SHARE_WEB_URL,
} from '../recipe-share';
import { generateQrMatrix } from '../qr-code';
import { MASTER_RECIPES } from '../recipes-data';
import { SavedRecipe } from '../database-schema';

describe('Offline Recipe Sharing & QR Code Module (DEC-20)', () => {
  const sampleSavedRecipe: SavedRecipe = {
    id: 'test-rec-1',
    name: 'Kenja Nyeri Peaberry V60',
    beverageType: 'COFFEE',
    method: 'V60',
    author: 'Barista Champion',
    description: 'Soczysta porzeczka i czarna herbata',
    doseGrams: 18,
    waterGrams: 300,
    waterTempCelsius: 93,
    grindSizeDescription: 'Średnio (22 kliki Comandante)',
    recommendedRatio: 16.7,
    stepsJson: JSON.stringify([
      {
        id: 's1',
        namePl: 'Preinfuzja',
        nameEn: 'Bloom',
        durationSeconds: 45,
        targetWaterGrams: 60,
        instructionPl: 'Zalej 60g i zamieszaj',
        instructionEn: 'Pour 60g and swirl',
      },
      {
        id: 's2',
        namePl: 'Zalanie główne',
        nameEn: 'Main pour',
        durationSeconds: 120,
        targetWaterGrams: 300,
        instructionPl: 'Zalej spiralnie do 300g',
        instructionEn: 'Pour spirally to 300g',
      },
    ]),
    isCustom: true,
    isFavorite: false,
    createdAt: new Date().toISOString(),
  };

  test('Prawidłowo koduje i dekoduje UTF-8 z polskimi znakami i emoji', () => {
    const original = 'Zażółć gęślą jaźń ☕ 🍵 100% rzemiosła!';
    const encoded = utf8ToBase64(original);
    const decoded = base64ToUtf8(encoded);
    expect(decoded).toBe(original);
  });

  test('Przekształca SavedRecipe do zwięzłego transferowego obiektu', () => {
    const compact = recipeToCompactPayload(sampleSavedRecipe);
    expect(compact.v).toBe(1);
    expect(compact.n).toBe('Kenja Nyeri Peaberry V60');
    expect(compact.b).toBe('COFFEE');
    expect(compact.m).toBe('V60');
    expect(compact.d).toBe(18);
    expect(compact.w).toBe(300);
    expect(compact.s.length).toBe(2);
    expect(compact.s[0].n).toBe('Preinfuzja');
  });

  test('Przekształca MasterRecipe do zwięzłego transferowego obiektu', () => {
    const master = MASTER_RECIPES[0];
    const compact = recipeToCompactPayload(master);
    expect(compact.v).toBe(1);
    expect(compact.n).toBe(master.name);
    expect(compact.d).toBe(master.coffeeOrTeaDoseGrams);
    expect(compact.w).toBe(master.waterWeightGrams);
    expect(compact.s.length).toBe(master.steps.length);
  });

  test('Generuje poprawny URL protokołu napar:// oraz https://', () => {
    const appUrl = encodeRecipeToShareUrl(sampleSavedRecipe);
    expect(appUrl.startsWith(RECIPE_SHARE_PROTOCOL)).toBe(true);
    expect(appUrl).toContain('?v=1&d=');

    const webUrl = encodeRecipeToShareUrl(sampleSavedRecipe, true);
    expect(webUrl.startsWith(RECIPE_SHARE_WEB_URL)).toBe(true);
    expect(webUrl).toContain('?v=1&d=');
  });

  test('Prawidłowo dekoduje i odtwarza recepturę z wygenerowanego URL', () => {
    const shareUrl = encodeRecipeToShareUrl(sampleSavedRecipe);
    const result = decodeRecipeFromShareUrl(shareUrl);

    expect(result).not.toBeNull();
    expect(result!.recipe.name).toBe(sampleSavedRecipe.name);
    expect(result!.recipe.method).toBe('V60');
    expect(result!.recipe.doseGrams).toBe(18);
    expect(result!.recipe.waterGrams).toBe(300);
    expect(result!.recipe.waterTempCelsius).toBe(93);
    expect(result!.recipe.isCustom).toBe(true);
    expect(result!.originalSteps.length).toBe(2);
    expect(result!.originalSteps[0].namePl).toBe('Preinfuzja');
    expect(result!.originalSteps[1].targetWaterGrams).toBe(300);
  });

  test('Prawidłowo dekoduje recepturę z webowego linku https://', () => {
    const webUrl = encodeRecipeToShareUrl(sampleSavedRecipe, true);
    const result = decodeRecipeFromShareUrl(webUrl);

    expect(result).not.toBeNull();
    expect(result!.recipe.name).toBe(sampleSavedRecipe.name);
    expect(result!.recipe.beverageType).toBe('COFFEE');
  });

  test('Zwraca null dla błędnych, uszkodzonych lub pustych linków', () => {
    expect(decodeRecipeFromShareUrl('')).toBeNull();
    expect(decodeRecipeFromShareUrl('niepoprawny-ciag')).toBeNull();
    expect(decodeRecipeFromShareUrl('napar://recipe?v=1&d=uszkodzony_base64!!!')).toBeNull();
    expect(decodeRecipeFromShareUrl('napar://recipe?v=1&d=' + utf8ToBase64('{}'))).toBeNull();
    expect(
      decodeRecipeFromShareUrl(
        'napar://recipe?v=1&d=' + utf8ToBase64(JSON.stringify({ v: 2, n: 'Zła wersja' }))
      )
    ).toBeNull();
  });

  test('Generuje poprawną macierz modułów kodu QR dla URL receptury (generateQrMatrix)', () => {
    const shareUrl = encodeRecipeToShareUrl(sampleSavedRecipe);
    const qrResult = generateQrMatrix(shareUrl);

    expect(qrResult.size).toBeGreaterThanOrEqual(25);
    expect(qrResult.modules.length).toBe(qrResult.size);
    expect(qrResult.modules[0].length).toBe(qrResult.size);

    // Wzorce pozycyjne (Finder patterns) w rogach muszą być obecne
    expect(qrResult.modules[0][0]).toBe(true);
    expect(qrResult.modules[0][6]).toBe(true);
    expect(qrResult.modules[6][0]).toBe(true);
  });

  test('utf8ToBase64 i base64ToUtf8 działają poprawnie w środowisku bez globalnego Buffer', () => {
    const origBuffer = global.Buffer;
    try {
      // @ts-ignore
      global.Buffer = undefined;
      const original = 'Zażółć gęślą jaźń ☕';
      const encoded = utf8ToBase64(original);
      const decoded = base64ToUtf8(encoded);
      expect(decoded).toBe(original);
    } finally {
      global.Buffer = origBuffer;
    }
  });
});

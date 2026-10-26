// ============================================================================
// Napar (Steepwise) — Unit Tests: Offline Recipe Sharing & QR Code (DEC-20)
// ============================================================================

import {
  utf8ToBase64,
  base64ToUtf8,
  normalizeBase64,
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

  test('TASK-P6-11-WZR: generateQrMatrix obsługuje pusty string i spacje bez rzucania błędem', () => {
    const emptyResult = generateQrMatrix('');
    expect(emptyResult.size).toBeGreaterThan(0);
    expect(emptyResult.modules.length).toBe(emptyResult.size);

    const whitespaceResult = generateQrMatrix('   \n\t  ');
    expect(whitespaceResult.size).toBeGreaterThan(0);
    expect(whitespaceResult.modules.length).toBe(whitespaceResult.size);
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

  test('TASK-P3-09-WZR: Eksport i import receptury zachowuje angielskie metadane kroków i generuje angielskie fallbacki', () => {
    const url = encodeRecipeToShareUrl(sampleSavedRecipe);
    const decodedEn = decodeRecipeFromShareUrl(url, 'en');

    expect(decodedEn).not.toBeNull();
    expect(decodedEn?.originalSteps[0].nameEn).toBe('Bloom');
    expect(decodedEn?.originalSteps[0].instructionEn).toBe('Pour 60g and swirl');

    // Receptura bez autora i opisu w trybie EN generuje angielskie fallbacki
    const minimalPayload = encodeRecipeToShareUrl({
      id: 'min-rec',
      name: 'Custom Aero',
      beverageType: 'COFFEE',
      method: 'AeroPress',
      doseGrams: 14,
      waterGrams: 200,
      waterTempCelsius: 85,
      recommendedRatio: 14.3,
      stepsJson: '[]',
      isCustom: true,
      isFavorite: false,
      createdAt: new Date().toISOString(),
    });

    const decodedMin = decodeRecipeFromShareUrl(minimalPayload, 'en');
    expect(decodedMin?.recipe.author).toBe('Shared Recipe');
    expect(decodedMin?.recipe.description).toContain('Imported via QR code');
  });

  test('TASK-P4-11-WZR: normalizeBase64 radzi sobie z URL-Safe base64, spacjami z komunikatorów i brakiem paddingu', () => {
    const originalJson = JSON.stringify({ v: 1, n: 'Matcha / Special + Roast', b: 'TEA', m: 'Chasen', d: 2, w: 70, t: 80, r: 35, s: [] });
    const standardB64 = Buffer.from(originalJson, 'utf-8').toString('base64');
    
    // Stwórz wariant URL-Safe (- zamiast +, _ zamiast /, bez paddingu =)
    const urlSafeB64 = standardB64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    
    // Stwórz wariant ze spacjami zamiast plusów (np. gdy komunikator lub url decoder zamienił + na spacji)
    const spacedB64 = standardB64.replace(/\+/g, ' ');

    expect(normalizeBase64(urlSafeB64)).toBe(standardB64);
    expect(normalizeBase64(spacedB64)).toBe(standardB64);
    expect(base64ToUtf8(urlSafeB64)).toBe(originalJson);
    expect(base64ToUtf8(spacedB64)).toBe(originalJson);

    // Oraz przez dekodowanie pełnego share URL
    const decodedFromUrlSafe = decodeRecipeFromShareUrl(`https://napar.app/recipe?v=1&d=${urlSafeB64}`);
    expect(decodedFromUrlSafe).not.toBeNull();
    expect(decodedFromUrlSafe?.recipe.name).toBe('Matcha / Special + Roast');
  });

  test('TASK-P5-11-WZR: decodeRecipeFromShareUrl odrzuca niepoprawne fizycznie wartości dozy/wody i błędne typy kroków', () => {
    const makePayload = (patch: any) => {
      const data = { v: 1, n: 'Test', b: 'COFFEE', m: 'V60', d: 15, w: 250, ...patch };
      return utf8ToBase64(JSON.stringify(data));
    };

    expect(decodeRecipeFromShareUrl(makePayload({ d: 0 }))).toBeNull();
    expect(decodeRecipeFromShareUrl(makePayload({ d: -5 }))).toBeNull();
    expect(decodeRecipeFromShareUrl(makePayload({ d: NaN }))).toBeNull();
    expect(decodeRecipeFromShareUrl(makePayload({ w: 0 }))).toBeNull();
    expect(decodeRecipeFromShareUrl(makePayload({ w: -100 }))).toBeNull();
    expect(decodeRecipeFromShareUrl(makePayload({ w: Infinity }))).toBeNull();
    expect(decodeRecipeFromShareUrl(makePayload({ s: 'nie tablica' }))).toBeNull();
    expect(decodeRecipeFromShareUrl(makePayload({ s: 123 }))).toBeNull();
  });

  test('TASK-P7-11-WZR: decodeRecipeFromShareUrl filtruje nieobiektowe elementy i zabezpiecza Infinity/NaN w krokach', () => {
    const payloadWithCorruptSteps = utf8ToBase64(JSON.stringify({
      v: 1,
      n: 'Corrupt Steps Test',
      b: 'COFFEE',
      m: 'V60',
      d: 15,
      w: 250,
      s: [
        null,
        123,
        { n: 'Valid Step', d: Infinity, w: NaN, i: 'Instruction' },
        { n: '', d: -10, w: Infinity }
      ]
    }));

    const result = decodeRecipeFromShareUrl(payloadWithCorruptSteps);
    expect(result).not.toBeNull();
    expect(result?.originalSteps.length).toBe(2);
    expect(result?.originalSteps[0].namePl).toBe('Valid Step');
    expect(result?.originalSteps[0].durationSeconds).toBe(30);
    expect(result?.originalSteps[0].targetWaterGrams).toBe(0);
    expect(result?.originalSteps[1].namePl).toBe('Krok 2');
    expect(result?.originalSteps[1].durationSeconds).toBe(30);
    expect(result?.originalSteps[1].targetWaterGrams).toBe(0);
  });

  test('TASK-P9-11-WZR: decodeRecipeFromShareUrl odrzuca payloady o przekroczonych limitach rozmiaru (DoS / Memory Bomb guard)', () => {
    const makePayload = (patch: any) => {
      const data = { v: 1, n: 'Valid Name', b: 'COFFEE', m: 'V60', d: 15, w: 250, ...patch };
      return utf8ToBase64(JSON.stringify(data));
    };

    // Zbyt długa nazwa (> 200 znaków)
    expect(decodeRecipeFromShareUrl(makePayload({ n: 'A'.repeat(201) }))).toBeNull();
    // Zbyt długa metoda (> 50 znaków)
    expect(decodeRecipeFromShareUrl(makePayload({ m: 'M'.repeat(51) }))).toBeNull();
    // Zbyt duża doza (> 1000g)
    expect(decodeRecipeFromShareUrl(makePayload({ d: 1001 }))).toBeNull();
    // Zbyt duża ilość wody (> 50000g)
    expect(decodeRecipeFromShareUrl(makePayload({ w: 50001 }))).toBeNull();
    // Zbyt wiele kroków (> 100)
    const tooManySteps = Array.from({ length: 101 }, (_, i) => ({ n: `Step ${i}`, d: 30, w: 10 }));
    expect(decodeRecipeFromShareUrl(makePayload({ s: tooManySteps }))).toBeNull();

    // Wartości graniczne dopuszczalne
    expect(decodeRecipeFromShareUrl(makePayload({ n: 'A'.repeat(200), m: 'M'.repeat(50), d: 1000, w: 50000 }))).not.toBeNull();
  });

  test('TASK-P8-11-WZR: decodeRecipeFromShareUrl zabezpiecza parsed.t i parsed.r przed NaN i wartościami poza zakresem', () => {
    const payloadWithInvalidTempAndRatio = utf8ToBase64(JSON.stringify({
      v: 1,
      n: 'Temp and Ratio Guard',
      b: 'COFFEE',
      m: 'V60',
      d: 15,
      w: 250,
      t: NaN,
      r: Infinity,
      s: []
    }));

    const result = decodeRecipeFromShareUrl(payloadWithInvalidTempAndRatio);
    expect(result).not.toBeNull();
    expect(result?.recipe.waterTempCelsius).toBe(92);
    expect(result?.recipe.recommendedRatio).toBe(16.7);
  });
});

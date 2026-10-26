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

  test('TASK-P10-11-WZR: recipeToCompactPayload jest odporne na uszkodzony stepsJson niebędący tablicą oraz null', () => {
    const corruptSavedRecipe: any = {
      name: 'Corrupt Steps Recipe',
      beverageType: 'COFFEE',
      method: 'v60',
      doseGrams: 15,
      waterGrams: 250,
      waterTempCelsius: 93,
      recommendedRatio: 16.7,
      stepsJson: '12345', // liczba zamiast tablicy JSON
    };

    const payloadNumber = recipeToCompactPayload(corruptSavedRecipe);
    expect(payloadNumber).toBeDefined();
    expect(payloadNumber.s).toEqual([]);

    corruptSavedRecipe.stepsJson = '"string-not-array"';
    const payloadString = recipeToCompactPayload(corruptSavedRecipe);
    expect(payloadString.s).toEqual([]);

    corruptSavedRecipe.stepsJson = 'null';
    const payloadNull = recipeToCompactPayload(corruptSavedRecipe);
    expect(payloadNull.s).toEqual([]);

    const payloadNullRecipe = recipeToCompactPayload(null as any);
    expect(payloadNullRecipe).toBeDefined();
    expect(payloadNullRecipe.n).toBe('Recipe');
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

  test('TASK-P11-11-WZR: decodeRecipeFromShareUrl odrzuca nieznany beverageType oraz non-object, a recipeToCompactPayload sanityzuje pola', () => {
    // Nieprawidłowy beverageType
    const invalidBeverage = utf8ToBase64(JSON.stringify({
      v: 1,
      n: 'Invalid Beverage',
      b: 'UNKNOWN_DRINK',
      m: 'V60',
      d: 15,
      w: 250,
      s: []
    }));
    expect(decodeRecipeFromShareUrl(invalidBeverage)).toBeNull();

    // Parsed niebędący obiektem
    expect(decodeRecipeFromShareUrl(utf8ToBase64('12345'))).toBeNull();

    // recipeToCompactPayload sanacja pustych lub NaN
    const corruptNumerics: any = {
      name: '',
      method: '',
      doseGrams: NaN,
      waterGrams: -100,
      stepsJson: '[]',
    };
    const compact = recipeToCompactPayload(corruptNumerics);
    expect(compact.n).toBe('Recipe');
    expect(compact.m).toBe('v60');
    expect(compact.d).toBe(15);
    expect(compact.w).toBe(250);
  });

  test('TASK-P13-11-WZR: normalizeBase64, utf8ToBase64 oraz base64ToUtf8 chronią przed null/undefined/empty string', () => {
    expect(normalizeBase64('')).toBe('');
    expect(normalizeBase64(null as any)).toBe('');
    expect(normalizeBase64(undefined as any)).toBe('');

    expect(utf8ToBase64('')).toBe('');
    expect(utf8ToBase64(null as any)).toBe('');
    expect(utf8ToBase64(undefined as any)).toBe('');

    expect(base64ToUtf8('')).toBe('');
    expect(base64ToUtf8(null as any)).toBe('');
    expect(base64ToUtf8(undefined as any)).toBe('');
  });

  test('TASK-P14-11-WZR: decodeRecipeFromShareUrl parsuje URL z fragmentem #d= oraz parametrem ?data=', () => {
    const rawPayload = utf8ToBase64(JSON.stringify({
      v: 1,
      n: 'Hash Fragment Recipe',
      b: 'COFFEE',
      m: 'Aeropress',
      d: 14,
      w: 200,
      s: [{ n: 'Press', d: 60, w: 200 }],
    }));

    // URL z fragmentem hasha #d=
    const hashUrl = `napar://recipe#d=${encodeURIComponent(rawPayload)}`;
    const decodedFromHash = decodeRecipeFromShareUrl(hashUrl);
    expect(decodedFromHash).not.toBeNull();
    expect(decodedFromHash?.recipe.name).toBe('Hash Fragment Recipe');

    // URL z parametrem ?data=
    const dataParamUrl = `https://napar.app/recipe?data=${encodeURIComponent(rawPayload)}`;
    const decodedFromData = decodeRecipeFromShareUrl(dataParamUrl);
    expect(decodedFromData).not.toBeNull();
    expect(decodedFromData?.recipe.name).toBe('Hash Fragment Recipe');
  });

  test('TASK-P15-11-WZR: recipeToCompactPayload oczyszcza whitespace i nie dodaje pustych ne/ie, a decodeRecipeFromShareUrl jest odporny na spacje', () => {
    const recipe: any = {
      id: 'test-trim',
      name: '  Trim Recipe  ',
      beverageType: 'COFFEE',
      method: 'V60',
      doseGrams: 15,
      waterGrams: 250,
      stepsJson: JSON.stringify([
        {
          id: 's1',
          stepNumber: 1,
          namePl: '  Pre-infusion  ',
          nameEn: '   ',
          durationSeconds: 45,
          targetWaterGrams: 50,
          instructionPl: '  Zalej spokojnie  ',
          instructionEn: '',
        },
      ]),
    };

    const payload = recipeToCompactPayload(recipe);
    expect(payload.n).toBe('Trim Recipe');
    expect(payload.s[0].n).toBe('Pre-infusion');
    expect(payload.s[0].ne).toBeUndefined();
    expect(payload.s[0].i).toBe('Zalej spokojnie');
    expect(payload.s[0].ie).toBeUndefined();

    // Sprawdzenie decode z payloadem posiadającym spacje w json
    const jsonWithSpaces = `   ${JSON.stringify(payload)}   `;
    const encoded = utf8ToBase64(jsonWithSpaces);
    const decoded = decodeRecipeFromShareUrl(`napar://recipe?d=${encodeURIComponent(encoded)}`);
    expect(decoded).not.toBeNull();
    expect(decoded?.recipe.name).toBe('Trim Recipe');
  });

  test('TASK-P16-11-WZR: decodeRecipeFromShareUrl ogranicza precyzję zmiennoprzecinkową dozy i wody do 1 miejsca po przecinku', () => {
    const raw = utf8ToBase64(JSON.stringify({
      v: 1,
      n: 'Float Precision Recipe',
      b: 'COFFEE',
      m: 'V60',
      d: 15.3333333333,
      w: 249.999999999,
      s: [{ n: 'Pour', d: 60, w: 250 }],
    }));
    const decoded = decodeRecipeFromShareUrl(`napar://recipe?d=${encodeURIComponent(raw)}`);
    expect(decoded).not.toBeNull();
    expect(decoded?.recipe.doseGrams).toBe(15.3);
    expect(decoded?.recipe.waterGrams).toBe(250);
  });

  test('TASK-P17-11-WZR: decodeRecipeFromShareUrl zachowuje 0°C dla receptur Cold Brew / Ice Drip', () => {
    const raw = utf8ToBase64(JSON.stringify({
      v: 1,
      n: 'Cold Brew Kyoto',
      b: 'COFFEE',
      m: 'Cold Brew',
      d: 40,
      w: 500,
      t: 0,
      s: [{ n: 'Ice Drip', d: 14400, w: 500 }],
    }));
    const decoded = decodeRecipeFromShareUrl(`napar://recipe?d=${encodeURIComponent(raw)}`);
    expect(decoded).not.toBeNull();
    expect(decoded?.recipe.waterTempCelsius).toBe(0);
  });

  test('TASK-P18-11-WZR: recipeToCompactPayload zachowuje 0°C oraz zabezpiecza r (ratio) przed NaN', () => {
    const recipeWithZeroTemp: any = {
      name: 'Kyoto Cold Drip',
      beverageType: 'COFFEE',
      method: 'COLD_BREW',
      doseGrams: 30,
      waterGrams: 450,
      waterTempCelsius: 0,
      recommendedRatio: NaN,
      stepsJson: '[]',
    };
    const payload = recipeToCompactPayload(recipeWithZeroTemp);
    expect(payload.t).toBe(0);
    expect(payload.r).toBe(15);
  });

  test('TASK-P19-11-WZR: recipeToCompactPayload i decodeRecipeFromShareUrl ograniczają czas kroku i wodę', () => {
    const raw = utf8ToBase64(JSON.stringify({
      v: 1,
      n: 'Extreme Step Clamping',
      b: 'COFFEE',
      m: 'V60',
      d: 15,
      w: 250,
      s: [{ n: 'Huge Step', d: 999999, w: 999999 }],
    }));
    const decoded = decodeRecipeFromShareUrl(raw);
    expect(decoded).not.toBeNull();
    expect(decoded?.originalSteps[0].durationSeconds).toBe(86400);
    expect(decoded?.originalSteps[0].targetWaterGrams).toBe(50000);
  });

  test('TASK-P20-11-WZR: decodeRecipeFromShareUrl i recipeToCompactPayload ograniczają instrukcje kroku do 2000 znaków', () => {
    const hugeInstruction = 'A'.repeat(5000);
    const raw = utf8ToBase64(JSON.stringify({
      v: 1,
      n: 'Long Instruction Test',
      b: 'COFFEE',
      m: 'V60',
      d: 15,
      w: 250,
      s: [{ n: 'Step 1', d: 30, w: 100, i: hugeInstruction }],
    }));
    const decoded = decodeRecipeFromShareUrl(raw);
    expect(decoded).not.toBeNull();
    expect(decoded?.originalSteps[0].instructionPl.length).toBe(2000);
  });
  test('TASK-P21-11-WZR: recipeToCompactPayload ogranicza pole desc do 1000 znaków', () => {
    const hugeDesc = 'D'.repeat(5000);
    const recipe: any = {
      name: 'Long Desc Recipe',
      beverageType: 'COFFEE',
      method: 'V60',
      doseGrams: 15,
      waterGrams: 250,
      waterTempCelsius: 92,
      description: hugeDesc,
      stepsJson: '[]',
    };
    const payload = recipeToCompactPayload(recipe);
    expect(payload.desc?.length).toBe(1000);

    const shareUrl = encodeRecipeToShareUrl(recipe);
    const decoded = decodeRecipeFromShareUrl(shareUrl);
    expect(decoded).not.toBeNull();
    expect(decoded?.recipe.description?.length).toBe(1000);
  });
  test('TASK-P22-11-WZR: recipeToCompactPayload i decodeRecipeFromShareUrl ograniczają długość nazw kroków do 100 znaków', () => {
    const longName = 'S'.repeat(300);
    const raw = utf8ToBase64(JSON.stringify({
      v: 1,
      n: 'Long Step Name Test',
      b: 'COFFEE',
      m: 'V60',
      d: 15,
      w: 250,
      s: [{ n: longName, d: 30, w: 100 }],
    }));
    const decoded = decodeRecipeFromShareUrl(raw);
    expect(decoded).not.toBeNull();
    expect(decoded?.originalSteps[0].namePl.length).toBe(100);
  });
  test('TASK-P23-11-WZR: recipeToCompactPayload i decodeRecipeFromShareUrl ściśle zaokrąglają temperaturę do liczb całkowitych', () => {
    const recipe: any = {
      name: 'Temp Float Recipe',
      beverageType: 'COFFEE',
      method: 'V60',
      doseGrams: 15,
      waterGrams: 250,
      waterTempCelsius: 93.7,
      stepsJson: '[]',
    };
    const payload = recipeToCompactPayload(recipe);
    expect(payload.t).toBe(94);

    const raw = utf8ToBase64(JSON.stringify({
      v: 1,
      n: 'Temp Float Test',
      b: 'COFFEE',
      m: 'V60',
      d: 15,
      w: 250,
      t: 88.3,
    }));
    const decoded = decodeRecipeFromShareUrl(raw);
    expect(decoded).not.toBeNull();
    expect(decoded?.recipe.waterTempCelsius).toBe(88);
  });
  test('TASK-P24-11-WZR: recipeToCompactPayload clampuje doze do 1000g i wode do 50000g', () => {
    const hugeRecipe: any = {
      name: 'Huge Batch Recipe',
      beverageType: 'COFFEE',
      method: 'V60',
      doseGrams: 5000,
      waterGrams: 90000,
      waterTempCelsius: 92,
      stepsJson: '[]',
    };
    const payload = recipeToCompactPayload(hugeRecipe);
    expect(payload.d).toBe(1000);
    expect(payload.w).toBe(50000);
  });
  test('TASK-P25-11-WZR: recipeToCompactPayload i decodeRecipeFromShareUrl ograniczają grindSizeDescription do 200 znaków', () => {
    const longGrind = 'g'.repeat(300);
    const recipe: any = {
      name: 'Test Grind Cap',
      beverageType: 'COFFEE',
      method: 'V60',
      doseGrams: 15,
      waterGrams: 250,
      grindSizeDescription: '   ' + longGrind + '   ',
      stepsJson: '[]',
    };
    const payload = recipeToCompactPayload(recipe);
    expect(payload.g).toBeDefined();
    expect(payload.g?.length).toBe(200);

    const rawUrl = encodeRecipeToShareUrl(recipe);
    const decoded = decodeRecipeFromShareUrl(rawUrl);
    expect(decoded).not.toBeNull();
    expect(decoded?.recipe.grindSizeDescription?.length).toBe(200);
  });

  test('TASK-P26-11-WZR: decodeRecipeFromShareUrl stosuje fallbacki dla whitespace author i description', () => {
    const compact = {
      v: 1,
      n: 'Whitespace Meta Test',
      b: 'COFFEE',
      m: 'V60',
      a: '    ',
      desc: '    ',
      d: 15,
      w: 250,
      t: 92,
      r: 16.7,
      s: [],
    };
    const b64 = Buffer.from(JSON.stringify(compact), 'utf8').toString('base64');
    const decoded = decodeRecipeFromShareUrl(b64, 'pl');
    expect(decoded).not.toBeNull();
    expect(decoded?.recipe.author).toBe('Udostępniona receptura');
    expect(decoded?.recipe.description).toContain('Zaimportowano');
  });

  test('TASK-P27-11-WZR: recipeToCompactPayload pomija pusty lub whitespace desc w payloadzie', () => {
    const recEmptyDesc: any = {
      name: 'Clean Recipe',
      beverageType: 'COFFEE',
      method: 'V60',
      doseGrams: 15,
      waterGrams: 250,
      description: '   ',
      stepsJson: '[]',
    };
    const payload = recipeToCompactPayload(recEmptyDesc);
    expect(payload.desc).toBeUndefined();

    recEmptyDesc.description = '';
    const payload2 = recipeToCompactPayload(recEmptyDesc);
    expect(payload2.desc).toBeUndefined();
  });

  test('TASK-P28-11-WZR: decodeRecipeFromShareUrl odrzuca whitespace-only name oraz method', () => {
    const compactWhitespaceName = {
      v: 1,
      n: '    ',
      b: 'COFFEE',
      m: 'V60',
      d: 15,
      w: 250,
      s: [],
    };
    const b64Name = Buffer.from(JSON.stringify(compactWhitespaceName), 'utf8').toString('base64');
    expect(decodeRecipeFromShareUrl(b64Name)).toBeNull();

    const compactWhitespaceMethod = {
      v: 1,
      n: 'Valid Name',
      b: 'COFFEE',
      m: '    ',
      d: 15,
      w: 250,
      s: [],
    };
    const b64Method = Buffer.from(JSON.stringify(compactWhitespaceMethod), 'utf8').toString('base64');
    expect(decodeRecipeFromShareUrl(b64Method)).toBeNull();
  });

  test('TASK-P29-11-WZR: recipeToCompactPayload ogranicza dlugosc name (200), method (50) i author (100)', () => {
    const longRecipe: SavedRecipe = {
      id: 'long-recipe-test',
      name: 'A'.repeat(300),
      beverageType: 'COFFEE',
      method: 'M'.repeat(100),
      author: 'Aut'.repeat(50),
      doseGrams: 15,
      waterGrams: 250,
      waterTempCelsius: 93,
      recommendedRatio: 16.7,
      isFavorite: false,
      stepsJson: '[]',
      isCustom: true,
      createdAt: '2026-10-26T12:00:00Z',
    };
    const payload = recipeToCompactPayload(longRecipe);
    expect(payload.n.length).toBe(200);
    expect(payload.m.length).toBe(50);
    expect(payload.a?.length).toBe(100);
  });

  test('TASK-P30-11-WZR: decodeRecipeFromShareUrl parsuje numeryczne stringi i clampuje targetWaterGrams i durationSeconds w krokach', () => {
    const compactWithStrings = {
      v: 1,
      n: 'Clamped Step Test',
      b: 'COFFEE',
      m: 'V60',
      d: 15,
      w: 250,
      s: [
        {
          n: 'Pour 1',
          d: '45.8',
          w: '999999',
        },
        {
          n: 'Pour 2',
          d: -10,
          w: -50,
        },
      ],
    };
    const b64 = Buffer.from(JSON.stringify(compactWithStrings), 'utf8').toString('base64');
    const result = decodeRecipeFromShareUrl(b64);
    expect(result).not.toBeNull();
    const steps = result!.originalSteps;
    expect(steps.length).toBe(2);
    // step 1: d coerced to 46 (bounded by 86400), w clamped to 50000
    expect(steps[0].durationSeconds).toBe(46);
    expect(steps[0].targetWaterGrams).toBe(50000);
    // step 2: d fallback to 30, w fallback to 0
    expect(steps[1].durationSeconds).toBe(30);
    expect(steps[1].targetWaterGrams).toBe(0);
  });

  test('TASK-P31-11-WZR: recipeToCompactPayload parsuje numeryczne stringi dozy i wody', () => {
    const recipeWithStrings: any = {
      id: 'string-dose-recipe',
      name: 'String Test',
      beverageType: 'COFFEE',
      method: 'Aeropress',
      doseGrams: '16.5',
      waterGrams: '220.0',
      waterTempCelsius: '88',
      recommendedRatio: '13.3',
      isFavorite: false,
      stepsJson: '[]',
      isCustom: true,
      createdAt: '2026-10-26T12:00:00Z',
    };
    const payload = recipeToCompactPayload(recipeWithStrings);
    expect(payload.d).toBe(16.5);
    expect(payload.w).toBe(220);
    expect(payload.t).toBe(88);
  });

  test('TASK-P32-11-WZR: decodeRecipeFromShareUrl parsuje ratio w formacie string oraz chroni przed -0', () => {
    const compact: any = {
      v: 1,
      n: 'Ratio String Recipe',
      b: 'COFFEE',
      m: 'v60',
      d: 15,
      w: 250,
      t: 93,
      r: '16.67',
      s: [],
    };
    const b64 = Buffer.from(JSON.stringify(compact), 'utf8').toString('base64');
    const result = decodeRecipeFromShareUrl(b64);
    expect(result).not.toBeNull();
    expect(result!.recipe.recommendedRatio).toBe(16.67);
    expect(Object.is(result!.recipe.doseGrams, -0)).toBe(false);
    expect(Object.is(result!.recipe.waterGrams, -0)).toBe(false);
  });

  test('TASK-P33-11-WZR: recipeToCompactPayload parsuje numeryczne stringi w krokach durationSeconds i targetWaterGrams', () => {
    const recipeWithStepStrings: any = {
      id: 'step-strings-recipe',
      name: 'Step String Recipe',
      beverageType: 'COFFEE',
      method: 'v60',
      doseGrams: 15,
      waterGrams: 250,
      waterTempCelsius: 93,
      recommendedRatio: 16.7,
      isCustom: true,
      isFavorite: false,
      stepsJson: JSON.stringify([
        {
          namePl: 'Preinfuzja',
          durationSeconds: '45.0',
          targetWaterGrams: '50.0',
        },
      ]),
      createdAt: '2026-10-26T12:00:00Z',
    };
    const payload = recipeToCompactPayload(recipeWithStepStrings);
    expect(payload.s).toHaveLength(1);
    expect(payload.s[0].d).toBe(45);
    expect(payload.s[0].w).toBe(50);
  });
});

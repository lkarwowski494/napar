// ============================================================================
// Napar (Steepwise) — Unit Tests: Grinder Dial-in Converter
// ============================================================================

import {
  SUPPORTED_GRINDERS,
  GRIND_CATEGORIES,
  convertMicronsToGrinder,
  convertBetweenGrinders,
  getRecipeMicrons,
  getRecommendedGrindForRecipe,
  findGrinderById,
} from '../grinder-converter';

describe('Grinder Dial-in Converter Module', () => {
  test('Obsługuje 6 popularnych modeli młynków specialty', () => {
    const ids = SUPPORTED_GRINDERS.map((g) => g.id);
    expect(ids).toContain('comandante_c40');
    expect(ids).toContain('timemore_c2_c3');
    expect(ids).toContain('1zpresso_k_ultra');
    expect(ids).toContain('fellow_ode_gen2');
    expect(ids).toContain('baratza_encore');
    expect(ids).toContain('kingrinder_k6');
  });

  test('Prawidłowo przelicza mikrony standardu V60 (720 µm) na Comandante i Timemore', () => {
    // 720um / 30um = 24 kliki Comandante
    const c40 = convertMicronsToGrinder(720, 'comandante_c40');
    expect(c40.rawValue).toBe(24);
    expect(c40.formatted).toContain('24 klików');

    // 720um / 35um = 21 klików Timemore
    const timemore = convertMicronsToGrinder(720, 'timemore_c2_c3');
    expect(timemore.rawValue).toBe(21);
    expect(timemore.formatted).toContain('21 klików');
  });

  test('Prawidłowo przelicza mikrony dla 1Zpresso K-Ultra, Fellow Ode, Baratza Encore i Kingrinder K6', () => {
    // 1Zpresso K-Ultra: 720um / 20um = 36 klików (3.6)
    const kUltra = convertMicronsToGrinder(720, '1zpresso_k_ultra');
    expect(kUltra.rawValue).toBe(36);
    expect(kUltra.formatted).toBe('3.6 (36 klików)');

    // Fellow Ode Gen 2: (720 - 200) / 40 = 13 klików
    const ode = convertMicronsToGrinder(720, 'fellow_ode_gen2');
    expect(ode.rawValue).toBe(13);
    expect(ode.formatted).toBe('5');

    // Baratza Encore: (720 - 150) / 35 = 16.28 -> 16
    const encore = convertMicronsToGrinder(720, 'baratza_encore');
    expect(encore.rawValue).toBe(16);
    expect(encore.formatted).toBe('Nastawa #16');

    // Kingrinder K6: 720um / 16um = 45 klików
    const k6 = convertMicronsToGrinder(720, 'kingrinder_k6');
    expect(k6.rawValue).toBe(45);
    expect(k6.formatted).toBe('45 klików');
  });

  test('Prawidłowo parsuje nastawy tekstowe dla każdego młynka', () => {
    for (const grinder of SUPPORTED_GRINDERS) {
      const parsedFromNumber = grinder.parseSetting('20');
      expect(parsedFromNumber).toBeGreaterThan(0);
    }

    const kUltra = SUPPORTED_GRINDERS.find((g) => g.id === '1zpresso_k_ultra')!;
    expect(kUltra.parseSetting('3.5')).toBe(700); // 3.5 * 10 * 20um = 700um
    expect(kUltra.parseSetting('50')).toBe(1000); // 50 * 20um = 1000um

    const ode = SUPPORTED_GRINDERS.find((g) => g.id === 'fellow_ode_gen2')!;
    expect(ode.parseSetting('4')).toBe(200 + ((4 - 1) * 3 + 1) * 40.0);

    const encore = SUPPORTED_GRINDERS.find((g) => g.id === 'baratza_encore')!;
    expect(encore.parseSetting('#18')).toBe(150 + 18 * 35);
  });

  test('Prawidłowo przelicza nastawę między dwoma młynkami (liczba oraz tekst)', () => {
    // 24 kliki Comandante (720um) -> Timemore C2 (21 klików)
    const resNumber = convertBetweenGrinders('comandante_c40', 24, 'timemore_c2_c3');
    expect(resNumber.microns).toBe(720);
    expect(resNumber.targetFormatted).toContain('21 klików');

    // Tekstowo: '24' Comandante -> Fellow Ode
    const resText = convertBetweenGrinders('comandante_c40', '24 kliki', 'fellow_ode_gen2');
    expect(resText.microns).toBe(720);
    expect(resText.targetFormatted).toBe('5');
  });

  test('Prawidłowo ogranicza nastawy skrajne (min/max clamping)', () => {
    // Ekstremalnie drobny przemiał (np. 50 um) -> clamp do minSetting
    const ultraFine = convertMicronsToGrinder(50, 'comandante_c40');
    expect(ultraFine.rawValue).toBe(5); // minSetting Comandante

    // Ekstremalnie gruby przemiał (np. 3000 um) -> clamp do maxSetting
    const ultraCoarse = convertMicronsToGrinder(3000, 'comandante_c40');
    expect(ultraCoarse.rawValue).toBe(45); // maxSetting Comandante
  });

  test('Obsługuje ułamkowe nastawy Fellow Ode Gen 2 (⅓, ⅔ oraz brak ułamka)', () => {
    const ode = SUPPORTED_GRINDERS.find((g) => g.id === 'fellow_ode_gen2')!;
    // clicks = 1 -> major 1, sub 0 -> '1'
    expect(ode.formatSetting(1)).toBe('1');
    // clicks = 2 -> major 1, sub 1 -> '1⅓'
    expect(ode.formatSetting(2)).toBe('1⅓');
    // clicks = 3 -> major 1, sub 2 -> '1⅔'
    expect(ode.formatSetting(3)).toBe('1⅔');
    // clicks = 4 -> major 2, sub 0 -> '2'
    expect(ode.formatSetting(4)).toBe('2');
  });

  test('Obsługuje domyślne fallbacki parseSetting dla nienumerycznych ciągów', () => {
    const c40 = SUPPORTED_GRINDERS.find((g) => g.id === 'comandante_c40')!;
    expect(c40.parseSetting('nieznana')).toBe(24 * 30.0);

    const timemore = SUPPORTED_GRINDERS.find((g) => g.id === 'timemore_c2_c3')!;
    expect(timemore.parseSetting('brak')).toBe(18 * 35.0);

    const kUltra = SUPPORTED_GRINDERS.find((g) => g.id === '1zpresso_k_ultra')!;
    expect(kUltra.parseSetting('tekst')).toBe(7.5 * 10 * 20.0);

    const ode = SUPPORTED_GRINDERS.find((g) => g.id === 'fellow_ode_gen2')!;
    expect(ode.parseSetting('brak_cyfr')).toBe(200 + ((5 - 1) * 3 + 1) * 40.0);

    // Fellow Ode Gen 2 round-trip (M1-audytor-generalny-034)
    const odeRoundTrip = convertBetweenGrinders('fellow_ode_gen2', '5', 'fellow_ode_gen2');
    expect(odeRoundTrip.targetFormatted).toBe('5');

    const encore = SUPPORTED_GRINDERS.find((g) => g.id === 'baratza_encore')!;
    expect(encore.parseSetting('brak')).toBe(150 + 16 * 35.0);

    const k6 = SUPPORTED_GRINDERS.find((g) => g.id === 'kingrinder_k6')!;
    expect(k6.parseSetting('brak')).toBe(90 * 16.0);
  });

  test('Obsługuje fallback dla nieznanego identyfikatora młynka', () => {
    const fallback = convertMicronsToGrinder(720, 'unknown_grinder_999');
    expect(fallback.grinderName).toBe(SUPPORTED_GRINDERS[0].name);

    const fallbackBetween = convertBetweenGrinders('unknown_src', 20, 'unknown_tgt');
    expect(fallbackBetween.targetFormatted).toBeTruthy();
  });

  test('Zwraca kategorie grubości mielenia od espresso do cold brew', () => {
    expect(GRIND_CATEGORIES.length).toBe(5);
    const catIds = GRIND_CATEGORIES.map((c) => c.id);
    expect(catIds).toContain('espresso');
    expect(catIds).toContain('aeropress');
    expect(catIds).toContain('pourover_v60');
    expect(catIds).toContain('chemex_cupping');
    expect(catIds).toContain('frenchpress_coldbrew');
  });

  test('Przelicza każdą kategorię mielenia na wszystkie 6 modeli młynków', () => {
    for (const cat of GRIND_CATEGORIES) {
      for (const grinder of SUPPORTED_GRINDERS) {
        const res = convertMicronsToGrinder(cat.defaultMicrons, grinder.id);
        expect(res.grinderName).toBe(grinder.name);
        expect(res.rawValue).toBeGreaterThanOrEqual(grinder.minSetting);
        expect(res.rawValue).toBeLessThanOrEqual(grinder.maxSetting);
        expect(res.formatted).toBeTruthy();
      }
    }
  });

  test('Prawidłowo wyznacza mikrony receptury (getRecipeMicrons)', () => {
    expect(getRecipeMicrons({ method: 'ESPRESSO' })).toBe(350);
    expect(getRecipeMicrons({ method: 'AEROPRESS', grindSettingDescriptionPl: 'Drobno (16 klików)' })).toBe(520);
    expect(getRecipeMicrons({ method: 'AEROPRESS' })).toBe(560);
    expect(getRecipeMicrons({ method: 'V60', grindSettingDescriptionPl: 'Grubo (28 klików C40)' })).toBe(850);
    expect(getRecipeMicrons({ method: 'V60', grindSettingDescriptionPl: 'Średnio (20 klików)' })).toBe(600);
    expect(getRecipeMicrons({ method: 'V60' })).toBe(720);
    expect(getRecipeMicrons({ method: 'CHEMEX' })).toBe(880);
    expect(getRecipeMicrons({ method: 'FRENCH_PRESS' })).toBe(1150);
    expect(getRecipeMicrons({ method: 'UNKNOWN_METHOD' })).toBe(720);
  });

  test('Prawidłowo rekomenduje nastawę młynka dla wybranej receptury (getRecommendedGrindForRecipe)', () => {
    const v60Recipe = { method: 'V60', grindSettingDescriptionPl: 'Średnio (24 kliki C40)' };
    const c40Rec = getRecommendedGrindForRecipe(v60Recipe, 'comandante_c40');
    expect(c40Rec.grinderName).toBe('Comandante C40 MK3/MK4');
    expect(c40Rec.microns).toBe(720);
    expect(c40Rec.rawValue).toBe(24);

    const odeRec = getRecommendedGrindForRecipe(v60Recipe, 'fellow_ode_gen2');
    expect(odeRec.grinderName).toBe('Fellow Ode Gen 2');
    expect(odeRec.formatted).toBe('5');
  });

  test('TASK-P3-07-TRE: Obsługuje formatowanie nastaw i opisy żaren w języku angielskim', () => {
    const c40En = convertMicronsToGrinder(720, 'comandante_c40', 'en');
    expect(c40En.formatted).toBe('24 clicks');

    const encoreEn = convertMicronsToGrinder(720, 'baratza_encore', 'en');
    expect(encoreEn.formatted).toBe('Setting #16');

    const kUltraEn = convertMicronsToGrinder(720, '1zpresso_k_ultra', 'en');
    expect(kUltraEn.formatted).toContain('clicks');

    const c40 = SUPPORTED_GRINDERS.find((g) => g.id === 'comandante_c40');
    expect(c40?.burrTypeEn).toBe('Nitro Blade (39mm conical)');
  });

  test('TASK-P8-03-ZAK: Chroni convertMicronsToGrinder i convertBetweenGrinders przed NaN i Infinity', () => {
    // NaN lub <= 0 powinno bezpiecznie użyć domyślnego 720 µm
    const nanRes = convertMicronsToGrinder(NaN, 'comandante_c40');
    expect(nanRes.rawValue).toBe(24);
    expect(nanRes.formatted).toContain('24 klików');

    const infRes = convertMicronsToGrinder(Infinity, 'comandante_c40');
    expect(infRes.rawValue).toBe(24); // bezpieczny fallback do 720 µm

    const betweenNaN = convertBetweenGrinders('comandante_c40', NaN, 'timemore_c2_c3');
    expect(betweenNaN.microns).toBe(720);
    expect(betweenNaN.targetFormatted).toContain('21 klików');

    const betweenInvalidStr = convertBetweenGrinders('comandante_c40', 'invalid-clicks', 'timemore_c2_c3');
    expect(Number.isFinite(betweenInvalidStr.microns)).toBe(true);
  });

  test('TASK-P8-07-JAK: getRecipeMicrons i getRecommendedGrindForRecipe są odporne na undefined / null recipe', () => {
    // Nie rzuca błędu, zwraca bezpieczny fallback 720 µm
    expect(getRecipeMicrons(undefined)).toBe(720);
    expect(getRecipeMicrons(null)).toBe(720);
    expect(getRecipeMicrons({} as any)).toBe(720);

    const recUndef = getRecommendedGrindForRecipe(undefined, 'comandante_c40');
    expect(recUndef.microns).toBe(720);
    expect(recUndef.rawValue).toBe(24);

    const recNull = getRecommendedGrindForRecipe(null, 'fellow_ode_gen2');
    expect(recNull.microns).toBe(720);
    expect(recNull.formatted).toBe('5');
  });

  test('TASK-P14-08-PRO: parseSetting każdego młynka jest odporne na null, undefined i wartości nienumeryczne', () => {
    for (const g of SUPPORTED_GRINDERS) {
      expect(() => g.parseSetting(null as any)).not.toThrow();
      expect(() => g.parseSetting(undefined as any)).not.toThrow();
      expect(() => g.parseSetting('')).not.toThrow();
      expect(Number.isFinite(g.parseSetting(null as any))).toBe(true);
      expect(Number.isFinite(g.parseSetting(undefined as any))).toBe(true);
    }
  });

  test('TASK-P16-08-PRO: findGrinderById pobiera model młynka lub undefined, a convertMicronsToGrinder wspiera angielską nazwę', () => {
    expect(findGrinderById('comandante_c40')?.id).toBe('comandante_c40');
    expect(findGrinderById('  timemore_c2_c3  ')?.id).toBe('timemore_c2_c3');
    expect(findGrinderById('')).toBeUndefined();
    expect(findGrinderById('non-existent')).toBeUndefined();
    expect(findGrinderById(null as any)).toBeUndefined();

    // Sprawdzenie zlokalizowanej nazwy młynka
    const enGeneric = convertMicronsToGrinder(720, 'generic_grinder', 'en');
    expect(enGeneric.grinderName).toContain('Other grinder');

    const plGeneric = convertMicronsToGrinder(720, 'generic_grinder', 'pl');
    expect(plGeneric.grinderName).toContain('Inny młynek');
  });

  test('TASK-P17-08-PRO: obsługa przecinka dziesiętnego w convertBetweenGrinders oraz parseSetting', () => {
    const kUltra = SUPPORTED_GRINDERS.find((g) => g.id === '1zpresso_k_ultra')!;
    // '3,5' z przecinkiem powinno sparsować się tak samo jak '3.5'
    expect(kUltra.parseSetting('3,5')).toBe(700);

    const kinu = SUPPORTED_GRINDERS.find((g) => g.id === 'kinu_m47')!;
    expect(kinu.parseSetting('3,5')).toBe(350);

    const converted = convertBetweenGrinders('1zpresso_k_ultra', '3,5', 'comandante_c40');
    expect(converted.microns).toBe(700);
    expect(converted.targetFormatted).toContain('23 klików');
  });

  test('TASK-P18-08-PRO: getRecommendedGrindForRecipe wspiera język angielski i jest odporne na niepoprawny format metody', () => {
    const enRec = getRecommendedGrindForRecipe({ method: 'espresso' }, 'comandante_c40', 'en');
    expect(enRec.formatted).toContain('clicks');

    const weirdMethod = getRecommendedGrindForRecipe({ method: 12345 as any }, 'comandante_c40');
    expect(weirdMethod.microns).toBe(720);
  });

  test('TASK-P19-08-PRO: convertBetweenGrinders i findGrinderById wspierają wielkość liter i białe znaki w ID młynków', () => {
    expect(findGrinderById('COMANDANTE_C40')?.id).toBe('comandante_c40');
    expect(findGrinderById('  Timemore_C2_C3  ')?.id).toBe('timemore_c2_c3');

    const converted = convertBetweenGrinders('  COMANDANTE_C40  ', 24, '  BARATZA_ENCORE  ');
    expect(converted.microns).toBe(720);
    expect(converted.targetFormatted).toContain('#16');
  });

  test('TASK-P20-08-PRO: getRecipeMicrons wspiera angielskie opisy mielenia (grindSettingDescriptionEn)', () => {
    const enCoarse = getRecipeMicrons({ method: 'V60', grindSettingDescriptionEn: 'coarse grind (28-30 clicks)' });
    expect(enCoarse).toBe(850);

    const enFine = getRecipeMicrons({ method: 'Aeropress', grindSettingDescriptionEn: 'fine grind' });
    expect(enFine).toBe(560);
  });
  test('TASK-P21-08-PRO: getRecipeMicrons wspiera przemiał pod tygielek (cezve / turkish) i zwraca 200 µm', () => {
    expect(getRecipeMicrons({ method: 'TURKISH' })).toBe(200);
    expect(getRecipeMicrons({ method: 'cezve' })).toBe(200);
    expect(getRecipeMicrons({ grindSettingDescriptionPl: 'Puder pod tygielek' })).toBe(200);
    expect(getRecipeMicrons({ grindSettingDescriptionEn: 'Extra fine turkish powder' })).toBe(200);

    const cezveComandante = getRecommendedGrindForRecipe({ method: 'TURKISH' }, 'comandante_c40');
    expect(cezveComandante.microns).toBe(200);
    expect(cezveComandante.rawValue).toBe(7); // 200 / 30 = 6.67 -> 7 clicks
  });
  test('TASK-P22-08-PRO: getRecipeMicrons rozpoznaje Cold Drip i Ice Drip jako gruby przemiał 1150 µm', () => {
    expect(getRecipeMicrons({ method: 'Cold Drip' })).toBe(1150);
    expect(getRecipeMicrons({ method: 'ICE_DRIP' })).toBe(1150);
    expect(getRecipeMicrons({ method: 'Cold Brew 24h' })).toBe(1150);
  });
  test('TASK-P23-08-PRO: getRecipeMicrons rozpoznaje kawiarkę (Moka Pot) i zwraca 450 µm', () => {
    expect(getRecipeMicrons({ method: 'MOKA' })).toBe(450);
    expect(getRecipeMicrons({ method: 'moka' })).toBe(450);
    expect(getRecipeMicrons({ grindSettingDescriptionPl: 'Średnio drobno pod kawiarkę' })).toBe(450);
    expect(getRecipeMicrons({ grindSettingDescriptionEn: 'Medium-fine for moka pot' })).toBe(450);
  });
  test('TASK-P24-08-PRO: getRecipeMicrons rozpoznaje syfon (Siphon / Syfon) i zwraca 650 µm', () => {
    expect(getRecipeMicrons({ method: 'SIPHON' })).toBe(650);
    expect(getRecipeMicrons({ method: 'syfon' })).toBe(650);
    expect(getRecipeMicrons({ grindSettingDescriptionPl: 'Średnio-drobno pod syfon próżniowy' })).toBe(650);
    expect(getRecipeMicrons({ grindSettingDescriptionEn: 'Medium-fine for vacuum siphon' })).toBe(650);
  });
  test('TASK-P25-08-PRO: getRecipeMicrons rozpoznaje French Press i praskę francuską i zwraca 1150 µm', () => {
    expect(getRecipeMicrons({ method: 'FRENCH_PRESS' })).toBe(1150);
    expect(getRecipeMicrons({ method: 'FRENCHPRESS' })).toBe(1150);
    expect(getRecipeMicrons({ method: 'French Press' })).toBe(1150);
    expect(getRecipeMicrons({ method: 'PRASKA_FRANCUSKA' })).toBe(1150);
    expect(getRecipeMicrons({ grindSettingDescriptionPl: 'Grubo pod praskę francuską' })).toBe(1150);
    expect(getRecipeMicrons({ grindSettingDescriptionEn: 'Coarse for french press immersion' })).toBe(1150);
  });

  test('TASK-P26-08-PRO: getRecipeMicrons rozpoznaje Clever Dripper i Cupping i zwraca 880 µm', () => {
    expect(getRecipeMicrons({ method: 'CLEVER' })).toBe(880);
    expect(getRecipeMicrons({ method: 'Clever Dripper' })).toBe(880);
    expect(getRecipeMicrons({ grindSettingDescriptionPl: 'Średnio-grubo pod dripper clever' })).toBe(880);
    expect(getRecipeMicrons({ grindSettingDescriptionEn: 'Medium-coarse for cupping protocol' })).toBe(880);
  });
});

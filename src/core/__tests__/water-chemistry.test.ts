// ============================================================================
// Napar (Steepwise) — Unit Tests: Water Chemistry & Mineralization
// ============================================================================

import {
  WATER_RECIPES,
  BOTTLED_WATER_BENCHMARKS,
  calculateWaterMinerals,
  diagnoseWaterSensoryImpact,
  getWaterProfileName,
  ppmCaCO3ToDegreesDH,
  degreesDHToPpmCaCO3,
  findWaterRecipeById,
  findBottledWaterById,
} from '../water-chemistry';

describe('Water Chemistry & Mineralization Module', () => {
  test('Zawiera kluczowe profile mineralizacji wody specialty dla kawy i herbaty', () => {
    const ids = WATER_RECIPES.map((r) => r.id);
    expect(ids).toContain('barista_hustle_80_40');
    expect(ids).toContain('sca_standard');
    expect(ids).toContain('melbourne_soft');
    expect(ids).toContain('scott_rao_wonder');
    expect(ids).toContain('hendon_medium_dark');
    expect(ids).toContain('tea_delicate');
    expect(ids).toContain('tea_gongfu_rock_puerh');
  });

  test('Prawidłowo przelicza koncentraty dla 1.0 litra wody w recepturze 80/40', () => {
    // 1L, GH 80, KH 40
    // Buffer = (40 / 2) * 1 = 20.0g
    // Hardness = (80 / 2) * 1 = 40.0g
    const res = calculateWaterMinerals(1.0, 80, 40);
    expect(res.waterVolumeLiters).toBe(1.0);
    expect(res.targetGhPpm).toBe(80);
    expect(res.targetKhPpm).toBe(40);
    expect(res.concentrateBufferGrams).toBe(20.0);
    expect(res.concentrateHardnessGrams).toBe(40.0);
    expect(res.baseWaterGrams).toBe(940.0);
  });

  test('Prawidłowo skaluje koncentraty dla 5.0 litrów wody (bańka RO)', () => {
    // 5L, GH 80, KH 40
    // Buffer = (40 / 2) * 5 = 100.0g
    // Hardness = (80 / 2) * 5 = 200.0g
    const res = calculateWaterMinerals(5.0, 80, 40);
    expect(res.concentrateBufferGrams).toBe(100.0);
    expect(res.concentrateHardnessGrams).toBe(200.0);
    expect(res.baseWaterGrams).toBe(4700.0);

    // Suche sole dla 5L
    // NaHCO3: 40 * 0.00168 * 5 = 0.336g
    expect(res.dryBakingSodaNaHCO3Grams).toBeCloseTo(0.336, 3);
    // MgSO4: 80 * 0.002465 * 5 = 0.986g
    expect(res.dryEpsomSaltMgSO4Grams).toBeCloseTo(0.986, 3);
  });

  test('Prawidłowo liczy mineralizację dla miękkiej wody do herbaty (GH 30, KH 15)', () => {
    const res = calculateWaterMinerals(1.0, 30, 15);
    expect(res.concentrateBufferGrams).toBe(7.5);
    expect(res.concentrateHardnessGrams).toBe(15.0);
  });

  test('Zwraca poprawną nazwę profilu wody w wybranym języku (z fallbackiem)', () => {
    expect(getWaterProfileName('sca_standard', 'pl')).toBe('Standard SCA (Specialty Coffee)');
    expect(getWaterProfileName('sca_standard', 'en')).toBe('SCA Standard Water');
    expect(getWaterProfileName('custom_unknown_123', 'pl')).toBe('custom_unknown_123');
  });

  test('Zawiera benchmarki popularnych wód butelkowanych z oceną przydatności', () => {
    expect(BOTTLED_WATER_BENCHMARKS.length).toBeGreaterThanOrEqual(4);
    const volvic = BOTTLED_WATER_BENCHMARKS.find((b) => b.id === 'volvic');
    expect(volvic).toBeDefined();
    expect(volvic?.suitability).toBe('EXCELLENT');
    expect(volvic?.tdsPpm).toBe(130);

    const muszyna = BOTTLED_WATER_BENCHMARKS.find((b) => b.id === 'muszynianka');
    expect(muszyna).toBeDefined();
    expect(muszyna?.suitability).toBe('NOT_RECOMMENDED');
  });

  test('Diagnozuje sensoryczny wpływ wody dla wszystkich przypadków skrajnych', () => {
    // 1. Zbyt wysoki bufor (KH > 75)
    const highKh = diagnoseWaterSensoryImpact(80, 90);
    expect(highKh.problemPl).toContain('Płaski napar');
    expect(highKh.causePl).toContain('neutralizuje');

    // 2. Za niski bufor (KH < 20)
    const lowKh = diagnoseWaterSensoryImpact(80, 10);
    expect(lowKh.problemPl).toContain('Agresywny');
    expect(lowKh.recommendationPl).toContain('NaHCO3');

    // 3. Za mała twardość ogólna (GH < 35)
    const lowGh = diagnoseWaterSensoryImpact(20, 30);
    expect(lowGh.problemPl).toContain('Cienkie body');
    expect(lowGh.causePl).toContain('Niedobór kationów');

    // 4. Za wysoka twardość ogólna (GH > 150)
    const highGh = diagnoseWaterSensoryImpact(180, 40);
    expect(highGh.problemPl).toContain('sucha gorycz');

    // 5. Złote okno (optymalna woda)
    const optimal = diagnoseWaterSensoryImpact(80, 40);
    expect(optimal.problemPl).toContain('Optymalny profil wody');
  });
  test('TASK-P6-07-JAK: Odporność na wartości NaN i Infinity w kalkulatorze i diagnostyku chemii wody', () => {
    // calculateWaterMinerals fallback na bezpieczne wartości domyślne
    const nanRes = calculateWaterMinerals(NaN, NaN, NaN);
    expect(nanRes.waterVolumeLiters).toBe(1.0);
    expect(nanRes.concentrateBufferGrams).toBe(0);
    expect(nanRes.concentrateHardnessGrams).toBe(0);

    const infRes = calculateWaterMinerals(Infinity, -50, Infinity);
    expect(infRes.waterVolumeLiters).toBe(1.0);
    expect(infRes.concentrateHardnessGrams).toBe(0);
    expect(infRes.concentrateBufferGrams).toBe(0);

    // diagnoseWaterSensoryImpact nie zwraca fałszywego Golden Zone dla NaN/Infinity
    const nanDiag = diagnoseWaterSensoryImpact(NaN, NaN);
    expect(nanDiag.problemPl).toContain('Nieprawidłowe dane');
    expect(nanDiag.problemEn).toContain('Invalid input');

    const infDiag = diagnoseWaterSensoryImpact(Infinity, 40);
    expect(infDiag.problemPl).toContain('Nieprawidłowe dane');

    // ppmCaCO3ToDegreesDH zwraca 0 dla wartości ujemnych, NaN i Infinity
    expect(ppmCaCO3ToDegreesDH(NaN)).toBe(0);
    expect(ppmCaCO3ToDegreesDH(-10)).toBe(0);
    expect(ppmCaCO3ToDegreesDH(Infinity)).toBe(0);
    expect(ppmCaCO3ToDegreesDH(17.848)).toBe(1);
  });

  test('TASK-P10-08-PRO: degreesDHToPpmCaCO3 konwertuje stopnie dH na ppm CaCO3 z zachowaniem odporności na NaN', () => {
    expect(degreesDHToPpmCaCO3(1)).toBe(17.85);
    expect(degreesDHToPpmCaCO3(10)).toBe(178.48);
    expect(degreesDHToPpmCaCO3(0)).toBe(0);
    expect(degreesDHToPpmCaCO3(-5)).toBe(0);
    expect(degreesDHToPpmCaCO3(NaN)).toBe(0);
    expect(degreesDHToPpmCaCO3(Infinity)).toBe(0);

    // Spójność dwustronna: 10 dH -> ppm -> dH powraca do 10 dH
    const ppm = degreesDHToPpmCaCO3(10);
    const dHBack = Math.round(ppmCaCO3ToDegreesDH(ppm));
    expect(dHBack).toBe(10);
  });

  test('TASK-P11-08-PRO: diagnoseWaterSensoryImpact odrzuca ujemne GH/KH, a helpery findWaterRecipeById i findBottledWaterById wyszukują profile', () => {
    const negGh = diagnoseWaterSensoryImpact(-10, 40);
    expect(negGh.problemPl).toContain('Nieprawidłowe dane');

    const negKh = diagnoseWaterSensoryImpact(80, -20);
    expect(negKh.problemPl).toContain('Nieprawidłowe dane');

    expect(findWaterRecipeById('sca_standard')?.id).toBe('sca_standard');
    expect(findWaterRecipeById('non-existent')).toBeUndefined();

    expect(findBottledWaterById('volvic')?.id).toBe('volvic');
    expect(findBottledWaterById('non-existent')).toBeUndefined();
  });

  test('TASK-P13-08-PRO: getWaterProfileName wspiera wody butelkowane, receptury specialty i bezpiecznie obsługuje pusty/nullish id', () => {
    expect(getWaterProfileName('sca_standard', 'pl')).toBe('Standard SCA (Specialty Coffee)');
    expect(getWaterProfileName('sca_standard', 'en')).toBe('SCA Standard Water');

    expect(getWaterProfileName('volvic', 'pl')).toBe('Volvic');
    expect(getWaterProfileName('zywiec_zdroj', 'pl')).toContain('Żywiec Zdrój');

    expect(getWaterProfileName('', 'pl')).toBe('');
    expect(getWaterProfileName(null as any, 'pl')).toBe('');
    expect(getWaterProfileName(undefined as any, 'pl')).toBe('');
  });

  test('TASK-P15-08-PRO: getWaterProfileName domyślnie używa języka polskiego, a findWaterRecipeById/findBottledWaterById sanityzują id', () => {
    // Domyślny język 'pl'
    expect(getWaterProfileName('sca_standard')).toBe('Standard SCA (Specialty Coffee)');

    // Sanityzacja whitespace i nullish w helperach wyszukiwania
    expect(findWaterRecipeById('  sca_standard  ')?.id).toBe('sca_standard');
    expect(findWaterRecipeById('')).toBeUndefined();
    expect(findWaterRecipeById('   ')).toBeUndefined();
    expect(findWaterRecipeById(null as any)).toBeUndefined();

    expect(findBottledWaterById('  volvic  ')?.id).toBe('volvic');
    expect(findBottledWaterById('')).toBeUndefined();
    expect(findBottledWaterById('   ')).toBeUndefined();
    expect(findBottledWaterById(null as any)).toBeUndefined();
  });

  test('TASK-P19-07-JAK: baseWaterGrams jest nieujemne przy skrajnych dawkach soli, a findById jest case-insensitive', () => {
    // Ekstremalnie wysokie dawki soli nie powodują ujemnej masy wody bazowej
    const res = calculateWaterMinerals(1.0, 5000, 5000);
    expect(res.baseWaterGrams).toBeGreaterThanOrEqual(0);

    // Case-insensitivity w findWaterRecipeById i findBottledWaterById
    expect(findWaterRecipeById('SCA_STANDARD')?.id).toBe('sca_standard');
    expect(findWaterRecipeById('  Scott_Rao_Wonder  ')?.id).toBe('scott_rao_wonder');
    expect(findBottledWaterById('VOLVIC')?.id).toBe('volvic');
    expect(findBottledWaterById('  Zywiec_Zdroj  ')?.id).toBe('zywiec_zdroj');
  });

  test('TASK-P20-07-JAK: ppmCaCO3ToDegreesDH i degreesDHToPpmCaCO3 gwarantują ściśle 0 dla wejść <= 0 i -0', () => {
    expect(ppmCaCO3ToDegreesDH(-0)).toBe(0);
    expect(ppmCaCO3ToDegreesDH(0)).toBe(0);
    expect(ppmCaCO3ToDegreesDH(-100)).toBe(0);

    expect(degreesDHToPpmCaCO3(-0)).toBe(0);
    expect(degreesDHToPpmCaCO3(0)).toBe(0);
    expect(degreesDHToPpmCaCO3(-100)).toBe(0);
  });
  test('TASK-P21-07-JAK: diagnoseWaterSensoryImpact diagnozuje skrajne zasolenie i mineralizację (GH > 1000 lub KH > 1000)', () => {
    const extremeGh = diagnoseWaterSensoryImpact(1500, 40);
    expect(extremeGh.problemPl).toContain('skrajne zasolenie');
    expect(extremeGh.problemEn).toContain('extreme salinity');

    const extremeKh = diagnoseWaterSensoryImpact(80, 1200);
    expect(extremeKh.problemPl).toContain('skrajne zasolenie');
    expect(extremeKh.causePl).toContain('> 1000 ppm CaCO3');
  });
  test('TASK-P22-07-JAK: calculateWaterMinerals clampuje objętość do 1000L oraz twardość do 5000 ppm', () => {
    const hugeVol = calculateWaterMinerals(100000, 100, 50);
    expect(hugeVol.waterVolumeLiters).toBe(1000);

    const hugeMinerals = calculateWaterMinerals(1.0, 99999, 99999);
    expect(hugeMinerals.targetGhPpm).toBe(5000);
    expect(hugeMinerals.targetKhPpm).toBe(5000);
  });
  test('TASK-P23-07-JAK: calculateWaterMinerals gwarantuje ściśle 0 dla baseWaterGrams przy skrajnych dawkach soli (ochrona przed -0)', () => {
    const extreme = calculateWaterMinerals(0.1, 5000, 5000);
    expect(extreme.baseWaterGrams).toBe(0);
    expect(Object.is(extreme.baseWaterGrams, -0)).toBe(false);
  });
  test('TASK-P24-07-JAK: ppmCaCO3ToDegreesDH i degreesDHToPpmCaCO3 clampują skrajne wartości wejściowe', () => {
    expect(ppmCaCO3ToDegreesDH(999999)).toBe(ppmCaCO3ToDegreesDH(10000));
    expect(degreesDHToPpmCaCO3(999999)).toBe(degreesDHToPpmCaCO3(500));
  });

  test('TASK-P25-07-JAK: calculateWaterMinerals parsuje parametry przekazane jako string oraz chroni przed -0', () => {
    const fromStrings = calculateWaterMinerals('2.5' as any, '80' as any, '40' as any);
    expect(fromStrings.waterVolumeLiters).toBe(2.5);
    expect(fromStrings.targetGhPpm).toBe(80);
    expect(fromStrings.targetKhPpm).toBe(40);

    const negZero = calculateWaterMinerals(1.0, -0, -0);
    expect(Object.is(negZero.targetGhPpm, -0)).toBe(false);
    expect(Object.is(negZero.targetKhPpm, -0)).toBe(false);
    expect(negZero.targetGhPpm).toBe(0);
    expect(negZero.targetKhPpm).toBe(0);
  });

  test('TASK-P26-07-JAK: diagnoseWaterSensoryImpact parsuje wejścia stringowe i chroni przed -0', () => {
    const fromStrings = diagnoseWaterSensoryImpact('60' as any, '30' as any);
    expect(fromStrings.problemPl).toContain('Golden Zone');

    const negZero = diagnoseWaterSensoryImpact(-0, -0);
    expect(negZero.problemPl).toContain('Agresywny');
  });

  test('TASK-P27-07-JAK: calculateWaterMinerals chroni concentrateBufferGrams i concentrateHardnessGrams przed -0', () => {
    const res = calculateWaterMinerals(1, -0, -0);
    expect(res.concentrateBufferGrams).toBe(0);
    expect(res.concentrateHardnessGrams).toBe(0);
    expect(res.dryBakingSodaNaHCO3Grams).toBe(0);
    expect(res.dryEpsomSaltMgSO4Grams).toBe(0);
    expect(res.dryCalciumChlorideCaCl2Grams).toBe(0);
    expect(Object.is(res.concentrateBufferGrams, -0)).toBe(false);
    expect(Object.is(res.concentrateHardnessGrams, -0)).toBe(false);
    expect(Object.is(res.dryBakingSodaNaHCO3Grams, -0)).toBe(false);
    expect(Object.is(res.dryEpsomSaltMgSO4Grams, -0)).toBe(false);
    expect(Object.is(res.dryCalciumChlorideCaCl2Grams, -0)).toBe(false);
  });

  test('TASK-P28-07-JAK: ppmCaCO3ToDegreesDH i degreesDHToPpmCaCO3 parsują stringi i chronią przed -0', () => {
    const dhFromString = ppmCaCO3ToDegreesDH('60' as any);
    expect(dhFromString).toBeCloseTo(3.3617, 3);

    const ppmFromString = degreesDHToPpmCaCO3('3.5' as any);
    expect(ppmFromString).toBeCloseTo(62.47, 1);

    const dhNegZero = ppmCaCO3ToDegreesDH(-0);
    expect(dhNegZero).toBe(0);
    expect(Object.is(dhNegZero, -0)).toBe(false);

    const ppmNegZero = degreesDHToPpmCaCO3(-0);
    expect(ppmNegZero).toBe(0);
    expect(Object.is(ppmNegZero, -0)).toBe(false);
  });

  test('TASK-P29-07-JAK: getWaterProfileName wyszukuje profile i wody butelkowane bez wzgledu na wielkosc liter', () => {
    // Profil standardowy SCA
    expect(getWaterProfileName('SCA_STANDARD', 'pl')).toBe('Standard SCA (Specialty Coffee)');
    expect(getWaterProfileName('  sca_standard  ', 'pl')).toBe('Standard SCA (Specialty Coffee)');
    expect(getWaterProfileName('sca_standard', 'en')).toBe('SCA Standard Water');

    // Woda butelkowana (np. Żywiec Zdrój / Volvic)
    expect(getWaterProfileName('VOLVIC')).toBe('Volvic');
    expect(getWaterProfileName('volvic')).toBe('Volvic');

    // Nieznane id zwraca wyczyszczony identyfikator
    expect(getWaterProfileName('  my_custom_water  ')).toBe('my_custom_water');
    expect(getWaterProfileName('')).toBe('');
  });

  test('TASK-P30-07-JAK: calculateWaterMinerals chroni przed ujemnymi targetGh i targetKh oraz NaN', () => {
    const resNegative = calculateWaterMinerals(1, -50, -20);
    expect(resNegative.targetGhPpm).toBe(0);
    expect(resNegative.targetKhPpm).toBe(0);
    expect(resNegative.concentrateBufferGrams).toBe(0);
    expect(resNegative.concentrateHardnessGrams).toBe(0);
    expect(resNegative.dryBakingSodaNaHCO3Grams).toBe(0);
    expect(resNegative.dryEpsomSaltMgSO4Grams).toBe(0);
    expect(resNegative.dryCalciumChlorideCaCl2Grams).toBe(0);
    expect(resNegative.baseWaterGrams).toBe(1000);

    const resNaN = calculateWaterMinerals(NaN, NaN, NaN);
    expect(resNaN.waterVolumeLiters).toBe(1.0);
    expect(resNaN.targetGhPpm).toBe(0);
    expect(resNaN.targetKhPpm).toBe(0);
    expect(resNaN.baseWaterGrams).toBe(1000);
  });

  test('TASK-P31-07-JAK: findBottledWaterById oraz findWaterRecipeById wspieraja wyszukiwanie po nazwie marki i zlokalizowanych nazwach', () => {
    // Woda butelkowana po brandName
    const zywiecByName = findBottledWaterById('Żywiec Zdrój (Niegazowany)');
    expect(zywiecByName).toBeDefined();
    expect(zywiecByName?.id).toBe('zywiec_zdroj');

    const volvicByBrand = findBottledWaterById('Volvic');
    expect(volvicByBrand).toBeDefined();
    expect(volvicByBrand?.id).toBe('volvic');

    // Receptura po namePl
    const scaByPl = findWaterRecipeById('Standard SCA (Specialty Coffee)');
    expect(scaByPl).toBeDefined();
    expect(scaByPl?.id).toBe('sca_standard');

    // Receptura po nameEn
    const scaByEn = findWaterRecipeById('SCA Standard Water');
    expect(scaByEn).toBeDefined();
    expect(scaByEn?.id).toBe('sca_standard');

    expect(findBottledWaterById('   ')).toBeUndefined();
    expect(findWaterRecipeById('   ')).toBeUndefined();
  });

  test('TASK-P32-07-JAK: getWaterProfileName rozwiazuje profile zarowno po ID jak i po zlokalizowanej nazwie lub marce', () => {
    // Po marce w butelce
    expect(getWaterProfileName('Żywiec Zdrój (Niegazowany)')).toBe('Żywiec Zdrój (Niegazowany)');
    expect(getWaterProfileName('zywiec_zdroj')).toBe('Żywiec Zdrój (Niegazowany)');

    // Po nazwie receptury w języku EN
    expect(getWaterProfileName('Standard SCA (Specialty Coffee)', 'en')).toBe('SCA Standard Water');
    expect(getWaterProfileName('sca_standard', 'pl')).toBe('Standard SCA (Specialty Coffee)');
    expect(getWaterProfileName('  ')).toBe('');
  });

  test('TASK-P33-07-JAK: diagnoseWaterSensoryImpact, ppmCaCO3ToDegreesDH i degreesDHToPpmCaCO3 odrzucają typy boolean', () => {
    const boolDiag = diagnoseWaterSensoryImpact(true as any, false as any);
    expect(boolDiag.problemPl).toContain('Nieprawidłowe dane wejściowe');
    expect(boolDiag.causePl).toContain('boolean');

    expect(ppmCaCO3ToDegreesDH(true as any)).toBe(0);
    expect(ppmCaCO3ToDegreesDH(false as any)).toBe(0);
    expect(degreesDHToPpmCaCO3(true as any)).toBe(0);
    expect(degreesDHToPpmCaCO3(false as any)).toBe(0);
  });

  test('TASK-P34-07-JAK: calculateWaterMinerals odrzuca koercję typów boolean dla objętości, GH oraz KH', () => {
    // waterVolumeLiters jako boolean
    const resVolBool = calculateWaterMinerals(true as any, 80, 40);
    expect(resVolBool.waterVolumeLiters).toBe(1.0);

    // targetGh jako boolean
    const resGhBool = calculateWaterMinerals(1.0, true as any, 40);
    expect(resGhBool.targetGhPpm).toBe(0);
    expect(resGhBool.concentrateHardnessGrams).toBe(0);

    // targetKh jako boolean
    const resKhBool = calculateWaterMinerals(1.0, 80, false as any);
    expect(resKhBool.targetKhPpm).toBe(0);
    expect(resKhBool.concentrateBufferGrams).toBe(0);
  });

  test('TASK-P35-07-JAK: ppmCaCO3ToDegreesDH i degreesDHToPpmCaCO3 ściśle chronią przed -0 oraz stringami -0', () => {
    expect(Object.is(ppmCaCO3ToDegreesDH(-0), -0)).toBe(false);
    expect(Object.is(ppmCaCO3ToDegreesDH('-0' as any), -0)).toBe(false);
    expect(ppmCaCO3ToDegreesDH(-0)).toBe(0);
    expect(ppmCaCO3ToDegreesDH('-0' as any)).toBe(0);

    expect(Object.is(degreesDHToPpmCaCO3(-0), -0)).toBe(false);
    expect(Object.is(degreesDHToPpmCaCO3('-0' as any), -0)).toBe(false);
    expect(degreesDHToPpmCaCO3(-0)).toBe(0);
    expect(degreesDHToPpmCaCO3('-0' as any)).toBe(0);
  });

  test('TASK-P36-07-JAK: diagnoseWaterSensoryImpact ściśle odrzuca null i undefined', () => {
    const resNullGh = diagnoseWaterSensoryImpact(null as any, 40);
    expect(resNullGh.problemPl).toContain('Nieprawidłowe dane wejściowe');
    expect(resNullGh.causePl).toContain('nie mogą być puste');

    const resUndefKh = diagnoseWaterSensoryImpact(80, undefined as any);
    expect(resUndefKh.problemPl).toContain('Nieprawidłowe dane wejściowe');
    expect(resUndefKh.causePl).toContain('nie mogą być puste');
  });

  test('TASK-P37-07-JAK: calculateWaterMinerals, ppmCaCO3ToDegreesDH i degreesDHToPpmCaCO3 bezpiecznie odrzucają null i undefined', () => {
    // ppmCaCO3ToDegreesDH & degreesDHToPpmCaCO3
    expect(ppmCaCO3ToDegreesDH(null as any)).toBe(0);
    expect(ppmCaCO3ToDegreesDH(undefined as any)).toBe(0);
    expect(degreesDHToPpmCaCO3(null as any)).toBe(0);
    expect(degreesDHToPpmCaCO3(undefined as any)).toBe(0);

    // calculateWaterMinerals
    const resFromNulls = calculateWaterMinerals(null as any, null as any, null as any);
    expect(resFromNulls.waterVolumeLiters).toBe(1.0);
    expect(resFromNulls.targetGhPpm).toBe(0);
    expect(resFromNulls.targetKhPpm).toBe(0);
    expect(resFromNulls.concentrateBufferGrams).toBe(0);
    expect(resFromNulls.concentrateHardnessGrams).toBe(0);

    const resFromUndef = calculateWaterMinerals(undefined as any, undefined as any, undefined as any);
    expect(resFromUndef.waterVolumeLiters).toBe(1.0);
    expect(resFromUndef.targetGhPpm).toBe(0);
    expect(resFromUndef.targetKhPpm).toBe(0);
  });

  test('TASK-P38-07-JAK: findBottledWaterById i findWaterRecipeById defensywnie odrzucaja boolean, liczby i obiekty', () => {
    expect(findBottledWaterById(true as any)).toBeUndefined();
    expect(findBottledWaterById(false as any)).toBeUndefined();
    expect(findBottledWaterById(123 as any)).toBeUndefined();
    expect(findBottledWaterById({} as any)).toBeUndefined();

    expect(findWaterRecipeById(true as any)).toBeUndefined();
    expect(findWaterRecipeById(false as any)).toBeUndefined();
    expect(findWaterRecipeById(456 as any)).toBeUndefined();
    expect(findWaterRecipeById([] as any)).toBeUndefined();
  });

  test('TASK-P39-07-JAK: getWaterProfileName sanityzuje wielkość liter parametru language i spacje', () => {
    expect(getWaterProfileName('sca_standard', '  EN  ')).toBe('SCA Standard Water');
    expect(getWaterProfileName('sca_standard', '  PL  ')).toBe('Standard SCA (Specialty Coffee)');
    expect(getWaterProfileName('sca_standard', null as any)).toBe('Standard SCA (Specialty Coffee)');
    expect(getWaterProfileName(null as any, 'en')).toBe('');
  });

  test('TASK-P40-07-JAK: ppmCaCO3ToDegreesDH i degreesDHToPpmCaCO3 rygorystycznie odrzucaja obiekty, tablice i symbole', () => {
    expect(ppmCaCO3ToDegreesDH({} as any)).toBe(0);
    expect(ppmCaCO3ToDegreesDH([] as any)).toBe(0);
    expect(ppmCaCO3ToDegreesDH(Symbol('sym') as any)).toBe(0);
    expect(ppmCaCO3ToDegreesDH('  17.848  ' as any)).toBe(1);

    expect(degreesDHToPpmCaCO3({} as any)).toBe(0);
    expect(degreesDHToPpmCaCO3([] as any)).toBe(0);
    expect(degreesDHToPpmCaCO3(Symbol('sym') as any)).toBe(0);
    expect(degreesDHToPpmCaCO3('  1  ' as any)).toBe(17.85);
  });

  test('TASK-P41-07-JAK: calculateWaterMinerals odrzuca obiekty, tablice, symbole i chroni waterVolumeLiters przed -0', () => {
    const resFromNegZero = calculateWaterMinerals(-0, 80, 40);
    expect(resFromNegZero.waterVolumeLiters).toBe(1.0);
    expect(Object.is(resFromNegZero.waterVolumeLiters, -0)).toBe(false);

    const resFromStringNegZero = calculateWaterMinerals('-0' as any, 80, 40);
    expect(resFromStringNegZero.waterVolumeLiters).toBe(1.0);
    expect(Object.is(resFromStringNegZero.waterVolumeLiters, -0)).toBe(false);

    const resFromObj = calculateWaterMinerals({} as any, 80, 40);
    expect(resFromObj.waterVolumeLiters).toBe(1.0);

    const resFromArray = calculateWaterMinerals([] as any, 80, 40);
    expect(resFromArray.waterVolumeLiters).toBe(1.0);
  });

  test('TASK-P42-07-JAK: diagnoseWaterSensoryImpact odrzuca obiekty, tablice, symbole i obsluguje stringi z whitespace', () => {
    const resFromObj = diagnoseWaterSensoryImpact({} as any, 50);
    expect(resFromObj.problemPl).toBe('Nieprawidłowe dane wejściowe parametrów wody.');

    const resFromArray = diagnoseWaterSensoryImpact(60, [] as any);
    expect(resFromArray.problemPl).toBe('Nieprawidłowe dane wejściowe parametrów wody.');

    const resFromSymbol = diagnoseWaterSensoryImpact(Symbol('s') as any, 50);
    expect(resFromSymbol.problemPl).toBe('Nieprawidłowe dane wejściowe parametrów wody.');

    const resFromString = diagnoseWaterSensoryImpact('  60  ', '  30  ');
    expect(resFromString.problemPl).toContain('Golden Zone');
  });
});


// ============================================================================
// Napar (Steepwise) — Unit Tests: Water Chemistry & Mineralization
// ============================================================================

import {
  WATER_RECIPES,
  BOTTLED_WATER_BENCHMARKS,
  calculateWaterMinerals,
  calculateBufferAddition,
  calculateCationHardnessBreakdown,
  diagnoseWaterSensoryImpact,
  getWaterProfileName,
  ppmCaCO3ToDegreesDH,
  degreesDHToPpmCaCO3,
  ppmCaCO3ToDegreesClark,
  degreesClarkToPpmCaCO3,
  classifyWaterHardnessFromClark,
  classifyWaterHardnessFromFH,
  findWaterRecipeById,
  findBottledWaterById,
  getBottledWatersBySuitability,
  searchBottledWaters,
  searchWaterRecipes,
  evaluateWaterSuitability,
  WaterSuitabilityEvaluation,
  calculateWaterBlend,
  WaterBlendParams,
  WaterBlendResult,
  calculateHardnessRatio,
  HardnessRatioAnalysis,
  calculateWaterDilution,
  WaterDilutionResult,
  estimateWaterTdsFromHardness,
  WaterTdsEstimate,
  evaluateWaterAlkalinity,
  AlkalinityEvaluation,
  AlkalinityCategory,
  calculateMagnesiumCalciumRatio,
  MineralCationRatioAnalysis,
  CationRatioCategory,
  calculateResidualAlkalinity,
  ResidualAlkalinityAnalysis,
  ResidualAlkalinityCategory,
  formatWaterHardnessCategory,
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

  test('TASK-P43-07-JAK: getWaterProfileName wspiera warianty jezykowe en-US i chroni przed nie-stringami', () => {
    // Wsparcie en-US, en-GB, EN
    expect(getWaterProfileName('tea_delicate', 'en-US')).toBe('Artisan Tea Water (Green / White)');
    expect(getWaterProfileName('tea_delicate', 'en-GB')).toBe('Artisan Tea Water (Green / White)');
    expect(getWaterProfileName('tea_delicate', 'EN' as any)).toBe('Artisan Tea Water (Green / White)');
    expect(getWaterProfileName('tea_delicate', 'pl')).toBe('Herbata Szlachetna (Zielona / Biała)');

    // Ochrona przed nie-stringami
    expect(getWaterProfileName(null as any)).toBe('');
    expect(getWaterProfileName(undefined as any)).toBe('');
    expect(getWaterProfileName(123 as any)).toBe('');
    expect(getWaterProfileName({} as any)).toBe('');
    expect(getWaterProfileName([] as any)).toBe('');
  });

  test('TASK-P44-07-JAK: findWaterRecipeById oraz findBottledWaterById normalizuja myslniki i podkreslenia (kebab-case vs snake_case)', () => {
    expect(findWaterRecipeById('sca-standard')?.id).toBe('sca_standard');
    expect(findWaterRecipeById('melbourne-soft')?.id).toBe('melbourne_soft');
    expect(findWaterRecipeById('barista-hustle-80-40')?.id).toBe('barista_hustle_80_40');
    expect(findWaterRecipeById('scott-rao-wonder')?.id).toBe('scott_rao_wonder');
    expect(findWaterRecipeById('tea-delicate')?.id).toBe('tea_delicate');
    expect(findWaterRecipeById('tea-gongfu-rock-puerh')?.id).toBe('tea_gongfu_rock_puerh');
    expect(findBottledWaterById('zywiecki-krysztal')?.id).toBe('zywiecki_krysztal');
    expect(findBottledWaterById('zywiec-zdroj')?.id).toBe('zywiec_zdroj');
  });

  test('TASK-P45-07-JAK: calculateWaterMinerals, diagnoseWaterSensoryImpact, ppmCaCO3ToDegreesDH i degreesDHToPpmCaCO3 parsuja stringi z przecinkami dziesietnymi', () => {
    // ppmCaCO3ToDegreesDH z przecinkiem dziesietnym
    const dh1 = ppmCaCO3ToDegreesDH('35,696');
    expect(dh1).toBeCloseTo(2.0, 3);

    // degreesDHToPpmCaCO3 z przecinkiem dziesietnym
    const ppm1 = degreesDHToPpmCaCO3('2,5');
    expect(ppm1).toBeCloseTo(44.62, 1);

    // calculateWaterMinerals z objętością i twardościami z przecinkiem
    const res = calculateWaterMinerals('2,5', '80,5', '40,2');
    expect(res.waterVolumeLiters).toBe(2.5);
    expect(res.targetGhPpm).toBe(80.5);
    expect(res.targetKhPpm).toBe(40.2);

    // diagnoseWaterSensoryImpact z przecinkiem
    const diag = diagnoseWaterSensoryImpact('60,5', '30,5');
    expect(diag.problemPl).toContain('Golden Zone');
  });

  test('TASK-P46-07-JAK: findBottledWaterById dopasowuje popularne aliasy wód (zywiec, muszyna, cechini, zywiecki)', () => {
    expect(findBottledWaterById('zywiec')?.id).toBe('zywiec_zdroj');
    expect(findBottledWaterById('zywiec-zdroj-niegazowany')?.id).toBe('zywiec_zdroj');
    expect(findBottledWaterById('zywiecki')?.id).toBe('zywiecki_krysztal');
    expect(findBottledWaterById('muszyna')?.id).toBe('muszynianka');
    expect(findBottledWaterById('cechini')?.id).toBe('muszynianka');
  });

  test('TASK-P47-07-JAK: findBottledWaterById wspiera benchmarki spa_reine oraz evian wraz z aliasami', () => {
    expect(findBottledWaterById('spa_reine')?.brandName).toBe('Spa Reine');
    expect(findBottledWaterById('spa')?.id).toBe('spa_reine');
    expect(findBottledWaterById('spareine')?.id).toBe('spa_reine');
    expect(findBottledWaterById('spa-reine')?.id).toBe('spa_reine');

    expect(findBottledWaterById('evian')?.brandName).toBe('Evian');
    expect(findBottledWaterById('Evian')?.id).toBe('evian');
  });

  test('TASK-P48-07-JAK: findBottledWaterById wspiera benchmarki ashbeck oraz highland_spring wraz z aliasami i getWaterProfileName', () => {
    expect(findBottledWaterById('ashbeck')?.brandName).toBe('Ashbeck');
    expect(findBottledWaterById('tesco ashbeck')?.id).toBe('ashbeck');
    expect(findBottledWaterById('tesco-ashbeck')?.id).toBe('ashbeck');
    expect(findBottledWaterById('highland_spring')?.brandName).toBe('Highland Spring');
    expect(findBottledWaterById('highland spring')?.id).toBe('highland_spring');
    expect(findBottledWaterById('highland-spring')?.id).toBe('highland_spring');
    expect(findBottledWaterById('highland')?.id).toBe('highland_spring');

    expect(getWaterProfileName('ashbeck')).toBe('Ashbeck');
    expect(getWaterProfileName('highland_spring')).toBe('Highland Spring');
  });

  test('TASK-P49-07-JAK: calculateBufferAddition wylicza zapotrzebowanie na bufor i chroni przed dzieleniem przez zero oraz wartosciami ujemnymi', () => {
    // 1. Zwykłe wyliczenie: 5L wody, currentKh 10 ppm, targetKh 40 ppm -> deficyt 30 ppm
    // BH concentrate: (30 / 2) * 5 = 75g
    // NaHCO3: 30 * 0.00168 * 5 = 0.252g
    const res = calculateBufferAddition(5.0, 10, 40);
    expect(res.khDeficitPpm).toBe(30);
    expect(res.bufferConcentrateGrams).toBe(75.0);
    expect(res.dryBakingSodaGrams).toBe(0.252);

    // 2. Brak deficytu: currentKh >= targetKh -> 0g
    const noDeficit = calculateBufferAddition(1.0, 50, 40);
    expect(noDeficit.khDeficitPpm).toBe(0);
    expect(noDeficit.bufferConcentrateGrams).toBe(0);
    expect(noDeficit.dryBakingSodaGrams).toBe(0);

    // 3. Stringi z przecinkami i niepoprawne dane
    const commaRes = calculateBufferAddition('2,5', '15,5', '45,5');
    expect(commaRes.khDeficitPpm).toBe(30);
    expect(commaRes.bufferConcentrateGrams).toBe(37.5);

    // 4. Odporność na NaN, ujemne i -0
    const edgeRes = calculateBufferAddition(-5, 'invalid', -10);
    expect(edgeRes.khDeficitPpm).toBe(0);
    expect(edgeRes.bufferConcentrateGrams).toBe(0);
    expect(edgeRes.dryBakingSodaGrams).toBe(0);
  });

  test('TASK-P50-07-JAK: classifyWaterHardness klasyfikuje twardosc wody oraz findWaterRecipeById wspiera popularne aliasy receptur', () => {
    // 1. findWaterRecipeById z aliasami (rao, bh, sca, melbourne, hendon)
    expect(findWaterRecipeById('rao')?.id).toBe('scott_rao_wonder');
    expect(findWaterRecipeById('scott rao')?.id).toBe('scott_rao_wonder');
    expect(findWaterRecipeById('bh')?.id).toBe('barista_hustle_80_40');
    expect(findWaterRecipeById('sca')?.id).toBe('sca_standard');
    expect(findWaterRecipeById('melbourne')?.id).toBe('melbourne_soft');
    expect(findWaterRecipeById('hendon')?.id).toBe('hendon_medium_dark');
    expect(findWaterRecipeById('puerh')?.id).toBe('tea_gongfu_rock_puerh');

    expect(getWaterProfileName('rao')).toBe('Scott Rao Wonder Water');
    expect(getWaterProfileName('sca', 'pl')).toBe('Standard SCA (Specialty Coffee)');
    expect(getWaterProfileName('bh', 'en')).toBe('Barista Hustle 80/40');

    // 2. classifyWaterHardness
    // @ts-ignore
    const { classifyWaterHardness } = require('../water-chemistry');
    const sampleCategory: import('../water-chemistry').WaterHardnessCategory = classifyWaterHardness(30);
    expect(sampleCategory).toBe('VERY_SOFT');
    expect(classifyWaterHardness('45,5')).toBe('VERY_SOFT');
    expect(classifyWaterHardness(80)).toBe('SOFT');
    expect(classifyWaterHardness(140)).toBe('MODERATELY_HARD');
    expect(classifyWaterHardness(220)).toBe('HARD');
    expect(classifyWaterHardness(450)).toBe('VERY_HARD');
    expect(classifyWaterHardness(-10)).toBe('SOFT');
    expect(classifyWaterHardness(NaN)).toBe('SOFT');
    expect(classifyWaterHardness(null)).toBe('SOFT');
  });

  test('TASK-P51-07-JAK: formatWaterHardnessCategory lokalizuje kategorie twardosci oraz findBottledWaterById wspiera nowe warianty', () => {
    // 1. formatWaterHardnessCategory PL i EN
    expect(formatWaterHardnessCategory('VERY_SOFT', 'pl')).toBe('Bardzo miękka');
    expect(formatWaterHardnessCategory('VERY_SOFT', 'en')).toBe('Very Soft');
    expect(formatWaterHardnessCategory('SOFT', 'pl')).toBe('Miękka');
    expect(formatWaterHardnessCategory('SOFT', 'en')).toBe('Soft');
    expect(formatWaterHardnessCategory('MODERATELY_HARD', 'pl')).toBe('Średnio twarda');
    expect(formatWaterHardnessCategory('MODERATELY_HARD', 'en')).toBe('Moderately Hard');
    expect(formatWaterHardnessCategory('HARD', 'pl')).toBe('Twarda');
    expect(formatWaterHardnessCategory('HARD', 'en')).toBe('Hard');
    expect(formatWaterHardnessCategory('VERY_HARD', 'pl')).toBe('Bardzo twarda');
    expect(formatWaterHardnessCategory('VERY_HARD', 'en')).toBe('Very Hard');
    expect(formatWaterHardnessCategory('unknown', 'en')).toBe('Unknown');
    expect(formatWaterHardnessCategory('', 'pl')).toBe('Nieznana');

    // 2. findBottledWaterById z aliasami i spacjami
    expect(findBottledWaterById('zywiec zdrój')?.id).toBe('zywiec_zdroj');
    expect(findBottledWaterById('cechini muszyna')?.id).toBe('muszynianka');
    expect(findBottledWaterById('tesco')?.id).toBe('ashbeck');
  });

  test('TASK-P52-07-JAK: calculateCationHardnessBreakdown oblicza rozbicie twardosci Ca/Mg i chroni przed blednymi typami', () => {
    // 1. Prawidłowe obliczenia dla 10 mg/L Ca i 15 mg/L Mg
    const res = calculateCationHardnessBreakdown(10, 15);
    expect(res.calciumGhPpm).toBe(24.97);
    expect(res.magnesiumGhPpm).toBe(61.77);
    expect(res.totalGhPpm).toBe(86.74);
    expect(res.cationRatioMgToCa).toBe(1.5);
    expect(res.dominantCation).toBe('magnesium');

    // 2. Przecinki dziesiętne w stringach
    const commaRes = calculateCationHardnessBreakdown('20,5', '5,5');
    expect(commaRes.calciumIonPpm).toBe(20.5);
    expect(commaRes.magnesiumIonPpm).toBe(5.5);
    expect(commaRes.dominantCation).toBe('calcium');

    // 3. Odporność na null, obiekty, ujemne i -0
    const edgeRes = calculateCationHardnessBreakdown(null as any, -10);
    expect(edgeRes.calciumIonPpm).toBe(0);
    expect(edgeRes.magnesiumIonPpm).toBe(0);
    expect(edgeRes.totalGhPpm).toBe(0);
    expect(edgeRes.dominantCation).toBe('balanced');
  });

  test('TASK-P53-07-JAK: konwersja dH/fH/CaCO3 i klasyfikacja z ochrona przed -0 w classifyWaterHardness i classifyWaterHardnessFromDH', () => {
    // @ts-ignore
    const {
      classifyWaterHardness,
      classifyWaterHardnessFromDH,
      ppmCaCO3ToDegreesFH,
      degreesFHToPpmCaCO3,
    } = require('../water-chemistry');

    // 1. classifyWaterHardness z -0 i 0
    expect(classifyWaterHardness(0)).toBe('VERY_SOFT');
    expect(classifyWaterHardness(-0)).toBe('VERY_SOFT');
    expect(classifyWaterHardness('0')).toBe('VERY_SOFT');

    // 2. classifyWaterHardnessFromDH (bezpośrednia klasyfikacja ze stopni niemieckich dH)
    expect(classifyWaterHardnessFromDH(2)).toBe('VERY_SOFT'); // ~35.7 ppm
    expect(classifyWaterHardnessFromDH('4,5')).toBe('SOFT'); // ~80.3 ppm
    expect(classifyWaterHardnessFromDH(8)).toBe('MODERATELY_HARD'); // ~142.8 ppm
    expect(classifyWaterHardnessFromDH(12)).toBe('HARD'); // ~214.2 ppm
    expect(classifyWaterHardnessFromDH(22)).toBe('VERY_HARD'); // ~392.7 ppm
    expect(classifyWaterHardnessFromDH(-0)).toBe('VERY_SOFT');
    expect(classifyWaterHardnessFromDH(NaN)).toBe('SOFT');

    // 3. Konwersje ze stopni francuskich (°fH)
    expect(ppmCaCO3ToDegreesFH(100)).toBe(10);
    expect(ppmCaCO3ToDegreesFH('155,5')).toBe(15.55);
    expect(ppmCaCO3ToDegreesFH(-0)).toBe(0);
    expect(degreesFHToPpmCaCO3(12)).toBe(120);
    expect(degreesFHToPpmCaCO3('18,5')).toBe(185);
    expect(degreesFHToPpmCaCO3(-0)).toBe(0);
  });

  test('TASK-P55-07-JAK: ppmCaCO3ToDegreesClark, degreesClarkToPpmCaCO3 i classifyWaterHardnessFromClark obsługuja stopnie Clarka (°e)', () => {
    // 1. ppmCaCO3ToDegreesClark
    expect(ppmCaCO3ToDegreesClark(142.54)).toBe(10);
    expect(ppmCaCO3ToDegreesClark('142,54')).toBe(10);
    expect(ppmCaCO3ToDegreesClark(0)).toBe(0);
    expect(ppmCaCO3ToDegreesClark(-0)).toBe(0);
    expect(Object.is(ppmCaCO3ToDegreesClark(-0), -0)).toBe(false);
    expect(ppmCaCO3ToDegreesClark(-10)).toBe(0);
    expect(ppmCaCO3ToDegreesClark(NaN)).toBe(0);
    expect(ppmCaCO3ToDegreesClark(Infinity)).toBe(0);
    expect(ppmCaCO3ToDegreesClark(null as any)).toBe(0);
    expect(ppmCaCO3ToDegreesClark({} as any)).toBe(0);
    expect(ppmCaCO3ToDegreesClark(999999)).toBe(ppmCaCO3ToDegreesClark(10000));

    // 2. degreesClarkToPpmCaCO3
    expect(degreesClarkToPpmCaCO3(10)).toBe(142.54);
    expect(degreesClarkToPpmCaCO3('10,5')).toBe(149.67);
    expect(degreesClarkToPpmCaCO3(0)).toBe(0);
    expect(degreesClarkToPpmCaCO3(-0)).toBe(0);
    expect(Object.is(degreesClarkToPpmCaCO3(-0), -0)).toBe(false);
    expect(degreesClarkToPpmCaCO3(-5)).toBe(0);
    expect(degreesClarkToPpmCaCO3(NaN)).toBe(0);
    expect(degreesClarkToPpmCaCO3(Infinity)).toBe(0);
    expect(degreesClarkToPpmCaCO3(null as any)).toBe(0);
    expect(degreesClarkToPpmCaCO3([] as any)).toBe(0);
    expect(degreesClarkToPpmCaCO3(999999)).toBe(degreesClarkToPpmCaCO3(1000));

    // 3. Spójność dwustronna: 10 °e -> ppm -> °e powraca do 10 °e
    const ppm = degreesClarkToPpmCaCO3(10);
    const clarkBack = Math.round(ppmCaCO3ToDegreesClark(ppm));
    expect(clarkBack).toBe(10);

    // 4. classifyWaterHardnessFromClark
    expect(classifyWaterHardnessFromClark(0)).toBe('VERY_SOFT');
    expect(classifyWaterHardnessFromClark(-0)).toBe('VERY_SOFT');
    expect(classifyWaterHardnessFromClark('0')).toBe('VERY_SOFT');
    expect(classifyWaterHardnessFromClark(2)).toBe('VERY_SOFT'); // ~28.5 ppm
    expect(classifyWaterHardnessFromClark('5,0')).toBe('SOFT'); // ~71.3 ppm
    expect(classifyWaterHardnessFromClark(10)).toBe('MODERATELY_HARD'); // ~142.5 ppm
    expect(classifyWaterHardnessFromClark(15)).toBe('HARD'); // ~213.8 ppm
    expect(classifyWaterHardnessFromClark(25)).toBe('VERY_HARD'); // ~356.4 ppm
    expect(classifyWaterHardnessFromClark(NaN)).toBe('SOFT');
    expect(classifyWaterHardnessFromClark(-5)).toBe('SOFT');
  });

  test('TASK-P57-07-JAK: classifyWaterHardnessFromFH i nowe profile wod butelkowanych (Acqua Panna, Crystal Geyser)', () => {
    // 1. classifyWaterHardnessFromFH
    expect(classifyWaterHardnessFromFH(0)).toBe('VERY_SOFT');
    expect(classifyWaterHardnessFromFH(-0)).toBe('VERY_SOFT');
    expect(classifyWaterHardnessFromFH('0')).toBe('VERY_SOFT');
    expect(classifyWaterHardnessFromFH(3)).toBe('VERY_SOFT'); // 30 ppm
    expect(classifyWaterHardnessFromFH('8,0')).toBe('SOFT'); // 80 ppm
    expect(classifyWaterHardnessFromFH(12)).toBe('MODERATELY_HARD'); // 120 ppm
    expect(classifyWaterHardnessFromFH(20)).toBe('HARD'); // 200 ppm
    expect(classifyWaterHardnessFromFH(35)).toBe('VERY_HARD'); // 350 ppm
    expect(classifyWaterHardnessFromFH(NaN)).toBe('SOFT');
    expect(classifyWaterHardnessFromFH(-5)).toBe('SOFT');

    // 2. findBottledWaterById dla Acqua Panna i Crystal Geyser
    const panna = findBottledWaterById('acqua panna');
    expect(panna).toBeDefined();
    expect(panna?.id).toBe('aqua_panna');
    expect(panna?.suitability).toBe('EXCELLENT');
    expect(panna?.brandName).toContain('Panna');

    const geyser = findBottledWaterById('crystal geyser');
    expect(geyser).toBeDefined();
    expect(geyser?.id).toBe('crystal_geyser');
    expect(geyser?.suitability).toBe('EXCELLENT');
    expect(geyser?.originCountry).toBe('USA');
  });

  test('TASK-P62-07-JAK: getBottledWatersBySuitability i searchBottledWaters umozliwiaja selekcje i wyszukiwanie wod mineralnych', () => {
    // 1. getBottledWatersBySuitability
    const excellent = getBottledWatersBySuitability('EXCELLENT');
    expect(Array.isArray(excellent)).toBe(true);
    expect(excellent.length).toBeGreaterThanOrEqual(2);
    expect(excellent.every((w) => w.suitability === 'EXCELLENT')).toBe(true);

    const all = getBottledWatersBySuitability('ALL');
    expect(all.length).toBeGreaterThan(excellent.length);

    // 2. searchBottledWaters
    const zywiec = searchBottledWaters('Żywiec');
    expect(zywiec.length).toBeGreaterThanOrEqual(1);
    expect(zywiec[0].brandName).toContain('Żywiec');

    const empty = searchBottledWaters('');
    expect(empty.length).toBe(all.length);

    const nonExistent = searchBottledWaters('mars-spring-water');
    expect(nonExistent).toEqual([]);
  });

  test('TASK-P64-07-JAK: searchWaterRecipes umozliwia wyszukiwanie receptur remineralizacji wody specialty', () => {
    // 1. Wyszukiwanie po nazwie
    const bh = searchWaterRecipes('Barista Hustle');
    expect(bh.length).toBeGreaterThanOrEqual(1);
    expect(bh[0].id).toBe('barista_hustle_80_40');

    // 2. Wyszukiwanie po przeznaczeniu (bestFor)
    const cupping = searchWaterRecipes('cupping');
    expect(cupping.length).toBeGreaterThanOrEqual(1);

    // 3. Puste zapytanie i null/undefined
    const all = searchWaterRecipes('');
    expect(all.length).toBeGreaterThanOrEqual(5);
    expect(searchWaterRecipes(null as any).length).toBe(all.length);
    expect(searchWaterRecipes(undefined as any).length).toBe(all.length);

    // 4. Brak dopasowania
    expect(searchWaterRecipes('pluton-recipe')).toEqual([]);
  });

  test('TASK-P67-07-JAK: evaluateWaterSuitability dynamicznie ocenia przydatnosc wody dla kawy i herbaty', () => {
    // 1. Znakomita woda dla kawy (SCA Golden Cup: GH 80, KH 40)
    const coffeeSca: WaterSuitabilityEvaluation = evaluateWaterSuitability(80, 40, 'coffee');
    expect(coffeeSca.suitability).toBe('EXCELLENT');
    expect(coffeeSca.ratingPl).toBe('Znakomita');
    expect(coffeeSca.ratingEn).toBe('Excellent');
    expect(coffeeSca.verdictPl).toContain('SCA');

    // 2. Bardzo twarda woda (GH 350, KH 180) -> NOT_RECOMMENDED
    const hardWater = evaluateWaterSuitability(350, 180, 'coffee');
    expect(hardWater.suitability).toBe('NOT_RECOMMENDED');
    expect(hardWater.verdictPl).toContain('twarda');

    // 3. Woda dla herbaty (bardzo miękka: GH 30, KH 20) -> EXCELLENT
    const teaSoft = evaluateWaterSuitability('30,0', '20,0', 'tea');
    expect(teaSoft.suitability).toBe('EXCELLENT');
    expect(teaSoft.verdictEn).toBeDefined();

    // 4. Herbata z twardą wodą (GH 160, KH 90) -> NOT_RECOMMENDED
    const teaHard = evaluateWaterSuitability(160, 90, 'tea');
    expect(teaHard.suitability).toBe('NOT_RECOMMENDED');

    // 5. Obsługa wartości brzegowych, stringów i NaN
    const fallback = evaluateWaterSuitability(NaN, -10);
    expect(fallback.suitability).toBeDefined();
    expect(fallback.ratingPl).toBeDefined();
  });

  test('TASK-P69-07-JAK: calculateWaterBlend oblicza proporcje mieszania kranówki z wodą RO', () => {
    // 1. Zwykłe rozcieńczanie: kranówka 300 ppm + woda RO 0 ppm -> cel 100 ppm, partia 1000g
    const params: WaterBlendParams = {
      tapHardnessPpm: 300,
      pureWaterHardnessPpm: 0,
      targetHardnessPpm: 100,
      totalBatchGrams: 1000,
    };
    const blend: WaterBlendResult = calculateWaterBlend(params);
    expect(blend.tapWaterGrams).toBeCloseTo(333.3, 1);
    expect(blend.pureWaterGrams).toBeCloseTo(666.7, 1);
    expect(blend.totalBatchGrams).toBe(1000);
    expect(blend.effectiveHardnessPpm).toBeCloseTo(100, 1);

    // 2. Woda RO o twardości szczątkowej 10 ppm: kranówka 210 ppm, cel 70 ppm, partia 500g
    const blendRo = calculateWaterBlend({
      tapHardnessPpm: 210,
      pureWaterHardnessPpm: 10,
      targetHardnessPpm: 70,
      totalBatchGrams: 500,
    });
    expect(blendRo.tapWaterGrams).toBe(150);
    expect(blendRo.pureWaterGrams).toBe(350);
    expect(blendRo.effectiveHardnessPpm).toBe(70);

    // 3. Cel wyższy niż kranówka -> 100% kranówki
    const highTarget = calculateWaterBlend({
      tapHardnessPpm: 150,
      targetHardnessPpm: 200,
      totalBatchGrams: 1000,
    });
    expect(highTarget.tapWaterGrams).toBe(1000);
    expect(highTarget.pureWaterGrams).toBe(0);

    // 4. Cel niższy niż czysta woda -> 100% czystej
    const lowTarget = calculateWaterBlend({
      tapHardnessPpm: 200,
      pureWaterHardnessPpm: 20,
      targetHardnessPpm: 10,
      totalBatchGrams: 800,
    });
    expect(lowTarget.tapWaterGrams).toBe(0);
    expect(lowTarget.pureWaterGrams).toBe(800);

    // 5. Błędy i niepoprawne dane
    expect(() => calculateWaterBlend(null as any)).toThrow();
    expect(() => calculateWaterBlend({ tapHardnessPpm: 0, targetHardnessPpm: 50, totalBatchGrams: 1000 })).toThrow();
    expect(() => calculateWaterBlend({ tapHardnessPpm: 100, pureWaterHardnessPpm: 150, targetHardnessPpm: 50, totalBatchGrams: 1000 })).toThrow();
  });

  test('TASK-P72-07-JAK: calculateHardnessRatio analizuje stosunek twardości GH do KH', () => {
    // 1. Zrównoważona woda specialty (np. Barista Hustle 80/40 -> ratio 2.0)
    const balanced: HardnessRatioAnalysis = calculateHardnessRatio(80, 40);
    expect(balanced.ratio).toBe(2.0);
    expect(balanced.category).toBe('balanced');
    expect(balanced.descriptionPl).toContain('Optymalna');
    expect(balanced.descriptionEn).toContain('Optimal');

    // 2. Woda nadmiernie zbuforowana (np. GH 60, KH 50 -> ratio 1.2)
    const buffered = calculateHardnessRatio('60', '50');
    expect(buffered.ratio).toBe(1.2);
    expect(buffered.category).toBe('chalky_buffered');
    expect(buffered.descriptionPl).toContain('tłumiona');

    // 3. Woda z niewystarczającym buforem (np. GH 100, KH 20 -> ratio 5.0)
    const unbuffered = calculateHardnessRatio('100,0', '20,0');
    expect(unbuffered.ratio).toBe(5.0);
    expect(unbuffered.category).toBe('acidic_unbuffered');
    expect(unbuffered.descriptionPl).toContain('Wysoka proporcja');

    // 4. Odporność na zera, brak KH, wartości ujemne i null
    const zeroKh = calculateHardnessRatio(50, 0);
    expect(zeroKh.category).toBe('acidic_unbuffered');

    const empty = calculateHardnessRatio(null as any, undefined as any);
    expect(empty.ratio).toBe(0);
    expect(empty.category).toBe('chalky_buffered');
  });

  test('TASK-P74-07-JAK: calculateWaterDilution poprawnie oblicza proporcje rozcieńczania wody', () => {
    // 1. Standardowe rozcieńczanie wody źródlanej (np. 300 ppm -> 150 ppm dla 1000 ml wody zerowej)
    const res1: WaterDilutionResult = calculateWaterDilution(300, 150, 1000);
    expect(res1.sourceVolumeMl).toBe(500);
    expect(res1.diluentVolumeMl).toBe(500);
    expect(res1.totalVolumeMl).toBe(1000);
    expect(res1.dilutionFactor).toBe(2);
    expect(res1.achievedPpm).toBe(150);
    expect(res1.isDilutionNeeded).toBe(true);

    // 2. Rozcieńczanie z diluentem o niezerowej mineralizacji (np. woda źródlana 200 ppm, woda filtrowana 20 ppm, cel 110 ppm, 1000 ml)
    const res2 = calculateWaterDilution(200, 110, 1000, 20);
    expect(res2.sourceVolumeMl).toBe(500);
    expect(res2.diluentVolumeMl).toBe(500);
    expect(res2.achievedPpm).toBe(110);
    expect(res2.isDilutionNeeded).toBe(true);

    // 3. Woda źródlana ma już niższą mineralizację niż cel -> brak rozcieńczania
    const res3 = calculateWaterDilution(100, 150, 500);
    expect(res3.sourceVolumeMl).toBe(500);
    expect(res3.diluentVolumeMl).toBe(0);
    expect(res3.dilutionFactor).toBe(1);
    expect(res3.achievedPpm).toBe(100);
    expect(res3.isDilutionNeeded).toBe(false);

    // 4. Odporność na stringi z przecinkami i spacjami
    const res4 = calculateWaterDilution(' 240,0 ', ' 120,0 ', ' 800 ');
    expect(res4.sourceVolumeMl).toBe(400);
    expect(res4.diluentVolumeMl).toBe(400);
    expect(res4.totalVolumeMl).toBe(800);
    expect(res4.dilutionFactor).toBe(2);

    // 5. Odporność na niepoprawne dane i wartości skrajne (null, undefined, 0)
    const resInvalid = calculateWaterDilution(null as any, undefined as any, null as any);
    expect(resInvalid.totalVolumeMl).toBe(0);
    expect(resInvalid.sourceVolumeMl).toBe(0);
    expect(resInvalid.diluentVolumeMl).toBe(0);
    expect(resInvalid.isDilutionNeeded).toBe(false);
  });

  test('TASK-P76-07-JAK: estimateWaterTdsFromHardness szacuje TDS i przewodność EC z parametrów twardości', () => {
    // 1. Wzorcowa woda Barista Hustle (GH 80, KH 40 + 15 soli -> 135 ppm TDS)
    const bhEst: WaterTdsEstimate = estimateWaterTdsFromHardness(80, 40);
    expect(bhEst.estimatedTdsPpm).toBe(135);
    expect(bhEst.estimatedEcMicroSiemens).toBe(208); // 135 / 0.65 rounded
    expect(bhEst.category).toBe('optimal_specialty');
    expect(bhEst.descriptionPl).toContain('Optymalna');
    expect(bhEst.descriptionEn).toContain('Optimal');

    // 2. Miękka woda o niskiej mineralizacji (np. GH 30, KH 15 + 0 soli -> 45 ppm TDS)
    const softEst = estimateWaterTdsFromHardness('30,0', '15,0', 0);
    expect(softEst.estimatedTdsPpm).toBe(45);
    expect(softEst.category).toBe('low_mineral');
    expect(softEst.descriptionPl).toContain('Niska mineralizacja');

    // 3. Twarda woda kranowa (np. GH 200, KH 100 -> 315 ppm TDS)
    const hardEst = estimateWaterTdsFromHardness(200, 100);
    expect(hardEst.estimatedTdsPpm).toBe(315);
    expect(hardEst.category).toBe('high_mineral');
    expect(hardEst.descriptionPl).toContain('Wysoka mineralizacja');

    // 4. Odporność na null, ujemne i anomalie
    const fallbackEst = estimateWaterTdsFromHardness(null as any, undefined as any);
    expect(fallbackEst.estimatedTdsPpm).toBe(15); // tylko domyślne dodatkowe sole 15 ppm
    expect(fallbackEst.category).toBe('low_mineral');
  });

  test('TASK-P79-07-JAK: evaluateWaterAlkalinity analizuje zasadowość i pojemność buforową wody', () => {
    // 1. Zrównoważony bufor specialty (KH 40 ppm CaCO3 wg SCA)
    const optimal: AlkalinityEvaluation = evaluateWaterAlkalinity(40);
    const catCheck: AlkalinityCategory = optimal.category;
    expect(catCheck).toBe('optimal_buffer');
    expect(optimal.alkalinityPpm).toBe(40);
    expect(optimal.category).toBe('optimal_buffer');
    expect(optimal.bufferCapacity).toBe('ideal');
    expect(optimal.acidityImpactPl).toContain('Optymalny bufor');
    expect(optimal.acidityImpactEn).toContain('Optimal');
    expect(optimal.recommendedAdjustmentPl).toContain('SCA');

    // 2. Niski bufor (KH 15 ppm - podatność na agresywną kwasowość)
    const low = evaluateWaterAlkalinity('15,0');
    expect(low.alkalinityPpm).toBe(15);
    expect(low.category).toBe('low_buffer');
    expect(low.bufferCapacity).toBe('insufficient');
    expect(low.acidityImpactPl).toContain('Niski bufor');
    expect(low.recommendedAdjustmentPl).toContain('sodę oczyszczoną');

    // 3. Umiarkowanie podwyższony bufor (KH 70 ppm)
    const moderate = evaluateWaterAlkalinity(70);
    expect(moderate.alkalinityPpm).toBe(70);
    expect(moderate.category).toBe('moderate_buffer');
    expect(moderate.bufferCapacity).toBe('elevated');
    expect(moderate.acidityImpactPl).toContain('Podwyższony bufor');

    // 4. Zbyt wysoki bufor (KH 120 ppm - kredowy, płaski napar)
    const excessive = evaluateWaterAlkalinity(120);
    expect(excessive.alkalinityPpm).toBe(120);
    expect(excessive.category).toBe('excessive_buffer');
    expect(excessive.bufferCapacity).toBe('excessive');
    expect(excessive.acidityImpactPl).toContain('Zbyt wysoka');

    // 5. Odporność na null, ujemne, spacje i anomalie
    const fallback = evaluateWaterAlkalinity(null as any);
    expect(fallback.alkalinityPpm).toBe(0);
    expect(fallback.category).toBe('low_buffer');
    expect(fallback.bufferCapacity).toBe('insufficient');
  });

  test('TASK-P81-07-JAK: calculateMagnesiumCalciumRatio analizuje profil kationowy i wpływ na ekstrakcję', () => {
    // 1. Zrównoważony profil specialty (np. Ca 20 ppm, Mg 20 ppm -> Mg/Ca = 1.0)
    const balanced: MineralCationRatioAnalysis = calculateMagnesiumCalciumRatio(20, 20);
    const catCheck: CationRatioCategory = balanced.category;
    expect(catCheck).toBe('balanced_specialty');
    expect(balanced.ratioMgToCa).toBe(1.0);
    expect(balanced.sensoryEmphasisPl).toContain('Zrównoważony profil');
    expect(balanced.sensoryEmphasisEn).toContain('Balanced');
    expect(balanced.limescaleRisk).toBe('low');

    // 2. Dominacja magnezu (np. Ca 10 ppm, Mg 30 ppm -> Mg/Ca = 3.0)
    const mgDominant = calculateMagnesiumCalciumRatio('10,0', '30,0');
    expect(mgDominant.category).toBe('magnesium_dominant');
    expect(mgDominant.ratioMgToCa).toBe(3.0);
    expect(mgDominant.sensoryEmphasisPl).toContain('Dominacja magnezu');
    expect(mgDominant.recommendedUsagePl).toContain('przelewowych');

    // 3. Dominacja wapnia (np. Ca 60 ppm, Mg 15 ppm -> Mg/Ca = 0.25)
    const caDominant = calculateMagnesiumCalciumRatio(60, 15);
    expect(caDominant.category).toBe('calcium_dominant');
    expect(caDominant.ratioMgToCa).toBe(0.25);
    expect(caDominant.sensoryEmphasisPl).toContain('Dominacja wapnia');

    // 4. Czysto miękka woda (Ca 0, Mg 0)
    const zeroWater = calculateMagnesiumCalciumRatio(0, 0);
    expect(zeroWater.category).toBe('pure_soft');
    expect(zeroWater.ratioMgToCa).toBe(0);
    expect(zeroWater.limescaleRisk).toBe('minimal');

    // 5. Odporność na null, ujemne wartości i NaN
    const fallback = calculateMagnesiumCalciumRatio(null as any, undefined as any);
    expect(fallback.category).toBe('pure_soft');
    expect(fallback.ratioMgToCa).toBe(0);
  });

  test('TASK-P84-07-JAK: calculateResidualAlkalinity wylicza zasadowość resztkową i wpływ na buforowanie kwasów', () => {
    // 1. Optymalna zasadowość resztkowa Specialty (np. Alk 40, CaHardness 70, MgHardness 35 -> RA = 40 - (20 + 5) = 15.0 ppm)
    const optimal: ResidualAlkalinityAnalysis = calculateResidualAlkalinity(40, 70, 35);
    const catCheck: ResidualAlkalinityCategory = optimal.category;
    expect(catCheck).toBe('optimal_specialty');
    expect(optimal.residualAlkalinityPpm).toBe(15.0);
    expect(optimal.phBufferingCapacityPl).toContain('Optymalna');
    expect(optimal.sensoryAcidityImpactPl).toContain('Złoty standard');
    expect(optimal.sensoryAcidityImpactEn).toContain('Golden standard');

    // 2. Bardzo niska / ujemna zasadowość resztkowa (np. Alk 10, CaHardness 70, MgHardness 35 -> RA = 10 - 25 = -15.0 ppm)
    const veryLow = calculateResidualAlkalinity('10,0', '70,0', '35,0');
    expect(veryLow.category).toBe('negative_or_very_low');
    expect(veryLow.residualAlkalinityPpm).toBe(-15.0);
    expect(veryLow.phBufferingCapacityPl).toContain('Bardzo niska');
    expect(veryLow.sensoryAcidityImpactPl).toContain('Maksymalna jasność');

    // 3. Umiarkowanie podwyższony bufor (np. Alk 60, CaHardness 70, MgHardness 35 -> RA = 60 - 25 = 35.0 ppm)
    const moderate = calculateResidualAlkalinity(60, 70, 35);
    expect(moderate.category).toBe('moderate_buffer');
    expect(moderate.residualAlkalinityPpm).toBe(35.0);
    expect(moderate.sensoryAcidityImpactPl).toContain('wygładzona');

    // 4. Nadmierny bufor (np. Alk 90, CaHardness 70, MgHardness 35 -> RA = 90 - 25 = 65.0 ppm)
    const excessive = calculateResidualAlkalinity(90, 70, 35);
    expect(excessive.category).toBe('excessive_dulling');
    expect(excessive.residualAlkalinityPpm).toBe(65.0);
    expect(excessive.sensoryAcidityImpactPl).toContain('Silne stłumienie');

    // 5. Odporność na null, ujemne wartości i NaN
    const fallback = calculateResidualAlkalinity(null as any);
    expect(fallback.residualAlkalinityPpm).toBeLessThanOrEqual(0);
    expect(fallback.category).toBe('negative_or_very_low');
  });
});



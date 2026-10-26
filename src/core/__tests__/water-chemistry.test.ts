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
});

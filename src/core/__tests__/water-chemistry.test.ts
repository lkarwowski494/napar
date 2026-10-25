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
});

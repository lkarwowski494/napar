// ============================================================================
// Napar (Steepwise) — Unit Tests: Water Chemistry & Mineralization
// ============================================================================

import {
  WATER_RECIPES,
  calculateWaterMinerals,
} from '../water-chemistry';

describe('Water Chemistry & Mineralization Module', () => {
  test('Zawiera kluczowe profile mineralizacji wody specialty', () => {
    const ids = WATER_RECIPES.map((r) => r.id);
    expect(ids).toContain('barista_hustle_80_40');
    expect(ids).toContain('sca_standard');
    expect(ids).toContain('melbourne_soft');
    expect(ids).toContain('scott_rao_wonder');
    expect(ids).toContain('tea_delicate');
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
  });

  test('Prawidłowo skaluje koncentraty dla 5.0 litrów wody (bańka RO)', () => {
    // 5L, GH 80, KH 40
    // Buffer = (40 / 2) * 5 = 100.0g
    // Hardness = (80 / 2) * 5 = 200.0g
    const res = calculateWaterMinerals(5.0, 80, 40);
    expect(res.concentrateBufferGrams).toBe(100.0);
    expect(res.concentrateHardnessGrams).toBe(200.0);

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
});

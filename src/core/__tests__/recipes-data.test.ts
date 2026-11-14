// ============================================================================
// Apps4Brew Studio — Unit Tests: Master Recipes Data & Lookups
// TASK-P12-08-PRO
// ============================================================================

import {
  MASTER_RECIPES,

} from '../recipes-data';

describe('Master Recipes Data (MASTER_RECIPES)', () => {
  test('zawiera dokładnie 24 zdefiniowane receptury wzorcowe o unikalnych ID', () => {
    expect(MASTER_RECIPES.length).toBe(24);

    const ids = new Set<string>();
    for (const r of MASTER_RECIPES) {
      expect(ids.has(r.id)).toBe(false);
      ids.add(r.id);

      expect(r.id.trim().length).toBeGreaterThan(0);
      expect(r.name.trim().length).toBeGreaterThan(0);
      expect(['COFFEE', 'TEA']).toContain(r.type);
      expect(r.coffeeOrTeaDoseGrams).toBeGreaterThan(0);
      expect(r.waterWeightGrams).toBeGreaterThan(0);
      expect(r.waterTemperatureCelsius).toBeGreaterThan(0);
      expect(r.recommendedRatio).toBeGreaterThan(0);
      expect(Array.isArray(r.steps)).toBe(true);
      expect(r.steps.length).toBeGreaterThan(0);
    }
  });
});

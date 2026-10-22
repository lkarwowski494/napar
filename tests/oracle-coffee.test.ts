// ============================================================================
// Napar (Steepwise) — Coffee Physics Oracle Test (BR-TEST-011, BR-TEST-012, ZP-06)
// Verifies TS calculations against independent Python 3 ground-truth corpus
// ============================================================================

import corpus from './fixtures/coffee-corpus.json';
import { calculateExtractionYield, calculateCaffeineDecay } from '../src/core/domain-rules';
import { ppmCaCO3ToDegreesDH } from '../src/core/water-chemistry';

describe('Python 3 Domain Calculation Oracle (BR-TEST-011, BR-TEST-012)', () => {
  test('Extraction Yield matches Python oracle to 2 decimal places and ratings match 100%', () => {
    expect(corpus.extraction_yield.length).toBeGreaterThanOrEqual(10);

    for (const vector of corpus.extraction_yield) {
      const result = calculateExtractionYield({
        beverageWeightGrams: vector.waterGrams,
        tdsPercent: vector.tdsPercent,
        doseGrams: vector.coffeeDoseGrams,
      });

      // TS rounds to 2 decimal places, compare with delta <= 0.01
      expect(Math.abs(result.extractionYieldPercent - vector.expectedExtractionYieldPercent)).toBeLessThanOrEqual(0.01);
      expect(result.rating).toBe(vector.expectedRating);
    }
  });

  test('Water hardness conversion (ppm CaCO3 -> dH) matches Python oracle to 4 decimal places', () => {
    expect(corpus.water_hardness.length).toBeGreaterThanOrEqual(8);

    for (const vector of corpus.water_hardness) {
      const actualDH = ppmCaCO3ToDegreesDH(vector.ppmCaCO3);
      expect(Math.abs(actualDH - vector.expectedDegreesDH)).toBeLessThanOrEqual(0.0001);
    }
  });

  test('Caffeine decay pharmacokinetics matches Python oracle to 4 decimal places', () => {
    expect(corpus.caffeine_decay.length).toBeGreaterThanOrEqual(30);

    for (const vector of corpus.caffeine_decay) {
      const actualRemaining = calculateCaffeineDecay(
        vector.initialMg,
        vector.elapsedHours,
        vector.halfLifeHours
      );
      expect(Math.abs(actualRemaining - vector.expectedRemainingMg)).toBeLessThanOrEqual(0.0001);
    }
  });
});

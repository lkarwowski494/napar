// ============================================================================
// Napar (Steepwise) — Property-Based & Mathematical Invariant Tests
// Generative testing of mathematical models, monotonicity, conservation laws & bijectivity
// Powered by fast-check with deterministic PRNG seeding (BR-TEST-006..010)
// ============================================================================

import fc from 'fast-check';
import {
  calculateBrewRatio,
  calculateBrewWater,
  calculateExtractionYield,
  estimateTeaInfusionCaffeineMg,
} from '../domain-rules';
import {
  SUPPORTED_GRINDERS,
  convertMicronsToGrinder,
  convertBetweenGrinders,
} from '../grinder-converter';
import { calculateWaterMinerals, WATER_RECIPES } from '../water-chemistry';
import { estimateTotalLeafCaffeineMg } from '../gongfu-session';

const rawSeed = process.env.PROP_SEED || process.env.MATRIX_SEED;
const seed = rawSeed && !isNaN(parseInt(rawSeed, 10)) ? parseInt(rawSeed, 10) : 0x5eed1234;

describe('Property-Based & Invariant Tests: Brewing Science & Mathematics (fast-check)', () => {
  test('Własność 1: Odwracalność relacji dozy, wody i proporcji (Ratio Reversibility)', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 6, max: 46, noNaN: true }),
        fc.float({ min: 10, max: 25, noNaN: true }),
        (rawDose, rawRatio) => {
          const dose = Number(rawDose.toFixed(1));
          const targetRatio = Number(rawRatio.toFixed(1));
          const water = calculateBrewWater(dose, targetRatio);
          const computedRatio = calculateBrewRatio(dose, water);

          // Odchylenie proporcji z powodu zaokrąglenia wody do 1 miejsca po przecinku nie może przekraczać 0.15
          return Math.abs(computedRatio - targetRatio) <= 0.15;
        }
      ),
      { seed, numRuns: 100 }
    );
  });

  test('Własność 2: Ścisła monotoniczność wydajności ekstrakcji (EY) względem TDS', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 200, max: 500, noNaN: true }),
        fc.float({ min: 12, max: 30, noNaN: true }),
        (water, dose) => {
          let previousEy = -1;
          for (let tds = 0.8; tds <= 2.5; tds += 0.05) {
            const result = calculateExtractionYield({ beverageWeightGrams: water, tdsPercent: tds, doseGrams: dose });
            if (result.extractionYieldPercent <= previousEy) return false;
            previousEy = result.extractionYieldPercent;
          }
          return true;
        }
      ),
      { seed, numRuns: 100 }
    );
  });

  test('Własność 3: Klasyfikacja złotego okna SCA jest rozłączna i wyczerpująca', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0.5, max: 3.0, noNaN: true }),
        (tds) => {
          const res = calculateExtractionYield({ beverageWeightGrams: 250, tdsPercent: tds, doseGrams: 15 });
          if (res.extractionYieldPercent < 18.0) {
            return res.rating === 'under';
          } else if (res.extractionYieldPercent > 22.0) {
            return res.rating === 'over';
          } else {
            return res.rating === 'ideal';
          }
        }
      ),
      { seed, numRuns: 100 }
    );
  });

  test('Własność 4: Słaba monotoniczność nastaw dla każdego ze wspieranych młynków', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...SUPPORTED_GRINDERS),
        (grinder) => {
          let prevValue = grinder.minSetting;
          for (let microns = 150; microns <= 1500; microns += 25) {
            const { rawValue } = convertMicronsToGrinder(microns, grinder.id);
            if (
              rawValue < prevValue ||
              rawValue < grinder.minSetting ||
              rawValue > grinder.maxSetting
            ) {
              return false;
            }
            prevValue = rawValue;
          }
          return true;
        }
      ),
      { seed, numRuns: 50 }
    );
  });

  test('Własność 5: Stabilność dwukierunkowej konwersji między młynkami (Round-trip stability)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 12, max: 36 }),
        (clicks) => {
          const step1 = convertBetweenGrinders('comandante_c40', clicks, 'timemore_c2_c3');
          const step2 = convertBetweenGrinders('timemore_c2_c3', step1.targetFormatted, 'comandante_c40');
          const originalMicrons = clicks * 30.0;
          return Math.abs(step2.microns - originalMicrons) <= 35;
        }
      ),
      { seed, numRuns: 25 }
    );
  });

  test('Własność 6: Liniowość i addytywność zapotrzebowania na koncentraty mineralne', () => {
    const recipe = WATER_RECIPES[0]; // Barista Hustle 80/40
    fc.assert(
      fc.property(
        fc.float({ min: 0.5, max: 4.0, noNaN: true }),
        fc.float({ min: 0.5, max: 4.0, noNaN: true }),
        (rawV1, rawV2) => {
          const v1 = Number(rawV1.toFixed(1));
          const v2 = Number(rawV2.toFixed(1));
          const calc1 = calculateWaterMinerals(v1, recipe.targetGhPpm, recipe.targetKhPpm);
          const calc2 = calculateWaterMinerals(v2, recipe.targetGhPpm, recipe.targetKhPpm);
          const calcTotal = calculateWaterMinerals(v1 + v2, recipe.targetGhPpm, recipe.targetKhPpm);

          const diffBuffer = Math.abs(
            calc1.concentrateBufferGrams + calc2.concentrateBufferGrams - calcTotal.concentrateBufferGrams
          );
          const diffHardness = Math.abs(
            calc1.concentrateHardnessGrams + calc2.concentrateHardnessGrams - calcTotal.concentrateHardnessGrams
          );
          return diffBuffer <= 0.2 && diffHardness <= 0.2;
        }
      ),
      { seed, numRuns: 50 }
    );
  });

  test('Własność 7: Prawo zachowania masy kofeiny w serii infuzji herbaty', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 3, max: 15 }),
        (dose) => {
          const totalLeafCaffeine = estimateTotalLeafCaffeineMg(dose);
          let cumulativeCaffeine = 0;
          for (let inf = 1; inf <= 6; inf++) {
            const infCaffeine = estimateTeaInfusionCaffeineMg(totalLeafCaffeine, inf);
            cumulativeCaffeine += infCaffeine;
            if (inf > 1) {
              const prevInfCaffeine = estimateTeaInfusionCaffeineMg(totalLeafCaffeine, inf - 1);
              if (infCaffeine > prevInfCaffeine + 0.1) return false;
            }
          }
          return cumulativeCaffeine <= totalLeafCaffeine + 0.5;
        }
      ),
      { seed, numRuns: 30 }
    );
  });
});

// ============================================================================
// Napar (Steepwise) — fast-check Property Tests (BR-TEST-006, BR-TEST-009)
// Generative testing of domain invariants with deterministic seeding
// ============================================================================

import fc from 'fast-check';
import {
  calculateBrewRatio,
  calculateBrewWater,
  calculateExtractionYield,
  scaleRecipeDose,
} from '../src/core/domain-rules';
import { wInKeep, roundTo } from '../src/core/unit-converter';

// Setup deterministic seed if provided
const seed = parseInt(process.env.PROP_SEED || '15926535', 10);
fc.configureGlobal({ seed, numRuns: 100 });

describe('Domain Properties with fast-check (BR-TEST-006)', () => {
  test('Niezmiennik 1: Addytywność kroków zalewania przy skalowaniu receptury', () => {
    // Suma wody ze wszystkich kroków po przeskalowaniu musi być równa docelowej wodzie receptury
    fc.assert(
      fc.property(
        fc.integer({ min: 10, max: 40 }), // nowa doza kawy w gramach
        (newDose) => {
          const originalDose = 15;
          const originalSteps = [
            { id: '1', name: 'Preinfuzja', waterGrams: 50, durationSeconds: 45 },
            { id: '2', name: 'Zalanie 1', waterGrams: 100, durationSeconds: 45 },
            { id: '3', name: 'Zalanie 2', waterGrams: 100, durationSeconds: 60 },
          ];

          const scaled = scaleRecipeDose(originalSteps, originalDose, newDose);
          const totalScaledWater = Number(
            scaled.steps.reduce((sum, s) => sum + s.waterGrams, 0).toFixed(1)
          );

          // Całkowita masa wody po przeskalowaniu kroków musi równać się targetWaterGrams
          expect(Math.abs(totalScaledWater - scaled.targetWaterGrams)).toBeLessThanOrEqual(0.1);
          // Każdy krok musi zachować dodatnią masę wody
          scaled.steps.forEach((step) => {
            expect(step.waterGrams).toBeGreaterThan(0);
          });
        }
      )
    );
  });

  test('Niezmiennik 2: Odwracalność relacji woda <-> doza <-> ratio', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 5.0, max: 60.0, noNaN: true }), // doza
        fc.double({ min: 10.0, max: 22.0, noNaN: true }), // ratio
        (dose, targetRatio) => {
          const water = calculateBrewWater(dose, targetRatio);
          const computedRatio = calculateBrewRatio(dose, water);

          expect(Math.abs(computedRatio - targetRatio)).toBeLessThanOrEqual(0.15);
        }
      )
    );
  });

  test('Niezmiennik 3: Ścisła monotoniczność Extraction Yield względem TDS', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 150.0, max: 600.0, noNaN: true }), // woda
        fc.double({ min: 10.0, max: 35.0, noNaN: true }), // doza
        fc.double({ min: 0.5, max: 2.0, noNaN: true }), // tds1
        fc.double({ min: 0.1, max: 1.0, noNaN: true }), // delta
        (water, dose, tds1, delta) => {
          const tds2 = tds1 + delta;
          const ey1 = calculateExtractionYield({ beverageWeightGrams: water, tdsPercent: tds1, doseGrams: dose }).extractionYieldPercent;
          const ey2 = calculateExtractionYield({ beverageWeightGrams: water, tdsPercent: tds2, doseGrams: dose }).extractionYieldPercent;

          expect(ey2).toBeGreaterThan(ey1);
        }
      )
    );
  });

  test('Niezmiennik 4: wInKeep — brak dryfu przy wprowadzaniu liczby odpowiadającej zaokrąglonej wartości bazowej', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 10.0, max: 200.0, noNaN: true }), // vPrev
        (vPrevRaw) => {
          const vPrev = roundTo(vPrevRaw, 2);
          // cu dla oz = 0.03527396195
          const displayed = roundTo(vPrev * 0.03527396195, 1);
          const typedText = displayed.toString().replace('.', ',');

          // wInKeep musi zwrócić DOKŁADNIE vPrev bez ucieczki na zaokrągleniach
          const preserved = wInKeep(typedText, 'oz', vPrev);
          expect(preserved).toBe(vPrev);
        }
      )
    );
  });

  test('Niezmiennik 5: Monotoniczność rozpadu kofeiny w organizmie', () => {
    // C(t) = C0 * 0.5^(t / t_half)
    fc.assert(
      fc.property(
        fc.double({ min: 50.0, max: 400.0, noNaN: true }), // c0 (mg)
        fc.double({ min: 0.0, max: 24.0, noNaN: true }), // t1 (h)
        fc.double({ min: 0.1, max: 12.0, noNaN: true }), // deltaT (h)
        (c0, t1, dt) => {
          const t2 = t1 + dt;
          const halfLife = 5.0; // typowy czas półtrwania kofeiny
          const c1 = c0 * Math.pow(0.5, t1 / halfLife);
          const c2 = c0 * Math.pow(0.5, t2 / halfLife);

          expect(c2).toBeLessThan(c1);
          expect(c2).toBeGreaterThan(0);
        }
      )
    );
  });
});

// ============================================================================
// Napar (Steepwise) — Property-Based & Mathematical Invariant Tests
// Generative testing of mathematical models, monotonicity, conservation laws & bijectivity
// ============================================================================

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

describe('Property-Based & Invariant Tests: Brewing Science & Mathematics', () => {
  test('Własność 1: Odwracalność relacji dozy, wody i proporcji (Ratio Reversibility)', () => {
    // Generujemy 200 losowych par (doza, ratio)
    for (let i = 0; i < 200; i++) {
      const dose = Number((6 + Math.random() * 40).toFixed(1)); // 6g - 46g
      const targetRatio = Number((10 + Math.random() * 15).toFixed(1)); // 1:10 - 1:25

      const water = calculateBrewWater(dose, targetRatio);
      const computedRatio = calculateBrewRatio(dose, water);

      // Odchylenie proporcji z powodu zaokrąglenia wody do 1 miejsca po przecinku nie może przekraczać 0.15
      expect(Math.abs(computedRatio - targetRatio)).toBeLessThanOrEqual(0.15);
    }
  });

  test('Własność 2: Ścisła monotoniczność wydajności ekstrakcji (EY) względem TDS', () => {
    // Dla 100 losowych proporcji woda/kawa, wyższy TDS musi zawsze dać wyższy EY%
    for (let i = 0; i < 100; i++) {
      const water = 200 + Math.random() * 300;
      const dose = 12 + Math.random() * 18;

      let previousEy = -1;
      // Sprawdzamy TDS rosnący od 0.8% do 2.5% co 0.05%
      for (let tds = 0.8; tds <= 2.5; tds += 0.05) {
        const result = calculateExtractionYield(water, tds, dose);
        expect(result.extractionYieldPercent).toBeGreaterThan(previousEy);
        previousEy = result.extractionYieldPercent;
      }
    }
  });

  test('Własność 3: Klasyfikacja złotego okna SCA jest rozłączna i wyczerpująca', () => {
    for (let tds = 0.5; tds <= 3.0; tds += 0.05) {
      const res = calculateExtractionYield(250, tds, 15);
      if (res.extractionYieldPercent < 18.0) {
        expect(res.rating).toBe('under');
      } else if (res.extractionYieldPercent > 22.0) {
        expect(res.rating).toBe('over');
      } else {
        expect(res.rating).toBe('ideal');
      }
    }
  });

  test('Własność 4: Słaba monotoniczność nastaw dla każdego ze wspieranych młynków', () => {
    for (const grinder of SUPPORTED_GRINDERS) {
      let prevValue = grinder.minSetting;

      // Sprawdzamy pełne spektrum cząstek od 150 µm do 1500 µm
      for (let microns = 150; microns <= 1500; microns += 25) {
        const { rawValue } = convertMicronsToGrinder(microns, grinder.id);
        expect(rawValue).toBeGreaterThanOrEqual(prevValue);
        expect(rawValue).toBeGreaterThanOrEqual(grinder.minSetting);
        expect(rawValue).toBeLessThanOrEqual(grinder.maxSetting);
        prevValue = rawValue;
      }
    }
  });

  test('Własność 5: Stabilność dwukierunkowej konwersji między młynkami (Round-trip stability)', () => {
    // Sprawdzamy konwersję Comandante C40 -> Timemore C2 -> Comandante C40
    for (let clicks = 12; clicks <= 36; clicks++) {
      const step1 = convertBetweenGrinders('comandante_c40', clicks, 'timemore_c2_c3');
      const step2 = convertBetweenGrinders('timemore_c2_c3', step1.targetFormatted, 'comandante_c40');

      // Powrotna wartość mikronów powinna być w granicach jednego kliku Comandante (±30 µm)
      const originalMicrons = clicks * 30.0;
      expect(Math.abs(step2.microns - originalMicrons)).toBeLessThanOrEqual(35);
    }
  });

  test('Własność 6: Liniowość i addytywność zapotrzebowania na koncentraty mineralne', () => {
    const recipe = WATER_RECIPES[0]; // Barista Hustle 80/40

    for (let i = 0; i < 50; i++) {
      const v1 = Number((0.5 + Math.random() * 4).toFixed(1));
      const v2 = Number((0.5 + Math.random() * 4).toFixed(1));

      const calc1 = calculateWaterMinerals(v1, recipe.targetGhPpm, recipe.targetKhPpm);
      const calc2 = calculateWaterMinerals(v2, recipe.targetGhPpm, recipe.targetKhPpm);
      const calcTotal = calculateWaterMinerals(v1 + v2, recipe.targetGhPpm, recipe.targetKhPpm);

      // Addytywność roztworów z tolerancją na zaokrąglenie do 0.1g
      expect(Math.abs(calc1.concentrateBufferGrams + calc2.concentrateBufferGrams - calcTotal.concentrateBufferGrams)).toBeLessThanOrEqual(0.2);
      expect(Math.abs(calc1.concentrateHardnessGrams + calc2.concentrateHardnessGrams - calcTotal.concentrateHardnessGrams)).toBeLessThanOrEqual(0.2);
    }
  });

  test('Własność 7: Prawo zachowania masy kofeiny w serii infuzji herbaty', () => {
    // Dla dowolnej gramatury liści (3g - 15g) łączna kofeina ze standardowej sesji (do 6 infuzji)
    // nie przekracza 100% całkowitej kofeiny zawartej w suchym surowcu
    for (let dose = 3; dose <= 15; dose++) {
      const totalLeafCaffeine = estimateTotalLeafCaffeineMg(dose);

      let cumulativeCaffeine = 0;
      for (let inf = 1; inf <= 6; inf++) {
        const infCaffeine = estimateTeaInfusionCaffeineMg(totalLeafCaffeine, inf);
        cumulativeCaffeine += infCaffeine;

        // Każde kolejne zalanie wypłukuje nie więcej niż poprzednie zalanie (kinetyka monotonicznie malejąca)
        if (inf > 1) {
          const prevInfCaffeine = estimateTeaInfusionCaffeineMg(totalLeafCaffeine, inf - 1);
          expect(infCaffeine).toBeLessThanOrEqual(prevInfCaffeine + 0.1);
        }
      }

      // Suma 6 infuzji nie przekracza limitu teoretycznego (100% kofeiny)
      expect(cumulativeCaffeine).toBeLessThanOrEqual(totalLeafCaffeine + 0.5);
    }
  });
});

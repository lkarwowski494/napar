import {
  calculateBrewWater,
  calculateBrewDose,
  calculateBrewRatio,
  calculateLiquidYield,
  calculateExtractionYield,
  evaluateRestingWindow,
  estimateCoffeeCaffeineMg,
  estimateTotalLeafCaffeineMg,
  estimateTeaInfusionCaffeineMg,
  calculateRemainingCaffeineMg,
  evaluateBedtimeCaffeine,
  calculateHoursUntilSafeCaffeine,
  diagnoseExtractionTaste,
  calculateBatchScaling,
} from '../domain-rules';

describe('Napar Domain Rules (RD-01…RD-30)', () => {
  describe('RD-01: Brew Ratio & Water Calculations', () => {
    it('calculates water correctly for 15g at 1:16 ratio', () => {
      expect(calculateBrewWater(15.0, 16.0)).toBe(240.0);
    });

    it('calculates water correctly for standard SCA ratio 1:16.67', () => {
      expect(calculateBrewWater(18.0, 16.67)).toBe(300.1);
    });

    it('calculates dose correctly for 500g water at 1:16.67', () => {
      expect(calculateBrewDose(500.0, 16.67)).toBe(30.0);
    });

    it('throws when parameters are zero or negative', () => {
      expect(() => calculateBrewWater(0, 16)).toThrow();
      expect(() => calculateBrewDose(500, -1)).toThrow();
    });
  });

  describe('RD-02: Water Retention & Liquid Yield', () => {
    it('calculates retained water with standard 2.0x factor', () => {
      const yieldGrams = calculateLiquidYield(300.0, 18.0, 2.0);
      expect(yieldGrams).toBe(264.0);
    });

    it('handles small water without returning negative numbers', () => {
      expect(calculateLiquidYield(20.0, 15.0, 2.0)).toBe(0);
    });
  });

  describe('RD-03: Extraction Yield (EY %)', () => {
    it('evaluates optimal Golden Cup extraction (18.0% - 22.0%)', () => {
      // 15g dose, 220g beverage, 1.35% TDS -> EY = (220 * 1.35) / 15 = 19.8%
      const result = calculateExtractionYield(220.0, 1.35, 15.0);
      expect(result.extractionYieldPercent).toBe(19.8);
      expect(result.rating).toBe('ideal');
    });

    it('identifies under-extraction (<18.0%)', () => {
      // 20g dose, 300g beverage, 1.00% TDS -> EY = (300 * 1.0) / 20 = 15.0%
      const result = calculateExtractionYield(300.0, 1.0, 20.0);
      expect(result.extractionYieldPercent).toBe(15.0);
      expect(result.rating).toBe('under');
    });

    it('identifies over-extraction (>22.0%)', () => {
      // 15g dose, 250g beverage, 1.50% TDS -> EY = (250 * 1.5) / 15 = 25.0%
      const result = calculateExtractionYield(250.0, 1.5, 15.0);
      expect(result.extractionYieldPercent).toBe(25.0);
      expect(result.rating).toBe('over');
    });
  });

  describe('RD-07: Resting Window & Freshness (M1-audytor-generalny-032)', () => {
    const baseDate = new Date('2026-10-15T12:00:00Z');

    it('detects degassing phase (0-6 days)', () => {
      const roastDate = new Date('2026-10-13T12:00:00Z'); // 2 days
      const result = evaluateRestingWindow(roastDate, baseDate);
      expect(result.stage).toBe('degassing');
      expect(result.badgeColor).toBe('amber');

      // Day 6 boundary
      const day6Roast = new Date('2026-10-09T12:00:00Z'); // 6 days
      expect(evaluateRestingWindow(day6Roast, baseDate).stage).toBe('degassing');
    });

    it('detects peak flavor phase (7-35 days)', () => {
      // Day 7 boundary
      const day7Roast = new Date('2026-10-08T12:00:00Z'); // 7 days
      expect(evaluateRestingWindow(day7Roast, baseDate).stage).toBe('peak');

      const roastDate = new Date('2026-10-01T12:00:00Z'); // 14 days
      const result = evaluateRestingWindow(roastDate, baseDate);
      expect(result.stage).toBe('peak');
      expect(result.badgeColor).toBe('green');

      // Day 35 boundary
      const day35Roast = new Date('2026-09-10T12:00:00Z'); // 35 days
      expect(evaluateRestingWindow(day35Roast, baseDate).stage).toBe('peak');
    });

    it('detects stable phase (36-60 days)', () => {
      // Day 36 boundary
      const day36Roast = new Date('2026-09-09T12:00:00Z'); // 36 days
      expect(evaluateRestingWindow(day36Roast, baseDate).stage).toBe('stable');

      const roastDate = new Date('2026-08-30T12:00:00Z'); // ~46 days
      const result = evaluateRestingWindow(roastDate, baseDate);
      expect(result.stage).toBe('stable');
      expect(result.badgeColor).toBe('blue');
    });

    it('detects aging phase (>60 days)', () => {
      const roastDate = new Date('2026-06-01T12:00:00Z'); // >100 days
      const result = evaluateRestingWindow(roastDate, baseDate);
      expect(result.stage).toBe('aging');
      expect(result.badgeColor).toBe('gray');
    });
  });

  describe('RD-17 & RD-18: Caffeine Kinetics and Estimation', () => {
    it('estimates caffeine for filter Arabica correctly', () => {
      // 15g * 12 * 0.88 = 158.4 mg
      const caffeine = estimateCoffeeCaffeineMg(15.0, 'arabica', 'filter');
      expect(caffeine).toBe(158.4);
    });

    it('estimates caffeine for Robusta correctly', () => {
      // 15g * 22 * 0.88 = 290.4 mg
      const caffeine = estimateCoffeeCaffeineMg(15.0, 'robusta', 'filter');
      expect(caffeine).toBe(290.4);
    });

    it('estimates tea infusion caffeine with exponential decay bounded under 89% (M1-audytor-generalny-033)', () => {
      const totalLeafCaffeine = 100.0;
      let sumExtracted = 0;
      for (let n = 1; n <= 20; n++) {
        const extracted = estimateTeaInfusionCaffeineMg(totalLeafCaffeine, n);
        sumExtracted += extracted;
      }
      expect(sumExtracted).toBeLessThan(89.0);
      expect(sumExtracted).toBeGreaterThan(85.0);
    });

    it('estimates espresso extraction efficiency', () => {
      // 18g * 12 * 0.75 = 162.0 mg
      const caffeine = estimateCoffeeCaffeineMg(18.0, 'arabica', 'espresso');
      expect(caffeine).toBe(162.0);
    });

    it('calculates caffeine decay using 5h half-life model', () => {
      const initial = 120.0;
      expect(calculateRemainingCaffeineMg(initial, 5.0)).toBe(60.0);
      expect(calculateRemainingCaffeineMg(initial, 10.0)).toBe(30.0);
      expect(calculateRemainingCaffeineMg(initial, 15.0)).toBe(15.0);
    });

    it('evaluates bedtime safety accurately', () => {
      // 120mg consumed 10h before bed -> 30mg remaining (above 25mg threshold)
      const unsafe = evaluateBedtimeCaffeine([{ doseMg: 120, hoursUntilBedtime: 10 }], 25.0);
      expect(unsafe.isSafeForSleep).toBe(false);

      // 120mg consumed 15h before bed -> 15mg remaining (safe)
      const safe = evaluateBedtimeCaffeine([{ doseMg: 120, hoursUntilBedtime: 15 }], 25.0);
      expect(safe.isSafeForSleep).toBe(true);
    });

    it('calculates hours until safe threshold (100mg to 25mg = exactly 2 half-lives = 10h)', () => {
      const hours = calculateHoursUntilSafeCaffeine(100.0, 25.0, 5.0);
      expect(hours).toBe(10.0);
    });

    it('calculates Gongfu Cha decaying tea caffeine per infusion', () => {
      const totalLeaf = 100.0;
      expect(estimateTeaInfusionCaffeineMg(totalLeaf, 1)).toBe(40.0);
      expect(estimateTeaInfusionCaffeineMg(totalLeaf, 2)).toBe(22.0);
      expect(estimateTeaInfusionCaffeineMg(totalLeaf, 3)).toBe(12.1);
      expect(estimateTeaInfusionCaffeineMg(totalLeaf, 4)).toBe(6.7);
    });
  });

  describe('RD-05: Dial-in Doctor Taste Diagnosis', () => {
    it('suggests finer grind and higher temp for sour cup', () => {
      const diagnoses = diagnoseExtractionTaste({ isSour: true });
      expect(diagnoses.length).toBe(1);
      expect(diagnoses[0].grindAdjustment).toBe('finer');
      expect(diagnoses[0].tempAdjustment).toBe('higher');
    });

    it('suggests coarser grind and lower temp for bitter cup', () => {
      const diagnoses = diagnoseExtractionTaste({ isBitter: true });
      expect(diagnoses.length).toBe(1);
      expect(diagnoses[0].grindAdjustment).toBe('coarser');
      expect(diagnoses[0].tempAdjustment).toBe('lower');
    });

    it('handles multiple taste descriptors', () => {
      const diagnoses = diagnoseExtractionTaste({ isSour: true, isWatery: true });
      expect(diagnoses.length).toBe(2);
    });
  });

  describe('RD-06: Batch Scaling (Porcje 1–4 osób)', () => {
    it('scales 1 cup with default grind recommendation', () => {
      const result = calculateBatchScaling(15, 250, 1);
      expect(result.scaledDoseGrams).toBe(15);
      expect(result.scaledWaterGrams).toBe(250);
      expect(result.grindAdjustmentClicks).toBe(0);
    });

    it('scales 2 cups with +2 clicks coarser recommendation', () => {
      const result = calculateBatchScaling(15, 250, 2);
      expect(result.scaledDoseGrams).toBe(30);
      expect(result.scaledWaterGrams).toBe(500);
      expect(result.grindAdjustmentClicks).toBe(2);
      expect(result.recommendationPl).toContain('+2 kliki');
    });

    it('scales 3 or 4 cups with +4 clicks coarser recommendation', () => {
      const result = calculateBatchScaling(15, 250, 4);
      expect(result.scaledDoseGrams).toBe(60);
      expect(result.scaledWaterGrams).toBe(1000);
      expect(result.grindAdjustmentClicks).toBe(4);
      expect(result.recommendationPl).toContain('+4 kliki');
    });

    it('clamps portions between 1 and 4 when input is outside bounds', () => {
      const under = calculateBatchScaling(15, 250, 0);
      expect(under.multiplier).toBe(1);
      const over = calculateBatchScaling(15, 250, 99);
      expect(over.multiplier).toBe(4);
    });
  });

  describe('Edge cases, boundaries & zero handling across domain rules', () => {
    it('calculateBrewRatio returns 0 on non-positive input', () => {
      expect(calculateBrewRatio(0, 250)).toBe(0);
      expect(calculateBrewRatio(15, 0)).toBe(0);
      expect(calculateBrewRatio(-5, -100)).toBe(0);
    });

    it('calculateLiquidYield throws on non-positive water/dose or negative factor', () => {
      expect(() => calculateLiquidYield(0, 15)).toThrow();
      expect(() => calculateLiquidYield(250, 0)).toThrow();
      expect(() => calculateLiquidYield(250, 15, -1)).toThrow();
    });
    it('calculateExtractionYield throws on zero or negative dose/beverage', () => {
      expect(() => calculateExtractionYield(0, 1.35, 15)).toThrow();
      expect(() => calculateExtractionYield(250, 1.35, 0)).toThrow();
      expect(() => calculateExtractionYield(-100, 1.35, 15)).toThrow();
    });

    it('estimateCoffeeCaffeineMg returns 0 on non-positive dose, and handles immersion/cold_brew', () => {
      expect(estimateCoffeeCaffeineMg(0)).toBe(0);
      expect(estimateCoffeeCaffeineMg(-5)).toBe(0);
      // Immersion: 15 * 12 * 0.85 = 153.0
      expect(estimateCoffeeCaffeineMg(15, 'arabica', 'immersion')).toBe(153.0);
      // Cold brew: 15 * 12 * 0.92 = 165.6
      expect(estimateCoffeeCaffeineMg(15, 'arabica', 'cold_brew')).toBe(165.6);
    });

    it('estimateTeaInfusionCaffeineMg handles 5th+ infusions and invalid inputs', () => {
      expect(estimateTeaInfusionCaffeineMg(0, 1)).toBe(0);
      expect(estimateTeaInfusionCaffeineMg(100, 0)).toBe(0);
      expect(estimateTeaInfusionCaffeineMg(100, -1)).toBe(0);
      // 5th infusion: 0.40 * 0.55^4 * 100 = 3.7 mg
      expect(estimateTeaInfusionCaffeineMg(100, 5)).toBe(3.7);
      // 6th infusion: 0.40 * 0.55^5 * 100 = 2.0 mg
      expect(estimateTeaInfusionCaffeineMg(100, 6)).toBe(2.0);
    });

    it('calculateRemainingCaffeineMg edge cases', () => {
      expect(calculateRemainingCaffeineMg(0, 5)).toBe(0);
      expect(calculateRemainingCaffeineMg(100, -2)).toBe(0);
      expect(calculateRemainingCaffeineMg(100, 5, 0)).toBe(0);
    });

    it('calculateHoursUntilSafeCaffeine returns 0 when dose is already safe', () => {
      expect(calculateHoursUntilSafeCaffeine(20, 25)).toBe(0);
      expect(calculateHoursUntilSafeCaffeine(25, 25)).toBe(0);
    });

    it('diagnoseExtractionTaste handles isTooIntense, isAstringent, and empty input', () => {
      const intense = diagnoseExtractionTaste({ isTooIntense: true });
      expect(intense.length).toBe(1);
      expect(intense[0].issue).toContain('Zbyt ciężka');
      expect(intense[0].recommendationPl).toContain('Wydłuż ratio');

      const astringent = diagnoseExtractionTaste({ isAstringent: true });
      expect(astringent.length).toBe(1);
      expect(astringent[0].issue).toContain('Gorzka / sucha');

      const empty = diagnoseExtractionTaste({});
      expect(empty.length).toBe(0);
    });

    it('diagnoseTeaTaste oraz diagnoseExtractionTaste z beverageType=TEA poprawnie diagnozują błędy parzenia herbaty', () => {
      const { diagnoseTeaTaste } = require('../domain-rules');
      const scalded = diagnoseTeaTaste({ isScaldedOrCooked: true });
      expect(scalded.length).toBe(1);
      expect(scalded[0].issue).toContain('Poparzone liście');
      expect(scalded[0].tempAdjustment).toBe('lower');

      const bitter = diagnoseTeaTaste({ isBitterOrAstringent: true });
      expect(bitter.length).toBe(1);
      expect(bitter[0].issue).toContain('Nadmierna ściągająca cierpkość');
      expect(bitter[0].steepTimeAdjustmentSeconds).toBe(-10);

      const weak = diagnoseTeaTaste({ isWeakOrWatery: true });
      expect(weak.length).toBe(1);
      expect(weak[0].issue).toContain('Zbyt wodnisty');
      expect(weak[0].tempAdjustment).toBe('higher');

      // Wywołanie przez uniwersalny interfejs diagnoseExtractionTaste
      const viaExtraction = diagnoseExtractionTaste({
        beverageType: 'TEA',
        isScalded: true,
      });
      expect(viaExtraction.length).toBe(1);
      expect(viaExtraction[0].issue).toContain('Poparzone liście');
    });

    it('TASK-P5-07-JAK: rzuca błąd lub zwraca 0 dla wartości NaN oraz Infinity (IEEE-754 resilience)', () => {
      // calculateBrewWater, calculateBrewDose, calculateLiquidYield, calculateExtractionYield
      expect(() => calculateBrewWater(NaN, 16)).toThrow();
      expect(() => calculateBrewWater(15, Infinity)).toThrow();
      expect(() => calculateBrewDose(NaN, 16)).toThrow();
      expect(() => calculateBrewDose(250, Infinity)).toThrow();
      expect(() => calculateLiquidYield(NaN, 15)).toThrow();
      expect(() => calculateLiquidYield(250, NaN)).toThrow();
      expect(() => calculateLiquidYield(250, 15, Infinity)).toThrow();
      expect(() => calculateExtractionYield(NaN, 1.35, 15)).toThrow();
      expect(() => calculateExtractionYield(250, NaN, 15)).toThrow();
      expect(() => calculateExtractionYield(250, 1.35, Infinity)).toThrow();

      // calculateBrewRatio
      expect(calculateBrewRatio(NaN, 250)).toBe(0);
      expect(calculateBrewRatio(15, Infinity)).toBe(0);

      // Kofeina
      expect(estimateCoffeeCaffeineMg(NaN)).toBe(0);
      expect(estimateCoffeeCaffeineMg(Infinity)).toBe(0);
      expect(estimateTotalLeafCaffeineMg(NaN)).toBe(0);
      expect(estimateTotalLeafCaffeineMg(Infinity)).toBe(0);
      expect(estimateTeaInfusionCaffeineMg(NaN, 1)).toBe(0);
      expect(estimateTeaInfusionCaffeineMg(100, NaN)).toBe(0);
      expect(calculateRemainingCaffeineMg(NaN, 2)).toBe(0);
      expect(calculateRemainingCaffeineMg(100, NaN)).toBe(0);
      expect(calculateHoursUntilSafeCaffeine(NaN)).toBe(0);
      expect(calculateHoursUntilSafeCaffeine(100, NaN)).toBe(0);
      expect(calculateHoursUntilSafeCaffeine(100, 25, Infinity)).toBe(0);
    });
  });
});

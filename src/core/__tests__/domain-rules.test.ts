import {
  calculateBrewWater,
  calculateBrewDose,
  calculateLiquidYield,
  calculateExtractionYield,
  evaluateRestingWindow,
  estimateCoffeeCaffeineMg,
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

  describe('RD-07: Resting Window & Freshness', () => {
    const baseDate = new Date('2026-10-15T12:00:00Z');

    it('detects degassing phase (0-5 days)', () => {
      const roastDate = new Date('2026-10-13T12:00:00Z'); // 2 days
      const result = evaluateRestingWindow(roastDate, baseDate);
      expect(result.stage).toBe('degassing');
      expect(result.badgeColor).toBe('amber');
    });

    it('detects peak flavor phase (6-30 days)', () => {
      const roastDate = new Date('2026-10-01T12:00:00Z'); // 14 days
      const result = evaluateRestingWindow(roastDate, baseDate);
      expect(result.stage).toBe('peak');
      expect(result.badgeColor).toBe('green');
    });

    it('detects stable phase (31-60 days)', () => {
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
      expect(estimateTeaInfusionCaffeineMg(totalLeaf, 1)).toBe(45.0);
      expect(estimateTeaInfusionCaffeineMg(totalLeaf, 2)).toBe(30.0);
      expect(estimateTeaInfusionCaffeineMg(totalLeaf, 3)).toBe(15.0);
      expect(estimateTeaInfusionCaffeineMg(totalLeaf, 4)).toBe(5.0);
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
  });
});

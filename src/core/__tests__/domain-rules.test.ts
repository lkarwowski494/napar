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
  calculateCaffeineDecay,
  scaleRecipeDose,
} from '../domain-rules';

describe('Napar Domain Rules (RD-01…RD-30)', () => {
  describe('RD-01: Brew Ratio & Water Calculations', () => {
    it('calculates water correctly for 15g at 1:16 ratio', () => {
      expect(calculateBrewWater(15.0, 16.0)).toBe(240.0);
    });

    it('calculates water correctly for standard SCA ratio 1:16.67', () => {
      expect(calculateBrewWater(18.0, 16.67)).toBe(300.1);
    });

    it('calculates dose correctly for 500g water at 1:16.67 and clamps to maxDoseGrams', () => {
      expect(calculateBrewDose(500.0, 16.67)).toBe(30.0);
      expect(calculateBrewDose(10000.0, 5.0)).toBe(1000.0);
      expect(calculateBrewDose(10000.0, 5.0, 500.0)).toBe(500.0);
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

    it('TASK-P16-03-ZAK: evaluateRestingWindow bezpiecznie obsługuje brak lub uszkodzony format daty', () => {
      const empty = evaluateRestingWindow('');
      expect(empty.daysSinceRoast).toBe(0);
      expect(empty.badgeColor).toBe('gray');
      expect(empty.messageEn).toContain('freshness unknown');

      const corrupted = evaluateRestingWindow('invalid-date-string');
      expect(corrupted.daysSinceRoast).toBe(0);
      expect(corrupted.badgeColor).toBe('gray');
      expect(corrupted.messageEn).toContain('Invalid roast date');
    });
  });

  describe('RD-17 & RD-18: Caffeine Kinetics and Estimation', () => {
    it('estimates caffeine for filter Arabica correctly', () => {
      // 15g * 12 * 0.88 = 158.4 mg
      const caffeine = estimateCoffeeCaffeineMg(15.0, 'arabica', 'filter');
      expect(caffeine).toBe(158.4);

      // TASK-P17-07-JAK: normalizacja wielkości liter oraz clamp dozy
      const upperCase = estimateCoffeeCaffeineMg(15.0, 'ARABICA' as any, 'FILTER' as any);
      expect(upperCase).toBe(158.4);

      const robustaUpper = estimateCoffeeCaffeineMg(15.0, 'ROBUSTA' as any, 'espresso' as any);
      expect(robustaUpper).toBe(Number((15 * 22 * 0.75).toFixed(1)));

      const clamped = estimateCoffeeCaffeineMg(5000.0, 'arabica', 'filter');
      expect(clamped).toBe(Number((1000 * 12 * 0.88).toFixed(1)));
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

    it('TASK-P13-03-ZAK: calculateCaffeineDecay wylicza spadek stężenia i chroni przed NaN, ujemnymi godzinami oraz zerowym t_half', () => {
      expect(calculateCaffeineDecay(100.0, 5.0, 5.0)).toBe(50.0);
      expect(calculateCaffeineDecay(100.0, 10.0, 5.0)).toBe(25.0);
      expect(calculateCaffeineDecay(NaN, 5.0)).toBe(0);
      expect(calculateCaffeineDecay(100.0, -1.0)).toBe(0);
      expect(calculateCaffeineDecay(100.0, 5.0, 0)).toBe(0);
      expect(calculateCaffeineDecay(100.0, 5.0, -5.0)).toBe(0);
    });

    it('evaluates bedtime safety accurately', () => {
      // 120mg consumed 10h before bed -> 30mg remaining (above 25mg threshold)
      const unsafe = evaluateBedtimeCaffeine([{ doseMg: 120, hoursUntilBedtime: 10 }], 25.0);
      expect(unsafe.isSafeForSleep).toBe(false);
      expect(unsafe.messageEn).toContain('exceeds the 25 mg threshold');

      // 120mg consumed 15h before bed -> 15mg remaining (safe)
      const safe = evaluateBedtimeCaffeine([{ doseMg: 120, hoursUntilBedtime: 15 }], 25.0);
      expect(safe.isSafeForSleep).toBe(true);
      expect(safe.messageEn).toContain('is within the low sleep disruption threshold');

      // TASK-P12-03-ZAK: Odporność na nullish intakes i elementy z NaN/ujemnymi wartościami
      const nullEval = evaluateBedtimeCaffeine(null as any);
      expect(nullEval.isSafeForSleep).toBe(true);
      expect(nullEval.totalRemainingMg).toBe(0);

      const invalidEval = evaluateBedtimeCaffeine([null as any, { doseMg: 100, hoursUntilBedtime: NaN }] as any);
      expect(invalidEval.totalRemainingMg).toBe(0);
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
    it('calculateBrewRatio returns 0 on non-positive input and clamps to maxRatio', () => {
      expect(calculateBrewRatio(0, 250)).toBe(0);
      expect(calculateBrewRatio(15, 0)).toBe(0);
      expect(calculateBrewRatio(-5, -100)).toBe(0);
      expect(calculateBrewRatio(15, 250)).toBe(16.7);
      expect(calculateBrewRatio(0.1, 1000)).toBe(100.0);
      expect(calculateBrewRatio(0.1, 1000, 50.0)).toBe(50.0);
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

      // TASK-P14-03-ZAK: scaleRecipeDose i calculateBatchScaling chronione przed NaN
      expect(() => scaleRecipeDose([], NaN, 15)).toThrow();
      expect(() => scaleRecipeDose([], 15, NaN)).toThrow();
      expect(() => calculateBatchScaling(NaN, 250, 2)).toThrow();
      expect(() => calculateBatchScaling(15, NaN, 2)).toThrow();
      const scaledWithNanServings = calculateBatchScaling(15, 250, NaN);
      expect(scaledWithNanServings.multiplier).toBe(1);
      expect(scaledWithNanServings.scaledDoseGrams).toBe(15);
    });
  });

  describe('TASK-P19-03-ZAK: scaleRecipeDose clamp maxDoseGrams i sanitizacja ujemnych kroków', () => {
    it('clampuje dozę do maxDoseGrams gdy przekracza limit', () => {
      const steps = [
        { id: '1', name: 'Zalanie 1', waterGrams: 100, durationSeconds: 30 },
        { id: '2', name: 'Zalanie 2', waterGrams: 150, durationSeconds: 60 },
      ];
      const res = scaleRecipeDose(steps, 15, 2000, 1000);
      expect(res.newDoseGrams).toBe(1000);
      expect(res.multiplier).toBeCloseTo(1000 / 15, 2);
    });

    it('zabezpiecza przed ujemnymi krokami wody', () => {
      const steps = [
        { id: '1', name: 'Zalanie 1', waterGrams: -50, durationSeconds: 30 },
        { id: '2', name: 'Zalanie 2', waterGrams: 200, durationSeconds: 60 },
      ];
      const res = scaleRecipeDose(steps, 15, 30);
      expect(res.steps[0].waterGrams).toBe(0);
      expect(res.steps[1].waterGrams).toBeGreaterThan(0);
    });
  });

  describe('TASK-P20-03-ZAK: calculateExtractionYield clampuje skrajny TDS do maxTdsPercent', () => {
    it('clampuje TDS do 30% przy nierealistycznie wysokich wartościach', () => {
      const res = calculateExtractionYield(200, 85, 15);
      // TDS 85 zclampowane do 30% -> (200 * 30) / 15 = 400.0%
      expect(res.extractionYieldPercent).toBe(400);
      expect(res.rating).toBe('over');
    });
  });

  describe('TASK-P21-03-ZAK: calculateBrewWater clampuje masę wody do maxWaterGrams', () => {
    it('clampuje obliczoną objętość wody do domyślnego limitu 50000g', () => {
      const water = calculateBrewWater(5000, 20); // 100000g -> clamp do 50000.0g
      expect(water).toBe(50000.0);
    });

    it('akceptuje niestandardowy maxWaterGrams', () => {
      const water = calculateBrewWater(100, 16, 1200.0); // 1600g -> clamp do 1200.0g
      expect(water).toBe(1200.0);
    });
  });
  describe('TASK-P22-03-ZAK: calculateExtractionYield clampuje masę naparu do maxBeverageGrams', () => {
    it('clampuje objętość naparu do domyślnego limitu 50000g', () => {
      const res = calculateExtractionYield(100000, 1.5, 15);
      // beverageWeight 100000 clampowane do 50000g -> (50000 * 1.5) / 15 = 5000.0%
      expect(res.extractionYieldPercent).toBe(5000);
    });

    it('akceptuje niestandardowy maxBeverageGrams', () => {
      const res = calculateExtractionYield(2000, 1.5, 15, 30.0, 500.0);
      // beverageWeight 2000 clampowane do 500.0g -> (500 * 1.5) / 15 = 50.0%
      expect(res.extractionYieldPercent).toBe(50);
    });
  });
  describe('TASK-P23-03-ZAK: calculateLiquidYield clampuje współczynnik retencji do maxRetentionFactor', () => {
    it('clampuje retentionFactor do domyślnego limitu 10.0', () => {
      // 100g wody, 5g dozy, retentionFactor 50 clampowany do 10.0 -> 100 - (5 * 10) = 50.0g
      const yieldGrams = calculateLiquidYield(100.0, 5.0, 50.0);
      expect(yieldGrams).toBe(50.0);
    });

    it('akceptuje niestandardowy maxRetentionFactor', () => {
      // 100g wody, 10g dozy, retentionFactor 10 clampowany do 5.0 -> 100 - (10 * 5) = 50.0g
      const yieldGrams = calculateLiquidYield(100.0, 10.0, 10.0, 5.0);
      expect(yieldGrams).toBe(50.0);
    });
  });

  describe('TASK-P24-03-ZAK: calculateExtractionYield wspiera parametr maxEyPercent', () => {
    it('clampuje obliczony EY do zadanego fizycznego limitu (np. 100%)', () => {
      const res = calculateExtractionYield(1000, 2.0, 10, 30.0, 50000.0, 100.0);
      // (1000 * 2.0) / 10 = 200.0% -> clamp do 100.0%
      expect(res.extractionYieldPercent).toBe(100.0);
      expect(res.rating).toBe('over');
    });
  });

  describe('TASK-P25-03-ZAK: calculateBatchScaling clampuje doze i wode do limitow', () => {
    it('clampuje przeskalowana doze i wode przy niestandardowych limitach', () => {
      const res = calculateBatchScaling(50, 800, 4, 150.0, 2500.0);
      // 50 * 4 = 200g -> clamp do 150.0g
      // 800 * 4 = 3200g -> clamp do 2500.0g
      expect(res.scaledDoseGrams).toBe(150.0);
      expect(res.scaledWaterGrams).toBe(2500.0);
    });
  });

  describe('TASK-P26-03-ZAK: scaleRecipeDose waliduje steps i clampuje wode do maxWaterGrams', () => {
    it('rzuca blad dla nie-tablicy w parametrze steps', () => {
      expect(() => scaleRecipeDose(null as any, 15, 30)).toThrow('Doza musi być większa od zera');
    });

    it('clampuje targetWaterGrams do zadanego maxWaterGrams', () => {
      const steps = [
        { id: '1', name: 'Zalanie 1', waterGrams: 100, durationSeconds: 30 },
        { id: '2', name: 'Zalanie 2', waterGrams: 150, durationSeconds: 45 },
      ];
      const res = scaleRecipeDose(steps, 15, 300, 1000.0, 1000.0);
      // 250g * (300/15) = 5000g -> clamp do 1000g
      expect(res.targetWaterGrams).toBe(1000.0);
    });
  });

  describe('TASK-P27-03-ZAK: calculateBrewDose, calculateBrewWater oraz calculateBrewRatio odporne na NaN w clampach', () => {
    it('stosuje domyslne bezpieczne clampy przy przekazaniu NaN', () => {
      // 50000g / 1:1 = 50000g -> clamp do domyslnego 1000g
      expect(calculateBrewDose(50000, 1, NaN as any)).toBe(1000.0);
      // 10000g * 10 = 100000g -> clamp do domyslnego 50000g
      expect(calculateBrewWater(10000, 10, NaN as any)).toBe(50000.0);
      // 500g / 1g = 500.0 -> clamp do domyslnego 100.0
      expect(calculateBrewRatio(1, 500, NaN as any)).toBe(100.0);
    });
  });

  describe('TASK-P28-03-ZAK: evaluateRestingWindow traktuje whitespace jako brak daty, a calculateLiquidYield chroni przed -0', () => {
    it('zwraca brak daty palenia dla ciagu whitespace', () => {
      const res = evaluateRestingWindow('   ');
      expect(res.messagePl).toBe('Brak daty palenia — świeżość nieznana');
      expect(res.messageEn).toBe('No roast date — freshness unknown');
      expect(res.daysSinceRoast).toBe(0);
    });

    it('gwarantuje scisle 0 bez -0 dla calculateLiquidYield', () => {
      // woda 30g, doza 15g, retencja 2.0 -> 30 - 30 = 0
      const yieldGrams = calculateLiquidYield(30, 15, 2.0);
      expect(yieldGrams).toBe(0);
      expect(Object.is(yieldGrams, -0)).toBe(false);
    });
  });

  describe('TASK-P29-03-ZAK: estimateCoffeeCaffeineMg i estimateTotalLeafCaffeineMg parsuja stringi i chronia przed -0', () => {
    it('parsuje stringi jako dozy i oblicza prawidlowa kofeine dla kawy', () => {
      // 15g * 12 * 0.88 = 158.4 mg
      expect(estimateCoffeeCaffeineMg('15' as any, 'arabica', 'filter')).toBe(158.4);
      expect(estimateCoffeeCaffeineMg('15.0', 'arabica', 'filter')).toBe(158.4);
      expect(estimateCoffeeCaffeineMg('invalid' as any)).toBe(0);
    });

    it('parsuje stringi dla herbaty i chroni przed -0', () => {
      // 5g liści * 1000 * 0.03 = 150.0 mg
      expect(estimateTotalLeafCaffeineMg('5' as any)).toBe(150.0);
      expect(estimateTotalLeafCaffeineMg('0')).toBe(0);
      expect(Object.is(estimateTotalLeafCaffeineMg('0'), -0)).toBe(false);
      expect(Object.is(estimateCoffeeCaffeineMg(0), -0)).toBe(false);
    });
  });

  describe('TASK-P30-03-ZAK: evaluateBedtimeCaffeine defensywnie obsluguje puste i uszkodzone intakes oraz stringi', () => {
    it('zwraca bezpieczny status i 0 mg dla pustej tablicy intakes lub null', () => {
      const resEmpty = evaluateBedtimeCaffeine([]);
      expect(resEmpty.totalRemainingMg).toBe(0);
      expect(resEmpty.isSafeForSleep).toBe(true);

      const resNull = evaluateBedtimeCaffeine(null as any);
      expect(resNull.totalRemainingMg).toBe(0);
      expect(resNull.isSafeForSleep).toBe(true);
    });

    it('parsuje stringi dla dawek i godzin oraz chroni przed ujemnymi/NaN', () => {
      const intakes = [
        { doseMg: '100' as any, hoursUntilBedtime: '5' as any }, // 100mg * 0.5 = 50mg
        { doseMg: -20, hoursUntilBedtime: 2 }, // ignorowane
        { doseMg: NaN, hoursUntilBedtime: 1 }, // ignorowane
      ];
      const res = evaluateBedtimeCaffeine(intakes, 25.0, 5.0);
      expect(res.totalRemainingMg).toBe(50.0);
      expect(res.isSafeForSleep).toBe(false);
    });
  });
});

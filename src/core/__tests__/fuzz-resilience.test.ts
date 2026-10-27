// ============================================================================
// Napar (Steepwise) — Fuzz, Chaos & Resilience Engineering Tests
// Chaos injection, corrupted input payloads, boundary mutations & state machine fuzzing
// ============================================================================

import {
  calculateBrewRatio,
  calculateLiquidYield,
  calculateExtractionYield,
  calculateBrewWater,
  estimateCoffeeCaffeineMg,
  estimateTeaInfusionCaffeineMg,
  calculateRemainingCaffeineMg,
  calculateHoursUntilSafeCaffeine,
  calculateCaffeineDecay,
  calculateDoseForBeverageYield,
  calculateBypassBrew,
  calculateEspressoFlowRate,
  classifyEspressoFlowRate,
  evaluateBrewMatrix,
  evaluateEspressoRatio,
  evaluateColdBrewRatio,
  evaluatePourOverRatio,
} from '../domain-rules';
import {
  calculateWaterMinerals,
  classifyWaterHardness,
  classifyWaterHardnessFromFH,
  evaluateWaterSuitability,
  calculateWaterBlend,
  calculateHardnessRatio,
  calculateWaterDilution,
  estimateWaterTdsFromHardness,
  evaluateWaterAlkalinity,
} from '../water-chemistry';
import { BrewTimerEngine } from '../timer-engine';
import {
  convertMicronsToGrinder,
  findGrindCategoryForMicrons,
  findGrindCategoryById,
  getGrinderSettingForMethod,
  getGrindSettingsOverview,
  filterGrinders,
  estimateGrindFinesRisk,
  calculateGrinderAdjustment,
  estimateGrindDistribution,
} from '../grinder-converter';
import { calculateBrewCost, calculateTeaCost, formatPlnCost, formatCost } from '../cost-calculator';
import { formatRelativeDays } from '../i18n';
import {
  formatTemperature,
  formatWaterVolume,
  formatDoseWeight,
  formatWaterWeight,
  formatRatio,
  formatPressure,
  formatFlowRate,
  formatExtractionYield,
  formatTdsPercentage,
  formatWaterHardness,
  formatParticleSize,
  wInKeep,
} from '../unit-converter';
import {
  searchKnowledgeBase,
  findKnowledgeItemById,
  getKnowledgeSummaryCounts,
  getTeaBrewingGuide,
  getCoffeeVarietyGuide,
  getCoffeeProcessGuide,
} from '../knowledge-data';
import { groupActionsByDate, getActionScheduleCounts, searchProactiveActions, getProactiveActionById } from '../bpr-engine';
import { filterBackupEnvelope, diffBackupEnvelopes, mergeBackupEnvelopes, getBackupRecordCounts, isBackupEmpty } from '../backup';
import { getSubscriptionBadgeInfo, getPaywallCallToAction } from '../app-access';
import { importDataJson, filterInventoryItems, calculateInventorySummary, getLowStockInventoryItems } from '../database';
import { extractSearchSnippet } from '../search-utils';

const mockDb: any = {
  inventory: new Map(),
  recipes: new Map(),
  sessions: new Map(),
  caffeine: new Map(),
  execSync: jest.fn(),
  getFirstSync: jest.fn(),
  getAllSync: jest.fn(() => []),
  runSync: jest.fn(),
};

jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn(() => mockDb),
}));

describe('Chaos & Fuzzing: Extraction Mathematics & Physical Limits', () => {
  test('Chaos 1: Ekstremalne, ujemne i zmutowane liczby w kalkulatorze proporcji i uzysku', () => {
    const extremeNumbers = [
      -100000, -1, -0.0001, 0, 0.00001, 1e-10, 1e8, NaN, Infinity, -Infinity,
    ];

    for (const dose of extremeNumbers) {
      for (const water of extremeNumbers) {
        // Funkcja musi albo zwrócić bezpieczną liczbę >= 0, albo rzucić jawny Error — nigdy nie może zawiesić wątku
        try {
          const ratio = calculateBrewRatio(dose, water);
          expect(typeof ratio).toBe('number');
          expect(!isNaN(ratio) || ratio === 0).toBe(true);
        } catch (err: any) {
          expect(err).toBeInstanceOf(Error);
        }

        try {
          const liquid = calculateLiquidYield(water, dose);
          expect(typeof liquid).toBe('number');
          expect(!isNaN(liquid)).toBe(true);
        } catch (err: any) {
          expect(err).toBeInstanceOf(Error);
        }
      }
    }
  });

  test('Chaos 2: Fuzzing kalkulatora Extraction Yield (TDS / EY%) losowymi danymi', () => {
    for (let i = 0; i < 500; i++) {
      const water = (Math.random() - 0.5) * 1000;
      const tds = (Math.random() - 0.5) * 10;
      const dose = (Math.random() - 0.5) * 100;

      if (water <= 0 || tds <= 0 || dose <= 0) {
        expect(() => calculateExtractionYield(water, tds, dose)).toThrow();
      } else {
        const res = calculateExtractionYield(water, tds, dose);
        expect(res.extractionYieldPercent).toBeGreaterThanOrEqual(0);
        expect(isNaN(res.extractionYieldPercent)).toBe(false);
        expect(['under', 'ideal', 'over']).toContain(res.rating);
      }
    }
  });

  test('Chaos 3: Fuzzing kalkulatora mineralizacji wody z ujemnymi i skrajnymi twardościami', () => {
    for (let i = 0; i < 200; i++) {
      const vol = (Math.random() - 0.2) * 50;
      const gh = (Math.random() - 0.2) * 1000;
      const kh = (Math.random() - 0.2) * 1000;

      const res = calculateWaterMinerals(vol, gh, kh);
      expect(res.waterVolumeLiters).toBeGreaterThanOrEqual(0.1);
      expect(res.targetGhPpm).toBeGreaterThanOrEqual(0);
      expect(res.targetKhPpm).toBeGreaterThanOrEqual(0);
      expect(isNaN(res.concentrateBufferGrams)).toBe(false);
      expect(isNaN(res.concentrateHardnessGrams)).toBe(false);
    }
  });

  test('Chaos 4: Fuzzing konwertera mikronów losowymi wielkościami cząstek', () => {
    for (let i = 0; i < 300; i++) {
      const randomMicrons = (Math.random() - 0.2) * 5000;
      const res = convertMicronsToGrinder(randomMicrons, 'comandante_c40');

      expect(res.rawValue).toBeGreaterThanOrEqual(5);
      expect(res.rawValue).toBeLessThanOrEqual(45);
      expect(res.formatted).toMatch(/\d+\s+(klików|clicks)/);
    }
  });
});

describe('Chaos & Resilience: BrewTimerEngine State Machine Fuzzing', () => {
  test('Chaos 5: 1 000 losowych operacji na silniku timera bez wycieków i zawieszeń stanu', () => {
    const engine = new BrewTimerEngine([
      { stepNumber: 1, namePl: 'Blooming', durationSeconds: 30, targetWaterGrams: 50, instructionPl: 'Preinfuzja' },
      { stepNumber: 2, namePl: 'Pour 2', durationSeconds: 60, targetWaterGrams: 150, instructionPl: 'Dolewka' },
      { stepNumber: 3, namePl: 'Finisz', durationSeconds: 45, targetWaterGrams: 250, instructionPl: 'Spływ' },
    ]);

    const operations = ['start', 'pause', 'resume', 'reset', 'nextStep', 'previousStep', 'finish'];

    for (let i = 0; i < 1000; i++) {
      const op = operations[Math.floor(Math.random() * operations.length)];
      switch (op) {
        case 'start':
          engine.start();
          break;
        case 'pause':
          engine.pause();
          break;
        case 'resume':
          engine.resume();
          break;
        case 'reset':
          engine.reset();
          break;
        case 'nextStep':
          engine.nextStep();
          break;
        case 'previousStep':
          engine.previousStep();
          break;
        case 'finish':
          engine.finish();
          break;
      }

      // Po każdej losowej operacji stan musi być spójny i niezmienny w strukturze
      const snap = engine.getSnapshot();
      expect(['idle', 'running', 'paused', 'finished']).toContain(snap.status);
      expect(snap.currentStepIndex).toBeGreaterThanOrEqual(0);
      expect(snap.currentStepIndex).toBeLessThanOrEqual(3);
      expect(snap.totalElapsedSeconds).toBeGreaterThanOrEqual(0);
      expect(snap.stepProgress).toBeGreaterThanOrEqual(0);
    }

    engine.destroy();
  });
});

describe('Chaos & Mutation: Corrupted Backup Payloads & Malformed JSON', () => {
  test('Chaos 6: 100 zmutowanych i obciętych ciągów JSON podczas importu kopii zapasowej', () => {
    const validJson = JSON.stringify({
      version: 1,
      inventory: [{ id: 'bean-1', name: 'Etiopia' }],
      customRecipes: [],
      sessions: [],
      caffeineLogs: [],
    });

    const malformedPayloads = [
      '',
      '{',
      '{"version": 1',
      '{"version": 2}',
      '{"version": -1}',
      '{"version": "1"}',
      'null',
      'undefined',
      '12345',
      '[1, 2, 3]',
      '{"version": 1, "inventory": "not an array"}',
      '{"version": 1, "inventory": null}',
      validJson.slice(0, 15),
      validJson.slice(0, 35),
      validJson + ' extra junk',
      '{"version": 1, "inventory": [{"id": null, "name": 123}]}',
      '{"version": 1, "inventory": [\u0000\u0001\u0002]}',
    ];

    for (const payload of malformedPayloads) {
      try {
        importDataJson(payload);
      } catch (err: any) {
        // Import musi bezpiecznie odrzucić błędem z komunikatem, bez niekontrolowanego unhandled crasha
        expect(err).toBeInstanceOf(Error);
      }
    }
  });

  test('Chaos 7: Fuzzing kinetyki kofeiny z mutacjami, NaN, Infinity i skrajnymi okresami poltrwania (TASK-P58-12-NIE)', () => {
    const extremeMg = [-1000, -0, 0, 0.0001, 100, 5000, 1e8, NaN, Infinity, -Infinity, '150mg', '200,5 mg', 'invalid'];
    const extremeHours = [-24, -0, 0, 1, 5, 24, 72, 1000, NaN, Infinity, -Infinity, '5,5h', '12 hours'];
    const extremeHalfLives = [-10, -0, 0, 0.001, 3, 5, 12, 100, NaN, Infinity, -Infinity, '5,0'];

    for (const mg of extremeMg) {
      for (const hrs of extremeHours) {
        for (const hl of extremeHalfLives) {
          const rem = calculateRemainingCaffeineMg(mg as any, hrs as any, hl as any);
          expect(typeof rem).toBe('number');
          expect(!Number.isNaN(rem)).toBe(true);
          expect(rem).toBeGreaterThanOrEqual(0);
          expect(Object.is(rem, -0)).toBe(false);

          const decay = calculateCaffeineDecay(mg as any, hrs as any, hl as any);
          expect(typeof decay).toBe('number');
          expect(!Number.isNaN(decay)).toBe(true);
          expect(decay).toBeGreaterThanOrEqual(0);
          expect(Object.is(decay, -0)).toBe(false);
        }
      }
    }

    // calculateHoursUntilSafeCaffeine
    for (const mg of extremeMg) {
      const hours = calculateHoursUntilSafeCaffeine(mg as any);
      expect(typeof hours).toBe('number');
      expect(!Number.isNaN(hours)).toBe(true);
      expect(hours).toBeGreaterThanOrEqual(0);
      expect(Object.is(hours, -0)).toBe(false);
    }
  });

  test('Chaos 8: Fuzzing klasyfikacji twardosci wody z ekstremalnymi wartosciami, jednostkami i przecinkami (TASK-P58-12-NIE)', () => {
    const extremeHardness = [-500, -0, 0, 15, 75, 150, 250, 600, 1e6, NaN, Infinity, -Infinity, '50 ppm', '150,5 ppm', '25,5 °fH', 'invalid'];

    for (const h of extremeHardness) {
      const ppmClass = classifyWaterHardness(h as any);
      expect(['VERY_SOFT', 'SOFT', 'MODERATELY_HARD', 'HARD', 'VERY_HARD']).toContain(ppmClass);

      const fhClass = classifyWaterHardnessFromFH(h as any);
      expect(['VERY_SOFT', 'SOFT', 'MODERATELY_HARD', 'HARD', 'VERY_HARD']).toContain(fhClass);
    }
  });

  test('Chaos 9: Fuzzing kalkulatora kosztów (kawa, herbata, formatowanie PLN) z mutacjami brzegowymi (TASK-P61-12-NIE)', () => {
    const extremeNumbers = [-5000, -0, 0, 0.001, 15, 250, 1e6, NaN, Infinity, -Infinity];

    for (const dose of extremeNumbers) {
      for (const price of extremeNumbers) {
        const brew = calculateBrewCost({
          doseGrams: dose,
          beanPricePerKg: price,
        });
        expect(Number.isFinite(brew.totalHomeCost)).toBe(true);
        expect(brew.totalHomeCost).toBeGreaterThanOrEqual(0);
        expect(Object.is(brew.totalHomeCost, -0)).toBe(false);
        expect(brew.savingsPercent).toBeLessThanOrEqual(100);
        expect(brew.savingsPercent).toBeGreaterThanOrEqual(0);

        const tea = calculateTeaCost({
          leafGrams: dose,
          teaPricePer100g: price,
          infusionsCount: dose > 0 && dose < 20 ? dose : undefined,
        });
        expect(Number.isFinite(tea.totalSessionCost)).toBe(true);
        expect(tea.totalSessionCost).toBeGreaterThanOrEqual(0);
        expect(Object.is(tea.totalSessionCost, -0)).toBe(false);
        expect(tea.costPerInfusion).toBeGreaterThanOrEqual(0);
        expect(tea.savingsPercent).toBeLessThanOrEqual(100);
        expect(tea.savingsPercent).toBeGreaterThanOrEqual(0);
      }
    }

    const extremeFormatInputs = [-100, -0, 0, 0.05, 123.456, NaN, Infinity, -Infinity, null, undefined, '4,50 zł', 'invalid'];
    for (const val of extremeFormatInputs) {
      const formatted = formatPlnCost(val as any);
      expect(typeof formatted).toBe('string');
      expect(formatted).toContain('zł');
      expect(formatted).not.toContain('NaN');
      expect(formatted).not.toContain('-0');
    }
  });

  test('Chaos 10: Fuzzing modułów konwersji jednostek i przemiału z mutacjami brzegowymi (TASK-P63-12-NIE)', () => {
    const corruptInputs = [
      -1000, -0, 0, 0.0001, 15.5, 93.3, 500, 1500, 100000, NaN, Infinity, -Infinity,
      '', '   ', '\uFEFF93.5', '100°C', '212°F', '15,5 g', '250,0 ml', 'invalid',
      null, undefined, true, false, {}, [], () => {},
    ];

    for (const val of corruptInputs) {
      // 1. formatTemperature
      const tempMetric = formatTemperature(val as any, 'metric');
      expect(typeof tempMetric).toBe('string');
      expect(tempMetric.endsWith('°C')).toBe(true);
      expect(tempMetric).not.toContain('NaN');
      expect(tempMetric).not.toContain('-0');

      const tempImp = formatTemperature(val as any, 'imperial');
      expect(typeof tempImp).toBe('string');
      expect(tempImp.endsWith('°F')).toBe(true);
      expect(tempImp).not.toContain('NaN');
      expect(tempImp).not.toContain('-0');

      // 2. formatWaterVolume
      const volMetric = formatWaterVolume(val as any, 'metric');
      expect(typeof volMetric).toBe('string');
      expect(volMetric.endsWith('ml')).toBe(true);
      expect(volMetric).not.toContain('NaN');
      expect(volMetric).not.toContain('-0');

      // 3. formatDoseWeight & formatWaterWeight
      const dose = formatDoseWeight(val as any, 'metric');
      expect(typeof dose).toBe('string');
      expect(dose.endsWith('g')).toBe(true);

      const water = formatWaterWeight(val as any, 'metric');
      expect(typeof water).toBe('string');
      expect(water.endsWith('g')).toBe(true);

      // 4. findGrindCategoryForMicrons
      const cat = findGrindCategoryForMicrons(val as any);
      expect(cat).toBeDefined();
      expect(typeof cat.id).toBe('string');
      expect(cat.micronMin).toBeGreaterThan(0);
      expect(cat.micronMax).toBeGreaterThan(cat.micronMin);

      // 5. wInKeep
      const keepVal = wInKeep(val as any, 'g', 15.0);
      expect(typeof keepVal).toBe('number');
      expect(Number.isFinite(keepVal)).toBe(true);
      expect(Object.is(keepVal, -0)).toBe(false);
    }
  });

  test('Chaos 11: Fuzzing formatCost, formatRelativeDays, calculateDoseForBeverageYield i metod BrewTimerEngine (TASK-P65-12-NIE)', () => {
    const corruptInputs = [
      -100000, -1, -0, 0, 0.0001, 15.5, 250, 10000, NaN, Infinity, -Infinity,
      '', '   ', '\uFEFF15.5', '185,5', '3.50 zł', 'invalid', null, undefined,
      true, false, {}, [], () => {},
    ];

    for (const val of corruptInputs) {
      // 1. formatCost
      for (const cur of ['PLN', 'EUR', 'USD', 'GBP', val]) {
        const costStr = formatCost(val as any, cur as any);
        expect(typeof costStr).toBe('string');
        expect(costStr).not.toContain('NaN');
        expect(costStr).not.toContain('-0');
      }

      // 2. formatRelativeDays
      for (const lang of ['pl', 'en', val]) {
        const relStr = formatRelativeDays(val as any, lang as any);
        expect(typeof relStr).toBe('string');
        expect(relStr).not.toContain('NaN');
        expect(relStr).not.toContain('-0');
      }

      // 3. calculateDoseForBeverageYield
      const yieldRes = calculateDoseForBeverageYield(val as any, 16.0, 2.0);
      expect(yieldRes).toBeDefined();
      expect(typeof yieldRes.doseGrams).toBe('number');
      expect(typeof yieldRes.waterGrams).toBe('number');
      expect(typeof yieldRes.beverageGrams).toBe('number');
      expect(Number.isFinite(yieldRes.doseGrams)).toBe(true);
      expect(Number.isFinite(yieldRes.waterGrams)).toBe(true);
      expect(Number.isFinite(yieldRes.beverageGrams)).toBe(true);
      expect(Object.is(yieldRes.doseGrams, -0)).toBe(false);
      expect(Object.is(yieldRes.waterGrams, -0)).toBe(false);
      expect(Object.is(yieldRes.beverageGrams, -0)).toBe(false);

      // 4. BrewTimerEngine static methods
      const dur = BrewTimerEngine.calculateTotalRecipeDuration(val as any);
      expect(typeof dur).toBe('number');
      expect(Number.isFinite(dur)).toBe(true);
      expect(dur).toBeGreaterThanOrEqual(0);
      expect(Object.is(dur, -0)).toBe(false);

      const water = BrewTimerEngine.calculateTotalTargetWater(val as any);
      expect(typeof water).toBe('number');
      expect(Number.isFinite(water)).toBe(true);
      expect(water).toBeGreaterThanOrEqual(0);
      expect(Object.is(water, -0)).toBe(false);
    }
  });

  test('Chaos 12: Fuzzing searchKnowledgeBase, evaluateWaterSuitability, getGrinderSettingForMethod, formatRatio/Pressure, calculateBypassBrew (TASK-P68-12-NIE)', () => {
    const corruptInputs = [
      -100000, -1, -0, 0, 0.0001, 15.5, 250, 10000, NaN, Infinity, -Infinity,
      '', '   ', '\uFEFFtest', '185,5', '3.50 bar', 'invalid', null, undefined,
      true, false, {}, [], () => {},
    ];

    for (const val of corruptInputs) {
      // 1. searchKnowledgeBase
      const searchRes = searchKnowledgeBase(val as any);
      expect(Array.isArray(searchRes)).toBe(true);
      for (const item of searchRes) {
        expect(typeof item.id).toBe('string');
        expect(typeof item.title).toBe('string');
        expect(typeof item.category).toBe('string');
      }

      // 2. evaluateWaterSuitability
      for (const bev of ['coffee', 'tea', val]) {
        const evalRes = evaluateWaterSuitability(val as any, val as any, bev as any);
        expect(evalRes).toBeDefined();
        expect(typeof evalRes.suitability).toBe('string');
        expect(typeof evalRes.ratingPl).toBe('string');
        expect(typeof evalRes.ratingEn).toBe('string');
        expect(typeof evalRes.verdictPl).toBe('string');
        expect(typeof evalRes.verdictEn).toBe('string');
      }

      // 3. getGrinderSettingForMethod
      const grindRes = getGrinderSettingForMethod(val as any, val as any, val as any);
      expect(grindRes).toBeDefined();
      expect(typeof grindRes.formatted).toBe('string');
      expect(typeof grindRes.microns).toBe('number');
      expect(Number.isFinite(grindRes.microns)).toBe(true);
      expect(Number.isFinite(grindRes.clicks)).toBe(true);

      // 4. formatRatio & formatPressure
      const ratioStr = formatRatio(val as any);
      expect(typeof ratioStr).toBe('string');
      expect(ratioStr).not.toContain('NaN');
      expect(ratioStr).not.toContain('-0');

      const pressStr = formatPressure(val as any);
      expect(typeof pressStr).toBe('string');
      expect(pressStr).not.toContain('NaN');
      expect(pressStr).not.toContain('-0');

      // 5. calculateBypassBrew resilience on faulty inputs
      try {
        const bypassRes = calculateBypassBrew(val as any);
        expect(bypassRes).toBeDefined();
        expect(typeof bypassRes.concentrateDoseGrams).toBe('number');
        expect(typeof bypassRes.bypassWaterGrams).toBe('number');
      } catch (err: any) {
        expect(err instanceof Error).toBe(true);
      }
    }
  });

  test('Chaos 13: Fuzzing groupActionsByDate, filterBackupEnvelope, findKnowledgeItemById, calculateWaterBlend, getGrindSettingsOverview, formatFlowRate, calculateRemainingRecipeTime, calculateEspressoFlowRate (TASK-P70-12-NIE)', () => {
    const corruptInputs = [
      -100000, -1, -0, 0, 0.0001, 1.33, 15.5, 250, 10000, NaN, Infinity, -Infinity,
      '', '   ', '\uFEFFtest', '36,0', '1.33 g/s', 'invalid', null, undefined,
      true, false, {}, [], () => {},
    ];

    for (const val of corruptInputs) {
      // 1. groupActionsByDate
      const grouped = groupActionsByDate(val as any);
      expect(typeof grouped).toBe('object');
      expect(grouped).not.toBeNull();

      // 2. filterBackupEnvelope
      try {
        const filtered = filterBackupEnvelope(val as any);
        expect(typeof filtered).toBe('object');
      } catch (err: any) {
        expect(err instanceof Error).toBe(true);
      }

      // 3. findKnowledgeItemById
      const match = findKnowledgeItemById(val as any);
      if (match) {
        expect(typeof match.id).toBe('string');
        expect(typeof match.category).toBe('string');
      } else {
        expect(match).toBeNull();
      }

      // 4. calculateWaterBlend
      try {
        const blend = calculateWaterBlend(val as any);
        expect(typeof blend).toBe('object');
        expect(typeof blend.effectiveHardnessPpm).toBe('number');
      } catch (err: any) {
        expect(err instanceof Error).toBe(true);
      }

      // 5. getGrindSettingsOverview
      const overview = getGrindSettingsOverview(val as any);
      expect(Array.isArray(overview)).toBe(true);
      expect(overview.length).toBeGreaterThan(0);

      // 6. formatFlowRate
      const flowStr = formatFlowRate(val as any);
      expect(typeof flowStr).toBe('string');
      expect(flowStr).toContain('g/s');
      expect(flowStr).not.toContain('NaN');
      expect(flowStr).not.toContain('-0');

      // 7. calculateRemainingRecipeTime
      const remTime = BrewTimerEngine.calculateRemainingRecipeTime(val as any, val as any, val as any);
      expect(typeof remTime).toBe('number');
      expect(remTime).toBeGreaterThanOrEqual(0);
      expect(Number.isFinite(remTime)).toBe(true);

      // 8. calculateEspressoFlowRate & classifyEspressoFlowRate
      const flowRate = calculateEspressoFlowRate(val as any, val as any);
      expect(typeof flowRate).toBe('number');
      expect(flowRate).toBeGreaterThanOrEqual(0);
      expect(Number.isFinite(flowRate)).toBe(true);

      const flowClass = classifyEspressoFlowRate(val as any);
      expect(typeof flowClass.status).toBe('string');
      expect(typeof flowClass.labelPl).toBe('string');
      expect(typeof flowClass.labelEn).toBe('string');
      expect(typeof flowClass.flowRateGps).toBe('number');
    }
  });

  test('Chaos 14: Fuzzing getSubscriptionBadgeInfo, filterInventoryItems, getActionScheduleCounts, diffBackupEnvelopes, getKnowledgeSummaryCounts, calculateHardnessRatio, filterGrinders, formatExtractionYield, calculateStepWaterIncrement, evaluateBrewMatrix (TASK-P73-12-NIE)', () => {
    const corruptInputs = [
      -100000, -1, -0, 0, 0.0001, 1.33, 15.5, 250, 10000, NaN, Infinity, -Infinity,
      '', '   ', '\uFEFFtest', '20,5%', '1.5', 'invalid', null, undefined,
      true, false, {}, [], () => {},
    ];

    for (const val of corruptInputs) {
      // 1. getSubscriptionBadgeInfo
      const badge = getSubscriptionBadgeInfo(val as any, val as any);
      expect(typeof badge).toBe('object');
      expect(typeof badge.badgeLabel).toBe('string');
      expect(typeof badge.badgeVariant).toBe('string');
      expect(typeof badge.isPro).toBe('boolean');

      // 2. filterInventoryItems
      const invFiltered = filterInventoryItems(val as any, val as any);
      expect(Array.isArray(invFiltered)).toBe(true);

      // 3. getActionScheduleCounts
      const scheduleCounts = getActionScheduleCounts(val as any);
      expect(typeof scheduleCounts.total).toBe('number');
      expect(typeof scheduleCounts.today).toBe('number');
      expect(typeof scheduleCounts.byBadgeColor).toBe('object');

      // 4. diffBackupEnvelopes
      const backupDiff = diffBackupEnvelopes(val as any, val as any);
      expect(typeof backupDiff.isIdentical).toBe('boolean');
      expect(typeof backupDiff.inventory.delta).toBe('number');

      // 5. getKnowledgeSummaryCounts
      const summaryCounts = getKnowledgeSummaryCounts();
      expect(typeof summaryCounts.totalEntries).toBe('number');
      expect(summaryCounts.totalEntries).toBeGreaterThan(0);

      // 6. calculateHardnessRatio
      const hardnessRatio = calculateHardnessRatio(val as any, val as any);
      expect(typeof hardnessRatio.ratio).toBe('number');
      expect(typeof hardnessRatio.category).toBe('string');
      expect(typeof hardnessRatio.descriptionPl).toBe('string');

      // 7. filterGrinders
      const grinders = filterGrinders(val as any, val as any);
      expect(Array.isArray(grinders)).toBe(true);

      // 8. formatExtractionYield
      const eyStr = formatExtractionYield(val as any);
      expect(typeof eyStr).toBe('string');
      expect(eyStr).toContain('%');
      expect(eyStr).not.toContain('NaN');
      expect(eyStr).not.toContain('-0');

      // 9. calculateStepWaterIncrement
      const stepWater = BrewTimerEngine.calculateStepWaterIncrement(val as any, val as any);
      expect(typeof stepWater).toBe('number');
      expect(stepWater).toBeGreaterThanOrEqual(0);
      expect(Number.isFinite(stepWater)).toBe(true);

      // 10. evaluateBrewMatrix
      const brewMatrix = evaluateBrewMatrix(val as any, val as any);
      expect(typeof brewMatrix.quadrant).toBe('string');
      expect(typeof brewMatrix.labelPl).toBe('string');
      expect(typeof brewMatrix.recommendationPl).toBe('string');
    }
  });

  test('Chaos 15: Fuzzing evaluateEspressoRatio, calculateWaterDilution, estimateGrindFinesRisk, formatTdsPercentage, getTeaBrewingGuide, mergeBackupEnvelopes, BrewTimerEngine.calculateTotalTargetWater (TASK-P75-12-NIE)', () => {
    const corruptInputs = [
      -100000, -1, -0, 0, 0.0001, 1.35, 18.0, 36.0, 250, 10000, NaN, Infinity, -Infinity,
      '', '   ', '\uFEFFtest', '1,35%', '18,5', 'invalid', null, undefined,
      true, false, {}, [], () => {},
    ];

    for (const val of corruptInputs) {
      // 1. evaluateEspressoRatio
      const espressoEval = evaluateEspressoRatio(val as any, val as any);
      expect(typeof espressoEval).toBe('object');
      expect(typeof espressoEval.ratio).toBe('number');
      expect(typeof espressoEval.ratioFormatted).toBe('string');
      expect(typeof espressoEval.style).toBe('string');
      expect(typeof espressoEval.styleLabelPl).toBe('string');

      // 2. calculateWaterDilution
      const dilution = calculateWaterDilution(val as any, val as any, val as any, val as any);
      expect(typeof dilution).toBe('object');
      expect(typeof dilution.sourceVolumeMl).toBe('number');
      expect(typeof dilution.diluentVolumeMl).toBe('number');
      expect(typeof dilution.totalVolumeMl).toBe('number');
      expect(typeof dilution.isDilutionNeeded).toBe('boolean');

      // 3. estimateGrindFinesRisk
      const finesRisk = estimateGrindFinesRisk(val as any, val as any, val as any);
      expect(typeof finesRisk).toBe('object');
      expect(typeof finesRisk.finesRiskScore).toBe('number');
      expect(typeof finesRisk.riskLevel).toBe('string');
      expect(typeof finesRisk.cloggingRiskDescriptionPl).toBe('string');

      // 4. formatTdsPercentage
      const tdsStr = formatTdsPercentage(val as any);
      expect(typeof tdsStr).toBe('string');
      expect(tdsStr).toContain('%');
      expect(tdsStr).not.toContain('NaN');
      expect(tdsStr).not.toContain('-0');

      // 5. getTeaBrewingGuide
      const teaGuide = getTeaBrewingGuide(val as any, val as any);
      expect(teaGuide === null || typeof teaGuide === 'object').toBe(true);

      // 6. mergeBackupEnvelopes
      try {
        const mergedBackup = mergeBackupEnvelopes(val as any, val as any, val as any);
        expect(typeof mergedBackup).toBe('object');
        expect(typeof mergedBackup.state).toBe('object');
      } catch (err: any) {
        expect(err).toBeInstanceOf(Error);
      }

      // bezpieczne łączenie z zmutowaną zawartością wewnątrz obiektu
      const objMerged = mergeBackupEnvelopes(
        { state: { inventory: [val as any] } } as any,
        { state: { inventory: [val as any] } } as any
      );
      expect(typeof objMerged).toBe('object');
      expect(typeof objMerged.state).toBe('object');

      // 7. BrewTimerEngine.calculateTotalTargetWater & calculateRemainingWaterToPour
      const totalWater = BrewTimerEngine.calculateTotalTargetWater(val as any);
      expect(typeof totalWater).toBe('number');
      expect(totalWater).toBeGreaterThanOrEqual(0);
      expect(Number.isFinite(totalWater)).toBe(true);

      const remWater = BrewTimerEngine.calculateRemainingWaterToPour(val as any, val as any);
      expect(typeof remWater).toBe('number');
      expect(remWater).toBeGreaterThanOrEqual(0);
      expect(Number.isFinite(remWater)).toBe(true);
    }
  });

  test('Chaos 16: Fuzzing evaluateColdBrewRatio, estimateWaterTdsFromHardness, calculateGrinderAdjustment, formatWaterHardness, BrewTimerEngine.calculateWaterPourProgress, getCoffeeVarietyGuide, searchProactiveActions, getBackupRecordCounts, calculateInventorySummary (TASK-P77-12-NIE)', () => {
    const corruptInputs = [
      -100000, -1, -0, 0, 0.0001, 10.0, 50.0, 150, 720, 2000, 10000, NaN, Infinity, -Infinity,
      '', '   ', '\uFEFFtest', '10 °dH', '150,5 ppm', 'invalid', null, undefined,
      true, false, {}, [], () => {},
    ];

    for (const val of corruptInputs) {
      // 1. evaluateColdBrewRatio
      const coldBrewEval = evaluateColdBrewRatio(val as any, val as any);
      expect(typeof coldBrewEval).toBe('object');
      expect(typeof coldBrewEval.ratio).toBe('number');
      expect(typeof coldBrewEval.style).toBe('string');
      expect(typeof coldBrewEval.styleLabelPl).toBe('string');
      expect(typeof coldBrewEval.ratioFormatted).toBe('string');

      // 2. estimateWaterTdsFromHardness
      const tdsEst = estimateWaterTdsFromHardness(val as any, val as any);
      expect(typeof tdsEst).toBe('object');
      expect(typeof tdsEst.estimatedTdsPpm).toBe('number');
      expect(typeof tdsEst.estimatedEcMicroSiemens).toBe('number');
      expect(typeof tdsEst.category).toBe('string');

      // 3. calculateGrinderAdjustment
      const grindAdj = calculateGrinderAdjustment(val as any, val as any, val as any);
      expect(typeof grindAdj).toBe('object');
      expect(typeof grindAdj.clickDelta).toBe('number');
      expect(typeof grindAdj.direction).toBe('string');
      expect(typeof grindAdj.recommendationPl).toBe('string');

      // 4. formatWaterHardness
      const hardStr = formatWaterHardness(val as any, val as any);
      expect(typeof hardStr).toBe('string');
      expect(hardStr).not.toContain('NaN');
      expect(hardStr).not.toContain('-0');

      // 5. BrewTimerEngine.calculateWaterPourProgress
      const pourProgress = BrewTimerEngine.calculateWaterPourProgress(val as any, val as any);
      expect(typeof pourProgress).toBe('number');
      expect(pourProgress).toBeGreaterThanOrEqual(0);
      expect(pourProgress).toBeLessThanOrEqual(100);

      // 6. getCoffeeVarietyGuide
      const varietyGuide = getCoffeeVarietyGuide(val as any);
      expect(varietyGuide === null || typeof varietyGuide === 'object').toBe(true);

      // 7. searchProactiveActions
      const actions = searchProactiveActions(val as any, val as any);
      expect(Array.isArray(actions)).toBe(true);

      // 8. getBackupRecordCounts
      const backupCounts = getBackupRecordCounts(val as any);
      expect(typeof backupCounts).toBe('object');
      expect(typeof backupCounts.totalRecords).toBe('number');

      // 9. calculateInventorySummary
      const invSummary = calculateInventorySummary(val as any);
      expect(typeof invSummary).toBe('object');
      expect(typeof invSummary.totalWeightGrams).toBe('number');
    }
  });

  test('Chaos 17: Fuzzing evaluatePourOverRatio, evaluateWaterAlkalinity, estimateGrindDistribution, formatParticleSize, getCoffeeProcessGuide, BrewTimerEngine.calculateStepTimeWindow, extractSearchSnippet, getPaywallCallToAction, isBackupEmpty, getProactiveActionById, getLowStockInventoryItems (TASK-P80-12-NIE)', () => {
    const corruptInputs = [
      -100000, -1, -0, 0, 0.0001, 15.0, 40.0, 150, 750, 2000, 10000, NaN, Infinity, -Infinity,
      '', '   ', '\uFEFFtest', '750 µm', '0.75 mm', '40 ppm', 'invalid', null, undefined,
      true, false, {}, [], () => {},
    ];

    for (const val of corruptInputs) {
      // 1. evaluatePourOverRatio
      const pourOverEval = evaluatePourOverRatio(val as any, val as any);
      expect(typeof pourOverEval).toBe('object');
      expect(typeof pourOverEval.ratio).toBe('number');
      expect(typeof pourOverEval.style).toBe('string');
      expect(typeof pourOverEval.styleLabelPl).toBe('string');
      expect(typeof pourOverEval.ratioFormatted).toBe('string');

      // 2. evaluateWaterAlkalinity
      const alkEval = evaluateWaterAlkalinity(val as any);
      expect(typeof alkEval).toBe('object');
      expect(typeof alkEval.alkalinityPpm).toBe('number');
      expect(typeof alkEval.category).toBe('string');
      expect(typeof alkEval.bufferCapacity).toBe('string');

      // 3. estimateGrindDistribution
      const grindDist = estimateGrindDistribution(val as any, val as any);
      expect(typeof grindDist).toBe('object');
      expect(typeof grindDist.targetMicrons).toBe('number');
      expect(typeof grindDist.span).toBe('number');
      expect(typeof grindDist.unimodalityScore).toBe('number');

      // 4. formatParticleSize
      const formattedSize = formatParticleSize(val as any, val as any);
      expect(typeof formattedSize).toBe('string');
      expect(formattedSize.length).toBeGreaterThan(0);

      // 5. getCoffeeProcessGuide
      const processGuide = getCoffeeProcessGuide(val as any, val as any);
      expect(processGuide === null || typeof processGuide === 'object').toBe(true);

      // 6. BrewTimerEngine.calculateStepTimeWindow
      const timeWindow = BrewTimerEngine.calculateStepTimeWindow(val as any, val as any);
      expect(typeof timeWindow).toBe('object');
      expect(typeof timeWindow.isValidStep).toBe('boolean');
      expect(typeof timeWindow.startSecond).toBe('number');
      expect(typeof timeWindow.durationSeconds).toBe('number');

      // 7. extractSearchSnippet
      const snippet = extractSearchSnippet(val as any, val as any);
      expect(typeof snippet).toBe('string');

      // 8. getPaywallCallToAction
      const cta = getPaywallCallToAction(val as any);
      expect(typeof cta).toBe('object');
      expect(typeof cta.titlePl).toBe('string');
      expect(typeof cta.urgency).toBe('string');

      // 9. isBackupEmpty
      const emptyCheck = isBackupEmpty(val as any);
      expect(typeof emptyCheck).toBe('boolean');

      // 10. getProactiveActionById
      const action = getProactiveActionById(val as any, val as any);
      expect(action === undefined || typeof action === 'object').toBe(true);

      // 11. getLowStockInventoryItems
      const lowStock = getLowStockInventoryItems(val as any, val as any);
      expect(Array.isArray(lowStock)).toBe(true);
    }
  });
});

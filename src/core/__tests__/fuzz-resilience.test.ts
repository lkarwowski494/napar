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
} from '../domain-rules';
import { calculateWaterMinerals, classifyWaterHardness, classifyWaterHardnessFromFH } from '../water-chemistry';
import { BrewTimerEngine } from '../timer-engine';
import { convertMicronsToGrinder, findGrindCategoryForMicrons, findGrindCategoryById } from '../grinder-converter';
import { calculateBrewCost, calculateTeaCost, formatPlnCost } from '../cost-calculator';
import {
  formatTemperature,
  formatWaterVolume,
  formatDoseWeight,
  formatWaterWeight,
  wInKeep,
} from '../unit-converter';

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

import { importDataJson } from '../database';

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
});

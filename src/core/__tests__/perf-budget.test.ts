// ============================================================================
// Napar (Steepwise) — Performance & Time Budget Tests
// Pattern: Performance Regression Guards & Execution Budgets (cf. organizer perf-budget)
// ============================================================================

import {
  calculateBrewRatio,
  calculateLiquidYield,
  calculateExtractionYield,
  estimateCoffeeCaffeineMg,
  estimateTeaInfusionCaffeineMg,
} from '../domain-rules';
import { createGongfuSession, recordGongfuInfusion } from '../gongfu-session';
import { convertMicronsToGrinder, SUPPORTED_GRINDERS } from '../grinder-converter';
import {
  calculateWaterMinerals,
  WATER_RECIPES,
  calculateSulfateToChlorideRatio,
  calculateResidualAlkalinity,
  calculateTotalHardnessFromIons,
} from '../water-chemistry';
import { formatBrewTimeMinutesSeconds } from '../unit-converter';
import { normSearch, rankSearchResults } from '../search-utils';
import { BrewTimerEngine, StepTimeWindow, ActiveStepSnapshot, CumulativeWaterPoint } from '../timer-engine';
import { calculateLifetimeBreakEven } from '../app-access';
import { generateAdaptiveRecipeAdjustment } from '../bpr-engine';

jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn(() => ({
    execSync: jest.fn(),
    getFirstSync: jest.fn(),
    getAllSync: jest.fn(() => []),
    runSync: jest.fn(),
  })),
}));

import { escapeCsvValue, calculateStashDiversity } from '../database';

function measureCpuMs(fn: () => unknown, runs = 5): number {
  fn(); // Rozgrzewka JIT
  const ts: number[] = [];
  for (let i = 0; i < runs; i++) {
    const start = process.cpuUsage();
    fn();
    const d = process.cpuUsage(start);
    ts.push((d.user + d.system) / 1000);
  }
  ts.sort((a, b) => a - b);
  return ts[Math.floor(runs / 2)]; // Mediana z 5 przebiegów
}

describe('Performance Budgets: Real-Time Mathematics & Domain Processing', () => {
  test('Budżet 1: 10 000 obliczeń ekstrakcji i proporcji parzenia (< 100 ms)', () => {
    const ms = measureCpuMs(() => {
      for (let i = 0; i < 10000; i++) {
        const ratio = calculateBrewRatio(15.0 + (i % 5), 250.0 + (i % 20));
        const yieldGrams = calculateLiquidYield(250.0, 15.0);
        const ey = calculateExtractionYield(250.0, 1.35, 15.0);
      }
    });

    expect(ms).toBeLessThan(100);
  });

  test('Budżet 2: 10 000 estymacji kinetyki kofeiny dla kawy i herbaty (< 80 ms)', () => {
    const ms = measureCpuMs(() => {
      for (let i = 0; i < 5000; i++) {
        estimateCoffeeCaffeineMg(18.0);
        estimateTeaInfusionCaffeineMg(150, 1 + (i % 8));
      }
    });

    expect(ms).toBeLessThan(80);
  });

  test('Budżet 3: 1 000 ceremonii Gongfu Cha po 5 zalań (5 000 rejestracji infuzji i kinetyki kofeiny, < 100 ms)', () => {
    const ms = measureCpuMs(() => {
      for (let i = 0; i < 1000; i++) {
        let session = createGongfuSession({
          teaName: 'Da Hong Pao',
          teaType: 'wulong_rock',
          leafDoseGrams: 7,
          vesselCapacityMl: 110,
          waterTempCelsius: 96,
        });
        for (let infusion = 1; infusion <= 5; infusion++) {
          session = recordGongfuInfusion(session, { durationSeconds: 15 + infusion * 5 });
        }
      }
    });

    expect(ms).toBeLessThan(100);
  });

  test('Budżet 4: 2 000 punktów przemiału konwertowanych na 6 młynków specialty (12 000 nastaw, < 150 ms)', () => {
    const ms = measureCpuMs(() => {
      for (let i = 0; i < 2000; i++) {
        const microns = 200 + (i % 800);
        for (const grinder of SUPPORTED_GRINDERS) {
          convertMicronsToGrinder(microns, grinder.id);
        }
      }
    });

    expect(ms).toBeLessThan(150);
  });

  test('Budżet 5: 5 000 obliczeń mineralizacji wody dla różnych profili i objętości (< 80 ms)', () => {
    const recipe = WATER_RECIPES[0];
    const ms = measureCpuMs(() => {
      for (let i = 0; i < 5000; i++) {
        const volumeLiters = 1.0 + (i % 10) * 0.5;
        calculateWaterMinerals(volumeLiters, recipe.targetGhPpm, recipe.targetKhPpm);
      }
    });

    expect(ms).toBeLessThan(80);
  });

  test('Budżet 6: Eksport i ucieczka znaków CSV dla 5 000 komórek z tekstem (< 60 ms)', () => {
    const sampleStrings = [
      'Normal text',
      'Text, with, commas',
      'Text "with quotes"',
      'Text\nwith\nnewlines',
      null,
      undefined,
    ];

    const ms = measureCpuMs(() => {
      for (let i = 0; i < 5000; i++) {
        const val = sampleStrings[i % sampleStrings.length];
        escapeCsvValue(val as any);
      }
    });

    expect(ms).toBeLessThan(60);
  });

  test('Budżet 7: Serializacja i parsowanie dużej kolekcji JSON (1 000 wpisów, < 80 ms)', () => {
    const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
      id: `session-${i}`,
      recipeName: `V60 Recipe ${i}`,
      dose: 15.5,
      water: 250,
      tags: ['jaśmin', 'brzoskwinia', 'bergamotka'],
      timestamp: Date.now() + i,
    }));

    const ms = measureCpuMs(() => {
      const serialized = JSON.stringify(largeDataset);
      const parsed = JSON.parse(serialized);
      expect(parsed.length).toBe(1000);
    });

    expect(ms).toBeLessThan(80);
  });

  test('Budżet 8: 5 000 normalizacji tekstu i rankingów wyszukiwania (< 80 ms)', () => {
    const sampleItems = [
      { id: '1', name: 'V60 3-Pour', desc: 'Klasyczna metoda pour-over z drippera V60' },
      { id: '2', name: 'AeroPress Inverted', desc: 'Parzenie odwrócone dające gęsty napar' },
      { id: '3', name: 'Chemex Classic', desc: 'Czysty napar filtrowany przez gruby filtr' },
    ];

    const ms = measureCpuMs(() => {
      for (let i = 0; i < 5000; i++) {
        normSearch('v60 3-pour');
        normSearch('Żółty liść Ćma 2000');
        if (i % 50 === 0) {
          rankSearchResults(sampleItems, 'v60', (s) => s.name, (s) => [s.desc]);
        }
      }
    });

    expect(ms).toBeLessThan(80);
  });

  test('Budżet 9: calculateRemainingRecipeTime wykonuje 10 000 kalkulacji w czasie poniżej 50 ms (TASK-P70-10-WYD)', () => {
    const steps = [
      { id: '1', name: 'Bloom', durationSeconds: 45, waterGrams: 50 },
      { id: '2', name: 'Pour 1', durationSeconds: 30, waterGrams: 150 },
      { id: '3', name: 'Pour 2', durationSeconds: 30, waterGrams: 250 },
      { id: '4', name: 'Drawdown', durationSeconds: 45, waterGrams: 250 },
    ] as any[];

    const ms = measureCpuMs(() => {
      for (let i = 0; i < 10000; i++) {
        const stepIdx = i % 4;
        const elapsed = (i * 3) % 45;
        BrewTimerEngine.calculateRemainingRecipeTime(steps, stepIdx, elapsed);
      }
    });

    expect(ms).toBeLessThan(50);
  });

  test('Budżet 10: calculateStepWaterIncrement wykonuje 10 000 kalkulacji w czasie poniżej 50 ms (TASK-P72-10-WYD)', () => {
    const steps = [
      { id: '1', name: 'Bloom', targetWaterGrams: 50 },
      { id: '2', name: 'Pour 1', targetWaterGrams: 150 },
      { id: '3', name: 'Pour 2', targetWaterGrams: 250 },
      { id: '4', name: 'Drawdown', targetWaterGrams: 250 },
    ] as any[];

    // 1. Poprawność biznesowa
    expect(BrewTimerEngine.calculateStepWaterIncrement(steps, 0)).toBe(50);
    expect(BrewTimerEngine.calculateStepWaterIncrement(steps, 1)).toBe(100);
    expect(BrewTimerEngine.calculateStepWaterIncrement(steps, 2)).toBe(100);
    expect(BrewTimerEngine.calculateStepWaterIncrement(steps, 3)).toBe(0);
    expect(BrewTimerEngine.calculateStepWaterIncrement(null, 0)).toBe(0);
    expect(BrewTimerEngine.calculateStepWaterIncrement(steps, 99)).toBe(0);

    // 2. Budżet wydajnościowy
    const ms = measureCpuMs(() => {
      for (let i = 0; i < 10000; i++) {
        const stepIdx = i % 4;
        BrewTimerEngine.calculateStepWaterIncrement(steps, stepIdx);
      }
    });

    expect(ms).toBeLessThan(50);
  });

  test('Budżet 11: calculateRemainingWaterToPour wykonuje 10 000 kalkulacji w czasie poniżej 50 ms (TASK-P75-10-WYD)', () => {
    const steps = [
      { id: '1', name: 'Bloom', targetWaterGrams: 50 },
      { id: '2', name: 'Pour 1', targetWaterGrams: 150 },
      { id: '3', name: 'Pour 2', targetWaterGrams: 250 },
      { id: '4', name: 'Drawdown', targetWaterGrams: 250 },
    ] as any[];

    // 1. Poprawność biznesowa
    expect(BrewTimerEngine.calculateRemainingWaterToPour(steps, 0)).toBe(250);
    expect(BrewTimerEngine.calculateRemainingWaterToPour(steps, 100)).toBe(150);
    expect(BrewTimerEngine.calculateRemainingWaterToPour(steps, 250)).toBe(0);
    expect(BrewTimerEngine.calculateRemainingWaterToPour(steps, 300)).toBe(0);
    expect(BrewTimerEngine.calculateRemainingWaterToPour(null, 100)).toBe(0);
    expect(BrewTimerEngine.calculateRemainingWaterToPour(steps, -50)).toBe(250);

    // 2. Budżet wydajnościowy
    const ms = measureCpuMs(() => {
      for (let i = 0; i < 10000; i++) {
        const poured = (i * 7) % 350;
        BrewTimerEngine.calculateRemainingWaterToPour(steps, poured);
      }
    });

    expect(ms).toBeLessThan(50);
  });

  test('Budżet 12: calculateWaterPourProgress wykonuje 10 000 kalkulacji w czasie poniżej 50 ms (TASK-P77-10-WYD)', () => {
    const steps = [
      { id: '1', name: 'Bloom', targetWaterGrams: 50 },
      { id: '2', name: 'Pour 1', targetWaterGrams: 150 },
      { id: '3', name: 'Pour 2', targetWaterGrams: 250 },
      { id: '4', name: 'Drawdown', targetWaterGrams: 250 },
    ] as any[];

    // 1. Poprawność biznesowa
    expect(BrewTimerEngine.calculateWaterPourProgress(steps, 0)).toBe(0);
    expect(BrewTimerEngine.calculateWaterPourProgress(steps, 125)).toBe(50);
    expect(BrewTimerEngine.calculateWaterPourProgress(steps, 250)).toBe(100);
    expect(BrewTimerEngine.calculateWaterPourProgress(steps, 300)).toBe(100);
    expect(BrewTimerEngine.calculateWaterPourProgress(null, 100)).toBe(0);
    expect(BrewTimerEngine.calculateWaterPourProgress(steps, -50)).toBe(0);

    // 2. Budżet wydajnościowy
    const ms = measureCpuMs(() => {
      for (let i = 0; i < 10000; i++) {
        const poured = (i * 7) % 350;
        BrewTimerEngine.calculateWaterPourProgress(steps, poured);
      }
    });

    expect(ms).toBeLessThan(50);
  });

  test('Budżet 13: calculateStepTimeWindow wylicza okno czasowe kroku w czasie poniżej 50 ms (TASK-P79-10-WYD)', () => {
    const steps = [
      { stepNumber: 1, namePl: 'Preinfuzja', durationSeconds: 30, targetWaterGrams: 50 },
      { stepNumber: 2, namePl: 'Zalanie 1', durationSeconds: 45, targetWaterGrams: 150 },
      { stepNumber: 3, namePl: 'Zalanie 2', durationSeconds: 60, targetWaterGrams: 250 },
    ] as any[];

    // 1. Poprawność biznesowa
    const win0: StepTimeWindow = BrewTimerEngine.calculateStepTimeWindow(steps, 0);
    expect(win0.stepIndex).toBe(0);
    expect(win0.startSecond).toBe(0);
    expect(win0.endSecond).toBe(30);
    expect(win0.durationSeconds).toBe(30);
    expect(win0.isValidStep).toBe(true);

    const win1 = BrewTimerEngine.calculateStepTimeWindow(steps, 1);
    expect(win1.startSecond).toBe(30);
    expect(win1.endSecond).toBe(75);
    expect(win1.durationSeconds).toBe(45);
    expect(win1.isValidStep).toBe(true);

    const win2 = BrewTimerEngine.calculateStepTimeWindow(steps, 2);
    expect(win2.startSecond).toBe(75);
    expect(win2.endSecond).toBe(135);
    expect(win2.durationSeconds).toBe(60);
    expect(win2.isValidStep).toBe(true);

    // Kroki poza zakresem i nullish
    const winInvalid = BrewTimerEngine.calculateStepTimeWindow(steps, 99);
    expect(winInvalid.isValidStep).toBe(false);
    expect(winInvalid.durationSeconds).toBe(0);

    const winNull = BrewTimerEngine.calculateStepTimeWindow(null, 0);
    expect(winNull.isValidStep).toBe(false);

    // 2. Budżet wydajnościowy
    const ms = measureCpuMs(() => {
      for (let i = 0; i < 10000; i++) {
        BrewTimerEngine.calculateStepTimeWindow(steps, i % 3);
      }
    });

    expect(ms).toBeLessThan(50);
  });

  test('Budżet 14: getActiveStepSnapshot wyznacza stan aktywnego kroku w czasie poniżej 50 ms (TASK-P82-10-WYD)', () => {
    const steps = [
      { stepNumber: 1, namePl: 'Preinfuzja', durationSeconds: 30, targetWaterGrams: 50 },
      { stepNumber: 2, namePl: 'Zalanie 1', durationSeconds: 45, targetWaterGrams: 150 },
      { stepNumber: 3, namePl: 'Zalanie 2', durationSeconds: 60, targetWaterGrams: 250 },
    ] as any[];

    // 1. Poprawność biznesowa
    // Przy t = 10s -> Krok 0 (Preinfuzja), upłynęło 10s, zostało 20s, ~33.3%
    const snap10: ActiveStepSnapshot = BrewTimerEngine.getActiveStepSnapshot(steps, 10);
    expect(snap10.stepIndex).toBe(0);
    expect(snap10.stepElapsedSeconds).toBe(10);
    expect(snap10.stepRemainingSeconds).toBe(20);
    expect(snap10.stepProgressPercent).toBeCloseTo(33.3, 0);
    expect(snap10.isFinished).toBe(false);

    // Przy t = 50s -> Krok 1 (Zalanie 1: start 30s, dur 45s), upłynęło 20s w kroku, zostało 25s
    const snap50 = BrewTimerEngine.getActiveStepSnapshot(steps, 50);
    expect(snap50.stepIndex).toBe(1);
    expect(snap50.stepElapsedSeconds).toBe(20);
    expect(snap50.stepRemainingSeconds).toBe(25);
    expect(snap50.isFinished).toBe(false);

    // Przy t = 200s (poza czasem całego parzenia 135s) -> Zakończone
    const snapEnd = BrewTimerEngine.getActiveStepSnapshot(steps, 200);
    expect(snapEnd.stepIndex).toBe(2);
    expect(snapEnd.isFinished).toBe(true);
    expect(snapEnd.stepProgressPercent).toBe(100);

    // Wartości brzegowe i null
    const snapNull = BrewTimerEngine.getActiveStepSnapshot(null, 15);
    expect(snapNull.isFinished).toBe(true);
    expect(snapNull.step).toBeNull();

    // 2. Budżet wydajnościowy
    const ms = measureCpuMs(() => {
      for (let i = 0; i < 10000; i++) {
        BrewTimerEngine.getActiveStepSnapshot(steps, (i * 3) % 200);
      }
    });

    expect(ms).toBeLessThan(50);
  });

  test('Budżet 15: calculateCumulativeWaterSchedule generuje harmonogram narastania wody w czasie poniżej 50 ms (TASK-P84-10-WYD)', () => {
    const steps = [
      { stepNumber: 1, namePl: 'Preinfuzja', durationSeconds: 30, targetWaterGrams: 50 },
      { stepNumber: 2, namePl: 'Oczekiwanie / pauza', durationSeconds: 15, targetWaterGrams: 50 },
      { stepNumber: 3, namePl: 'Główne zalanie', durationSeconds: 45, targetWaterGrams: 250 },
    ] as any[];

    // 1. Poprawność biznesowa
    const schedule: CumulativeWaterPoint[] = BrewTimerEngine.calculateCumulativeWaterSchedule(steps);
    expect(schedule.length).toBe(3);

    // Krok 1 (Preinfuzja): czas 30s, woda 50g, pourRate = 50 / 30 ≈ 1.7 g/s, isPourStep = true
    expect(schedule[0].stepIndex).toBe(0);
    expect(schedule[0].stepNumber).toBe(1);
    expect(schedule[0].timeSecond).toBe(30);
    expect(schedule[0].waterGrams).toBe(50);
    expect(schedule[0].pourRateGramsPerSecond).toBe(1.7);
    expect(schedule[0].isPourStep).toBe(true);

    // Krok 2 (Pauza): czas 45s (30+15), woda 50g, pourRate = 0 g/s, isPourStep = false
    expect(schedule[1].stepIndex).toBe(1);
    expect(schedule[1].timeSecond).toBe(45);
    expect(schedule[1].waterGrams).toBe(50);
    expect(schedule[1].pourRateGramsPerSecond).toBe(0);
    expect(schedule[1].isPourStep).toBe(false);

    // Krok 3 (Główne zalanie): czas 90s (45+45), woda 250g, delta 200g / 45s ≈ 4.4 g/s, isPourStep = true
    expect(schedule[2].stepIndex).toBe(2);
    expect(schedule[2].timeSecond).toBe(90);
    expect(schedule[2].waterGrams).toBe(250);
    expect(schedule[2].pourRateGramsPerSecond).toBe(4.4);
    expect(schedule[2].isPourStep).toBe(true);

    // Wartości brzegowe i null
    const schedNull = BrewTimerEngine.calculateCumulativeWaterSchedule(null);
    expect(Array.isArray(schedNull)).toBe(true);
    expect(schedNull.length).toBe(0);

    const schedEmpty = BrewTimerEngine.calculateCumulativeWaterSchedule([]);
    expect(schedEmpty.length).toBe(0);

    // 2. Budżet wydajnościowy: 10 000 wywołań < 80 ms
    const ms = measureCpuMs(() => {
      for (let i = 0; i < 10000; i++) {
        BrewTimerEngine.calculateCumulativeWaterSchedule(steps);
      }
    });

    expect(ms).toBeLessThan(80);
  });

  test('Budżet 16: 10 000 obliczeń chemii wody (SulfateToChloride i ResidualAlkalinity) (< 80 ms)', () => {
    // 1. Poprawność biznesowa
    const scRes = calculateSulfateToChlorideRatio(75, 50);
    expect(scRes.ratio).toBe(1.5);
    expect(scRes.category).toBe('crisp_accentuated');

    const raRes = calculateResidualAlkalinity(40, 70, 35);
    expect(raRes.residualAlkalinityPpm).toBe(15.0);
    expect(raRes.category).toBe('optimal_specialty');

    // 2. Budżet wydajnościowy: 10 000 wywołań w pętli < 80 ms
    const ms = measureCpuMs(() => {
      for (let i = 0; i < 10000; i++) {
        calculateSulfateToChlorideRatio(50 + (i % 20), 40 + (i % 10));
        calculateResidualAlkalinity(35 + (i % 15), 60 + (i % 20), 30 + (i % 10));
      }
    });

    expect(ms).toBeLessThan(80);
  });

  test('Budżet 17: 10 000 obliczeń chemii jonowej (calculateTotalHardnessFromIons) i formatowania czasu (formatBrewTimeMinutesSeconds) (< 80 ms)', () => {
    // 1. Poprawność biznesowa
    const hardnessRes = calculateTotalHardnessFromIons(20, 10);
    expect(hardnessRes.dominance).toBe('balanced');
    expect(hardnessRes.totalHardnessPpmCaCO3).toBeCloseTo(91.1, 1);

    const timeFormatted = formatBrewTimeMinutesSeconds(150, true);
    expect(timeFormatted).toBe('02:30');

    // 2. Budżet wydajnościowy: 10 000 wywołań w pętli < 80 ms
    const ms = measureCpuMs(() => {
      for (let i = 0; i < 10000; i++) {
        calculateTotalHardnessFromIons(15 + (i % 25), 8 + (i % 15));
        formatBrewTimeMinutesSeconds(60 + (i % 300), (i % 2) === 0);
      }
    });

    expect(ms).toBeLessThan(80);
  });

  test('Budżet 18: 10 000 obliczeń wskaźników różnorodności (calculateStashDiversity), opłacalności (calculateLifetimeBreakEven) i adaptacji BPR (< 80 ms)', () => {
    // 1. Poprawność biznesowa
    const sampleStash = [
      { id: 'b1', name: 'Kenya', type: 'coffee' as const, origin: 'Kenya', process: 'Washed', roasterOrProducer: 'Hard Beans', remainingWeightGrams: 200, initialWeightGrams: 250, flavorNotes: [], isFavorite: false, isArchived: false, createdAt: '', updatedAt: '' },
      { id: 'b2', name: 'Ethiopia', type: 'coffee' as const, origin: 'Ethiopia', process: 'Natural', roasterOrProducer: 'Kafar', remainingWeightGrams: 150, initialWeightGrams: 250, flavorNotes: [], isFavorite: false, isArchived: false, createdAt: '', updatedAt: '' },
      { id: 't1', name: 'Sencha', type: 'tea' as const, origin: 'Japan', process: 'Steamed', remainingWeightGrams: 50, initialWeightGrams: 50, flavorNotes: [], isFavorite: false, isArchived: false, createdAt: '', updatedAt: '' },
    ];
    const diversity = calculateStashDiversity(sampleStash);
    expect(diversity.diversityScore).toBeGreaterThanOrEqual(60);

    const breakEven = calculateLifetimeBreakEven(149.99, 9.99, 49.99);
    expect(typeof breakEven.isLifetimeRecommended).toBe('boolean');
    expect(breakEven.breakEvenMonthsVsMonthly).toBeGreaterThan(0);

    const adj = generateAdaptiveRecipeAdjustment('V60', { isTooSour: true });
    expect(adj.recommendedGrindDeltaClicks).toBe(-2);

    // 2. Budżet wydajnościowy: 10 000 wywołań w pętli < 80 ms
    const ms = measureCpuMs(() => {
      for (let i = 0; i < 10000; i++) {
        calculateStashDiversity(sampleStash);
        calculateLifetimeBreakEven(150 + (i % 20), 50 + (i % 10), 10);
        generateAdaptiveRecipeAdjustment('V60', { isTooSour: (i % 2) === 0 });
      }
    });

    expect(ms).toBeLessThan(80);
  });
});


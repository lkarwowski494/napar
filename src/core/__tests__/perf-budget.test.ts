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
import { calculateWaterMinerals, WATER_RECIPES } from '../water-chemistry';
import { normSearch, rankSearchResults } from '../search-utils';
import { BrewTimerEngine } from '../timer-engine';

jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn(() => ({
    execSync: jest.fn(),
    getFirstSync: jest.fn(),
    getAllSync: jest.fn(() => []),
    runSync: jest.fn(),
  })),
}));

import { escapeCsvValue } from '../database';

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
});

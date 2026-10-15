// ============================================================================
// Napar (Steepwise) — Unit Tests: BrewTimerEngine
// ============================================================================

import { BrewTimerEngine, TimerSnapshot } from '../timer-engine';
import { RecipeStep } from '../recipes-data';

// Mock expo modules
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Medium: 'medium', Light: 'light' },
  NotificationFeedbackType: { Success: 'success' },
}));

jest.mock('expo-keep-awake', () => ({
  activateKeepAwakeAsync: jest.fn(),
  deactivateKeepAwake: jest.fn(),
}));

describe('BrewTimerEngine', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const testSteps: RecipeStep[] = [
    {
      stepNumber: 1,
      namePl: 'Preinfuzja',
      targetWaterGrams: 50.0,
      durationSeconds: 30,
      instructionPl: 'Zalej 50g wody',
    },
    {
      stepNumber: 2,
      namePl: 'Główne zalanie',
      targetWaterGrams: 250.0,
      durationSeconds: 60,
      instructionPl: 'Zalej do 250g wody',
    },
  ];

  test('Inicjalizacja z poprawnym stanem początkowym', () => {
    const engine = new BrewTimerEngine(testSteps);
    const snap = engine.getSnapshot();

    expect(snap.status).toBe('idle');
    expect(snap.currentStepIndex).toBe(0);
    expect(snap.currentStep?.namePl).toBe('Preinfuzja');
    expect(snap.stepRemainingSeconds).toBe(30);
    expect(snap.totalElapsedSeconds).toBe(0);
    expect(snap.targetWaterGrams).toBe(50.0);
    expect(snap.recommendedPourRate).toBeCloseTo(50 / 30, 1);
  });

  test('Uruchomienie timera i przejście przez kroki sekundowe', () => {
    let latestSnap: any = null;
    const engine = new BrewTimerEngine(testSteps, {
      onTick: (snap) => {
        latestSnap = snap;
      },
    });

    engine.start();
    expect(engine.getSnapshot().status).toBe('running');

    // 10 sekund później
    jest.advanceTimersByTime(10000);
    const snap1 = latestSnap as TimerSnapshot;
    expect(snap1.stepElapsedSeconds).toBe(10);
    expect(snap1.stepRemainingSeconds).toBe(20);
    expect(snap1.totalElapsedSeconds).toBe(10);

    // Po kolejnych 20 sekundach (łącznie 30s) następuje przejście do kroku 2
    jest.advanceTimersByTime(20000);
    const snap2 = latestSnap as TimerSnapshot;
    expect(snap2.currentStepIndex).toBe(1);
    expect(snap2.currentStep?.namePl).toBe('Główne zalanie');
    expect(snap2.previousWaterGrams).toBe(50.0);
    expect(snap2.targetWaterGrams).toBe(250.0);
    // Delta to 200g przez 60s = 3.3 g/s
    expect(snap2.recommendedPourRate).toBe(3.3);

    engine.destroy();
  });

  test('Pauza i wznowienie timera', () => {
    const engine = new BrewTimerEngine(testSteps);
    engine.start();

    jest.advanceTimersByTime(5000);
    expect(engine.getSnapshot().stepElapsedSeconds).toBe(5);

    engine.pause();
    expect(engine.getSnapshot().status).toBe('paused');

    jest.advanceTimersByTime(5000);
    // Czas nie powinien urosnąć podczas pauzy
    expect(engine.getSnapshot().stepElapsedSeconds).toBe(5);

    engine.resume();
    expect(engine.getSnapshot().status).toBe('running');
    jest.advanceTimersByTime(2000);
    expect(engine.getSnapshot().stepElapsedSeconds).toBe(7);

    engine.destroy();
  });

  test('Manualne przeskakiwanie kroków (nextStep i previousStep)', () => {
    const engine = new BrewTimerEngine(testSteps);
    engine.start();

    expect(engine.getSnapshot().currentStepIndex).toBe(0);
    engine.nextStep();
    expect(engine.getSnapshot().currentStepIndex).toBe(1);

    engine.previousStep();
    expect(engine.getSnapshot().currentStepIndex).toBe(0);

    engine.nextStep();
    engine.nextStep(); // Na ostatnim kroku -> finish
    expect(engine.getSnapshot().status).toBe('finished');

    engine.destroy();
  });

  test('Zakończenie parzenia wywołuje onFinish', () => {
    const onFinish = jest.fn();
    const engine = new BrewTimerEngine(testSteps, { onFinish });
    engine.start();

    // 30s + 60s = 90s
    jest.advanceTimersByTime(90000);
    expect(engine.getSnapshot().status).toBe('finished');
    expect(onFinish).toHaveBeenCalledTimes(1);

    engine.destroy();
  });
});

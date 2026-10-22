// ============================================================================
// Napar (Steepwise) — Unit Tests: BrewTimerEngine
// ============================================================================

import { BrewTimerEngine, TimerSnapshot, remainingTimerSec } from '../timer-engine';
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
  let testSteps: RecipeStep[];

  beforeEach(() => {
    jest.useFakeTimers();
    testSteps = [
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
  });

  afterEach(() => {
    jest.useRealTimers();
  });

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

  test('setSteps, setCallbacks, setHapticsEnabled, setSoundEnabled oraz reset()', () => {
    const engine = new BrewTimerEngine(testSteps);
    engine.setHapticsEnabled(false);
    engine.setSoundEnabled(false);

    const onTick = jest.fn();
    engine.setCallbacks({ onTick });

    engine.start();
    expect(onTick).toHaveBeenCalled();

    engine.reset();
    expect(engine.getSnapshot().status).toBe('idle');
    expect(engine.getSnapshot().totalElapsedSeconds).toBe(0);

    const newSteps: RecipeStep[] = [
      {
        stepNumber: 1,
        namePl: 'Pojedynczy Krok',
        targetWaterGrams: 100,
        durationSeconds: 40,
        instructionPl: 'Zalej',
      },
    ];
    engine.setSteps(newSteps);
    expect(engine.getSnapshot().totalSteps).toBe(1);
    expect(engine.getSnapshot().currentStep?.namePl).toBe('Pojedynczy Krok');

    engine.destroy();
  });

  test('onStepChange, onWarning oraz ostrzeżenie haptyczne warning na 3 sekundy przed końcem', () => {
    const onStepChange = jest.fn();
    const onWarning = jest.fn();
    const Haptics = require('expo-haptics');
    const engine = new BrewTimerEngine(testSteps, { onStepChange, onWarning });

    engine.start();
    expect(onStepChange).toHaveBeenCalledWith(0, expect.objectContaining({ namePl: 'Preinfuzja' }));

    // Przeskocz do 27s (3s przed końcem kroku trwającego 30s)
    jest.advanceTimersByTime(27000);
    expect(Haptics.impactAsync).toHaveBeenCalledWith('light');
    expect(onWarning).toHaveBeenCalledWith(3);

    // Kolejny krok
    jest.advanceTimersByTime(3000);
    expect(onStepChange).toHaveBeenCalledWith(1, expect.objectContaining({ namePl: 'Główne zalanie' }));

    engine.destroy();
  });

  test('Obsługa silnika timera z pustą listą kroków', () => {
    const engine = new BrewTimerEngine([]);
    expect(engine.getSnapshot().totalSteps).toBe(0);
    expect(engine.getSnapshot().currentStep).toBeNull();

    // Próba startu nie powinna zmienić statusu na running
    engine.start();
    expect(engine.getSnapshot().status).toBe('idle');

    engine.destroy();
  });

  test('Korekta czasu w locie (adjustStepDuration) dynamicznie wydłuża i skraca czas trwania etapu', () => {
    const engine = new BrewTimerEngine(testSteps);
    engine.start();
    expect(engine.getSnapshot().currentStep?.durationSeconds).toBe(30);

    // Dodaj 10 sekund
    engine.adjustStepDuration(10);
    expect(engine.getSnapshot().currentStep?.durationSeconds).toBe(40);

    // Odejmij 20 sekund
    engine.adjustStepDuration(-20);
    expect(engine.getSnapshot().currentStep?.durationSeconds).toBe(20);

    engine.destroy();

    // Wywołanie na pustym silniku bez kroków nie rzuca błędu
    const emptyEngine = new BrewTimerEngine([]);
    expect(() => emptyEngine.adjustStepDuration(10)).not.toThrow();
  });

  test('Korekta ±10 s w pauzie zostaje po WZNÓW (pauza → korekta → wznowienie)', () => {
    let latestSnap: any = null;
    const engine = new BrewTimerEngine(testSteps, {
      onTick: (snap) => {
        latestSnap = snap;
      },
    });

    engine.start();
    jest.advanceTimersByTime(10000); // etap 1 (30 s): zostało 20 s
    engine.pause();

    // Korekta +10 s w pauzie: krok ma 40 s, zostało 30 s
    engine.adjustStepDuration(10);
    expect(engine.getSnapshot().currentStep?.durationSeconds).toBe(40);
    expect(engine.getSnapshot().stepRemainingSeconds).toBe(30);

    // Czas płynie w pauzie bez skutków
    jest.advanceTimersByTime(60000);
    expect(engine.getSnapshot().status).toBe('paused');

    engine.resume();
    // Po WZNÓW zostaje 30 s, a nie 20 s sprzed korekty
    expect(engine.getSnapshot().stepRemainingSeconds).toBe(30);

    jest.advanceTimersByTime(29000);
    expect(latestSnap.currentStepIndex).toBe(0);
    expect(latestSnap.stepRemainingSeconds).toBe(1);
    jest.advanceTimersByTime(1000);
    expect(latestSnap.currentStepIndex).toBe(1);

    engine.destroy();
  });

  test('Skrócenie o 10 s w pauzie zostaje po WZNÓW i nie schodzi poniżej 1 s', () => {
    let latestSnap: any = null;
    const engine = new BrewTimerEngine(testSteps, {
      onTick: (snap) => {
        latestSnap = snap;
      },
    });

    engine.start();
    jest.advanceTimersByTime(10000); // zostało 20 s
    engine.pause();

    engine.adjustStepDuration(-10); // krok 20 s, zostało 10 s
    engine.resume();
    jest.advanceTimersByTime(9000);
    expect(latestSnap.currentStepIndex).toBe(0);
    jest.advanceTimersByTime(1000);
    expect(latestSnap.currentStepIndex).toBe(1);

    // Zbyt mocne skrócenie w pauzie: minimum 1 s do końca etapu
    const engine2 = new BrewTimerEngine(testSteps, {
      onTick: (snap) => {
        latestSnap = snap;
      },
    });
    engine2.start();
    jest.advanceTimersByTime(10000);
    engine2.pause();
    engine2.adjustStepDuration(-30);
    engine2.resume();
    jest.advanceTimersByTime(1000);
    expect(latestSnap.currentStepIndex).toBe(1);

    engine.destroy();
    engine2.destroy();
  });

  describe('RD-ENG-06 & NFR-PERF-004: Odliczanie odporne na uśpienie w tle', () => {
    test('Wektory testowe z dokumentu BRD (RD-ENG-06)', () => {
      // • Start 180s o 10:00:00, uśpienie, wybudzenie o 10:02:15 -> 45s
      const t0 = new Date('2026-10-17T10:00:00.000Z').getTime();
      const tEnd180 = t0 + 180 * 1000;
      const tWake135 = t0 + 135 * 1000; // 10:02:15
      expect(remainingTimerSec(tEnd180, tWake135)).toBe(45);

      // • Start 60s o 10:00:00, wybudzenie o 10:05:00 -> 0s (zakończony)
      const tEnd60 = t0 + 60 * 1000;
      const tWake300 = t0 + 300 * 1000; // 10:05:00
      expect(remainingTimerSec(tEnd60, tWake300)).toBe(0);
    });

    test('syncWithRealTime synchronizuje upływ czasu po uśpieniu aplikacji', () => {
      const engine = new BrewTimerEngine(testSteps);
      engine.start();

      expect(engine.getSnapshot().status).toBe('running');
      expect(engine.getSnapshot().stepElapsedSeconds).toBe(0);

      // Symulacja skoku czasu o 15 sekund
      jest.advanceTimersByTime(15000);
      engine.syncWithRealTime();

      expect(engine.getSnapshot().stepElapsedSeconds).toBe(15);
      expect(engine.getSnapshot().stepRemainingSeconds).toBe(15);

      engine.destroy();
    });

    test('Pauza i wznowienie zachowują prawidłowy pozostały czas', () => {
      const engine = new BrewTimerEngine(testSteps);
      engine.start();

      jest.advanceTimersByTime(10000); // 10 sekund upłynęło
      engine.pause();
      expect(engine.getSnapshot().status).toBe('paused');

      jest.advanceTimersByTime(30000); // W tle na pauzie 30s
      engine.resume();
      expect(engine.getSnapshot().status).toBe('running');

      // Po wznowieniu pozostały czas to nadal 20s dla kroku 30s
      expect(engine.getSnapshot().stepRemainingSeconds).toBe(20);

      engine.destroy();
    });
  });

  describe('stepEndAtMs: moment końca etapu dla Live Activity', () => {
    test('podczas biegu wskazuje koniec etapu w ms, na pauzie i bezczynnie jest null', () => {
      const engine = new BrewTimerEngine(testSteps);
      expect(engine.getSnapshot().stepEndAtMs).toBeNull();

      const startedAt = Date.now();
      engine.start();
      expect(engine.getSnapshot().stepEndAtMs).toBe(startedAt + 30_000);

      jest.advanceTimersByTime(10_000);
      expect(engine.getSnapshot().stepEndAtMs).toBe(startedAt + 30_000);

      engine.pause();
      expect(engine.getSnapshot().stepEndAtMs).toBeNull();

      engine.resume();
      expect(engine.getSnapshot().stepEndAtMs).toBe(Date.now() + 20_000);

      engine.destroy();
    });

    test('po przejściu do kolejnego etapu koniec przesuwa się o czas nowego etapu', () => {
      const engine = new BrewTimerEngine(testSteps);
      engine.start();
      const first = engine.getSnapshot().stepEndAtMs;
      engine.nextStep();
      expect(engine.getSnapshot().stepEndAtMs).toBe(Date.now() + 60_000);
      expect(engine.getSnapshot().stepEndAtMs).not.toBe(first);
      engine.destroy();
    });
  });
});

// ============================================================================
// Napar — Unit Tests: BrewTimerEngine
// ============================================================================

import { BrewTimerEngine, TimerSnapshot, remainingTimerSec } from '../timer-engine';
import { RecipeStep } from '../recipes-data';
import * as timerAudioModule from '../../platform/timer-audio';

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

  test('setHapticsEnabled, setSoundEnabled oraz reset()', () => {
    const onTick = jest.fn();
    const engine = new BrewTimerEngine(testSteps, { onTick });
    engine.setHapticsEnabled(false);
    engine.setSoundEnabled(false);

    engine.start();
    expect(onTick).toHaveBeenCalled();

    engine.reset();
    expect(engine.getSnapshot().status).toBe('idle');
    expect(engine.getSnapshot().totalElapsedSeconds).toBe(0);

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

    test('TASK-P3-01-PRO: Kaskadowe przeliczanie etapów po długim uśpieniu w tle (multi-step jump)', () => {
      const engine = new BrewTimerEngine(testSteps);
      engine.start();

      // Skok czasu o 50 sekund (Krok 1 trwa 30s, Krok 2 trwa 60s)
      jest.advanceTimersByTime(50000);
      engine.syncWithRealTime();

      const snap = engine.getSnapshot();
      expect(snap.status).toBe('running');
      expect(snap.currentStepIndex).toBe(1);
      expect(snap.stepElapsedSeconds).toBe(20);
      expect(snap.stepRemainingSeconds).toBe(40);
      expect(snap.totalElapsedSeconds).toBe(50);

      // Skok o kolejne 50 sekund (łącznie 100s > 90s łącznego czasu etapów)
      jest.advanceTimersByTime(50000);
      engine.syncWithRealTime();

      expect(engine.getSnapshot().status).toBe('finished');
      engine.destroy();
    });

    test('TASK-P3-01-PRO: Klonowanie tablicy etapów chroni źródłowe obiekty przed mutacją', () => {
      const originalSteps = [{ stepNumber: 1, namePl: 'Step 1', targetWaterGrams: 50, durationSeconds: 30, instructionPl: 'Inst' }];
      const engine = new BrewTimerEngine(originalSteps);
      engine.adjustStepDuration(15);

      expect(engine.getSnapshot().currentStep?.durationSeconds).toBe(45);
      expect(originalSteps[0].durationSeconds).toBe(30);
      engine.destroy();
    });

    test('TASK-P5-08-PRO: adjustStepDuration w stanie paused zachowuje skorygowany czas po wznowieniu', () => {
      const engine = new BrewTimerEngine(testSteps);
      engine.start();

      jest.advanceTimersByTime(10000); // 10s upłynęło z 30s
      engine.pause();
      expect(engine.getSnapshot().status).toBe('paused');
      expect(engine.getSnapshot().stepRemainingSeconds).toBe(20);

      // Dodajemy 10 sekund podczas pauzy
      engine.adjustStepDuration(10);
      expect(engine.getSnapshot().stepRemainingSeconds).toBe(30);

      // Wznawiamy timer
      engine.resume();
      expect(engine.getSnapshot().status).toBe('running');
      expect(engine.getSnapshot().stepRemainingSeconds).toBe(30);

      // Odliczamy 5 sekund
      jest.advanceTimersByTime(5000);
      engine.syncWithRealTime();
      expect(engine.getSnapshot().stepRemainingSeconds).toBe(25);

      engine.destroy();
    });

    test('TASK-P7-08-PRO: reset() oraz destroy() wywołują stopTimerChime()', () => {
      const spy = jest.spyOn(timerAudioModule, 'stopTimerChime').mockImplementation(() => {});
      const engine = new BrewTimerEngine(testSteps);
      engine.reset();
      expect(spy).toHaveBeenCalledTimes(1);

      engine.destroy();
      expect(spy).toHaveBeenCalledTimes(2);
      spy.mockRestore();
    });

    test('TASK-P8-08-PRO: remainingTimerSec chroni przed NaN/Infinity, a destroy czyści callbacks i steps', () => {
      expect(remainingTimerSec(NaN)).toBe(0);
      expect(remainingTimerSec(Infinity)).toBe(0);
      expect(remainingTimerSec(1000, NaN)).toBe(0);

      const onTick = jest.fn();
      const engine = new BrewTimerEngine(testSteps, { onTick });
      engine.destroy();

      expect((engine as any).callbacks).toEqual({});
      expect((engine as any).steps).toEqual([]);
    });

    test('TASK-P10-12-NIE: getSnapshot zabezpiecza duration i targetWater przed NaN/Infinity w krokach', () => {
      const corruptSteps: any[] = [
        { stepNumber: 1, namePl: 'Step 1', durationSeconds: NaN, targetWaterGrams: Infinity },
        { stepNumber: 2, namePl: 'Step 2', durationSeconds: -10, targetWaterGrams: NaN },
      ];
      const engine = new BrewTimerEngine(corruptSteps);
      const snap = engine.getSnapshot();

      expect(Number.isFinite(snap.stepRemainingSeconds)).toBe(true);
      expect(Number.isFinite(snap.stepProgress)).toBe(true);
      expect(Number.isFinite(snap.recommendedPourRate)).toBe(true);
      expect(Number.isFinite(snap.currentWaterGrams)).toBe(true);
      expect(snap.stepProgress).toBe(0);
      expect(snap.recommendedPourRate).toBe(0);
      engine.destroy();
    });

    test('D4 Stryker: pełna weryfikacja cyklu życia, audio, haptyki, keepAwake, AppState, resetCurrentStep i korekt', () => {
      const timerPlatform = require('../../platform/timer-platform');
      const playChimeSpy = jest.spyOn(timerAudioModule, 'playTimerChime').mockResolvedValue(true);
      const stopChimeSpy = jest.spyOn(timerAudioModule, 'stopTimerChime').mockImplementation(() => {});
      const hapticSpy = jest.spyOn(timerPlatform, 'triggerTimerHaptic').mockImplementation(() => {});
      const activateAwakeSpy = jest.spyOn(timerPlatform, 'activateTimerKeepAwake').mockImplementation(() => {});
      const deactivateAwakeSpy = jest.spyOn(timerPlatform, 'deactivateTimerKeepAwake').mockImplementation(() => {});
      const removeSubMock = jest.fn();
      let appActiveCb: (() => void) | null = null;
      const appListenerSpy = jest.spyOn(timerPlatform, 'addAppActiveListener').mockImplementation((cb: any) => {
        appActiveCb = cb;
        return { remove: removeSubMock };
      });

      const onTick = jest.fn();
      const onStepChange = jest.fn();
      const onWarning = jest.fn();
      const onFinish = jest.fn();
      const engine = new BrewTimerEngine(testSteps, { onTick, onStepChange, onWarning, onFinish });

      // pause/resume/syncWithRealTime/previousStep are no-ops in idle
      engine.pause();
      engine.resume();
      engine.syncWithRealTime();
      engine.previousStep();
      expect(engine.getSnapshot().status).toBe('idle');
      expect(engine.getSnapshot().isLastStep).toBe(false);
      expect(onTick).not.toHaveBeenCalled();

      // start activates keepAwake, registers AppState listener, triggers start haptic & stepChange
      engine.start();
      expect(activateAwakeSpy).toHaveBeenCalledTimes(1);
      expect(appListenerSpy).toHaveBeenCalledTimes(1);
      expect(hapticSpy).toHaveBeenCalledWith('start');
      expect(onStepChange).toHaveBeenCalledTimes(1);

      // calling start() while already running is a no-op
      engine.start();
      expect(activateAwakeSpy).toHaveBeenCalledTimes(1);
      expect(onStepChange).toHaveBeenCalledTimes(1);

      // 250ms tick with no whole-second change does NOT emit redundant onTick
      const ticksAfterStart = onTick.mock.calls.length;
      jest.advanceTimersByTime(250);
      expect(onTick.mock.calls.length).toBe(ticksAfterStart);

      // Advance 15s (halfway through 30s step -> progress = 0.5, currentWaterGrams = 25)
      jest.advanceTimersByTime(14750);
      const midSnap = engine.getSnapshot();
      expect(midSnap.stepElapsedSeconds).toBe(15);
      expect(midSnap.stepProgress).toBeCloseTo(0.5, 2);
      expect(midSnap.currentWaterGrams).toBe(25);
      expect(midSnap.totalElapsedSeconds).toBe(15);

      // AppState callback triggers syncWithRealTime while running
      jest.setSystemTime(Date.now() + 2000);
      appActiveCb!();
      expect(engine.getSnapshot().stepElapsedSeconds).toBe(17);

      // Pause saves pausedTotalElapsedMs, deactivates keepAwake, removes listener
      engine.pause();
      expect(deactivateAwakeSpy).toHaveBeenCalledTimes(1);
      expect(removeSubMock).toHaveBeenCalledTimes(1);
      const ticksAfterPause = onTick.mock.calls.length;
      // Calling pause() again is no-op; AppState cb while paused is no-op
      engine.pause();
      expect(onTick.mock.calls.length).toBe(ticksAfterPause);
      appActiveCb!();
      expect(engine.getSnapshot().stepElapsedSeconds).toBe(17);

      // Idle 10s while paused -> resume preserves totalElapsedSeconds accurately
      jest.advanceTimersByTime(10000);
      engine.resume();
      jest.advanceTimersByTime(3000);
      expect(engine.getSnapshot().totalElapsedSeconds).toBe(20);
      expect(engine.getSnapshot().stepRemainingSeconds).toBe(10);

      // adjustStepDuration while running: -7s -> 3s remaining, triggers warning on next tick
      engine.adjustStepDuration(-7);
      expect(engine.getSnapshot().stepRemainingSeconds).toBe(3);
      jest.advanceTimersByTime(1000); // 2s left -> warning & chime once
      expect(onWarning).toHaveBeenCalledWith(2);
      expect(hapticSpy).toHaveBeenCalledWith('warning');
      expect(playChimeSpy).toHaveBeenCalledTimes(1);
      jest.advanceTimersByTime(1000); // 1s left -> warning fired again, chime NOT repeated for same step
      expect(onWarning).toHaveBeenCalledWith(1);
      expect(playChimeSpy).toHaveBeenCalledTimes(1);

      // adjustStepDuration back up (>3s) resets chimePlayedForStep/lastWarningKey
      engine.adjustStepDuration(10);
      expect(engine.getSnapshot().stepRemainingSeconds).toBe(11);
      // Adjust down to 2s and test <=3 branch
      engine.adjustStepDuration(-9);
      expect(engine.getSnapshot().stepRemainingSeconds).toBe(2);

      // resetCurrentStep while running with custom duration & invalid duration
      engine.resetCurrentStep(20);
      expect(engine.getSnapshot().currentStep?.durationSeconds).toBe(20);
      expect(engine.getSnapshot().stepElapsedSeconds).toBe(0);
      expect(engine.getSnapshot().stepRemainingSeconds).toBe(20);
      engine.resetCurrentStep(-5);
      expect(engine.getSnapshot().currentStep?.durationSeconds).toBe(20);
      jest.advanceTimersByTime(5000);
      expect(engine.getSnapshot().stepRemainingSeconds).toBe(15);

      // resetCurrentStep while paused updates pausedRemainingMs
      engine.pause();
      engine.resetCurrentStep(25);
      expect(engine.getSnapshot().stepRemainingSeconds).toBe(25);
      engine.resume();
      jest.advanceTimersByTime(5000);
      expect(engine.getSnapshot().stepRemainingSeconds).toBe(20);

      // nextStep & previousStep while running update stepEndAtMs & fire callbacks
      onStepChange.mockClear();
      hapticSpy.mockClear();
      engine.nextStep();
      expect(engine.getSnapshot().currentStepIndex).toBe(1);
      expect(engine.getSnapshot().isLastStep).toBe(true);
      expect(hapticSpy).toHaveBeenCalledWith('step');
      expect(onStepChange).toHaveBeenCalledWith(1, expect.objectContaining({ namePl: 'Główne zalanie' }));
      jest.advanceTimersByTime(5000);
      expect(engine.getSnapshot().stepRemainingSeconds).toBe(55);

      onStepChange.mockClear();
      engine.previousStep();
      expect(engine.getSnapshot().currentStepIndex).toBe(0);
      expect(onStepChange).toHaveBeenCalledWith(0, expect.objectContaining({ namePl: 'Preinfuzja' }));
      jest.advanceTimersByTime(5000);
      expect(engine.getSnapshot().stepRemainingSeconds).toBe(20);

      // Auto-advance into step 1 fires step haptic & onStepChange
      hapticSpy.mockClear();
      onStepChange.mockClear();
      jest.advanceTimersByTime(25000);
      expect(engine.getSnapshot().currentStepIndex).toBe(1);
      expect(hapticSpy).toHaveBeenCalledWith('step');
      expect(onStepChange).toHaveBeenCalledWith(1, expect.objectContaining({ namePl: 'Główne zalanie' }));

      // Finish triggers finish haptic, sound chime, deactivateKeepAwake, onFinish
      hapticSpy.mockClear();
      playChimeSpy.mockClear();
      engine.finish();
      expect(engine.getSnapshot().status).toBe('finished');
      expect(hapticSpy).toHaveBeenCalledWith('finish');
      expect(playChimeSpy).toHaveBeenCalledTimes(1);
      expect(onFinish).toHaveBeenCalledTimes(1);

      // Restart from finished resets step index & elapsed to 0
      engine.setHapticsEnabled(false);
      engine.setSoundEnabled(false);
      hapticSpy.mockClear();
      playChimeSpy.mockClear();
      engine.start();
      expect(engine.getSnapshot().status).toBe('running');
      expect(engine.getSnapshot().currentStepIndex).toBe(0);
      expect(engine.getSnapshot().totalElapsedSeconds).toBe(0);
      expect(hapticSpy).not.toHaveBeenCalled();
      engine.finish();
      expect(playChimeSpy).not.toHaveBeenCalled();

      // Empty engine resetCurrentStep is safe no-op
      const empty = new BrewTimerEngine([]);
      expect(() => empty.resetCurrentStep(10)).not.toThrow();

      // Reset & destroy call stopTimerChime and deactivateKeepAwake
      stopChimeSpy.mockClear();
      engine.reset();
      expect(stopChimeSpy).toHaveBeenCalledTimes(1);
      engine.destroy();
      expect(stopChimeSpy).toHaveBeenCalledTimes(2);

      playChimeSpy.mockRestore();
      stopChimeSpy.mockRestore();
      hapticSpy.mockRestore();
      activateAwakeSpy.mockRestore();
      deactivateAwakeSpy.mockRestore();
      appListenerSpy.mockRestore();
    });

    test('D4 Stryker (pass 2): clearInterval, removeSub, deactivateKeepAwake, notifyTick, clampowanie korekt i ostrzeżenie po korekcie', () => {
      const timerPlatform = require('../../platform/timer-platform');
      const playChimeSpy = jest.spyOn(timerAudioModule, 'playTimerChime').mockResolvedValue(true);
      const deactivateAwakeSpy = jest.spyOn(timerPlatform, 'deactivateTimerKeepAwake').mockImplementation(() => {});
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      const removeSubMock = jest.fn();
      const appListenerSpy = jest.spyOn(timerPlatform, 'addAppActiveListener').mockImplementation(() => ({
        remove: removeSubMock,
      }));

      const onTick = jest.fn();
      const onWarning = jest.fn();
      const engine = new BrewTimerEngine(testSteps, { onTick, onWarning });

      // 1. Synchronous notifyTick on adjustStepDuration / resetCurrentStep / nextStep / previousStep / reset / finish
      engine.start();
      jest.advanceTimersByTime(10000); // 10s elapsed, 20s remaining

      // Clamp adjustStepDuration below elapsed + 1 -> durationSeconds === 11 (not 9), remaining === 1
      onTick.mockClear();
      engine.adjustStepDuration(-100);
      expect(onTick).toHaveBeenCalledTimes(1);
      expect(engine.getSnapshot().currentStep?.durationSeconds).toBe(11);
      expect(engine.getSnapshot().stepRemainingSeconds).toBe(1);

      // Pause -> adjustStepDuration(+20) & adjustStepDuration(-100) clamp pausedRemainingMs
      onTick.mockClear();
      engine.pause();
      expect(onTick).toHaveBeenCalledTimes(1);
      expect(clearIntervalSpy).toHaveBeenCalled();

      engine.adjustStepDuration(20); // duration=31, remaining=21
      expect(engine.getSnapshot().stepRemainingSeconds).toBe(21);
      engine.adjustStepDuration(-100); // clamped to remaining=1s
      expect(engine.getSnapshot().stepRemainingSeconds).toBe(1);
      engine.resume();
      jest.advanceTimersByTime(1000);
      expect(engine.getSnapshot().currentStepIndex).toBe(1);

      // 2. Warning key re-arming when adjusting inside <=3s and back above >3s
      engine.reset();
      expect(removeSubMock).toHaveBeenCalled();
      expect(deactivateAwakeSpy).toHaveBeenCalled();
      onTick.mockClear();
      engine.resetCurrentStep(0); // invalid 0 -> unchanged (11s)
      expect(onTick).toHaveBeenCalledTimes(1);
      expect(engine.getSnapshot().currentStep?.durationSeconds).toBe(11);
      engine.resetCurrentStep(10); // idle resetCurrentStep
      expect(engine.getSnapshot().currentStep?.durationSeconds).toBe(10);

      playChimeSpy.mockClear();
      onWarning.mockClear();
      engine.start();
      jest.advanceTimersByTime(8000); // 2s left -> warning(2) & chime #1
      expect(onWarning).toHaveBeenCalledWith(2);
      expect(playChimeSpy).toHaveBeenCalledTimes(1);

      // Adjust +1s -> 3s remaining (<= 3, key changes from 0:2 to 0:3 -> re-arms warning)
      onWarning.mockClear();
      engine.adjustStepDuration(1);
      engine.syncWithRealTime();
      expect(onWarning).toHaveBeenCalledWith(3);

      // Adjust +5s -> 8s remaining (> 3 -> resets chimePlayedForStep so chime fires again at <=3s)
      engine.adjustStepDuration(5);
      jest.advanceTimersByTime(5000); // now 3s left -> chime #2!
      expect(playChimeSpy).toHaveBeenCalledTimes(2);

      // 3. nextStep / previousStep while paused emit notifyTick and do NOT start ticking
      engine.pause();
      onTick.mockClear();
      engine.nextStep();
      expect(onTick).toHaveBeenCalledTimes(1);
      expect(engine.getSnapshot().currentStepIndex).toBe(1);
      onTick.mockClear();
      engine.previousStep();
      expect(onTick).toHaveBeenCalledTimes(1);
      expect(engine.getSnapshot().currentStepIndex).toBe(0);

      // 4. finish() clears interval, removes listener, deactivates keepAwake, emits notifyTick
      engine.resume();
      clearIntervalSpy.mockClear();
      removeSubMock.mockClear();
      deactivateAwakeSpy.mockClear();
      onTick.mockClear();
      engine.finish();
      expect(clearIntervalSpy).toHaveBeenCalledTimes(1);
      expect(removeSubMock).toHaveBeenCalledTimes(1);
      expect(deactivateAwakeSpy).toHaveBeenCalledTimes(1);
      expect(onTick).toHaveBeenCalledTimes(1);

      // 5. reset() while running clears interval, removes listener, deactivates keepAwake, emits notifyTick
      engine.start();
      clearIntervalSpy.mockClear();
      removeSubMock.mockClear();
      deactivateAwakeSpy.mockClear();
      onTick.mockClear();
      engine.reset();
      expect(clearIntervalSpy).toHaveBeenCalledTimes(1);
      expect(removeSubMock).toHaveBeenCalledTimes(1);
      expect(deactivateAwakeSpy).toHaveBeenCalledTimes(1);
      expect(onTick).toHaveBeenCalledTimes(1);

      // resetCurrentStep with NaN, Infinity, non-number leaves duration unchanged
      const durBefore = engine.getSnapshot().currentStep?.durationSeconds;
      engine.resetCurrentStep(NaN);
      engine.resetCurrentStep(Infinity);
      engine.resetCurrentStep('20' as any);
      expect(engine.getSnapshot().currentStep?.durationSeconds).toBe(durBefore);

      // adjustStepDuration(0) at same warning second keeps lastWarningKey (does NOT re-fire warning)
      engine.resetCurrentStep(10);
      engine.start();
      onWarning.mockClear();
      jest.advanceTimersByTime(8000); // 3s i 2s -> 2 wywołania onWarning
      expect(onWarning).toHaveBeenCalledTimes(2);
      engine.adjustStepDuration(0);
      engine.syncWithRealTime();
      expect(onWarning).toHaveBeenCalledTimes(2);

      // 6. destroy() while running clears interval, removes listener, deactivates keepAwake
      clearIntervalSpy.mockClear();
      removeSubMock.mockClear();
      deactivateAwakeSpy.mockClear();
      engine.destroy();
      expect(clearIntervalSpy).toHaveBeenCalledTimes(1);
      expect(removeSubMock).toHaveBeenCalledTimes(1);
      expect(deactivateAwakeSpy).toHaveBeenCalledTimes(1);

      // 6. getSnapshot edge cases: zero water & zero duration
      const edgeEngine = new BrewTimerEngine([
        { stepNumber: 1, namePl: 'S1', targetWaterGrams: 0, durationSeconds: 0, instructionPl: '' },
        { stepNumber: 2, namePl: 'S2', targetWaterGrams: 0, durationSeconds: 10, instructionPl: '' },
      ]);
      const s0 = edgeEngine.getSnapshot();
      expect(s0.previousWaterGrams).toBe(0);
      expect(s0.targetWaterGrams).toBe(0);
      expect(s0.stepRemainingSeconds).toBe(1);
      expect(s0.recommendedPourRate).toBe(0);
      edgeEngine.nextStep();
      const s1 = edgeEngine.getSnapshot();
      expect(s1.previousWaterGrams).toBe(0);
      expect(s1.recommendedPourRate).toBe(0);
      edgeEngine.destroy();

      playChimeSpy.mockRestore();
      deactivateAwakeSpy.mockRestore();
      clearIntervalSpy.mockRestore();
      appListenerSpy.mockRestore();
    });
  });
});

// ============================================================================
// Napar — Unit Tests: Startup Crash Loop Guard (TASK-R12-01)
// ============================================================================

import { crashLoopGuard, recordStartupSuccess } from '../../data/startup-guard';
import * as FileSystem from 'expo-file-system/legacy';

// Atrapa legacy z jest.setup.js (pliki w pamięci po ścieżce); guard importuje 'expo-file-system/legacy' (M1-audytor-generalny-005).

describe('Startup Crash Loop Guard (TASK-R12-01)', () => {
  beforeEach(() => {
    (FileSystem as any).__reset();
  });

  test('Inicjalny start rejestruje 1 próbę i nie wchodzi w Safe Mode', async () => {
    const res = await crashLoopGuard.recordStartupAttempt();
    expect(res.crashCount).toBe(1);
    expect(res.shouldEnterSafeMode).toBe(false);
  });

  test('Drugi nieudany start rejestruje 2 próby i nie wchodzi w Safe Mode', async () => {
    await crashLoopGuard.recordStartupAttempt();
    const res = await crashLoopGuard.recordStartupAttempt();
    expect(res.crashCount).toBe(2);
    expect(res.shouldEnterSafeMode).toBe(false);
  });

  test('Trzeci nieudany start (>= 3) aktywuje Safe Mode (shouldEnterSafeMode = true)', async () => {
    await crashLoopGuard.recordStartupAttempt();
    await crashLoopGuard.recordStartupAttempt();
    const res = await crashLoopGuard.recordStartupAttempt();
    expect(res.crashCount).toBe(3);
    expect(res.shouldEnterSafeMode).toBe(true);
  });

  test('recordStartupSuccess zeruje licznik awarii', async () => {
    await crashLoopGuard.recordStartupAttempt();
    await crashLoopGuard.recordStartupAttempt();
    await crashLoopGuard.recordStartupSuccess();

    const state = await crashLoopGuard.readState();
    expect(state.crash_count).toBe(0);

    const nextAttempt = await crashLoopGuard.recordStartupAttempt();
    expect(nextAttempt.crashCount).toBe(1);
    expect(nextAttempt.shouldEnterSafeMode).toBe(false);
  });
  test('resetCrashCount zeruje stan licznika awarii', async () => {
    await crashLoopGuard.recordStartupAttempt();
    await crashLoopGuard.resetCrashCount();
    const state = await crashLoopGuard.readState();
    expect(state.crash_count).toBe(0);
  });

  test('recordStartupSuccess zeruje stan awarii przy udanym starcie', async () => {
    await crashLoopGuard.recordStartupAttempt();
    await recordStartupSuccess();
    const state = await crashLoopGuard.readState();
    expect(state.crash_count).toBe(0);
  });

  test('readState i writeState obsługują błędy wejścia/wyjścia FileSystem bez awarii', async () => {
    const origRead = (FileSystem as any).readAsStringAsync;
    const origWrite = (FileSystem as any).writeAsStringAsync;
    try {
      (FileSystem as any).readAsStringAsync = jest.fn().mockRejectedValueOnce(new Error('I/O error'));
      const state = await crashLoopGuard.readState();
      expect(state.crash_count).toBe(0);

      (FileSystem as any).writeAsStringAsync = jest.fn().mockRejectedValueOnce(new Error('Disk full'));
      await expect(crashLoopGuard.writeState({ crash_count: 1, lastAttemptAt: new Date().toISOString() })).resolves.not.toThrow();
    } finally {
      (FileSystem as any).readAsStringAsync = origRead;
      (FileSystem as any).writeAsStringAsync = origWrite;
    }
  });

  test('TASK-P60-10-WYD: readState oczyszcza BOM i poprawnie parsuje plik ze znacznikiem \uFEFF', async () => {
    const rawWithBom = '\uFEFF' + JSON.stringify({ crash_count: 2, lastAttemptAt: '2026-10-27T07:00:00.000Z' });
    await FileSystem.writeAsStringAsync(await crashLoopGuard.getGuardPath(), rawWithBom);

    const state = await crashLoopGuard.readState();
    expect(state.crash_count).toBe(2);
    expect(state.lastAttemptAt).toBe('2026-10-27T07:00:00.000Z');
  });

  test('TASK-P60-10-WYD: readState i recordStartupAttempt chronią przed wartościami ujemnymi, -0, NaN i nieprawidłowymi datami', async () => {
    const corrupted = JSON.stringify({ crash_count: -10, lastAttemptAt: 'not-a-valid-date' });
    await FileSystem.writeAsStringAsync(await crashLoopGuard.getGuardPath(), corrupted);

    const state = await crashLoopGuard.readState();
    expect(state.crash_count).toBe(0);
    expect(!isNaN(new Date(state.lastAttemptAt).getTime())).toBe(true);

    const nextAttempt = await crashLoopGuard.recordStartupAttempt();
    expect(nextAttempt.crashCount).toBe(1);
    expect(nextAttempt.shouldEnterSafeMode).toBe(false);
  });

  test('TASK-P60-10-WYD: recordStartupAttempt ogranicza maksymalny licznik awarii do 100', async () => {
    await FileSystem.writeAsStringAsync(await crashLoopGuard.getGuardPath(), JSON.stringify({ crash_count: 999, lastAttemptAt: new Date().toISOString() }));
    const state = await crashLoopGuard.readState();
    expect(state.crash_count).toBe(100);

    const nextAttempt = await crashLoopGuard.recordStartupAttempt();
    expect(nextAttempt.crashCount).toBe(100);
    expect(nextAttempt.shouldEnterSafeMode).toBe(true);
  });

  test('TASK-P63-10-WYD: isInSafeMode i getCrashCount umozliwiaja bezinwazyjny odczyt stanu awaryjnego', async () => {
    // Stan początkowy
    expect(await crashLoopGuard.getCrashCount()).toBe(0);
    expect(await crashLoopGuard.isInSafeMode()).toBe(false);

    // Po 2 awariach
    await crashLoopGuard.recordStartupAttempt();
    await crashLoopGuard.recordStartupAttempt();
    expect(await crashLoopGuard.getCrashCount()).toBe(2);
    expect(await crashLoopGuard.isInSafeMode()).toBe(false);

    // Po 3 awariach -> Safe Mode
    await crashLoopGuard.recordStartupAttempt();
    expect(await crashLoopGuard.getCrashCount()).toBe(3);
    expect(await crashLoopGuard.isInSafeMode()).toBe(true);

    // Po resecie
    await crashLoopGuard.resetCrashCount();
    expect(await crashLoopGuard.getCrashCount()).toBe(0);
    expect(await crashLoopGuard.isInSafeMode()).toBe(false);
  });

  test('M2-P3b: recordStartupFailureReason zapamiętuje too-new do 3. startu i jest czyszczony przy sukcesie/resecie/retry', async () => {
    const attempt1 = await crashLoopGuard.recordStartupAttempt();
    expect(attempt1.lastReason).toBeUndefined();
    await crashLoopGuard.recordStartupFailureReason('too-new');

    const attempt2 = await crashLoopGuard.recordStartupAttempt();
    expect(attempt2.crashCount).toBe(2);
    expect(attempt2.shouldEnterSafeMode).toBe(false);
    expect(attempt2.lastReason).toBe('too-new');

    const attempt3 = await crashLoopGuard.recordStartupAttempt();
    expect(attempt3.crashCount).toBe(3);
    expect(attempt3.shouldEnterSafeMode).toBe(true);
    expect(attempt3.lastReason).toBe('too-new');

    await crashLoopGuard.recordRetry();
    expect((await crashLoopGuard.readState()).lastReason).toBeUndefined();

    await crashLoopGuard.recordStartupFailureReason('too-new');
    await crashLoopGuard.recordStartupSuccess();
    expect((await crashLoopGuard.readState()).lastReason).toBeUndefined();

    await crashLoopGuard.recordStartupFailureReason('too-new');
    await crashLoopGuard.resetCrashCount();
    expect((await crashLoopGuard.readState()).lastReason).toBeUndefined();
  });

  test('M2-P3b: readState ignoruje nieprawidłowe wartości lastReason', async () => {
    await FileSystem.writeAsStringAsync(
      await crashLoopGuard.getGuardPath(),
      JSON.stringify({ crash_count: 2, lastAttemptAt: new Date().toISOString(), lastReason: 'invalid-reason' })
    );
    const state = await crashLoopGuard.readState();
    expect(state.lastReason).toBeUndefined();
  });
});


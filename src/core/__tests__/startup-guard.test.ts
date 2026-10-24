// ============================================================================
// Napar (Steepwise) — Unit Tests: Startup Crash Loop Guard (TASK-R12-01)
// ============================================================================

import { crashLoopGuard, recordStartupSuccess } from '../startup-guard';
import * as FileSystem from 'expo-file-system';

jest.mock('expo-file-system', () => {
  let fileContent = '';
  return {
    documentDirectory: 'file:///data/user/0/pl.lukasz.napar/files/',
    getInfoAsync: jest.fn(async () => ({
      exists: Boolean(fileContent),
    })),
    readAsStringAsync: jest.fn(async () => fileContent),
    writeAsStringAsync: jest.fn(async (_path: string, content: string) => {
      fileContent = content;
    }),
    __reset: () => {
      fileContent = '';
    },
  };
});

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
});

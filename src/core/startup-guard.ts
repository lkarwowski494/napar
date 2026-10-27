// ============================================================================
// Napar (Steepwise) — Startup Crash Loop Guard (TASK-R12-01)
// Protects against repeated crash loops during startup and initialization
// ============================================================================

import * as FileSystem from 'expo-file-system';

const GUARD_FILE = 'crash_count.json';

interface GuardState {
  crash_count: number;
  lastAttemptAt: string;
}

export const crashLoopGuard = {
  async getGuardPath(): Promise<string> {
    const docDir = (FileSystem as any).documentDirectory || '';
    return `${docDir}${GUARD_FILE}`;
  },

  async readState(): Promise<GuardState> {
    try {
      const path = await this.getGuardPath();
      const info = await FileSystem.getInfoAsync(path);
      if (!info.exists) {
        return { crash_count: 0, lastAttemptAt: new Date().toISOString() };
      }
      const raw = await FileSystem.readAsStringAsync(path);
      const cleanRaw = (raw || '').replace(/\uFEFF/g, '').trim();
      if (!cleanRaw) {
        return { crash_count: 0, lastAttemptAt: new Date().toISOString() };
      }
      const parsed = JSON.parse(cleanRaw);
      let crashCount = 0;
      if (
        typeof parsed.crash_count === 'number' &&
        Number.isFinite(parsed.crash_count) &&
        parsed.crash_count > 0 &&
        !Object.is(parsed.crash_count, -0)
      ) {
        crashCount = Math.min(100, Math.floor(parsed.crash_count));
      }

      const validDate =
        typeof parsed.lastAttemptAt === 'string' && !isNaN(new Date(parsed.lastAttemptAt).getTime())
          ? parsed.lastAttemptAt
          : new Date().toISOString();

      return {
        crash_count: crashCount,
        lastAttemptAt: validDate,
      };
    } catch {
      return { crash_count: 0, lastAttemptAt: new Date().toISOString() };
    }
  },

  async writeState(state: GuardState): Promise<void> {
    try {
      const path = await this.getGuardPath();
      await FileSystem.writeAsStringAsync(path, JSON.stringify(state));
    } catch {
      // Ignoruj błąd zapisu strażnika
    }
  },

  async recordStartupAttempt(): Promise<{ crashCount: number; shouldEnterSafeMode: boolean }> {
    const state = await this.readState();
    state.crash_count = Math.min(100, state.crash_count + 1);
    state.lastAttemptAt = new Date().toISOString();
    await this.writeState(state);

    const shouldEnterSafeMode = state.crash_count >= 3;
    return {
      crashCount: state.crash_count,
      shouldEnterSafeMode,
    };
  },

  async recordStartupSuccess(): Promise<void> {
    await this.writeState({
      crash_count: 0,
      lastAttemptAt: new Date().toISOString(),
    });
  },

  async resetCrashCount(): Promise<void> {
    await this.recordStartupSuccess();
  },
};

export const recordStartupSuccess = () => crashLoopGuard.recordStartupSuccess();

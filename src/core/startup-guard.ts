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
      const parsed = JSON.parse(raw);
      return {
        crash_count: typeof parsed.crash_count === 'number' ? parsed.crash_count : 0,
        lastAttemptAt: parsed.lastAttemptAt || new Date().toISOString(),
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
    state.crash_count += 1;
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

// ============================================================================
// Napar (Steepwise) — Port bazy danych (granica core <-> SQLite)
// Moduły repozytoriów w src/core zależą wyłącznie od tego interfejsu.
// Implementacja expo-sqlite żyje w src/platform/sqlite-adapter.ts.
// ============================================================================

type SqlValue = string | number | null;
export type SqlParams = SqlValue[];

export interface DbPort {
  execSync(source: string): void;
  runSync(source: string, params?: SqlParams): void;
  getFirstSync<T>(source: string, params?: SqlParams): T | null;
  getAllSync<T>(source: string, params?: SqlParams): T[];
  withTransactionSync(task: () => void): void;
}

// ============================================================================
// Napar (Steepwise) — Wybór lokalizacji bazy (D8, wariant B)
// Czysta logika: zależności (exists / makeDirectory / open) są wstrzykiwane,
// więc nie zależy od expo-sqlite ani expo-file-system.
// Preferowana ścieżka: /Library/SQLite (SEC-09). Gdy się nie uda, otwierana jest
// domyślna ścieżka expo-sqlite, a fallback zostaje zapisany w wyniku (bez cichej utraty danych).
// ============================================================================

import { dbDirectory } from './db-path';

export interface LocationFallback {
  preferredDirectory: string;
  reason: string;
}

export interface OpenedLocation<T> {
  db: T;
  /** Katalog użyty do otwarcia; undefined oznacza domyślną ścieżkę expo-sqlite. */
  directory: string | undefined;
  fallback: LocationFallback | null;
}

export interface LocationDeps<T> {
  defaultDirectory: string | null | undefined;
  exists: (directory: string) => boolean;
  makeDirectory: (directory: string) => void;
  open: (directory: string | undefined) => T;
}

export function errorReason(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function openDatabaseLocation<T>(deps: LocationDeps<T>): OpenedLocation<T> {
  const preferred = dbDirectory(deps.defaultDirectory);
  if (preferred === undefined) {
    return { db: deps.open(undefined), directory: undefined, fallback: null };
  }

  try {
    if (!deps.exists(preferred)) {
      deps.makeDirectory(preferred);
    }
    return { db: deps.open(preferred), directory: preferred, fallback: null };
  } catch (error) {
    // Fallback na domyślną ścieżkę; powód trafia do wyniku, żeby aplikacja mogła go zapisać.
    return {
      db: deps.open(undefined),
      directory: undefined,
      fallback: { preferredDirectory: preferred, reason: errorReason(error) },
    };
  }
}

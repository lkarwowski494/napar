// ============================================================================
// Napar (Steepwise) — Repozytorium: Log Kofeiny (Caffeine Tracker)
// ============================================================================

import type { DbPort } from '../db-port';
import type { CaffeineLog } from '../database-schema';

export interface CaffeineLogRow {
  id: string;
  brew_session_id: string | null;
  beverage_name: string;
  beverage_type: 'coffee' | 'tea';
  consumed_at: string;
  dose_g: number;
  caffeine_mg: number;
}

function mapRowToCaffeineLog(r: CaffeineLogRow): CaffeineLog {
  return {
    id: r.id,
    brewSessionId: r.brew_session_id ?? undefined,
    beverageName: r.beverage_name,
    beverageType: r.beverage_type,
    consumedAt: r.consumed_at,
    doseGrams: r.dose_g,
    caffeineMg: r.caffeine_mg,
  };
}

/**
 * Logi kofeiny. Z `sinceIso` — od podanej chwili rosnąco (UI wykresu);
 * bez argumentu — wszystkie, najnowsze pierwsze (eksport i kopia; bez LIMIT).
 */
export function listCaffeineLogs(db: DbPort, sinceIso?: string): CaffeineLog[] {
  const rows = sinceIso
    ? db.getAllSync<CaffeineLogRow>(
        'SELECT * FROM caffeine_logs WHERE consumed_at >= ? ORDER BY consumed_at ASC',
        [sinceIso]
      )
    : db.getAllSync<CaffeineLogRow>('SELECT * FROM caffeine_logs ORDER BY consumed_at DESC');
  return rows.map(mapRowToCaffeineLog);
}

export function logCaffeine(db: DbPort, log: CaffeineLog): void {
  db.runSync(
    `INSERT OR REPLACE INTO caffeine_logs (
      id, brew_session_id, beverage_name, beverage_type, consumed_at, dose_g, caffeine_mg
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      log.id,
      log.brewSessionId ?? null,
      log.beverageName,
      log.beverageType,
      log.consumedAt,
      log.doseGrams,
      log.caffeineMg,
    ]
  );
}

export function deleteCaffeineLog(db: DbPort, id: string): void {
  db.runSync('DELETE FROM caffeine_logs WHERE id = ?', [id]);
}

// ============================================================================
// Napar (Steepwise) — Unit Tests: repozytoria własnej wody (poz. 9) i kalibracji młynka (poz. 12)
// Prawdziwy SQL (sql.js). Oczekiwane wartości policzone ręcznie w komentarzach.
// ============================================================================

import { createMemoryDb, loadSqlJs, type MemoryDb, type SqlJsModule } from '../../../tests/helpers/sqljs-port';
import type { DbPort } from '../db-port';
import type { BrewSession } from '../database-schema';
import { initDatabaseSchema, readUserVersion, TARGET_SCHEMA_VERSION } from '../repositories/schema';
import { getBrewSessionById, saveBrewSession } from '../repositories/brew-sessions';
import {
  CALIBRATION_RESET_PREFIX,
  getGrinderCalibration,
  getGrinderCalibrationPairs,
  resetGrinderCalibration,
} from '../repositories/grinder-calibration';
import {
  OWN_WATER_SETTING_KEY,
  deleteOwnWaterProfile,
  getOwnWaterProfile,
  saveOwnWaterProfile,
} from '../repositories/water-profile';
import { setAppSetting } from '../repositories/app-settings';
import { collectBackupState, importBackupState } from '../backup';

let SQL: SqlJsModule;

beforeAll(async () => {
  SQL = await loadSqlJs();
});

function fresh(): MemoryDb {
  const db = createMemoryDb(SQL);
  initDatabaseSchema(db.port);
  return db;
}

function portWith(base: DbPort, overrides: Partial<DbPort>): DbPort {
  return { ...base, ...overrides };
}

const BASE: BrewSession = {
  id: 's',
  beverageType: 'COFFEE',
  method: 'V60',
  doseGrams: 15,
  waterGrams: 250,
  waterTempCelsius: 94,
  totalTimeSeconds: 180,
  flavorTags: [],
  brewedAt: '2026-10-01T07:00:00.000Z',
};

/** Parzenie z kalibracją: kliki pokazane, kliki bazowe i EY (EY pominięte = brak pary). */
function brew(
  id: string,
  brewedAt: string,
  options: { grinderId?: string; clicks?: number; baseClicks?: number; ey?: number } = {}
): BrewSession {
  return {
    ...BASE,
    id,
    brewedAt,
    grinderId: options.grinderId ?? 'comandante_c40',
    grinderClicks: options.clicks,
    grinderBaseClicks: options.baseClicks,
    extractionYieldPercentage: options.ey,
  };
}

const PROFILE = {
  sourceName: 'Wodociągi Kraków',
  ghPpm: 80.5,
  khPpm: 89.2,
  updatedAt: '2026-10-22T10:00:00.000Z',
};

describe('Repozytorium: własna woda (poz. 9)', () => {
  test('Brak zapisanego profilu daje null', () => {
    const db = fresh();
    expect(getOwnWaterProfile(db.port)).toBeNull();
  });

  test('Zapis i odczyt profilu zachowuje wszystkie pola', () => {
    const db = fresh();
    saveOwnWaterProfile(db.port, PROFILE);
    expect(getOwnWaterProfile(db.port)).toEqual(PROFILE);
  });

  test('Ponowny zapis nadpisuje profil', () => {
    const db = fresh();
    saveOwnWaterProfile(db.port, PROFILE);
    saveOwnWaterProfile(db.port, { ...PROFILE, khPpm: 40 });
    expect(getOwnWaterProfile(db.port)?.khPpm).toBe(40);
  });

  test('Usunięcie profilu przywraca null', () => {
    const db = fresh();
    saveOwnWaterProfile(db.port, PROFILE);
    deleteOwnWaterProfile(db.port);
    expect(getOwnWaterProfile(db.port)).toBeNull();
  });

  test('Uszkodzony JSON jest traktowany jako brak profilu', () => {
    const db = fresh();
    setAppSetting(db.port, OWN_WATER_SETTING_KEY, '{nie-json');
    expect(getOwnWaterProfile(db.port)).toBeNull();
  });

  test('Niepoprawny kształt danych (ujemna twardość, brak nazwy, zły typ) daje null', () => {
    const db = fresh();
    setAppSetting(db.port, OWN_WATER_SETTING_KEY, JSON.stringify({ ...PROFILE, ghPpm: -1 }));
    expect(getOwnWaterProfile(db.port)).toBeNull();

    setAppSetting(db.port, OWN_WATER_SETTING_KEY, JSON.stringify({ ...PROFILE, sourceName: 5 }));
    expect(getOwnWaterProfile(db.port)).toBeNull();

    setAppSetting(db.port, OWN_WATER_SETTING_KEY, JSON.stringify({ ...PROFILE, khPpm: 'x' }));
    expect(getOwnWaterProfile(db.port)).toBeNull();

    setAppSetting(db.port, OWN_WATER_SETTING_KEY, JSON.stringify({ ...PROFILE, updatedAt: 1 }));
    expect(getOwnWaterProfile(db.port)).toBeNull();
  });

  test('Profil wchodzi do kopii zapasowej i wraca po imporcie (bez zmiany formatu kopii)', () => {
    const source = fresh();
    saveOwnWaterProfile(source.port, PROFILE);
    const state = collectBackupState(source.port);
    expect(state.settings[OWN_WATER_SETTING_KEY]).toBe(JSON.stringify(PROFILE));

    const target = fresh();
    importBackupState(target.port, state);
    expect(getOwnWaterProfile(target.port)).toEqual(PROFILE);
  });
});

describe('Repozytorium: dziennik z polami młynka (poz. 12)', () => {
  test('Pola młynka zapisują się i wracają z sesji', () => {
    const db = fresh();
    saveBrewSession(db.port, brew('a', '2026-10-01T07:00:00.000Z', { clicks: 23, baseClicks: 24, ey: 20 }));
    const back = getBrewSessionById(db.port, 'a');
    expect(back?.grinderId).toBe('comandante_c40');
    expect(back?.grinderClicks).toBe(23);
    expect(back?.grinderBaseClicks).toBe(24);
  });

  test('Sesja bez pól młynka wraca bez nich (stare dane i herbata)', () => {
    const db = fresh();
    saveBrewSession(db.port, { ...BASE, id: 'old' });
    const back = getBrewSessionById(db.port, 'old');
    expect(back?.grinderId).toBeUndefined();
    expect(back?.grinderClicks).toBeUndefined();
    expect(back?.grinderBaseClicks).toBeUndefined();
  });

  test('Błąd w trakcie migracji v4 wycofuje zmiany i zgłasza błąd', () => {
    const db = createMemoryDb(SQL);
    db.port.execSync('PRAGMA user_version = 3;');
    const failing = portWith(db.port, {
      execSync: (source: string) => {
        if (source === 'BEGIN TRANSACTION;') throw new Error('transakcja niedostępna');
        db.port.execSync(source);
      },
    });
    expect(() => initDatabaseSchema(failing)).toThrow('transakcja niedostępna');
    expect(readUserVersion(db.port)).toBe(3);
  });

  test('Migracja z v3 dodaje kolumny młynka i ustawia wersję 4', () => {
    const db = createMemoryDb(SQL);
    // Schemat v3: tabela bez trzech kolumn młynka
    db.port.execSync('DROP TABLE IF EXISTS brew_sessions;');
    db.port.execSync(`CREATE TABLE brew_sessions (
      id TEXT PRIMARY KEY NOT NULL, recipe_id TEXT, recipe_name TEXT, inventory_item_id TEXT,
      inventory_item_name TEXT, beverage_type TEXT NOT NULL, method TEXT NOT NULL, dose_g REAL NOT NULL,
      water_g REAL NOT NULL, water_temp_c REAL NOT NULL, water_profile TEXT, grind_setting TEXT,
      total_time_seconds INTEGER NOT NULL, rating REAL, flavor_tags_json TEXT, taste_balance TEXT,
      tds_percentage REAL, extraction_yield_percentage REAL, caffeine_content_mg REAL, notes TEXT,
      infusion_number INTEGER DEFAULT 1, sensory_scores_json TEXT, brewed_at TEXT NOT NULL);`);
    db.port.execSync('PRAGMA user_version = 3;');

    initDatabaseSchema(db.port);

    const columns = db.port.getAllSync<{ name: string }>('PRAGMA table_info(brew_sessions)').map((c) => c.name);
    expect(columns).toEqual(expect.arrayContaining(['grinder_id', 'grinder_clicks', 'grinder_base_clicks']));
    expect(readUserVersion(db.port)).toBe(4);
    expect(TARGET_SCHEMA_VERSION).toBe(4);
  });
});

describe('Repozytorium: kalibracja młynka z dziennika (poz. 12)', () => {
  test('Prefiks klucza wyzerowania w ustawieniach (wchodzi do kopii zapasowej)', () => {
    expect(CALIBRATION_RESET_PREFIX).toBe('grinder_calibration_reset_');
    const db = fresh();
    resetGrinderCalibration(db.port, 'comandante_c40', new Date('2026-10-10T00:00:00.000Z'));
    expect(collectBackupState(db.port).settings[`${CALIBRATION_RESET_PREFIX}comandante_c40`]).toBe(
      '2026-10-10T00:00:00.000Z'
    );
  });

  test('Dwie pary: pary liczone, kalibracja nieaktywna', () => {
    const db = fresh();
    saveBrewSession(db.port, brew('a', '2026-10-01T07:00:00.000Z', { clicks: 24, baseClicks: 24, ey: 18 }));
    saveBrewSession(db.port, brew('b', '2026-10-02T07:00:00.000Z', { clicks: 24, baseClicks: 24, ey: 19 }));
    expect(getGrinderCalibrationPairs(db.port, 'comandante_c40')).toHaveLength(2);
    expect(getGrinderCalibration(db.port, 'comandante_c40')).toEqual({
      shiftClicks: 0,
      pairCount: 2,
      isActive: false,
    });
  });

  test('Trzy pary: przesunięcie −1,0 policzone ręcznie (EY 18, 19, 21 przy kliknięciach 24 = bazie)', () => {
    const db = fresh();
    saveBrewSession(db.port, brew('a', '2026-10-01T07:00:00.000Z', { clicks: 24, baseClicks: 24, ey: 18 }));
    saveBrewSession(db.port, brew('b', '2026-10-02T07:00:00.000Z', { clicks: 24, baseClicks: 24, ey: 19 }));
    saveBrewSession(db.port, brew('c', '2026-10-03T07:00:00.000Z', { clicks: 24, baseClicks: 24, ey: 21 }));
    expect(getGrinderCalibration(db.port, 'comandante_c40')).toEqual({
      shiftClicks: -1,
      pairCount: 3,
      isActive: true,
    });
  });

  test('Pary bez EY, bez pól młynka i z EY 0 nie są liczone', () => {
    const db = fresh();
    saveBrewSession(db.port, brew('no-ey', '2026-10-01T07:00:00.000Z', { clicks: 24, baseClicks: 24 }));
    saveBrewSession(db.port, brew('zero-ey', '2026-10-02T07:00:00.000Z', { clicks: 24, baseClicks: 24, ey: 0 }));
    saveBrewSession(db.port, brew('no-clicks', '2026-10-03T07:00:00.000Z', { ey: 20 }));
    saveBrewSession(db.port, brew('no-base', '2026-10-04T07:00:00.000Z', { clicks: 24, ey: 20 }));
    expect(getGrinderCalibrationPairs(db.port, 'comandante_c40')).toHaveLength(0);
  });

  test('Dwa młynki są niezależne: pary jednego nie wpływają na drugi', () => {
    const db = fresh();
    saveBrewSession(db.port, brew('c1', '2026-10-01T07:00:00.000Z', { clicks: 24, baseClicks: 24, ey: 18 }));
    saveBrewSession(db.port, brew('c2', '2026-10-02T07:00:00.000Z', { clicks: 24, baseClicks: 24, ey: 19 }));
    saveBrewSession(db.port, brew('c3', '2026-10-03T07:00:00.000Z', { clicks: 24, baseClicks: 24, ey: 21 }));
    saveBrewSession(
      db.port,
      brew('t1', '2026-10-04T07:00:00.000Z', { grinderId: 'timemore_c2_c3', clicks: 21, baseClicks: 21, ey: 20 })
    );

    expect(getGrinderCalibration(db.port, 'comandante_c40')).toMatchObject({ pairCount: 3, isActive: true });
    expect(getGrinderCalibration(db.port, 'timemore_c2_c3')).toEqual({
      shiftClicks: 0,
      pairCount: 1,
      isActive: false,
    });
  });

  test('Wyzerowanie liczy tylko parzenia od tej chwili; stare parzenia zostają w dzienniku', () => {
    const db = fresh();
    saveBrewSession(db.port, brew('a', '2026-10-01T07:00:00.000Z', { clicks: 24, baseClicks: 24, ey: 18 }));
    saveBrewSession(db.port, brew('b', '2026-10-02T07:00:00.000Z', { clicks: 24, baseClicks: 24, ey: 19 }));
    saveBrewSession(db.port, brew('c', '2026-10-03T07:00:00.000Z', { clicks: 24, baseClicks: 24, ey: 21 }));
    expect(getGrinderCalibration(db.port, 'comandante_c40').isActive).toBe(true);

    resetGrinderCalibration(db.port, 'comandante_c40', new Date('2026-10-10T00:00:00.000Z'));

    expect(getGrinderCalibration(db.port, 'comandante_c40')).toEqual({
      shiftClicks: 0,
      pairCount: 0,
      isActive: false,
    });
    expect(getBrewSessionById(db.port, 'a')).not.toBeNull();

    saveBrewSession(db.port, brew('d', '2026-10-11T07:00:00.000Z', { clicks: 24, baseClicks: 24, ey: 19 }));
    expect(getGrinderCalibration(db.port, 'comandante_c40').pairCount).toBe(1);
  });

  test('Wyzerowanie jednego młynka nie rusza kalibracji drugiego', () => {
    const db = fresh();
    for (const [i, ey] of [18, 19, 21].entries()) {
      saveBrewSession(db.port, brew(`t${i}`, `2026-10-0${i + 1}T07:00:00.000Z`, { grinderId: 'timemore_c2_c3', clicks: 21, baseClicks: 21, ey }));
    }
    // Bez jawnej daty: znacznik to bieżący czas, starsze parzenia comandante przestają się liczyć
    resetGrinderCalibration(db.port, 'comandante_c40');
    expect(getGrinderCalibration(db.port, 'timemore_c2_c3')).toMatchObject({ pairCount: 3, isActive: true });
    expect(getGrinderCalibration(db.port, 'comandante_c40').pairCount).toBe(0);
  });

  test('Błąd odczytu dziennika daje brak kalibracji zamiast wyjątku', () => {
    const db = fresh();
    const broken = portWith(db.port, {
      getAllSync: () => {
        throw new Error('brak bazy');
      },
    });
    expect(getGrinderCalibration(broken, 'comandante_c40')).toEqual({
      shiftClicks: 0,
      pairCount: 0,
      isActive: false,
    });
  });
});

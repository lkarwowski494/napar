// ============================================================================
// Napar (Steepwise) — Unit Tests: repozytorium dni wliczonych do darmowego limitu
// Prawdziwy SQL (sql.js). Sprawdza: dopisywanie bez cofania, idempotencję dnia,
// wpisy ręczne poza limitem, odporność na uszkodzony stan i brak wpływu kopii zapasowej.
// ============================================================================

import { createMemoryDb, loadSqlJs, type MemoryDb, type SqlJsModule } from '../../../tests/helpers/sqljs-port';
import { BrewSession } from '../database-schema';
import { initDatabaseSchema } from '../repositories/schema';
import {
  FREE_BREW_DAYS_SETTING_KEY,
  getCountedBrewDays,
  recordCountedBrewDay,
} from '../repositories/brew-access';
import { deleteBrewSession, saveBrewSession } from '../repositories/brew-sessions';
import { getAppSetting, listPortableAppSettings, setAppSetting } from '../repositories/app-settings';
import { collectBackupState, importBackupState, type NaparBackupData } from '../backup';

let SQL: SqlJsModule;

beforeAll(async () => {
  SQL = await loadSqlJs();
});

function fresh(): MemoryDb {
  const db = createMemoryDb(SQL);
  initDatabaseSchema(db.port);
  return db;
}

const MANUAL_SESSION: BrewSession = {
  id: 'manual-1',
  beverageType: 'COFFEE',
  method: 'V60',
  doseGrams: 15,
  waterGrams: 250,
  waterTempCelsius: 94,
  totalTimeSeconds: 180,
  flavorTags: [],
  infusionNumber: 1,
  brewedAt: '2026-10-02T08:00:00.000Z',
};

describe('dni wliczone do limitu: dopisywanie', () => {
  test('bez zapisanych dni lista jest pusta', () => {
    const { port } = fresh();
    expect(getCountedBrewDays(port, '2026-10')).toEqual([]);
  });

  test('zapis dnia zwraca listę miesiąca posortowaną', () => {
    const { port } = fresh();
    expect(recordCountedBrewDay(port, '2026-10-05')).toEqual(['2026-10-05']);
    expect(recordCountedBrewDay(port, '2026-10-02')).toEqual(['2026-10-02', '2026-10-05']);
    expect(getCountedBrewDays(port, '2026-10')).toEqual(['2026-10-02', '2026-10-05']);
  });

  test('drugie parzenie tego samego dnia nie dopisuje dnia drugi raz', () => {
    const { port } = fresh();
    recordCountedBrewDay(port, '2026-10-22');
    expect(recordCountedBrewDay(port, '2026-10-22')).toEqual(['2026-10-22']);
  });

  test('dni różnych miesięcy są rozdzielone', () => {
    const { port } = fresh();
    recordCountedBrewDay(port, '2026-09-30');
    recordCountedBrewDay(port, '2026-10-01');
    expect(getCountedBrewDays(port, '2026-09')).toEqual(['2026-09-30']);
    expect(getCountedBrewDays(port, '2026-10')).toEqual(['2026-10-01']);
    expect(getCountedBrewDays(port, '2026-11')).toEqual([]);
  });

  test('stan zapisany w app_settings jako JSON per miesiąc', () => {
    const { port } = fresh();
    recordCountedBrewDay(port, '2026-10-01');
    expect(JSON.parse(getAppSetting(port, FREE_BREW_DAYS_SETTING_KEY))).toEqual({ '2026-10': ['2026-10-01'] });
  });
});

describe('dni wliczone do limitu: nic nie cofa i nie liczy wpisów ręcznych', () => {
  test('usunięcie parzenia nie zwraca dnia', () => {
    const { port } = fresh();
    saveBrewSession(port, MANUAL_SESSION);
    recordCountedBrewDay(port, '2026-10-02');
    deleteBrewSession(port, MANUAL_SESSION.id);
    expect(getCountedBrewDays(port, '2026-10')).toEqual(['2026-10-02']);
  });

  test('wpis ręczny (zapis sesji) nie wlicza dnia do limitu', () => {
    const { port } = fresh();
    saveBrewSession(port, MANUAL_SESSION);
    expect(getCountedBrewDays(port, '2026-10')).toEqual([]);
    expect(getAppSetting(port, FREE_BREW_DAYS_SETTING_KEY)).toBe('');
  });
});

describe('dni wliczone do limitu: odporność na uszkodzoną wartość', () => {
  test('niepoprawny JSON daje pusty stan i nie blokuje zapisu', () => {
    const { port } = fresh();
    setAppSetting(port, FREE_BREW_DAYS_SETTING_KEY, '{nie-json');
    expect(getCountedBrewDays(port, '2026-10')).toEqual([]);
    expect(recordCountedBrewDay(port, '2026-10-03')).toEqual(['2026-10-03']);
  });

  test('wartości nie-obiektowe (null, tablica, liczba) dają pusty stan', () => {
    const { port } = fresh();
    for (const raw of ['null', '[]', '42', '"tekst"']) {
      setAppSetting(port, FREE_BREW_DAYS_SETTING_KEY, raw);
      expect(getCountedBrewDays(port, '2026-10')).toEqual([]);
    }
  });

  test('błędne klucze miesięcy, nie-tablice i nie-tekstowe dni są pomijane', () => {
    const { port } = fresh();
    setAppSetting(
      port,
      FREE_BREW_DAYS_SETTING_KEY,
      JSON.stringify({
        '2026-10': ['2026-10-01', 7, null, '2026-10-04'],
        'zle': ['2026-10-09'],
        '2026-11': 'nie-tablica',
      })
    );
    expect(getCountedBrewDays(port, '2026-10')).toEqual(['2026-10-01', '2026-10-04']);
    expect(getCountedBrewDays(port, '2026-11')).toEqual([]);
    expect(getCountedBrewDays(port, 'zle')).toEqual([]);
  });

  test('zapis dnia nie zachowuje błędnych wpisów (stan wraca do poprawnej postaci)', () => {
    const { port } = fresh();
    setAppSetting(port, FREE_BREW_DAYS_SETTING_KEY, JSON.stringify({ zle: ['x'] }));
    recordCountedBrewDay(port, '2026-10-06');
    expect(JSON.parse(getAppSetting(port, FREE_BREW_DAYS_SETTING_KEY))).toEqual({ '2026-10': ['2026-10-06'] });
  });
});

describe('dni wliczone do limitu: poza kopią zapasową', () => {
  test('klucz jest niepenetrowalny i nie trafia do eksportu', () => {
    const { port } = fresh();
    recordCountedBrewDay(port, '2026-10-02');
    expect(listPortableAppSettings(port).some((row) => row.key === FREE_BREW_DAYS_SETTING_KEY)).toBe(false);
    expect(collectBackupState(port).settings[FREE_BREW_DAYS_SETTING_KEY]).toBeUndefined();
  });

  test('import pliku nie zeruje ani nie nadpisuje licznika', () => {
    const { port } = fresh();
    recordCountedBrewDay(port, '2026-10-02');
    const fromFile: NaparBackupData = {
      inventory: [],
      customRecipes: [],
      sessions: [],
      caffeineLogs: [],
      settings: { [FREE_BREW_DAYS_SETTING_KEY]: '{}', unit_system: 'metric' },
    };
    importBackupState(port, fromFile);
    expect(getCountedBrewDays(port, '2026-10')).toEqual(['2026-10-02']);
  });
});

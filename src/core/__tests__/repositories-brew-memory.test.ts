// ============================================================================
// Napar (Steepwise) — Testy zapisu i odczytu: zapamiętany tryb parzenia (poz. 20 MVP)
// Prawdziwy SQL (sql.js): ostatnia receptura i liczba porcji w app_settings.
// ============================================================================

import { createMemoryDb, loadSqlJs, type MemoryDb, type SqlJsModule } from '../../../tests/helpers/sqljs-port';
import { initDatabaseSchema } from '../repositories/schema';
import {
  LAST_RECIPE_SETTING_KEY,
  LAST_SERVINGS_SETTING_KEY,
  getAppSetting,
  getBeveragePreference,
  getLastRecipeId,
  getLastServings,
  listPortableAppSettings,
  setAppSetting,
  setBeveragePreference,
  setLastRecipeId,
  setLastServings,
} from '../repositories/app-settings';
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

describe('Zapamiętana receptura (poz. 20 MVP)', () => {
  test('bez zapisu zwraca pusty identyfikator', () => {
    const { port } = fresh();
    expect(getLastRecipeId(port)).toBe('');
  });

  test('zapis i odczyt identyfikatora; kolejny zapis nadpisuje poprzedni', () => {
    const { port } = fresh();
    setLastRecipeId(port, 'chemex-classic');
    expect(getLastRecipeId(port)).toBe('chemex-classic');
    expect(getAppSetting(port, LAST_RECIPE_SETTING_KEY)).toBe('chemex-classic');

    setLastRecipeId(port, 'custom-clone-123');
    expect(getLastRecipeId(port)).toBe('custom-clone-123');
  });

  test('zapamiętana receptura jest w ustawieniach przenośnych (trafia do kopii zapasowej)', () => {
    const { port } = fresh();
    setLastRecipeId(port, 'v60-hoffmann-single');
    setLastServings(port, 2);
    const keys = listPortableAppSettings(port).map((row) => row.key);
    expect(keys).toContain(LAST_RECIPE_SETTING_KEY);
    expect(keys).toContain(LAST_SERVINGS_SETTING_KEY);
  });
});

describe('Zapamiętana liczba porcji (poz. 20 MVP)', () => {
  test('bez zapisu domyślnie 1 porcja', () => {
    const { port } = fresh();
    expect(getLastServings(port)).toBe(1);
  });

  test('zapis i odczyt 2 i 4 porcji', () => {
    const { port } = fresh();
    setLastServings(port, 2);
    expect(getLastServings(port)).toBe(2);
    setLastServings(port, 4);
    expect(getLastServings(port)).toBe(4);
  });

  test('zapis przycina do zakresu 1–4 i zaokrągla', () => {
    const { port } = fresh();
    setLastServings(port, 9);
    expect(getLastServings(port)).toBe(4);
    setLastServings(port, 0);
    expect(getLastServings(port)).toBe(1);
    setLastServings(port, -3);
    expect(getLastServings(port)).toBe(1);
    setLastServings(port, 2.6);
    expect(getLastServings(port)).toBe(3);
    setLastServings(port, Number.NaN);
    expect(getLastServings(port)).toBe(1);
  });

  test('uszkodzona albo spoza zakresu wartość w bazie odczytuje się jako 1 porcja', () => {
    const { port } = fresh();
    setAppSetting(port, LAST_SERVINGS_SETTING_KEY, 'abc');
    expect(getLastServings(port)).toBe(1);
    setAppSetting(port, LAST_SERVINGS_SETTING_KEY, '7');
    expect(getLastServings(port)).toBe(1);
    setAppSetting(port, LAST_SERVINGS_SETTING_KEY, '2.5');
    expect(getLastServings(port)).toBe(1);
  });

  test('zapamiętane porcje wracają z kopii zapasowej (import ustawień)', () => {
    const source = fresh();
    setLastRecipeId(source.port, 'chemex-classic');
    setLastServings(source.port, 3);
    setBeveragePreference(source.port, 'coffee');
    const state = collectBackupState(source.port);

    const target = fresh();
    importBackupState(target.port, state);
    expect(getLastRecipeId(target.port)).toBe('chemex-classic');
    expect(getLastServings(target.port)).toBe(3);
    expect(getBeveragePreference(target.port)).toBe('coffee');
  });
});

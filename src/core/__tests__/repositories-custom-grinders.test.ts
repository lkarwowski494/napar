// ============================================================================
// Napar (Steepwise) — Testy repozytorium: własne młynki (poz. 11 MVP)
// Prawdziwy SQL (sql.js). Lista w app_settings; test obejmuje kopię zapasową.
// ============================================================================

import { createMemoryDb, loadSqlJs, type MemoryDb, type SqlJsModule } from '../../../tests/helpers/sqljs-port';
import type { DbPort } from '../db-port';
import type { CustomGrinder } from '../custom-grinder';
import { initDatabaseSchema } from '../repositories/schema';
import {
  CUSTOM_GRINDERS_SETTING_KEY,
  deleteCustomGrinder,
  listCustomGrinders,
  saveCustomGrinder,
} from '../repositories/custom-grinders';
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

const CREATED_AT = '2026-10-22T10:00:00.000Z';

const A: CustomGrinder = { id: 'custom-grinder-a', name: 'Hario Mini', stepMicrons: 20, createdAt: '2026-10-01T08:00:00.000Z' };
const B: CustomGrinder = { id: 'custom-grinder-b', name: 'Domowy', stepMicrons: 12.5, createdAt: '2026-10-02T08:00:00.000Z' };

describe('Repozytorium własnych młynków (poz. 11 MVP)', () => {
  test('bez zapisów lista jest pusta', () => {
    const { port } = fresh();
    expect(listCustomGrinders(port)).toEqual([]);
  });

  test('zapis dwóch młynków zachowuje kolejność zapisu', () => {
    const { port } = fresh();
    saveCustomGrinder(port, A);
    saveCustomGrinder(port, B);
    expect(listCustomGrinders(port)).toEqual([A, B]);
  });

  test('zapis z tym samym identyfikatorem zastępuje wpis (bez duplikatu)', () => {
    const { port } = fresh();
    saveCustomGrinder(port, A);
    saveCustomGrinder(port, { ...A, name: 'Hario Mini MK2', stepMicrons: 18 });
    expect(listCustomGrinders(port)).toEqual([{ ...A, name: 'Hario Mini MK2', stepMicrons: 18 }]);
  });

  test('usunięcie zostawia pozostałe młynki; nieznany identyfikator nic nie zmienia', () => {
    const { port } = fresh();
    saveCustomGrinder(port, A);
    saveCustomGrinder(port, B);
    deleteCustomGrinder(port, A.id);
    expect(listCustomGrinders(port)).toEqual([B]);
    deleteCustomGrinder(port, 'nie-ma-takiego');
    expect(listCustomGrinders(port)).toEqual([B]);
  });

  test('uszkodzony JSON w ustawieniach daje pustą listę zamiast błędu', () => {
    const { port } = fresh();
    setAppSetting(port, CUSTOM_GRINDERS_SETTING_KEY, '{nie json');
    expect(listCustomGrinders(port)).toEqual([]);
  });

  test('wartość, która nie jest tablicą, daje pustą listę', () => {
    const { port } = fresh();
    setAppSetting(port, CUSTOM_GRINDERS_SETTING_KEY, JSON.stringify({ id: 'x' }));
    expect(listCustomGrinders(port)).toEqual([]);
  });

  test('wpisy o złych polach są pomijane, dobre zostają', () => {
    const { port } = fresh();
    const broken = [
      null,
      'tekst',
      { id: 1, name: 'Zły id', stepMicrons: 20, createdAt: CREATED_AT },
      { id: 'x', name: 5, stepMicrons: 20, createdAt: CREATED_AT },
      { id: 'x', name: 'Zły krok', stepMicrons: '20', createdAt: CREATED_AT },
      { id: 'x', name: 'Krok zero', stepMicrons: 0, createdAt: CREATED_AT },
      { id: 'x', name: 'Krok za duży', stepMicrons: 500, createdAt: CREATED_AT },
      { id: 'x', name: 'Krok nie-liczba', stepMicrons: Number.NaN, createdAt: CREATED_AT },
      { id: 'x', name: 'Bez daty', stepMicrons: 20 },
      A,
    ];
    setAppSetting(port, CUSTOM_GRINDERS_SETTING_KEY, JSON.stringify(broken));
    expect(listCustomGrinders(port)).toEqual([A]);
  });

  test('błąd zapisu w bazie propaguje się do wywołującego (formularz pokaże komunikat)', () => {
    const { port } = fresh();
    const failing: DbPort = {
      ...port,
      runSync: () => {
        throw new Error('zapis niemożliwy');
      },
    };
    expect(() => saveCustomGrinder(failing, A)).toThrow('zapis niemożliwy');
    expect(() => deleteCustomGrinder(failing, A.id)).toThrow('zapis niemożliwy');
  });

  test('własne młynki wracają z kopii zapasowej (eksport i import ustawień)', () => {
    const source = fresh();
    saveCustomGrinder(source.port, A);
    saveCustomGrinder(source.port, B);
    const state = collectBackupState(source.port);
    expect(state.settings[CUSTOM_GRINDERS_SETTING_KEY]).toBeDefined();

    const target = fresh();
    importBackupState(target.port, state);
    expect(listCustomGrinders(target.port)).toEqual([A, B]);
  });
});

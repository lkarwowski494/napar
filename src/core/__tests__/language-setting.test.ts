// ============================================================================
// Napar (Steepwise) — Testy trwałego wyboru języka (app_settings) i walidacji ustawienia
// Zapis i odczyt przez repozytorium na prawdziwym SQL (sql.js); bez bazy -> język systemu.
// ============================================================================

import { createMemoryDb, loadSqlJs, type MemoryDb, type SqlJsModule } from '../../../tests/helpers/sqljs-port';
import { initDatabaseSchema } from '../repositories/schema';
import {
  APP_LANGUAGE_SETTING_KEY,
  getAppSetting,
  getLanguageSetting,
  setLanguageSetting,
} from '../repositories/app-settings';
import * as facade from '../database';
import {
  isLanguageSetting,
  LANGS,
  parseLanguageSetting,
  SYSTEM_LANGUAGE,
  type LanguageSetting,
} from '../i18n-loader';

let SQL: SqlJsModule;

beforeAll(async () => {
  SQL = await loadSqlJs();
});

function fresh(): MemoryDb {
  const db = createMemoryDb(SQL);
  initDatabaseSchema(db.port);
  return db;
}

describe('walidacja ustawienia języka (i18n-loader)', () => {
  test('„system” i każdy kod z LANGS są poprawnym ustawieniem', () => {
    expect(isLanguageSetting(SYSTEM_LANGUAGE)).toBe(true);
    for (const code of LANGS) {
      expect(isLanguageSetting(code)).toBe(true);
    }
  });

  test('nieznana, pusta lub nietekstowa wartość nie jest ustawieniem', () => {
    expect(isLanguageSetting('klingon')).toBe(false);
    expect(isLanguageSetting('')).toBe(false);
    expect(isLanguageSetting(null)).toBe(false);
    expect(isLanguageSetting(42)).toBe(false);
  });

  test('parseLanguageSetting: poprawny kod zostaje, reszta staje się „system”', () => {
    expect(parseLanguageSetting('de')).toBe('de');
    expect(parseLanguageSetting('zh-Hant')).toBe('zh-Hant');
    expect(parseLanguageSetting(SYSTEM_LANGUAGE)).toBe(SYSTEM_LANGUAGE);
    expect(parseLanguageSetting('klingon')).toBe(SYSTEM_LANGUAGE);
    expect(parseLanguageSetting(undefined)).toBe(SYSTEM_LANGUAGE);
  });
});

describe('repozytorium app-settings: zapis i odczyt wyboru języka', () => {
  test('klucz to app_language', () => {
    expect(APP_LANGUAGE_SETTING_KEY).toBe('app_language');
  });

  test('brak wpisu -> „system”', () => {
    const db = fresh();
    expect(getLanguageSetting(db.port)).toBe('system');
  });

  test('zapisany kod z LANGS jest odczytywany po ponownym połączeniu z tą samą bazą', () => {
    const db = fresh();
    setLanguageSetting(db.port, 'ja');
    expect(getAppSetting(db.port, 'app_language')).toBe('ja');
    expect(getLanguageSetting(db.port)).toBe('ja');
  });

  test('zapis „system” nadpisuje wcześniejszy wybór', () => {
    const db = fresh();
    setLanguageSetting(db.port, 'fr');
    setLanguageSetting(db.port, SYSTEM_LANGUAGE);
    expect(getLanguageSetting(db.port)).toBe('system');
  });

  test('nieznana wartość zapisana w bazie (np. z uszkodzonej kopii) odczytuje się jako „system”', () => {
    const db = fresh();
    db.port.runSync('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)', ['app_language', 'klingon']);
    expect(getLanguageSetting(db.port)).toBe('system');
  });

  test('pusta wartość w bazie odczytuje się jako „system”', () => {
    const db = fresh();
    db.port.runSync('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)', ['app_language', '']);
    expect(getLanguageSetting(db.port)).toBe('system');
  });

  test('zapis wartości spoza listy jest sprowadzany do „system” (bez zapisu nieznanego kodu)', () => {
    const db = fresh();
    setLanguageSetting(db.port, 'klingon' as LanguageSetting);
    expect(getAppSetting(db.port, 'app_language')).toBe('system');
  });
});

describe('fasada database: odczyt i zapis wyboru języka', () => {
  afterEach(() => {
    facade.configureDatabase(null);
  });

  test('przy skonfigurowanej bazie zapis i odczyt idą przez port', () => {
    const db = fresh();
    facade.configureDatabase(() => ({ port: db.port, fallback: null }));
    facade.setLanguageSetting('pt-BR');
    expect(facade.getLanguageSetting()).toBe('pt-BR');
  });

  test('bez skonfigurowanej bazy odczyt daje „system”, a zapis nie rzuca wyjątku', () => {
    facade.configureDatabase(null);
    expect(() => facade.setLanguageSetting('de')).not.toThrow();
    expect(facade.getLanguageSetting()).toBe('system');
  });

  test('gdy otwarcie bazy zawodzi, odczyt daje „system”', () => {
    facade.configureDatabase(() => {
      throw new Error('brak pliku');
    });
    expect(facade.getLanguageSetting()).toBe('system');
  });
});

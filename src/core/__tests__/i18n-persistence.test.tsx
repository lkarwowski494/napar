// ============================================================================
// Napar (Steepwise) — Testy LanguageProvider z trwałym wyborem języka
// Start: odczyt app_settings. Zmiana: zapis + natychmiastowe przeliczenie t().
// ============================================================================

import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { readSystemLocale } from '../../platform/system-locale';
import { createMemoryDb, loadSqlJs, type MemoryDb, type SqlJsModule } from '../../../tests/helpers/sqljs-port';
import * as facade from '../database';
import { initDatabaseSchema } from '../repositories/schema';
import { getTranslations, getCurrentLanguage, getCurrentTranslations, LanguageProvider, useTranslation } from '../i18n';

jest.mock('../../platform/system-locale', () => ({
  readSystemLocale: jest.fn(() => 'fr-CA'),
}));

const mockedLocale = readSystemLocale as jest.Mock;

type Ctx = ReturnType<typeof useTranslation>;
type Sink = { current?: Ctx };

function Probe({ sink }: { sink: Sink }) {
  sink.current = useTranslation();
  return null;
}

function mount(sink: Sink) {
  let tree: renderer.ReactTestRenderer | undefined;
  act(() => {
    tree = renderer.create(
      <LanguageProvider>
        <Probe sink={sink} />
      </LanguageProvider>
    );
  });
  return tree!;
}

let SQL: SqlJsModule;
let db: MemoryDb;

beforeAll(async () => {
  SQL = await loadSqlJs();
});

beforeEach(() => {
  mockedLocale.mockReturnValue('fr-CA');
  db = createMemoryDb(SQL);
  initDatabaseSchema(db.port);
  facade.configureDatabase(() => ({ port: db.port, fallback: null }));
});

afterEach(() => {
  facade.configureDatabase(null);
  jest.restoreAllMocks();
});

describe('LanguageProvider: odczyt przy starcie', () => {
  test('zapisany wybór (de) ma pierwszeństwo przed językiem systemu (fr)', () => {
    facade.setLanguageSetting('de');
    const sink: Sink = {};
    mount(sink);
    expect(sink.current?.language).toBe('de');
    expect(sink.current?.setting).toBe('de');
    expect(sink.current?.t).toBe(getTranslations('de'));
  });

  test('brak zapisu -> język systemu (fr) i ustawienie „system”', () => {
    const sink: Sink = {};
    mount(sink);
    expect(sink.current?.language).toBe('fr');
    expect(sink.current?.setting).toBe('system');
  });

  test('nieznana wartość w bazie -> język systemu', () => {
    db.port.runSync('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)', ['app_language', 'klingon']);
    const sink: Sink = {};
    mount(sink);
    expect(sink.current?.language).toBe('fr');
    expect(sink.current?.setting).toBe('system');
  });
});

describe('LanguageProvider: zmiana języka', () => {
  test('setLanguage zapisuje wybór w app_settings i od razu przelicza t()', () => {
    const sink: Sink = {};
    mount(sink);
    expect(sink.current?.t.common.cancel).toBe(getTranslations('fr').common.cancel);

    act(() => {
      sink.current?.setLanguage('ja');
    });

    expect(sink.current?.language).toBe('ja');
    expect(sink.current?.t).toBe(getTranslations('ja'));
    expect(facade.getLanguageSetting()).toBe('ja');
  });

  test('wybór przeżywa ponowne uruchomienie (nowe drzewo czyta zapis)', () => {
    const first: Sink = {};
    const tree = mount(first);
    act(() => {
      first.current?.setLanguage('zh-Hant');
    });
    act(() => {
      tree.unmount();
    });

    const second: Sink = {};
    mount(second);
    expect(second.current?.language).toBe('zh-Hant');
    expect(second.current?.t).toBe(getTranslations('zh-Hant'));
  });

  test('powrót do „system” czyści wybór i wraca do języka systemu', () => {
    const sink: Sink = {};
    mount(sink);
    act(() => {
      sink.current?.setLanguage('it');
    });
    act(() => {
      sink.current?.setLanguage('system');
    });
    expect(sink.current?.language).toBe('fr');
    expect(sink.current?.setting).toBe('system');
    expect(facade.getLanguageSetting()).toBe('system');
  });

  test('wartość spoza listy w setLanguage nie zmienia języka na nieobsługiwany', () => {
    const sink: Sink = {};
    mount(sink);
    act(() => {
      sink.current?.setLanguage('klingon' as never);
    });
    expect(sink.current?.language).toBe('fr');
    expect(facade.getLanguageSetting()).toBe('system');
  });

  test('bez dostępnej bazy zmiana działa w pamięci i nie rzuca wyjątku', () => {
    facade.configureDatabase(() => {
      throw new Error('brak bazy');
    });
    const sink: Sink = {};
    mount(sink);
    expect(() => {
      act(() => {
        sink.current?.setLanguage('pl');
      });
    }).not.toThrow();
    expect(sink.current?.language).toBe('pl');
  });
});

describe('useTranslation bez LanguageProvider', () => {
  test('domyślny kontekst ma język pl, ustawienie „system” i nieszkodliwe setLanguage', () => {
    const sink: Sink = {};
    let tree: renderer.ReactTestRenderer | undefined;
    act(() => {
      tree = renderer.create(<Probe sink={sink} />);
    });
    expect(sink.current?.language).toBe('pl');
    expect(sink.current?.setting).toBe('system');
    expect(() => {
      act(() => {
        sink.current?.setLanguage('de');
      });
    }).not.toThrow();
    expect(facade.getLanguageSetting()).toBe('system');
    act(() => {
      tree?.unmount();
    });
  });
});

describe('getCurrentLanguage i getCurrentTranslations (poza providerem)', () => {
  test('odzwierciedlają zapisany wybór użytkownika', () => {
    expect(getCurrentLanguage()).toBe('fr');
    facade.setLanguageSetting('ko');
    expect(getCurrentLanguage()).toBe('ko');
    expect(getCurrentTranslations()).toBe(getTranslations('ko'));
  });

  test('po powrocie do „system” wracają do języka systemu', () => {
    facade.setLanguageSetting('ko');
    facade.setLanguageSetting('system');
    expect(getCurrentTranslations()).toBe(getTranslations('fr'));
  });
});

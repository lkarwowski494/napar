// ============================================================================
// Napar (Steepwise) — Testy wyboru języka w warstwie React (LanguageProvider)
// Kolejność: ustawienie użytkownika -> język systemu -> en. Słowniki z locales/.
// ============================================================================

import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { readSystemLocale } from '../../platform/system-locale';
import {
  detectSystemLanguage,
  getCurrentTranslations,
  getTranslations,
  LanguageProvider,
  plural,
  translations,
  useTranslation,
} from '../i18n';

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

function renderProvider(sink: Sink) {
  let tree: renderer.ReactTestRenderer | undefined;
  act(() => {
    tree = renderer.create(
      <LanguageProvider>
        <Probe sink={sink} />
      </LanguageProvider>
    );
  });
  return tree;
}

describe('LanguageProvider: wybór języka', () => {
  afterEach(() => {
    mockedLocale.mockReturnValue('fr-CA');
    jest.restoreAllMocks();
  });

  test('bez ustawienia użytkownika wybiera język systemu (fr-CA -> fr)', () => {
    const sink: Sink = {};
    renderProvider(sink);
    expect(sink.current?.language).toBe('fr');
    expect(sink.current?.t.common.cancel).toBe(translations.en.common.cancel);
  });

  test('ustawienie użytkownika ma pierwszeństwo przed językiem systemu', () => {
    const sink: Sink = {};
    renderProvider(sink);
    act(() => {
      sink.current?.setLanguage('pl');
    });
    expect(sink.current?.language).toBe('pl');
    expect(sink.current?.t.appName).toBe('Napar');
  });

  test('język spoza listy 35 w ustawieniu użytkownika nie jest przyjmowany, a system decyduje', () => {
    mockedLocale.mockReturnValue('sr-RS');
    const sink: Sink = {};
    renderProvider(sink);
    expect(sink.current?.language).toBe('en');
    expect(sink.current?.t.appName).toBe('Steepwise');
  });

  test('zmiana na język z listy 35 zwraca jego słownik', () => {
    const sink: Sink = {};
    renderProvider(sink);
    act(() => {
      sink.current?.setLanguage('zh-Hant');
    });
    expect(sink.current?.language).toBe('zh-Hant');
    expect(sink.current?.t).toBe(getTranslations('zh-Hant'));
  });
});

describe('detectSystemLanguage i getCurrentTranslations', () => {
  afterEach(() => {
    mockedLocale.mockReturnValue('fr-CA');
  });

  test('mapuje tag systemu na obsługiwany język', () => {
    mockedLocale.mockReturnValue('zh-TW');
    expect(detectSystemLanguage()).toBe('zh-Hant');
    mockedLocale.mockReturnValue('pl-PL');
    expect(detectSystemLanguage()).toBe('pl');
    mockedLocale.mockReturnValue(null);
    expect(detectSystemLanguage()).toBe('en');
  });

  test('getCurrentTranslations zwraca słownik języka systemu', () => {
    mockedLocale.mockReturnValue('pl-PL');
    expect(getCurrentTranslations().appName).toBe('Napar');
    mockedLocale.mockReturnValue('de-DE');
    expect(getCurrentTranslations()).toBe(getTranslations('de'));
  });
});

describe('getTranslations: cache i ostrzeżenie o brakującym kluczu', () => {
  test('ten sam język zwraca ten sam zbudowany obiekt', () => {
    expect(getTranslations('ko')).toBe(getTranslations('ko'));
  });

  test('brakujący klucz w słowniku języka zgłasza ostrzeżenie (tryb dev) i używa en', () => {
    jest.isolateModules(() => {
      const loader = require('../i18n-loader');
      loader.DICTIONARIES.ca = { common: { cancel: 'Anul-lar' } };
      const i18n = require('../i18n');
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      try {
        const messages = i18n.getTranslations('ca');
        expect(messages.common.cancel).toBe('Anul-lar');
        expect(messages.common.save).toBe('Save');
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('common.save'));
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('"ca"'));
      } finally {
        warn.mockRestore();
      }
    });
  });

  test('w trybie produkcyjnym brak klucza nie wypisuje ostrzeżenia', () => {
    const previous = (global as { __DEV__?: boolean }).__DEV__;
    (global as { __DEV__?: boolean }).__DEV__ = false;
    jest.isolateModules(() => {
      const loader = require('../i18n-loader');
      loader.DICTIONARIES.ca = { common: { cancel: 'Anul-lar' } };
      const i18n = require('../i18n');
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      try {
        expect(i18n.getTranslations('ca').common.save).toBe('Save');
        expect(warn).not.toHaveBeenCalled();
      } finally {
        warn.mockRestore();
        (global as { __DEV__?: boolean }).__DEV__ = previous;
      }
    });
  });
});

describe('plural: formy opcjonalne', () => {
  test('PL bez form few i many używa formy one', () => {
    expect(plural('pl', 1, { one: 'strona' })).toBe('strona');
    expect(plural('pl', 5, { one: 'strona' })).toBe('strona');
  });

  test('EN bez formy other używa many, a następnie few, a na końcu one', () => {
    expect(plural('en', 5, { one: 'x', many: 'many' })).toBe('many');
    expect(plural('en', 5, { one: 'x', few: 'few' })).toBe('few');
    expect(plural('en', 5, { one: 'x' })).toBe('x');
  });
});

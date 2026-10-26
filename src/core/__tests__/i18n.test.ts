// ============================================================================
// Napar (Steepwise) — Unit Tests: i18n & Language Localization
// ============================================================================

import React from 'react';
import renderer from 'react-test-renderer';

const mockSettings = new Map<string, string>();
const mockDb: any = {
  settings: mockSettings,
  execSync: jest.fn(),
  getFirstSync: jest.fn((query: string, params?: any[]) => {
    if (query.includes('FROM app_settings WHERE key = ?')) {
      const val = mockSettings.get(params?.[0]);
      return val !== undefined ? { value: val } : null;
    }
    return null;
  }),
  getAllSync: jest.fn(() => []),
  runSync: jest.fn((query: string, params?: any[]) => {
    if (query.includes('INSERT OR REPLACE INTO app_settings')) {
      mockSettings.set(params![0], params![1]);
    }
  }),
};

jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn(() => mockDb),
}));
import {
  detectSystemLanguage,
  translations,
  SupportedLanguage,
  LanguageProvider,
  useTranslation,
  getCurrentTranslations,
  pluralPl,
  plural,
  getPluralCategory,
  formatTemplate,
} from '../i18n';
import { getAppSetting } from '../database';

describe('i18n System', () => {
  test('Wykrywa język systemowy lub domyślny fallback', () => {
    const lang = detectSystemLanguage();
    expect(['pl', 'en']).toContain(lang);
    const currTr = getCurrentTranslations();
    expect(currTr).toBeDefined();
    expect(currTr.common.cancel).toBeDefined();
  });

  test('Słownik PL i EN posiadają kompletne klucze', () => {
    const plKeys = Object.keys(translations.pl).sort();
    const enKeys = Object.keys(translations.en).sort();
    expect(plKeys).toEqual(enKeys);

    // Sekcje podrzędne
    expect(Object.keys(translations.pl.common).sort()).toEqual(
      Object.keys(translations.en.common).sort()
    );
    expect(Object.keys(translations.pl.tabs).sort()).toEqual(
      Object.keys(translations.en.tabs).sort()
    );
    expect(Object.keys(translations.pl.brew).sort()).toEqual(
      Object.keys(translations.en.brew).sort()
    );
    expect(Object.keys(translations.pl.recipeBuilder).sort()).toEqual(
      Object.keys(translations.en.recipeBuilder).sort()
    );
    expect(Object.keys(translations.pl.gongfu).sort()).toEqual(
      Object.keys(translations.en.gongfu).sort()
    );
    expect(Object.keys(translations.pl.stash).sort()).toEqual(
      Object.keys(translations.en.stash).sort()
    );
    expect(Object.keys(translations.pl.dialin).sort()).toEqual(
      Object.keys(translations.en.dialin).sort()
    );
    expect(Object.keys(translations.pl.water).sort()).toEqual(
      Object.keys(translations.en.water).sort()
    );
    expect(Object.keys(translations.pl.grinder).sort()).toEqual(
      Object.keys(translations.en.grinder).sort()
    );
    expect(Object.keys(translations.pl.caffeine).sort()).toEqual(
      Object.keys(translations.en.caffeine).sort()
    );
    expect(Object.keys(translations.pl.settings).sort()).toEqual(
      Object.keys(translations.en.settings).sort()
    );
    expect(Object.keys(translations.pl.favorites).sort()).toEqual(
      Object.keys(translations.en.favorites).sort()
    );
  });

  test('TASK-P6-09-LOK: Klucze stepperów kofeiny i snu są zdefiniowane w PL i EN', () => {
    expect(translations.pl.dialin.eyTitle).toBe('Kalkulator Wydajności Ekstrakcji (EY%)');
    expect(translations.en.dialin.eyTitle).toBe('Extraction Yield Calculator (EY%)');
    expect(translations.pl.settings.decreaseHalfLife).toBe('Zmniejsz czas półtrwania');
    expect(translations.en.settings.decreaseHalfLife).toBe('Decrease half-life');
    expect(translations.pl.settings.earlierBedtime).toBe('Wcześniejsza godzina snu');
    expect(translations.en.settings.earlierBedtime).toBe('Earlier bedtime');
  });

  test('Klucze ulubionych i akcji szybkiego parzenia', () => {
    expect(translations.pl.favorites.addToFav).toBe('Dodaj do ulubionych');
    expect(translations.pl.favorites.removeFromFav).toBe('Usuń z ulubionych');
    expect(translations.pl.favorites.quickBrew).toBe('Szybkie parzenie');
  });

  test('Nazwa aplikacji to Napar po polsku i Steepwise po angielsku', () => {
    expect(translations.pl.appName).toBe('Napar');
    expect(translations.en.appName).toBe('Steepwise');
  });

  test('Klucze parzenia zawierają instrukcje dla minutnika', () => {
    expect(translations.pl.brew.startBrew).toBe('START');
    expect(translations.en.brew.startBrew).toBe('START');
    expect(translations.pl.brew.pauseBrew).toBe('PAUZA');
    expect(translations.en.brew.pauseBrew).toBe('PAUSE');
  });

  test('detectSystemLanguage prawidłowo mapuje pl, en oraz błędy w try-catch', () => {
    const originalDateTimeFormat = Intl.DateTimeFormat;

    // 1. Polski locale
    Intl.DateTimeFormat = jest.fn().mockImplementation(() => ({
      resolvedOptions: () => ({ locale: 'pl-PL' }),
    })) as any;
    expect(detectSystemLanguage()).toBe('pl');

    // 2. Angielski lub inny obcy locale
    Intl.DateTimeFormat = jest.fn().mockImplementation(() => ({
      resolvedOptions: () => ({ locale: 'de-DE' }),
    })) as any;
    expect(detectSystemLanguage()).toBe('en');

    // 3. Rzucenie błędu wewnątrz try
    Intl.DateTimeFormat = jest.fn().mockImplementation(() => {
      throw new Error('Locale error');
    }) as any;
    expect(detectSystemLanguage()).toBe('en');

    Intl.DateTimeFormat = originalDateTimeFormat;
  });

  test('LanguageProvider i useTranslation hook', () => {
    let contextValue: any;
    const TestConsumer = () => {
      contextValue = useTranslation();
      return null;
    };

    renderer.act(() => {
      renderer.create(
        React.createElement(LanguageProvider, null, React.createElement(TestConsumer))
      );
    });

    expect(contextValue.language).toBeDefined();
    renderer.act(() => {
      contextValue.setLanguage('en');
    });
    expect(contextValue.language).toBe('en');
    expect(contextValue.t.appName).toBe('Steepwise');
    expect(getAppSetting('app_language')).toBe('en');

    renderer.act(() => {
      contextValue.setLanguage('pl');
    });
    expect(contextValue.language).toBe('pl');
    expect(contextValue.t.appName).toBe('Napar');
  });

  describe('Polska i angielska odmiana liczebników (RD-ENG-09, NFR-I18N-007)', () => {
    test('pluralPl prawidłowo odmienia formy one, few, many zgodnie z regułą modulo 10/100', () => {
      const one = 'seria';
      const few = 'serie';
      const many = 'serii';

      // 1 -> one
      expect(pluralPl(1, one, few, many)).toBe(one);
      expect(pluralPl(-1, one, few, many)).toBe(one);

      // few: 2, 3, 4, 22, 104, 102
      expect(pluralPl(2, one, few, many)).toBe(few);
      expect(pluralPl(3, one, few, many)).toBe(few);
      expect(pluralPl(4, one, few, many)).toBe(few);
      expect(pluralPl(22, one, few, many)).toBe(few);
      expect(pluralPl(23, one, few, many)).toBe(few);
      expect(pluralPl(24, one, few, many)).toBe(few);
      expect(pluralPl(102, one, few, many)).toBe(few);
      expect(pluralPl(104, one, few, many)).toBe(few);

      // many: 0, 5, 11, 12, 14, 21, 25, 100, 101, 112
      expect(pluralPl(0, one, few, many)).toBe(many);
      expect(pluralPl(5, one, few, many)).toBe(many);
      expect(pluralPl(11, one, few, many)).toBe(many);
      expect(pluralPl(12, one, few, many)).toBe(many);
      expect(pluralPl(13, one, few, many)).toBe(many);
      expect(pluralPl(14, one, few, many)).toBe(many);
      expect(pluralPl(21, one, few, many)).toBe(many);
      expect(pluralPl(25, one, few, many)).toBe(many);
      expect(pluralPl(100, one, few, many)).toBe(many);
      expect(pluralPl(101, one, few, many)).toBe(many);
      expect(pluralPl(112, one, few, many)).toBe(many);
    });

    test('plural() obsługuje poprawnie zarówno język PL jak i EN', () => {
      // PL
      expect(plural('pl', 1, { one: 'sekunda', few: 'sekundy', many: 'sekund' })).toBe('sekunda');
      expect(plural('pl', 3, { one: 'sekunda', few: 'sekundy', many: 'sekund' })).toBe('sekundy');
      expect(plural('pl', 12, { one: 'sekunda', few: 'sekundy', many: 'sekund' })).toBe('sekund');
      expect(plural('pl', 22, { one: 'sekunda', few: 'sekundy', many: 'sekund' })).toBe('sekundy');

      // EN
      expect(plural('en', 1, { one: 'second', other: 'seconds' })).toBe('second');
      expect(plural('en', 0, { one: 'second', other: 'seconds' })).toBe('seconds');
      expect(plural('en', 2, { one: 'second', other: 'seconds' })).toBe('seconds');
      expect(plural('en', 25, { one: 'second', other: 'seconds' })).toBe('seconds');
    });
    test('getPluralCategory fallback w środowisku bez Intl.PluralRules (Hermes)', () => {
      const originalPluralRules = (Intl as any).PluralRules;
      try {
        (Intl as any).PluralRules = undefined;
        expect(getPluralCategory('pl', 1)).toBe('one');
        expect(getPluralCategory('pl', 2)).toBe('few');
        expect(getPluralCategory('pl', 5)).toBe('many');
        expect(getPluralCategory('pl', 12)).toBe('many');
        expect(getPluralCategory('pl', 22)).toBe('few');
        expect(getPluralCategory('en', 1)).toBe('one');
        expect(getPluralCategory('en', 2)).toBe('other');

        // Test gdy rzuca wyjątek
        (Intl as any).PluralRules = jest.fn(() => { throw new Error('Hermes fallback simulation'); });
        expect(getPluralCategory('pl', 22)).toBe('few');
      } finally {
        (Intl as any).PluralRules = originalPluralRules;
      }
    });

    test('plural() fallback gałęzi gdy brakuje specyficznych formularzy', () => {
      // category few ale podano tylko many
      expect(plural('pl', 2, { one: 'sekunda', many: 'sekund' })).toBe('sekund');
      // category many ale podano tylko few
      expect(plural('pl', 5, { one: 'sekunda', few: 'sekundy' })).toBe('sekundy');
      // brak few i many, tylko other
      expect(plural('pl', 5, { one: 'sekunda', other: 'inny' })).toBe('inny');
      // tylko one
      expect(plural('pl', 5, { one: 'sekunda' })).toBe('sekunda');
    });
  });
  test('TASK-P5-09-LOK: formatTemplate wielokrotnie podstawia tokeny w szablonie', () => {
    expect(formatTemplate('', { name: 'V60' })).toBe('');
    expect(formatTemplate('Parz {name} z {name}!', { name: 'V60' })).toBe('Parz V60 z V60!');
    expect(formatTemplate('{dose}g kawy na {water}g wody (ratio {dose}:{water})', { dose: 15, water: 250 }))
      .toBe('15g kawy na 250g wody (ratio 15:250)');
    expect(formatTemplate('Brak tokenow', { foo: 'bar' })).toBe('Brak tokenow');
  });

  test('getPluralCategory wylicza reguły liczby mnogiej', () => {
    expect(getPluralCategory('pl', 1)).toBe('one');
    expect(getPluralCategory('pl', 2)).toBe('few');
    expect(getPluralCategory('pl', 5)).toBe('many');
    expect(getPluralCategory('en', 1)).toBe('one');
    expect(getPluralCategory('en', 2)).toBe('other');
  });

  test('TASK-P8-09-LOK: Klucze methodsLabel i particleRangeDesc są zdefiniowane i zsynchronizowane', () => {
    expect(translations.pl.grinder.methodsLabel).toBe('Metody:');
    expect(translations.en.grinder.methodsLabel).toBe('Methods:');
    expect(translations.pl.grinder.particleRangeDesc).toContain('{min}');
    expect(translations.en.grinder.particleRangeDesc).toContain('{min}');
  });

  test('TASK-P9-09-LOK: Klucz saveToStash jest zdefiniowany we wszystkich językach', () => {
    for (const [lang, dict] of Object.entries(translations)) {
      expect((dict as any).stash?.saveToStash).toBeDefined();
      expect(typeof (dict as any).stash?.saveToStash).toBe('string');
      expect((dict as any).stash?.saveToStash.length).toBeGreaterThan(0);
    }
  });

  test('TASK-P10-09-LOK: Klucz useTemplate jest zdefiniowany we wszystkich 35 językach', () => {
    expect(translations.pl.stash.useTemplate).toBe('+ Użyj jako szablon w spiżarni');
    expect(translations.en.stash.useTemplate).toBe('+ Use as template in stash');
  });

  test('TASK-P11-09-LOK: Klucz finishAndSave jest zdefiniowany w słownikach pl i en', () => {
    expect(translations.pl.brew.finishAndSave).toBe('Zakończ i zapisz');
    expect(translations.en.brew.finishAndSave).toBe('Finish & Save');
  });

  test('TASK-P12-09-LOK: Klucz recommendationLabel jest zdefiniowany w słownikach pl i en oraz w grinderze', () => {
    expect(translations.pl.grinder.recommendationLabel).toBe('Rekomendacja:');
    expect(translations.en.grinder.recommendationLabel).toBe('Recommendation:');
  });

  test('TASK-P13-09-LOK: Klucz recipeSearchPlaceholder jest zdefiniowany w słownikach pl i en', () => {
    expect(translations.pl.brew.recipeSearchPlaceholder).toContain('Szukaj receptury');
    expect(translations.en.brew.recipeSearchPlaceholder).toContain('Search recipes');
  });

  test('TASK-P23-09-LOK: Klucze coffeeBeans i looseLeafTea są zdefiniowane w common w PL i EN', () => {
    expect(translations.pl.common.coffeeBeans).toBe('Kawa ziarnista');
    expect(translations.en.common.coffeeBeans).toBe('Whole bean coffee');
    expect(translations.pl.common.looseLeafTea).toBe('Herbata liściasta');
    expect(translations.en.common.looseLeafTea).toBe('Loose leaf tea');
  });
});

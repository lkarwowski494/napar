// ============================================================================
// Napar (Steepwise) — Unit Tests: i18n & Language Localization
// ============================================================================

import { detectSystemLanguage, translations, SupportedLanguage } from '../i18n';

describe('i18n System', () => {
  test('Wykrywa język systemowy lub domyślny fallback', () => {
    const lang = detectSystemLanguage();
    expect(['pl', 'en']).toContain(lang);
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
});

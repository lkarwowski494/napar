// ============================================================================
// Napar (Steepwise) — Test: ceny w tekstach pochodzą wyłącznie z App Store (displayPrice)
// Słowniki PL i EN nie mogą zawierać liczby z symbolem waluty. Zatwierdzony cennik
// (docs/lista-funkcji-mvp.md) żyje w NaparStoreKit.storekit i w sklepie, nie w tekstach.
// ============================================================================

import { translations } from '../i18n';

/** Liczba z symbolem waluty w dowolnym kierunku: „0,99 €”, „$4.99”, „19,99 zł”, „PLN 59”. */
const CURRENCY_NUMBER = /(\d[\d\s.,]*\s*(€|\$|£|zł|PLN|EUR|USD|GBP))|((€|\$|£|zł|PLN|EUR|USD|GBP)\s*\d)/i;

function collectStrings(value: unknown, path: string[] = []): { path: string; text: string }[] {
  if (typeof value === 'string') return [{ path: path.join('.'), text: value }];
  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
      collectStrings(child, [...path, key])
    );
  }
  return [];
}

describe('Ceny w słownikach (poz. 34: ceny tylko z App Store)', () => {
  test.each([
    ['pl', translations.pl],
    ['en', translations.en],
  ])('w słowniku %s nie ma żadnej liczby z symbolem waluty', (_lang, dictionary) => {
    const offenders = collectStrings(dictionary).filter((entry) => CURRENCY_NUMBER.test(entry.text));
    expect(offenders).toEqual([]);
  });

  test('tekst zastępczy przed załadowaniem sklepu to „cena w App Store” (PL) i „price in App Store” (EN)', () => {
    expect(translations.pl.paywall.planMonthlyPrice).toBe('cena w App Store');
    expect(translations.pl.paywall.planAnnualPrice).toBe('cena w App Store');
    expect(translations.pl.paywall.planLifetimePrice).toBe('cena w App Store');
    expect(translations.en.paywall.planMonthlyPrice).toBe('price in App Store');
    expect(translations.en.paywall.planAnnualPrice).toBe('price in App Store');
    expect(translations.en.paywall.planLifetimePrice).toBe('price in App Store');
  });

  test('wzorzec wykrywa ceny w obu kierunkach (test samego testu)', () => {
    expect(CURRENCY_NUMBER.test('0,99 € / mies.')).toBe(true);
    expect(CURRENCY_NUMBER.test('$4.99 / rok')).toBe(true);
    expect(CURRENCY_NUMBER.test('zł 19,99')).toBe(true);
    expect(CURRENCY_NUMBER.test('Cena ziaren (zł za kg)')).toBe(false);
    expect(CURRENCY_NUMBER.test('cena w App Store')).toBe(false);
  });
});

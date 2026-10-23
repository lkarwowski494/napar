// ============================================================================
// Napar (Steepwise) — Testy adaptera języka systemu (src/platform/system-locale.ts)
// ============================================================================

import { readSystemLocale } from '../system-locale';

describe('readSystemLocale', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  const mockLocale = (locale: unknown) =>
    jest.spyOn(Intl, 'DateTimeFormat').mockImplementation(
      () => ({ resolvedOptions: () => ({ locale }) }) as unknown as Intl.DateTimeFormat
    );

  test('zwraca tag języka z systemu', () => {
    mockLocale('de-AT');
    expect(readSystemLocale()).toBe('de-AT');
  });

  test('pusty lub nie-tekstowy tag daje null', () => {
    mockLocale('');
    expect(readSystemLocale()).toBeNull();
    mockLocale(undefined);
    expect(readSystemLocale()).toBeNull();
  });

  test('błąd Intl daje null zamiast wyjątku', () => {
    jest.spyOn(Intl, 'DateTimeFormat').mockImplementation(() => {
      throw new Error('brak Intl');
    });
    expect(readSystemLocale()).toBeNull();
  });

  test('w normalnym środowisku zwraca tekst lub null', () => {
    const locale = readSystemLocale();
    expect(locale === null || typeof locale === 'string').toBe(true);
  });
});

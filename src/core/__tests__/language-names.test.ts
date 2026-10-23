// ============================================================================
// Napar (Steepwise) — Testy nazw natywnych języków (picker w Ustawieniach)
// Każdy kod z LANGS ma niepustą nazwę własną; nieznany kod zwraca sam kod.
// ============================================================================

import { LANGUAGE_NATIVE_NAMES, nativeLanguageName } from '../language-names';
import { LANGS, type LangCode } from '../i18n-loader';

describe('nazwy natywne języków', () => {
  test('każdy kod z LANGS ma niepustą nazwę własną', () => {
    expect(LANGS).toHaveLength(35);
    for (const code of LANGS) {
      const name = LANGUAGE_NATIVE_NAMES[code];
      expect(typeof name).toBe('string');
      expect(name.trim()).not.toBe('');
    }
  });

  test('mapa nie zawiera kodów spoza LANGS', () => {
    expect(Object.keys(LANGUAGE_NATIVE_NAMES).sort()).toEqual([...LANGS].sort());
  });

  test('nazwy są w języku własnym (wybrane przykłady)', () => {
    expect(nativeLanguageName('de')).toBe('Deutsch');
    expect(nativeLanguageName('fr')).toBe('Français');
    expect(nativeLanguageName('ja')).toBe('日本語');
    expect(nativeLanguageName('uk')).toBe('Українська');
    expect(nativeLanguageName('zh-Hans')).toBe('中文（简体）');
    expect(nativeLanguageName('pl')).toBe('Polski');
    expect(nativeLanguageName('en')).toBe('English');
  });

  test('kod spoza mapy zwraca sam kod (zabezpieczenie w czasie działania)', () => {
    expect(nativeLanguageName('xx' as LangCode)).toBe('xx');
  });
});

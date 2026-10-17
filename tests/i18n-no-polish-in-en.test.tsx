// ============================================================================
// Napar (Steepwise) — No Polish in EN Guard (NFR-I18N-003)
// Guarantees zero Polish diacritics and zero leaked Polish domain words in EN dictionary
// ============================================================================

import { translations } from '../src/core/i18n';

describe('No Polish in EN Guard (NFR-I18N-003)', () => {
  const polishDiacriticsRegex = /[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/;
  const forbiddenPolishWords = [
    'Przepis',
    'Receptura',
    'Kawa',
    'Herbata',
    'Doza',
    'Mielenie',
    'Woda',
    'Temperatura',
    'Dodaj',
    'Zapisz',
    'Usuń',
    'Anuluj',
    'Gotowe',
    'Ustawienia',
    'Historia',
    'Czas',
    'Sekundy',
    'Minuty',
    'Ziarno',
    'Młynek',
  ];

  function collectStrings(obj: Record<string, any>, prefix = ''): Array<{ path: string; text: string }> {
    let result: Array<{ path: string; text: string }> = [];
    for (const [key, val] of Object.entries(obj)) {
      const fullPath = prefix ? `${prefix}.${key}` : key;
      if (typeof val === 'string') {
        result.push({ path: fullPath, text: val });
      } else if (typeof val === 'object' && val !== null) {
        result = result.concat(collectStrings(val, fullPath));
      }
    }
    return result;
  }

  const enEntries = collectStrings(translations.en);

  test('Słownik języka angielskiego (translations.en) nie zawiera polskich znaków diakrytycznych', () => {
    const violations: string[] = [];

    for (const { path, text } of enEntries) {
      if (polishDiacriticsRegex.test(text)) {
        violations.push(`${path}: "${text}"`);
      }
    }

    expect(violations).toEqual([]);
  });

  test('Słownik języka angielskiego nie zawiera słów z czarnej listy polskich terminów', () => {
    const violations: string[] = [];

    for (const { path, text } of enEntries) {
      for (const word of forbiddenPolishWords) {
        const wordRegex = new RegExp(`\\b${word}\\b`, 'i');
        if (wordRegex.test(text)) {
          violations.push(`${path}: contains "${word}" in "${text}"`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});

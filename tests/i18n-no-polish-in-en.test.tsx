// ============================================================================
// Napar (Steepwise) — No Polish in EN Guard (NFR-I18N-003)
// Guarantees zero Polish diacritics and zero leaked Polish domain words in EN dictionary
// ============================================================================

import React from 'react';
import renderer from 'react-test-renderer';
import { translations } from '../src/core/i18n';
import { BrewBanners } from '../src/components/brew/BrewBanners';
import { GrinderSelectionCard } from '../src/components/settings/GrinderSelectionCard';
import { SafeModeView } from '../src/components/SafeModeView';

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  shareAsync: jest.fn().mockResolvedValue(true),
}));

jest.mock('expo-file-system', () => ({
  documentDirectory: 'file:///data/user/0/pl.lukasz.napar/files/',
  getInfoAsync: jest.fn(async () => ({ exists: true })),
  readDirectoryAsync: jest.fn(async () => []),
  deleteAsync: jest.fn().mockResolvedValue(undefined),
  readAsStringAsync: jest.fn().mockResolvedValue('{}'),
  writeAsStringAsync: jest.fn().mockResolvedValue(undefined),
}));

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

  test('Komponenty UI renderowane w trybie angielskim (en) nie zawierają polskich znaków diakrytycznych', () => {
    let banners: any;
    let grinderCard: any;
    let safeMode: any;

    renderer.act(() => {
      banners = renderer.create(
        <BrewBanners
          corruptState={null}
          isHistoryReadOnly={true}
          language="en"
          onDismissCorrupt={jest.fn()}
        />
      );
      grinderCard = renderer.create(
        <GrinderSelectionCard
          selectedGrinder="comandante_c40"
          onSelectGrinder={jest.fn()}
          title="Default Grinder"
          language="en"
        />
      );
      safeMode = renderer.create(
        <SafeModeView onRetry={jest.fn()} language="en" />
      );
    });

    expect(JSON.stringify(banners.toJSON())).not.toMatch(polishDiacriticsRegex);
    expect(JSON.stringify(grinderCard.toJSON())).not.toMatch(polishDiacriticsRegex);
    expect(JSON.stringify(safeMode.toJSON())).not.toMatch(polishDiacriticsRegex);
  });

  test('TASK-P53-09-LOK: translations.en i translations.pl zawieraja klucze kategorii twardosci wody waterHardness*', () => {
    // EN
    expect((translations.en.water as any).waterHardnessVerySoft).toBe('Very soft water (<50 ppm CaCO₃)');
    expect((translations.en.water as any).waterHardnessSoft).toBe('Soft water (51–100 ppm CaCO₃)');
    expect((translations.en.water as any).waterHardnessModeratelyHard).toBe('Moderately hard water (101–175 ppm CaCO₃)');
    expect((translations.en.water as any).waterHardnessHard).toBe('Hard water (176–300 ppm CaCO₃)');
    expect((translations.en.water as any).waterHardnessVeryHard).toBe('Very hard water (>300 ppm CaCO₃)');

    // PL
    expect((translations.pl.water as any).waterHardnessVerySoft).toBe('Bardzo miękka woda (<50 ppm CaCO₃)');
    expect((translations.pl.water as any).waterHardnessSoft).toBe('Miękka woda (51–100 ppm CaCO₃)');
    expect((translations.pl.water as any).waterHardnessModeratelyHard).toBe('Średnio twarda woda (101–175 ppm CaCO₃)');
    expect((translations.pl.water as any).waterHardnessHard).toBe('Twarda woda (176–300 ppm CaCO₃)');
    expect((translations.pl.water as any).waterHardnessVeryHard).toBe('Bardzo twarda woda (>300 ppm CaCO₃)');
  });
});

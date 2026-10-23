// ============================================================================
// Napar (Steepwise) — Dane wiedzy: wybór opisu po języku (dane dwujęzyczne)
// Język inny niż PL dostaje wersję EN (fallback); brak wersji wybranego języka daje pusty tekst.
// Słownik podmieniony atrapą, bo prawdziwe dane mają zawsze obie wersje.
// ============================================================================

jest.mock('../knowledge-locales', () => {
  const actual = jest.requireActual('../knowledge-locales');
  return {
    ...actual,
    KNOWLEDGE_LOCALES: {
      ...actual.KNOWLEDGE_LOCALES,
      'probe-en-only': {
        descriptionPl: 'Opis PL',
        descriptionEn: 'Description EN',
        flavorProfileEn: 'Flavor EN',
      },
      'probe-both': {
        descriptionPl: 'Opis PL',
        descriptionEn: 'Description EN',
        sensoryProfilePl: 'Profil PL',
        sensoryProfileEn: 'Profile EN',
      },
    },
  };
});

import { getKnowledgeDescription, getKnowledgeSensoryProfile } from '../knowledge-data';

describe('Dane wiedzy po języku (pickBilingual)', () => {
  test('opis: PL dla pl, EN dla en i dla pozostałych języków', () => {
    expect(getKnowledgeDescription('probe-both', 'pl')).toBe('Opis PL');
    expect(getKnowledgeDescription('probe-both', 'en')).toBe('Description EN');
    expect(getKnowledgeDescription('probe-both', 'de')).toBe('Description EN');
  });

  test('profil sensoryczny: wersja zgodna z językiem (PL dla pl, EN dla pozostałych)', () => {
    expect(getKnowledgeSensoryProfile('probe-both', 'pl')).toBe('Profil PL');
    expect(getKnowledgeSensoryProfile('probe-both', 'ja')).toBe('Profile EN');
  });

  test('brak wersji PL przy dostępnej EN: w polskim pusty tekst, w pozostałych EN', () => {
    expect(getKnowledgeSensoryProfile('probe-en-only', 'pl')).toBe('');
    expect(getKnowledgeSensoryProfile('probe-en-only', 'en')).toBe('Flavor EN');
    expect(getKnowledgeSensoryProfile('probe-en-only', 'fr')).toBe('Flavor EN');
  });
});

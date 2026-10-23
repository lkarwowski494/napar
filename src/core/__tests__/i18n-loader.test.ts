// ============================================================================
// Napar (Steepwise) — Testy loadera i18n: wybór języka i fallback (100% core)
// ============================================================================

import {
  buildMessages,
  DICTIONARIES,
  FALLBACK_LANG,
  isLangCode,
  LANGS,
  LangCode,
  lookupMessage,
  matchSystemLocale,
  mergeWithFallback,
  resolveLanguage,
  resolveMessage,
  Translations,
} from '../i18n-loader';

const EXPECTED_LANGS = [
  'ar', 'bg', 'ca', 'cs', 'da', 'de', 'el', 'es', 'fi', 'fr', 'he', 'hi', 'hr', 'hu', 'id', 'it',
  'ja', 'ko', 'ms', 'nl', 'no', 'pl', 'pt-BR', 'pt-PT', 'ro', 'ru', 'sk', 'sv', 'th', 'tr', 'uk',
  'vi', 'zh-Hans', 'zh-Hant', 'en',
];

const leafPaths = (node: Record<string, unknown>, prefix = ''): string[] =>
  Object.entries(node).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return value !== null && typeof value === 'object' && !Array.isArray(value)
      ? leafPaths(value as Record<string, unknown>, path)
      : [path];
  });

describe('LANGS i FALLBACK_LANG', () => {
  test('LANGS zawiera dokładnie 35 unikalnych języków z listy MVP', () => {
    expect([...LANGS]).toEqual(EXPECTED_LANGS);
    expect(new Set(LANGS).size).toBe(35);
  });

  test('FALLBACK_LANG to angielski', () => {
    expect(FALLBACK_LANG).toBe('en');
    expect(LANGS).toContain(FALLBACK_LANG);
  });

  test('DICTIONARIES ma wpis dla każdego z 35 języków', () => {
    for (const lang of LANGS) {
      expect(DICTIONARIES[lang]).toBeDefined();
    }
    expect(Object.keys(DICTIONARIES).sort()).toEqual([...LANGS].sort());
  });
});

describe('isLangCode', () => {
  test('akceptuje obsługiwane kody', () => {
    expect(isLangCode('pl')).toBe(true);
    expect(isLangCode('pt-BR')).toBe(true);
    expect(isLangCode('zh-Hant')).toBe(true);
  });

  test('odrzuca nieobsługiwane wartości i nie-tekst', () => {
    expect(isLangCode('xx')).toBe(false);
    expect(isLangCode('PL')).toBe(false);
    expect(isLangCode(undefined)).toBe(false);
    expect(isLangCode(42)).toBe(false);
    expect(isLangCode(null)).toBe(false);
  });
});

describe('matchSystemLocale', () => {
  test('brak tagu lub nie-tekst daje null', () => {
    expect(matchSystemLocale(null)).toBeNull();
    expect(matchSystemLocale(undefined)).toBeNull();
    expect(matchSystemLocale('')).toBeNull();
    expect(matchSystemLocale('   ')).toBeNull();
  });

  test('dopasowanie dokładne bez względu na wielkość liter i separator', () => {
    expect(matchSystemLocale('pt_BR')).toBe('pt-BR');
    expect(matchSystemLocale('pt-br')).toBe('pt-BR');
    expect(matchSystemLocale('zh-hans')).toBe('zh-Hans');
    expect(matchSystemLocale('pl')).toBe('pl');
  });

  test('chiński: wersja tradycyjna dla Hant, TW, HK i MO; reszta uproszczona', () => {
    expect(matchSystemLocale('zh-Hant-TW')).toBe('zh-Hant');
    expect(matchSystemLocale('zh-TW')).toBe('zh-Hant');
    expect(matchSystemLocale('zh-HK')).toBe('zh-Hant');
    expect(matchSystemLocale('zh-MO')).toBe('zh-Hant');
    expect(matchSystemLocale('zh-CN')).toBe('zh-Hans');
    expect(matchSystemLocale('zh')).toBe('zh-Hans');
  });

  test('portugalski bez dokładnego dopasowania trafia do pt-BR', () => {
    expect(matchSystemLocale('pt')).toBe('pt-BR');
    expect(matchSystemLocale('pt-AO')).toBe('pt-BR');
    expect(matchSystemLocale('pt-PT')).toBe('pt-PT');
  });

  test('aliasy: nb/nn -> no, iw -> he, in -> id', () => {
    expect(matchSystemLocale('nb-NO')).toBe('no');
    expect(matchSystemLocale('nn')).toBe('no');
    expect(matchSystemLocale('iw-IL')).toBe('he');
    expect(matchSystemLocale('in')).toBe('id');
  });

  test('dopasowanie po języku bazowym, a nieobsługiwany język daje null', () => {
    expect(matchSystemLocale('de-AT')).toBe('de');
    expect(matchSystemLocale('en-GB')).toBe('en');
    expect(matchSystemLocale('sr-RS')).toBeNull();
    expect(matchSystemLocale('constructor')).toBeNull();
  });
});

describe('resolveLanguage', () => {
  test('ustawienie użytkownika ma pierwszeństwo przed językiem systemu', () => {
    expect(resolveLanguage('de', 'pl-PL')).toBe('de');
  });

  test('nieobsługiwane ustawienie użytkownika jest ignorowane', () => {
    expect(resolveLanguage('xx', 'fr-FR')).toBe('fr');
    expect(resolveLanguage(null, 'fr-FR')).toBe('fr');
  });

  test('bez ustawienia i bez dopasowania systemu wybiera angielski', () => {
    expect(resolveLanguage(undefined, null)).toBe('en');
    expect(resolveLanguage(undefined, 'sr-RS')).toBe('en');
  });
});

describe('mergeWithFallback', () => {
  const fallback = {
    common: { cancel: 'Cancel', save: 'Save' },
    title: 'Napar',
  };

  test('bez słownika źródłowego (undefined) wszystko pochodzi z zapasowego', () => {
    const onFallback = jest.fn();
    const merged = mergeWithFallback<typeof fallback>(undefined, fallback, onFallback);
    expect(merged).toEqual(fallback);
    expect(onFallback.mock.calls.map((c) => c[0])).toEqual(['common.cancel', 'common.save', 'title']);
  });

  test('własne niepuste wartości mają pierwszeństwo, brakujące i puste z zapasowego', () => {
    const onFallback = jest.fn();
    const merged = mergeWithFallback<typeof fallback>(
      { common: { cancel: 'Abbrechen', save: '   ' }, title: '' },
      fallback,
      onFallback
    );
    expect(merged).toEqual({ common: { cancel: 'Abbrechen', save: 'Save' }, title: 'Napar' });
    expect(onFallback.mock.calls.map((c) => c[0])).toEqual(['common.save', 'title']);
  });

  test('brakujące całe poddrzewo jest uzupełniane z zapasowego', () => {
    const merged = mergeWithFallback<typeof fallback>({ title: 'Napar-de' }, fallback);
    expect(merged.common).toEqual(fallback.common);
    expect(merged.title).toBe('Napar-de');
  });

  test('wartość tekstowa w miejscu poddrzewa jest traktowana jak brak i uzupełniana', () => {
    const onFallback = jest.fn();
    const merged = mergeWithFallback<typeof fallback>(
      { common: 'zły typ' } as unknown as Partial<typeof fallback>,
      fallback,
      onFallback
    );
    expect(merged.common).toEqual(fallback.common);
    expect(onFallback).toHaveBeenCalledWith('common.cancel');
  });

  test('klucze nadmiarowe w słowniku języka są pomijane (struktura zapasowego)', () => {
    const merged = mergeWithFallback<typeof fallback>(
      { title: 'X', extra: 'y' } as unknown as Partial<typeof fallback>,
      fallback
    );
    expect(Object.keys(merged)).toEqual(['common', 'title']);
    expect('extra' in merged).toBe(false);
  });
});

describe('lookupMessage', () => {
  const tree = { common: { ok: 'OK', blank: '  ' }, n: 5 };

  test('zwraca niepusty tekst po ścieżce z kropkami', () => {
    expect(lookupMessage(tree, 'common.ok')).toBe('OK');
  });

  test('brak ścieżki, pusty tekst, grupa i nie-tekst dają undefined', () => {
    expect(lookupMessage(tree, 'common.missing')).toBeUndefined();
    expect(lookupMessage(tree, 'common.blank')).toBeUndefined();
    expect(lookupMessage(tree, 'common')).toBeUndefined();
    expect(lookupMessage(tree, 'n')).toBeUndefined();
  });

  test('ścieżka za liściem i wejście nie-obiektowe dają undefined', () => {
    expect(lookupMessage(tree, 'common.ok.deeper')).toBeUndefined();
    expect(lookupMessage(null, 'common')).toBeUndefined();
  });

  test('dziedziczone właściwości prototypu nie są traktowane jako klucze', () => {
    expect(lookupMessage(tree, 'toString')).toBeUndefined();
  });
});

describe('resolveMessage (język docelowy -> en -> sam klucz)', () => {
  test('zwraca tekst z języka docelowego, gdy klucz istnieje', () => {
    const onMissing = jest.fn();
    expect(resolveMessage('common.cancel', 'pl', onMissing)).toBe('Anuluj');
    expect(onMissing).not.toHaveBeenCalled();
  });

  test('brak klucza w języku docelowym: zgłasza brak i zwraca tekst z en', () => {
    const original = DICTIONARIES.de;
    try {
      DICTIONARIES.de = { common: {} };
      const onMissing = jest.fn();
      expect(resolveMessage('common.cancel', 'de', onMissing)).toBe('Cancel');
      expect(onMissing).toHaveBeenCalledWith('common.cancel', 'de');
    } finally {
      DICTIONARIES.de = original;
    }
  });

  test('brak klucza w obu językach: zwraca sam klucz', () => {
    const onMissing = jest.fn();
    expect(resolveMessage('nie.istnieje', 'fr')).toBe('nie.istnieje');
    expect(resolveMessage('nie.istnieje', 'fr', onMissing)).toBe('nie.istnieje');
    expect(onMissing).toHaveBeenCalledWith('nie.istnieje', 'fr');
  });

  test('angielski bez klucza zwraca sam klucz', () => {
    expect(resolveMessage('nie.istnieje', 'en')).toBe('nie.istnieje');
  });
});

describe('buildMessages', () => {
  const plKeys = leafPaths(buildMessages('pl') as unknown as Record<string, unknown>).sort();

  test('każdy z 35 języków ma pełny zestaw kluczy z pl', () => {
    for (const lang of LANGS) {
      const keys = leafPaths(buildMessages(lang) as unknown as Record<string, unknown>).sort();
      expect(keys).toEqual(plKeys);
    }
  });

  test('zwraca wartości języka docelowego', () => {
    const pl: Translations = buildMessages('pl');
    expect(pl.common.cancel).toBe('Anuluj');
    expect(buildMessages('en').common.cancel).toBe('Cancel');
  });

  test('zgłasza każdą liść uzupełnioną z angielskiego (ścieżka + język)', () => {
    const original = DICTIONARIES.it;
    try {
      DICTIONARIES.it = { common: { cancel: 'Annulla' } };
      const onMissing = jest.fn();
      const messages = buildMessages('it', onMissing);
      expect(messages.common.cancel).toBe('Annulla');
      expect(messages.common.save).toBe('Save');
      expect(onMissing).toHaveBeenCalledWith('common.save', 'it');
      expect(onMissing).not.toHaveBeenCalledWith('common.cancel', 'it');
    } finally {
      DICTIONARIES.it = original;
    }
  });

  test('bez callbacku brakujących kluczy nie zgłasza błędu', () => {
    const original = DICTIONARIES.it;
    try {
      DICTIONARIES.it = { common: { cancel: 'Annulla' } };
      expect(() => buildMessages('it')).not.toThrow();
    } finally {
      DICTIONARIES.it = original;
    }
  });
});

describe('resolveLanguage z wartością typu LangCode', () => {
  test('zwraca typ LangCode dla każdego obsługiwanego języka', () => {
    const lang: LangCode = resolveLanguage('ja', null);
    expect(lang).toBe('ja');
  });
});

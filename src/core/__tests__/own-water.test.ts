// ============================================================================
// Napar (Steepwise) — Unit Tests: własna woda z raportu wodociągów (poz. 9)
// Wartości oczekiwane policzone ręcznie (patrz komentarze przy każdym teście).
// ============================================================================

import {
  MG_CACO3_PER_DEGREE_DH,
  hardnessToPpm,
  parseHardnessField,
  roundPpm,
  validateOwnWaterForm,
  type HardnessUnit,
  type OwnWaterFormField,
  type OwnWaterValidation,
  type WaterFieldError,
} from '../own-water';

describe('Własna woda: zamknięte zbiory typów', () => {
  test('Jednostki, pola formularza i błędy mają dokładnie zdefiniowane wartości', () => {
    const units: HardnessUnit[] = ['mgCaCO3', 'dH'];
    const fields: OwnWaterFormField[] = ['sourceName', 'gh', 'kh'];
    const errors: WaterFieldError[] = ['empty', 'invalid', 'negative'];
    const validation: OwnWaterValidation = validateOwnWaterForm(
      { sourceName: '', gh: '80', kh: '40', ghUnit: units[0], khUnit: units[1] },
      '2026-10-22T10:00:00.000Z'
    );
    expect(units).toHaveLength(2);
    expect(fields).toHaveLength(3);
    expect(errors).toHaveLength(3);
    expect(validation).toEqual({ ok: false, errors: { sourceName: 'empty' } });
  });
});

describe('Własna woda: przeliczanie jednostek i zaokrąglenia', () => {
  test('Stała przelicznika 1 °dH = 17,848 mg CaCO₃/L (rejestr S-091)', () => {
    expect(MG_CACO3_PER_DEGREE_DH).toBe(17.848);
  });

  test('Zaokrąglenie do 0,1 mg/L (połówka w górę)', () => {
    // 80,25 · 10 = 802,5 → 803 → 80,3
    expect(roundPpm(80.25)).toBe(80.3);
    // 80,24 · 10 = 802,4 → 802 → 80,2
    expect(roundPpm(80.24)).toBe(80.2);
  });

  test('Wartości w mg CaCO₃/L przechodzą bez przeliczenia (po zaokrągleniu)', () => {
    expect(hardnessToPpm(80, 'mgCaCO3')).toBe(80);
    expect(hardnessToPpm(80.25, 'mgCaCO3')).toBe(80.3);
  });

  test('Stopnie niemieckie: 5 °dH = 5 · 17,848 = 89,24 → 89,2 mg/L', () => {
    expect(hardnessToPpm(5, 'dH')).toBe(89.2);
  });

  test('Stopnie niemieckie: 7,3 °dH = 7,3 · 17,848 = 130,2904 → 130,3 mg/L', () => {
    expect(hardnessToPpm(7.3, 'dH')).toBe(130.3);
  });

  test('0 °dH daje 0 mg/L', () => {
    expect(hardnessToPpm(0, 'dH')).toBe(0);
  });
});

describe('Własna woda: odczyt pól formularza', () => {
  test('Przecinek i kropka są separatorem dziesiętnym; spacje są ignorowane', () => {
    expect(parseHardnessField('80,5')).toEqual({ ok: true, value: 80.5 });
    expect(parseHardnessField(' 4.5 ')).toEqual({ ok: true, value: 4.5 });
    expect(parseHardnessField('0')).toEqual({ ok: true, value: 0 });
  });

  test('Puste pole i same spacje są odrzucone', () => {
    expect(parseHardnessField('')).toEqual({ ok: false, error: 'empty' });
    expect(parseHardnessField('   ')).toEqual({ ok: false, error: 'empty' });
  });

  test('Tekst nieliczbowy i liczba z końcówką są odrzucone', () => {
    expect(parseHardnessField('abc')).toEqual({ ok: false, error: 'invalid' });
    expect(parseHardnessField('12abc')).toEqual({ ok: false, error: 'invalid' });
  });

  test('Wartości ujemne są odrzucone', () => {
    expect(parseHardnessField('-5')).toEqual({ ok: false, error: 'negative' });
    expect(parseHardnessField('-0,5')).toEqual({ ok: false, error: 'negative' });
  });
});

describe('Własna woda: walidacja formularza', () => {
  const NOW = '2026-10-22T10:00:00.000Z';

  test('Poprawny formularz: nazwa przycięta, GH w mg, KH w °dH przeliczone na ppm', () => {
    // GH 80,5 mg/L → 80,5 ; KH 5 °dH → 5 · 17,848 = 89,24 → 89,2
    const result = validateOwnWaterForm(
      { sourceName: '  Wodociągi Kraków  ', gh: '80,5', kh: '5', ghUnit: 'mgCaCO3', khUnit: 'dH' },
      NOW
    );
    expect(result).toEqual({
      ok: true,
      profile: { sourceName: 'Wodociągi Kraków', ghPpm: 80.5, khPpm: 89.2, updatedAt: NOW },
    });
  });

  test('Pusta nazwa źródła zwraca błąd tylko dla nazwy, nawet gdy liczby są poprawne', () => {
    const result = validateOwnWaterForm(
      { sourceName: '   ', gh: '80', kh: '40', ghUnit: 'mgCaCO3', khUnit: 'mgCaCO3' },
      NOW
    );
    expect(result).toEqual({ ok: false, errors: { sourceName: 'empty' } });
  });

  test('Błędy każdego pola są zbierane razem', () => {
    const result = validateOwnWaterForm(
      { sourceName: '', gh: '-1', kh: '', ghUnit: 'mgCaCO3', khUnit: 'dH' },
      NOW
    );
    expect(result).toEqual({
      ok: false,
      errors: { sourceName: 'empty', gh: 'negative', kh: 'empty' },
    });
  });

  test('Błąd tylko w KH nie zmienia poprawnej nazwy i GH (zwraca wyłącznie błąd KH)', () => {
    const result = validateOwnWaterForm(
      { sourceName: 'Źródło', gh: '60', kh: 'x', ghUnit: 'mgCaCO3', khUnit: 'mgCaCO3' },
      NOW
    );
    expect(result).toEqual({ ok: false, errors: { kh: 'invalid' } });
  });
});

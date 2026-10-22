// ============================================================================
// Napar (Steepwise) — Wektory referencyjne: grinder-converter i gongfu-session (wartości liczone ręcznie)
// ============================================================================

import {
  convertMicronsToGrinder,
  convertBetweenGrinders,
  getRecipeMicrons,
  getRecommendedGrindForRecipe,
  SUPPORTED_GRINDERS,
} from '../grinder-converter';
import {
  getRecommendedGongfuSteepSeconds,
  estimateTotalLeafCaffeineMg,
  createGongfuSession,
  recordGongfuInfusion,
  getGongfuSessionRating,
  GongfuSession,
} from '../gongfu-session';

const grinder = (id: string) => SUPPORTED_GRINDERS.find((g) => g.id === id)!;

describe('grinder-converter: mikrony -> nastawa (wzór: round((µm - offset) / krok), z przycięciem do zakresu)', () => {
  test('720 µm: Comandante 720/30 = 24 kliki; Timemore 720/35 = 20,6 -> 21 klików', () => {
    expect(convertMicronsToGrinder(720, 'comandante_c40')).toMatchObject({ rawValue: 24, formatted: '24 klików' });
    expect(convertMicronsToGrinder(720, 'timemore_c2_c3')).toMatchObject({ rawValue: 21, formatted: '21 klików' });
  });
  test('720 µm: 1Zpresso 720/20 = 36 -> "3.6 (36 klików)"; Kingrinder 720/16 = 45 klików', () => {
    expect(convertMicronsToGrinder(720, '1zpresso_k_ultra').formatted).toBe('3.6 (36 klików)');
    expect(convertMicronsToGrinder(720, 'kingrinder_k6').formatted).toBe('45 klików');
  });
  test('720 µm: Fellow (720-200)/40 = 13 -> 5 (13 = 1 + 4*3 + 0 -> "5"); Baratza (720-150)/35 = 16,3 -> #16', () => {
    expect(convertMicronsToGrinder(720, 'fellow_ode_gen2').formatted).toBe('5');
    expect(convertMicronsToGrinder(720, 'baratza_encore').formatted).toBe('Nastawa #16');
  });
  test('720 µm: Wilfa (720-250)/45 = 10,4 -> #10 (Chemex); Eureka (720-200)/25 = 20,8 -> 21', () => {
    expect(convertMicronsToGrinder(720, 'wilfa_svart').formatted).toBe('Filter #10 (Chemex)');
    expect(convertMicronsToGrinder(720, 'eureka_mignon').formatted).toBe('Pozycja #21');
  });
  test('720 µm: Kinu 720/10 = 72 -> przycięte do 50 -> "5.0 obrotu (50 klików)"', () => {
    expect(convertMicronsToGrinder(720, 'kinu_m47').formatted).toBe('5.0 obrotu (50 klików)');
  });
  test('uniwersalny młynek: 720 µm = 72 -> "720 µm · Średnio (V60 / Drip)"; 200 µm -> espresso', () => {
    expect(convertMicronsToGrinder(720, 'generic_grinder').formatted).toBe('720 µm · Średnio (V60 / Drip)');
    expect(convertMicronsToGrinder(200, 'generic_grinder').formatted).toBe('200 µm · Bardzo drobno (Espresso)');
  });
  test('wejście poza 150–1500 µm jest przycinane: 100 µm -> 150 µm -> Comandante 5 klików (minimum)', () => {
    expect(convertMicronsToGrinder(100, 'comandante_c40').rawValue).toBe(5);
    expect(convertMicronsToGrinder(5000, 'comandante_c40').rawValue).toBe(45);
  });
  test('nieznany identyfikator -> pierwszy młynek (Comandante)', () => {
    expect(convertMicronsToGrinder(720, 'nie_ma').grinderName).toBe('Comandante C40 MK3/MK4');
  });
});

describe('grinder-converter: parseSetting z pustego tekstu używa wartości domyślnej (wartości ręczne)', () => {
  test.each([
    ['comandante_c40', 720], // 24 * 30
    ['timemore_c2_c3', 630], // 18 * 35
    ['1zpresso_k_ultra', 1500], // 7,5 < 15 -> 7,5 * 10 * 20
    ['fellow_ode_gen2', 800], // 200 + 5 * 3 * 40
    ['baratza_encore', 710], // 150 + 16 * 35
    ['kingrinder_k6', 1440], // 90 * 16
    ['wilfa_svart', 565], // 250 + 7 * 45
    ['kinu_m47', 350], // 3,5 < 10 -> 3,5 * 10 * 10
    ['eureka_mignon', 325], // 200 + 5 * 25
    ['generic_grinder', 720],
  ])('%s', (id, microns) => {
    expect(grinder(id).parseSetting('')).toBe(microns);
  });

  test('wartości jawne: 1Zpresso "20" -> 400 µm; Kinu "12" -> 120 µm; Fellow "5" -> 800 µm', () => {
    expect(grinder('1zpresso_k_ultra').parseSetting('20')).toBe(400);
    expect(grinder('kinu_m47').parseSetting('12')).toBe(120);
    expect(grinder('fellow_ode_gen2').parseSetting('5')).toBe(800);
  });

  test('konwersja między młynkami: Comandante 24 -> 720 µm -> Timemore 21 klików; tekst "24" daje to samo', () => {
    expect(convertBetweenGrinders('comandante_c40', 24, 'timemore_c2_c3')).toEqual({
      targetFormatted: '21 klików',
      microns: 720,
    });
    expect(convertBetweenGrinders('comandante_c40', '24', 'timemore_c2_c3').targetFormatted).toBe('21 klików');
  });

  test('nastawa 1Zpresso 7,5 (tekst) = 1500 µm; Comandante 24 kliki -> 720 µm; tekst "7.5" -> 1500', () => {
    expect(convertBetweenGrinders('1zpresso_k_ultra', '7.5', 'generic_grinder').microns).toBe(1500);
  });
});

describe('getRecipeMicrons i rekomendacja nastawy dla receptury', () => {
  test.each([
    [{ method: 'ESPRESSO' }, 350],
    [{ method: 'AEROPRESS', grindSettingDescriptionPl: 'drobno 16 klików' }, 520],
    [{ method: 'AEROPRESS' }, 560],
    [{ method: 'V60', grindSettingDescriptionPl: 'grubo 28' }, 850],
    [{ method: 'KALITA', grind_size_description: '18 klików' }, 600],
    [{ method: 'V60' }, 720],
    [{ method: 'CHEMEX' }, 880],
    [{ method: 'FRENCH_PRESS' }, 1150],
    [{ method: 'NIEZNANA' }, 720],
    [{}, 720],
  ])('%j -> %i µm', (recipe, microns) => {
    expect(getRecipeMicrons(recipe)).toBe(microns);
  });

  test('V60 720 µm -> Comandante 24 kliki', () => {
    expect(getRecommendedGrindForRecipe({ method: 'V60' }, 'comandante_c40')).toEqual({
      formatted: '24 klików',
      rawValue: 24,
      grinderName: 'Comandante C40 MK3/MK4',
      microns: 720,
      baseValue: 24,
    });
  });
});

describe('gongfu-session: czasy infuzji wg tabel z komentarzy (wartości ręczne)', () => {
  test('Wulong skalny: 15, 20, 25, 35, 50, 70 s; 7. zalanie 95 s (70 + 25)', () => {
    const got = [1, 2, 3, 4, 5, 6, 7].map((n) => getRecommendedGongfuSteepSeconds('wulong_rock', n));
    expect(got).toEqual([15, 20, 25, 35, 50, 70, 95]);
  });
  test('Sheng puerh: 10, 12, 15, 20, 30, 45, 65 s; 8. zalanie 85 s (65 + 20)', () => {
    const got = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => getRecommendedGongfuSteepSeconds('puerh_sheng', n));
    expect(got).toEqual([10, 12, 15, 20, 30, 45, 65, 85]);
  });
  test('Shou puerh 1–5: 15, 15, 20, 25, 35 s', () => {
    const got = [1, 2, 3, 4, 5].map((n) => getRecommendedGongfuSteepSeconds('puerh_shou', n));
    expect(got).toEqual([15, 15, 20, 25, 35]);
  });
  test('Wulong wysokogórski 1–4: 20, 25, 35, 50 s', () => {
    expect([1, 2, 3, 4].map((n) => getRecommendedGongfuSteepSeconds('wulong_high_mountain', n))).toEqual([20, 25, 35, 50]);
  });
  test('Biała 1–4: 25, 30, 40, 55 s; Czarna 1–4: 12, 15, 20, 30 s; Zielona 1–3: 20, 25, 35 s', () => {
    expect([1, 2, 3, 4].map((n) => getRecommendedGongfuSteepSeconds('white', n))).toEqual([25, 30, 40, 55]);
    expect([1, 2, 3, 4].map((n) => getRecommendedGongfuSteepSeconds('black', n))).toEqual([12, 15, 20, 30]);
    expect([1, 2, 3].map((n) => getRecommendedGongfuSteepSeconds('green', n))).toEqual([20, 25, 35]);
  });
  test('numer zalania 0 lub mniejszy -> 10 s', () => {
    expect(getRecommendedGongfuSteepSeconds('green', 0)).toBe(10);
  });
});

describe('gongfu-session: kofeina z liści i zalań (wartości ręczne)', () => {
  test('7 g liści * 1000 mg/g * 3 % = 210 mg', () => {
    expect(estimateTotalLeafCaffeineMg(7)).toBe(210);
  });

  test('7 g: zalanie 1 = 210 * 0,45 = 94,5 mg; zalanie 2 = 210 * 0,30 = 63 mg; razem 157,5 mg', () => {
    let s = createGongfuSession({
      teaName: 'Da Hong Pao',
      teaType: 'wulong_rock',
      leafDoseGrams: 7,
      vesselCapacityMl: 120,
      waterTempCelsius: 96,
    });
    s = recordGongfuInfusion(s, { durationSeconds: 15 });
    expect(s.infusions[0].caffeineMg).toBe(94.5);
    expect(s.infusions[0].waterGrams).toBe(120);
    expect(s.totalCaffeineMg).toBe(94.5);
    s = recordGongfuInfusion(s, { durationSeconds: 20, waterTempCelsius: 0 });
    expect(s.infusions[1].caffeineMg).toBe(63);
    expect(s.infusions[1].waterTempCelsius).toBe(96); // 0 -> temperatura sesji
    expect(s.totalCaffeineMg).toBe(157.5);
  });
});

describe('gongfu-session: ocena sesji z ocen zalań (null, gdy brak ocen; nie wstawiamy 5)', () => {
  const base = (ratings: Array<number | undefined>): GongfuSession => {
    let s = createGongfuSession({
      teaName: 'T',
      teaType: 'green',
      leafDoseGrams: 5,
      vesselCapacityMl: 150,
      waterTempCelsius: 80,
    });
    for (const r of ratings) {
      s = recordGongfuInfusion(s, { durationSeconds: 20, tasteRating: r });
    }
    return s;
  };

  test('brak zalań i zalania bez oceny -> null', () => {
    expect(getGongfuSessionRating(base([]))).toBeNull();
    expect(getGongfuSessionRating(base([undefined, undefined]))).toBeNull();
  });
  test('oceny 4 i 5 -> średnia 4,5 zaokrąglona do 5', () => {
    expect(getGongfuSessionRating(base([4, 5]))).toBe(5);
  });
  test('oceny 3, 4, 4 -> 3,67 -> 4; oceny 2 i 3 -> 2,5 -> 3', () => {
    expect(getGongfuSessionRating(base([3, 4, 4]))).toBe(4);
    expect(getGongfuSessionRating(base([2, 3]))).toBe(3);
  });
  test('zalania bez oceny są pomijane w średniej: oceny 2 i (brak) i 4 -> 3', () => {
    expect(getGongfuSessionRating(base([2, undefined, 4]))).toBe(3);
  });
});

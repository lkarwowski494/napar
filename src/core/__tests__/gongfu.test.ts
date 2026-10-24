// ============================================================================
// Napar (Steepwise) — Unit Tests: Gongfu Cha Multi-Infusion Model
// ============================================================================

import {
  getRecommendedGongfuSteepSeconds,
  createGongfuSession,
  recordGongfuInfusion,
  estimateTotalLeafCaffeineMg,
  GongfuTeaType,
} from '../gongfu-session';

describe('Gongfu Cha Multi-Infusion Model', () => {
  test('Rekomenduje narastające czasy infuzji dla Wulonga Skalnego', () => {
    expect(getRecommendedGongfuSteepSeconds('wulong_rock', 0)).toBe(10);
    expect(getRecommendedGongfuSteepSeconds('wulong_rock', 1)).toBe(15);
    expect(getRecommendedGongfuSteepSeconds('wulong_rock', 2)).toBe(20);
    expect(getRecommendedGongfuSteepSeconds('wulong_rock', 3)).toBe(25);
    expect(getRecommendedGongfuSteepSeconds('wulong_rock', 4)).toBe(35);
    expect(getRecommendedGongfuSteepSeconds('wulong_rock', 5)).toBe(50);
    expect(getRecommendedGongfuSteepSeconds('wulong_rock', 6)).toBe(70);
    expect(getRecommendedGongfuSteepSeconds('wulong_rock', 7)).toBe(95);
    expect(getRecommendedGongfuSteepSeconds('wulong_rock', 8)).toBe(120);
  });

  test('Rekomenduje krótkie czasy infuzji dla Sheng Puerha', () => {
    expect(getRecommendedGongfuSteepSeconds('puerh_sheng', 1)).toBe(10);
    expect(getRecommendedGongfuSteepSeconds('puerh_sheng', 2)).toBe(12);
    expect(getRecommendedGongfuSteepSeconds('puerh_sheng', 3)).toBe(15);
    expect(getRecommendedGongfuSteepSeconds('puerh_sheng', 4)).toBe(20);
    expect(getRecommendedGongfuSteepSeconds('puerh_sheng', 5)).toBe(30);
    expect(getRecommendedGongfuSteepSeconds('puerh_sheng', 6)).toBe(45);
    expect(getRecommendedGongfuSteepSeconds('puerh_sheng', 7)).toBe(65);
  });

  test('Rekomenduje czasy infuzji dla Shou Puerha, Wulonga Wysokogórskiego, Białej, Czarnej i Zielonej', () => {
    // Shou Puerh
    expect(getRecommendedGongfuSteepSeconds('puerh_shou', 1)).toBe(15);
    expect(getRecommendedGongfuSteepSeconds('puerh_shou', 2)).toBe(15);
    expect(getRecommendedGongfuSteepSeconds('puerh_shou', 3)).toBe(20);
    expect(getRecommendedGongfuSteepSeconds('puerh_shou', 4)).toBe(25);
    expect(getRecommendedGongfuSteepSeconds('puerh_shou', 5)).toBe(35);
    expect(getRecommendedGongfuSteepSeconds('puerh_shou', 6)).toBe(55);

    // Wulong Wysokogórski
    expect(getRecommendedGongfuSteepSeconds('wulong_high_mountain', 1)).toBe(20);
    expect(getRecommendedGongfuSteepSeconds('wulong_high_mountain', 2)).toBe(25);
    expect(getRecommendedGongfuSteepSeconds('wulong_high_mountain', 3)).toBe(35);
    expect(getRecommendedGongfuSteepSeconds('wulong_high_mountain', 4)).toBe(50);
    expect(getRecommendedGongfuSteepSeconds('wulong_high_mountain', 5)).toBe(75);

    // Biała
    expect(getRecommendedGongfuSteepSeconds('white', 1)).toBe(25);
    expect(getRecommendedGongfuSteepSeconds('white', 2)).toBe(30);
    expect(getRecommendedGongfuSteepSeconds('white', 3)).toBe(40);
    expect(getRecommendedGongfuSteepSeconds('white', 4)).toBe(55);
    expect(getRecommendedGongfuSteepSeconds('white', 5)).toBe(80);

    // Czarna
    expect(getRecommendedGongfuSteepSeconds('black', 1)).toBe(12);
    expect(getRecommendedGongfuSteepSeconds('black', 2)).toBe(15);
    expect(getRecommendedGongfuSteepSeconds('black', 3)).toBe(20);
    expect(getRecommendedGongfuSteepSeconds('black', 4)).toBe(30);
    expect(getRecommendedGongfuSteepSeconds('black', 5)).toBe(50);

    // Zielona
    expect(getRecommendedGongfuSteepSeconds('green', 1)).toBe(20);
    expect(getRecommendedGongfuSteepSeconds('green', 2)).toBe(25);
    expect(getRecommendedGongfuSteepSeconds('green', 3)).toBe(35);
    expect(getRecommendedGongfuSteepSeconds('green', 4)).toBe(55);

    // Fallback dla nieznanego typu
    expect(getRecommendedGongfuSteepSeconds('other_type' as any, 1)).toBe(20);
  });

  test('Szacuje całkowitą pulę kofeiny z suchych liści', () => {
    // 7g liści * 3% = 210 mg
    const total = estimateTotalLeafCaffeineMg(7.0);
    expect(total).toBe(210.0);
  });

  test('Zarządza cyklem sesji i rejestruje kolejne zalania', () => {
    let session = createGongfuSession({
      teaName: 'Da Hong Pao (Wuyi)',
      teaType: 'wulong_rock',
      leafDoseGrams: 7.0,
      vesselCapacityMl: 110,
      waterTempCelsius: 96,
    });

    expect(session.infusions.length).toBe(0);
    expect(session.totalCaffeineMg).toBe(0);

    // Infuzja 1
    session = recordGongfuInfusion(session, {
      durationSeconds: 15,
      flavorNotes: ['Cynamon', 'Prażony karmel'],
      tasteRating: 5,
    });

    expect(session.infusions.length).toBe(1);
    expect(session.infusions[0].infusionNumber).toBe(1);
    expect(session.infusions[0].durationSeconds).toBe(15);
    // 45% z 210mg = 94.5mg
    expect(session.infusions[0].caffeineMg).toBe(84.0);
    expect(session.totalCaffeineMg).toBe(84.0);

    // Infuzja 2
    session = recordGongfuInfusion(session, {
      durationSeconds: 20,
      flavorNotes: ['Miód', 'Śliwka'],
      tasteRating: 5,
    });

    expect(session.infusions.length).toBe(2);
    expect(session.infusions[1].infusionNumber).toBe(2);
    // 30% z 210mg = 63.0mg -> 94.5 + 63 = 157.5mg
    expect(session.infusions[1].caffeineMg).toBe(46.2);
    expect(session.totalCaffeineMg).toBe(130.2);
  });
});

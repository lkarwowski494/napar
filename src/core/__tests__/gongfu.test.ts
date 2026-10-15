// ============================================================================
// Napar (Steepwise) — Unit Tests: Gongfu Cha Multi-Infusion Tracker
// ============================================================================

import {
  getRecommendedGongfuSteepSeconds,
  createGongfuSession,
  recordGongfuInfusion,
  estimateTotalLeafCaffeineMg,
} from '../gongfu-session';

describe('Gongfu Cha Multi-Infusion Model', () => {
  test('Rekomenduje narastające czasy infuzji dla Wulonga Skalnego', () => {
    expect(getRecommendedGongfuSteepSeconds('wulong_rock', 1)).toBe(15);
    expect(getRecommendedGongfuSteepSeconds('wulong_rock', 2)).toBe(20);
    expect(getRecommendedGongfuSteepSeconds('wulong_rock', 3)).toBe(25);
    expect(getRecommendedGongfuSteepSeconds('wulong_rock', 4)).toBe(35);
    expect(getRecommendedGongfuSteepSeconds('wulong_rock', 5)).toBe(50);
    expect(getRecommendedGongfuSteepSeconds('wulong_rock', 6)).toBe(70);
    expect(getRecommendedGongfuSteepSeconds('wulong_rock', 7)).toBe(95);
  });

  test('Rekomenduje krótkie czasy infuzji dla Sheng Puerha', () => {
    expect(getRecommendedGongfuSteepSeconds('puerh_sheng', 1)).toBe(10);
    expect(getRecommendedGongfuSteepSeconds('puerh_sheng', 2)).toBe(12);
    expect(getRecommendedGongfuSteepSeconds('puerh_sheng', 3)).toBe(15);
    expect(getRecommendedGongfuSteepSeconds('puerh_sheng', 4)).toBe(20);
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
    expect(session.infusions[0].caffeineMg).toBe(94.5);
    expect(session.totalCaffeineMg).toBe(94.5);

    // Infuzja 2
    session = recordGongfuInfusion(session, {
      durationSeconds: 20,
      flavorNotes: ['Miód', 'Śliwka'],
      tasteRating: 5,
    });

    expect(session.infusions.length).toBe(2);
    expect(session.infusions[1].infusionNumber).toBe(2);
    // 30% z 210mg = 63.0mg
    expect(session.infusions[1].caffeineMg).toBe(63.0);
    // Suma: 94.5 + 63.0 = 157.5mg
    expect(session.totalCaffeineMg).toBe(157.5);

    // Infuzja 3
    session = recordGongfuInfusion(session, {
      durationSeconds: 25,
      tasteRating: 4,
    });
    // 15% z 210mg = 31.5mg
    expect(session.infusions[2].caffeineMg).toBe(31.5);
    expect(session.totalCaffeineMg).toBe(189.0);
  });
});

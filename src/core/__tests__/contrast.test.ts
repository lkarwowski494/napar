// ============================================================================
// Napar (Steepwise) — Unit Tests: Contrast & WCAG 2.1 (TASK-P57-04-SZT)
// ============================================================================

import {
  parseHexColor,
  parseColor,
  sRgbChannelLuminance,
  getRelativeLuminance,
  getContrastRatio,
  isWcagPassAA,
  isWcagPassAAA,
} from '../contrast';

describe('Contrast & WCAG 2.1 Verification (TASK-P57-04-SZT)', () => {
  test('parseHexColor i parseColor obsluguje 3, 4, 6 i 8-znakowe hexy oraz format rgb/rgba', () => {
    // 3 znaki
    expect(parseColor('#FFF')).toEqual([255, 255, 255]);
    expect(parseHexColor('#000')).toEqual([0, 0, 0]);

    // 4 znaki (#RGBA)
    expect(parseColor('#FFFF')).toEqual([255, 255, 255]);

    // 6 znaków
    expect(parseColor('#D97736')).toEqual([217, 119, 54]);

    // 8 znaków (#RRGGBBAA)
    expect(parseColor('#D97736FF')).toEqual([217, 119, 54]);

    // Format rgb / rgba
    expect(parseColor('rgb(217, 119, 54)')).toEqual([217, 119, 54]);
    expect(parseColor('rgba(217, 119, 54, 0.8)')).toEqual([217, 119, 54]);

    // BOM i znaki kontrolne
    expect(parseColor('\uFEFF#D97736\x00\r\n')).toEqual([217, 119, 54]);
  });

  test('isWcagPassAA i isWcagPassAAA poprawnie oceniaja progi kontrastu dla tekstu zwyklego i duzego', () => {
    // Czarny na białym: 21:1 -> AA (true), AAA (true)
    expect(isWcagPassAA('#000000', '#FFFFFF')).toBe(true);
    expect(isWcagPassAAA('#000000', '#FFFFFF')).toBe(true);

    // textPrimary (#F4EFEA) na bg (#121214) -> > 12:1 -> AA i AAA spełnione
    expect(isWcagPassAA('#F4EFEA', '#121214')).toBe(true);
    expect(isWcagPassAAA('#F4EFEA', '#121214')).toBe(true);

    // Kontrast graniczny: 4.6:1 (spełnia AA dla zwykłego, nie spełnia AAA dla zwykłego, ale spełnia AAA dla dużego tekstu)
    const ratio = getContrastRatio('#8C8884', '#121214');
    expect(ratio).toBeGreaterThanOrEqual(4.5);
    expect(isWcagPassAA('#8C8884', '#121214')).toBe(true);
    expect(isWcagPassAAA('#8C8884', '#121214')).toBe(false);
    expect(isWcagPassAAA('#8C8884', '#121214', true)).toBe(true);
  });

  test('Ochrona przed NaN, -0 i niepoprawnymi wejsciami', () => {
    expect(parseColor(null as any)).toEqual([0, 0, 0]);
    expect(parseColor('')).toEqual([0, 0, 0]);
    expect(parseColor('invalid-color')).toEqual([0, 0, 0]);

    const ratio = getContrastRatio('#000000', '#000000');
    expect(ratio).toBe(1.0);
    expect(Object.is(ratio, -0)).toBe(false);
  });
});

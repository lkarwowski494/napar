// ============================================================================
// Napar (Steepwise) — WCAG 2.1 Contrast & Relative Luminance (RD-ENG-02)
// Exact standard implementation per BRD-QA-REL 1.0 & WCAG 2.1
// ============================================================================

export function parseColor(color: string): [number, number, number] {
  if (!color || typeof color !== 'string') return [0, 0, 0];
  const clean = color
    .replace(/\uFEFF/g, '')
    .replace(/[\x00-\x1F\x7F]/g, '')
    .trim();

  // Sprawdź format rgb(...) lub rgba(...)
  const rgbMatch = clean.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*[\d.]+\s*)?\)$/i);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1], 10);
    const g = parseInt(rgbMatch[2], 10);
    const b = parseInt(rgbMatch[3], 10);
    return [
      Number.isFinite(r) ? Math.max(0, Math.min(255, r)) : 0,
      Number.isFinite(g) ? Math.max(0, Math.min(255, g)) : 0,
      Number.isFinite(b) ? Math.max(0, Math.min(255, b)) : 0,
    ];
  }

  // Format hex
  let hex = clean.replace('#', '').trim();
  // 3 znaki (#RGB -> #RRGGBB)
  if (hex.length === 3) {
    hex = hex.split('').map((c) => c + c).join('');
  }
  // 4 znaki (#RGBA -> #RRGGBB)
  else if (hex.length === 4) {
    hex = hex.substring(0, 3).split('').map((c) => c + c).join('');
  }
  // 8 znaków (#RRGGBBAA -> #RRGGBB)
  else if (hex.length === 8) {
    hex = hex.substring(0, 6);
  }

  if (hex.length < 6 || !/^[0-9a-fA-F]{6}$/.test(hex)) {
    return [0, 0, 0];
  }

  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return [
    Number.isFinite(r) ? Math.max(0, Math.min(255, r)) : 0,
    Number.isFinite(g) ? Math.max(0, Math.min(255, g)) : 0,
    Number.isFinite(b) ? Math.max(0, Math.min(255, b)) : 0,
  ];
}

export const parseHexColor = parseColor;

/**
 * Kanał sRGB do zlinearyzowanej luminancji zgodnie z RD-ENG-02:
 * s(c) = c/12.92 gdy c <= 0.04045, inaczej ((c + 0.055)/1.055)^2.4
 */
export function sRgbChannelLuminance(c: number): number {
  if (!Number.isFinite(c) || c <= 0) return 0;
  const norm = Math.min(1.0, c / 255.0);
  if (norm <= 0.04045) {
    return norm / 12.92;
  }
  return Math.pow((norm + 0.055) / 1.055, 2.4);
}

/**
 * Luminancja względna L = 0.2126 s(R) + 0.7152 s(G) + 0.0722 s(B)
 */
export function getRelativeLuminance(color: string): number {
  const [r, g, b] = parseColor(color);
  const lum =
    0.2126 * sRgbChannelLuminance(r) +
    0.7152 * sRgbChannelLuminance(g) +
    0.0722 * sRgbChannelLuminance(b);
  return Object.is(lum, -0) ? 0 : lum;
}

/**
 * Współczynnik kontrastu CR(L1, L2) = (max + 0.05) / (min + 0.05)
 * Zakres: [1.0, 21.0]
 */
export function getContrastRatio(color1: string, color2: string): number {
  const l1 = getRelativeLuminance(color1);
  const l2 = getRelativeLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  const ratio = (lighter + 0.05) / (darker + 0.05);
  const clamped = Math.max(1.0, Math.min(21.0, ratio));
  const rounded = Number(clamped.toFixed(4));
  return Object.is(rounded, -0) ? 1.0 : rounded;
}

/**
 * Zgodność z kryterium sukcesu WCAG 2.1 AA (1.4.3 Contrast Minimum):
 * - Tekst zwykły: ratio >= 4.5
 * - Duży tekst (18pt+ lub 14pt+ bold): ratio >= 3.0
 */
export function isWcagPassAA(color1: string, color2: string, isLargeText: boolean = false): boolean {
  const ratio = getContrastRatio(color1, color2);
  const threshold = isLargeText ? 3.0 : 4.5;
  return ratio >= threshold;
}

/**
 * Zgodność z kryterium sukcesu WCAG 2.1 AAA (1.4.6 Contrast Enhanced):
 * - Tekst zwykły: ratio >= 7.0
 * - Duży tekst (18pt+ lub 14pt+ bold): ratio >= 4.5
 */
export function isWcagPassAAA(color1: string, color2: string, isLargeText: boolean = false): boolean {
  const ratio = getContrastRatio(color1, color2);
  const threshold = isLargeText ? 4.5 : 7.0;
  return ratio >= threshold;
}

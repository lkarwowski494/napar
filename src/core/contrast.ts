// ============================================================================
// Napar (Steepwise) — WCAG 2.1 Contrast & Relative Luminance (RD-ENG-02)
// Exact standard implementation per BRD-QA-REL 1.0
// ============================================================================

export function parseHexColor(hex: string): [number, number, number] {
  if (!hex || typeof hex !== 'string') return [0, 0, 0];
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  if (clean.length < 6) return [0, 0, 0];
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return [
    Number.isFinite(r) ? Math.max(0, Math.min(255, r)) : 0,
    Number.isFinite(g) ? Math.max(0, Math.min(255, g)) : 0,
    Number.isFinite(b) ? Math.max(0, Math.min(255, b)) : 0,
  ];
}

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
export function getRelativeLuminance(hex: string): number {
  const [r, g, b] = parseHexColor(hex);
  return (
    0.2126 * sRgbChannelLuminance(r) +
    0.7152 * sRgbChannelLuminance(g) +
    0.0722 * sRgbChannelLuminance(b)
  );
}

/**
 * Współczynnik kontrastu CR(L1, L2) = (max + 0.05) / (min + 0.05)
 */
export function getContrastRatio(hex1: string, hex2: string): number {
  const l1 = getRelativeLuminance(hex1);
  const l2 = getRelativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(4));
}

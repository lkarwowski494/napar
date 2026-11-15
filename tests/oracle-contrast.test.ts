// ============================================================================
// Napar — wyrocznia kontrastu WCAG 2.1 ze źródła (M1-audytor-generalny-044; 07-jakosc-010)
// Wzór i progi z https://www.w3.org/TR/WCAG21/ (rejestr WCAG21-KONTRAST, odczyt 2026-11-15),
// rachunek w Pythonie (Decimal). Kolory motywu są wejściem czytanym z src/core/theme.ts.
// ============================================================================

import contrastCorpus from './fixtures/theme-contrast-corpus.json';
import { getContrastRatio } from '../src/core/contrast';
import { theme } from '../src/core/theme';

type Vec = { id: string; zrodla?: string[]; znany_rozjazd?: string };
const tol = contrastCorpus.metadata.tolerancja;

function expectMatch(v: Vec, ok: boolean, detail: unknown) {
  if (v.znany_rozjazd) expect([v.id, v.znany_rozjazd, ok]).toEqual([v.id, v.znany_rozjazd, false]);
  else expect([v.id, ok, detail]).toEqual([v.id, true, detail]);
}

describe('Wyrocznia kontrastu WCAG 2.1 ze źródła (M1-audytor-generalny-044)', () => {
  test('wartości stwierdzone przez W3C (1 i 21) i rachunek z definicji W3C', () => {
    for (const v of contrastCorpus.canonical_rd_vectors) {
      expect([v.id, (v.zrodla ?? []).length > 0]).toEqual([v.id, true]);
      const r = getContrastRatio(v.color1 ?? (v as any).foregroundHex, v.color2 ?? (v as any).backgroundHex);
      expectMatch(v, Math.abs(r - v.contrastRatio) <= tol, r);
    }
  });

  test('pary motywu: kolory w korpusie równe theme.colors; współczynnik zgodny z W3C; tekst spełnia AA (SC 1.4.3)', () => {
    const colors = theme.colors as Record<string, string>;
    for (const p of contrastCorpus.theme_pairs) {
      expect([p.id, p.foregroundHex, p.backgroundHex]).toEqual([p.id, colors[p.foregroundName], colors[p.backgroundName]]);
      const r = getContrastRatio(p.foregroundHex, p.backgroundHex);
      expectMatch(p, Math.abs(r - p.contrastRatio) <= tol, r);
      expect([p.id, p.passAA_NormalText]).toEqual([p.id, true]);
    }
  });
});

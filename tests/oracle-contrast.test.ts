// ============================================================================
// Napar (Steepwise) — Theme Contrast Oracle Test (RD-ENG-02, BR-TEST-013, NFR-A11Y-005)
// Verifies TS WCAG 2.1 contrast calculations against Python 3 oracle
// ============================================================================

import contrastCorpus from './fixtures/theme-contrast-corpus.json';
import { getContrastRatio } from '../src/core/contrast';

describe('Python 3 Theme Contrast Oracle (RD-ENG-02, BR-TEST-013)', () => {
  test('RD-ENG-02 canonical test vectors match Python oracle and BRD specification', () => {
    for (const v of contrastCorpus.canonical_rd_vectors) {
      const actualRatio = getContrastRatio(v.color1, v.color2);
      expect(Math.abs(actualRatio - v.contrastRatio)).toBeLessThanOrEqual(0.01);
      expect(actualRatio >= 4.5).toBe(v.passAA);
    }
  });

  test('Theme color pairs match Python oracle to 2 decimal places and fulfill AA/AAA requirements', () => {
    for (const pair of contrastCorpus.theme_pairs) {
      const actualRatio = getContrastRatio(pair.foregroundHex, pair.backgroundHex);
      expect(Math.abs(actualRatio - pair.contrastRatio)).toBeLessThanOrEqual(0.01);

      // textPrimary on background must be AAA (>= 7.0)
      if (pair.foregroundName === 'textPrimary' && (pair.backgroundName === 'bg' || pair.backgroundName === 'bgCard')) {
        expect(actualRatio).toBeGreaterThanOrEqual(7.0);
      }

      // textSecondary on bgCard must be AA (>= 4.5)
      if (pair.foregroundName === 'textSecondary' && pair.backgroundName === 'bgCard') {
        expect(actualRatio).toBeGreaterThanOrEqual(4.5);
      }
    }
  });
});

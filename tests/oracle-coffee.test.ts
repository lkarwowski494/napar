// ============================================================================
// Napar — wyrocznia dziedzinowa ze źródeł (M1-audytor-generalny-044; 07-jakosc-010)
// Wartości oczekiwane: BRD RD-03 / RD-17 (plik:linia z cytatem) albo rejestr.json (adres, cytat, data);
// rachunek z definicji w Pythonie (fractions / Decimal), nie przepisany kod aplikacji.
// Wektor z "znany_rozjazd": "<ID>" oznacza potwierdzoną rozbieżność kodu ze źródłem — test wymaga,
// by rozbieżność trwała (po naprawie kodu usuń znacznik w generatorze).
// ============================================================================

import corpus from './fixtures/coffee-corpus.json';
import { calculateExtractionYield, calculateCaffeineDecay } from '../src/core/domain-rules';
import { ppmCaCO3ToDegreesDH } from '../src/core/water-chemistry';

type Vec = { id: string; zrodla?: string[]; znany_rozjazd?: string };
const tol = corpus.metadata.tolerancje;

function expectMatch(v: Vec, ok: boolean, detail: unknown) {
  if (v.znany_rozjazd) expect([v.id, v.znany_rozjazd, ok]).toEqual([v.id, v.znany_rozjazd, false]);
  else expect([v.id, ok, detail]).toEqual([v.id, true, detail]);
}

describe('Wyrocznia ze źródeł: ekstrakcja, twardość wody, eliminacja kofeiny (M1-audytor-generalny-044)', () => {
  test('każdy wektor ma źródło (brd:… albo rejestr:…); wektory z BRD są w korpusie', () => {
    const all: Vec[] = [...corpus.extraction_yield, ...corpus.water_hardness, ...corpus.caffeine_decay];
    for (const v of all) expect([v.id, (v.zrodla ?? []).length > 0]).toEqual([v.id, true]);
    const ids = all.map((v) => v.id);
    expect(ids).toEqual(expect.arrayContaining(['EY-BRD-RD03-1', 'EY-BRD-RD03-2', 'KOF-BRD-RD17-1', 'KOF-BRD-RD17-2', 'KOF-BRD-RD17-3']));
  });

  test('RD-03: Extraction Yield zgodny z BRD i z rachunkiem z definicji; ocena zgodna tam, gdzie źródło ją rozstrzyga', () => {
    expect(corpus.extraction_yield.length).toBeGreaterThanOrEqual(10);
    for (const v of corpus.extraction_yield) {
      const r = calculateExtractionYield(v.beverageGrams, v.tdsPercent, v.coffeeDoseGrams);
      const d = Math.abs(r.extractionYieldPercent - v.expectedExtractionYieldPercent);
      const ratingOk = v.expectedRating == null || r.rating === v.expectedRating;
      expectMatch(v, d <= tol.extractionYieldPercent && ratingOk, { ey: r.extractionYieldPercent, rating: r.rating });
    }
  });

  test('twardość: ppm CaCO3 → °dH w przedziale z definicji 1 °dH = 10 mg CaO i mas atomowych CIAAW', () => {
    expect(corpus.water_hardness.length).toBeGreaterThanOrEqual(8);
    for (const v of corpus.water_hardness) {
      const dh = ppmCaCO3ToDegreesDH(v.ppmCaCO3);
      const ok = dh >= v.expectedDegreesDHMin - tol.degreesDH && dh <= v.expectedDegreesDHMax + tol.degreesDH;
      expectMatch(v, ok, dh);
    }
  });

  test('RD-17: eliminacja kofeiny zgodna z BRD i z rachunkiem C0·e^(−ln2·t/t½)', () => {
    expect(corpus.caffeine_decay.length).toBeGreaterThanOrEqual(30);
    for (const v of corpus.caffeine_decay) {
      const mg = calculateCaffeineDecay(v.initialMg, v.elapsedHours, v.halfLifeHours);
      expectMatch(v, Math.abs(mg - v.expectedRemainingMg) <= tol.remainingMg, mg);
    }
  });
});

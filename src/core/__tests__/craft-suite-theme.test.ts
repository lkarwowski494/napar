// ============================================================================
// Apps4Craft Unified Design System — Suite Theme Tests
// ============================================================================

import { CRAFT_APPS, sharedCraftTokens, getCraftTheme } from '../craft-suite-theme';

describe('Apps4Craft Suite Theme Tokens', () => {
  test('Definiuje spójną paletę dla wszystkich 5 aplikacji kuchennych', () => {
    expect(CRAFT_APPS.napar).toBeDefined();
    expect(CRAFT_APPS.piekarz).toBeDefined();
    expect(CRAFT_APPS.sloik).toBeDefined();
    expect(CRAFT_APPS.masaz).toBeDefined();
    expect(CRAFT_APPS.ferment).toBeDefined();

    expect(CRAFT_APPS.napar.accent).toBe('#D97736');
    expect(CRAFT_APPS.piekarz.accent).toBe('#D49B42');
    expect(CRAFT_APPS.sloik.accent).toBe('#5B8A61');
    expect(CRAFT_APPS.masaz.accent).toBe('#A43E38');
    expect(CRAFT_APPS.ferment.accent).toBe('#E0A838');
  });

  test('Udostępnia wspólne tokeny ceramiczne i minimalny rozmiar celu dotykowego 44pt / 52pt', () => {
    expect(sharedCraftTokens.colors.bgBasalt).toBe('#121214');
    expect(sharedCraftTokens.touchTargetMin).toBe(48);
    expect(sharedCraftTokens.buttonHeightMin).toBe(52);
    expect(sharedCraftTokens.hitSlopStandard).toEqual({ top: 12, bottom: 12, left: 12, right: 12 });
    expect(sharedCraftTokens.borderRadius.lg).toBe(18);
    expect(sharedCraftTokens.typography.displayHero.fontSize).toBe(48);
  });

  test('Zwraca poprawny motyw aplikacji poprzez getCraftTheme', () => {
    const piekarz = getCraftTheme('piekarz');
    expect(piekarz.name).toBe('Piekarz');
    expect(piekarz.accent).toBe('#D49B42');

    // Domyślny fallback na napar przy nieznanym id
    const fallback = getCraftTheme('unknown_app');
    expect(fallback.id).toBe('napar');
  });

  test('TASK-P59-04-SZT: getCraftTheme normalizuje wielkosc liter, spacje oraz BOM uFEFF', () => {
    // 1. Wielkie litery
    const piekarzUpper = getCraftTheme('PIEKARZ' as any);
    expect(piekarzUpper.id).toBe('piekarz');
    expect(piekarzUpper.name).toBe('Piekarz');

    // 2. BOM i spacje
    const sloikBom = getCraftTheme('\uFEFFsloik' as any);
    expect(sloikBom.id).toBe('sloik');
    expect(sloikBom.name).toBe('Słoik');

    const fermentSpaced = getCraftTheme('  ferment  ' as any);
    expect(fermentSpaced.id).toBe('ferment');

    // 3. Bezpieczny fallback przy null/undefined
    expect(getCraftTheme(null as any).id).toBe('napar');
    expect(getCraftTheme(undefined as any).id).toBe('napar');
    expect(getCraftTheme('' as any).id).toBe('napar');
  });
});

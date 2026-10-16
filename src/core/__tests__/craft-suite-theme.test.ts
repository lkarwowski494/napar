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

    expect(CRAFT_APPS.napar.accent).toBe('#C86A28');
    expect(CRAFT_APPS.piekarz.accent).toBe('#D49B42');
    expect(CRAFT_APPS.sloik.accent).toBe('#5B8A61');
    expect(CRAFT_APPS.masaz.accent).toBe('#A43E38');
    expect(CRAFT_APPS.ferment.accent).toBe('#E0A838');
  });

  test('Udostępnia wspólne tokeny ceramiczne i minimalny rozmiar celu dotykowego 44pt / 52pt', () => {
    expect(sharedCraftTokens.colors.bgBasalt).toBe('#121214');
    expect(sharedCraftTokens.touchTargetMin).toBe(44);
    expect(sharedCraftTokens.buttonHeightMin).toBe(52);
    expect(sharedCraftTokens.hitSlopStandard).toEqual({ top: 12, bottom: 12, left: 12, right: 12 });
    expect(sharedCraftTokens.borderRadius.lg).toBe(18);
    expect(sharedCraftTokens.typography.displayHero.fontSize).toBe(48);
  });

  test('Zwraca poprawny motyw aplikacji poprzez getCraftTheme', () => {
    const piekarz = getCraftTheme('piekarz');
    expect(piekarz.name).toBe('Piekarz');
    expect(piekarz.accent).toBe('#D49B42');

    // Domyślny fallback na napar
    // @ts-expect-error testowanie nieznanego id
    const fallback = getCraftTheme('unknown_app');
    expect(fallback.id).toBe('napar');
  });
});

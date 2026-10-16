// ============================================================================
// Apps4Craft Unified Design System — Suite Theme Tests
// ============================================================================

import { CRAFT_APPS, sharedCraftTokens } from '../craft-suite-theme';

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

  test('Udostępnia wspólne tokeny ceramiczne i minimalny rozmiar celu dotykowego 52pt', () => {
    expect(sharedCraftTokens.colors.bgBasalt).toBe('#121214');
    expect(sharedCraftTokens.touchTargetMin).toBe(52);
    expect(sharedCraftTokens.borderRadius.lg).toBe(18);
  });
});

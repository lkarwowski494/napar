// ============================================================================
// Napar (Steepwise) — Unit Tests: Grinder Dial-in Converter
// ============================================================================

import {
  SUPPORTED_GRINDERS,
  GRIND_CATEGORIES,
  convertMicronsToGrinder,
  convertBetweenGrinders,
} from '../grinder-converter';

describe('Grinder Dial-in Converter Module', () => {
  test('Obsługuje 6 popularnych modeli młynków specialty', () => {
    const ids = SUPPORTED_GRINDERS.map((g) => g.id);
    expect(ids).toContain('comandante_c40');
    expect(ids).toContain('timemore_c2_c3');
    expect(ids).toContain('1zpresso_k_ultra');
    expect(ids).toContain('fellow_ode_gen2');
    expect(ids).toContain('baratza_encore');
    expect(ids).toContain('kingrinder_k6');
  });

  test('Prawidłowo przelicza mikrony standardu V60 (720 µm) na Comandante i Timemore', () => {
    // 720um / 30um = 24 kliki Comandante
    const c40 = convertMicronsToGrinder(720, 'comandante_c40');
    expect(c40.rawValue).toBe(24);
    expect(c40.formatted).toContain('24 klików');

    // 720um / 35um = 21 klików Timemore
    const timemore = convertMicronsToGrinder(720, 'timemore_c2_c3');
    expect(timemore.rawValue).toBe(21);
    expect(timemore.formatted).toContain('21 klików');
  });

  test('Prawidłowo przelicza nastawę między dwoma młynkami', () => {
    // 24 kliki Comandante (720um) -> Timemore C2 (21 klików)
    const res = convertBetweenGrinders('comandante_c40', 24, 'timemore_c2_c3');
    expect(res.microns).toBe(720);
    expect(res.targetFormatted).toContain('21 klików');
  });

  test('Zwraca kategorie grubości mielenia od espresso do cold brew', () => {
    expect(GRIND_CATEGORIES.length).toBe(5);
    const catIds = GRIND_CATEGORIES.map((c) => c.id);
    expect(catIds).toContain('espresso');
    expect(catIds).toContain('aeropress');
    expect(catIds).toContain('pourover_v60');
    expect(catIds).toContain('chemex_cupping');
    expect(catIds).toContain('frenchpress_coldbrew');
  });
});

// ============================================================================
// Napar (Steepwise) — Unit Tests: GrinderConverterCard
// ============================================================================

import React from 'react';
import renderer from 'react-test-renderer';
import { GrinderConverterCard } from '../GrinderConverterCard';
import { translations } from '../../../core/i18n';
import { GRIND_CATEGORIES } from '../../../core/grinder-converter';

describe('GrinderConverterCard Component', () => {
  const t = translations.pl;

  test('Renderuje chipy kategorii mielenia z atrybutami a11y i testID', () => {
    let tree: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(<GrinderConverterCard language="pl" t={t} />);
    });

    const root = tree!.root;

    for (const cat of GRIND_CATEGORIES) {
      const chip = root.findByProps({ testID: `grind-category-${cat.id}` });
      expect(chip).toBeDefined();
      expect(chip.props.accessibilityRole).toBe('button');
      expect(chip.props.hitSlop).toEqual({ top: 8, bottom: 8, left: 8, right: 8 });
      if (cat.id === 'pourover_v60') {
        expect(chip.props.accessibilityState).toEqual({ selected: true });
      } else {
        expect(chip.props.accessibilityState).toEqual({ selected: false });
      }
    }
  });

  test('Przełącza wybraną kategorię mielenia po kliknięciu', () => {
    let tree: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(<GrinderConverterCard language="pl" t={t} />);
    });

    const root = tree!.root;
    const espressoChip = root.findByProps({ testID: 'grind-category-espresso' });

    renderer.act(() => {
      espressoChip.props.onPress();
    });

    expect(espressoChip.props.accessibilityState).toEqual({ selected: true });
    const v60Chip = root.findByProps({ testID: 'grind-category-pourover_v60' });
    expect(v60Chip.props.accessibilityState).toEqual({ selected: false });
  });
});

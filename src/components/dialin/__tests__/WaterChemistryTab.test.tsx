// ============================================================================
// Napar (Steepwise) — Unit Tests: WaterChemistryTab
// ============================================================================

import React from 'react';
import renderer from 'react-test-renderer';
import { WaterChemistryTab } from '../WaterChemistryTab';
import { translations } from '../../../core/i18n';

describe('WaterChemistryTab Accessibility & Interactions (TASK-P6-01-ODK)', () => {
  const t = translations.pl;

  test('Renderuje chipy objętości z rolą button, accessibilityLabel i stanem wyboru', () => {
    let tree: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(
        <WaterChemistryTab language="pl" t={t} />
      );
    });

    const root = tree!.root;
    const chip1L = root.findByProps({ testID: 'volume-chip-1.0' });
    expect(chip1L).toBeDefined();
    expect(chip1L.props.accessibilityRole).toBe('button');
    expect(chip1L.props.accessibilityLabel).toBe('1.0 L');
    expect(chip1L.props.accessibilityState).toEqual({ selected: true });
    expect(chip1L.props.hitSlop).toEqual({ top: 8, bottom: 8, left: 8, right: 8 });

    // Kliknięcie chipa 2.0 L
    const chip2L = root.findByProps({ testID: 'volume-chip-2.0' });
    expect(chip2L).toBeDefined();
    expect(chip2L.props.accessibilityState).toEqual({ selected: false });

    renderer.act(() => {
      chip2L.props.onPress();
    });

    expect(chip2L.props.accessibilityState).toEqual({ selected: true });
  });

  test('Karty profili wody posiadają rolę button, accessibilityLabel i stan selected', () => {
    let tree: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(
        <WaterChemistryTab language="en" t={translations.en} />
      );
    });

    const root = tree!.root;
    const scaCard = root.findByProps({ testID: 'water-recipe-sca_standard' });
    expect(scaCard).toBeDefined();
    expect(scaCard.props.accessibilityRole).toBe('button');
    expect(scaCard.props.accessibilityLabel).toBe('SCA Standard Water');
    expect(scaCard.props.hitSlop).toEqual({ top: 4, bottom: 4, left: 4, right: 4 });

    renderer.act(() => {
      scaCard.props.onPress();
    });
    expect(scaCard.props.accessibilityState).toEqual({ selected: true });
  });
});

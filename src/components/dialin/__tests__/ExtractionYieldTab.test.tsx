// ============================================================================
// Napar (Steepwise) — Unit Tests: ExtractionYieldTab
// ============================================================================

import React from 'react';
import renderer from 'react-test-renderer';
import { ExtractionYieldTab } from '../ExtractionYieldTab';
import { translations } from '../../../core/i18n';

describe('ExtractionYieldTab Accessibility & Interactions (TASK-P7-01-ODK)', () => {
  const t = translations.pl;

  test('Przyciski trybu ekstrakcji posiadają rolę button, stan wyboru, hitSlop i testID', () => {
    let tree: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(
        <ExtractionYieldTab language="pl" t={t} />
      );
    });

    const root = tree!.root;
    const pouroverBtn = root.findByProps({ testID: 'ey-mode-pourover' });
    const espressoBtn = root.findByProps({ testID: 'ey-mode-espresso' });

    expect(pouroverBtn).toBeDefined();
    expect(espressoBtn).toBeDefined();

    expect(pouroverBtn.props.accessibilityRole).toBe('button');
    expect(pouroverBtn.props.accessibilityState).toEqual({ selected: true });
    expect(pouroverBtn.props.hitSlop).toEqual({ top: 8, bottom: 8, left: 8, right: 8 });

    expect(espressoBtn.props.accessibilityRole).toBe('button');
    expect(espressoBtn.props.accessibilityState).toEqual({ selected: false });
    expect(espressoBtn.props.hitSlop).toEqual({ top: 8, bottom: 8, left: 8, right: 8 });

    // Przełączenie trybu na espresso
    renderer.act(() => {
      espressoBtn.props.onPress();
    });

    expect(espressoBtn.props.accessibilityState).toEqual({ selected: true });
    expect(pouroverBtn.props.accessibilityState).toEqual({ selected: false });
  });
});

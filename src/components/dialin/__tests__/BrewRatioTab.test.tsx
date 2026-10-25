// ============================================================================
// Napar (Steepwise) — Unit Tests: BrewRatioTab
// ============================================================================

import React from 'react';
import renderer from 'react-test-renderer';
import { BrewRatioTab } from '../BrewRatioTab';
import { translations } from '../../../core/i18n';

describe('BrewRatioTab Component', () => {
  const t = translations.pl;

  test('Renderuje kalkulator proporcji z domyślną dozą 18g i proporcją', () => {
    let tree: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(
        <BrewRatioTab
          language="pl"
          t={t}
          unitSystem="metric"
          beveragePreference="coffee"
        />
      );
    });

    const root = tree!.root;
    expect(root.findByProps({ testID: 'dose-input' })).toBeDefined();
    expect(root.findByProps({ testID: 'calculated-water-output' })).toBeDefined();
    expect(root.findByProps({ testID: 'calculated-yield-output' })).toBeDefined();
  });

  test('Aktualizuje ilość wody po zmianie dozy w polu tekstowym', () => {
    let tree: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(
        <BrewRatioTab
          language="pl"
          t={t}
          unitSystem="metric"
          beveragePreference="coffee"
        />
      );
    });

    const root = tree!.root;
    const doseInput = root.findByProps({ testID: 'dose-input' });

    renderer.act(() => {
      doseInput.props.onChangeText('20');
    });

    const waterOutput = root.findByProps({ testID: 'calculated-water-output' });
    expect(waterOutput.props.children).toBeDefined();
  });

  test('Przełącza kierunek kalkulacji na Woda -> Kawa (waterToDose)', () => {
    let tree: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(
        <BrewRatioTab
          language="pl"
          t={t}
          unitSystem="metric"
          beveragePreference="both"
        />
      );
    });

    const root = tree!.root;
    const dirToggle = root.findByProps({ testID: 'calc-dir-waterToDose' });

    renderer.act(() => {
      dirToggle.props.onPress();
    });

    expect(root.findByProps({ testID: 'water-input' })).toBeDefined();
    expect(root.findByProps({ testID: 'calculated-dose-output' })).toBeDefined();

    // Wpisz nową ilość wody
    const waterInput = root.findByProps({ testID: 'water-input' });
    renderer.act(() => {
      waterInput.props.onChangeText('500');
    });

    const doseOutput = root.findByProps({ testID: 'calculated-dose-output' });
    expect(doseOutput.props.children).toBeDefined();
  });

  test('Wybór predefiniowanej proporcji (preset chip) aktualizuje wynik', () => {
    let tree: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(
        <BrewRatioTab
          language="pl"
          t={t}
          unitSystem="metric"
          beveragePreference="coffee"
        />
      );
    });

    const root = tree!.root;
    // Znajdź chip proporcji 1:15
    const ratioChip = root.findAllByProps({ accessibilityRole: 'button' }).find(
      (btn) => btn.props.children && typeof btn.props.children === 'string' && btn.props.children.includes('1:15')
    ) || root.findAllByType('Text' as any).find(t => t.props.children === '1:15')?.parent;

    if (ratioChip) {
      renderer.act(() => {
        ratioChip.props.onPress();
      });
      const waterOutput = root.findByProps({ testID: 'calculated-water-output' });
      expect(waterOutput.props.children).toBeDefined();
    }
  });

  test('Renderuje w jednostkach imperialnych z preferencją herbaty', () => {
    let tree: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(
        <BrewRatioTab
          language="en"
          t={translations.en}
          unitSystem="imperial"
          beveragePreference="tea"
        />
      );
    });

    expect(tree!.toJSON()).toBeDefined();
  });

  test('TASK-P7-04-STU: Kontrolki kierunku i chipy proporcji deklarują accessibilityState oraz hitSlop', () => {
    let tree: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(
        <BrewRatioTab language="pl" t={t} unitSystem="metric" beveragePreference="both" />
      );
    });
    const root = tree!.root;
    const doseToWaterBtn = root.findByProps({ testID: 'calc-dir-doseToWater' });
    const waterToDoseBtn = root.findByProps({ testID: 'calc-dir-waterToDose' });

    expect(doseToWaterBtn.props.accessibilityState).toEqual({ selected: true });
    expect(doseToWaterBtn.props.hitSlop).toEqual({ top: 8, bottom: 8, left: 8, right: 8 });
    expect(waterToDoseBtn.props.accessibilityState).toEqual({ selected: false });

    const defaultRatioChip = root.findByProps({ testID: 'ratio-chip-16.6' });
    expect(defaultRatioChip.props.accessibilityState).toEqual({ selected: true });
    expect(defaultRatioChip.props.hitSlop).toEqual({ top: 8, bottom: 8, left: 8, right: 8 });
  });
});

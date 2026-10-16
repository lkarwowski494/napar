// ============================================================================
// Napar (Steepwise) — BrewQuickPrepCard Component Tests
// ============================================================================

import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { BrewQuickPrepCard } from '../BrewQuickPrepCard';

describe('BrewQuickPrepCard Component', () => {
  const defaultProps = {
    doseGrams: 20,
    waterGrams: 300,
    waterTempCelsius: 92,
    grindSetting: 'Średnio-grubo',
    servings: 1,
    onServingsChange: jest.fn(),
    onDoseChange: jest.fn(),
    disabled: false,
    batchScaling: {
      grindAdjustmentClicks: 2,
      recommendationPl: 'Dla 2 porcji zwiększ mielenie o 2 kliki.',
    },
  };

  test('Renderuje dozą, wodą, temperaturą i chipsami porcji', () => {
    let tree: any;
    act(() => {
      tree = renderer.create(<BrewQuickPrepCard {...defaultProps} />);
    });

    const str = JSON.stringify(tree.toJSON());
    expect(str).toContain('20g');
    expect(str).toContain('300g');
    expect(str).toContain('92°C');
    expect(str).toContain('1 os.');
    expect(str).toContain('2 os.');
  });

  test('Steppery dozy (+ / −) wywołują onDoseChange z poprawnymi wartościami', () => {
    let tree: any;
    act(() => {
      tree = renderer.create(<BrewQuickPrepCard {...defaultProps} />);
    });

    const plusBtn = tree.root.findByProps({
      accessibilityLabel: 'Zwiększ dozę kawy',
    });
    const minusBtn = tree.root.findByProps({
      accessibilityLabel: 'Zmniejsz dozę kawy',
    });

    act(() => plusBtn.props.onPress());
    expect(defaultProps.onDoseChange).toHaveBeenCalledWith(21);

    act(() => minusBtn.props.onPress());
    expect(defaultProps.onDoseChange).toHaveBeenCalledWith(19);
  });

  test('Wybór 2 porcji wyświetla rekomendację grubszego mielenia', () => {
    let tree: any;
    act(() => {
      tree = renderer.create(
        <BrewQuickPrepCard {...defaultProps} servings={2} />
      );
    });

    const str = JSON.stringify(tree.toJSON());
    expect(str).toContain('+2 kliki grubiej');
    expect(str).toContain('Dla 2 porcji zwiększ mielenie o 2 kliki.');
  });
});

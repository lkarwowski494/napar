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

  test('Steppery wody (+ / −) i chipsy proporcji wywołują onWaterChange', () => {
    const onWaterChangeMock = jest.fn();
    let tree: any;
    act(() => {
      tree = renderer.create(
        <BrewQuickPrepCard
          {...defaultProps}
          doseGrams={20}
          waterGrams={300}
          onWaterChange={onWaterChangeMock}
        />
      );
    });

    const plusWaterBtn = tree.root.findByProps({
      accessibilityLabel: 'Zwiększ ilość wody',
    });
    const minusWaterBtn = tree.root.findByProps({
      accessibilityLabel: 'Zmniejsz ilość wody',
    });

    act(() => plusWaterBtn.props.onPress());
    expect(onWaterChangeMock).toHaveBeenCalledWith(310);

    act(() => minusWaterBtn.props.onPress());
    expect(onWaterChangeMock).toHaveBeenCalledWith(290);

    // Kliknij chip 1:16.7
    const ratioChips = tree.root.findAll((node: any) => {
      return (
        node.props &&
        typeof node.props.children === 'string' &&
        node.props.children.includes('1:16.7')
      );
    });
    expect(ratioChips.length).toBeGreaterThan(0);

    let parent = ratioChips[0].parent;
    while (parent && !parent.props.onPress) {
      parent = parent.parent;
    }
    act(() => parent.props.onPress());
    // 20g * 16.7 = 334g
    expect(onWaterChangeMock).toHaveBeenCalledWith(334);
  });

  test('Steppery bez sztywnego minimum: dozy 5 g → 4 g, woda 5 g → 0 g (poz. 14 MVP)', () => {
    const onWaterChangeMock = jest.fn();
    const onDoseChangeMock = jest.fn();
    let tree: any;
    act(() => {
      tree = renderer.create(
        <BrewQuickPrepCard
          {...defaultProps}
          doseGrams={5}
          waterGrams={5}
          onDoseChange={onDoseChangeMock}
          onWaterChange={onWaterChangeMock}
        />
      );
    });

    act(() => tree.root.findByProps({ accessibilityLabel: 'Zmniejsz dozę kawy' }).props.onPress());
    expect(onDoseChangeMock).toHaveBeenLastCalledWith(4);

    act(() => tree.root.findByProps({ accessibilityLabel: 'Zmniejsz ilość wody' }).props.onPress());
    expect(onWaterChangeMock).toHaveBeenLastCalledWith(0);
  });
});

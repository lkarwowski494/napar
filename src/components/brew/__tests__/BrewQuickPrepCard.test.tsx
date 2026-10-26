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
      recommendationEn: 'For 2 cups: grind 2 clicks coarser.',
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

  test('TASK-P3-04-ODK: Wybór 2 porcji w trybie angielskim wyświetla rekomendację po angielsku', () => {
    let tree: any;
    act(() => {
      tree = renderer.create(
        <BrewQuickPrepCard {...defaultProps} language="en" servings={2} />
      );
    });

    const str = JSON.stringify(tree.toJSON());
    expect(str).toContain('For 2 cups: grind 2 clicks coarser.');
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

  test('TASK-P20-04-STU: chipsy porcji deklarują role radio i stan zaznaczenia accessibilityState', () => {
    let tree: any;
    act(() => {
      tree = renderer.create(<BrewQuickPrepCard {...defaultProps} servings={2} />);
    });

    const chip1 = tree.root.findByProps({ testID: 'batch-chip-1' });
    const chip2 = tree.root.findByProps({ testID: 'batch-chip-2' });

    expect(chip1.props.accessibilityRole).toBe('radio');
    expect(chip1.props.accessibilityState).toEqual({ selected: false });

    expect(chip2.props.accessibilityRole).toBe('radio');
    expect(chip2.props.accessibilityState).toEqual({ selected: true });
  });

  test('TASK-P26-01-ODK: chipsy porcji deklarują accessibilityHint w języku polskim i angielskim', () => {
    let treePl: any;
    act(() => {
      treePl = renderer.create(<BrewQuickPrepCard {...defaultProps} language="pl" servings={2} />);
    });
    const chipPl = treePl.root.findByProps({ testID: 'batch-chip-2' });
    expect(chipPl.props.accessibilityHint).toBe('Skaluje przepis dla 2 porcji');

    let treeEn: any;
    act(() => {
      treeEn = renderer.create(<BrewQuickPrepCard {...defaultProps} language="en" servings={3} />);
    });
    const chipEn = treeEn.root.findByProps({ testID: 'batch-chip-3' });
    expect(chipEn.props.accessibilityHint).toBe('Scales recipe for 3 servings');
  });
});

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

  test('TASK-P27-01-ODK: steppery dozy (+ / -) deklarują accessibilityHint w języku polskim i angielskim', () => {
    let treePl: any;
    act(() => {
      treePl = renderer.create(<BrewQuickPrepCard {...defaultProps} language="pl" />);
    });
    const decPl = treePl.root.findByProps({ accessibilityLabel: 'Zmniejsz dozę kawy' });
    const incPl = treePl.root.findByProps({ accessibilityLabel: 'Zwiększ dozę kawy' });
    expect(decPl.props.accessibilityHint).toBe('Zmniejsza dozę o 1 gram');
    expect(incPl.props.accessibilityHint).toBe('Zwiększa dozę o 1 gram');

    let treeEn: any;
    act(() => {
      treeEn = renderer.create(<BrewQuickPrepCard {...defaultProps} language="en" />);
    });
    const decEn = treeEn.root.findByProps({ accessibilityLabel: 'Decrease coffee dose' });
    const incEn = treeEn.root.findByProps({ accessibilityLabel: 'Increase coffee dose' });
    expect(decEn.props.accessibilityHint).toBe('Decreases dose by 1 gram');
    expect(incEn.props.accessibilityHint).toBe('Increases dose by 1 gram');
  });

  test('TASK-P28-01-ODK: steppery wody (+ / -) deklarują accessibilityHint w języku polskim i angielskim', () => {
    let treePl: any;
    act(() => {
      treePl = renderer.create(<BrewQuickPrepCard {...defaultProps} language="pl" onWaterChange={jest.fn()} />);
    });
    const decPl = treePl.root.findByProps({ accessibilityLabel: 'Zmniejsz ilość wody' });
    const incPl = treePl.root.findByProps({ accessibilityLabel: 'Zwiększ ilość wody' });
    expect(decPl.props.accessibilityHint).toBe('Zmniejsza ilość wody o 10 gramów');
    expect(incPl.props.accessibilityHint).toBe('Zwiększa ilość wody o 10 gramów');

    let treeEn: any;
    act(() => {
      treeEn = renderer.create(<BrewQuickPrepCard {...defaultProps} language="en" onWaterChange={jest.fn()} />);
    });
    const decEn = treeEn.root.findByProps({ accessibilityLabel: 'Decrease water' });
    const incEn = treeEn.root.findByProps({ accessibilityLabel: 'Increase water' });
    expect(decEn.props.accessibilityHint).toBe('Decreases water by 10 grams');
    expect(incEn.props.accessibilityHint).toBe('Increases water by 10 grams');
  });

  test('TASK-P29-01-ODK: chipsy proporcji posiadają accessibilityRole radio, accessibilityState oraz accessibilityHint', () => {
    let tree: any;
    act(() => {
      tree = renderer.create(
        <BrewQuickPrepCard
          {...defaultProps}
          doseGrams={15}
          waterGrams={250}
          onWaterChange={jest.fn()}
          language="pl"
        />
      );
    });

    const goldenChip = tree.root.findByProps({ testID: 'ratio-chip-1-16.7' });
    expect(goldenChip.props.accessibilityRole).toBe('radio');
    expect(goldenChip.props.accessibilityState).toEqual({ selected: true });
    expect(goldenChip.props.accessibilityHint).toBe('Ustawia ilość wody dla proporcji 1:16.7');

    const strongChip = tree.root.findByProps({ testID: 'ratio-chip-1-15' });
    expect(strongChip.props.accessibilityState).toEqual({ selected: false });
  });

  test('TASK-P29-04-STU: kontenery batchChipsRow oraz ratioChipsRow posiadaja accessibilityRole radiogroup i accessibilityLabel', () => {
    let treePl: any;
    act(() => {
      treePl = renderer.create(
        <BrewQuickPrepCard
          {...defaultProps}
          onWaterChange={jest.fn()}
          language="pl"
        />
      );
    });

    const batchGroupPl = treePl.root.findByProps({ testID: 'batch-chips-group' });
    expect(batchGroupPl.props.accessibilityRole).toBe('radiogroup');
    expect(batchGroupPl.props.accessibilityLabel).toBe('Wybierz liczbę porcji');

    const ratioGroupPl = treePl.root.findByProps({ testID: 'ratio-chips-group' });
    expect(ratioGroupPl.props.accessibilityRole).toBe('radiogroup');
    expect(ratioGroupPl.props.accessibilityLabel).toBe('Wybierz proporcję kawy do wody');

    let treeEn: any;
    act(() => {
      treeEn = renderer.create(
        <BrewQuickPrepCard
          {...defaultProps}
          onWaterChange={jest.fn()}
          language="en"
        />
      );
    });

    const batchGroupEn = treeEn.root.findByProps({ testID: 'batch-chips-group' });
    expect(batchGroupEn.props.accessibilityRole).toBe('radiogroup');
    expect(batchGroupEn.props.accessibilityLabel).toBe('Select number of servings');

    const ratioGroupEn = treeEn.root.findByProps({ testID: 'ratio-chips-group' });
    expect(ratioGroupEn.props.accessibilityRole).toBe('radiogroup');
    expect(ratioGroupEn.props.accessibilityLabel).toBe('Select coffee to water ratio');
  });

  test('TASK-P34-01-ODK: currentRatioBadge posiada accessibilityRole text oraz zlokalizowany accessibilityLabel', () => {
    let treePl: any;
    act(() => {
      treePl = renderer.create(
        <BrewQuickPrepCard
          {...defaultProps}
          doseGrams={20}
          waterGrams={300}
          onWaterChange={jest.fn()}
          language="pl"
        />
      );
    });

    const badgePl = treePl.root.findByProps({ testID: 'current-ratio-badge' });
    expect(badgePl.props.accessibilityRole).toBe('text');
    expect(badgePl.props.accessibilityLabel).toBe('Bieżąca proporcja 1 do 15.0');

    let treeEn: any;
    act(() => {
      treeEn = renderer.create(
        <BrewQuickPrepCard
          {...defaultProps}
          doseGrams={15}
          waterGrams={250}
          onWaterChange={jest.fn()}
          language="en"
        />
      );
    });

    const badgeEn = treeEn.root.findByProps({ testID: 'current-ratio-badge' });
    expect(badgeEn.props.accessibilityRole).toBe('text');
    expect(badgeEn.props.accessibilityLabel).toBe('Current ratio 1 to 16.7');
  });

  test('TASK-P34-01-ODK: odporność na niepoprawne lub zerowe dozy w wyliczaniu proporcji', () => {
    let treeZero: any;
    act(() => {
      treeZero = renderer.create(
        <BrewQuickPrepCard
          {...defaultProps}
          doseGrams={0}
          waterGrams={300}
          onWaterChange={jest.fn()}
          language="pl"
        />
      );
    });

    const badgeZero = treeZero.root.findByProps({ testID: 'current-ratio-badge' });
    // 300 / 15 (fallback) = 20.0
    expect(badgeZero.props.children).toBe('1 : 20.0');
    expect(badgeZero.props.accessibilityLabel).toBe('Bieżąca proporcja 1 do 20.0');
  });
});

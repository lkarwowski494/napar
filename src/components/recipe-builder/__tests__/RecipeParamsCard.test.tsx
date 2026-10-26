import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { RecipeParamsCard } from '../RecipeParamsCard';
import { NumInput } from '../../ui';
import { translations } from '../../../core/i18n';

describe('RecipeParamsCard Component (TASK-P31-04-STU)', () => {
  const defaultProps = {
    doseGrams: '15',
    onChangeDose: jest.fn(),
    waterGrams: '250',
    onChangeWater: jest.fn(),
    waterTempCelsius: '93',
    onChangeWaterTemp: jest.fn(),
    grindSize: '22 kliki',
    onChangeGrindSize: jest.fn(),
    currentRatio: 16.7,
    unitSystem: 'metric' as const,
    t: translations.pl,
  };

  test('posiada role header dla tytulu, role summary dla proporcji i role text dla podgladu jednostek', () => {
    let tree: any;
    act(() => {
      tree = renderer.create(<RecipeParamsCard {...defaultProps} />);
    });

    const header = tree.root.findByProps({ accessibilityRole: 'header' });
    expect(header.props.children).toBe('Parametry & Proporcja');

    const ratioBadge = tree.root.findByProps({ testID: 'recipe-ratio-badge' });
    expect(ratioBadge.props.accessibilityRole).toBe('summary');
    expect(ratioBadge.props.accessibilityLabel).toContain('1 do 16.7');

    const unitBadge = tree.root.findByProps({ testID: 'recipe-unit-preview-badge' });
    expect(unitBadge.props.accessibilityRole).toBe('text');
    expect(unitBadge.props.accessibilityLabel).toContain('Podsumowanie jednostek');
  });

  test('TASK-P33-04-STU: wykorzystuje zlokalizowany calculatedRatio w badge proporcji', () => {
    let treeEn: any;
    act(() => {
      treeEn = renderer.create(<RecipeParamsCard {...defaultProps} t={translations.en} />);
    });

    const ratioBadge = treeEn.root.findByProps({ testID: 'recipe-ratio-badge' });
    expect(ratioBadge.props.accessibilityLabel).toContain('Calculated ratio: 1 do 16.7');
    expect(JSON.stringify(treeEn.toJSON())).toContain('Calculated ratio');
  });

  test('TASK-P47-04-STU: prawidlowo obsluguje przecinki dziesietne w dozie, wodzie i temperaturze', () => {
    let tree: any;
    act(() => {
      tree = renderer.create(
        <RecipeParamsCard
          {...defaultProps}
          doseGrams="15,5"
          waterGrams="250,5"
          waterTempCelsius="92,5"
        />
      );
    });

    const unitBadge = tree.root.findByProps({ testID: 'recipe-unit-preview-badge' });
    expect(unitBadge.props.accessibilityLabel).toContain('15.5g');
    expect(unitBadge.props.accessibilityLabel).toContain('250.5g');
    expect(unitBadge.props.accessibilityLabel).toContain('93°C');
  });

  test('TASK-P50-04-STU: bezpieczny fallback t?.recipeBuilder zapobiega crashom przy pustym/niekompletnym t', () => {
    let treeEmpty: any;
    expect(() => {
      act(() => {
        treeEmpty = renderer.create(<RecipeParamsCard {...defaultProps} t={{} as any} />);
      });
    }).not.toThrow();

    const root = treeEmpty!.root;
    const header = root.findByProps({ accessibilityRole: 'header' });
    expect(header.props.children).toBe('Parametry & Proporcja');

    const grindInput = root.findByProps({ placeholder: 'np. Średnio (22 kliki)' });
    expect(grindInput).toBeTruthy();
  });

  test('TASK-P51-04-STU: bezpieczne ratio z ochrona przed NaN, -0 oraz stringami z przecinkiem w RecipeParamsCard', () => {
    // 1. currentRatio jako NaN
    let treeNaN: any;
    act(() => {
      treeNaN = renderer.create(<RecipeParamsCard {...defaultProps} currentRatio={NaN} />);
    });
    const badgeNaN = treeNaN.root.findByProps({ testID: 'recipe-ratio-badge' });
    expect(badgeNaN.props.accessibilityLabel).toContain('1 do 16.7');
    expect(JSON.stringify(treeNaN.toJSON())).not.toContain('NaN');

    // 2. currentRatio jako string z przecinkiem dziesiętnym '15,5'
    let treeComma: any;
    act(() => {
      treeComma = renderer.create(<RecipeParamsCard {...defaultProps} currentRatio={'15,5' as any} />);
    });
    const badgeComma = treeComma.root.findByProps({ testID: 'recipe-ratio-badge' });
    expect(badgeComma.props.accessibilityLabel).toContain('1 do 15.5');

    // 3. currentRatio jako -0
    let treeNegZero: any;
    act(() => {
      treeNegZero = renderer.create(<RecipeParamsCard {...defaultProps} currentRatio={-0} />);
    });
    const badgeNegZero = treeNegZero.root.findByProps({ testID: 'recipe-ratio-badge' });
    expect(badgeNegZero.props.accessibilityLabel).toContain('1 do 16.7');
    expect(JSON.stringify(treeNegZero.toJSON())).not.toContain('-0');
  });

  test('TASK-P53-04-STU: onChangeNumber w NumInput chroni przed -0, ujemnymi liczbami i stringami z przecinkiem, a podglad a11y jest zlokalizowany w EN', () => {
    const onChangeDose = jest.fn();
    const onChangeWater = jest.fn();
    const onChangeWaterTemp = jest.fn();

    let tree: any;
    act(() => {
      tree = renderer.create(
        <RecipeParamsCard
          {...defaultProps}
          onChangeDose={onChangeDose}
          onChangeWater={onChangeWater}
          onChangeWaterTemp={onChangeWaterTemp}
          t={translations.en}
        />
      );
    });

    const root = tree.root;

    // NumInput dla dozy
    const numInputs = root.findAllByType(NumInput);
    expect(numInputs.length).toBe(3);

    // Symulacja podania -0 lub stringa z przecinkiem do dozy
    act(() => {
      numInputs[0].props.onChangeNumber(-0);
    });
    expect(onChangeDose).toHaveBeenCalledWith('0');

    act(() => {
      numInputs[0].props.onChangeNumber('18,5' as any);
    });
    expect(onChangeDose).toHaveBeenCalledWith('18.5');

    // Symulacja podania ujemnej wody
    act(() => {
      numInputs[1].props.onChangeNumber(-50);
    });
    expect(onChangeWater).toHaveBeenCalledWith('0');

    // Symulacja podania stringa z przecinkiem do temperatury
    act(() => {
      numInputs[2].props.onChangeNumber('94,5' as any);
    });
    expect(onChangeWaterTemp).toHaveBeenCalledWith('94.5');

    // Lokalizacja a11y podglądu jednostek w trybie EN
    const unitBadge = root.findByProps({ testID: 'recipe-unit-preview-badge' });
    expect(unitBadge.props.accessibilityLabel).toContain('Unit summary:');
    expect(unitBadge.props.accessibilityLabel).not.toContain('Podsumowanie jednostek');
  });
});

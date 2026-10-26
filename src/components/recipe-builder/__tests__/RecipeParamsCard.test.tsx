import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { RecipeParamsCard } from '../RecipeParamsCard';
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
});

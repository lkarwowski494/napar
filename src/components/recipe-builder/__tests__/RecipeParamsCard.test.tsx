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
});

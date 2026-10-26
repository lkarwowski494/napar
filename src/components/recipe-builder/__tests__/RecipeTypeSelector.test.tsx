import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { RecipeTypeSelector } from '../RecipeTypeSelector';

describe('RecipeTypeSelector Component (TASK-P31-01-ODK)', () => {
  test('deklaruje role radiogroup, role radio dla opcji, stan selected i accessibilityHint', () => {
    const onSelectType = jest.fn();

    let tree: any;
    act(() => {
      tree = renderer.create(
        <RecipeTypeSelector
          beverageType="COFFEE"
          onSelectType={onSelectType}
          coffeeLabel="Kawa"
          teaLabel="Herbata"
        />
      );
    });

    const group = tree.root.findByProps({ testID: 'recipe-type-selector' });
    expect(group.props.accessibilityRole).toBe('radiogroup');
    expect(group.props.accessibilityLabel).toContain('Wybór typu naparu');

    const coffeeRadio = tree.root.findByProps({ accessibilityLabel: 'Kawa' });
    const teaRadio = tree.root.findByProps({ accessibilityLabel: 'Herbata' });

    expect(coffeeRadio.props.accessibilityRole).toBe('radio');
    expect(coffeeRadio.props.accessibilityState).toEqual({ selected: true });
    expect(coffeeRadio.props.accessibilityHint).toContain('profil kawowy');

    expect(teaRadio.props.accessibilityRole).toBe('radio');
    expect(teaRadio.props.accessibilityState).toEqual({ selected: false });
    expect(teaRadio.props.accessibilityHint).toContain('profil herbaciany');

    // Kliknięcie w herbatę
    act(() => {
      teaRadio.props.onPress();
    });
    expect(onSelectType).toHaveBeenCalledWith('TEA');

    // Render z wybraną herbatą
    act(() => {
      tree.update(
        <RecipeTypeSelector
          beverageType="TEA"
          onSelectType={onSelectType}
          coffeeLabel="Kawa"
          teaLabel="Herbata"
        />
      );
    });

    const updatedCoffee = tree.root.findByProps({ accessibilityLabel: 'Kawa' });
    const updatedTea = tree.root.findByProps({ accessibilityLabel: 'Herbata' });

    expect(updatedCoffee.props.accessibilityState).toEqual({ selected: false });
    expect(updatedTea.props.accessibilityState).toEqual({ selected: true });
  });
});

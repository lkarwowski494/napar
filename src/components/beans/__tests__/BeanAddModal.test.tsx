// ============================================================================
// Napar (Steepwise) — Unit Tests: BeanAddModal
// ============================================================================

import React from 'react';
import renderer from 'react-test-renderer';
import { Alert } from 'react-native';
import { BeanAddModal } from '../BeanAddModal';
import * as database from '../../../core/database';

jest.mock('../../../core/database', () => ({
  saveInventoryItem: jest.fn(),
  getUnitSystem: jest.fn(() => 'metric'),
}));

describe('BeanAddModal Component', () => {
  const mockOnClose = jest.fn();
  const mockOnRequirePaywall = jest.fn();
  const mockOnOpenCompendium = jest.fn();
  const mockOnSaved = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (database.getUnitSystem as jest.Mock).mockReturnValue('metric');
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  test('Renderuje modal z kontrolkami wyboru typu i przyciskiem zapisu posiadającymi a11y i hitSlop', () => {
    let tree: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(
        <BeanAddModal
          visible={true}
          onClose={mockOnClose}
          beveragePreference="both"
          canCreate={true}
          onRequirePaywall={mockOnRequirePaywall}
          onOpenCompendium={mockOnOpenCompendium}
          onSaved={mockOnSaved}
        />
      );
    });

    const root = tree!.root;

    // Przycisk wyboru kawy
    const coffeeBtn = root.findByProps({ testID: 'bean-type-coffee-btn' });
    expect(coffeeBtn).toBeDefined();
    expect(coffeeBtn.props.accessibilityRole).toBe('button');
    expect(coffeeBtn.props.accessibilityState).toEqual({ selected: true });
    expect(coffeeBtn.props.hitSlop).toEqual({ top: 8, bottom: 8, left: 8, right: 8 });

    // Przycisk wyboru herbaty
    const teaBtn = root.findByProps({ testID: 'bean-type-tea-btn' });
    expect(teaBtn).toBeDefined();
    expect(teaBtn.props.accessibilityRole).toBe('button');
    expect(teaBtn.props.accessibilityState).toEqual({ selected: false });
    expect(teaBtn.props.hitSlop).toEqual({ top: 8, bottom: 8, left: 8, right: 8 });

    // Przycisk otwarcia bazy wiedzy
    const compendiumBtn = root.findByProps({ testID: 'open-compendium-btn' });
    expect(compendiumBtn).toBeDefined();
    expect(compendiumBtn.props.accessibilityRole).toBe('button');
    expect(compendiumBtn.props.hitSlop).toEqual({ top: 8, bottom: 8, left: 8, right: 8 });

    // Przycisk zapisu
    const saveBtn = root.findByProps({ testID: 'save-bean-btn' });
    expect(saveBtn).toBeDefined();
    expect(saveBtn.props.accessibilityRole).toBe('button');
    expect(saveBtn.props.hitSlop).toEqual({ top: 8, bottom: 8, left: 8, right: 8 });
  });

  test('Przełącza wybrany typ z kawy na herbatę po kliknięciu', () => {
    let tree: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(
        <BeanAddModal
          visible={true}
          onClose={mockOnClose}
          beveragePreference="both"
          canCreate={true}
          onRequirePaywall={mockOnRequirePaywall}
          onOpenCompendium={mockOnOpenCompendium}
          onSaved={mockOnSaved}
        />
      );
    });

    const root = tree!.root;
    const teaBtn = root.findByProps({ testID: 'bean-type-tea-btn' });

    renderer.act(() => {
      teaBtn.props.onPress();
    });

    expect(teaBtn.props.accessibilityState).toEqual({ selected: true });
    const coffeeBtn = root.findByProps({ testID: 'bean-type-coffee-btn' });
    expect(coffeeBtn.props.accessibilityState).toEqual({ selected: false });
  });

  test('TASK-P9-03-ZAK: W trybie imperialnym przelicza wagę z uncji na gramy przy dodawaniu paczki', () => {
    (database.getUnitSystem as jest.Mock).mockReturnValue('imperial');

    let tree: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(
        <BeanAddModal
          visible={true}
          onClose={mockOnClose}
          beveragePreference="coffee"
          canCreate={true}
          onRequirePaywall={mockOnRequirePaywall}
          onOpenCompendium={mockOnOpenCompendium}
          onSaved={mockOnSaved}
        />
      );
    });

    const root = tree!.root;
    const textInputs = root.findAllByType('TextInput' as any);
    // Pierwszy TextInput to nazwa (placeholder np. Etiopia...)
    renderer.act(() => {
      textInputs[0].props.onChangeText('Imperial Roast');
    });

    const saveBtn = root.findByProps({ testID: 'save-bean-btn' });
    renderer.act(() => {
      saveBtn.props.onPress();
    });

    expect(database.saveInventoryItem).toHaveBeenCalled();
    const savedItem = (database.saveInventoryItem as jest.Mock).mock.calls[0][0];
    // 8.8 oz * 28.349523125 ≈ 249.47 -> 249g
    expect(savedItem.initialWeightGrams).toBe(249);
    expect(savedItem.remainingWeightGrams).toBe(249);
    expect(mockOnSaved).toHaveBeenCalled();
  });
});

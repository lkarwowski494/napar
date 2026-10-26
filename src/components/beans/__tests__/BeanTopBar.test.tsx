// ============================================================================
// Napar (Steepwise) — Unit Tests: BeanTopBar
// ============================================================================

import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { BeanTopBar } from '../BeanTopBar';
import { InventoryItem } from '../../../core/database-schema';

describe('BeanTopBar Component', () => {
  const mockItems: InventoryItem[] = [
    {
      id: 'bean-1',
      name: 'Kenya Nyeri AA',
      type: 'coffee',
      initialWeightGrams: 250,
      remainingWeightGrams: 200,
      isFavorite: false,
      isArchived: false,
      createdAt: '2026-10-15T10:00:00Z',
      updatedAt: '2026-10-15T10:00:00Z',
    },
    {
      id: 'bean-2',
      name: 'Ethiopia Yirgacheffe',
      type: 'coffee',
      initialWeightGrams: 250,
      remainingWeightGrams: 50,
      isFavorite: true,
      isArchived: true,
      createdAt: '2026-09-01T10:00:00Z',
      updatedAt: '2026-09-10T10:00:00Z',
    },
    {
      id: 'tea-1',
      name: 'Sencha Asamushi',
      type: 'tea',
      initialWeightGrams: 100,
      remainingWeightGrams: 80,
      isFavorite: false,
      isArchived: false,
      createdAt: '2026-10-20T10:00:00Z',
      updatedAt: '2026-10-20T10:00:00Z',
    },
  ];

  const defaultProps = {
    items: mockItems,
    filter: 'all' as const,
    onFilterChange: jest.fn(),
    onOpenCompendium: jest.fn(),
    onOpenAdd: jest.fn(),
  };

  test('renderuje liczbę elementów dla każdego filtra i obsługuje kliknięcia', () => {
    let tree: any;
    act(() => {
      tree = renderer.create(<BeanTopBar {...defaultProps} />);
    });

    const str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Wszystkie (');
    expect(str).toContain('Kawa (');
    expect(str).toContain('Herbata (');
    expect(str).toContain('Archiwum (');

    // Kliknięcie filtra
    const buttons = tree.root.findAllByProps({ accessibilityRole: 'button' });
    const coffeeBtn = buttons.find((b: any) => b.props.accessibilityLabel === 'Filtr: Kawa');
    expect(coffeeBtn).toBeDefined();
    act(() => {
      coffeeBtn.props.onPress();
    });
    expect(defaultProps.onFilterChange).toHaveBeenCalledWith('coffee');

    // Kliknięcie Kompendium
    const compendiumBtn = tree.root.findByProps({ testID: 'compendium-open-button' });
    act(() => {
      compendiumBtn.props.onPress();
    });
    expect(defaultProps.onOpenCompendium).toHaveBeenCalled();

    // Kliknięcie Dodaj
    const addBtn = tree.root.findByProps({ testID: 'beans-add-button' });
    act(() => {
      addBtn.props.onPress();
    });
    expect(defaultProps.onOpenAdd).toHaveBeenCalled();
  });

  test('TASK-P36-04-STU: BeanTopBar definiuje accessibilityState dla filtrów i jest odporny na pusty/nullish items', () => {
    let tree: any;
    act(() => {
      tree = renderer.create(<BeanTopBar {...defaultProps} filter="tea" items={null as any} />);
    });

    const buttons = tree.root.findAllByProps({ accessibilityRole: 'button' });
    const allBtn = buttons.find((b: any) => b.props.accessibilityLabel === 'Filtr: Wszystkie pozycje');
    const teaBtn = buttons.find((b: any) => b.props.accessibilityLabel === 'Filtr: Herbata');

    expect(allBtn?.props.accessibilityState).toEqual({ selected: false });
    expect(teaBtn?.props.accessibilityState).toEqual({ selected: true });

    // Nie rzuca błędu przy items={null}
    const str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Wszystkie (');
    expect(str).toContain('Herbata (');

    const addBtn = tree.root.findByProps({ testID: 'beans-add-button' });
    expect(addBtn.props.accessibilityLabel).toContain('Dodaj nową kawę');
  });
});

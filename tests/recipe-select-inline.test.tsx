// ============================================================================
// Napar (Steepwise) — Integration Test: TASK-R07-01 & P16 Inline De-Modalization
// Verifies inline foldable card pattern (no <Modal> component mounted for selection)
// ============================================================================

import React from 'react';
import { Modal } from 'react-native';
import renderer, { act } from 'react-test-renderer';
import BrewScreen from '../app/(tabs)/index';
import { BrewProvider } from '../src/core/brew-context';
import { RecipeSelectModal } from '../src/components/brew/RecipeSelectModal';
import { InventorySelectModal } from '../src/components/brew/InventorySelectModal';
import { MASTER_RECIPES } from '../src/core/recipes-data';

describe('TASK-R07-01: Lean BPR P16 Inline Selection (De-Modalization)', () => {
  test('RecipeSelectModal w trybie inline renderuje się bezpośrednio bez komponentu <Modal>', () => {
    const onSelect = jest.fn();
    const onClose = jest.fn();

    let tree: any;
    act(() => {
      tree = renderer.create(
        <RecipeSelectModal
          inline={true}
          visible={true}
          onClose={onClose}
          recipes={MASTER_RECIPES}
          activeRecipeId="v60-kasuya-4-6"
          beveragePreference="both"
          categoryFilter="ALL"
          onCategoryFilterChange={() => {}}
          onSelectRecipe={onSelect}
          onToggleFavorite={() => {}}
          onDuplicateRecipe={() => {}}
          onEditRecipe={() => {}}
          onAddCustomRecipe={() => {}}
          onOpenGongfu={() => {}}
          onOpenImport={() => {}}
          onOpenQrScanner={() => {}}
          unitSystem="metric"
          t={{
            brew: { chooseRecipe: 'Wybierz recepturę' },
            common: { close: 'Zamknij' },
          }}
        />
      );
    });

    // Zero instancji <Modal> w drzewie komponentów
    const modals = tree.root.findAllByType(Modal);
    expect(modals.length).toBe(0);

    // Karta inline jest obecna w DOM testowym
    const inlinePanel = tree.root.findByProps({ testID: 'recipe-select-inline-panel' });
    expect(inlinePanel).toBeDefined();

    // Wybór receptury działa poprawnie inline
    const firstOption = inlinePanel.findByProps({ testID: 'recipe-option-v60-kasuya-4-6' });
    act(() => {
      firstOption.props.onPress();
    });
    expect(onSelect).toHaveBeenCalled();
  });

  test('InventorySelectModal w trybie inline renderuje się bezpośrednio bez komponentu <Modal>', () => {
    const onSelect = jest.fn();
    const onClose = jest.fn();

    let tree: any;
    act(() => {
      tree = renderer.create(
        <InventorySelectModal
          inline={true}
          visible={true}
          onClose={onClose}
          inventory={[
            {
              id: 'bean-inline-1',
              name: 'Guji Highland Washed',
              type: 'coffee',
              initialWeightGrams: 250,
              remainingWeightGrams: 180,
              flavorNotes: ['brzoskwinia'],
              isFavorite: true,
              isArchived: false,
              createdAt: '2026-10-10',
              updatedAt: '2026-10-10',
            },
          ]}
          selectedItem={null}
          onSelectItem={onSelect}
        />
      );
    });

    // Zero instancji <Modal>
    const modals = tree.root.findAllByType(Modal);
    expect(modals.length).toBe(0);

    const inlinePanel = tree.root.findByProps({ testID: 'inventory-select-inline-panel' });
    expect(inlinePanel).toBeDefined();

    const option = tree.root.findByProps({ testID: 'inventory-option-bean-inline-1' });
    act(() => {
      option.props.onPress();
    });
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'bean-inline-1' }));
  });

  test('Ekran BrewScreen zachowuje stałą widoczność stopera podczas otwarcia wyboru receptury (zero modal takeover)', () => {
    let tree: any;
    act(() => {
      tree = renderer.create(
        <BrewProvider>
          <BrewScreen />
        </BrewProvider>
      );
    });

    // Przed otwarciem: stoper jest widoczny
    expect(tree.root.findByProps({ testID: 'active-focus-timer' })).toBeDefined();

    // Otwórz selektor receptury (inline)
    const recipeCard = tree.root.findByProps({ testID: 'change-recipe-btn' });
    act(() => {
      recipeCard.props.onPress();
    });

    // Po otwarciu selektora receptury: panel inline jest wyrenderowany
    expect(tree.root.findByProps({ testID: 'recipe-select-inline-panel' })).toBeDefined();

    // Kluczowa cecha P16: Stoper NIE zniknął z ekranu, nadal jest w drzewie i dostępny pod palcem
    expect(tree.root.findByProps({ testID: 'active-focus-timer' })).toBeDefined();
  });

  test('TASK-P19-01-ODK: RecipeSelectModal subset filter chips posiadają accessibilityRole="tab" i poprawne accessibilityState', () => {
    let tree: any;
    act(() => {
      tree = renderer.create(
        <RecipeSelectModal
          inline={true}
          visible={true}
          onClose={() => {}}
          recipes={MASTER_RECIPES}
          activeRecipeId="v60-kasuya-4-6"
          beveragePreference="both"
          categoryFilter="ALL"
          onCategoryFilterChange={() => {}}
          onSelectRecipe={() => {}}
          onToggleFavorite={() => {}}
          onDuplicateRecipe={() => {}}
          onEditRecipe={() => {}}
          onAddCustomRecipe={() => {}}
          onOpenGongfu={() => {}}
          onOpenImport={() => {}}
          onOpenQrScanner={() => {}}
          unitSystem="metric"
          t={{
            brew: { chooseRecipe: 'Wybierz recepturę' },
            common: { close: 'Zamknij' },
          }}
        />
      );
    });

    const allTab = tree.root.findByProps({ testID: 'subset-filter-all' });
    const favTab = tree.root.findByProps({ testID: 'subset-filter-favorites' });
    const customTab = tree.root.findByProps({ testID: 'subset-filter-custom' });

    expect(allTab.props.accessibilityRole).toBe('tab');
    expect(allTab.props.accessibilityState).toEqual({ selected: true });
    expect(favTab.props.accessibilityRole).toBe('tab');
    expect(favTab.props.accessibilityState).toEqual({ selected: false });
    expect(customTab.props.accessibilityRole).toBe('tab');
    expect(customTab.props.accessibilityState).toEqual({ selected: false });
  });
});

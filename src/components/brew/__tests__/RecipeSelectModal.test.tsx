// ============================================================================
// Apps4Brew Studio — Unit Tests: RecipeSelectModal
// TASK-P13-01-ODK
// ============================================================================

import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { RecipeSelectModal, RecipeSelectModalProps } from '../RecipeSelectModal';
import { MASTER_RECIPES } from '../../../core/recipes-data';
import { translations } from '../../../core/i18n';

describe('RecipeSelectModal Component', () => {
  const t = translations.pl;

  const defaultProps: RecipeSelectModalProps = {
    visible: true,
    onClose: jest.fn(),
    recipes: MASTER_RECIPES,
    activeRecipeId: MASTER_RECIPES[0].id,
    beveragePreference: 'both',
    categoryFilter: 'ALL',
    onCategoryFilterChange: jest.fn(),
    onSelectRecipe: jest.fn(),
    onToggleFavorite: jest.fn(),
    onDuplicateRecipe: jest.fn(),
    onEditRecipe: jest.fn(),
    onAddCustomRecipe: jest.fn(),
    onOpenGongfu: jest.fn(),
    onOpenImport: jest.fn(),
    onOpenQrScanner: jest.fn(),
    unitSystem: 'metric',
    t,
    inline: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('TASK-P13-01-ODK: zwraca null i nie renderuje gdy visible=false i inline=false', () => {
    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<RecipeSelectModal {...defaultProps} visible={false} inline={false} />);
    });
    expect(tree!.toJSON()).toBeNull();
  });

  test('renderuje listę receptur gdy visible=true', () => {
    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<RecipeSelectModal {...defaultProps} visible={true} />);
    });

    const root = tree!.root;
    const firstOption = root.findByProps({ testID: `recipe-option-${MASTER_RECIPES[0].id}` });
    expect(firstOption).toBeDefined();
    expect(firstOption.props.accessibilityRole).toBe('button');
  });

  test('wybór receptury wywołuje onSelectRecipe', () => {
    const onSelectRecipe = jest.fn();
    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <RecipeSelectModal {...defaultProps} onSelectRecipe={onSelectRecipe} />
      );
    });

    const root = tree!.root;
    const firstOption = root.findByProps({ testID: `recipe-option-${MASTER_RECIPES[0].id}` });
    act(() => {
      firstOption.props.onPress();
    });

    expect(onSelectRecipe).toHaveBeenCalledWith(MASTER_RECIPES[0]);
  });

  test('zamknięcie modala wywołuje onClose', () => {
    const onClose = jest.fn();
    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<RecipeSelectModal {...defaultProps} onClose={onClose} />);
    });

    const root = tree!.root;
    const closeBtn = root.findByProps({ testID: 'close-recipe-modal-btn' });
    act(() => {
      closeBtn.props.onPress();
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('TASK-P43-04-STU: testID przycisku duplikacji oraz poprawne filtrowanie ulubionych (FAVORITES) bez nie-ulubionych receptur wbudowanych', () => {
    const onDuplicateRecipe = jest.fn();
    const testRecipes: any[] = [
      { id: 'master-not-fav', name: 'Master Non Fav', beverageType: 'COFFEE', method: 'V60', isFavorite: false, isCustom: false },
      { id: 'master-fav', name: 'Master Fav', beverageType: 'COFFEE', method: 'V60', isFavorite: true, isCustom: false },
      { id: 'custom-not-fav', name: 'Custom Non Fav', beverageType: 'COFFEE', method: 'V60', isFavorite: false, isCustom: true },
      { id: 'custom-fav', name: 'Custom Fav', beverageType: 'COFFEE', method: 'V60', isFavorite: true, isCustom: true },
    ];

    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <RecipeSelectModal
          {...defaultProps}
          recipes={testRecipes}
          onDuplicateRecipe={onDuplicateRecipe}
        />
      );
    });

    const root = tree!.root;
    // Sprawdzenie testID przycisku duplikacji
    const dupBtn = root.findByProps({ testID: 'duplicate-recipe-master-fav' });
    expect(dupBtn).toBeDefined();
    act(() => {
      dupBtn.props.onPress();
    });
    expect(onDuplicateRecipe).toHaveBeenCalledWith(testRecipes[1]);

    // Przełączenie filtrowania na FAVORITES
    const favFilterTab = root.findByProps({ testID: 'subset-filter-favorites' });
    act(() => {
      favFilterTab.props.onPress();
    });

    // Powinny być obecne tylko ulubione (master-fav i custom-fav), a ukryte master-not-fav oraz custom-not-fav
    expect(() => root.findByProps({ testID: 'recipe-option-master-not-fav' })).toThrow();
    expect(() => root.findByProps({ testID: 'recipe-option-custom-not-fav' })).toThrow();
    expect(root.findByProps({ testID: 'recipe-option-master-fav' })).toBeDefined();
    expect(root.findByProps({ testID: 'recipe-option-custom-fav' })).toBeDefined();
  });

  test('TASK-P44-04-STU: bezpieczny fallback t?.brew i t?.common zapobiega crashom przy niekompletnym obiekcie t', () => {
    const incompleteT: any = {
      brew: {},
      common: {},
    };

    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <RecipeSelectModal
          {...defaultProps}
          t={incompleteT}
        />
      );
    });

    const root = tree!.root;
    const title = root.findByProps({ testID: 'recipe-modal-title' });
    expect(title.props.children).toBe('Wybierz recepturę');

    const addBtn = root.findByProps({ testID: 'add-custom-recipe-btn' });
    expect(addBtn).toBeDefined();
    const importBtn = root.findByProps({ testID: 'import-recipe-btn' });
    expect(importBtn).toBeDefined();
    const closeBtn = root.findByProps({ testID: 'close-recipe-modal-btn' });
    expect(closeBtn.props.accessibilityLabel).toBe('Zamknij');
  });

  test('TASK-P47-01-ODK: wyszukiwarka normalizuje polskie diakrytyki i przeszukuje opis receptury', () => {
    const specialRecipes = [
      {
        id: 'rec-pl',
        name: 'Przelewowa Łagodna',
        method: 'V60',
        author: 'Barista',
        description: 'Soczysta brzoskwinia i jaśmin',
        type: 'COFFEE',
        doseGrams: 15,
        waterGrams: 250,
        waterTempCelsius: 93,
        isCustom: true,
        isFavorite: false,
      },
      {
        id: 'rec-en',
        name: 'Aeropress Light',
        method: 'Aeropress',
        author: 'World Champ',
        description: 'Floral notes with citrus',
        type: 'COFFEE',
        doseGrams: 14,
        waterGrams: 200,
        waterTempCelsius: 85,
        isCustom: false,
        isFavorite: false,
      },
    ];

    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <RecipeSelectModal
          {...defaultProps}
          recipes={specialRecipes}
        />
      );
    });

    const root = tree!.root;
    const searchInput = root.findByProps({ testID: 'recipe-search-input' });

    // Wyszukanie bez polskich znaków: "lagodna" powinno znaleźć "Łagodna"
    act(() => {
      searchInput.props.onChangeText('lagodna');
    });

    expect(root.findByProps({ testID: 'recipe-option-rec-pl' })).toBeDefined();
    expect(() => root.findByProps({ testID: 'recipe-option-rec-en' })).toThrow();

    // Wyszukanie po opisie: "brzoskwinia"
    act(() => {
      searchInput.props.onChangeText('brzoskwinia');
    });

    expect(root.findByProps({ testID: 'recipe-option-rec-pl' })).toBeDefined();
    expect(() => root.findByProps({ testID: 'recipe-option-rec-en' })).toThrow();
  });
});

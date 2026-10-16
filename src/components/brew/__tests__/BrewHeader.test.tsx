// ============================================================================
// Napar (Steepwise) — BrewHeader Component Tests
// ============================================================================

import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { BrewHeader } from '../BrewHeader';

describe('BrewHeader Component', () => {
  const defaultProps = {
    recipe: {
      id: 'rec-1',
      name: 'V60 — Metoda 4:6',
      method: 'V60',
      beverageType: 'COFFEE',
    },
    selectedInventoryItem: {
      id: 'inv-1',
      name: 'Etiopia Yirgacheffe',
      type: 'coffee',
      roasterOrProducer: 'Kawa',
      initialWeightGrams: 250,
      remainingWeightGrams: 180,
      isFavorite: true,
      isArchived: false,
      flavorNotes: ['cytryna'],
      createdAt: '2026-10-10',
      updatedAt: '2026-10-10',
    } as any,
    waterTempCelsius: 93,
    grinderRecommendation: {
      grinderName: 'Comandante C40',
      formatted: '22 kliki',
      microns: 650,
    },
    favoriteRecipes: [
      { id: 'fav-1', name: 'AeroPress Champion', method: 'AeroPress', doseGrams: 14 },
    ],
    isRunning: false,
    onSelectRecipe: jest.fn(),
    onOpenRecipeModal: jest.fn(),
    onOpenInventoryModal: jest.fn(),
    onOpenGrinderModal: jest.fn(),
    onOpenShareModal: jest.fn(),
    onNavigateToGongfu: jest.fn(),
  };

  test('Renderuje młynek z klikami, recepturę, spiżarnię i ulubione', () => {
    let tree: any;
    act(() => {
      tree = renderer.create(<BrewHeader {...defaultProps} />);
    });

    const str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Comandante');
    expect(str).toContain('22 kliki');
    expect(str).toContain('V60 — Metoda 4:6');
    expect(str).toContain('Etiopia Yirgacheffe');
    expect(str).toContain('180g w paczce');
    expect(str).toContain('AeroPress Champion');
  });

  test('Kliknięcie w młynek, recepturę, spiżarnię i udostępnij wywołuje odpowiednie callbacki', () => {
    let tree: any;
    act(() => {
      tree = renderer.create(<BrewHeader {...defaultProps} />);
    });

    // Młynek
    const grinderPill = tree.root.findByProps({ testID: 'grinder-pill-btn' });
    act(() => grinderPill.props.onPress());
    expect(defaultProps.onOpenGrinderModal).toHaveBeenCalled();

    // Receptura
    const recipeCard = tree.root.findByProps({
      accessibilityLabel: 'Wybrany przepis: V60 — Metoda 4:6',
    });
    act(() => recipeCard.props.onPress());
    expect(defaultProps.onOpenRecipeModal).toHaveBeenCalled();

    // Spiżarnia
    const stashCard = tree.root.findByProps({
      accessibilityLabel: 'Wybierz ziarna ze spiżarni',
    });
    act(() => stashCard.props.onPress());
    expect(defaultProps.onOpenInventoryModal).toHaveBeenCalled();

    // Udostępnij
    const shareBtn = tree.root.findByProps({ testID: 'share-recipe-btn' });
    act(() => shareBtn.props.onPress());
    expect(defaultProps.onOpenShareModal).toHaveBeenCalled();
  });

  test('Wyświetla baner Gongfu Cha gdy parzona jest herbata', () => {
    let tree: any;
    act(() => {
      tree = renderer.create(
        <BrewHeader
          {...defaultProps}
          recipe={{
            id: 'tea-1',
            name: 'Oolong Da Hong Pao',
            method: 'Gongfu',
            beverageType: 'TEA',
          }}
        />
      );
    });

    const str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Gongfu Cha Tracker');

    const gongfuBanner = tree.root.findAll((n: any) =>
      typeof n.props?.children === 'string' &&
      n.props.children.includes('Gongfu Cha Tracker')
    )[0];
    let parent = gongfuBanner.parent;
    while (parent && !parent.props.onPress) parent = parent.parent;

    act(() => parent.props.onPress());
    expect(defaultProps.onNavigateToGongfu).toHaveBeenCalled();
  });

  test('Przełącznik Kawa vs Herbata wywołuje onBeverageTypeChange', () => {
    const onBeverageTypeChangeMock = jest.fn();
    let tree: any;
    act(() => {
      tree = renderer.create(
        <BrewHeader
          {...defaultProps}
          onBeverageTypeChange={onBeverageTypeChangeMock}
          beverageType="COFFEE"
        />
      );
    });

    const str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Kawa Specialty');
    expect(str).toContain('Herbata Rzemieślnicza');

    const teaBtn = tree.root.findByProps({ testID: 'beverage-toggle-tea' });
    const coffeeBtn = tree.root.findByProps({ testID: 'beverage-toggle-coffee' });

    act(() => teaBtn.props.onPress());
    expect(onBeverageTypeChangeMock).toHaveBeenCalledWith('TEA');

    act(() => coffeeBtn.props.onPress());
    expect(onBeverageTypeChangeMock).toHaveBeenCalledWith('COFFEE');
  });
});

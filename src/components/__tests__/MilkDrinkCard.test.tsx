// ============================================================================
// Napar (Steepwise) — MilkDrinkCard (poz. 32 MVP): skalowanie filiżanki,
// jednostki metryczne i imperialne, zakres temperatury z zastrzeżeniem.
// ============================================================================

import React from 'react';
import { Text } from 'react-native';
import renderer, { act, ReactTestInstance } from 'react-test-renderer';
import { MilkDrinkCard, formatMilkVolume } from '../milk/MilkDrinkCard';
import { MILK_DRINKS, getMilkDrink } from '../../core/milk-drinks';

function textOf(node: unknown): string {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join('');
  return textOf((node as { props?: { children?: unknown } }).props?.children);
}

function allText(instance: ReactTestInstance): string {
  return instance
    .findAll((n) => n.type === Text)
    .map((n) => textOf(n.props.children))
    .join('|');
}

describe('MilkDrinkCard (poz. 32 MVP)', () => {
  test('formatMilkVolume: mililitry w metryce, fl oz w imperialu', () => {
    expect(formatMilkVolume(180, 'metric')).toBe('180 ml');
    expect(formatMilkVolume(180, 'imperial')).toMatch(/^[\d.]+ fl oz$/);
  });

  test('każdy napój renderuje nazwę, składniki, kroki i wskazówkę', () => {
    for (const drink of MILK_DRINKS) {
      let tree: renderer.ReactTestRenderer | undefined;
      act(() => {
        tree = renderer.create(<MilkDrinkCard drink={drink} unitSystem="metric" />);
      });
      const text = allText(tree!.root);
      expect(text).toContain(drink.id === 'flatWhite' ? 'Flat white' : drink.id.charAt(0).toUpperCase() + drink.id.slice(1));
      expect(text).toContain('Kroki');
      expect(text).toContain('Wskazówka o piance');
      act(() => tree!.unmount());
    }
  });

  test('napój z mlekiem pokazuje zakres 60–68 °C z zastrzeżeniem, espresso mówi o braku mleka', () => {
    let tree: renderer.ReactTestRenderer | undefined;
    act(() => {
      tree = renderer.create(<MilkDrinkCard drink={getMilkDrink('latte')} unitSystem="metric" />);
    });
    expect(allText(tree!.root)).toContain('60°C – 68°C');
    expect(allText(tree!.root)).toContain('Zakres do sprawdzenia źródłem pierwotnym (NM-06)');
    act(() => tree!.unmount());

    act(() => {
      tree = renderer.create(<MilkDrinkCard drink={getMilkDrink('espresso')} unitSystem="metric" />);
    });
    expect(allText(tree!.root)).toContain('Bez mleka');
    expect(allText(tree!.root)).toContain('Objętość stała dla tego napoju.');
    act(() => tree!.unmount());
  });

  test('zmiana objętości filiżanki przelicza składniki i blokuje przyciski na granicach', () => {
    let tree: renderer.ReactTestRenderer | undefined;
    act(() => {
      tree = renderer.create(<MilkDrinkCard drink={getMilkDrink('cappuccino')} unitSystem="metric" />);
    });
    const root = tree!.root;
    const ingredient = () => root.findByProps({ testID: 'milk-ingredient-cappuccino-milk' }).props.children;
    expect(ingredient()).toEqual(['Mleko', ': ', '60 ml']);

    const smaller = root.findByProps({ testID: 'milk-cup-smaller-cappuccino' });
    const larger = root.findByProps({ testID: 'milk-cup-larger-cappuccino' });
    act(() => smaller.props.onPress());
    expect(ingredient()).toEqual(['Mleko', ': ', '50 ml']);
    act(() => larger.props.onPress());
    act(() => larger.props.onPress());
    expect(ingredient()).toEqual(['Mleko', ': ', '70 ml']);

    for (let i = 0; i < 20; i++) {
      act(() => root.findByProps({ testID: 'milk-cup-smaller-cappuccino' }).props.onPress());
    }
    expect(root.findByProps({ testID: 'milk-cup-smaller-cappuccino' }).props.disabled).toBe(true);

    for (let i = 0; i < 20; i++) {
      act(() => root.findByProps({ testID: 'milk-cup-larger-cappuccino' }).props.onPress());
    }
    expect(root.findByProps({ testID: 'milk-cup-larger-cappuccino' }).props.disabled).toBe(true);
    act(() => tree!.unmount());
  });

  test('w imperialu objętości składników są w fl oz', () => {
    let tree: renderer.ReactTestRenderer | undefined;
    act(() => {
      tree = renderer.create(<MilkDrinkCard drink={getMilkDrink('latte')} unitSystem="imperial" />);
    });
    const milk = tree!.root.findByProps({ testID: 'milk-ingredient-latte-milk' }).props.children;
    expect(milk[2]).toMatch(/fl oz$/);
    act(() => tree!.unmount());
  });
});

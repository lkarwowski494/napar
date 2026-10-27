// ============================================================================
// Napar (Steepwise) — Unit Tests: SCA Flavor Wheel & Picker
// ============================================================================

import React from 'react';
import renderer from 'react-test-renderer';
import { FlavorWheelPicker } from '../flavor-wheel-picker';
import {
  SCA_FLAVOR_WHEEL,
  findCategoryById,
  getAllDescriptors,
  findDescriptorCategory,
  searchDescriptors,
} from '../flavor-wheel-data';

describe('SCA Flavor Wheel Data & Picker Component', () => {
  test('Taksonomia SCA zawiera 6 głównych kategorii', () => {
    expect(SCA_FLAVOR_WHEEL.length).toBe(6);
    const ids = SCA_FLAVOR_WHEEL.map((c) => c.id);
    expect(ids).toContain('fruity');
    expect(ids).toContain('sweet');
    expect(ids).toContain('floral');
    expect(ids).toContain('nutty');
    expect(ids).toContain('spices');
    expect(ids).toContain('tea_green');
  });

  test('Kategoria owoce zawiera podkategorie cytrusowe i jagodowe z deskryptorami', () => {
    const fruity = SCA_FLAVOR_WHEEL.find((c) => c.id === 'fruity');
    expect(fruity).toBeDefined();

    const subNames = fruity?.subcategories.map((s) => s.namePl);
    expect(subNames).toContain('Cytrusowe');
    expect(subNames).toContain('Jagodowe');
    expect(subNames).toContain('Pestkowe');

    const citrus = fruity?.subcategories.find((s) => s.namePl === 'Cytrusowe');
    expect(citrus?.descriptors).toContain('Bergamotka');
    expect(citrus?.descriptors).toContain('Cytryna');
  });

  test('Renderuje FlavorWheelPicker z wybranymi nutami', () => {
    const onToggle = jest.fn();
    let tree: any;

    renderer.act(() => {
      tree = renderer.create(
        <FlavorWheelPicker
          selectedDescriptors={['Jaśmin', 'Bergamotka']}
          onToggleDescriptor={onToggle}
        />
      );
    });

    const json = tree.toJSON();
    expect(json).toBeTruthy();

    const str = JSON.stringify(json);
    expect(str).toContain('Wybrane nuty (2)');
    expect(str).toContain('Jaśmin');
    expect(str).toContain('Bergamotka');
  });

  test('Kliknięcie aktywnego chipa na górnym pasku wywołuje onToggleDescriptor', () => {
    const onToggle = jest.fn();
    let tree: any;

    renderer.act(() => {
      tree = renderer.create(
        <FlavorWheelPicker
          selectedDescriptors={['Jaśmin', 'Bergamotka']}
          onToggleDescriptor={onToggle}
        />
      );
    });

    const activeChip = findPressableWithText(tree.root, 'Jaśmin');
    expect(activeChip).toBeTruthy();

    renderer.act(() => {
      activeChip.props.onPress();
    });

    expect(onToggle).toHaveBeenCalledWith('Jaśmin');
  });

  test('Przełączanie kategorii koła smaków i kliknięcie nowego deskryptora', () => {
    const onToggle = jest.fn();
    let tree: any;

    renderer.act(() => {
      tree = renderer.create(
        <FlavorWheelPicker
          selectedDescriptors={[]}
          onToggleDescriptor={onToggle}
        />
      );
    });

    // 1. Przełącz na kategorię Kwiatowe 🌸
    const floralCatBtn = findPressableWithText(tree.root, 'Kwiatowe');
    expect(floralCatBtn).toBeTruthy();

    renderer.act(() => {
      floralCatBtn.props.onPress();
    });

    // 2. Kliknij deskryptor Jaśmin w kategorii Kwiatowe
    const jasmineChip = findPressableWithText(tree.root, 'Jaśmin');
    expect(jasmineChip).toBeTruthy();

    renderer.act(() => {
      jasmineChip.props.onPress();
    });

    expect(onToggle).toHaveBeenCalledWith('Jaśmin');
  });

  test('Renderuje FlavorWheelPicker w jezyku angielskim', () => {
    let tree: any;
    renderer.act(() => {
      tree = renderer.create(
        <FlavorWheelPicker
          selectedDescriptors={['Bergamotka']}
          onToggleDescriptor={jest.fn()}
          language='en'
        />
      );
    });
    const str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Selected notes (1):');
    expect(str).toContain('Fruity');
    expect(str).toContain('Citrus');
  });

  test('TASK-P15-04-STU: FlavorWheelPicker deklaruje poprawne role i stany accessibility (a11y)', () => {
    let tree: any;
    renderer.act(() => {
      tree = renderer.create(
        <FlavorWheelPicker
          selectedDescriptors={['Bergamotka']}
          onToggleDescriptor={jest.fn()}
          language='pl'
        />
      );
    });

    const activeChip = findPressableWithText(tree.root, 'Bergamotka');
    expect(activeChip.props.accessibilityRole).toBe('button');
    expect(activeChip.props.accessibilityLabel).toBe('Usuń Bergamotka');

    const fruityTab = findPressableWithText(tree.root, 'Owoce');
    expect(fruityTab.props.accessibilityRole).toBe('tab');
    expect(fruityTab.props.accessibilityState).toEqual({ selected: true });

    const citrusChip = findPressableWithText(tree.root, 'Cytryna');
    expect(citrusChip.props.accessibilityRole).toBe('checkbox');
    expect(citrusChip.props.accessibilityState).toEqual({ checked: false });
  });

  test('TASK-P60-07-JAK: findCategoryById wyszukuje kategorię z odpornością na wielkość liter i BOM', () => {
    expect(findCategoryById('fruity')?.id).toBe('fruity');
    expect(findCategoryById('\uFEFFFRUITY ')?.id).toBe('fruity');
    expect(findCategoryById('non-existent')).toBeUndefined();
    expect(findCategoryById(null as any)).toBeUndefined();
  });

  test('TASK-P60-07-JAK: getAllDescriptors zwraca płaską listę wszystkich unikalnych deskryptorów', () => {
    const descriptors = getAllDescriptors();
    expect(Array.isArray(descriptors)).toBe(true);
    expect(descriptors.length).toBeGreaterThan(20);
    expect(descriptors).toContain('Bergamotka');
    expect(descriptors).toContain('Ciemna czekolada');
    expect(descriptors).toContain('Jaśmin');
  });

  test('TASK-P60-07-JAK: findDescriptorCategory odnajduje kategorię i podkategorię dla zadanego deskryptora', () => {
    const result = findDescriptorCategory('Bergamotka');
    expect(result).toBeDefined();
    expect(result?.category.id).toBe('fruity');
    expect(result?.subcategory.namePl).toBe('Cytrusowe');

    const teaResult = findDescriptorCategory('\uFEFF Earl Grey ');
    expect(teaResult).toBeDefined();
    expect(teaResult?.category.id).toBe('tea_green');

    expect(findDescriptorCategory('Nieznany')).toBeUndefined();
    expect(findDescriptorCategory('')).toBeUndefined();
  });

  test('TASK-P60-07-JAK: searchDescriptors filtruje deskryptory po fragmencie tekstu', () => {
    const matches = searchDescriptors('czekolada');
    expect(matches.length).toBe(2);
    expect(matches[0].descriptor).toContain('czekolada');
    expect(matches[0].color).toBe('#D97736');

    const empty = searchDescriptors('');
    expect(empty).toEqual([]);
  });
});

function findPressableWithText(root: any, text: string) {
  const match = root.findAll((node: any) => {
    if (!node.props) return false;
    if (typeof node.props.children === 'string' && node.props.children.includes(text)) return true;
    if (Array.isArray(node.props.children)) {
      const full = node.props.children
        .map((c: any) => (typeof c === 'string' || typeof c === 'number' ? String(c) : ''))
        .join('');
      if (full.includes(text)) return true;
    }
    return false;
  })[0];
  if (!match) return null;
  let curr = match;
  while (curr && !curr.props?.onPress) {
    curr = curr.parent;
  }
  return curr;
}

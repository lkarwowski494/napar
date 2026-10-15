// ============================================================================
// Napar (Steepwise) — Unit Tests: SCA Flavor Wheel & Picker
// ============================================================================

import React from 'react';
import renderer from 'react-test-renderer';
import { FlavorWheelPicker } from '../flavor-wheel-picker';
import { SCA_FLAVOR_WHEEL } from '../flavor-wheel-data';

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

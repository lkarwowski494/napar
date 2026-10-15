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
});

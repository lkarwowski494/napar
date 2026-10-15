// ============================================================================
// Napar (Steepwise) — Unit Tests: DialInScreen UI with Water Chemistry
// ============================================================================

import React from 'react';
import renderer from 'react-test-renderer';
import DialInScreen from '../../../app/(tabs)/dialin';

describe('DialInScreen UI with Water Chemistry', () => {
  test('Renderuje ekran DialInScreen z wszystkimi 4 zakładkami', () => {
    let tree: any;
    renderer.act(() => {
      tree = renderer.create(<DialInScreen />);
    });

    const json = tree.toJSON();
    expect(json).toBeTruthy();
    const str = JSON.stringify(json);

    expect(str).toContain('Dial-in Doctor');
    expect(str).toContain('Ratio & Uzysk');
    expect(str).toContain('TDS & EY%');
    expect(str).toContain('Woda SCA');
  });

  test('Przełącza na zakładkę mineralizacji wody SCA', () => {
    let tree: any;
    renderer.act(() => {
      tree = renderer.create(<DialInScreen />);
    });

    const root = tree.root;
    // Znajdź węzeł Text z 'Woda SCA'
    const textNodes = root.findAllByType('Text');
    const waterText = textNodes.find((t: any) => {
      const c = t.props?.children;
      return typeof c === 'string' && (c.includes('Woda SCA') || c.includes('SCA Water'));
    });

    expect(waterText).toBeDefined();

    // Wspinaj się po drzewie rodziców w poszukiwaniu węzła z onPress
    let pressable: any = waterText;
    while (pressable && typeof pressable.props?.onPress !== 'function') {
      pressable = pressable.parent;
    }

    expect(pressable).toBeDefined();
    expect(typeof pressable.props.onPress).toBe('function');

    // Kliknij przycisk
    renderer.act(() => {
      pressable.props.onPress();
    });

    const updatedStr = JSON.stringify(tree.toJSON());
    expect(updatedStr).toContain('Kalkulator Mineralizacji Wody');
    expect(updatedStr).toContain('Barista Hustle 80/40');
    expect(updatedStr).toContain('Koncentrat Bufora');
    expect(updatedStr).toContain('Koncentrat Magnezu');
    expect(updatedStr).toContain('Soda oczyszczona');
  });
});

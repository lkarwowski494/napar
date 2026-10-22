// ============================================================================
// Napar (Steepwise) — Pole wagi bez przycinania (poz. 14 MVP)
// NumInput bez min/max zapisuje wpisaną wagę bez zmian (także 270 g i 320 g).
// ============================================================================

import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { TextInput } from 'react-native';
import { NumInput } from '../ui/NumInput';

function blurWith(text: string, onChangeNumber: (n: number) => void) {
  let tree: any;
  act(() => {
    tree = renderer.create(<NumInput value="10" unit="g" onChangeNumber={onChangeNumber} />);
  });
  const input = tree.root.findByType(TextInput);
  act(() => {
    input.props.onFocus();
    input.props.onChangeText(text);
  });
  act(() => {
    input.props.onBlur({ nativeEvent: {} });
  });
  return tree;
}

describe('Pole wagi bez sztywnego minimum i bez przycinania (poz. 14 MVP)', () => {
  test.each([
    ['5', 5],
    ['270', 270],
    ['320', 320],
    ['500', 500],
    ['0,5', 0.5],
  ])('wpisane %s g zostaje %s g', (text, expected) => {
    const onChangeNumber = jest.fn();
    blurWith(text, onChangeNumber);
    expect(onChangeNumber).toHaveBeenLastCalledWith(expected);
  });
});

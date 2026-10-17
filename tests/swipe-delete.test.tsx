// ============================================================================
// Napar (Steepwise) — Dual Swipe + VoiceOver Delete Guard (S4, NFR-INT-004)
// List item deletion must support both swipe gesture and VoiceOver action/visible button
// ============================================================================

import React from 'react';
import renderer from 'react-test-renderer';
import { Text } from 'react-native';
import { SwipeRow } from '../src/components/ui';

describe('Swipe & VoiceOver Delete Guard (S4, NFR-INT-004)', () => {
  test('SwipeRow supports VoiceOver accessibilityAction "delete"', () => {
    let deleted = false;
    let tree: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(
        <SwipeRow onDelete={() => { deleted = true; }} deleteLabel="Usuń ziarno">
          <Text>Etiopia Yirgacheffe</Text>
        </SwipeRow>
      );
    });

    const root = tree!.root;
    const swipeRow = root.findByProps({ accessible: true });

    // 1. Sprawdzamy akcję accessibility
    expect(swipeRow.props.accessibilityActions).toEqual([
      { name: 'delete', label: 'Usuń ziarno' },
    ]);

    // Wywołanie akcji VoiceOver
    renderer.act(() => {
      swipeRow.props.onAccessibilityAction({ nativeEvent: { actionName: 'delete' } });
    });
    expect(deleted).toBe(true);
  });

  test('SwipeRow provides an accessible fallback button with hitSlop for touch', () => {
    let deleted = false;
    let tree: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(
        <SwipeRow onDelete={() => { deleted = true; }} deleteLabel="Usuń przepis">
          <Text>Przepis V60</Text>
        </SwipeRow>
      );
    });

    const root = tree!.root;
    const button = root.findByProps({ testID: 'swipe-row-delete-btn' });

    expect(button.props.accessibilityRole).toBe('button');
    expect(button.props.accessibilityLabel).toBe('Usuń przepis');
    expect(button.props.hitSlop).toBeDefined();

    renderer.act(() => {
      button.props.onPress();
    });
    expect(deleted).toBe(true);
  });
});

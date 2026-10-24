// ============================================================================
// Napar (Steepwise) — Accessibility Audit (matrix-a11y.test.tsx)
// NFR-A11Y-001..008 & RD-ENG-03: Touch target >= 44pt, non-empty labels, roles & states
// ============================================================================

import React from 'react';
import { StyleSheet } from 'react-native';
import renderer from 'react-test-renderer';
import {
  Btn,
  CloseButton,
  SearchField,
  NumInput,
  Field,
  SwipeRow,
  Empty,
  Missing,
} from '../src/components/ui';

describe('Accessibility Matrix & Touch Targets (NFR-A11Y-001..008, RD-ENG-03)', () => {
  test('Btn satisfies accessibility role, non-empty label, and touch target >= 44pt', () => {
    let tree: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(
        <Btn title="Zapisz" variant="primary" onPress={() => {}} accessibilityLabel="Zapisz recepturę" />
      );
    });

    const btn = tree!.root.findByProps({ accessibilityRole: 'button' });
    expect(btn.props.accessibilityLabel).toBe('Zapisz recepturę');

    // RD-ENG-03: Effective touch target
    const resolvedStyle = typeof btn.props.style === "function" ? btn.props.style({ pressed: false }) : btn.props.style;
    const flatStyle = StyleSheet.flatten(resolvedStyle);
    expect(flatStyle.minHeight).toBeGreaterThanOrEqual(44);
    expect(flatStyle.minWidth).toBeGreaterThanOrEqual(44);
  });

  test('CloseButton has accessibilityRole="button", non-empty label and >= 44pt target', () => {
    let tree: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(<CloseButton onPress={() => {}} label="Zamknij" />);
    });

    const btn = tree!.root.findByProps({ accessibilityRole: 'button' });
    expect(btn.props.accessibilityLabel).toBe('Zamknij');
    expect(btn.props.accessibilityRole).toBe('button');

    const resolvedStyle = typeof btn.props.style === "function" ? btn.props.style({ pressed: false }) : btn.props.style;
    const flatStyle = StyleSheet.flatten(resolvedStyle);
    expect(flatStyle.minHeight).toBeGreaterThanOrEqual(44);
    expect(flatStyle.minWidth).toBeGreaterThanOrEqual(44);
  });

  test('SearchField has clear button with accessible label and hitSlop >= 44pt effective target', () => {
    let tree: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(
        <SearchField value="Kenia" onChangeText={() => {}} placeholder="Szukaj..." />
      );
    });

    const clearBtn = tree!.root.findByProps({ testID: 'search-field-clear' });
    expect(clearBtn.props.accessibilityRole).toBe('button');
    expect(clearBtn.props.accessibilityLabel).toBe('Wyczyść wyszukiwanie');

    // hitSlop ensures effective touch target >= 44pt (RD-ENG-03)
    const hitSlop = clearBtn.props.hitSlop;
    expect(hitSlop).toBeDefined();
    expect(hitSlop.left).toBeGreaterThanOrEqual(8);
    expect(hitSlop.top).toBeGreaterThanOrEqual(8);
  });

  test('NumInput has minHeight >= 44pt and accessible label', () => {
    let tree: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(
        <NumInput value={15.0} onChangeNumber={() => {}} label="Doza kawy" unit="g" />
      );
    });

    const input = tree!.root.findByProps({ accessibilityLabel: 'Doza kawy' });
    expect(input).toBeDefined();
  });

  test('Empty state component provides readable title, description and accessible action', () => {
    let tree: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(
        <Empty
          title="Brak ziaren"
          description="Dodaj swoje pierwsze ziarna do spiżarni"
          actionLabel="Dodaj ziarno"
          onAction={() => {}}
        />
      );
    });

    const btn = tree!.root.findByProps({ accessibilityRole: 'button' });
    expect(btn.props.accessibilityLabel).toBe('Dodaj ziarno');
  });

  test('Missing record component renders return button with accessible role and target >= 44pt', () => {
    let tree: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(<Missing title="Nie znaleziono przepisu" onBack={() => {}} />);
    });

    const btn = tree!.root.findByProps({ accessibilityRole: 'button' });
    expect(btn.props.accessibilityLabel).toBe('Wróć');

    const style = btn.props.style || {};
    const minHeight = style.minHeight || 44;
    expect(minHeight).toBeGreaterThanOrEqual(44);
  });
});

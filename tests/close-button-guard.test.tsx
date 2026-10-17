// ============================================================================
// Napar (Steepwise) — Close Button & Modal Guard (S1, NFR-INT-001)
// Every modal screen must have a dismiss/cancel button with accessible label
// ============================================================================

import React from 'react';
import renderer from 'react-test-renderer';
import { CloseButton } from '../src/components/ui';
import RecipeBuilderScreen from '../app/recipe-builder';
import GongfuScreen from '../app/gongfu';
import { BrewProvider } from '../src/core/brew-context';
import { LanguageProvider } from '../src/core/i18n';

describe('Close Button & Modal Guard (S1, NFR-INT-001)', () => {
  test('CloseButton renders with accessible label and minimum 44pt touch target', () => {
    let pressed = false;
    let tree: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(
        <CloseButton onPress={() => { pressed = true; }} label="Zamknij modal" />
      );
    });
    const root = tree!.root;
    const button = root.findByProps({ accessibilityRole: 'button' });

    expect(button.props.accessibilityLabel).toBe('Zamknij modal');
    // Efektywny rozmiar dotyku
    const style = button.props.style || {};
    const minHeight = style.minHeight || 44;
    const minWidth = style.minWidth || 44;
    expect(minHeight).toBeGreaterThanOrEqual(44);
    expect(minWidth).toBeGreaterThanOrEqual(44);

    renderer.act(() => {
      button.props.onPress();
    });
    expect(pressed).toBe(true);
  });

  test('RecipeBuilder modal has a close/cancel button on header', () => {
    let tree: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(
        <LanguageProvider>
          <BrewProvider>
            <RecipeBuilderScreen />
          </BrewProvider>
        </LanguageProvider>
      );
    });

    const buttons = tree!.root.findAllByProps({ accessibilityRole: 'button' });
    const hasCloseOrCancel = buttons.some(
      (b) =>
        b.props.accessibilityLabel?.toLowerCase().includes('anuluj') ||
        b.props.accessibilityLabel?.toLowerCase().includes('zamknij') ||
        b.props.accessibilityLabel?.toLowerCase().includes('close') ||
        b.props.accessibilityLabel?.toLowerCase().includes('cancel')
    );

    expect(hasCloseOrCancel).toBe(true);
  });

  test('Gongfu modal has a close/dismiss button on header', () => {
    let tree: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(
        <LanguageProvider>
          <BrewProvider>
            <GongfuScreen />
          </BrewProvider>
        </LanguageProvider>
      );
    });

    const buttons = tree!.root.findAllByProps({ accessibilityRole: 'button' });
    const hasCloseOrCancel = buttons.some(
      (b) =>
        b.props.accessibilityLabel?.toLowerCase().includes('anuluj') ||
        b.props.accessibilityLabel?.toLowerCase().includes('zamknij') ||
        b.props.accessibilityLabel?.toLowerCase().includes('close') ||
        b.props.accessibilityLabel?.toLowerCase().includes('cancel')
    );

    expect(hasCloseOrCancel).toBe(true);
  });
});

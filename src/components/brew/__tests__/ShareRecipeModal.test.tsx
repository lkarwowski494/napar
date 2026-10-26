// ============================================================================
// Apps4Brew Studio — Unit Tests: ShareRecipeModal
// TASK-P19-04-STU
// ============================================================================

import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { ShareRecipeModal, ShareRecipeModalProps } from '../ShareRecipeModal';
import { translations } from '../../../core/i18n';
import { MASTER_RECIPES } from '../../../core/recipes-data';

describe('ShareRecipeModal Component', () => {
  const t = translations.pl;
  const mockClose = jest.fn();
  const sampleRecipe = MASTER_RECIPES[0];

  const defaultProps: ShareRecipeModalProps = {
    visible: true,
    onClose: mockClose,
    recipe: sampleRecipe,
    waterTempCelsius: 92,
    shareUrl: 'napar://recipe?v=1&d=sample',
    unitSystem: 'metric',
    t,
  };

  test('renderuje przyciski udostępniania i kopiowania z rolami accessibilityRole="button"', () => {
    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<ShareRecipeModal {...defaultProps} />);
    });
    const root = tree!.root;

    const shareBtn = root.findByProps({ testID: 'share-link-btn' });
    const copyBtn = root.findByProps({ testID: 'copy-link-btn' });

    expect(shareBtn.props.accessibilityRole).toBe('button');
    expect(shareBtn.props.accessibilityLabel).toBe(t.brew.qrShareLink);

    expect(copyBtn.props.accessibilityRole).toBe('button');
    expect(copyBtn.props.accessibilityLabel).toBe(t.brew.qrCopyLink);
  });
  test('TASK-P23-04-STU: przyciski udostępniania i kopiowania posiadają zdefiniowane accessibilityHint', () => {
    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<ShareRecipeModal {...defaultProps} />);
    });
    const root = tree!.root;

    const shareBtn = root.findByProps({ testID: 'share-link-btn' });
    const copyBtn = root.findByProps({ testID: 'copy-link-btn' });

    expect(shareBtn.props.accessibilityHint).toBeDefined();
    expect(copyBtn.props.accessibilityHint).toBeDefined();
  });
});

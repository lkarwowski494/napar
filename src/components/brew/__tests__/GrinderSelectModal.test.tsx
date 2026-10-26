// ============================================================================
// Apps4Brew Studio — Unit Tests: GrinderSelectModal
// TASK-P12-04-STU
// ============================================================================

import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { GrinderSelectModal, GrinderSelectModalProps } from '../GrinderSelectModal';
import { MASTER_RECIPES } from '../../../core/recipes-data';
import { translations } from '../../../core/i18n';

describe('GrinderSelectModal Component', () => {
  const t = translations.pl;
  const mockRecipe = MASTER_RECIPES[0];

  const defaultProps: GrinderSelectModalProps = {
    visible: true,
    onClose: jest.fn(),
    grinderId: 'comandante_c40',
    onSelectGrinder: jest.fn(),
    recipe: mockRecipe,
    t,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('zwraca null i nie renderuje modala gdy visible=false (TASK-P12-04-STU)', () => {
    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<GrinderSelectModal {...defaultProps} visible={false} />);
    });
    expect(tree!.toJSON()).toBeNull();
  });

  test('renderuje listę młynków z rolą radio i stanem zaznaczenia accessibilityState (TASK-P12-04-STU)', () => {
    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<GrinderSelectModal {...defaultProps} visible={true} grinderId="comandante_c40" />);
    });

    const root = tree!.root;
    const c40Item = root.findByProps({ testID: 'grinder-item-comandante_c40' });
    expect(c40Item.props.accessibilityRole).toBe('radio');
    expect(c40Item.props.accessibilityState).toEqual({ selected: true });

    const timemoreItem = root.findByProps({ testID: 'grinder-item-timemore_c2_c3' });
    expect(timemoreItem.props.accessibilityRole).toBe('radio');
    expect(timemoreItem.props.accessibilityState).toEqual({ selected: false });
  });

  test('wywołuje onSelectGrinder oraz onClose po kliknięciu w element młynka', () => {
    const onSelectGrinder = jest.fn();
    const onClose = jest.fn();

    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <GrinderSelectModal
          {...defaultProps}
          onSelectGrinder={onSelectGrinder}
          onClose={onClose}
        />
      );
    });

    const root = tree!.root;
    const kinuItem = root.findByProps({ testID: 'grinder-item-kinu_m47' });
    act(() => {
      kinuItem.props.onPress();
    });

    expect(onSelectGrinder).toHaveBeenCalledWith('kinu_m47');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('wywołuje onClose po kliknięciu przycisku zamknięcia', () => {
    const onClose = jest.fn();
    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<GrinderSelectModal {...defaultProps} onClose={onClose} />);
    });

    const root = tree!.root;
    const closeBtn = root.findByProps({ testID: 'close-grinder-modal-btn' });
    act(() => {
      closeBtn.props.onPress();
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('TASK-P16-04-STU: ScrollView z listą młynków posiada rolę radiogroup i etykietę dostępności', () => {
    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<GrinderSelectModal {...defaultProps} visible={true} />);
    });

    const root = tree!.root;
    const scroll = root.findByProps({ accessibilityRole: 'radiogroup' });
    expect(scroll).toBeTruthy();
    expect(scroll.props.accessibilityLabel).toBe(t.brew.grinderModalTitle);
  });
});

// ============================================================================
// Apps4Brew Studio — Unit Tests: InventorySelectModal
// TASK-P13-04-STU
// ============================================================================

import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { InventorySelectModal, InventorySelectModalProps } from '../InventorySelectModal';
import { InventoryItem } from '../../../core/database-schema';

describe('InventorySelectModal Component', () => {
  const mockInventory: InventoryItem[] = [
    {
      id: 'inv-1',
      name: 'Etiopia Yirgacheffe',
      type: 'coffee',
      roasterOrProducer: 'Hard Beans',
      origin: 'Etiopia',
      initialWeightGrams: 250,
      remainingWeightGrams: 180,
      flavorNotes: ['bergamotka'],
      isFavorite: true,
      isArchived: false,
      createdAt: '2026-10-01T00:00:00Z',
      updatedAt: '2026-10-01T00:00:00Z',
    },
    {
      id: 'inv-2',
      name: 'Kenia Nyeri Hill',
      type: 'coffee',
      roasterOrProducer: 'Coffeedesk',
      origin: 'Kenia',
      initialWeightGrams: 250,
      remainingWeightGrams: 220,
      flavorNotes: ['porzeczka'],
      isFavorite: false,
      isArchived: false,
      createdAt: '2026-10-02T00:00:00Z',
      updatedAt: '2026-10-02T00:00:00Z',
    },
  ];

  const defaultProps: InventorySelectModalProps = {
    visible: true,
    onClose: jest.fn(),
    inventory: mockInventory,
    selectedItem: null,
    onSelectItem: jest.fn(),
    inline: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('TASK-P13-04-STU: zwraca null i nie renderuje gdy visible=false i inline=false', () => {
    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<InventorySelectModal {...defaultProps} visible={false} inline={false} />);
    });
    expect(tree!.toJSON()).toBeNull();
  });

  test('renderuje opcje z rolą radio oraz stanem zaznaczenia accessibilityState', () => {
    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <InventorySelectModal {...defaultProps} selectedItem={null} />
      );
    });

    const root = tree!.root;
    const unassignedOption = root.findByProps({ testID: 'inventory-option-unassigned' });
    expect(unassignedOption.props.accessibilityRole).toBe('radio');
    expect(unassignedOption.props.accessibilityState).toEqual({ selected: true });

    const item1 = root.findByProps({ testID: 'inventory-option-inv-1' });
    expect(item1.props.accessibilityRole).toBe('radio');
    expect(item1.props.accessibilityState).toEqual({ selected: false });
  });

  test('wybór opcji braku przypisania wywołuje onSelectItem(null) i onClose', () => {
    const onSelectItem = jest.fn();
    const onClose = jest.fn();
    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <InventorySelectModal
          {...defaultProps}
          onSelectItem={onSelectItem}
          onClose={onClose}
        />
      );
    });

    const root = tree!.root;
    const unassignedOption = root.findByProps({ testID: 'inventory-option-unassigned' });
    act(() => {
      unassignedOption.props.onPress();
    });

    expect(onSelectItem).toHaveBeenCalledWith(null);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('wybór pozycji spiżarni wywołuje onSelectItem(item) i onClose', () => {
    const onSelectItem = jest.fn();
    const onClose = jest.fn();
    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <InventorySelectModal
          {...defaultProps}
          onSelectItem={onSelectItem}
          onClose={onClose}
        />
      );
    });

    const root = tree!.root;
    const itemOption = root.findByProps({ testID: 'inventory-option-inv-1' });
    act(() => {
      itemOption.props.onPress();
    });

    expect(onSelectItem).toHaveBeenCalledWith(mockInventory[0]);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('kliknięcie przycisku zamknięcia wywołuje onClose', () => {
    const onClose = jest.fn();
    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<InventorySelectModal {...defaultProps} onClose={onClose} />);
    });

    const root = tree!.root;
    const closeBtn = root.findByProps({ testID: 'close-inventory-modal-btn' });
    act(() => {
      closeBtn.props.onPress();
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

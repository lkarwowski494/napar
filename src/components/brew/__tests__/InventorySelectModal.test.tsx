// ============================================================================
// Apps4Brew Studio — Unit Tests: InventorySelectModal
// TASK-P17-01-ODK
// ============================================================================

import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { InventorySelectModal, InventorySelectModalProps } from '../InventorySelectModal';
import { InventoryItem } from '../../../core/database-schema';
import { translations } from '../../../core/i18n';

describe('InventorySelectModal Component', () => {
  const t = translations.pl;
  const mockClose = jest.fn();
  const mockSelect = jest.fn();

  const mockItem: InventoryItem = {
    id: 'bean-1',
    name: 'Ethiopia Yirgacheffe',
    type: 'coffee',
    roasterOrProducer: 'Hard Beans',
    origin: 'Ethiopia',
    initialWeightGrams: 250,
    remainingWeightGrams: 180,
    flavorNotes: ['jasmine', 'peach'],
    isFavorite: false,
    isArchived: false,
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
  };

  const defaultProps: InventorySelectModalProps = {
    visible: true,
    onClose: mockClose,
    inventory: [mockItem],
    selectedItem: null,
    onSelectItem: mockSelect,
    t,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('zwraca null gdy visible=false i inline=false', () => {
    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<InventorySelectModal {...defaultProps} visible={false} />);
    });
    expect(tree!.toJSON()).toBeNull();
  });

  test('renderuje opcję unassigned oraz rolę radiogroup na ScrollView', () => {
    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<InventorySelectModal {...defaultProps} visible={true} />);
    });
    const root = tree!.root;
    const unassignedOption = root.findByProps({ testID: 'inventory-option-unassigned' });
    expect(unassignedOption.props.accessibilityRole).toBe('radio');
    expect(unassignedOption.props.accessibilityState).toEqual({ selected: true });

    act(() => {
      unassignedOption.props.onPress();
    });
    expect(mockSelect).toHaveBeenCalledWith(null);
    expect(mockClose).toHaveBeenCalled();
  });

  test('renderuje pozycję ze spiżarni i obsługuje wybór', () => {
    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<InventorySelectModal {...defaultProps} visible={true} selectedItem={mockItem} />);
    });
    const root = tree!.root;
    const itemOption = root.findByProps({ testID: 'inventory-option-bean-1' });
    expect(itemOption.props.accessibilityRole).toBe('radio');
    expect(itemOption.props.accessibilityState).toEqual({ selected: true });

    act(() => {
      itemOption.props.onPress();
    });
    expect(mockSelect).toHaveBeenCalledWith(mockItem);
    expect(mockClose).toHaveBeenCalled();
  });

  test('renderuje poprawnie w trybie inline', () => {
    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<InventorySelectModal {...defaultProps} inline={true} />);
    });
    const root = tree!.root;
    const inlineContainer = root.findByProps({ testID: 'inventory-select-inline-panel' });
    expect(inlineContainer).toBeTruthy();
  });

  test('wyświetla informację o braku innych pozycji gdy spiżarnia jest pusta', () => {
    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<InventorySelectModal {...defaultProps} inventory={[]} />);
    });
    const root = tree!.root;
    const textNodes = root.findAllByType('Text' as any);
    const hasEmptyNote = textNodes.some((n) => n.props.children === 'Brak innych pozycji w spiżarni');
    expect(hasEmptyNote).toBe(true);
  });

  test('TASK-P50-01-ODK: zlokalizowany przycisk zamykania (EN/PL), accessibilityHint oraz odpornosc na null w inventory', () => {
    let treeEn: renderer.ReactTestRenderer;
    act(() => {
      treeEn = renderer.create(
        <InventorySelectModal
          {...defaultProps}
          t={translations.en}
          inventory={[null as any, undefined as any, mockItem, 123 as any]}
        />
      );
    });
    const rootEn = treeEn!.root;
    const closeBtn = rootEn.findByProps({ testID: 'close-inventory-modal-btn' });
    expect(closeBtn.props.accessibilityLabel).toBe('Close');
    expect(closeBtn.props.accessibilityHint).toBeTruthy();

    const closeText = closeBtn.findByType('Text' as any);
    expect(closeText.props.children).toBe('Close');

    const itemOption = rootEn.findByProps({ testID: 'inventory-option-bean-1' });
    expect(itemOption).toBeTruthy();
  });
});

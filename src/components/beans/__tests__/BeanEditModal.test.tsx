// ============================================================================
// Napar (Steepwise) — Unit Tests: BeanEditModal
// ============================================================================

import React from 'react';
import renderer from 'react-test-renderer';
import { Alert } from 'react-native';
import { BeanEditModal } from '../BeanEditModal';
import { InventoryItem } from '../../../core/database-schema';
import * as database from '../../../core/database';

jest.mock('../../../core/database', () => ({
  saveInventoryItem: jest.fn(),
  deleteInventoryItem: jest.fn(),
  getUnitSystem: jest.fn(() => 'metric'),
}));

describe('BeanEditModal Component', () => {
  const mockItem: InventoryItem = {
    id: 'bean-edit-1',
    name: 'Guji Highlands',
    type: 'coffee',
    roasterOrProducer: 'HAYB',
    origin: 'Etiopia',
    roastOrHarvestDate: '2026-10-01',
    roastProfile: 'light',
    variety: 'Heirloom',
    process: 'Washed',
    initialWeightGrams: 250,
    remainingWeightGrams: 200,
    flavorNotes: ['brzoskwinia', 'jaśmin'],
    rating: 5,
    isFavorite: true,
    isArchived: false,
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
  };

  const mockOnClose = jest.fn();
  const mockOnRequirePaywall = jest.fn();
  const mockOnSaved = jest.fn();
  const mockOnDeleted = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (database.getUnitSystem as jest.Mock).mockReturnValue('metric');
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  test('Renderuje modal z danymi paczki kawy', () => {
    let tree: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(
        <BeanEditModal
          visible={true}
          item={mockItem}
          onClose={mockOnClose}
          canCreate={true}
          onRequirePaywall={mockOnRequirePaywall}
          onSaved={mockOnSaved}
          onDeleted={mockOnDeleted}
        />
      );
    });

    const root = tree!.root;
    const closeBtn = root.findByProps({ accessibilityLabel: 'Anuluj' });
    expect(closeBtn).toBeDefined();

    renderer.act(() => {
      closeBtn.props.onPress();
    });
    expect(mockOnClose).toHaveBeenCalled();
  });

  test('Zapisuje zmiany w paczce przez saveInventoryItem i informuje callback', () => {
    let tree: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(
        <BeanEditModal
          visible={true}
          item={mockItem}
          onClose={mockOnClose}
          canCreate={true}
          onRequirePaywall={mockOnRequirePaywall}
          onSaved={mockOnSaved}
          onDeleted={mockOnDeleted}
        />
      );
    });

    const root = tree!.root;
    const saveBtn = root.findByProps({ accessibilityLabel: 'Zapisz zmiany' });
    expect(saveBtn).toBeDefined();

    renderer.act(() => {
      saveBtn.props.onPress();
    });

    expect(database.saveInventoryItem).toHaveBeenCalled();
    expect(mockOnSaved).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  test('Ograniczenie darmowego planu otwiera paywall (canCreate: false)', () => {
    let tree: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(
        <BeanEditModal
          visible={true}
          item={mockItem}
          onClose={mockOnClose}
          canCreate={false}
          onRequirePaywall={mockOnRequirePaywall}
          onSaved={mockOnSaved}
          onDeleted={mockOnDeleted}
        />
      );
    });

    const root = tree!.root;
    const saveBtn = root.findByProps({ accessibilityLabel: 'Zapisz zmiany' });
    expect(saveBtn).toBeDefined();

    renderer.act(() => {
      saveBtn.props.onPress();
    });

    expect(mockOnRequirePaywall).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  test('Oznaczenie paczki jako zużytej zeruje pozostałą gramaturę i archiwizuje', () => {
    let tree: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(
        <BeanEditModal
          visible={true}
          item={mockItem}
          onClose={mockOnClose}
          canCreate={true}
          onRequirePaywall={mockOnRequirePaywall}
          onSaved={mockOnSaved}
          onDeleted={mockOnDeleted}
        />
      );
    });

    const root = tree!.root;
    const finishBtn = root.findByProps({ accessibilityLabel: 'Oznacz jako zużytą i zarchiwizuj' });
    expect(finishBtn).toBeDefined();

    renderer.act(() => {
      finishBtn.props.onPress();
    });

    expect(database.saveInventoryItem).toHaveBeenCalledWith(
      expect.objectContaining({
        remainingWeightGrams: 0,
        isArchived: true,
      })
    );
    expect(mockOnSaved).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  test('Usunięcie paczki wywołuje dialog potwierdzenia Alert', () => {
    let tree: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(
        <BeanEditModal
          visible={true}
          item={mockItem}
          onClose={mockOnClose}
          canCreate={true}
          onRequirePaywall={mockOnRequirePaywall}
          onSaved={mockOnSaved}
          onDeleted={mockOnDeleted}
        />
      );
    });

    const root = tree!.root;
    const deleteBtn = root.findByProps({ accessibilityLabel: 'Usuń paczkę ze spiżarni' });
    expect(deleteBtn).toBeDefined();

    renderer.act(() => {
      deleteBtn.props.onPress();
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      'Usunąć paczkę?',
      expect.stringContaining(mockItem.name),
      expect.any(Array)
    );
  });

  test('TASK-07-JAK: Anulowanie edycji po manipulacji wagą (-15g) nie zapisuje zmian w bazie', () => {
    let tree: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(
        <BeanEditModal
          visible={true}
          item={mockItem}
          onClose={mockOnClose}
          canCreate={true}
          onRequirePaywall={mockOnRequirePaywall}
          onSaved={mockOnSaved}
          onDeleted={mockOnDeleted}
        />
      );
    });

    const root = tree!.root;
    const minusBtn = root.findAllByProps({ testID: 'quick-weight-minus-18' })[0];
    expect(minusBtn).toBeDefined();

    renderer.act(() => {
      minusBtn.props.onPress();
    });

    const cancelBtn = root.findByProps({ accessibilityLabel: 'Anuluj' });
    expect(cancelBtn).toBeDefined();

    renderer.act(() => {
      cancelBtn.props.onPress();
    });

    expect(mockOnClose).toHaveBeenCalled();
    expect(database.saveInventoryItem).not.toHaveBeenCalled();
    expect(mockOnSaved).not.toHaveBeenCalled();
  });

  test('TASK-P9-03-ZAK: W trybie imperialnym przelicza uncje na gramy przy zapisie i gramy na uncje w formularzu', () => {
    (database.getUnitSystem as jest.Mock).mockReturnValue('imperial');

    let tree: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(
        <BeanEditModal
          visible={true}
          item={mockItem}
          onClose={mockOnClose}
          canCreate={true}
          onRequirePaywall={mockOnRequirePaywall}
          onSaved={mockOnSaved}
          onDeleted={mockOnDeleted}
        />
      );
    });

    const root = tree!.root;
    const saveBtn = root.findByProps({ accessibilityLabel: 'Zapisz zmiany' });
    renderer.act(() => {
      saveBtn.props.onPress();
    });

    expect(database.saveInventoryItem).toHaveBeenCalled();
    const savedItem = (database.saveInventoryItem as jest.Mock).mock.calls[0][0];
    // 250g -> 8.8 oz -> 249g
    // 200g -> 7.1 oz -> 201g
    expect(savedItem.initialWeightGrams).toBeGreaterThan(240);
    expect(savedItem.initialWeightGrams).toBeLessThan(260);
    expect(savedItem.remainingWeightGrams).toBeGreaterThan(190);
    expect(savedItem.remainingWeightGrams).toBeLessThan(210);
    expect(mockOnSaved).toHaveBeenCalled();
  });
});

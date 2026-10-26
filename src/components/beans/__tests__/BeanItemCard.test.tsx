// ============================================================================
// Napar (Steepwise) — Unit Tests: BeanItemCard
// ============================================================================

import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { BeanItemCard } from '../BeanItemCard';
import { InventoryItem } from '../../../core/database-schema';

describe('BeanItemCard Component', () => {
  const mockItem: InventoryItem = {
    id: 'bean-101',
    name: 'Panama Geisha Hacienda La Esmeralda',
    roasterOrProducer: 'Gardelli Specialty',
    type: 'coffee',
    origin: 'Panama',
    variety: 'Geisha',
    process: 'Washed',
    roastOrHarvestDate: '2026-10-15',
    remainingWeightGrams: 180,
    initialWeightGrams: 250,
    isFavorite: false,
    isArchived: false,
    flavorNotes: ['Jaśmin', 'Bergamotka', 'Biała brzoskwinia'],
    rating: 5,
    createdAt: '2026-10-16T10:00:00Z',
    updatedAt: '2026-10-16T10:00:00Z',
  };

  const defaultProps = {
    item: mockItem,
    unitSystem: 'metric' as const,
    onToggleFavorite: jest.fn(),
    onToggleArchive: jest.fn(),
    onSelectForBrew: jest.fn(),
    onOpenEdit: jest.fn(),
    language: 'pl' as const,
  };

  test('Renderuje dane ziaren, palarnię, pochodzenie i wagę', () => {
    let tree: any;
    act(() => {
      tree = renderer.create(<BeanItemCard {...defaultProps} />);
    });

    const str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Panama Geisha Hacienda La Esmeralda');
    expect(str).toContain('Gardelli Specialty');
    expect(str).toContain('180g');
    expect(str).toContain('250g');
    expect(str).toContain('Jaśmin');
  });

  test('TASK-P35-04-STU: badge wagi oraz resting badge posiadają accessibilityRole text i zlokalizowane etykiety a11y', () => {
    let treePl: any;
    act(() => {
      treePl = renderer.create(<BeanItemCard {...defaultProps} language="pl" />);
    });

    const weightPl = treePl.root.findByProps({ testID: 'bean-weight-bean-101' });
    expect(weightPl.props.accessibilityRole).toBe('text');
    expect(weightPl.props.accessibilityLabel).toContain('Pozostała waga: 180g');
    expect(weightPl.props.accessibilityLabel).toContain('Waga początkowa: 250g');

    const restingPl = treePl.root.findByProps({ testID: 'resting-badge-bean-101' });
    expect(restingPl.props.accessibilityRole).toBe('text');
    expect(restingPl.props.accessibilityLabel).toContain('Etap świeżości:');

    let treeEn: any;
    act(() => {
      treeEn = renderer.create(<BeanItemCard {...defaultProps} language="en" />);
    });

    const weightEn = treeEn.root.findByProps({ testID: 'bean-weight-bean-101' });
    expect(weightEn.props.accessibilityRole).toBe('text');
    expect(weightEn.props.accessibilityLabel).toContain('Remaining weight: 180g');
    expect(weightEn.props.accessibilityLabel).toContain('Initial weight: 250g');

    const restingEn = treeEn.root.findByProps({ testID: 'resting-badge-bean-101' });
    expect(restingEn.props.accessibilityRole).toBe('text');
    expect(restingEn.props.accessibilityLabel).toContain('Resting stage:');
  });

  test('Obsługuje akcje ulubionych, edycji, archiwizacji i wyboru do parzenia', () => {
    let tree: any;
    act(() => {
      tree = renderer.create(<BeanItemCard {...defaultProps} />);
    });

    const editBtn = tree.root.findByProps({ accessibilityLabel: 'Edytuj paczkę' });
    act(() => editBtn.props.onPress());
    expect(defaultProps.onOpenEdit).toHaveBeenCalledWith(mockItem);

    const brewBtn = tree.root.findByProps({ accessibilityLabel: 'Parz z tych ziaren' });
    act(() => brewBtn.props.onPress());
    expect(defaultProps.onSelectForBrew).toHaveBeenCalledWith(mockItem);

    const archiveBtn = tree.root.findByProps({ accessibilityLabel: 'Archiwizuj paczkę' });
    act(() => archiveBtn.props.onPress());
    expect(defaultProps.onToggleArchive).toHaveBeenCalledWith(mockItem);
  });
});

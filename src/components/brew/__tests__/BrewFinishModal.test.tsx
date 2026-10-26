// ============================================================================
// Napar (Steepwise) — BrewFinishModal Component Tests
// ============================================================================

import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { BrewFinishModal } from '../BrewFinishModal';
import { DEFAULT_SENSORY_PROFILE } from '../../../core/radar-chart';

describe('BrewFinishModal Component', () => {
  const defaultProps = {
    visible: true,
    totalElapsedSeconds: 195,
    waterGrams: 300,
    rating: 4,
    onChangeRating: jest.fn(),
    tasteBalance: 'sour',
    onChangeTasteBalance: jest.fn(),
    sensoryProfile: DEFAULT_SENSORY_PROFILE,
    onChangeSensoryProfile: jest.fn(),
    selectedTags: ['jaśmin'],
    onToggleTag: jest.fn(),
    waterProfile: 'melbourne_soft',
    onChangeWaterProfile: jest.fn(),
    tdsInput: '1.35',
    onChangeTdsInput: jest.fn(),
    notes: 'Owocowa kwasowość',
    onChangeNotes: jest.fn(),
    brewCost: {
      coffeeCost: 3.2,
      waterCost: 0.1,
      electricityKwh: 0.05,
      energyCost: 0.05,
      filterCost: 0.25,
      totalHomeCost: 3.3,
      cafePrice: 18.0,
      savingsPerCup: 14.7,
      savingsPercent: 81.7,
    },
    onSkip: jest.fn(),
    onSave: jest.fn(),
  };

  test('Renderuje podsumowanie z Dial-in Doctor dla kwasowości ("Za kwaśna")', () => {
    let tree: any;
    act(() => {
      tree = renderer.create(<BrewFinishModal {...defaultProps} />);
    });

    const str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Zakończono Parzenie!');
    expect(str).toContain('03:15');
    expect(str).toContain('300g');
    expect(str).toContain('Recepta Dial-in Doctor');
    expect(str).toContain('zmiel drobniej o 2 kliki');
    expect(str).toContain('+14.70 PLN');
  });

  test('Dial-in Doctor dostosowuje receptę w zależności od balansu (bitter, weak, balanced)', () => {
    let treeBitter: any;
    act(() => {
      treeBitter = renderer.create(
        <BrewFinishModal {...defaultProps} tasteBalance="bitter" />
      );
    });
    expect(JSON.stringify(treeBitter.toJSON())).toContain('zmiel grubiej o 2 kliki');

    let treeWeak: any;
    act(() => {
      treeWeak = renderer.create(
        <BrewFinishModal {...defaultProps} tasteBalance="weak" />
      );
    });
    expect(JSON.stringify(treeWeak.toJSON())).toContain('Zwiększ dozę o');

    let treeBalanced: any;
    act(() => {
      treeBalanced = renderer.create(
        <BrewFinishModal {...defaultProps} tasteBalance="balanced" />
      );
    });
    expect(JSON.stringify(treeBalanced.toJSON())).toContain('Idealny Balans');
  });

  test('Kliknięcie gwiazdki, balansu, Pomiń i Zapisz wywołuje callbacki', () => {
    let tree: any;
    act(() => {
      tree = renderer.create(<BrewFinishModal {...defaultProps} />);
    });

    // Ocena 5 gwiazdek
    const star5 = tree.root.findByProps({ testID: 'star-rating-5' });
    act(() => star5.props.onPress());
    expect(defaultProps.onChangeRating).toHaveBeenCalledWith(5);

    // Zmiana balansu na balanced
    const chipBalanced = tree.root.findByProps({ testID: 'taste-chip-balanced' });
    act(() => chipBalanced.props.onPress());
    expect(defaultProps.onChangeTasteBalance).toHaveBeenCalledWith('balanced');

    // Pomiń
    const skipBtn = tree.root.findByProps({ testID: 'finish-skip-btn' });
    act(() => skipBtn.props.onPress());
    expect(defaultProps.onSkip).toHaveBeenCalled();

    // Zapisz
    const saveBtn = tree.root.findByProps({ testID: 'finish-save-btn' });
    act(() => saveBtn.props.onPress());
    expect(defaultProps.onSave).toHaveBeenCalled();
  });

  test('TASK-P5-03-ZAK: Renderuje oszczędności w formacie waluty angielskiej bez PLN', () => {
    let tree: any;
    act(() => {
      tree = renderer.create(<BrewFinishModal {...defaultProps} language="en" />);
    });

    const str = JSON.stringify(tree.toJSON());
    expect(str).toContain('+$14.70');
    expect(str).not.toContain('+14.70 PLN');
  });

  test('TASK-P14-01-ODK: Zwraca null gdy visible=false oraz radzi sobie z ujemnym czasem i NaN', () => {
    let treeHidden: any;
    act(() => {
      treeHidden = renderer.create(<BrewFinishModal {...defaultProps} visible={false} />);
    });
    expect(treeHidden.toJSON()).toBeNull();

    let treeSafeTime: any;
    act(() => {
      treeSafeTime = renderer.create(
        <BrewFinishModal {...defaultProps} totalElapsedSeconds={NaN as any} />
      );
    });
    expect(JSON.stringify(treeSafeTime.toJSON())).toContain('00:00');
  });

  test('TASK-P40-01-ODK: Semantyczne accessibilityState dla ocen i balansu smaku oraz limity wejść TDS i notatek', () => {
    let tree: any;
    act(() => {
      tree = renderer.create(<BrewFinishModal {...defaultProps} rating={3} tasteBalance="sour" />);
    });

    const star3 = tree.root.findByProps({ testID: 'star-rating-3' });
    const star4 = tree.root.findByProps({ testID: 'star-rating-4' });
    expect(star3.props.accessibilityState).toEqual({ selected: true });
    expect(star4.props.accessibilityState).toEqual({ selected: false });

    const chipSour = tree.root.findByProps({ testID: 'taste-chip-sour' });
    const chipBitter = tree.root.findByProps({ testID: 'taste-chip-bitter' });
    expect(chipSour.props.accessibilityRole).toBe('radio');
    expect(chipSour.props.accessibilityState).toEqual({ selected: true });
    expect(chipBitter.props.accessibilityRole).toBe('radio');
    expect(chipBitter.props.accessibilityState).toEqual({ selected: false });

    const tdsInput = tree.root.findByProps({ testID: 'tds-input' });
    expect(tdsInput.props.maxLength).toBe(6);

    const notesInput = tree.root.findByProps({ testID: 'finish-notes-input' });
    expect(notesInput.props.maxLength).toBe(1000);
  });

  test('TASK-P43-01-ODK: Dostępność starRow jako radiogroup oraz odporność na NaN i wartości ujemne w kosztach i wodzie', () => {
    let tree: any;
    act(() => {
      tree = renderer.create(
        <BrewFinishModal
          {...defaultProps}
          waterGrams={NaN as any}
          rating={-1}
          brewCost={{
            coffeeCost: NaN as any,
            waterCost: -0 as any,
            electricityKwh: 0,
            energyCost: 0,
            filterCost: 0,
            totalHomeCost: undefined as any,
            cafePrice: 'invalid' as any,
            savingsPerCup: null as any,
            savingsPercent: 0,
          }}
        />
      );
    });

    const starRow = tree.root.findByProps({ testID: 'star-rating-row' });
    expect(starRow).toBeDefined();
    expect(starRow.props.accessible).toBe(true);
    expect(starRow.props.accessibilityRole).toBe('radiogroup');

    const str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Woda: 0g');
    expect(str).toContain('Koszt tego naparu: 0.00 PLN');
    expect(str).toContain('+0.00 PLN');
  });
});

// ============================================================================
// Napar (Steepwise) — BrewFinishModal Component Tests
// ============================================================================

import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { BrewFinishModal } from '../BrewFinishModal';
import { DEFAULT_SENSORY_PROFILE } from '../../../core/radar-chart';
import { diagnoseExtractionTaste, diagnoseTeaTaste } from '../../../core/domain-rules';

describe('BrewFinishModal Component', () => {
  const defaultProps = {
    visible: true,
    beverageType: 'COFFEE' as const,
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
    expect(str).toContain('+14.70 PLN');
  });

  test('Scenariusz "Za kwaśna": diagnoza z silnika dial-in (niedoparzenie, mielenie drobniej i wyższa temperatura)', () => {
    let tree: any;
    act(() => {
      tree = renderer.create(<BrewFinishModal {...defaultProps} tasteBalance="sour" />);
    });
    const expected = diagnoseExtractionTaste({ isSour: true })[0];
    expect(tree.root.findByProps({ testID: 'doctor-advice-sour' })).toBeDefined();
    const str = JSON.stringify(tree.toJSON());

    expect(str).toContain(expected.issue);
    expect(str).toContain(expected.recommendationPl);
    expect(expected.grindAdjustment).toBe('finer');
    expect(expected.tempAdjustment).toBe('higher');
    // Dawna, ręcznie wpisana wersja nie wraca
    expect(JSON.stringify(tree.toJSON())).not.toContain('zmiel drobniej o 2 kliki');
  });

  test('Scenariusz "Za gorzka": diagnoza z silnika dial-in (przeparzenie, mielenie grubiej i niższa temperatura)', () => {
    let tree: any;
    act(() => {
      tree = renderer.create(<BrewFinishModal {...defaultProps} tasteBalance="bitter" />);
    });
    const expected = diagnoseExtractionTaste({ isBitter: true })[0];
    const str = JSON.stringify(tree.toJSON());

    expect(str).toContain(expected.issue);
    expect(str).toContain(expected.recommendationPl);
    expect(expected.grindAdjustment).toBe('coarser');
    expect(expected.tempAdjustment).toBe('lower');
    expect(str).not.toContain('zmiel grubiej o 2 kliki');
  });

  test('Dial-in Doctor dostosowuje receptę w zależności od balansu (bitter, weak, balanced)', () => {
    let treeBitter: any;
    act(() => {
      treeBitter = renderer.create(
        <BrewFinishModal {...defaultProps} tasteBalance="bitter" />
      );
    });
    expect(JSON.stringify(treeBitter.toJSON())).toContain('Gorzka / sucha w ustach (Przeparzenie)');

    let treeWeak: any;
    act(() => {
      treeWeak = renderer.create(
        <BrewFinishModal {...defaultProps} tasteBalance="weak" />
      );
    });
    expect(JSON.stringify(treeWeak.toJSON())).toContain('Zwiększ dozę kawy o +1g');

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

  // Poz. 24 MVP: diagnoza smaku dla herbaty z reguł RD-05b (diagnoseTeaTaste), nie z kawowych
  describe('Herbata (poz. 24 MVP): arkusz po parzeniu używa reguł herbaty', () => {
    const teaProps = { ...defaultProps, beverageType: 'TEA' as const };

    test('Scenariusz herbaty "Za gorzka": cierpkość, skrócenie infuzji (nie kawowe mielenie)', () => {
      let tree: any;
      act(() => {
        tree = renderer.create(<BrewFinishModal {...teaProps} tasteBalance="bitter" />);
      });
      const expected = diagnoseTeaTaste({ isBitterOrAstringent: true })[0];
      const str = JSON.stringify(tree.toJSON());

      expect(tree.root.findByProps({ testID: 'doctor-advice-bitter' })).toBeDefined();
      expect(str).toContain(expected.issue);
      expect(str).toContain(expected.recommendationPl);
      expect(expected.steepTimeAdjustmentSeconds).toBe(-10);
      expect(str).not.toContain('Gorzka / sucha w ustach (Przeparzenie)');
      expect(str).not.toContain('Zmiel grubiej');
    });

    test('Scenariusz herbaty "Wodnista": za krótka infuzja, wydłużenie czasu (nie kawowa dawka)', () => {
      let tree: any;
      act(() => {
        tree = renderer.create(<BrewFinishModal {...teaProps} tasteBalance="weak" />);
      });
      const expected = diagnoseTeaTaste({ isWeakOrWatery: true })[0];
      const str = JSON.stringify(tree.toJSON());

      expect(str).toContain(expected.issue);
      expect(str).toContain(expected.recommendationPl);
      expect(expected.steepTimeAdjustmentSeconds).toBe(15);
      expect(str).not.toContain('Płaska / rozwodniona');
    });

    test('Herbata nie ma reguły "Za kwaśna": kawowa diagnoza kwasowości nie pojawia się', () => {
      let tree: any;
      act(() => {
        tree = renderer.create(<BrewFinishModal {...teaProps} tasteBalance="sour" />);
      });
      const str = JSON.stringify(tree.toJSON());

      expect(tree.root.findAll((node: any) => node.props.testID === 'doctor-advice-sour')).toHaveLength(0);
      expect(str).not.toContain('Zbyt kwaśna / cierpka (Niedoparzenie)');
    });
  });
});

// ============================================================================
// Napar (Steepwise) — BrewProAccordion Component Tests
// ============================================================================

import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { BrewProAccordion } from '../BrewProAccordion';
import { DEFAULT_SENSORY_PROFILE } from '../../../core/radar-chart';

describe('BrewProAccordion Component', () => {
  const defaultProps = {
    waterProfile: 'melbourne_soft',
    onSelectWaterProfile: jest.fn(),
    tdsInput: '1.35',
    onChangeTds: jest.fn(),
    sensoryProfile: DEFAULT_SENSORY_PROFILE,
    onChangeSensory: jest.fn(),
    selectedTags: ['jaśmin', 'brzoskwinia'],
    onToggleTag: jest.fn(),
    costTotalPln: 3.4,
    costSavingsPln: 14.6,
  };

  test('Domyślnie jest zwinięty, a po kliknięciu rozwija chemię wody, TDS i sensorykę', () => {
    let tree: any;
    act(() => {
      tree = renderer.create(<BrewProAccordion {...defaultProps} />);
    });

    let str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Parametry Rzemieślnicze & Chemia Wody');
    // Ciało akordeonu nie jest widoczne przed kliknięciem
    expect(tree.root.findAllByProps({ testID: 'pro-accordion-body' }).length).toBe(0);

    // Kliknij nagłówek, aby rozwinąć
    const toggleBtn = tree.root.findByProps({
      testID: 'pro-accordion-toggle-btn',
    });
    act(() => toggleBtn.props.onPress());

    str = JSON.stringify(tree.toJSON());
    expect(tree.root.findByProps({ testID: 'pro-accordion-body' })).toBeTruthy();
    expect(str).toContain('Ekonomia Naparu');
    expect(str).toContain('3.40 zł');
    expect(str).toContain('+14.60 zł');
    expect(str).toContain('Profil Wody (Barista Hustle / SCA)');
    expect(str).toContain('Wykres Sensoryki SCA (Radar)');
  });

  test('Zmiana profilu wody i TDS wywołuje odpowiednie akcje', () => {
    let tree: any;
    act(() => {
      tree = renderer.create(<BrewProAccordion {...defaultProps} />);
    });

    // Rozwiń
    act(() => {
      tree.root.findByProps({ testID: 'pro-accordion-toggle-btn' }).props.onPress();
    });

    // Profil wody
    const waterChip = tree.root.findByProps({ testID: 'pro-water-chip-scott_rao_wonder' });
    act(() => waterChip.props.onPress());
    expect(defaultProps.onSelectWaterProfile).toHaveBeenCalledWith('scott_rao_wonder');

    // TDS
    const tdsInput = tree.root.findByProps({ testID: 'pro-tds-input' });
    act(() => tdsInput.props.onChangeText('1.42'));
    expect(defaultProps.onChangeTds).toHaveBeenCalledWith('1.42');
  });
});

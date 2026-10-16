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
  };

  test('Domyślnie jest zwinięty, a po kliknięciu rozwija chemię wody i TDS (bez rozpraszaczy)', () => {
    let tree: any;
    act(() => {
      tree = renderer.create(<BrewProAccordion {...defaultProps} />);
    });

    let str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Zaawansowane: Woda & TDS');
    // Ciało akordeonu nie jest widoczne przed kliknięciem
    expect(tree.root.findAllByProps({ testID: 'pro-accordion-body' }).length).toBe(0);

    // Kliknij nagłówek, aby rozwinąć
    const toggleBtn = tree.root.findByProps({
      testID: 'pro-accordion-toggle-btn',
    });
    act(() => toggleBtn.props.onPress());

    str = JSON.stringify(tree.toJSON());
    expect(tree.root.findByProps({ testID: 'pro-accordion-body' })).toBeTruthy();
    expect(str).toContain('Profil Wody (Barista Hustle / SCA)');
    expect(str).toContain('Odczyt refractometru TDS (%)');
    // Upewnij się, że kalkulator kosztu PLN i radar sensoryczny zostały skasowane z ekranu parzenia
    expect(str).not.toContain('Ekonomia Naparu');
    expect(str).not.toContain('Wykres Sensoryki SCA (Radar)');
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

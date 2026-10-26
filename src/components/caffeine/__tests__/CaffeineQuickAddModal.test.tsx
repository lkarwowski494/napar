// ============================================================================
// Apps4Brew Studio — Unit Tests: CaffeineQuickAddModal
// TASK-P12-01-ODK
// ============================================================================

import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { CaffeineQuickAddModal } from '../CaffeineQuickAddModal';

describe('CaffeineQuickAddModal Component', () => {
  it('returns null when visible is false', async () => {
    let tree: any;
    await act(async () => {
      tree = renderer.create(
        <CaffeineQuickAddModal
          visible={false}
          unitSystem="metric"
          onClose={jest.fn()}
          onSelectOption={jest.fn()}
        />
      );
    });
    expect(tree.toJSON()).toBeNull();
  });

  it('renders presets and title in Polish by default', async () => {
    let tree: any;
    await act(async () => {
      tree = renderer.create(
        <CaffeineQuickAddModal
          visible={true}
          unitSystem="metric"
          onClose={jest.fn()}
          onSelectOption={jest.fn()}
        />
      );
    });

    const root = tree.root;
    const str = JSON.stringify(tree.toJSON());

    expect(str).toContain('Szybkie dodanie kofeiny');
    expect(str).toContain('Przelew / Drip (V60, Chemex)');
    expect(str).toContain('Podwójne Espresso (Doppio)');
    expect(str).toContain('Herbata liściasta (infuzja)');
    expect(str).toContain('Anuluj');

    expect(root.findByProps({ testID: 'caffeine-quick-v60' })).toBeTruthy();
    expect(root.findByProps({ testID: 'caffeine-quick-double-espresso' })).toBeTruthy();
    expect(root.findByProps({ testID: 'caffeine-quick-single-espresso' })).toBeTruthy();
    expect(root.findByProps({ testID: 'caffeine-quick-aeropress' })).toBeTruthy();
    expect(root.findByProps({ testID: 'caffeine-quick-tea' })).toBeTruthy();
    expect(root.findByProps({ testID: 'caffeine-quick-cancel-btn' })).toBeTruthy();
  });

  it('renders in English when language="en"', async () => {
    let tree: any;
    await act(async () => {
      tree = renderer.create(
        <CaffeineQuickAddModal
          visible={true}
          unitSystem="metric"
          language="en"
          onClose={jest.fn()}
          onSelectOption={jest.fn()}
        />
      );
    });

    const str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Quick Log Caffeine');
    expect(str).toContain('Cancel');
  });

  it('selects V60 and triggers onSelectOption with correct parameters', async () => {
    const mockSelect = jest.fn();
    let tree: any;
    await act(async () => {
      tree = renderer.create(
        <CaffeineQuickAddModal
          visible={true}
          unitSystem="metric"
          onClose={jest.fn()}
          onSelectOption={mockSelect}
        />
      );
    });

    const v60Btn = tree.root.findByProps({ testID: 'caffeine-quick-v60' });
    await act(async () => {
      v60Btn.props.onPress();
    });

    expect(mockSelect).toHaveBeenCalledTimes(1);
    expect(mockSelect).toHaveBeenCalledWith(
      'Kawa przelewowa (V60 / Drip)',
      'coffee',
      18,
      expect.any(Number)
    );
  });

  it('selects tea option and cancels modal on cancel button press', async () => {
    const mockSelect = jest.fn();
    const mockClose = jest.fn();
    let tree: any;
    await act(async () => {
      tree = renderer.create(
        <CaffeineQuickAddModal
          visible={true}
          unitSystem="metric"
          onClose={mockClose}
          onSelectOption={mockSelect}
        />
      );
    });

    const teaBtn = tree.root.findByProps({ testID: 'caffeine-quick-tea' });
    await act(async () => {
      teaBtn.props.onPress();
    });
    expect(mockSelect).toHaveBeenCalledWith(
      'Herbata Gongfu / Liściasta',
      'tea',
      5,
      45
    );

    const cancelBtn = tree.root.findByProps({ testID: 'caffeine-quick-cancel-btn' });
    await act(async () => {
      cancelBtn.props.onPress();
    });
    expect(mockClose).toHaveBeenCalledTimes(1);
  });
});

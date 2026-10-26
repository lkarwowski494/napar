// ============================================================================
// Napar (Steepwise) — Unit Tests: BeanCompendiumModal
// ============================================================================

import React from 'react';
import renderer from 'react-test-renderer';
import { BeanCompendiumModal } from '../BeanCompendiumModal';

describe('BeanCompendiumModal Component', () => {
  const mockOnClose = jest.fn();
  const mockOnUseTemplate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Renderuje modal kompendium z zakładkami posiadającymi role=tab, accessibilityState i testID', () => {
    let tree: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(
        <BeanCompendiumModal
          visible={true}
          onClose={mockOnClose}
          onUseTemplate={mockOnUseTemplate}
          beveragePreference="both"
        />
      );
    });

    const root = tree!.root;

    // Przycisk zamknięcia
    const closeBtn = root.findByProps({ testID: 'compendium-close-button' });
    expect(closeBtn).toBeDefined();
    expect(closeBtn.props.accessibilityRole).toBe('button');

    // Zakładka odmian
    const varietiesTab = root.findByProps({ testID: 'compendium-tab-varieties' });
    expect(varietiesTab).toBeDefined();
    expect(varietiesTab.props.accessibilityRole).toBe('tab');
    expect(varietiesTab.props.accessibilityState).toEqual({ selected: true });
    expect(varietiesTab.props.hitSlop).toEqual({ top: 8, bottom: 8, left: 8, right: 8 });

    // Zakładka obróbek
    const processesTab = root.findByProps({ testID: 'compendium-tab-processes' });
    expect(processesTab).toBeDefined();
    expect(processesTab.props.accessibilityRole).toBe('tab');
    expect(processesTab.props.accessibilityState).toEqual({ selected: false });

    // Zakładka terroir
    const originsTab = root.findByProps({ testID: 'compendium-tab-origins' });
    expect(originsTab).toBeDefined();
    expect(originsTab.props.accessibilityRole).toBe('tab');
    expect(originsTab.props.accessibilityState).toEqual({ selected: false });

    // Zakładka herbat
    const teaTab = root.findByProps({ testID: 'compendium-tab-tea' });
    expect(teaTab).toBeDefined();
    expect(teaTab.props.accessibilityRole).toBe('tab');
    expect(teaTab.props.accessibilityState).toEqual({ selected: false });
  });

  test('Przełącza zakładki i wywołuje onUseTemplate z przycisku użycia szablonu', () => {
    let tree: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(
        <BeanCompendiumModal
          visible={true}
          onClose={mockOnClose}
          onUseTemplate={mockOnUseTemplate}
          beveragePreference="both"
        />
      );
    });

    const root = tree!.root;

    // Przycisk użycia szablonu dla pierwszej odmiany
    const useBtns = root.findAllByProps({ accessibilityRole: 'button' });
    const templateBtn = useBtns.find((b) => b.props.testID && b.props.testID.startsWith('comp-use-btn-'));
    expect(templateBtn).toBeDefined();
    expect(templateBtn!.props.hitSlop).toEqual({ top: 8, bottom: 8, left: 8, right: 8 });

    renderer.act(() => {
      templateBtn!.props.onPress();
    });

    expect(mockOnUseTemplate).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'coffee',
      })
    );

    // Przełącz na zakładkę procesów
    const processesTab = root.findByProps({ testID: 'compendium-tab-processes' });
    renderer.act(() => {
      processesTab.props.onPress();
    });

    expect(processesTab.props.accessibilityState).toEqual({ selected: true });
  });
});

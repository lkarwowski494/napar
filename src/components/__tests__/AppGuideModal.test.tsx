// ============================================================================
// Apps4Brew Studio — Unit Tests: AppGuideModal (Zero-Clutter Header Helper)
// TASK-P11-01-ODK
// ============================================================================

import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { AppGuideModal } from '../AppGuideModal';

describe('AppGuideModal Component', () => {
  it('returns null when visible is false', async () => {
    let tree: any;
    await act(async () => {
      tree = renderer.create(
        <AppGuideModal visible={false} onClose={jest.fn()} />
      );
    });
    expect(tree.toJSON()).toBeNull();
  });

  it('renders Polish guide with steps, navigation tabs and golden rules', async () => {
    let tree: any;
    await act(async () => {
      tree = renderer.create(
        <AppGuideModal visible={true} onClose={jest.fn()} language="pl" />
      );
    });

    const root = tree.root;
    const str = JSON.stringify(tree.toJSON());

    expect(str).toContain('Jak działa aplikacja?');
    expect(str).toContain('ZŁOTE ZASADY EKSTRAKCJI');
    expect(str).toContain('PROCES GŁÓWNY (1 → 2 → 3 → 4)');
    expect(str).toContain('EKRANY DOLNEGO PASKA NAWIGACJI');

    expect(root.findByProps({ testID: 'app-guide-modal' })).toBeTruthy();
    expect(root.findByProps({ testID: 'app-guide-close-btn' })).toBeTruthy();
    expect(root.findByProps({ testID: 'app-guide-got-it-btn' })).toBeTruthy();

    for (let i = 1; i <= 4; i++) {
      expect(root.findByProps({ testID: `app-guide-step-${i}` })).toBeTruthy();
    }

    expect(root.findByProps({ testID: 'app-guide-tab-brew' })).toBeTruthy();
    expect(root.findByProps({ testID: 'app-guide-tab-stash' })).toBeTruthy();
    expect(root.findByProps({ testID: 'app-guide-tab-journal' })).toBeTruthy();
    expect(root.findByProps({ testID: 'app-guide-tab-dialin' })).toBeTruthy();
    expect(root.findByProps({ testID: 'app-guide-tab-settings' })).toBeTruthy();
  });

  it('renders English guide when language="en"', async () => {
    let tree: any;
    await act(async () => {
      tree = renderer.create(
        <AppGuideModal visible={true} onClose={jest.fn()} language="en" />
      );
    });

    const str = JSON.stringify(tree.toJSON());
    expect(str).toContain('How Steepwise Works');
    expect(str).toContain('GOLDEN RULES OF EXTRACTION');
    expect(str).toContain('MAIN PROCESS (1 → 2 → 3 → 4)');
    expect(str).toContain('BOTTOM NAVIGATION TABS');
  });

  it('invokes onClose when close button or got it button is pressed', async () => {
    const mockClose = jest.fn();
    let tree: any;
    await act(async () => {
      tree = renderer.create(
        <AppGuideModal visible={true} onClose={mockClose} />
      );
    });

    const root = tree.root;
    const closeBtn = root.findByProps({ testID: 'app-guide-close-btn' });
    const gotItBtn = root.findByProps({ testID: 'app-guide-got-it-btn' });

    await act(async () => {
      closeBtn.props.onPress();
    });
    expect(mockClose).toHaveBeenCalledTimes(1);

    await act(async () => {
      gotItBtn.props.onPress();
    });
    expect(mockClose).toHaveBeenCalledTimes(2);
  });
});

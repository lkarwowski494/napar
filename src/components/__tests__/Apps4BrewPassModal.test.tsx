// ============================================================================
// Napar (Steepwise) — Apps4BrewPassModal Component Tests
// ============================================================================

import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Apps4BrewPassModal } from '../Apps4BrewPassModal';
import { resetTrialForTesting } from '../../core/app-access';

const mockDb: any = {
  app_settings: new Map(),
  execSync: jest.fn(),
  getFirstSync: jest.fn((q, p) => {
    if (q.includes('FROM app_settings WHERE key = ?')) {
      const val = mockDb.app_settings.get(p?.[0]);
      return val !== undefined ? { value: val } : null;
    }
    return null;
  }),
  getAllSync: jest.fn(() => []),
  runSync: jest.fn((q, p) => {
    if (q.includes('INSERT OR REPLACE INTO app_settings')) {
      mockDb.app_settings.set(p?.[0], p?.[1]);
    }
  }),
};

jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn(() => mockDb),
}));

describe('Apps4BrewPassModal Component', () => {
  beforeEach(() => {
    mockDb.app_settings.clear();
    resetTrialForTesting();
  });

  test('Renderuje plany cenowe Modelu "Taniej niż espresso" ($0.99, $4.99, $14.99)', () => {
    let tree: any;
    act(() => {
      tree = renderer.create(
        <Apps4BrewPassModal visible={true} onClose={jest.fn()} />
      );
    });

    const str = JSON.stringify(tree.toJSON());
    expect(str).toContain('$0.99');
    expect(str).toContain('$4.99');
    expect(str).toContain('$14.99');
    expect(str).toContain('APPS4BREW PASS');
    expect(str).toContain('Twoja historia parzeń');
  });

  test('Wybór rocznego planu ($4.99) aktywuje subskrypcję i zamyka modal', () => {
    const handlePurchase = jest.fn();
    const handleClose = jest.fn();
    let tree: any;

    act(() => {
      tree = renderer.create(
        <Apps4BrewPassModal
          visible={true}
          onClose={handleClose}
          onPurchaseSuccess={handlePurchase}
        />
      );
    });

    const annualPlanBtn = tree.root.findByProps({ testID: 'plan-annual-btn' });
    act(() => annualPlanBtn.props.onPress());

    expect(handlePurchase).toHaveBeenCalled();
    expect(handleClose).toHaveBeenCalled();
    expect(mockDb.runSync).toHaveBeenCalled();
  });

  test('Wybór planu miesięcznego ($0.99) i lifetime ($14.99)', () => {
    let treeMonthly: any;
    act(() => {
      treeMonthly = renderer.create(
        <Apps4BrewPassModal visible={true} onClose={jest.fn()} />
      );
    });
    const monthlyPlanBtn = treeMonthly.root.findByProps({ testID: 'plan-monthly-btn' });
    act(() => monthlyPlanBtn.props.onPress());
    expect(mockDb.runSync).toHaveBeenCalled();

    let treeLifetime: any;
    act(() => {
      treeLifetime = renderer.create(
        <Apps4BrewPassModal visible={true} onClose={jest.fn()} />
      );
    });
    const lifetimePlanBtn = treeLifetime.root.findByProps({ testID: 'plan-lifetime-btn' });
    act(() => lifetimePlanBtn.props.onPress());
    expect(mockDb.runSync).toHaveBeenCalled();
  });

  test('Przywrócenie zakupów (Restore) oraz zamknięcie modalem', () => {
    const handleClose = jest.fn();
    const handlePurchase = jest.fn();
    let tree: any;

    act(() => {
      tree = renderer.create(
        <Apps4BrewPassModal
          visible={true}
          onClose={handleClose}
          onPurchaseSuccess={handlePurchase}
        />
      );
    });

    const restoreBtn = tree.root.findByProps({ testID: 'restore-purchases-btn' });
    act(() => restoreBtn.props.onPress());
    expect(handlePurchase).toHaveBeenCalled();
    expect(handleClose).toHaveBeenCalled();

    let treeClose: any;
    const handleCloseOnly = jest.fn();
    act(() => {
      treeClose = renderer.create(
        <Apps4BrewPassModal visible={true} onClose={handleCloseOnly} />
      );
    });
    const closeBtn = treeClose.root.findByProps({ testID: 'close-paywall-btn' });
    act(() => closeBtn.props.onPress());
    expect(handleCloseOnly).toHaveBeenCalled();
  });
});

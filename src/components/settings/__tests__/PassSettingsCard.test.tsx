// ============================================================================
// Napar (Steepwise) — Unit Tests: PassSettingsCard
// ============================================================================

import React from 'react';
import renderer from 'react-test-renderer';
import { PassSettingsCard } from '../PassSettingsCard';
import { translations } from '../../../core/i18n';

describe('PassSettingsCard Component', () => {
  const t = translations.pl;

  test('Renderuje przycisk przejścia do planów z hitSlop i aktualnymi cenami dla użytkownika trial', () => {
    const onOpen = jest.fn();
    let tree: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(
        <PassSettingsCard
          isSubscribed={false}
          subscriptionTier="none"
          accessStatus="trial_active"
          brewsRemaining={10}
          onOpenPassModal={onOpen}
          t={t}
        />
      );
    });

    const root = tree!.root;
    const btn = root.findByProps({ testID: 'open-apps4brew-pass-btn' });
    expect(btn).toBeDefined();
    expect(btn.props.hitSlop).toEqual({ top: 8, bottom: 8, left: 8, right: 8 });
    expect(btn.props.accessibilityLabel).toContain('$0.99 / $4.99 / $14.99');

    renderer.act(() => {
      btn.props.onPress();
    });
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  test('Renderuje przycisk zarządzania planem z hitSlop dla subskrybenta Pro', () => {
    let tree: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(
        <PassSettingsCard
          isSubscribed={true}
          subscriptionTier="annual"
          accessStatus="subscribed"
          brewsRemaining={0}
          onOpenPassModal={jest.fn()}
          t={t}
        />
      );
    });

    const root = tree!.root;
    const manageBtn = root.findByProps({ testID: 'manage-plan-btn' });
    expect(manageBtn).toBeDefined();
    expect(manageBtn.props.hitSlop).toEqual({ top: 8, bottom: 8, left: 8, right: 8 });
    expect(manageBtn.props.accessibilityRole).toBe('link');
  });

  test('TASK-P12-02-MON: Bezpiecznie renderuje przy braku subscriptionTier (undefined/null) oraz stosuje polską odmianę parzeń', () => {
    let tree: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(
        <PassSettingsCard
          isSubscribed={true}
          subscriptionTier={undefined as any}
          accessStatus="subscribed"
          brewsRemaining={0}
          onOpenPassModal={jest.fn()}
          t={t}
        />
      );
    });

    const str = JSON.stringify(tree!.toJSON());
    expect(str).toContain('"children":["PRO"," PRO"]');

    // Odmiana 5 parzeń
    renderer.act(() => {
      tree = renderer.create(
        <PassSettingsCard
          isSubscribed={false}
          subscriptionTier="none"
          accessStatus="trial_active"
          brewsRemaining={5}
          onOpenPassModal={jest.fn()}
          t={t}
        />
      );
    });
    const str5 = JSON.stringify(tree!.toJSON());
    expect(str5).toContain('TRIAL');
    expect(str5).toContain('parzeń');
  });
  test('TASK-P22-04-STU: Kontrolki subskrypcji w PassSettingsCard deklarują accessibilityHint', () => {
    let tree: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(
        <PassSettingsCard
          isSubscribed={true}
          subscriptionTier="annual"
          accessStatus="subscribed"
          brewsRemaining={0}
          onOpenPassModal={jest.fn()}
          t={t}
        />
      );
    });

    const root = tree!.root;
    const openBtn = root.findByProps({ testID: 'open-apps4brew-pass-btn' });
    const manageBtn = root.findByProps({ testID: 'manage-plan-btn' });

    expect(openBtn.props.accessibilityHint).toBeDefined();
    expect(manageBtn.props.accessibilityHint).toBeDefined();
  });
});

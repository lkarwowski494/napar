// ============================================================================
// Napar (Steepwise) — PassSettingsCard: stany darmowego limitu i Pro (model M5 S1)
// ============================================================================

import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { PassSettingsCard } from '../PassSettingsCard';
import { useTranslation } from '../../../core/i18n';

function Harness(props: { isPro: boolean; monthDaysUsed: number; freeDaysPerMonth?: number }) {
  const { t } = useTranslation();
  return (
    <PassSettingsCard
      isPro={props.isPro}
      monthDaysUsed={props.monthDaysUsed}
      freeDaysPerMonth={props.freeDaysPerMonth ?? 7}
      onOpenPassModal={jest.fn()}
      t={t}
    />
  );
}

function render(props: { isPro: boolean; monthDaysUsed: number }) {
  let tree: any;
  act(() => {
    tree = renderer.create(<Harness {...props} />);
  });
  return JSON.stringify(tree.toJSON());
}

describe('PassSettingsCard: stan darmowego limitu i Pro', () => {
  test('darmowy poziom: znacznik licznika dni z limitem', () => {
    const str = render({ isPro: false, monthDaysUsed: 3 });
    expect(str).toContain('DARMOWY 3/7');
    expect(str).not.toContain('LIMIT WYCZERPANY');
  });

  test('wyczerpany limit: znacznik blokady', () => {
    const str = render({ isPro: false, monthDaysUsed: 7 });
    expect(str).toContain('LIMIT WYCZERPANY');
  });

  test('Pro: znacznik PRO i przycisk zarządzania planem', () => {
    const str = render({ isPro: true, monthDaysUsed: 9 });
    expect(str).toContain('PRO');
    expect(str).toContain('Licencja Aktywna');
  });
});

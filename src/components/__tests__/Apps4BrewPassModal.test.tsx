// ============================================================================
// Napar (Steepwise) — Apps4BrewPassModal Component Tests
// Etap 4a: zakup nie jest podpięty, więc plany i przywracanie pokazują „zakup niedostępny”
// (bez fałszywego sukcesu). Karta statusu pokazuje dni darmowego poziomu (model M5 S1).
// ============================================================================

import React from 'react';
import { Alert } from 'react-native';
import renderer, { act } from 'react-test-renderer';
import { Apps4BrewPassModal } from '../Apps4BrewPassModal';
import { FREE_BREW_DAYS_SETTING_KEY } from '../../core/repositories/brew-access';
import { exhaustedFreeBrewDaysValue, freeBrewDaysValue } from '../../../tests/helpers/free-brew-days';

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

const UNAVAILABLE_TITLE = 'Zakup niedostępny';
const UNAVAILABLE_MSG = 'Zakupy w aplikacji nie są jeszcze dostępne w tej wersji. Darmowy poziom działa bez zmian.';

function renderModal(props: Partial<React.ComponentProps<typeof Apps4BrewPassModal>> = {}) {
  let tree: any;
  act(() => {
    tree = renderer.create(
      <Apps4BrewPassModal visible={true} onClose={jest.fn()} {...props} />
    );
  });
  return tree;
}

describe('Apps4BrewPassModal Component', () => {
  beforeEach(() => {
    mockDb.app_settings.clear();
    jest.restoreAllMocks();
  });

  test('Renderuje plany cenowe ($0.99, $4.99, $14.99) i gwarancję historii', () => {
    const tree = renderModal();
    const str = JSON.stringify(tree.toJSON());
    expect(str).toContain('$0.99');
    expect(str).toContain('$4.99');
    expect(str).toContain('$14.99');
    expect(str).toContain('APPS4BREW PASS');
    expect(str).toContain('Historia parzeń, edycja, eksport i kopia są ZAWSZE bezpłatne.');
  });

  test('darmowy poziom: pokazuje ile dni zostało i co dokładnie się blokuje', () => {
    mockDb.app_settings.set(FREE_BREW_DAYS_SETTING_KEY, freeBrewDaysValue(2));
    const str = JSON.stringify(renderModal().toJSON());
    expect(str).toContain('Darmowy poziom: 2 z 7 dni parzenia w tym miesiącu. Zostało: 5.');
    expect(str).toContain('Po wyczerpaniu limitu blokujemy tylko rozpoczęcie parzenia timerem');
  });

  test('wyczerpany limit: komunikat o blokadzie zamiast zwykłego statusu', () => {
    mockDb.app_settings.set(FREE_BREW_DAYS_SETTING_KEY, exhaustedFreeBrewDaysValue());
    const str = JSON.stringify(renderModal().toJSON());
    expect(str).toContain('Limit darmowego poziomu wykorzystany (7 z 7 dni w tym miesiącu)');
    expect(str).not.toContain('Darmowy poziom:');
  });

  test('Pro: brak karty limitu i bloku zakresu', () => {
    mockDb.app_settings.set('is_pro_active', 'true');
    const str = JSON.stringify(renderModal().toJSON());
    expect(str).not.toContain('Darmowy poziom');
    expect(str).not.toContain('Limit darmowego poziomu');
    expect(str).not.toContain('Po wyczerpaniu limitu');
  });

  test('wybór planu rocznego: pokazuje „zakup niedostępny”, nie aktywuje Pro i nie zamyka modala', () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const handleClose = jest.fn();
    const handlePurchaseSuccess = jest.fn();
    const tree = renderModal({ onClose: handleClose, onPurchaseSuccess: handlePurchaseSuccess });

    act(() => tree.root.findByProps({ testID: 'plan-annual-btn' }).props.onPress());

    expect(alertSpy).toHaveBeenCalledWith(UNAVAILABLE_TITLE, UNAVAILABLE_MSG);
    expect(handleClose).not.toHaveBeenCalled();
    expect(handlePurchaseSuccess).not.toHaveBeenCalled();
    expect(mockDb.app_settings.has('is_pro_active')).toBe(false);
  });

  test('wybór planu miesięcznego i dożywotniego: ten sam komunikat, bez zapisu Pro', () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const tree = renderModal();

    act(() => tree.root.findByProps({ testID: 'plan-monthly-btn' }).props.onPress());
    act(() => tree.root.findByProps({ testID: 'plan-lifetime-btn' }).props.onPress());

    expect(alertSpy).toHaveBeenCalledTimes(2);
    expect(alertSpy).toHaveBeenNthCalledWith(1, UNAVAILABLE_TITLE, UNAVAILABLE_MSG);
    expect(mockDb.app_settings.has('is_pro_active')).toBe(false);
  });

  test('Przywrócenie zakupów: także pokazuje „zakup niedostępny” (brak atrapy przywracania)', () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const handleClose = jest.fn();
    const tree = renderModal({ onClose: handleClose });

    act(() => tree.root.findByProps({ testID: 'restore-purchases-btn' }).props.onPress());

    expect(alertSpy).toHaveBeenCalledWith(UNAVAILABLE_TITLE, UNAVAILABLE_MSG);
    expect(handleClose).not.toHaveBeenCalled();
  });

  test('Zamknięcie modala przyciskiem Zamknij wywołuje onClose', () => {
    const handleCloseOnly = jest.fn();
    const tree = renderModal({ onClose: handleCloseOnly });
    act(() => tree.root.findByProps({ testID: 'close-paywall-btn' }).props.onPress());
    expect(handleCloseOnly).toHaveBeenCalled();
  });
});

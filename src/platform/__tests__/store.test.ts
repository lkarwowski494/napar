// ============================================================================
// Napar (Steepwise) — Unit Tests: wybór adaptera sklepu (fałszywy tylko w konfiguracji testowej)
// ============================================================================

import { selectStoreAdapter, STORE_FAKE_FLAG_ON } from '../store';
import { createExpoStoreAdapter } from '../store-expo';
import { createFakeStoreAdapter } from '../store-fake';

jest.mock('../store-expo', () => ({ createExpoStoreAdapter: jest.fn(() => ({ kind: 'expo' })) }));
jest.mock('../store-fake', () => ({ createFakeStoreAdapter: jest.fn(() => ({ kind: 'fake' })) }));

describe('selectStoreAdapter: fałszywy sklep wyłącznie przy EXPO_PUBLIC_STORE_FAKE=1', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('flaga 1 wybiera fałszywy sklep (konfiguracja testowa i E2E)', () => {
    expect(STORE_FAKE_FLAG_ON).toBe('1');
    expect(selectStoreAdapter('1')).toEqual({ kind: 'fake' });
    expect(createFakeStoreAdapter).toHaveBeenCalledTimes(1);
    expect(createExpoStoreAdapter).not.toHaveBeenCalled();
  });

  test('build produkcyjny (brak zmiennej) i każda inna wartość wybierają expo-iap, nigdy fałszywy sklep', () => {
    for (const flag of [undefined, '', '0', 'true', 'yes', ' 1']) {
      expect(selectStoreAdapter(flag)).toEqual({ kind: 'expo' });
    }
    expect(createExpoStoreAdapter).toHaveBeenCalledTimes(6);
    expect(createFakeStoreAdapter).not.toHaveBeenCalled();
  });
});

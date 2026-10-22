// ============================================================================
// Napar (Steepwise) — Unit Tests: port sklepu (rejestr adaptera)
// ============================================================================

import { configureStoreAdapter, getStoreAdapter, type StoreAdapter } from '../store-port';

const stubAdapter: StoreAdapter = {
  listProducts: async () => [],
  purchase: async (productId) => ({ status: 'unavailable', productId }),
  restore: async () => [],
  observe: () => () => undefined,
};

describe('rejestr adaptera sklepu', () => {
  afterEach(() => {
    configureStoreAdapter(null);
  });

  test('bez skonfigurowanego adaptera sklep jest niedostępny (null)', () => {
    expect(getStoreAdapter()).toBeNull();
  });

  test('zwraca adapter podłączony przez platformę i pozwala go odłączyć', () => {
    configureStoreAdapter(stubAdapter);
    expect(getStoreAdapter()).toBe(stubAdapter);
    configureStoreAdapter(null);
    expect(getStoreAdapter()).toBeNull();
  });
});

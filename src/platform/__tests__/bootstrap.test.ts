// ============================================================================
// Napar (Steepwise) — Unit Tests: podłączenie adaptera sklepu na starcie aplikacji
// ============================================================================

const mockSelectStoreAdapter = jest.fn((_flag: string | undefined) => ({ kind: 'expo' }));
const mockConfigureStoreAdapter = jest.fn((_adapter: unknown) => undefined);

jest.mock('../../core/database', () => ({ configureDatabase: jest.fn() }));
jest.mock('../../core/backup', () => ({ configureBackupStorage: jest.fn() }));
jest.mock('../../core/store-port', () => ({ configureStoreAdapter: (adapter: unknown) => mockConfigureStoreAdapter(adapter) }));
jest.mock('../sqlite-adapter', () => ({ openNaparDatabase: jest.fn() }));
jest.mock('../backup-storage', () => ({ expoBackupStorage: {} }));
jest.mock('../store', () => ({ selectStoreAdapter: (flag: string | undefined) => mockSelectStoreAdapter(flag) }));

describe('bootstrap: adapter sklepu wybierany ze zmiennej EXPO_PUBLIC_STORE_FAKE', () => {
  test('przekazuje wartość flagi do wyboru adaptera i podłącza wynik do core', () => {
    jest.isolateModules(() => {
      require('../bootstrap');
    });
    expect(mockSelectStoreAdapter).toHaveBeenCalledWith(process.env.EXPO_PUBLIC_STORE_FAKE);
    expect(mockConfigureStoreAdapter).toHaveBeenCalledWith({ kind: 'expo' });
  });
});

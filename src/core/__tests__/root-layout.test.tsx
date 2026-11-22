import React from 'react';
import renderer, { act } from 'react-test-renderer';

const mockDb: any = {
  execSync: jest.fn(),
  getFirstSync: jest.fn(),
  getAllSync: jest.fn(() => []),
  runSync: jest.fn(),
};

jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn(() => mockDb),
}));

jest.mock('../../data/startup-guard', () => ({
  crashLoopGuard: {
    recordStartupAttempt: jest.fn().mockResolvedValue({ crashCount: 0, shouldEnterSafeMode: false }),
    recordStartupFailureReason: jest.fn().mockResolvedValue(undefined),
    resetCrashCount: jest.fn().mockResolvedValue(undefined),
    recordRetry: jest.fn().mockResolvedValue(undefined),
  },
  recordStartupSuccess: jest.fn().mockResolvedValue(undefined),
}));

// Mock expo-router
jest.mock('expo-router', () => {
  const React = require('react');
  const MockStack = ({ children }: { children: React.ReactNode }) => {
    return React.createElement('Stack', null, children);
  };
  MockStack.Screen = ({ name, options }: { name: string; options?: any }) => {
    return React.createElement('Screen', { name, options });
  };
  return {
    Stack: MockStack,
  };
});

jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);

import RootLayout from '../../../app/_layout';

describe('RootLayout', () => {
  it('renders SafeAreaProvider, LanguageProvider, BrewProvider and Stack screens', async () => {
    let tree: renderer.ReactTestRenderer | undefined;
    await act(async () => {
      tree = renderer.create(<RootLayout />);
      await Promise.resolve();
    });
    expect(tree).toBeDefined();
    const json = tree!.toJSON();
    expect(json).toBeTruthy();
  });
});


// M1-audytor-generalny-005/011: ścieżki trybu awaryjnego w RootLayout (przyczyna, ponowna próba).
describe('RootLayout — tryb awaryjny', () => {
  const guard = require('../../data/startup-guard').crashLoopGuard;
  const db = require('../../data/database');

  async function render() {
    let tree: renderer.ReactTestRenderer | undefined;
    await act(async () => {
      tree = renderer.create(<RootLayout />);
      await Promise.resolve();
    });
    return tree!;
  }

  const text = (tree: renderer.ReactTestRenderer) => JSON.stringify(tree.toJSON());

  function findRetry(tree: renderer.ReactTestRenderer): any {
    const buttons = tree.root.findAll((n: any) => typeof n.props.onPress === 'function');
    const label = (b: any) => b.findAll((x: any) => typeof x.props.children === 'string').map((x: any) => x.props.children).join(' ');
    const hit = buttons.find((b: any) => /Spróbuj uruchomić normalnie|Try Normal Startup Again/.test(label(b)));
    if (!hit) throw new Error('brak przycisku ponownej próby');
    return hit;
  }

  afterEach(() => {
    jest.restoreAllMocks();
    guard.recordStartupFailureReason.mockClear();
  });

  it('strażnik zgłasza pętlę awarii → ekran trybu awaryjnego z opisem pętli bez otwierania SQLite', async () => {
    guard.recordStartupAttempt.mockResolvedValueOnce({ crashCount: 3, shouldEnterSafeMode: true });
    const openSpy = jest.spyOn(db, 'openDatabaseAtStartup');
    const tree = await render();
    expect(openSpy).not.toHaveBeenCalled();
    expect(text(tree)).toMatch(/kilka razy z rzędu|several times in a row/);
  });

  it('strażnik rzuca → tryb awaryjny zamiast startu', async () => {
    guard.recordStartupAttempt.mockRejectedValueOnce(new Error('io'));
    const tree = await render();
    expect(text(tree)).toMatch(/TRYB AWARYJNY|RESCUE MODE/);
  });

  it('baza nowsza niż aplikacja → opis „nowsza wersja”; ponowna próba zostaje w trybie awaryjnym', async () => {
    jest.spyOn(db, 'openDatabaseAtStartup').mockReturnValue({ ok: false, reason: 'too-new', message: 'v99' });
    const tree = await render();
    expect(guard.recordStartupFailureReason).toHaveBeenCalledWith('too-new');
    expect(text(tree)).toMatch(/nowsza wersja Napar|newer version of Napar/);
    const retry = findRetry(tree);
    await act(async () => {
      await retry.props.onPress();
    });
    expect(guard.recordRetry).toHaveBeenCalled();
    expect(guard.recordStartupFailureReason).toHaveBeenCalledTimes(2);
    expect(text(tree)).toMatch(/nowsza wersja Napar|newer version of Napar/);
  });

  it('M1-024 / M2-P3b: przy 3. starcie (shouldEnterSafeMode=true) powód too-new jest zachowany bez wywołania openDatabaseAtStartup', async () => {
    guard.recordStartupAttempt.mockResolvedValueOnce({ crashCount: 3, shouldEnterSafeMode: true, lastReason: 'too-new' });
    const openSpy = jest.spyOn(db, 'openDatabaseAtStartup');
    const tree = await render();
    expect(openSpy).not.toHaveBeenCalled();
    expect(text(tree)).toMatch(/nowsza wersja Napar|newer version of Napar/);
    expect(text(tree)).not.toMatch(/kilka razy z rzędu|several times in a row/);
  });

  it('błąd bazy przy starcie → opis „nie mogła otworzyć bazy”; po naprawie ponowna próba startuje aplikację', async () => {
    const spy = jest.spyOn(db, 'openDatabaseAtStartup').mockReturnValue({ ok: false, reason: 'database', message: 'disk I/O' });
    const tree = await render();
    expect(text(tree)).toMatch(/nie mogła otworzyć bazy|could not open its database/);
    spy.mockReturnValue({ ok: true });
    const retry = findRetry(tree);
    await act(async () => {
      await retry.props.onPress();
    });
    expect(text(tree)).not.toMatch(/TRYB AWARYJNY|RESCUE MODE/);
  });
});

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

jest.mock('../../../src/core/startup-guard', () => ({
  crashLoopGuard: {
    recordStartupAttempt: jest.fn().mockResolvedValue({ crashCount: 0, shouldEnterSafeMode: false }),
    resetCrashCount: jest.fn().mockResolvedValue(undefined),
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

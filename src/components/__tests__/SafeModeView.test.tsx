// ============================================================================
// Napar (Steepwise) — Unit Tests: SafeModeView (TASK-R12-02)
// ============================================================================

import React from 'react';
import renderer from 'react-test-renderer';
import { SafeModeView } from '../SafeModeView';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  shareAsync: jest.fn().mockResolvedValue(true),
}));

jest.mock('expo-file-system', () => ({
  documentDirectory: 'file:///data/user/0/pl.lukasz.napar/files/',
  getInfoAsync: jest.fn(async (path: string) => ({
    exists: true,
  })),
  readDirectoryAsync: jest.fn(async () => ['napar-2026-10-18.json']),
  deleteAsync: jest.fn().mockResolvedValue(undefined),
  readAsStringAsync: jest.fn().mockResolvedValue('{}'),
  writeAsStringAsync: jest.fn().mockResolvedValue(undefined),
}));

describe('SafeModeView Component (TASK-R12-02 / DEC-07)', () => {
  test('Renderuje ekran trybu awaryjnego z przyciskami eksportu w języku polskim', () => {
    const onRetry = jest.fn();
    let tree: any;
    renderer.act(() => {
      tree = renderer.create(<SafeModeView onRetry={onRetry} language="pl" />);
    });
    expect(tree).toBeDefined();
    const str = JSON.stringify(tree.toJSON());
    expect(str).toContain('TRYB AWARYJNY / SAFE MODE');
    expect(str).toContain('Wykryto problem ze startem');
    expect(str).toContain('Eksportuj surową bazę SQLite');
    expect(str).toContain('Eksportuj ostatnią kopię JSON');
    expect(str).toContain('Spróbuj uruchomić normalnie');
    expect(str).toContain('Zresetuj uszkodzoną bazę');
  });

  test('Renderuje ekran trybu awaryjnego z przyciskami eksportu w języku angielskim (TASK-P3-02-NIE)', () => {
    const onRetry = jest.fn();
    let tree: any;
    renderer.act(() => {
      tree = renderer.create(<SafeModeView onRetry={onRetry} language="en" />);
    });
    expect(tree).toBeDefined();
    const str = JSON.stringify(tree.toJSON());
    expect(str).toContain('RESCUE MODE / SAFE MODE');
    expect(str).toContain('Startup Problem Detected');
    expect(str).toContain('Export Raw SQLite Database');
    expect(str).toContain('Export Latest JSON Backup');
    expect(str).toContain('Try Normal Startup Again');
    expect(str).toContain('Reset Damaged Database');
    expect(str).not.toMatch(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/);
  });
});

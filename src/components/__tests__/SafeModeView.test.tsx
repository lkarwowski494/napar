// ============================================================================
// Napar — Unit Tests: SafeModeView (TASK-R12-02)
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
    expect(str).toContain('Zrób kopię ratunkową bazy');
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
    expect(str).toContain('Make Rescue Copy of Database');
    expect(str).toContain('Export Latest JSON Backup');
    expect(str).toContain('Try Normal Startup Again');
    expect(str).toContain('Reset Damaged Database');
    expect(str).not.toMatch(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/);
  });
});

// M1-audytor-generalny-004: ekran używa sprawdzonej kopii (rescue.ts); reset bez kopii jest wstrzymany.
jest.mock('../../data/rescue-expo', () => ({
  deviceRescueContext: jest.fn(() => ({ dbPath: '/x/Library/SQLite/napar.db', rescueDir: '/x/Documents/kopie-ratunkowe' })),
  pathToUri: (p: string) => `file://${p}`,
}));
jest.mock('../../core/rescue', () => ({
  createRescueExport: jest.fn(),
  resetDatabaseSafely: jest.fn(),
}));

describe('SafeModeView — kopia ratunkowa i reset (M1-audytor-generalny-004)', () => {
  const { Alert } = require('react-native');
  const rescue = require('../../core/rescue');

  beforeEach(() => {
    jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    (Alert.alert as jest.Mock).mockClear();
    (Sharing.shareAsync as jest.Mock).mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  function pressByText(tree: any, text: string) {
    const button = tree.root.findAll((n: any) => typeof n.props.onPress === 'function' && JSON.stringify(n.findAllByType(require('react-native').Text).map((t: any) => t.props.children)).includes(text))[0];
    return button.props.onPress();
  }

  test('reset bez udanej kopii pokazuje „Reset wstrzymany” i nie restartuje aplikacji', async () => {
    rescue.resetDatabaseSafely.mockResolvedValue({ ok: false, reason: 'ENOSPC' });
    const onRetry = jest.fn();
    let tree: any;
    renderer.act(() => {
      tree = renderer.create(<SafeModeView onRetry={onRetry} language="pl" />);
    });
    pressByText(tree, 'Zresetuj uszkodzoną bazę');
    const confirmButtons = (Alert.alert as jest.Mock).mock.calls[0][2];
    await renderer.act(async () => {
      await confirmButtons[1].onPress();
    });
    const last = (Alert.alert as jest.Mock).mock.calls.at(-1);
    expect(last[0]).toBe('Reset wstrzymany');
    expect(last[1]).toContain('niczego nie usunięto');
    expect(onRetry).not.toHaveBeenCalled();
  });

  test('kopia powstała, ale usuwanie zawiodło: „Reset nieukończony”, a nie „niczego nie usunięto”', async () => {
    rescue.resetDatabaseSafely.mockResolvedValue({
      ok: false,
      reason: 'still-exists: napar.db-wal',
      backup: { ok: true, kind: 'snapshot', file: '/x/k.db', counts: { sessions: 1, caffeineLogs: 0, inventory: 0, customRecipes: 0 }, rawCopyDir: null },
    });
    const onRetry = jest.fn();
    let tree: any;
    renderer.act(() => {
      tree = renderer.create(<SafeModeView onRetry={onRetry} language="pl" />);
    });
    pressByText(tree, 'Zresetuj uszkodzoną bazę');
    const confirmButtons = (Alert.alert as jest.Mock).mock.calls.at(-1)[2];
    await renderer.act(async () => {
      await confirmButtons[1].onPress();
    });
    const last = (Alert.alert as jest.Mock).mock.calls.at(-1);
    expect(last[0]).toBe('Reset nieukończony');
    expect(last[1]).not.toContain('niczego nie usunięto');
    expect(onRetry).not.toHaveBeenCalled();
  });

  test('eksport udostępnia sprawdzoną kopię i pokazuje liczności', async () => {
    rescue.createRescueExport.mockResolvedValue({
      ok: true,
      kind: 'snapshot',
      file: '/x/Documents/kopie-ratunkowe/napar-kopia.db',
      counts: { sessions: 12, caffeineLogs: 30, inventory: 3, customRecipes: 1 },
      rawCopyDir: null,
    });
    let tree: any;
    renderer.act(() => {
      tree = renderer.create(<SafeModeView onRetry={jest.fn()} language="pl" />);
    });
    await renderer.act(async () => {
      await pressByText(tree, 'Zrób kopię ratunkową bazy');
    });
    expect(Sharing.shareAsync).toHaveBeenCalledWith('file:///x/Documents/kopie-ratunkowe/napar-kopia.db', expect.anything());
    expect(JSON.stringify(tree.toJSON())).toContain('Sesje: 12 · Wpisy kofeiny: 30');
  });
});

describe('SafeModeView — przyczyna trybu awaryjnego (M1-audytor-generalny-005)', () => {
  test.each([
    ['database', 'pl', 'nie mogła otworzyć bazy danych'],
    ['too-new', 'pl', 'Dane zapisała nowsza wersja Napar'],
    ['database', 'en', 'could not open its database'],
    ['too-new', 'en', 'A newer version of Napar saved this data'],
  ] as const)('powód %s (%s) pokazuje właściwy opis', (reason, language, text) => {
    let tree: any;
    renderer.act(() => {
      tree = renderer.create(<SafeModeView onRetry={jest.fn()} language={language} reason={reason} />);
    });
    expect(JSON.stringify(tree.toJSON())).toContain(text);
  });
});

describe('SafeModeView — wybór najnowszej kopii JSON (M1-audytor-generalny-001)', () => {
  const { Alert } = require('react-native');
  const LegacyFS = require('expo-file-system/legacy');

  beforeEach(() => {
    jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    (Alert.alert as jest.Mock).mockClear();
    (Sharing.shareAsync as jest.Mock).mockClear();
    (LegacyFS.getInfoAsync as jest.Mock).mockResolvedValue({ exists: true, isDirectory: true });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  function pressExportJson(tree: any) {
    const button = tree.root.findAll(
      (n: any) =>
        typeof n.props.onPress === 'function' &&
        JSON.stringify(n.findAllByType(require('react-native').Text).map((t: any) => t.props.children)).includes(
          'Eksportuj ostatnią kopię JSON'
        )
    )[0];
    return button.props.onPress();
  }

  test('ignoruje state_corrupt_* i starsze napar-przed-importem-*, wybiera najnowszą kopię napar-* po dacie', async () => {
    (LegacyFS.readDirectoryAsync as jest.Mock).mockResolvedValueOnce([
      'state_corrupt_2026-11-19.json',
      'napar-przed-importem-2026-01-01T10-00-00.json',
      'napar-2026-11-19T12-00-00.json',
    ]);

    let tree: any;
    renderer.act(() => {
      tree = renderer.create(<SafeModeView onRetry={jest.fn()} language="pl" />);
    });

    await renderer.act(async () => {
      await pressExportJson(tree);
    });

    expect(Sharing.shareAsync).toHaveBeenCalledWith(
      'file:///data/user/0/pl.lukasz.napar/files/Backup/napar-2026-11-19T12-00-00.json',
      expect.objectContaining({ mimeType: 'application/json' })
    );
  });

  test('gdy w katalogu Backup są tylko pliki state_corrupt_*, nie udostępnia ich i pokazuje komunikat o braku kopii', async () => {
    (LegacyFS.readDirectoryAsync as jest.Mock).mockResolvedValueOnce([
      'state_corrupt_2026-11-19.json',
      'other-unrelated.json',
    ]);

    let tree: any;
    renderer.act(() => {
      tree = renderer.create(<SafeModeView onRetry={jest.fn()} language="pl" />);
    });

    await renderer.act(async () => {
      await pressExportJson(tree);
    });

    expect(Sharing.shareAsync).not.toHaveBeenCalled();
    expect(Alert.alert).toHaveBeenCalledWith('Brak kopii', expect.any(String));
  });
});


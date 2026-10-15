// ============================================================================
// Napar (Steepwise) — Unit Tests: SettingsScreen (i18n, Backup & Privacy)
// Apps4Brew: 100% Offline-first, Zero login, Free JSON Backup, Language Switch
// ============================================================================

import React from 'react';
import renderer from 'react-test-renderer';
import { Alert } from 'react-native';

const mockDb: any = {
  execSync: jest.fn(),
  getFirstSync: jest.fn(),
  getAllSync: jest.fn(() => []),
  runSync: jest.fn(),
};

jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn(() => mockDb),
}));

import { LanguageProvider } from '../i18n';
import SettingsScreen from '../../../app/settings';
import * as databaseModule from '../database';

const findPressableWithText = (root: any, text: string) => {
  const nodes = root.findAll((n: any) => {
    const c = n.props?.children;
    if (typeof c === 'string' && c.includes(text)) return true;
    if (Array.isArray(c) && c.some((child) => typeof child === 'string' && child.includes(text))) return true;
    return false;
  });
  if (nodes.length === 0) return null;
  let curr = nodes[0];
  while (curr && !curr.props?.onPress) {
    curr = curr.parent;
  }
  return curr;
};

describe('SettingsScreen Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Renderuje ekran ustawień z filozofią Apps4Brew i sekcją językową', () => {
    let tree: any;
    renderer.act(() => {
      tree = renderer.create(
        <LanguageProvider>
          <SettingsScreen />
        </LanguageProvider>
      );
    });

    const json = tree.toJSON();
    expect(json).toBeTruthy();
    const str = JSON.stringify(json);

    expect(str).toContain('Polski (Napar)');
    expect(str).toContain('English (Steepwise)');
    expect(str).toContain('FILOZOFIA APPS4BREW');
    expect(str).toContain('Eksportuj Kopię Zapasową (JSON)');
    expect(str).toContain('Importuj Kopię z Pliku JSON');
    expect(str).toContain('Napar Pro');
  });

  test('Przełącza język interfejsu z polskiego na angielski i z powrotem', () => {
    let tree: any;
    renderer.act(() => {
      tree = renderer.create(
        <LanguageProvider>
          <SettingsScreen />
        </LanguageProvider>
      );
    });

    // 1. Przełącz na język angielski
    const enBtn = findPressableWithText(tree.root, 'English (Steepwise)');
    expect(enBtn).toBeTruthy();

    renderer.act(() => {
      enBtn.props.onPress();
    });

    let str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Language / Język');
    expect(str).toContain('Steepwise requires no login');

    // 2. Przełącz z powrotem na polski
    const plBtn = findPressableWithText(tree.root, 'Polski (Napar)');
    expect(plBtn).toBeTruthy();

    renderer.act(() => {
      plBtn.props.onPress();
    });

    str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Język / Language');
    expect(str).toContain('Napar nie wymaga logowania');
  });

  test('Eksport kopii zapasowej JSON: wywołuje exportAllDataJson i otwiera modal', () => {
    const fakeBackupJson = JSON.stringify({ version: 1, recipes: [], items: [] });
    const exportSpy = jest.spyOn(databaseModule, 'exportAllDataJson').mockReturnValue(fakeBackupJson);

    let tree: any;
    renderer.act(() => {
      tree = renderer.create(
        <LanguageProvider>
          <SettingsScreen />
        </LanguageProvider>
      );
    });

    const exportBtn = findPressableWithText(tree.root, 'Eksportuj Kopię Zapasową (JSON)');
    expect(exportBtn).toBeTruthy();

    renderer.act(() => {
      exportBtn.props.onPress();
    });

    expect(exportSpy).toHaveBeenCalled();

    const str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Kopia Zapasowa (JSON)');
    expect(str).toContain('Zamknij');

    // Zamknij modal
    const closeBtn = findPressableWithText(tree.root, 'Zamknij');
    expect(closeBtn).toBeTruthy();

    renderer.act(() => {
      closeBtn.props.onPress();
    });
  });

  test('Import kopii zapasowej JSON: waliduje puste wejście i importuje poprawny JSON', () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    const importSpy = jest.spyOn(databaseModule, 'importDataJson').mockImplementation(jest.fn());

    let tree: any;
    renderer.act(() => {
      tree = renderer.create(
        <LanguageProvider>
          <SettingsScreen />
        </LanguageProvider>
      );
    });

    // 1. Otwórz modal importu
    const openImportBtn = findPressableWithText(tree.root, 'Importuj Kopię z Pliku JSON');
    expect(openImportBtn).toBeTruthy();

    renderer.act(() => {
      openImportBtn.props.onPress();
    });

    let str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Importuj Dane JSON');

    // 2. Kliknij 'Zaimportuj i Zastąp Dane' przy pustym tekście
    const submitBtn = findPressableWithText(tree.root, 'Zaimportuj i Zastąp Dane');
    expect(submitBtn).toBeTruthy();

    renderer.act(() => {
      submitBtn.props.onPress();
    });

    expect(alertSpy).toHaveBeenCalledWith('Błąd', 'Wklej prawidłowy tekst JSON kopii zapasowej.');

    // 3. Wpisz treść JSON i zaimportuj
    const jsonInput = tree.root.findByProps({ placeholder: '{"version": 1, ...}' });
    expect(jsonInput).toBeTruthy();

    renderer.act(() => {
      jsonInput.props.onChangeText('{"version": 1, "test": true}');
    });

    renderer.act(() => {
      submitBtn.props.onPress();
    });

    expect(importSpy).toHaveBeenCalledWith('{"version": 1, "test": true}');
    expect(alertSpy).toHaveBeenCalledWith(
      'Sukces!',
      'Dane zostały pomyślnie zaimportowane do Twojej lokalnej bazy.'
    );
  });

  test('Aktywuje Napar Pro i przywraca zakupy StoreKit', () => {
    const alertSpy = jest.spyOn(Alert, 'alert');

    let tree: any;
    renderer.act(() => {
      tree = renderer.create(
        <LanguageProvider>
          <SettingsScreen />
        </LanguageProvider>
      );
    });

    // Kliknij opcję zakupu Lifetime
    const lifetimeBtn = findPressableWithText(tree.root, 'LIFETIME');
    expect(lifetimeBtn).toBeTruthy();

    renderer.act(() => {
      lifetimeBtn.props.onPress();
    });

    expect(alertSpy).toHaveBeenCalledWith('Dziękujemy!', 'Dożywotnia licencja Lifetime została aktywowana!');

    let str = JSON.stringify(tree.toJSON());
    expect(str).toContain('AKTYWNY PRO');

    // Kliknij przywrócenie zakupów
    const restoreBtn = findPressableWithText(tree.root, 'Przywróć wcześniejsze zakupy');
    expect(restoreBtn).toBeTruthy();

    renderer.act(() => {
      restoreBtn.props.onPress();
    });

    expect(alertSpy).toHaveBeenCalledWith(
      'Przywracanie zakupów',
      'Sprawdzanie lokalnych uprawnień StoreKit... Twoja licencja jest aktywna.'
    );
  });
});

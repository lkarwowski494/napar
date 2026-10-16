// ============================================================================
// Napar (Steepwise) — Unit Tests: SettingsScreen (i18n, Backup & Privacy)
// Apps4Brew: 100% Offline-first, Zero login, Free JSON Backup, Language Switch
// ============================================================================

import React from 'react';
import renderer from 'react-test-renderer';
import { Alert } from 'react-native';

const mockSettings = new Map<string, string>();

const mockDb: any = {
  settings: mockSettings,
  execSync: jest.fn(),
  getFirstSync: jest.fn((query: string, params?: any[]) => {
    if (query.includes('FROM app_settings WHERE key = ?')) {
      const val = mockSettings.get(params?.[0]);
      return val !== undefined ? { value: val } : null;
    }
    return null;
  }),
  getAllSync: jest.fn(() => []),
  runSync: jest.fn((query: string, params?: any[]) => {
    if (query.includes('INSERT OR REPLACE INTO app_settings')) {
      mockSettings.set(params![0], params![1]);
    }
  }),
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
    mockSettings.clear();
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

    // Otwórz modal Apps4Brew Pass
    const openPassBtn = tree.root.findByProps({ testID: 'open-apps4brew-pass-btn' });
    expect(openPassBtn).toBeTruthy();
    renderer.act(() => {
      openPassBtn.props.onPress();
    });

    // Kliknij opcję zakupu Lifetime
    const lifetimeBtn = tree.root.findByProps({ testID: 'plan-lifetime-btn' });
    expect(lifetimeBtn).toBeTruthy();

    renderer.act(() => {
      lifetimeBtn.props.onPress();
    });

    expect(alertSpy).toHaveBeenCalledWith('Dziękujemy!', 'Dożywotnia licencja Lifetime została aktywowana!');

    let str = JSON.stringify(tree.toJSON());
    expect(str).toContain('PRO');

    // Kliknij przywrócenie zakupów (po wcześniejszym zakupie)
    renderer.act(() => {
      openPassBtn.props.onPress();
    });
    const restoreBtn = tree.root.findByProps({ testID: 'restore-purchases-btn' });
    expect(restoreBtn).toBeTruthy();

    renderer.act(() => {
      restoreBtn.props.onPress();
    });

    expect(alertSpy).toHaveBeenCalledWith(
      'Przywracanie zakupów',
      expect.stringContaining('Sprawdzanie lokalnych uprawnień StoreKit...')
    );
  });

  test('Eksport dziennika i spiżarni do CSV: wywołuje exportSessionsCsv / exportInventoryCsv i otwiera modal', () => {
    const exportSessionsSpy = jest
      .spyOn(databaseModule, 'exportSessionsCsv')
      .mockReturnValue('id,brewed_at,method\nsess-1,2026-10-15,V60');
    const exportInventorySpy = jest
      .spyOn(databaseModule, 'exportInventoryCsv')
      .mockReturnValue('id,name,type\ninv-1,Etiopia,coffee');

    let tree: any;
    renderer.act(() => {
      tree = renderer.create(
        <LanguageProvider>
          <SettingsScreen />
        </LanguageProvider>
      );
    });

    // 1. Eksport dziennika CSV
    const exportJournalCsvBtn = findPressableWithText(tree.root, 'Eksportuj Dziennik (CSV)');
    expect(exportJournalCsvBtn).toBeTruthy();

    renderer.act(() => {
      exportJournalCsvBtn.props.onPress();
    });

    expect(exportSessionsSpy).toHaveBeenCalled();
    let str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Eksport Dziennika (CSV)');
    expect(str).toContain('sess-1,2026-10-15,V60');

    // Zamknij modal
    const closeBtn1 = findPressableWithText(tree.root, 'Zamknij');
    renderer.act(() => {
      closeBtn1.props.onPress();
    });

    // 2. Eksport spiżarni CSV
    const exportInventoryCsvBtn = findPressableWithText(tree.root, 'Eksportuj Spiżarnię (CSV)');
    expect(exportInventoryCsvBtn).toBeTruthy();

    renderer.act(() => {
      exportInventoryCsvBtn.props.onPress();
    });

    expect(exportInventorySpy).toHaveBeenCalled();
    str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Eksport Spiżarni (CSV)');
    expect(str).toContain('inv-1,Etiopia,coffee');
  });

  test('Aktywacja planów subskrypcji Pro: Miesięczny oraz Roczny (Trial)', () => {
    const alertSpy = jest.spyOn(Alert, 'alert');

    let tree: any;
    renderer.act(() => {
      tree = renderer.create(
        <LanguageProvider>
          <SettingsScreen />
        </LanguageProvider>
      );
    });

    const openPassBtn = tree.root.findByProps({ testID: 'open-apps4brew-pass-btn' });
    expect(openPassBtn).toBeTruthy();

    // 1. Otwórz modal i kliknij plan MIESIĘCZNY
    renderer.act(() => {
      openPassBtn.props.onPress();
    });
    const monthlyBtn = tree.root.findByProps({ testID: 'plan-monthly-btn' });
    expect(monthlyBtn).toBeTruthy();
    renderer.act(() => {
      monthlyBtn.props.onPress();
    });
    expect(alertSpy).toHaveBeenCalledWith('Dziękujemy!', 'Napar Pro został pomyślnie aktywowany.');

    // 2. Otwórz ponownie i kliknij plan ROCZNY
    renderer.act(() => {
      openPassBtn.props.onPress();
    });
    const annualBtn = tree.root.findByProps({ testID: 'plan-annual-btn' });
    expect(annualBtn).toBeTruthy();
    renderer.act(() => {
      annualBtn.props.onPress();
    });
    expect(alertSpy).toHaveBeenCalledWith(
      'Dziękujemy!',
      'Roczna subskrypcja Napar Pro (14 dni za darmo) została aktywowana.'
    );
  });

  test('Obsługa błędu podczas importu uszkodzonego pliku JSON', () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    jest.spyOn(databaseModule, 'importDataJson').mockImplementation(() => {
      throw new Error('Niepoprawny format danych JSON.');
    });

    let tree: any;
    renderer.act(() => {
      tree = renderer.create(
        <LanguageProvider>
          <SettingsScreen />
        </LanguageProvider>
      );
    });

    // Otwórz modal importu
    renderer.act(() => {
      findPressableWithText(tree.root, 'Importuj Kopię z Pliku JSON')?.props.onPress();
    });

    // Wpisz niepoprawny JSON
    const jsonInput = tree.root.findByProps({ placeholder: '{"version": 1, ...}' });
    renderer.act(() => {
      jsonInput.props.onChangeText('{ bad json :::');
    });

    // Kliknij import
    renderer.act(() => {
      findPressableWithText(tree.root, 'Zaimportuj i Zastąp Dane')?.props.onPress();
    });

    expect(alertSpy).toHaveBeenCalledWith('Błąd importu', 'Niepoprawny format danych JSON.');
  });

  test('Obsługa błędów eksportu JSON i CSV oraz zamykanie modalu importu', () => {
    const alertSpy = jest.spyOn(Alert, 'alert');

    // 1. Błąd eksportu JSON
    jest.spyOn(databaseModule, 'exportAllDataJson').mockImplementation(() => {
      throw new Error('Dysk pełny');
    });

    let tree: any;
    renderer.act(() => {
      tree = renderer.create(
        <LanguageProvider>
          <SettingsScreen />
        </LanguageProvider>
      );
    });

    renderer.act(() => {
      findPressableWithText(tree.root, 'Eksportuj Kopię Zapasową (JSON)')?.props.onPress();
    });
    expect(alertSpy).toHaveBeenCalledWith('Błąd eksportu', 'Dysk pełny');

    // 2. Błąd eksportu CSV sesji
    jest.spyOn(databaseModule, 'exportSessionsCsv').mockImplementation(() => {
      throw new Error('Błąd odczytu sesji');
    });
    renderer.act(() => {
      findPressableWithText(tree.root, 'Eksportuj Dziennik (CSV)')?.props.onPress();
    });
    expect(alertSpy).toHaveBeenCalledWith('Błąd eksportu', 'Błąd odczytu sesji');

    // 3. Błąd eksportu CSV spiżarni
    jest.spyOn(databaseModule, 'exportInventoryCsv').mockImplementation(() => {
      throw new Error('Błąd odczytu spiżarni');
    });
    renderer.act(() => {
      findPressableWithText(tree.root, 'Eksportuj Spiżarnię (CSV)')?.props.onPress();
    });
    expect(alertSpy).toHaveBeenCalledWith('Błąd eksportu', 'Błąd odczytu spiżarni');

    // 4. Zamknięcie modalu importu przyciskiem "Anuluj"
    renderer.act(() => {
      findPressableWithText(tree.root, 'Importuj Kopię z Pliku JSON')?.props.onPress();
    });
    const cancelBtn = findPressableWithText(tree.root, 'Anuluj');
    expect(cancelBtn).toBeTruthy();
    renderer.act(() => {
      cancelBtn.props.onPress();
    });
  });

  test('Wybiera domyślny młynek i zapisuje preferencję w bazie', () => {
    let tree: any;
    renderer.act(() => {
      tree = renderer.create(
        <LanguageProvider>
          <SettingsScreen />
        </LanguageProvider>
      );
    });

    const odeOption = findPressableWithText(tree.root, 'Fellow Ode Gen 2');
    expect(odeOption).toBeTruthy();

    renderer.act(() => {
      odeOption?.props.onPress();
    });

    expect(mockDb.runSync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT OR REPLACE INTO app_settings'),
      ['default_grinder', 'fellow_ode_gen2']
    );
  });

  test('Przełącza układ jednostek miar (Metric / Imperial) i zapisuje w bazie', () => {
    let tree: any;
    renderer.act(() => {
      tree = renderer.create(
        <LanguageProvider>
          <SettingsScreen />
        </LanguageProvider>
      );
    });

    const imperialBtn = tree.root.findByProps({ testID: 'unit-imperial-btn' });
    expect(imperialBtn).toBeTruthy();

    renderer.act(() => {
      imperialBtn.props.onPress();
    });

    expect(mockDb.runSync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT OR REPLACE INTO app_settings'),
      ['unit_system', 'imperial']
    );

    const metricBtn = tree.root.findByProps({ testID: 'unit-metric-btn' });
    renderer.act(() => {
      metricBtn.props.onPress();
    });

    expect(mockDb.runSync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT OR REPLACE INTO app_settings'),
      ['unit_system', 'metric']
    );
  });

  test('Przełącza komunikaty głosowe VoiceOver i haptykę oraz zapisuje w bazie', () => {
    let tree: any;
    renderer.act(() => {
      tree = renderer.create(
        <LanguageProvider>
          <SettingsScreen />
        </LanguageProvider>
      );
    });

    const voiceBtn = tree.root.findByProps({ testID: 'toggle-voice-btn' });
    expect(voiceBtn).toBeTruthy();

    renderer.act(() => {
      voiceBtn.props.onPress();
    });

    expect(mockDb.runSync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT OR REPLACE INTO app_settings'),
      ['voice_announce_enabled', 'false']
    );

    const hapticsBtn = tree.root.findByProps({ testID: 'toggle-haptics-btn' });
    expect(hapticsBtn).toBeTruthy();

    renderer.act(() => {
      hapticsBtn.props.onPress();
    });

    expect(mockDb.runSync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT OR REPLACE INTO app_settings'),
      ['haptics_enabled', 'false']
    );
  });

  test('D-02 & BR-KOF-003: Renderuje i modyfikuje metabolizm kofeiny oraz godzinę snu w Ustawieniach', () => {
    let tree: any;
    renderer.act(() => {
      tree = renderer.create(
        <LanguageProvider>
          <SettingsScreen />
        </LanguageProvider>
      );
    });

    let str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Metabolizm Kofeiny & Sen (D-02)');
    expect(str).toContain('Czas Półtrwania Kofeiny (t₁/₂)');
    expect(str).toContain('5.0h');
    expect(str).toContain('Docelowa Godzina Snu');
    expect(str).toContain('23:00');

    // Kliknij '+' dla czasu półtrwania
    const incHalfLifeBtn = tree.root.findByProps({ accessibilityLabel: 'Zwiększ czas półtrwania' });
    renderer.act(() => {
      incHalfLifeBtn.props.onPress();
    });

    expect(mockDb.runSync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT OR REPLACE INTO app_settings'),
      ['caffeine_half_life_hours', '5.5']
    );

    // Kliknij '-' dla czasu półtrwania
    const decHalfLifeBtn = tree.root.findByProps({ accessibilityLabel: 'Zmniejsz czas półtrwania' });
    renderer.act(() => {
      decHalfLifeBtn.props.onPress();
    });

    expect(mockDb.runSync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT OR REPLACE INTO app_settings'),
      ['caffeine_half_life_hours', '5.0']
    );

    // Kliknij '+' dla godziny snu
    const incBedtimeBtn = tree.root.findByProps({ accessibilityLabel: 'Późniejsza godzina snu' });
    renderer.act(() => {
      incBedtimeBtn.props.onPress();
    });

    expect(mockDb.runSync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT OR REPLACE INTO app_settings'),
      ['bedtime_hour', '24']
    );

    // Kliknij '-' dla godziny snu
    const decBedtimeBtn = tree.root.findByProps({ accessibilityLabel: 'Wcześniejsza godzina snu' });
    renderer.act(() => {
      decBedtimeBtn.props.onPress();
    });

    expect(mockDb.runSync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT OR REPLACE INTO app_settings'),
      ['bedtime_hour', '23']
    );
  });

  test('BR-KOF-002: Przełącza synchronizację z Apple HealthKit w Ustawieniach', () => {
    let tree: any;
    renderer.act(() => {
      tree = renderer.create(
        <LanguageProvider>
          <SettingsScreen />
        </LanguageProvider>
      );
    });

    const hkBtn = tree.root.findByProps({ testID: 'toggle-healthkit-btn' });
    expect(hkBtn).toBeTruthy();

    renderer.act(() => {
      hkBtn.props.onPress();
    });

    expect(mockDb.runSync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT OR REPLACE INTO app_settings'),
      ['healthkit_sync_enabled', 'true']
    );

    renderer.act(() => {
      hkBtn.props.onPress();
    });

    expect(mockDb.runSync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT OR REPLACE INTO app_settings'),
      ['healthkit_sync_enabled', 'false']
    );
  });
});



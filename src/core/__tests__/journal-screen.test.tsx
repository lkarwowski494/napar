// ============================================================================
// Napar — Unit & Integration Tests: JournalScreen
// Search, filtering, and SCA Sensory Spider Graph verification
// ============================================================================

import React from 'react';
import { Alert, Share } from 'react-native';
import renderer, { act } from 'react-test-renderer';
import JournalScreen from '../../../app/(tabs)/journal';
import { BrewProvider } from '../brew-context';
import { getBrewSessions, deleteBrewSession } from '../../data/database';

const mockPush = jest.fn();
const mockNavigate = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    navigate: mockNavigate,
  }),
  Link: ({ children }: any) => children,
}));

jest.spyOn(Share, 'share').mockImplementation(() => Promise.resolve({ action: 'sharedAction' } as any));

jest.mock('../../data/database', () => ({
  getBrewSessions: jest.fn(),
  deleteBrewSession: jest.fn(),
  getRecipes: jest.fn(() => []),
  getInventoryItems: jest.fn(() => []),
  getAppSetting: jest.fn(() => null),
  setAppSetting: jest.fn(),
  getHapticsEnabled: jest.fn(() => true),
  getSoundEnabled: jest.fn(() => true),
  setHapticsEnabled: jest.fn(),
  getVoiceAnnounceEnabled: jest.fn(() => true),
  setVoiceAnnounceEnabled: jest.fn(),
  getBeveragePreference: jest.fn(() => 'both'),
  setBeveragePreference: jest.fn(),
  getUnitSystem: jest.fn(() => 'metric'),
}));

const mockSessions = [
  {
    id: 'sess-1',
    recipeName: 'V60 Hoffmann',
    inventoryItemName: 'Etiopia Yirgacheffe',
    beverageType: 'COFFEE',
    method: 'V60',
    doseGrams: 15,
    waterGrams: 250,
    waterTempCelsius: 93,
    totalTimeSeconds: 195,
    rating: 4.8,
    flavorTags: ['brzoskwinia', 'jaśmin'],
    tasteBalance: 'balanced',
    sensory: {
      acidity: 4,
      sweetness: 5,
      body: 3,
      clarity: 5,
      finish: 4,
    },
    brewedAt: '2026-10-15T10:00:00Z',
  },
  {
    id: 'sess-2',
    recipeName: 'Da Hong Pao Gongfu',
    inventoryItemName: 'Wuyi Oolong',
    beverageType: 'TEA',
    method: 'Gongfu Cha',
    doseGrams: 6,
    waterGrams: 100,
    waterTempCelsius: 95,
    totalTimeSeconds: 45,
    rating: 4.2,
    flavorTags: ['orzech', 'dym'],
    tasteBalance: 'balanced',
    brewedAt: '2026-10-15T12:00:00Z',
  },
];

describe('JournalScreen Integration', () => {
  beforeEach(() => {
    (getBrewSessions as jest.Mock).mockReturnValue(mockSessions);
  });

  test('Renderuje sesje parzenia z wykrytym Spider Graph sensoryki', () => {
    let tree: any;
    act(() => {
      tree = renderer.create(
        <BrewProvider>
          <JournalScreen />
        </BrewProvider>
      );
    });

    const str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Etiopia Yirgacheffe');
    expect(str).toContain('Da Hong Pao Gongfu');
    expect(str).toContain('Wykres Sensoryki SCA (Spider Graph)');
  });

  test('Filtruje listę sesji po wpisaniu frazy wyszukiwania w search bar', () => {
    let tree: any;
    act(() => {
      tree = renderer.create(
        <BrewProvider>
          <JournalScreen />
        </BrewProvider>
      );
    });

    const searchInput = tree.root.findByProps({
      placeholder: 'Szukaj po ziarnach, palarni, metodzie lub nutach...',
    });

    // Wyszukaj tylko po herbacie Oolong
    act(() => {
      searchInput.props.onChangeText('Oolong');
    });

    const str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Da Hong Pao Gongfu');
    expect(str).not.toContain('Etiopia Yirgacheffe');
  });

  test('Filtruje listę po wyborze chipa filtrów Kawa', () => {
    let tree: any;
    act(() => {
      tree = renderer.create(
        <BrewProvider>
          <JournalScreen />
        </BrewProvider>
      );
    });

    const coffeeChip = tree.root.findAll((node: any) => {
      return node.props && typeof node.props.children === 'string' && node.props.children.includes('Kawa');
    })[0];

    expect(coffeeChip).toBeDefined();

    let parent = coffeeChip.parent;
    while (parent && !parent.props.onPress) {
      parent = parent.parent;
    }

    act(() => {
      parent.props.onPress();
    });

    const str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Etiopia Yirgacheffe');
    expect(str).not.toContain('Da Hong Pao Gongfu');
  });

  test('Usuwanie sesji parzenia z potwierdzeniem w Alert.alert', () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    let tree: any;
    act(() => {
      tree = renderer.create(
        <BrewProvider>
          <JournalScreen />
        </BrewProvider>
      );
    });

    const deleteBtn = findPressableWithText(tree.root, 'Usuń');
    expect(deleteBtn).toBeDefined();

    act(() => {
      deleteBtn.props.onPress();
    });

    expect(alertSpy).toHaveBeenCalledWith(
      'Usuń wpis',
      expect.stringContaining('V60 Hoffmann'),
      expect.any(Array)
    );

    // Wywołaj callback potwierdzenia usunięcia
    const buttons = alertSpy.mock.calls[0][2] as any[];
    const confirmBtn = buttons.find((b) => b.text === 'Usuń');
    expect(confirmBtn).toBeDefined();

    act(() => {
      confirmBtn.onPress();
    });

    expect(deleteBrewSession).toHaveBeenCalledWith('sess-1');
    alertSpy.mockRestore();
  });

  test('Przycisk Wyczyść filtry przy braku pasujących wyników wyszukiwania', () => {
    let tree: any;
    act(() => {
      tree = renderer.create(
        <BrewProvider>
          <JournalScreen />
        </BrewProvider>
      );
    });

    const searchInput = tree.root.findByProps({
      placeholder: 'Szukaj po ziarnach, palarni, metodzie lub nutach...',
    });

    // Wpisz frazę niepasującą do niczego
    act(() => {
      searchInput.props.onChangeText('BrakujacaKawaXYZ');
    });

    let str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Wyczyść filtry');

    // Kliknij "Wyczyść filtry"
    const clearBtn = findPressableWithText(tree.root, 'Wyczyść filtry');
    expect(clearBtn).toBeDefined();

    act(() => {
      clearBtn.props.onPress();
    });

    // Powinny znowu być widoczne wszystkie sesje
    str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Etiopia Yirgacheffe');
  });

  test('Ekran pustego dziennika gdy brak zapisanych sesji', () => {
    (getBrewSessions as jest.Mock).mockReturnValue([]);
    let tree: any;
    act(() => {
      tree = renderer.create(
        <BrewProvider>
          <JournalScreen />
        </BrewProvider>
      );
    });

    const str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Brak wpisów w dzienniku');
  });

  test('Przełącza widok na Statystyki & Trendy (Brew Analytics) i wyświetla wolumen, rozkład metod i średni radar', () => {
    let tree: any;
    act(() => {
      tree = renderer.create(
        <BrewProvider>
          <JournalScreen />
        </BrewProvider>
      );
    });

    const analyticsTab = tree.root.findByProps({ testID: 'journal-tab-analytics' });
    expect(analyticsTab).toBeDefined();

    act(() => {
      analyticsTab.props.onPress();
    });

    const str = JSON.stringify(tree.toJSON());
    expect(str).toContain('21g'); // 15g + 6g
    expect(str).toContain('0.3 L'); // 350g / 1000
    expect(str).toContain('4.5'); // (4.8 + 4.2) / 2
    expect(str).toContain('V60');
    expect(str).toContain('Gongfu Cha');
    expect(str).toContain('Kwasowość: 4');
    expect(str).toContain('Słodycz: 5');
    expect(str).toContain('brzoskwinia (1)');

    // Przełącz z powrotem na Sesje
    const sessionsTab = tree.root.findByProps({ testID: 'journal-tab-sessions' });
    act(() => {
      sessionsTab.props.onPress();
    });

    const strBack = JSON.stringify(tree.toJSON());
    expect(strBack).toContain('Etiopia Yirgacheffe');
  });

  test('Przycisk Parz ponownie ładuje recepturę i parametry sesji do asystenta i nawiguje do ekranu głównego', () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    let tree: any;
    act(() => {
      tree = renderer.create(
        <BrewProvider>
          <JournalScreen />
        </BrewProvider>
      );
    });

    const brewAgainBtn = tree.root.findByProps({ testID: 'brew-again-btn-sess-1' });
    expect(brewAgainBtn).toBeDefined();

    act(() => {
      brewAgainBtn.props.onPress();
    });

    expect(mockNavigate).toHaveBeenCalledWith('/');
    expect(alertSpy).toHaveBeenCalledWith('Wczytano parametry', expect.any(String));
    alertSpy.mockRestore();
  });

  test('Przycisk Udostępnij wywołuje Share.share z estetyczną notatką degustacyjną', () => {
    let tree: any;
    act(() => {
      tree = renderer.create(
        <BrewProvider>
          <JournalScreen />
        </BrewProvider>
      );
    });

    const shareBtn = tree.root.findByProps({ testID: 'share-session-btn-sess-1' });
    expect(shareBtn).toBeDefined();

    act(() => {
      shareBtn.props.onPress();
    });

    expect(Share.share).toHaveBeenCalledWith({
      title: expect.stringContaining('V60 Hoffmann'),
      message: expect.stringContaining('15g | Woda: 250g'),
    });
  });

  test('02-monetyzacja-004 / 03-zakres-002 (DEC-01 a): po 15 parzeniach i 15 dniach dziennik nie ma banera tylko do odczytu, a Powtórz Parzenie przechodzi do parzenia', () => {
    const { getAppSetting } = require('../../data/database');
    const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString();
    getAppSetting.mockImplementation((key: string, def: string) => {
      if (key === 'trial_brews_count') return '15';
      if (key === 'trial_started_at') return fifteenDaysAgo;
      if (key === 'is_pro_active') return 'false';
      return def;
    });
    mockNavigate.mockClear();

    let tree: any;
    act(() => {
      tree = renderer.create(
        <BrewProvider>
          <JournalScreen />
        </BrewProvider>
      );
    });

    expect(tree.root.findAllByProps({ testID: 'journal-readonly-banner' })).toHaveLength(0);

    act(() => {
      tree.root.findByProps({ testID: 'brew-again-btn-sess-1' }).props.onPress();
    });

    expect(tree.root.findAllByProps({ testID: 'plan-annual-btn' })).toHaveLength(0);
    expect(mockNavigate).toHaveBeenCalledWith('/');

    getAppSetting.mockImplementation(() => null);
  });

  // M1-audytor-generalny-033 (09-lokalizacja-008): tekst udostępniania w języku interfejsu, temperatura wg jednostek.
  test('09-lokalizacja-008: udostępnienie wpisu w EN i jednostkach imperialnych — bez polskich słów, temperatura w °F', () => {
    const { getAppSetting, getUnitSystem } = require('../../data/database');
    const { LanguageProvider } = require('../i18n');
    getAppSetting.mockImplementation((key: string, def: string) => (key === 'app_language' ? 'en' : def));
    getUnitSystem.mockReturnValue('imperial');
    (getBrewSessions as jest.Mock).mockReturnValue([
      { ...mockSessions[0], flavorTags: ['peach', 'jasmine'], notes: 'Sweet finish', tasteBalance: 'balanced' },
    ]);
    (Share.share as jest.Mock).mockClear();
    let tree: any;
    act(() => {
      tree = renderer.create(
        <LanguageProvider>
          <BrewProvider>
            <JournalScreen />
          </BrewProvider>
        </LanguageProvider>
      );
    });
    act(() => {
      tree.root.findByProps({ testID: 'share-session-btn-sess-1' }).props.onPress();
    });
    const { title, message } = (Share.share as jest.Mock).mock.calls[0][0];
    const text = `${title}\n${message}`;
    expect(text).not.toMatch(/[ąćęłńóśźż]/i);
    expect(text).not.toMatch(/\b(Doza|Woda|Czas|Ziarno|Ocena|Balans|Nuty|Notatki|Data|Parz|Notatka| o )\b/);
    expect(text).toMatch(/Dose: 15g \| Water: 250g \| Temp: 199(\.4)?°F/);
    expect(text).not.toMatch(/°C/);
    expect(title).toBe('V60 Hoffmann · Tasting note');
    getAppSetting.mockImplementation(() => null);
    getUnitSystem.mockReturnValue('metric');
  });
});

function findPressableWithText(root: any, text: string) {
  const match = root.findAll((node: any) => {
    if (!node.props) return false;
    if (typeof node.props.children === 'string' && node.props.children.includes(text)) return true;
    if (Array.isArray(node.props.children)) {
      const full = node.props.children
        .map((c: any) => (typeof c === 'string' || typeof c === 'number' ? String(c) : ''))
        .join('');
      if (full.includes(text)) return true;
    }
    return false;
  })[0];
  if (!match) return null;
  let curr = match;
  while (curr && !curr.props?.onPress) {
    curr = curr.parent;
  }
  return curr;
}

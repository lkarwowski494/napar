// ============================================================================
// Napar (Steepwise) — Unit & Integration Tests: JournalScreen
// Search, filtering, and SCA Sensory Spider Graph verification
// ============================================================================

import React from 'react';
import { Alert, Share } from 'react-native';
import renderer, { act } from 'react-test-renderer';
import { exhaustedFreeBrewDaysValue } from '../../../tests/helpers/free-brew-days';
import JournalScreen from '../../../app/(tabs)/journal';
import { BrewProvider } from '../brew-context';
import { getBrewSessions, deleteBrewSession } from '../database';

const mockPush = jest.fn();
const mockNavigate = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    navigate: mockNavigate,
  }),
  Link: ({ children }: any) => children,
}));

jest.mock('../../platform/tasting-card-share', () => ({
  shareTastingCardImage: jest.fn(() => Promise.resolve()),
}));

jest.spyOn(Share, 'share').mockImplementation(() => Promise.resolve({ action: 'sharedAction' } as any));

jest.mock('../database', () => ({
  getBrewSessions: jest.fn(),
  deleteBrewSession: jest.fn(),
  getRecipes: jest.fn(() => []),
  getInventoryItems: jest.fn(() => []),
  getAppSetting: jest.fn(() => null),
  setAppSetting: jest.fn(),
  getHapticsEnabled: jest.fn(() => true),
  setHapticsEnabled: jest.fn(),
  getVoiceAnnounceEnabled: jest.fn(() => true),
  setVoiceAnnounceEnabled: jest.fn(),
  getBeveragePreference: jest.fn(() => 'both'),
  setBeveragePreference: jest.fn(),
  getGrinderCalibrationStatus: jest.fn(() => ({ shiftClicks: 0, pairCount: 0, isActive: false })),
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

  test('Przycisk Udostępnij otwiera kartę degustacyjną i udostępnia ją jako PNG (poz. 31)', async () => {
    const { shareTastingCardImage } = require('../../platform/tasting-card-share');
    shareTastingCardImage.mockClear();
    shareTastingCardImage.mockImplementation(() => Promise.resolve());
    (Share.share as jest.Mock).mockClear();

    let tree: any;
    act(() => {
      tree = renderer.create(
        <BrewProvider>
          <JournalScreen />
        </BrewProvider>
      );
    });

    const shareBtn = tree.root.findByProps({ testID: 'share-session-btn-sess-1' });
    act(() => {
      shareBtn.props.onPress();
    });

    const capture = tree.root.findByProps({ testID: 'tasting-card-capture' });
    await act(async () => {
      capture.props.onLayout();
    });

    expect(shareTastingCardImage).toHaveBeenCalledWith(expect.anything(), expect.any(String));
    expect(Share.share).not.toHaveBeenCalled();
    expect(tree.root.findAllByProps({ testID: 'tasting-card-export' })).toHaveLength(0);
  });

  test('Gdy zapis karty się nie udaje, Udostępnij wraca do notatki tekstowej (Share.share)', async () => {
    const { shareTastingCardImage } = require('../../platform/tasting-card-share');
    shareTastingCardImage.mockClear();
    shareTastingCardImage.mockImplementation(() => Promise.reject(new Error('brak widoku')));
    (Share.share as jest.Mock).mockClear();

    let tree: any;
    act(() => {
      tree = renderer.create(
        <BrewProvider>
          <JournalScreen />
        </BrewProvider>
      );
    });

    act(() => {
      tree.root.findByProps({ testID: 'share-session-btn-sess-1' }).props.onPress();
    });
    const capture = tree.root.findByProps({ testID: 'tasting-card-capture' });
    await act(async () => {
      capture.props.onLayout();
    });

    expect(Share.share).toHaveBeenCalledWith({
      title: expect.stringContaining('V60 Hoffmann'),
      message: expect.stringContaining('15g | Woda: 250g'),
    });
  });

  test('Wyczerpany limit: dziennik bez banera tylko do odczytu, Powtórz Parzenie ładuje parametry bez Paywalla', () => {
    const { getAppSetting } = require('../database');
    getAppSetting.mockImplementation((key: string, def: string) => {
      if (key === 'free_brew_days') return exhaustedFreeBrewDaysValue();
      if (key === 'is_pro_active') return 'false';
      return def;
    });

    let tree: any;
    act(() => {
      tree = renderer.create(
        <BrewProvider>
          <JournalScreen />
        </BrewProvider>
      );
    });

    // Historia jest zawsze dostępna: brak banera ochrony i brak Paywalla
    expect(tree.root.findAllByProps({ testID: 'journal-readonly-banner' })).toHaveLength(0);

    const brewAgainBtn = tree.root.findByProps({ testID: 'brew-again-btn-sess-1' });
    act(() => {
      brewAgainBtn.props.onPress();
    });
    expect(tree.root.findAllByProps({ testID: 'plan-annual-btn' })).toHaveLength(0);
    expect(mockNavigate).toHaveBeenCalledWith('/');

    getAppSetting.mockImplementation(() => null);
  });

  test('BPR Pillar 5: 1-Tap Execute z Harmonogramu Akcji w JournalScreen ładuje parametry i nawiguje do Parzenia', () => {
    const { getInventoryItems, getAppSetting } = require('../database');
    getInventoryItems.mockImplementation(() => [
      {
        id: 'inv-peak-1',
        name: 'Kenya AA Peak',
        type: 'coffee',
        roastOrHarvestDate: new Date(Date.now() - 10 * 86400000).toISOString().slice(0, 10),
        recommendedMethod: 'V60',
        initialWeightGrams: 250,
        remainingWeightGrams: 200,
        flavorNotes: [],
        isFavorite: true,
        isArchived: false,
        createdAt: '2026-10-01',
        updatedAt: '2026-10-01',
      },
    ]);

    let tree: any;
    act(() => {
      tree = renderer.create(
        <BrewProvider>
          <JournalScreen />
        </BrewProvider>
      );
    });

    const peakBtn = tree.root.findByProps({
      testID: 'execute-action-btn-action-peak-now-inv-peak-1',
    });
    act(() => {
      peakBtn.props.onPress();
    });
    expect(mockNavigate).toHaveBeenCalledWith('/');

    // Wyczerpany limit nie blokuje 1-Tap Execute (ładowanie parametrów, bez startu timera)
    getAppSetting.mockImplementation((key: string) => {
      if (key === 'free_brew_days') return exhaustedFreeBrewDaysValue();
      return null;
    });

    let expiredTree: any;
    act(() => {
      expiredTree = renderer.create(
        <BrewProvider>
          <JournalScreen />
        </BrewProvider>
      );
    });

    const expiredExecBtn = expiredTree.root.findByProps({
      testID: 'execute-action-btn-action-peak-now-inv-peak-1',
    });
    act(() => {
      expiredExecBtn.props.onPress();
    });
    expect(expiredTree.root.findAllByProps({ testID: 'plan-annual-btn' })).toHaveLength(0);

    getAppSetting.mockImplementation(() => null);
    getInventoryItems.mockImplementation(() => []);
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

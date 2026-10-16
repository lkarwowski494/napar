// ============================================================================
// Napar (Steepwise) — Unit & Integration Tests: JournalScreen
// Search, filtering, and SCA Sensory Spider Graph verification
// ============================================================================

import React from 'react';
import { Alert } from 'react-native';
import renderer, { act } from 'react-test-renderer';
import JournalScreen from '../../../app/(tabs)/journal';
import { getBrewSessions, deleteBrewSession } from '../database';

jest.mock('../database', () => ({
  getBrewSessions: jest.fn(),
  deleteBrewSession: jest.fn(),
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
      tree = renderer.create(<JournalScreen />);
    });

    const str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Etiopia Yirgacheffe');
    expect(str).toContain('Da Hong Pao Gongfu');
    expect(str).toContain('Wykres Sensoryki SCA (Spider Graph)');
  });

  test('Filtruje listę sesji po wpisaniu frazy wyszukiwania w search bar', () => {
    let tree: any;
    act(() => {
      tree = renderer.create(<JournalScreen />);
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
      tree = renderer.create(<JournalScreen />);
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
      tree = renderer.create(<JournalScreen />);
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
      tree = renderer.create(<JournalScreen />);
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
      tree = renderer.create(<JournalScreen />);
    });

    const str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Brak wpisów w dzienniku');
  });

  test('Przełącza widok na Statystyki & Trendy (Brew Analytics) i wyświetla wolumen, rozkład metod i średni radar', () => {
    let tree: any;
    act(() => {
      tree = renderer.create(<JournalScreen />);
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

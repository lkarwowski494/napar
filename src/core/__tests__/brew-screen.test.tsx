// ============================================================================
// Napar (Steepwise) — Component Integration Tests: BrewScreen & Screens
// ============================================================================

import React from 'react';
import renderer, { act } from 'react-test-renderer';
import BrewScreen from '../../../app/(tabs)/index';
import { BrewProvider } from '../brew-context';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Medium: 'medium', Light: 'light' },
  NotificationFeedbackType: { Success: 'success' },
}));

jest.mock('expo-keep-awake', () => ({
  activateKeepAwakeAsync: jest.fn(),
  deactivateKeepAwake: jest.fn(),
}));

const mockPush = jest.fn();
const mockNavigate = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    navigate: mockNavigate,
  }),
  Link: ({ children }: any) => children,
}));

const mockDb: any = {
  inventory: new Map([
    [
      'bean-1',
      {
        id: 'bean-1',
        name: 'Kolumbia Geisha',
        type: 'coffee',
        roaster_or_producer: 'Kawa Roastery',
        origin: 'Huila',
        initial_weight_g: 250,
        remaining_weight_g: 200,
        flavor_notes_json: '["jaśmin"]',
        is_favorite: 1,
        is_archived: 0,
        created_at: '2026-10-10',
        updated_at: '2026-10-10',
      },
    ],
  ]),
  recipes: new Map([
    [
      'rec-1',
      {
        id: 'rec-1',
        name: 'V60 — Metoda 4:6',
        beverage_type: 'COFFEE',
        method: 'V60',
        author: 'Tetsu Kasuya',
        dose_g: 20,
        water_g: 300,
        water_temp_c: 92,
        recommended_ratio: 15.0,
        steps_json: '[]',
        is_custom: 0,
        is_favorite: 1,
        created_at: '2026-10-10',
      },
    ],
    [
      'rec-custom-1',
      {
        id: 'rec-custom-1',
        name: 'Autorskie V60',
        beverage_type: 'COFFEE',
        method: 'V60',
        author: 'Barista Jan',
        dose_g: 15,
        water_g: 250,
        water_temp_c: 93,
        recommended_ratio: 16.6,
        steps_json: JSON.stringify([
          { namePl: 'Preinfuzja', durationSeconds: 30, targetWaterGrams: 50, instructionPl: 'Wlej 50g' },
          { namePl: 'Drugie zalanie', durationSeconds: 60, targetWaterGrams: 250, instructionPl: 'Dolej do 250g' },
        ]),
        is_custom: 1,
        is_favorite: 0,
        created_at: '2026-10-10',
      },
    ],
  ]),
  sessions: new Map(),
  caffeine: new Map(),
  execSync: jest.fn(),
  getFirstSync: jest.fn((q, p) => {
    if (q.includes('COUNT(*) as count FROM recipes')) return { count: 2 };
    if (q.includes('FROM recipes WHERE id = ?')) return mockDb.recipes.get(p?.[0]) || null;
    return null;
  }),
  getAllSync: jest.fn((q) => {
    if (q.includes('FROM recipes')) return Array.from(mockDb.recipes.values());
    if (q.includes('FROM inventory_items')) return Array.from(mockDb.inventory.values());
    return [];
  }),
  runSync: jest.fn(),
  prepareSync: jest.fn(() => ({
    executeSync: jest.fn(),
    finalizeSync: jest.fn(),
  })),
};

jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn(() => mockDb),
}));

describe('BrewScreen UI Integration', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('Renderuje ekran parzenia z domyślną recepturą Kasuya 4:6', () => {
    let tree: any;
    act(() => {
      tree = renderer.create(
        <BrewProvider>
          <BrewScreen />
        </BrewProvider>
      );
    });

    const json = tree.toJSON();
    expect(json).toBeTruthy();

    const str = JSON.stringify(json);
    expect(str).toContain('V60 — Metoda 4:6');
    expect(str).toContain('ROZPOCZNIJ PARZENIE');
    expect(str).toContain('00:00');
    expect(str).toContain('Porcje');
    expect(str).toContain('1 os.');
    expect(str).toContain('2 os.');
  });

  test('Przełączenie skalowania porcji (2 os.) podwaja dozę i wyświetla rekomendację mielenia', () => {
    let tree: any;
    act(() => {
      tree = renderer.create(
        <BrewProvider>
          <BrewScreen />
        </BrewProvider>
      );
    });

    const twoCupsBtn = tree.root.findAll((node: any) => {
      return node.props && node.props.children === '2 os.';
    })[0];

    expect(twoCupsBtn).toBeDefined();

    let parent = twoCupsBtn.parent;
    while (parent && !parent.props.onPress) {
      parent = parent.parent;
    }

    act(() => {
      parent.props.onPress();
    });

    const str = JSON.stringify(tree.toJSON());
    expect(str).toContain('+2 kliki grubiej');
    expect(str).toContain('40g');
  });

  test('Cykl kontroli stopera: START, PAUZA, WZNÓW i Zakończenie parzenia', () => {
    let tree: any;
    act(() => {
      tree = renderer.create(
        <BrewProvider>
          <BrewScreen />
        </BrewProvider>
      );
    });

    // 1. Kliknij START (ROZPOCZNIJ PARZENIE)
    const startText = tree.root.findAll((node: any) => {
      return node.props && node.props.children === 'ROZPOCZNIJ PARZENIE';
    })[0];
    expect(startText).toBeDefined();

    let startBtn = startText.parent;
    while (startBtn && !startBtn.props.onPress) {
      startBtn = startBtn.parent;
    }

    act(() => {
      startBtn.props.onPress();
    });

    // Po starcie pojawia się przycisk PAUZA
    let str = JSON.stringify(tree.toJSON());
    expect(str).toContain('PAUZA');

    // 2. Kliknij PAUZA
    const pauseText = tree.root.findAll((node: any) => {
      return node.props && node.props.children === 'PAUZA';
    })[0];
    let pauseBtn = pauseText.parent;
    while (pauseBtn && !pauseBtn.props.onPress) {
      pauseBtn = pauseBtn.parent;
    }

    act(() => {
      pauseBtn.props.onPress();
    });

    // Po pauzie pojawia się WZNÓW
    str = JSON.stringify(tree.toJSON());
    expect(str).toContain('WZNÓW');
    expect(str).toContain('Zapisz');

    // 3. Kliknij Zapisz (otwiera modal karty degustacyjnej)
    const saveText = tree.root.findAll((node: any) => {
      return node.props && node.props.children === 'Zapisz';
    })[0];
    let saveBtn = saveText.parent;
    while (saveBtn && !saveBtn.props.onPress) {
      saveBtn = saveBtn.parent;
    }

    act(() => {
      saveBtn.props.onPress();
    });

    // Modal podsumowania parzenia otwarty
    str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Zakończono Parzenie!');
    expect(str).toContain('Wykres Sensoryki SCA (Spider Graph)');
    expect(str).toContain('Zapisz w Dzienniku');

    // 4. Kliknij Zapisz w Dzienniku
    const finishSaveText = tree.root.findAll((node: any) => {
      return node.props && node.props.children === 'Zapisz w Dzienniku';
    })[0];
    let finishSaveBtn = finishSaveText.parent;
    while (finishSaveBtn && !finishSaveBtn.props.onPress) {
      finishSaveBtn = finishSaveBtn.parent;
    }

    act(() => {
      finishSaveBtn.props.onPress();
    });

    expect(mockDb.runSync).toHaveBeenCalled();
  });

  test('Otwarcie modala wyboru receptury i spiżarni', () => {
    let tree: any;
    act(() => {
      tree = renderer.create(
        <BrewProvider>
          <BrewScreen />
        </BrewProvider>
      );
    });

    // Kliknij kafel RECEPTURA
    const recipeCard = tree.root.findByProps({
      accessibilityLabel: 'Wybrany przepis: V60 — Metoda 4:6',
    });

    act(() => {
      recipeCard.props.onPress();
    });

    let str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Wybierz Recepturę');

    // Kliknij kafel SPIŻARNIA
    const pantryCard = tree.root.findByProps({
      accessibilityLabel: 'Wybierz ziarna ze spiżarni',
    });

    act(() => {
      pantryCard.props.onPress();
    });

    str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Wybierz ze Spiżarni');
    expect(str).toContain('Brak przypisania (ogólne)');
  });

  test('Przełącza ulubione receptury (gwiazdka) w modalu wyboru receptury', () => {
    let tree: any;
    act(() => {
      tree = renderer.create(
        <BrewProvider>
          <BrewScreen />
        </BrewProvider>
      );
    });

    // Otwórz modal receptury
    const recipeCard = tree.root.findByProps({
      accessibilityLabel: 'Wybrany przepis: V60 — Metoda 4:6',
    });
    act(() => {
      recipeCard.props.onPress();
    });

    // Znajdź przycisk ulubionych dla receptury
    const favBtn = tree.root.findByProps({
      accessibilityLabel: 'Ulubione: V60 — Metoda 4:6',
    });

    act(() => {
      favBtn.props.onPress({ stopPropagation: jest.fn() });
    });

    expect(mockDb.runSync).toHaveBeenCalled();
  });

  test('Pomiń w modalu podsumowania parzenia resetuje stoper i zamyka modal', () => {
    let tree: any;
    act(() => {
      tree = renderer.create(
        <BrewProvider>
          <BrewScreen />
        </BrewProvider>
      );
    });

    // Start -> Pauza -> Zapisz (otwarcie finish modala)
    const startBtn = findPressableWithText(tree.root, 'ROZPOCZNIJ PARZENIE');
    act(() => {
      startBtn.props.onPress();
    });

    const pauseBtn = findPressableWithText(tree.root, 'PAUZA');
    act(() => {
      pauseBtn.props.onPress();
    });

    const saveBtn = findPressableWithText(tree.root, 'Zapisz');
    act(() => {
      saveBtn.props.onPress();
    });

    expect(JSON.stringify(tree.toJSON())).toContain('Zakończono Parzenie!');

    // Kliknij "Pomiń"
    const skipBtn = findPressableWithText(tree.root, 'Pomiń');
    expect(skipBtn).toBeDefined();
    act(() => {
      skipBtn.props.onPress();
    });

    // Modal zamknięty, stoper zresetowany do stanu idle
    const str = JSON.stringify(tree.toJSON());
    expect(str).toContain('ROZPOCZNIJ PARZENIE');
  });

  test('Wprowadzenie profilu balansu (Za kwaśna, Za gorzka, Wodnista), TDS oraz tagu smaku', () => {
    let tree: any;
    act(() => {
      tree = renderer.create(
        <BrewProvider>
          <BrewScreen />
        </BrewProvider>
      );
    });

    // Start -> Pauza -> Zapisz
    act(() => {
      findPressableWithText(tree.root, 'ROZPOCZNIJ PARZENIE')?.props.onPress();
    });
    act(() => {
      findPressableWithText(tree.root, 'PAUZA')?.props.onPress();
    });
    act(() => {
      findPressableWithText(tree.root, 'Zapisz')?.props.onPress();
    });

    // Przetestuj kliknięcie profili balansu: Za kwaśna, Za gorzka, Wodnista
    const sourChip = findPressableWithText(tree.root, 'Za kwaśna');
    const bitterChip = findPressableWithText(tree.root, 'Za gorzka');
    const weakChip = findPressableWithText(tree.root, 'Wodnista');

    expect(sourChip).toBeDefined();
    expect(bitterChip).toBeDefined();
    expect(weakChip).toBeDefined();

    act(() => {
      sourChip.props.onPress();
    });
    act(() => {
      bitterChip.props.onPress();
    });
    act(() => {
      weakChip.props.onPress();
    });

    // Przetestuj koło smaków toggleTag (włączenie i wyłączenie tagu)
    const flavorWheel = tree.root.findAll(
      (node: any) => typeof node.props?.onToggleDescriptor === 'function'
    )[0];
    if (flavorWheel) {
      act(() => {
        flavorWheel.props.onToggleDescriptor('jaśmin');
      });
      act(() => {
        flavorWheel.props.onToggleDescriptor('jaśmin');
      });
    }

    // Wpisz odczyt TDS
    const tdsInput = tree.root.findByProps({ placeholder: 'np. 1.35' });
    expect(tdsInput).toBeDefined();
    act(() => {
      tdsInput.props.onChangeText('1.40');
    });

    // Zapisz w Dzienniku
    const finishSaveBtn = findPressableWithText(tree.root, 'Zapisz w Dzienniku');
    act(() => {
      finishSaveBtn.props.onPress();
    });

    expect(mockDb.runSync).toHaveBeenCalled();
  });

  test('Steppery dozy kawy (+ / −) zmieniają gramaturę i przeliczają parametry', () => {
    let tree: any;
    act(() => {
      tree = renderer.create(
        <BrewProvider>
          <BrewScreen />
        </BrewProvider>
      );
    });

    const plusBtn = findPressableWithText(tree.root, '+');
    const minusBtn = findPressableWithText(tree.root, '−');
    expect(plusBtn).toBeTruthy();
    expect(minusBtn).toBeTruthy();

    act(() => {
      plusBtn.props.onPress();
    });
    expect(JSON.stringify(tree.toJSON())).toContain('21g');

    act(() => {
      minusBtn.props.onPress();
    });
    expect(JSON.stringify(tree.toJSON())).toContain('20g');
  });

  test('Zamykanie modali wyboru receptury i spiżarni przyciskiem Zamknij', () => {
    let tree: any;
    act(() => {
      tree = renderer.create(
        <BrewProvider>
          <BrewScreen />
        </BrewProvider>
      );
    });

    // 1. Otwórz modal receptury i zamknij
    const recipeCard = tree.root.findByProps({
      accessibilityLabel: 'Wybrany przepis: V60 — Metoda 4:6',
    });
    act(() => {
      recipeCard.props.onPress();
    });
    expect(JSON.stringify(tree.toJSON())).toContain('Wybierz Recepturę');

    const closeRecipeBtn = findPressableWithText(tree.root, 'Zamknij');
    expect(closeRecipeBtn).toBeTruthy();
    act(() => {
      closeRecipeBtn.props.onPress();
    });

    // 2. Otwórz modal spiżarni i zamknij
    const pantryCard = tree.root.findByProps({
      accessibilityLabel: 'Wybierz ziarna ze spiżarni',
    });
    act(() => {
      pantryCard.props.onPress();
    });
    expect(JSON.stringify(tree.toJSON())).toContain('Wybierz ze Spiżarni');

    const closePantryBtn = findPressableWithText(tree.root, 'Zamknij');
    expect(closePantryBtn).toBeTruthy();
    act(() => {
      closePantryBtn.props.onPress();
    });
  });

  test('Wybór paczki kawy ze spiżarni oraz powrót do braku przypisania', () => {
    let tree: any;
    act(() => {
      tree = renderer.create(
        <BrewProvider>
          <BrewScreen />
        </BrewProvider>
      );
    });

    // Otwórz spiżarnię
    const pantryCard = tree.root.findByProps({
      accessibilityLabel: 'Wybierz ziarna ze spiżarni',
    });
    act(() => {
      pantryCard.props.onPress();
    });

    // Wybierz Kolumbia Geisha
    const beanOption = findPressableWithText(tree.root, 'Kolumbia Geisha');
    expect(beanOption).toBeDefined();
    act(() => {
      beanOption.props.onPress();
    });

    // Powinno wyświetlać wybraną kawę na ekranie głównym
    expect(JSON.stringify(tree.toJSON())).toContain('Kolumbia Geisha');

    // Otwórz spiżarnię ponownie i wybierz Brak przypisania (ogólne)
    act(() => {
      pantryCard.props.onPress();
    });

    const unassignedOption = findPressableWithText(tree.root, 'Brak przypisania (ogólne)');
    expect(unassignedOption).toBeDefined();
    act(() => {
      unassignedOption.props.onPress();
    });

    expect(JSON.stringify(tree.toJSON())).toContain('Wybierz ziarna ze spiżarni');
  });

  test('Modal receptur: przejście do tworzenia własnej receptury, edycja receptury autorskiej ołówkiem ✏️ oraz Gongfu Cha', () => {
    mockPush.mockClear();
    let tree: any;
    act(() => {
      tree = renderer.create(
        <BrewProvider>
          <BrewScreen />
        </BrewProvider>
      );
    });

    // Otwórz modal receptur
    const recipeCard = tree.root.findByProps({
      accessibilityLabel: 'Wybrany przepis: V60 — Metoda 4:6',
    });
    act(() => {
      recipeCard.props.onPress();
    });

    // 1. Kliknij "+ Nowa Własna Receptura"
    const addCustomBtn = findPressableWithText(tree.root, '+ Nowa Własna Receptura');
    expect(addCustomBtn).toBeDefined();
    act(() => {
      addCustomBtn.props.onPress();
    });
    expect(mockPush).toHaveBeenCalledWith('/recipe-builder');

    // Otwórz modal ponownie
    act(() => {
      recipeCard.props.onPress();
    });

    // 2. Kliknij "🍵 Gongfu Cha"
    const gongfuBtn = findPressableWithText(tree.root, '🍵 Gongfu Cha');
    expect(gongfuBtn).toBeDefined();
    act(() => {
      gongfuBtn.props.onPress();
    });
    expect(mockPush).toHaveBeenCalledWith('/gongfu');

    // Otwórz modal ponownie
    act(() => {
      recipeCard.props.onPress();
    });

    // 3. Kliknij ołówek ✏️ przy autorskiej recepturze "Autorskie V60"
    const editBtn = findPressableWithText(tree.root, '✏️');
    expect(editBtn).toBeDefined();
    act(() => {
      editBtn.props.onPress({ stopPropagation: jest.fn() });
    });
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/recipe-builder',
      params: { id: 'rec-custom-1' },
    });
  });

  test('Nawigacja kroków stoperem: Dalej ▶, ◀ Wstecz i zakończenie parzenia po ostatnim kroku', () => {
    let tree: any;
    act(() => {
      tree = renderer.create(
        <BrewProvider>
          <BrewScreen />
        </BrewProvider>
      );
    });

    // Rozpocznij parzenie
    act(() => {
      findPressableWithText(tree.root, 'ROZPOCZNIJ PARZENIE')?.props.onPress();
    });

    // Sprawdź czy jesteśmy w kroku 1
    let str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Zalanie 1 (Preinfuzja)');

    // Kliknij Dalej ▶ -> krok 2
    const nextBtn = findPressableWithText(tree.root, 'Dalej ▶');
    expect(nextBtn).toBeDefined();
    act(() => {
      nextBtn.props.onPress();
    });

    str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Zalanie 2');

    // Kliknij ◀ Wstecz -> krok 1
    const prevBtn = findPressableWithText(tree.root, '◀ Wstecz');
    expect(prevBtn).toBeDefined();
    act(() => {
      prevBtn.props.onPress();
    });

    str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Zalanie 1 (Preinfuzja)');

    // Przejdź przez wszystkie kroki aż do ostatniego
    for (let i = 0; i < 4; i++) {
      act(() => {
        findPressableWithText(tree.root, 'Dalej ▶')?.props.onPress();
      });
    }

    str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Zakończ ▶');

    // Kliknij Zakończ ▶
    const finishStepBtn = findPressableWithText(tree.root, 'Zakończ ▶');
    expect(finishStepBtn).toBeDefined();
    act(() => {
      finishStepBtn.props.onPress();
    });

    str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Zakończono Parzenie!');
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

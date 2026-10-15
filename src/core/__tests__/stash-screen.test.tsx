// ============================================================================
// Napar (Steepwise) — Unit Tests: Beans & Leaves Stash / Inventory Screen
// Apps4Brew: 100% Offline-first, Zero login, Resting Window & Freshness Tracking
// ============================================================================

import React from 'react';
import renderer from 'react-test-renderer';
import { Alert } from 'react-native';

const mockDb: any = {
  inventory: new Map(),
  execSync: jest.fn(),
  getFirstSync: jest.fn(),
  getAllSync: jest.fn(() => []),
  runSync: jest.fn(),
};

jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn(() => mockDb),
}));

import { BrewProvider } from '../brew-context';
import BeansScreen from '../../../app/(tabs)/beans';
import * as databaseModule from '../database';

const mockItems: any[] = [
  {
    id: 'bean-1',
    name: 'Etiopia Yirgacheffe Washed',
    type: 'coffee',
    roasterOrProducer: 'HAYB Specialty Coffee',
    origin: 'Etiopia, Yirgacheffe',
    roastOrHarvestDate: new Date(Date.now() - 12 * 86400000).toISOString().slice(0, 10), // 12 dni temu (Peak)
    roastProfile: 'light',
    initialWeightGrams: 250,
    remainingWeightGrams: 180,
    flavorNotes: ['Jaśmin', 'Bergamotka', 'Czarna Herbata'],
    isFavorite: true,
    isArchived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tea-1',
    name: 'Da Hong Pao Rock Tea',
    type: 'tea',
    roasterOrProducer: 'Wuyi Mountains Estate',
    origin: 'Fujian, Chiny',
    roastOrHarvestDate: '2025-05-01',
    initialWeightGrams: 50,
    remainingWeightGrams: 42,
    flavorNotes: ['Orchidea', 'Dym sosnowy'],
    isFavorite: false,
    isArchived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'archived-1',
    name: 'Stara Kolumbia Pusta',
    type: 'coffee',
    roasterOrProducer: 'Palarnia X',
    initialWeightGrams: 250,
    remainingWeightGrams: 0,
    flavorNotes: ['Karmel'],
    isFavorite: false,
    isArchived: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const mockRouterNavigate = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    navigate: mockRouterNavigate,
  }),
}));

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

describe('BeansScreen (Stash & Inventory)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(databaseModule, 'getInventoryItems').mockReturnValue([...mockItems]);
  });

  test('Renderuje listę pozycji w spiżarni z etykietami świeżości', () => {
    let tree: any;
    renderer.act(() => {
      tree = renderer.create(
        <BrewProvider>
          <BeansScreen />
        </BrewProvider>
      );
    });

    const json = tree.toJSON();
    expect(json).toBeTruthy();
    const str = JSON.stringify(json);

    // Nazwy produktów
    expect(str).toContain('Etiopia Yirgacheffe Washed');
    expect(str).toContain('Da Hong Pao Rock Tea');
    // Palarnia
    expect(str).toContain('HAYB Specialty Coffee');
    // Nuty smakowe
    expect(str).toContain('Bergamotka');
    // Pozostała gramatura
    expect(str).toContain('180');
    expect(str).toContain('250');
  });

  test('Filtruje listę wg kategorii (Kawa, Herbata, Archiwum)', () => {
    let tree: any;
    renderer.act(() => {
      tree = renderer.create(
        <BrewProvider>
          <BeansScreen />
        </BrewProvider>
      );
    });

    // Filtruj do samej kawy
    const coffeeBtn = findPressableWithText(tree.root, 'Kawa ☕');
    expect(coffeeBtn).toBeTruthy();

    renderer.act(() => {
      coffeeBtn.props.onPress();
    });

    let str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Etiopia Yirgacheffe Washed');
    expect(str).not.toContain('Da Hong Pao Rock Tea');

    // Filtruj do herbaty
    const teaBtn = findPressableWithText(tree.root, 'Herbata 🍵');
    expect(teaBtn).toBeTruthy();

    renderer.act(() => {
      teaBtn.props.onPress();
    });

    str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Da Hong Pao Rock Tea');
    expect(str).not.toContain('Etiopia Yirgacheffe Washed');

    // Filtruj do archiwum
    const archiveBtn = findPressableWithText(tree.root, 'Archiwum 📦');
    expect(archiveBtn).toBeTruthy();

    renderer.act(() => {
      archiveBtn.props.onPress();
    });

    str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Stara Kolumbia Pusta');
  });

  test('Przełącza ulubione (☆ / ★) oraz archiwizację', () => {
    const saveSpy = jest.spyOn(databaseModule, 'saveInventoryItem').mockImplementation(jest.fn());

    let tree: any;
    renderer.act(() => {
      tree = renderer.create(
        <BrewProvider>
          <BeansScreen />
        </BrewProvider>
      );
    });

    // Znajdź przycisk gwiazdki
    const starBtn = findPressableWithText(tree.root, '★');
    expect(starBtn).toBeTruthy();

    renderer.act(() => {
      starBtn.props.onPress();
    });

    expect(saveSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'bean-1',
        isFavorite: false, // bean-1 miał true, po kliknięciu staje się false
      })
    );

    // Znajdź przycisk archiwizacji 'Archiwizuj'
    const archiveBtn = findPressableWithText(tree.root, 'Archiwizuj');
    expect(archiveBtn).toBeTruthy();

    renderer.act(() => {
      archiveBtn.props.onPress();
    });

    expect(saveSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'bean-1',
        isArchived: true,
      })
    );
  });

  test('Wybiera ziarno do parzenia i nawiguje do minutnika', () => {
    let tree: any;
    renderer.act(() => {
      tree = renderer.create(
        <BrewProvider>
          <BeansScreen />
        </BrewProvider>
      );
    });

    // Znajdź przycisk "☕ Parz z tych ziaren"
    const brewBtn = findPressableWithText(tree.root, 'Parz z tych ziaren');
    expect(brewBtn).toBeTruthy();

    renderer.act(() => {
      brewBtn.props.onPress();
    });

    expect(mockRouterNavigate).toHaveBeenCalledWith('/(tabs)');
  });

  test('Otwiera modal dodawania, waliduje pustą nazwę i zapisuje nową paczkę', () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    const saveSpy = jest.spyOn(databaseModule, 'saveInventoryItem').mockImplementation(jest.fn());

    let tree: any;
    renderer.act(() => {
      tree = renderer.create(
        <BrewProvider>
          <BeansScreen />
        </BrewProvider>
      );
    });

    // 1. Kliknij '+ Dodaj'
    const addBtn = findPressableWithText(tree.root, '+ Dodaj');
    expect(addBtn).toBeTruthy();

    renderer.act(() => {
      addBtn.props.onPress();
    });

    // 2. Spróbuj zapisać pusty formularz
    const saveBtn = findPressableWithText(tree.root, 'Zapisz w Spiżarni');
    expect(saveBtn).toBeTruthy();

    renderer.act(() => {
      saveBtn.props.onPress();
    });

    expect(alertSpy).toHaveBeenCalledWith('Błąd', 'Podaj nazwę kawy lub herbaty.');

    // 3. Wypełnij dane formularza
    const nameInput = tree.root.findByProps({ placeholder: 'np. Etiopia Yirgacheffe Washed' });
    const roasterInput = tree.root.findByProps({ placeholder: 'np. Hard Beans, Coffeedesk, Wuyi Star' });
    const weightInput = tree.root.findByProps({ placeholder: '250' });

    renderer.act(() => {
      nameInput.props.onChangeText('Kenya Nyeri AA');
      roasterInput.props.onChangeText('Coffea Circulor');
      weightInput.props.onChangeText('350');
    });

    // Przełącz typ na herbatę, a potem z powrotem na kawę
    const teaTypeBtn = findPressableWithText(tree.root, 'Herbata liściasta');
    const coffeeTypeBtn = findPressableWithText(tree.root, 'Kawa ziarnista');
    renderer.act(() => {
      teaTypeBtn?.props.onPress();
    });
    renderer.act(() => {
      coffeeTypeBtn?.props.onPress();
    });

    // 4. Kliknij 'Zapisz w Spiżarni'
    renderer.act(() => {
      saveBtn.props.onPress();
    });

    expect(saveSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Kenya Nyeri AA',
        roasterOrProducer: 'Coffea Circulor',
        initialWeightGrams: 350,
        remainingWeightGrams: 350,
      })
    );
    expect(alertSpy).toHaveBeenCalledWith(
      'Dodano!',
      'Paczka "Kenya Nyeri AA" jest gotowa w spiżarni.'
    );
  });

  test('Stan pustej spiżarni wyświetla zachętę i przycisk + Dodaj pierwszą paczkę, który otwiera modal', () => {
    jest.spyOn(databaseModule, 'getInventoryItems').mockReturnValue([]);

    let tree: any;
    renderer.act(() => {
      tree = renderer.create(
        <BrewProvider>
          <BeansScreen />
        </BrewProvider>
      );
    });

    let str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Twoja spiżarnia jest pusta');

    // Kliknij "+ Dodaj pierwszą paczkę"
    const emptyAddBtn = findPressableWithText(tree.root, '+ Dodaj pierwszą paczkę');
    expect(emptyAddBtn).toBeTruthy();

    renderer.act(() => {
      emptyAddBtn.props.onPress();
    });

    str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Dodaj do Spiżarni');
    expect(str).toContain('Nazwa ziaren / herbaty *');
  });

  test('Przycisk Anuluj w modalu dodawania zamyka formularz', () => {
    let tree: any;
    renderer.act(() => {
      tree = renderer.create(
        <BrewProvider>
          <BeansScreen />
        </BrewProvider>
      );
    });

    // Otwórz modal dodawania
    renderer.act(() => {
      findPressableWithText(tree.root, '+ Dodaj')?.props.onPress();
    });

    expect(JSON.stringify(tree.toJSON())).toContain('Dodaj do Spiżarni');

    // Kliknij Anuluj
    const cancelBtn = findPressableWithText(tree.root, 'Anuluj');
    expect(cancelBtn).toBeTruthy();

    renderer.act(() => {
      cancelBtn.props.onPress();
    });

    // Po zamknięciu modala nadal widzimy listę pozycji
    const str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Etiopia Yirgacheffe Washed');
  });

  test('Otwiera i obsługuje interaktywne Kompendium Wiedzy (odmiany, obróbki, terroir, herbata)', () => {
    let tree: any;
    renderer.act(() => {
      tree = renderer.create(
        <BrewProvider>
          <BeansScreen />
        </BrewProvider>
      );
    });

    // 1. Otwórz kompendium z paska głównego
    const compendiumBtn = tree.root.findByProps({ testID: 'compendium-open-button' });
    expect(compendiumBtn).toBeTruthy();

    renderer.act(() => {
      compendiumBtn.props.onPress();
    });

    let str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Kompendium Wiedzy');
    expect(str).toContain('Geisha (Gesha)');

    // 2. Przełącz na zakładkę Obróbki
    const processTabBtn = findPressableWithText(tree.root, 'Obróbki');
    expect(processTabBtn).toBeTruthy();
    renderer.act(() => {
      processTabBtn.props.onPress();
    });
    str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Washed (Mokra / Myta)');
    expect(str).toContain('Carbonic Maceration');

    // 3. Przełącz na zakładkę Terroir
    const terroirTabBtn = findPressableWithText(tree.root, 'Terroir');
    expect(terroirTabBtn).toBeTruthy();
    renderer.act(() => {
      terroirTabBtn.props.onPress();
    });
    str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Etiopia (ET)');
    expect(str).toContain('Kenia (KE)');

    // 4. Przełącz na zakładkę Herbaty
    const teaTabBtn = findPressableWithText(tree.root, 'Herbaty');
    expect(teaTabBtn).toBeTruthy();
    renderer.act(() => {
      teaTabBtn.props.onPress();
    });
    str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Biała Herbata');
    expect(str).toContain('Wulong (Oolong)');

    // 5. Użyj szablonu herbacianego
    const useBtn = findPressableWithText(tree.root, '+ Użyj jako szablon w spiżarni');
    expect(useBtn).toBeTruthy();
    renderer.act(() => {
      useBtn.props.onPress();
    });

    // Po kliknięciu powinien otworzyć się modal dodawania z wypełnionymi danymi
    str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Dodaj do Spiżarni');

    // 6. Zamknij formularz i przetestuj przycisk podpowiedzi wewnątrz Add Modal
    const cancelBtn = findPressableWithText(tree.root, 'Anuluj');
    renderer.act(() => {
      cancelBtn.props.onPress();
    });

    // Ponownie otwórz Add Modal
    renderer.act(() => {
      findPressableWithText(tree.root, '+ Dodaj')?.props.onPress();
    });

    const promptBtn = findPressableWithText(tree.root, 'Szukasz inspiracji?');
    expect(promptBtn).toBeTruthy();
    renderer.act(() => {
      promptBtn.props.onPress();
    });

    // Z powrotem w kompendium
    expect(JSON.stringify(tree.toJSON())).toContain('Kompendium Wiedzy');

    // Przetestuj wyszukiwarkę w kompendium
    const searchInput = tree.root.findByProps({ placeholder: 'Szukaj odmiany, kraju, nuty lub herbaty...' });
    expect(searchInput).toBeTruthy();
    renderer.act(() => {
      searchInput.props.onChangeText('Puerh');
    });

    // Zamknij kompendium przyciskiem Zamknij
    const closeBtn = tree.root.findByProps({ testID: 'compendium-close-button' });
    renderer.act(() => {
      closeBtn.props.onPress();
    });

    expect(JSON.stringify(tree.toJSON())).not.toContain('Odmiany botaniczne, obróbki, terroir i herbaty');
  });
});

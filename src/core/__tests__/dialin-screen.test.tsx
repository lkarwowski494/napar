import React from 'react';
import renderer from 'react-test-renderer';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

import DialInScreen from '../../../app/(tabs)/dialin';

describe('DialInScreen UI with Water Chemistry', () => {
  test('Renderuje ekran DialInScreen z wszystkimi 4 zakładkami', () => {
    let tree: any;
    renderer.act(() => {
      tree = renderer.create(<DialInScreen />);
    });

    const json = tree.toJSON();
    expect(json).toBeTruthy();
    const str = JSON.stringify(json);

    expect(str).toContain('Dial-in Doctor');
    expect(str).toContain('Ratio & Uzysk');
    expect(str).toContain('TDS & EY%');
    expect(str).toContain('Woda SCA');
  });

  test('Przełącza na zakładkę mineralizacji wody SCA', () => {
    let tree: any;
    renderer.act(() => {
      tree = renderer.create(<DialInScreen />);
    });

    const root = tree.root;
    // Znajdź węzeł Text z 'Woda SCA'
    const textNodes = root.findAllByType('Text');
    const waterText = textNodes.find((t: any) => {
      const c = t.props?.children;
      return typeof c === 'string' && (c.includes('Woda SCA') || c.includes('SCA Water'));
    });

    expect(waterText).toBeDefined();

    // Wspinaj się po drzewie rodziców w poszukiwaniu węzła z onPress
    let pressable: any = waterText;
    while (pressable && typeof pressable.props?.onPress !== 'function') {
      pressable = pressable.parent;
    }

    expect(pressable).toBeDefined();
    expect(typeof pressable.props.onPress).toBe('function');

    // Kliknij przycisk
    renderer.act(() => {
      pressable.props.onPress();
    });

    const updatedStr = JSON.stringify(tree.toJSON());
    expect(updatedStr).toContain('Kalkulator Mineralizacji Wody');
    expect(updatedStr).toContain('Barista Hustle 80/40');
    expect(updatedStr).toContain('Koncentrat Bufora');
    expect(updatedStr).toContain('Koncentrat Magnezu');
    expect(updatedStr).toContain('Soda oczyszczona');
  });

  test('Diagnoza problemu w zakładce Doctor (np. Zbyt kwaśna -> Zmiel drobniej)', () => {
    let tree: any;
    renderer.act(() => {
      tree = renderer.create(<DialInScreen />);
    });

    // Znajdź kafelek 'Zbyt kwaśna'
    const sourText = tree.root.findAll((node: any) => {
      const c = node.props?.children;
      return typeof c === 'string' && c.includes('Zbyt kwaśna');
    })[0];

    let pressable = sourText.parent;
    while (pressable && !pressable.props.onPress) {
      pressable = pressable.parent;
    }

    renderer.act(() => {
      pressable.props.onPress();
    });

    const str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Zmiel drobniej');
    expect(str).toContain('Podnieś o +2°C');
  });

  test('Przełącza na zakładkę Ratio & Uzysk, przelicza wodę i uzysk po zmianie dozy oraz presetu', () => {
    let tree: any;
    renderer.act(() => {
      tree = renderer.create(<DialInScreen />);
    });

    // Kliknij zakładkę 'Ratio & Uzysk'
    const ratioTab = tree.root.findAll((n: any) => {
      const c = n.props?.children;
      return typeof c === 'string' && c.includes('Ratio & Uzysk');
    })[0];

    let tabBtn = ratioTab.parent;
    while (tabBtn && !tabBtn.props.onPress) {
      tabBtn = tabBtn.parent;
    }

    renderer.act(() => {
      tabBtn.props.onPress();
    });

    let str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Kalkulator Proporcji');
    expect(str).toContain('WODA DO ZALANIA');

    // Znajdź input dozy (placeholder "18")
    const doseInput = tree.root.findByProps({ placeholder: '18' });

    // Zmień dozę na 20g
    renderer.act(() => {
      doseInput.props.onChangeText('20');
    });

    // Dla 20g i default ratio 16.6: 20 * 16.6 = 332g wody, uzysk = 332 - 40 = 292g
    str = JSON.stringify(tree.toJSON());
    expect(str).toContain('332');
    expect(str).toContain('292');

    // Kliknij preset 1:15 (Mocna)
    const preset15 = tree.root.findAll((n: any) => {
      const c = n.props?.children;
      return typeof c === 'string' && c.includes('1:15');
    })[0];

    let presetBtn = preset15.parent;
    while (presetBtn && !presetBtn.props.onPress) {
      presetBtn = presetBtn.parent;
    }

    renderer.act(() => {
      presetBtn.props.onPress();
    });

    // Dla 20g i ratio 15: 20 * 15 = 300g wody, uzysk = 300 - 40 = 260g
    str = JSON.stringify(tree.toJSON());
    expect(str).toContain('300');
    expect(str).toContain('260');
  });

  test('Przelicznik Młynków w zakładce Ratio: przełącza na Espresso i wyświetla nastawy', () => {
    let tree: any;
    renderer.act(() => {
      tree = renderer.create(<DialInScreen />);
    });

    // Wejdź do zakładki Ratio
    const ratioTab = tree.root.findAll((n: any) => {
      const c = n.props?.children;
      return typeof c === 'string' && c.includes('Ratio & Uzysk');
    })[0];
    let tabBtn = ratioTab.parent;
    while (tabBtn && !tabBtn.props.onPress) {
      tabBtn = tabBtn.parent;
    }
    renderer.act(() => {
      tabBtn.props.onPress();
    });

    // Znajdź chip kategorii 'Espresso (Tradycyjne)'
    const espressoChip = tree.root.findAll((n: any) => {
      const c = n.props?.children;
      return typeof c === 'string' && c.includes('Espresso');
    })[0];

    let chipBtn = espressoChip.parent;
    while (chipBtn && !chipBtn.props.onPress) {
      chipBtn = chipBtn.parent;
    }

    renderer.act(() => {
      chipBtn.props.onPress();
    });

    const str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Comandante C40 MK3/MK4');
    expect(str).toContain('Timemore Chestnut C2 / C3');
    expect(str).toContain('Fellow Ode Gen 2');
  });

  test('Przełącza na zakładkę TDS & EY% i weryfikuje obliczenia ekstrakcji', () => {
    let tree: any;
    renderer.act(() => {
      tree = renderer.create(<DialInScreen />);
    });

    // Przełącz na zakładkę 'TDS & EY%'
    const eyTab = tree.root.findAll((n: any) => {
      const c = n.props?.children;
      return typeof c === 'string' && c.includes('TDS & EY%');
    })[0];

    let tabBtn = eyTab.parent;
    while (tabBtn && !tabBtn.props.onPress) {
      tabBtn = tabBtn.parent;
    }

    renderer.act(() => {
      tabBtn.props.onPress();
    });

    const str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Extraction Yield');
    expect(str).toContain('Woda zalana');
    expect(str).toContain('TDS (%)');
    // Domyślne wartości to water 250, dose 15, TDS 1.35
    // EY = (250 * 1.35) / 15 = 22.5%
    expect(str).toContain('19.8');
    expect(str).toContain('Złote Okno SCA');
  });

  test('Diagnoza problemów w Dial-in Doctor: gorzka, wodnista, ściągająca herbata', () => {
    let tree: any;
    renderer.act(() => {
      tree = renderer.create(<DialInScreen />);
    });

    // 1. Wybierz Za gorzka
    const bitterCard = findPressableWithText(tree.root, 'Za gorzka');
    expect(bitterCard).toBeDefined();
    renderer.act(() => {
      bitterCard.props.onPress();
    });

    let str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Zmiel grubiej');

    // 2. Wybierz Wodnista / płaska
    const weakCard = findPressableWithText(tree.root, 'Płaska / mdła / wodnista');
    expect(weakCard).toBeDefined();
    renderer.act(() => {
      weakCard.props.onPress();
    });

    str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Zwiększ dozę kawy o +1g');

    // 3. Wybierz Herbata ściągająca
    const astringentCard = findPressableWithText(tree.root, 'Herbata ściągająca gardło');
    expect(astringentCard).toBeDefined();
    renderer.act(() => {
      astringentCard.props.onPress();
    });

    str = JSON.stringify(tree.toJSON());
    expect(str).toContain('obniż temperaturę wody o 2-3°C');
  });

  test('Własny profil mineralizacji wody (Custom GH/KH) w zakładce Woda SCA', () => {
    let tree: any;
    renderer.act(() => {
      tree = renderer.create(<DialInScreen />);
    });

    // Przełącz na Woda SCA
    const waterTab = findPressableWithText(tree.root, 'Woda SCA');
    expect(waterTab).toBeDefined();
    renderer.act(() => {
      waterTab.props.onPress();
    });

    // Kliknij "Własny profil (Custom GH / KH)"
    const customProfileBtn = findPressableWithText(tree.root, 'Własny profil (Custom GH / KH)');
    expect(customProfileBtn).toBeDefined();
    renderer.act(() => {
      customProfileBtn.props.onPress();
    });

    // Wpisz custom GH i KH
    const inputs = tree.root.findAllByType('TextInput');
    expect(inputs.length).toBeGreaterThanOrEqual(2);

    // Znajdź input z wartością '80' (default GH) lub zmień pierwszy custom input
    const ghInput = inputs.find((i: any) => i.props.value === '80');
    expect(ghInput).toBeDefined();
    renderer.act(() => {
      ghInput.props.onChangeText('120');
    });

    const khInput = inputs.find((i: any) => i.props.value === '40');
    expect(khInput).toBeDefined();
    renderer.act(() => {
      khInput.props.onChangeText('50');
    });

    const str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Koncentrat Magnezu');
    expect(str).toContain('Koncentrat Bufora');
  });

  test('Diagnoza Doctor: weryfikuje opcje Za gorzka, Płaska oraz Herbata ściągająca', () => {
    let tree: any;
    renderer.act(() => {
      tree = renderer.create(<DialInScreen />);
    });

    // 1. Za gorzka
    const bitterBtn = findPressableWithText(tree.root, 'Za gorzka');
    expect(bitterBtn).toBeTruthy();
    renderer.act(() => {
      bitterBtn.props.onPress();
    });
    let str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Zmiel grubiej');

    // 2. Płaska / mdła / wodnista
    const wateryBtn = findPressableWithText(tree.root, 'Płaska / mdła');
    expect(wateryBtn).toBeTruthy();
    renderer.act(() => {
      wateryBtn.props.onPress();
    });
    str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Zwiększ dozę');

    // 3. Herbata ściągająca
    const astringentBtn = findPressableWithText(tree.root, 'Herbata ściągająca');
    expect(astringentBtn).toBeTruthy();
    renderer.act(() => {
      astringentBtn.props.onPress();
    });
    str = JSON.stringify(tree.toJSON());
    expect(str).toContain('obniż temperaturę');
  });

  test('Zakładka TDS & EY: oblicza niedoparzenie (<18%), przeparzenie (>22%) i obsługuje zerowe wejścia', () => {
    let tree: any;
    renderer.act(() => {
      tree = renderer.create(<DialInScreen />);
    });

    // Przełącz na zakładkę TDS & EY%
    const eyTab = findPressableWithText(tree.root, 'TDS & EY%');
    expect(eyTab).toBeTruthy();
    renderer.act(() => {
      eyTab.props.onPress();
    });

    const inputs = tree.root.findAllByType('TextInput');
    expect(inputs.length).toBeGreaterThanOrEqual(3);

    // Domyślne wartości: woda=250, doza=15, tds=1.35
    // 1. Zerowa doza -> eyResult === null
    renderer.act(() => {
      inputs[1].props.onChangeText('0');
    });
    let str = JSON.stringify(tree.toJSON());
    expect(str).not.toContain('WYDAJNOŚĆ EKSTRAKCJI (EY)');

    // 2. Niedoparzenie: tds=0.8, woda=250, doza=15 -> EY ok. 11.6% (< 18%)
    renderer.act(() => {
      inputs[0].props.onChangeText('250');
      inputs[1].props.onChangeText('15');
      inputs[2].props.onChangeText('0.8');
    });
    str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Niedoparzenie');

    // 3. Przeparzenie: tds=1.8, woda=250, doza=15 -> EY ok. 26% (> 22%)
    renderer.act(() => {
      inputs[2].props.onChangeText('1.8');
    });
    str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Przeparzenie');
  });

  test('Woda SCA: zmiana objętości za pomocą chipów (1L, 2L, 5L) oraz wybór profilu receptury', () => {
    let tree: any;
    renderer.act(() => {
      tree = renderer.create(<DialInScreen />);
    });

    // Przełącz na zakładkę Woda SCA
    const waterTab = findPressableWithText(tree.root, 'Woda SCA');
    expect(waterTab).toBeTruthy();
    renderer.act(() => {
      waterTab.props.onPress();
    });

    // Kliknij chip 1.0 L
    const chip1L = findPressableWithText(tree.root, '1.0 L');
    expect(chip1L).toBeTruthy();
    renderer.act(() => {
      chip1L.props.onPress();
    });

    // Kliknij chip 2.0 L
    const chip2L = findPressableWithText(tree.root, '2.0 L');
    expect(chip2L).toBeTruthy();
    renderer.act(() => {
      chip2L.props.onPress();
    });

    // Kliknij chip 5.0 L
    const chip5L = findPressableWithText(tree.root, '5.0 L');
    expect(chip5L).toBeTruthy();
    renderer.act(() => {
      chip5L.props.onPress();
    });

    // Kliknij inną recepturę wody np. "Standard SCA (Specialty Coffee)"
    const scaRecipeBtn = findPressableWithText(tree.root, 'Standard SCA');
    expect(scaRecipeBtn).toBeTruthy();
    renderer.act(() => {
      scaRecipeBtn.props.onPress();
    });

    const str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Standard SCA');
    expect(str).toContain('68');
  });

  test('Przelicznik młynków: wybór innej kategorii grubości przemiału', () => {
    let tree: any;
    renderer.act(() => {
      tree = renderer.create(<DialInScreen />);
    });

    // Przełącz na zakładkę Ratio & Uzysk
    const ratioTab = findPressableWithText(tree.root, 'Ratio & Uzysk');
    expect(ratioTab).toBeTruthy();
    renderer.act(() => {
      ratioTab.props.onPress();
    });

    // Kliknij chip kategorii "Chemex / Cupping" lub "French Press"
    const catChip = findPressableWithText(tree.root, 'Chemex');
    expect(catChip).toBeTruthy();
    renderer.act(() => {
      catChip.props.onPress();
    });

    const str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Chemex');
  });

  test('BR-KALK-001: Dwukierunkowy kalkulator ratio (Woda -> Doza) oraz preset Gongfu 1:20', () => {
    let tree: any;
    renderer.act(() => {
      tree = renderer.create(<DialInScreen />);
    });

    // Przełącz na zakładkę Ratio
    const ratioTab = findPressableWithText(tree.root, 'Ratio & Uzysk');
    renderer.act(() => {
      ratioTab.props.onPress();
    });

    // Przełącz na kierunek "Woda → Doza"
    const waterToDoseBtn = findPressableWithText(tree.root, 'Woda → Doza');
    expect(waterToDoseBtn).toBeTruthy();
    renderer.act(() => {
      waterToDoseBtn.props.onPress();
    });

    let str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Docelowa objętość wody');
    expect(str).toContain('WYMAGANA DOZA ZIAREN');

    // Znajdź input wody (placeholder "300")
    const waterInput = tree.root.findByProps({ placeholder: '300' });
    expect(waterInput).toBeTruthy();

    // Wpisz 500g wody
    renderer.act(() => {
      waterInput.props.onChangeText('500');
    });

    // 500 / 16.6 = 30.1g dozy, yield = 500 - 30.1 * 2 = 439.8g
    str = JSON.stringify(tree.toJSON());
    expect(str).toContain('30.1g');
    expect(str).toContain('439.8');

    // Wybierz preset Gongfu 1:20
    const gongfuPreset = findPressableWithText(tree.root, '1:20 (Gongfu)');
    expect(gongfuPreset).toBeTruthy();
    renderer.act(() => {
      gongfuPreset.props.onPress();
    });

    // 500 / 20 = 25g dozy, yield = 500 - 25 * 2 = 450g
    str = JSON.stringify(tree.toJSON());
    expect(str).toContain('25g');
    expect(str).toContain('450');

    // Przełącz z powrotem na "Doza → Woda"
    const doseToWaterBtn = findPressableWithText(tree.root, 'Doza → Woda');
    renderer.act(() => {
      doseToWaterBtn.props.onPress();
    });

    str = JSON.stringify(tree.toJSON());
    expect(str).toContain('WODA DO ZALANIA');
  });

  test('Brak kalkulatora kosztu PLN oraz obecność skrótu do kalkulatora kofeiny z poprawną nawigacją', () => {
    let tree: any;
    renderer.act(() => {
      tree = renderer.create(<DialInScreen />);
    });

    const str = JSON.stringify(tree.toJSON());
    // Weryfikacja usunięcia kalkulatora kosztu PLN (decyzja użytkownika)
    expect(str).not.toContain('Kalkulator Kosztu');
    expect(str).not.toContain('Ekonomia Rzemiosła');

    // Weryfikacja kafelka kofeiny
    const caffeineCard = tree.root.findByProps({ testID: 'open-caffeine-from-workshop' });
    expect(caffeineCard).toBeTruthy();

    renderer.act(() => {
      caffeineCard.props.onPress();
    });

    expect(mockPush).toHaveBeenCalledWith('/caffeine');
  });

  test('Tabela młynków w Ratio zawiera skalę uniwersalną µm oraz popularne młynki (Wilfa, Kinu, Eureka)', () => {
    let tree: any;
    renderer.act(() => {
      tree = renderer.create(<DialInScreen />);
    });

    // Przełącz na zakładkę Ratio
    const ratioTab = findPressableWithText(tree.root, 'Ratio & Uzysk');
    expect(ratioTab).toBeTruthy();
    renderer.act(() => {
      ratioTab.props.onPress();
    });

    const str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Inny młynek (Skala uniwersalna µm)');
    expect(str).toContain('Wilfa Svart Aroma / Classic');
    expect(str).toContain('Kinu M47');
    expect(str).toContain('Eureka Mignon');
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

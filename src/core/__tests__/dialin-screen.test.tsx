// ============================================================================
// Napar (Steepwise) — Unit Tests: DialInScreen UI with Water Chemistry
// ============================================================================

import React from 'react';
import renderer from 'react-test-renderer';
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
    expect(str).toContain('22.5');
    expect(str).toContain('Przeparzenie');
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

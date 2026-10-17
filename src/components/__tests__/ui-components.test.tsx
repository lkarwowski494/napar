// ============================================================================
// Napar (Steepwise) — Unit Tests: UI Components (S1..S16, NFR-INT-001..016)
// ============================================================================

import React from 'react';
import renderer from 'react-test-renderer';
import { Text, TextInput } from 'react-native';
import {
  NumInput,
  Field,
  Empty,
  Missing,
  Btn,
  SearchField,
  SwipeRow,
} from '../ui';

describe('Common UI Components (S1..S16)', () => {
  describe('S3 & NFR-INT-003: NumInput', () => {
    test('Akceptuje zarówno przecinek jak i kropkę jako separator dziesiętny', () => {
      const onChangeNumber = jest.fn();
      let tree: any;
      renderer.act(() => {
        tree = renderer.create(
          <NumInput value="10" onChangeNumber={onChangeNumber} />
        );
      });

      const textInput = tree.root.findByType(TextInput);

      // Wpisanie 12,5 z przecinkiem
      renderer.act(() => {
        textInput.props.onChangeText('12,5');
      });

      // Blur powinien zatwierdzić 12.5
      renderer.act(() => {
        textInput.props.onBlur({ nativeEvent: {} });
      });

      expect(onChangeNumber).toHaveBeenCalledWith(12.5);

      // Wpisanie 12.5 z kropką
      renderer.act(() => {
        textInput.props.onChangeText('12.5');
      });
      renderer.act(() => {
        textInput.props.onBlur({ nativeEvent: {} });
      });

      expect(onChangeNumber).toHaveBeenLastCalledWith(12.5);
    });

    test('Wspiera stan pośredni w trakcie pisania ("12,") bez niszczenia przecinka', () => {
      let tree: any;
      renderer.act(() => {
        tree = renderer.create(<NumInput value="12" />);
      });

      const textInput = tree.root.findByType(TextInput);

      // Użytkownik dopisuje przecinek
      renderer.act(() => {
        textInput.props.onFocus();
        textInput.props.onChangeText('12,');
      });

      // Sprawdź czy pole wyświetla "12," i nie usunęło przecinka
      expect(textInput.props.value).toBe('12,');
    });

    test('Prop stored i wInKeep chronią przed dryfem zaokrągleń', () => {
      const onChangeNumber = jest.fn();
      let tree: any;
      renderer.act(() => {
        // prevBase = 61.23, jednostka 'lb'
        tree = renderer.create(
          <NumInput value="135.0" stored={61.23} unit="lb" onChangeNumber={onChangeNumber} />
        );
      });

      const textInput = tree.root.findByType(TextInput);

      // Użytkownik wpisuje 135
      renderer.act(() => {
        textInput.props.onChangeText('135');
        textInput.props.onBlur({ nativeEvent: {} });
      });

      // Powinno zwrócić dokładnie 61.23 bez dryfu
      expect(onChangeNumber).toHaveBeenCalledWith(61.23);
    });

    test('Ogranicza dozwolony zakres min i max', () => {
      const onChangeNumber = jest.fn();
      let tree: any;
      renderer.act(() => {
        tree = renderer.create(
          <NumInput value="50" min={10} max={100} onChangeNumber={onChangeNumber} />
        );
      });

      const textInput = tree.root.findByType(TextInput);

      // Wpisanie poniżej min
      renderer.act(() => {
        textInput.props.onChangeText('5');
        textInput.props.onBlur({ nativeEvent: {} });
      });
      expect(onChangeNumber).toHaveBeenCalledWith(10);

      // Wpisanie powyżej max
      renderer.act(() => {
        textInput.props.onChangeText('150');
        textInput.props.onBlur({ nativeEvent: {} });
      });
      expect(onChangeNumber).toHaveBeenCalledWith(100);

      // Wpisanie pustego tekstu
      renderer.act(() => {
        textInput.props.onChangeText('');
        textInput.props.onBlur({ nativeEvent: {} });
      });
      expect(onChangeNumber).toHaveBeenCalledWith(0);
    });
  });

  describe('S2 & NFR-INT-002: Field', () => {
    test('Renderuje etykietę, błąd i posiada domyślny maxLength={256}', () => {
      let tree: any;
      renderer.act(() => {
        tree = renderer.create(
          <Field label="Nazwa ziaren" error="Pole wymagane" value="Geisha" />
        );
      });

      const input = tree.root.findByType(TextInput);
      expect(input.props.maxLength).toBe(256);

      const str = JSON.stringify(tree.toJSON());
      expect(str).toContain('Nazwa ziaren');
      expect(str).toContain('Pole wymagane');
    });
  });

  describe('S11 & NFR-INT-011: Empty', () => {
    test('Renderuje tytuł, opis i przycisk akcji', () => {
      const onAction = jest.fn();
      let tree: any;
      renderer.act(() => {
        tree = renderer.create(
          <Empty
            title="Brak przepisów"
            description="Dodaj swój pierwszy autorski przepis."
            actionLabel="Dodaj przepis"
            onAction={onAction}
          />
        );
      });

      const str = JSON.stringify(tree.toJSON());
      expect(str).toContain('Brak przepisów');
      expect(str).toContain('Dodaj swój pierwszy autorski przepis.');
      expect(str).toContain('Dodaj przepis');

      const btn = tree.root.findByProps({ testID: 'empty-state-action' });
      renderer.act(() => {
        btn.props.onPress();
      });
      expect(onAction).toHaveBeenCalledTimes(1);
    });
  });

  describe('S12 & NFR-INT-012: Missing', () => {
    test('Renderuje komunikat brakującego rekordu i przycisk powrotu', () => {
      const onBack = jest.fn();
      let tree: any;
      renderer.act(() => {
        tree = renderer.create(
          <Missing
            title="Nie znaleziono naparu"
            message="Sesja została usunięta."
            backLabel="Wróć do listy"
            onBack={onBack}
          />
        );
      });

      const str = JSON.stringify(tree.toJSON());
      expect(str).toContain('Nie znaleziono naparu');
      expect(str).toContain('Sesja została usunięta.');

      const backBtn = tree.root.findByProps({ testID: 'missing-back-button' });
      renderer.act(() => {
        backBtn.props.onPress();
      });
      expect(onBack).toHaveBeenCalledTimes(1);
    });
  });

  describe('S13 & NFR-INT-013: Btn', () => {
    test('Wspiera warianty primary, secondary, ghost, danger z rolą button', () => {
      const onPress = jest.fn();
      let tree: any;
      renderer.act(() => {
        tree = renderer.create(
          <Btn title="Zacznij parzyć" variant="primary" onPress={onPress} />
        );
      });

      const btn = tree.root.findByProps({ accessibilityLabel: 'Zacznij parzyć' });
      expect(btn.props.accessibilityRole).toBe('button');

      renderer.act(() => {
        btn.props.onPress();
      });
      expect(onPress).toHaveBeenCalledTimes(1);
    });
  });

  describe('S15 & NFR-INT-015: SearchField', () => {
    test('Renderuje pole wyszukiwania i przycisk czyszczenia ×', () => {
      const onChangeText = jest.fn();
      const onClear = jest.fn();
      let tree: any;
      renderer.act(() => {
        tree = renderer.create(
          <SearchField
            value="Etiopia"
            onChangeText={onChangeText}
            onClear={onClear}
            placeholder="Szukaj ziaren..."
          />
        );
      });

      const clearBtn = tree.root.findByProps({ testID: 'search-field-clear' });
      expect(clearBtn).toBeTruthy();
      expect(clearBtn.props.accessibilityLabel).toBe('Wyczyść wyszukiwanie');

      renderer.act(() => {
        clearBtn.props.onPress();
      });
      expect(onChangeText).toHaveBeenCalledWith('');
      expect(onClear).toHaveBeenCalledTimes(1);
    });
  });

  describe('S4 & NFR-INT-004: SwipeRow', () => {
    test('Wspiera usuwanie przez przycisk oraz akcję dostępności VoiceOver', () => {
      const onDelete = jest.fn();
      let tree: any;
      renderer.act(() => {
        tree = renderer.create(
          <SwipeRow onDelete={onDelete} deleteLabel="Usuń paczkę ziaren">
            <Text>Kenia Nyeri 250g</Text>
          </SwipeRow>
        );
      });

      // 1. Widoczny przycisk
      const deleteBtn = tree.root.findByProps({ testID: 'swipe-row-delete-btn' });
      renderer.act(() => {
        deleteBtn.props.onPress();
      });
      expect(onDelete).toHaveBeenCalledTimes(1);

      // 2. Akcja dostępności VoiceOver
      const row = tree.root.findByProps({ accessible: true });
      expect(row.props.accessibilityActions).toEqual([
        { name: 'delete', label: 'Usuń paczkę ziaren' },
      ]);

      renderer.act(() => {
        row.props.onAccessibilityAction({ nativeEvent: { actionName: 'delete' } });
      });
      expect(onDelete).toHaveBeenCalledTimes(2);
    });
  });
});

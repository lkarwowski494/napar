// ============================================================================
// Napar (Steepwise) — Testy pickera języka: 35 języków + „Język systemu”
// Nazwy natywne, zaznaczenie bieżącego wyboru, cel dotyku 44 pt, rola radio.
// ============================================================================

import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { StyleSheet } from 'react-native';
import { getTranslations, LANGS, SYSTEM_LANGUAGE } from '../../../core/i18n';
import { nativeLanguageName } from '../../../core/language-names';
import { LANGUAGE_OPTIONS, LanguagePicker } from '../LanguagePicker';

const t = getTranslations('pl');

function render(setting: string, onSelect = jest.fn()) {
  let tree: renderer.ReactTestRenderer | undefined;
  act(() => {
    tree = renderer.create(
      <LanguagePicker t={t} setting={setting as never} onSelect={onSelect} />
    );
  });
  return { tree: tree!, onSelect };
}

/** Węzły hosta (View/Text), nie komponenty złożone, z rolą radio. */
const radioHosts = (tree: renderer.ReactTestRenderer) =>
  tree.root.findAll((n) => typeof n.type === 'string' && n.props.accessibilityRole === 'radio');

const optionById = (tree: renderer.ReactTestRenderer, id: string) =>
  tree.root.find((n) => typeof n.type === 'string' && n.props.testID === `language-option-${id}`);

/** Naciśnięcie: wspinamy się od węzła hosta do Pressable z onPress. */
const pressOption = (tree: renderer.ReactTestRenderer, id: string) => {
  let node: any = optionById(tree, id);
  while (node && !node.props.onPress) node = node.parent;
  act(() => {
    node.props.onPress();
  });
};

describe('LanguagePicker: pozycje', () => {
  test('LANGUAGE_OPTIONS to „system” oraz 35 języków z LANGS', () => {
    expect(LANGUAGE_OPTIONS).toHaveLength(36);
    expect(LANGUAGE_OPTIONS[0]).toBe(SYSTEM_LANGUAGE);
    expect(LANGUAGE_OPTIONS.slice(1)).toEqual([...LANGS]);
  });

  test('renderuje 36 pozycji z rolą radio (35 języków + język systemu)', () => {
    const { tree } = render('system');
    expect(radioHosts(tree)).toHaveLength(36);
    for (const code of LANGS) {
      expect(optionById(tree, code)).toBeTruthy();
    }
    expect(optionById(tree, SYSTEM_LANGUAGE)).toBeTruthy();
  });

  test('każda pozycja ma nazwę natywną jako etykietę VoiceOver, a system etykietę z tłumaczeń', () => {
    const { tree } = render('system');
    expect(optionById(tree, 'de').props.accessibilityLabel).toBe(nativeLanguageName('de'));
    expect(optionById(tree, 'zh-Hant').props.accessibilityLabel).toBe('中文（繁體）');
    expect(optionById(tree, SYSTEM_LANGUAGE).props.accessibilityLabel).toBe(t.settings.languageSystem);
    expect(JSON.stringify(tree.toJSON())).toContain('Język systemu');
  });

  test('każda pozycja ma cel dotyku co najmniej 44 pt', () => {
    const { tree } = render('system');
    for (const host of radioHosts(tree)) {
      const style = StyleSheet.flatten(host.props.style);
      expect(style.minHeight).toBeGreaterThanOrEqual(44);
      expect(style.minWidth).toBeGreaterThanOrEqual(44);
    }
  });
});

describe('LanguagePicker: zaznaczenie i wybór', () => {
  test('zaznacza wyłącznie bieżący wybór (język systemu)', () => {
    const { tree } = render('system');
    expect(optionById(tree, SYSTEM_LANGUAGE).props.accessibilityState).toEqual({ checked: true, selected: true });
    expect(optionById(tree, 'de').props.accessibilityState).toEqual({ checked: false, selected: false });
  });

  test('zaznacza wybrany język z listy', () => {
    const { tree } = render('ja');
    expect(optionById(tree, 'ja').props.accessibilityState).toEqual({ checked: true, selected: true });
    expect(optionById(tree, SYSTEM_LANGUAGE).props.accessibilityState).toEqual({ checked: false, selected: false });
    expect(radioHosts(tree).filter((h) => h.props.accessibilityState.checked)).toHaveLength(1);
  });

  test('naciśnięcie języka przekazuje jego kod do onSelect', () => {
    const { tree, onSelect } = render('system');
    pressOption(tree, 'pt-BR');
    expect(onSelect).toHaveBeenCalledWith('pt-BR');
  });

  test('naciśnięcie „Język systemu” przekazuje „system”', () => {
    const { tree, onSelect } = render('de');
    pressOption(tree, SYSTEM_LANGUAGE);
    expect(onSelect).toHaveBeenCalledWith('system');
  });
});

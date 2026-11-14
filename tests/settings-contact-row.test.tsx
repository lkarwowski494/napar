// M1-audytor-generalny-023 (10-wydanie-001): gdy właściciel wpisze adres w SUPPORT_EMAIL,
// wiersz „Kontakt i Wsparcie” pokazuje ten adres i otwiera wiadomość do niego (bez adresu: strona wsparcia).
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import * as Linking from 'expo-linking';
import SettingsScreen from '../app/settings';

jest.mock('../src/core/app-identity', () => ({
  ...jest.requireActual('../src/core/app-identity'),
  SUPPORT_EMAIL: 'wsparcie@przyklad.test',
}));

describe('Ustawienia — wiersz kontaktu z adresem od właściciela (023)', () => {
  it('z ustawionym SUPPORT_EMAIL pokazuje adres i otwiera mailto z tym adresem', () => {
    const spy = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<SettingsScreen />);
    });
    const row = tree!.root.find(
      (n) => n.props.accessibilityRole === 'link' && /Kontakt i Wsparcie/.test(String(n.props.accessibilityLabel ?? '')) && typeof n.props.onPress === 'function'
    );
    act(() => {
      row.props.onPress();
    });
    expect(spy).toHaveBeenCalledWith('mailto:wsparcie@przyklad.test');
    expect(JSON.stringify(tree!.toJSON())).toContain('wsparcie@przyklad.test');
    spy.mockRestore();
  });
});

// M1-audytor-generalny-022: wiersz „Oceń w App Store” pojawia się dopiero z prawdziwym Apple ID
// i otwiera adres zbudowany z tego ID (bez ID wiersza nie ma — por. tests/release-placeholders.test.ts).
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import * as Linking from 'expo-linking';
import SettingsScreen from '../app/settings';

jest.mock('../src/core/app-identity', () => ({
  ...jest.requireActual('../src/core/app-identity'),
  APP_STORE_ID: '1234567890',
}));

describe('Ustawienia — wiersz oceny w App Store (022)', () => {
  it('z ustawionym APP_STORE_ID pokazuje wiersz i otwiera link do recenzji z tym ID', () => {
    const spy = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<SettingsScreen />);
    });
    const row = tree!.root.find(
      (n) => n.props.accessibilityRole === 'link' && /App Store/.test(String(n.props.accessibilityLabel ?? '')) && typeof n.props.onPress === 'function'
    );
    act(() => {
      row.props.onPress();
    });
    expect(spy).toHaveBeenCalledWith('https://apps.apple.com/app/id1234567890?action=write-review');
    spy.mockRestore();
  });
});

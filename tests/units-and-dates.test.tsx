// M1-audytor-generalny-034 (09-lokalizacja-004): tryb imperialny i formaty w głównym przepływie.
import React from 'react';
import renderer, { act } from 'react-test-renderer';

jest.mock('expo-localization', () => ({ getLocales: jest.fn(() => [{ measurementSystem: 'metric' }]) }));

import * as Localization from 'expo-localization';
import { formatTemperatureDelta, formatClockTime } from '../src/core/unit-converter';
import { regionUnitSystem } from '../lib/region-units';
import { BrewHeader } from '../src/components/brew/BrewHeader';
import { BrewBanners } from '../src/components/brew/BrewBanners';
import { translations, formatTemplate } from '../src/core/i18n';

const textOf = (tree: renderer.ReactTestRenderer): string =>
  tree.root
    .findAll((n) => typeof n.type === 'string')
    .flatMap((n) => [n.props.children, n.props.accessibilityLabel])
    .flat(Infinity)
    .filter((x) => typeof x === 'string' || typeof x === 'number')
    .join(' ');

describe('M1-audytor-generalny-034: °F w trybie imperialnym, daty wg języka, system z regionu', () => {
  test('formatTemperatureDelta: różnica temperatur w jednostkach ustawienia', () => {
    expect(formatTemperatureDelta(2, 'metric')).toBe('2°C');
    expect(formatTemperatureDelta(2, 'imperial')).toBe('4°F');
    expect(formatTemperatureDelta(5, 'imperial')).toBe('9°F');
  });

  test('nagłówek parzenia w trybie imperialnym pokazuje °F, nie °C', () => {
    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <BrewHeader
          recipe={{ id: 'r', name: 'V60', namePl: 'V60', nameEn: 'V60', method: 'V60', beverageType: 'COFFEE' }}
          selectedInventoryItem={null}
          waterTempCelsius={93}
          unitSystem="imperial"
          grinderRecommendation={{ grinderName: 'C40', formatted: '24' }}
          onSelectRecipe={jest.fn()}
          onOpenRecipeModal={jest.fn()}
          onOpenInventoryModal={jest.fn()}
          onOpenGrinderModal={jest.fn()}
          onOpenShareModal={jest.fn()}
          onNavigateToGongfu={jest.fn()}
        />,
      );
    });
    const txt = textOf(tree!);
    expect(txt).toMatch(/199°F/);
    expect(txt).not.toMatch(/°C/);
  });

  test.each(['pl', 'en'] as const)('baner „Złote Zasady” (%s) w trybie imperialnym bez °C', (lang) => {
    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<BrewBanners corruptState={null} language={lang} unitSystem="imperial" onDismissCorrupt={jest.fn()} />);
    });
    const txt = textOf(tree!);
    expect(txt).toMatch(/4°F/);
    expect(txt).not.toMatch(/°C/);
  });

  test.each(['pl', 'en'] as const)('porady Dial-in Doctor (%s) mają różnicę temperatury z ustawienia', (lang) => {
    for (const key of ['doctorSourAdvice', 'doctorBitterAdvice'] as const) {
      const tpl = translations[lang].brew[key];
      expect(tpl).toContain('{delta}');
      const imp = formatTemplate(tpl, { delta: formatTemperatureDelta(2, 'imperial') });
      expect(imp).toMatch(/4°F/);
      expect(imp).not.toMatch(/°C/);
    }
  });

  test('godzina wpisu kofeiny według języka aplikacji (nie zawsze pl-PL)', () => {
    const iso = '2026-11-15T14:05:00';
    const opts: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };
    expect(formatClockTime(iso, 'en')).toBe(new Date(iso).toLocaleTimeString('en-US', opts));
    expect(formatClockTime(iso, 'pl')).toBe(new Date(iso).toLocaleTimeString('pl-PL', opts));
  });

  test('domyślny system jednostek z regionu: US → imperial, reszta → metric', () => {
    const gl = Localization.getLocales as jest.Mock;
    gl.mockReturnValue([{ measurementSystem: 'us' }]);
    expect(regionUnitSystem()).toBe('imperial');
    gl.mockReturnValue([{ measurementSystem: 'metric' }]);
    expect(regionUnitSystem()).toBe('metric');
    gl.mockReturnValue([{ measurementSystem: 'uk' }]);
    expect(regionUnitSystem()).toBe('metric');
    gl.mockImplementation(() => {
      throw new Error('brak modułu');
    });
    expect(regionUnitSystem()).toBe('metric');
  });
});

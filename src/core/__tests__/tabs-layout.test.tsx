// ============================================================================
// Napar (Steepwise) — Unit Tests: TabLayout & TabIcon
// Apps4Brew: Artisanal tabs navigation, haptic accents, settings button
// ============================================================================

import React from 'react';
import renderer, { act } from 'react-test-renderer';

// Mock expo-router
jest.mock('expo-router', () => {
  const React = require('react');
  const MockTabs = ({ children, screenOptions }: { children: React.ReactNode; screenOptions?: any }) => {
    return React.createElement('Tabs', { screenOptions }, children);
  };
  MockTabs.Screen = ({ name, options }: { name: string; options?: any }) => {
    return React.createElement('Screen', { name, options });
  };
  const MockLink = ({ href, children, asChild }: any) => {
    return React.createElement('Link', { href, asChild }, children);
  };
  return {
    Tabs: MockTabs,
    Link: MockLink,
  };
});

import TabLayout from '../../../app/(tabs)/_layout';

describe('TabLayout', () => {
  it('renders all 5 core barist tabs with correct routes and header button', () => {
    let tree: renderer.ReactTestRenderer | undefined;
    act(() => {
      tree = renderer.create(<TabLayout />);
    });
    expect(tree).toBeDefined();

    const root = tree!.root;
    const tabs = root.findByType('Tabs' as any);
    expect(tabs).toBeDefined();

    // Weryfikacja opcji nagłówka i wywołania przycisku ustawień
    const screenOptions = tabs.props.screenOptions;
    expect(screenOptions).toBeDefined();
    if (typeof screenOptions.headerRight === 'function') {
      const headerRightElement = screenOptions.headerRight();
      expect(headerRightElement).toBeDefined();
      if (typeof headerRightElement.type === 'function') {
        const headerButtonNode = headerRightElement.type(headerRightElement.props);
        expect(headerButtonNode).toBeDefined();
      }
    }

    // Weryfikacja obecności 5 zarejestrowanych ekranów (w tym ukryta kofeina z href: null)
    const screens = root.findAllByType('Screen' as any);
    expect(screens.length).toBe(5);

    const screenNames = screens.map((s) => s.props.name);
    expect(screenNames).toEqual(['index', 'beans', 'journal', 'dialin', 'caffeine']);

    // Kofeina ukryta z dolnego paska nawigacji (dostępna przez Warsztat)
    const caffeineScreen = screens.find((s) => s.props.name === 'caffeine');
    expect(caffeineScreen?.props.options?.href).toBeNull();

    // Dokładnie 4 widoczne zakładki na dolnym pasku
    const visibleScreens = screens.filter((s) => s.props.options?.href !== null);
    expect(visibleScreens.length).toBe(4);
    expect(visibleScreens.map((s) => s.props.name)).toEqual(['index', 'beans', 'journal', 'dialin']);

    // Test wywołania komponentu TabIcon dla każdego ekranu (active + inactive)
    screens.forEach((s) => {
      if (typeof s.props.options?.tabBarIcon === 'function') {
        const iconActive = s.props.options.tabBarIcon({ focused: true, color: '#D97706', size: 24 });
        const iconInactive = s.props.options.tabBarIcon({ focused: false, color: '#9CA3AF', size: 24 });
        expect(iconActive).toBeDefined();
        expect(iconInactive).toBeDefined();

        if (typeof iconActive.type === 'function') {
          const renderedActive = iconActive.type(iconActive.props);
          expect(renderedActive).toBeDefined();
        }
        if (typeof iconInactive.type === 'function') {
          const renderedInactive = iconInactive.type(iconInactive.props);
          expect(renderedInactive).toBeDefined();
        }
      }
    });
  });
});

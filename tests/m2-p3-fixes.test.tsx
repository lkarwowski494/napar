import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Share } from 'react-native';
import { JournalSessionCard } from '../src/components/journal/JournalSessionCard';
import { JournalAnalyticsView } from '../src/components/journal/JournalAnalyticsView';
import { translations } from '../src/core/i18n';
import type { BrewSession } from '../src/core/database-schema';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), navigate: jest.fn(), back: jest.fn() }),
  useFocusEffect: (cb: () => void) => {
    const ReactMod = require('react');
    ReactMod.useEffect(() => cb(), [cb]);
  },
}));

describe('M2-P3 — lokalizacja tagów smakowych w dzienniku (P1 z M2-P2-R)', () => {
  const sampleSession: BrewSession = {
    id: 'sess-en-1',
    recipeId: 'r-v60',
    recipeName: 'V60 Classic',
    beverageType: 'COFFEE',
    method: 'V60',
    doseGrams: 15,
    waterGrams: 250,
    waterTempCelsius: 93,
    totalTimeSeconds: 180,
    rating: 4.5,
    tasteBalance: 'balanced',
    flavorTags: ['Cytryna', 'Jaśmin', 'Custom Note'],
    notes: 'Clean cup',
    brewedAt: '2026-11-20T08:00:00.000Z',
  };

  test('JournalSessionCard wyświetla zlokalizowane tagi smakowe w EN', () => {
    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <JournalSessionCard
          session={sampleSession}
          unitSystem="metric"
          language="en"
          t={translations.en}
          onBrewAgain={() => {}}
          onShareSession={() => {}}
          onDelete={() => {}}
          formatDateTime={() => '2026-11-20'}
          formatSeconds={() => '3:00'}
        />
      );
    });
    const json = JSON.stringify(tree!.toJSON());
    expect(json).toContain('Lemon');
    expect(json).toContain('Jasmine');
    expect(json).toContain('Custom Note');
    expect(json).not.toContain('Cytryna');
    expect(json).not.toContain('Jaśmin');
    act(() => tree!.unmount());
  });

  test('JournalAnalyticsView wyświetla zlokalizowane dominujące nuty smakowe w EN', () => {
    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <JournalAnalyticsView
          language="en"
          t={translations.en}
          analyticsData={{
            totalBrews: 2,
            totalDoseGrams: 30,
            totalWaterLiters: '0.5',
            totalCaffeineMg: 180,
            avgRating: '4.5',
            methodsList: [{ method: 'V60', count: 2, percent: 100 }],
            avgSensory: null,
            sensoryCount: 0,
            balanceCounts: { balanced: 2, sour: 0, bitter: 0 },
            topTags: [
              { tag: 'Cytryna', count: 2 },
              { tag: 'Custom Note', count: 1 },
            ],
          }}
        />
      );
    });
    const json = JSON.stringify(tree!.toJSON());
    expect(json).toContain('Lemon (2)');
    expect(json).toContain('Custom Note (1)');
    expect(json).not.toContain('Cytryna');
    act(() => tree!.unmount());
  });

  test('JournalScreen wyszukuje po tagu kanonicznym i zlokalizowanym oraz udostępnia zlokalizowane tagi w EN', () => {
    const i18n = require('../src/core/i18n');
    const db = require('../src/data/database');
    const JournalScreen = require('../app/(tabs)/journal').default;

    jest.spyOn(i18n, 'useTranslation').mockReturnValue({
      t: translations.en,
      language: 'en',
      setLanguage: jest.fn(),
    });
    jest.spyOn(db, 'getBrewSessions').mockReturnValue([sampleSession]);
    jest.spyOn(db, 'getUnitSystem').mockReturnValue('metric');
    const shareSpy = jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' } as any);

    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<JournalScreen />);
    });

    // Udostępnianie używa zlokalizowanych nazw w EN
    const shareBtn = tree!.root.findByProps({ testID: 'share-session-btn-sess-en-1' });
    act(() => {
      shareBtn.props.onPress();
    });
    expect(shareSpy).toHaveBeenCalledTimes(1);
    const sharedMessage = (shareSpy.mock.calls[0][0] as any).message as string;
    expect(sharedMessage).toContain('Lemon');
    expect(sharedMessage).toContain('Jasmine');
    expect(sharedMessage).not.toContain('Cytryna');

    // Wyszukiwanie dopasowuje zarówno zlokalizowany ('lemon') jak i kanoniczny ('cytryna')
    const searchInput = tree!.root.findByProps({ placeholder: translations.en.journal.searchPlaceholder });
    act(() => {
      searchInput.props.onChangeText('lemon');
    });
    expect(JSON.stringify(tree!.toJSON())).toContain('V60 Classic');

    act(() => {
      searchInput.props.onChangeText('cytryna');
    });
    expect(JSON.stringify(tree!.toJSON())).toContain('V60 Classic');

    act(() => {
      searchInput.props.onChangeText('nieistniejacy-tag-xyz');
    });
    expect(JSON.stringify(tree!.toJSON())).not.toContain('V60 Classic');

    act(() => tree!.unmount());
    jest.restoreAllMocks();
  });
});

describe('M2-P3 — decyzje D-023, dostępność M1-023 i operacyjne M1-024', () => {
  const fs = require('fs');
  const path = require('path');
  const root = path.resolve(__dirname, '..');

  test('D-023: open-procedure-modal-btn znajduje się na górze ScrollView przed BrewBanners, a BrewModalsContainer poza ScrollView', () => {
    const src = fs.readFileSync(path.join(root, 'app/(tabs)/index.tsx'), 'utf8');
    const ctaIdx = src.indexOf('testID="open-procedure-modal-btn"');
    const bannersIdx = src.indexOf('<BrewBanners');
    const scrollCloseIdx = src.indexOf('</ScrollView>');
    const modalsIdx = src.indexOf('<BrewModalsContainer');
    expect(ctaIdx).toBeGreaterThan(-1);
    expect(bannersIdx).toBeGreaterThan(ctaIdx);
    expect(scrollCloseIdx).toBeGreaterThan(-1);
    expect(modalsIdx).toBeGreaterThan(scrollCloseIdx);
  });

  test('M1-023: archiveEmptyBtn i descriptorChip mają hitSlop >= 44pt oraz SafeModeView btnDangerText ma kontrast >= 4.5:1', () => {
    const { BeanItemCard } = require('../src/components/beans/BeanItemCard');
    const { FlavorWheelPicker } = require('../src/core/flavor-wheel-picker');
    const { getContrastRatio } = require('../src/core/contrast');

    let beanTree: renderer.ReactTestRenderer;
    act(() => {
      beanTree = renderer.create(
        <BeanItemCard
          item={{
            id: 'empty-1',
            name: 'Ethiopia',
            roaster: 'Roaster',
            beverageType: 'COFFEE',
            initialWeightGrams: 250,
            remainingWeightGrams: 0,
            isFavorite: false,
            isArchived: false,
            flavorNotes: [],
            createdAt: '2026-11-20T00:00:00.000Z',
          }}
          unitSystem="metric"
          language="en"
          t={translations.en}
          onToggleFavorite={() => {}}
          onSelectForBrew={() => {}}
          onOpenEdit={() => {}}
          onToggleArchive={() => {}}
        />
      );
    });
    const archiveEmptyBtn = beanTree!.root.findByProps({ testID: 'bean-archive-empty-btn-empty-1' });
    expect(archiveEmptyBtn.props.hitSlop).toBeDefined();
    expect(archiveEmptyBtn.props.hitSlop.top).toBeGreaterThanOrEqual(8);
    expect(archiveEmptyBtn.props.hitSlop.bottom).toBeGreaterThanOrEqual(8);
    act(() => beanTree!.unmount());

    let pickerTree: renderer.ReactTestRenderer;
    act(() => {
      pickerTree = renderer.create(
        <FlavorWheelPicker selectedDescriptors={[]} onToggleDescriptor={() => {}} language="en" />
      );
    });
    const firstChip = pickerTree!.root.findAllByProps({ accessibilityRole: 'checkbox' })[0];
    expect(firstChip.props.hitSlop).toBeDefined();
    expect(firstChip.props.hitSlop.top).toBeGreaterThanOrEqual(8);
    expect(firstChip.props.hitSlop.bottom).toBeGreaterThanOrEqual(8);
    act(() => pickerTree!.unmount());

    const safeModeSrc = fs.readFileSync(path.join(root, 'src/components/SafeModeView.tsx'), 'utf8');
    const dangerMatch = safeModeSrc.match(/btnDangerText:\s*\{[^}]*color:\s*'([^']+)'/);
    expect(dangerMatch).not.toBeNull();
    expect(getContrastRatio(dangerMatch![1], '#12100E')).toBeGreaterThanOrEqual(4.5);

    const htmlFiles = [
      'site/index.html',
      'site/support.html',
      'site/privacy.html',
      'site/terms.html',
      'site/en/index.html',
      'site/en/support.html',
      'site/en/privacy.html',
    ];
    for (const rel of htmlFiles) {
      const html = fs.readFileSync(path.join(root, rel), 'utf8');
      const lightBlock = html.match(/@media\s*\(prefers-color-scheme:\s*light\)\s*\{([\s\S]*?)\n\s*\}/);
      expect(lightBlock).not.toBeNull();
      const goldMatch = lightBlock![1].match(/--accent-gold:\s*(#[0-9a-fA-F]{6})/);
      expect(goldMatch).not.toBeNull();
      expect(getContrastRatio(goldMatch![1], '#ffffff')).toBeGreaterThanOrEqual(4.5);
      expect(getContrastRatio(goldMatch![1], '#f9f8f6')).toBeGreaterThanOrEqual(4.5);
    }
  });

  test('M1-024: SafeModeView pokazuje SUPPORT_EMAIL, Settings czyta EXPO_PUBLIC_BUILD_NUMBER, a 15-app-store.md używa jawnych placeholderów ASC', () => {
    const { SafeModeView } = require('../src/components/SafeModeView');
    const { SUPPORT_EMAIL } = require('../src/core/app-identity');
    const SettingsScreen = require('../app/settings').default;

    let safeTree: renderer.ReactTestRenderer;
    act(() => {
      safeTree = renderer.create(<SafeModeView onRetry={() => {}} language="en" reason="too-new" />);
    });
    expect(JSON.stringify(safeTree!.toJSON())).toContain(SUPPORT_EMAIL);
    act(() => safeTree!.unmount());

    const prevBuild = process.env.EXPO_PUBLIC_BUILD_NUMBER;
    process.env.EXPO_PUBLIC_BUILD_NUMBER = '42';
    try {
      let settingsTree: renderer.ReactTestRenderer;
      act(() => {
        settingsTree = renderer.create(<SettingsScreen />);
      });
      const versionNode = settingsTree!.root.findByProps({ testID: 'settings-app-version' });
      expect(JSON.stringify(versionNode.props.children)).toContain('Build 42');
      act(() => settingsTree!.unmount());
    } finally {
      if (prevBuild === undefined) delete process.env.EXPO_PUBLIC_BUILD_NUMBER;
      else process.env.EXPO_PUBLIC_BUILD_NUMBER = prevBuild;
    }

    const appStoreDoc = fs.readFileSync(path.join(root, 'docs/15-app-store.md'), 'utf8');
    expect(appStoreDoc).toContain('<ASC_KEY_ID>');
    expect(appStoreDoc).toContain('<ASC_ISSUER_UUID>');
    expect(appStoreDoc).not.toContain('2X9R4HXF34');
    expect(appStoreDoc).not.toContain('69a6de70-');
  });
});

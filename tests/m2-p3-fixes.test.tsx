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

// ============================================================================
// Apps4Brew / Napar (Steepwise) — Workflow & Hooks Matrix Test
// Validates extracted workflow helpers, journal analytics, and locales matrix
// ============================================================================

import React from 'react';
import renderer from 'react-test-renderer';
import { View, Text } from 'react-native';
import {
  isRecipeTea,
  getRecipeName,
  useBrewWorkflow,
  AnyRecipe,
} from '../src/core/useBrewWorkflow';
import {
  computeJournalAnalytics,
  useJournalAnalytics,
} from '../src/core/useJournalAnalytics';
import { KNOWLEDGE_LOCALES } from '../src/core/knowledge-locales';
import { BrewProvider } from '../src/core/brew-context';
import { BrewSession } from '../src/core/database-schema';

// Mock expo-sqlite for useBrewWorkflow
jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn(() => ({
    execSync: jest.fn(),
    getFirstSync: jest.fn(),
    getAllSync: jest.fn(() => []),
    runSync: jest.fn(() => ({ changes: 1 })),
  })),
  defaultDatabaseDirectory: '/test/SQLite',
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
}));

describe('Workflow & Analytics Test Matrix Validation', () => {
  test('isRecipeTea oraz getRecipeName poprawnie rozpoznają typ i nazwę receptury', () => {
    const coffeeRecipe: AnyRecipe = {
      id: 'rec-coffee-01',
      name: 'V60 Classic',
      beverageType: 'COFFEE',
      method: 'v60',
      doseGrams: 15,
      waterGrams: 250,
      waterTempCelsius: 94,
      recommendedRatio: 16.67,
      stepsJson: '[]',
      isCustom: true,
      isFavorite: false,
      createdAt: '2026-01-01',
    };

    const teaRecipe: AnyRecipe = {
      id: 'rec-tea-01',
      name: 'Sencha Green',
      beverageType: 'TEA',
      method: 'gaiwan',
      doseGrams: 5,
      waterGrams: 100,
      waterTempCelsius: 75,
      recommendedRatio: 20.0,
      stepsJson: '[]',
      isCustom: false,
      isFavorite: true,
      createdAt: '2026-01-01',
    };

    expect(isRecipeTea(coffeeRecipe)).toBe(false);
    expect(isRecipeTea(teaRecipe)).toBe(true);

    expect(getRecipeName(coffeeRecipe)).toBe('V60 Classic');
    expect(getRecipeName(teaRecipe)).toBe('Sencha Green');

    // Walidacja typu AnyRecipe w kodzie
    const anyRec: AnyRecipe = coffeeRecipe;
    expect(anyRec.name).toBe('V60 Classic');
  });

  test('computeJournalAnalytics agreguje metryki sesji parzenia i profile sensoryczne', () => {
    const mockSessions: BrewSession[] = [
      {
        id: 's1',
        beverageType: 'COFFEE',
        method: 'v60',
        doseGrams: 15,
        waterGrams: 250,
        waterTempCelsius: 94,
        totalTimeSeconds: 180,
        rating: 5,
        caffeineContentMg: 120,
        tasteBalance: 'ideal',
        flavorTags: ['jaśmin', 'bergamotka'],
        sensory: { acidity: 4, sweetness: 5, body: 3, clarity: 5, finish: 4 },
        brewedAt: '2026-01-01',
      },
      {
        id: 's2',
        beverageType: 'COFFEE',
        method: 'aeropress',
        doseGrams: 16,
        waterGrams: 200,
        waterTempCelsius: 85,
        totalTimeSeconds: 120,
        rating: 4,
        caffeineContentMg: 130,
        tasteBalance: 'sour',
        flavorTags: ['czekolada', 'orzech'],
        brewedAt: '2026-01-02',
      },
    ];

    const analytics = computeJournalAnalytics(mockSessions);
    expect(analytics.totalBrews).toBe(2);
    expect(analytics.totalDoseGrams).toBe(31);
    expect(analytics.avgRating).toBe('4.5');
    expect(analytics.methodsList.length).toBe(2);
    expect(analytics.sensoryCount).toBe(1);
    expect(analytics.avgSensory?.acidity).toBe(4);
    expect(analytics.topTags.length).toBeGreaterThanOrEqual(1);
    expect(analytics.topFlavorTags.length).toBeGreaterThanOrEqual(1);
  });

  test('useJournalAnalytics hook poprawnie działa w cyklu renderowania React', () => {
    const mockSessions: BrewSession[] = [
      {
        id: 's1',
        beverageType: 'COFFEE',
        method: 'v60',
        doseGrams: 18,
        waterGrams: 300,
        waterTempCelsius: 96,
        totalTimeSeconds: 210,
        rating: 5,
        brewedAt: '2026-01-01',
      },
    ];

    let renderedTotal = 0;
    const TestComponent = () => {
      const analytics = useJournalAnalytics(mockSessions);
      renderedTotal = analytics.totalBrews;
      return <Text testID="analytics-total">{analytics.totalBrews}</Text>;
    };

    renderer.act(() => {
      renderer.create(<TestComponent />);
    });

    expect(renderedTotal).toBe(1);
  });

  test('useBrewWorkflow hook inicjalizuje stan i dostarcza operacje przepływu parzenia', () => {
    let workflowInstance: any;

    const TestWorkflowComponent = () => {
      const workflow = useBrewWorkflow();
      workflowInstance = workflow;
      return (
        <View>
          <Text testID="workflow-status">ready</Text>
        </View>
      );
    };

    renderer.act(() => {
      renderer.create(
        <BrewProvider>
          <TestWorkflowComponent />
        </BrewProvider>
      );
    });

    expect(workflowInstance).toBeDefined();
    expect(workflowInstance.recipe).toBeDefined();
    expect(typeof workflowInstance.handleStartTimer).toBe('function');
    expect(typeof workflowInstance.refreshData).toBe('function');
  });

  test('KNOWLEDGE_LOCALES zawiera pełny zbiór zlokalizowanych opisów ziaren, obróbek i herbat', () => {
    expect(KNOWLEDGE_LOCALES).toBeDefined();
    expect(Object.keys(KNOWLEDGE_LOCALES).length).toBeGreaterThanOrEqual(25);
    expect(KNOWLEDGE_LOCALES['variety-geisha']).toBeDefined();
    expect(KNOWLEDGE_LOCALES['variety-geisha'].descriptionPl).toContain('Najbardziej ceniona');
    expect(KNOWLEDGE_LOCALES['variety-geisha'].descriptionEn).toContain('The most prestigious');
  });
});

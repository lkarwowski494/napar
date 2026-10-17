// ============================================================================
// Napar (Steepwise) — Unit Tests: JournalSessionCard
// ============================================================================

import React from 'react';
import renderer from 'react-test-renderer';
import { JournalSessionCard } from '../JournalSessionCard';
import { BrewSession } from '../../../core/database-schema';
import { translations } from '../../../core/i18n';

describe('JournalSessionCard Component', () => {
  const mockSession: BrewSession = {
    id: 'test-session-1',
    recipeId: 'v60-hoffmann',
    recipeName: 'V60 1-Cup (Hoffmann)',
    beverageType: 'COFFEE',
    method: 'V60',
    inventoryItemId: 'bean-1',
    inventoryItemName: 'Etiopia Yirgacheffe',
    doseGrams: 15.0,
    waterGrams: 250.0,
    waterTempCelsius: 93,
    grindSetting: '22 kliki',
    totalTimeSeconds: 195,
    rating: 4.8,
    sensory: { sweetness: 4, acidity: 3, body: 3, finish: 5, clarity: 4 },
    tasteBalance: 'balanced',
    extractionYieldPercentage: 20.4,
    tdsPercentage: 1.35,
    caffeineContentMg: 120,
    waterProfile: 'barista_hustle',
    flavorTags: ['Jaśmin', 'Bergamotka'],
    notes: 'Wyrazisty jaśmin i bergamotka',
    brewedAt: '2026-10-17T08:30:00.000Z',
  };

  const t = translations.pl;
  const mockOnBrewAgain = jest.fn();
  const mockOnShareSession = jest.fn();
  const mockOnDelete = jest.fn();
  const formatDateTime = (iso: string) => '17.10.2026, 08:30';
  const formatSeconds = (sec: number) => '03:15';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Renderuje dane sesji kawowej, ocenę, sensorykę i profil wody', () => {
    let tree: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(
        <JournalSessionCard
          session={mockSession}
          unitSystem="metric"
          language="pl"
          t={t}
          onBrewAgain={mockOnBrewAgain}
          onShareSession={mockOnShareSession}
          onDelete={mockOnDelete}
          formatDateTime={formatDateTime}
          formatSeconds={formatSeconds}
        />
      );
    });

    const root = tree!.root;
    expect(root.findByProps({ testID: 'brew-again-btn-test-session-1' })).toBeDefined();
    expect(root.findByProps({ testID: 'share-session-btn-test-session-1' })).toBeDefined();
    expect(root.findByProps({ testID: 'delete-session-btn-test-session-1' })).toBeDefined();
    expect(root.findByProps({ testID: 'journal-water-test-session-1' })).toBeDefined();
  });

  test('Obsługuje kliknięcie przycisków: Zaparz ponownie, Udostępnij, Usuń', () => {
    let tree: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(
        <JournalSessionCard
          session={mockSession}
          unitSystem="metric"
          language="pl"
          t={t}
          onBrewAgain={mockOnBrewAgain}
          onShareSession={mockOnShareSession}
          onDelete={mockOnDelete}
          formatDateTime={formatDateTime}
          formatSeconds={formatSeconds}
        />
      );
    });

    const root = tree!.root;
    const brewBtn = root.findByProps({ testID: 'brew-again-btn-test-session-1' });
    const shareBtn = root.findByProps({ testID: 'share-session-btn-test-session-1' });
    const deleteBtn = root.findByProps({ testID: 'delete-session-btn-test-session-1' });

    renderer.act(() => {
      brewBtn.props.onPress();
    });
    expect(mockOnBrewAgain).toHaveBeenCalledWith(mockSession);

    renderer.act(() => {
      shareBtn.props.onPress();
    });
    expect(mockOnShareSession).toHaveBeenCalledWith(mockSession);

    renderer.act(() => {
      deleteBtn.props.onPress();
    });
    expect(mockOnDelete).toHaveBeenCalledWith(mockSession);
  });

  test('Poprawnie renderuje sesję bez przypisanych ziaren w systemie imperialnym', () => {
    const sessionWithoutBeans: BrewSession = {
      ...mockSession,
      id: 'session-no-beans',
      inventoryItemName: undefined,
      rating: undefined,
      waterProfile: undefined,
      caffeineContentMg: undefined,
      tasteBalance: 'under_extracted',
    };

    let tree: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(
        <JournalSessionCard
          session={sessionWithoutBeans}
          unitSystem="imperial"
          language="en"
          t={translations.en}
          onBrewAgain={mockOnBrewAgain}
          onShareSession={mockOnShareSession}
          onDelete={mockOnDelete}
          formatDateTime={formatDateTime}
          formatSeconds={formatSeconds}
        />
      );
    });

    expect(tree!.toJSON()).toBeDefined();
  });
});

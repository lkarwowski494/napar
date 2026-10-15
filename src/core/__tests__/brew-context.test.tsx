// ============================================================================
// Napar (Steepwise) — Unit Tests: BrewContext & BrewProvider
// ============================================================================

import React from 'react';
import renderer from 'react-test-renderer';
import { BrewProvider, useBrew } from '../brew-context';
import { MASTER_RECIPES } from '../recipes-data';
import * as databaseModule from '../database';
import { SavedRecipe } from '../database-schema';

const mockDb: any = {
  execSync: jest.fn(),
  getFirstSync: jest.fn(),
  getAllSync: jest.fn(() => []),
  runSync: jest.fn(),
};

jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn(() => mockDb),
}));

describe('BrewContext & BrewProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('useBrew rzuca błąd, gdy jest wywołany poza BrewProvider', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    let caughtError: any = null;

    const TestComponent = () => {
      try {
        useBrew();
      } catch (err) {
        caughtError = err;
      }
      return null;
    };

    renderer.act(() => {
      renderer.create(<TestComponent />);
    });

    expect(caughtError).toBeInstanceOf(Error);
    expect(caughtError.message).toBe('useBrew must be used within a BrewProvider');
    spy.mockRestore();
  });

  test('Inicjalizuje domyślny stan z MASTER_RECIPES[0] i zarządza krokami timera', () => {
    let brewData: any;
    const Consumer = () => {
      brewData = useBrew();
      return null;
    };

    renderer.act(() => {
      renderer.create(
        <BrewProvider>
          <Consumer />
        </BrewProvider>
      );
    });

    expect(brewData.recipe.id).toBe(MASTER_RECIPES[0].id);
    expect(brewData.doseGrams).toBe(MASTER_RECIPES[0].coffeeOrTeaDoseGrams);
    expect(brewData.waterGrams).toBe(MASTER_RECIPES[0].waterWeightGrams);
    expect(brewData.scaledSteps.length).toBeGreaterThan(0);

    // Test kontroli timera
    renderer.act(() => {
      brewData.startTimer();
      brewData.pauseTimer();
      brewData.resumeTimer();
      brewData.nextStep();
      brewData.previousStep();
      brewData.resetTimer();
    });

    expect(brewData.snapshot).toBeDefined();
  });

  test('Obsługuje SavedRecipe z poprawnym i uszkodzonym stepsJson oraz MasterRecipe w selectRecipe', () => {
    const customRecipe: SavedRecipe = {
      id: 'saved-1',
      name: 'Mój Drip Custom',
      beverageType: 'COFFEE',
      method: 'V60',
      doseGrams: 15,
      waterGrams: 250,
      waterTempCelsius: 93,
      grindSizeDescription: '22 kliki',
      stepsJson: JSON.stringify([
        {
          stepNumber: 1,
          namePl: 'Preinfuzja',
          targetWaterGrams: 50,
          durationSeconds: 40,
        },
        {
          stepNumber: 2,
          namePl: 'Zalanie główne',
          targetWaterGrams: 250,
          durationSeconds: 90,
        },
      ]),
      recommendedRatio: 16.67,
      isCustom: true,
      isFavorite: false,
      createdAt: new Date().toISOString(),
    };

    let brewData: any;
    const Consumer = () => {
      brewData = useBrew();
      return null;
    };

    renderer.act(() => {
      renderer.create(
        <BrewProvider>
          <Consumer />
        </BrewProvider>
      );
    });

    // Przełącz na SavedRecipe
    renderer.act(() => {
      brewData.selectRecipe(customRecipe);
    });

    expect(brewData.recipe.id).toBe('saved-1');
    expect(brewData.doseGrams).toBe(15);
    expect(brewData.waterGrams).toBe(250);
    expect(brewData.waterTempCelsius).toBe(93);
    expect(brewData.grindSetting).toBe('22 kliki');
    expect(brewData.scaledSteps.length).toBe(2);

    // Przełącz na SavedRecipe z uszkodzonym JSON w stepsJson
    const brokenRecipe: SavedRecipe = {
      ...customRecipe,
      id: 'saved-broken',
      stepsJson: '{{{INVALID_JSON',
    };

    renderer.act(() => {
      brewData.selectRecipe(brokenRecipe);
    });

    expect(brewData.recipe.id).toBe('saved-broken');
    expect(brewData.scaledSteps.length).toBe(0);

    // Przełącz z powrotem na MasterRecipe
    renderer.act(() => {
      brewData.selectRecipe(MASTER_RECIPES[1]);
    });
    expect(brewData.recipe.id).toBe(MASTER_RECIPES[1].id);
  });

  test('Skaluje kroki, gdy użytkownik ręcznie zmieni objętość wody', () => {
    let brewData: any;
    const Consumer = () => {
      brewData = useBrew();
      return null;
    };

    renderer.act(() => {
      renderer.create(
        <BrewProvider>
          <Consumer />
        </BrewProvider>
      );
    });

    const originalLastWater = brewData.scaledSteps[brewData.scaledSteps.length - 1].targetWaterGrams;

    // Podwajamy ilość wody
    renderer.act(() => {
      brewData.setWaterGrams(brewData.waterGrams * 2);
    });

    const scaledLastWater = brewData.scaledSteps[brewData.scaledSteps.length - 1].targetWaterGrams;
    expect(scaledLastWater).toBeCloseTo(originalLastWater * 2, 1);
  });

  test('setDoseGrams przelicza gramaturę wody według recommendedRatio', () => {
    let brewData: any;
    const Consumer = () => {
      brewData = useBrew();
      return null;
    };

    renderer.act(() => {
      renderer.create(
        <BrewProvider>
          <Consumer />
        </BrewProvider>
      );
    });

    renderer.act(() => {
      brewData.setDoseGrams(20);
    });

    expect(brewData.doseGrams).toBe(20);
    const expectedWater = Number((20 * MASTER_RECIPES[0].recommendedRatio).toFixed(1));
    expect(brewData.waterGrams).toBe(expectedWater);
  });

  test('finishAndSaveSession zapisuje sesję kawową, liczy EY% i odlicza stan ze spiżarni', () => {
    const saveSessionSpy = jest.spyOn(databaseModule, 'saveBrewSession').mockImplementation(jest.fn());
    const deductSpy = jest.spyOn(databaseModule, 'deductInventoryWeight').mockImplementation(jest.fn());
    const logCaffeineSpy = jest.spyOn(databaseModule, 'logCaffeine').mockImplementation(jest.fn());

    let brewData: any;
    const Consumer = () => {
      brewData = useBrew();
      return null;
    };

    renderer.act(() => {
      renderer.create(
        <BrewProvider>
          <Consumer />
        </BrewProvider>
      );
    });

    // Przypisz ziarno ze spiżarni
    const item = {
      id: 'inv-item-1',
      name: 'Etiopia Yirgacheffe',
      remainingWeightGrams: 250,
      initialWeightGrams: 250,
    };

    renderer.act(() => {
      brewData.selectInventoryItem(item);
      brewData.setWaterTempCelsius(94);
      brewData.setGrindSetting('25 klików');
    });

    let savedSession: any;
    renderer.act(() => {
      savedSession = brewData.finishAndSaveSession({
        rating: 5,
        flavorTags: ['Jaśmin', 'Bergamotka'],
        tasteBalance: 'ideal',
        tdsPercentage: 1.4,
        notes: 'Czysty, kwiatowy profil',
        logToCaffeineTracker: true,
      });
    });

    expect(savedSession).toBeDefined();
    expect(savedSession.rating).toBe(5);
    expect(savedSession.inventoryItemId).toBe('inv-item-1');
    expect(savedSession.tdsPercentage).toBe(1.4);
    expect(savedSession.extractionYieldPercentage).toBeGreaterThan(0);
    expect(savedSession.caffeineContentMg).toBeGreaterThan(0);

    expect(saveSessionSpy).toHaveBeenCalled();
    expect(deductSpy).toHaveBeenCalledWith('inv-item-1', brewData.doseGrams);
    expect(logCaffeineSpy).toHaveBeenCalled();
  });

  test('finishAndSaveSession dla herbaty poprawnie szacuje kofeinę i obsługuje wyłączony log kofeiny', () => {
    const saveSessionSpy = jest.spyOn(databaseModule, 'saveBrewSession').mockImplementation(jest.fn());
    const logCaffeineSpy = jest.spyOn(databaseModule, 'logCaffeine').mockImplementation(jest.fn());

    const teaRecipe = MASTER_RECIPES.find((r) => r.type === 'TEA')!;

    let brewData: any;
    const Consumer = () => {
      brewData = useBrew();
      return null;
    };

    renderer.act(() => {
      renderer.create(
        <BrewProvider>
          <Consumer />
        </BrewProvider>
      );
    });

    renderer.act(() => {
      brewData.selectRecipe(teaRecipe);
    });

    let savedSession: any;
    renderer.act(() => {
      savedSession = brewData.finishAndSaveSession({
        rating: 4,
        tdsPercentage: -1, // Niepoprawne TDS, nie wylicza EY
        logToCaffeineTracker: false, // Wyłączony zapis do kofeiny
      });
    });

    expect(savedSession.beverageType).toBe('TEA');
    expect(savedSession.caffeineContentMg).toBeGreaterThan(0);
    expect(savedSession.extractionYieldPercentage).toBeUndefined();
    expect(saveSessionSpy).toHaveBeenCalled();
    expect(logCaffeineSpy).not.toHaveBeenCalled();
  });
});

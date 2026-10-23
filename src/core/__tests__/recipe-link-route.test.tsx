// ============================================================================
// Napar (Steepwise) — Testy: link receptury napar://recipe (podgląd przed zapisem)
// oraz kopiowanie linku do schowka w ShareRecipeModal (pozycja 30 MVP)
// ============================================================================

import React from 'react';
import renderer, { act } from 'react-test-renderer';
import * as Clipboard from 'expo-clipboard';
import RecipeLinkScreen from '../../../app/recipe';
import { ShareRecipeModal } from '../../components/brew/ShareRecipeModal';
import { LanguageProvider, detectSystemLanguage, getTranslations, translations } from '../i18n';
import { encodeRecipeToShareUrl, decodeRecipeFromShareUrl } from '../recipe-share';
import { saveRecipe } from '../database';
import { SavedRecipe } from '../database-schema';

const mockBack = jest.fn();
const mockReplace = jest.fn();
let mockCanGoBack = true;
let mockParams: { d?: string } = {};

jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: mockBack,
    replace: mockReplace,
    canGoBack: () => mockCanGoBack,
  }),
  useLocalSearchParams: () => mockParams,
}));

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(() => Promise.resolve(true)),
}));

jest.mock('../database', () => ({
  saveRecipe: jest.fn(),
  getUnitSystem: jest.fn(() => 'metric'),
}));

const T = getTranslations(detectSystemLanguage());

const sampleRecipe: SavedRecipe = {
  id: 'rec-source-1',
  name: 'Kasuya 4:6 test',
  beverageType: 'COFFEE',
  method: 'V60',
  author: 'Autor testowy',
  description: 'Opis testowy',
  doseGrams: 20,
  waterGrams: 320,
  waterTempCelsius: 93,
  grindSizeDescription: '22 kliki',
  recommendedRatio: 16,
  stepsJson: JSON.stringify([
    { stepNumber: 1, namePl: 'Bloom', targetWaterGrams: 60, durationSeconds: 40, instructionPl: 'Zalej 60 g' },
    { stepNumber: 2, namePl: 'Pour', targetWaterGrams: 260, durationSeconds: 120, instructionPl: 'Wlej resztę' },
  ]),
  isCustom: true,
  isFavorite: true,
  createdAt: '2025-01-01T00:00:00.000Z',
};

/** Wyciąga wartość parametru d tak, jak robi to router przy otwieraniu napar://recipe?v=1&d=... */
function linkParamD(url: string): string {
  const match = url.match(/[?&]d=([^&#]+)/);
  if (!match) throw new Error('brak parametru d w linku');
  return decodeURIComponent(match[1]);
}

function renderScreen() {
  let tree: renderer.ReactTestRenderer | undefined;
  act(() => {
    tree = renderer.create(
      <LanguageProvider>
        <RecipeLinkScreen />
      </LanguageProvider>
    );
  });
  return tree!;
}

function pressByTestId(tree: renderer.ReactTestRenderer, testID: string) {
  act(() => {
    tree.root.findByProps({ testID }).props.onPress();
  });
}

describe('Link receptury napar://recipe (pozycja 30 MVP)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCanGoBack = true;
    mockParams = {};
  });

  test('logika dekodowania: link z encodeRecipeToShareUrl wraca do tych samych danych', () => {
    const url = encodeRecipeToShareUrl(sampleRecipe);
    expect(url.startsWith('napar://recipe?v=1&d=')).toBe(true);

    const decoded = decodeRecipeFromShareUrl(linkParamD(url));
    expect(decoded).not.toBeNull();
    expect(decoded!.recipe.name).toBe('Kasuya 4:6 test');
    expect(decoded!.recipe.method).toBe('V60');
    expect(decoded!.recipe.doseGrams).toBe(20);
    expect(decoded!.recipe.waterGrams).toBe(320);
    expect(decoded!.originalSteps.map((s) => s.namePl)).toEqual(['Bloom', 'Pour']);
  });

  test('podgląd pokazuje recepturę z linku i niczego nie zapisuje przed kliknięciem Zapisz', () => {
    mockParams = { d: linkParamD(encodeRecipeToShareUrl(sampleRecipe)) };
    const tree = renderScreen();

    expect(tree.root.findByProps({ testID: 'recipe-link-name' }).props.children).toBe('Kasuya 4:6 test');
    expect(JSON.stringify(tree.toJSON())).toContain('Bloom');
    expect(JSON.stringify(tree.toJSON())).toContain(T.recipeLink.preview);
    expect(saveRecipe).not.toHaveBeenCalled();
  });

  test('Zapisz w nagłówku zapisuje nową recepturę (nowy identyfikator, bez ulubionych z linku) i zamyka ekran', () => {
    mockParams = { d: linkParamD(encodeRecipeToShareUrl(sampleRecipe)) };
    const tree = renderScreen();

    pressByTestId(tree, 'recipe-link-save-btn');

    expect(saveRecipe).toHaveBeenCalledTimes(1);
    const saved = (saveRecipe as jest.Mock).mock.calls[0][0];
    expect(saved.name).toBe('Kasuya 4:6 test');
    expect(saved.id).toMatch(/^shared-/);
    expect(saved.isFavorite).toBe(false);
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  test('bez historii nawigacji Zapisz zamyka ekran przez przekierowanie do zakładek', () => {
    mockCanGoBack = false;
    mockParams = { d: linkParamD(encodeRecipeToShareUrl(sampleRecipe)) };
    const tree = renderScreen();

    pressByTestId(tree, 'recipe-link-save-btn');

    expect(mockBack).not.toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
  });

  test('zły link pokazuje komunikat i blokuje zapis', () => {
    mockParams = { d: 'to-nie-jest-receptura' };
    const tree = renderScreen();

    expect(tree.root.findByProps({ testID: 'recipe-link-invalid' }).props.children).toBe(T.recipeLink.invalid);
    expect(tree.root.findByProps({ testID: 'recipe-link-save-btn' }).props.disabled).toBe(true);

    pressByTestId(tree, 'recipe-link-save-btn');
    expect(saveRecipe).not.toHaveBeenCalled();
  });

  test('brak parametru d (otwarcie samego napar://recipe) traktowany jak zły link', () => {
    mockParams = {};
    const tree = renderScreen();
    expect(tree.root.findByProps({ testID: 'recipe-link-invalid' })).toBeDefined();
  });

  test('błąd zapisu w bazie pokazuje alert i nie zamyka ekranu', () => {
    const { Alert } = require('react-native');
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    (saveRecipe as jest.Mock).mockImplementationOnce(() => {
      throw new Error('baza niedostępna');
    });
    mockParams = { d: linkParamD(encodeRecipeToShareUrl(sampleRecipe)) };
    const tree = renderScreen();

    pressByTestId(tree, 'recipe-link-save-btn');

    expect(alertSpy).toHaveBeenCalledWith(T.recipeLink.title, T.recipeLink.saveFailed);
    expect(mockBack).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  test('zamknięcie w nagłówku wraca bez zapisu', () => {
    mockParams = { d: linkParamD(encodeRecipeToShareUrl(sampleRecipe)) };
    const tree = renderScreen();

    pressByTestId(tree, 'recipe-link-close-btn');

    expect(saveRecipe).not.toHaveBeenCalled();
    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});

describe('Kopiowanie linku receptury do schowka (ShareRecipeModal)', () => {
  const shareUrl = encodeRecipeToShareUrl(sampleRecipe);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function renderModal() {
    let tree: renderer.ReactTestRenderer | undefined;
    act(() => {
      tree = renderer.create(
        <ShareRecipeModal
          visible={true}
          onClose={() => {}}
          recipe={sampleRecipe}
          shareUrl={shareUrl}
          waterTempCelsius={93}
          unitSystem="metric"
          t={translations.pl}
        />
      );
    });
    return tree!;
  }

  test('przycisk kopiuje pełny link napar:// do schowka i pokazuje potwierdzenie', async () => {
    const tree = renderModal();

    await act(async () => {
      await tree.root.findByProps({ testID: 'copy-link-btn' }).props.onPress();
    });

    expect(Clipboard.setStringAsync).toHaveBeenCalledWith(shareUrl);
    expect(tree.root.findByProps({ testID: 'copy-link-status' }).props.children).toBe(translations.pl.brew.qrCopied);
  });

  test('błąd schowka pokazuje komunikat zamiast udawanego sukcesu', async () => {
    (Clipboard.setStringAsync as jest.Mock).mockRejectedValueOnce(new Error('brak dostępu'));
    const tree = renderModal();

    await act(async () => {
      await tree.root.findByProps({ testID: 'copy-link-btn' }).props.onPress();
    });

    expect(tree.root.findByProps({ testID: 'copy-link-status' }).props.children).toBe(translations.pl.brew.qrCopyFailed);
  });

  test('przed kliknięciem nie ma żadnego komunikatu', () => {
    const tree = renderModal();
    expect(tree.root.findAllByProps({ testID: 'copy-link-status' })).toHaveLength(0);
    expect(Clipboard.setStringAsync).not.toHaveBeenCalled();
  });
});

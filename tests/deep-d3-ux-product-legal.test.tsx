// ============================================================================
// Napar — Partia D3: Testy regresyjne (DEEP-029, DEEP-030, UX/modale, a11y, RODO/OSS, site/)
// ============================================================================

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(),
  shareAsync: jest.fn(),
}));
jest.mock('expo-sqlite', () => require('./support/expo-sqlite-node').createExpoSqliteMock());

import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Share, Alert, ScrollView, Platform, Modal } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

import { BeanItemCard, computeDaysSinceLocalDate } from '../src/components/beans/BeanItemCard';
import { BeanEditModal } from '../src/components/beans/BeanEditModal';
import { JsonExportModal, JsonImportModal } from '../src/components/settings/JsonBackupModals';
import { CsvExportModal } from '../src/components/settings/CsvExportModal';
import { OssLicensesModal, BUNDLED_OSS_LICENSES } from '../src/components/settings/OssLicensesModal';
import { ShareRecipeModal } from '../src/components/brew/ShareRecipeModal';
import { BrewFinishModal } from '../src/components/brew/BrewFinishModal';
import { BrewHeader } from '../src/components/brew/BrewHeader';
import { BrewModalsContainer } from '../src/components/brew/BrewModalsContainer';
import { ProcedureModal } from '../src/components/brew/ProcedureModal';
import { RecipeSelectModal } from '../src/components/brew/RecipeSelectModal';
import { InventorySelectModal } from '../src/components/brew/InventorySelectModal';
import { FlavorWheelPicker } from '../src/core/flavor-wheel-picker';
import { shareTextAsFile } from '../src/platform/file-export';
import { listBackupFiles, readBackupFile } from '../src/data/backup';
import { toggleRecipeFavorite, getRecipes, initDatabase } from '../src/data/database';
import { translations } from '../src/core/i18n';
import { MASTER_RECIPES } from '../src/core/recipes-data';
import { InventoryItem } from '../src/core/database-schema';
import { LICENSES_URL } from '../src/core/app-identity';

function formatLocalDateOffset(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function collectText(node: renderer.ReactTestInstance): string {
  return node
    .findAll((n) => typeof n.type === 'string' && n.type === 'Text')
    .map((n) => {
      const ch = n.props.children;
      if (Array.isArray(ch)) return ch.filter((c) => typeof c === 'string' || typeof c === 'number').join('');
      return typeof ch === 'string' || typeof ch === 'number' ? String(ch) : '';
    })
    .join(' ');
}

describe('DEEP-029 (opcja a): Data palenia, dni od wypału, świeżość i ocena na BeanItemCard', () => {
  const baseItem: InventoryItem = {
    id: 'bean-d3-1',
    name: 'Etiopia Worka',
    type: 'coffee',
    roasterOrProducer: 'Hard Beans',
    origin: 'Gedeb',
    variety: 'Heirloom',
    process: 'Washed',
    roastOrHarvestDate: formatLocalDateOffset(10),
    initialWeightGrams: 250,
    remainingWeightGrams: 180,
    flavorNotes: ['jaśmin', 'brzoskwinia'],
    rating: 5,
    isFavorite: false,
    isArchived: false,
    createdAt: '2026-11-01T10:00:00.000Z',
    updatedAt: '2026-11-01T10:00:00.000Z',
  };

  test('computeDaysSinceLocalDate liczy różnicę kalendarzową bez przesunięcia UTC i odrzuca błędne daty', () => {
    const ref = new Date(2026, 10, 26, 23, 55, 0);
    expect(computeDaysSinceLocalDate('2026-11-26', ref)).toBe(0);
    expect(computeDaysSinceLocalDate('2026-11-16', ref)).toBe(10);
    expect(computeDaysSinceLocalDate('2026-11-26T08:00:00Z', ref)).toBe(0);
    expect(computeDaysSinceLocalDate('2026-11-2699', ref)).toBeNull();
    expect(computeDaysSinceLocalDate('2026-11-26xyz', ref)).toBeNull();
    expect(computeDaysSinceLocalDate('2026-02-30', ref)).toBeNull();
    expect(computeDaysSinceLocalDate('invalid', ref)).toBeNull();
    expect(computeDaysSinceLocalDate(undefined, ref)).toBeNull();
  });

  test('wyświetla datę palenia, liczbę dni od wypału, odznakę świeżości i ocenę', () => {
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <BeanItemCard
          item={baseItem}
          unitSystem="metric"
          onToggleFavorite={jest.fn()}
          onToggleArchive={jest.fn()}
          onSelectForBrew={jest.fn()}
          onOpenEdit={jest.fn()}
        />
      );
    });
    const text = collectText(tree.root);
    expect(text).toContain(baseItem.roastOrHarvestDate!);
    expect(text).toContain('10 d temu');
    expect(text).toContain('Szczyt świeżości');
    expect(tree.root.findByProps({ testID: 'bean-rating-bean-d3-1' })).toBeDefined();
    act(() => tree.unmount());
  });

  test('wyświetla status Odgazowuje (≤3d) i Po szczycie (>35d) oraz pomija odznakę dla herbaty', () => {
    let restingTree!: renderer.ReactTestRenderer;
    act(() => {
      restingTree = renderer.create(
        <BeanItemCard
          item={{ ...baseItem, id: 'bean-rest', roastOrHarvestDate: formatLocalDateOffset(2) }}
          unitSystem="metric"
          onToggleFavorite={jest.fn()}
          onToggleArchive={jest.fn()}
          onSelectForBrew={jest.fn()}
          onOpenEdit={jest.fn()}
        />
      );
    });
    expect(collectText(restingTree.root)).toContain('Odgazowuje');
    act(() => restingTree.unmount());

    let agedTree!: renderer.ReactTestRenderer;
    act(() => {
      agedTree = renderer.create(
        <BeanItemCard
          item={{ ...baseItem, id: 'bean-aged', roastOrHarvestDate: formatLocalDateOffset(45) }}
          unitSystem="metric"
          onToggleFavorite={jest.fn()}
          onToggleArchive={jest.fn()}
          onSelectForBrew={jest.fn()}
          onOpenEdit={jest.fn()}
        />
      );
    });
    expect(collectText(agedTree.root)).toContain('Po szczycie');
    act(() => agedTree.unmount());

    let teaTree!: renderer.ReactTestRenderer;
    act(() => {
      teaTree = renderer.create(
        <BeanItemCard
          item={{ ...baseItem, id: 'tea-1', type: 'tea', roastOrHarvestDate: formatLocalDateOffset(0) }}
          unitSystem="metric"
          onToggleFavorite={jest.fn()}
          onToggleArchive={jest.fn()}
          onSelectForBrew={jest.fn()}
          onOpenEdit={jest.fn()}
        />
      );
    });
    expect(collectText(teaTree.root)).toContain('dzisiaj');
    expect(teaTree.root.findAllByProps({ testID: 'bean-freshness-badge-tea-1' }).length).toBe(0);
    act(() => teaTree.unmount());
  });

  test('BeanEditModal ma unikalne testID dla przycisków szybkiej korekty wagi', () => {
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <BeanEditModal
          visible
          item={baseItem}
          onClose={jest.fn()}
          onSaved={jest.fn()}
          onDeleted={jest.fn()}
        />
      );
    });
    expect(tree.root.findAllByProps({ testID: 'quick-weight-minus-15' }).length).toBeGreaterThan(0);
    expect(tree.root.findAllByProps({ testID: 'quick-weight-minus-18' }).length).toBeGreaterThan(0);
    expect(tree.root.findAllByProps({ testID: 'quick-weight-plus-15' }).length).toBeGreaterThan(0);
    expect(tree.root.findAllByProps({ testID: 'quick-weight-zero' }).length).toBeGreaterThan(0);
    act(() => tree.unmount());
  });
});

describe('DEEP-030 (opcja a): Realny eksport plików Share Sheet i import z lokalnych plików JSON', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('shareTextAsFile zapisuje plik i wywołuje expo-sharing gdy dostępne', async () => {
    const writeSpy = jest.spyOn(FileSystem, 'writeAsStringAsync').mockResolvedValue(undefined);
    const availMock = (Sharing.isAvailableAsync as jest.Mock).mockReset().mockResolvedValue(true);
    const shareMock = (Sharing.shareAsync as jest.Mock).mockReset().mockResolvedValue(undefined);

    const res = await shareTextAsFile('napar backup:2026.json', '{"v":1}', 'application/json', 'public.json');
    expect(res.ok).toBe(true);
    expect(res.fileUri).toContain('napar_backup_2026.json');
    expect(writeSpy).toHaveBeenCalledTimes(1);
    expect(availMock).toHaveBeenCalledTimes(1);
    expect(shareMock).toHaveBeenCalledWith(
      expect.stringContaining('napar_backup_2026.json'),
      expect.objectContaining({ mimeType: 'application/json', UTI: 'public.json' })
    );
  });

  test('shareTextAsFile obsługuje brak dostępności Sharing, sprząta plik tymczasowy i odrzuca nazwy z samych kropek', async () => {
    const writeSpy = jest.spyOn(FileSystem, 'writeAsStringAsync').mockResolvedValue(undefined);
    const deleteSpy = jest.spyOn(FileSystem, 'deleteAsync').mockResolvedValue(undefined);
    (Sharing.isAvailableAsync as jest.Mock).mockReset().mockResolvedValue(false);
    const shareMock = (Sharing.shareAsync as jest.Mock).mockReset().mockResolvedValue(undefined);

    const res = await shareTextAsFile('..', 'a,b', 'text/csv', 'public.comma-separated-values-text');
    expect(res).toEqual({ ok: false, reason: 'unavailable' });
    expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining('/napar-export.txt'), 'a,b');
    expect(deleteSpy).toHaveBeenCalledWith(expect.stringContaining('/napar-export.txt'), { idempotent: true });
    expect(shareMock).not.toHaveBeenCalled();
  });

  test('shareTextAsFile zwraca no_directory gdy brak cacheDirectory i documentDirectory', async () => {
    const origCache = (FileSystem as any).cacheDirectory;
    const origDoc = (FileSystem as any).documentDirectory;
    (FileSystem as any).cacheDirectory = null;
    (FileSystem as any).documentDirectory = null;
    try {
      const res = await shareTextAsFile('test.json', '{}', 'application/json', 'public.json');
      expect(res).toEqual({ ok: false, reason: 'no_directory' });
    } finally {
      (FileSystem as any).cacheDirectory = origCache;
      (FileSystem as any).documentDirectory = origDoc;
    }
  });

  test('listBackupFiles skanuje Backup/ i Documents/, filtruje .tmp i state_corrupt_, a readBackupFile wczytuje plik', async () => {
    jest.spyOn(FileSystem, 'getInfoAsync').mockResolvedValue({ exists: true } as any);
    jest
      .spyOn(FileSystem, 'readDirectoryAsync')
      .mockResolvedValueOnce(['backup_2026-11-26.json', 'state_corrupt_1.json', 'temp.json.tmp'])
      .mockResolvedValueOnce(['imported.json', 'notes.txt']);
    jest.spyOn(FileSystem, 'readAsStringAsync').mockResolvedValue('{"version":1}');

    const files = await listBackupFiles();
    expect(files.map((f) => f.name)).toEqual(['imported.json', 'backup_2026-11-26.json']);
    expect(files.find((f) => f.name === 'backup_2026-11-26.json')?.source).toBe('backup');
    expect(files.find((f) => f.name === 'imported.json')?.source).toBe('documents');

    const content = await readBackupFile(files[0].path);
    expect(content).toBe('{"version":1}');
    expect(await readBackupFile('')).toBeNull();
  });

  test('JsonExportModal, CsvExportModal i JsonImportModal eksponują CTA udostępniania pliku i listę plików', () => {
    const onShareJson = jest.fn();
    let exportTree!: renderer.ReactTestRenderer;
    act(() => {
      exportTree = renderer.create(
        <JsonExportModal visible exportedJsonText='{"version":1}' onClose={jest.fn()} onShareFile={onShareJson} />
      );
    });
    const shareJsonBtn = exportTree.root.findByProps({ testID: 'share-json-file-btn' });
    act(() => shareJsonBtn.props.onPress());
    expect(onShareJson).toHaveBeenCalledTimes(1);
    act(() => exportTree.unmount());

    const onShareCsv = jest.fn();
    let csvTree!: renderer.ReactTestRenderer;
    act(() => {
      csvTree = renderer.create(
        <CsvExportModal visible title="CSV" csvText="a,b" onClose={jest.fn()} onShareFile={onShareCsv} />
      );
    });
    const shareCsvBtn = csvTree.root.findByProps({ testID: 'share-csv-file-btn' });
    act(() => shareCsvBtn.props.onPress());
    expect(onShareCsv).toHaveBeenCalledTimes(1);
    act(() => csvTree.unmount());

    const onSelectFile = jest.fn();
    let importTree!: renderer.ReactTestRenderer;
    act(() => {
      importTree = renderer.create(
        <JsonImportModal
          visible
          jsonText=""
          onChangeJsonText={jest.fn()}
          onConfirmImport={jest.fn()}
          onClose={jest.fn()}
          backupFiles={[{ name: 'kopia.json', path: '/doc/kopia.json', source: 'documents' }]}
          onSelectBackupFile={onSelectFile}
          onRefreshBackupFiles={jest.fn()}
          loadedFileName="kopia.json"
        />
      );
    });
    const fileBtn = importTree.root.findByProps({ testID: 'json-import-file-0' });
    act(() => fileBtn.props.onPress());
    expect(onSelectFile).toHaveBeenCalledWith({ name: 'kopia.json', path: '/doc/kopia.json', source: 'documents' });
    expect(importTree.root.findByProps({ testID: 'json-import-loaded-file' })).toBeDefined();
    act(() => importTree.unmount());
  });
});

describe('D3: Ulubione receptury, brak fake clipboard, brak duplikatu modala, lokalizacja i a11y', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('toggleRecipeFavorite zapisuje i przełącza is_favorite w SQLite', () => {
    initDatabase();
    const recipes = getRecipes();
    expect(recipes.length).toBeGreaterThan(0);
    const target = recipes[0];
    const initialFav = Boolean(target.isFavorite);
    const toggled = toggleRecipeFavorite(target.id);
    expect(toggled).toBe(!initialFav);
    const afterToggle = getRecipes().find((r) => r.id === target.id);
    expect(Boolean(afterToggle?.isFavorite)).toBe(!initialFav);
    // Przywróć stan początkowy
    toggleRecipeFavorite(target.id);
    expect(toggleRecipeFavorite('')).toBe(false);
    expect(toggleRecipeFavorite('non-existent-id-xyz')).toBe(false);
  });

  test('RecipeSelectModal wyświetla pusty stan zakładki Ulubione gdy żadna receptura nie jest ulubiona', () => {
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <RecipeSelectModal
          inline
          visible
          onClose={jest.fn()}
          recipes={[{ ...MASTER_RECIPES[0], isFavorite: false }]}
          activeRecipeId={MASTER_RECIPES[0].id}
          beveragePreference="both"
          categoryFilter="ALL"
          onCategoryFilterChange={jest.fn()}
          onSelectRecipe={jest.fn()}
          onToggleFavorite={jest.fn()}
          onDuplicateRecipe={jest.fn()}
          onEditRecipe={jest.fn()}
          onAddCustomRecipe={jest.fn()}
          onOpenGongfu={jest.fn()}
          onOpenImport={jest.fn()}
          onOpenQrScanner={jest.fn()}
          unitSystem="metric"
          t={translations.pl}
        />
      );
    });
    const favTab = tree.root.findByProps({ testID: 'subset-filter-favorites' });
    act(() => favTab.props.onPress());
    expect(tree.root.findByProps({ testID: 'favorites-empty-state' })).toBeDefined();
    // Przy niepustym wyszukiwaniu pokazujemy stan braku wyników wyszukiwania zamiast komunikatu o braku ulubionych
    const searchInput = tree.root.findByProps({ testID: 'recipe-search-input' });
    act(() => searchInput.props.onChangeText('zzzz-nieistnieje'));
    expect(tree.root.findAllByProps({ testID: 'favorites-empty-state' })).toHaveLength(0);
    expect(tree.root.findByProps({ testID: 'no-search-results-state' })).toBeDefined();
    act(() => tree.unmount());
  });

  test('ProcedureModal zachowuje zamontowany komponent Modal z onDismiss przy przejściu visible: true -> false (regresja iOS P0)', () => {
    const onDismiss = jest.fn();
    const baseProps = {
      recipeName: 'V60 Test',
      steps: MASTER_RECIPES[0].steps,
      currentStepIndex: 0,
      isRunning: false,
      status: 'paused' as const,
      stepRemainingSeconds: 30,
      totalElapsedSeconds: 60,
      unitSystem: 'metric' as const,
      language: 'pl',
      t: translations.pl,
      onPauseResume: jest.fn(),
      onAdjustTimeSeconds: jest.fn(),
      onResetCurrentStep: jest.fn(),
      onPrevStep: jest.fn(),
      onNextStep: jest.fn(),
      onFinishAndSave: jest.fn(),
      onClose: jest.fn(),
      onDismiss,
    };

    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<ProcedureModal {...baseProps} visible={true} />);
    });
    expect(tree.root.findByType(Modal).props.visible).toBe(true);

    act(() => {
      tree.update(<ProcedureModal {...baseProps} visible={false} />);
    });
    const modal = tree.root.findByType(Modal);
    expect(modal.props.visible).toBe(false);
    expect(modal.props.onDismiss).toBe(onDismiss);
    act(() => modal.props.onDismiss());
    expect(onDismiss).toHaveBeenCalledTimes(1);
    act(() => tree.unmount());
  });

  test('ShareRecipeModal pokazuje kopiowalny link napar:// i otwiera realny Share.share bez fałszywego komunikatu', () => {
    const shareSpy = jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' } as any);
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const shareUrl = 'napar://recipe?v=1&d=test123';
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <ShareRecipeModal
          visible
          onClose={jest.fn()}
          recipe={MASTER_RECIPES[0]}
          shareUrl={shareUrl}
          waterTempCelsius={93}
          unitSystem="metric"
          language="pl"
          t={translations.pl}
        />
      );
    });
    const urlText = tree.root.findByProps({ testID: 'share-recipe-url-text' });
    expect(urlText.props.selectable).toBe(true);
    expect(urlText.props.children).toBe(shareUrl);

    const copyBtn = tree.root.findByProps({ testID: 'copy-link-btn' });
    act(() => copyBtn.props.onPress());
    expect(shareSpy).toHaveBeenCalledWith(expect.objectContaining({ message: shareUrl, url: shareUrl }));
    expect(alertSpy).not.toHaveBeenCalled();
    act(() => tree.unmount());
  });

  test('BrewModalsContainer nie duplikuje InventorySelectModal i bezpiecznie przełącza ProcedureModal -> BrewFinishModal przez onDismiss na iOS', () => {
    const setShowProcedureModal = jest.fn();
    const setShowFinishModal = jest.fn();
    const pauseTimer = jest.fn();
    const mockWorkflow: any = {
      recipe: MASTER_RECIPES[0],
      scaledSteps: MASTER_RECIPES[0].steps,
      snapshot: { currentStepIndex: 0, status: 'paused', stepRemainingSeconds: 30, totalElapsedSeconds: 60, currentStep: MASTER_RECIPES[0].steps[0] },
      isRunning: false,
      unitSystem: 'metric',
      language: 'pl',
      pauseTimer,
      resumeTimer: jest.fn(),
      adjustStepDuration: jest.fn(),
      resetCurrentStep: jest.fn(),
      previousStep: jest.fn(),
      nextStep: jest.fn(),
      resetTimer: jest.fn(),
      handleStartTimer: jest.fn(),
      handleResetWithConfirm: jest.fn(),
      selectRecipe: jest.fn(),
      refreshData: jest.fn(),
      showProcedureModal: true,
      setShowProcedureModal,
      showFinishModal: false,
      setShowFinishModal,
      showGrinderModal: false,
      setShowGrinderModal: jest.fn(),
      showShareModal: false,
      setShowShareModal: jest.fn(),
      showImportModal: false,
      setShowImportModal: jest.fn(),
      showQrScanner: false,
      setShowQrScanner: jest.fn(),
      showOnboarding: false,
      handleCompleteOnboarding: jest.fn(),
      waterGrams: 250,
      waterTempCelsius: 93,
      grinderId: 'comandante_c40',
      setGrinderId: jest.fn(),
      shareUrl: 'napar://recipe?v=1&d=abc',
      rating: 4,
      setRating: jest.fn(),
      tasteBalance: 'balanced',
      setTasteBalance: jest.fn(),
      sensoryProfile: { acidity: 3, sweetness: 3, body: 3, clarity: 3, finish: 3 },
      setSensoryProfile: jest.fn(),
      selectedTags: [],
      toggleTag: jest.fn(),
      waterProfile: 'sca_gold',
      setWaterProfile: jest.fn(),
      notes: '',
      setNotes: jest.fn(),
      handleFinishSave: jest.fn(),
      handleScanQrRecipe: jest.fn(),
      t: translations.pl,
    };

    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<BrewModalsContainer workflow={mockWorkflow} />);
    });
    // Brak zdublowanego InventorySelectModal wewnątrz BrewModalsContainer
    expect(tree.root.findAllByType(InventorySelectModal).length).toBe(0);

    // Przejście ProcedureModal -> BrewFinishModal czeka na onDismiss na iOS
    const finishBtn = tree.root.findByProps({ testID: 'save-brew-btn' });
    act(() => finishBtn.props.onPress());
    expect(pauseTimer).toHaveBeenCalled();
    expect(setShowProcedureModal).toHaveBeenCalledWith(false);
    if (Platform.OS === 'ios') {
      expect(setShowFinishModal).not.toHaveBeenCalled();
      const procedureModalNode = tree.root.findAll((n) => n.props.onDismiss)[0];
      act(() => procedureModalNode.props.onDismiss());
      expect(setShowFinishModal).toHaveBeenCalledWith(true);
    }
    act(() => tree.unmount());
  });

  test('BrewFinishModal lokalizuje wykres sensoryczny na EN i formatuje wodę w jednostkach imperialnych (fl oz)', () => {
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <BrewFinishModal
          visible
          totalElapsedSeconds={180}
          waterGrams={250}
          rating={4}
          onChangeRating={jest.fn()}
          tasteBalance="balanced"
          onChangeTasteBalance={jest.fn()}
          sensoryProfile={{ acidity: 4, sweetness: 4, body: 3, clarity: 4, finish: 4 }}
          onChangeSensoryProfile={jest.fn()}
          selectedTags={[]}
          onToggleTag={jest.fn()}
          waterProfile="sca_gold"
          onChangeWaterProfile={jest.fn()}
          notes=""
          onChangeNotes={jest.fn()}
          language="en"
          unitSystem="imperial"
          onSkip={jest.fn()}
          onSave={jest.fn()}
        />
      );
    });
    const text = collectText(tree.root);
    expect(text).toContain('fl oz');
    expect(text).toContain('Acidity');
    expect(text).not.toContain('250g');
    act(() => tree.unmount());
  });

  test('BrewHeader i InventorySelectModal respektują jednostki imperialne (oz)', () => {
    const item: InventoryItem = {
      id: 'imp-1',
      name: 'Kenya AA',
      type: 'coffee',
      roasterOrProducer: 'Roastery',
      initialWeightGrams: 250,
      remainingWeightGrams: 180,
      flavorNotes: [],
      isFavorite: false,
      isArchived: false,
      createdAt: '2026-11-01T00:00:00Z',
      updatedAt: '2026-11-01T00:00:00Z',
    };

    let headerTree!: renderer.ReactTestRenderer;
    act(() => {
      headerTree = renderer.create(
        <BrewHeader
          recipe={MASTER_RECIPES[0]}
          selectedInventoryItem={item}
          waterTempCelsius={93}
          unitSystem="imperial"
          grinderRecommendation={{ grinderName: 'Comandante C40', formatted: '24 clicks' }}
          favoriteRecipes={[MASTER_RECIPES[0]]}
          onSelectRecipe={jest.fn()}
          onOpenRecipeModal={jest.fn()}
          onOpenInventoryModal={jest.fn()}
          onOpenGrinderModal={jest.fn()}
          onOpenShareModal={jest.fn()}
          onNavigateToGongfu={jest.fn()}
        />
      );
    });
    expect(collectText(headerTree.root)).toContain('oz');
    act(() => headerTree.unmount());

    let invTree!: renderer.ReactTestRenderer;
    act(() => {
      invTree = renderer.create(
        <InventorySelectModal
          inline
          visible
          onClose={jest.fn()}
          inventory={[item]}
          selectedItem={null}
          onSelectItem={jest.fn()}
          unitSystem="imperial"
          language="en"
          t={translations.en}
        />
      );
    });
    expect(collectText(invTree.root)).toContain('oz');
    act(() => invTree.unmount());
  });

  test('FlavorWheelPicker używa ScrollView (nestedScrollEnabled) dla kontenera deskryptorów', () => {
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <FlavorWheelPicker selectedDescriptors={['Malina']} onToggleDescriptor={jest.fn()} language="pl" />
      );
    });
    const scroll = tree.root.findByProps({ testID: 'flavor-wheel-descriptors-scroll' });
    expect(scroll.type).toBe(ScrollView);
    expect(scroll.props.nestedScrollEnabled).toBe(true);
    act(() => tree.unmount());
  });

  test('OssLicensesModal wyświetla listę bibliotek OSS i przycisk linku online', () => {
    const onOpenWebLink = jest.fn();
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <OssLicensesModal visible onClose={jest.fn()} onOpenWebLink={onOpenWebLink} />
      );
    });
    const text = collectText(tree.root);
    expect(BUNDLED_OSS_LICENSES.length).toBeGreaterThanOrEqual(15);
    expect(text).toContain('react-native');
    expect(text).toContain('expo-sharing');
    expect(tree.root.findByProps({ testID: 'oss-mit-notice' })).toBeDefined();
    expect(text).toContain('Permission is hereby granted, free of charge');
    const webBtn = tree.root.findByProps({ testID: 'oss-licenses-web-link' });
    act(() => webBtn.props.onPress());
    expect(onOpenWebLink).toHaveBeenCalledTimes(1);
    expect(LICENSES_URL).toContain('licenses.html');
    act(() => tree.unmount());
  });
});

describe('D3: Zgodność prawna RODO art. 13, licencje OSS i kontrast na site/', () => {
  const siteDir = path.join(__dirname, '..', 'site');

  test('site/privacy.html i site/en/privacy.html zawierają sekcję RODO art. 13 / GDPR Art. 13 i UODO', () => {
    const pl = fs.readFileSync(path.join(siteDir, 'privacy.html'), 'utf8');
    const en = fs.readFileSync(path.join(siteDir, 'en', 'privacy.html'), 'utf8');
    expect(pl).toMatch(/RODO.*art\.\s*13/i);
    expect(pl).toMatch(/UODO/);
    expect(pl).toMatch(/support@apps4brew\.com/);
    expect(pl).toMatch(/GitHub Pages/);
    expect(en).toMatch(/GDPR.*Article\s*13/i);
    expect(en).toMatch(/UODO/);
    expect(en).toMatch(/support@apps4brew\.com/);
    expect(en).toMatch(/GitHub Pages/);
  });

  test('site/support.html ma jawny kontrast linków (var(--accent-gold)) i hreflang', () => {
    const support = fs.readFileSync(path.join(siteDir, 'support.html'), 'utf8');
    expect(support).toMatch(/a,\s*\.contact-box\s+a\s*\{[\s\S]*color:\s*var\(--accent-gold\)/);
    expect(support).toContain('hreflang="en"');
  });

  test('site/licenses.html istnieje i wymienia kluczowe pakiety MIT, a site/terms.html ma landmark <main>', () => {
    const licenses = fs.readFileSync(path.join(siteDir, 'licenses.html'), 'utf8');
    expect(licenses).toContain('react-native');
    expect(licenses).toContain('expo-sqlite');
    expect(licenses).toContain('MIT');

    const terms = fs.readFileSync(path.join(siteDir, 'terms.html'), 'utf8');
    expect(terms).toContain('<main class="container">');
    expect(terms).toContain('rel="noopener noreferrer"');
  });
});

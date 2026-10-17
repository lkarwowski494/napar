// ============================================================================
// Napar (Steepwise) — Ekran Główny: Asystent Parzenia (Active Brew Assistant)
// Apps4Brew: Zero-login, instant start, precyzyjny stoper z haptyką i Live Guidance
// ============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useBrew } from '../../src/core/brew-context';
import {
  getRecipes,
  getInventoryItems,
  getBrewSessions,
  toggleRecipeFavorite,
  saveRecipe,
  duplicateRecipe,
  getUnitSystem,
  getHasCompletedOnboarding,
  setHasCompletedOnboarding,
  BeveragePreference,
} from '../../src/core/database';
import {
  StarIcon,
  ShieldIcon,
} from '../../src/components/icons/CraftIcons';
import { MASTER_RECIPES } from '../../src/core/recipes-data';
import { InventoryItem, SavedRecipe } from '../../src/core/database-schema';
import { theme } from '../../src/core/theme';
import { useTranslation } from '../../src/core/i18n';
import {
  DEFAULT_SENSORY_PROFILE,
  SensoryProfile,
} from '../../src/core/radar-chart';
import { calculateBatchScaling } from '../../src/core/domain-rules';
import {
  encodeRecipeToShareUrl,
  decodeRecipeFromShareUrl,
} from '../../src/core/recipe-share';
import { confirmAction } from '../../src/core/confirm';
import { calculateBrewCost } from '../../src/core/cost-calculator';
import { QrScannerModal } from '../../src/core/QrScannerModal';
import { useAppAccess } from '../../src/core/app-access';
import { Apps4BrewPassModal } from '../../src/components/Apps4BrewPassModal';
import { OnboardingModal } from '../../src/components/OnboardingModal';
import { BrewHeader } from '../../src/components/brew/BrewHeader';
import { BrewQuickPrepCard } from '../../src/components/brew/BrewQuickPrepCard';
import { BrewActiveFocusTimer } from '../../src/components/brew/BrewActiveFocusTimer';
import { BrewProAccordion } from '../../src/components/brew/BrewProAccordion';
import { BrewFinishModal } from '../../src/components/brew/BrewFinishModal';
import { RecipeSelectModal } from '../../src/components/brew/RecipeSelectModal';
import { InventorySelectModal } from '../../src/components/brew/InventorySelectModal';
import { GrinderSelectModal } from '../../src/components/brew/GrinderSelectModal';
import { ShareRecipeModal } from '../../src/components/brew/ShareRecipeModal';
import { ImportRecipeModal } from '../../src/components/brew/ImportRecipeModal';
import { ProcedureModal } from '../../src/components/brew/ProcedureModal';
import {
  checkCorruptState,
  dismissCorruptState,
  CorruptStateRecovery,
} from '../../src/core/backup';

export default function BrewScreen() {
  const router = useRouter();
  const { t, language } = useTranslation();
  const { canCreate, isHistoryReadOnly, recordBrew, refresh } = useAppAccess();
  const unitSystem = getUnitSystem();

  const {
    recipe,
    selectedInventoryItem,
    doseGrams,
    waterGrams,
    waterTempCelsius,
    grindSetting,
    snapshot,
    selectRecipe,
    selectInventoryItem,
    setDoseGrams,
    setWaterGrams,
    setWaterTempCelsius,
    setGrindSetting,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    nextStep,
    previousStep,
    adjustStepDuration,
    finishAndSaveSession,
    waterProfile,
    setWaterProfile,
    grinderId,
    setGrinderId,
    grinderRecommendation,
    beveragePreference,
    setBeveragePreference,
  } = useBrew();

  const [allRecipes, setAllRecipes] = useState<any[]>(MASTER_RECIPES);
  const [allInventory, setAllInventory] = useState<InventoryItem[]>([]);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [showProcedureModal, setShowProcedureModal] = useState(false);
  const [showGrinderModal, setShowGrinderModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [showPaywallModal, setShowPaywallModal] = useState(false);
  const [corruptState, setCorruptState] = useState<CorruptStateRecovery | null>(null);

  useEffect(() => {
    void checkCorruptState().then((res) => {
      if (res) setCorruptState(res);
    });
  }, []);

  const handleDismissCorrupt = () => {
    if (corruptState) {
      void dismissCorruptState(corruptState.corruptFile);
      setCorruptState(null);
    }
  };

  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => {
    try {
      return !getHasCompletedOnboarding();
    } catch {
      return false;
    }
  });

  const handleCompleteOnboarding = (pref: BeveragePreference) => {
    try {
      setHasCompletedOnboarding(true);
      setBeveragePreference(pref);
    } catch {
      // ignore
    }
    setShowOnboarding(false);
  };

  const isCurrentRecipeTea =
    'beverageType' in recipe
      ? recipe.beverageType === 'TEA'
      : (recipe as any).type === 'TEA';

  const [currentBeverageType, setCurrentBeverageType] = useState<'COFFEE' | 'TEA'>(() => {
    if (beveragePreference === 'tea') return 'TEA';
    if (beveragePreference === 'coffee') return 'COFFEE';
    return isCurrentRecipeTea ? 'TEA' : 'COFFEE';
  });

  useEffect(() => {
    if (beveragePreference === 'tea') {
      setCurrentBeverageType('TEA');
    } else if (beveragePreference === 'coffee') {
      setCurrentBeverageType('COFFEE');
    } else {
      setCurrentBeverageType(isCurrentRecipeTea ? 'TEA' : 'COFFEE');
    }
  }, [beveragePreference, isCurrentRecipeTea]);

  const [recipeCategoryFilter, setRecipeCategoryFilter] = useState<'ALL' | 'COFFEE' | 'TEA'>(() => {
    if (beveragePreference === 'tea') return 'TEA';
    if (beveragePreference === 'coffee') return 'COFFEE';
    return 'ALL';
  });

  useEffect(() => {
    if (beveragePreference === 'tea') {
      setRecipeCategoryFilter('TEA');
    } else if (beveragePreference === 'coffee') {
      setRecipeCategoryFilter('COFFEE');
    }
  }, [beveragePreference]);

  const handleBeverageTypeChange = (type: 'COFFEE' | 'TEA') => {
    setCurrentBeverageType(type);
    setRecipeCategoryFilter(type);
    const currentMatches =
      'beverageType' in recipe ? recipe.beverageType === type : (recipe as any).type === type;
    if (!currentMatches) {
      const matchingRecipe = allRecipes.find((r) =>
        'beverageType' in r ? r.beverageType === type : r.type === type
      );
      if (matchingRecipe) {
        handleSelectRecipe(matchingRecipe);
      }
    }
  };

  const recentFiveStarSession = useMemo(() => {
    try {
      const sessions = getBrewSessions();
      if (!sessions || sessions.length === 0) return null;
      const filtered = sessions.filter((s) => {
        if (beveragePreference === 'coffee' && s.beverageType !== 'COFFEE') return false;
        if (beveragePreference === 'tea' && s.beverageType !== 'TEA') return false;
        return true;
      });
      if (filtered.length === 0) return null;
      return filtered.find((s) => (s.rating || 0) >= 4.5) || filtered[0] || null;
    } catch {
      return null;
    }
  }, [allRecipes, beveragePreference]);

  const handleQuickReBrew = (s: any) => {
    const foundRecipe = allRecipes.find(
      (r) => r.name === s.recipeName || r.namePl === s.recipeName
    );
    if (foundRecipe) {
      selectRecipe(foundRecipe);
    }
    if (s.doseGrams) setDoseGrams(s.doseGrams);
    if (s.waterGrams) setWaterGrams(s.waterGrams);
    if (s.waterTempCelsius) setWaterTempCelsius(s.waterTempCelsius);
    if (s.grindSetting) setGrindSetting(s.grindSetting);
    if (s.waterProfile) setWaterProfile(s.waterProfile);
    if (s.inventoryItemId) {
      const item = allInventory.find((i) => i.id === s.inventoryItemId);
      if (item) selectInventoryItem(item);
    }
    Alert.alert(
      'Załadowano parametry!',
      `Receptura "${s.recipeName || s.method}" (${s.doseGrams}g / ${s.waterGrams}g) jest gotowa.`
    );
  };

  const brewCost = useMemo(() => {
    return calculateBrewCost({
      doseGrams,
      waterWeightGrams: waterGrams,
    });
  }, [doseGrams, waterGrams]);

  const handleStartTimer = () => {
    if (!canCreate) {
      setShowPaywallModal(true);
      return;
    }
    if (
      selectedInventoryItem &&
      selectedInventoryItem.remainingWeightGrams < doseGrams
    ) {
      confirmAction({
        title: 'Mało ziaren w paczce!',
        message: `W paczce "${selectedInventoryItem.name}" pozostało tylko ${selectedInventoryItem.remainingWeightGrams}g, a doza wymaga ${doseGrams}g. Czy chcesz zaparzyć blend z innymi ziarnami?`,
        actionText: 'Parz Blend',
        onConfirm: () => startTimer(),
      });
      return;
    }
    startTimer();
  };

  const handleScanQrRecipe = (data: string) => {
    setShowQrScanner(false);
    if (!canCreate) {
      setShowPaywallModal(true);
      return;
    }
    try {
      const decoded = decodeRecipeFromShareUrl(data);
      if (decoded && decoded.recipe) {
        saveRecipe(decoded.recipe);
        refreshData();
        selectRecipe(decoded.recipe);
        Alert.alert(
          'Zeskanowano recepturę!',
          `Receptura "${decoded.recipe.name}" została zapisana w Twojej bazie.`
        );
      } else {
        Alert.alert('Nie udało się zeskanować', 'Kod QR nie zawiera prawidłowej receptury Napar.');
      }
    } catch {
      Alert.alert('Nie udało się zeskanować', 'Nie udało się przetworzyć danych z kodu QR.');
    }
  };

  const shareUrl = useMemo(() => {
    try {
      return encodeRecipeToShareUrl(recipe);
    } catch {
      return '';
    }
  }, [recipe]);

  // Formularz podsumowania degustacji po parzeniu
  const [rating, setRating] = useState<number>(5);
  const [tasteBalance, setTasteBalance] = useState<string>('balanced');
  const [tdsInput, setTdsInput] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sensoryProfile, setSensoryProfile] = useState<SensoryProfile>(
    DEFAULT_SENSORY_PROFILE
  );

  // Skalowanie porcji (Batch Scaling 1–4 osób)
  const [servings, setServings] = useState<number>(1);

  const baseDose =
    'doseGrams' in recipe ? recipe.doseGrams : recipe.coffeeOrTeaDoseGrams;
  const baseWater =
    'waterGrams' in recipe ? recipe.waterGrams : recipe.waterWeightGrams;
  const batchScaling = calculateBatchScaling(baseDose, baseWater, servings);

  const handleServingsChange = (n: number) => {
    setServings(n);
    const scaling = calculateBatchScaling(baseDose, baseWater, n);
    setDoseGrams(scaling.scaledDoseGrams);
  };

  const handleSelectRecipe = (r: any) => {
    if (snapshot.totalElapsedSeconds > 0 && snapshot.status !== 'finished') {
      confirmAction({
        title: language === 'en' ? 'Change recipe?' : 'Zmienić recepturę?',
        message:
          language === 'en'
            ? 'An active brew session is in progress. Changing recipe will reset timer progress.'
            : 'Trwa aktywna sesja parzenia. Zmiana receptury zresetuje postęp stopera.',
        actionText: language === 'en' ? 'Change' : 'Zmień',
        destructive: true,
        onConfirm: () => {
          resetTimer();
          selectRecipe(r);
          setServings(1);
          setShowRecipeModal(false);
        },
      });
    } else {
      selectRecipe(r);
      setServings(1);
      setShowRecipeModal(false);
    }
  };

  const handleResetWithConfirm = () => {
    if (snapshot.totalElapsedSeconds > 0) {
      confirmAction({
        title:
          language === 'en' ? 'Reset brew session?' : 'Zresetować sesję parzenia?',
        message:
          language === 'en'
            ? 'Current brew progress will be cleared.'
            : 'Bieżący postęp parzenia zostanie wyzerowany.',
        actionText: language === 'en' ? 'Reset' : 'Zresetuj',
        destructive: true,
        onConfirm: resetTimer,
      });
    } else {
      resetTimer();
    }
  };

  const handleDuplicateRecipe = (r: any) => {
    if (!canCreate) {
      setShowRecipeModal(false);
      setShowPaywallModal(true);
      return;
    }
    const cloned = duplicateRecipe(r);
    refreshData();
    Alert.alert(
      t.brew.duplicateRecipe,
      `${t.brew.duplicateSuccess} ("${cloned.name}")`
    );
  };

  const refreshData = () => {
    try {
      const dbRecipes = getRecipes();
      if (dbRecipes && dbRecipes.length > 0) {
        setAllRecipes(dbRecipes);
      }
      const inventory = getInventoryItems();
      setAllInventory(inventory);
    } catch {
      // fallback do predefiniowanych
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Smart preselection ziaren ze spiżarni
  useEffect(() => {
    if (!selectedInventoryItem && allInventory.length > 0) {
      const defaultItem =
        allInventory.find((i) => i.isFavorite) || allInventory[0];
      if (defaultItem) {
        selectInventoryItem(defaultItem);
      }
    }
  }, [allInventory, selectedInventoryItem]);

  // Automatyczne otwarcie arkusza oceniania po zakończeniu parzenia
  useEffect(() => {
    if (snapshot.status === 'finished') {
      setShowFinishModal(true);
    }
  }, [snapshot.status]);

  const handleFinishSave = () => {
    const tdsNum = parseFloat(tdsInput);
    finishAndSaveSession({
      rating,
      tasteBalance,
      flavorTags: selectedTags,
      sensory: sensoryProfile,
      tdsPercentage: isNaN(tdsNum) ? undefined : tdsNum,
      notes: notes.trim() || undefined,
      logToCaffeineTracker: true,
    });
    recordBrew();
    setShowFinishModal(false);
    resetTimer();
    Alert.alert('Zapisano!', 'Sesja parzenia została utrwalona w Twoim Dzienniku.');
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const isRunning = snapshot.status === 'running';
  const isPaused = snapshot.status === 'paused';
  const favoriteRecipes = allRecipes.filter((r) => Boolean(r.isFavorite));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Baner odzyskiwania uszkodzonego stanu (BR-TEST-023) */}
      {corruptState && (
        <View style={styles.corruptBanner} testID="corrupt-state-banner">
          <View style={{ flex: 1 }}>
            <Text style={styles.corruptBannerTitle}>
              {language === 'pl'
                ? 'Wykryto uszkodzony stan po awarii'
                : 'Corrupt state detected after crash'}
            </Text>
            <Text style={styles.corruptBannerDesc}>
              {language === 'pl'
                ? `Plik ${corruptState.corruptFile} został zabezpieczony w Backup/. Twoje dane bazowe są nienaruszone.`
                : `File ${corruptState.corruptFile} was secured in Backup/. Your base data is intact.`}
            </Text>
          </View>
          <Pressable
            style={styles.corruptDismissBtn}
            onPress={handleDismissCorrupt}
            accessibilityRole="button"
            accessibilityLabel="Odrzuć komunikat awarii"
          >
            <Text style={styles.corruptDismissText}>
              {language === 'pl' ? 'Odrzuć' : 'Dismiss'}
            </Text>
          </Pressable>
        </View>
      )}

      {/* Read-Only Status Banner when trial expired */}
      {isHistoryReadOnly && (
        <View style={styles.readOnlyBanner}>
          <ShieldIcon size={16} color={theme.colors.copper} />
          <Text style={styles.readOnlyBannerText}>
            Tryb Tylko do Odczytu — Twoje receptury i historia są bezpieczne. Parzenie i edycja wymagają Apps4Brew Pass.
          </Text>
        </View>
      )}

      {/* Stały, nierozpychający ekranu baner "Złote Zasady" domeny (BPR Pillar 2) */}
      <View style={styles.goldenRulesBanner} testID="golden-rules-banner">
        <Text style={styles.goldenRulesBannerText} numberOfLines={2}>
          {language === 'en'
            ? '⚖️ Golden Rules: Sour/thin → grind finer (2 clicks) or raise temp 2°C · Bitter/dry → grind coarser (2 clicks) · Peak: 7–35d.'
            : '⚖️ Złote Zasady: Kwaśna/płaska → drobniej o 2 kliki lub wyższa temp. o 2°C · Gorzka/sucha → grubiej o 2 kliki · Peak: 7–35 dni.'}
        </Text>
      </View>

      {/* KROK 1: Co robimy? (Wybór obiektu / surowca / szablonu) */}
      <View style={styles.bprStepLabelRow}>
        <View style={styles.bprStepBadge}>
          <Text style={styles.bprStepBadgeText}>1</Text>
        </View>
        <Text style={styles.bprStepTitle}>
          {language === 'en'
            ? 'STEP 1: WHAT ARE WE BREWING? (RECIPE & STASH)'
            : 'KROK 1: CO ROBIMY? (WYBÓR RECEPTURY I SUROWCA)'}
        </Text>
      </View>
      <BrewHeader
        recipe={recipe}
        selectedInventoryItem={selectedInventoryItem}
        waterTempCelsius={waterTempCelsius}
        grinderRecommendation={grinderRecommendation}
        favoriteRecipes={favoriteRecipes}
        isRunning={isRunning || isPaused}
        beveragePreference={beveragePreference}
        beverageType={currentBeverageType}
        onBeverageTypeChange={handleBeverageTypeChange}
        onSelectRecipe={handleSelectRecipe}
        onOpenRecipeModal={() => {
          refreshData();
          setRecipeCategoryFilter(currentBeverageType);
          setShowRecipeModal(true);
        }}
        onOpenInventoryModal={() => setShowInventoryModal(true)}
        onOpenGrinderModal={() => setShowGrinderModal(true)}
        onOpenShareModal={() => setShowShareModal(true)}
        onNavigateToGongfu={() => router.push('/gongfu')}
      />

      {/* 1-Tap Quick Re-Brew (Bleary-Eyed Barista Shortcut) */}
      {recentFiveStarSession && !isRunning && !isPaused && (
        <Pressable
          style={styles.reBrewBanner}
          onPress={() => handleQuickReBrew(recentFiveStarSession)}
          accessibilityRole="button"
          accessibilityLabel={`Powtórz ostatni udany napar: ${recentFiveStarSession.recipeName || recentFiveStarSession.method}`}
          testID="quick-rebrew-banner"
        >
          <View style={styles.reBrewIconBox}>
            <StarIcon size={14} color={theme.colors.copper} filled />
          </View>
          <View style={styles.reBrewInfo}>
            <Text style={styles.reBrewEyebrow}>POWTÓRZ OSTATNI NAPAR (1-TAP)</Text>
            <Text style={styles.reBrewTitle} numberOfLines={1}>
              {recentFiveStarSession.recipeName || recentFiveStarSession.method} · {recentFiveStarSession.doseGrams}g / {recentFiveStarSession.waterGrams}g
            </Text>
          </View>
          <Text style={styles.reBrewArrow}>→</Text>
        </Pressable>
      )}

      {/* KROK 2 & KROK 3: Parametry wejściowe oraz Przeliczone wyniki i proporcje na żywo */}
      {!isRunning && !isPaused && (
        <>
          <View style={styles.bprStepLabelRow}>
            <View style={styles.bprStepBadge}>
              <Text style={styles.bprStepBadgeText}>2</Text>
            </View>
            <Text style={styles.bprStepTitle}>
              {language === 'en'
                ? 'STEP 2 & 3: INPUT PARAMETERS & LIVE PROPORTIONS'
                : 'KROK 2 & 3: PARAMETRY WEJŚCIOWE I PROPORCJE NA ŻYWO'}
            </Text>
          </View>
          <BrewQuickPrepCard
            doseGrams={doseGrams}
            waterGrams={waterGrams}
            waterTempCelsius={waterTempCelsius}
            grindSetting={grindSetting}
            servings={servings}
            onServingsChange={handleServingsChange}
            onDoseChange={setDoseGrams}
            onWaterChange={setWaterGrams}
            disabled={isRunning}
            batchScaling={batchScaling}
            unitSystem={unitSystem}
          />
        </>
      )}

      {/* KROK 4: Przycisk otwierający pełnoekranowy Asystent Procedury Krok po Kroku */}
      <View style={styles.bprStepLabelRow}>
        <View style={styles.bprStepBadge}>
          <Text style={styles.bprStepBadgeText}>4</Text>
        </View>
        <Text style={styles.bprStepTitle}>
          {language === 'en'
            ? 'STEP 4: STEP-BY-STEP PROCEDURE EXECUTION'
            : 'KROK 4: ASYSTENT PROCEDURY KROK PO KROKU'}
        </Text>
      </View>

      <Pressable
        testID="open-procedure-modal-btn"
        style={styles.openProcedureCta}
        onPress={() => {
          if (!canCreate) {
            setShowPaywallModal(true);
            return;
          }
          if (!isRunning && !isPaused) {
            startTimer();
          }
          setShowProcedureModal(true);
        }}
        accessibilityRole="button"
        accessibilityLabel={
          language === 'en'
            ? 'Open Step-by-Step Procedure Assistant'
            : 'Otwórz Asystenta Procedury Krok po Kroku'
        }
      >
        <Text style={styles.openProcedureCtaTitle}>
          {language === 'en'
            ? '▶ OPEN STEP-BY-STEP PROCEDURE ASSISTANT'
            : '▶ OTWÓRZ ASYSTENTA PROCEDURY KROK PO KROKU'}
        </Text>
        <Text style={styles.openProcedureCtaSub}>
          {language === 'en'
            ? 'Auto-parsed step timer · Full screen · 1-Tap Finish & Save'
            : 'Auto-stoper z opisu kroku · Pełny ekran · Zakończ i zapisz'}
        </Text>
      </Pressable>

      {/* Główny Stoper Focus Mode: Zoptymalizowany pod 1 metr */}
      <BrewActiveFocusTimer
        snapshot={snapshot}
        onStart={handleStartTimer}
        onPause={pauseTimer}
        onResume={resumeTimer}
        onReset={handleResetWithConfirm}
        onNextStep={nextStep}
        onPreviousStep={previousStep}
        onAdjustStepDuration={adjustStepDuration}
        onFinish={() => setShowFinishModal(true)}
      />

      {/* Akordeon PRO: Schowany pod rozwijanym panelem (Progressive Disclosure) */}
      {!isRunning && !isPaused && (
        <BrewProAccordion
          waterProfile={waterProfile}
          onSelectWaterProfile={setWaterProfile}
          tdsInput={tdsInput}
          onChangeTds={setTdsInput}
        />
      )}

      {/* Pełnoekranowy Asystent Procedury Krok po Kroku (ProcedureModal — BPR Pillar 3 & 4) */}
      <ProcedureModal
        visible={showProcedureModal}
        recipeName={recipe.name}
        steps={
          'steps' in recipe && Array.isArray((recipe as any).steps)
            ? (recipe as any).steps
            : [snapshot.currentStep]
        }
        currentStepIndex={snapshot.currentStepIndex}
        isRunning={isRunning}
        stepRemainingSeconds={snapshot.stepRemainingSeconds}
        totalElapsedSeconds={snapshot.totalElapsedSeconds}
        unitSystem={unitSystem}
        language={language}
        onPauseResume={() => {
          if (isRunning) {
            pauseTimer();
          } else {
            resumeTimer();
          }
        }}
        onAdjustTimeSeconds={(deltaSec) => adjustStepDuration(deltaSec)}
        onResetCurrentStep={(parsedSec) => {
          const delta = parsedSec - snapshot.stepRemainingSeconds;
          if (delta !== 0) {
            adjustStepDuration(delta);
          }
        }}
        onPrevStep={() => {
          previousStep();
          if (!isRunning) resumeTimer();
        }}
        onNextStep={() => {
          nextStep();
          if (!isRunning) resumeTimer();
        }}
        onFinishAndSave={() => {
          setShowProcedureModal(false);
          pauseTimer();
          setShowFinishModal(true);
        }}
        onClose={() => setShowProcedureModal(false)}
      />

      {/* Modal wyboru receptury */}
      <RecipeSelectModal
        visible={showRecipeModal}
        onClose={() => setShowRecipeModal(false)}
        recipes={allRecipes}
        activeRecipeId={recipe.id}
        beveragePreference={beveragePreference}
        categoryFilter={recipeCategoryFilter}
        onCategoryFilterChange={setRecipeCategoryFilter}
        onSelectRecipe={handleSelectRecipe}
        onToggleFavorite={(id) => {
          toggleRecipeFavorite(id);
          refreshData();
        }}
        onDuplicateRecipe={handleDuplicateRecipe}
        onEditRecipe={(id) => {
          if (!canCreate) {
            setShowRecipeModal(false);
            setShowPaywallModal(true);
            return;
          }
          setShowRecipeModal(false);
          router.push({
            pathname: '/recipe-builder',
            params: { id },
          });
        }}
        onAddCustomRecipe={() => {
          if (!canCreate) {
            setShowRecipeModal(false);
            setShowPaywallModal(true);
            return;
          }
          setShowRecipeModal(false);
          router.push('/recipe-builder');
        }}
        onOpenGongfu={() => {
          setShowRecipeModal(false);
          router.push('/gongfu');
        }}
        onOpenImport={() => {
          if (!canCreate) {
            setShowRecipeModal(false);
            setShowPaywallModal(true);
            return;
          }
          setShowImportModal(true);
        }}
        onOpenQrScanner={() => {
          if (!canCreate) {
            setShowRecipeModal(false);
            setShowPaywallModal(true);
            return;
          }
          setShowQrScanner(true);
        }}
        unitSystem={unitSystem}
        t={t}
      />

      {/* Modal wyboru ziaren ze spiżarni */}
      <InventorySelectModal
        visible={showInventoryModal}
        onClose={() => setShowInventoryModal(false)}
        inventory={allInventory}
        selectedItem={selectedInventoryItem}
        onSelectItem={selectInventoryItem}
      />

      {/* Modal Podsumowania Parzenia (Karta Degustacyjna & Dial-in Doctor) */}
      <BrewFinishModal
        visible={showFinishModal}
        totalElapsedSeconds={snapshot.totalElapsedSeconds}
        waterGrams={waterGrams}
        rating={rating}
        onChangeRating={setRating}
        tasteBalance={tasteBalance}
        onChangeTasteBalance={setTasteBalance}
        sensoryProfile={sensoryProfile}
        onChangeSensoryProfile={setSensoryProfile}
        selectedTags={selectedTags}
        onToggleTag={toggleTag}
        waterProfile={waterProfile}
        onChangeWaterProfile={setWaterProfile}
        tdsInput={tdsInput}
        onChangeTdsInput={setTdsInput}
        notes={notes}
        onChangeNotes={setNotes}
        brewCost={brewCost}
        onSkip={() => {
          setShowFinishModal(false);
          resetTimer();
        }}
        onSave={handleFinishSave}
      />

      {/* Modal Wyboru Młynka */}
      <GrinderSelectModal
        visible={showGrinderModal}
        onClose={() => setShowGrinderModal(false)}
        grinderId={grinderId}
        onSelectGrinder={setGrinderId}
        recipe={recipe}
        t={t}
      />

      {/* Modal Udostępniania Receptury (Offline QR) */}
      <ShareRecipeModal
        visible={showShareModal}
        onClose={() => setShowShareModal(false)}
        recipe={recipe}
        shareUrl={shareUrl}
        waterTempCelsius={waterTempCelsius}
        unitSystem={unitSystem}
        t={t}
      />

      {/* Modal Importu Receptury z Linku / QR */}
      <ImportRecipeModal
        visible={showImportModal}
        onClose={() => setShowImportModal(false)}
        canCreate={canCreate}
        onRequirePaywall={() => {
          setShowRecipeModal(false);
          setShowPaywallModal(true);
        }}
        onImportSuccess={(importedRecipe) => {
          refreshData();
          selectRecipe(importedRecipe);
          setShowRecipeModal(false);
        }}
        unitSystem={unitSystem}
        t={t}
      />

      {/* Skaner Aparatem Kodów QR */}
      <QrScannerModal
        visible={showQrScanner}
        onClose={() => setShowQrScanner(false)}
        onScanRecipe={handleScanQrRecipe}
      />

      {/* Apps4Brew Pass Paywall Modal ($0.99 / $4.99 / $14.99) */}
      <Apps4BrewPassModal
        visible={showPaywallModal}
        onClose={() => setShowPaywallModal(false)}
        onPurchaseSuccess={() => {
          setShowPaywallModal(false);
          refresh();
        }}
        onSubscribed={() => {
          setShowPaywallModal(false);
          refresh();
        }}
      />

      {/* 1-Screen Onboarding Personalization (First Launch) */}
      <OnboardingModal
        visible={showOnboarding}
        onComplete={handleCompleteOnboarding}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  content: {
    padding: theme.spacing.md,
    paddingBottom: 40,
  },
  goldenRulesBanner: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.copper,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  goldenRulesBannerText: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    lineHeight: 16,
    fontWeight: '600',
  },
  bprStepLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    marginTop: 4,
  },
  bprStepBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.copper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bprStepBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  bprStepTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.copper,
    letterSpacing: 0.7,
  },
  openProcedureCta: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1.5,
    borderColor: theme.colors.copper,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 12,
    alignItems: 'center',
  },
  openProcedureCtaTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: theme.colors.copper,
    letterSpacing: 0.5,
  },
  openProcedureCtaSub: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 3,
  },
  readOnlyBanner: {
    backgroundColor: 'rgba(217, 119, 54, 0.12)',
    borderRadius: theme.borderRadius.md,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.copper,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  readOnlyBannerText: {
    color: theme.colors.copper,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
    flex: 1,
  },
  reBrewBanner: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.copper,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  reBrewIconBox: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.copperMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  reBrewInfo: {
    flex: 1,
  },
  reBrewEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.copper,
    letterSpacing: 0.5,
  },
  reBrewTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginTop: 2,
  },
  reBrewArrow: {
    fontSize: 16,
    color: theme.colors.copper,
    fontWeight: '700',
    marginLeft: 6,
  },
  corruptBanner: {
    backgroundColor: '#7F1D1D',
    borderRadius: theme.borderRadius.md,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  corruptBannerTitle: {
    color: '#FEE2E2',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  corruptBannerDesc: {
    color: '#FECACA',
    fontSize: 11,
    lineHeight: 15,
  },
  corruptDismissBtn: {
    backgroundColor: '#991B1B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.sm,
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  corruptDismissText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});

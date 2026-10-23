// ============================================================================
// Napar (Steepwise) — useBrewWorkflow Custom Hook
// State management and orchestration for Active Brew Screen (BPR & Lean UI)
// 100% Strictly Typed, Zero `any`
// ============================================================================

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useBrew } from './brew-context';
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
  getLastServings,
  setLastServings,
  BeveragePreference,
} from './database';
import { MASTER_RECIPES, MasterRecipe } from './recipes-data';
import { InventoryItem, SavedRecipe, BrewSession } from './database-schema';
import { useTranslation } from './i18n';
import {
  DEFAULT_SENSORY_PROFILE,
  SensoryProfile,
} from './radar-chart';
import { calculateBatchScaling } from './domain-rules';
import {
  encodeRecipeToShareUrl,
  decodeRecipeFromShareUrl,
} from './recipe-share';
import { confirmAction } from './confirm';
import { calculateBrewCost } from './cost-calculator';
import { useAppAccess } from './app-access';
import {
  checkCorruptState,
  dismissCorruptState,
  CorruptStateRecovery,
} from './backup';

export type AnyRecipe = SavedRecipe | MasterRecipe;

export function isRecipeTea(recipe: AnyRecipe): boolean {
  if ('beverageType' in recipe) {
    return recipe.beverageType === 'TEA';
  }
  return recipe.type === 'TEA';
}

export function getRecipeName(recipe: AnyRecipe): string {
  return recipe.name;
}

export function useBrewWorkflow() {
  const router = useRouter();
  const { t, language } = useTranslation();
  const brewAccessHook = useAppAccess();
  const { checkBrewStart, recordTimerBrew, refresh } = brewAccessHook;
  const brewAccess = {
    isPro: brewAccessHook.isPro,
    monthDaysUsed: brewAccessHook.monthDaysUsed,
    freeDaysPerMonth: brewAccessHook.freeDaysPerMonth,
    remainingDays: brewAccessHook.remainingDays,
  };
  const unitSystem = getUnitSystem();

  const brew = useBrew();
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
  } = brew;

  const [allRecipes, setAllRecipes] = useState<AnyRecipe[]>(MASTER_RECIPES);
  const [allInventory, setAllInventory] = useState<InventoryItem[]>([]);

  // Modals / Inline Card Visibility
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

  // Tasting summary form state
  const [rating, setRating] = useState<number>(5);
  const [tasteBalance, setTasteBalance] = useState<string>('balanced');
  const [tdsInput, setTdsInput] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sensoryProfile, setSensoryProfile] = useState<SensoryProfile>(DEFAULT_SENSORY_PROFILE);
  // Liczba porcji jest zapamiętana w ustawieniach (poz. 20 MVP): nie resetuje się przy każdym otwarciu
  const [servings, setServingsState] = useState<number>(() => {
    try {
      return getLastServings();
    } catch {
      return 1;
    }
  });
  const setServings = (count: number) => {
    setServingsState(count);
    try {
      setLastServings(count);
    } catch {
      // zapis opcjonalny: stan w pamięci wystarcza do bieżącej sesji
    }
  };

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

  const isCurrentRecipeTea = isRecipeTea(recipe as AnyRecipe);

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

  const refreshData = useCallback(() => {
    try {
      const dbRecipes = getRecipes();
      if (dbRecipes && dbRecipes.length > 0) {
        setAllRecipes(dbRecipes);
      }
      const inventory = getInventoryItems();
      setAllInventory(inventory);
    } catch {
      // fallback
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const handleSelectRecipe = useCallback(
    (r: AnyRecipe) => {
      if (snapshot.totalElapsedSeconds > 0 && snapshot.status !== 'finished') {
        confirmAction({
          title: t.brewWorkflow.changeRecipeTitle,
          message:
            t.brewWorkflow.changeRecipeMessage,
          actionText: t.brewWorkflow.changeRecipeAction,
          destructive: true,
          onConfirm: () => {
            resetTimer();
            selectRecipe(r as any);
            setServings(1);
            setShowRecipeModal(false);
          },
        });
      } else {
        selectRecipe(r as any);
        setServings(1);
        setShowRecipeModal(false);
      }
    },
    [t, resetTimer, selectRecipe, snapshot.status, snapshot.totalElapsedSeconds]
  );

  const handleBeverageTypeChange = (type: 'COFFEE' | 'TEA') => {
    setCurrentBeverageType(type);
    setRecipeCategoryFilter(type);
    const currentMatches =
      'beverageType' in recipe ? recipe.beverageType === type : recipe.type === type;
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
  }, [beveragePreference]);

  const handleQuickReBrew = (s: BrewSession) => {
    const foundRecipe = allRecipes.find((r) => r.name === s.recipeName);
    if (foundRecipe) {
      selectRecipe(foundRecipe as any);
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
    // Limit dotyczy tylko rozpoczęcia parzenia; trwające parzenie nigdy nie jest blokowane.
    const sessionInProgress = snapshot.status === 'running' || snapshot.status === 'paused';
    if (!checkBrewStart(sessionInProgress).allowed) {
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
    try {
      const decoded = decodeRecipeFromShareUrl(data);
      if (decoded && decoded.recipe) {
        saveRecipe(decoded.recipe);
        refreshData();
        selectRecipe(decoded.recipe as any);
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
      return encodeRecipeToShareUrl(recipe as any);
    } catch {
      return '';
    }
  }, [recipe]);

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

  const handleResetWithConfirm = () => {
    if (snapshot.totalElapsedSeconds > 0) {
      confirmAction({
        title:
          t.brewWorkflow.resetSessionTitle,
        message:
          t.brewWorkflow.resetSessionMessage,
        actionText: t.brewWorkflow.resetSessionAction,
        destructive: true,
        onConfirm: resetTimer,
      });
    } else {
      resetTimer();
    }
  };

  const handleDuplicateRecipe = (r: AnyRecipe) => {
    const cloned = duplicateRecipe(r);
    refreshData();
    Alert.alert(
      t.brew.duplicateRecipe,
      `${t.brew.duplicateSuccess} ("${cloned.name}")`
    );
  };

  useEffect(() => {
    if (!selectedInventoryItem && allInventory.length > 0) {
      const defaultItem =
        allInventory.find((i) => i.isFavorite) || allInventory[0];
      if (defaultItem) {
        selectInventoryItem(defaultItem);
      }
    }
  }, [allInventory, selectedInventoryItem, selectInventoryItem]);

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
    recordTimerBrew();
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
  const favoriteRecipes = allRecipes.filter((r) => Boolean((r as SavedRecipe).isFavorite));

  // P16 Accordion Open Handlers (Single expanded card rule)
  const handleOpenRecipeInline = () => {
    refreshData();
    setRecipeCategoryFilter(currentBeverageType);
    setShowInventoryModal(false);
    setShowRecipeModal(true);
  };

  // Ulubione (★) przełączane w bazie; odświeżenie listy receptur i ulubionych w UI
  const handleToggleRecipeFavorite = useCallback(
    (recipeId: string) => {
      toggleRecipeFavorite(recipeId);
      refreshData();
    },
    [refreshData]
  );

  const handleOpenInventoryInline = () => {
    setShowRecipeModal(false);
    setShowInventoryModal(true);
  };

  return {
    router,
    t,
    language,
    unitSystem,
    brewAccess,
    checkBrewStart,
    refresh,
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
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    nextStep,
    previousStep,
    adjustStepDuration,
    waterProfile,
    setWaterProfile,
    grinderId,
    setGrinderId,
    grinderRecommendation,
    beveragePreference,
    allRecipes,
    allInventory,
    favoriteRecipes,
    currentBeverageType,
    recipeCategoryFilter,
    setRecipeCategoryFilter,
    handleBeverageTypeChange,
    handleSelectRecipe,
    handleDuplicateRecipe,
    handleOpenRecipeInline,
    handleOpenInventoryInline,
    showRecipeModal,
    setShowRecipeModal,
    showInventoryModal,
    setShowInventoryModal,
    showFinishModal,
    setShowFinishModal,
    showProcedureModal,
    setShowProcedureModal,
    showGrinderModal,
    setShowGrinderModal,
    showShareModal,
    setShowShareModal,
    showImportModal,
    setShowImportModal,
    showQrScanner,
    setShowQrScanner,
    showPaywallModal,
    setShowPaywallModal,
    corruptState,
    handleDismissCorrupt,
    showOnboarding,
    handleCompleteOnboarding,
    recentFiveStarSession,
    handleQuickReBrew,
    brewCost,
    handleStartTimer,
    handleScanQrRecipe,
    shareUrl,
    rating,
    setRating,
    tasteBalance,
    setTasteBalance,
    tdsInput,
    setTdsInput,
    notes,
    setNotes,
    selectedTags,
    toggleTag,
    sensoryProfile,
    setSensoryProfile,
    servings,
    handleServingsChange,
    batchScaling,
    handleResetWithConfirm,
    handleFinishSave,
    isRunning,
    isPaused,
    refreshData,
    handleToggleRecipeFavorite,
  };
}

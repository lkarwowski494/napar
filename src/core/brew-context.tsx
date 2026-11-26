// ============================================================================
// Napar — Active Brew Context & Provider
// Bridges recipes, inventory, timer engine, and session logging
// ============================================================================

import React, { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { MasterRecipe, RecipeStep, MASTER_RECIPES } from './recipes-data';
import { InventoryItem, SavedRecipe, BrewSession, CaffeineLog, SensoryProfile } from './database-schema';
import { BrewTimerEngine, TimerSnapshot } from './timer-engine';
import { announceStep, announceCountdown, announceFinish } from '../platform/announce';
import { recordBrewSessionTransaction, getAppSetting, setAppSetting, getVoiceAnnounceEnabled, getHapticsEnabled, getSoundEnabled, BeveragePreference, getBeveragePreference, setBeveragePreference as setBeveragePreferenceDb, buildBackupState, getInventoryItemById, getRecipeById } from '../data/database';
import { autoBackup } from '../data/backup';
import {
  calculateExtractionYield,
  calculateLiquidYield,
  estimateCoffeeCaffeineMg,
  estimateTeaInfusionCaffeineMg,
  estimateTotalLeafCaffeineMg,
} from './domain-rules';
import { getRecommendedGrindForRecipe } from './grinder-converter';
import { useTranslation } from './i18n';

export interface BrewContextType {
  recipe: SavedRecipe | MasterRecipe;
  selectedInventoryItem: InventoryItem | null;
  doseGrams: number;
  waterGrams: number;
  waterTempCelsius: number;
  grindSetting: string;
  scaledSteps: RecipeStep[];
  snapshot: TimerSnapshot;
  beveragePreference: BeveragePreference;
  setBeveragePreference: (pref: BeveragePreference) => void;
  dataVersion: number;
  reloadFromDatabase: () => void;
  // Actions
  selectRecipe: (recipe: SavedRecipe | MasterRecipe) => void;
  selectInventoryItem: (item: InventoryItem | null) => void;
  waterProfile: string;
  setWaterProfile: (profile: string) => void;
  grinderId: string;
  setGrinderId: (grinderId: string) => void;
  grinderRecommendation: { formatted: string; rawValue: number; grinderName: string; microns: number };
  setDoseGrams: (grams: number) => void;
  setWaterGrams: (grams: number) => void;
  setWaterTempCelsius: (temp: number) => void;
  setGrindSetting: (grind: string) => void;
  startTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  resetTimer: () => void;
  nextStep: () => void;
  previousStep: () => void;
  adjustStepDuration: (deltaSeconds: number) => void;
  resetCurrentStep: (durationSeconds?: number) => void;
  finishAndSaveSession: (sessionData: {
    rating?: number;
    flavorTags?: string[];
    tasteBalance?: string;
    tdsPercentage?: number;
    notes?: string;
    sensory?: SensoryProfile;
    waterProfile?: string;
    logToCaffeineTracker?: boolean;
  }) => BrewSession;
}

const defaultCoffeeRecipe = MASTER_RECIPES.find((r) => r.type === 'COFFEE') || MASTER_RECIPES[0];
const defaultTeaRecipe = MASTER_RECIPES.find((r) => r.type === 'TEA') || MASTER_RECIPES[3];
const defaultRecipe = defaultCoffeeRecipe;

const defaultInitialSnapshot: TimerSnapshot = {
  status: 'idle',
  currentStepIndex: 0,
  currentStep: defaultRecipe.steps[0] || null,
  totalSteps: defaultRecipe.steps.length,
  stepElapsedSeconds: 0,
  stepRemainingSeconds: defaultRecipe.steps[0]?.durationSeconds || 0,
  stepProgress: 0,
  totalElapsedSeconds: 0,
  currentWaterGrams: 0,
  previousWaterGrams: 0,
  targetWaterGrams: defaultRecipe.steps[0]?.targetWaterGrams || 0,
  recommendedPourRate: Number(
    (
      (defaultRecipe.steps[0]?.targetWaterGrams || 0) /
      Math.max(1, defaultRecipe.steps[0]?.durationSeconds || 1)
    ).toFixed(1)
  ),
  isLastStep: false,
};

const BrewContext = createContext<BrewContextType | undefined>(undefined);

export const BrewProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // M1-audytor-generalny-033 (09-lokalizacja-002): język interfejsu — jedno źródło dla zapowiedzi,
  // nastawy młynka i opisu mielenia (także gdy język pochodzi z systemu, bez zapisanego app_language).
  const { language: uiLanguage } = useTranslation();
  // Zapowiedzi VoiceOver i opis mielenia czytają język z ref (unikamy przestarzałych domknięć).
  const uiLanguageRef = useRef(uiLanguage);
  uiLanguageRef.current = uiLanguage;
  const masterGrind = (r: MasterRecipe) =>
    uiLanguageRef.current === 'en' ? r.grindSettingDescriptionEn || r.grindSettingDescriptionPl : r.grindSettingDescriptionPl;
  const [beveragePreference, setBeveragePreferenceState] = useState<BeveragePreference>(() => {
    try {
      return typeof getBeveragePreference === 'function' ? getBeveragePreference() : 'both';
    } catch {
      return 'both';
    }
  });

  const [recipe, setRecipe] = useState<SavedRecipe | MasterRecipe>(() => {
    try {
      const pref = typeof getBeveragePreference === 'function' ? getBeveragePreference() : 'both';
      return pref === 'tea' ? defaultTeaRecipe : defaultCoffeeRecipe;
    } catch {
      return defaultCoffeeRecipe;
    }
  });
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<InventoryItem | null>(null);

  const initialDose = 'doseGrams' in recipe ? recipe.doseGrams : recipe.coffeeOrTeaDoseGrams;
  const initialWater = 'waterGrams' in recipe ? recipe.waterGrams : recipe.waterWeightGrams;
  const initialTemp = 'waterTempCelsius' in recipe ? recipe.waterTempCelsius : recipe.waterTemperatureCelsius;
  const initialGrind = 'grindSizeDescription' in recipe ? (recipe.grindSizeDescription || '') : masterGrind(recipe as MasterRecipe);

  const [doseGrams, setDoseGrams] = useState<number>(initialDose);
  const [waterGrams, setWaterGrams] = useState<number>(initialWater);
  const [waterTempCelsius, setWaterTempCelsius] = useState<number>(initialTemp);
  const [waterProfile, setWaterProfile] = useState<string>('sca_standard');
  const [grindSetting, setGrindSetting] = useState<string>(initialGrind);
  const [grinderId, setGrinderIdState] = useState<string>(() => {
    return getAppSetting('default_grinder', 'comandante_c40');
  });
  const [dataVersion, setDataVersion] = useState<number>(0);

  const handleSetBeveragePreference = (pref: BeveragePreference) => {
    setBeveragePreferenceState(pref);
    try {
      if (typeof setBeveragePreferenceDb === 'function') {
        setBeveragePreferenceDb(pref);
      }
    } catch {
      // ignore
    }
    if (pref === 'coffee') {
      const isTea = 'beverageType' in recipe ? recipe.beverageType === 'TEA' : (recipe as any).type === 'TEA';
      if (isTea) {
        selectRecipe(defaultCoffeeRecipe);
      }
    } else if (pref === 'tea') {
      const isCoffee = 'beverageType' in recipe ? recipe.beverageType === 'COFFEE' : (recipe as any).type === 'COFFEE';
      if (isCoffee) {
        selectRecipe(defaultTeaRecipe);
      }
    }
  };

  const setGrinderId = (id: string) => {
    const prev = grinderId;
    setGrinderIdState(id);
    try {
      setAppSetting('default_grinder', id);
    } catch {
      setGrinderIdState(prev);
    }
  };

  const grinderRecommendation = useMemo(() => {
    return getRecommendedGrindForRecipe(recipe, grinderId, uiLanguage);
  }, [recipe, grinderId, uiLanguage]);

  // Parsuj kroki przepisu
  const originalSteps = useMemo<RecipeStep[]>(() => {
    if ('steps' in recipe) {
      return recipe.steps;
    }
    try {
      return JSON.parse(recipe.stepsJson);
    } catch {
      return [];
    }
  }, [recipe]);

  // Skaluj kroki jeśli użytkownik zmienił proporcje/wodę
  const scaledSteps = useMemo<RecipeStep[]>(() => {
    const originalWater = 'waterGrams' in recipe ? recipe.waterGrams : recipe.waterWeightGrams;
    if (originalWater <= 0 || waterGrams === originalWater) {
      return originalSteps;
    }
    const ratioMultiplier = waterGrams / originalWater;
    return originalSteps.map((s) => ({
      ...s,
      targetWaterGrams: Number((s.targetWaterGrams * ratioMultiplier).toFixed(1)),
    }));
  }, [originalSteps, waterGrams, recipe]);

  const [snapshot, setSnapshot] = useState<TimerSnapshot>(defaultInitialSnapshot);
  const engineRef = useRef<BrewTimerEngine | null>(null);

  useEffect(() => {
    const engine = new BrewTimerEngine(scaledSteps, {
      onTick: (snap) => setSnapshot(snap),
      onStepChange: (stepIndex, step) => {
        if (getVoiceAnnounceEnabled()) {
          const lang = uiLanguageRef.current;
          const stepName = lang === 'en' ? (step.nameEn || step.namePl) : step.namePl;
          const stepInstr = lang === 'en' ? (step.instructionEn || step.instructionPl) : step.instructionPl;
          announceStep(
            stepIndex + 1,
            scaledSteps.length,
            stepName,
            step.targetWaterGrams,
            step.durationSeconds,
            stepInstr,
            lang
          );
        }
      },
      onWarning: (remaining) => {
        if (getVoiceAnnounceEnabled()) {
          const lang = uiLanguageRef.current;
          announceCountdown(remaining, lang);
        }
      },
      onFinish: () => {
        if (getVoiceAnnounceEnabled()) {
          const lang = uiLanguageRef.current;
          const totalSecs = engineRef.current?.getSnapshot().totalElapsedSeconds || 0;
          announceFinish(recipe.name, totalSecs, lang);
        }
      },
    });

    engine.setHapticsEnabled(getHapticsEnabled());
    engine.setSoundEnabled(getSoundEnabled());
    engineRef.current = engine;
    setSnapshot(engine.getSnapshot());

    return () => {
      engine.destroy();
    };
  }, [scaledSteps, recipe]);

  const selectRecipe = (newRecipe: SavedRecipe | MasterRecipe) => {
    setRecipe(newRecipe);
    const d = 'doseGrams' in newRecipe ? newRecipe.doseGrams : newRecipe.coffeeOrTeaDoseGrams;
    const w = 'waterGrams' in newRecipe ? newRecipe.waterGrams : newRecipe.waterWeightGrams;
    const t = 'waterTempCelsius' in newRecipe ? newRecipe.waterTempCelsius : newRecipe.waterTemperatureCelsius;
    const g = 'grindSizeDescription' in newRecipe ? (newRecipe.grindSizeDescription || '') : masterGrind(newRecipe as MasterRecipe);
    setDoseGrams(d);
    setWaterGrams(w);
    setWaterTempCelsius(t);
    setGrindSetting(g);
  };

  const reloadFromDatabase = useCallback(() => {
    let nextPref: BeveragePreference = beveragePreference;
    try {
      if (typeof getBeveragePreference === 'function') {
        nextPref = getBeveragePreference();
        setBeveragePreferenceState(nextPref);
      }
    } catch {
      // ignore
    }
    try {
      setGrinderIdState(getAppSetting('default_grinder', 'comandante_c40'));
    } catch {
      // ignore
    }
    try {
      if (typeof getInventoryItemById === 'function' && selectedInventoryItem?.id) {
        const freshItem = getInventoryItemById(selectedInventoryItem.id);
        setSelectedInventoryItem(freshItem && !freshItem.isArchived ? freshItem : null);
      }
    } catch {
      // ignore
    }
    try {
      const currentIsTea = 'beverageType' in recipe ? recipe.beverageType === 'TEA' : recipe.type === 'TEA';
      const prefConflicts =
        (nextPref === 'coffee' && currentIsTea) || (nextPref === 'tea' && !currentIsTea);
      if (prefConflicts) {
        const fallback = nextPref === 'tea' ? defaultTeaRecipe : defaultCoffeeRecipe;
        selectRecipe(fallback);
      } else if (typeof getRecipeById === 'function' && recipe?.id && !('steps' in recipe)) {
        const freshRecipe = getRecipeById(recipe.id);
        if (!freshRecipe && recipe.isCustom) {
          const fallback = nextPref === 'tea' ? defaultTeaRecipe : defaultCoffeeRecipe;
          selectRecipe(fallback);
        } else if (freshRecipe) {
          const changed =
            freshRecipe.name !== recipe.name ||
            freshRecipe.doseGrams !== recipe.doseGrams ||
            freshRecipe.waterGrams !== recipe.waterGrams ||
            freshRecipe.waterTempCelsius !== recipe.waterTempCelsius ||
            freshRecipe.grindSizeDescription !== recipe.grindSizeDescription ||
            freshRecipe.recommendedRatio !== recipe.recommendedRatio ||
            freshRecipe.stepsJson !== recipe.stepsJson ||
            freshRecipe.method !== recipe.method ||
            freshRecipe.beverageType !== recipe.beverageType;
          if (changed) {
            selectRecipe(freshRecipe);
          }
        }
      }
    } catch {
      // ignore
    }
    setDataVersion((v) => v + 1);
  }, [beveragePreference, selectedInventoryItem, recipe]);

  const handleSetDoseGrams = (d: number) => {
    setDoseGrams(d);
    const ratio = 'recommendedRatio' in recipe ? recipe.recommendedRatio : 16.0;
    setWaterGrams(Number((d * ratio).toFixed(1)));
  };

  const startTimer = () => {
    engineRef.current?.setHapticsEnabled(getHapticsEnabled());
    engineRef.current?.setSoundEnabled(getSoundEnabled());
    engineRef.current?.start();
  };
  const pauseTimer = () => engineRef.current?.pause();
  const resumeTimer = () => {
    engineRef.current?.setHapticsEnabled(getHapticsEnabled());
    engineRef.current?.setSoundEnabled(getSoundEnabled());
    engineRef.current?.resume();
  };
  const resetTimer = () => engineRef.current?.reset();
  const nextStep = () => engineRef.current?.nextStep();
  const previousStep = () => engineRef.current?.previousStep();
  const adjustStepDuration = (deltaSeconds: number) => {
    engineRef.current?.adjustStepDuration(deltaSeconds);
  };
  const resetCurrentStep = (durationSeconds?: number) => {
    engineRef.current?.resetCurrentStep(durationSeconds);
  };

  const finishAndSaveSession = (data: {
    rating?: number;
    flavorTags?: string[];
    tasteBalance?: string;
    tdsPercentage?: number;
    notes?: string;
    sensory?: SensoryProfile;
    waterProfile?: string;
    logToCaffeineTracker?: boolean;
  }): BrewSession => {
    engineRef.current?.finish();

    const bevType = ('beverageType' in recipe ? recipe.beverageType : recipe.type) as 'COFFEE' | 'TEA';
    const method = recipe.method;
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    const mUpper = (method || '').trim().toUpperCase();
    const isEspressoLike =
      mUpper.includes('ESPRESSO') ||
      mUpper.includes('FLAIR') ||
      mUpper.includes('ROBOT') ||
      (!mUpper.includes('CLEVER') && mUpper.includes('LEVER'));

    let eyPercent: number | undefined;
    if (data.tdsPercentage && data.tdsPercentage > 0) {
      try {
        const beverageWeightGrams =
          bevType === 'COFFEE' && !isEspressoLike
            ? calculateLiquidYield(waterGrams, doseGrams)
            : waterGrams;
        const ey = calculateExtractionYield(beverageWeightGrams, data.tdsPercentage, doseGrams);
        eyPercent = ey.extractionYieldPercent;
      } catch {
        // Pomijamy jeśli błędne dane wejściowe
      }
    }

    let caffeineMg: number | undefined;
    if (bevType === 'COFFEE') {
      const caffeineMethod: 'filter' | 'espresso' | 'immersion' | 'cold_brew' =
        mUpper.includes('CLEVER') ||
        mUpper.includes('FRENCH') ||
        mUpper.includes('AEROPRESS') ||
        mUpper.includes('SWITCH') ||
        mUpper.includes('CUPPING') ||
        mUpper.includes('PRASKA')
          ? 'immersion'
          : isEspressoLike || mUpper.includes('MOKA')
          ? 'espresso'
          : mUpper.includes('COLD') || mUpper.includes('MIZUDASHI') || mUpper.includes('TODDY') || mUpper.includes('NITRO')
          ? 'cold_brew'
          : 'filter';
      caffeineMg = estimateCoffeeCaffeineMg(doseGrams, 'arabica', caffeineMethod);
    } else {
      caffeineMg = estimateTeaInfusionCaffeineMg(estimateTotalLeafCaffeineMg(doseGrams), 1);
    }

    const session: BrewSession = {
      id: sessionId,
      recipeId: recipe.id,
      recipeName: recipe.name,
      inventoryItemId: selectedInventoryItem?.id,
      inventoryItemName: selectedInventoryItem?.name,
      beverageType: bevType,
      method,
      doseGrams,
      waterGrams,
      waterTempCelsius,
      waterProfile: data.waterProfile || waterProfile,
      // M1-audytor-generalny-008: mielenie, którego użytkownik nie wpisał, zostaje brakiem (nie rekomendacją młynka).
      grindSetting: grindSetting || undefined,
      totalTimeSeconds: snapshot.totalElapsedSeconds,
      rating: data.rating,
      flavorTags: data.flavorTags || [],
      tasteBalance: data.tasteBalance,
      tdsPercentage: data.tdsPercentage,
      extractionYieldPercentage: eyPercent,
      caffeineContentMg: caffeineMg,
      notes: data.notes,
      sensory: data.sensory,
      brewedAt: nowIso,
    };

    const caffeineLog: CaffeineLog | undefined =
      data.logToCaffeineTracker !== false && caffeineMg
        ? {
            id: `caff-${Date.now()}`,
            brewSessionId: sessionId,
            beverageName: selectedInventoryItem?.name || recipe.name,
            beverageType: bevType === 'COFFEE' ? 'coffee' : 'tea',
            consumedAt: nowIso,
            doseGrams,
            caffeineMg,
          }
        : undefined;

    const inventoryDeduction =
      selectedInventoryItem?.id && doseGrams > 0
        ? { itemId: selectedInventoryItem.id, doseGrams }
        : undefined;

    recordBrewSessionTransaction(session, inventoryDeduction, caffeineLog);

    if (selectedInventoryItem?.id && typeof getInventoryItemById === 'function') {
      try {
        const refreshed = getInventoryItemById(selectedInventoryItem.id);
        setSelectedInventoryItem(refreshed);
      } catch {
        // safe fallback
      }
    }

    // Apps4Brew SEC-09: Automatyczna rotacja 10 kopii JSON w tle (Zadanie N5)
    try {
      void autoBackup(buildBackupState());
    } catch {
      // Ignoruj błędy kopii zapasowej w tle
    }

    return session;
  };

  return (
    <BrewContext.Provider
      value={{
        recipe,
        selectedInventoryItem,
        waterProfile,
        setWaterProfile,
        grinderId,
        setGrinderId,
        grinderRecommendation,
        doseGrams,
        waterGrams,
        waterTempCelsius,
        grindSetting,
        scaledSteps,
        snapshot,
        selectRecipe,
        selectInventoryItem: setSelectedInventoryItem,
        setDoseGrams: handleSetDoseGrams,
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
        resetCurrentStep,
        finishAndSaveSession,
        beveragePreference,
        setBeveragePreference: handleSetBeveragePreference,
        dataVersion,
        reloadFromDatabase,
      }}
    >
      {children}
    </BrewContext.Provider>
  );
};

export function useBrew(): BrewContextType {
  const context = useContext(BrewContext);
  if (!context) {
    throw new Error('useBrew must be used within a BrewProvider');
  }
  return context;
}

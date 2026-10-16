// ============================================================================
// Napar (Steepwise) — Active Brew Context & Provider
// Bridges recipes, inventory, timer engine, and session logging
// ============================================================================

import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import { MasterRecipe, RecipeStep, MASTER_RECIPES } from './recipes-data';
import { InventoryItem, SavedRecipe, BrewSession, CaffeineLog, SensoryProfile } from './database-schema';
import { BrewTimerEngine, TimerSnapshot } from './timer-engine';
import { announceStep, announceCountdown, announceFinish } from './announce';
import {
  saveBrewSession,
  logCaffeine,
  deductInventoryWeight,
  getInventoryItems,
  getRecipes,
  getAppSetting,
  setAppSetting,
  getVoiceAnnounceEnabled,
  getHapticsEnabled,
} from './database';
import {
  calculateExtractionYield,
  estimateCoffeeCaffeineMg,
  estimateTeaInfusionCaffeineMg,
} from './domain-rules';
import { getRecommendedGrindForRecipe } from './grinder-converter';
import { getHealthKitSyncEnabled, saveDietaryCaffeineSample } from './healthkit';

export interface BrewContextType {
  recipe: SavedRecipe | MasterRecipe;
  selectedInventoryItem: InventoryItem | null;
  doseGrams: number;
  waterGrams: number;
  waterTempCelsius: number;
  grindSetting: string;
  scaledSteps: RecipeStep[];
  snapshot: TimerSnapshot;
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

const defaultRecipe = MASTER_RECIPES[0];

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
  const [recipe, setRecipe] = useState<SavedRecipe | MasterRecipe>(defaultRecipe);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<InventoryItem | null>(null);

  const initialDose = 'doseGrams' in recipe ? recipe.doseGrams : recipe.coffeeOrTeaDoseGrams;
  const initialWater = 'waterGrams' in recipe ? recipe.waterGrams : recipe.waterWeightGrams;
  const initialTemp = 'waterTempCelsius' in recipe ? recipe.waterTempCelsius : recipe.waterTemperatureCelsius;
  const initialGrind = 'grindSizeDescription' in recipe ? (recipe.grindSizeDescription || '') : (recipe as MasterRecipe).grindSettingDescriptionPl;

  const [doseGrams, setDoseGrams] = useState<number>(initialDose);
  const [waterGrams, setWaterGrams] = useState<number>(initialWater);
  const [waterTempCelsius, setWaterTempCelsius] = useState<number>(initialTemp);
  const [waterProfile, setWaterProfile] = useState<string>('sca_standard');
  const [grindSetting, setGrindSetting] = useState<string>(initialGrind);
  const [grinderId, setGrinderIdState] = useState<string>(() => {
    return getAppSetting('default_grinder', 'comandante_c40');
  });

  const setGrinderId = (id: string) => {
    setGrinderIdState(id);
    setAppSetting('default_grinder', id);
  };

  const grinderRecommendation = useMemo(() => {
    return getRecommendedGrindForRecipe(recipe, grinderId);
  }, [recipe, grinderId]);

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
          const lang = (getAppSetting('app_language', 'pl') as 'pl' | 'en') || 'pl';
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
          const lang = (getAppSetting('app_language', 'pl') as 'pl' | 'en') || 'pl';
          announceCountdown(remaining, lang);
        }
      },
      onFinish: () => {
        if (getVoiceAnnounceEnabled()) {
          const lang = (getAppSetting('app_language', 'pl') as 'pl' | 'en') || 'pl';
          const totalSecs = engineRef.current?.getSnapshot().totalElapsedSeconds || 0;
          announceFinish(recipe.name, totalSecs, lang);
        }
      },
    });

    engine.setHapticsEnabled(getHapticsEnabled());
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
    const g = 'grindSizeDescription' in newRecipe ? (newRecipe.grindSizeDescription || '') : (newRecipe as MasterRecipe).grindSettingDescriptionPl;
    setDoseGrams(d);
    setWaterGrams(w);
    setWaterTempCelsius(t);
    setGrindSetting(g);
  };

  const handleSetDoseGrams = (d: number) => {
    setDoseGrams(d);
    const ratio = 'recommendedRatio' in recipe ? recipe.recommendedRatio : 16.0;
    setWaterGrams(Number((d * ratio).toFixed(1)));
  };

  const startTimer = () => {
    engineRef.current?.setHapticsEnabled(getHapticsEnabled());
    engineRef.current?.start();
  };
  const pauseTimer = () => engineRef.current?.pause();
  const resumeTimer = () => {
    engineRef.current?.setHapticsEnabled(getHapticsEnabled());
    engineRef.current?.resume();
  };
  const resetTimer = () => engineRef.current?.reset();
  const nextStep = () => engineRef.current?.nextStep();
  const previousStep = () => engineRef.current?.previousStep();
  const adjustStepDuration = (deltaSeconds: number) => {
    engineRef.current?.adjustStepDuration(deltaSeconds);
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

    let eyPercent: number | undefined;
    if (data.tdsPercentage && data.tdsPercentage > 0) {
      try {
        const ey = calculateExtractionYield(waterGrams, doseGrams, data.tdsPercentage);
        eyPercent = ey.extractionYieldPercent;
      } catch {
        // Pomijamy jeśli błędne dane wejściowe
      }
    }

    let caffeineMg: number | undefined;
    if (bevType === 'COFFEE') {
      caffeineMg = estimateCoffeeCaffeineMg(doseGrams);
    } else {
      caffeineMg = estimateTeaInfusionCaffeineMg(doseGrams * 30, 1);
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
      grindSetting: grindSetting || `${grinderRecommendation.grinderName}: ${grinderRecommendation.formatted}`,
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

    saveBrewSession(session);

    // Automatyczne odjęcie zużytej porcji ze spiżarni
    if (selectedInventoryItem?.id) {
      deductInventoryWeight(selectedInventoryItem.id, doseGrams);
    }

    // Zapis w rejestrze kofeiny
    if (data.logToCaffeineTracker !== false && caffeineMg) {
      const caffeineLog: CaffeineLog = {
        id: `caff-${Date.now()}`,
        brewSessionId: sessionId,
        beverageName: selectedInventoryItem?.name || recipe.name,
        beverageType: bevType === 'COFFEE' ? 'coffee' : 'tea',
        consumedAt: nowIso,
        doseGrams,
        caffeineMg,
      };
      logCaffeine(caffeineLog);

      // BR-KOF-002: Apple HealthKit sync
      if (getHealthKitSyncEnabled()) {
        saveDietaryCaffeineSample({
          caffeineMg,
          consumedAt: nowIso,
          beverageName: selectedInventoryItem?.name || recipe.name,
        }).catch(() => {});
      }
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
        finishAndSaveSession,
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

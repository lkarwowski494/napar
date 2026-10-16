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
  Modal,
  TextInput,
  Alert,
  Share,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useBrew } from '../../src/core/brew-context';
import { getRecipes, getInventoryItems, toggleRecipeFavorite, saveRecipe } from '../../src/core/database';
import { MASTER_RECIPES } from '../../src/core/recipes-data';
import { InventoryItem, SavedRecipe } from '../../src/core/database-schema';
import { FlavorWheelPicker } from '../../src/core/flavor-wheel-picker';
import { theme } from '../../src/core/theme';
import { useTranslation } from '../../src/core/i18n';
import {
  SensoryRadarChart,
  SensoryScoreEditor,
  DEFAULT_SENSORY_PROFILE,
  SensoryProfile,
} from '../../src/core/radar-chart';
import { calculateBatchScaling } from '../../src/core/domain-rules';
import { WATER_RECIPES } from '../../src/core/water-chemistry';
import { SUPPORTED_GRINDERS, getRecommendedGrindForRecipe } from '../../src/core/grinder-converter';
import { encodeRecipeToShareUrl, decodeRecipeFromShareUrl } from '../../src/core/recipe-share';
import { QrCodeSvg } from '../../src/core/qr-code';
import { confirmAction } from '../../src/core/confirm';

export default function BrewScreen() {
  const router = useRouter();
  const { t, language } = useTranslation();
  const {
    recipe,
    selectedInventoryItem,
    doseGrams,
    waterGrams,
    waterTempCelsius,
    grindSetting,
    scaledSteps,
    snapshot,
    selectRecipe,
    selectInventoryItem,
    setDoseGrams,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    nextStep,
    previousStep,
    finishAndSaveSession,
    waterProfile,
    setWaterProfile,
    grinderId,
    setGrinderId,
    grinderRecommendation,
  } = useBrew();

  const [allRecipes, setAllRecipes] = useState<any[]>(MASTER_RECIPES);
  const [allInventory, setAllInventory] = useState<InventoryItem[]>([]);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [showGrinderModal, setShowGrinderModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importUrlInput, setImportUrlInput] = useState('');
  const [importParsedRecipe, setImportParsedRecipe] = useState<{ recipe: SavedRecipe; originalSteps: any[] } | null>(null);

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
  const [sensoryProfile, setSensoryProfile] = useState<SensoryProfile>(DEFAULT_SENSORY_PROFILE);

  // Skalowanie porcji (Batch Scaling 1–4 osób)
  const [servings, setServings] = useState<number>(1);

  const baseDose = 'doseGrams' in recipe ? recipe.doseGrams : recipe.coffeeOrTeaDoseGrams;
  const baseWater = 'waterGrams' in recipe ? recipe.waterGrams : recipe.waterWeightGrams;
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
        title: language === 'en' ? 'Reset brew session?' : 'Zresetować sesję parzenia?',
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
      const defaultItem = allInventory.find((i) => i.isFavorite) || allInventory[0];
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

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
  const isIdle = snapshot.status === 'idle';

  const favoriteRecipes = allRecipes.filter((r) => Boolean(r.isFavorite));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 1-Click Szybkie Parzenie z Ulubionych Receptur */}
      {favoriteRecipes.length > 0 && !isRunning && (
        <View style={styles.favoritesSection}>
          <Text style={styles.favoritesSectionTitle}>⭐ {t.favorites.title}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.favoritesScroll}
          >
            {favoriteRecipes.map((fav) => {
              const isSelected = recipe.id === fav.id;
              const favDose = 'doseGrams' in fav ? fav.doseGrams : fav.coffeeOrTeaDoseGrams;
              return (
                <Pressable
                  key={fav.id}
                  style={[
                    styles.favoriteChip,
                    isSelected && styles.favoriteChipActive,
                  ]}
                  onPress={() => handleSelectRecipe(fav)}
                >
                  <Text
                    style={[
                      styles.favoriteChipText,
                      isSelected && styles.favoriteChipTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    {fav.name}
                  </Text>
                  <Text style={styles.favoriteChipSub}>
                    {fav.method} · {favDose}g
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Pasek wyboru receptury i ziarna */}
      <View style={styles.selectorRow}>
        <Pressable
          style={styles.selectorCard}
          onPress={() => {
            refreshData();
            setShowRecipeModal(true);
          }}
          accessibilityRole="button"
          accessibilityLabel={`Wybrany przepis: ${recipe.name}`}
        >
          <Text style={styles.selectorLabel}>RECEPTURA</Text>
          <Text style={styles.selectorValue} numberOfLines={1}>
            {recipe.name}
          </Text>
          <Text style={styles.selectorSub}>
            {recipe.method} · {waterTempCelsius}°C
          </Text>
        </Pressable>

        <Pressable
          style={[styles.selectorCard, selectedInventoryItem && styles.selectorCardActive]}
          onPress={() => setShowInventoryModal(true)}
          accessibilityRole="button"
          accessibilityLabel="Wybierz ziarna ze spiżarni"
        >
          <Text style={styles.selectorLabel}>SPIŻARNIA</Text>
          <Text style={styles.selectorValue} numberOfLines={1}>
            {selectedInventoryItem ? selectedInventoryItem.name : 'Wybierz ziarno...'}
          </Text>
          <Text style={styles.selectorSub}>
            {selectedInventoryItem
              ? `${selectedInventoryItem.remainingWeightGrams}g w paczce`
              : 'Domyślna doza'}
          </Text>
        </Pressable>
      </View>

      {/* Pasek Młynka i Udostępniania Receptury (Offline QR) */}
      <View style={styles.actionPillsRow}>
        <Pressable
          style={styles.actionPillCard}
          onPress={() => setShowGrinderModal(true)}
          accessibilityRole="button"
          accessibilityLabel={`Młynek: ${grinderRecommendation.grinderName}, nastawa ${grinderRecommendation.formatted}`}
          testID="grinder-pill-btn"
        >
          <Text style={styles.actionPillIcon}>⚙️</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.actionPillLabel}>MŁYNEK</Text>
            <Text style={styles.actionPillValue} numberOfLines={1}>
              {grinderRecommendation.grinderName.split(' ')[0]}: {grinderRecommendation.formatted}
            </Text>
          </View>
          <Text style={styles.actionPillArrow}>›</Text>
        </Pressable>

        <Pressable
          style={styles.actionPillCard}
          onPress={() => setShowShareModal(true)}
          accessibilityRole="button"
          accessibilityLabel="Udostępnij recepturę przez kod QR"
          testID="share-recipe-btn"
        >
          <Text style={styles.actionPillIcon}>📱</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.actionPillLabel}>UDOSTĘPNIJ</Text>
            <Text style={styles.actionPillValue} numberOfLines={1}>
              Kod QR / Link
            </Text>
          </View>
          <Text style={styles.actionPillArrow}>↗</Text>
        </Pressable>
      </View>

      {/* Szybki przełącznik do trybu Gongfu Cha przy parzeniu herbaty */}
      {('beverageType' in recipe ? recipe.beverageType === 'TEA' : (recipe as any).type === 'TEA') && (
        <Pressable
          style={styles.gongfuBanner}
          onPress={() => router.push('/gongfu')}
        >
          <Text style={styles.gongfuBannerText}>
            🍵 Przejdź do Trybu Wielokrotnych Zalań (Gongfu Cha Tracker) →
          </Text>
        </Pressable>
      )}

      {/* Skalowanie porcji (Batch Scaling dla 1–4 osób) */}
      <View style={styles.batchSection}>
        <View style={styles.batchHeaderRow}>
          <Text style={styles.batchTitle}>👥 {t.batch.label}</Text>
          {servings > 1 && (
            <View style={styles.batchBadge}>
              <Text style={styles.batchBadgeText}>
                +{batchScaling.grindAdjustmentClicks} kliki grubiej
              </Text>
            </View>
          )}
        </View>

        <View style={styles.batchChipsRow}>
          {[1, 2, 3, 4].map((n) => (
            <Pressable
              key={n}
              style={[
                styles.batchChip,
                servings === n && styles.batchChipActive,
              ]}
              onPress={() => handleServingsChange(n)}
              disabled={isRunning}
            >
              <Text
                style={[
                  styles.batchChipText,
                  servings === n && styles.batchChipTextActive,
                ]}
              >
                {n === 1 ? t.batch.cup1 : n === 2 ? t.batch.cup2 : n === 3 ? t.batch.cup3 : t.batch.cup4}
              </Text>
            </Pressable>
          ))}
        </View>

        {servings > 1 && (
          <Text style={styles.batchAdviceText}>
            💡 {batchScaling.recommendationPl}
          </Text>
        )}
      </View>

      {/* Skalowanie dozy i wody */}
      <View style={styles.parametersRow}>
        <View style={styles.paramBox}>
          <Text style={styles.paramLabel}>DOZA</Text>
          <View style={styles.stepperRow}>
            <Pressable
              style={styles.stepBtn}
              onPress={() => setDoseGrams(Math.max(1, doseGrams - 1))}
              disabled={isRunning}
            >
              <Text style={styles.stepBtnText}>−</Text>
            </Pressable>
            <Text style={styles.paramValue}>{`${doseGrams}g`}</Text>
            <Pressable
              style={styles.stepBtn}
              onPress={() => setDoseGrams(doseGrams + 1)}
              disabled={isRunning}
            >
              <Text style={styles.stepBtnText}>+</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.paramBox}>
          <Text style={styles.paramLabel}>WODA ŁĄCZNIE</Text>
          <Text style={styles.paramValueLarge}>{`${waterGrams}g`}</Text>
        </View>

        <View style={styles.paramBox}>
          <Text style={styles.paramLabel}>TEMP / MIELENIE</Text>
          <Text style={styles.paramSubValue}>
            {waterTempCelsius}°C · {grindSetting || 'Średnio'}
          </Text>
        </View>
      </View>

      {/* Główny stoper parzenia */}
      <View
        style={styles.timerCard}
        accessible={true}
        accessibilityRole="timer"
        accessibilityLabel={`Całkowity czas: ${formatTime(snapshot.totalElapsedSeconds)}`}
      >
        <Text style={styles.timerTotalLabel}>CAŁKOWITY CZAS</Text>
        <Text style={styles.timerDisplay}>
          {formatTime(snapshot.totalElapsedSeconds)}
        </Text>

        {/* Pasek postępu kroku */}
        <View style={styles.stepProgressContainer}>
          <View
            style={[
              styles.stepProgressBar,
              { width: `${Math.round(snapshot.stepProgress * 100)}%` },
            ]}
          />
        </View>

        {/* Informacja o bieżącym etapie */}
        {snapshot.currentStep && (
          <View
            style={styles.activeStepBox}
            accessible={true}
            accessibilityLiveRegion="assertive"
            accessibilityLabel={`Krok ${snapshot.currentStepIndex + 1} z ${snapshot.totalSteps}: ${snapshot.currentStep.namePl}. Cel wody: ${snapshot.targetWaterGrams} gramów, pozostało ${snapshot.stepRemainingSeconds} sekund.`}
          >
            <View style={styles.stepHeaderRow}>
              <Text style={styles.stepBadge}>
                Krok {snapshot.currentStepIndex + 1} z {snapshot.totalSteps}
              </Text>
              <Text style={styles.stepCountdown}>
                {snapshot.stepRemainingSeconds}s
              </Text>
            </View>

            <Text style={styles.stepName}>
              {snapshot.currentStep.namePl}
            </Text>

            <View style={styles.targetWaterRow}>
              <Text style={styles.targetWaterLabel}>Cel wody w tym kroku:</Text>
              <Text style={styles.targetWaterValue}>
                {snapshot.targetWaterGrams} g
              </Text>
              {snapshot.recommendedPourRate > 0 && (
                <Text style={styles.pourRateBadge}>
                  ~{snapshot.recommendedPourRate} g/s
                </Text>
              )}
            </View>

            <Text style={styles.stepInstruction}>
              {snapshot.currentStep.instructionPl}
            </Text>
          </View>
        )}
      </View>

      {/* Przyciski kontroli parzenia */}
      <View style={styles.controlsRow}>
        {isIdle && (
          <Pressable
            style={styles.mainStartButton}
            onPress={startTimer}
            accessibilityRole="button"
            accessibilityLabel="Rozpocznij parzenie"
            accessibilityHint="Uruchamia stoper i pierwszy etap parzenia"
          >
            <Text style={styles.mainStartButtonText}>ROZPOCZNIJ PARZENIE</Text>
          </Pressable>
        )}

        {isRunning && (
          <>
            <Pressable
              style={styles.secondaryButton}
              onPress={previousStep}
              disabled={snapshot.currentStepIndex === 0}
              accessibilityRole="button"
              accessibilityLabel="Poprzedni krok"
              accessibilityHint="Cofa do poprzedniego etapu parzenia"
            >
              <Text style={styles.secondaryButtonText}>◀ Wstecz</Text>
            </Pressable>

            <Pressable
              style={styles.pauseButton}
              onPress={pauseTimer}
              accessibilityRole="button"
              accessibilityLabel="Wstrzymaj parzenie"
              accessibilityHint="Zatrzymuje odliczanie czasu"
            >
              <Text style={styles.pauseButtonText}>PAUZA</Text>
            </Pressable>

            <Pressable
              style={styles.secondaryButton}
              onPress={nextStep}
              accessibilityRole="button"
              accessibilityLabel={snapshot.isLastStep ? 'Zakończ parzenie' : 'Następny krok'}
              accessibilityHint={snapshot.isLastStep ? 'Kończy parzenie i otwiera arkusz oceny' : 'Przechodzi do kolejnego etapu zalewania'}
            >
              <Text style={styles.secondaryButtonText}>
                {snapshot.isLastStep ? 'Zakończ ▶' : 'Dalej ▶'}
              </Text>
            </Pressable>
          </>
        )}

        {isPaused && (
          <>
            <Pressable
              style={styles.resetButton}
              onPress={handleResetWithConfirm}
              accessibilityRole="button"
              accessibilityLabel="Zresetuj stoper"
              accessibilityHint="Zeruje czas i wraca do stanu początkowego"
            >
              <Text style={styles.resetButtonText}>Reset</Text>
            </Pressable>

            <Pressable
              style={styles.mainStartButton}
              onPress={resumeTimer}
              accessibilityRole="button"
              accessibilityLabel="Wznów parzenie"
              accessibilityHint="Wznawia odliczanie czasu parzenia"
            >
              <Text style={styles.mainStartButtonText}>WZNÓW</Text>
            </Pressable>

            <Pressable
              style={styles.secondaryButton}
              onPress={() => setShowFinishModal(true)}
              accessibilityRole="button"
              accessibilityLabel="Zapisz sesję"
              accessibilityHint="Otwiera arkusz degustacyjny do zapisu notatek"
            >
              <Text style={styles.secondaryButtonText}>Zapisz</Text>
            </Pressable>
          </>
        )}
      </View>

      {/* Modal wyboru receptury */}
      <Modal visible={showRecipeModal} animationType="slide" transparent={false}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t.brew.chooseRecipe}</Text>
            <Pressable onPress={() => setShowRecipeModal(false)}>
              <Text style={styles.modalCloseText}>{t.common.close}</Text>
            </Pressable>
          </View>
          <ScrollView>
            {/* Przyciski akcji: Własna receptura, Gongfu Cha & Import QR */}
            <View style={styles.modalActionButtonsRow}>
              <Pressable
                style={styles.addCustomRecipeBtn}
                onPress={() => {
                  setShowRecipeModal(false);
                  router.push('/recipe-builder');
                }}
              >
                <Text style={styles.addCustomRecipeBtnText}>{t.brew.customRecipe}</Text>
              </Pressable>

              <Pressable
                style={styles.gongfuModalBtn}
                onPress={() => {
                  setShowRecipeModal(false);
                  router.push('/gongfu');
                }}
              >
                <Text style={styles.gongfuModalBtnText}>🍵 Gongfu Cha</Text>
              </Pressable>

              <Pressable
                style={styles.importRecipeModalBtn}
                onPress={() => setShowImportModal(true)}
                testID="import-recipe-btn"
              >
                <Text style={styles.importRecipeModalBtnText}>📥 {t.brew.importRecipe}</Text>
              </Pressable>
            </View>

            {allRecipes.map((r) => (
              <Pressable
                key={r.id}
                style={[
                  styles.recipeOptionItem,
                  recipe.id === r.id && styles.recipeOptionActive,
                ]}
                onPress={() => {
                  selectRecipe(r);
                  setShowRecipeModal(false);
                }}
              >
                <View style={styles.recipeOptionHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.recipeOptionName}>{r.name}</Text>
                    <Text style={styles.recipeOptionMethod}>
                      {'beverageType' in r ? r.beverageType : r.type} · {r.method}
                      {r.isCustom ? ' · Autorska' : ''}
                    </Text>
                  </View>
                  <Pressable
                    style={styles.favToggleBtn}
                    hitSlop={10}
                    onPress={(e) => {
                      e.stopPropagation();
                      toggleRecipeFavorite(r.id);
                      refreshData();
                    }}
                    accessibilityLabel={`Ulubione: ${r.name}`}
                  >
                    <Text style={[styles.favToggleIcon, r.isFavorite && styles.favToggleIconActive]}>
                      {r.isFavorite ? '★' : '☆'}
                    </Text>
                  </Pressable>
                  {r.isCustom && (
                    <Pressable
                      style={styles.editRecipeBtn}
                      hitSlop={8}
                      onPress={(e) => {
                        e.stopPropagation();
                        setShowRecipeModal(false);
                        router.push({
                          pathname: '/recipe-builder',
                          params: { id: r.id },
                        });
                      }}
                    >
                      <Text style={styles.editRecipeBtnText}>✏️</Text>
                    </Pressable>
                  )}
                </View>
                <Text style={styles.recipeOptionAuthor}>{r.author || 'Receptura własna'}</Text>
                <Text style={styles.recipeOptionDetails}>
                  {'doseGrams' in r ? r.doseGrams : r.coffeeOrTeaDoseGrams}g kawy/herbaty ·{' '}
                  {'waterGrams' in r ? r.waterGrams : r.waterWeightGrams}g wody ·{' '}
                  {'waterTempCelsius' in r ? r.waterTempCelsius : r.waterTemperatureCelsius}°C
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* Modal wyboru ziaren ze spiżarni */}
      <Modal visible={showInventoryModal} animationType="slide" transparent={false}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Wybierz ze Spiżarni</Text>
            <Pressable onPress={() => setShowInventoryModal(false)}>
              <Text style={styles.modalCloseText}>Zamknij</Text>
            </Pressable>
          </View>
          <ScrollView>
            <Pressable
              style={styles.recipeOptionItem}
              onPress={() => {
                selectInventoryItem(null);
                setShowInventoryModal(false);
              }}
            >
              <Text style={styles.recipeOptionName}>Brak przypisania (ogólne)</Text>
              <Text style={styles.recipeOptionAuthor}>Nie odliczaj gramatury ze spiżarni</Text>
            </Pressable>
            {allInventory.map((item) => (
              <Pressable
                key={item.id}
                style={[
                  styles.recipeOptionItem,
                  selectedInventoryItem?.id === item.id && styles.recipeOptionActive,
                ]}
                onPress={() => {
                  selectInventoryItem(item);
                  setShowInventoryModal(false);
                }}
              >
                <Text style={styles.recipeOptionName}>{item.name}</Text>
                <Text style={styles.recipeOptionAuthor}>
                  {item.roasterOrProducer || 'Palarnia'} · {item.origin || ''}
                </Text>
                <Text style={styles.recipeOptionDetails}>
                  Pozostało: {item.remainingWeightGrams}g z {item.initialWeightGrams}g
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* Modal podsumowania parzenia (Karta Degustacyjna) */}
      <Modal visible={showFinishModal} animationType="slide" transparent={true}>
        <View style={styles.finishModalOverlay}>
          <View style={styles.finishModalContent}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
              <Text style={styles.finishModalTitle}>Zakończono Parzenie!</Text>
              <Text style={styles.finishModalSub}>
                Czas: {formatTime(snapshot.totalElapsedSeconds)} · Woda: {waterGrams}g
              </Text>

              {/* Ocena w gwiazdkach */}
              <Text style={styles.finishSectionLabel}>Twoja Ocena</Text>
              <View style={styles.starRow}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Pressable key={s} onPress={() => setRating(s)}>
                    <Text style={[styles.starIcon, rating >= s && styles.starActive]}>
                      ★
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Balans smaku */}
              <Text style={styles.finishSectionLabel}>Profil Balansu</Text>
              <View style={styles.balanceRow}>
                {[
                  { key: 'balanced', label: 'Zbalansowana' },
                  { key: 'sour', label: 'Za kwaśna' },
                  { key: 'bitter', label: 'Za gorzka' },
                  { key: 'weak', label: 'Wodnista' },
                ].map((b) => (
                  <Pressable
                    key={b.key}
                    style={[
                      styles.balanceChip,
                      tasteBalance === b.key && styles.balanceChipActive,
                    ]}
                    onPress={() => setTasteBalance(b.key)}
                  >
                    <Text
                      style={[
                        styles.balanceChipText,
                        tasteBalance === b.key && styles.balanceChipTextActive,
                      ]}
                    >
                      {b.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Wykres Sensoryki SCA Spider Graph */}
              <Text style={[styles.finishSectionLabel, { marginTop: 14 }]}>
                {t.sensory.title}
              </Text>
              <Text style={styles.finishSectionSub}>
                {t.sensory.subtitle}
              </Text>
              <SensoryRadarChart profile={sensoryProfile} size={190} />
              <SensoryScoreEditor
                profile={sensoryProfile}
                onChange={setSensoryProfile}
              />

              {/* Hierarchiczne Koło Smaków SCA */}
              <Text style={[styles.finishSectionLabel, { marginTop: 14 }]}>Koło Smaków SCA</Text>
              <FlavorWheelPicker
                selectedDescriptors={selectedTags}
                onToggleDescriptor={toggleTag}
              />

              {/* Profil wody użytej do parzenia */}
              <Text style={[styles.finishSectionLabel, { marginTop: 14 }]}>Woda użyta do parzenia</Text>
              <View style={styles.waterChipsRow}>
                {WATER_RECIPES.map((w) => {
                  const active = waterProfile === w.id;
                  return (
                    <Pressable
                      key={w.id}
                      testID={`water-chip-${w.id}`}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      accessibilityLabel={`Woda ${w.namePl}, GH ${w.targetGhPpm}, KH ${w.targetKhPpm}`}
                      style={[styles.waterChip, active && styles.waterChipActive]}
                      onPress={() => setWaterProfile(w.id)}
                    >
                      <Text style={[styles.waterChipText, active && styles.waterChipTextActive]}>
                        {w.namePl}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Opcjonalny TDS */}
              <View style={styles.tdsInputRow}>
                <Text style={styles.tdsInputLabel}>Odczyt TDS refractometru (%):</Text>
                <TextInput
                  style={styles.tdsTextInput}
                  placeholder="np. 1.35"
                  placeholderTextColor={theme.colors.textMuted}
                  keyboardType="numeric"
                  value={tdsInput}
                  onChangeText={setTdsInput}
                />
              </View>

              <View style={styles.finishButtonsRow}>
                <Pressable
                  style={styles.finishCancelBtn}
                  onPress={() => {
                    setShowFinishModal(false);
                    resetTimer();
                  }}
                >
                  <Text style={styles.finishCancelText}>Pomiń</Text>
                </Pressable>
                <Pressable style={styles.finishSaveBtn} onPress={handleFinishSave}>
                  <Text style={styles.finishSaveText}>Zapisz w Dzienniku</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal Wyboru Młynka */}
      <Modal visible={showGrinderModal} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t.brew.grinderModalTitle}</Text>
            <Pressable testID="close-grinder-modal-btn" onPress={() => setShowGrinderModal(false)}>
              <Text style={styles.modalCloseText}>{t.common.close}</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            <Text style={styles.modalSub}>{t.brew.grinderModalDesc}</Text>
            {SUPPORTED_GRINDERS.map((grinder) => {
              const isSelected = grinderId === grinder.id;
              const rec = getRecommendedGrindForRecipe(recipe, grinder.id);
              return (
                <Pressable
                  key={grinder.id}
                  testID={`grinder-item-${grinder.id}`}
                  style={[
                    styles.grinderItemCard,
                    isSelected && styles.grinderItemCardActive,
                  ]}
                  onPress={() => {
                    setGrinderId(grinder.id);
                    setShowGrinderModal(false);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`${grinder.name}, ${rec.formatted}`}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.grinderItemName,
                        isSelected && { color: theme.colors.copper, fontWeight: '700' },
                      ]}
                    >
                      {grinder.name}
                    </Text>
                    <Text style={styles.grinderItemRecommendation}>
                      Rekomendacja: {rec.formatted} ({rec.microns} µm)
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: '700',
                      color: isSelected ? theme.colors.copper : theme.colors.textMuted,
                    }}
                  >
                    {isSelected ? '✓' : '○'}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </Modal>

      {/* Modal Udostępniania Receptury (Offline QR) */}
      <Modal visible={showShareModal} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t.brew.qrModalTitle}</Text>
            <Pressable testID="close-share-modal-btn" onPress={() => setShowShareModal(false)}>
              <Text style={styles.modalCloseText}>{t.common.close}</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20, alignItems: 'center' }}>
            <Text style={[styles.modalSub, { textAlign: 'center', marginBottom: 16 }]}>
              {t.brew.qrModalDesc}
            </Text>

            <View style={styles.qrCard}>
              <QrCodeSvg value={shareUrl} size={220} testID="recipe-qr-code-svg" />
            </View>

            <Text style={styles.shareRecipeName}>{recipe.name}</Text>
            <Text style={styles.shareRecipeDetails}>
              {recipe.method} · {'doseGrams' in recipe ? recipe.doseGrams : recipe.coffeeOrTeaDoseGrams}g / {'waterGrams' in recipe ? recipe.waterGrams : recipe.waterWeightGrams}g · {waterTempCelsius}°C
            </Text>

            <View style={styles.shareButtonsRow}>
              <Pressable
                testID="share-link-btn"
                style={styles.shareActionBtn}
                onPress={() => {
                  Share.share({
                    title: recipe.name,
                    message: `${recipe.name} — receptura parzenia w Napar:\n${shareUrl}`,
                    url: shareUrl,
                  });
                }}
              >
                <Text style={styles.shareActionBtnText}>📤 {t.brew.qrShareLink}</Text>
              </Pressable>

              <Pressable
                testID="copy-link-btn"
                style={[styles.shareActionBtn, styles.shareActionBtnSecondary]}
                onPress={() => {
                  Alert.alert('Link receptury', shareUrl);
                }}
              >
                <Text style={styles.shareActionBtnTextSecondary}>📋 {t.brew.qrCopyLink}</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Modal Importu Receptury z Linku / QR */}
      <Modal visible={showImportModal} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t.brew.importModalTitle}</Text>
            <Pressable testID="close-import-modal-btn" onPress={() => setShowImportModal(false)}>
              <Text style={styles.modalCloseText}>{t.common.close}</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            <Text style={styles.modalSub}>{t.brew.importModalDesc}</Text>
            <TextInput
              style={[styles.importTextInput, { minHeight: 80 }]}
              multiline
              placeholder={t.brew.importInputPlaceholder}
              placeholderTextColor={theme.colors.textMuted}
              value={importUrlInput}
              onChangeText={(txt) => {
                setImportUrlInput(txt);
                const dec = decodeRecipeFromShareUrl(txt);
                setImportParsedRecipe(dec);
              }}
              testID="import-recipe-input"
            />

            {importParsedRecipe && (
              <View style={styles.importPreviewCard} testID="import-recipe-preview">
                <Text style={styles.importPreviewTitle}>
                  {importParsedRecipe.recipe.name}
                </Text>
                <Text style={styles.importPreviewSubtitle}>
                  {importParsedRecipe.recipe.method} · {importParsedRecipe.recipe.doseGrams}g / {importParsedRecipe.recipe.waterGrams}g · {importParsedRecipe.recipe.waterTempCelsius}°C
                </Text>
                <Text style={styles.importPreviewStepsCount}>
                  Liczba kroków parzenia: {importParsedRecipe.originalSteps.length}
                </Text>
                <Pressable
                  style={styles.confirmImportBtn}
                  onPress={() => {
                    try {
                      saveRecipe(importParsedRecipe.recipe);
                      refreshData();
                      selectRecipe(importParsedRecipe.recipe);
                      setShowImportModal(false);
                      setShowRecipeModal(false);
                      setImportUrlInput('');
                      setImportParsedRecipe(null);
                      Alert.alert('Sukces!', t.brew.importSuccess);
                    } catch {
                      Alert.alert('Błąd', t.brew.importError);
                    }
                  }}
                  testID="confirm-import-btn"
                >
                  <Text style={styles.confirmImportBtnText}>{t.brew.importActionBtn}</Text>
                </Pressable>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
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
  selectorRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: theme.spacing.md,
  },
  selectorCard: {
    flex: 1,
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  selectorCardActive: {
    borderColor: theme.colors.copper,
  },
  selectorLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.copper,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  selectorValue: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  selectorSub: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  parametersRow: {
    flexDirection: 'row',
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.md,
    alignItems: 'center',
  },
  paramBox: {
    flex: 1,
    alignItems: 'center',
  },
  paramLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.textMuted,
    marginBottom: 4,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: theme.colors.bgCardSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    lineHeight: 18,
    fontWeight: '600',
  },
  paramValue: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  paramValueLarge: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.copper,
  },
  paramSubValue: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  timerCard: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.lg,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.lg,
  },
  timerTotalLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    color: theme.colors.textMuted,
  },
  timerDisplay: {
    ...theme.typography.timerDisplay,
    marginVertical: 8,
  },
  stepProgressContainer: {
    width: '100%',
    height: 6,
    backgroundColor: theme.colors.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 16,
  },
  stepProgressBar: {
    height: '100%',
    backgroundColor: theme.colors.copper,
  },
  activeStepBox: {
    width: '100%',
    backgroundColor: theme.colors.bgCardSecondary,
    borderRadius: theme.borderRadius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  stepHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  stepBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.copper,
  },
  stepCountdown: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  stepName: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 6,
  },
  targetWaterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  targetWaterLabel: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  targetWaterValue: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  pourRateBadge: {
    fontSize: 11,
    color: theme.colors.copperLight,
    backgroundColor: theme.colors.copperMuted,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontWeight: '600',
  },
  stepInstruction: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  mainStartButton: {
    flex: 1,
    backgroundColor: theme.colors.copper,
    paddingVertical: 16,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainStartButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  pauseButton: {
    flex: 1,
    backgroundColor: '#8C4C23',
    paddingVertical: 16,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: theme.colors.bgCard,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  resetButton: {
    backgroundColor: theme.colors.bgCard,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButtonText: {
    color: theme.colors.danger,
    fontSize: 14,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    padding: theme.spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  modalCloseText: {
    fontSize: 16,
    color: theme.colors.copper,
    fontWeight: '600',
  },
  recipeOptionItem: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.md,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  recipeOptionActive: {
    borderColor: theme.colors.copper,
    backgroundColor: theme.colors.bgCardSecondary,
  },
  recipeOptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  recipeOptionName: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    flex: 1,
  },
  recipeOptionMethod: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.copper,
  },
  recipeOptionAuthor: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  recipeOptionDetails: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  finishModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  finishModalContent: {
    backgroundColor: theme.colors.bgCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderTopWidth: 1,
    borderColor: theme.colors.border,
  },
  finishModalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  finishModalSub: {
    fontSize: 14,
    color: theme.colors.copper,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 18,
  },
  finishSectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 8,
    marginTop: 10,
  },
  starRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 10,
  },
  starIcon: {
    fontSize: 32,
    color: theme.colors.border,
  },
  starActive: {
    color: '#FFD700',
  },
  balanceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  balanceChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.bgCardSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  balanceChipActive: {
    backgroundColor: theme.colors.copperMuted,
    borderColor: theme.colors.copper,
  },
  balanceChipText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  balanceChipTextActive: {
    color: theme.colors.copper,
    fontWeight: '600',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  flavorTag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.bgCardSecondary,
  },
  flavorTagActive: {
    backgroundColor: theme.colors.emeraldMuted,
    borderColor: theme.colors.emerald,
    borderWidth: 1,
  },
  flavorTagText: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  flavorTagTextActive: {
    color: theme.colors.emeraldLight,
    fontWeight: '600',
  },
  waterChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  waterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.bgCardSecondary,
  },
  waterChipActive: {
    borderColor: theme.colors.copper,
    backgroundColor: theme.colors.copperMuted,
  },
  waterChipText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  waterChipTextActive: {
    color: theme.colors.textPrimary,
    fontWeight: '700',
  },
  tdsInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 20,
  },
  tdsInputLabel: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  tdsTextInput: {
    backgroundColor: theme.colors.bgCardSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: 12,
    paddingVertical: 6,
    color: theme.colors.textPrimary,
    width: 80,
    textAlign: 'center',
    fontSize: 14,
  },
  finishButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  finishCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.bgCardSecondary,
    alignItems: 'center',
  },
  finishCancelText: {
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  finishSaveBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.copper,
    alignItems: 'center',
  },
  finishSaveText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  addCustomRecipeBtn: {
    flex: 1,
    backgroundColor: 'rgba(217, 119, 54, 0.15)',
    borderWidth: 1,
    borderColor: theme.colors.copper,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  addCustomRecipeBtnText: {
    color: theme.colors.copper,
    fontWeight: '700',
    fontSize: 14,
  },
  editRecipeBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: theme.colors.bgCardSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginLeft: 8,
  },
  editRecipeBtnText: {
    fontSize: 14,
  },
  gongfuBanner: {
    backgroundColor: 'rgba(42, 123, 98, 0.15)',
    borderWidth: 1,
    borderColor: theme.colors.emerald,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  gongfuBannerText: {
    color: theme.colors.emeraldLight,
    fontWeight: '700',
    fontSize: 13,
  },
  modalActionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  gongfuModalBtn: {
    flex: 1,
    backgroundColor: 'rgba(42, 123, 98, 0.15)',
    borderWidth: 1,
    borderColor: theme.colors.emerald,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  gongfuModalBtnText: {
    color: theme.colors.emeraldLight,
    fontWeight: '700',
    fontSize: 14,
  },
  favoritesSection: {
    marginBottom: 12,
  },
  favoritesSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.copper,
    letterSpacing: 0.5,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  favoritesScroll: {
    gap: 8,
    paddingRight: 8,
  },
  favoriteChip: {
    backgroundColor: theme.colors.bgCardSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: 160,
  },
  favoriteChipActive: {
    backgroundColor: 'rgba(217, 119, 54, 0.15)',
    borderColor: theme.colors.copper,
  },
  favoriteChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  favoriteChipTextActive: {
    color: theme.colors.copper,
  },
  favoriteChipSub: {
    fontSize: 10,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  batchSection: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.md,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  batchHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  batchTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  batchBadge: {
    backgroundColor: 'rgba(217, 119, 54, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  batchBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.copper,
  },
  batchChipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  batchChip: {
    flex: 1,
    backgroundColor: theme.colors.bgCardSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    paddingVertical: 8,
    alignItems: 'center',
  },
  batchChipActive: {
    backgroundColor: 'rgba(217, 119, 54, 0.2)',
    borderColor: theme.colors.copper,
  },
  batchChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  batchChipTextActive: {
    color: theme.colors.copper,
    fontWeight: '800',
  },
  batchAdviceText: {
    fontSize: 11,
    color: theme.colors.copper,
    marginTop: 8,
    lineHeight: 15,
  },
  favToggleBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favToggleIcon: {
    fontSize: 20,
    color: theme.colors.textMuted,
  },
  favToggleIconActive: {
    color: theme.colors.copper,
  },
  finishSectionSub: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginBottom: 8,
  },
  modalSub: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginBottom: 14,
    lineHeight: 18,
  },
  actionPillsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: theme.spacing.md,
  },
  actionPillCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.md,
    padding: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  actionPillIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  actionPillLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: theme.colors.copper,
    letterSpacing: 0.5,
  },
  actionPillValue: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  actionPillArrow: {
    fontSize: 16,
    color: theme.colors.textMuted,
    marginLeft: 4,
  },
  importRecipeModalBtn: {
    flex: 1,
    backgroundColor: theme.colors.bgCardSecondary,
    borderRadius: theme.borderRadius.md,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  importRecipeModalBtnText: {
    color: theme.colors.copper,
    fontWeight: '600',
    fontSize: 13,
  },
  qrCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  shareRecipeName: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  shareRecipeDetails: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  shareButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginTop: 8,
  },
  shareActionBtn: {
    flex: 1,
    backgroundColor: theme.colors.copper,
    borderRadius: theme.borderRadius.md,
    padding: 14,
    alignItems: 'center',
  },
  shareActionBtnSecondary: {
    backgroundColor: theme.colors.bgCardSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  shareActionBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  shareActionBtnTextSecondary: {
    color: theme.colors.textPrimary,
    fontWeight: '600',
    fontSize: 14,
  },
  grinderItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 10,
  },
  grinderItemCardActive: {
    borderColor: theme.colors.copper,
    backgroundColor: theme.colors.bgCardSecondary,
  },
  grinderItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  grinderItemRecommendation: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  importTextInput: {
    backgroundColor: theme.colors.bgCardSecondary,
    borderRadius: theme.borderRadius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    color: theme.colors.textPrimary,
    fontSize: 13,
    marginBottom: 16,
  },
  importPreviewCard: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.copper,
    marginBottom: 16,
  },
  importPreviewTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  importPreviewSubtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginBottom: 6,
  },
  importPreviewStepsCount: {
    fontSize: 12,
    color: theme.colors.copper,
    marginBottom: 14,
  },
  confirmImportBtn: {
    backgroundColor: theme.colors.copper,
    borderRadius: theme.borderRadius.md,
    padding: 14,
    alignItems: 'center',
  },
  confirmImportBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});

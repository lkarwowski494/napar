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
import {
  getRecipes,
  getInventoryItems,
  toggleRecipeFavorite,
  saveRecipe,
  duplicateRecipe,
} from '../../src/core/database';
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
  SUPPORTED_GRINDERS,
  getRecommendedGrindForRecipe,
} from '../../src/core/grinder-converter';
import {
  encodeRecipeToShareUrl,
  decodeRecipeFromShareUrl,
} from '../../src/core/recipe-share';
import { QrCodeSvg } from '../../src/core/qr-code';
import { confirmAction } from '../../src/core/confirm';
import { calculateBrewCost } from '../../src/core/cost-calculator';
import { QrScannerModal } from '../../src/core/QrScannerModal';
import { useAppAccess } from '../../src/core/app-access';
import { Apps4BrewPassModal } from '../../src/components/Apps4BrewPassModal';
import { BrewHeader } from '../../src/components/brew/BrewHeader';
import { BrewQuickPrepCard } from '../../src/components/brew/BrewQuickPrepCard';
import { BrewActiveFocusTimer } from '../../src/components/brew/BrewActiveFocusTimer';
import { BrewProAccordion } from '../../src/components/brew/BrewProAccordion';
import { BrewFinishModal } from '../../src/components/brew/BrewFinishModal';

export default function BrewScreen() {
  const router = useRouter();
  const { t, language } = useTranslation();
  const { canCreate, recordBrew, refresh } = useAppAccess();

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
  } = useBrew();

  const [allRecipes, setAllRecipes] = useState<any[]>(MASTER_RECIPES);
  const [allInventory, setAllInventory] = useState<InventoryItem[]>([]);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [showGrinderModal, setShowGrinderModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [showPaywallModal, setShowPaywallModal] = useState(false);
  const [importUrlInput, setImportUrlInput] = useState('');
  const [importParsedRecipe, setImportParsedRecipe] = useState<{
    recipe: SavedRecipe;
    originalSteps: any[];
  } | null>(null);

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
      Alert.alert(
        'Mało ziaren w paczce!',
        `W paczce "${selectedInventoryItem.name}" pozostało tylko ${selectedInventoryItem.remainingWeightGrams}g, a doza wymaga ${doseGrams}g. Czy chcesz zaparzyć blend z innymi ziarnami?`,
        [
          { text: 'Anuluj', style: 'cancel' },
          { text: 'Parz Blend', onPress: () => startTimer() },
        ]
      );
      return;
    }
    startTimer();
  };

  const handleScanQrRecipe = (data: string) => {
    setShowQrScanner(false);
    const decoded = decodeRecipeFromShareUrl(data);
    if (!decoded) {
      Alert.alert(t.common.confirm, t.brew.importError);
      return;
    }
    saveRecipe(decoded.recipe);
    setAllRecipes(getRecipes());
    selectRecipe(decoded.recipe);
    setShowRecipeModal(false);
    Alert.alert(t.common.save, t.brew.importSuccess);
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
      {/* Nagłówek: Młynek z klikami, Ulubione, Receptura, Spiżarnia i Udostępnianie */}
      <BrewHeader
        recipe={recipe}
        selectedInventoryItem={selectedInventoryItem}
        waterTempCelsius={waterTempCelsius}
        grinderRecommendation={grinderRecommendation}
        favoriteRecipes={favoriteRecipes}
        isRunning={isRunning || isPaused}
        onSelectRecipe={handleSelectRecipe}
        onOpenRecipeModal={() => {
          refreshData();
          setShowRecipeModal(true);
        }}
        onOpenInventoryModal={() => setShowInventoryModal(true)}
        onOpenGrinderModal={() => setShowGrinderModal(true)}
        onOpenShareModal={() => setShowShareModal(true)}
        onNavigateToGongfu={() => router.push('/gongfu')}
      />

      {/* Stan Przygotowawczy (Przed parzeniem): Karta 1-Tap ze stepperami */}
      {!isRunning && !isPaused && (
        <BrewQuickPrepCard
          doseGrams={doseGrams}
          waterGrams={waterGrams}
          waterTempCelsius={waterTempCelsius}
          grindSetting={grindSetting}
          servings={servings}
          onServingsChange={handleServingsChange}
          onDoseChange={setDoseGrams}
          disabled={isRunning}
          batchScaling={batchScaling}
        />
      )}

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
          sensoryProfile={sensoryProfile}
          onChangeSensory={setSensoryProfile}
          selectedTags={selectedTags}
          onToggleTag={toggleTag}
          costTotalPln={brewCost.totalHomeCost}
          costSavingsPln={brewCost.savingsPerCup}
        />
      )}

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
            <View style={styles.modalActionButtonsRow}>
              <Pressable
                style={styles.addCustomRecipeBtn}
                onPress={() => {
                  setShowRecipeModal(false);
                  router.push('/recipe-builder');
                }}
              >
                <Text style={styles.addCustomRecipeBtnText}>
                  {t.brew.customRecipe}
                </Text>
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
                <Text style={styles.importRecipeModalBtnText}>
                  📥 {t.brew.importRecipe}
                </Text>
              </Pressable>

              <Pressable
                style={styles.scanQrModalBtn}
                onPress={() => setShowQrScanner(true)}
                testID="scan-qr-btn"
                accessibilityRole="button"
                accessibilityLabel="Skanuj kod QR receptury aparatem"
              >
                <Text style={styles.scanQrModalBtnText}>📷 QR</Text>
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
                    <Text
                      style={[
                        styles.favToggleIcon,
                        r.isFavorite && styles.favToggleIconActive,
                      ]}
                    >
                      {r.isFavorite ? '★' : '☆'}
                    </Text>
                  </Pressable>
                  <Pressable
                    style={styles.duplicateRecipeBtn}
                    hitSlop={8}
                    onPress={(e) => {
                      e?.stopPropagation?.();
                      handleDuplicateRecipe(r);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`${t.brew.duplicateRecipe}: ${r.name}`}
                  >
                    <Text style={styles.duplicateRecipeBtnText}>📋</Text>
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
                <Text style={styles.recipeOptionAuthor}>
                  {r.author || 'Receptura własna'}
                </Text>
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
              <Text style={styles.recipeOptionAuthor}>
                Nie odliczaj gramatury ze spiżarni
              </Text>
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
      <Modal visible={showGrinderModal} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t.brew.grinderModalTitle}</Text>
            <Pressable
              testID="close-grinder-modal-btn"
              onPress={() => setShowGrinderModal(false)}
            >
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
                        isSelected && {
                          color: theme.colors.copper,
                          fontWeight: '700',
                        },
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
            <Pressable
              testID="close-share-modal-btn"
              onPress={() => setShowShareModal(false)}
            >
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
              {recipe.method} ·{' '}
              {'doseGrams' in recipe ? recipe.doseGrams : recipe.coffeeOrTeaDoseGrams}
              g /{' '}
              {'waterGrams' in recipe ? recipe.waterGrams : recipe.waterWeightGrams}
              g · {waterTempCelsius}°C
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
                <Text style={styles.shareActionBtnText}>
                  📤 {t.brew.qrShareLink}
                </Text>
              </Pressable>

              <Pressable
                testID="copy-link-btn"
                style={[styles.shareActionBtn, styles.shareActionBtnSecondary]}
                onPress={() => {
                  Alert.alert('Link receptury', shareUrl);
                }}
              >
                <Text style={styles.shareActionBtnTextSecondary}>
                  📋 {t.brew.qrCopyLink}
                </Text>
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
            <Pressable
              testID="close-import-modal-btn"
              onPress={() => setShowImportModal(false)}
            >
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
                  {importParsedRecipe.recipe.method} ·{' '}
                  {importParsedRecipe.recipe.doseGrams}g /{' '}
                  {importParsedRecipe.recipe.waterGrams}g ·{' '}
                  {importParsedRecipe.recipe.waterTempCelsius}°C
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
                  <Text style={styles.confirmImportBtnText}>
                    {t.brew.importActionBtn}
                  </Text>
                </Pressable>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

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
  duplicateRecipeBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: theme.colors.bgCardSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginLeft: 8,
  },
  duplicateRecipeBtnText: {
    fontSize: 14,
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
  modalSub: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginBottom: 14,
    lineHeight: 18,
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
  scanQrModalBtn: {
    backgroundColor: theme.colors.bgCardSecondary,
    borderRadius: theme.borderRadius.md,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.copper,
  },
  scanQrModalBtnText: {
    color: theme.colors.copper,
    fontWeight: '700',
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

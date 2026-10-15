// ============================================================================
// Napar (Steepwise) — Ekran Główny: Asystent Parzenia (Active Brew Assistant)
// Apps4Brew: Zero-login, instant start, precyzyjny stoper z haptyką i Live Guidance
// ============================================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useBrew } from '../../src/core/brew-context';
import { getRecipes, getInventoryItems } from '../../src/core/database';
import { MASTER_RECIPES } from '../../src/core/recipes-data';
import { InventoryItem, SavedRecipe } from '../../src/core/database-schema';
import { FlavorWheelPicker } from '../../src/core/flavor-wheel-picker';
import { theme } from '../../src/core/theme';
import { useTranslation } from '../../src/core/i18n';

export default function BrewScreen() {
  const router = useRouter();
  const { t } = useTranslation();
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
  } = useBrew();

  const [allRecipes, setAllRecipes] = useState<any[]>(MASTER_RECIPES);
  const [allInventory, setAllInventory] = useState<InventoryItem[]>([]);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);

  // Formularz podsumowania degustacji po parzeniu
  const [rating, setRating] = useState<number>(5);
  const [tasteBalance, setTasteBalance] = useState<string>('balanced');
  const [tdsInput, setTdsInput] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
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
            <Text style={styles.paramValue}>{doseGrams}g</Text>
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
          <Text style={styles.paramValueLarge}>{waterGrams}g</Text>
        </View>

        <View style={styles.paramBox}>
          <Text style={styles.paramLabel}>TEMP / MIELENIE</Text>
          <Text style={styles.paramSubValue}>
            {waterTempCelsius}°C · {grindSetting || 'Średnio'}
          </Text>
        </View>
      </View>

      {/* Główny stoper parzenia */}
      <View style={styles.timerCard}>
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
          <View style={styles.activeStepBox}>
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
          <Pressable style={styles.mainStartButton} onPress={startTimer}>
            <Text style={styles.mainStartButtonText}>ROZPOCZNIJ PARZENIE</Text>
          </Pressable>
        )}

        {isRunning && (
          <>
            <Pressable
              style={styles.secondaryButton}
              onPress={previousStep}
              disabled={snapshot.currentStepIndex === 0}
            >
              <Text style={styles.secondaryButtonText}>◀ Wstecz</Text>
            </Pressable>

            <Pressable style={styles.pauseButton} onPress={pauseTimer}>
              <Text style={styles.pauseButtonText}>PAUZA</Text>
            </Pressable>

            <Pressable style={styles.secondaryButton} onPress={nextStep}>
              <Text style={styles.secondaryButtonText}>
                {snapshot.isLastStep ? 'Zakończ ▶' : 'Dalej ▶'}
              </Text>
            </Pressable>
          </>
        )}

        {isPaused && (
          <>
            <Pressable style={styles.resetButton} onPress={resetTimer}>
              <Text style={styles.resetButtonText}>Reset</Text>
            </Pressable>

            <Pressable style={styles.mainStartButton} onPress={resumeTimer}>
              <Text style={styles.mainStartButtonText}>WZNÓW</Text>
            </Pressable>

            <Pressable
              style={styles.secondaryButton}
              onPress={() => setShowFinishModal(true)}
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
            {/* Przycisk dodania własnej receptury */}
            <Pressable
              style={styles.addCustomRecipeBtn}
              onPress={() => {
                setShowRecipeModal(false);
                router.push('/recipe-builder');
              }}
            >
              <Text style={styles.addCustomRecipeBtnText}>{t.brew.customRecipe}</Text>
            </Pressable>

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

            {/* Hierarchiczne Koło Smaków SCA */}
            <Text style={styles.finishSectionLabel}>Koło Smaków SCA</Text>
            <FlavorWheelPicker
              selectedDescriptors={selectedTags}
              onToggleDescriptor={toggleTag}
            />

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
          </View>
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
    backgroundColor: 'rgba(217, 119, 54, 0.15)',
    borderWidth: 1,
    borderColor: theme.colors.copper,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 14,
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
});

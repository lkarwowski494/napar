// ============================================================================
// Napar (Steepwise) — Ekran Główny: Asystent Parzenia (Active Brew Assistant)
// Apps4Brew: Zero-login, instant start, precyzyjny stoper z haptyką i Live Guidance
// Lean BPR & Wzorzec P16 ("Jedna Otwarta Karta Inline")
// 100% Strictly Typed, Zero `any`
// ============================================================================

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../src/core/theme';
import { StarIcon } from '../../src/components/icons/CraftIcons';
import { useBrewWorkflow } from '../../src/core/useBrewWorkflow';
import { BrewBanners } from '../../src/components/brew/BrewBanners';
import { BrewHeader } from '../../src/components/brew/BrewHeader';
import { BrewQuickPrepCard } from '../../src/components/brew/BrewQuickPrepCard';
import { BrewActiveFocusTimer } from '../../src/components/brew/BrewActiveFocusTimer';
import { RecipeSelectModal } from '../../src/components/brew/RecipeSelectModal';
import { InventorySelectModal } from '../../src/components/brew/InventorySelectModal';
import { BrewModalsContainer } from '../../src/components/brew/BrewModalsContainer';

export default function BrewScreen() {
  const workflow = useBrewWorkflow();
  const {
    router,
    t,
    language,
    unitSystem,
    canCreate,
    isHistoryReadOnly,
    recipe,
    selectedInventoryItem,
    doseGrams,
    waterGrams,
    waterTempCelsius,
    grindSetting,
    snapshot,
    setDoseGrams,
    setWaterGrams,
    startTimer,
    pauseTimer,
    resumeTimer,
    nextStep,
    previousStep,
    adjustStepDuration,
    waterProfile,
    setWaterProfile,
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
    setShowFinishModal,
    setShowProcedureModal,
    setShowGrinderModal,
    setShowShareModal,
    setShowImportModal,
    setShowQrScanner,
    setShowPaywallModal,
    corruptState,
    handleDismissCorrupt,
    recentFiveStarSession,
    handleQuickReBrew,
    handleStartTimer,
    tdsInput,
    setTdsInput,
    servings,
    handleServingsChange,
    batchScaling,
    handleResetWithConfirm,
    isRunning,
    isPaused,
    refreshData,
  } = workflow;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Banery systemowe i Złote Zasady domeny */}
      <BrewBanners
        corruptState={corruptState}
        isHistoryReadOnly={isHistoryReadOnly}
        language={language}
        onDismissCorrupt={handleDismissCorrupt}
      />

      {/* KROK 1: Co robimy? (Wybór receptury i surowca ze spiżarni) */}
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
        onOpenRecipeModal={handleOpenRecipeInline}
        onOpenInventoryModal={handleOpenInventoryInline}
        onOpenGrinderModal={() => setShowGrinderModal(true)}
        onOpenShareModal={() => setShowShareModal(true)}
        onNavigateToGongfu={() => router.push('/gongfu')}
      />

      {/* Wzorzec P16: Zwijana karta inline wyboru receptury */}
      <RecipeSelectModal
        inline
        visible={showRecipeModal}
        onClose={() => setShowRecipeModal(false)}
        recipes={allRecipes}
        activeRecipeId={recipe.id}
        beveragePreference={beveragePreference}
        categoryFilter={recipeCategoryFilter}
        onCategoryFilterChange={setRecipeCategoryFilter}
        onSelectRecipe={handleSelectRecipe}
        onToggleFavorite={(id) => {
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

      {/* Wzorzec P16: Zwijana karta inline wyboru ziaren ze spiżarni */}
      <InventorySelectModal
        inline
        visible={showInventoryModal}
        onClose={() => setShowInventoryModal(false)}
        inventory={allInventory}
        selectedItem={selectedInventoryItem}
        onSelectItem={workflow.selectInventoryItem}
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

      {/* KROK 4: Asystent Procedury Krok po Kroku */}
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


      {/* Wszystkie modale obwodowe */}
      <BrewModalsContainer workflow={workflow} />
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
});

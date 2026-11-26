// ============================================================================
// Napar — BrewModalsContainer Component
// Encapsulates modal dialogues outside the core inline interaction loop
// ============================================================================

import React from 'react';
import { ProcedureModal } from './ProcedureModal';
import { BrewFinishModal } from './BrewFinishModal';
import { GrinderSelectModal } from './GrinderSelectModal';
import { ShareRecipeModal } from './ShareRecipeModal';
import { ImportRecipeModal } from './ImportRecipeModal';
import { InventorySelectModal } from './InventorySelectModal';
import { QrScannerModal } from '../../core/QrScannerModal';
import { OnboardingModal } from '../OnboardingModal';
import { useBrewWorkflow } from '../../hooks/useBrewWorkflow';

interface BrewModalsContainerProps {
  workflow: ReturnType<typeof useBrewWorkflow>;
}

export const BrewModalsContainer: React.FC<BrewModalsContainerProps> = ({ workflow }) => {
  const {
    recipe,
    scaledSteps,
    snapshot,
    isRunning,
    unitSystem,
    language,
    pauseTimer,
    resumeTimer,
    adjustStepDuration,
    resetCurrentStep,
    previousStep,
    nextStep,
    resetTimer,
    handleStartTimer,
    handleResetWithConfirm,
    selectRecipe,
    refreshData,
    showProcedureModal,
    setShowProcedureModal,
    showFinishModal,
    setShowFinishModal,
    showGrinderModal,
    setShowGrinderModal,
    showShareModal,
    setShowShareModal,
    showImportModal,
    setShowImportModal,
    showQrScanner,
    setShowQrScanner,
    showInventoryModal,
    setShowInventoryModal,
    allInventory,
    selectedInventoryItem,
    selectInventoryItem,
    showOnboarding,
    handleCompleteOnboarding,
    waterGrams,
    waterTempCelsius,
    grinderId,
    setGrinderId,
    shareUrl,
    rating,
    setRating,
    tasteBalance,
    setTasteBalance,
    sensoryProfile,
    setSensoryProfile,
    selectedTags,
    toggleTag,
    waterProfile,
    setWaterProfile,
    notes,
    setNotes,
    handleFinishSave,
    handleScanQrRecipe,
    t,
  } = workflow;

  // DEEP-001: używamy scaledSteps (parsowanych z stepsJson dla SavedRecipe i przeskalowanych do wody/porcji),
  // zamiast sprawdzać 'steps' in recipe (co psuło każdą recepturę wczytaną z SQLite do „KROK 1 Z 1”).
  const stepsList =
    Array.isArray(scaledSteps) && scaledSteps.length > 0
      ? scaledSteps
      : 'steps' in recipe && Array.isArray(recipe.steps) && recipe.steps.length > 0
      ? recipe.steps
      : snapshot.currentStep
      ? [snapshot.currentStep]
      : [];

  return (
    <>
      {/* Pełnoekranowy Asystent Procedury Krok po Kroku (ProcedureModal) */}
      <ProcedureModal
        visible={showProcedureModal}
        recipeName={recipe.name}
        steps={stepsList}
        currentStepIndex={snapshot.currentStepIndex}
        isRunning={isRunning}
        status={snapshot.status}
        stepRemainingSeconds={snapshot.stepRemainingSeconds}
        totalElapsedSeconds={snapshot.totalElapsedSeconds}
        unitSystem={unitSystem}
        language={language}
        t={t}
        onStart={handleStartTimer}
        onReset={handleResetWithConfirm}
        onPauseResume={() => {
          if (isRunning) {
            pauseTimer();
          } else {
            resumeTimer();
          }
        }}
        onAdjustTimeSeconds={(deltaSec) => adjustStepDuration(deltaSec)}
        onResetCurrentStep={(parsedSec) => {
          if (typeof resetCurrentStep === 'function') {
            resetCurrentStep(parsedSec);
          } else {
            const delta = parsedSec - snapshot.stepRemainingSeconds;
            if (delta !== 0) {
              adjustStepDuration(delta);
            }
          }
        }}
        onPrevStep={() => {
          previousStep();
        }}
        onNextStep={() => {
          nextStep();
        }}
        onFinishAndSave={() => {
          setShowProcedureModal(false);
          pauseTimer();
          setShowFinishModal(true);
        }}
        onClose={() => setShowProcedureModal(false)}
      />

      {/* Modal Podsumowania Parzenia (Karta Degustacyjna & Dial-in Doctor) */}
      <BrewFinishModal
        visible={showFinishModal}
        unitSystem={unitSystem}
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
        notes={notes}
        onChangeNotes={setNotes}
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
        language={language}
      />

      {/* Modal Udostępniania Receptury (Offline QR) */}
      <ShareRecipeModal
        visible={showShareModal}
        onClose={() => setShowShareModal(false)}
        recipe={recipe}
        shareUrl={shareUrl}
        waterTempCelsius={waterTempCelsius}
        unitSystem={unitSystem}
        language={language}
        t={t}
      />

      {/* Modal Importu Receptury z Linku / QR */}
      <ImportRecipeModal
        visible={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportSuccess={(importedRecipe) => {
          refreshData();
          selectRecipe(importedRecipe as any);
          setShowImportModal(false);
        }}
        unitSystem={unitSystem}
        t={t}
      />

      {/* Skaner Aparatem Kodów QR */}
      <QrScannerModal
        visible={showQrScanner}
        onClose={() => setShowQrScanner(false)}
        onScanRecipe={handleScanQrRecipe}
        t={t}
        language={language}
      />

      {/* Modal Wyboru Pozycji ze Spiżarni */}
      <InventorySelectModal
        visible={showInventoryModal}
        onClose={() => setShowInventoryModal(false)}
        inventory={allInventory}
        selectedItem={selectedInventoryItem}
        onSelectItem={(item) => selectInventoryItem(item)}
        t={t}
      />


      {/* Onboarding Modal */}
      <OnboardingModal
        visible={showOnboarding}
        onComplete={handleCompleteOnboarding}
      />
    </>
  );
};

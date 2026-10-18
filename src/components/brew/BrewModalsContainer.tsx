// ============================================================================
// Napar (Steepwise) — BrewModalsContainer Component
// Encapsulates modal dialogues outside the core inline interaction loop
// ============================================================================

import React from 'react';
import { ProcedureModal } from './ProcedureModal';
import { BrewFinishModal } from './BrewFinishModal';
import { GrinderSelectModal } from './GrinderSelectModal';
import { ShareRecipeModal } from './ShareRecipeModal';
import { ImportRecipeModal } from './ImportRecipeModal';
import { QrScannerModal } from '../../core/QrScannerModal';
import { Apps4BrewPassModal } from '../Apps4BrewPassModal';
import { OnboardingModal } from '../OnboardingModal';
import { useBrewWorkflow } from '../../core/useBrewWorkflow';

interface BrewModalsContainerProps {
  workflow: ReturnType<typeof useBrewWorkflow>;
}

export const BrewModalsContainer: React.FC<BrewModalsContainerProps> = ({ workflow }) => {
  const {
    recipe,
    snapshot,
    isRunning,
    unitSystem,
    language,
    pauseTimer,
    resumeTimer,
    adjustStepDuration,
    previousStep,
    nextStep,
    resetTimer,
    selectRecipe,
    refreshData,
    refresh,
    canCreate,
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
    showPaywallModal,
    setShowPaywallModal,
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
    tdsInput,
    setTdsInput,
    notes,
    setNotes,
    brewCost,
    handleFinishSave,
    handleScanQrRecipe,
    t,
  } = workflow;

  const stepsList =
    'steps' in recipe && Array.isArray(recipe.steps)
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
          setShowImportModal(false);
          setShowPaywallModal(true);
        }}
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
      />

      {/* Apps4Brew Pass Paywall Modal */}
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

      {/* Onboarding Modal */}
      <OnboardingModal
        visible={showOnboarding}
        onComplete={handleCompleteOnboarding}
      />
    </>
  );
};

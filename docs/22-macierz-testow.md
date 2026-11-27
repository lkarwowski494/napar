# Macierz Testów (AST Coverage Matrix) — NAPAR

Wygenerowano automatycznie przez `scripts/test-matrix.mjs` zgodnie z wymaganiami **BR-TEST-028..031**.
Zasada dowodu: wyłącznie wykonywalny kod testu (wycięte komentarze, importy i opisy `test`/`describe`).

## Podsumowanie Pokrycia

| Kategoria | Łącznie | Pokryte | Pokrycie % | Status |
| :--- | :---: | :---: | :---: | :---: |
| **EKRAN** | 9 | 9 | **100.0%** | ✅ POKRYTE |
| **UI** | 135 | 135 | **100.0%** | ✅ POKRYTE |
| **TEKST** | 586 | 586 | **100.0%** | ✅ POKRYTE |
| **LOGIKA** | 186 | 186 | **100.0%** | ✅ POKRYTE |
| **WYMIAR** | 46 | 46 | **100.0%** | ✅ POKRYTE |

Łącznie elementów: **962** | Pokrytych: **962** | Brakujących: **0**

## Szczegółowa Lista Elementów

| Kategoria | Nazwa elementu | Plik źródłowy | Status | Pliki testowe |
| :--- | :--- | :--- | :---: | :--- |
| `EKRAN` | `/(tabs)/beans` | `app/(tabs)/beans.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/save-feedback.test.tsx |
| `EKRAN` | `/(tabs)/caffeine` | `app/(tabs)/caffeine.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/deep-d2-domain-audio-grinders.test.tsx |
| `EKRAN` | `/(tabs)/dialin` | `app/(tabs)/dialin.tsx` | ✅ | src/core/__tests__/dialin-screen.test.tsx |
| `EKRAN` | `/(tabs)/index` | `app/(tabs)/index.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/e2e-contract.test.ts |
| `EKRAN` | `/(tabs)/journal` | `app/(tabs)/journal.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/m2-p3-fixes.test.tsx |
| `EKRAN` | `/(tabs)/settings` | `app/(tabs)/settings.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/m2-p3-fixes.test.tsx |
| `EKRAN` | `/gongfu` | `app/gongfu.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/close-button-guard.test.tsx |
| `EKRAN` | `/recipe-builder` | `app/recipe-builder.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/close-button-guard.test.tsx |
| `EKRAN` | `/settings` | `app/settings.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/data-layer-sqlite.test.ts |
| `TEKST` | `appName` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/bpr-components.test.tsx |
| `TEKST` | `appTagline` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts |
| `UI` | `common.cancel` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/close-button-guard.test.tsx |
| `UI` | `common.save` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/bpr-components.test.tsx |
| `UI` | `common.delete` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/deep-d2-domain-audio-grinders.test.tsx |
| `UI` | `common.edit` | `src/core/i18n.tsx` | ✅ | tests/deep-d1-p0-fixes.test.tsx, src/components/beans/__tests__/BeanEditModal.test.tsx |
| `UI` | `common.close` | `src/core/i18n.tsx` | ✅ | tests/bpr-components.test.tsx, tests/close-button-guard.test.tsx |
| `UI` | `common.confirm` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/brew-screen.test.tsx, src/core/__tests__/i18n.test.ts |
| `UI` | `common.back` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/deep-d1-p0-fixes.test.tsx |
| `UI` | `common.next` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/bpr-components.test.tsx |
| `UI` | `common.finish` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/audit-fixes.test.tsx |
| `UI` | `common.ok` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/data-layer-sqlite.test.ts |
| `UI` | `common.error` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/contrast-tokens.test.ts |
| `UI` | `common.howItWorks` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/bpr-components.test.tsx |
| `UI` | `common.timerStepWarning` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts |
| `UI` | `common.stepFinished` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts |
| `UI` | `common.brewingFinished` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts |
| `UI` | `common.grams` | `src/core/i18n.tsx` | ✅ | src/components/brew/__tests__/BrewQuickPrepCard.test.tsx, src/core/__tests__/i18n.test.ts |
| `UI` | `common.seconds` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/components/brew/__tests__/ProcedureModal.test.tsx |
| `UI` | `common.celsius` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts |
| `UI` | `common.modalClose` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts |
| `UI` | `common.saveSuccess` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts |
| `UI` | `common.saveErrorTitle` | `src/core/i18n.tsx` | ✅ | tests/save-feedback.test.tsx, src/core/__tests__/gongfu-screen.test.tsx |
| `UI` | `common.saveErrorDesc` | `src/core/i18n.tsx` | ✅ | tests/save-feedback.test.tsx, src/core/__tests__/i18n.test.ts |
| `UI` | `common.invalidValueTitle` | `src/core/i18n.tsx` | ✅ | tests/save-feedback.test.tsx, src/core/__tests__/i18n.test.ts |
| `UI` | `common.invalidValueDesc` | `src/core/i18n.tsx` | ✅ | tests/save-feedback.test.tsx, src/core/__tests__/i18n.test.ts |
| `UI` | `common.coffeeBeans` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts, src/core/__tests__/stash-screen.test.tsx |
| `UI` | `common.looseLeafTea` | `src/core/i18n.tsx` | ✅ | src/components/caffeine/__tests__/CaffeineQuickAddModal.test.tsx, src/core/__tests__/i18n.test.ts |
| `UI` | `common.missingTitle` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts |
| `UI` | `common.missingMessage` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts |
| `UI` | `common.goBack` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/matrix-a11y.test.tsx |
| `UI` | `common.searchPlaceholder` | `src/core/i18n.tsx` | ✅ | tests/m2-p3-fixes.test.tsx, tests/matrix-a11y.test.tsx |
| `UI` | `common.errorBoundaryTitle` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `UI` | `common.errorBoundaryDesc` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts |
| `UI` | `common.errorBoundaryRetry` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts |
| `UI` | `common.errorBoundaryContact` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts |
| `UI` | `common.shareErrorTitle` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `UI` | `common.shareErrorDesc` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `UI` | `common.openLinkErrorTitle` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `UI` | `common.openLinkErrorDesc` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `tabs.brew` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/audit-fixes.test.tsx |
| `TEKST` | `tabs.beans` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/e2e-contract.test.ts |
| `TEKST` | `tabs.journal` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/interaction-guards.test.ts |
| `TEKST` | `tabs.dialin` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/components/__tests__/AppGuideModal.test.tsx |
| `TEKST` | `tabs.caffeine` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/audit-fixes.test.tsx |
| `TEKST` | `tabs.settings` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/audit-fixes.test.tsx |
| `TEKST` | `brew.recipe` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/data-layer-sqlite.test.ts |
| `TEKST` | `brew.chooseRecipe` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/recipe-select-inline.test.tsx |
| `TEKST` | `brew.customRecipe` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/brew-context.test.tsx |
| `TEKST` | `brew.stashItem` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.chooseStash` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/brew-screen.test.tsx |
| `TEKST` | `brew.noStashItem` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/brew-screen.test.tsx |
| `TEKST` | `brew.noStashDesc` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.remaining` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/components/beans/__tests__/BeanEditModal.test.tsx |
| `TEKST` | `brew.dose` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/audit-fixes.test.tsx |
| `TEKST` | `brew.water` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/audit-fixes.test.tsx |
| `TEKST` | `brew.ratio` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/audit-fixes.test.tsx |
| `TEKST` | `brew.temp` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/audit-fixes.test.tsx |
| `TEKST` | `brew.grind` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/audit-fixes.test.tsx |
| `TEKST` | `brew.timerReady` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.pourRateTarget` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.startBrew` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/gongfu-screen.test.tsx |
| `TEKST` | `brew.pauseBrew` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.resumeBrew` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.resetBrew` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/bpr-components.test.tsx |
| `TEKST` | `brew.tastingNotesCard` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.ratingLabel` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.tasteBalanceLabel` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.flavorWheelLabel` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.tdsInputLabel` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `UI` | `brew.extractionYield` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.notesPlaceholder` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `UI` | `brew.saveSession` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `UI` | `brew.sessionSaved` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `UI` | `brew.selectGrinder` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.grinderModalTitle` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/components/brew/__tests__/GrinderSelectModal.test.tsx |
| `TEKST` | `brew.grinderModalDesc` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.shareRecipe` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.importRecipe` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.qrModalTitle` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/brew-screen.test.tsx |
| `TEKST` | `brew.qrModalDesc` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.qrCopyLink` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/components/brew/__tests__/ShareRecipeModal.test.tsx |
| `TEKST` | `brew.qrShareLink` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/components/brew/__tests__/ShareRecipeModal.test.tsx |
| `TEKST` | `brew.qrCopied` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.qrScannerTitle` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.scanHint` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.procedureAssistantTitle` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/components/brew/__tests__/ProcedureModal.test.tsx |
| `TEKST` | `brew.totalBrewTime` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/components/brew/__tests__/ProcedureModal.test.tsx |
| `UI` | `brew.selectInventoryTitle` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/brew-screen.test.tsx |
| `TEKST` | `brew.unassignedInventory` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/brew-screen.test.tsx |
| `TEKST` | `brew.importModalTitle` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.importModalDesc` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.importInputPlaceholder` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `UI` | `brew.importActionBtn` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.importError` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.importSuccess` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.duplicateRecipe` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/recipe-select-inline.test.tsx |
| `TEKST` | `brew.duplicateSuccess` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `UI` | `brew.editRecipe` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/brew-screen.test.tsx |
| `TEKST` | `brew.pourToWeightOnScale` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/components/brew/__tests__/ProcedureModal.test.tsx |
| `TEKST` | `brew.addTime10` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.subTime10` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.totalTimeLabel` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.totalTimeAccessibility` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/components/brew/__tests__/ProcedureModal.test.tsx |
| `TEKST` | `brew.stepBadge` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.stepAccessibility` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.subTime10Accessibility` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.addTime10Accessibility` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.pourUpTo` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/audit-fixes.test.tsx |
| `TEKST` | `brew.startBrewAccessibility` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/brew-screen.test.tsx |
| `TEKST` | `brew.startBrewHint` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `UI` | `brew.startBrewBtn` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/brew-screen.test.tsx |
| `UI` | `brew.openStepsBtn` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/brew-screen.test.tsx |
| `TEKST` | `brew.openStepsHint` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `UI` | `brew.returnToBrewBtn` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/brew-screen.test.tsx |
| `TEKST` | `brew.returnToBrewRunningHint` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.returnToBrewPausedHint` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.procedureReadyStatus` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.procedureRunningStatus` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.procedurePausedStatus` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.guideStep4Title` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.guideStep4Desc` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.previousStepAccessibility` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.previousStepHint` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `UI` | `brew.previousStepBtn` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.pauseBrewAccessibility` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.pauseBrewHint` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `UI` | `brew.pauseBrewBtn` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `UI` | `brew.nextStepAccessibility` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `UI` | `brew.nextStepHint` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `UI` | `brew.nextStepBtn` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `UI` | `brew.finishBrewAccessibility` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `UI` | `brew.finishBrewHint` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `UI` | `brew.finishBrewBtn` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `UI` | `brew.finishAndSave` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/brew-screen.test.tsx |
| `TEKST` | `brew.recipeSearchPlaceholder` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.recipeSearchHint` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.methodSiphon` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.siphonDesc` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.methodFrenchPress` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.frenchPressDesc` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.methodClever` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.cleverDesc` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.methodKalitaWave` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/database.test.ts |
| `TEKST` | `brew.kalitaWaveDesc` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.methodOrigami` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.origamiDesc` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.methodAeropress` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/components/brew/__tests__/BrewHeader.test.tsx |
| `TEKST` | `brew.aeropressDesc` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.methodIbrik` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.ibrikDesc` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.methodColdBrew` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/deep-d2-domain-audio-grinders.test.tsx |
| `TEKST` | `brew.coldBrewDesc` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.methodBatchBrew` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.methodMoccamaster` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/grinder-converter.test.ts |
| `TEKST` | `brew.methodGina` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.methodTrinityOne` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/grinder-converter.test.ts |
| `TEKST` | `brew.methodWalkuere` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.methodBialetti` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.methodFlair` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.methodColdDrip` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.resetTimerAccessibility` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.resetTimerHint` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.resumeBrewAccessibility` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.resumeBrewHint` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `UI` | `brew.saveSessionAccessibility` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `UI` | `brew.saveSessionHint` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `UI` | `brew.saveSessionBtn` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/close-button-guard.test.tsx |
| `TEKST` | `brew.paramsLoaded` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.recipeLoadedDesc` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.lowBeansTitle` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/brew-screen.test.tsx |
| `TEKST` | `brew.lowBeansDesc` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `UI` | `brew.brewBlendAction` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/brew-screen.test.tsx |
| `TEKST` | `brew.scanSuccessTitle` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.scanSuccessDesc` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.scanErrorTitle` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.scanErrorInvalid` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.scanErrorProcess` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `UI` | `brew.savedSessionTitle` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/save-feedback.test.tsx |
| `UI` | `brew.savedSessionDesc` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `UI` | `brew.finishModalTitle` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/components/brew/__tests__/BrewFinishModal.test.tsx |
| `UI` | `brew.finishTimeWater` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.yourRating` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.starRatingLabel` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.tasteProfileLabel` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.tasteBalanced` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/components/recipe-builder/__tests__/RecipeBasicInfoCard.test.tsx |
| `TEKST` | `brew.tasteSour` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/brew-screen.test.tsx |
| `TEKST` | `brew.tasteBitter` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/brew-screen.test.tsx |
| `TEKST` | `brew.tasteWeak` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/brew-screen.test.tsx |
| `TEKST` | `brew.doctorRecipeTitle` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.doctorSourAdvice` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/units-and-dates.test.tsx |
| `TEKST` | `brew.doctorBitterAdvice` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/units-and-dates.test.tsx |
| `TEKST` | `brew.doctorWeakAdvice` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.doctorBalancedTitle` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.doctorBalancedAdvice` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.flavorWheelTitle` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.waterUsedTitle` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.tdsLabel` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.tdsPlaceholder` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.baristaNotesTitle` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.baristaNotesPlaceholder` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `UI` | `brew.skipBtn` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/components/brew/__tests__/BrewFinishModal.test.tsx |
| `UI` | `brew.saveToJournalBtn` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/brew-screen.test.tsx |
| `TEKST` | `brew.clearSearch` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/matrix-a11y.test.tsx |
| `TEKST` | `brew.noSearchResults` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.favoritesEmpty` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.subsetAll` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/components/beans/__tests__/BeanTopBar.test.tsx |
| `TEKST` | `brew.subsetFavorites` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.subsetCustom` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `UI` | `brew.gongfuModeBtn` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/recipe-select-inline.test.tsx |
| `TEKST` | `brew.gongfuModeHint` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.beverageCoffeeA11y` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.beverageCoffeeLabel` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/components/__tests__/OnboardingModal.test.tsx |
| `TEKST` | `brew.beverageTeaA11y` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.beverageTeaLabel` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/components/__tests__/OnboardingModal.test.tsx |
| `TEKST` | `brew.favoriteRecipeA11y` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.grinderPillA11y` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.grinderPillEyebrow` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.recipePillA11y` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.recipePillEyebrow` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/brew-screen.test.tsx |
| `TEKST` | `brew.stashPillA11y` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/components/brew/__tests__/BrewHeader.test.tsx |
| `TEKST` | `brew.stashPillHint` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.stashPillEyebrow` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/brew-screen.test.tsx |
| `TEKST` | `brew.stashPillEmpty` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.stashPillRemaining` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.stashPillDefaultDose` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.sharePillA11y` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.sharePillEyebrow` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.sharePillValue` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.gongfuModeA11y` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/components/brew/__tests__/BrewHeader.test.tsx |
| `TEKST` | `brew.gongfuModeBanner` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.importSuccessTitle` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.importStepCount` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.qrShareLinkHint` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `brew.qrCopyLinkHint` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `gongfu.modeTitle` | `src/core/i18n.tsx` | ✅ | tests/recipe-select-inline.test.tsx, src/components/brew/__tests__/BrewHeader.test.tsx |
| `TEKST` | `gongfu.modeDesc` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts |
| `TEKST` | `gongfu.infusionNumber` | `src/core/i18n.tsx` | ✅ | src/components/recipe-builder/__tests__/RecipeStepEditor.test.tsx, src/core/__tests__/database.test.ts |
| `TEKST` | `gongfu.rinseTitle` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts |
| `TEKST` | `gongfu.rinseDesc` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts |
| `TEKST` | `gongfu.rinseCompleted` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts |
| `TEKST` | `gongfu.leafDose` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts |
| `TEKST` | `gongfu.vesselCapacity` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts |
| `TEKST` | `gongfu.waterTemp` | `src/core/i18n.tsx` | ✅ | src/components/brew/__tests__/RecipeSelectModal.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `gongfu.steepCountdown` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts |
| `TEKST` | `gongfu.pourNow` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts |
| `TEKST` | `gongfu.startSteep` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/gongfu-screen.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `gongfu.pauseSteep` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/gongfu-screen.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `gongfu.pauseSteepHint` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts |
| `TEKST` | `gongfu.resumeSteep` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/gongfu-screen.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `gongfu.endSteep` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts |
| `TEKST` | `gongfu.endSteepHint` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts |
| `UI` | `gongfu.nextInfusion` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/gongfu-screen.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `gongfu.addSeconds` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts |
| `TEKST` | `gongfu.subSeconds` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts |
| `TEKST` | `gongfu.infusionNotes` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts |
| `TEKST` | `gongfu.infusionNotesPlaceholder` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts |
| `TEKST` | `gongfu.sessionHistory` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/gongfu-screen.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `gongfu.totalCaffeine` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/gongfu-screen.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `gongfu.infusionCaffeine` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts |
| `UI` | `gongfu.finishSession` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts |
| `TEKST` | `gongfu.steepingInProgress` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts |
| `TEKST` | `gongfu.targetSeconds` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/touch-and-type-scale.test.tsx |
| `TEKST` | `gongfu.steepingBanner` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/gongfu-screen.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `gongfu.minOneInfusionMsg` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/gongfu-screen.test.tsx, src/core/__tests__/i18n.test.ts |
| `UI` | `gongfu.finishSessionMsg` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts |
| `TEKST` | `gongfu.sessionNotes` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts |
| `TEKST` | `gongfu.infusionCountTag` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts |
| `TEKST` | `recipeBuilder.titleNew` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts, src/core/__tests__/recipe-builder.test.tsx |
| `UI` | `recipeBuilder.titleEdit` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts, src/core/__tests__/recipe-builder.test.tsx |
| `TEKST` | `recipeBuilder.nameLabel` | `src/core/i18n.tsx` | ✅ | src/components/recipe-builder/__tests__/RecipeBasicInfoCard.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `recipeBuilder.namePlaceholder` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts, src/core/__tests__/recipe-builder.test.tsx |
| `TEKST` | `recipeBuilder.typeLabel` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts |
| `TEKST` | `recipeBuilder.coffee` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/audit-fixes.test.tsx |
| `TEKST` | `recipeBuilder.tea` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/data-layer-sqlite.test.ts |
| `TEKST` | `recipeBuilder.methodLabel` | `src/core/i18n.tsx` | ✅ | src/components/recipe-builder/__tests__/RecipeBasicInfoCard.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `recipeBuilder.methodPlaceholder` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts |
| `TEKST` | `recipeBuilder.authorLabel` | `src/core/i18n.tsx` | ✅ | src/components/recipe-builder/__tests__/RecipeBasicInfoCard.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `recipeBuilder.authorPlaceholder` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts |
| `TEKST` | `recipeBuilder.descriptionLabel` | `src/core/i18n.tsx` | ✅ | src/components/recipe-builder/__tests__/RecipeBasicInfoCard.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `recipeBuilder.descriptionPlaceholder` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts |
| `TEKST` | `recipeBuilder.doseLabel` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts |
| `TEKST` | `recipeBuilder.doseLabelImperial` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts |
| `TEKST` | `recipeBuilder.waterLabel` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts |
| `TEKST` | `recipeBuilder.waterLabelImperial` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts |
| `TEKST` | `recipeBuilder.tempLabel` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts |
| `TEKST` | `recipeBuilder.tempLabelImperial` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts |
| `TEKST` | `recipeBuilder.grindLabel` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts |
| `TEKST` | `recipeBuilder.grindPlaceholder` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts |
| `TEKST` | `recipeBuilder.stepsTitle` | `src/core/i18n.tsx` | ✅ | src/components/recipe-builder/__tests__/RecipeStepEditor.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `recipeBuilder.addStep` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts, src/core/__tests__/recipe-builder.test.tsx |

*(... i 662 kolejnych elementów w pełnym wykazie)*

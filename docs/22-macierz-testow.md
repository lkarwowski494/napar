# Macierz Testów (AST Coverage Matrix) — NAPAR (STEEPWISE)

Wygenerowano automatycznie przez `scripts/test-matrix.mjs` zgodnie z wymaganiami **BR-TEST-028..031**.
Zasada dowodu: wyłącznie wykonywalny kod testu (wycięte komentarze, importy i opisy `test`/`describe`).

## Podsumowanie Pokrycia

| Kategoria | Łącznie | Pokryte | Pokrycie % | Status |
| :--- | :---: | :---: | :---: | :---: |
| **EKRAN** | 8 | 8 | **100.0%** | ✅ POKRYTE |
| **UI** | 61 | 61 | **100.0%** | ✅ POKRYTE |
| **TEKST** | 324 | 324 | **100.0%** | ✅ POKRYTE |
| **LOGIKA** | 176 | 176 | **100.0%** | ✅ POKRYTE |
| **WYMIAR** | 35 | 35 | **100.0%** | ✅ POKRYTE |

Łącznie elementów: **604** | Pokrytych: **604** | Brakujących: **0**

## Szczegółowa Lista Elementów

| Kategoria | Nazwa elementu | Plik źródłowy | Status | Pliki testowe |
| :--- | :--- | :--- | :---: | :--- |
| `EKRAN` | `/(tabs)/beans` | `app/(tabs)/beans.tsx` | ✅ | tests/interaction-guards.test.ts, tests/state-sequences.test.ts |
| `EKRAN` | `/(tabs)/caffeine` | `app/(tabs)/caffeine.tsx` | ✅ | tests/oracle-coffee.test.ts, src/components/icons/__tests__/CraftIcons.test.tsx |
| `EKRAN` | `/(tabs)/dialin` | `app/(tabs)/dialin.tsx` | ✅ | src/core/__tests__/i18n.test.ts, src/core/__tests__/tabs-layout.test.tsx |
| `EKRAN` | `/(tabs)/index` | `app/(tabs)/index.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/public-repo.test.ts |
| `EKRAN` | `/(tabs)/journal` | `app/(tabs)/journal.tsx` | ✅ | tests/interaction-guards.test.ts, src/components/icons/__tests__/CraftIcons.test.tsx |
| `EKRAN` | `/gongfu` | `app/gongfu.tsx` | ✅ | tests/audit-fixes.test.tsx, src/components/brew/__tests__/BrewHeader.test.tsx |
| `EKRAN` | `/recipe-builder` | `app/recipe-builder.tsx` | ✅ | src/core/__tests__/brew-screen.test.tsx, src/core/__tests__/modal-safety-and-beverage-toggle.test.tsx |
| `EKRAN` | `/settings` | `app/settings.tsx` | ✅ | src/components/icons/__tests__/CraftIcons.test.tsx, src/components/__tests__/Apps4BrewPassModal.test.tsx |
| `TEKST` | `appName` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/brands.contract.test.ts |
| `TEKST` | `appTagline` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/brands.contract.test.ts |
| `UI` | `common.cancel` | `src/core/i18n.tsx` | ✅ | tests/close-button-guard.test.tsx, src/core/__tests__/confirm-announce.test.ts |
| `UI` | `common.save` | `src/core/i18n.tsx` | ✅ | src/components/beans/__tests__/BeanEditModal.test.tsx, src/components/brew/__tests__/BrewFinishModal.test.tsx |
| `UI` | `common.delete` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/interaction-guards.test.ts |
| `UI` | `common.edit` | `src/core/i18n.tsx` | ✅ | tests/state-sequences.test.ts, src/components/beans/__tests__/BeanEditModal.test.tsx |
| `UI` | `common.close` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/close-button-guard.test.tsx |
| `UI` | `common.confirm` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/interaction-guards.test.ts |
| `UI` | `common.back` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/maestro-runner.ts |
| `UI` | `common.next` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/components/brew/__tests__/BrewActiveFocusTimer.test.tsx |
| `UI` | `common.finish` | `src/core/i18n.tsx` | ✅ | src/components/beans/__tests__/BeanEditModal.test.tsx, src/components/brew/__tests__/BrewActiveFocusTimer.test.tsx |
| `UI` | `common.ok` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/matrix-dimensions.test.tsx |
| `UI` | `common.timerStepWarning` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/domain-coverage-edge-cases.test.tsx, src/core/__tests__/i18n.test.ts |
| `UI` | `common.stepFinished` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/domain-coverage-edge-cases.test.tsx, src/core/__tests__/i18n.test.ts |
| `UI` | `common.brewingFinished` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/domain-coverage-edge-cases.test.tsx, src/core/__tests__/i18n.test.ts |
| `UI` | `common.grams` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/domain-coverage-edge-cases.test.tsx, src/core/__tests__/i18n.test.ts |
| `UI` | `common.seconds` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/brew-context.test.tsx, src/core/__tests__/brew-screen.test.tsx |
| `UI` | `common.celsius` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/domain-coverage-edge-cases.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `tabs.brew` | `src/core/i18n.tsx` | ✅ | src/components/brew/__tests__/BrewActiveFocusTimer.test.tsx, src/components/brew/__tests__/BrewFinishModal.test.tsx |
| `TEKST` | `tabs.beans` | `src/core/i18n.tsx` | ✅ | tests/interaction-guards.test.ts, tests/state-sequences.test.ts |
| `TEKST` | `tabs.journal` | `src/core/i18n.tsx` | ✅ | tests/interaction-guards.test.ts, src/components/icons/__tests__/CraftIcons.test.tsx |
| `TEKST` | `tabs.dialin` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts, src/core/__tests__/stash-screen.test.tsx |
| `TEKST` | `tabs.caffeine` | `src/core/i18n.tsx` | ✅ | tests/oracle-coffee.test.ts, src/components/icons/__tests__/CraftIcons.test.tsx |
| `TEKST` | `tabs.settings` | `src/core/i18n.tsx` | ✅ | src/components/icons/__tests__/CraftIcons.test.tsx, src/components/__tests__/Apps4BrewPassModal.test.tsx |
| `TEKST` | `brew.recipe` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/matrix-coverage-gap.test.tsx |
| `TEKST` | `brew.chooseRecipe` | `src/core/i18n.tsx` | ✅ | src/components/brew/__tests__/BrewActiveFocusTimer.test.tsx, src/components/brew/__tests__/BrewFinishModal.test.tsx |
| `TEKST` | `brew.customRecipe` | `src/core/i18n.tsx` | ✅ | src/components/brew/__tests__/BrewActiveFocusTimer.test.tsx, src/components/brew/__tests__/BrewFinishModal.test.tsx |
| `TEKST` | `brew.stashItem` | `src/core/i18n.tsx` | ✅ | src/components/brew/__tests__/BrewActiveFocusTimer.test.tsx, src/components/brew/__tests__/BrewFinishModal.test.tsx |
| `TEKST` | `brew.chooseStash` | `src/core/i18n.tsx` | ✅ | src/components/brew/__tests__/BrewActiveFocusTimer.test.tsx, src/components/brew/__tests__/BrewFinishModal.test.tsx |
| `TEKST` | `brew.noStashItem` | `src/core/i18n.tsx` | ✅ | src/components/brew/__tests__/BrewActiveFocusTimer.test.tsx, src/components/brew/__tests__/BrewFinishModal.test.tsx |
| `TEKST` | `brew.noStashDesc` | `src/core/i18n.tsx` | ✅ | src/components/brew/__tests__/BrewActiveFocusTimer.test.tsx, src/components/brew/__tests__/BrewFinishModal.test.tsx |
| `TEKST` | `brew.remaining` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/components/beans/__tests__/BeanEditModal.test.tsx |
| `TEKST` | `brew.dose` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/domain-properties.test.ts |
| `TEKST` | `brew.water` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/domain-properties.test.ts |
| `TEKST` | `brew.ratio` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/domain-properties.test.ts |
| `TEKST` | `brew.temp` | `src/core/i18n.tsx` | ✅ | tests/state-sequences.test.ts, src/components/brew/__tests__/BrewActiveFocusTimer.test.tsx |
| `TEKST` | `brew.grind` | `src/core/i18n.tsx` | ✅ | tests/state-sequences.test.ts, src/components/brew/__tests__/BrewActiveFocusTimer.test.tsx |
| `TEKST` | `brew.timerReady` | `src/core/i18n.tsx` | ✅ | src/components/brew/__tests__/BrewActiveFocusTimer.test.tsx, src/components/brew/__tests__/BrewFinishModal.test.tsx |
| `TEKST` | `brew.pourRateTarget` | `src/core/i18n.tsx` | ✅ | src/components/brew/__tests__/BrewActiveFocusTimer.test.tsx, src/components/brew/__tests__/BrewFinishModal.test.tsx |
| `TEKST` | `brew.startBrew` | `src/core/i18n.tsx` | ✅ | src/components/brew/__tests__/BrewActiveFocusTimer.test.tsx, src/components/brew/__tests__/BrewFinishModal.test.tsx |
| `TEKST` | `brew.pauseBrew` | `src/core/i18n.tsx` | ✅ | src/components/brew/__tests__/BrewActiveFocusTimer.test.tsx, src/components/brew/__tests__/BrewFinishModal.test.tsx |
| `TEKST` | `brew.resumeBrew` | `src/core/i18n.tsx` | ✅ | src/components/brew/__tests__/BrewActiveFocusTimer.test.tsx, src/components/brew/__tests__/BrewFinishModal.test.tsx |
| `TEKST` | `brew.resetBrew` | `src/core/i18n.tsx` | ✅ | src/components/brew/__tests__/BrewActiveFocusTimer.test.tsx, src/components/brew/__tests__/BrewFinishModal.test.tsx |
| `TEKST` | `brew.tastingNotesCard` | `src/core/i18n.tsx` | ✅ | src/components/brew/__tests__/BrewActiveFocusTimer.test.tsx, src/components/brew/__tests__/BrewFinishModal.test.tsx |
| `TEKST` | `brew.ratingLabel` | `src/core/i18n.tsx` | ✅ | src/components/brew/__tests__/BrewActiveFocusTimer.test.tsx, src/components/brew/__tests__/BrewFinishModal.test.tsx |
| `TEKST` | `brew.tasteBalanceLabel` | `src/core/i18n.tsx` | ✅ | src/components/brew/__tests__/BrewActiveFocusTimer.test.tsx, src/components/brew/__tests__/BrewFinishModal.test.tsx |
| `TEKST` | `brew.flavorWheelLabel` | `src/core/i18n.tsx` | ✅ | src/components/brew/__tests__/BrewActiveFocusTimer.test.tsx, src/components/brew/__tests__/BrewFinishModal.test.tsx |
| `TEKST` | `brew.tdsInputLabel` | `src/core/i18n.tsx` | ✅ | src/components/brew/__tests__/BrewActiveFocusTimer.test.tsx, src/components/brew/__tests__/BrewFinishModal.test.tsx |
| `UI` | `brew.extractionYield` | `src/core/i18n.tsx` | ✅ | tests/domain-properties.test.ts, tests/oracle-coffee.test.ts |
| `TEKST` | `brew.notesPlaceholder` | `src/core/i18n.tsx` | ✅ | src/components/brew/__tests__/BrewActiveFocusTimer.test.tsx, src/components/brew/__tests__/BrewFinishModal.test.tsx |
| `UI` | `brew.saveSession` | `src/core/i18n.tsx` | ✅ | src/components/brew/__tests__/BrewActiveFocusTimer.test.tsx, src/components/brew/__tests__/BrewFinishModal.test.tsx |
| `UI` | `brew.sessionSaved` | `src/core/i18n.tsx` | ✅ | src/components/brew/__tests__/BrewActiveFocusTimer.test.tsx, src/components/brew/__tests__/BrewFinishModal.test.tsx |
| `UI` | `brew.selectGrinder` | `src/core/i18n.tsx` | ✅ | src/components/brew/__tests__/BrewActiveFocusTimer.test.tsx, src/components/brew/__tests__/BrewFinishModal.test.tsx |
| `TEKST` | `brew.grinderModalTitle` | `src/core/i18n.tsx` | ✅ | src/components/brew/__tests__/BrewActiveFocusTimer.test.tsx, src/components/brew/__tests__/BrewFinishModal.test.tsx |
| `TEKST` | `brew.grinderModalDesc` | `src/core/i18n.tsx` | ✅ | src/components/brew/__tests__/BrewActiveFocusTimer.test.tsx, src/components/brew/__tests__/BrewFinishModal.test.tsx |
| `TEKST` | `brew.shareRecipe` | `src/core/i18n.tsx` | ✅ | src/components/brew/__tests__/BrewActiveFocusTimer.test.tsx, src/components/brew/__tests__/BrewFinishModal.test.tsx |
| `TEKST` | `brew.importRecipe` | `src/core/i18n.tsx` | ✅ | src/components/brew/__tests__/BrewActiveFocusTimer.test.tsx, src/components/brew/__tests__/BrewFinishModal.test.tsx |
| `TEKST` | `brew.qrModalTitle` | `src/core/i18n.tsx` | ✅ | src/components/brew/__tests__/BrewActiveFocusTimer.test.tsx, src/components/brew/__tests__/BrewFinishModal.test.tsx |
| `TEKST` | `brew.qrModalDesc` | `src/core/i18n.tsx` | ✅ | src/components/brew/__tests__/BrewActiveFocusTimer.test.tsx, src/components/brew/__tests__/BrewFinishModal.test.tsx |
| `TEKST` | `brew.qrCopyLink` | `src/core/i18n.tsx` | ✅ | src/components/brew/__tests__/BrewActiveFocusTimer.test.tsx, src/components/brew/__tests__/BrewFinishModal.test.tsx |
| `TEKST` | `brew.qrShareLink` | `src/core/i18n.tsx` | ✅ | src/components/brew/__tests__/BrewActiveFocusTimer.test.tsx, src/components/brew/__tests__/BrewFinishModal.test.tsx |
| `TEKST` | `brew.qrCopied` | `src/core/i18n.tsx` | ✅ | src/components/brew/__tests__/BrewActiveFocusTimer.test.tsx, src/components/brew/__tests__/BrewFinishModal.test.tsx |
| `TEKST` | `brew.importModalTitle` | `src/core/i18n.tsx` | ✅ | src/components/brew/__tests__/BrewActiveFocusTimer.test.tsx, src/components/brew/__tests__/BrewFinishModal.test.tsx |
| `TEKST` | `brew.importModalDesc` | `src/core/i18n.tsx` | ✅ | src/components/brew/__tests__/BrewActiveFocusTimer.test.tsx, src/components/brew/__tests__/BrewFinishModal.test.tsx |
| `TEKST` | `brew.importInputPlaceholder` | `src/core/i18n.tsx` | ✅ | src/components/brew/__tests__/BrewActiveFocusTimer.test.tsx, src/components/brew/__tests__/BrewFinishModal.test.tsx |
| `UI` | `brew.importActionBtn` | `src/core/i18n.tsx` | ✅ | src/components/brew/__tests__/BrewActiveFocusTimer.test.tsx, src/components/brew/__tests__/BrewFinishModal.test.tsx |
| `TEKST` | `brew.importError` | `src/core/i18n.tsx` | ✅ | src/components/brew/__tests__/BrewActiveFocusTimer.test.tsx, src/components/brew/__tests__/BrewFinishModal.test.tsx |
| `TEKST` | `brew.importSuccess` | `src/core/i18n.tsx` | ✅ | src/components/brew/__tests__/BrewActiveFocusTimer.test.tsx, src/components/brew/__tests__/BrewFinishModal.test.tsx |
| `TEKST` | `brew.duplicateRecipe` | `src/core/i18n.tsx` | ✅ | src/components/brew/__tests__/BrewActiveFocusTimer.test.tsx, src/components/brew/__tests__/BrewFinishModal.test.tsx |
| `TEKST` | `brew.duplicateSuccess` | `src/core/i18n.tsx` | ✅ | src/components/brew/__tests__/BrewActiveFocusTimer.test.tsx, src/components/brew/__tests__/BrewFinishModal.test.tsx |
| `TEKST` | `brew.addTime10` | `src/core/i18n.tsx` | ✅ | src/components/brew/__tests__/BrewActiveFocusTimer.test.tsx, src/components/brew/__tests__/BrewFinishModal.test.tsx |
| `TEKST` | `brew.subTime10` | `src/core/i18n.tsx` | ✅ | src/components/brew/__tests__/BrewActiveFocusTimer.test.tsx, src/components/brew/__tests__/BrewFinishModal.test.tsx |
| `TEKST` | `gongfu.modeTitle` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/components/brew/__tests__/BrewHeader.test.tsx |
| `TEKST` | `gongfu.modeDesc` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/components/brew/__tests__/BrewHeader.test.tsx |
| `TEKST` | `gongfu.infusionNumber` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/components/brew/__tests__/BrewHeader.test.tsx |
| `TEKST` | `gongfu.rinseTitle` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/components/brew/__tests__/BrewHeader.test.tsx |
| `TEKST` | `gongfu.rinseDesc` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/components/brew/__tests__/BrewHeader.test.tsx |
| `TEKST` | `gongfu.rinseCompleted` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/components/brew/__tests__/BrewHeader.test.tsx |
| `TEKST` | `gongfu.leafDose` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/components/brew/__tests__/BrewHeader.test.tsx |
| `TEKST` | `gongfu.vesselCapacity` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/components/brew/__tests__/BrewHeader.test.tsx |
| `TEKST` | `gongfu.waterTemp` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/components/brew/__tests__/BrewHeader.test.tsx |
| `TEKST` | `gongfu.steepCountdown` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/components/brew/__tests__/BrewHeader.test.tsx |
| `TEKST` | `gongfu.pourNow` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/components/brew/__tests__/BrewHeader.test.tsx |
| `TEKST` | `gongfu.startSteep` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/components/brew/__tests__/BrewHeader.test.tsx |
| `UI` | `gongfu.nextInfusion` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/components/brew/__tests__/BrewHeader.test.tsx |
| `TEKST` | `gongfu.addSeconds` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/components/brew/__tests__/BrewHeader.test.tsx |
| `TEKST` | `gongfu.subSeconds` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/components/brew/__tests__/BrewHeader.test.tsx |
| `TEKST` | `gongfu.infusionNotes` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/components/brew/__tests__/BrewHeader.test.tsx |
| `TEKST` | `gongfu.infusionNotesPlaceholder` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/components/brew/__tests__/BrewHeader.test.tsx |
| `TEKST` | `gongfu.sessionHistory` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/components/brew/__tests__/BrewHeader.test.tsx |
| `TEKST` | `gongfu.totalCaffeine` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/components/brew/__tests__/BrewHeader.test.tsx |
| `TEKST` | `gongfu.infusionCaffeine` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/components/brew/__tests__/BrewHeader.test.tsx |
| `UI` | `gongfu.finishSession` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/components/brew/__tests__/BrewHeader.test.tsx |
| `TEKST` | `recipeBuilder.titleNew` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts |
| `UI` | `recipeBuilder.titleEdit` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts |
| `TEKST` | `recipeBuilder.nameLabel` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts |
| `TEKST` | `recipeBuilder.namePlaceholder` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts |
| `TEKST` | `recipeBuilder.typeLabel` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts |
| `TEKST` | `recipeBuilder.coffee` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/matrix-coverage-gap.test.tsx |
| `TEKST` | `recipeBuilder.tea` | `src/core/i18n.tsx` | ✅ | tests/matrix-coverage-gap.test.tsx, src/components/brew/__tests__/BrewHeader.test.tsx |
| `TEKST` | `recipeBuilder.methodLabel` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts |
| `TEKST` | `recipeBuilder.methodPlaceholder` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts |
| `TEKST` | `recipeBuilder.authorLabel` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts |
| `TEKST` | `recipeBuilder.authorPlaceholder` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts |
| `TEKST` | `recipeBuilder.descriptionLabel` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts |
| `TEKST` | `recipeBuilder.descriptionPlaceholder` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts |
| `TEKST` | `recipeBuilder.doseLabel` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts |
| `TEKST` | `recipeBuilder.waterLabel` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts |
| `TEKST` | `recipeBuilder.tempLabel` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts |
| `TEKST` | `recipeBuilder.grindLabel` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts |
| `TEKST` | `recipeBuilder.grindPlaceholder` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts |
| `TEKST` | `recipeBuilder.stepsTitle` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts |
| `TEKST` | `recipeBuilder.addStep` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts, src/core/__tests__/recipe-builder.test.tsx |
| `TEKST` | `recipeBuilder.removeStep` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts |
| `TEKST` | `recipeBuilder.stepTimeSec` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts |
| `TEKST` | `recipeBuilder.stepDurationSec` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/domain-coverage-edge-cases.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `recipeBuilder.stepWaterGrams` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts |
| `TEKST` | `recipeBuilder.stepInstruction` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts |
| `TEKST` | `recipeBuilder.stepInstructionPlaceholder` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts |
| `UI` | `recipeBuilder.saveRecipeBtn` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts |
| `UI` | `recipeBuilder.deleteRecipeConfirmTitle` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts |
| `UI` | `recipeBuilder.deleteRecipeConfirmMsg` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts |
| `TEKST` | `recipeBuilder.fillRequired` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts |
| `UI` | `recipeBuilder.duplicateBtn` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/brew-screen.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `stash.title` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/interaction-guards.test.ts |
| `TEKST` | `stash.addNew` | `src/core/i18n.tsx` | ✅ | src/components/brew/__tests__/BrewHeader.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `stash.freshness` | `src/core/i18n.tsx` | ✅ | src/components/brew/__tests__/BrewHeader.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `stash.restingWindow` | `src/core/i18n.tsx` | ✅ | src/components/brew/__tests__/BrewHeader.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `stash.peakWindow` | `src/core/i18n.tsx` | ✅ | src/components/brew/__tests__/BrewHeader.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `stash.pastPeak` | `src/core/i18n.tsx` | ✅ | src/components/brew/__tests__/BrewHeader.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `stash.tooFresh` | `src/core/i18n.tsx` | ✅ | src/components/brew/__tests__/BrewHeader.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `stash.readyToBrew` | `src/core/i18n.tsx` | ✅ | src/components/brew/__tests__/BrewHeader.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `stash.remainingGrams` | `src/core/i18n.tsx` | ✅ | src/components/brew/__tests__/BrewHeader.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `stash.initialGrams` | `src/core/i18n.tsx` | ✅ | src/components/brew/__tests__/BrewHeader.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `stash.roaster` | `src/core/i18n.tsx` | ✅ | tests/state-sequences.test.ts, src/components/beans/__tests__/BeanEditModal.test.tsx |
| `TEKST` | `stash.origin` | `src/core/i18n.tsx` | ✅ | tests/domain-properties.test.ts, tests/matrix-dimensions.test.tsx |
| `TEKST` | `stash.variety` | `src/core/i18n.tsx` | ✅ | src/components/beans/__tests__/BeanEditModal.test.tsx, src/components/brew/__tests__/BrewHeader.test.tsx |
| `TEKST` | `stash.process` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/domain-properties.test.ts |
| `TEKST` | `stash.roastDate` | `src/core/i18n.tsx` | ✅ | tests/state-sequences.test.ts, src/components/brew/__tests__/BrewHeader.test.tsx |
| `TEKST` | `stash.compendium` | `src/core/i18n.tsx` | ✅ | src/components/brew/__tests__/BrewHeader.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `stash.compendiumSubtitle` | `src/core/i18n.tsx` | ✅ | src/components/brew/__tests__/BrewHeader.test.tsx, src/core/__tests__/i18n.test.ts |
| `UI` | `stash.edit` | `src/core/i18n.tsx` | ✅ | tests/state-sequences.test.ts, src/components/beans/__tests__/BeanEditModal.test.tsx |
| `UI` | `stash.editTitle` | `src/core/i18n.tsx` | ✅ | src/components/brew/__tests__/BrewHeader.test.tsx, src/core/__tests__/i18n.test.ts |
| `UI` | `stash.saveChanges` | `src/core/i18n.tsx` | ✅ | src/components/brew/__tests__/BrewHeader.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `stash.archivePrompt` | `src/core/i18n.tsx` | ✅ | src/components/brew/__tests__/BrewHeader.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `stash.archiveNow` | `src/core/i18n.tsx` | ✅ | src/components/brew/__tests__/BrewHeader.test.tsx, src/core/__tests__/i18n.test.ts |
| `UI` | `stash.markFinished` | `src/core/i18n.tsx` | ✅ | src/components/brew/__tests__/BrewHeader.test.tsx, src/core/__tests__/i18n.test.ts |
| `UI` | `stash.deletePack` | `src/core/i18n.tsx` | ✅ | src/components/brew/__tests__/BrewHeader.test.tsx, src/core/__tests__/i18n.test.ts |
| `UI` | `stash.deletePackConfirmTitle` | `src/core/i18n.tsx` | ✅ | src/components/brew/__tests__/BrewHeader.test.tsx, src/core/__tests__/i18n.test.ts |
| `UI` | `stash.deletePackConfirmMsg` | `src/core/i18n.tsx` | ✅ | src/components/brew/__tests__/BrewHeader.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `stash.weightAdjust` | `src/core/i18n.tsx` | ✅ | src/components/brew/__tests__/BrewHeader.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `journal.title` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/interaction-guards.test.ts |
| `TEKST` | `journal.emptyTitle` | `src/core/i18n.tsx` | ✅ | tests/interaction-guards.test.ts, src/components/icons/__tests__/CraftIcons.test.tsx |
| `TEKST` | `journal.emptySub` | `src/core/i18n.tsx` | ✅ | tests/interaction-guards.test.ts, src/components/icons/__tests__/CraftIcons.test.tsx |
| `TEKST` | `journal.avgRating` | `src/core/i18n.tsx` | ✅ | tests/interaction-guards.test.ts, src/components/icons/__tests__/CraftIcons.test.tsx |
| `TEKST` | `journal.totalBrews` | `src/core/i18n.tsx` | ✅ | tests/interaction-guards.test.ts, src/components/icons/__tests__/CraftIcons.test.tsx |
| `TEKST` | `journal.tdsStat` | `src/core/i18n.tsx` | ✅ | tests/interaction-guards.test.ts, src/components/icons/__tests__/CraftIcons.test.tsx |
| `TEKST` | `journal.eyStat` | `src/core/i18n.tsx` | ✅ | tests/interaction-guards.test.ts, src/components/icons/__tests__/CraftIcons.test.tsx |
| `TEKST` | `journal.searchPlaceholder` | `src/core/i18n.tsx` | ✅ | tests/interaction-guards.test.ts, src/components/icons/__tests__/CraftIcons.test.tsx |
| `UI` | `journal.filterAll` | `src/core/i18n.tsx` | ✅ | tests/interaction-guards.test.ts, src/components/icons/__tests__/CraftIcons.test.tsx |
| `UI` | `journal.filterCoffee` | `src/core/i18n.tsx` | ✅ | tests/interaction-guards.test.ts, src/components/icons/__tests__/CraftIcons.test.tsx |
| `UI` | `journal.filterTea` | `src/core/i18n.tsx` | ✅ | tests/interaction-guards.test.ts, src/components/icons/__tests__/CraftIcons.test.tsx |
| `UI` | `journal.filterHighRated` | `src/core/i18n.tsx` | ✅ | tests/interaction-guards.test.ts, src/components/icons/__tests__/CraftIcons.test.tsx |
| `TEKST` | `journal.noResults` | `src/core/i18n.tsx` | ✅ | tests/interaction-guards.test.ts, src/components/icons/__tests__/CraftIcons.test.tsx |
| `UI` | `journal.sessionsTab` | `src/core/i18n.tsx` | ✅ | tests/interaction-guards.test.ts, src/components/icons/__tests__/CraftIcons.test.tsx |
| `UI` | `journal.analyticsTab` | `src/core/i18n.tsx` | ✅ | tests/interaction-guards.test.ts, src/components/icons/__tests__/CraftIcons.test.tsx |
| `TEKST` | `journal.statTotalDose` | `src/core/i18n.tsx` | ✅ | tests/interaction-guards.test.ts, src/components/icons/__tests__/CraftIcons.test.tsx |
| `TEKST` | `journal.statTotalWater` | `src/core/i18n.tsx` | ✅ | tests/interaction-guards.test.ts, src/components/icons/__tests__/CraftIcons.test.tsx |
| `TEKST` | `journal.statTotalCaffeine` | `src/core/i18n.tsx` | ✅ | tests/interaction-guards.test.ts, src/components/icons/__tests__/CraftIcons.test.tsx |
| `TEKST` | `journal.statAvgRating` | `src/core/i18n.tsx` | ✅ | tests/interaction-guards.test.ts, src/components/icons/__tests__/CraftIcons.test.tsx |
| `TEKST` | `journal.methodDistributionTitle` | `src/core/i18n.tsx` | ✅ | tests/interaction-guards.test.ts, src/components/icons/__tests__/CraftIcons.test.tsx |
| `TEKST` | `journal.sensoryAverageTitle` | `src/core/i18n.tsx` | ✅ | tests/interaction-guards.test.ts, src/components/icons/__tests__/CraftIcons.test.tsx |
| `TEKST` | `journal.sensoryAverageDesc` | `src/core/i18n.tsx` | ✅ | tests/interaction-guards.test.ts, src/components/icons/__tests__/CraftIcons.test.tsx |
| `TEKST` | `journal.balanceDistributionTitle` | `src/core/i18n.tsx` | ✅ | tests/interaction-guards.test.ts, src/components/icons/__tests__/CraftIcons.test.tsx |
| `TEKST` | `journal.topFlavorsTitle` | `src/core/i18n.tsx` | ✅ | tests/interaction-guards.test.ts, src/components/icons/__tests__/CraftIcons.test.tsx |
| `TEKST` | `journal.brewAgain` | `src/core/i18n.tsx` | ✅ | tests/interaction-guards.test.ts, src/components/icons/__tests__/CraftIcons.test.tsx |
| `TEKST` | `journal.shareSession` | `src/core/i18n.tsx` | ✅ | tests/interaction-guards.test.ts, src/components/icons/__tests__/CraftIcons.test.tsx |
| `TEKST` | `journal.sessionLoadedTitle` | `src/core/i18n.tsx` | ✅ | tests/interaction-guards.test.ts, src/components/icons/__tests__/CraftIcons.test.tsx |
| `TEKST` | `journal.sessionLoadedMsg` | `src/core/i18n.tsx` | ✅ | tests/interaction-guards.test.ts, src/components/icons/__tests__/CraftIcons.test.tsx |
| `TEKST` | `dialin.title` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/interaction-guards.test.ts |
| `TEKST` | `dialin.subtitle` | `src/core/i18n.tsx` | ✅ | src/components/craft/__tests__/CraftComponents.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `dialin.diagnosisTitle` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts, src/core/__tests__/tabs-layout.test.tsx |
| `TEKST` | `dialin.sourTitle` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts, src/core/__tests__/tabs-layout.test.tsx |
| `TEKST` | `dialin.sourDesc` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts, src/core/__tests__/tabs-layout.test.tsx |
| `TEKST` | `dialin.sourRemedy` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts, src/core/__tests__/tabs-layout.test.tsx |
| `TEKST` | `dialin.bitterTitle` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts, src/core/__tests__/tabs-layout.test.tsx |
| `TEKST` | `dialin.bitterDesc` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts, src/core/__tests__/tabs-layout.test.tsx |
| `TEKST` | `dialin.bitterRemedy` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts, src/core/__tests__/tabs-layout.test.tsx |
| `TEKST` | `dialin.balancedTitle` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts, src/core/__tests__/tabs-layout.test.tsx |
| `TEKST` | `dialin.balancedDesc` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts, src/core/__tests__/tabs-layout.test.tsx |
| `TEKST` | `dialin.ratioTitle` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts, src/core/__tests__/tabs-layout.test.tsx |
| `TEKST` | `dialin.ratioSubtitle` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts, src/core/__tests__/tabs-layout.test.tsx |
| `TEKST` | `dialin.directionDoseToWater` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts, src/core/__tests__/tabs-layout.test.tsx |
| `TEKST` | `dialin.directionWaterToDose` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts, src/core/__tests__/tabs-layout.test.tsx |
| `TEKST` | `dialin.doseInputLabel` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts, src/core/__tests__/tabs-layout.test.tsx |
| `TEKST` | `dialin.waterInputLabel` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts, src/core/__tests__/tabs-layout.test.tsx |
| `UI` | `dialin.ratioSelectLabel` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts, src/core/__tests__/tabs-layout.test.tsx |
| `TEKST` | `dialin.calculatedWater` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts, src/core/__tests__/tabs-layout.test.tsx |
| `TEKST` | `dialin.calculatedDose` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts, src/core/__tests__/tabs-layout.test.tsx |
| `TEKST` | `dialin.calculatedYield` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts, src/core/__tests__/tabs-layout.test.tsx |
| `TEKST` | `dialin.absorptionNote` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts, src/core/__tests__/tabs-layout.test.tsx |
| `UI` | `dialin.costTabTitle` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts, src/core/__tests__/tabs-layout.test.tsx |
| `TEKST` | `dialin.costTitle` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts, src/core/__tests__/tabs-layout.test.tsx |
| `TEKST` | `dialin.costSubtitle` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts, src/core/__tests__/tabs-layout.test.tsx |
| `TEKST` | `dialin.costBeanPriceLabel` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts, src/core/__tests__/tabs-layout.test.tsx |
| `TEKST` | `dialin.costDoseLabel` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts, src/core/__tests__/tabs-layout.test.tsx |
| `TEKST` | `dialin.costWaterVolLabel` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts, src/core/__tests__/tabs-layout.test.tsx |
| `UI` | `dialin.costFilterLabel` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts, src/core/__tests__/tabs-layout.test.tsx |
| `TEKST` | `dialin.costKettleLabel` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts, src/core/__tests__/tabs-layout.test.tsx |
| `TEKST` | `dialin.costCafePriceLabel` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts, src/core/__tests__/tabs-layout.test.tsx |
| `TEKST` | `dialin.costBreakdownTitle` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts, src/core/__tests__/tabs-layout.test.tsx |
| `TEKST` | `dialin.costCoffeeBeans` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts, src/core/__tests__/tabs-layout.test.tsx |
| `TEKST` | `dialin.costWaterSalts` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts, src/core/__tests__/tabs-layout.test.tsx |
| `TEKST` | `dialin.costElectricity` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts, src/core/__tests__/tabs-layout.test.tsx |
| `UI` | `dialin.costPaperFilter` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts, src/core/__tests__/tabs-layout.test.tsx |
| `TEKST` | `dialin.costTotalHome` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts, src/core/__tests__/tabs-layout.test.tsx |
| `TEKST` | `dialin.costCafeBenchmark` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts, src/core/__tests__/tabs-layout.test.tsx |
| `TEKST` | `dialin.costSavingsCup` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts, src/core/__tests__/tabs-layout.test.tsx |
| `UI` | `water.tabTitle` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/domain-properties.test.ts |
| `TEKST` | `water.title` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/domain-properties.test.ts |
| `TEKST` | `water.subtitle` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/domain-properties.test.ts |
| `UI` | `water.recipeSelectLabel` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/domain-properties.test.ts |
| `TEKST` | `water.targetGhLabel` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/domain-properties.test.ts |
| `TEKST` | `water.targetKhLabel` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/domain-properties.test.ts |
| `TEKST` | `water.waterVolumeLabel` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/domain-properties.test.ts |
| `TEKST` | `water.methodAHeader` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/domain-properties.test.ts |
| `TEKST` | `water.methodADesc` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/domain-properties.test.ts |
| `TEKST` | `water.bufferGrams` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/domain-properties.test.ts |
| `TEKST` | `water.hardnessGrams` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/domain-properties.test.ts |
| `TEKST` | `water.methodBHeader` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/domain-properties.test.ts |
| `TEKST` | `water.dryBakingSoda` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/domain-properties.test.ts |
| `TEKST` | `water.dryEpsom` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/domain-properties.test.ts |
| `TEKST` | `water.dryCalcium` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/domain-properties.test.ts |
| `TEKST` | `water.ppmCaCO3` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/domain-properties.test.ts |
| `TEKST` | `water.concentrateHelp` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/domain-properties.test.ts |
| `TEKST` | `water.diagnosisHeader` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/domain-properties.test.ts |
| `TEKST` | `water.diagnosisProblem` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/domain-properties.test.ts |
| `TEKST` | `water.diagnosisCause` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/domain-properties.test.ts |
| `TEKST` | `water.diagnosisRemedy` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/domain-properties.test.ts |
| `TEKST` | `water.bottledHeader` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/domain-properties.test.ts |
| `TEKST` | `water.bottledSubtitle` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/domain-properties.test.ts |
| `UI` | `water.suitabilityEXCELLENT` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/domain-properties.test.ts |
| `UI` | `water.suitabilityGOOD` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/domain-properties.test.ts |
| `UI` | `water.suitabilityACCEPTABLE` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/domain-properties.test.ts |
| `UI` | `water.suitabilityNOT_RECOMMENDED` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/domain-properties.test.ts |
| `TEKST` | `water.sessionWaterLabel` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/domain-properties.test.ts |
| `TEKST` | `grinder.title` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/interaction-guards.test.ts |
| `TEKST` | `grinder.subtitle` | `src/core/i18n.tsx` | ✅ | src/components/brew/__tests__/BrewHeader.test.tsx, src/components/craft/__tests__/CraftComponents.test.tsx |
| `UI` | `grinder.categorySelect` | `src/core/i18n.tsx` | ✅ | src/components/brew/__tests__/BrewHeader.test.tsx, src/components/icons/__tests__/CraftIcons.test.tsx |
| `TEKST` | `grinder.allGrindersHeader` | `src/core/i18n.tsx` | ✅ | src/components/brew/__tests__/BrewHeader.test.tsx, src/components/icons/__tests__/CraftIcons.test.tsx |
| `TEKST` | `grinder.micronsLabel` | `src/core/i18n.tsx` | ✅ | src/components/brew/__tests__/BrewHeader.test.tsx, src/components/icons/__tests__/CraftIcons.test.tsx |
| `TEKST` | `caffeine.title` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/interaction-guards.test.ts |
| `TEKST` | `caffeine.currentLevel` | `src/core/i18n.tsx` | ✅ | tests/oracle-coffee.test.ts, src/components/icons/__tests__/CraftIcons.test.tsx |
| `TEKST` | `caffeine.halfLifeNote` | `src/core/i18n.tsx` | ✅ | tests/oracle-coffee.test.ts, src/components/icons/__tests__/CraftIcons.test.tsx |
| `TEKST` | `caffeine.halfLifeTitle` | `src/core/i18n.tsx` | ✅ | tests/oracle-coffee.test.ts, src/components/icons/__tests__/CraftIcons.test.tsx |
| `TEKST` | `caffeine.halfLifeDesc` | `src/core/i18n.tsx` | ✅ | tests/oracle-coffee.test.ts, src/components/icons/__tests__/CraftIcons.test.tsx |
| `TEKST` | `caffeine.bedtimeTitle` | `src/core/i18n.tsx` | ✅ | tests/oracle-coffee.test.ts, src/components/icons/__tests__/CraftIcons.test.tsx |
| `TEKST` | `caffeine.bedtimeCurfew` | `src/core/i18n.tsx` | ✅ | tests/oracle-coffee.test.ts, src/components/icons/__tests__/CraftIcons.test.tsx |
| `TEKST` | `caffeine.safeAtBedtime` | `src/core/i18n.tsx` | ✅ | tests/oracle-coffee.test.ts, src/components/icons/__tests__/CraftIcons.test.tsx |
| `TEKST` | `caffeine.riskAtBedtime` | `src/core/i18n.tsx` | ✅ | tests/oracle-coffee.test.ts, src/components/icons/__tests__/CraftIcons.test.tsx |
| `UI` | `caffeine.logDoseBtn` | `src/core/i18n.tsx` | ✅ | tests/oracle-coffee.test.ts, src/components/icons/__tests__/CraftIcons.test.tsx |
| `TEKST` | `sensory.title` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/interaction-guards.test.ts |
| `TEKST` | `sensory.subtitle` | `src/core/i18n.tsx` | ✅ | src/components/brew/__tests__/BrewFinishModal.test.tsx, src/components/craft/__tests__/CraftComponents.test.tsx |
| `TEKST` | `sensory.acidity` | `src/core/i18n.tsx` | ✅ | src/components/brew/__tests__/BrewFinishModal.test.tsx, src/components/journal/__tests__/JournalSessionCard.test.tsx |
| `TEKST` | `sensory.sweetness` | `src/core/i18n.tsx` | ✅ | src/components/brew/__tests__/BrewFinishModal.test.tsx, src/components/journal/__tests__/JournalSessionCard.test.tsx |
| `TEKST` | `sensory.body` | `src/core/i18n.tsx` | ✅ | tests/public-repo.test.ts, src/components/brew/__tests__/BrewFinishModal.test.tsx |
| `TEKST` | `sensory.clarity` | `src/core/i18n.tsx` | ✅ | src/components/brew/__tests__/BrewFinishModal.test.tsx, src/components/journal/__tests__/JournalSessionCard.test.tsx |
| `UI` | `sensory.finish` | `src/core/i18n.tsx` | ✅ | src/components/beans/__tests__/BeanEditModal.test.tsx, src/components/brew/__tests__/BrewActiveFocusTimer.test.tsx |
| `TEKST` | `batch.label` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/close-button-guard.test.tsx |
| `TEKST` | `batch.cups` | `src/core/i18n.tsx` | ✅ | src/components/brew/__tests__/BrewQuickPrepCard.test.tsx |
| `TEKST` | `batch.cup1` | `src/core/i18n.tsx` | ✅ | src/components/brew/__tests__/BrewQuickPrepCard.test.tsx |
| `TEKST` | `batch.cup2` | `src/core/i18n.tsx` | ✅ | src/components/brew/__tests__/BrewQuickPrepCard.test.tsx |
| `TEKST` | `batch.cup3` | `src/core/i18n.tsx` | ✅ | src/components/brew/__tests__/BrewQuickPrepCard.test.tsx |
| `TEKST` | `batch.cup4` | `src/core/i18n.tsx` | ✅ | src/components/brew/__tests__/BrewQuickPrepCard.test.tsx |
| `TEKST` | `batch.grindAdjustmentNotice` | `src/core/i18n.tsx` | ✅ | src/components/brew/__tests__/BrewQuickPrepCard.test.tsx |
| `TEKST` | `favorites.title` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/interaction-guards.test.ts |
| `TEKST` | `favorites.addToFav` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts |
| `TEKST` | `favorites.removeFromFav` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts |
| `TEKST` | `favorites.quickBrew` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts |
| `TEKST` | `settings.title` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/interaction-guards.test.ts |
| `TEKST` | `settings.languageSection` | `src/core/i18n.tsx` | ✅ | src/components/icons/__tests__/CraftIcons.test.tsx, src/components/__tests__/Apps4BrewPassModal.test.tsx |
| `TEKST` | `settings.languageAuto` | `src/core/i18n.tsx` | ✅ | src/components/icons/__tests__/CraftIcons.test.tsx, src/components/__tests__/Apps4BrewPassModal.test.tsx |
| `TEKST` | `settings.beverageSection` | `src/core/i18n.tsx` | ✅ | src/components/icons/__tests__/CraftIcons.test.tsx, src/components/__tests__/Apps4BrewPassModal.test.tsx |
| `TEKST` | `settings.beverageDesc` | `src/core/i18n.tsx` | ✅ | src/components/icons/__tests__/CraftIcons.test.tsx, src/components/__tests__/Apps4BrewPassModal.test.tsx |
| `TEKST` | `settings.beverageBoth` | `src/core/i18n.tsx` | ✅ | src/components/icons/__tests__/CraftIcons.test.tsx, src/components/__tests__/Apps4BrewPassModal.test.tsx |
| `TEKST` | `settings.beverageBothDesc` | `src/core/i18n.tsx` | ✅ | src/components/icons/__tests__/CraftIcons.test.tsx, src/components/__tests__/Apps4BrewPassModal.test.tsx |
| `TEKST` | `settings.beverageCoffeeOnly` | `src/core/i18n.tsx` | ✅ | src/components/icons/__tests__/CraftIcons.test.tsx, src/components/__tests__/Apps4BrewPassModal.test.tsx |
| `TEKST` | `settings.beverageCoffeeOnlyDesc` | `src/core/i18n.tsx` | ✅ | src/components/icons/__tests__/CraftIcons.test.tsx, src/components/__tests__/Apps4BrewPassModal.test.tsx |
| `TEKST` | `settings.beverageTeaOnly` | `src/core/i18n.tsx` | ✅ | src/components/icons/__tests__/CraftIcons.test.tsx, src/components/__tests__/Apps4BrewPassModal.test.tsx |
| `TEKST` | `settings.beverageTeaOnlyDesc` | `src/core/i18n.tsx` | ✅ | src/components/icons/__tests__/CraftIcons.test.tsx, src/components/__tests__/Apps4BrewPassModal.test.tsx |
| `TEKST` | `settings.caffeineSettingsSection` | `src/core/i18n.tsx` | ✅ | src/components/icons/__tests__/CraftIcons.test.tsx, src/components/__tests__/Apps4BrewPassModal.test.tsx |
| `TEKST` | `settings.caffeineHalfLifeTitle` | `src/core/i18n.tsx` | ✅ | src/components/icons/__tests__/CraftIcons.test.tsx, src/components/__tests__/Apps4BrewPassModal.test.tsx |

*(... i 304 kolejnych elementów w pełnym wykazie)*

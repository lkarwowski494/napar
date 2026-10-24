# Macierz Testów (AST Coverage Matrix) — NAPAR (STEEPWISE)

Wygenerowano automatycznie przez `scripts/test-matrix.mjs` zgodnie z wymaganiami **BR-TEST-028..031**.
Zasada dowodu: wyłącznie wykonywalny kod testu (wycięte komentarze, importy i opisy `test`/`describe`).

## Podsumowanie Pokrycia

| Kategoria | Łącznie | Pokryte | Pokrycie % | Status |
| :--- | :---: | :---: | :---: | :---: |
| **EKRAN** | 9 | 9 | **100.0%** | ✅ POKRYTE |
| **UI** | 73 | 73 | **100.0%** | ✅ POKRYTE |
| **TEKST** | 341 | 341 | **100.0%** | ✅ POKRYTE |
| **LOGIKA** | 197 | 197 | **100.0%** | ✅ POKRYTE |
| **WYMIAR** | 37 | 37 | **100.0%** | ✅ POKRYTE |

Łącznie elementów: **657** | Pokrytych: **657** | Brakujących: **0**

## Szczegółowa Lista Elementów

| Kategoria | Nazwa elementu | Plik źródłowy | Status | Pliki testowe |
| :--- | :--- | :--- | :---: | :--- |
| `EKRAN` | `/(tabs)/beans` | `app/(tabs)/beans.tsx` | ✅ | tests/interaction-guards.test.ts, tests/state-sequences.test.ts |
| `EKRAN` | `/(tabs)/caffeine` | `app/(tabs)/caffeine.tsx` | ✅ | tests/airplane-mode.test.ts, tests/oracle-coffee.test.ts |
| `EKRAN` | `/(tabs)/dialin` | `app/(tabs)/dialin.tsx` | ✅ | src/core/__tests__/i18n.test.ts, src/core/__tests__/tabs-layout.test.tsx |
| `EKRAN` | `/(tabs)/index` | `app/(tabs)/index.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/public-repo.test.ts |
| `EKRAN` | `/(tabs)/journal` | `app/(tabs)/journal.tsx` | ✅ | tests/interaction-guards.test.ts, src/components/icons/__tests__/CraftIcons.test.tsx |
| `EKRAN` | `/(tabs)/settings` | `app/(tabs)/settings.tsx` | ✅ | tests/airplane-mode.test.ts, tests/migration-v1-to-v2.test.ts |
| `EKRAN` | `/gongfu` | `app/gongfu.tsx` | ✅ | tests/audit-fixes.test.tsx, src/components/brew/__tests__/BrewHeader.test.tsx |
| `EKRAN` | `/recipe-builder` | `app/recipe-builder.tsx` | ✅ | src/core/__tests__/brew-screen.test.tsx, src/core/__tests__/modal-safety-and-beverage-toggle.test.tsx |
| `EKRAN` | `/settings` | `app/settings.tsx` | ✅ | tests/airplane-mode.test.ts, tests/migration-v1-to-v2.test.ts |
| `TEKST` | `appName` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/audit-fixes.test.tsx |
| `TEKST` | `appTagline` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/audit-fixes.test.tsx |
| `UI` | `common.cancel` | `src/core/i18n.tsx` | ✅ | tests/close-button-guard.test.tsx, tests/recipe-select-inline.test.tsx |
| `UI` | `common.save` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/bpr-components.test.tsx |
| `UI` | `common.delete` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/interaction-guards.test.ts |
| `UI` | `common.edit` | `src/core/i18n.tsx` | ✅ | tests/recipe-select-inline.test.tsx, tests/state-sequences.test.ts |
| `UI` | `common.close` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/bpr-components.test.tsx |
| `UI` | `common.confirm` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/interaction-guards.test.ts |
| `UI` | `common.back` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/audit-fixes.test.tsx |
| `UI` | `common.next` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/bpr-components.test.tsx |
| `UI` | `common.finish` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/bpr-components.test.tsx |
| `UI` | `common.ok` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/bpr-components.test.tsx |
| `UI` | `common.timerStepWarning` | `src/core/i18n.tsx` | ✅ | tests/recipe-select-inline.test.tsx, src/core/__tests__/domain-coverage-edge-cases.test.tsx |
| `UI` | `common.stepFinished` | `src/core/i18n.tsx` | ✅ | tests/recipe-select-inline.test.tsx, src/core/__tests__/domain-coverage-edge-cases.test.tsx |
| `UI` | `common.brewingFinished` | `src/core/i18n.tsx` | ✅ | tests/recipe-select-inline.test.tsx, src/core/__tests__/domain-coverage-edge-cases.test.tsx |
| `UI` | `common.grams` | `src/core/i18n.tsx` | ✅ | tests/recipe-select-inline.test.tsx, src/core/__tests__/domain-coverage-edge-cases.test.tsx |
| `UI` | `common.seconds` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/migration-v1-to-v2.test.ts |
| `UI` | `common.celsius` | `src/core/i18n.tsx` | ✅ | tests/recipe-select-inline.test.tsx, src/core/__tests__/domain-coverage-edge-cases.test.tsx |
| `TEKST` | `tabs.brew` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/migration-v1-to-v2.test.ts |
| `TEKST` | `tabs.beans` | `src/core/i18n.tsx` | ✅ | tests/interaction-guards.test.ts, tests/state-sequences.test.ts |
| `TEKST` | `tabs.journal` | `src/core/i18n.tsx` | ✅ | tests/interaction-guards.test.ts, src/components/icons/__tests__/CraftIcons.test.tsx |
| `TEKST` | `tabs.dialin` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts, src/core/__tests__/stash-screen.test.tsx |
| `TEKST` | `tabs.caffeine` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/oracle-coffee.test.ts |
| `TEKST` | `tabs.settings` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/migration-v1-to-v2.test.ts |
| `TEKST` | `brew.recipe` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/audit-fixes.test.tsx |
| `TEKST` | `brew.chooseRecipe` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/migration-v1-to-v2.test.ts |
| `TEKST` | `brew.customRecipe` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/migration-v1-to-v2.test.ts |
| `TEKST` | `brew.stashItem` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/migration-v1-to-v2.test.ts |
| `TEKST` | `brew.chooseStash` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/migration-v1-to-v2.test.ts |
| `TEKST` | `brew.noStashItem` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/migration-v1-to-v2.test.ts |
| `TEKST` | `brew.noStashDesc` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/migration-v1-to-v2.test.ts |
| `TEKST` | `brew.remaining` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/audit-fixes.test.tsx |
| `TEKST` | `brew.dose` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/audit-fixes.test.tsx |
| `TEKST` | `brew.water` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/audit-fixes.test.tsx |
| `TEKST` | `brew.ratio` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/audit-fixes.test.tsx |
| `TEKST` | `brew.temp` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/migration-v1-to-v2.test.ts |
| `TEKST` | `brew.grind` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/migration-v1-to-v2.test.ts |
| `TEKST` | `brew.timerReady` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/migration-v1-to-v2.test.ts |
| `TEKST` | `brew.pourRateTarget` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/migration-v1-to-v2.test.ts |
| `TEKST` | `brew.startBrew` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/migration-v1-to-v2.test.ts |
| `TEKST` | `brew.pauseBrew` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/migration-v1-to-v2.test.ts |
| `TEKST` | `brew.resumeBrew` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/migration-v1-to-v2.test.ts |
| `TEKST` | `brew.resetBrew` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/migration-v1-to-v2.test.ts |
| `TEKST` | `brew.tastingNotesCard` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/migration-v1-to-v2.test.ts |
| `TEKST` | `brew.ratingLabel` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/migration-v1-to-v2.test.ts |
| `TEKST` | `brew.tasteBalanceLabel` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/migration-v1-to-v2.test.ts |
| `TEKST` | `brew.flavorWheelLabel` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/migration-v1-to-v2.test.ts |
| `TEKST` | `brew.tdsInputLabel` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/migration-v1-to-v2.test.ts |
| `UI` | `brew.extractionYield` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/domain-properties.test.ts |
| `TEKST` | `brew.notesPlaceholder` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/migration-v1-to-v2.test.ts |
| `UI` | `brew.saveSession` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/migration-v1-to-v2.test.ts |
| `UI` | `brew.sessionSaved` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/migration-v1-to-v2.test.ts |
| `UI` | `brew.selectGrinder` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/migration-v1-to-v2.test.ts |
| `TEKST` | `brew.grinderModalTitle` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/migration-v1-to-v2.test.ts |
| `TEKST` | `brew.grinderModalDesc` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/migration-v1-to-v2.test.ts |
| `TEKST` | `brew.shareRecipe` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/migration-v1-to-v2.test.ts |
| `TEKST` | `brew.importRecipe` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/migration-v1-to-v2.test.ts |
| `TEKST` | `brew.qrModalTitle` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/migration-v1-to-v2.test.ts |
| `TEKST` | `brew.qrModalDesc` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/migration-v1-to-v2.test.ts |
| `TEKST` | `brew.qrCopyLink` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/migration-v1-to-v2.test.ts |
| `TEKST` | `brew.qrShareLink` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/migration-v1-to-v2.test.ts |
| `TEKST` | `brew.qrCopied` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/migration-v1-to-v2.test.ts |
| `TEKST` | `brew.importModalTitle` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/migration-v1-to-v2.test.ts |
| `TEKST` | `brew.importModalDesc` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/migration-v1-to-v2.test.ts |
| `TEKST` | `brew.importInputPlaceholder` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/migration-v1-to-v2.test.ts |
| `UI` | `brew.importActionBtn` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/migration-v1-to-v2.test.ts |
| `TEKST` | `brew.importError` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/migration-v1-to-v2.test.ts |
| `TEKST` | `brew.importSuccess` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/migration-v1-to-v2.test.ts |
| `TEKST` | `brew.duplicateRecipe` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/migration-v1-to-v2.test.ts |
| `TEKST` | `brew.duplicateSuccess` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/migration-v1-to-v2.test.ts |
| `TEKST` | `brew.addTime10` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/migration-v1-to-v2.test.ts |
| `TEKST` | `brew.subTime10` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/migration-v1-to-v2.test.ts |
| `TEKST` | `brew.totalTimeLabel` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/migration-v1-to-v2.test.ts |
| `TEKST` | `brew.totalTimeAccessibility` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/migration-v1-to-v2.test.ts |
| `TEKST` | `brew.stepBadge` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/migration-v1-to-v2.test.ts |
| `TEKST` | `brew.stepAccessibility` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/migration-v1-to-v2.test.ts |
| `TEKST` | `brew.subTime10Accessibility` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/migration-v1-to-v2.test.ts |
| `TEKST` | `brew.addTime10Accessibility` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/migration-v1-to-v2.test.ts |
| `TEKST` | `brew.pourUpTo` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/migration-v1-to-v2.test.ts |
| `TEKST` | `brew.startBrewAccessibility` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/migration-v1-to-v2.test.ts |
| `TEKST` | `brew.startBrewHint` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/migration-v1-to-v2.test.ts |
| `UI` | `brew.startBrewBtn` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/migration-v1-to-v2.test.ts |
| `TEKST` | `brew.previousStepAccessibility` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/migration-v1-to-v2.test.ts |
| `TEKST` | `brew.previousStepHint` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/migration-v1-to-v2.test.ts |
| `UI` | `brew.previousStepBtn` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/migration-v1-to-v2.test.ts |
| `TEKST` | `brew.pauseBrewAccessibility` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/migration-v1-to-v2.test.ts |
| `TEKST` | `brew.pauseBrewHint` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/migration-v1-to-v2.test.ts |
| `UI` | `brew.pauseBrewBtn` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/migration-v1-to-v2.test.ts |
| `UI` | `brew.nextStepAccessibility` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/migration-v1-to-v2.test.ts |
| `UI` | `brew.nextStepHint` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/migration-v1-to-v2.test.ts |
| `UI` | `brew.nextStepBtn` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/migration-v1-to-v2.test.ts |
| `UI` | `brew.finishBrewAccessibility` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/migration-v1-to-v2.test.ts |
| `UI` | `brew.finishBrewHint` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/migration-v1-to-v2.test.ts |
| `UI` | `brew.finishBrewBtn` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/migration-v1-to-v2.test.ts |
| `TEKST` | `brew.resetTimerAccessibility` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/migration-v1-to-v2.test.ts |
| `TEKST` | `brew.resetTimerHint` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/migration-v1-to-v2.test.ts |
| `TEKST` | `brew.resumeBrewAccessibility` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/migration-v1-to-v2.test.ts |
| `TEKST` | `brew.resumeBrewHint` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/migration-v1-to-v2.test.ts |
| `UI` | `brew.saveSessionAccessibility` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/migration-v1-to-v2.test.ts |
| `UI` | `brew.saveSessionHint` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/migration-v1-to-v2.test.ts |
| `UI` | `brew.saveSessionBtn` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/migration-v1-to-v2.test.ts |
| `TEKST` | `gongfu.modeTitle` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/components/brew/__tests__/BrewHeader.test.tsx |
| `TEKST` | `gongfu.modeDesc` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/components/brew/__tests__/BrewHeader.test.tsx |
| `TEKST` | `gongfu.infusionNumber` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/components/brew/__tests__/BrewHeader.test.tsx |
| `TEKST` | `gongfu.rinseTitle` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/components/brew/__tests__/BrewHeader.test.tsx |
| `TEKST` | `gongfu.rinseDesc` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/components/brew/__tests__/BrewHeader.test.tsx |
| `TEKST` | `gongfu.rinseCompleted` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/components/brew/__tests__/BrewHeader.test.tsx |
| `TEKST` | `gongfu.leafDose` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/components/brew/__tests__/BrewHeader.test.tsx |
| `TEKST` | `gongfu.vesselCapacity` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/components/brew/__tests__/BrewHeader.test.tsx |
| `TEKST` | `gongfu.waterTemp` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/audit-fixes.test.tsx |
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
| `TEKST` | `recipeBuilder.coffee` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/audit-fixes.test.tsx |
| `TEKST` | `recipeBuilder.tea` | `src/core/i18n.tsx` | ✅ | tests/matrix-coverage-gap.test.tsx, tests/workflow-hooks-matrix.test.tsx |
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
| `TEKST` | `stash.roaster` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/state-sequences.test.ts |
| `TEKST` | `stash.origin` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/domain-properties.test.ts |
| `TEKST` | `stash.variety` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/workflow-hooks-matrix.test.tsx |
| `TEKST` | `stash.process` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/audit-fixes.test.tsx |
| `TEKST` | `stash.roastDate` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/state-sequences.test.ts |
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
| `TEKST` | `journal.avgRating` | `src/core/i18n.tsx` | ✅ | tests/interaction-guards.test.ts, tests/workflow-hooks-matrix.test.tsx |
| `TEKST` | `journal.totalBrews` | `src/core/i18n.tsx` | ✅ | tests/interaction-guards.test.ts, tests/workflow-hooks-matrix.test.tsx |
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
| `UI` | `water.tabTitle` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/audit-fixes.test.tsx |
| `TEKST` | `water.title` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/audit-fixes.test.tsx |
| `TEKST` | `water.subtitle` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/audit-fixes.test.tsx |
| `UI` | `water.recipeSelectLabel` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/audit-fixes.test.tsx |
| `TEKST` | `water.targetGhLabel` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/audit-fixes.test.tsx |
| `TEKST` | `water.targetKhLabel` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/audit-fixes.test.tsx |
| `TEKST` | `water.waterVolumeLabel` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/audit-fixes.test.tsx |
| `TEKST` | `water.methodAHeader` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/audit-fixes.test.tsx |
| `TEKST` | `water.methodADesc` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/audit-fixes.test.tsx |
| `TEKST` | `water.bufferGrams` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/audit-fixes.test.tsx |
| `TEKST` | `water.hardnessGrams` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/audit-fixes.test.tsx |
| `TEKST` | `water.methodBHeader` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/audit-fixes.test.tsx |
| `TEKST` | `water.dryBakingSoda` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/audit-fixes.test.tsx |
| `TEKST` | `water.dryEpsom` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/audit-fixes.test.tsx |
| `TEKST` | `water.dryCalcium` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/audit-fixes.test.tsx |
| `TEKST` | `water.ppmCaCO3` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/audit-fixes.test.tsx |
| `TEKST` | `water.concentrateHelp` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/audit-fixes.test.tsx |
| `TEKST` | `water.diagnosisHeader` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/audit-fixes.test.tsx |
| `TEKST` | `water.diagnosisProblem` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/audit-fixes.test.tsx |
| `TEKST` | `water.diagnosisCause` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/audit-fixes.test.tsx |
| `TEKST` | `water.diagnosisRemedy` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/audit-fixes.test.tsx |
| `TEKST` | `water.bottledHeader` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/audit-fixes.test.tsx |
| `TEKST` | `water.bottledSubtitle` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/audit-fixes.test.tsx |
| `UI` | `water.suitabilityEXCELLENT` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/audit-fixes.test.tsx |
| `UI` | `water.suitabilityGOOD` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/audit-fixes.test.tsx |
| `UI` | `water.suitabilityACCEPTABLE` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/audit-fixes.test.tsx |
| `UI` | `water.suitabilityNOT_RECOMMENDED` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/audit-fixes.test.tsx |
| `TEKST` | `water.sessionWaterLabel` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/audit-fixes.test.tsx |
| `TEKST` | `grinder.title` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/interaction-guards.test.ts |
| `TEKST` | `grinder.subtitle` | `src/core/i18n.tsx` | ✅ | src/components/brew/__tests__/BrewHeader.test.tsx, src/components/craft/__tests__/CraftComponents.test.tsx |
| `UI` | `grinder.categorySelect` | `src/core/i18n.tsx` | ✅ | src/components/brew/__tests__/BrewHeader.test.tsx, src/components/icons/__tests__/CraftIcons.test.tsx |
| `TEKST` | `grinder.allGrindersHeader` | `src/core/i18n.tsx` | ✅ | src/components/brew/__tests__/BrewHeader.test.tsx, src/components/icons/__tests__/CraftIcons.test.tsx |
| `TEKST` | `grinder.micronsLabel` | `src/core/i18n.tsx` | ✅ | src/components/brew/__tests__/BrewHeader.test.tsx, src/components/icons/__tests__/CraftIcons.test.tsx |
| `TEKST` | `caffeine.title` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/audit-fixes.test.tsx |
| `TEKST` | `caffeine.currentLevel` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/oracle-coffee.test.ts |
| `TEKST` | `caffeine.halfLifeNote` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/oracle-coffee.test.ts |
| `TEKST` | `caffeine.halfLifeTitle` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/oracle-coffee.test.ts |
| `TEKST` | `caffeine.halfLifeDesc` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/oracle-coffee.test.ts |
| `TEKST` | `caffeine.bedtimeTitle` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/oracle-coffee.test.ts |
| `TEKST` | `caffeine.bedtimeCurfew` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/oracle-coffee.test.ts |
| `TEKST` | `caffeine.safeAtBedtime` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/oracle-coffee.test.ts |
| `TEKST` | `caffeine.riskAtBedtime` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/oracle-coffee.test.ts |
| `UI` | `caffeine.logDoseBtn` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/oracle-coffee.test.ts |
| `TEKST` | `sensory.title` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/audit-fixes.test.tsx |

*(... i 357 kolejnych elementów w pełnym wykazie)*

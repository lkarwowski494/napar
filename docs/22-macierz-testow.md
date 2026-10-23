# Macierz Testów (AST Coverage Matrix) — NAPAR (STEEPWISE)

Wygenerowano automatycznie przez `scripts/test-matrix.mjs` zgodnie z wymaganiami **BR-TEST-028..031**.
Zasada dowodu: wyłącznie wykonywalny kod testu (wycięte komentarze, importy i opisy `test`/`describe`).

## Podsumowanie Pokrycia

| Kategoria | Łącznie | Pokryte | Pokrycie % | Status |
| :--- | :---: | :---: | :---: | :---: |
| **EKRAN** | 11 | 11 | **100.0%** | ✅ POKRYTE |
| **UI** | 69 | 69 | **100.0%** | ✅ POKRYTE |
| **TEKST** | 435 | 435 | **100.0%** | ✅ POKRYTE |
| **LOGIKA** | 270 | 270 | **100.0%** | ✅ POKRYTE |
| **WYMIAR** | 88 | 88 | **100.0%** | ✅ POKRYTE |

Łącznie elementów: **873** | Pokrytych: **873** | Brakujących: **0**

## Szczegółowa Lista Elementów

| Kategoria | Nazwa elementu | Plik źródłowy | Status | Pliki testowe |
| :--- | :--- | :--- | :---: | :--- |
| `EKRAN` | `/(tabs)/beans` | `app/(tabs)/beans.tsx` | ✅ | tests/interaction-guards.test.ts, tests/state-sequences.test.ts |
| `EKRAN` | `/(tabs)/caffeine` | `app/(tabs)/caffeine.tsx` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `EKRAN` | `/(tabs)/dialin` | `app/(tabs)/dialin.tsx` | ✅ | src/core/__tests__/i18n.test.ts, src/core/__tests__/tabs-layout.test.tsx |
| `EKRAN` | `/(tabs)/index` | `app/(tabs)/index.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/napar-watch-link.test.ts |
| `EKRAN` | `/(tabs)/journal` | `app/(tabs)/journal.tsx` | ✅ | tests/interaction-guards.test.ts, src/components/icons/__tests__/CraftIcons.test.tsx |
| `EKRAN` | `/(tabs)/settings` | `app/(tabs)/settings.tsx` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `EKRAN` | `/gongfu` | `app/gongfu.tsx` | ✅ | tests/audit-fixes.test.tsx, src/components/__tests__/gongfu-setup-units.test.tsx |
| `EKRAN` | `/milk-drinks` | `app/milk-drinks.tsx` | ✅ | src/core/__tests__/milk-drinks-screen.test.tsx |
| `EKRAN` | `/recipe-builder` | `app/recipe-builder.tsx` | ✅ | src/core/__tests__/brew-screen.test.tsx, src/core/__tests__/modal-safety-and-beverage-toggle.test.tsx |
| `EKRAN` | `/recipe` | `app/recipe.tsx` | ✅ | tests/airplane-mode.test.ts, tests/audit-fixes.test.tsx |
| `EKRAN` | `/settings` | `app/settings.tsx` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `appName` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/audit-fixes.test.tsx |
| `TEKST` | `appTagline` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/audit-fixes.test.tsx |
| `UI` | `common.cancel` | `src/core/i18n.tsx` | ✅ | tests/close-button-guard.test.tsx, tests/recipe-select-inline.test.tsx |
| `UI` | `common.save` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `UI` | `common.delete` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/backup-roundtrip.test.ts |
| `UI` | `common.edit` | `src/core/i18n.tsx` | ✅ | tests/recipe-select-inline.test.tsx, tests/state-sequences.test.ts |
| `UI` | `common.close` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/bpr-components.test.tsx |
| `UI` | `common.confirm` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/interaction-guards.test.ts |
| `UI` | `common.back` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/audit-fixes.test.tsx |
| `UI` | `common.next` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/bpr-components.test.tsx |
| `UI` | `common.finish` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `UI` | `common.ok` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/backup-roundtrip.test.ts |
| `UI` | `common.timerStepWarning` | `src/core/i18n.tsx` | ✅ | tests/recipe-select-inline.test.tsx, src/core/__tests__/domain-coverage-edge-cases.test.tsx |
| `UI` | `common.stepFinished` | `src/core/i18n.tsx` | ✅ | tests/recipe-select-inline.test.tsx, src/core/__tests__/domain-coverage-edge-cases.test.tsx |
| `UI` | `common.brewingFinished` | `src/core/i18n.tsx` | ✅ | tests/recipe-select-inline.test.tsx, src/core/__tests__/domain-coverage-edge-cases.test.tsx |
| `UI` | `common.grams` | `src/core/i18n.tsx` | ✅ | tests/recipe-select-inline.test.tsx, src/core/__tests__/domain-coverage-edge-cases.test.tsx |
| `UI` | `common.seconds` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `UI` | `common.celsius` | `src/core/i18n.tsx` | ✅ | tests/recipe-select-inline.test.tsx, src/core/__tests__/domain-coverage-edge-cases.test.tsx |
| `TEKST` | `tabs.brew` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `tabs.beans` | `src/core/i18n.tsx` | ✅ | tests/interaction-guards.test.ts, tests/state-sequences.test.ts |
| `TEKST` | `tabs.journal` | `src/core/i18n.tsx` | ✅ | tests/interaction-guards.test.ts, src/components/icons/__tests__/CraftIcons.test.tsx |
| `TEKST` | `tabs.dialin` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts, src/core/__tests__/milk-drinks-screen.test.tsx |
| `TEKST` | `tabs.caffeine` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `tabs.settings` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `brew.recipe` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/audit-fixes.test.tsx |
| `TEKST` | `brew.chooseRecipe` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `brew.customRecipe` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `brew.stashItem` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `brew.chooseStash` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `brew.noStashItem` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `brew.noStashDesc` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `brew.remaining` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/audit-fixes.test.tsx |
| `TEKST` | `brew.dose` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/audit-fixes.test.tsx |
| `TEKST` | `brew.water` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/audit-fixes.test.tsx |
| `TEKST` | `brew.ratio` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/audit-fixes.test.tsx |
| `TEKST` | `brew.temp` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `brew.grind` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `brew.timerReady` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `brew.pourRateTarget` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `brew.startBrew` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `brew.pauseBrew` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `brew.resumeBrew` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `brew.resetBrew` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `brew.tastingNotesCard` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `brew.ratingLabel` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `brew.tasteBalanceLabel` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `brew.flavorWheelLabel` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `brew.tdsInputLabel` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `UI` | `brew.extractionYield` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `brew.notesPlaceholder` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `UI` | `brew.saveSession` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `UI` | `brew.sessionSaved` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `UI` | `brew.selectGrinder` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `brew.grinderModalTitle` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `brew.grinderModalDesc` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `brew.shareRecipe` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `brew.importRecipe` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `brew.qrModalTitle` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `brew.qrModalDesc` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `brew.qrCopyLink` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `brew.qrShareLink` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `brew.qrCopied` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `brew.qrCopyFailed` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `brew.importModalTitle` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `brew.importModalDesc` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `brew.importInputPlaceholder` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `UI` | `brew.importActionBtn` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `brew.importError` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `brew.importSuccess` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `brew.duplicateRecipe` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `brew.duplicateSuccess` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `brew.addTime10` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `brew.subTime10` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `gongfu.modeTitle` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/components/__tests__/gongfu-setup-units.test.tsx |
| `TEKST` | `gongfu.modeDesc` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/components/__tests__/gongfu-setup-units.test.tsx |
| `TEKST` | `gongfu.infusionNumber` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/backup-roundtrip.test.ts |
| `TEKST` | `gongfu.rinseTitle` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/components/__tests__/gongfu-setup-units.test.tsx |
| `TEKST` | `gongfu.rinseDesc` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/components/__tests__/gongfu-setup-units.test.tsx |
| `TEKST` | `gongfu.rinseCompleted` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/components/__tests__/gongfu-setup-units.test.tsx |
| `TEKST` | `gongfu.leafDose` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/components/__tests__/gongfu-setup-units.test.tsx |
| `TEKST` | `gongfu.vesselCapacity` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/components/__tests__/gongfu-setup-units.test.tsx |
| `TEKST` | `gongfu.waterTemp` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/audit-fixes.test.tsx |
| `TEKST` | `gongfu.steepCountdown` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/components/__tests__/gongfu-setup-units.test.tsx |
| `TEKST` | `gongfu.pourNow` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/components/__tests__/gongfu-setup-units.test.tsx |
| `TEKST` | `gongfu.startSteep` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/components/__tests__/gongfu-setup-units.test.tsx |
| `UI` | `gongfu.nextInfusion` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/components/__tests__/gongfu-setup-units.test.tsx |
| `TEKST` | `gongfu.addSeconds` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/components/__tests__/gongfu-setup-units.test.tsx |
| `TEKST` | `gongfu.subSeconds` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/components/__tests__/gongfu-setup-units.test.tsx |
| `TEKST` | `gongfu.infusionNotes` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/components/__tests__/gongfu-setup-units.test.tsx |
| `TEKST` | `gongfu.infusionNotesPlaceholder` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/components/__tests__/gongfu-setup-units.test.tsx |
| `TEKST` | `gongfu.sessionHistory` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/components/__tests__/gongfu-setup-units.test.tsx |
| `TEKST` | `gongfu.totalCaffeine` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/components/__tests__/gongfu-setup-units.test.tsx |
| `TEKST` | `gongfu.infusionCaffeine` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/components/__tests__/gongfu-setup-units.test.tsx |
| `UI` | `gongfu.finishSession` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/components/__tests__/gongfu-setup-units.test.tsx |
| `TEKST` | `tastingCard.title` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/backup-roundtrip.test.ts |
| `TEKST` | `tastingCard.brand` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/brands.contract.test.ts |
| `TEKST` | `tastingCard.dose` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/audit-fixes.test.tsx |
| `TEKST` | `tastingCard.water` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/audit-fixes.test.tsx |
| `TEKST` | `tastingCard.temperature` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/milk-drinks-screen.test.tsx |
| `TEKST` | `tastingCard.time` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/audit-fixes.test.tsx |
| `TEKST` | `tastingCard.rating` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `tastingCard.balance` | `src/core/i18n.tsx` | ✅ | tests/backup-roundtrip.test.ts, src/components/__tests__/TastingCardView.test.tsx |
| `TEKST` | `tastingCard.yield` | `src/core/i18n.tsx` | ✅ | tests/oracle-coffee.test.ts, src/components/dialin/__tests__/BrewRatioTab.test.tsx |
| `TEKST` | `tastingCard.inventory` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `tastingCard.flavorNotes` | `src/core/i18n.tsx` | ✅ | tests/backup-roundtrip.test.ts, tests/bpr-components.test.tsx |
| `TEKST` | `tastingCard.notes` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `tastingCard.footer` | `src/core/i18n.tsx` | ✅ | src/components/craft/__tests__/CraftComponents.test.tsx, src/core/__tests__/milk-drinks-screen.test.tsx |
| `TEKST` | `tastingCard.balanceLabel.balanced` | `src/core/i18n.tsx` | ✅ | tests/backup-roundtrip.test.ts, src/components/__tests__/TastingCardView.test.tsx |
| `TEKST` | `tastingCard.balanceLabel.sour` | `src/core/i18n.tsx` | ✅ | tests/backup-roundtrip.test.ts, tests/helpers/sqljs-port.ts |
| `TEKST` | `tastingCard.balanceLabel.bitter` | `src/core/i18n.tsx` | ✅ | src/components/__tests__/TastingCardView.test.tsx, src/components/brew/__tests__/BrewFinishModal.test.tsx |
| `TEKST` | `tastingCard.balanceLabel.astringent` | `src/core/i18n.tsx` | ✅ | src/components/__tests__/TastingCardView.test.tsx, src/core/__tests__/dialin-screen.test.tsx |
| `TEKST` | `tastingCard.balanceLabel.weak` | `src/core/i18n.tsx` | ✅ | src/components/__tests__/TastingCardView.test.tsx, src/components/brew/__tests__/BrewFinishModal.test.tsx |
| `TEKST` | `tastingCard.balanceLabel.too_strong` | `src/core/i18n.tsx` | ✅ | src/components/__tests__/TastingCardView.test.tsx, src/core/__tests__/milk-drinks-screen.test.tsx |
| `TEKST` | `milkDrinks.title` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/backup-roundtrip.test.ts |
| `TEKST` | `milkDrinks.entry` | `src/core/i18n.tsx` | ✅ | tests/touch-target-scan.test.ts, src/core/__tests__/contracts.test.ts |
| `TEKST` | `milkDrinks.intro` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/milk-drinks-screen.test.tsx, src/core/__tests__/milk-drinks.test.ts |
| `TEKST` | `milkDrinks.cupLabel` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/milk-drinks-screen.test.tsx, src/core/__tests__/milk-drinks.test.ts |
| `TEKST` | `milkDrinks.cupValue` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/milk-drinks-screen.test.tsx, src/core/__tests__/milk-drinks.test.ts |
| `TEKST` | `milkDrinks.cupSmaller` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/milk-drinks-screen.test.tsx, src/core/__tests__/milk-drinks.test.ts |
| `TEKST` | `milkDrinks.cupLarger` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/milk-drinks-screen.test.tsx, src/core/__tests__/milk-drinks.test.ts |
| `TEKST` | `milkDrinks.fixedCup` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/milk-drinks-screen.test.tsx, src/core/__tests__/milk-drinks.test.ts |
| `TEKST` | `milkDrinks.ingredients` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/milk-drinks-screen.test.tsx, src/core/__tests__/milk-drinks.test.ts |
| `TEKST` | `milkDrinks.milkTemperature` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/milk-drinks-screen.test.tsx, src/core/__tests__/milk-drinks.test.ts |
| `TEKST` | `milkDrinks.milkTemperatureNote` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/milk-drinks-screen.test.tsx, src/core/__tests__/milk-drinks.test.ts |
| `TEKST` | `milkDrinks.noMilk` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/milk-drinks-screen.test.tsx, src/core/__tests__/milk-drinks.test.ts |
| `TEKST` | `milkDrinks.steps` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `milkDrinks.tipTitle` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/milk-drinks-screen.test.tsx, src/core/__tests__/milk-drinks.test.ts |
| `TEKST` | `milkDrinks.ingredient.espresso` | `src/core/i18n.tsx` | ✅ | src/components/__tests__/MilkDrinkCard.test.tsx, src/core/__tests__/dialin-screen.test.tsx |
| `TEKST` | `milkDrinks.ingredient.milk` | `src/core/i18n.tsx` | ✅ | src/components/__tests__/MilkDrinkCard.test.tsx, src/core/__tests__/milk-drinks-screen.test.tsx |
| `TEKST` | `milkDrinks.ingredient.foam` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/milk-drinks-screen.test.tsx |
| `TEKST` | `milkDrinks.ingredient.syrup` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/milk-drinks-screen.test.tsx |
| `TEKST` | `milkDrinks.drinks.espresso.name` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `milkDrinks.drinks.espresso.description` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/audit-fixes.test.tsx |
| `TEKST` | `milkDrinks.drinks.espresso.step1` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/milk-drinks-screen.test.tsx, src/core/__tests__/property-based.test.ts |
| `TEKST` | `milkDrinks.drinks.espresso.step2` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/milk-drinks-screen.test.tsx, src/core/__tests__/property-based.test.ts |
| `TEKST` | `milkDrinks.drinks.espresso.tip` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/domain-rules.test.ts, src/core/__tests__/hand-vectors-domain.test.ts |
| `TEKST` | `milkDrinks.drinks.cappuccino.name` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `milkDrinks.drinks.cappuccino.description` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/audit-fixes.test.tsx |
| `TEKST` | `milkDrinks.drinks.cappuccino.step1` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/milk-drinks-screen.test.tsx, src/core/__tests__/property-based.test.ts |
| `TEKST` | `milkDrinks.drinks.cappuccino.step2` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/milk-drinks-screen.test.tsx, src/core/__tests__/property-based.test.ts |
| `TEKST` | `milkDrinks.drinks.cappuccino.step3` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/milk-drinks-screen.test.tsx |
| `TEKST` | `milkDrinks.drinks.cappuccino.step4` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/milk-drinks-screen.test.tsx |
| `TEKST` | `milkDrinks.drinks.cappuccino.step5` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/milk-drinks-screen.test.tsx |
| `TEKST` | `milkDrinks.drinks.cappuccino.tip` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/domain-rules.test.ts, src/core/__tests__/hand-vectors-domain.test.ts |
| `TEKST` | `milkDrinks.drinks.latte.name` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `milkDrinks.drinks.latte.description` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/audit-fixes.test.tsx |
| `TEKST` | `milkDrinks.drinks.latte.step1` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/milk-drinks-screen.test.tsx, src/core/__tests__/property-based.test.ts |
| `TEKST` | `milkDrinks.drinks.latte.step2` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/milk-drinks-screen.test.tsx, src/core/__tests__/property-based.test.ts |
| `TEKST` | `milkDrinks.drinks.latte.step3` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/milk-drinks-screen.test.tsx |
| `TEKST` | `milkDrinks.drinks.latte.step4` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/milk-drinks-screen.test.tsx |
| `TEKST` | `milkDrinks.drinks.latte.step5` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/milk-drinks-screen.test.tsx |
| `TEKST` | `milkDrinks.drinks.latte.tip` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/domain-rules.test.ts, src/core/__tests__/hand-vectors-domain.test.ts |
| `TEKST` | `milkDrinks.drinks.flatWhite.name` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `milkDrinks.drinks.flatWhite.description` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/audit-fixes.test.tsx |
| `TEKST` | `milkDrinks.drinks.flatWhite.step1` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/milk-drinks-screen.test.tsx, src/core/__tests__/property-based.test.ts |
| `TEKST` | `milkDrinks.drinks.flatWhite.step2` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/milk-drinks-screen.test.tsx, src/core/__tests__/property-based.test.ts |
| `TEKST` | `milkDrinks.drinks.flatWhite.step3` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/milk-drinks-screen.test.tsx |
| `TEKST` | `milkDrinks.drinks.flatWhite.step4` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/milk-drinks-screen.test.tsx |
| `TEKST` | `milkDrinks.drinks.flatWhite.step5` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/milk-drinks-screen.test.tsx |
| `TEKST` | `milkDrinks.drinks.flatWhite.tip` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/domain-rules.test.ts, src/core/__tests__/hand-vectors-domain.test.ts |
| `TEKST` | `milkDrinks.drinks.mocha.name` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `milkDrinks.drinks.mocha.description` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/audit-fixes.test.tsx |
| `TEKST` | `milkDrinks.drinks.mocha.step1` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/milk-drinks-screen.test.tsx, src/core/__tests__/property-based.test.ts |
| `TEKST` | `milkDrinks.drinks.mocha.step2` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/milk-drinks-screen.test.tsx, src/core/__tests__/property-based.test.ts |
| `TEKST` | `milkDrinks.drinks.mocha.step3` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/milk-drinks-screen.test.tsx |
| `TEKST` | `milkDrinks.drinks.mocha.step4` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/milk-drinks-screen.test.tsx |
| `TEKST` | `milkDrinks.drinks.mocha.step5` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/milk-drinks-screen.test.tsx |
| `TEKST` | `milkDrinks.drinks.mocha.tip` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/domain-rules.test.ts, src/core/__tests__/hand-vectors-domain.test.ts |
| `TEKST` | `recipeLink.title` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/backup-roundtrip.test.ts |
| `TEKST` | `recipeLink.invalid` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/brew-screen.test.tsx |
| `TEKST` | `recipeLink.preview` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/brew-screen.test.tsx, src/core/__tests__/recipe-link-route.test.tsx |
| `TEKST` | `recipeLink.method` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `recipeLink.dose` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/audit-fixes.test.tsx |
| `TEKST` | `recipeLink.water` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/audit-fixes.test.tsx |
| `TEKST` | `recipeLink.temperature` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/milk-drinks-screen.test.tsx, src/core/__tests__/recipe-link-route.test.tsx |
| `TEKST` | `recipeLink.steps` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `recipeLink.noSteps` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/recipe-link-route.test.tsx |
| `UI` | `recipeLink.saved` | `src/core/i18n.tsx` | ✅ | src/components/dialin/__tests__/CustomGrinderCard.test.tsx, src/components/dialin/__tests__/OwnWaterCard.test.tsx |
| `UI` | `recipeLink.saveFailed` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/recipe-link-route.test.tsx |
| `TEKST` | `recipeBuilder.titleNew` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts |
| `UI` | `recipeBuilder.titleEdit` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts |
| `TEKST` | `recipeBuilder.nameLabel` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts |
| `TEKST` | `recipeBuilder.namePlaceholder` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts |
| `TEKST` | `recipeBuilder.typeLabel` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts |
| `TEKST` | `recipeBuilder.coffee` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/audit-fixes.test.tsx |
| `TEKST` | `recipeBuilder.tea` | `src/core/i18n.tsx` | ✅ | tests/backup-roundtrip.test.ts, tests/matrix-coverage-gap.test.tsx |
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
| `TEKST` | `recipeBuilder.stepDurationSec` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts |
| `TEKST` | `recipeBuilder.stepWaterGrams` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts |
| `TEKST` | `recipeBuilder.stepInstruction` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts |
| `TEKST` | `recipeBuilder.stepInstructionPlaceholder` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts |
| `UI` | `recipeBuilder.saveRecipeBtn` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts |
| `UI` | `recipeBuilder.deleteRecipeConfirmTitle` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts |
| `UI` | `recipeBuilder.deleteRecipeConfirmMsg` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts |
| `TEKST` | `recipeBuilder.fillRequired` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/i18n.test.ts |
| `UI` | `recipeBuilder.duplicateBtn` | `src/core/i18n.tsx` | ✅ | src/core/__tests__/brew-screen.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `stash.title` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/backup-roundtrip.test.ts |
| `TEKST` | `stash.addNew` | `src/core/i18n.tsx` | ✅ | src/components/brew/__tests__/BrewHeader.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `stash.freshness` | `src/core/i18n.tsx` | ✅ | src/components/brew/__tests__/BrewHeader.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `stash.restingWindow` | `src/core/i18n.tsx` | ✅ | src/components/brew/__tests__/BrewHeader.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `stash.peakWindow` | `src/core/i18n.tsx` | ✅ | src/components/brew/__tests__/BrewHeader.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `stash.pastPeak` | `src/core/i18n.tsx` | ✅ | src/components/brew/__tests__/BrewHeader.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `stash.tooFresh` | `src/core/i18n.tsx` | ✅ | src/components/brew/__tests__/BrewHeader.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `stash.readyToBrew` | `src/core/i18n.tsx` | ✅ | src/components/brew/__tests__/BrewHeader.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `stash.remainingGrams` | `src/core/i18n.tsx` | ✅ | src/components/brew/__tests__/BrewHeader.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `stash.initialGrams` | `src/core/i18n.tsx` | ✅ | src/components/brew/__tests__/BrewHeader.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `stash.roaster` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `stash.origin` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `stash.variety` | `src/core/i18n.tsx` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
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
| `TEKST` | `journal.title` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/backup-roundtrip.test.ts |
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
| `TEKST` | `dialin.title` | `src/core/i18n.tsx` | ✅ | tests/audit-fixes.test.tsx, tests/backup-roundtrip.test.ts |
| `TEKST` | `dialin.subtitle` | `src/core/i18n.tsx` | ✅ | src/components/craft/__tests__/CraftComponents.test.tsx, src/components/settings/__tests__/GrinderSelectionCard.test.tsx |
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

*(... i 573 kolejnych elementów w pełnym wykazie)*

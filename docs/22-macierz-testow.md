# Macierz Testów (AST Coverage Matrix) — NAPAR (STEEPWISE)

Wygenerowano automatycznie przez `scripts/test-matrix.mjs` zgodnie z wymaganiami **BR-TEST-028..031**.
Zasada dowodu: wyłącznie wykonywalny kod testu (wycięte komentarze, importy i opisy `test`/`describe`).

## Podsumowanie Pokrycia

| Kategoria | Łącznie | Pokryte | Pokrycie % | Status |
| :--- | :---: | :---: | :---: | :---: |
| **EKRAN** | 11 | 11 | **100.0%** | ✅ POKRYTE |
| **UI** | 69 | 69 | **100.0%** | ✅ POKRYTE |
| **TEKST** | 435 | 435 | **100.0%** | ✅ POKRYTE |
| **LOGIKA** | 278 | 278 | **100.0%** | ✅ POKRYTE |
| **WYMIAR** | 90 | 90 | **100.0%** | ✅ POKRYTE |

Łącznie elementów: **883** | Pokrytych: **883** | Brakujących: **0**

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
| `TEKST` | `appName` | `locales/pl.json` | ✅ | tests/airplane-mode.test.ts, tests/audit-fixes.test.tsx |
| `TEKST` | `appTagline` | `locales/pl.json` | ✅ | tests/airplane-mode.test.ts, tests/audit-fixes.test.tsx |
| `UI` | `common.cancel` | `locales/pl.json` | ✅ | tests/close-button-guard.test.tsx, tests/recipe-select-inline.test.tsx |
| `UI` | `common.save` | `locales/pl.json` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `UI` | `common.delete` | `locales/pl.json` | ✅ | tests/audit-fixes.test.tsx, tests/backup-roundtrip.test.ts |
| `UI` | `common.edit` | `locales/pl.json` | ✅ | tests/recipe-select-inline.test.tsx, tests/state-sequences.test.ts |
| `UI` | `common.close` | `locales/pl.json` | ✅ | tests/audit-fixes.test.tsx, tests/bpr-components.test.tsx |
| `UI` | `common.confirm` | `locales/pl.json` | ✅ | tests/audit-fixes.test.tsx, tests/interaction-guards.test.ts |
| `UI` | `common.back` | `locales/pl.json` | ✅ | tests/airplane-mode.test.ts, tests/audit-fixes.test.tsx |
| `UI` | `common.next` | `locales/pl.json` | ✅ | tests/audit-fixes.test.tsx, tests/bpr-components.test.tsx |
| `UI` | `common.finish` | `locales/pl.json` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `UI` | `common.ok` | `locales/pl.json` | ✅ | tests/audit-fixes.test.tsx, tests/backup-roundtrip.test.ts |
| `UI` | `common.timerStepWarning` | `locales/pl.json` | ✅ | tests/recipe-select-inline.test.tsx, src/core/__tests__/domain-coverage-edge-cases.test.tsx |
| `UI` | `common.stepFinished` | `locales/pl.json` | ✅ | tests/recipe-select-inline.test.tsx, src/core/__tests__/domain-coverage-edge-cases.test.tsx |
| `UI` | `common.brewingFinished` | `locales/pl.json` | ✅ | tests/recipe-select-inline.test.tsx, src/core/__tests__/domain-coverage-edge-cases.test.tsx |
| `UI` | `common.grams` | `locales/pl.json` | ✅ | tests/recipe-select-inline.test.tsx, src/core/__tests__/domain-coverage-edge-cases.test.tsx |
| `UI` | `common.seconds` | `locales/pl.json` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `UI` | `common.celsius` | `locales/pl.json` | ✅ | tests/recipe-select-inline.test.tsx, src/core/__tests__/domain-coverage-edge-cases.test.tsx |
| `TEKST` | `tabs.brew` | `locales/pl.json` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `tabs.beans` | `locales/pl.json` | ✅ | tests/interaction-guards.test.ts, tests/state-sequences.test.ts |
| `TEKST` | `tabs.journal` | `locales/pl.json` | ✅ | tests/interaction-guards.test.ts, src/components/icons/__tests__/CraftIcons.test.tsx |
| `TEKST` | `tabs.dialin` | `locales/pl.json` | ✅ | src/core/__tests__/i18n.test.ts, src/core/__tests__/milk-drinks-screen.test.tsx |
| `TEKST` | `tabs.caffeine` | `locales/pl.json` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `tabs.settings` | `locales/pl.json` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `brew.recipe` | `locales/pl.json` | ✅ | tests/airplane-mode.test.ts, tests/audit-fixes.test.tsx |
| `TEKST` | `brew.chooseRecipe` | `locales/pl.json` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `brew.customRecipe` | `locales/pl.json` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `brew.stashItem` | `locales/pl.json` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `brew.chooseStash` | `locales/pl.json` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `brew.noStashItem` | `locales/pl.json` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `brew.noStashDesc` | `locales/pl.json` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `brew.remaining` | `locales/pl.json` | ✅ | tests/airplane-mode.test.ts, tests/audit-fixes.test.tsx |
| `TEKST` | `brew.dose` | `locales/pl.json` | ✅ | tests/airplane-mode.test.ts, tests/audit-fixes.test.tsx |
| `TEKST` | `brew.water` | `locales/pl.json` | ✅ | tests/airplane-mode.test.ts, tests/audit-fixes.test.tsx |
| `TEKST` | `brew.ratio` | `locales/pl.json` | ✅ | tests/airplane-mode.test.ts, tests/audit-fixes.test.tsx |
| `TEKST` | `brew.temp` | `locales/pl.json` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `brew.grind` | `locales/pl.json` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `brew.timerReady` | `locales/pl.json` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `brew.pourRateTarget` | `locales/pl.json` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `brew.startBrew` | `locales/pl.json` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `brew.pauseBrew` | `locales/pl.json` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `brew.resumeBrew` | `locales/pl.json` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `brew.resetBrew` | `locales/pl.json` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `brew.tastingNotesCard` | `locales/pl.json` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `brew.ratingLabel` | `locales/pl.json` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `brew.tasteBalanceLabel` | `locales/pl.json` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `brew.flavorWheelLabel` | `locales/pl.json` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `brew.tdsInputLabel` | `locales/pl.json` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `UI` | `brew.extractionYield` | `locales/pl.json` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `brew.notesPlaceholder` | `locales/pl.json` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `UI` | `brew.saveSession` | `locales/pl.json` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `UI` | `brew.sessionSaved` | `locales/pl.json` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `UI` | `brew.selectGrinder` | `locales/pl.json` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `brew.grinderModalTitle` | `locales/pl.json` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `brew.grinderModalDesc` | `locales/pl.json` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `brew.shareRecipe` | `locales/pl.json` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `brew.importRecipe` | `locales/pl.json` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `brew.qrModalTitle` | `locales/pl.json` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `brew.qrModalDesc` | `locales/pl.json` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `brew.qrCopyLink` | `locales/pl.json` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `brew.qrShareLink` | `locales/pl.json` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `brew.qrCopied` | `locales/pl.json` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `brew.qrCopyFailed` | `locales/pl.json` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `brew.importModalTitle` | `locales/pl.json` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `brew.importModalDesc` | `locales/pl.json` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `brew.importInputPlaceholder` | `locales/pl.json` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `UI` | `brew.importActionBtn` | `locales/pl.json` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `brew.importError` | `locales/pl.json` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `brew.importSuccess` | `locales/pl.json` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `brew.duplicateRecipe` | `locales/pl.json` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `brew.duplicateSuccess` | `locales/pl.json` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `brew.addTime10` | `locales/pl.json` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `brew.subTime10` | `locales/pl.json` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `gongfu.modeTitle` | `locales/pl.json` | ✅ | tests/audit-fixes.test.tsx, src/components/__tests__/gongfu-setup-units.test.tsx |
| `TEKST` | `gongfu.modeDesc` | `locales/pl.json` | ✅ | tests/audit-fixes.test.tsx, src/components/__tests__/gongfu-setup-units.test.tsx |
| `TEKST` | `gongfu.infusionNumber` | `locales/pl.json` | ✅ | tests/audit-fixes.test.tsx, tests/backup-roundtrip.test.ts |
| `TEKST` | `gongfu.rinseTitle` | `locales/pl.json` | ✅ | tests/audit-fixes.test.tsx, src/components/__tests__/gongfu-setup-units.test.tsx |
| `TEKST` | `gongfu.rinseDesc` | `locales/pl.json` | ✅ | tests/audit-fixes.test.tsx, src/components/__tests__/gongfu-setup-units.test.tsx |
| `TEKST` | `gongfu.rinseCompleted` | `locales/pl.json` | ✅ | tests/audit-fixes.test.tsx, src/components/__tests__/gongfu-setup-units.test.tsx |
| `TEKST` | `gongfu.leafDose` | `locales/pl.json` | ✅ | tests/audit-fixes.test.tsx, src/components/__tests__/gongfu-setup-units.test.tsx |
| `TEKST` | `gongfu.vesselCapacity` | `locales/pl.json` | ✅ | tests/audit-fixes.test.tsx, src/components/__tests__/gongfu-setup-units.test.tsx |
| `TEKST` | `gongfu.waterTemp` | `locales/pl.json` | ✅ | tests/airplane-mode.test.ts, tests/audit-fixes.test.tsx |
| `TEKST` | `gongfu.steepCountdown` | `locales/pl.json` | ✅ | tests/audit-fixes.test.tsx, src/components/__tests__/gongfu-setup-units.test.tsx |
| `TEKST` | `gongfu.pourNow` | `locales/pl.json` | ✅ | tests/audit-fixes.test.tsx, src/components/__tests__/gongfu-setup-units.test.tsx |
| `TEKST` | `gongfu.startSteep` | `locales/pl.json` | ✅ | tests/audit-fixes.test.tsx, src/components/__tests__/gongfu-setup-units.test.tsx |
| `UI` | `gongfu.nextInfusion` | `locales/pl.json` | ✅ | tests/audit-fixes.test.tsx, src/components/__tests__/gongfu-setup-units.test.tsx |
| `TEKST` | `gongfu.addSeconds` | `locales/pl.json` | ✅ | tests/audit-fixes.test.tsx, src/components/__tests__/gongfu-setup-units.test.tsx |
| `TEKST` | `gongfu.subSeconds` | `locales/pl.json` | ✅ | tests/audit-fixes.test.tsx, src/components/__tests__/gongfu-setup-units.test.tsx |
| `TEKST` | `gongfu.infusionNotes` | `locales/pl.json` | ✅ | tests/audit-fixes.test.tsx, src/components/__tests__/gongfu-setup-units.test.tsx |
| `TEKST` | `gongfu.infusionNotesPlaceholder` | `locales/pl.json` | ✅ | tests/audit-fixes.test.tsx, src/components/__tests__/gongfu-setup-units.test.tsx |
| `TEKST` | `gongfu.sessionHistory` | `locales/pl.json` | ✅ | tests/audit-fixes.test.tsx, src/components/__tests__/gongfu-setup-units.test.tsx |
| `TEKST` | `gongfu.totalCaffeine` | `locales/pl.json` | ✅ | tests/audit-fixes.test.tsx, src/components/__tests__/gongfu-setup-units.test.tsx |
| `TEKST` | `gongfu.infusionCaffeine` | `locales/pl.json` | ✅ | tests/audit-fixes.test.tsx, src/components/__tests__/gongfu-setup-units.test.tsx |
| `UI` | `gongfu.finishSession` | `locales/pl.json` | ✅ | tests/audit-fixes.test.tsx, src/components/__tests__/gongfu-setup-units.test.tsx |
| `TEKST` | `tastingCard.title` | `locales/pl.json` | ✅ | tests/audit-fixes.test.tsx, tests/backup-roundtrip.test.ts |
| `TEKST` | `tastingCard.brand` | `locales/pl.json` | ✅ | tests/audit-fixes.test.tsx, tests/brands.contract.test.ts |
| `TEKST` | `tastingCard.dose` | `locales/pl.json` | ✅ | tests/airplane-mode.test.ts, tests/audit-fixes.test.tsx |
| `TEKST` | `tastingCard.water` | `locales/pl.json` | ✅ | tests/airplane-mode.test.ts, tests/audit-fixes.test.tsx |
| `TEKST` | `tastingCard.temperature` | `locales/pl.json` | ✅ | src/core/__tests__/milk-drinks-screen.test.tsx |
| `TEKST` | `tastingCard.time` | `locales/pl.json` | ✅ | tests/airplane-mode.test.ts, tests/audit-fixes.test.tsx |
| `TEKST` | `tastingCard.rating` | `locales/pl.json` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `tastingCard.balance` | `locales/pl.json` | ✅ | tests/backup-roundtrip.test.ts, src/components/__tests__/TastingCardView.test.tsx |
| `TEKST` | `tastingCard.yield` | `locales/pl.json` | ✅ | tests/oracle-coffee.test.ts, src/components/dialin/__tests__/BrewRatioTab.test.tsx |
| `TEKST` | `tastingCard.inventory` | `locales/pl.json` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `tastingCard.flavorNotes` | `locales/pl.json` | ✅ | tests/backup-roundtrip.test.ts, tests/bpr-components.test.tsx |
| `TEKST` | `tastingCard.notes` | `locales/pl.json` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `tastingCard.footer` | `locales/pl.json` | ✅ | src/components/craft/__tests__/CraftComponents.test.tsx, src/core/__tests__/milk-drinks-screen.test.tsx |
| `TEKST` | `tastingCard.balanceLabel.balanced` | `locales/pl.json` | ✅ | tests/backup-roundtrip.test.ts, src/components/__tests__/TastingCardView.test.tsx |
| `TEKST` | `tastingCard.balanceLabel.sour` | `locales/pl.json` | ✅ | tests/backup-roundtrip.test.ts, tests/helpers/sqljs-port.ts |
| `TEKST` | `tastingCard.balanceLabel.bitter` | `locales/pl.json` | ✅ | src/components/__tests__/TastingCardView.test.tsx, src/components/brew/__tests__/BrewFinishModal.test.tsx |
| `TEKST` | `tastingCard.balanceLabel.astringent` | `locales/pl.json` | ✅ | src/components/__tests__/TastingCardView.test.tsx, src/core/__tests__/dialin-screen.test.tsx |
| `TEKST` | `tastingCard.balanceLabel.weak` | `locales/pl.json` | ✅ | src/components/__tests__/TastingCardView.test.tsx, src/components/brew/__tests__/BrewFinishModal.test.tsx |
| `TEKST` | `tastingCard.balanceLabel.too_strong` | `locales/pl.json` | ✅ | src/components/__tests__/TastingCardView.test.tsx, src/core/__tests__/milk-drinks-screen.test.tsx |
| `TEKST` | `milkDrinks.title` | `locales/pl.json` | ✅ | tests/audit-fixes.test.tsx, tests/backup-roundtrip.test.ts |
| `TEKST` | `milkDrinks.entry` | `locales/pl.json` | ✅ | tests/touch-target-scan.test.ts, src/core/__tests__/contracts.test.ts |
| `TEKST` | `milkDrinks.intro` | `locales/pl.json` | ✅ | src/core/__tests__/milk-drinks-screen.test.tsx, src/core/__tests__/milk-drinks.test.ts |
| `TEKST` | `milkDrinks.cupLabel` | `locales/pl.json` | ✅ | src/core/__tests__/milk-drinks-screen.test.tsx, src/core/__tests__/milk-drinks.test.ts |
| `TEKST` | `milkDrinks.cupValue` | `locales/pl.json` | ✅ | src/core/__tests__/milk-drinks-screen.test.tsx, src/core/__tests__/milk-drinks.test.ts |
| `TEKST` | `milkDrinks.cupSmaller` | `locales/pl.json` | ✅ | src/core/__tests__/milk-drinks-screen.test.tsx, src/core/__tests__/milk-drinks.test.ts |
| `TEKST` | `milkDrinks.cupLarger` | `locales/pl.json` | ✅ | src/core/__tests__/milk-drinks-screen.test.tsx, src/core/__tests__/milk-drinks.test.ts |
| `TEKST` | `milkDrinks.fixedCup` | `locales/pl.json` | ✅ | src/core/__tests__/milk-drinks-screen.test.tsx, src/core/__tests__/milk-drinks.test.ts |
| `TEKST` | `milkDrinks.ingredients` | `locales/pl.json` | ✅ | src/core/__tests__/milk-drinks-screen.test.tsx, src/core/__tests__/milk-drinks.test.ts |
| `TEKST` | `milkDrinks.milkTemperature` | `locales/pl.json` | ✅ | src/core/__tests__/milk-drinks-screen.test.tsx, src/core/__tests__/milk-drinks.test.ts |
| `TEKST` | `milkDrinks.milkTemperatureNote` | `locales/pl.json` | ✅ | src/core/__tests__/milk-drinks-screen.test.tsx, src/core/__tests__/milk-drinks.test.ts |
| `TEKST` | `milkDrinks.noMilk` | `locales/pl.json` | ✅ | src/core/__tests__/milk-drinks-screen.test.tsx, src/core/__tests__/milk-drinks.test.ts |
| `TEKST` | `milkDrinks.steps` | `locales/pl.json` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `milkDrinks.tipTitle` | `locales/pl.json` | ✅ | src/core/__tests__/milk-drinks-screen.test.tsx, src/core/__tests__/milk-drinks.test.ts |
| `TEKST` | `milkDrinks.ingredient.espresso` | `locales/pl.json` | ✅ | src/components/__tests__/MilkDrinkCard.test.tsx, src/core/__tests__/dialin-screen.test.tsx |
| `TEKST` | `milkDrinks.ingredient.milk` | `locales/pl.json` | ✅ | src/components/__tests__/MilkDrinkCard.test.tsx, src/core/__tests__/milk-drinks-screen.test.tsx |
| `TEKST` | `milkDrinks.ingredient.foam` | `locales/pl.json` | ✅ | src/core/__tests__/milk-drinks-screen.test.tsx |
| `TEKST` | `milkDrinks.ingredient.syrup` | `locales/pl.json` | ✅ | src/core/__tests__/milk-drinks-screen.test.tsx |
| `TEKST` | `milkDrinks.drinks.espresso.name` | `locales/pl.json` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `milkDrinks.drinks.espresso.description` | `locales/pl.json` | ✅ | tests/airplane-mode.test.ts, tests/audit-fixes.test.tsx |
| `TEKST` | `milkDrinks.drinks.espresso.step1` | `locales/pl.json` | ✅ | src/core/__tests__/milk-drinks-screen.test.tsx, src/core/__tests__/property-based.test.ts |
| `TEKST` | `milkDrinks.drinks.espresso.step2` | `locales/pl.json` | ✅ | src/core/__tests__/milk-drinks-screen.test.tsx, src/core/__tests__/property-based.test.ts |
| `TEKST` | `milkDrinks.drinks.espresso.tip` | `locales/pl.json` | ✅ | src/core/__tests__/domain-rules.test.ts, src/core/__tests__/hand-vectors-domain.test.ts |
| `TEKST` | `milkDrinks.drinks.cappuccino.name` | `locales/pl.json` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `milkDrinks.drinks.cappuccino.description` | `locales/pl.json` | ✅ | tests/airplane-mode.test.ts, tests/audit-fixes.test.tsx |
| `TEKST` | `milkDrinks.drinks.cappuccino.step1` | `locales/pl.json` | ✅ | src/core/__tests__/milk-drinks-screen.test.tsx, src/core/__tests__/property-based.test.ts |
| `TEKST` | `milkDrinks.drinks.cappuccino.step2` | `locales/pl.json` | ✅ | src/core/__tests__/milk-drinks-screen.test.tsx, src/core/__tests__/property-based.test.ts |
| `TEKST` | `milkDrinks.drinks.cappuccino.step3` | `locales/pl.json` | ✅ | src/core/__tests__/milk-drinks-screen.test.tsx |
| `TEKST` | `milkDrinks.drinks.cappuccino.step4` | `locales/pl.json` | ✅ | src/core/__tests__/milk-drinks-screen.test.tsx |
| `TEKST` | `milkDrinks.drinks.cappuccino.step5` | `locales/pl.json` | ✅ | src/core/__tests__/milk-drinks-screen.test.tsx |
| `TEKST` | `milkDrinks.drinks.cappuccino.tip` | `locales/pl.json` | ✅ | src/core/__tests__/domain-rules.test.ts, src/core/__tests__/hand-vectors-domain.test.ts |
| `TEKST` | `milkDrinks.drinks.latte.name` | `locales/pl.json` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `milkDrinks.drinks.latte.description` | `locales/pl.json` | ✅ | tests/airplane-mode.test.ts, tests/audit-fixes.test.tsx |
| `TEKST` | `milkDrinks.drinks.latte.step1` | `locales/pl.json` | ✅ | src/core/__tests__/milk-drinks-screen.test.tsx, src/core/__tests__/property-based.test.ts |
| `TEKST` | `milkDrinks.drinks.latte.step2` | `locales/pl.json` | ✅ | src/core/__tests__/milk-drinks-screen.test.tsx, src/core/__tests__/property-based.test.ts |
| `TEKST` | `milkDrinks.drinks.latte.step3` | `locales/pl.json` | ✅ | src/core/__tests__/milk-drinks-screen.test.tsx |
| `TEKST` | `milkDrinks.drinks.latte.step4` | `locales/pl.json` | ✅ | src/core/__tests__/milk-drinks-screen.test.tsx |
| `TEKST` | `milkDrinks.drinks.latte.step5` | `locales/pl.json` | ✅ | src/core/__tests__/milk-drinks-screen.test.tsx |
| `TEKST` | `milkDrinks.drinks.latte.tip` | `locales/pl.json` | ✅ | src/core/__tests__/domain-rules.test.ts, src/core/__tests__/hand-vectors-domain.test.ts |
| `TEKST` | `milkDrinks.drinks.flatWhite.name` | `locales/pl.json` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `milkDrinks.drinks.flatWhite.description` | `locales/pl.json` | ✅ | tests/airplane-mode.test.ts, tests/audit-fixes.test.tsx |
| `TEKST` | `milkDrinks.drinks.flatWhite.step1` | `locales/pl.json` | ✅ | src/core/__tests__/milk-drinks-screen.test.tsx, src/core/__tests__/property-based.test.ts |
| `TEKST` | `milkDrinks.drinks.flatWhite.step2` | `locales/pl.json` | ✅ | src/core/__tests__/milk-drinks-screen.test.tsx, src/core/__tests__/property-based.test.ts |
| `TEKST` | `milkDrinks.drinks.flatWhite.step3` | `locales/pl.json` | ✅ | src/core/__tests__/milk-drinks-screen.test.tsx |
| `TEKST` | `milkDrinks.drinks.flatWhite.step4` | `locales/pl.json` | ✅ | src/core/__tests__/milk-drinks-screen.test.tsx |
| `TEKST` | `milkDrinks.drinks.flatWhite.step5` | `locales/pl.json` | ✅ | src/core/__tests__/milk-drinks-screen.test.tsx |
| `TEKST` | `milkDrinks.drinks.flatWhite.tip` | `locales/pl.json` | ✅ | src/core/__tests__/domain-rules.test.ts, src/core/__tests__/hand-vectors-domain.test.ts |
| `TEKST` | `milkDrinks.drinks.mocha.name` | `locales/pl.json` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `milkDrinks.drinks.mocha.description` | `locales/pl.json` | ✅ | tests/airplane-mode.test.ts, tests/audit-fixes.test.tsx |
| `TEKST` | `milkDrinks.drinks.mocha.step1` | `locales/pl.json` | ✅ | src/core/__tests__/milk-drinks-screen.test.tsx, src/core/__tests__/property-based.test.ts |
| `TEKST` | `milkDrinks.drinks.mocha.step2` | `locales/pl.json` | ✅ | src/core/__tests__/milk-drinks-screen.test.tsx, src/core/__tests__/property-based.test.ts |
| `TEKST` | `milkDrinks.drinks.mocha.step3` | `locales/pl.json` | ✅ | src/core/__tests__/milk-drinks-screen.test.tsx |
| `TEKST` | `milkDrinks.drinks.mocha.step4` | `locales/pl.json` | ✅ | src/core/__tests__/milk-drinks-screen.test.tsx |
| `TEKST` | `milkDrinks.drinks.mocha.step5` | `locales/pl.json` | ✅ | src/core/__tests__/milk-drinks-screen.test.tsx |
| `TEKST` | `milkDrinks.drinks.mocha.tip` | `locales/pl.json` | ✅ | src/core/__tests__/domain-rules.test.ts, src/core/__tests__/hand-vectors-domain.test.ts |
| `TEKST` | `recipeLink.title` | `locales/pl.json` | ✅ | tests/audit-fixes.test.tsx, tests/backup-roundtrip.test.ts |
| `TEKST` | `recipeLink.invalid` | `locales/pl.json` | ✅ | tests/audit-fixes.test.tsx, src/core/__tests__/brew-screen.test.tsx |
| `TEKST` | `recipeLink.preview` | `locales/pl.json` | ✅ | src/core/__tests__/brew-screen.test.tsx, src/core/__tests__/recipe-link-route.test.tsx |
| `TEKST` | `recipeLink.method` | `locales/pl.json` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `recipeLink.dose` | `locales/pl.json` | ✅ | tests/airplane-mode.test.ts, tests/audit-fixes.test.tsx |
| `TEKST` | `recipeLink.water` | `locales/pl.json` | ✅ | tests/airplane-mode.test.ts, tests/audit-fixes.test.tsx |
| `TEKST` | `recipeLink.temperature` | `locales/pl.json` | ✅ | src/core/__tests__/milk-drinks-screen.test.tsx, src/core/__tests__/recipe-link-route.test.tsx |
| `TEKST` | `recipeLink.steps` | `locales/pl.json` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `recipeLink.noSteps` | `locales/pl.json` | ✅ | src/core/__tests__/recipe-link-route.test.tsx |
| `UI` | `recipeLink.saved` | `locales/pl.json` | ✅ | src/components/dialin/__tests__/CustomGrinderCard.test.tsx, src/components/dialin/__tests__/OwnWaterCard.test.tsx |
| `UI` | `recipeLink.saveFailed` | `locales/pl.json` | ✅ | src/core/__tests__/recipe-link-route.test.tsx |
| `TEKST` | `recipeBuilder.titleNew` | `locales/pl.json` | ✅ | src/core/__tests__/i18n.test.ts |
| `UI` | `recipeBuilder.titleEdit` | `locales/pl.json` | ✅ | src/core/__tests__/i18n.test.ts |
| `TEKST` | `recipeBuilder.nameLabel` | `locales/pl.json` | ✅ | src/core/__tests__/i18n.test.ts |
| `TEKST` | `recipeBuilder.namePlaceholder` | `locales/pl.json` | ✅ | src/core/__tests__/i18n.test.ts |
| `TEKST` | `recipeBuilder.typeLabel` | `locales/pl.json` | ✅ | src/core/__tests__/i18n.test.ts |
| `TEKST` | `recipeBuilder.coffee` | `locales/pl.json` | ✅ | tests/airplane-mode.test.ts, tests/audit-fixes.test.tsx |
| `TEKST` | `recipeBuilder.tea` | `locales/pl.json` | ✅ | tests/backup-roundtrip.test.ts, tests/matrix-coverage-gap.test.tsx |
| `TEKST` | `recipeBuilder.methodLabel` | `locales/pl.json` | ✅ | src/core/__tests__/i18n.test.ts |
| `TEKST` | `recipeBuilder.methodPlaceholder` | `locales/pl.json` | ✅ | src/core/__tests__/i18n.test.ts |
| `TEKST` | `recipeBuilder.authorLabel` | `locales/pl.json` | ✅ | src/core/__tests__/i18n.test.ts |
| `TEKST` | `recipeBuilder.authorPlaceholder` | `locales/pl.json` | ✅ | src/core/__tests__/i18n.test.ts |
| `TEKST` | `recipeBuilder.descriptionLabel` | `locales/pl.json` | ✅ | src/core/__tests__/i18n.test.ts |
| `TEKST` | `recipeBuilder.descriptionPlaceholder` | `locales/pl.json` | ✅ | src/core/__tests__/i18n.test.ts |
| `TEKST` | `recipeBuilder.doseLabel` | `locales/pl.json` | ✅ | src/core/__tests__/i18n.test.ts |
| `TEKST` | `recipeBuilder.waterLabel` | `locales/pl.json` | ✅ | src/core/__tests__/i18n.test.ts |
| `TEKST` | `recipeBuilder.tempLabel` | `locales/pl.json` | ✅ | src/core/__tests__/i18n.test.ts |
| `TEKST` | `recipeBuilder.grindLabel` | `locales/pl.json` | ✅ | src/core/__tests__/i18n.test.ts |
| `TEKST` | `recipeBuilder.grindPlaceholder` | `locales/pl.json` | ✅ | src/core/__tests__/i18n.test.ts |
| `TEKST` | `recipeBuilder.stepsTitle` | `locales/pl.json` | ✅ | src/core/__tests__/i18n.test.ts |
| `TEKST` | `recipeBuilder.addStep` | `locales/pl.json` | ✅ | src/core/__tests__/i18n.test.ts, src/core/__tests__/recipe-builder.test.tsx |
| `TEKST` | `recipeBuilder.removeStep` | `locales/pl.json` | ✅ | src/core/__tests__/i18n.test.ts |
| `TEKST` | `recipeBuilder.stepTimeSec` | `locales/pl.json` | ✅ | src/core/__tests__/i18n.test.ts |
| `TEKST` | `recipeBuilder.stepDurationSec` | `locales/pl.json` | ✅ | src/core/__tests__/i18n.test.ts |
| `TEKST` | `recipeBuilder.stepWaterGrams` | `locales/pl.json` | ✅ | src/core/__tests__/i18n.test.ts |
| `TEKST` | `recipeBuilder.stepInstruction` | `locales/pl.json` | ✅ | src/core/__tests__/i18n.test.ts |
| `TEKST` | `recipeBuilder.stepInstructionPlaceholder` | `locales/pl.json` | ✅ | src/core/__tests__/i18n.test.ts |
| `UI` | `recipeBuilder.saveRecipeBtn` | `locales/pl.json` | ✅ | src/core/__tests__/i18n.test.ts |
| `UI` | `recipeBuilder.deleteRecipeConfirmTitle` | `locales/pl.json` | ✅ | src/core/__tests__/i18n.test.ts |
| `UI` | `recipeBuilder.deleteRecipeConfirmMsg` | `locales/pl.json` | ✅ | src/core/__tests__/i18n.test.ts |
| `TEKST` | `recipeBuilder.fillRequired` | `locales/pl.json` | ✅ | src/core/__tests__/i18n.test.ts |
| `UI` | `recipeBuilder.duplicateBtn` | `locales/pl.json` | ✅ | src/core/__tests__/brew-screen.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `stash.title` | `locales/pl.json` | ✅ | tests/audit-fixes.test.tsx, tests/backup-roundtrip.test.ts |
| `TEKST` | `stash.addNew` | `locales/pl.json` | ✅ | src/components/brew/__tests__/BrewHeader.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `stash.freshness` | `locales/pl.json` | ✅ | src/components/brew/__tests__/BrewHeader.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `stash.restingWindow` | `locales/pl.json` | ✅ | src/components/brew/__tests__/BrewHeader.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `stash.peakWindow` | `locales/pl.json` | ✅ | src/components/brew/__tests__/BrewHeader.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `stash.pastPeak` | `locales/pl.json` | ✅ | src/components/brew/__tests__/BrewHeader.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `stash.tooFresh` | `locales/pl.json` | ✅ | src/components/brew/__tests__/BrewHeader.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `stash.readyToBrew` | `locales/pl.json` | ✅ | src/components/brew/__tests__/BrewHeader.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `stash.remainingGrams` | `locales/pl.json` | ✅ | src/components/brew/__tests__/BrewHeader.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `stash.initialGrams` | `locales/pl.json` | ✅ | src/components/brew/__tests__/BrewHeader.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `stash.roaster` | `locales/pl.json` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `stash.origin` | `locales/pl.json` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `stash.variety` | `locales/pl.json` | ✅ | tests/airplane-mode.test.ts, tests/backup-roundtrip.test.ts |
| `TEKST` | `stash.process` | `locales/pl.json` | ✅ | tests/airplane-mode.test.ts, tests/audit-fixes.test.tsx |
| `TEKST` | `stash.roastDate` | `locales/pl.json` | ✅ | tests/airplane-mode.test.ts, tests/state-sequences.test.ts |
| `TEKST` | `stash.compendium` | `locales/pl.json` | ✅ | src/components/brew/__tests__/BrewHeader.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `stash.compendiumSubtitle` | `locales/pl.json` | ✅ | src/components/brew/__tests__/BrewHeader.test.tsx, src/core/__tests__/i18n.test.ts |
| `UI` | `stash.edit` | `locales/pl.json` | ✅ | tests/state-sequences.test.ts, src/components/beans/__tests__/BeanEditModal.test.tsx |
| `UI` | `stash.editTitle` | `locales/pl.json` | ✅ | src/components/brew/__tests__/BrewHeader.test.tsx, src/core/__tests__/i18n.test.ts |
| `UI` | `stash.saveChanges` | `locales/pl.json` | ✅ | src/components/brew/__tests__/BrewHeader.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `stash.archivePrompt` | `locales/pl.json` | ✅ | src/components/brew/__tests__/BrewHeader.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `stash.archiveNow` | `locales/pl.json` | ✅ | src/components/brew/__tests__/BrewHeader.test.tsx, src/core/__tests__/i18n.test.ts |
| `UI` | `stash.markFinished` | `locales/pl.json` | ✅ | src/components/brew/__tests__/BrewHeader.test.tsx, src/core/__tests__/i18n.test.ts |
| `UI` | `stash.deletePack` | `locales/pl.json` | ✅ | src/components/brew/__tests__/BrewHeader.test.tsx, src/core/__tests__/i18n.test.ts |
| `UI` | `stash.deletePackConfirmTitle` | `locales/pl.json` | ✅ | src/components/brew/__tests__/BrewHeader.test.tsx, src/core/__tests__/i18n.test.ts |
| `UI` | `stash.deletePackConfirmMsg` | `locales/pl.json` | ✅ | src/components/brew/__tests__/BrewHeader.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `stash.weightAdjust` | `locales/pl.json` | ✅ | src/components/brew/__tests__/BrewHeader.test.tsx, src/core/__tests__/i18n.test.ts |
| `TEKST` | `journal.title` | `locales/pl.json` | ✅ | tests/audit-fixes.test.tsx, tests/backup-roundtrip.test.ts |
| `TEKST` | `journal.emptyTitle` | `locales/pl.json` | ✅ | tests/interaction-guards.test.ts, src/components/icons/__tests__/CraftIcons.test.tsx |
| `TEKST` | `journal.emptySub` | `locales/pl.json` | ✅ | tests/interaction-guards.test.ts, src/components/icons/__tests__/CraftIcons.test.tsx |
| `TEKST` | `journal.avgRating` | `locales/pl.json` | ✅ | tests/interaction-guards.test.ts, tests/workflow-hooks-matrix.test.tsx |
| `TEKST` | `journal.totalBrews` | `locales/pl.json` | ✅ | tests/interaction-guards.test.ts, tests/workflow-hooks-matrix.test.tsx |
| `TEKST` | `journal.tdsStat` | `locales/pl.json` | ✅ | tests/interaction-guards.test.ts, src/components/icons/__tests__/CraftIcons.test.tsx |
| `TEKST` | `journal.eyStat` | `locales/pl.json` | ✅ | tests/interaction-guards.test.ts, src/components/icons/__tests__/CraftIcons.test.tsx |
| `TEKST` | `journal.searchPlaceholder` | `locales/pl.json` | ✅ | tests/interaction-guards.test.ts, src/components/icons/__tests__/CraftIcons.test.tsx |
| `UI` | `journal.filterAll` | `locales/pl.json` | ✅ | tests/interaction-guards.test.ts, src/components/icons/__tests__/CraftIcons.test.tsx |
| `UI` | `journal.filterCoffee` | `locales/pl.json` | ✅ | tests/interaction-guards.test.ts, src/components/icons/__tests__/CraftIcons.test.tsx |
| `UI` | `journal.filterTea` | `locales/pl.json` | ✅ | tests/interaction-guards.test.ts, src/components/icons/__tests__/CraftIcons.test.tsx |
| `UI` | `journal.filterHighRated` | `locales/pl.json` | ✅ | tests/interaction-guards.test.ts, src/components/icons/__tests__/CraftIcons.test.tsx |
| `TEKST` | `journal.noResults` | `locales/pl.json` | ✅ | tests/interaction-guards.test.ts, src/components/icons/__tests__/CraftIcons.test.tsx |
| `UI` | `journal.sessionsTab` | `locales/pl.json` | ✅ | tests/interaction-guards.test.ts, src/components/icons/__tests__/CraftIcons.test.tsx |
| `UI` | `journal.analyticsTab` | `locales/pl.json` | ✅ | tests/interaction-guards.test.ts, src/components/icons/__tests__/CraftIcons.test.tsx |
| `TEKST` | `journal.statTotalDose` | `locales/pl.json` | ✅ | tests/interaction-guards.test.ts, src/components/icons/__tests__/CraftIcons.test.tsx |
| `TEKST` | `journal.statTotalWater` | `locales/pl.json` | ✅ | tests/interaction-guards.test.ts, src/components/icons/__tests__/CraftIcons.test.tsx |
| `TEKST` | `journal.statTotalCaffeine` | `locales/pl.json` | ✅ | tests/interaction-guards.test.ts, src/components/icons/__tests__/CraftIcons.test.tsx |
| `TEKST` | `journal.statAvgRating` | `locales/pl.json` | ✅ | tests/interaction-guards.test.ts, src/components/icons/__tests__/CraftIcons.test.tsx |
| `TEKST` | `journal.methodDistributionTitle` | `locales/pl.json` | ✅ | tests/interaction-guards.test.ts, src/components/icons/__tests__/CraftIcons.test.tsx |
| `TEKST` | `journal.sensoryAverageTitle` | `locales/pl.json` | ✅ | tests/interaction-guards.test.ts, src/components/icons/__tests__/CraftIcons.test.tsx |
| `TEKST` | `journal.sensoryAverageDesc` | `locales/pl.json` | ✅ | tests/interaction-guards.test.ts, src/components/icons/__tests__/CraftIcons.test.tsx |
| `TEKST` | `journal.balanceDistributionTitle` | `locales/pl.json` | ✅ | tests/interaction-guards.test.ts, src/components/icons/__tests__/CraftIcons.test.tsx |
| `TEKST` | `journal.topFlavorsTitle` | `locales/pl.json` | ✅ | tests/interaction-guards.test.ts, src/components/icons/__tests__/CraftIcons.test.tsx |
| `TEKST` | `journal.brewAgain` | `locales/pl.json` | ✅ | tests/interaction-guards.test.ts, src/components/icons/__tests__/CraftIcons.test.tsx |
| `TEKST` | `journal.shareSession` | `locales/pl.json` | ✅ | tests/interaction-guards.test.ts, src/components/icons/__tests__/CraftIcons.test.tsx |
| `TEKST` | `journal.sessionLoadedTitle` | `locales/pl.json` | ✅ | tests/interaction-guards.test.ts, src/components/icons/__tests__/CraftIcons.test.tsx |
| `TEKST` | `journal.sessionLoadedMsg` | `locales/pl.json` | ✅ | tests/interaction-guards.test.ts, src/components/icons/__tests__/CraftIcons.test.tsx |
| `TEKST` | `dialin.title` | `locales/pl.json` | ✅ | tests/audit-fixes.test.tsx, tests/backup-roundtrip.test.ts |
| `TEKST` | `dialin.subtitle` | `locales/pl.json` | ✅ | src/components/craft/__tests__/CraftComponents.test.tsx, src/components/settings/__tests__/GrinderSelectionCard.test.tsx |
| `TEKST` | `dialin.diagnosisTitle` | `locales/pl.json` | ✅ | src/core/__tests__/i18n.test.ts, src/core/__tests__/tabs-layout.test.tsx |
| `TEKST` | `dialin.sourTitle` | `locales/pl.json` | ✅ | src/core/__tests__/i18n.test.ts, src/core/__tests__/tabs-layout.test.tsx |
| `TEKST` | `dialin.sourDesc` | `locales/pl.json` | ✅ | src/core/__tests__/i18n.test.ts, src/core/__tests__/tabs-layout.test.tsx |
| `TEKST` | `dialin.sourRemedy` | `locales/pl.json` | ✅ | src/core/__tests__/i18n.test.ts, src/core/__tests__/tabs-layout.test.tsx |
| `TEKST` | `dialin.bitterTitle` | `locales/pl.json` | ✅ | src/core/__tests__/i18n.test.ts, src/core/__tests__/tabs-layout.test.tsx |
| `TEKST` | `dialin.bitterDesc` | `locales/pl.json` | ✅ | src/core/__tests__/i18n.test.ts, src/core/__tests__/tabs-layout.test.tsx |
| `TEKST` | `dialin.bitterRemedy` | `locales/pl.json` | ✅ | src/core/__tests__/i18n.test.ts, src/core/__tests__/tabs-layout.test.tsx |
| `TEKST` | `dialin.balancedTitle` | `locales/pl.json` | ✅ | src/core/__tests__/i18n.test.ts, src/core/__tests__/tabs-layout.test.tsx |
| `TEKST` | `dialin.balancedDesc` | `locales/pl.json` | ✅ | src/core/__tests__/i18n.test.ts, src/core/__tests__/tabs-layout.test.tsx |
| `TEKST` | `dialin.ratioTitle` | `locales/pl.json` | ✅ | src/core/__tests__/i18n.test.ts, src/core/__tests__/tabs-layout.test.tsx |
| `TEKST` | `dialin.ratioSubtitle` | `locales/pl.json` | ✅ | src/core/__tests__/i18n.test.ts, src/core/__tests__/tabs-layout.test.tsx |
| `TEKST` | `dialin.directionDoseToWater` | `locales/pl.json` | ✅ | src/core/__tests__/i18n.test.ts, src/core/__tests__/tabs-layout.test.tsx |
| `TEKST` | `dialin.directionWaterToDose` | `locales/pl.json` | ✅ | src/core/__tests__/i18n.test.ts, src/core/__tests__/tabs-layout.test.tsx |
| `TEKST` | `dialin.doseInputLabel` | `locales/pl.json` | ✅ | src/core/__tests__/i18n.test.ts, src/core/__tests__/tabs-layout.test.tsx |
| `TEKST` | `dialin.waterInputLabel` | `locales/pl.json` | ✅ | src/core/__tests__/i18n.test.ts, src/core/__tests__/tabs-layout.test.tsx |
| `UI` | `dialin.ratioSelectLabel` | `locales/pl.json` | ✅ | src/core/__tests__/i18n.test.ts, src/core/__tests__/tabs-layout.test.tsx |
| `TEKST` | `dialin.calculatedWater` | `locales/pl.json` | ✅ | src/core/__tests__/i18n.test.ts, src/core/__tests__/tabs-layout.test.tsx |
| `TEKST` | `dialin.calculatedDose` | `locales/pl.json` | ✅ | src/core/__tests__/i18n.test.ts, src/core/__tests__/tabs-layout.test.tsx |
| `TEKST` | `dialin.calculatedYield` | `locales/pl.json` | ✅ | src/core/__tests__/i18n.test.ts, src/core/__tests__/tabs-layout.test.tsx |
| `TEKST` | `dialin.absorptionNote` | `locales/pl.json` | ✅ | src/core/__tests__/i18n.test.ts, src/core/__tests__/tabs-layout.test.tsx |
| `UI` | `dialin.costTabTitle` | `locales/pl.json` | ✅ | src/core/__tests__/i18n.test.ts, src/core/__tests__/tabs-layout.test.tsx |
| `TEKST` | `dialin.costTitle` | `locales/pl.json` | ✅ | src/core/__tests__/i18n.test.ts, src/core/__tests__/tabs-layout.test.tsx |

*(... i 583 kolejnych elementów w pełnym wykazie)*

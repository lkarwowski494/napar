# Raport z Audytu Generalnego M1 — Przebieg 45 (P45)

**Data audytu:** 2026-10-26  
**Audytor:** M1 Audytor Generalny  
**Tryb:** Głęboki audyt całości ad hoc (ciągły, iteracyjny)  
**Stan wyjściowy:** Commit `04fe030` (103 test suites, 1114 tests pass, 576 i18n keys w 35 językach, 831/831 matrycy)  
**Stan docelowy:** Realizacja 12 perspektyw audytowych (01-ODK do 12-NIE) w ścisłym reżimie TDD.

---

## Zakres Przebiegu 45 (12 Perspektyw)

1. **01-ODK:** `BrewActiveFocusTimer.tsx`: Dostępność i lokalizacja `DripperExtractionGauge` (`isEn`, zlokalizowany `accessibilityLabel`, nagłówek `EXTRACTION & FLOW`) oraz sanityzacja `formatTime` (stringi, ochrona przed `-0` i clampowanie).
2. **02-MON:** `app-access.ts`: Gwarancja 0 dni w `getTrialDaysRemaining()` przy wygaszonym okresie próbnym (`status === 'trial_expired'`).
3. **03-ZAK:** `bpr-engine.ts`: Walidacja poprawności dat kalendarzowych w `generateActionIcsContent` i ochrona przed nieprawidłowymi stringami dat w `roastOrHarvestDate`.
4. **04-STU:** `RecipeStepEditor.tsx`: Ochrona przed brakiem sekcji `t.recipeBuilder` przez opcjonalne łańcuchowanie, lokalizacja prefiksu numeru kroku oraz dodanie `testID="add-step-btn"`.
5. **05-ARC:** `database.ts`: Rygorystyczna koercja `isFavorite` w `updateRecipeFavorite` (ochrona przed wartością `'false'`) oraz trimowanie i ograniczanie długości pól tekstowych (`author`, `description`, `grindSizeDescription`) w `saveRecipe`.
6. **06-TRE:** `knowledge-data.ts`: Rozszerzenie `VARIETY_ALIASES` o popularne odmiany specialty coffee: `mokka`, `mocha`, `java`, `laurina`, `pacas`, `mundo novo`, `parainema`, `yellow bourbon`, `red bourbon`.
7. **07-JAK:** `water-chemistry.ts`: Obsługa przecinka dziesiętnego (np. `'60,5'`) w `calculateWaterMinerals`, `diagnoseWaterSensoryImpact`, `ppmCaCO3ToDegreesDH` i `degreesDHToPpmCaCO3`.
8. **08-PRO:** `grinder-converter.ts`: Rozpoznawanie nowoczesnych brewerów `Mugen`, `Pulsar` oraz `Cafec` (Flower / Deep 27) w `getRecipeMicrons`.
9. **09-LOK:** `locales/*` & `src/core/i18n.tsx`: Dodanie klucza `recipeBuilder.stepNumberPrefix` w 35 językach i rozszerzenie matrycy testów do 832.
10. **10-WYD:** `scripts/verify-native.mjs`: Statyczna weryfikacja parametrów platformy Android (`android.package`, `android.versionCode`) oraz devDependency `fast-check` w `package.json`.
11. **11-WZR:** `recipe-share.ts`: Case-insensitive dopasowanie parametru zapytania URL (`?d=` / `?D=` / `?data=` / `?DATA=`) w `decodeRecipeFromShareUrl`.
12. **12-NIE:** `live-activity.ts`: Ścisła walidacja parametrów `attributes.beverageType` oraz `attributes.method` w `startLiveActivity`.

---

## Status Zadań (12 Perspektyw)

| ID | Perspektywa | Status | Plik główny | Commit |
|---|---|---|---|---|
| TASK-P45-01-ODK | Odkrywanie | Pending | `src/components/brew/BrewActiveFocusTimer.tsx` | - |
| TASK-P45-02-MON | Monetyzacja | Pending | `src/core/app-access.ts` | - |
| TASK-P45-03-ZAK | Zaskoczenie | Pending | `src/core/bpr-engine.ts` | - |
| TASK-P45-04-STU | Studiowanie | Pending | `src/components/recipe-builder/RecipeStepEditor.tsx` | - |
| TASK-P45-05-ARC | Architektura | Pending | `src/core/database.ts` | - |
| TASK-P45-06-TRE | Treść | Pending | `src/core/knowledge-data.ts` | - |
| TASK-P45-07-JAK | Jakość | Pending | `src/core/water-chemistry.ts` | - |
| TASK-P45-08-PRO | Prostota | Pending | `src/core/grinder-converter.ts` | - |
| TASK-P45-09-LOK | Lokalizacja | Pending | `locales/*` | - |
| TASK-P45-10-WYD | Wydajność | Pending | `scripts/verify-native.mjs` | - |
| TASK-P45-11-WZR | Wzorce | Pending | `src/core/recipe-share.ts` | - |
| TASK-P45-12-NIE | Niezawodność | Pending | `src/core/live-activity.ts` | - |

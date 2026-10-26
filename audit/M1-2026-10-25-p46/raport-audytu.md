# Raport z Audytu Generalnego M1 — Przebieg 46 (P46)

**Data audytu:** 2026-10-26  
**Audytor:** M1 Audytor Generalny  
**Tryb:** Głęboki audyt całości ad hoc (ciągły, iteracyjny)  
**Stan wyjściowy:** Commit `ab9a233` (103 test suites, 1124 tests pass, 577 i18n keys w 35 językach, 832/832 matrycy)  
**Stan docelowy:** Realizacja 12 perspektyw audytowych (01-ODK do 12-NIE) w ścisłym reżimie TDD.

---

## Zakres Przebiegu 46 (12 Perspektyw)

1. **01-ODK:** `BrewFinishModal.tsx`: Dostępność, etykiety accessibilityValue dla suwaków sensorycznych i sanityzacja w modalnym podsumowaniu parzenia.
2. **02-MON:** `app-access.ts`: Odporność `getAppAccessState` na uszkodzone formaty ISO daty okresu próbnego w bazie danych.
3. **03-ZAK:** `bpr-engine.ts`: Ochrona `calculateDegassingProgress` przed ujemnymi wartościami przy dacie wypału z przyszłości.
4. **04-STU:** `RecipeStepEditor.tsx`: Sanityzacja danych wejściowych w edytorze kroków `RecipeStepEditor` (zamiana przecinków na kropki, ochrona przed ujemnymi wartościami).
5. **05-ARC:** `database.ts`: Sanityzacja i clampowanie pól `recipeName`, `method` i `rating` w `saveBrewSession`.
6. **06-TRE:** `knowledge-data.ts`: Rozszerzenie `PROCESS_ALIASES` o warianty obróbki honey (`black-honey`, `red-honey`, `yellow-honey`).
7. **07-JAK:** `water-chemistry.ts`: Rozszerzenie `findBottledWaterById` o alternatywne aliasy marek butelkowanych.
8. **08-PRO:** `grinder-converter.ts`: Rozpoznawanie metod cold drip i cold immersion dripperów w `getRecipeMicrons`.
9. **09-LOK:** `locales/*`: Weryfikacja spójności lingwistycznej i braków w 35 językach oraz utrzymanie 100% matrycy testów.
10. **10-WYD:** `scripts/verify-native.mjs`: Weryfikacja spójności uprawnień i skryptów audytowych w `verify-native.mjs`.
11. **11-WZR:** `recipe-share.ts`: Defensywna obsługa pustej tablicy kroków w `recipeToCompactPayload` i `decodeRecipeFromShareUrl`.
12. **12-NIE:** `live-activity.ts`: Ścisła walidacja całkowitych liczb kroków w `updateLiveActivity` i `startLiveActivity`.

---

## Status Zadań (12 Perspektyw)

| ID | Perspektywa | Status | Plik główny | Commit |
|---|---|---|---|---|
| TASK-P46-01-ODK | Odkrywanie | Pending | `src/components/brew/BrewFinishModal.tsx` | - |
| TASK-P46-02-MON | Monetyzacja | Pending | `src/core/app-access.ts` | - |
| TASK-P46-03-ZAK | Zaskoczenie | Pending | `src/core/bpr-engine.ts` | - |
| TASK-P46-04-STU | Studiowanie | Pending | `src/components/recipe-builder/RecipeStepEditor.tsx` | - |
| TASK-P46-05-ARC | Architektura | Pending | `src/core/database.ts` | - |
| TASK-P46-06-TRE | Treść | Pending | `src/core/knowledge-data.ts` | - |
| TASK-P46-07-JAK | Jakość | Pending | `src/core/water-chemistry.ts` | - |
| TASK-P46-08-PRO | Prostota | Pending | `src/core/grinder-converter.ts` | - |
| TASK-P46-09-LOK | Lokalizacja | Pending | `locales/*` | - |
| TASK-P46-10-WYD | Wydajność | Pending | `scripts/verify-native.mjs` | - |
| TASK-P46-11-WZR | Wzorce | Pending | `src/core/recipe-share.ts` | - |
| TASK-P46-12-NIE | Niezawodność | Pending | `src/core/live-activity.ts` | - |

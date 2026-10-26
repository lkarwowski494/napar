# Raport z Audytu Generalnego M1 — Przebieg 47 (P47)

**Data audytu:** 2026-10-26  
**Audytor:** M1 Audytor Generalny  
**Tryb:** Głęboki audyt całości ad hoc (ciągły, iteracyjny)  
**Stan wyjściowy:** Commit `2077db6` (103 test suites, 1134+ tests pass, 578 i18n keys w 35 językach, 833/833 matrycy)  
**Stan docelowy:** Realizacja 12 perspektyw audytowych (01-ODK do 12-NIE) w ścisłym reżimie TDD.

---

## Zakres Przebiegu 47 (12 Perspektyw)

1. **01-ODK:** `RecipeSelectModal.tsx`: Normalizacja diakrytyków przez `normSearch`, uwzględnienie `description` w wyszukiwaniu oraz limit długości zapytania.
2. **02-MON:** `app-access.ts`: Rozszerzenie weryfikacji StoreKit o krótkie identyfikatory tierów (`monthly`, `annual`, `lifetime`) oraz walidację okna czasowego zakupu.
3. **03-ZAK:** `bpr-engine.ts`: Oczyszczanie niedozwolonych znaków kontrolnych RFC 5545 w `escapeIcsText` zapobiegające uszkodzeniu importu w Apple Calendar.
4. **04-STU:** `RecipeParamsCard.tsx`: Odporność na przecinek dziesiętny w `doseGrams`, `waterGrams` i `waterTempCelsius` oraz limit długości opisu mielenia.
5. **05-ARC:** `database.ts`: Wprowadzenie obsługi przecinka dziesiętnego, clampowania zakresów dozy [1, 1000] i wody [10, 50000] oraz serializacji obiektowego stepsJson w `saveRecipe`.
6. **06-TRE:** `knowledge-data.ts`: Rozszerzenie bazy wiedzy procesów obróbki kawy o natural carbonic maceration i yeast fermentation w `knowledge-data`.
7. **07-JAK:** `water-chemistry.ts`: Sanityzacja wartości mineralizacji wody i odporność na przecinki dziesiętne w `water-chemistry`.
8. **08-PRO:** `grinder-converter.ts`: Rozpoznawanie metod Cupping i Siphon w `getRecipeMicrons` w `grinder-converter`.
9. **09-LOK:** `locales/*`: Weryfikacja spójności słowników 35 języków i zachowanie 100% matrycy testów.
10. **10-WYD:** `scripts/verify-native.mjs`: Weryfikacja poprawności deklaracji Required Reason API w `PrivacyInfo.xcprivacy` w `verify-native`.
11. **11-WZR:** `recipe-share.ts`: Defensywna normalizacja i obcięcie do 100 znaków nazw kroków w `recipe-share`.
12. **12-NIE:** `live-activity.ts`: Ochrona przed wartościami ujemnymi i NaN w `totalElapsedSeconds` w `live-activity`.

---

## Status Zadań (12 Perspektyw)

| ID | Perspektywa | Status | Plik główny | Commit |
|---|---|---|---|---|
| TASK-P47-01-ODK | Odkrywanie | Completed | `src/components/brew/RecipeSelectModal.tsx` | `1411820` |
| TASK-P47-02-MON | Monetyzacja | Completed | `src/core/app-access.ts` | `b3aecee` |
| TASK-P47-03-ZAK | Zaskoczenie | Completed | `src/core/bpr-engine.ts` | `52a27a1` |
| TASK-P47-04-STU | Studiowanie | Completed | `src/components/recipe-builder/RecipeParamsCard.tsx` | `2cb8875` |
| TASK-P47-05-ARC | Architektura | Completed | `src/core/database.ts` | `838b960` |
| TASK-P47-06-TRE | Treść | Completed | `src/core/knowledge-data.ts` | `1cfd2eb` |
| TASK-P47-07-JAK | Jakość | Completed | `src/core/water-chemistry.ts` | `bfa52fd` |
| TASK-P47-08-PRO | Prostota | Completed | `src/core/grinder-converter.ts` | `08b8958` |
| TASK-P47-09-LOK | Lokalizacja | Completed | `locales/*` | `cd2c46a` |
| TASK-P47-10-WYD | Wydajność | Completed | `scripts/verify-native.mjs` | `9eeadf1` |
| TASK-P47-11-WZR | Wzorce | Pending | `src/core/recipe-share.ts` | - |
| TASK-P47-12-NIE | Niezawodność | Pending | `src/core/live-activity.ts` | - |

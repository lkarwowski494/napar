# Raport z Audytu Generalnego M1 — Przebieg 49 (P49)

**Data audytu:** 2026-10-26  
**Audytor:** M1 Audytor Generalny  
**Tryb:** Głęboki audyt całości ad hoc (ciągły, iteracyjny)  
**Stan wyjściowy:** Commit `c098a8a` (103 test suites, 1154 tests pass, 582 i18n keys w 35 językach, 838/838 matrycy)  
**Stan docelowy:** Realizacja 12 perspektyw audytowych (01-ODK do 12-NIE) w ścisłym reżimie TDD.

---

## Zakres Przebiegu 49 (12 Perspektyw)

1. **01-ODK:** `RecipeSelectModal.tsx`: Dodanie `accessibilityRole="search"` lub `"searchbox"` oraz `accessibilityHint` dla wyszukiwarki receptur, defensywna ochrona przed `recipes` niebędącym tablicą i filtrowanie obiektów null/undefined.
2. **02-MON:** `Apps4BrewPassModal.tsx`: Dostępność przycisków wyboru planów subskrypcji (`accessibilityHint`), defensywna obsługa `onClose?.()` oraz zamykanie modala po udanym przywróceniu zakupów (`handleRestore`).
3. **03-ZAK:** `bpr-engine.ts`: Normalizacja wielkości liter `item.type` ('coffee' vs 'COFFEE', 'tea' vs 'TEA') w generowaniu proaktywnego harmonogramu BPR.
4. **04-STU:** `RecipeStepEditor.tsx`: Defensywne mapowanie `steps` z zabezpieczeniem przed `null`/`undefined`, wartości domyślne `value ?? ''` oraz etykiety i podpowiedzi a11y.
5. **05-ARC:** `database.ts`: Obsługa europejskiego przecinka dziesiętnego w polach dozy, wody, ratingu, TDS i kofeiny w `saveBrewSession` oraz normalizacja wielkości liter `beverageType` w `saveRecipe`.
6. **06-TRE:** `knowledge-data.ts`: Rozszerzenie bazy wiedzy o opisy i synonimy zaawansowanych procesów obróbki (Koji Fermentation, Thermal Shock, Anaerobic Natural).
7. **07-JAK:** `water-chemistry.ts`: Walidacja granic buforu zasadowości w `calculateBufferAddition` i ochrona przed dzieleniem przez zero.
8. **08-PRO:** `grinder-converter.ts`: Kalibracja optymalnych mikronów dla metody parzenia AeroPress Inverted (odwrócony) w `getRecipeMicrons`.
9. **09-LOK:** `locales/*`: Dodanie kluczy podpowiedzi wyszukiwania i instrukcji kroków w 35 językach z zachowaniem 100% symetrii.
10. **10-WYD:** `scripts/verify-native.mjs`: Weryfikacja braku niedozwolonych uprawnień lokalizacji w tle (`ACCESS_BACKGROUND_LOCATION`, `NSLocationAlwaysUsageDescription`).
11. **11-WZR:** `recipe-share.ts`: Sanityzacja pustych tablic kroków i właściwości w `decodeRecipeFromShareUrl`.
12. **12-NIE:** `live-activity.ts`: Ochrona przed ujemnymi wartościami i NaN w polach Live Activity oraz bezpieczny fallback stanu.

---

## Status Zadań (12 Perspektyw)

| ID | Perspektywa | Status | Plik główny | Commit |
|---|---|---|---|---|
| TASK-P49-01-ODK | Odkrywanie | Completed | `src/components/brew/RecipeSelectModal.tsx` | `935092c` |
| TASK-P49-02-MON | Monetyzacja | Completed | `src/components/Apps4BrewPassModal.tsx` | `34c8fd5` |
| TASK-P49-03-ZAK | Zaskoczenie | Completed | `src/core/bpr-engine.ts` | `b96acf7` |
| TASK-P49-04-STU | Studiowanie | Completed | `src/components/recipe-builder/RecipeStepEditor.tsx` | `a38e9bf` |
| TASK-P49-05-ARC | Architektura | Completed | `src/core/database.ts` | `450da69` |
| TASK-P49-06-TRE | Treść | In Progress | `src/core/knowledge-data.ts` | - |
| TASK-P49-07-JAK | Jakość | Planned | `src/core/water-chemistry.ts` | - |
| TASK-P49-08-PRO | Prostota | Planned | `src/core/grinder-converter.ts` | - |
| TASK-P49-09-LOK | Lokalizacja | Planned | `locales/*` | - |
| TASK-P49-10-WYD | Wydajność | Planned | `scripts/verify-native.mjs` | - |
| TASK-P49-11-WZR | Wzorce | Planned | `src/core/recipe-share.ts` | - |
| TASK-P49-12-NIE | Niezawodność | Planned | `src/core/live-activity.ts` | - |

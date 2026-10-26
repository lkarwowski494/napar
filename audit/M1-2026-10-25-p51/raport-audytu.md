# Raport z Audytu Jakościowego — Przebieg 51 (P51)

**Data audytu:** 2026-10-26  
**Status przebiegu:** W trakcie (Batch 1 ukończony: Zadania 01–05, Batch 2 w toku)  
**Cel główny:** Cykliczny audyt 12 perspektyw jakościowych repozytorium Napar 2.

## Tabela Postępu Zadań

| ID | Perspektywa | Status | Plik główny | Commit |
|---|---|---|---|---|
| TASK-P51-01-ODK | Odkrywanie | Completed | `src/components/brew/RecipeSelectModal.tsx` | `2b9a172` |
| TASK-P51-02-MON | Monetyzacja | Completed | `src/core/app-access.ts` | `f251a23` |
| TASK-P51-03-ZAK | Zaskoczenie | Completed | `src/core/bpr-engine.ts` | `8c7468e` |
| TASK-P51-04-STU | Studiowanie | Completed | `src/components/recipe-builder/RecipeParamsCard.tsx` | `830c9fa` |
| TASK-P51-05-ARC | Architektura | Completed | `src/core/database.ts` | `1f3ba84` |
| TASK-P51-06-TRE | Treść | Planned | `src/core/knowledge-data.ts` | - |
| TASK-P51-07-JAK | Jakość | Planned | `src/core/water-chemistry.ts` | - |
| TASK-P51-08-PRO | Prostota | Planned | `src/core/grinder-converter.ts` | - |
| TASK-P51-09-LOK | Lokalizacja | Planned | `locales/*` | - |
| TASK-P51-10-WYD | Wydajność | Planned | `scripts/verify-native.mjs` | - |
| TASK-P51-11-WZR | Wzorce | Planned | `src/core/recipe-share.ts` | - |
| TASK-P51-12-NIE | Niezawodność | Planned | `src/core/live-activity.ts` | - |

## Podsumowanie Wykonanych Prac w Batch 1

1. **TASK-P51-01-ODK:** Pełna lokalizacja etykiet a11y i wariantu autorskiego w `RecipeSelectModal.tsx` dla trybu angielskiego.
2. **TASK-P51-02-MON:** Dodanie walidacji długości sygnatury StoreKit (`>= 8` znaków po trim) oraz eksport pomocniczy `formatSubscriptionTierName`.
3. **TASK-P51-03-ZAK:** Obsługa naturalnych ułamkowych fraz czasu ("pół minuty", "półtorej minuty", "half a minute", "1/2 min", "kwadrans") w parserze kroków `bpr-engine.ts`.
4. **TASK-P51-04-STU:** Ochrona ratio przed `NaN`, `-0` i przecinkami dziesiętnymi w `RecipeParamsCard.tsx`.
5. **TASK-P51-05-ARC:** Wsparcie proporcji w postaci ułamków `'1:16.5'` oraz `'1/15'` oraz przecinków dziesiętnych w `saveRecipe` i `duplicateRecipe` w `database.ts`.

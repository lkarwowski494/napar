# Raport z Audytu Jakościowego — Przebieg 51 (P51)

**Data audytu:** 2026-10-26  
**Status przebiegu:** W trakcie (Batch 1 & 2 ukończone: Zadania 01–10, Batch 3 w toku)  
**Cel główny:** Cykliczny audyt 12 perspektyw jakościowych repozytorium Napar 2.

## Tabela Postępu Zadań

| ID | Perspektywa | Status | Plik główny | Commit |
|---|---|---|---|---|
| TASK-P51-01-ODK | Odkrywanie | Completed | `src/components/brew/RecipeSelectModal.tsx` | `2b9a172` |
| TASK-P51-02-MON | Monetyzacja | Completed | `src/core/app-access.ts` | `f251a23` |
| TASK-P51-03-ZAK | Zaskoczenie | Completed | `src/core/bpr-engine.ts` | `8c7468e` |
| TASK-P51-04-STU | Studiowanie | Completed | `src/components/recipe-builder/RecipeParamsCard.tsx` | `830c9fa` |
| TASK-P51-05-ARC | Architektura | Completed | `src/core/database.ts` | `1f3ba84` |
| TASK-P51-06-TRE | Treść | Completed | `src/core/knowledge-data.ts` | `7b3eeaa` |
| TASK-P51-07-JAK | Jakość | Completed | `src/core/water-chemistry.ts` | `81804c7` |
| TASK-P51-08-PRO | Prostota | Completed | `src/core/grinder-converter.ts` | `f0b715a` |
| TASK-P51-09-LOK | Lokalizacja | Completed | `locales/*` | `58683e0` |
| TASK-P51-10-WYD | Wydajność | Completed | `scripts/verify-native.mjs` | `28469bf` |
| TASK-P51-11-WZR | Wzorce | Planned | `src/core/recipe-share.ts` | - |
| TASK-P51-12-NIE | Niezawodność | Planned | `src/core/live-activity.ts` | - |

## Podsumowanie Wykonanych Prac w Batch 1 & 2

1. **TASK-P51-01-ODK:** Pełna lokalizacja etykiet a11y i wariantu autorskiego w `RecipeSelectModal.tsx` dla trybu angielskiego.
2. **TASK-P51-02-MON:** Dodanie walidacji długości sygnatury StoreKit (`>= 8` znaków po trim) oraz eksport pomocniczy `formatSubscriptionTierName`.
3. **TASK-P51-03-ZAK:** Obsługa naturalnych ułamkowych fraz czasu ("pół minuty", "półtorej minuty", "half a minute", "1/2 min", "kwadrans") w parserze kroków `bpr-engine.ts`.
4. **TASK-P51-04-STU:** Ochrona ratio przed `NaN`, `-0` i przecinkami dziesiętnymi w `RecipeParamsCard.tsx`.
5. **TASK-P51-05-ARC:** Wsparcie proporcji w postaci ułamków `'1:16.5'` oraz `'1/15'` oraz przecinków dziesiętnych w `saveRecipe` i `duplicateRecipe` w `database.ts`.
6. **TASK-P51-06-TRE:** Rozszerzenie taksonomii baz wiedzy o herbaty białe, zielone, oolong (Silver Needle, White Peony, Longjing, Tieguanyin, Da Hong Pao) oraz regiony i kultywary kawy (Limu, Jimma, Embu, Murang'a, Coban, Mogiana, Renacimiento, Gesha 1931, Villalobos, Marsellesa) w `knowledge-data.ts`.
7. **TASK-P51-07-JAK:** Dodanie funkcji `formatWaterHardnessCategory` i rozszerzenie aliasów wód butelkowanych w `water-chemistry.ts`.
8. **TASK-P51-08-PRO:** Wsparcie popularnych aliasów młynków (`c40`, `c2`, `ode`, `k-ultra`, `zp6`, `encore`, `k6`) oraz przecinków dziesiętnych w `grinder-converter.ts`.
9. **TASK-P51-09-LOK:** Dodanie zlokalizowanych nazw kategorii twardości wody (`hardnessVerySoft`, `hardnessSoft`, `hardnessModeratelyHard`, `hardnessHard`, `hardnessVeryHard`) we wszystkich 35 językach i `src/core/i18n.tsx`.
10. **TASK-P51-10-WYD:** Weryfikacja blokady uprawnień HomeKit, NFC, background location i pełnego dostępu do pamięci w `scripts/verify-native.mjs`.

# Raport z Audytu Generalnego M1 — Przebieg 50 (P50)

**Data audytu:** 2026-10-26  
**Audytor:** M1 Audytor Generalny  
**Tryb:** Głęboki audyt całości ad hoc (ciągły, iteracyjny)  
**Stan wyjściowy:** Commit `dd8aa62` (103 test suites, 1165 tests pass, 583 i18n keys w 35 językach, 840/840 matrycy)  
**Stan docelowy:** Realizacja 12 perspektyw audytowych (01-ODK do 12-NIE) w ścisłym reżimie TDD.

---

## Zakres Przebiegu 50 (12 Perspektyw)

1. **01-ODK:** `InventorySelectModal.tsx`: Dodanie zlokalizowanych etykiet zamykania (`t?.common?.close`), etykiet dostępności i podpowiedzi a11y oraz filtrowanie null/nieobiektowych elementów w `inventory`.
2. **02-MON:** `app-access.ts`: Ochrona przed `undefined` w `formatTrialStatusSummary` oraz poprawna polska fleksja i pluralizacja (1 parzenie, 2 parzenia, 5 parzeń, 22 parzenia).
3. **03-ZAK:** `bpr-engine.ts`: Bezpieczny fallback bez rzucania wyjątków w eksporcie kalendarza iCalendar `generateActionIcsContent` przy braku/nieprawidłowym obiekcie akcji.
4. **04-STU:** `RecipeParamsCard.tsx`: Defensywne fallbacki dla `t.recipeBuilder` zapobiegające crashom przy częściowym słowniku oraz dodanie atrybutów a11y dla pól numerycznych.
5. **05-ARC:** `database.ts`: Case-insensitive normalizacja typu pozycji spiżarni (`'tea'` vs `'TEA'`) w `saveInventoryItem` oraz obsługa europejskich przecinków dziesiętnych w `deductInventoryWeight`.
6. **06-TRE:** `knowledge-data.ts`: Rozszerzenie bazy wiedzy o profile minerałów wody i opisy buforów kwasowości.
7. **07-JAK:** `water-chemistry.ts`: Walidacja granic dozowania minerałów wody i ochrona przed NaN w kalkulatorze wody SCA.
8. **08-PRO:** `grinder-converter.ts`: Kalibracja zakresów mikronów dla metod maceracji na zimno (Cold Brew / Cold Drip).
9. **09-LOK:** `locales/*`: Uzupełnienie kluczy wyboru spiżarni i podpowiedzi w 35 językach z zachowaniem 100% symetrii.
10. **10-WYD:** `scripts/verify-native.mjs`: Weryfikacja braku uprawnień telemetrycznych i lokalizacyjnych w skryptach audytowych.
11. **11-WZR:** `recipe-share.ts`: Odporność na NaN w wyliczaniu ratio i ujemny czas trwania kroków w `recipe-share`.
12. **12-NIE:** `live-activity.ts`: Precyzyjna obsługa przecinków dziesiętnych w `startLiveActivity` i `updateLiveActivity`.

---

## Status Zadań (12 Perspektyw)

| ID | Perspektywa | Status | Plik główny | Commit |
|---|---|---|---|---|
| TASK-P50-01-ODK | Odkrywanie | Completed | `src/components/brew/InventorySelectModal.tsx` | `336192c` |
| TASK-P50-02-MON | Monetyzacja | Completed | `src/core/app-access.ts` | `fa34fc4` |
| TASK-P50-03-ZAK | Zaskoczenie | Completed | `src/core/bpr-engine.ts` | `03c2b7f` |
| TASK-P50-04-STU | Studiowanie | Completed | `src/components/recipe-builder/RecipeParamsCard.tsx` | `ea48308` |
| TASK-P50-05-ARC | Architektura | Completed | `src/core/database.ts` | `f2fc627` |
| TASK-P50-06-TRE | Treść | Completed | `src/core/knowledge-data.ts` | `34197fa` |
| TASK-P50-07-JAK | Jakość | Completed | `src/core/water-chemistry.ts` | `efe0344` |
| TASK-P50-08-PRO | Prostota | Completed | `src/core/grinder-converter.ts` | `d7b3d9b` |
| TASK-P50-09-LOK | Lokalizacja | Completed | `locales/*` | `e084c7f` |
| TASK-P50-10-WYD | Wydajność | Completed | `scripts/verify-native.mjs` | `ec82696` |
| TASK-P50-11-WZR | Wzorce | Planned | `src/core/recipe-share.ts` | - |
| TASK-P50-12-NIE | Niezawodność | Planned | `src/core/live-activity.ts` | - |

# Raport Audytu — Przebieg 63 (P63)
**Data:** 2026-10-27  
**Obszary audytowane:**
- `10-WYD`: Wydajność, offline-first, startup, storage budget (`startup-guard.ts`)
- `11-WZR`: Wzorce specialty, BPR, fizyka ekstrakcji (`bpr-engine.ts`)
- `12-NIE`: Niezawodność, resilience, boundary fuzzing, chaos testing (`fuzz-resilience.test.ts`)
- `01-ODK`: Odkrywanie, nawigacja, wyszukiwanie, flow (`search-utils.ts`)
- `02-MON`: Monetyzacja, paywall, subskrypcja, Apps4Brew Pass (`app-access.ts`)

---

## 1. Ustalenia i zidentyfikowane luki

1. **10-WYD (Bezinwazyjny odczyt stanu Safe Mode w startup-guard):**
   Obiekt `crashLoopGuard` w `src/core/startup-guard.ts` posiada metody `recordStartupAttempt` (która inkrementuje licznik awarii) oraz `resetCrashCount`. Komponenty UI potrzebują metody `isInSafeMode()` oraz `getCrashCount()` do sprawdzenia czy aplikacja jest w trybie awaryjnym bez modyfikowania licznika.

2. **11-WZR (Kalkulacja statusu świeżości ziaren kawy):**
   W `src/core/bpr-engine.ts` zdefiniowano `calculateRoastDegassingWindow`, ale brakowało funkcji wysokiego poziomu `calculateCoffeeFreshness(roastDate, roastProfile, referenceDate)` określającej czy ziarno odpoczywa (`too_fresh`), jest w szczycie smaku (`peak`), minęło szczyt (`past_peak`) czy zestarzało się (`expired`).

3. **12-NIE (Chaos 10: Fuzzing modułów konwersji jednostek i przemiału):**
   W `src/core/__tests__/fuzz-resilience.test.ts` brakowało testów chaosu dla `unit-converter` oraz `grinder-converter` wstrzykujących mutacje UTF-8, znaki kontrolne i ujemne/zerowe stringi.

4. **01-ODK (Generyczne filtrowanie list filterBySearch):**
   Wyszukiwanie w różnych ekranach (`Stash`, `Journal`, `Recipes`, `Water`) wielokrotnie powielało logikę filtrowania tablic z użyciem `matchesAnyField`. Niezbędna jest czysta funkcja pomocnicza `filterBySearch<T>(items, query, extractFields)`.

5. **02-MON (Centralizacja blokady funkcji Pro po wygaśnięciu triala):**
   W `src/core/app-access.ts` reguły dostępu do funkcji płatnych (WTP-1) były sprawdzane ad-hoc. Należy zaimplementować `isFeatureGated(feature, state)` oraz `getGatedFeatureNotice(feature, language)` gwarantujące, że w trakcie okresu próbnego (`trial_active`) oraz przy subskrypcji żadna funkcja nie jest blokowana, a po wygaśnięciu okresu próbnego blokowane są wyłącznie moduły Pro.

---

## 2. Status wdrożenia napraw (P63)

Wszystkie 5 zadań zrealizowano w pełnym cyklu TDD (Red -> Green -> Commit):
- `TASK-P63-10-WYD` (`2643003`): Dodano `isInSafeMode` oraz `getCrashCount` w `src/core/startup-guard.ts` z testami w `src/core/__tests__/startup-guard.test.ts`.
- `TASK-P63-11-WZR` (`780e480`, `0540136`): Zaimplementowano `calculateCoffeeFreshness` w `src/core/bpr-engine.ts` z testami w `src/core/__tests__/bpr-engine.test.ts`.
- `TASK-P63-12-NIE` (`6a5f11b`): Wdrożono `Chaos 10` fuzzujący konwertery jednostek i młynków w `src/core/__tests__/fuzz-resilience.test.ts`.
- `TASK-P63-01-ODK` (`9a35395`): Zaimplementowano `filterBySearch` w `src/core/search-utils.ts` z testami w `src/core/__tests__/search-utils.test.ts`.
- `TASK-P63-02-MON` (`7cc2fe7`): Zaimplementowano `isFeatureGated` oraz `getGatedFeatureNotice` w `src/core/app-access.ts` z testami w `src/core/__tests__/app-access.test.ts`.

Wszystkie 6 bramek jakościowych oraz 104 suity testowe przeszły w 100%.


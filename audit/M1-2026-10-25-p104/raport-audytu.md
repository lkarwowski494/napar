# Raport z Audytu Architektonicznego i Jakościowego - Przebieg 104 (P104)

## Data: 2026-10-29
## Obszary audytowane:
1. **11-WZR** (Wzorce projektowe i reguły domenowe)
2. **12-NIE** (Niezawodność i testy odpornościowe / chaos)
3. **01-ODK** (Odkrywanie i wyszukiwanie)
4. **02-MON** (Monetyzacja i paywall / gating)
5. **03-ZAK** (Zarządzanie zapasami / inwentarz)

---

## 1. Wnioski z audytu

- **11-WZR**: W module `src/core/domain-rules.ts` brakuje dedykowanego kalkulatora rozcieńczania koncentratu Cold Brew (`calculateColdBrewDilutionRatio`), który na podstawie wagi koncentratu (zaparzonego w stosunku np. 1:4 lub 1:5) oraz docelowej mocy naparu (RTD standard 1:1, light 1:2, bold 2:1) oblicza wagę wody, mleka lub toniku, a także finalną objętość i zawartość kofeiny.
- **12-NIE**: W module `src/core/__tests__/fuzz-resilience.test.ts` brakuje testu chaosu (Chaos 27) weryfikującego odporność 2 000 losowych wywołań kalkulatorów wprowadzonych w cyklu P103 (`compareRoastLevels`, `evaluateLarsonSkoldIndex`, `calculateBurrGeometryProfile`, `formatBoilingPointAtAltitude`) na zniekształcone dane, NaN, Infinity, -0, typy boolean, tablice i wartości nullish.
- **01-ODK**: Moduł `src/core/search-utils.ts` potrafi badać pokrycie tokenów, lecz brakowało w nim zunifikowanego silnika oceny trafności dopasowania (`calculateSearchMatchRelevance`), łączącego wagę prefiksu słowa, dopasowanie ścisłe i dystans Levenshteina w ustandaryzowaną skalę 0–100 z klasyfikacją stopnia (`exact`, `high`, `medium`, `low`).
- **02-MON**: W `src/core/app-access.ts` zaimplementowano gating receptur i inwentarza, ale brakuje ewaluatora dostępu do zaawansowanych formatów eksportu danych (`evaluateExportFormatAccess`), rozróżniającego darmowy eksport JSON/CSV od eksportu zaawansowanego w wersji Pro (karty PDF, telemetryczne CSV z czujników ciśnienia/przepływu).
- **03-ZAK**: W module `src/core/database.ts` brakuje wskaźnika świeżości ziaren w spiżarni (`calculateStashFreshnessIndex`), który w oparciu o datę palenia i rodzaj opakowania (zaworek jednokierunkowy, płukanie azotem, pakowanie próżniowe, zamrożenie, paczka otwarta) wyznacza fazę życia ziarna (`degassing`, `peak`, `optimal`, `declining`, `stale`) i rekomendowany termin spożycia.

---

## 2. Plan Napraw (5 zadań)

1. `TASK-P104-11-WZR`: `calculateColdBrewDilutionRatio` z typami `ColdBrewDilutionResult` i `ColdBrewStrengthCategory` w `src/core/domain-rules.ts`.
2. `TASK-P104-12-NIE`: `Chaos 27` w `src/core/__tests__/fuzz-resilience.test.ts`.
3. `TASK-P104-01-ODK`: `calculateSearchMatchRelevance` z typami `SearchMatchRelevanceResult` i `SearchRelevanceGrade` w `src/core/search-utils.ts`.
4. `TASK-P104-02-MON`: `evaluateExportFormatAccess` z typami `ExportFormatAccessEvaluation` i `ExportFormatTier` w `src/core/app-access.ts`.
5. `TASK-P104-03-ZAK`: `calculateStashFreshnessIndex` z typami `StashFreshnessReport` i `BeanFreshnessStage` w `src/core/database.ts`.

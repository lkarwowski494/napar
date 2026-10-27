# Raport z Audytu Architektoniczno-Jakościowego — Przebieg 65 (P65)
Data audytu: 2026-10-27
Obszary poddane audytowi:
- **08-PRO** (Produkt i UX): Formatowanie wielowalutowe kosztów parzenia w `src/core/cost-calculator.ts`
- **09-LOK** (Lokalizacja i i18n): Centralny helper formatowania relatywnego czasu (`formatRelativeDays`) w `src/core/i18n.tsx`
- **10-WYD** (Wydajność i responsywność): Statyczne helpery wyliczania metryk receptury bez alokacji stanu timera w `src/core/timer-engine.ts`
- **11-WZR** (Wzorce i architektura): Odwrotna kalkulacja uzysku z uwzględnieniem retencji (`calculateDoseForBeverageYield`) w `src/core/domain-rules.ts`
- **12-NIE** (Niezawodność i testy): Fuzzing i Chaos Engineering dla nowych kalkulacji w `src/core/__tests__/fuzz-resilience.test.ts`

---

## 1. Wdrożone Naprawy i Rezultaty

### 1.1 [08-PRO] Wielowalutowe formatowanie kosztów (`TASK-P65-08-PRO`, commit `3697753`)
- Dodano typ `SupportedCurrency = 'PLN' | 'EUR' | 'USD' | 'GBP'` oraz funkcję `formatCost(val, currency = 'PLN')`.
- Zapewniono obsługę formatowania kwot dla PLN (`3.50 zł`), EUR (`€3.50`), USD (`$3.50`) oraz GBP (`£3.50`).
- Wprowadzono pełną odporność na -0, NaN, ujemne wartości oraz stringi z przecinkiem dziesiętnym.

### 1.2 [09-LOK] Relatywny format dni w interfejsie (`TASK-P65-09-LOK`, commit `f123f38`)
- Wdrożono `formatRelativeDays(daysOffset, lang = 'pl')` z obsługą form językowych: "Dziś", "Jutro", "Wczoraj", "Za X dni", "X dni temu" (PL) oraz "Today", "Tomorrow", "Yesterday", "In X days", "X days ago" (EN/inne).
- Zabezpieczono przed zmutowanymi danymi (stringi z przecinkami, NaN, -0, skrajne wartości clamped do [-36500, +36500]).

### 1.3 [10-WYD] Statyczne helpery wyliczania metryk receptury (`TASK-P65-10-WYD`, commit `620fc44`)
- Wdrożono metody statyczne `BrewTimerEngine.calculateTotalRecipeDuration(steps)` oraz `BrewTimerEngine.calculateTotalTargetWater(steps)`.
- Umożliwiono szybkie wyliczanie parametrów receptur na listach i w kartach bez potrzeby instancjonowania instancji silnika timera i bez alokacji pamięci na subskrypcje zdarzeń systemowych.

### 1.4 [11-WZR] Baristyczna odwrotna kalkulacja uzysku (`TASK-P65-11-WZR`, commit `2ce22f8`)
- Wdrożono `calculateDoseForBeverageYield(targetBeverageGrams, ratio, retentionFactor, maxDoseGrams, maxWaterGrams)`.
- Rozwiązano problem doboru dozy ziaren i objętości wody pod zadaną pojemność naczynia (np. 250ml kubek przy ratio 1:16 i retencji 2.0g/g wymaga 17.9g kawy i 285.7g wody).

### 1.5 [12-NIE] Pakiet Chaos 11 i Fuzzing odpornościowy (`TASK-P65-12-NIE`, commit `79c4e6a`)
- Wdrożono pakiet testowy `Chaos 11` w `src/core/__tests__/fuzz-resilience.test.ts`.
- Przetestowano skrajne mutacje (NaN, Infinity, stringi z przecinkami, BOM, null, obiekty, ujemne wartości) dla wszystkich nowo dodanych metod i kalkulatorów.

---

## 2. Bramki Jakościowe i Stan Testów
- `check:i18n`: 600 kluczy, 35 słowników z zachowaniem 100% symetrii.
- `check:matrix`: 919/919 elementów (100% pokrycia).
- `check:corpus`: Python truth oracles zweryfikowane.
- `check:licenses`: 19 zależności produkcyjnych zgodnych licencyjnie (0 naruszeń).
- `check:native`: niezmienniki natywne spełnione.
- `typecheck`: TypeScript `tsc --noEmit` bez błędów.

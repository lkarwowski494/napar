# Raport z Audytu Generalnego M1 — Przebieg 40 (P40)

**Data audytu:** 2026-10-26  
**Audytor:** M1 Audytor Generalny  
**Tryb:** Głęboki audyt całości ad hoc (ciągły, iteracyjny)  
**Stan wyjściowy:** Commit `bc1b1c5` (103 test suites, 1061 tests pass, 571 i18n keys w 35 językach, 826/826 matrycy)  
**Stan końcowy:** W trakcie realizacji (12 perspektyw audytowych)

---

## Zakres Przebiegu 40 (12 Perspektyw)

1. **01-ODK:** Dostępność a11y w `BrewFinishModal.tsx`: semantyczne `accessibilityState={{ selected }}` na przyciskach oceniania gwiazdkami, `accessibilityRole="radio"` i `accessibilityState={{ selected }}` na pigułkach balansu smaku z rolą `radiogroup` na kontenerze, `maxLength={6}` i testID na polu TDS, oraz `maxLength={1000}` na notatkach.
2. **02-MON:** `app-access.ts`: rygorystyczne czyszczenie flag zakupu (`has_verified_purchase`, `verified_purchase_tier`, `verified_receipt_json`) w pomocniku testowym `setTrialExpiredForTesting`.
3. **03-ZAK:** `bpr-engine.ts`: dynamiczny fallback do bieżącej daty UTC ISO (`new Date().toISOString().slice(0, 10)`) w `generateActionIcsContent`.
4. **04-STU:** `BeanTopBar.tsx`: testID na filtrach chipsów oraz pełna lokalizacja etykiet filtrów i przycisku dodawania ziarna.
5. **05-ARC:** `database.ts`: normalizacja wielkości liter `beverageType` (`.trim().toUpperCase()`) w zapytaniach `getRecipes`.
6. **06-TRE:** `knowledge-data.ts`: dodanie mapowania kodów ISO i aliasów pisowni `ORIGIN_ALIASES` w `findCoffeeOriginById`.
7. **07-JAK:** `water-chemistry.ts`: rygorystyczne odrzucanie typów nieliczbowych i nienapisowych w konwerterach twardości `ppmCaCO3ToDegreesDH` i `degreesDHToPpmCaCO3`.
8. **08-PRO:** `grinder-converter.ts`: rozpoznawanie ekspresów dźwigniowych (`FLAIR`, `ROBOT`, `CAFELAT_ROBOT`, `ROK`) jako przemiał pod espresso (350 µm) w `getRecipeMicrons`.
9. **09-LOK:** `locales/*`: dodanie klucza `brew.methodFlair` ("Ekspres dźwigniowy (Flair / Robot)" / "Manual Lever (Flair / Robot)") w 35 językach i rozszerzenie matrycy testów do 827.
10. **10-WYD:** `scripts/verify-native.mjs`: statyczna weryfikacja obecności skryptów audytowych w `package.json`.
11. **11-WZR:** `recipe-share.ts`: wczesne wyjście dla nienapisowych i pustych danych w `decodeRecipeFromShareUrl`.
12. **12-NIE:** `live-activity.ts`: clampowanie `totalWaterGrams` do 50000 g w `buildLiveActivityPayload`.

---

## Status Zadań (12 Perspektyw)

| ID | Perspektywa | Status | Plik główny | Commit |
|---|---|---|---|---|
| TASK-P40-01-ODK | Odkrywanie | Pending | `src/components/brew/BrewFinishModal.tsx` | - |
| TASK-P40-02-MON | Monetyzacja | Pending | `src/core/app-access.ts` | - |
| TASK-P40-03-ZAK | Zaskoczenie | Pending | `src/core/bpr-engine.ts` | - |
| TASK-P40-04-STU | Studiowanie | Pending | `src/components/beans/BeanTopBar.tsx` | - |
| TASK-P40-05-ARC | Architektura | Pending | `src/core/database.ts` | - |
| TASK-P40-06-TRE | Treść | Pending | `src/core/knowledge-data.ts` | - |
| TASK-P40-07-JAK | Jakość | Pending | `src/core/water-chemistry.ts` | - |
| TASK-P40-08-PRO | Prostota | Pending | `src/core/grinder-converter.ts` | - |
| TASK-P40-09-LOK | Lokalizacja | Pending | `locales/*` | - |
| TASK-P40-10-WYD | Wydajność | Pending | `scripts/verify-native.mjs` | - |
| TASK-P40-11-WZR | Wzorce | Pending | `src/core/recipe-share.ts` | - |
| TASK-P40-12-NIE | Niezawodność | Pending | `src/core/live-activity.ts` | - |

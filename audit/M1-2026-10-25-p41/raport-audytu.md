# Raport z Audytu Generalnego M1 — Przebieg 41 (P41)

**Data audytu:** 2026-10-26  
**Audytor:** M1 Audytor Generalny  
**Tryb:** Głęboki audyt całości ad hoc (ciągły, iteracyjny)  
**Stan wyjściowy:** Commit `13b569c` (103 test suites, 1072 tests pass, 572 i18n keys w 35 językach, 827/827 matrycy)  
**Stan końcowy:** W trakcie realizacji (12 perspektyw audytowych)

---

## Zakres Przebiegu 41 (12 Perspektyw)

1. **01-ODK:** `BrewHeader.tsx`: semantyczne `accessibilityRole="button"`, `accessibilityState={{ disabled: isLocked }}` oraz dedykowane identyfikatory `testID` dla przełącznika dźwięku i akcji nagłówka.
2. **02-MON:** `app-access.ts`: sanitacja i normalizacja parametru tieru w `activateSubscription` z zabezpieczeniem przed pustym ciągiem i fallbackiem do `'annual'`.
3. **03-ZAK:** `bpr-engine.ts`: normalizacja `beverageType` w `buildProactiveActionSchedule` pod kątem parzenia herbaty specialty.
4. **04-STU:** `BeanAddModal.tsx`: rygorystyczne limity długości pól (`maxLength={200}` dla nazwy, `100` dla palarni/producenta i pochodzenia) oraz clampowanie wag `[0, 100000]`.
5. **05-ARC:** `database.ts`: sanitacja parametru `offset` w `getBrewSessions(limit, offset)` z ochroną przed ujemnymi wartościami, `NaN` i `-0`.
6. **06-TRE:** `knowledge-data.ts`: rozszerzenie `VARIETY_ALIASES` o odmiany `sidra`, `wush-wush`, `batian`, `ruiru-11` oraz `sl-34`.
7. **07-JAK:** `water-chemistry.ts`: ochrona przed `-0` i stringami `-0` w parametrze `waterVolumeLiters` w `calculateWaterMinerals`.
8. **08-PRO:** `grinder-converter.ts`: rozpoznawanie `Cold Drip` i `Ice Drip` w opisach grindu oraz metodzie w `getRecipeMicrons` (1150 µm).
9. **09-LOK:** `locales/*`: dodanie klucza `brew.methodColdDrip` ("Cold Drip / Ice Drip") w 35 językach i rozszerzenie matrycy testów do 828.
10. **10-WYD:** `scripts/verify-native.mjs`: statyczna weryfikacja obecności skryptu `test:coverage` w `package.json`.
11. **11-WZR:** `recipe-share.ts`: usuwanie pustych i whitespace-only `desc` oraz normalizacja `beverageType` w `recipeToCompactPayload`.
12. **12-NIE:** `live-activity.ts`: ochrona `stepDurationSeconds` przed `-0` i stringiem `-0` w `buildDynamicIslandPayload`.

---

## Status Zadań (12 Perspektyw)

| ID | Perspektywa | Status | Plik główny | Commit |
|---|---|---|---|---|
| TASK-P41-01-ODK | Odkrywanie | Pending | `src/components/brew/BrewHeader.tsx` | - |
| TASK-P41-02-MON | Monetyzacja | Pending | `src/core/app-access.ts` | - |
| TASK-P41-03-ZAK | Zaskoczenie | Pending | `src/core/bpr-engine.ts` | - |
| TASK-P41-04-STU | Studiowanie | Pending | `src/components/beans/BeanAddModal.tsx` | - |
| TASK-P41-05-ARC | Architektura | Pending | `src/core/database.ts` | - |
| TASK-P41-06-TRE | Treść | Pending | `src/core/knowledge-data.ts` | - |
| TASK-P41-07-JAK | Jakość | Pending | `src/core/water-chemistry.ts` | - |
| TASK-P41-08-PRO | Prostota | Pending | `src/core/grinder-converter.ts` | - |
| TASK-P41-09-LOK | Lokalizacja | Pending | `locales/*` | - |
| TASK-P41-10-WYD | Wydajność | Pending | `scripts/verify-native.mjs` | - |
| TASK-P41-11-WZR | Wzorce | Pending | `src/core/recipe-share.ts` | - |
| TASK-P41-12-NIE | Niezawodność | Pending | `src/core/live-activity.ts` | - |

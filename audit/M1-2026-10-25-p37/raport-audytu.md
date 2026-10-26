# Raport z Audytu Generalnego M1 — Przebieg 37 (P37)

**Data audytu:** 2026-10-26  
**Audytor:** M1 Audytor Generalny  
**Tryb:** Głęboki audyt całości ad hoc (ciągły, iteracyjny)  
**Stan wyjściowy:** Commit `5744df2` (103 test suites, 1028 tests pass, 568 i18n keys w 35 językach, 823/823 matrycy)

---

## Podsumowanie Wykonawcze

Przebieg 37 (P37) koncentruje się na:
1. **01-ODK:** Dostępności a11y w `BrewHeader.tsx`: semantycznych rolach `button`, `accessibilityState={{ selected }}` i etykietach dla chipów ulubionych, selektora spiżarni oraz przycisku Gongfu Cha.
2. **02-MON:** Ścisłej nieujemności i ochronie przed `-0` dla `effectiveElapsedDays` oraz `effectiveBrewsCount` w `getAppAccessState`.
3. **03-ZAK:** Sanityzacji i walidacji dozy, wody oraz temperatury w rekomendacjach powtórzenia sesji w `buildProactiveActionSchedule`.
4. **04-STU:** Defensywnej walidacji wagi początkowej (zapobieganie ujemnym wagom) i ograniczeniu długości pól tekstowych w `BeanAddModal`.
5. **05-ARC:** Ochronie przed `-0` dla parametrów fizycznych oraz weryfikacji poprawności JSON w `duplicateRecipe`.
6. **06-TRE:** Wprowadzeniu słownika synonimów i aliasów kategorii herbaty (`TEA_ALIASES`) w `findTeaCategoryById`.
7. **07-JAK:** Odporności `calculateWaterMinerals`, `ppmCaCO3ToDegreesDH` i `degreesDHToPpmCaCO3` na wartości `null` i `undefined`.
8. **08-PRO:** Rozpoznawaniu systemu Toddy oraz porcelanowego drippera Karlsbad / Bayreuther (1150 µm) w `getRecipeMicrons`.
9. **09-LOK:** Dodaniu klucza `brew.methodTrinityOne` ("Trinity ONE") w 35 językach App Store (569 kluczy, 824/824 matrycy testów).
10. **10-WYD:** Statycznej weryfikacji 1:1 spójności `ios.bundleIdentifier === android.package` oraz `scheme === slug` w `scripts/verify-native.mjs`.
11. **11-WZR:** Ochronie przed `-0` dla docelowej wagi wody w poszczególnych krokach receptury w `recipeToCompactPayload` i `decodeRecipeFromShareUrl`.
12. **12-NIE:** Obsłudze parsowania numerycznych stringów i ochronie przed `-0` dla czasów `stepDurationSeconds` i `totalElapsedSeconds` w `buildLiveActivityPayload`.

---

## Status Zadań (12 Perspektyw)

| ID | Perspektywa | Status | Plik główny | Commit |
|---|---|---|---|---|
| TASK-P37-01-ODK | Odkrywanie | Pending | `src/components/brew/BrewHeader.tsx` | - |
| TASK-P37-02-MON | Monetyzacja | Pending | `src/core/app-access.ts` | - |
| TASK-P37-03-ZAK | Zaskoczenie | Pending | `src/core/bpr-engine.ts` | - |
| TASK-P37-04-STU | Studiowanie | Pending | `src/components/beans/BeanAddModal.tsx` | - |
| TASK-P37-05-ARC | Architektura | Pending | `src/core/database.ts` | - |
| TASK-P37-06-TRE | Treść | Pending | `src/core/knowledge-data.ts` | - |
| TASK-P37-07-JAK | Jakość | Pending | `src/core/water-chemistry.ts` | - |
| TASK-P37-08-PRO | Prostota | Pending | `src/core/grinder-converter.ts` | - |
| TASK-P37-09-LOK | Lokalizacja | Pending | `locales/*` | - |
| TASK-P37-10-WYD | Wydajność | Pending | `scripts/verify-native.mjs` | - |
| TASK-P37-11-WZR | Wzorce | Pending | `src/core/recipe-share.ts` | - |
| TASK-P37-12-NIE | Niezawodność | Pending | `src/core/live-activity.ts` | - |

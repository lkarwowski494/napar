# Raport z Audytu Generalnego M1 — Przebieg 38 (P38)

**Data audytu:** 2026-10-26  
**Audytor:** M1 Audytor Generalny  
**Tryb:** Głęboki audyt całości ad hoc (ciągły, iteracyjny)  
**Stan wyjściowy:** Commit `7630bcd` (103 test suites, 1039 tests pass, 569 i18n keys w 35 językach, 824/824 matrycy)

---

## Podsumowanie Wykonawcze

Przebieg 38 (P38) koncentruje się na:
1. **01-ODK:** Dostępności a11y w `BrewActiveFocusTimer.tsx`: dodaniu `accessibilityState={{ disabled }}` do przycisku wstecz, `accessibilityHint` dla przycisków korekty czasu (+/-10s) oraz identyfikatorów `testID`.
2. **02-MON:** Normalizacji wielkości liter i trimowaniu `subscription_tier` w `getAppAccessState` chroniąc przed nieoczekiwanym fallbackiem do `'none'`.
3. **03-ZAK:** Wczesnym wyjściu dla pustych ciągów instrukcji oraz ochronie przed `-0` w `parseStepDurationSeconds`.
4. **04-STU:** Clampowaniu wag (`[0, 100000]`), ochronie przed `-0` oraz sanitacji długości pól tekstowych w `BeanEditModal.tsx`.
5. **05-ARC:** Defensywnej sanityzacji `flavorTags`, `recipeId` i `inventoryItemId` w `saveBrewSession` (konwersja pustych stringów na `null`).
6. **06-TRE:** Naprawie mapowania aliasów odmian w `VARIETY_ALIASES` (`caturra`, `catuai` -> `variety-caturra-catuai`, `pacamara`, `maragogype` -> `variety-pacamara-maragogype`, `castillo` -> `variety-castillo-colombia`, `heirloom` -> `variety-ethiopian-landraces`).
7. **07-JAK:** Odrzucaniu wartości `boolean` i bezpiecznym pobieraniu z `BOTTLED_WATER_BENCHMARKS` w `findBottledWaterById`.
8. **08-PRO:** Rozpoznawaniu metod Walküre (Walkuere) oraz Vacpot w `getRecipeMicrons`.
9. **09-LOK:** Dodaniu klucza `brew.methodWalkuere` ("Walküre / Bayreuth") w 35 językach App Store (570 kluczy, 825/825 matrycy testów).
10. **10-WYD:** Statycznej weryfikacji `appJson.android.versionCode` jako dodatniej liczby całkowitej w `scripts/verify-native.mjs`.
11. **11-WZR:** Ścisłym clampowaniu `recommendedRatio` do zakresu `[1, 100]` w `recipeToCompactPayload` i `decodeRecipeFromShareUrl`.
12. **12-NIE:** Ochronie przed `-0` i wartościami nienumerycznymi w `formatActivityTimer` w `src/core/live-activity.ts`.

---

## Status Zadań (12 Perspektyw)

| ID | Perspektywa | Status | Plik główny | Commit |
|---|---|---|---|---|
| TASK-P38-01-ODK | Odkrywanie | Pending | `src/components/brew/BrewActiveFocusTimer.tsx` | - |
| TASK-P38-02-MON | Monetyzacja | Pending | `src/core/app-access.ts` | - |
| TASK-P38-03-ZAK | Zaskoczenie | Pending | `src/core/bpr-engine.ts` | - |
| TASK-P38-04-STU | Studiowanie | Pending | `src/components/beans/BeanEditModal.tsx` | - |
| TASK-P38-05-ARC | Architektura | Pending | `src/core/database.ts` | - |
| TASK-P38-06-TRE | Treść | Pending | `src/core/knowledge-data.ts` | - |
| TASK-P38-07-JAK | Jakość | Pending | `src/core/water-chemistry.ts` | - |
| TASK-P38-08-PRO | Prostota | Pending | `src/core/grinder-converter.ts` | - |
| TASK-P38-09-LOK | Lokalizacja | Pending | `locales/*` | - |
| TASK-P38-10-WYD | Wydajność | Pending | `scripts/verify-native.mjs` | - |
| TASK-P38-11-WZR | Wzorce | Pending | `src/core/recipe-share.ts` | - |
| TASK-P38-12-NIE | Niezawodność | Pending | `src/core/live-activity.ts` | - |

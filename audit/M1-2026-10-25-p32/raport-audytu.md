# Raport z Audytu: Przebieg 32 (P32)

**Projekt:** Napar (Aplikacja mobilna do kawy i herbaty, iOS/Android)  
**Data:** 2026-10-26  
**Audytor:** M1 Audytor Generalny (Kroki 1–20)  
**Stan wyjściowy:** Commit `9302b2f` (99/99 test suites, 967 testów PASS, 562 klucze i18n, 817/817 matrix)  
**Stan końcowy:** Commit `001e3ae` (100/100 test suites, 979 testów PASS, 564 klucze i18n, 819/819 matrix)  
**Zakres:** Accessibility Labels & HitSlop, Sensor Precision, Extraction Kinetics, Nullable Database Sanity, and Complete Multilingual Harmony  

---

## 1. Wykaz Ustaleń Audytu (12 Perspektyw)

| Perspektywa | Identyfikator | Opis Ustalenia | Status | Commit |
| :--- | :--- | :--- | :--- | :--- |
| **01-ODK** | `TASK-P32-01-ODK` | W `RecipeStepEditor.tsx` przyciski usuwania kroków posiadały generyczną, niezlokalizowaną etykietę `"Usuń krok"` i mały `hitSlop={6}`. Dodano numer kroku w `accessibilityLabel`, podniesiono `hitSlop` do 8 i dodano `accessibilityHint`. Utworzono test `RecipeStepEditor.test.tsx`. | Zrealizowano | `df97e69` |
| **02-MON** | `TASK-P32-02-MON` | W `PassSettingsCard.tsx` etykieta pozostałych parzeń w trialu używała uproszczonej formy liczby mnogiej nieobsługującej polskich reguł słowiańskich powyżej 4 (np. 22 parzenia). Zintegrowano `pluralPl` oraz zabezpieczono `brewsRemaining >= 0`. Zaktualizowano test `PassSettingsCard.test.tsx`. | Zrealizowano | `718ac2a` |
| **03-ZAK** | `TASK-P32-03-ZAK` | W `domain-rules.ts` `calculateRemainingCaffeineMg` i `calculateHoursUntilSafeCaffeine` nie parsowały numerycznych stringów ani nie neutralizowały wartości `-0`. Dodano parsowanie stringów i ochronę `-0`. Zaktualizowano testy w `domain-rules.test.ts`. | Zrealizowano | `9580b16` |
| **04-STU** | `TASK-P32-04-STU` | W `RecipeStepEditor.tsx` tytuł sekcji kroków nie deklarował roli `accessibilityRole="header"`, a podpola formularza były zahardkodowane po polsku. Dodano rolę `header` oraz lokalizację etykiet pól za pomocą `t.recipeBuilder`. | Zrealizowano | `3a55fd7` |
| **05-ARC** | `TASK-P32-05-ARC` | W `database.ts` `deductInventoryWeight` nie parsował dawek przekazanych jako string ani nie chronił `remainingWeightGrams` przed `-0`. Dodano bezpieczne parsowanie i ochronę `-0`. Zaktualizowano test w `database.test.ts`. | Zrealizowano | `6b8eba5` |
| **06-TRE** | `TASK-P32-06-TRE` | W `knowledge-data.ts` `findCoffeeOriginById` wyszukiwał wyłącznie po `id` oraz `countryCode`, pomijając zlokalizowane nazwy krajów `country` i `countryEn`. Dodano wyszukiwanie po nazwie kraju z normalizacją diakrytyków i wielkości liter. Zaktualizowano test w `knowledge.test.ts`. | Zrealizowano | `9bcc40e` |
| **07-JAK** | `TASK-P32-07-JAK` | W `water-chemistry.ts` `getWaterProfileName` nie potrafił rozpoznać wód butelkowanych ani receptur przekazanych po ich wyświetlanej nazwie. Dodano lookup po ID oraz nazwie wyświetlanej via `findWaterRecipeById` i `findBottledWaterById`. Zaktualizowano test w `water-chemistry.test.ts`. | Zrealizowano | `cda1b01` |
| **08-PRO** | `TASK-P32-08-PRO` | W `grinder-converter.ts` `getRecipeMicrons` nie rozpoznawał napojów Flat White, Cortado i Macchiato i zwracał domyślne 720 µm. Dodano mapowanie do 350 µm (espresso fine). Zaktualizowano test w `grinder-converter.test.ts`. | Zrealizowano | `872d393` |
| **09-LOK** | `TASK-P32-09-LOK` | Dodanie kluczy `paramsAndRatio` oraz `stepName` w 35 językach (osiągając 564 klucze i 819/819 matrycy testowej przy 100% symetrii parametrów). Zaktualizowano test `i18n.test.ts`. | Zrealizowano | `0490617` |
| **10-WYD** | `TASK-P32-10-WYD` | W `scripts/verify-native.mjs` dodano statyczną weryfikację poprawności binarnej ikony `assets/favicon.png` (nagłówek PNG `89 50 4E 47`, w/h >= 32). Zweryfikowano `npm run check:native`. | Zrealizowano | `e3c832b` |
| **11-WZR** | `TASK-P32-11-WZR` | W `recipe-share.ts` `decodeRecipeFromShareUrl` nie parsował numerycznego stringa `parsed.r` i nie chronił `doseGrams`/`waterGrams` przed `-0`. Dodano bezpieczne parsowanie i ochronę `-0`. Zaktualizowano test w `recipe-share.test.ts`. | Zrealizowano | `2144db0` |
| **12-NIE** | `TASK-P32-12-NIE` | W `live-activity.ts` `updateLiveActivity` nie walidował `_state.totalSteps <= 0`. Dodano walidację i unit testy w `live-activity.test.ts`. | Zrealizowano | `001e3ae` |

---

## 2. Bramka Jakości (Quality Gate P32)

1. **Testy jednostkowe i integracyjne:** 100/100 test suites PASS, 979/979 testów PASS (w tym nowy dedykowany zestaw `RecipeStepEditor.test.tsx`).
2. **Matryca testowa (RD-ENG-08):** 819/819 elementów (100% pokrycia).
3. **Lokalizacja (i18n):** 564 kluczy w 35 językach ze 100% symetrią parametrów interpolacyjnych.
4. **Typowanie TypeScript:** `tsc --noEmit` — 0 błędów.
5. **Niezmienniki natywne:** `check:native` — 0 naruszeń (iOS Info.plist, Android permissions, PNG headers).
6. **Licencje:** `check:licenses` — 19 zależności produkcyjnych zweryfikowanych (0 naruszeń GPL/LGPL).
7. **Brak telemetrii:** 100% offline-first, brak zewnętrznych trackerów, zerowa telemetria.

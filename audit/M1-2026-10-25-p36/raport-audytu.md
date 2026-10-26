# Raport z Audytu Generalnego M1 — Przebieg 36 (P36)

**Data audytu:** 2026-10-26  
**Audytor:** M1 Audytor Generalny  
**Tryb:** Głęboki audyt całości ad hoc (ciągły, iteracyjny)  
**Stan wyjściowy:** Commit `bc4bed8` (102 test suites, 1016 tests pass, 567 i18n keys w 35 językach, 822/822 matrycy)

---

## Podsumowanie Wykonawcze

Przebieg 36 (P36) koncentruje się na:
1. **01-ODK:** Semantycznym `accessibilityState` (`expanded`, `selected`) oraz wielojęzycznych etykietach w `BrewProAccordion`.
2. **02-MON:** Niewrażliwej na wielkość liter normalizacji tieru subskrypcji w `restorePurchases` oraz ochronie przed `-0` w `recordBrewCompleted`.
3. **03-ZAK:** Odporności generatora 14-dniowego kalendarza `buildFourteenDayCalendar` na nieprawidłowe typy daty bazowej i nielistowe dane wejściowe.
4. **04-STU:** Dostępności filtrów (`accessibilityState={{ selected }}`) i defensywnej obsłudze braku elementów w `BeanTopBar`.
5. **05-ARC:** Sanityzacji `beverageType`, `name` i `method` w `saveRecipe` oraz walidacji numerycznych stringów dozy w `recordBrewSessionTransaction`.
6. **06-TRE:** Wsparciu dla popularnych synonimów i aliasów procesów obróbki kawy (`PROCESS_ALIASES`) w `findCoffeeProcessById`.
7. **07-JAK:** Ścisłym odrzucaniu typów `null` i `undefined` w `diagnoseWaterSensoryImpact`.
8. **08-PRO:** Rozpoznawaniu odmian parzenia na zimno (Mizudashi, Dutch Coffee, Kyoto Cold Brew) w `getRecipeMicrons` (1150 µm).
9. **09-LOK:** Wprowadzeniu klucza `brew.methodGina` we wszystkich 35 językach App Store (568 kluczy, 823/823 matrycy).
10. **10-WYD:** Statycznej weryfikacji ciemnego tła ekranu powitalnego (`splash.backgroundColor === '#121214'`) i jego zgodności z ikoną adaptacyjną Androida.
11. **11-WZR:** Poprawnej obsłudze numerycznych opisów mielenia (np. `14`, `24`) w `recipeToCompactPayload` i `decodeRecipeFromShareUrl`.
12. **12-NIE:** Walidacji zakresu docelowej wody `targetWaterGrams` (`[0, 50000]`) i ochronie przed `-0` w `updateLiveActivity`.

---

## Status Zadań (12 Perspektyw)

| ID | Perspektywa | Status | Plik główny | Commit |
|---|---|---|---|---|
| TASK-P36-01-ODK | Odkrywanie | Pending | `src/components/brew/BrewProAccordion.tsx` | - |
| TASK-P36-02-MON | Monetyzacja | Pending | `src/core/app-access.ts` | - |
| TASK-P36-03-ZAK | Zaskoczenie | Pending | `src/core/bpr-engine.ts` | - |
| TASK-P36-04-STU | Studiowanie | Pending | `src/components/beans/BeanTopBar.tsx` | - |
| TASK-P36-05-ARC | Architektura | Pending | `src/core/database.ts` | - |
| TASK-P36-06-TRE | Treść | Pending | `src/core/knowledge-data.ts` | - |
| TASK-P36-07-JAK | Jakość | Pending | `src/core/water-chemistry.ts` | - |
| TASK-P36-08-PRO | Prostota | Pending | `src/core/grinder-converter.ts` | - |
| TASK-P36-09-LOK | Lokalizacja | Pending | `locales/*` | - |
| TASK-P36-10-WYD | Wydajność | Pending | `scripts/verify-native.mjs` | - |
| TASK-P36-11-WZR | Wzorce | Pending | `src/core/recipe-share.ts` | - |
| TASK-P36-12-NIE | Niezawodność | Pending | `src/core/live-activity.ts` | - |

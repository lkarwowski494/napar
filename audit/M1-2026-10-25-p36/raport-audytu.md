# Raport z Audytu Generalnego M1 — Przebieg 36 (P36)

**Data audytu:** 2026-10-26  
**Audytor:** M1 Audytor Generalny  
**Tryb:** Głęboki audyt całości ad hoc (ciągły, iteracyjny)  
**Stan wyjściowy:** Commit `bc4bed8` (102 test suites, 1016 tests pass, 567 i18n keys w 35 językach, 822/822 matrycy)  
**Stan końcowy:** 103 test suites, 1028 tests pass, 568 i18n keys w 35 językach (100% symetrii parametrów), 823/823 matrycy testów (100%)

---

## Podsumowanie Wykonawcze

Przebieg 36 (P36) zrealizował pełny cykl 12 perspektyw audytowych:
1. **01-ODK (Odkrywanie):** `BrewProAccordion.tsx` — Dodano `accessibilityState={{ expanded: isExpanded }}` do nagłówka akordeonu, `accessibilityState={{ selected: active }}` oraz zlokalizowane etykiety (`w.nameEn || w.namePl`) dla chipów profili wody, a także etykietę dostępności dla `pro-tds-input`.
2. **02-MON (Monetyzacja):** `app-access.ts` — Zapewniono niewrażliwą na wielkość liter normalizację tieru subskrypcji w `restorePurchases()`, uodporniając odzyskiwanie licencji na wpisy typu `'Annual'` / `'Lifetime'`, oraz dodano ścisłą ochronę przed `-0` w `recordBrewCompleted()`.
3. **03-ZAK (Zaskoczenie):** `bpr-engine.ts` — Wzmocniono defensywność `buildFourteenDayCalendar`, chroniąc przed uszkodzonymi/pustymi wartościami `referenceDateIso` oraz danymi nielistowymi w `inventory` i `sessions`.
4. **04-STU (Studiowanie):** `BeanTopBar.tsx` — Wdrożono `accessibilityState={{ selected }}` dla chipów filtrów spiżarni, uodporniono komponent na brak lub `null` w tablicy `items`, oraz dodano dedykowany zestaw testów jednostkowych `BeanTopBar.test.tsx` (zwiększając łączną liczbę zestawów do 103).
5. **05-ARC (Architektura):** `database.ts` — Wprowadzono sanityzację pól `name`, `beverageType` i `method` w `saveRecipe` oraz bezpieczne parsowanie i walidację stringów numerycznych dla odliczanej wagi ziaren w `recordBrewSessionTransaction`.
6. **06-TRE (Treść):** `knowledge-data.ts` — Dodano słownik aliasów procesów obróbki kawy (`PROCESS_ALIASES`) w `findCoffeeProcessById`, umożliwiający rozpoznawanie m.in. `washed`, `mokra`, `natural`, `sucha`, `honey`, `anaerobic`, `carbonic`, `wet-hulled`, `giling-basah`.
7. **07-JAK (Jakość):** `water-chemistry.ts` — Wprowadzono jawne odrzucanie typów `null` i `undefined` w `diagnoseWaterSensoryImpact`, zapobiegając niejawnej koercji JS do 0 ppm.
8. **08-PRO (Prostota):** `grinder-converter.ts` — Rozszerzono `getRecipeMicrons` o rozpoznawanie wariantów parzenia na zimno: Mizudashi, Dutch Coffee i Kyoto Cold Brew (1150 µm).
9. **09-LOK (Lokalizacja):** `locales/*` & `src/core/i18n.tsx` — Dodano klucz `brew.methodGina` we wszystkich 35 językach App Store (568 kluczy, 823/823 matrycy testów).
10. **10-WYD (Wydajność):** `scripts/verify-native.mjs` — Dodano statyczną weryfikację ciemnego tła ekranu powitalnego (`expo.splash.backgroundColor === '#121214'`) i jego pełnej spójności z tłem ikony adaptacyjnej Androida.
11. **11-WZR (Wzorce):** `recipe-share.ts` — Wprowadzono obsługę numerycznych opisów mielenia (np. `14`, `24`) w `recipeToCompactPayload` oraz `decodeRecipeFromShareUrl`.
12. **12-NIE (Niezawodność):** `live-activity.ts` — W `updateLiveActivity` dodano walidację docelowej wagi wody `targetWaterGrams` z clampowaniem do `[0, 50000]` i ochroną przed `-0`.

---

## Status Zadań (12 Perspektyw)

| ID | Perspektywa | Status | Plik główny | Commit |
|---|---|---|---|---|
| TASK-P36-01-ODK | Odkrywanie | Completed | `src/components/brew/BrewProAccordion.tsx` | `f695631` |
| TASK-P36-02-MON | Monetyzacja | Completed | `src/core/app-access.ts` | `4db7207` |
| TASK-P36-03-ZAK | Zaskoczenie | Completed | `src/core/bpr-engine.ts` | `b5e9434` |
| TASK-P36-04-STU | Studiowanie | Completed | `src/components/beans/BeanTopBar.tsx` | `77b6bed`, `5931480` |
| TASK-P36-05-ARC | Architektura | Completed | `src/core/database.ts` | `ff07e28`, `5931480` |
| TASK-P36-06-TRE | Treść | Completed | `src/core/knowledge-data.ts` | `29fc31f` |
| TASK-P36-07-JAK | Jakość | Completed | `src/core/water-chemistry.ts` | `7fdc929` |
| TASK-P36-08-PRO | Prostota | Completed | `src/core/grinder-converter.ts` | `c8999fc` |
| TASK-P36-09-LOK | Lokalizacja | Completed | `locales/*` | `d7503ea` |
| TASK-P36-10-WYD | Wydajność | Completed | `scripts/verify-native.mjs` | `6099d82` |
| TASK-P36-11-WZR | Wzorce | Completed | `src/core/recipe-share.ts` | `b871aaa` |
| TASK-P36-12-NIE | Niezawodność | Completed | `src/core/live-activity.ts` | `ab23afb` |

---

## Wyniki Bramek Jakościowych

- `npm run check:i18n`: PASS (568 kluczy, 35 języków, 100% symetrii parametrów)
- `npm run check:matrix`: PASS (823/823 elementów, 100%)
- `npm run check:corpus`: PASS (wyrocznie prawdy Python zweryfikowane)
- `npm run check:licenses`: PASS (0 naruszeń GPL/LGPL)
- `npm run check:native`: PASS (iOS infoPlist, dark splash background `#121214`, adaptiveIcon, bundleIdentifier)
- `npm run typecheck`: PASS (0 błędów TypeScript)
- `npm test`: PASS (103 test suites, 1028 tests passed)

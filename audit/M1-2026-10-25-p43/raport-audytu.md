# Raport z Audytu Generalnego M1 — Przebieg 43 (P43)

**Data audytu:** 2026-10-26  
**Audytor:** M1 Audytor Generalny  
**Tryb:** Głęboki audyt całości ad hoc (ciągły, iteracyjny)  
**Stan wyjściowy:** Commit `908fb1a` (103 test suites, 1094 tests pass, 574 i18n keys w 35 językach, 829/829 matrycy)  
**Stan docelowy:** Realizacja 12 perspektyw audytowych (01-ODK do 12-NIE) w ścisłym reżimie TDD.

---

## Zakres Przebiegu 43 (12 Perspektyw)

1. **01-ODK:** `BrewFinishModal.tsx`: Dostępność ocen gwiazdkowych (`accessibilityRole="radiogroup"`, `accessible={true}`, `accessibilityLabel`) oraz sanityzacja `waterGrams`, `rating` i wskaźników kosztowych `brewCost` (`safeTotalHomeCost`, `safeCoffeeCost`, `safeWaterCost`, itp.).
2. **02-MON:** `app-access.ts`: Weryfikacja struktury paragonu w `restorePurchases` (ochrona przed tablicami/nieprawidłowymi polami) oraz case-insensitivity identyfikatora produktu w `verifyAndActivateStoreKitPurchase`.
3. **03-ZAK:** `bpr-engine.ts`: Generowanie zgodnego z RFC 5545 znacznika `DTSTAMP` w czasie UTC w `generateActionIcsContent` oraz sanityzacja wag w `buildProactiveActionSchedule`.
4. **04-STU:** `RecipeSelectModal.tsx`: Naprawa filtrowania `subsetFilter === 'FAVORITES'` (usunięcie błędnego warunku `&& r.isCustom`), dodanie `testID={`duplicate-recipe-${r.id}`}` oraz bezpieczny fallback dla `t?.brew?.duplicateRecipe`.
5. **05-ARC:** `database.ts`: Zabezpieczenie `importDataJson` przed nie-tablicami w polach kopii zapasowej (`data.inventory`, `data.customRecipes`, `data.sessions`, `data.caffeineLogs`).
6. **06-TRE:** `knowledge-data.ts`: Rozszerzenie `TEA_ALIASES` o popularne odmiany herbat: `sencha`, `gyokuro`, `matcha`, `genmaicha`, `longjing`, `darjeeling`, `assam`, `ceylon`, `earlgrey`, `lapsang`, `tieguanyin`, `dahongpao`, `dancong`, `silverneedle`, `baimudan`.
7. **07-JAK:** `water-chemistry.ts`: Wsparcie wariantów językowych `en-US` w `getWaterProfileName` oraz graceful fallback dla nie-stringowych ID.
8. **08-PRO:** `grinder-converter.ts`: Rozpoznawanie zaparzaczy ciśnieniowych `Flair`, `Cafelat Robot`, `ROK` w Espresso oraz `Orea`, `April`, `Melitta`, `Beehouse` w Pour-over w `getRecipeMicrons`.
9. **09-LOK:** `locales/*` & `src/core/i18n.tsx`: Dodanie klucza `brew.editRecipe` ("Edytuj recepturę" / "Edit Recipe") w 35 językach i rozszerzenie matrycy testów do 830.
10. **10-WYD:** `scripts/verify-native.mjs`: Statyczna weryfikacja obecności skryptów `check`, `verify` oraz devDependency `typescript` w `package.json`.
11. **11-WZR:** `recipe-share.ts`: Case-insensitive normalizacja typu naparu `coffee`/`tea` w `decodeRecipeFromShareUrl`.
12. **12-NIE:** `live-activity.ts`: Walidacja zakresu parametrów początkowych `initialState` w `startLiveActivity` oraz normalizacja `dismissalPolicy` w `endLiveActivity`.

---

## Status Zadań (12 Perspektyw)

| ID | Perspektywa | Status | Plik główny | Commit |
|---|---|---|---|---|
| TASK-P43-01-ODK | Odkrywanie | Pending | `src/components/brew/BrewFinishModal.tsx` | - |
| TASK-P43-02-MON | Monetyzacja | Pending | `src/core/app-access.ts` | - |
| TASK-P43-03-ZAK | Zaskoczenie | Pending | `src/core/bpr-engine.ts` | - |
| TASK-P43-04-STU | Studiowanie | Pending | `src/components/brew/RecipeSelectModal.tsx` | - |
| TASK-P43-05-ARC | Architektura | Pending | `src/core/database.ts` | - |
| TASK-P43-06-TRE | Treść | Pending | `src/core/knowledge-data.ts` | - |
| TASK-P43-07-JAK | Jakość | Pending | `src/core/water-chemistry.ts` | - |
| TASK-P43-08-PRO | Prostota | Pending | `src/core/grinder-converter.ts` | - |
| TASK-P43-09-LOK | Lokalizacja | Pending | `locales/*` | - |
| TASK-P43-10-WYD | Wydajność | Pending | `scripts/verify-native.mjs` | - |
| TASK-P43-11-WZR | Wzorce | Pending | `src/core/recipe-share.ts` | - |
| TASK-P43-12-NIE | Niezawodność | Pending | `src/core/live-activity.ts` | - |

# Raport z Audytu Generalnego M1 — Przebieg 48 (P48)

**Data audytu:** 2026-10-26  
**Audytor:** M1 Audytor Generalny  
**Tryb:** Głęboki audyt całości ad hoc (ciągły, iteracyjny)  
**Stan wyjściowy:** Commit `fc6075f` (103 test suites, 1144 tests pass, 581 i18n keys w 35 językach, 836/836 matrycy)  
**Stan docelowy:** Realizacja 12 perspektyw audytowych (01-ODK do 12-NIE) w ścisłym reżimie TDD.

---

## Zakres Przebiegu 48 (12 Perspektyw)

1. **01-ODK:** `BrewFinishModal.tsx`: Semantyka radiogroup dla selektora wody, defensywne domyślne wartości `notes` i `selectedTags` oraz etykiety i podpowiedzi a11y (`accessibilityHint`).
2. **02-MON:** `app-access.ts`: Zabezpieczenie przed manipulacją czasem w StoreKit (transakcje w przyszłości > 24h), sanityzacja transactionId i funkcja podsumowująca stan okresu próbnego (`formatTrialStatusSummary`).
3. **03-ZAK:** `bpr-engine.ts`: Odrzucanie wyczerpanych paczek (`remainingWeightGrams <= 0`) z aktywnych zaleceń parzenia oraz obsługa złożonych jednostek czasu (np. "1 min 30 sek").
4. **04-STU:** `RecipeBasicInfoCard.tsx`: Ograniczenia długości pól tekstowych (`name`, `method`, `author`, `description`), defensywne obcinanie i podpowiedzi a11y.
5. **05-ARC:** `database.ts`: Obsługa europejskiego przecinka dziesiętnego w `initialWeightGrams`, `remainingWeightGrams` i `rating` oraz clampowanie do [0, 100000] w `saveInventoryItem`.
6. **06-TRE:** `knowledge-data.ts`: Rozszerzenie bazy wiedzy o metody fermentacji beztlenowej i rzadkie odmiany botaniczne (Eugenioides, Laurina, Wush Wush) w `VARIETY_DESCRIPTIONS`.
7. **07-JAK:** `water-chemistry.ts`: Dodanie profilu wody "SCA Standard Water" oraz walidacja minimalnych progów mineralizacji w kalkulatorze buforu.
8. **08-PRO:** `grinder-converter.ts`: Obsługa młynków Kinu M47 i 1Zpresso J-Max w algorytmie konwersji mikronów.
9. **09-LOK:** `locales/*`: Dodanie kluczy statusu okresu próbnego (`trialStatusSummary`) we wszystkich 35 językach z zachowaniem 100% symetrii.
10. **10-WYD:** `scripts/verify-native.mjs`: Rozszerzenie weryfikacji architektury natywnej o sprawdzanie uprawnień kamery i dźwięku w deklaracjach plist/manifest.
11. **11-WZR:** `recipe-share.ts`: Walidacja poprawności formatu JSON i bezpieczne parsowanie kroków z nieznanych źródeł w `importRecipeFromSharePayload`.
12. **12-NIE:** `live-activity.ts`: Ochrona przed NaN i ujemnymi krokami w `updateLiveActivity` oraz bezpieczny fallback stanu po restarcie aplikacji.

---

## Status Zadań (12 Perspektyw)

| ID | Perspektywa | Status | Plik główny | Commit |
|---|---|---|---|---|
| TASK-P48-01-ODK | Odkrywanie | In Progress | `src/components/brew/BrewFinishModal.tsx` | - |
| TASK-P48-02-MON | Monetyzacja | Planned | `src/core/app-access.ts` | - |
| TASK-P48-03-ZAK | Zaskoczenie | Planned | `src/core/bpr-engine.ts` | - |
| TASK-P48-04-STU | Studiowanie | Planned | `src/components/recipe-builder/RecipeBasicInfoCard.tsx` | - |
| TASK-P48-05-ARC | Architektura | Planned | `src/core/database.ts` | - |
| TASK-P48-06-TRE | Treść | Planned | `src/core/knowledge-data.ts` | - |
| TASK-P48-07-JAK | Jakość | Planned | `src/core/water-chemistry.ts` | - |
| TASK-P48-08-PRO | Prostota | Planned | `src/core/grinder-converter.ts` | - |
| TASK-P48-09-LOK | Lokalizacja | Planned | `locales/*` | - |
| TASK-P48-10-WYD | Wydajność | Planned | `scripts/verify-native.mjs` | - |
| TASK-P48-11-WZR | Wzorce | Planned | `src/core/recipe-share.ts` | - |
| TASK-P48-12-NIE | Niezawodność | Planned | `src/core/live-activity.ts` | - |

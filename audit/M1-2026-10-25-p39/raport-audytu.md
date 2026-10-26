# Raport z Audytu Generalnego M1 — Przebieg 39 (P39)

**Data audytu:** 2026-10-26  
**Audytor:** M1 Audytor Generalny  
**Tryb:** Głęboki audyt całości ad hoc (ciągły, iteracyjny)  
**Stan wyjściowy:** Commit `8a22f74` (103 test suites, 1050 tests pass, 570 i18n keys w 35 językach, 825/825 matrycy)

---

## Podsumowanie Wykonawcze

Przebieg 39 (P39) koncentruje się na:
1. **01-ODK:** Dostępności a11y w `BrewQuickPrepCard.tsx`: dodaniu `accessibilityState={{ disabled: disabled || doseGrams <= 1 }}` / `>= 1000` dla dozy oraz `disabled || waterGrams <= 10` / `>= 50000` dla wody, dodaniu identyfikatorów `testID`.
2. **02-MON:** Defensywnym przywracaniu zakupów w `restorePurchases` z fallbackiem do `subscription_tier` gdy `verified_purchase_tier` jest puste.
3. **03-ZAK:** Ochronie przed typami nienapisowymi w `escapeIcsText` w silniku harmonogramu i kalendarza BPR.
4. **04-STU:** `BeanItemCard.tsx`: semantycznym `accessibilityState={{ selected: Boolean(item.isFavorite) }}`, ochronie wag przed `-0` i identyfikatorach `testID` dla akcji parzenia, edycji i archiwizacji.
5. **05-ARC:** Defensywnej sanityzacji `name`, `type`, `roastProfile` oraz tablicy `flavorNotes` w `saveInventoryItem` w `database.ts`.
6. **06-TRE:** Rozszerzeniu `PROCESS_ALIASES` o `semi-washed`, `pulped-natural` oraz szok termiczny (`thermal-shock`) w bazie wiedzy specialty.
7. **07-JAK:** Sanityzacji parametru języka i bezpiecznych fallbackach zlokalizowanych nazw w `getWaterProfileName` w chemii wody.
8. **08-PRO:** Rozpoznawaniu kawiarki Bialetti (450 µm) oraz odwróconego AeroPressu (560 µm) w kalkulatorze przemiału `getRecipeMicrons`.
9. **09-LOK:** Dodaniu klucza `brew.methodBialetti` w 35 językach App Store (571 kluczy, 826/826 matrycy testów).
10. **10-WYD:** Statycznej weryfikacji uprawnień Androida w `scripts/verify-native.mjs` gwarantującej brak uprawnień lokalizacyjnych i telemetrycznych.
11. **11-WZR:** Defensywnej obsłudze braku obiektu receptury w `encodeRecipeToShareUrl` w `recipe-share.ts`.
12. **12-NIE:** Ograniczeniu `safeTargetWater` i `safeTotalWater` do 50000 g w widżecie Dynamic Island (`buildDynamicIslandPayload`).

---

## Status Zadań (12 Perspektyw)

| ID | Perspektywa | Status | Plik główny | Commit |
|---|---|---|---|---|
| TASK-P39-01-ODK | Odkrywanie | Pending | `src/components/brew/BrewQuickPrepCard.tsx` | - |
| TASK-P39-02-MON | Monetyzacja | Pending | `src/core/app-access.ts` | - |
| TASK-P39-03-ZAK | Zaskoczenie | Pending | `src/core/bpr-engine.ts` | - |
| TASK-P39-04-STU | Studiowanie | Pending | `src/components/beans/BeanItemCard.tsx` | - |
| TASK-P39-05-ARC | Architektura | Pending | `src/core/database.ts` | - |
| TASK-P39-06-TRE | Treść | Pending | `src/core/knowledge-data.ts` | - |
| TASK-P39-07-JAK | Jakość | Pending | `src/core/water-chemistry.ts` | - |
| TASK-P39-08-PRO | Prostota | Pending | `src/core/grinder-converter.ts` | - |
| TASK-P39-09-LOK | Lokalizacja | Pending | `locales/*` | - |
| TASK-P39-10-WYD | Wydajność | Pending | `scripts/verify-native.mjs` | - |
| TASK-P39-11-WZR | Wzorce | Pending | `src/core/recipe-share.ts` | - |
| TASK-P39-12-NIE | Niezawodność | Pending | `src/core/live-activity.ts` | - |

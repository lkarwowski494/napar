# Raport z Audytu Generalnego M1 — Przebieg 35 (P35)

**Data audytu:** 2026-10-26  
**Audytor:** M1 Audytor Generalny  
**Tryb:** Głęboki audyt całości ad hoc (ciągły, iteracyjny)  
**Stan wyjściowy:** Commit `99e5de0` (101 test suites, 1003 tests pass, 566 i18n keys w 35 językach, 821/821 matrycy)

---

## Podsumowanie Wykonawcze

Przebieg 35 (P35) koncentruje się na:
1. Semantyce i dostępności a11y (rola `timer`, `accessibilityLiveRegion="assertive"` i dynamiczny odczyt czasu w `BrewActiveFocusTimer`, etykiety a11y dla badge wagi ziaren w `BeanCard`).
2. Odporności `getAppAccessState` na stringi numeryczne z SQLite dla `trial_brews_count` i ochronie przed wartościami ujemnymi.
3. Ścisłej zgodności RFC 5545 generatora zdarzeń kalendarza ICS w `bpr-engine.ts`.
4. Bezpiecznym zapisie zaawansowanych parametrów ziaren (`densityGramsPerLiter`, `moisturePercentage`, `waterActivityAw`, `rating`) w `saveInventoryItem` w `database.ts`.
5. Wzbogaceniu bazy wiedzy o synonimy i aliasy odmian (np. `gesha` -> `variety-geisha`, `sl-28` -> `variety-sl28-sl34`).
6. Clampowaniu i ochronie przed `-0` w kalkulatorach chemii wody.
7. Rozpoznawaniu metod Trinity ONE, Gina i wariantów Kalita Wave w konwerterze przemiału (720 µm).
8. Wzbogaceniu słowników o `brew.methodMoccamaster` w 35 językach (567 kluczy, 822/822 matrycy).
9. Weryfikacji natywnej nazwy wyświetlanej aplikacji (`CFBundleDisplayName === 'Napar'`).
10. Ścisłej walidacji granic i sanityzacji w `recipe-share.ts` oraz `live-activity.ts`.

---

## Status Zadań (12 Perspektyw)

| ID | Perspektywa | Status | Plik główny | Commit |
|---|---|---|---|---|
| TASK-P35-01-ODK | Odkrywanie | Pending | `src/components/brew/BrewActiveFocusTimer.tsx` | - |
| TASK-P35-02-MON | Monetyzacja | Pending | `src/core/app-access.ts` | - |
| TASK-P35-03-ZAK | Zaskoczenie | Pending | `src/core/bpr-engine.ts` | - |
| TASK-P35-04-STU | Studiowanie | Pending | `src/components/beans/BeanCard.tsx` | - |
| TASK-P35-05-ARC | Architektura | Pending | `src/core/database.ts` | - |
| TASK-P35-06-TRE | Treść | Pending | `src/core/knowledge-data.ts` | - |
| TASK-P35-07-JAK | Jakość | Pending | `src/core/water-chemistry.ts` | - |
| TASK-P35-08-PRO | Prostota | Pending | `src/core/grinder-converter.ts` | - |
| TASK-P35-09-LOK | Lokalizacja | Pending | `locales/*` | - |
| TASK-P35-10-WYD | Wydajność | Pending | `scripts/verify-native.mjs` | - |
| TASK-P35-11-WZR | Wzorce | Pending | `src/core/recipe-share.ts` | - |
| TASK-P35-12-NIE | Niezawodność | Pending | `src/core/live-activity.ts` | - |

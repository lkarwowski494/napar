# Raport Audytu — Przebieg 61 (P61)
**Data:** 2026-10-27  
**Obszary audytowane:**
- `12-NIE`: Niezawodność, odporność na chaos, testy fuzz (`fuzz-resilience.test.ts`)
- `01-ODK`: Odkrywanie i nawigacja (`search-utils.ts`)
- `02-MON`: Monetyzacja, paywall, Apps4Brew Pass (`app-access.ts`)
- `03-ZAK`: Zakupy, eksport, baza danych (`database.ts`)
- `04-SZT`: Sztuka, motyw, Craft Suite (`craft-suite-theme.ts`)

---

## 1. Ustalenia i zidentyfikowane luki

1. **12-NIE (Fuzzing ekonomii rzemiosła):**
   Nowo wprowadzone silniki kalkulacji kosztów herbaty oraz formatowania PLN wymagają systemowego testu chaosu i mutacji brzegowych (wartości ujemne, waluty w tekście, obiekty zepsute).

2. **01-ODK (Wyszukiwanie wielopolowe):**
   Komponenty wyszukiwarek (receptury, spiżarnia) ręcznie łączą stringi przed przekazaniem do `matchesSearch`. Brakowało pomocniczej funkcji `matchesAnyField(fields, query)` uodpornionej na `null`/`undefined`.

3. **02-MON (Abstrakcja dostępu Pro i poziomy subskrypcji):**
   Sprawdzanie uprawnień Pro wymagało ręcznego odczytywania statusu `isSubscribed` i `trial_active`. Brakuje dedykowanej metody `isProAccessGranted` oraz mapowania ID produktów StoreKit `getSubscriptionTierFromProductId`.

4. **03-ZAK (Eksport receptur do CSV):**
   Baza danych udostępniała eksport sesji (`exportSessionsCsv`) oraz spiżarni (`exportInventoryCsv`), lecz brakowało eksportu autorskich receptur (`exportCustomRecipesCsv`) z ochroną przed wstrzykiwaniem formuł DDE.

5. **04-SZT (Iteracja po ekosystemie Craft Suite):**
   `craft-suite-theme.ts` definiuje obiekt mapy `CRAFT_APPS`, lecz brakuje metody `getAllCraftApps()` oraz strażnika typu `isValidCraftAppId()`.

# Monetyzacja — bramka E0a i plan v1.1 (Napar)

> Decyzja właściciela: `D-021` (`DEC-01: a`, 2026-11-20) w `docs/decyzje.md`, w ciągłości z `D-001` (v1.0 całkowicie darmowa) i `D-014` (ochrona wczesnych użytkowników).

## 1. Wynik bramki E0a (wersja v1.0)

- **Model v1.0:** aplikacja **100% darmowa** — brak paywalla, brak subskrypcji, brak okresu próbnego, brak reklam i brak telemetrii.
- **Cel wydania v1.0:** 30–60-dniowy test popytu w App Store (iOS, języki `PL`, `EN`), weryfikacja retencji organicznej i jakości pętli parzenia w kuchni bez ryzyka blokady App Review (2.1 / 3.1.1) oraz bez kosztu wdrożenia StoreKit przed pierwszym kontaktem z użytkownikami.
- **Ochrona danych i wczesnych użytkowników (`D-014`):** dane użytkownika (eksport JSON/CSV, dziennik, spiżarnia) nigdy nie są zamykane za płatnością; użytkownicy v1.0 zachowują pełny dostęp do funkcji v1.0 po wprowadzeniu planów płatnych w v1.1 (mechanizm `originalApplicationVersion` w StoreKit 2).

## 2. Plan monetyzacji i ekspansji v1.1 (po 30–60 dniach od premiery v1.0)

Warunek przejścia do v1.1: ocena popytu z danych App Store Connect (pobrania, oceny, zgłoszenia na `support@apps4brew.com`) bez dodawania SDK analitycznych.

| Element planu v1.1 | Założenie | Uwagi wdrożeniowe |
| :--- | :--- | :--- |
| **Model mieszany (StoreKit 2 / Play Billing)** | **1,99 USD / mies.** · **12,99 USD / rok** · **24,99 USD jednorazowo (lifetime)** | Ceny referencyjne dla rynku bazowego USD (lokalne progi cenowe sklepu); źródłem uprawnień wyłącznie zweryfikowana transakcja sklepu (ADR przed implementacją). |
| **Ochrona wczesnych użytkowników (`D-014`)** | Pełny dostęp do funkcji v1.0 bez opłat dla instalacji sprzed v1.1 | Weryfikacja przez paragon/transakcję App Store (`AppTransaction.originalAppVersion`). |
| **Platforma Android** | Publikacja w Google Play z Google Play Billing | Po stabilizacji iOS v1.0 i zamknięciu ewentualnych poprawek UX z TestFlight/App Store. |
| **Nowe języki (`DE`, `JA`)** | Pełne tłumaczenia interfejsu i metadanych sklepu (niemiecki, japoński) | Z zachowaniem parytetu `npm run check:i18n` i przeglądem terminologii kawowo-herbacianej. |

## 3. Czego NIE robimy w v1.0

- Nie dodajemy żadnych bibliotek zakupowych (`react-native-iap`, `RevenueCat`) ani atrap paywalla w kodzie v1.0 (pilnowane przez `tests/audit-fixes.test.tsx`).
- Nie obiecujemy cen, planów Pro ani okresu próbnego w opisach sklepu (`docs/15-app-store.md`) ani na stronie (`site/`).

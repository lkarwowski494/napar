# Napar — Kitchen-Proof UX i model wersji 1.0

## 1. Wstęp i Cel Architektoniczny
Aplikacja **Napar** została zaprojektowana i zoptymalizowana pod kątem standardów **Apps4Brew Studio**:
- Oceny 4.9★ w App Store i Google Play.
- 100% Offline-First (wbudowana baza SQLite w bezpiecznym katalogu `/Library/SQLite`, zero trackerów telemetrycznych).
- Ergonomia kuchenna („Kitchen-Proof” & „Dirty Thumb” controls $\ge 48\text{–}56\,\text{pt}$).
- Wersja 1.0 całkowicie darmowa (sekcja 2).

---

## 2. Model wersji 1.0: całkowicie darmowa (2026-11-13)

Decyzja DEC-01 audytu M1 (wybór a, właściciel 2026-11-13: „Wszystko według rekomendacji”): wersja 1.0 jest całkowicie darmowa. Jedyne źródło tej zasady w kodzie to brak modułu dostępu; trwałą kontrolę trzyma `tests/audit-fixes.test.tsx` (blok „M1-audytor-generalny-009”).

- Brak zakupów w aplikacji, ekranu planów, okresu próbnego, licznika parzeń i bramek: każda funkcja (parzenie, Gongfu, spiżarnia, kofeina, kreator i import receptur, Dial-in Doctor, chemia wody, dziennik, eksport) działa bez ograniczeń.
- Dane użytkownika nigdy nie są płatne: odczyt, eksport i kopia zapasowa zawsze dostępne.
- Aplikacja jest kanałem sprzedaży portfela Apps4Brew (kierunek właściciela 2026-11-11).
- Model płatny po 1.0 (subskrypcja, zakup jednorazowy albo napiwek) wymaga nowej decyzji właściciela z opcjami roli 02, prawdziwego StoreKit (transakcje sklepu jako źródło dostępu, przywracanie ze sklepu) i ADR biblioteki z rolą 05. Dawne ceny z BRD 0.1 to hipoteza H-MON-01, nie decyzja.

---

## 3. Ergonomia Kuchenna: Kitchen-Proof & Progressive Disclosure

### 1-Tap Szybki Start (< 15 sekund)
Główny ekran parzenia (`app/(tabs)/index.tsx`) został zdekomponowany na wyspecjalizowane, czytelne moduły:
1. `BrewHeader`:
   - Wyeksponowana na samej górze **pigułka nastawy młynka** (`Comandante C40: 22 kliki`), widoczna przed każdym parzeniem.
   - Pigułki receptury i spiżarni ziaren.
   - Pigułka offline QR Share & linków.
   - 1-Click chipy ulubionych receptur.
2. `BrewQuickPrepCard`:
   - Karta „Do drippera na wagę”.
   - Duże przyciski stepperów dozy kawy (`−` / `+`, wysokość 44–52pt).
   - Wskaźnik całkowitej wody oraz temperatury.
   - Batch scaling dla 1–4 osób (`1 os.`, `2 os.`, `3 os.`, `4 os.`) z automatycznym przeliczaniem klików mielenia (`+2 kliki grubiej`).
3. `BrewActiveFocusTimer`:
   - **Widoczność z 1 metra**: gigantyczny stoper cyfrowy (64pt tabular-nums).
   - Wskaźnik aktualnego etapu z docelową masą wody i czasem etapu.
   - Pigułki natychmiastowej korekty czasu w locie: `-10s` i `+10s`.
   - Wielkie kontrolki dotykowe brudnego kciuka: `PAUZA`, `DALEJ ▶`, `◀ WSTECZ`, `RESET`, `WZNÓW`, `ZAPISZ` (wysokość $\ge 52\,\text{pt}$).
4. `BrewProAccordion`:
   - Schowany pod eleganckim, zwijanym panelem („Progressive Disclosure”).
   - Nie przytłacza początkującego użytkownika.
   - Dla zaawansowanych rzemieślników: mineralizacja wody Barista Hustle, kalkulator soli, refractometr TDS (%) oraz radar sensoryczny SCA.
5. `BrewFinishModal`:
   - Kompleksowy arkusz po zakończeniu zalewania: ocena gwiazdkowa (★), balans smaku (`Zbalansowana`, `Za kwaśna`, `Za gorzka`, `Wodnista`).
   - **Dial-in Doctor**: 1-klikowa diagnoza i konkretna recepta (np. *„Za kwaśna? Zmiel drobniej o 2 kliki lub podnieś temp o +2°C”*).
   - Wykres radarowy SCA Spider Graph & Koło Smaków.

---

## 4. Testy i Jakość Inżynieryjna (Zero-Tolerance Forensic Fix)
- **Pokrycie testowe:** $\ge 97\%$ we wszystkich modułach (44 zestawy testowe, 379 testów jednostkowych i integracyjnych — 100% pass).
- **i18n:** Pełna symetria 362 kluczy w językach PL i EN (`npm run check:i18n`).
- **TypeScript:** 100% czystości typu w trybie ścisłym (`npm run typecheck`).
- **Unit Converter:** Globalna integracja przeliczników metrycznych i imperialnych (`formatDoseWeight`, `formatWaterWeight`, `formatTemperature`) w UI (Spiżarnia, Stoper, Karty Parzenia, Receptury, Ustawienia, Gongfu Cha, Monitor Kofeiny i Dial-in Doctor).
- **Gongfu Cha & Timer Audio:** Prawdziwy dzwonek kuchenny WAV (`playTimerChime`) zintegrowany ze stoperem Gongfu Cha (ostrzeżenie przed końcem i zakończenie ekstrakcji) oraz automatyczny backup całego stanu aplikacji po zakończeniu sesji (`autoBackup`).



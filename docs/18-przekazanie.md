# Dziennik Przekazania i Rejestr Decyzji — Napar (Steepwise)

> Żywy dokument inżynieryjny aktualizowany po każdej sesji i przed każdym wydaniem (`BR-REL-018`).
> Stan na dzień: 17.10.2026.

---

## 1. Stan Bieżący Projektu

| Parametr | Wartość | Uwagi |
| :--- | :--- | :--- |
| **Aplikacja** | Napar (Steepwise) | Rodzina Apps4Craft (`trening` + `organizer`) |
| **Wersja w `app.json`** | `1.0.0` | SemVer |
| **Bazowy numer buildu** | `10` | Zgodny z `testflight.yml` (`BUILD_BASE + GITHUB_RUN_NUMBER`) |
| **Bundle Identifier** | `pl.lukasz.napar` | iOS App Store |
| **Architektura danych** | SQLite + Podwójna pula kopii | 10 kopii automatycznych ($P_{\text{auto}}$) + 10 ratunkowych ($P_{\text{safe}}$) |
| **Klucze i18n** | 420 unikalnych kluczy | 100% symetrii PL / EN (`scripts/check-i18n.mjs`) |
| **Macierz testów AST** | 731/731 elementów (100.0%) | `EKRAN`: 10, `UI`: 65, `TEKST`: 355, `LOGIKA`: 238, `WYMIAR`: 63 |
| **Wyrocznie numeryczne** | Python 3 + `scripts/check-corpus.mjs` | Korpus ekstrakcji kawy i kontrastu motywów (zgodność do 4 miejsc) |
| **Stan testów Jest** | 63+ zestawy testowe | 100% zielone, zablokowany `act()` i `console.error` |
| **Potok CI/CD** | `ci.yml`, `tests-tz.yml`, `testflight.yml`, `e2e-ios.yml`, `pages.yml` | 100% zgodne z zasadami minimalnych uprawnień |

---

## 2. Kluczowe Komendy Weryfikacyjne

Wszystkie komendy uruchamiane są z poziomu głównego katalogu repozytorium:

```bash
# Główna brama jakościowa (wszystkie kontrole przed pushem i wydaniem):
npm run verify

# Pojedyncze kontrole składowe:
npm run check:i18n       # Walidacja symetrii tłumaczeń PL/EN
npm run check:corpus     # Weryfikacja zgodności z wyroczniami w Pythonie
npm run check:licenses   # Kontrola czystości licencji (zakaz GPL w prod)
npm run check:matrix     # Weryfikacja 100% pokrycia macierzy testów AST
npm run check:native     # Sprawdzenie 20 niezmienników iOS na Linuksie/Windowsie
npm run typecheck        # Kontrola typów TypeScript (tsc --noEmit)
npm run test:coverage    # Pełny zestaw testów z egzekwowaniem progów 100% w logice

# Uruchomienie pojedynczego testu z rejestracją ziarna generatora:
PROP_SEED=12345 npm test -- tests/domain-properties.test.ts
```

---

## 3. Rejestr Decyzji Inżynieryjnych i Architektonicznych (D-01..D-15)

* **`D-01` (Twarde blokowanie `act()` i `console.error`):** Skonfigurowano `tests/jest-after-env.js`, który natychmiast oblewa jakikolwiek test generujący ostrzeżenie `act()` lub nieprzechwycony `console.error`.
* **`D-02` (Rozdział puli kopii zapasowych):** Utworzono dwie niezależne pule po maksymalnie 10 plików: $P_{\text{auto}}$ dla automatycznych kopii w tle oraz $P_{\text{safe}}$ dla operacji niszczących (przed importem i przed czyszczeniem bazy), z sufiksem kolizyjnym `-2`.
* **`D-03` (Ochrona uszkodzonego stanu):** Naruszenie integralności bazy lub pamięci masowej powoduje natychmiastowe zabezpieczenie migawki w `state_corrupt_<timestamp>.json` z flagą `recovery: true`, nie niszcząc danych użytkownika i prezentując baner ratunkowy.
* **`D-04` (Konwersja jednostek bez dryfu `wInKeep`):** Wprowadzono algorytm `wInKeep(text, unit, prevBase)` w `src/core/unit-converter.ts`, który zachowuje czystą wartość bazową przy wielokrotnej zmianie jednostek gram/uncja.
* **`D-05` (Odporność stoperów na usypianie systemu):** Wszystkie timery oparto o stały punkt docelowy w czasie `remainingTimerSec(endAtMs, nowMs)` zamiast dekrementacji interwałowej `setInterval(-1)`.
* **`D-06` (Ochrona przed wstrzykiwaniem formuł CSV):** Wszystkie pola eksportu CSV rozpoczynające się od `=, +, -, @` są neutralizowane apostrofem wiodącym `escapeCsvCell()`.
* **`D-07` (Własnościowe testy z gwarantowanym krokiem początkowym):** W generatorach `fast-check` zapewniono obecność co najmniej jednej akcji otwierającej (np. tworzenie ziarna lub receptury) przed operacjami edycji/usuwania.
* **`D-08` (Wyrocznie numeryczne w niezależnym języku):** Skrypty `scripts/gen-coffee-corpus.py` oraz `scripts/gen-theme-contrast-corpus.py` generują matematyczne korpusy wzorcowe, sprawdzane testami w Jest.
* **`D-09` (16 strażników interakcji S1–S16):** Wszystkie formularze, modale, listy i potwierdzenia podlegają rygorystycznym regułom UX studia (`tests/interaction-guards.test.ts`).
* **`D-10` (Hermetyczny skaner macierzy testów AST):** `scripts/test-matrix.mjs` parsuje kod TypeScript AST, automatycznie oczyszczając komentarze, importy i nagłówki testów przed weryfikacją dowodu pokrycia.
* **`D-11` (Scenariusze Maestro na granicy stref czasowych):** Wszystkie przepływy `.maestro/*.yaml` są weryfikowane w Jest pod symulacją poniedziałku, niedzieli oraz przejścia przez północ (23:55 UTC).
* **`D-12` (Wymagania natywne Apple ITMS-90717):** Ikona aplikacji `assets/icon.png` wygenerowana jako 1024x1024 RGB 8-bit bez kanału alfa (colorType 2).
* **`D-13` (Privacy Manifests iOS 26):** `app.json` zawiera kompletną deklarację 4 kategorii Required Reason API oraz `NSPrivacyTracking = false`.
* **`D-14` (Bezpieczeństwo potoku TestFlight):** Workflow `testflight.yml` dekoduje klucz `.p8` dopiero po fazie `pod install` z uprawnieniami `umask 077` i filtruje identyfikatory wrażliwe z logów przez `sed`.
* **`D-15` (Perlowy strażnik procesów w CI):** W `e2e-ios.yml` zaimplementowano funkcję `guard()` z `setpgrp(0,0)` zapobiegającą zawieszaniu się symulatorów na runnerach macOS.
* **`D-16` (Live Activity zamiast atrapy, 22.10.2026):** `src/core/live-activity.ts` to czysty model stanu (nazwa etapu, koniec etapu w ms, numer zalania, liczba zalań, pauza) i kontroler kolejkujący wywołania mostu. Most jest w `modules/napar-live-activity` (ActivityKit, guard iOS 16.2; w Expo Go i na Androidzie `null`, wywołania są no-op). Widżet w `targets/napar-widget` (ekran blokady, Dynamic Island) generuje `@bacons/apple-targets` 5.0.0 (opublikowany 17.07.2026). Aktualizacja wysyłana tylko przy zmianie stanu: start, nowe zalanie, pauza, wznowienie, koniec. Odliczanie działa natywnie (`Text(timerInterval:)`). Napisy widżetu w `pl.lproj` i `en.lproj`, język z aplikacji. Ograniczenia: w tle silnik JS jest wstrzymany, więc przejście do kolejnego zalania widać po powrocie do aplikacji. Zabite procesy czyści `endAll` przy starcie. Zgodnie z decyzją właściciela (lista funkcji, pozycja 22). Bez Apple Watch. Kompilacja iOS i zachowanie na urządzeniu niezweryfikowane lokalnie (wymaga Maca i workflow `ios-unsigned`).
* **`D-17` (Własna woda i kalibracja młynka, poz. 9 i 12 MVP, 22.10.2026):** Woda: wpis GH/KH z raportu wodociągów w mg CaCO₃/L lub °dH (1 °dH = 17,848 mg/L, `S-091`), zaokrąglenie do 0,1 ppm, profil zapisany jako ustawienie (`own_water_profile`) i objęty kopią zapasową bez zmiany formatu; dolewka koncentratów z profilu do wybranego celu (`D-002`). Kalibracja: przesunięcie kliknięć z par (kliki, bazowa nastawa, EY), średnia ważona, próg 3 par, limit ±5 klików (`D-003`, `S-092..S-095`). Schemat v4 dodaje do dziennika `grinder_id`, `grinder_clicks`, `grinder_base_clicks` (`D-004`); wcześniej dziennik nie zapisywał kliknięć ani młynka. Otwarte: brak pola „faktyczne kliki” w formularzu parzenia, więc kalibracja uczy się z nastawy pokazanej w aplikacji. Wartości `S-092` (czułość 0,5 %/klik) i `S-094` (cel EY 20,0 %) wymagają sprawdzenia źródłami przed wydaniem. Rejestr: `docs/research/rejestr-twierdzen.json`, wpisy `S-091..S-096`, `D-002..D-004`.

# Plan przebudowy Napar — w miejscu, na stosie zgodnym z „trening”

> Data: 22.10.2026. Commit startowy: `9ad8573`. Gałąź: `claude/wykonaj-sl7vii`.
> Podstawa: `docs/audyt-etap1-2026-10-22.md` (stan bieżący) i przegląd `lkarwowski494/trening` (commit `837a850`).
> Status: **plan, bez wykonania.** Start etapu 0 wymaga zatwierdzenia założeń z sekcji 2.

---

## 1. Co zostaje, co się zmienia

- **Zostaje:** repo, gałąź, nazwa produktu, dwujęzyczność PL/EN, zasady offline i zero telemetrii (CLAUDE.md §2.5), zasady dostępności (§2.4), ustalenia z audytu.
- **Zmienia się:** cała warstwa kodu. Nowy kod powstaje obok starego i przełącza się, gdy przejdzie bramki. Stary kod znika dopiero po przełączeniu.
- **Stos:** te same wersje co w `trening` — Expo ~57.0.26, React Native 0.86.3, expo-sqlite ~57.0.3. Napar już na nich jest, więc nie ma migracji frameworka.

## 2. Założenia (domyślne, do zatwierdzenia)

Każdą decyzję z audytu (D1–D9) przyjmuję w wariancie rekomendowanym. Zmiana któregokolwiek przesuwa plan.

| Decyzja | Założenie w planie |
|---|---|
| D1 Zakres | uczciwe MVP: Asystent, Dziennik, Spiżarnia, Kompendium, Woda, kalkulatory, kofeina jako „szacunek” |
| D2 Atrapy | HealthKit, Live Activity, Watch, widżety **poza MVP**; w kodzie nie ma atrap |
| D3 Zakup | na start wyłączony; po zatwierdzeniu — `expo-iap` przez adapter sklepu (wzór z `trening`) |
| D4 Trial/ceny | 14 dni / 15 parzeń; ceny w USD w App Store Connect, lokalne wyświetlanie przez Apple |
| D5 Zdrowie | progi snu i porady usunięte; model kinetyki jako „szacunek”, do czasu weryfikacji źródeł |
| D6 Marki/osoby | usunięte z receptur i tekstów |
| D7 Licencja | **otwarte** — blokuje wydanie, nie blokuje budowy |
| D8 Ścieżka bazy | wzór z `trening` (`lib/state/db.ts`): przeniesienie z fallbackiem i testem na symulatorze |
| D9 Pokrycie | progi realne na starcie, rosnące do 100% w `src/core/` przed wydaniem |

## 3. Wzorce do przejęcia z `trening` (przez wzorzec, nie kopiowanie plików)

Licencja `trening` (LICENSE: „wszelkie prawa zastrzeżone”, kopiowanie wymaga pisemnej zgody właściciela) oznacza, że **pliki nie są kopiowane**, tylko przepisywane według wzoru. Zgodę na kopiowanie decyduje właściciel (patrz pytanie w sekcji 6).

| Obszar | Wzorzec w `trening` | Co robimy w Napar |
|---|---|---|
| Sklep (StoreKit) | `lib/store-adapter.ts` (interfejs), `lib/store-native.ts` (`expo-iap`), `lib/store-fake.ts` (E2E). Dostęp tylko z `getAvailablePurchases`, bez własnej weryfikacji JWS | adapter + test kontraktu; wdrożenie po D3 |
| HealthKit | `lib/hkModule.ts` (`@kingstinct/react-native-healthkit`), leniwe ładowanie | poza MVP (D2); szkielet dopiero w etapie 6 |
| Live Activity | `modules/rest-activity` (ActivityKit, `serial.ts`), `targets/rest-widget` | poza MVP (D2) |
| Apple Watch | `modules/watch-link` (WatchConnectivity), `targets/watch-app`, `watch-fixtures/` | poza MVP (D2) |
| Baza danych | `lib/state/db.ts` (`dbDirectory`, `openDb` z fallbackiem i `copyKv`) | D8: przeniesienie z testem na symulatorze |
| Bramki jakości | `scripts/claims.mjs` (rejestr twierdzeń), `check:readme`, `verify:docs` | rejestr twierdzeń dla D5/D6; `check:claims` w `verify` |
| Testy StoreKit | `tests/store-adapter.test.ts` (pilnuje braku wywołań sieciowych w bibliotece) | to samo, dla zakupu |

## 4. Etapy

Każdy etap kończy się zieloną bramką (`npm run verify` + testy etapu). Bez zielonej bramki nie przechodzimy dalej.

**Etap 0 — Fundament (szacunek: 1–2 h agenta).**
- Progi pokrycia realne (D9 A), `verify` zielony.
- Rejestr twierdzeń (`docs/research/rejestr-twierdzen.json`) z pierwszymi wpisami z G6.
- Nowa struktura `src/core` bez importów React/expo (CLAUDE.md §2.1) — wymuszone regułą ESLint i testem.
- **Bramka:** `verify` zielony, grep `src/core` na `react|expo-` = 0.

**Etap 1 — Domena (szacunek: 1–2 dni agenta).**
- Przepisanie obliczeń: EY, Brew Ratio, TDS, woda, młynki, kofeina, koszt. Parametry nazwane (obiekty), nie kolejność — żeby błąd z T-EY (zamiana argumentów) nie był możliwy.
- Każda stała ma wpis w rejestrze twierdzeń; bez wpisu nie wchodzi.
- Usunięcie: EY-bug, sztywna ocena Gongfu, imperial Gongfu, przecinek w polach.
- **Bramka:** 100% pokrycia `src/core`, testy właściwości (fast-check), wektory referencyjne z wpisami rejestru.

**Etap 2 — Persystencja i kopie (szacunek: 1 dzień agenta).**
- Schemat SQLite, repozytoria, `openDb` wg wzoru `trening` (D8 B).
- Kopia JSON z pełnym eksportem (bez `LIMIT`), format z wersją, import z walidacją i testem okrągłym (eksport → import → równość).
- CSV z zabezpieczeniem formuł (`escapeCsvCell`).
- **Bramka:** test okrągły na pełnej bazie, test ścieżki bazy na symulatorze.

**Etap 3 — Interfejs przepływów (szacunek: 2–4 dni agenta).**
- Asystent parzenia, Dziennik, Spiżarnia, Kompendium, Ustawienia — w tej kolejności.
- Zasady: przyciski 44 pt, Dynamic Type do 2.0×, kontrast WCAG AA, PL i EN w każdym ekranie (`check:i18n`).
- **Bramka:** E2E Maestro na symulatorze zielone dla każdego przepływu.

**Etap 4 — Zakup (po D3, szacunek: 1 dzień agenta + czas po stronie Apple).**
- `expo-iap` przez adapter, fake store dla E2E, test kontraktu.
- Wymaga: produkty w App Store Connect i plik `.storekit` do testów lokalnych.
- **Bramka:** test sandbox na urządzeniu.

**Etap 5 — Stabilna CI i TestFlight (szacunek: 1 dzień agenta).**
- Naprawa E2E (sprawdzić sterownik XCTest na runnerze, zanim cokolwiek zmieniamy w testach).
- Nocne testy losowe na zielono (dziś czerwone).
- **Bramka:** E2E zielone 3 przebiegi z rzędu; upload TestFlight; status w App Store Connect.

**Etap 6 — Funkcje poza MVP (osobno, po decyzji).**
- HealthKit, Live Activity, Watch, widżety — każdy jako osobna praca z własną bramką. Dopiero wtedy, gdy są realnie działające na urządzeniu.

**Etap 7 — Wydanie.** Licencja (D7), treści zdrowotne z zielonym rejestrem, metadane App Store.

## 5. Szacunek czasu (niepewność duża)

- Agent: etapy 0–5 to łącznie rząd **kilku do kilkunastu dni pracy agenta**, zależnie od tempa testów na urządzeniu i ilości poprawek. Etap 6 i 7 osobno.
- Oczekiwanie: CI i E2E na macOS (kilkanaście minut na przebieg), upload do App Store Connect.
- Czas użytkownika: zatwierdzenie założeń, decyzja D7, zgoda na wzorce z `trening`, testy na urządzeniu (D8, zakup, HealthKit), przegląd rejestru twierdzeń (badacz lub Ty).

## 5-0. Bramka 0: walidacja popytu przed budową

Dziś nie wiadomo, co się sprzeda. Obecne liczby w BRD 0.1 to założenia: „42% entuzjastów” z ankiety na r/Coffee (źródło nie sprawdzone), konwersja 4,5% i 12% trial→paid jako cele, nie pomiary. Dlatego przed etapem 0 wchodzi bramka walidacji. Zakres i cena wynikają z jej wyniku, nie odwrotnie.

**Wariant bez kontaktu z ludźmi (przyjęty 22.10.2026, właściciel: „zadnych wywiadow, robimy self development z AI”):**
1. **Badanie biurkowe** (bez kontaktu z ludźmi): konkurenci, ceny, model, recenzje z App Store. Dane tylko z odczytanych źródeł. Wstępny przegląd: `docs/research/rynek-wstepny-2026-10-22.md`.
2. **Analiza recenzji konkurencji** (publiczne recenzje, bez rozmów): co ludzie chwalą i za co narzekają w timerach kawy i herbaty.
3. **Decyzja o cenie i zakresie** na podstawie 1–2, przed budową. Model z BRD (D4) traktowany jako hipoteza.
4. **Pierwszy prawdziwy test popytu: premiera w App Store** po zbudowaniu MVP, z progami ustalonymi przed premierą.

**Ryzyko tego wariantu:** brak wywiadów oznacza, że pierwszy dowód popytu pojawi się dopiero po zbudowaniu. Zbudowanie MVP to kilka do kilkunastu dni agenta plus czas oczekiwania, więc koszt błędu jest realny. Złagodzenie: zakres MVP wybieramy najmniejszy, który da się sprzedać (sekcja 5a).

**Progi premiery (propozycja agenta [OCENA], decyzja Twoja):**
- Po 60 dniach od premiery: co najmniej **100 pobrań miesięcznie** (poziom z `trening/docs/wzrost.md`, cel właściciela).
- Konwersja w płatne plany: co najmniej **2%** pobrań (założenie z rachunku w `trening/docs/monetyzacja-badanie-2026-10.md`, do sprawdzenia w App Store Connect).
- Poniżej progów: zmiana modelu (np. narzędzie bez subskrypcji) albo zatrzymanie, zanim wejdzie kolejny etap z kosztem.

**Uwaga:** do testów nie używamy obecnej wersji z atrapami (zakup, HealthKit, Live Activity). Testerzy dostają tylko to, co działa.

## 5a. BRD i harmonogram

Zakres jest jeszcze nieustalony (BRD 0.1 ma 180 pozycji zakresu i 40 decyzji otwartych), więc BRD v2 jest pierwszym etapem, nie dodatkiem.

**Opcje BRD v2:**
- **A. Krótki BRD ze zakresem (rekomendacja):** 8–10 stron. Zakres MVP, lista funkcji wyciętych i dlaczego, decyzje D1–D9 z wynikiem, KPI, warunki wydania. Pozostałe części BRD 0.1 zostają jako archiwum i wracają tylko tam, gdzie są potrzebne. Szacunek: kilka godzin agenta plus 1–2 h Twojego przeglądu.
- B. Pełny BRD od zera (22 pliki, jak obecny). Dużo więcej pracy i ryzyko powtórzenia niesprawdzonych twierdzeń z 0.1. Szacunek: 1–2 dni agenta plus dłuższy przegląd.
- C. Zostawić BRD 0.1 i dopisać errata. Najtaniej, ale zakres dalej nieuporządkowany. Nie polecam.

**Harmonogram (szacunek; niepewność duża):**

| Krok | Czas agenta | Czas oczekiwania | Czas Twój |
|---|---|---|---|
| Zatwierdzenie D1–D9 i zakresu | — | — | ok. 1 h |
| BRD v2 (opcja A) | kilka h | 1 cykl przeglądu | 2–3 h |
| Etap 0–1 (fundament, domena) | 1,5–3 dni | rejestr badacza równolegle | przegląd rejestru |
| Etap 2–3 (persystencja, UI MVP) | 3–5 dni | CI na macOS | testy na urządzeniu |
| Etap 4 (zakup, po D3) | 1 dzień | App Store Connect | konto i produkty |
| Etap 5 (CI, TestFlight) | 1 dzień | przebiegi E2E | — |

Suma agenta dla MVP: około **7–11 dni**. Realny kalendarz: **3–5 tygodni**, bo czeka się na macOS, App Store Connect i Twoje decyzje. Rejestr twierdzeń u badacza może trwać dłużej niż kod; etap 1 nie wchodzi bez zielonego wpisu dla każdej stałej.

## 6. Otwarte pytania (blokują konkretne etapy)

1. **Zatwierdzenie założeń z sekcji 2** — blokuje etap 0.
2. **Zgoda na wzorce z `trening`** — `trening` jest „wszelkie prawa zastrzeżone”. Przepisywanie według wzoru bez kopiowania pliku nie wymaga zgody w ten sam sposób, ale kopiowanie kodu tak. Czy jesteś właścicielem `trening` i zgadzasz się na to? — blokuje etap 4 i 6, jeśli chcemy kopiować fragmenty zamiast przepisywać.
3. **Licencja Napar (D7)** — blokuje etap 7.
4. **Dostęp do App Store Connect i urządzenia testowego** — blokuje etap 4 i 5.

## 7. Ryzyka

- **Przebudowa rozmyta:** przy przebudowie w miejscu stary i nowy kod mogą się mieszać. Mitigacja: nowy kod w nowych katalogach, przełączenie jednym commitem, stary kod usuwany osobnym commitem.
- **Stare długi wracają:** bez rejestru twierdzeń i bramki pokrycia znowu pojawią się atrapy. Mitigacja: bramki z etapu 0 są nienegocjowalne.
- **Różnice wersji:** `trening` i Napar mają te same wersje dziś; po aktualizacji jednego trzeba sprawdzić drugi.

## Aktualizacja 22.10.2026 — decyzje, które zmieniają plan

- **Zakres MVP:** 31 pozycji z `docs/lista-funkcji-mvp.md` (łącznie z Live Activity, Apple Watch i napojami mlecznymi, na decyzję właściciela).
- **Języki:** 35, jak w `trening`. Tłumaczenia i weryfikacja to najdroższa pozycja; harmonogram wymaga przeliczenia.
- **Zakupy:** model M5 S1 z `trening`: darmowy poziom z limitem **7 dni parzenia miesięcznie**, Pro (subskrypcja miesięczna, roczna albo dożywotnia) bez limitu, bez okresu próbnego. Ceny jak w `trening`. Zastępuje D3/D4 w zakresie zakupów.
- **Family Sharing:** zatwierdzone dla subskrypcji i dożywotniego. Nieodwracalne po włączeniu w App Store Connect (źródło Apple, sekcja w `lista-funkcji-mvp.md`).
- **Zastrzeżenie:** liczby płacących w modelu zakładają częstotliwość treningową. Przed liczeniem przychodu trzeba je ponownie policzyć z częstotliwością kawową.

**Nadal otwarte (blokują konkretne etapy):** D7 licencja (blokuje wydanie), D8 ścieżka bazy (test na symulatorze przed etapem 2), D9 progi pokrycia (etap 0), zgoda na kopiowanie kodu z `trening` (etap 4 i 6, jeśli kopiujemy zamiast przepisywać).

## Status etapu 0 (22.10.2026)

Zrobione na gałęzi `claude/wykonaj-sl7vii`:
- **Progi pokrycia (D9, wariant A):** ustawione na wartości zmierzone, zaokrąglone w dół (`jest.config.js`). Globalnie: instrukcje 92, funkcje 91, linie 93; `src/core/`: instrukcje 97, gałęzie 88, linie 97; `knowledge-data.ts` i `app-access.ts`: progi obniżone do stanu. Cel 100% zostaje w planie do etapu 1–2.
- **Reguła CLAUDE.md §2.1:** `scripts/check-core-imports.mjs`, dodana do `npm run verify`. Istniejące naruszenia (18 plików) są w `scripts/core-imports-allowlist.json` jako dług techniczny. Nowe naruszenie kończy się błędem, a plik usunięty z naruszeń wymaga usunięcia wpisu.
- **Rejestr twierdzeń:** `docs/research/rejestr-twierdzen.json`, 14 wpisów z priorytetów G6. Wszystkie w statusie „do sprawdzenia”.

Wynik bramki: `npm run verify` kod 0 (77 zestawów, 649 testów); `npm run test:coverage` kod 0 z nowymi progami.

Dług do spłaty w etapach 1–2: 18 plików w allowliście (zlikwidowany wraz z przepisaniem domeny i warstwy UI), progi 100% w `src/core/` (wracamy do nich w miarę przepisywania).

## Status etapu 1 (22.10.2026)

Zrobione (commity `f7ac0dd`, `c61ba5a`, `55cbef8`, `4376d9d`):
- EY przyjmuje obiekt z nazwanymi polami; wszystkie wywołania poprawione; test wektorowy 300 g / TDS 1,4 % / 20 g → 21,0 %.
- Gongfu: ocena z danych sesji (bez stałej 5), balans bez stałej wartości, jednostki imperialne spójne (test okrągły g/oz, ml/fl oz, °C/°F).
- Przecinek jako separator: `parseDecimal` w trzech ekranach dial-in.
- Rejestr: 90 wpisów S-001…S-090 (status „do sprawdzenia”).
- Bramka 100% instrukcji, gałęzi, funkcji i linii w sześciu modułach domenowych i `parse-decimal.ts`. `verify`: kod 0 (83 zestawy, 783 testy); `test:coverage`: kod 0.

Otwarte (nie blokują etapu 2):
- T-019: kofeina 12,0/22,0 mg/g vs komentarz 10,5/18,7 — nierozstrzygnięte źródłem pierwotnym.
- Tabele czasów Gongfu: komentarz i kod różnią się dla pięciu typów herbaty.
- RD-19: suma procentów przy kolejnych zalaniach przekracza 100 % od 7. zalania.
- Ocena zalania Gongfu: UI nie ma kontrolki, więc ocena sesji to `null`. To decyzja produktowa (dodać kontrolkę czy zostawić `null`); na razie wybrana opcja `null`.

## Status etapu 2 (22.10.2026)

Zrobione na gałęzi `claude/wykonaj-sl7vii`:
- **Port bazy:** `src/core/db-port.ts` (`DbPort`, API synchroniczne jak w expo-sqlite). Repozytoria w `src/core/repositories/` (schemat i migracje, przepisy, spiżarnia, dziennik, kofeina, ustawienia) nie importują expo. Adapter expo-sqlite i katalog bazy są w `src/platform/sqlite-adapter.ts`, podpinane w `src/platform/bootstrap.ts`. `src/core/database.ts` i `src/core/backup.ts` nie importują już expo/react, więc zniknęły z `scripts/core-imports-allowlist.json` (dług: 16 plików).
- **Lokalizacja bazy (D8, wariant B):** czysta funkcja `openDatabaseLocation` w `src/core/db-location.ts` (exists/makeDirectory/open wstrzyknięte). Przy błędzie otwarcia `/Library/SQLite` baza otwiera się w domyślnej ścieżce, a powód zapisuje się w ustawieniu `db_location_fallback` (`getDatabaseFallback()`).
- **Kopia zapasowa, format v2:** `{ format: 'napar-backup', version: 2, exportedAt, state }`. Eksport i kopia przed importem bez limitów (sesje, kofeina). Import akceptuje v2 oraz v1 w obu wariantach (zapis automatyczny z `schemaVersion: 1` i dawny eksport `version: 1`), odrzuca nieznane i nowsze. Ścieżka importu w `app/settings.tsx` używa `parseAndValidateBackup`, a zapis jest atomowy (jedna transakcja). Ustawienia wracają z kopii; `is_pro_active` i `db_location_fallback` są pomijane (stan Pro pochodzi z zakupu, nie z pliku).
- **CSV:** każda komórka i nagłówek przechodzą przez `escapeCsvCell` (`src/core/csv-export.ts`). Prefiks `'` dla `= + - @ TAB CR`, także dla ujemnych liczb (wcześniej wyjątek).
- **Test okrągły na prawdziwym SQL:** `tests/backup-roundtrip.test.ts` na sql.js 1.14.2 (devDependency; opublikowany 14.08.2026, czyli ponad 2 tygodnie temu). Test obejmuje sesje, paczki, receptury, ustawienia i kofeinę, w liczności powyżej dawnych limitów. Receptury startowe porównywane są po identyfikatorach, bo `created_at` zapisuje aplikacja przy instalacji.
- **Bramka:** progi 100% (instrukcje, gałęzie, funkcje, linie) w `jest.config.js` dla `src/core/repositories/`, `backup.ts`, `csv-export.ts` i `db-location.ts`. Progi globalne i per-moduł z etapów 0–1 bez zmian.

Otwarte (nie blokują etapu 3, wymagają weryfikacji):
- **D8 na symulatorze/urządzeniu:** utworzenie `/Library/SQLite` przez `Directory.create`, fallback przy nieudanym otwarciu, oraz co dzieje się z danymi, które dawniej leżały w `Documents/SQLite` (tej migracji plik nie wykonuje; zachowanie wyboru ścieżki jest takie samo jak w `db-path.ts`).
- **Decyzja właściciela:** czy stan Pro i klucze lokalne są poza kopią (obecnie tak).
- Testy na sql.js sprawdzają SQL i logikę kopii, a nie sterownik expo-sqlite na urządzeniu.

## Status etapu 4a — polityka dostępu, bez sklepu (22.10.2026)

Zrobione na gałęzi `claude/wykonaj-sl7vii`:
- **Model M5 S1:** darmowy poziom = 7 dni parzenia w miesiącu (`FREE_BREW_DAYS_PER_MONTH`, wpis D-001 w `docs/research/rejestr-twierdzen.json`). Dzień parzenia = dzień ukończenia parzenia zmierzonego timerem. Wpisy ręczne, import i edycja wstecz nie liczą się. Blokada dotyczy tylko rozpoczęcia parzenia w nowym dniu ponad limit; trwające parzenie nigdy nie jest przerywane. Pro (`is_pro_active`) znosi limit. Brak okresu próbnego i ofert wprowadzających.
- **Czysta logika:** `src/core/access-policy.ts` (`canStartBrew`, `addCountedBrewDay`, teksty stanu). Zegar i stan wchodzą jako argumenty.
- **Stan dni:** `src/core/repositories/brew-access.ts`, klucz `free_brew_days` w `app_settings` (JSON per miesiąc). Dni są tylko dopisywane. Klucz jest na liście niepenetrowalnych: poza kopią, a import pliku go nie zeruje.
- **Fasada i hook:** `src/core/app-access.ts` (bez logiki zakupu). Usunięto atrapę zakupu (`verifyAndActivateStoreKitPurchase`, paragon z `Date.now`/`Math.random`), przywracanie z flagi i stare pola triala (`trial_*`, `subscription_tier`).
- **Ekrany:** plany i przywracanie w `Apps4BrewPassModal` pokazują „zakup niedostępny”. Bramki `canCreate` i banery „tylko do odczytu” usunięto z przepisów, spiżarni, dziennika, kofeiny i importu. Jedyną bramką jest start parzenia (ekran główny, procedura, gongfu). Baner ekranu głównego pokazuje stan limitu dla darmowego poziomu.
- **Stan Pro poza kopią:** przyjęto rekomendację (decyzja właściciela nie była wymagana). Komentarze w `repositories/app-settings.ts` i `app-access.ts`.

Bramka: `check:i18n` zielone (PL/EN), `typecheck` zielone, `test:coverage` zielone. `access-policy.ts`, `app-access.ts` i `repositories/brew-access.ts` mają 100% (progi w `jest.config.js`).

Otwarte (nie blokują etapu 4b):
- **Zakup (4b):** `StoreAdapter` i `expo-iap` podpinane w `Apps4BrewPassModal` przez `onPurchaseSuccess`/`onSubscribed` (nadal wiszą jako punkt podpięcia). Wymaga produktów w App Store Connect i pliku `.storekit`.
- **Zegar urządzenia:** licznik jest lokalny i offline. Zmiana daty w systemie może obejść limit. Akceptowane dla aplikacji bez serwera.
- **Częstotliwość kawowa:** model 7 dni policzony na częstotliwości treningowej (patrz wyżej). Liczba płacących wymaga ponownego przeliczenia.
- **Pokrycie tłumaczeń:** nowe klucze dodane tylko do PL i EN. Pozostałe 33 języki w `locales/` nie mają ich jeszcze (decyzja właściciela: 35 języków, do zrobienia w zakresie tłumaczeń).
- **Brak repo `trening` w sandboxie:** `docs/monetyzacja.md` nie został odczytany. Zachowanie licznika wzięto z opisu zadania, bez kopiowania kodu.

## Status etapu 4b — sklep StoreKit przez expo-iap (22.10.2026)

Zrobione na gałęzi `claude/wykonaj-sl7vii`:
- **Zależność:** `expo-iap@~5.8.3` (opublikowana 07.10.2026, czyli co najmniej 2 tygodnie przed wydaniem; wersje 6.x są młodsze niż 14 dni). Pakiet jest w wersji zgodnej z Expo 57 według jego dokumentacji. Licencja MIT.
- **Port i produkty:** `src/core/store-port.ts` (interfejs `StoreAdapter`, rejestr adaptera), `src/core/store-products.ts` (identyfikatory zgodne z `NaparStoreKit.storekit`: `pl.lukasz.napar.monthly`, `.annual` dla rocznego, `.lifetime`). Typ `Entitlement` jest w `access-policy.ts`.
- **Czyste mapowanie:** `src/core/store-mapping.ts` (produkty, uprawnienia z pominięciem odwołanych transakcji, kody błędów StoreKit na statusy, brak sukcesu bez transakcji).
- **Adapter produkcyjny:** `src/platform/store-expo.ts`. Działa tylko na iOS. Uprawnienia wyłącznie z `getAvailablePurchases({ onlyIncludeActiveItemsIOS: true })`. Brak weryfikacji JWS i brak usług zewnętrznych (pilnuje tego `tests/store-adapter.test.ts`).
- **Fałszywy sklep:** `src/platform/store-fake.ts`, wybierany tylko przy `EXPO_PUBLIC_STORE_FAKE=1` (`src/platform/store.ts`). Ustawiony w buildzie E2E (`e2e-ios.yml`, Debug), a w `testflight.yml` strażnik go blokuje.
- **Most z dostępem:** `src/core/app-access.ts` (`purchaseProduct`, `restoreProPurchases`, `syncProEntitlement`, `ensureStoreSync`, `useStoreProducts`). Stan Pro (`is_pro_active`) pochodzi z uprawnień sklepu i pozostaje poza kopią.
- **Ekran:** `Apps4BrewPassModal` kupuje przez sklep. Ceny to `displayPrice` ze sklepu, a bez produktów zostaje tekst zastępczy. Komunikaty: zakup niedostępny, oczekujący, błąd, przywrócono, brak zakupów, błąd przywracania. Nowe klucze tylko w PL i EN.
- **Bramka:** `check:i18n`, `check:licenses`, `check:matrix`, `check:native`, `check:core-imports`, `typecheck` i `test:coverage` zielone. Progi 100% dla nowych modułów w `jest.config.js`. Adapter expo-iap jest testowany na wstrzykniętej atrapie API, więc nie wymaga progów wyłączonych.

Otwarte (zadania właściciela, nie blokują kodu):
- **K-CENA:** utworzenie w App Store Connect trzech produktów o identyfikatorach z `store-products.ts` i grupy subskrypcji. Ceny ustawia Apple. Przed wysyłką sprawdzić nieodwracalne Family Sharing.
- **Test sandbox na urządzeniu** (bramka etapu 4): wymaga produktów w App Store Connect. Lokalnie można testować przez `NaparStoreKit.storekit`.
- **Przywracanie** nie wywołuje `AppStore.sync` (`restorePurchases`), zgodnie z zasadą dostępu wyłącznie z `getAvailablePurchases`. Jeśli sandbox pokaże, że nowe urządzenie nie widzi zakupów bez synchronizacji, trzeba to zmienić.
- **E2E Maestro** nie ma scenariusza zakupu (fałszywy sklep nie ma produktów, więc zakup kończy się „zakup niedostępny”).
- **Tłumaczenia:** nowe klucze tylko PL i EN (jak w 4a); 33 pozostałe języki do zrobienia w zakresie 35 języków.

## Status etapów 4a i 4b (22.10.2026)

- **4a (e684223):** polityka M5 S1 — 7 dni parzenia w miesiącu, bramka tylko przy starcie parzenia, historia i kopia zawsze dostępne, licznik dni poza kopią. Atrapa zakupu usunięta.
- **4b (7214adc):** adapter sklepu `StoreAdapter` (port w `src/core/store-port.ts`), produkcyjny adapter na `expo-iap` 5.8.3 (opublikowana 07.10.2026), fałszywy sklep tylko przy `EXPO_PUBLIC_STORE_FAKE=1`. Identyfikatory produktów z `NaparStoreKit.storekit` (`pl.lukasz.napar.monthly` / `annual` / `lifetime`).
- Bez produktów w App Store Connect zakup pokazuje „Zakup niedostępny”. Nie ma fałszywego sukcesu.

**Otwarte, nie blokują kodu:** utworzenie produktów i grupy subskrypcji w App Store Connect (zadanie właściciela); test sandbox na urządzeniu; nieodwracalne Family Sharing sprawdzić przed wysyłką; przywracanie bez `AppStore.sync` — zweryfikować w sandboxie.

Bramka po 4b: `verify` kod 0 (101 zestawów, 1024 testy); `test:coverage` kod 0.

## Status etapu 3a — usunięcie atrap i naprawy z audytu (22.10.2026)

Zrobione na gałęzi `claude/wykonaj-sl7vii` (commity od `d4a1469` do `baf5678`):
1. **HealthKit:** usunięty `src/core/healthkit.ts` i wszystkie wywołania (asystent, kofeina, ustawienia), klucze i18n, wpis w README i w progach `jest.config.js`. Testy `NSHealth*` w kontraktach zostają jako strażnik.
2. **Ulubione (★):** `handleToggleRecipeFavorite` w `useBrewWorkflow` wywołuje `toggleRecipeFavorite`. Test w `brew-screen.test.tsx`.
3. **Edycja receptury:** zachowuje `isFavorite` i `createdAt`. Test w `recipe-builder.test.tsx`.
4. **Kopiowanie i link (pozycja 30 MVP):** `expo-clipboard@~57.0.2` (wersja z `bundledNativeModules` Expo 57). Trasa `app/recipe.tsx` dla `napar://recipe?v=1&d=...` pokazuje podgląd przed zapisem. Zapis tylko w nagłówku. Routing realizuje expo-router na schemacie `napar`, bez osobnego listenera expo-linking. Test w `recipe-link-route.test.tsx`.
5. **Stoper:** korekta ±10 s w pauzie aktualizuje `pausedRemainingMs`. Testy pauza → korekta → wznowienie w `timer-engine.test.ts`.
6. **Dzwonek:** decyzja: poprawiono dane, nie opis. Osadzony WAV ma teraz dominantę 440 Hz (poprzednio ok. 875 Hz). Test DFT w `timer-audio.test.ts`.
7. **Arkusz po parzeniu:** diagnoza smaku z `diagnoseExtractionTaste` (ten sam silnik co dial-in). Testy scenariuszy „za kwaśna” i „za gorzka” w `BrewFinishModal.test.tsx`.
8. **Dostępność (§2.4):** skaner `tests/touch-target-scan.test.ts` sprawdza kontrolki z jawnym rozmiarem w stylu. Naprawiono 13 kontrolek (steppery hitSlop 8, pozostałe minHeight 44 lub 44 × 44). **Otwarte:** 121 kontrolek bez jawnego rozmiaru (rozmiar z zawartości) nie jest sprawdzanych statycznie. Wymaga pomiaru na urządzeniu lub jawnych rozmiarów.
9. **Przecinek:** `parseFloat` w polach formularzy zamieniony na `parseDecimal`. W `grinder-converter.ts` przecinek był usuwany (1,5 → 15), teraz jest normalizowany.

Otwarte po etapie 3a:
- Tłumaczenia nowych kluczy (`recipeLink`, `qrCopyFailed`) tylko PL i EN, jak w 4a i 4b. Pozostałe 33 pliki w `locales/` (nieładowane w runtime) nadal zawierają starą frazę „Apple Health” w `proPerk2` i `perk4`.
- Kody QR w `handleScanQrRecipe` (`useBrewWorkflow.ts`) nadal zapisują recepturę bez podglądu. Podgląd dotyczy tylko linku.
- `healthAttributesPl` (właściwości zdrowotne herbat) to decyzja D5, nie HealthKit. Nie zmieniano.
- Weryfikacja na urządzeniu i Maestro: dotyk, otwieranie `napar://` z systemu, dzwonek, schowek.

## Status etapu 3b — własna woda i kalibracja młynka (22.10.2026)

Zrobione na gałęzi `claude/wykonaj-sl7vii` (commit `e013e2c`):
- **Poz. 9 MVP, własna woda:** wpis twardości i zasadowości z raportu wodociągów (`src/core/own-water.ts`, `src/components/dialin/OwnWaterCard.tsx`). Zapis w `app_settings` jako JSON (`src/core/repositories/water-profile.ts`), więc kopia zapasowa go obejmuje. Przelicznik °dH na mg CaCO₃/L: S-091 („do sprawdzenia”). Metoda: D-002 („decyzja techniczna”).
- **Poz. 12 MVP, kalibracja przelicznika kliknięć:** średnia ważona z własnych parzeń kawy z TDS (`src/core/grinder-calibration.ts`), limit ±5 kliknięć i minimum 3 pary (S-093, D-003 — „decyzja techniczna”). Czułość 0,5 % EY na klik: S-092 („do sprawdzenia”). Wyzerowanie nie kasuje parzeń (`src/core/repositories/grinder-calibration.ts`).

Otwarte: wpisy S-091 i S-092 nie mają źródła pierwotnego. Przed wydaniem trzeba je potwierdzić albo oznaczyć jako decyzję techniczną z uzasadnieniem.

## Status etapu 3c — napoje mleczne, karta obrazowa, dostępność (22.10.2026)

Zrobione na gałęzi `claude/wykonaj-sl7vii`:
- **Poz. 32 MVP, napoje mleczne i latte art** (commit `96bd572`, testy ekranu i kompletności tekstów w `65c51bf`): `src/core/milk-drinks.ts`, `app/milk-drinks.tsx`, `src/components/milk/MilkDrinkCard.tsx`. Objętości i proporcje są wartościami roboczymi z oznaczeniem „[OCENA]” (rejestr NM-01…NM-07). Ich źródła nie są sprawdzone. Decyzja właściciela (B): pozycja jest w MVP.
- **Poz. 31 MVP, karta degustacyjna jako obraz** (commit `2f78021`): `src/components/journal/TastingCardExport.tsx`, `src/platform/tasting-card-share.ts` (PNG przez `react-native-view-shot`). Arkusz udostępniania nie był sprawdzony na urządzeniu.
- **Poz. 36 MVP, dostępność — przyciski 44 pt** (commity `07cebdc`, `6d11a29`, `73309f8`, `3cfdf1a`): kontrolki z jawnym rozmiarem mają co najmniej 44 pt, a skaner `tests/touch-target-scan.test.ts` sprawdza wszystkie. Kontrolki bez jawnego rozmiaru (w README: 121) nie są sprawdzane statycznie. VoiceOver i Dynamic Type do 2.0× wymagają sprawdzenia na urządzeniu.

Otwarte: pomiar na urządzeniu (dotyk, VoiceOver, Dynamic Type), tłumaczenia nowych kluczy na 33 pozostałe języki.

## Ostatnie zmiany dokumentacji i cen

- `8e9058a`: README i zasady pracy doprowadzone do stanu z 22.10.2026.
- `b20f836`: roczna subskrypcja testowa w `NaparStoreKit.storekit` ustawiona na 6,99 USD zgodnie z zatwierdzonym cennikiem (`docs/lista-funkcji-mvp.md`).

## Domknięcie pozycji MVP 2, 11, 14, 20, 24 i cen (22.10.2026)

Zrobione na gałęzi `claude/wykonaj-sl7vii` (każda pozycja ma test w repo, status w README):
- **Ceny w tekstach** (`77cb33b`): słowniki PL i EN bez cen; tekst zastępczy „cena w App Store”. Test: `src/core/__tests__/price-texts.test.ts`. Naprawiono też test kontraktu StoreKit, który oczekiwał nieaktualnej ceny rocznej 4,99 USD.
- **Poz. 14, zakres wagi bez sztywnego minimum** (`8a69674`): steper dozy schodził do 1 g, a wody do 10 g. Teraz do 0 g (`src/core/weight-range.ts`).
- **Poz. 24, diagnoza smaku dla herbaty** (`bd8e4a4`): arkusz po parzeniu używa reguł herbaty (RD-05b) dla herbaty.
- **Poz. 20, zapamiętany tryb** (`1295a18`): ostatnia receptura i liczba porcji w `app_settings`. Tryb napoju był już zapisany.
- **Poz. 11, własny młynek** (`dcc4a8f`): nazwa i przelicznik µm/klik, zapis w `app_settings`, lista w dial-in, ustawieniach i modalu parzenia. Własna metoda działała wcześniej jako receptura z wolnym polem metody.
- **Poz. 2, baner pustej paczki** (`984f628`): baner z archiwizacją już był. Usunięcie paczki przeniesiono na `lib/confirm`.

Bramka po tych zmianach: patrz `README.md`, sekcja „Liczby z pomiaru”.

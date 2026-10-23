# Napar (Steepwise)

Stan na **23.10.2026** (gałąź `claude/wykonaj-sl7vii`; pomiary w sekcji „Liczby z pomiaru”). Ten plik opisuje to, co kod faktycznie robi, i zakres MVP. Poprzednia wersja README (z twierdzeniami bez pokrycia) jest w `docs/archiwum/README-do-2026-10-22.md`.

## Czym jest Napar

Aplikacja mobilna (Expo / React Native, cel: iOS) dla osób, które parzą kawę specialty i herbatę liściastą w domu. Pomaga:

- prowadzić parzenie krok po kroku z timerem (metody: V60, Chemex, French press, AeroPress, Kalita, espresso, Gongfu, kyusu, herbata w czarce, dekokt);
- dobierać proporcje, dozę, wodę i nastawę młynka oraz diagnozować smak (dial-in);
- prowadzić spiżarnię paczek kawy i herbaty, dziennik parzeń i statystyki;
- liczyć szacunkową kofeinę.

Nazwa w języku polskim to Napar, w angielskim Steepwise. Interfejs działa w dwóch językach: polskim i angielskim (patrz „Języki”).

## Zasady — co kod faktycznie robi

- **Bez konta.** Aplikacja nie ma ekranów logowania ani rejestracji.
- **Dane w telefonie.** Dane są w lokalnej bazie SQLite (`expo-sqlite`). Nie ma synchronizacji ani chmury Napar.
- **Offline.** Funkcje nie wymagają sieci. Test `tests/public-repo.test.ts` sprawdza, że pliki `src/` i `app/` (poza testami) nie wywołują `fetch`, `XMLHttpRequest`, `WebSocket` ani `axios`.
- **Zero telemetrii.** W `package.json` nie ma zależności analitycznych ani śledzących. Kopie zapasowe (JSON, CSV) eksportuje użytkownik przez arkusz udostępniania systemu.
- **Zakup przez Apple.** Zakup i odczyt uprawnień idą przez StoreKit (`expo-iap`). Napar nie ma własnego serwera ani weryfikacji zakupu poza sklepem (test `tests/store-adapter.test.ts`).
- **Kofeina jako szacunek.** Model kinetyki (t½ domyślnie 5 h) jest szacunkiem, nie wynikiem pomiaru. Treści o śnie i zdrowiu są w trakcie usuwania (patrz „Znane ograniczenia”).
- **Brak HealthKit.** Integracja z Apple Health została usunięta z kodu (commit `d4a1469`).

## Stan funkcji MVP

Zakres MVP: 31 pozycji z `docs/lista-funkcji-mvp.md` (z decyzjami właściciela z 22.10.2026).

Legenda statusów:

- **DZIAŁA** — jest realna logika, dostępna z interfejsu i pokryta testem w repo. Nie oznacza sprawdzenia na urządzeniu, chyba że napisano inaczej.
- **CZĘŚCIOWO** — działa, ale brakuje wskazanego elementu.
- **DO ZWERYFIKOWANIA NA URZĄDZENIU** — kod istnieje, lecz nie sprawdzono go na iPhonie ani w symulatorze.
- **ZAPLANOWANE** — nie zbudowane.
- **USUNIĘTE** — usunięte z kodu.
- **NIE USTALONO** — nie dało się ustalić stanu z kodu i testów.

| # | Funkcja MVP | Status | Dowód i czego brakuje |
|---|---|---|---|
| 1 | Kompendium odmian, procesów i regionów, bez nazw marek | DZIAŁA | `src/core/knowledge-data.ts`, `knowledge.test.ts`. |
| 2 | Zapas paczek: palarnia, data palenia, waga, cena, ubytek, ostrzeżenie przy pustej paczce | DZIAŁA | Baner „Paczka skończona (0 g)” z jedną akcją „Archiwizuj teraz”: `src/components/beans/BeanItemCard.tsx` (ok. l. 95–112), test `src/core/__tests__/stash-screen.test.tsx` („Paczka ze stanem 0g…”). Trwałe usunięcie tylko przez `lib/confirm` w `BeanEditModal.tsx`. |
| 4 | Okna świeżości (odpoczynek, szczyt, starzenie) | CZĘŚCIOWO | `bpr-engine.ts` i `domain-rules.ts` podają różne progi (odgazowanie 7 dni w jednym, 5 dni w drugim; szczyt 7–35 dni w jednym, 6–30 w drugim). Do ujednolicenia. |
| 7 | Profile wody predefiniowane, bez nazw marek wód butelkowanych | CZĘŚCIOWO | `src/core/water-chemistry.ts` nadal zawiera nazwy marek wód (Volvic, Żywiecki Kryształ, Żywiec Zdrój, Muszynianka). |
| 8 | Kalkulator mineralizacji z koncentratów i soli | DZIAŁA | `water-chemistry.ts`, `water-chemistry.test.ts`. |
| 9 | Własna woda: twardość i zasadowość z raportu wodociągów | DZIAŁA | `src/components/dialin/OwnWaterCard.tsx`, `own-water.ts`, `own-water.test.ts`. Zasady przeliczeń: rejestr D-002. |
| 10 | Młynki z przelicznikiem kliknięć, dane zweryfikowane | CZĘŚCIOWO | `grinder-converter.ts`, `grinder-converter.test.ts`. Dane młynków nie są zweryfikowane (wpisy rejestru w statusie „do sprawdzenia”). Przykłady kliknięć w README z poprzedniej wersji nie wynikają z kodu. |
| 11 | Własny młynek i własna metoda | DZIAŁA | Własny młynek: `src/core/custom-grinder.ts`, `src/core/repositories/custom-grinders.ts` (zapis w `app_settings`, kopia zapasowa), `src/components/dialin/CustomGrinderCard.tsx`; testy `custom-grinder.test.ts`, `repositories-custom-grinders.test.ts`, `CustomGrinderCard.test.tsx`. Własna metoda: wolne pole metody w kreatorze (`app/recipe-builder.tsx`, `RecipeBasicInfoCard.tsx`). |
| 12 | Kalibracja przelicznika kliknięć z własnych parzeń | DZIAŁA | `GrinderCalibrationCard.tsx`, `grinder-calibration.ts`, `grinder-calibration.test.ts`. Limity: ±5 kliknięć, min. 3 pary (rejestr S-093, S-095). |
| 13 | Kalkulator proporcji w obie strony | DZIAŁA | `src/components/dialin/BrewRatioTab.tsx`, `calculateBrewDose` w `domain-rules.ts`. |
| 14 | Zakres wagi bez sztywnego minimum | DZIAŁA | Steper dozy i wody zatrzymuje się na 0 g (wcześniej 1 g i 10 g): `src/core/weight-range.ts`, `BrewQuickPrepCard.tsx`. Pole `NumInput` nie ma min/max. Testy granic: `weight-range.test.ts`, `weight-input.test.tsx` (5 g, 270 g, 320 g, 500 g). Brak górnego limitu wagi w kodzie. |
| 15 | Skalowanie na porcje | DZIAŁA | `calculateBatchScaling` (RD-06, 1–4 osoby) w `domain-rules.ts`, `BrewQuickPrepCard.tsx`. |
| 16 | Kroki metod: V60, Chemex, French press, AeroPress (obie metody), espresso, Kalita | DZIAŁA | `src/core/recipes-data.ts`: V60, CHEMEX, FRENCH_PRESS, AEROPRESS (odwrócona i klasyczna), ESPRESSO, KALITA. |
| 17 | Sesja Gongfu: rundy, czasy, kofeina na rundę | CZĘŚCIOWO | `app/gongfu.tsx`, `gongfu.test.ts`, `gongfu-screen.test.tsx`. Brak kontrolki oceny zalania w UI (ocena sesji może być pusta). |
| 19 | Sygnał dźwiękowy i haptyczny przy końcu kroku | DO ZWERYFIKOWANIA NA URZĄDZENIU | `src/core/timer-audio.ts` (dzwonek WAV 440 Hz, test DFT w `timer-audio.test.ts`), haptyka w `timer-engine.ts`. Nie słyszano na urządzeniu. |
| 20 | Zapamiętany tryb bez przełączania | DZIAŁA | Ostatnia receptura (`last_recipe_id`) i liczba porcji (`last_servings`) w `app_settings`: `src/core/repositories/app-settings.ts`, odczyt przy starcie w `src/core/brew-context.tsx` (`rememberedRecipeFor`), porcje w `src/core/useBrewWorkflow.ts`. Tryb napoju (`beverage_preference`) był już zapisany. Testy: `repositories-brew-memory.test.ts`, `brew-memory-workflow.test.tsx`. |
| 22 | Live Activity i Apple Watch | DO ZWERYFIKOWANIA NA URZĄDZENIU (Live Activity i Apple Watch) | Live Activity: `modules/napar-live-activity` (ActivityKit), `targets/napar-widget`, `src/platform/live-activity-sync.tsx`, kontrakt TS–Swift w `napar-live-activity.test.ts`. Apple Watch: model i polecenia w `src/core/watch-state.ts`, most iPhone `modules/napar-watch-link` (WatchConnectivity), sync `src/platform/watch-sync.tsx`, aplikacja `targets/napar-watch` (watchOS 10+, haptyka, PL/EN). Kontrakt w `tests/napar-watch-link.test.ts`. Swift i watchOS nie są kompilowane na Linuksie; parowanie i działanie na zegarku nie są sprawdzone. |
| 23 | Ocena w skali koła smaków SCA | DZIAŁA | `src/core/flavor-wheel-data.ts`, `flavor-wheel-picker.tsx`, używane w `BrewFinishModal.tsx`. |
| 24 | Diagnoza smaku z korektą (kawa, herbata) | DZIAŁA | Arkusz po parzeniu przekazuje typ napoju: `src/components/brew/BrewFinishModal.tsx` (`beverageType`), herbata używa `diagnoseTeaTaste` (RD-05b, `src/core/domain-rules.ts`). Testy dwóch scenariuszy herbaty w `BrewFinishModal.test.tsx`. Reguły herbaty w rejestrze: „do sprawdzenia”. |
| 26 | Dziennik sesji z pełnymi parametrami i notatkami | DZIAŁA | `app/(tabs)/journal.tsx`, `journal-screen.test.tsx`. |
| 27 | Statystyki i trendy | DZIAŁA | `JournalAnalyticsView.tsx`, `useJournalAnalytics.ts`, `journal-screen.test.tsx`. |
| 28 | Kopia zapasowa: eksport JSON, CSV, import z testem odtworzenia | DZIAŁA | `src/core/backup.ts`, `csv-export.ts` (`escapeCsvCell`), `backup.test.ts`, `backup-roundtrip.test.ts`. Test odtworzenia działa na sql.js, nie na sterowniku expo-sqlite w telefonie. |
| 29 | Spójność danych po aktualizacji | CZĘŚCIOWO | Testy migracji: `migration-v1-to-v2.test.ts`. Ścieżka bazy (`db-location.ts`, fallback) nie sprawdzona na symulatorze ani urządzeniu. |
| 30 | Receptura jako link lub QR, offline, z obsługą otwierania linku | CZĘŚCIOWO | Link `napar://` z podglądem przed zapisem: `app/recipe.tsx`, `recipe-link-route.test.tsx`. Generowanie QR: `qr-code.tsx`. Skan QR zapisuje recepturę bez podglądu (`useBrewWorkflow.ts`). Otwieranie `napar://` z systemu, skan aparatem i kopiowanie do schowka do sprawdzenia na urządzeniu. |
| 31 | Karta degustacyjna jako obraz do udostępnienia | DZIAŁA | `TastingCardExport.tsx`, `src/platform/tasting-card-share.ts` (PNG przez `react-native-view-shot`), `tasting-card-share.test.ts`. Arkusz udostępniania do sprawdzenia na urządzeniu. |
| 32 | Przepisy na napoje mleczne i latte art | DZIAŁA | `app/milk-drinks.tsx`, `MilkDrinkCard.tsx`, `milk-drinks.ts`, `milk-drinks-screen.test.tsx`. Objętości i proporcje są wartościami roboczymi bez źródła (rejestr NM-01…NM-07, status „[OCENA]”). |
| 33 | Bez konta, dane tylko w telefonie | DZIAŁA | Brak logowania; baza lokalna (`src/core/database-schema.ts`). |
| 34 | Zakupy: model M5 S1 | CZĘŚCIOWO | Polityka dostępu (`src/core/access-policy.ts`, `src/core/app-access.ts`) i adapter `expo-iap` (`src/platform/store-expo.ts`) są w repo i pokryte testami. Brak produktów w App Store Connect: zakup pokazuje „zakup niedostępny”. Brak testu sandbox na urządzeniu. Szczegóły w „Model cenowy”. |
| 35 | Języki: jak w „treningu” (35) | ZAPLANOWANE | Działają tylko PL i EN (patrz „Języki”). |
| 36 | Dostępność: VoiceOver, Dynamic Type do 2.0×, przyciski 44 pt | CZĘŚCIOWO | Skaner `tests/touch-target-scan.test.ts` sprawdza kontrolki z jawnym rozmiarem. 121 kontrolek bez jawnego rozmiaru nie jest sprawdzanych statycznie. Kontrast testowany przez `oracle-contrast.test.ts`. VoiceOver i Dynamic Type do 2.0× do sprawdzenia na urządzeniu. |
| 37 | Kofeina jako szacunek, bez obietnic dotyczących snu i zdrowia | CZĘŚCIOWO | Model i wykres kinetyki są w repo. Progi snu („bezpieczny dla fazy głębokiej NREM”, `domain-rules.ts`), karta odcięcia (`BedtimeCurfewCard.tsx`) i odwołanie do EFSA (`caffeine.tsx`) nadal są w kodzie. Wpisy rejestru T-036, T-139, T-149 są „do sprawdzenia”. |

Poza MVP (bez zmian w liście):

- **Wersja 1.1:** 6 (zapas herbaty: rok zbioru, cena za gram), 18 (krzywa rund i porównanie sesji).
- **Później:** 21 (waga Bluetooth).
- **Skreślone:** 3, 5, 25.
- **Usunięte z kodu:** HealthKit (poza MVP, commit `d4a1469`); fałszywy paragon zakupu (etap 4a).

## Języki

- Interfejs obsługuje **35 języków** (`src/core/i18n-loader.ts`, `LANGS`). Wybór: ustawienie użytkownika, potem język systemu, potem angielski. Źródło kluczy: `locales/pl.json`. Ustawienie języka nie jest jeszcze zapisywane między uruchomieniami.
- Katalog `locales/` zawiera **35 plików** słowników (`pl.json` to źródło kluczy). Pliki poza `pl` i `en` są na razie kopiami `en.json` (do przetłumaczenia). Brakujący klucz: język docelowy, potem `en`, potem sam klucz.
- Cel MVP to 35 języków (decyzja właściciela). Tłumaczenia pozostałych 33 są zaplanowane, nie zrobione.

## Model cenowy (M5 S1)

- **Darmowy poziom:** 7 dni parzenia w miesiącu kalendarzowym. Dzień parzenia to dzień, w którym ukończono parzenie zmierzone timerem w aplikacji. Wpisy ręczne, import i edycja wstecz się nie liczą.
- **Blokada:** dotyczy tylko rozpoczęcia nowego parzenia timerem w dniu, w którym limit został wyczerpany. Trwającego parzenia blokada nie przerywa. Historia, edycja, eksport, kopia i import są zawsze dostępne.
- **Pro:** bez limitu. Plany: miesięczny, roczny, dożywotni.
- **Bez okresu próbnego i bez ofert wprowadzających.**
- **Ceny** (decyzja 2 w `docs/lista-funkcji-mvp.md`, do potwierdzenia przy premierze):

| Waluta | Miesięczna | Roczna | Dożywotnia |
|---|---|---|---|
| USD | 0,99 | 6,99 | 14,99 |
| PLN | 4,99 | 19,99 | 59,99 |
| EUR | 0,99 | 7,99 | 17,99 |
| GBP | 0,99 | 6,99 | 14,99 |

- **Ceny testowe:** `NaparStoreKit.storekit` ma roczną subskrypcję w USD 6,99 (zgodnie z decyzją). Test kontraktu: `src/core/__tests__/contracts.test.ts`.
- **Ceny w tekstach:** słowniki PL i EN nie zawierają cen. Ceny w aplikacji to `displayPrice` ze sklepu; przed załadowaniem sklepu widać „cena w App Store”. Test: `src/core/__tests__/price-texts.test.ts`.
- **Family Sharing:** zatwierdzone dla subskrypcji i zakupu dożywotniego. Apple podaje, że po włączeniu w App Store Connect nie można go wyłączyć. Przed wysyłką właściciel sprawdza wybrany produkt.
- **Zakup działa dopiero po utworzeniu produktów w App Store Connect:** `pl.lukasz.napar.monthly`, `pl.lukasz.napar.annual`, `pl.lukasz.napar.lifetime` i grupa subskrypcji. Bez nich zakup pokazuje „zakup niedostępny”. Sandbox na urządzeniu jeszcze nie przeszedł. Przywracanie nie wywołuje `AppStore.sync` i wymaga sprawdzenia w sandboxie.
- **Liczba 7 dni** jest decyzją właściciela. Model liczby płacących zakładał częstotliwość treningową i nie został przeliczony na kawę (otwarte w `docs/lista-funkcji-mvp.md`).

## Liczby z pomiaru (23.10.2026, po wdrożeniu zegarka; poprzedni pomiar 22.10.2026, commit `984f628`)

| Pomiar | Wynik |
|---|---|
| `npm run verify` | kod 0 |
| Zestawy testów Jest | 128 (wszystkie przeszły) |
| Testy Jest | 1381 (wszystkie przeszły) |
| Klucze i18n w PL i EN (`check:i18n`) | 504 |
| Słowniki w `locales/` (`check:i18n`) | 35 (ładowane w aplikacji: 35) |
| Elementy macierzy testów (`check:matrix`) | 883 z 883 (to wynik macierzy, nie pokrycie kodu) |
| Zależności produkcyjne sprawdzone pod licencje | 24, 0 naruszeń GPL/LGPL |
| Pliki z długiem w `check:core-imports` | 14 (`scripts/core-imports-allowlist.json`) |
| Pokrycie, wszystkie pliki (`npm run test:coverage`, kod 0) | instrukcje 96,83%, gałęzie 87,04%, funkcje 95,51%, linie 97,36% |
| Pokrycie, `src/core/` (wyliczone z `coverage/coverage-final.json`) | instrukcje 98,6%, gałęzie 91,8%, funkcje 99,1% (linie: nie liczono w tym pomiarze) |
| Progi w `jest.config.js` | globalnie: instrukcje 92, gałęzie 80, funkcje 91, linie 93; `src/core/`: 97 / 88 / 98 / 97; wybrane moduły: 100 |
| Rejestr twierdzeń (`docs/research/rejestr-twierdzen.json`) | 121 wpisów: 109 „do sprawdzenia”, 6 „[OCENA]”, 5 „decyzja techniczna”, 1 „zatwierdzona”, 0 „potwierdzone” |

Progi pokrycia to dolne granice, a nie cel 100%. Cel 100% dla `src/core/` jest w planie na późniejsze etapy.

## Uruchomienie i sprawdzenie

Wymagane: Node.js 20 lub nowszy, npm, Python 3 (dla `check:corpus`). Do uruchomienia w symulatorze: macOS z Xcode.

```bash
npm install                  # zależności
npm run verify               # pełna bramka: i18n, licencje, korpus Python, macierz, natywny, importy core, typy, testy
npm test                     # same testy Jest
npm run test:coverage        # testy z progami pokrycia z jest.config.js
npm run typecheck            # tsc --noEmit
npm run check:i18n           # symetria kluczy PL i EN
PROP_SEED=12345 npm test -- tests/domain-properties.test.ts   # powtórzenie testów losowych z tym samym ziarnem
npm run start                # Expo (uruchomienie w symulatorze iOS)
```

`npm run verify` nie zmienia plików w repo; wyniki macierzy są porównywane z `docs/22-macierz-testow.md`.

Stos: Expo ~57.0.26, React Native 0.86.3, React 19.2.3, expo-sqlite ~57.0.3, expo-iap ~5.8.3, TypeScript ^5.5.4.

## Znane ograniczenia i otwarte decyzje

- **Nie sprawdzono na urządzeniu:** dźwięk i haptyka, Live Activity, Apple Watch (parowanie, polecenia, wibracja, napisy), otwieranie `napar://` z systemu, kopiowanie do schowka, skan QR aparatem, VoiceOver, Dynamic Type do 2.0×, ścieżka bazy SQLite (`/Library/SQLite` i fallback).
- **Kofeina i zdrowie (D5):** progi snu i odwołania do EFSA nadal są w kodzie. Do usunięcia albo do zweryfikowania źródłami (rejestr T-036, T-139, T-149).
- **Marki i osoby (D6):** nazwy autorów receptur (np. Tetsu Kasuya, James Hoffmann) i marek młynków (np. Comandante, Timemore) oraz marki wód nadal są w `recipes-data.ts`, `grinder-converter.ts` i `water-chemistry.ts`.
- **Licencja (D7):** decyzja licencyjna otwarta (D7 w `docs/plan-przebudowy.md`). Plik `LICENSE` w repo nie istnieje. Blokuje wydanie.
- **Testy E2E:** w historii CI z 15–20.10.2026 wszystkie przebiegi Maestro kończyły się błędem (`docs/audyt-etap1-2026-10-22.md`). Stan po tej dacie nie jest sprawdzony.
- **Plan a lista:** `docs/plan-przebudowy.md` zakładał Live Activity i Watch poza MVP (etap 6), a `docs/lista-funkcji-mvp.md` (decyzja A) włącza je do MVP. Plan wymaga aktualizacji.
- **Apple Watch, silnik:** `nextStep()` w pauzie zostawia w `pausedRemainingMs` czas poprzedniego etapu, więc po wznowieniu nowy etap odlicza czas starego (potwierdzone testem tymczasowym przy przygotowaniu wdrożenia zegarka). Zegarek nie wysyła „Dalej” w pauzie. Błąd dotyczy też przycisku w aplikacji i wymaga osobnej poprawki w `src/core/timer-engine.ts`.
- **Etapy:** statusy 0, 1, 2, 3a, 3b, 3c, 4a i 4b są w `docs/plan-przebudowy.md`. Etapy 5 (CI, TestFlight) i 7 (wydanie) nie są zrobione.

## Dokumentacja

- `CLAUDE.md` — reguły dla agentów AI i nienaruszalne zasady architektury.
- `docs/lista-funkcji-mvp.md` — zakres MVP i decyzje właściciela (źródło prawdy o zakresie).
- `docs/plan-przebudowy.md` — etapy, statusy i otwarte decyzje D1–D9.
- `docs/audyt-etap1-2026-10-22.md` — audyt stanu wyjściowego.
- `docs/research/rejestr-twierdzen.json` — rejestr twierdzeń i stałych merytorycznych.
- `docs/project-rules.md` — obowiązujące zasady pracy nad repo.
- `docs/22-macierz-testow.md` — macierz testów sprawdzana przez `check:matrix`.
- `site/` — strony `index.html`, `privacy.html`, `support.html`.
- `docs/archiwum/` — archiwum poprzedniego README i zasad projektu.

## Licencja

Decyzja licencyjna otwarta (D7 w `docs/plan-przebudowy.md`). Plik `LICENSE` nie istnieje.

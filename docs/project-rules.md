# Zasady pracy nad repo Napar

Stan na **22.10.2026**. Poprzednia wersja (17.10.2026) jest w `docs/archiwum/project-rules-do-2026-10-22.md`. Zasady architektury i UI są nadrzędne wobec tego pliku: `CLAUDE.md`. Zakres produktu i decyzje: `docs/lista-funkcji-mvp.md`. Etapy i status: `docs/plan-przebudowy.md`.

## 1. Zakres i stan

- Produkt: aplikacja Napar (Steepwise), iOS, Expo / React Native. Zakres MVP: 31 pozycji z `docs/lista-funkcji-mvp.md`.
- „Zrobione” oznacza dowód: test przechodzący w repo, pomiar albo log. Samo opisanie w dokumencie nie wystarcza.
- Atrapy nie wchodzą do repo. Funkcja bez realnego działania ma status w README (`CZĘŚCIOWO`, `NIE USTALONO`, `ZAPLANOWANE`), a nie sukces bez wywołania systemu.
- Zmiany zakresu i decyzje produktowe należą do właściciela. Agent ich nie podejmuje.

## 2. Prywatność i offline

- Aplikacja działa bez konta i bez sieci. Dane są w lokalnej bazie SQLite w telefonie.
- Zakaz `fetch`, `XMLHttpRequest`, `WebSocket` i `axios` w `src/` i `app/` (poza testami). Pilnuje tego `tests/public-repo.test.ts`.
- Zakaz SDK analitycznych i śledzących. Nowa zależność wymaga sprawdzenia licencji (`check:licenses`) i prywatności.
- Eksport wszystkich komórek CSV przechodzi przez `escapeCsvCell` (`src/core/csv-export.ts`).
- Pliki `.p8`, `.p12`, `.env`, certyfikaty i klucze nie trafiają do Git (`.gitignore`, test `public-repo.test.ts`).
- Apple Health (HealthKit) jest usunięte z kodu. Nie dodajemy go bez nowej decyzji właściciela i osobnego etapu.

## 3. Treści merytoryczne i zdrowotne (rejestr twierdzeń)

- Każda stała liczbowa i każde twierdzenie merytoryczne w kodzie lub tekstach ma wpis w `docs/research/rejestr-twierdzen.json` (pole `id`, `cytat`, `status`, `zrodla`). Bez wpisu nie wchodzi.
- Statusy wpisów: „do sprawdzenia”, „[OCENA]” (wartość robocza autora), „decyzja techniczna”, „zatwierdzona” (decyzja właściciela), „potwierdzone” (po źródle pierwotnym z datą przeglądu). Wpis nie przechodzi do „potwierdzone” bez źródła pierwotnego.
- Kofeina jest szacunkiem modelowym. Nie piszemy obietnic dotyczących snu, zdrowia ani medycyny. Progi snu i odwołania do EFSA są w kodzie do usunięcia lub weryfikacji (D5, rejestr T-036, T-139, T-149).
- Nazw marek, firm i osób nie używamy w recepturach, treściach, nazwach młynków ani wód (D6). Istniejące wystąpienia są do usunięcia.
- Liczby i twierdzenia w README, metadanych sklepu i tekstach UI muszą mieć pomiar albo wpis w rejestrze.

## 4. Architektura i kod

- Logika domenowa jest w `src/core/`. Pliki tam nie importują `react`, `react-native` ani `expo-*` (CLAUDE.md §2.1). Bramka: `npm run check:core-imports`. Istniejący dług jest w `scripts/core-imports-allowlist.json`. Nowego naruszenia nie dodajemy, a plik z wpisu należy z niego usunąć, gdy przestaje naruszać regułę.
- Adaptery platformy są w `src/platform/`. Nowy kod powstaje obok starego, a stary usuwa się osobnym commitem po przełączeniu.
- Stałe i wzory są nazwane (obiekty z polami), a nie przekazywane kolejnością argumentów.

## 5. Testy i bramki

| Bramka | Komenda | Warunek |
|---|---|---|
| Pełna bramka jakości | `npm run verify` | Kod wyjścia 0 przed każdym commitem |
| Pokrycie | `npm run test:coverage` | Kod 0; progi z `jest.config.js` |
| Importy `src/core/` | `npm run check:core-imports` | Zero nowych naruszeń (część `verify`) |
| Twierdzenia | `npm run check:claims` | Uruchamiana, jeśli skrypt istnieje w `package.json`. Dziś go nie ma; rejestr jest sprawdzany ręcznie i przez przegląd |
| Typy | `npm run typecheck` | Kod 0 |

Zasady dla testów i progów:

- Najpierw test, potem poprawka. Błąd odtwarzany testem, który na kodzie sprzed poprawki się nie przechodzi.
- Progów pokrycia nie obniżamy bez decyzji zapisanej w `docs/plan-przebudowy.md`. Cel 100% dla `src/core/` jest w planie.
- Testy losowe: ziarno z komunikatu `PROP_SEED`; powtórzenie: `PROP_SEED=<ziarno> npm test -- <plik>`.
- Testy na sql.js sprawdzają SQL i logikę kopii. Sterownik expo-sqlite sprawdzamy na urządzeniu.
- E2E (Maestro) jest bramką etapu 3 i 5. Dopóki nie jest zielone, nie zgłaszamy etapu jako zamkniętego.

## 6. Dostępność i UI

- Każda kontrolka interaktywna ma minimalne pole dotyku 44 × 44 pt (NFR-A11Y). Skaner `tests/touch-target-scan.test.ts` sprawdza kontrolki z jawnym rozmiarem. Kontrolki bez jawnego rozmiaru sprawdzamy na urządzeniu, dopóki nie ma statycznej kontroli.
- Kontrast tekstu zwykłego: WCAG AA, co najmniej 4,5:1 (`tests/oracle-contrast.test.ts`).
- Dynamic Type do 2.0× i szerokość ekranu 320 pt: sprawdzane na urządzeniu.
- Przycisk „Anuluj” / „Zamknij” po lewej stronie nagłówka modala. Zapis formularza w prawym rogu nagłówka. Usuwanie tylko przez moduł potwierdzeń (CLAUDE.md §2.2 wskazuje `lib/confirm.ts`; w repo to `src/core/confirm.ts`).
- Brak emotikonów z klawiatury w interfejsie. Ikony to wektory SVG.
- Brak ucinania elementów: safe-area i dolny pasek dopasowane do Home Indicator.

## 7. Język i tłumaczenia

- Brak zakodowanego na sztywno tekstu w widokach. Teksty idą przez `src/core/i18n.tsx`.
- Każdy nowy klucz ma wartość w PL i w EN. `npm run check:i18n` musi przejść (494 klucze w PL i EN wg pomiaru 22.10.2026).
- Słowniki w `locales/` (35 plików) ładuje aplikacja przez `src/core/i18n-loader.ts`. `locales/pl.json` jest źródłem kluczy, a `check:i18n` pilnuje zgodności 35 plików. Tłumaczenie 33 języków poza PL i EN (na razie kopie `en.json`) to zaplanowany zakres (pozycja 35 MVP).

## 8. Zakupy i model dostępu

- Zakup tylko przez StoreKit (`expo-iap`, adapter w `src/core/store-port.ts` i `src/platform/store-expo.ts`).
- Brak weryfikacji paragonu lokalnie ani w kodzie. Stan Pro pochodzi z uprawnień sklepu.
- Fałszywy sklep (`EXPO_PUBLIC_STORE_FAKE=1`) wolno włączać tylko w buildzie E2E. Build TestFlight go blokuje.
- Zmiana cen, limitu lub identyfikatorów produktów wymaga decyzji właściciela i aktualizacji `docs/lista-funkcji-mvp.md`.

## 9. Commity i gałęzie

- Commity małymi krokami. Komunikat po polsku, np. `dostępność: kontrolki z minimum 44 pt (etap 3a, punkt 3)`.
- Przed commitem `npm run verify` kończy się kodem 0. Push tylko przy kodzie 0.
- Nie cofamy cudzych commitów.
- Praca idzie na gałęzi zadania, nie bezpośrednio na `main`.
- Stopka commitu: `Co-Authored-By` i `Claude-Session` zgodnie z instrukcjami sesji. Nie wpisujemy identyfikatorów modeli.
- Nie commitujemy plików generowanych (`coverage/`, `ios/`, `node_modules/`, `.expo/`).

## 10. Role

| Rola | Zakres |
|---|---|
| Właściciel | Decyzje produktowe, licencja (D7), zakupy w App Store Connect, testy na urządzeniu, zatwierdzanie cen i limitów |
| Koordynator | Stan repo, bramki przed commitem, konflikty środowiska |
| Programista | Implementacja według specyfikacji, najpierw test, minimalny diff |
| Audytor | Niezależna weryfikacja jakości i dostępności, testy regresji |
| Tłumacz | Spójność kluczy i18n i redakcja tekstów PL i EN |
| Wydawca | Przygotowanie wydań TestFlight i App Store, metadane bez nazw konkurentów (wytyczna 2.3.7) |

## 11. Przed wydaniem

- `npm run verify` kod 0 i `npm run test:coverage` kod 0.
- Każda funkcja w README ma status zgodny z kodem i testami.
- Otwarte decyzje D5, D6, D7 i D8 zamknięte albo jawnie zaakceptowane przez właściciela.
- Wypełnione: App Store Connect (produkty, Family Sharing po decyzji), testy sandbox, testy na urządzeniu.

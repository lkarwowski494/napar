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

## 6. Otwarte pytania (blokują konkretne etapy)

1. **Zatwierdzenie założeń z sekcji 2** — blokuje etap 0.
2. **Zgoda na wzorce z `trening`** — `trening` jest „wszelkie prawa zastrzeżone”. Przepisywanie według wzoru bez kopiowania pliku nie wymaga zgody w ten sam sposób, ale kopiowanie kodu tak. Czy jesteś właścicielem `trening` i zgadzasz się na to? — blokuje etap 4 i 6, jeśli chcemy kopiować fragmenty zamiast przepisywać.
3. **Licencja Napar (D7)** — blokuje etap 7.
4. **Dostęp do App Store Connect i urządzenia testowego** — blokuje etap 4 i 5.

## 7. Ryzyka

- **Przebudowa rozmyta:** przy przebudowie w miejscu stary i nowy kod mogą się mieszać. Mitigacja: nowy kod w nowych katalogach, przełączenie jednym commitem, stary kod usuwany osobnym commitem.
- **Stare długi wracają:** bez rejestru twierdzeń i bramki pokrycia znowu pojawią się atrapy. Mitigacja: bramki z etapu 0 są nienegocjowalne.
- **Różnice wersji:** `trening` i Napar mają te same wersje dziś; po aktualizacji jednego trzeba sprawdzić drugi.

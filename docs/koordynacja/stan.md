# Koordynacja Napar — stan (aktualizacja 2026-11-19 12:12 UTC)

## Mandat (przepisuj bez zmian; zmienia go tylko właściciel)
- Tryb decyzji: analogia — od 2026-11-19 10:30 UTC, słowa: „1. Tak 2. Dopracowanie aplikacji. Mysle ze powinnismy zaczac od napraw ktore wskazal audyt a nie zostaly jeszcze zrobione. 3. analogia”
- Cel: Dopracowanie aplikacji `lkarwowski494/napar` — w pierwszej kolejności domknięcie napraw z audytu M1, które nie zostały jeszcze zrobione (na bazie gałęzi `claude/napar-app-audit-5u19j0`), doprowadzenie do zielonego CI i E2E, wdrożenie bramki scenariuszy użytkownika (D-060) przed kolejnym buildem TestFlight.
- Repo portfela do analogii (odczyt): `lkarwowski494/piekarz`, `lkarwowski494/oczko`, `lkarwowski494/trening`
- Zgody trwałe: brak (wszystkie działania zewnętrzne z zasady wspólnej 12 wymagają osobnej zgody)
- Zawsze za zgodą: push i scalenie na `main`, App Store Connect, TestFlight, publikacja, usuwanie gałęzi i danych, force-push, koszty stałe, wiadomości do ludzi, koszt API ponad pułap
- Pułapy kosztu: sesja 10 USD (próg STOP = 13 USD), doba 30 USD (ponad: bez nowych sesji) [OCENA — do kalibracji po pierwszych sesjach; środowisko Antigravity nie raportuje `cost_usd`, mierzymy czas]
- Koordynator aktywny: `v1/default/jetski_remote_agents_3p/2f459540-3f1f-4d1d-b6a9-942b302be3a0` (od 2026-11-19 10:25 UTC)
- Środowisko: Linux `6.12.105+`, Node `v24.22.3`, `gh` aktywny, repo `lkarwowski494/napar` (PUBLIC) + `lkarwowski494/prompts` (PRIVATE); brak Playwright i Xcode; delegowanie przez lokalne subagenty (`invoke_subagent`) — nazwany wyjątek od `create_session`.
- Gałąź robocza: `claude/napar-app-audit-5u19j0` (HEAD `3d12389`, czeka na koniec E2E `44517342406` przed FF do `70b4d29`); gałąź stanu: `koordynacja` (nigdy nie scalana do integracji ani `main`).

## Teraz (3–5 linii)
- **Sesje A, B+B2, C+C2, D+D2, E, F+F2 wszystkie przyjęte** — najnowszy zweryfikowany commit to **`70b4d29`** na `origin/naprawy/F-a11y-ekrany-wody` (`npm run verify` kod `0`: 118/118 pakietów, 1289/1289 testów; recenzja F2: **PRZYJĄĆ**, 0 P0, 0 P1, 1 P2).
- Łącznie od `c836267` dodano **20 zweryfikowanych commitów** (kontakt DEC-07, `workflow_dispatch` w `ci.yml`, Scope §3 `F-05`/`F-15`/`F-31`/`F-32` + `D-017..D-020` + `ZM-05..ZM-08`, bramka D-060 `przypadki-uzycia.md` + `sprawdz-scenariusze.mjs` + `wykonane.tsv`, naprawa onboardingu Maestro, przegląd 12 wpisów `rejestr.json`, naprawa VoiceOver/Maestro `star-rating-row`/`water-chips-row`, `testID="ekran:<trasa>"` na 9 ekranach, korekta 5 wód butelkowanych wg etykiet).
- W toku: przebiegi `E2E iOS (Maestro)` — run **`44517342406`** na `claude/napar-app-audit-5u19j0` (`3d12389`) oraz run **`44521826864`** na `naprawy/F-a11y-ekrany-wody` (`70b4d29`).
- Następny krok: po zakończeniu E2E `44517342406` — FF `claude/napar-app-audit-5u19j0` → `70b4d29`, uruchomienie finalnego E2E na `70b4d29` oraz prośba do właściciela o zgodę na scalenie do `main` (i ew. weto `KO-002..004` + status `M1-audytor-generalny-020`).

## Sesje
| Litera | ID | Rola, tryb | Gałąź @ SHA | Kontekst % | Koszt USD | Stan |
|---|---|---|---|---|---|---|
| A | `5b8ef1c0509aa4bf52924a24527e5b17` | 07-jakosc, audit | `claude/napar-app-audit-5u19j0` @ `c836267` (odczyt) | — | — | przyjęta (10:41 UTC) |
| B | `af12d27faaab387fe6368f6fb597f910` | 08-programista, fix | `naprawy/B-zakres-kontakt-ci` @ `1e88b1d` | — | — | przyjęta i scalona FF |
| B2 | `6bb4689cd0a936abc3d37d2154b2ca08` | recenzent (08 audit) | `naprawy/B-zakres-kontakt-ci` @ `1e88b1d` (odczyt) | — | — | przyjęta (PRZYJĄĆ) |
| C | `6d79a347175718a536dd27bd68510345` | 07-jakosc, fix (JAK-19) | `naprawy/C-bramka-scenariuszy` @ `ea8f107` | — | — | przyjęta z uwagami (2 P1 → D) |
| C2 | `a947d8befee927acd3688e5aba62ab61` | recenzent (07 audit) | `naprawy/C-bramka-scenariuszy` @ `ea8f107` (odczyt) | — | — | przyjęta (PRZYJĄĆ Z UWAGAMI) |
| D | `73b8d32922840bcba788ba3e591daaca` | 07-jakosc, fix (C2 P1 + E2E) | `naprawy/D-e2e-i-bramka` @ `3d12389` | — | — | przyjęta i scalona FF |
| D2 | `b4f7bd1b6ecfabb86db3c8dc95b2d018` | recenzent (07 audit) | `naprawy/D-e2e-i-bramka` @ `3d12389` (odczyt) | — | — | przyjęta (PRZYJĄĆ Z UWAGAMI → F) |
| E | `bd15eab873313e9321aaf92f4d9bd93a` | 06-tresci, fix (REJ-01) | `naprawy/E-tresci-rejestr` @ `00721e8` | — | — | przyjęta (11:54 UTC, verify 0) |
| F | `a6c48698b90b7027fa6af21585848b53` | 08-programista, fix (D2, ekrany, wody) | `naprawy/F-a11y-ekrany-wody` @ `70b4d29` | — | — | przyjęta (12:11 UTC, verify 0; czeka na FF po E2E) |
| F2 | `52fb202ab2270a4966c797f2fb411d96` | recenzent (08 audit) | `naprawy/F-a11y-ekrany-wody` @ `70b4d29` (odczyt) | — | — | przyjęta (12:11 UTC, PRZYJĄĆ: 0 P0, 0 P1, 1 P2) |

## Plan 24 h (UTC)
| Kiedy | Co | Kto (sesja/rola) | Zależy od | Od właściciela |
|---|---|---|---|---|
| 11:43–12:30 | Przebieg `E2E iOS (Maestro)` na `3d12389` (run `44517342406`) | GitHub Actions | w toku | nic |
| po 44517342406 | FF `claude/napar-app-audit-5u19j0` → `70b4d29` + uruchomienie E2E na `70b4d29` | Koordynator | koniec `44517342406` | nic |
| po zielonym E2E | Prośba o zgodę na scalenie `claude/napar-app-audit-5u19j0` → `main` | Koordynator | zielone E2E na `70b4d29` | zgoda na `main` + ew. weto `KO-002..004` + status `M1-020` |
| po scaleniu `main` | Build TestFlight 1.0.0 + testy fizyczne `T1`–`T12` / protokół F | Właściciel | zgoda na TestFlight | testy fizyczne na telefonie |

## Czeka na właściciela
- Do weta (tryb `analogia`, nie blokowało prac): `KO-002` (`support@apps4brew.com`), `KO-003` (`workflow_dispatch` w `ci.yml`), `KO-004` (Scope §3: usunięcie `tds-input`, karty kosztu, kalendarza 14-dniowego/ICS, ukrycie okna odgazowania; zamknięcie 12 pozycji §3 w `D-017..D-020`) — w `docs/koordynacja/decyzje.md`.
- `[DO USTALENIA]`: treść brakującego zadania `M1-audytor-generalny-020` (brak w repo po usunięciu `audit/` wg D-009).
- Działanie zewnętrzne (zasada 12): zgoda na scalenie `claude/napar-app-audit-5u19j0` → `main` (po zielonym E2E na `70b4d29`).

## Bramka scenariuszy (zasada 22)
- Wdrożona i zielona statycznie na `70b4d29`: `docs/jakosc/przypadki-uzycia.md` (27 PU: 7 A / 0 B / 20 F), `scripts/sprawdz-scenariusze.mjs`, `testID="ekran:<trasa>"` na wszystkich 9 ekranach `app/`, artefakt `e2e-wykonane` (`wykonane.tsv`) w `e2e-ios.yml`, `--build "$BUILD" --wykonane wykonane.tsv` w `testflight.yml`.

## Przypomnienia
- Środowisko bez `send_later` / `list_triggers`; kontrola realizowana reaktywnie.

## Pule numerów decyzji
- `docs/decyzje.md`: zajęte `D-001`…`D-020` (na `70b4d29`); następny wolny: `D-021`; KO następny: `KO-005`.

## Dziennik (najnowsze na dole; starsze niż 48 h do `dziennik-<RRRR-MM>.md`)
| UTC | Sesja | Zdarzenie z dowodem (SHA, run, plik) | Następny krok |
|---|---|---|---|
| 2026-11-19 10:25 | M9 | ETAP 0: złożono prompt M9, sprawdzono `lkarwowski494/napar` (PUBLIC). | STOP start do właściciela |
| 2026-11-19 10:30 | M9 | Zgoda właściciela: gałąź `koordynacja`, cel „dopracowanie aplikacji — zacząć od niezrobionych napraw audytu”, tryb `analogia`. | Założenie `origin/koordynacja`, start E2E i Sesji A |
| 2026-11-19 10:41 | A | Odbiór Sesji A (`c836267`): `npm run verify` kod `0` (119/119, 1320/1320). | Zlecić Sesję B |
| 2026-11-19 11:11 | B+B2 | Sesja B (`1e88b1d`, 7 commitów, verify 0) + recenzja B2 (**PRZYJĄĆ**). | Zlecić Sesję C (`JAK-19`) |
| 2026-11-19 11:12 | CI | E2E `44506727938` na `c836267`: **failure** (`OnboardingModal`). | Naprawa w Sesji D |
| 2026-11-19 11:26 | C+C2 | Sesja C (`ea8f107`, 4 commity, verify 0) + recenzja C2 (**PRZYJĄĆ Z UWAGAMI**, 2 P1). | Zlecić Sesję D |
| 2026-11-19 11:43 | D+D2 | Sesja D (`3d12389`, 4 commity, verify 0) + recenzja D2 (**PRZYJĄĆ Z UWAGAMI** → F). FF `claude/napar-app-audit-5u19j0` → `3d12389`, start E2E `44517342406`. | Zlecić Sesję E (`06-tresci`) |
| 2026-11-19 11:54 | E | Sesja E (`00721e8`, `rejestr.json`, verify 0; 2/12 zamk., 10 z analizą). | Zlecić Sesję F (`08-programista`) |
| 2026-11-19 12:11 | F+F2 | Sesja F (`70b4d29`, 4 commity, verify 0: 118/118, 1289/1289) + recenzja F2 (**PRZYJĄĆ**, 0 P0/P1, 1 P2). | Czekać na wynik E2E `44517342406`, potem FF → `70b4d29` i raport do właściciela |

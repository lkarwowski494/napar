# Koordynacja Napar — stan (aktualizacja 2026-11-19 11:44 UTC)

## Mandat (przepisuj bez zmian; zmienia go tylko właściciel)
- Tryb decyzji: analogia — od 2026-11-19 10:30 UTC, słowa: „1. Tak 2. Dopracowanie aplikacji. Mysle ze powinnismy zaczac od napraw ktore wskazal audyt a nie zostaly jeszcze zrobione. 3. analogia”
- Cel: Dopracowanie aplikacji `lkarwowski494/napar` — w pierwszej kolejności domknięcie napraw z audytu M1, które nie zostały jeszcze zrobione (na bazie gałęzi `claude/napar-app-audit-5u19j0`), doprowadzenie do zielonego CI i E2E, wdrożenie bramki scenariuszy użytkownika (D-060) przed kolejnym buildem TestFlight.
- Repo portfela do analogii (odczyt): `lkarwowski494/piekarz`, `lkarwowski494/oczko`, `lkarwowski494/trening`
- Zgody trwałe: brak (wszystkie działania zewnętrzne z zasady wspólnej 12 wymagają osobnej zgody)
- Zawsze za zgodą: push i scalenie na `main`, App Store Connect, TestFlight, publikacja, usuwanie gałęzi i danych, force-push, koszty stałe, wiadomości do ludzi, koszt API ponad pułap
- Pułapy kosztu: sesja 10 USD (próg STOP = 13 USD), doba 30 USD (ponad: bez nowych sesji) [OCENA — do kalibracji po pierwszych sesjach; środowisko Antigravity nie raportuje `cost_usd`, mierzymy czas]
- Koordynator aktywny: `v1/default/jetski_remote_agents_3p/2f459540-3f1f-4d1d-b6a9-942b302be3a0` (od 2026-11-19 10:25 UTC)
- Środowisko: Linux `6.12.105+`, Node `v24.22.3`, `gh` aktywny, repo `lkarwowski494/napar` (PUBLIC) + `lkarwowski494/prompts` (PRIVATE); brak Playwright i Xcode; delegowanie przez lokalne subagenty (`invoke_subagent`) — nazwany wyjątek od `create_session` (kontrola zastępcza: polecenie w `docs/koordynacja/polecenia/<litera>.md`, wynik na osobnej gałęzi, koordynator sprawdza dowody i zleca recenzję niezależną przy kodzie).
- Gałąź robocza: `claude/napar-app-audit-5u19j0` (HEAD `3d12389`, FF z `c836267` po B+C+D); gałąź stanu: `koordynacja` (nigdy nie scalana do integracji ani `main`).

## Teraz (3–5 linii)
- **Sesje B, C, D przyjęte i scalone (FF)** na `origin/claude/napar-app-audit-5u19j0` @ `3d12389` (15 commitów: kontakt DEC-07, `workflow_dispatch` w `ci.yml`, Scope §3 `F-05`/`F-15`/`F-31`/`F-32`, bramka D-060 `przypadki-uzycia.md` + `sprawdz-scenariusze.mjs` + `wykonane.tsv`, naprawa onboardingu Maestro z E2E `44506727938`).
- W toku: nowy przebieg `E2E iOS (Maestro)` run **`44517342406`** na `3d12389` (start 11:43 UTC — zweryfikuje poprawkę onboardingu i `08-pelna-petla.yaml`).
- Startuje **Sesja E** (`06-tresci --tryb fix --zadania REJ-01`) na gałęzi `naprawy/E-tresci-rejestr` od `3d12389`: domknięcie 12 otwartych wpisów `rejestr.json`.
- Kolejka po E i E2E `44517342406`: **Sesja F** (`08-programista --tryb fix`) — poprawka D2 P1 (`BrewFinishModal.tsx:137` `accessible={true}` na `star-rating-row`), D2 P2 (`testflight.yml:52` zbędny `git fetch --tags --force`), ew. korekty kodowe po E i po wyniku E2E `44517342406`.

## Sesje
| Litera | ID | Rola, tryb | Gałąź @ SHA | Kontekst % | Koszt USD | Stan |
|---|---|---|---|---|---|---|
| A | `5b8ef1c0509aa4bf52924a24527e5b17` | 07-jakosc, audit | `claude/napar-app-audit-5u19j0` @ `c836267` (odczyt) | — | — | przyjęta (10:41 UTC) |
| B | `af12d27faaab387fe6368f6fb597f910` | 08-programista, fix | `naprawy/B-zakres-kontakt-ci` @ `1e88b1d` | — | — | przyjęta i scalona FF (11:11 UTC) |
| B2 | `6bb4689cd0a936abc3d37d2154b2ca08` | recenzent (08 audit) | `naprawy/B-zakres-kontakt-ci` @ `1e88b1d` (odczyt) | — | — | przyjęta (PRZYJĄĆ) |
| C | `6d79a347175718a536dd27bd68510345` | 07-jakosc, fix (JAK-19) | `naprawy/C-bramka-scenariuszy` @ `ea8f107` | — | — | przyjęta z uwagami (2 P1 → D) |
| C2 | `a947d8befee927acd3688e5aba62ab61` | recenzent (07 audit) | `naprawy/C-bramka-scenariuszy` @ `ea8f107` (odczyt) | — | — | przyjęta (PRZYJĄĆ Z UWAGAMI) |
| D | `73b8d32922840bcba788ba3e591daaca` | 07-jakosc, fix (C2 P1 + E2E) | `naprawy/D-e2e-i-bramka` @ `3d12389` | — | — | przyjęta i scalona FF (11:43 UTC) |
| D2 | `b4f7bd1b6ecfabb86db3c8dc95b2d018` | recenzent (07 audit) | `naprawy/D-e2e-i-bramka` @ `3d12389` (odczyt) | — | — | przyjęta (PRZYJĄĆ Z UWAGAMI: 1 P1, 1 P2 → Sesja F) |
| E | `bd15eab873313e9321aaf92f4d9bd93a` | 06-tresci, fix (REJ-01) | `naprawy/E-tresci-rejestr` od `3d12389` | — | — | w toku (11:44 UTC) |

## Plan 24 h (UTC)
| Kiedy | Co | Kto (sesja/rola) | Zależy od | Od właściciela |
|---|---|---|---|---|
| 11:43–12:25 | Przebieg `E2E iOS (Maestro)` na `3d12389` (run `44517342406`) | GitHub Actions | uruchomione | nic |
| 11:44–12:15 | Domknięcie otwartych wpisów `rejestr.json` (12 pozycji, źródła przeczytane) | Sesja E (`06-tresci`, fix) | start teraz | nic |
| 12:15–12:45 | Poprawki D2 P1 (`BrewFinishModal.tsx:137`), D2 P2 (`testflight.yml:52`), ew. korekty kodowe po E i E2E `44517342406` | Sesja F (`08-programista`, fix) | koniec E i E2E `44517342406` | nic |
| 12:45–13:05 | Recenzja niezależna E/F + FF `claude/napar-app-audit-5u19j0` + zielone E2E | Recenzent + Koordynator | koniec F | nic |
| po zielonym E2E | Prośba o zgodę na scalenie `claude/napar-app-audit-5u19j0` → `main` | Koordynator | zielone `verify` i `e2e-ios.yml` | zgoda na `main` + ew. weto `KO-002..004` + status `M1-020` |

## Czeka na właściciela
- Do weta (nie blokuje prac, tryb `analogia`): `KO-002` (`support@apps4brew.com`), `KO-003` (`workflow_dispatch` w `ci.yml`), `KO-004` (Scope §3: 4 uproszczenia UI + zamknięcie 12 pozycji §3) — w `docs/koordynacja/decyzje.md`.
- Informacyjnie `[DO USTALENIA]`: treść brakującego zadania `M1-audytor-generalny-020` (brak w repo po usunięciu `audit/` wg D-009).

## Bramka scenariuszy (zasada 22)
- Wdrożona na `3d12389`: `docs/jakosc/przypadki-uzycia.md` (27 PU: 7 A / 0 B / 20 F), `scripts/sprawdz-scenariusze.mjs` (`--statycznie` zielone w `verify`), `e2e-wykonane` (`wykonane.tsv`) w `e2e-ios.yml`, `--build "$BUILD" --wykonane wykonane.tsv` w `testflight.yml`. E2E `44517342406` w toku; protokół F dla kolejnego buildu TestFlight do wykonania przez właściciela po buildzie.

## Przypomnienia
- Środowisko bez `send_later` / `list_triggers`; kontrola realizowana reaktywnie po zakończeniu subagentów i zadań w tle.

## Pule numerów decyzji
- `docs/decyzje.md`: zajęte `D-001`…`D-020` (na `3d12389`); następny wolny: `D-021`; KO następny: `KO-005`.

## Dziennik (najnowsze na dole; starsze niż 48 h do `dziennik-<RRRR-MM>.md`)
| UTC | Sesja | Zdarzenie z dowodem (SHA, run, plik) | Następny krok |
|---|---|---|---|
| 2026-11-19 10:25 | M9 | ETAP 0: złożono prompt M9, sprawdzono `lkarwowski494/napar` (PUBLIC). Brak `koordynacja`; `main` (`491d618`) z czerwonym CI/E2E; `claude/napar-app-audit-5u19j0` (`c836267`) 72 commity przed `main`. | STOP start do właściciela |
| 2026-11-19 10:30 | M9 | Zgoda właściciela na STOP start: `koordynacja`, cel „dopracowanie aplikacji — zacząć od niezrobionych napraw audytu”, tryb `analogia`. | Założenie `origin/koordynacja`, start E2E i Sesji A |
| 2026-11-19 10:33 | M9 | Wyzwolono `e2e-ios.yml` na `c836267`: run `44506727938`. | Czekać na wynik E2E |
| 2026-11-19 10:41 | A | Odbiór Sesji A: `npm run verify` kod `0` (119/119, 1320/1320), `scratch/A-raport.md`. | Zlecić Sesję B |
| 2026-11-19 11:11 | B+B2 | Sesja B (`1e88b1d`, 7 commitów, verify 0) + recenzja B2 (**PRZYJĄĆ**, 0 P0/P1, 2 P2). | Zlecić Sesję C (`JAK-19`) |
| 2026-11-19 11:12 | CI | E2E `44506727938` na `c836267`: **failure** (39 min; `Tap on "Spiżarnia"` — przyczyna: `OnboardingModal`). | Naprawa w Sesji D |
| 2026-11-19 11:26 | C+C2 | Sesja C (`ea8f107`, 4 commity, verify 0) + recenzja C2 (**PRZYJĄĆ Z UWAGAMI**, 2 P1). | Zlecić Sesję D (C2 P1 + E2E) |
| 2026-11-19 11:42 | D+D2 | Sesja D (`3d12389`, 4 commity, verify 0, 1286/1286 testów) + recenzja D2 (**PRZYJĄĆ Z UWAGAMI**: 1 P1 `BrewFinishModal.tsx:137` `accessible={true}`, 1 P2 `testflight.yml:52` → Sesja F). | FF `claude/napar-app-audit-5u19j0` → `3d12389`, start E2E i Sesji E |
| 2026-11-19 11:43 | M9 | FF `origin/claude/napar-app-audit-5u19j0` → `3d12389`; wyzwolono `e2e-ios.yml` run `44517342406`. Zlecono Sesję E (`06-tresci`, `REJ-01`). | Czekać na Sesję E i E2E `44517342406` |

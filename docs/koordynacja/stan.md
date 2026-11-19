# Koordynacja Napar — stan (aktualizacja 2026-11-19 11:13 UTC)

## Mandat (przepisuj bez zmian; zmienia go tylko właściciel)
- Tryb decyzji: analogia — od 2026-11-19 10:30 UTC, słowa: „1. Tak 2. Dopracowanie aplikacji. Mysle ze powinnismy zaczac od napraw ktore wskazal audyt a nie zostaly jeszcze zrobione. 3. analogia”
- Cel: Dopracowanie aplikacji `lkarwowski494/napar` — w pierwszej kolejności domknięcie napraw z audytu M1, które nie zostały jeszcze zrobione (na bazie gałęzi `claude/napar-app-audit-5u19j0`), doprowadzenie do zielonego CI i E2E, wdrożenie bramki scenariuszy użytkownika (D-060) przed kolejnym buildem TestFlight.
- Repo portfela do analogii (odczyt): `lkarwowski494/piekarz`, `lkarwowski494/oczko`, `lkarwowski494/trening`
- Zgody trwałe: brak (wszystkie działania zewnętrzne z zasady wspólnej 12 wymagają osobnej zgody)
- Zawsze za zgodą: push i scalenie na `main`, App Store Connect, TestFlight, publikacja, usuwanie gałęzi i danych, force-push, koszty stałe, wiadomości do ludzi, koszt API ponad pułap
- Pułapy kosztu: sesja 10 USD (próg STOP = 13 USD), doba 30 USD (ponad: bez nowych sesji) [OCENA — do kalibracji po pierwszych sesjach; środowisko Antigravity nie raportuje `cost_usd`, mierzymy czas]
- Koordynator aktywny: `v1/default/jetski_remote_agents_3p/2f459540-3f1f-4d1d-b6a9-942b302be3a0` (od 2026-11-19 10:25 UTC)
- Środowisko: Linux `6.12.105+`, Node `v24.22.3`, `gh` aktywny, repo `lkarwowski494/napar` (PUBLIC) + `lkarwowski494/prompts` (PRIVATE); brak Playwright i Xcode; delegowanie przez lokalne subagenty (`invoke_subagent`) — nazwany wyjątek od `create_session` (brak narzędzi chmurowych Claude Code w tym środowisku; kontrola zastępcza: polecenie w `docs/koordynacja/polecenia/<litera>.md`, wynik na osobnej gałęzi/raporcie, koordynator sprawdza dowody i zleca recenzję niezależną przy kodzie).
- Gałąź robocza: `claude/napar-app-audit-5u19j0` (HEAD `c836267`, czeka na koniec E2E `44506727938` przed FF do `1e88b1d`); gałąź stanu: `koordynacja` (nigdy nie scalana do integracji ani `main`).

## Teraz (3–5 linii)
- **Sesja B przyjęta** (11:11 UTC): 7 commitów na `origin/naprawy/B-zakres-kontakt-ci` (`1e88b1d`), `npm run verify` kod `0` (117/117 pakietów, 1274/1274 testów), niezależna recenzja **B2: PRZYJĄĆ (0 P0, 0 P1, 2 P2)**.
- W toku: `E2E iOS (Maestro)` run `44506727938` na `claude/napar-app-audit-5u19j0` (`c836267`, `in_progress` od 10:33 UTC — nie pushujemy na tę gałąź, żeby nie anulować przebiegu).
- Startuje **Sesja C** (`07-jakosc --tryb fix --zadania JAK-19 --moduly scenariusze-skrypt,e2e-mobilne`) na gałęzi `naprawy/C-bramka-scenariuszy` od `1e88b1d` (bramka D-060 + 2 P2 z B2).
- Następny krok: odbiór Sesji C + recenzja niezależna C2 → Sesja D (`06-tresci` dla otwartych wpisów `rejestr.json`) → FF na `claude/napar-app-audit-5u19j0` po zakończeniu E2E `44506727938`.

## Sesje
| Litera | ID | Rola, tryb | Gałąź @ SHA | Kontekst % | Koszt USD | Stan |
|---|---|---|---|---|---|---|
| A | `5b8ef1c0509aa4bf52924a24527e5b17` | 07-jakosc, audit | `claude/napar-app-audit-5u19j0` @ `c836267` (odczyt) | — | — | przyjęta (10:41 UTC) |
| B | `af12d27faaab387fe6368f6fb597f910` | 08-programista, fix | `naprawy/B-zakres-kontakt-ci` @ `1e88b1d` | — | — | przyjęta (11:11 UTC) |
| B2 | `6bb4689cd0a936abc3d37d2154b2ca08` | recenzent (08 audit) | `naprawy/B-zakres-kontakt-ci` @ `1e88b1d` (odczyt) | — | — | przyjęta (11:11 UTC, PRZYJĄĆ) |
| C | `6d79a347175718a536dd27bd68510345` | 07-jakosc, fix (JAK-19) | `naprawy/C-bramka-scenariuszy` @ `ea8f107` | — | — | czeka na recenzję C2 (11:23 UTC, verify 0) |
| C2 | `a947d8befee927acd3688e5aba62ab61` | recenzent (07 audit) | `naprawy/C-bramka-scenariuszy` @ `ea8f107` (odczyt) | — | — | w toku (11:24 UTC) |

## Plan 24 h (UTC)
| Kiedy | Co | Kto (sesja/rola) | Zależy od | Od właściciela |
|---|---|---|---|---|
| 10:33–11:25 | Przebieg `E2E iOS (Maestro)` na `c836267` (run `44506727938`) | GitHub Actions | w toku | nic |
| 11:13–12:00 | Wdrożenie bramki scenariuszy D-060 (`JAK-19`: `przypadki-uzycia.md`, `sprawdz-scenariusze.mjs`, `.maestro/08-pelna-petla.yaml`) + 2 P2 z B2 | Sesja C (`07-jakosc`, fix) | start teraz | nic |
| 12:00–12:20 | Recenzja niezależna C2 + FF `claude/napar-app-audit-5u19j0` | Sesja C2 + Koordynator | koniec C i E2E `44506727938` | nic |
| 12:20–13:30 | Domknięcie otwartych wpisów `rejestr.json` (6 liczb w kodzie, rozjazd 45 vs 60 mg) | Sesja D (`06-tresci`, fix) | po C2 | nic |
| po zielonym CI+E2E | Prośba o zgodę na scalenie `claude/napar-app-audit-5u19j0` → `main` | Koordynator | zielone CI, E2E, recenzje | zgoda na `main` + ew. weto `KO-002..004` |

## Czeka na właściciela
- Do weta (nie blokuje prac, tryb `analogia`): `KO-002` (`support@apps4brew.com`), `KO-003` (`workflow_dispatch` w `ci.yml`), `KO-004` (Scope §3: 4 uproszczenia UI + zamknięcie 12 pozycji §3) — w `docs/koordynacja/decyzje.md`.
- Informacyjnie `[DO USTALENIA]`: treść brakującego zadania `M1-audytor-generalny-020` (brak w repo po usunięciu `audit/` wg D-009).

## Bramka scenariuszy (zasada 22)
- W trakcie wdrażania w Sesji C (`naprawy/C-bramka-scenariuszy`, `JAK-19`).

## Przypomnienia
- Środowisko bez `send_later` / `list_triggers`; kontrola realizowana reaktywnie po zakończeniu subagentów i zadań w tle.

## Pule numerów decyzji
- `docs/decyzje.md`: zajęte `D-001`…`D-020` (na `1e88b1d`); następny wolny: `D-021`; KO następny: `KO-005`.

## Dziennik (najnowsze na dole; starsze niż 48 h do `dziennik-<RRRR-MM>.md`)
| UTC | Sesja | Zdarzenie z dowodem (SHA, run, plik) | Następny krok |
|---|---|---|---|
| 2026-11-19 10:25 | M9 | ETAP 0: złożono prompt M9, sprawdzono repo `lkarwowski494/napar` (PUBLIC). Brak `koordynacja`; `main` (`491d618`) z czerwonym CI/E2E; `claude/napar-app-audit-5u19j0` (`c836267`) 72 commity przed `main`. | STOP start do właściciela |
| 2026-11-19 10:30 | M9 | Zgoda właściciela na STOP start: `koordynacja`, cel „dopracowanie aplikacji — zacząć od niezrobionych napraw audytu”, tryb `analogia`. | Założenie `origin/koordynacja`, start E2E i Sesji A |
| 2026-11-19 10:33 | M9 | Wyzwolono `e2e-ios.yml` na `claude/napar-app-audit-5u19j0` (`c836267`): run `44506727938` (`in_progress`). | Czekać na wynik E2E |
| 2026-11-19 10:34 | M9 | Utworzono `origin/koordynacja` (`53b47d7`). Zlecono Sesję A (`5b8ef1c0509aa4bf52924a24527e5b17`). | Czekać na raport Sesji A |
| 2026-11-19 10:41 | A | Odbiór Sesji A: `npm run verify` kod `0` (119/119, 1320/1320), raport `scratch/A-raport.md`. | Zlecić Sesję B (`KO-002..004`) |
| 2026-11-19 10:43 | M9 | Zapisano `KO-002..004` do weta; usunięto `WG-02` (osobny klon stanu). Zlecono Sesję B (`af12d27faaab387fe6368f6fb597f910`). | Czekać na raport Sesji B |
| 2026-11-19 11:08 | B | Sesja B zakończona: 7 commitów na `origin/naprawy/B-zakres-kontakt-ci` (`1e88b1d`), autor `lkarwowski494`, `npm run verify` kod `0` (117/117, 1274/1274, `scratch/B-verify.log`). | Recenzja niezależna B2 |
| 2026-11-19 11:11 | B2 | Recenzja niezależna B2 (`6bb4689cd0a936abc3d37d2154b2ca08`): **PRZYJĄĆ** (0 P0, 0 P1, 2 P2). Sesja B przyjęta; FF na `claude/napar-app-audit-5u19j0` czeka na koniec E2E `44506727938`. | Zlecić Sesję C (`JAK-19`) od `1e88b1d` |

# Koordynacja Napar — stan (aktualizacja 2026-11-19 10:43 UTC)

## Mandat (przepisuj bez zmian; zmienia go tylko właściciel)
- Tryb decyzji: analogia — od 2026-11-19 10:30 UTC, słowa: „1. Tak 2. Dopracowanie aplikacji. Mysle ze powinnismy zaczac od napraw ktore wskazal audyt a nie zostaly jeszcze zrobione. 3. analogia”
- Cel: Dopracowanie aplikacji `lkarwowski494/napar` — w pierwszej kolejności domknięcie napraw z audytu M1, które nie zostały jeszcze zrobione (na bazie gałęzi `claude/napar-app-audit-5u19j0`), doprowadzenie do zielonego CI i E2E, wdrożenie bramki scenariuszy użytkownika (D-060) przed kolejnym buildem TestFlight.
- Repo portfela do analogii (odczyt): `lkarwowski494/piekarz`, `lkarwowski494/oczko`, `lkarwowski494/trening`
- Zgody trwałe: brak (wszystkie działania zewnętrzne z zasady wspólnej 12 wymagają osobnej zgody)
- Zawsze za zgodą: push i scalenie na `main`, App Store Connect, TestFlight, publikacja, usuwanie gałęzi i danych, force-push, koszty stałe, wiadomości do ludzi, koszt API ponad pułap
- Pułapy kosztu: sesja 10 USD (próg STOP = 13 USD), doba 30 USD (ponad: bez nowych sesji) [OCENA — do kalibracji po pierwszych sesjach; środowisko Antigravity nie raportuje `cost_usd`, mierzymy czas]
- Koordynator aktywny: `v1/default/jetski_remote_agents_3p/2f459540-3f1f-4d1d-b6a9-942b302be3a0` (od 2026-11-19 10:25 UTC)
- Środowisko: Linux `6.12.105+`, Node `v24.22.3`, `gh` aktywny, repo `lkarwowski494/napar` (PUBLIC) + `lkarwowski494/prompts` (PRIVATE); brak Playwright i Xcode; delegowanie przez lokalne subagenty (`invoke_subagent`) — nazwany wyjątek od `create_session` (brak narzędzi chmurowych Claude Code w tym środowisku; kontrola zastępcza: polecenie w `docs/koordynacja/polecenia/<litera>.md`, wynik na osobnej gałęzi/raporcie, koordynator sprawdza dowody i zleca recenzję niezależną przy kodzie).
- Gałąź robocza: `claude/napar-app-audit-5u19j0` (HEAD `c836267`, 72 commity przed `main`); gałąź stanu: `koordynacja` (nigdy nie scalana do integracji ani `main`).

## Teraz (3–5 linii)
- **Sesja A przyjęta** (10:41 UTC): `npm run verify` na `c836267` zwróciło kod `0` (119/119 pakietów, 1320/1320 testów, 93,18% Stmts); pełna lista brakujących napraw w `scratch/A-raport.md`.
- Podjęto decyzje `KO-002` (DEC-07: `support@apps4brew.com` z analogii `piekarz`/`oczko`), `KO-003` (WG-01: `workflow_dispatch` w `ci.yml`), `KO-004` (Scope §3: 4 uproszczenia w kodzie wg rekomendacji roli 03) — wszystkie **do weta** w `docs/koordynacja/decyzje.md`.
- W toku: `E2E iOS (Maestro)` run `44506727938` na `c836267` (`in_progress`) oraz **Sesja B** (`08-programista --tryb fix`) na gałęzi `naprawy/B-zakres-kontakt-ci`.
- Następny krok: odbiór Sesji B → recenzja niezależna kodu B → scalenie do gałęzi roboczej → Sesja C (`JAK-19` bramka scenariuszy D-060) i Sesja D (`06-tresci` otwarte wpisy `rejestr.json`).

## Sesje
| Litera | ID | Rola, tryb | Gałąź @ SHA | Kontekst % | Koszt USD | Stan |
|---|---|---|---|---|---|---|
| A | `5b8ef1c0509aa4bf52924a24527e5b17` | 07-jakosc, audit | `claude/napar-app-audit-5u19j0` @ `c836267` (odczyt) | — | — | przyjęta (10:41 UTC) |
| B | `af12d27faaab387fe6368f6fb597f910` | 08-programista, fix | `naprawy/B-zakres-kontakt-ci` od `c836267` | — | — | w toku (10:43 UTC) |

## Plan 24 h (UTC)
| Kiedy | Co | Kto (sesja/rola) | Zależy od | Od właściciela |
|---|---|---|---|---|
| 10:33–11:20 | Przebieg `E2E iOS (Maestro)` na `c836267` (run `44506727938`) | GitHub Actions | uruchomione | nic |
| 10:43–11:20 | DEC-07 (`support@apps4brew.com`), WG-01 (`ci.yml`), Scope §3 (`F-05`, `F-15`, `F-31`, `F-32`), `CLAUDE.md` | Sesja B (`08-programista`, fix) | start teraz | nic (weto na `decyzje.md`) |
| 11:20–11:45 | Recenzja niezależna kodu Sesji B + scalenie do `claude/napar-app-audit-5u19j0` | Sesja B2 (recenzent) | koniec Sesji B | nic |
| 11:45–13:30 | Wdrożenie bramki scenariuszy użytkownika D-060 (`JAK-19`: `przypadki-uzycia.md`, `sprawdz-scenariusze.mjs`, `.maestro/08-pelna-petla.yaml`) | Sesja C (`07-jakosc`, fix) | scalenie B | nic |
| 13:30–15:00 | Domknięcie 12 otwartych wpisów w `rejestr.json` (zwłaszcza 6 liczb w kodzie i rozjazd 45 vs 60 mg) | Sesja D (`06-tresci`, fix) | scalenie C | nic |
| po zielonym CI+E2E | Prośba o zgodę na scalenie `claude/napar-app-audit-5u19j0` → `main` + podanie statusu `M1-audytor-generalny-020` | Koordynator | zielone CI, E2E, recenzje | zgoda na `main` + ew. weto `KO-002..004` |

## Czeka na właściciela
- Do weta (nie blokuje prac, tryb `analogia`): `KO-002` (`support@apps4brew.com`), `KO-003` (`workflow_dispatch` w `ci.yml`), `KO-004` (Scope §3: usunięcie `tds-input` z zapisu, karty kosztu, kalendarza 14 dni/ICS, ukrycie okna odgazowania) — w `docs/koordynacja/decyzje.md`.
- Informacyjnie `[DO USTALENIA]`: treść brakującego zadania `M1-audytor-generalny-020` (brak w repo po usunięciu `audit/` wg D-009) — jeśli masz lokalne archiwum raportu M1, podaj treść.

## Bramka scenariuszy (zasada 22)
- Brak wdrożenia w repo (`docs/jakosc/przypadki-uzycia.md` i `scripts/sprawdz-scenariusze.mjs` nie istnieją). Zaplanowana jako Sesja C (`07-jakosc --tryb fix --zadania JAK-19 --moduly scenariusze-skrypt,e2e-mobilne`).

## Przypomnienia
- Środowisko bez `send_later` / `list_triggers`; kontrola realizowana reaktywnie po zakończeniu subagentów i zadań w tle.

## Pule numerów decyzji
- `docs/decyzje.md` na `claude/napar-app-audit-5u19j0`: zajęte `D-001`…`D-016`; Sesja B: pula `D-017`…`D-025`; następny wolny po B: `D-026`; KO następny: `KO-005`.

## Dziennik (najnowsze na dole; starsze niż 48 h do `dziennik-<RRRR-MM>.md`)
| UTC | Sesja | Zdarzenie z dowodem (SHA, run, plik) | Następny krok |
|---|---|---|---|
| 2026-11-19 10:25 | M9 | ETAP 0: złożono prompt M9 (`prompts/tools/assemble.mjs`), sprawdzono repo `lkarwowski494/napar` (PUBLIC). Brak gałęzi `koordynacja`; `main` (`491d618`) z czerwonym CI (`40879484016`) i E2E (`40879483839`); `claude/napar-app-audit-5u19j0` (`c836267`) 72 commity przed `main`, 44/45 zadań M1 w commitach (brak `M1-audytor-generalny-020`), 0 uruchomień CI/E2E. | STOP start do właściciela |
| 2026-11-19 10:30 | M9 | Zgoda właściciela na STOP start: gałąź `koordynacja`, cel „dopracowanie aplikacji — zacząć od niezrobionych napraw audytu”, tryb `analogia`. | Założenie `origin/koordynacja`, start E2E i Sesji A |
| 2026-11-19 10:33 | M9 | Wyzwolono `e2e-ios.yml` na `claude/napar-app-audit-5u19j0` (`c836267`): run `44506727938` (`in_progress`). | Czekać na wynik E2E |
| 2026-11-19 10:34 | M9 | Utworzono i wypchnięto `origin/koordynacja` (`53b47d7`). Zlecono Sesję A (`5b8ef1c0509aa4bf52924a24527e5b17`). | Czekać na raport Sesji A |
| 2026-11-19 10:41 | A | Odbiór Sesji A: `npm run verify` kod `0` (119/119 pakietów, 1320/1320 testów, 93,18% Stmts), raport `scratch/A-raport.md`. Werdykt 07: ZABLOKOWANE (brak D-060, DEC-07, CI/E2E na `c836267`, T1–T12, Scope §3, `rejestr.json` 12/24 otwarte). | Zlecić Sesję B (`KO-002..004`) |
| 2026-11-19 10:43 | M9 | Zapisano `KO-002` (DEC-07 z analogii `piekarz`/`oczko`), `KO-003` (WG-01), `KO-004` (Scope §3) do weta w `decyzje.md`. Zlecono Sesję B (`08-programista`, fix) na `naprawy/B-zakres-kontakt-ci`. | Czekać na raport Sesji B i E2E `44506727938` |

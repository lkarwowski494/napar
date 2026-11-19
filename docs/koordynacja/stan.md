# Koordynacja Napar — stan (aktualizacja 2026-11-19 10:35 UTC)

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
- Założono gałąź stanu `koordynacja` na bazie `origin/claude/napar-app-audit-5u19j0` (`c836267`).
- W toku: przebieg `E2E iOS (Maestro)` run `44506727938` na `claude/napar-app-audit-5u19j0` (`c836267`, start 10:33 UTC).
- Startuje **Sesja A** (`07-jakosc --tryb audit`, subagent): uruchomienie `npm run verify` na `c836267` i pełny inwentarz niezakończonych napraw po audycie M1 (`M1-audytor-generalny-020`, `rejestr.json`, `docs/scope-contract.md` §3, `D-016`, bramka D-060).
- Następny krok: odbiór raportu Sesji A i wyniku E2E `44506727938` → kolejka sesji naprawczych (08 / 06 / 07) na gałęziach roboczych.

## Sesje
| Litera | ID | Rola, tryb | Gałąź @ SHA | Kontekst % | Koszt USD | Stan |
|---|---|---|---|---|---|---|
| A | `5b8ef1c0509aa4bf52924a24527e5b17` | 07-jakosc, audit | `claude/napar-app-audit-5u19j0` @ `c836267` (odczyt) | — | — | w toku (10:35 UTC) |

## Plan 24 h (UTC)
| Kiedy | Co | Kto (sesja/rola) | Zależy od | Od właściciela |
|---|---|---|---|---|
| 10:35–11:15 | Weryfikacja `npm run verify` + inwentarz brakujących napraw po audycie M1 | Sesja A (`07-jakosc`, audit) | start teraz | nic |
| 10:33–11:20 | Przebieg `E2E iOS (Maestro)` na `c836267` (run `44506727938`) | GitHub Actions | uruchomione | nic |
| 11:20–13:00 | Rozstrzygnięcie KO (tryb `analogia`, do weta) dla otwartych punktów zakresu (`docs/scope-contract.md` §3) + zlecenie napraw kodu/treści/E2E | Koordynator + Sesja B (`08-programista` / `06-tresci`) | wynik Sesji A i E2E `44506727938` | nic (weto na `decyzje.md`) |
| 13:00–16:00 | Wdrożenie bramki scenariuszy użytkownika D-060 (`JAK-19`: `przypadki-uzytkownika.md` + `sprawdz-scenariusze.mjs`) | Sesja C (`07-jakosc`, fix) | zielone `verify` i E2E | nic |
| po zielonym CI+E2E | Prośba o zgodę na scalenie `claude/napar-app-audit-5u19j0` → `main` | Koordynator | zielone CI, E2E, recenzja | zgoda na scalenie do `main` |

## Czeka na właściciela
- brak (po starcie; decyzje z `docs/scope-contract.md` §3 i `D-016` pójdą w trybie `analogia` jako `KO-NNN` do weta, chyba że dotyczą działań zewnętrznych).

## Bramka scenariuszy (zasada 22)
- Brak wdrożenia w repo (`docs/jakosc/przypadki-uzytkownika.md` i `scripts/sprawdz-scenariusze.mjs` nie istnieją). Ostatni build TestFlight: `1.0.0` b1028 (`c71a71a7aa2d`, 2026-10-24, przed wdrożeniem bramki). Wymagane zlecenie `07-jakosc --tryb fix --zadania JAK-19 --moduly scenariusze-skrypt,e2e-mobilne` przed kolejnym buildem TestFlight.

## Przypomnienia
- Środowisko bez `send_later` / `list_triggers`; kontrola realizowana reaktywnie po zakończeniu subagentów i zadań w tle.

## Pule numerów decyzji
- `docs/decyzje.md` na `claude/napar-app-audit-5u19j0`: zajęte `D-001`…`D-016`; następny wolny: `D-017`; KO następny: `KO-001`.

## Dziennik (najnowsze na dole; starsze niż 48 h do `dziennik-<RRRR-MM>.md`)
| UTC | Sesja | Zdarzenie z dowodem (SHA, run, plik) | Następny krok |
|---|---|---|---|
| 2026-11-19 10:25 | M9 | ETAP 0: złożono prompt M9 (`prompts/tools/assemble.mjs`), sprawdzono repo `lkarwowski494/napar` (PUBLIC). Brak gałęzi `koordynacja`; `main` (`491d618`) z czerwonym CI (`40879484016`) i E2E (`40879483839`); `claude/napar-app-audit-5u19j0` (`c836267`) 72 commity przed `main`, 44/45 zadań M1 w commitach (brak `M1-audytor-generalny-020`), 0 uruchomień CI/E2E. | STOP start do właściciela |
| 2026-11-19 10:30 | M9 | Zgoda właściciela na STOP start: gałąź `koordynacja`, cel „dopracowanie aplikacji — zacząć od niezrobionych napraw audytu”, tryb `analogia`. | Założenie `origin/koordynacja`, start E2E i Sesji A |
| 2026-11-19 10:33 | M9 | Wyzwolono `e2e-ios.yml` na `claude/napar-app-audit-5u19j0` (`c836267`): run `44506727938` (`in_progress`). | Czekać na wynik E2E |
| 2026-11-19 10:34 | M9 | Utworzono i wypchnięto `origin/koordynacja` (od `c836267`). Zapisano `stan.md`, `decyzje.md`, `waskie-gardla.md`, `koszty.md`, `polecenia/A.md`. | Uruchomić Sesję A (`07-jakosc`, audit) |

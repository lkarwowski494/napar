# Koordynacja Napar — stan (aktualizacja 2026-11-19 19:40 UTC)

## Mandat (przepisuj bez zmian; zmienia go tylko właściciel)
- Tryb decyzji: analogia — od 2026-11-19 10:30 UTC, słowa: „1. Tak 2. Dopracowanie aplikacji. Mysle ze powinnismy zaczac od napraw ktore wskazal audyt a nie zostaly jeszcze zrobione. 3. analogia”
- Cel: Dopracowanie aplikacji `lkarwowski494/napar` — w pierwszej kolejności domknięcie napraw z audytu M1, które nie zostały jeszcze zrobione (na bazie gałęzi `claude/napar-app-audit-5u19j0`), doprowadzenie do zielonego CI i E2E, wdrożenie bramki scenariuszy użytkownika (D-060) przed kolejnym buildem TestFlight.
- Repo portfela do analogii (odczyt): `lkarwowski494/piekarz`, `lkarwowski494/oczko`, `lkarwowski494/trening`
- Zgody trwałe: brak (wszystkie działania zewnętrzne z zasady wspólnej 12 wymagają osobnej zgody)
- Zawsze za zgodą: push i scalenie na `main`, App Store Connect, TestFlight, publikacja, usuwanie gałęzi i danych, force-push, koszty stałe, wiadomości do ludzi, koszt API ponad pułap
- Pułapy kosztu: sesja 10 USD (próg STOP = 13 USD), doba 30 USD (ponad: bez nowych sesji) [OCENA — do kalibracji po pierwszych sesjach; środowisko Antigravity nie raportuje `cost_usd`, mierzymy czas]
- Koordynator aktywny: `v1/default/jetski_remote_agents_3p/2f459540-3f1f-4d1d-b6a9-942b302be3a0` (od 2026-11-19 10:25 UTC)
- Środowisko: Linux `6.12.105+`, Node `v24.22.3`, `gh` aktywny, repo `lkarwowski494/napar` (PUBLIC) + `lkarwowski494/prompts` (PRIVATE); brak Playwright i Xcode; delegowanie przez lokalne subagenty (`invoke_subagent`) — nazwany wyjątek od `create_session`.
- Gałąź robocza: `main` (HEAD `48b2bc4`, FF z `claude/napar-app-audit-5u19j0`); gałąź stanu: `koordynacja` (nigdy nie scalana do integracji ani `main`).

## Teraz (3–5 linii)
- **`main` zaktualizowany FF (`491d618..48b2bc4`)** za wyraźną zgodą właściciela (19:39 UTC: „1. WYrazam zgode na scalenie 2. Nie cofaj nic 3. Tak 4. Nie mam”).
- **Posprzątane gałęzie tymczasowe:** usunięto wszystkie `naprawy/*` z `origin` i lokalnie; potwierdzono `KO-002..004` i zamknięto `M1-020` (brak lokalnej kopii u właściciela).
- **W toku na `main` @ `48b2bc4`:** `CI` (`44600621311`), `TZ Matrix` (`44600621291`), `Deploy GitHub Pages` (`44600621418`), `iOS — kompilacja` (`44600621295`), `E2E iOS (Maestro)` (`44600621340`).
- Następny krok: potwierdzić zielone workflowy na `main`, następnie zapytać właściciela o zgodę na kolejny etap (TestFlight 1.0.0 + testy fizyczne `T1`–`T12` / albo dalsze dopracowanie P2 / `rejestr.json` / `jezyki.md`).

## Sesje
| Litera | ID | Rola, tryb | Gałąź @ SHA | Kontekst % | Koszt USD | Stan |
|---|---|---|---|---|---|---|
| A | `5b8ef1c0509aa4bf52924a24527e5b17` | 07-jakosc, audit | `claude/napar-app-audit-5u19j0` @ `c836267` (odczyt) | — | — | przyjęta (10:41 UTC) |
| B | `af12d27faaab387fe6368f6fb597f910` | 08-programista, fix | `naprawy/B-zakres-kontakt-ci` @ `1e88b1d` | — | — | przyjęta i scalona FF → `main` |
| B2 | `6bb4689cd0a936abc3d37d2154b2ca08` | recenzent (08 audit) | `naprawy/B-zakres-kontakt-ci` @ `1e88b1d` (odczyt) | — | — | przyjęta (PRZYJĄĆ) |
| C | `6d79a347175718a536dd27bd68510345` | 07-jakosc, fix (JAK-19) | `naprawy/C-bramka-scenariuszy` @ `ea8f107` | — | — | przyjęta z uwagami (2 P1 → D) |
| C2 | `a947d8befee927acd3688e5aba62ab61` | recenzent (07 audit) | `naprawy/C-bramka-scenariuszy` @ `ea8f107` (odczyt) | — | — | przyjęta (PRZYJĄĆ Z UWAGAMI) |
| D | `73b8d32922840bcba788ba3e591daaca` | 07-jakosc, fix (C2 P1 + E2E) | `naprawy/D-e2e-i-bramka` @ `3d12389` | — | — | przyjęta i scalona FF → `main` |
| D2 | `b4f7bd1b6ecfabb86db3c8dc95b2d018` | recenzent (07 audit) | `naprawy/D-e2e-i-bramka` @ `3d12389` (odczyt) | — | — | przyjęta (PRZYJĄĆ Z UWAGAMI → F) |
| E | `bd15eab873313e9321aaf92f4d9bd93a` | 06-tresci, fix (REJ-01) | `naprawy/E-tresci-rejestr` @ `00721e8` | — | — | przyjęta i scalona FF → `main` |
| F | `a6c48698b90b7027fa6af21585848b53` | 08-programista, fix (D2, ekrany, wody) | `naprawy/F-a11y-ekrany-wody` @ `70b4d29` | — | — | przyjęta i scalona FF → `main` |
| F2 | `52fb202ab2270a4966c797f2fb411d96` | recenzent (08 audit) | `naprawy/F-a11y-ekrany-wody` @ `70b4d29` (odczyt) | — | — | przyjęta (PRZYJĄĆ: 0 P0, 0 P1, 1 P2) |
| G | `b0cf6b75ad6c9858e7a68b94f8033441` | 07-jakosc, fix (E2E 44521826864) | `naprawy/G-e2e-44521826864` @ `a5a4507` | — | — | scalona FF, recenzja G2: ODRZUCIĆ (P0 → H) |
| G2 | `0286e043107ba520ed3c6064585f98d8` | recenzent (07 audit) | `70b4d29..a5a4507` (odczyt) | — | — | zakończona (ODRZUCIĆ: P0:1, P1:1, P2:1) |
| H | `85999b0b86dfd071a14f799315c15923` | 07-jakosc, fix (G2 P0/P1/P2) | `naprawy/H-maestro-regex` @ `e307853` | — | — | przyjęta i scalona FF → `main` |
| H2 | `28bafec46b61008c225f4098681584a8` | recenzent (07 audit) | `a5a4507..e307853` (odczyt) | — | — | zakończona (PRZYJĄĆ Z UWAGAMI: 0 P0, 0 P1, 3 P2) |
| I | `28f88aa27b0ddc9b661d49afb57eca77` | 07-jakosc, fix (E2E 44532031189) | `naprawy/I-e2e-44532031189` @ `9ace404` | — | — | przyjęta i scalona FF → `main` |
| I2 | `38528fe0629b0d2ae7fc39066d3c73ec` | recenzent (07+08 audit) | `e307853..9ace404` (odczyt) | — | — | zakończona (PRZYJĄĆ: 0 P0, 0 P1, 2 P2) |
| J | `e5d1e095a6c11d59316922c0a6ead2a8` | 07-jakosc, fix (E2E 08 Tap OK) | `naprawy/J-e2e-08-ok` @ `48b2bc4` | — | — | przyjęta i scalona FF → `main` |
| J2 | `6f10130fcba73e2c8601a5a5ec7518cf` | recenzent (08+07 audit) | `9ace404..48b2bc4` (odczyt) | — | — | zakończona (PRZYJĄĆ Z UWAGAMI: 0 P0, 0 P1, 3 P2) |

## Plan 24 h (UTC)
| Kiedy | Co | Kto (sesja/rola) | Zależy od | Od właściciela |
|---|---|---|---|---|
| 19:39–20:25 | Weryfikacja automatycznych workflowów na `main` @ `48b2bc4` (`CI`, `TZ`, `Pages`, `iOS`, `E2E`) | GitHub Actions / Koordynator | w toku | nic |
| po zielonym `main` | Wybór kolejnego kroku: build TestFlight 1.0.0 + testy fizyczne `T1`–`T12` / albo pakiet dopracowań P2 (`rejestr.json`, `jezyki.md`, uwagi P2 z F2/H2/I2/J2) | Właściciel + Koordynator | zielone workflowy na `main` | decyzja o kolejnym priorytecie / zgoda na TestFlight |

## Czeka na właściciela
- Brak zaległych blokad — wszystkie decyzje `KO-002..004` zatwierdzone, `M1-020` zamknięte (brak lokalnej kopii), `main` scalony.
- Działanie zewnętrzne na później (zasada 12): zgoda na uruchomienie `TestFlight` (po zielonych workflowach na `main`).

## Bramka scenariuszy (zasada 22)
- **ZIELONA statycznie i dynamicznie na `48b2bc4` (`main`):** `docs/jakosc/przypadki-uzycia.md` (27 PU: 7 A / 0 B / 20 F), `scripts/sprawdz-scenariusze.mjs`, `testID="ekran:<trasa>"` na wszystkich 9 ekranach `app/`, artefakt `e2e-wykonane` (`wykonane.tsv`: **8/8 PASS** z runu `44584722624`; świeży run `44600621340` w toku na `main`), `--build "$BUILD" --wykonane wykonane.tsv` w `testflight.yml`.

## Przypomnienia
- Środowisko bez `send_later` / `list_triggers`; kontrola realizowana reaktywnie.

## Pule numerów decyzji
- `docs/decyzje.md`: zajęte `D-001`…`D-020` (na `main` @ `48b2bc4`); następny wolny: `D-021`; KO następny: `KO-005`.

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
| 2026-11-19 12:11 | F+F2 | Sesja F (`70b4d29`, 4 commity, verify 0: 118/118, 1289/1289) + recenzja F2 (**PRZYJĄĆ**, 0 P0/P1, 1 P2). | FF → `70b4d29`, E2E `44521826864` |
| 2026-11-19 13:17 | G | Sesja G (`a5a4507`, verify 0: 118/118, 1291/1291) — naprawa selektorów zakładek iOS po `44521826864`. FF `claude/napar-app-audit-5u19j0` → `a5a4507`, start E2E `44532031189`. | Niezależna recenzja G2 |
| 2026-11-19 13:23 | G2 | Recenzja G2 (`70b4d29..a5a4507`): **ODRZUCIĆ** (P0:1 nieuciekane `ekran:(tabs)/index` w `08-pelna-petla.yaml:49-50`, P1:1 kontrakt regex w `e2e-contract.test.ts`, P2:1 brak regresji `02` + wcięcia). | Zlecić Sesję H (`naprawy/H-maestro-regex`) |
| 2026-11-19 13:36 | H+H2 | Sesja H (`e307853`, verify 0: 118/118, 1293/1293) + recenzja H2 (**PRZYJĄĆ Z UWAGAMI**: 0 P0, 0 P1, 3 P2). FF `claude/napar-app-audit-5u19j0` → `e307853`. | Czekać na wynik E2E `44532031189` |
| 2026-11-19 13:54 | CI | E2E `44532031189` (na `a5a4507`): **3/8 PASS** (`01`, `04`, `05` przeszły!); 5 FAIL z 3 przyczyn (`02` `hideKeyboard` → kaskada `06`/`07`; `03` `quick-add-caffeine-btn`; `08` `"E2E pelna petla"`). | Zlecić Sesję I (`naprawy/I-e2e-44532031189`) |
| 2026-11-19 17:14 | I+I2 | Sesja I (`9ace404`, 8 plików, verify 0: 118/118, 1297/1297) + recenzja I2 (**PRZYJĄĆ**: 0 P0, 0 P1, 2 P2). FF `claude/napar-app-audit-5u19j0` → `9ace404`, start E2E `44575002549`. | Czekać na wynik E2E `44575002549` |
| 2026-11-19 17:55 | CI | E2E `44575002549` (na `9ace404`): **7/8 PASS** (`01`..`07` przeszły!); jedyny FAIL: `08` (`Tap on "OK"`). | Zlecić Sesję J |
| 2026-11-19 18:09 | J+J2 | Sesja J (`48b2bc4`, verify 0: 118/118, 1298/1298 — wyniesienie `BrewModalsContainer` poza `ScrollView`) + recenzja J2 (**PRZYJĄĆ Z UWAGAMI**: 0 P0, 0 P1, 3 P2). FF `claude/napar-app-audit-5u19j0` → `48b2bc4`, start E2E `44584722624`. | Czekać na wynik E2E `44584722624` |
| 2026-11-19 18:51 | CI | **E2E `44584722624` (na `48b2bc4`): SUKCES — 8/8 PASS** (42m11s); artefakt `e2e-wykonane` (`wykonane.tsv`) zweryfikowany. | STOP: zgoda właściciela na `main` |
| 2026-11-19 19:39 | M9 | **Zgoda właściciela:** FF `origin/main` `491d618..48b2bc4`, potwierdzone `KO-002..004`, zamknięte `M1-020`, usunięte tymczasowe gałęzie `naprawy/*`. Uruchomiły się workflowy `main` (`CI` `44600621311`, `TZ` `44600621291`, `Pages` `44600621418`, `iOS` `44600621295`, `E2E` `44600621340`). | Monitorować workflowy na `main` i raportować po zakończeniu |
| 2026-11-20 07:09 | M1+STOP2 | **Głęboki audyt M1 ukończony** na `main` @ `48b2bc4` (`E2E` `44600621340` zielone): 14/14 raportów ról (`sprawdz-raport.mjs`: 0) + 4 soczewki + 4 weryfikatorów W1–W4 → 24 zadania (3 P0, 17 P1, 4 P2), `plan-napraw.json` (`sprawdz-plan.mjs`: 0). **Decyzje właściciela na STOP 2:** `DEC-01=a` (v1.0 darmowa test 30–60 dni → v1.1 1,99/12,99/24,99 USD + Android + DE/JA), `DEC-02=b` (Trader — już ma), `DEC-03=a` (`en-GB` + `site/` EN), `DEC-04=b` (przyciąć ekran główny i Warsztat przed TestFlight), **wszystkie 24 zadania zatwierdzone**. Pauza na odnowienie limitu. | Po odnowieniu limitu: start M2 (`M1-audytor-generalny-001`..`024`, Partia 1 → 2 → 3) |
| 2026-11-22 22:36 | M2 | **M2 Partie 1+2+3+3b ukończone** na `naprawy/M2-P3-decyzje-zakres-p2` (`377d467`, 23 commity od `main` `48b2bc4`): **21/24 zadań** naprawione w TDD z niezależnymi recenzjami M2-P1-R / M2-P2-R / M2-P3-R (wszystkie P1 usunięte), `npm run verify` kod `0` (`119/119` pakietów, `1334/1334` testów). Pozostałe 3 zadania wymagają kroku właściciela (`M1-002` przegląd człowieka 6 twierdzeń zdrowotnych, `M1-003` włączenie GitHub Pages, `M1-015` test fizyczny F na TestFlight). Uruchomiony czysty E2E iOS na `377d467`. | **STOP:** zgoda właściciela na scalenie `377d467` → `main` + 3 kroki właściciela (`M1-002`, `M1-003`, `M1-015`) |
| 2026-11-23 05:43 | M2+main | **Scalenie M2 na `main` (`48b2bc4..b4310f6`, 24 commity):** E2E `45078661568` na `377d467` **ZIELONE (8/8 PASS)**, domknięte `M1-002` (`b4310f6`, `check:tresci` w `verify`, 0 błędów), włączone GitHub Pages (`M1-003`, `build_type: workflow`), usunięte 3 gałęzie `naprawy/M2-*`. **23/24 zadań M1 naprawione**; pozostało wyłącznie `M1-015` (test fizyczny F na buildzie TestFlight). | Weryfikacja zielonego `Deploy GitHub Pages` + `CI` na `main`, potem TestFlight 1.0.0 i test fizyczny F |

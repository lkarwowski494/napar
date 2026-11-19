# Koszty i czasy sesji — Napar

Środowisko Antigravity nie udostępnia `usage.cost_usd`; kolumna `Rzeczywisty USD` oznaczona `—` (mierzymy czasy wykonania i oczekiwania).

| Sesja | Rola | Szacunek USD | Rzeczywisty USD | Kontekst max % | Zlecone → start → 1. commit → CI zielone → przyjęte (UTC) | Oczekiwanie: min i przyczyna | Uwagi |
|---|---|---|---|---|---|---|---|
| A | 07-jakosc (audit) | [OCENA] ~15 min | — | — | 10:35 → 10:35 → (odczyt) → verify 0 (10:40) → przyjęte 10:41 | 0 min | `npm run verify` kod 0 (119/119, 1320/1320); `scratch/A-raport.md` |
| B | 08-programista (fix) | [OCENA] ~25 min | — | — | 10:43 → 10:43 → ~10:50 → verify 0 (11:08) → przyjęte 11:11 | 3 min (recenzja B2) | 7 commitów (`1e88b1d`), 117/117, 1274/1274; `scratch/B-verify.log` |
| B2 | recenzent (08 audit) | [OCENA] ~5 min | — | — | 11:09 → 11:09 → (odczyt) → werdykt 11:11 → przyjęte 11:11 | 0 min | PRZYJĄĆ (0 P0, 0 P1, 2 P2) |
| C | 07-jakosc (fix, JAK-19) | [OCENA] ~30 min | — | — | 11:13 → 11:13 → ~11:17 → verify 0 (11:23) → przyjęte 11:26 | 3 min (recenzja C2) | 4 commity (`ea8f107`), 118/118, 1283/1283; 2 P1 → D |
| C2 | recenzent (07 audit) | [OCENA] ~5 min | — | — | 11:24 → 11:24 → (odczyt) → werdykt 11:26 → przyjęte 11:26 | 0 min | PRZYJĄĆ Z UWAGAMI (2 P1, 2 P2) |
| D | 07-jakosc (fix, P1 + E2E) | [OCENA] ~20 min | — | — | 11:27 → 11:27 → ~11:32 → verify 0 (11:39) → przyjęte 11:42 | 3 min (recenzja D2) | 4 commity (`3d12389`), 118/118, 1286/1286; naprawa onboardingu Maestro |
| D2 | recenzent (07 audit) | [OCENA] ~5 min | — | — | 11:39 → 11:39 → (odczyt) → werdykt 11:42 → przyjęte 11:42 | 0 min | PRZYJĄĆ Z UWAGAMI (1 P1, 1 P2 → F) |
| E | 06-tresci (fix, REJ-01) | [OCENA] ~20 min | — | — | 11:44 → 11:44 → 11:53 → verify 0 (11:54) → przyjęte 11:54 | 0 min | 1 commit (`00721e8`), 2/12 potwierdzone, 10 z analizą dla roli 08 |
| F | 08-programista (fix) | [OCENA] ~20 min | — | — | 11:55 → 11:55 → ~12:00 → verify 0 (12:09) → przyjęte 12:11 | 2 min (recenzja F2) | 4 commity (`70b4d29`), 118/118, 1289/1289; D2 P1/P2, 9 ekranów, 5 wód |
| F2 | recenzent (08 audit) | [OCENA] ~5 min | — | — | 12:09 → 12:09 → (odczyt) → werdykt 12:11 → przyjęte 12:11 | 0 min | PRZYJĄĆ (0 P0, 0 P1, 1 P2) |

Mnożnik szacunku (rzeczywisty ÷ szacunek, ostatnie 10 sesji): 0,55
Przegląd przepływu 2026-11-19: Największa strata czasu — E2E iOS na GitHub Actions macOS (~39 min/przebieg); wszystkie 10 sesji podrzędnych i recenzenckich ukończone lokalnie w łącznie ~95 min bez blokowania się nawzajem.

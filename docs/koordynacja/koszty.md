# Koszty i czasy sesji — Napar

Środowisko Antigravity nie udostępnia `usage.cost_usd`; kolumna `Rzeczywisty USD` oznaczona `—` (mierzymy czasy wykonania i oczekiwania).

| Sesja | Rola | Szacunek USD | Rzeczywisty USD | Kontekst max % | Zlecone → start → 1. commit → CI zielone → przyjęte (UTC) | Oczekiwanie: min i przyczyna | Uwagi |
|---|---|---|---|---|---|---|---|
| A | 07-jakosc (audit) | [OCENA] ~15 min | — | — | 10:35 → 10:35 → (odczyt) → verify 0 (10:40) → przyjęte 10:41 | 0 min | `npm run verify` kod 0 (119/119, 1320/1320); `scratch/A-raport.md` |
| B | 08-programista (fix) | [OCENA] ~25 min | — | — | 10:43 → 10:43 → ~10:50 → verify 0 (11:08) → przyjęte 11:11 | 3 min (recenzja B2) | 7 commitów (`1e88b1d`), 117/117, 1274/1274; `scratch/B-verify.log` |
| B2 | recenzent (08 audit) | [OCENA] ~5 min | — | — | 11:09 → 11:09 → (odczyt) → werdykt 11:11 → przyjęte 11:11 | 0 min | Werdykt: PRZYJĄĆ (0 P0, 0 P1, 2 P2) |
| C | 07-jakosc (fix, JAK-19) | [OCENA] ~30 min | — | — | 11:13 → w toku | — | Bramka scenariuszy D-060 + `.maestro/08-pelna-petla.yaml` + 2 P2 z B2 |

Mnożnik szacunku (rzeczywisty ÷ szacunek, ostatnie 10 sesji): 1 (A: 5/15, B: 25/25, B2: 2/5)
Przegląd przepływu 2026-11-19: Najdłuższe oczekiwanie dotychczas — E2E iOS `44506727938` na GitHub Actions (>38 min, w toku).

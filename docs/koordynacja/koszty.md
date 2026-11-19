# Koszty i czasy sesji — Napar

Środowisko Antigravity nie udostępnia `usage.cost_usd`; kolumna `Rzeczywisty USD` oznaczona `—` (mierzymy czasy wykonania i oczekiwania).

| Sesja | Rola | Szacunek USD | Rzeczywisty USD | Kontekst max % | Zlecone → start → 1. commit → CI zielone → przyjęte (UTC) | Oczekiwanie: min i przyczyna | Uwagi |
|---|---|---|---|---|---|---|---|
| A | 07-jakosc (audit) | [OCENA] ~15 min | — | — | 10:35 → 10:35 → (odczyt) → verify 0 (10:40) → przyjęte 10:41 | 0 min | `npm run verify` kod 0 (119/119 pakietów, 1320/1320 testów); raport w `scratch/A-raport.md` |
| B | 08-programista (fix) | [OCENA] ~25 min | — | — | 10:43 → w toku | — | DEC-07 (`support@apps4brew.com`), WG-01 (`ci.yml`), Scope §3 (`F-05`, `F-15`, `F-31`, `F-32`), `CLAUDE.md` |

Mnożnik szacunku (rzeczywisty ÷ szacunek, ostatnie 10 sesji): 2 (wartość startowa)
Przegląd przepływu 2026-11-19: Sesja A zakończona w 5 min; E2E `44506727938` w toku na GitHub Actions (macOS).

# Wąskie gardła koordynacji Napar (`WG-NN`)

| ID | Objaw | Pomiar | Przyczyna | Działanie | Ryzyko | Stan, data |
|---|---|---|---|---|---|---|
| WG-01 | Brak automatycznego ani ręcznego przebiegu `ci.yml` na gałęzi roboczej `claude/napar-app-audit-5u19j0` (0 uruchomień po 72 commitach). | 0 przebiegów CI na `claude/napar-app-audit-5u19j0`; konieczność ręcznej weryfikacji `npm run verify` przez subagenta. | `.github/workflows/ci.yml` ma wyzwalacze tylko dla `push`/`pull_request` na `main`, bez `workflow_dispatch`. | Dodać `workflow_dispatch:` do `.github/workflows/ci.yml` w najbliższej sesji kodowej (08), bez zmiany samych kontroli. | bez zmian kontroli | otwarte, 2026-11-19 |

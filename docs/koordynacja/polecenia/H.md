# Polecenie H — Naprawa P0/P1/P2 z niezależnej recenzji G2 (Maestro regex + kontrakt E2E)

- **Rola:** `07-jakosc` (`--tryb fix`)
- **Baza:** `claude/napar-app-audit-5u19j0` (`a5a4507`)
- **Gałąź robocza:** `naprawy/H-maestro-regex` (w odizolowanym worktree `/tmp/napar-H`)
- **Cel:** Usunięcie znalezisk z niezależnej recenzji G2 (`ODRZUCIĆ`: 1 P0, 1 P1, 1 P2):
  1. **P0 (`.maestro/08-pelna-petla.yaml:49-50`):** Maestro traktuje selektor `id:` jako wyrażenie regularne (`Regex`). Zapis `id: "ekran:(tabs)/index"` tworzy grupę `(tabs)` i NIE dopasuje dosłownego `testID="ekran:(tabs)/index"`. Naprawić krok `assertVisible` (użyć widocznego na górze ekranu `testID` bez metaznaków regex albo poprawnie uciekanego regexa `ekran:\\(tabs\\)/index` — sprawdzić co działa z `scripts/sprawdz-scenariusze.mjs` i Maestro!).
  2. **P1 (`tests/e2e-contract.test.ts:32-33, 69-71`):** Naprawić walidację selektorów `id:` w testach kontraktowych tak, by sprawdzała dopasowanie regex (`new RegExp('^' + sel + '$')`) przeciwko rzeczywistym `testID` z kodu (i odrzucała nieuciekane metaznaki regex jak `ekran:(tabs)/index`, które nie dopasowują żadnego `testID` w aplikacji).
  3. **P2 (`tests/e2e-contract.test.ts:128-134`):** Dodać test regresyjny dla przewijania przed `bean-weight-input` w `.maestro/02-spizarnia-dodaj-paczke.yaml` oraz uniezależnić testy przewijania od sztywnych wcięć YAML (np. regex lub prosty parser linii).
- **Weryfikacja:**
  - `npm run verify` musi zwrócić kod `0` (zapisz log do `/home/antigravity/.gemini/jetski/brain/v1/default/jetski_remote_agents_3p/2f459540-3f1f-4d1d-b6a9-942b302be3a0/scratch/H-verify.log`).
  - Nie scalaj do `claude/napar-app-audit-5u19j0` ani `main`; wypchnij gałąź `naprawy/H-maestro-regex` na `origin` i zwróć raport ze skrótem SHA, listą zmienionych plików i wynikiem `npm run verify`.

# Sesja B: Naprawy zakresu §3, kontakt DEC-07 i `workflow_dispatch` w CI — Napar
Koordynator: `v1/default/jetski_remote_agents_3p/2f459540-3f1f-4d1d-b6a9-942b302be3a0` (raporty, pytania i PRZEKAZANIE tylko do koordynatora). Gałąź stanu koordynatora: `koordynacja` (tylko do odczytu).

1. Rola: `08-programista` w trybie `fix`. Prompt roli znajduje się w pliku `/home/antigravity/.gemini/jetski/brain/v1/default/jetski_remote_agents_3p/2f459540-3f1f-4d1d-b6a9-942b302be3a0/scratch/B-rola.md` — przeczytaj go w całości, jesteś tą rolą.
2. Start: utwórz osobny worktree `/tmp/napar-sesja-b` z nową gałęzią `naprawy/B-zakres-kontakt-ci` od `origin/claude/napar-app-audit-5u19j0` (`c836267`):
   `git -C /home/antigravity/lkarwowski494/napar worktree add -b naprawy/B-zakres-kontakt-ci /tmp/napar-sesja-b origin/claude/napar-app-audit-5u19j0`
   Sprawdź tożsamość commitów (`git config user.name` / `user.email`) przed pierwszym commitem. Zainstaluj zależności (`npm ci`, jeśli brak `node_modules`).
3. Zadania (każde z kryterium „gotowe”; przy zmianach kodu zasada 11: najpierw test lub weryfikacja regresji, zero utraty danych użytkownika):
   1. **DEC-07 / `KO-002` — Adres kontaktowy właściciela (`support@apps4brew.com`):**
      - Ustaw `SUPPORT_EMAIL = 'support@apps4brew.com'` w `src/core/app-identity.ts` (i sprawdź powiązane testy).
      - Odkomentuj / uzupełnij adres `support@apps4brew.com` w `site/support.html`, `docs/15-app-store.md` oraz `docs/wydanie/app-review-notes.md`.
      - Kryterium gotowe: `grep -rn "adres od właściciela" .` daje 0 trafień; `npm run verify` zielone.
   2. **WG-01 / `KO-003` — `workflow_dispatch` w `.github/workflows/ci.yml`:**
      - Dodaj `workflow_dispatch:` w sekcji `on:` w `.github/workflows/ci.yml` bez zmiany żadnych kontroli ani uprawnień.
      - Kryterium gotowe: poprawny YAML, nie narusza `tests/public-repo.test.ts` ani `tests/release-contract.test.ts`.
   3. **Scope §3 / `KO-004` — Wdrożenie 4 rekomendacji roli 03 upraszczających interfejs (bez utraty danych użytkownika):**
      - **`F-05` (opcja b):** usuń pole `tds-input` z `src/components/brew/BrewFinishModal.tsx` (zostaw kalkulator EY w Warsztacie `ExtractionYieldTab.tsx` oraz wyświetlanie już zapisanych wartości TDS w Dzienniku — zero utraty danych!).
      - **`F-15` (opcja b):** ukryj/usuń wskaźnik okna odgazowania (`evaluateRestingWindow`) z `src/components/beans/BeanItemCard.tsx` (status `TEST`; dane paczek i data palenia w bazie bez zmian; jeśli `evaluateRestingWindow` stanie się nieosiągalne, usuń nieosiągalny kod lub dodaj uzasadniony wyjątek zgodnie z `check:reachability` — preferuj czystość bez martwego kodu zgodnie z `D-002`).
      - **`F-31` (opcja a):** usuń kartę kosztu parzenia (`finish-cost-card`) z `src/components/brew/BrewFinishModal.tsx` oraz nieosiągalny moduł `src/core/cost-calculator.ts` i jego testy (brak danych użytkownika do migracji).
      - **`F-32` (opcja a):** usuń `ProactiveCalendarCard` i eksport `.ics` z `app/(tabs)/journal.tsx` oraz nieosiągalny kod pomocniczy (akcje były wyliczane z sesji, brak danych użytkownika do migracji).
      - Zaktualizuj `docs/scope-contract.md` (przenieś 12 pozycji §3 zgodnie z decyzjami `KO-004`, zaktualizuj tabelę Inwentarz funkcji w kodzie i dopisz wiersze `ZM-05`..`ZM-08` dla usuniętych/ukrytych elementów) oraz dopisz decyzje `D-017`..`D-020` w `docs/decyzje.md` (pula `D-017`…`D-025`, z odnośnikiem do `KO-002` i `KO-004` „do weta”).
      - Kryterium gotowe: wszystkie 4 zmiany w kodzie, zaktualizowany inwentarz w `docs/scope-contract.md`, zielone `npm run check:reachability`, `check:i18n`, `check:matrix` i `test:coverage`.
   4. **Higiena `CLAUDE.md:1` (`D-006`):** usuń nieaktualną nazwę `(Steepwise)` z nagłówka `CLAUDE.md`.
4. Zakazy:
   - Nie scalasz do `claude/napar-app-audit-5u19j0` ani `main`, nie piszesz na gałąź `koordynacja`, nie dotykasz `/home/antigravity/lkarwowski494/napar` ani `/tmp/napar-koordynacja`.
   - Nie zmieniasz `.github/workflows/testflight.yml`, `.github/workflows/e2e-ios.yml`, `.maestro/` ani `rejestr.json`.
   - Nigdy `--no-verify`, nigdy force-push, nie obniżasz progów pokrycia w `jest.config.js`, nie usuwasz niepowiązanych testów (aktualizuj wyłącznie testy bezpośrednio sprawdzające usunięte elementy UI i dopisz testy regresyjne w `tests/audit-fixes.test.tsx`).
   - Nie pytasz właściciela bezpośrednio (bez `AskUserQuestion`).
5. Końcowy dowód i push:
   - Uruchom pełne `npm run verify` i zapisz pełny log do `/home/antigravity/.gemini/jetski/brain/v1/default/jetski_remote_agents_3p/2f459540-3f1f-4d1d-b6a9-942b302be3a0/scratch/B-verify.log`.
   - Wypchnij gałąź: `git push -u origin naprawy/B-zakres-kontakt-ci`.
6. Raport zwrotny do koordynatora (≤ 12 linii):
   - Lista commitów (SHA + temat) i autor,
   - Kod wyjścia `npm run verify` i ścieżka do `B-verify.log`,
   - Zapisane decyzje `D-nnn` i `ZM-nn`,
   - Ewentualne otwarte uwagi / ryzyka.

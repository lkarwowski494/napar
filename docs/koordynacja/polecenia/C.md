# Sesja C: Wdrożenie bramki scenariuszy użytkownika D-060 (`JAK-19`) — Napar
Koordynator: `v1/default/jetski_remote_agents_3p/2f459540-3f1f-4d1d-b6a9-942b302be3a0` (raporty, pytania i PRZEKAZANIE tylko do koordynatora). Gałąź stanu koordynatora: `koordynacja` (tylko do odczytu).

1. Rola: `07-jakosc` w trybie `fix`, zadanie `JAK-19`, moduły `scenariusze-uzytkownika, scenariusze-skrypt, e2e-mobilne`. Prompt roli znajduje się w `/home/antigravity/.gemini/jetski/brain/v1/default/jetski_remote_agents_3p/2f459540-3f1f-4d1d-b6a9-942b302be3a0/scratch/C-rola.md` — przeczytaj go w całości (zwłaszcza sekcję modułów `scenariusze-uzytkownika` i `scenariusze-skrypt`), jesteś tą rolą.
2. Start: utwórz osobny worktree `/tmp/napar-sesja-c` z nową gałęzią `naprawy/C-bramka-scenariuszy` od `origin/naprawy/B-zakres-kontakt-ci` (`1e88b1d`):
   `git -C /home/antigravity/lkarwowski494/napar worktree add -b naprawy/C-bramka-scenariuszy /tmp/napar-sesja-c origin/naprawy/B-zakres-kontakt-ci`
   Sprawdź tożsamość commitów (`git config user.name` / `user.email`) przed pierwszym commitem. Zainstaluj zależności (`npm ci`, jeśli brak `node_modules`).
3. Zadania (każde z kryterium „gotowe”):
   1. **Katalog przypadków użycia `docs/jakosc/przypadki-uzycia.md`** (zgodnie z modułem `scenariusze-uzytkownika` i zasadą wspólną 22 / D-060):
      - Pełna lista PU dla wszystkich ekranów i funkcji MVP 1.0 (po zmianach `1e88b1d` — bez usuniętych `tds-input`, karty kosztu, kalendarza 14 dni/ICS i okna odgazowania), z celem, wariantami, stanami błędów i przypisaniem klasy (`A` automat, `F` fizyczny — przenieś/powiąż istniejące `T1`–`T12` z `docs/tylko-telefon.md`, bez ich dublowania lub z jawnym odwołaniem).
      - Linia `Przegląd:` z aktualną datą i zakresem.
   2. **Skrypt bramki `scripts/sprawdz-scenariusze.mjs` + testy jednostkowe `tests/scenariusze-gate.test.ts`:**
      - Zaimplementuj `scripts/sprawdz-scenariusze.mjs` zgodnie ze specyfikacją modułu `scenariusze-skrypt` w twoim prompcie (w tym tryb `--statycznie`, `--build <n> --wykonane <lista>`, `--szkielet <n>`, parsowanie `docs/jakosc/przypadki-uzycia.md`, wykrywanie brakujących/pustych pozycji F i niepokrytych A).
      - Napisz rzetelne testy (zasada 11: czerwone przed poprawką / testujące realne błędy odrzucenia i akceptacji) w `tests/scenariusze-gate.test.ts`.
   3. **Uzupełnienie luki E2E `.maestro/`:**
      - Dodaj scenariusz `.maestro/08-pelna-petla.yaml` pokrywający główną pętlę parzenie → ocena → zapis do Dziennika (zgodny ze składnią sprawdzaną przez `tests/maestro-flows.test.ts` i istniejącymi `testID` w kodzie).
   4. **Wpięcie bramki (tryb `--statycznie` w `npm run verify`):**
      - Dodaj skrypt `check:scenariusze` (`node scripts/sprawdz-scenariusze.mjs --statycznie`) w `package.json` i dopnij go do `npm run verify`.
      - W `.github/workflows/testflight.yml` dopisz wywołanie `node scripts/sprawdz-scenariusze.mjs --statycznie` (albo pełne sprawdzenie zgodnie z `scenariusze-skrypt` bez psucia istniejących testów `tests/release-contract.test.ts` i `tests/public-repo.test.ts`).
   5. **Przy okazji (2 drobne P2 z recenzji B2):** popraw `tdsPercent` → `tdsInput` w `docs/scope-contract.md:175` oraz usuń nieaktualną wzmiankę o `evaluateRestingWindow()` z `docs/przeplywy-uzytkownika.md`.
4. Zakazy:
   - Nie scalasz do `claude/napar-app-audit-5u19j0` ani `main`, nie piszesz na gałąź `koordynacja`, nie dotykasz `/home/antigravity/lkarwowski494/napar` ani `/tmp/napar-koordynacja-state`.
   - Nigdy `--no-verify`, nigdy force-push, nie obniżasz progów pokrycia w `jest.config.js`, nie wpisujesz wyników ani `POMINIĘTE` w protokole F (to należy wyłącznie do właściciela).
   - Nie pytasz właściciela bezpośrednio (bez `AskUserQuestion`).
5. Końcowy dowód i push:
   - Uruchom pełne `npm run verify` (w tym nowy `check:scenariusze`) i zapisz pełny log do `/home/antigravity/.gemini/jetski/brain/v1/default/jetski_remote_agents_3p/2f459540-3f1f-4d1d-b6a9-942b302be3a0/scratch/C-verify.log`.
   - Wypchnij gałąź: `git push -u origin naprawy/C-bramka-scenariuszy`.
6. Raport zwrotny do koordynatora (≤ 12 linii):
   - Lista commitów (SHA + temat) i autor,
   - Kod wyjścia `npm run verify` i `node scripts/sprawdz-scenariusze.mjs --statycznie`, ścieżka do `C-verify.log`,
   - Liczba PU (A / B / F) i pokrycie `.maestro/`,
   - Ewentualne otwarte uwagi / ryzyka.

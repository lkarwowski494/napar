# Sesja D: Poprawki P1 z recenzji C2 + diagnoza i naprawa czerwonego E2E iOS (`44506727938`) — Napar
Koordynator: `v1/default/jetski_remote_agents_3p/2f459540-3f1f-4d1d-b6a9-942b302be3a0` (raporty, pytania i PRZEKAZANIE tylko do koordynatora). Gałąź stanu koordynatora: `koordynacja` (tylko do odczytu).

1. Rola: `07-jakosc` w trybie `fix` (zadania `JAK-19` poprawki P1 z recenzji C2 + diagnoza/naprawa czerwonego przebiegu E2E `44506727938`). Prompt roli znajduje się w `/home/antigravity/.gemini/jetski/brain/v1/default/jetski_remote_agents_3p/2f459540-3f1f-4d1d-b6a9-942b302be3a0/scratch/C-rola.md` — przeczytaj i stosuj jego zasady.
2. Start: utwórz osobny worktree `/tmp/napar-sesja-d` z nową gałęzią `naprawy/D-e2e-i-bramka` od `origin/naprawy/C-bramka-scenariuszy` (`ea8f107`):
   `git -C /home/antigravity/lkarwowski494/napar worktree add -b naprawy/D-e2e-i-bramka /tmp/napar-sesja-d origin/naprawy/C-bramka-scenariuszy`
   Sprawdź tożsamość commitów (`git config user.name` / `user.email`) przed pierwszym commitem. Zainstaluj zależności (`npm ci`, jeśli brak `node_modules`).
3. Zadania (każde z kryterium „gotowe”):
   1. **C2 P1-1 — Nazwa katalogu wg zasady wspólnej 22:** zmień nazwę `docs/jakosc/przypadki-uzytkownika.md` → `docs/jakosc/przypadki-uzycia.md` i zaktualizuj wszystkie odniesienia (`scripts/sprawdz-scenariusze.mjs`, `tests/scenariusze-gate.test.ts`, `.maestro/*.yaml`, `.github/workflows/`, `docs/`). Kryterium: `git grep przypadki-uzytkownika` zwraca 0 trafień; `npm run check:scenariusze` zwraca 0.
   2. **C2 P1-2 — Egzekwowanie `--build "$BUILD" --wykonane wykonane.tsv` w `testflight.yml`:**
      - W `.github/workflows/e2e-ios.yml`: zapisuj listę scenariuszy PASS (w formacie oczekiwanym przez `sprawdz-scenariusze.mjs --wykonane`) do pliku `wykonane.tsv` i wysyłaj go jako artefakt przebiegu (`actions/upload-artifact@v4`, np. `e2e-wykonane`).
      - W `.github/workflows/testflight.yml`: w zadaniu `gate` (albo bezpośrednio po nim) pobierz artefakt `e2e-wykonane` z zielonego przebiegu `e2e-ios.yml` dla tego samego SHA (przez `gh run download` lub REST API w `.github/scripts/require-green-runs.mjs`) i uruchom `node scripts/sprawdz-scenariusze.mjs --build "$BUILD" --wykonane wykonane.tsv` zamiast samego `--statycznie`.
      - Zaktualizuj/dodaj testy w `tests/release-contract.test.ts` oraz `tests/scenariusze-gate.test.ts` sprawdzające tę ścieżkę.
   3. **C2 P2-1:** w `.maestro/08-pelna-petla.yaml` użyj `star-rating-5` zamiast `star-rating-row`.
   4. **Diagnoza i naprawa czerwonego E2E iOS (`44506727938`):**
      - Zbadaj logi i artefakty nieudanego przebiegu `gh run view 44506727938 --log-failed` (oraz `gh run download 44506727938 --dir /tmp/e2e-44506727938` jeśli ma artefakty debugowe Maestro — zobacz, co dokładnie było na ekranie, gdy padło `Tap on "Spiżarnia"`!).
      - Usuń zdiagnozowaną przyczynę (np. jeśli symulator iOS ignoruje `launchApp.arguments` `AppleLanguages`, ustaw język symulatora w `.github/workflows/e2e-ios.yml` przez `xcrun simctl spawn "$UDID" defaults write -g AppleLanguages -array pl` i `AppleLocale -string pl_PL`, lub napraw brakujące zamknięcie onboardingu / selektory w `.maestro/*.yaml` — wyłącznie na podstawie dowodu z logów/artefaktów `44506727938`!).
      - Zaktualizuj uwagę `[DO USTALENIA]` w `docs/tylko-telefon.md:22` o wynik obserwacji z `44506727938`.
4. Zakazy:
   - Nie scalasz do `claude/napar-app-audit-5u19j0` ani `main`, nie piszesz na `koordynacja`, nie dotykasz `/home/antigravity/lkarwowski494/napar` ani `/tmp/napar-koordynacja-state`.
   - Nigdy `--no-verify`, nigdy force-push, nie osłabiasz żadnych testów ani progów, nie wyłączasz żadnego flow Maestro.
   - Nie pytasz właściciela bezpośrednio (bez `AskUserQuestion`).
5. Końcowy dowód i push:
   - Uruchom pełne `npm run verify` i zapisz pełny log do `/home/antigravity/.gemini/jetski/brain/v1/default/jetski_remote_agents_3p/2f459540-3f1f-4d1d-b6a9-942b302be3a0/scratch/D-verify.log`.
   - Wypchnij gałąź: `git push -u origin naprawy/D-e2e-i-bramka`.
6. Raport zwrotny do koordynatora (≤ 12 linii):
   - Przyczyna czerwonego E2E `44506727938` (z dokładnym dowodem z logów/artefaktu),
   - Lista commitów (SHA + temat) i autor,
   - Kod wyjścia `npm run verify` i ścieżka do `D-verify.log`,
   - Ewentualne otwarte uwagi / ryzyka.

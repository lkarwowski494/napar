# Sesja F: Poprawki D2 (a11y `star-rating-row`, `testflight.yml`), `testID="ekran:<trasa>"` i etykiety wód z Sesji E — Napar
Koordynator: `v1/default/jetski_remote_agents_3p/2f459540-3f1f-4d1d-b6a9-942b302be3a0` (raporty, pytania i PRZEKAZANIE tylko do koordynatora). Gałąź stanu koordynatora: `koordynacja` (tylko do odczytu).

1. Rola: `08-programista` w trybie `fix`, zadania `D2-P1, D2-P2, JAK-19-EKRAN, REJ-WODY`. Prompt roli znajduje się w `/home/antigravity/.gemini/jetski/brain/v1/default/jetski_remote_agents_3p/2f459540-3f1f-4d1d-b6a9-942b302be3a0/scratch/F-rola.md` — przeczytaj go w całości, jesteś tą rolą.
2. Start: utwórz osobny worktree `/tmp/napar-sesja-f` z nową gałęzią `naprawy/F-a11y-ekrany-wody` od `origin/naprawy/E-tresci-rejestr` (`00721e8`):
   `git -C /home/antigravity/lkarwowski494/napar worktree add -b naprawy/F-a11y-ekrany-wody /tmp/napar-sesja-f origin/naprawy/E-tresci-rejestr`
   Sprawdź tożsamość commitów (`git config user.name` / `user.email`) przed pierwszym commitem. Zainstaluj zależności (`npm ci`, jeśli brak `node_modules`).
3. Zadania (każde z kryterium „gotowe”; zasada 11: test przed kodem / test regresyjny):
   1. **D2-P1 (a11y + Maestro iOS):** w `src/components/brew/BrewFinishModal.tsx` usuń `accessible={true}` z kontenera `<View testID="star-rating-row">` (który na iOS zwija dzieci `star-rating-1..5` z drzewa dostępności VoiceOver i XCUITest/Maestro; zostaw `accessibilityRole` / etykiety na samych przyciskach gwiazdek, jak w `balanceRow`). Dodaj test regresyjny w `tests/audit-fixes.test.tsx` (czerwony przed poprawką), sprawdzający że `star-rating-row` NIE ma `accessible={true}`, a każda z 5 gwiazdek `star-rating-1..5` ma `accessibilityRole="button"` i etykietę.
   2. **D2-P2 (`.github/workflows/testflight.yml`):** usuń zbędne `git fetch --tags --force` w kroku bramki `testflight.yml` (checkout ma już `fetch-depth: 0`, więc tagi są pobrane, a `git fetch` z `persist-credentials: false` zawiódłby na repo prywatnym). Zaktualizuj/zachowaj zielone `tests/release-contract.test.ts` i `tests/public-repo.test.ts`.
   3. **JAK-19-EKRAN (`testID="ekran:<trasa>"`):** dodaj spójne `testID="ekran:<trasa>"` na głównych kontenerach ekranów w `app/` zgodnie z nazwami z `docs/jakosc/przypadki-uzycia.md` i `.maestro/*.yaml` (sprawdź istniejące komentarze w `.maestro/01..08`), bez łamania istniejących `testID` używanych w testach Jest i Maestro.
   4. **REJ-WODY (`BOTTLED_WATER_BENCHMARKS` w `src/core/water-chemistry.ts`):** na podstawie przeczytanych etykiet z `rejestr.json` (`WODY-BUTELKOWANE-SKLADY`, odczyt 2026-11-19 w commicie `00721e8`) popraw wartości TDS/GH/KH dla 5 zweryfikowanych wód (`Muszynianka`, `Highland Spring`, `Evian`, `Żywiec Zdrój`, `Spa Reine`) i zaktualizuj odpowiadające im testy jednostkowe oraz notatkę w `rejestr.json` (pozostałe 5 wód bez odczytanej etykiety zostaw bez zmian).
4. Zakazy:
   - Nie scalasz do `claude/napar-app-audit-5u19j0` ani `main`, nie piszesz na `koordynacja`, nie dotykasz `/home/antigravity/lkarwowski494/napar` ani `/tmp/napar-koordynacja-state`.
   - Nigdy `--no-verify`, nigdy force-push, nie obniżasz progów pokrycia w `jest.config.js`, nie zmieniasz testów niezwiązanych z zadaniami.
   - Nie pytasz właściciela bezpośrednio (bez `AskUserQuestion`).
5. Końcowy dowód i push:
   - Uruchom pełne `npm run verify` (kod `0`) i zapisz pełny log do `/home/antigravity/.gemini/jetski/brain/v1/default/jetski_remote_agents_3p/2f459540-3f1f-4d1d-b6a9-942b302be3a0/scratch/F-verify.log`.
   - Wypchnij gałąź: `git push -u origin naprawy/F-a11y-ekrany-wody`.
6. Raport zwrotny do koordynatora (≤ 12 linii):
   - Lista commitów (SHA + temat) i autor,
   - Kod wyjścia `npm run verify` i ścieżka do `F-verify.log`,
   - Ewentualne uwagi / ryzyka.

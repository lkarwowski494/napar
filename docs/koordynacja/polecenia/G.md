# Sesja G: Diagnoza i naprawa czerwonego E2E iOS (`44521826864` na `70b4d29`) — Napar
Koordynator: `v1/default/jetski_remote_agents_3p/2f459540-3f1f-4d1d-b6a9-942b302be3a0` (raporty, pytania i PRZEKAZANIE tylko do koordynatora). Gałąź stanu koordynatora: `koordynacja` (tylko do odczytu).

1. Rola: `07-jakosc` w trybie `fix` (zadanie `E2E-44521826864`). Prompt roli: `/home/antigravity/.gemini/jetski/brain/v1/default/jetski_remote_agents_3p/2f459540-3f1f-4d1d-b6a9-942b302be3a0/scratch/C-rola.md`.
2. Start: utwórz osobny worktree `/tmp/napar-sesja-g` z nową gałęzią `naprawy/G-e2e-44521826864` od `origin/naprawy/F-a11y-ekrany-wody` (`70b4d29`):
   `git -C /home/antigravity/lkarwowski494/napar worktree add -b naprawy/G-e2e-44521826864 /tmp/napar-sesja-g origin/naprawy/F-a11y-ekrany-wody`
   Sprawdź tożsamość commitów (`git config user.name` / `user.email`) przed pierwszym commitem. Zainstaluj zależności (`npm ci`, jeśli brak `node_modules`).
3. Zadania:
   1. **Dowód z artefaktów `44521826864`:** pobierz artefakt `maestro-zrzuty` (`gh run download 44521826864 -n maestro-zrzuty --dir /tmp/e2e-44521826864`) oraz sprawdź logi `01-start.yaml` i `02-spizarnia-dodaj-paczke.yaml`. Zobacz dokładnie, co było na ekranie po kroku `tapOn: id: onboarding-submit-btn` (czy `OnboardingModal` wymaga wyboru opcji przed kliknięciem, czy `AppGuideModal`, czy błąd w samym `OnboardingModal` / `app/_layout.tsx`, czy selektor tab bara!).
   2. **Naprawa przyczyny źródłowej:** napraw przyczynę w `.maestro/*.yaml` (lub w kodzie aplikacji, jeśli to realny błąd onboardingu/a11y — z testem regresyjnym w Jest najpierw czerwonym przed poprawką!).
   3. **Weryfikacja:** uruchom pełne `npm run verify` (kod wyjścia `0`) i zapisz log do `/home/antigravity/.gemini/jetski/brain/v1/default/jetski_remote_agents_3p/2f459540-3f1f-4d1d-b6a9-942b302be3a0/scratch/G-verify.log`.
   4. **Push:** `git push -u origin naprawy/G-e2e-44521826864`.
4. Zakazy: nie scalasz do `claude/napar-app-audit-5u19j0` ani `main`, nie piszesz na `koordynacja`, nigdy `--no-verify` ani force-push, nie wyłączasz żadnych testów ani flow Maestro, nie pytasz właściciela bezpośrednio.
5. Raport zwrotny do koordynatora (≤ 10 linii): dokładna przyczyna z artefaktu `44521826864`, lista commitów (SHA + temat) i autor, kod wyjścia `npm run verify` + ścieżka `G-verify.log`.

# Polecenie I — Diagnoza i naprawa 3 przyczyn porażki E2E iOS run `44532031189`

- **Rola:** `07-jakosc` (`--tryb fix`)
- **Baza:** `claude/napar-app-audit-5u19j0` (`e307853`)
- **Gałąź robocza:** `naprawy/I-e2e-44532031189` (w odizolowanym worktree `/tmp/napar-I`)
- **Kontekst:** Run `44532031189` (na `a5a4507`, przed poprawką H) przeszedł **3/8 scenariuszy** (`01`, `04`, `05` PASS!). Pozostałe 5 oblało z 3 konkretnych przyczyn:
  1. **`.maestro/02-spizarnia-dodaj-paczke.yaml`:** `Hide Keyboard... FAILED` (na symulatorze iOS bez widocznej klawiatury programowej `hideKeyboard` rzuca błąd; kaskadowo oblało to też `06` i `07`, które sprawdzają `"E2E Kenia"`).
  2. **`.maestro/03-kofeina-szybki-wpis.yaml`:** `Element not found: Id matching regex: quick-add-caffeine-btn`.
  3. **`.maestro/08-pelna-petla.yaml`:** `Assertion is false: "E2E pelna petla" is visible` (przeszedł przez cały modal procedury, ocenę, notatkę i zapis — oblał na asercji w Dzienniku!).
- **Zadanie:**
  1. Pobierz artefakt `maestro-zrzuty` (i `e2e-wykonane`) z runu `44532031189` do katalogu tymczasowego `/tmp/e2e-44532031189` (`gh run download 44532031189 --repo lkarwowski494/napar -D /tmp/e2e-44532031189`).
  2. Sprawdź dokładne hierarchie UI / logi Maestro dla `02`, `03`, `08` w `/tmp/e2e-44532031189` oraz kod aplikacji (`app/(tabs)/pantry.tsx`, `app/(tabs)/caffeine.tsx`, `app/(tabs)/journal.tsx`, `src/components/BrewFinishModal.tsx` itp.).
  3. Napraw przyczyny źródłowe (czy to w scenariuszach `.maestro/`, czy w a11y/UI aplikacji).
  4. Dodaj testy regresyjne (TDD) w `tests/e2e-contract.test.ts` (w tym zakaz gołego `hideKeyboard` w `.maestro/*.yaml`).
  5. Uruchom `npm run verify` w `/tmp/napar-I` i zapisz pełny log do `/home/antigravity/.gemini/jetski/brain/v1/default/jetski_remote_agents_3p/2f459540-3f1f-4d1d-b6a9-942b302be3a0/scratch/I-verify.log`. Musi zwrócić kod `0`.
  6. Zrób czyste commity na `naprawy/I-e2e-44532031189` (bez `--no-verify`), wypchnij na `origin`, usuń `/tmp/napar-I` oraz `/tmp/e2e-44532031189`, NIE scalaj do `claude/napar-app-audit-5u19j0` ani `main`.

# Polecenie J — Naprawa ostatniego błędu E2E (`08-pelna-petla.yaml`: `Tap on "OK"`) z runu `44575002549`

- **Rola:** `07-jakosc` (`--tryb fix`)
- **Baza:** `claude/napar-app-audit-5u19j0` (`9ace404`)
- **Gałąź robocza:** `naprawy/J-e2e-08-ok` (w odizolowanym worktree `/tmp/napar-J`)
- **Kontekst:** Run `44575002549` przeszedł **7/8 scenariuszy** (`01`..`07` PASS!). Jedyny niezdany scenariusz to `.maestro/08-pelna-petla.yaml`: `Tap on "OK"... FAILED` (`Element not found: Text matching regex: OK`).
- **Wynik:** Zdiagnozowano rzeczywisty błąd iOS w `app/(tabs)/index.tsx`: `<BrewModalsContainer>` był wewnątrz `<ScrollView>` bez `keyboardShouldPersistTaps`, więc stuknięcie `finish-save-btn` przy otwartej klawiaturze tylko ją chowało i połykało `onPress`. Wyniesiono `<BrewModalsContainer>` poza `<ScrollView>`, dodano `keyboardShouldPersistTaps="handled"` + test regresyjny w `tests/e2e-contract.test.ts`. Commit `48b2bc4`, `npm run verify` kod `0` (118/118, 1298/1298), recenzja J2: **PRZYJĄĆ Z UWAGAMI** (0 P0, 0 P1, 3 P2).

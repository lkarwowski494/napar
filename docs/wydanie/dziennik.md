# Dziennik wydań · Napar

Jeden wiersz na każdy build wysłany do App Store Connect (tag `v<wersja>-b<build>` z `.github/workflows/testflight.yml`). *Dlaczego:* bez zapisu nie wiadomo, który commit dostali testerzy i czy przeszedł sprawdzenia (audyt M1 2026-11-11, 10-wydanie-008).

Warunek wysyłki od 2026-11-15 (DEC-11 a, M1-audytor-generalny-036): zadanie `gate` w `testflight.yml` przerywa przebieg przed archiwizacją, jeśli ostatni przebieg `ci.yml` albo `e2e-ios.yml` na tym samym SHA nie skończył się sukcesem (`.github/scripts/require-green-runs.mjs`). Gdy E2E nie ruszyło na commicie (filtr ścieżek), uruchom je ręcznie (`workflow_dispatch` na `main`) i dopiero potem wysyłkę. Commit musi być przodkiem `main`.

Wiersz dopisuje rola 10 przy wysyłce: wersja i build z podsumowania przebiegu, werdykt z raportu 07 dla tego SHA, zgoda właściciela jego słowami.

| Data | Wersja | Build | SHA | CI | E2E | Werdykt 07 | Kanał | Decyzje | Zgody właściciela (słowa, data) | Wynik |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-10-16 | 1.0.0 | 1003 | c13d1db3f5a6 | success | brak przebiegu | brak (przed procesem 07) | TestFlight, eksport bez ograniczenia do testerów wewnętrznych | brak zapisu | brak zapisu | wysłany (testflight #3) |
| 2026-10-16 | 1.0.0 | 1004 | ef503ec24377 | success | brak przebiegu | brak (przed procesem 07) | jw. | brak zapisu | brak zapisu | wysłany (testflight #4) |
| 2026-10-16 | 1.0.0 | 1005 | 074c3de58ce5 | success | brak przebiegu | brak (przed procesem 07) | jw. | brak zapisu | brak zapisu | wysłany (testflight #5) |
| 2026-10-16 | 1.0.0 | 1006 | 482c508f54b8 | success | brak przebiegu | brak (przed procesem 07) | jw. | brak zapisu | brak zapisu | wysłany (testflight #6) |
| 2026-10-17 | 1.0.0 | 1025 | e8b9d8799b9e | success | brak przebiegu | brak (przed procesem 07) | jw. | brak zapisu | brak zapisu | wysłany (testflight #25) |
| 2026-10-18 | 1.0.0 | 1026 | f07796f0a540 | **failure** | brak przebiegu | brak (przed procesem 07) | jw. | brak zapisu | brak zapisu | wysłany (testflight #26) mimo czerwonego CI |
| 2026-10-24 | 1.0.0 | 1028 | c71a71a7aa2d | success | **failure** | brak (przed procesem 07) | jw. | brak zapisu | brak zapisu | wysłany (testflight #28) mimo czerwonego E2E |

Stan CI i E2E odczytany 2026-11-15 z `GET repos/lkarwowski494/napar/actions/runs?head_sha=<SHA>`. Według zasady z 2026-11-15 żaden z tych buildów nie przeszedłby bramki (brak E2E albo czerwony wynik).

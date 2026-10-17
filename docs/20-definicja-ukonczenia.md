# Definicja Ukończenia (Definition of Done) — Napar (Steepwise)

> Standard ukończenia prac programistycznych i wydawniczych studia zgodny z BRD-QA-REL 1.0 (`BR-REL-017`).
> Żadne zadanie, naprawa błędu ani wydanie wersji nie mogą zostać uznane za zakończone bez spełnienia poniższych kryteriów.

---

## 1. Kryteria dla pojedynczej zmiany lub nowego ekranu

Przed zgłoszeniem zakończenia pracy nad jakąkolwiek modyfikacją kodu aplikacyjnego:

1. **Jakość kodu i typowanie TypeScript (`DEC-01`):**
   * Polecenie `npm run typecheck` kończy się z kodem `0` (zero błędów kompilatora `tsc`).
   * Brak pomijania typów (`any`), brak nieudokumentowanych rzutowań `as unknown as X`.
2. **Czysta logika i 100% pokrycia testami (`BR-TEST-001`, `BR-TEST-002`):**
   * Nowe funkcje obliczeniowe, algorytmy i reguły walidacji umieszczone w czystych modułach `src/core/` (bez zależności od Reacta i widoków).
   * Pokrycie w `src/core/` wynosi bezwzględnie **100% linii, 100% gałęzi, 100% funkcji i 100% instrukcji**.
3. **Strażnicy interakcji (`NFR-INT-001`..`016`):**
   * Każdy modal posiada przycisk „Anuluj” / „Zamknij” po lewej stronie nagłówka (`S1`).
   * Brak luźnych przycisków zapisu w stopkach formularzy — zapis wyłącznie w prawym rogu nagłówka (`S3`).
   * Wszystkie operacje niszczące chronione przez `confirm.ts` bez niejednoznacznych przycisków „Nie” / „Wróć” (`S5`).
   * Pola numeryczne obsługują konwersję jednostek bez dryfu `wInKeep` oraz przecinek i kropkę dziesiętną (`S3`).
4. **Higiena umiędzynarodowienia (i18n, `NFR-I18N-001`..`008`):**
   * Wszystkie nowe teksty posiadają symetryczne tłumaczenia PL i EN w `src/i18n/translations.ts`.
   * Brak twardo zakodowanych ciągów znaków w widokach (`.tsx`).
   * Skrypt `npm run check:i18n` kończy się sukcesem.
5. **Dostępność i responsywność (a11y, `NFR-A11Y-001`..`008`):**
   * Elementy klikalne posiadają pole dotyku $\ge 44 \times 44\text{ pt}$.
   * Kontrast tekstu do tła spełnia normę WCAG AA ($\ge 4.5:1$).
   * Layout nie obcina treści przy małym ekranie (szerokość 320 pt) oraz powiększeniu czcionki `fontScale = 2.0` (Dynamic Type / AX5).
6. **Macierz testów AST (`BR-TEST-028`..`031`):**
   * Skrypt `npm run check:matrix` wykazuje **100.0% pokrycia** we wszystkich 5 kategoriach (`EKRAN`, `UI`, `TEKST`, `LOGIKA`, `WYMIAR`).
   * Brak nieobsłużonych braków lub przestarzałych wyjątków w `tests/matrix-exceptions.json`.

---

## 2. Kryteria dla wydania wersji (Release / TestFlight)

Przed przygotowaniem wydania do App Store Connect i TestFlight:

1. **Zielony przebieg potoku weryfikacji (`npm run verify`):**
   * `npm run check:i18n` (100% symetrii językowej)
   * `npm run check:corpus` (wyrocznie numeryczne Python zgodne do 4 miejsc po przecinku)
   * `npm run check:licenses` (zero licencji GPL / AGPL w produkcyjnym drzewie zależności)
   * `npm run check:matrix` (100% pokrycia AST bez luk)
   * `npm run check:native` (20 niezmienników projektu iOS na Linuksie/Windowsie)
   * `npm run typecheck` (zero błędów TS)
   * `npm run test:coverage` (100% testów przechodzi, brak ostrzeżeń `act()` i `console.error`)
2. **Bezpieczeństwo i prywatność repozytorium (`NFR-SEC-001`..`015`):**
   * Brak śledzonych kluczy prywatnych, plików `.p8`, `.p12` ani plików `.env`.
   * Skrypt `gitleaks` na pełnym zakresie historii nie wykrywa wycieków sekretów.
   * Aplikacja zachowuje 100% izolację offline: brak nieautoryzowanych wywołań sieciowych (`tests/public-repo.test.ts`).
3. **Pliki prawne i strony WWW (`BR-REL-019`..`020`):**
   * Pliki `site/index.html`, `site/privacy.html`, `site/support.html` są aktualne, samowystarczalne i zlinkowane bez błędów 404.
4. **Zamknięcie audytu 10 agentów (`BR-REL-015`, `BR-REL-016`):**
   * Raport w `docs/25-audyt-brd-qa-rel.md` zawiera udokumentowaną Rundę 2 weryfikacji.
   * Liczba otwartych usterek oznaczonych jako **KRYTYCZNE** wynosi **0**.
   * Liczba otwartych usterek oznaczonych jako **WYSOKIE** wynosi **0**.
   * Wszystkie naprawione usterki posiadają dedykowane testy regresyjne w `tests/audit-fixes.test.tsx`.
5. **Dziennik przekazania (`docs/18-przekazanie.md`):**
   * Stan repozytorium, wersja, numer buildu i podjęte decyzje są zaktualizowane.

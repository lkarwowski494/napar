# CLAUDE.md — Przewodnik dla Agentów AI w Repozytorium Napar (Steepwise)

> Standard inżynieryjny studia Apps4Craft zgodny z `BRD-QA-REL 1.0`.
> Przed zakończeniem jakiegokolwiek zadania przeczytaj i spełnij wymagania z:
> `docs/20-definicja-ukonczenia.md` oraz `docs/18-przekazanie.md`.

---

## 1. Kluczowe Komendy Deweloperskie

```bash
# Główna brama jakościowa (MUSI być w 100% zielona przed zatwierdzeniem zmian):
npm run verify

# Komendy składowe:
npm run check:i18n       # Walidacja symetrii i kompletności tłumaczeń PL / EN
npm run check:corpus     # Sprawdzenie zgodności wyroczni numerycznych Python (Coffee + Contrast)
npm run check:licenses   # Kontrola czystości licencji npm (zakaz GPL / AGPL w produkcji)
npm run check:matrix     # Kontrola 100% pokrycia macierzy testów AST (docs/22-macierz-testow.md)
npm run check:native     # Weryfikacja 20 niezmienników projektu iOS na Linuksie/Windowsie
npm run typecheck        # Kontrola typów TypeScript (tsc --noEmit)
npm run test:coverage    # Testy Jest z wymuszeniem progów 100% w src/core/

# Uruchomienie pojedynczego testu z logowaniem ziarna:
PROP_SEED=12345 npm test -- tests/domain-properties.test.ts
```

---

## 2. Nienaruszalne Zasady i Niezmienniki Architektury

1. **Czysta logika domenowa (`BR-TEST-001`, `BR-TEST-002`):**
   * Wszystkie obliczenia (ekstrakcja, woda, timery, jednostki, kopie, parsery) znajdują się w `src/core/`.
   * W `src/core/` obowiązuje bezwzględny próg **100% linii, gałęzi, funkcji i instrukcji**.
   * Zakaz importowania `react`, `react-native`, `expo-*` do plików w `src/core/`.
2. **Strażnicy interakcji (`NFR-INT-001`..`016`):**
   * Przycisk „Anuluj” / „Zamknij” zawsze po lewej stronie nagłówka modala (`S1`).
   * Zapis formularza wyłącznie w prawym rogu nagłówka (`S3`), nigdy w pływającej stopce.
   * Wszystkie operacje usuwania chronione przez `lib/confirm.ts` (`S5`).
   * Pola numeryczne używają konwersji bez dryfu `wInKeep` i obsługują przecinek oraz kropkę (`S3`).
3. **Higiena umiędzynarodowienia (`NFR-I18N-001`..`008`):**
   * Żadnych twardo zakodowanych tekstów w widokach.
   * Wszystkie klucze muszą być obecne zarówno w `translations.pl` jak i `translations.en`.
4. **Dostępność i mobilność (`NFR-A11Y-001`..`008`):**
   * Minimalne pole dotyku dla wszystkich interaktywnych kontrolek: $44 \times 44\text{ pt}$.
   * Kontrast WCAG AA $\ge 4.5:1$ dla tekstu zwykłego.
   * Obsługa Dynamic Type do skali $2.0\times$ (AX5) i szerokości ekranu $320\text{ pt}$.
5. **Zero telemetrii i bezpieczeństwo offline (`NFR-SEC-014`, `NFR-SEC-015`):**
   * Aplikacja działa w 100% offline — zero analityki, trackerów i nieautoryzowanych wywołań sieciowych.
   * Wszystkie komórki eksportu CSV zabezpieczone przed wstrzykiwaniem formuł (`escapeCsvCell`).
   * Pliki `.p8`, `.p12`, klucze i tokeny nigdy nie trafiają do repozytorium Git.
6. **Ochrona danych i kopie zapasowe (`BR-TEST-022`, `BR-TEST-023`):**
   * Dwie rozdzielne pule po 10 plików: automatyczne $P_{\text{auto}}$ oraz ratunkowe $P_{\text{safe}}$ z sufiksem `-2`.
   * Błędy bazy lub zapisu chronione zrzutem do `state_corrupt_<ts>.json` z banerem odzysku.

---

## 3. Przebieg Audytu i Wydania Wersji

Przed jakimkolwiek wdrożeniem produkcyjnym lub zgłoszeniem do App Store:
1. Upewnij się, że `npm run verify` wykonuje się całkowicie na zielono.
2. Sprawdź `docs/25-audyt-brd-qa-rel.md` — liczba otwartych usterek KRYTYCZNYCH i WYSOKICH musi wynosić **0**.
3. Upewnij się, że każde naprawione znalezisko posiada test regresyjny w `tests/audit-fixes.test.tsx`.

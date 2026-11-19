# Sesja E: Domknięcie otwartych wpisów merytorycznych w `rejestr.json` (`REJ-01`) — Napar
Koordynator: `v1/default/jetski_remote_agents_3p/2f459540-3f1f-4d1d-b6a9-942b302be3a0` (raporty, pytania i PRZEKAZANIE tylko do koordynatora). Gałąź stanu koordynatora: `koordynacja` (tylko do odczytu).

1. Rola: `06-tresci` w trybie `fix`, zadanie `REJ-01`. Prompt roli znajduje się w `/home/antigravity/.gemini/jetski/brain/v1/default/jetski_remote_agents_3p/2f459540-3f1f-4d1d-b6a9-942b302be3a0/scratch/E-rola.md` — przeczytaj go w całości (zwłaszcza standard przeczytanego źródła i treści krytyczne), jesteś tą rolą.
2. Start: utwórz osobny worktree `/tmp/napar-sesja-e` z nową gałęzią `naprawy/E-tresci-rejestr` od `origin/naprawy/D-e2e-i-bramka` (`3d12389`):
   `git -C /home/antigravity/lkarwowski494/napar worktree add -b naprawy/E-tresci-rejestr /tmp/napar-sesja-e origin/naprawy/D-e2e-i-bramka`
   Sprawdź tożsamość commitów (`git config user.name` / `user.email`) przed pierwszym commitem. Zainstaluj zależności (`npm ci`, jeśli brak `node_modules`).
3. Zadania (każde z kryterium „gotowe”):
   1. **Przegląd i domknięcie otwartych wpisów `rejestr.json` (12 pozycji ze statusem `"otwarte"`):**
      - Priorytetowo zajmij się **6 liczbami używanymi w kodzie aplikacji**:
        - `KAWA-KOFEINA-MG-G` (arabika/robusta mg/g w kawie palonej — znajdź i przeczytaj źródło szczebla 1–2, np. EFSA, USDA FoodData Central, recenzowana publikacja w PMC/PubMed w pełnym tekście),
        - `KAWA-WYDAJNOSC-EKSTRAKCJI` (udział kofeiny w naparze: filtr/espresso/immersja/cold brew),
        - `HERBATA-KOFEINA-3PROC` (kofeina w suchej masie liści herbaty),
        - `HERBATA-FRAKCJE-ZALAN` (udział kofeiny w kolejnych zalaniach Gongfu — sprawdź literaturę i porównaj z kodem oraz BRD RD-19),
        - `HERBATA-SZYBKIE-45MG` (rozjazd 45 mg vs 60 mg / 5 g — rozstrzygnij na podstawie źródła i zapisz zalecenie dla roli 08 jeśli kod wymaga ujednolicenia),
        - `WODY-BUTELKOWANE-SKLADY` (zapisz precyzyjną rekomendację merytoryczną dla 10 marek bez etykiet — co da się potwierdzić z oficjalnych stron producentów z datą odczytu, a co powinno pozostać otwarte lub trafić do decyzji usunięcia marek).
      - Spróbuj też domknąć pozostałe 6 wpisów (`NEHLIG-CYP1A2-2018`, `SCA-GOLDENCUP-EY`, `SCA-WATER-STD`, `HENDON-WATER-2015`, `ASTILL-TEA-2001`, `WCR-VARIETIES`) wyłącznie na podstawie **rzeczywiście otwartych i przeczytanych** źródeł (użyj narzędzi wyszukiwania/przeglądania; jeśli źródło jest za paywallem lub nie zawiera tezy, NIE zmyślaj cytatu — zostaw `"status": "otwarte"` i dopisz konkretną notatkę z datą 2026-11-19).
      - Zaktualizuj `rejestr.json` (zachowując schemat sprawdzany przez `npm run verify` / testy rejestru!).
   2. **Lista rekomendacji kodowych dla roli 08 (jeśli przeczytane źródła wykażą rozbieżność z liczbami w kodzie):**
      - Zapisz krótką listę (bez zmiany logiki `src/core/`, chyba że to wyłącznie komentarz/cytat `[T:ID]` lub bezpieczna korekta bez zmiany testów — w tej sesji zmieniasz `rejestr.json` i ew. dokumentację treści).
4. Zakazy:
   - Nigdy nie wpisujesz źródła ani cytatu, którego nie otworzyłeś i nie przeczytałeś (zasada wspólna 2 i 3).
   - Nie scalasz do `claude/napar-app-audit-5u19j0` ani `main`, nie piszesz na `koordynacja`, nie dotykasz `/home/antigravity/lkarwowski494/napar` ani `/tmp/napar-koordynacja-state`.
   - Nigdy `--no-verify`, nigdy force-push, nie pytasz właściciela bezpośrednio (bez `AskUserQuestion`).
5. Końcowy dowód i push:
   - Uruchom pełne `npm run verify` i zapisz pełny log do `/home/antigravity/.gemini/jetski/brain/v1/default/jetski_remote_agents_3p/2f459540-3f1f-4d1d-b6a9-942b302be3a0/scratch/E-verify.log`.
   - Wypchnij gałąź: `git push -u origin naprawy/E-tresci-rejestr`.
6. Raport zwrotny do koordynatora (≤ 12 linii):
   - Ile z 12 otwartych wpisów `rejestr.json` udało się potwierdzić przeczytanym źródłem, a ile zostało otwartych (i dlaczego),
   - Lista konkretnych rozbieżności z kodem (np. 45 vs 60 mg, Gongfu, wody) do zlecenia roli 08,
   - Lista commitów (SHA + temat) i autor,
   - Kod wyjścia `npm run verify` i ścieżka do `E-verify.log`.

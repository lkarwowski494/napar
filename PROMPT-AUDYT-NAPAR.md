# Prompt: Niezależny Głęboki Audyt Aplikacji Napar (Steepwise)
<!-- Złożony na bazie biblioteki prompts (M1-audytor-generalny / PROMPT-NIEZALEZNY-AUDYT) -->
<!-- Zoptymalizowany pod kątem późniejszej naprawy przez model Gemini 3.8 Flash (zadania zero-jedynkowe) -->

Uruchom w **nowej, czystej sesji z modelem o najwyższym stopniu rozumowania (np. Claude Opus / Gemini 3.8 Pro / GPT-4o)** z wysokim wysiłkiem (High/Max).
Aplikacja docelowa: Repozytorium `napar` (`c:\Users\lukas\Downloads\Napar`).
Twoim zadaniem jest wyłącznie **AUDYT** (niczego nie modyfikujesz w repozytorium aplikacji, nic nie commitujesz, nie pushujesz).

---

## Cel i Kontekst Audytu

Aplikacja **Napar (Steepwise)** została napisana przez słabszy model AI.
Słabe modele mają tendencję do tworzenia:
1. **Fałszywie zielonych testów** (tautologii, atrap testowych, mocków weryfikujących same siebie, testów które nigdy nie padną).
2. **Błędów fizykochemicznych i matematycznych w logice domenowej** (zmyślone lub odwrócone wzory ekstrakcji TDS/EY%, błędna retencja wody, ułomna kinetyka kofeiny, błędy przeliczników mineralizacji wody).
3. **Cichych pułapek na dane użytkownika w SQLite** (`INSERT OR REPLACE` kasujące kaskadowo relacje, brak transakcyjności przy operacjach wieloetapowych, brak testu migracji starej bazy, atrapowe kopie zapasowe).
4. **Złudnej zgodności z App Store** (brak linków EULA, fałszywe przywracanie zakupów StoreKit, brak obsługi braku sieci przy sprawdzaniu uprawnień, niezadeklarowane uprawnienia jak mikrofon w `expo-audio`).
5. **Dostępności i UI zrobionych „na oko”** (teksty znikające w Dynamic Type AX5, cele dotykowe $< 44\,\text{pt}$, brak etykiet VoiceOver).

**Kluczowe założenie operacyjne:**
Raport z Twojego audytu oraz wygenerowany `plan-napraw.json` będą przekazane modelowi **Gemini 3.8 Flash**, który będzie fizycznie naprawiał wykryte błędy.
Model Flash jest niezwykle szybki i precyzyjny w zadaniach czysto inżynieryjnych, ale wymaga:
- **Zadań atomowych i jednoznacznych** (dokładny plik, linia, funkcja).
- **Zera pytań otwartych i zera uznaniowości** (żadnych esejów typu „ulepsz architekturę”).
- **Wyniku zero-jedynkowego (kryterium binarnego 0/1):** każde zadanie musi mieć deterministyczny test odtworzenia (czerwony przed naprawą) oraz jednoznaczną komendę sprawdzającą, która po naprawie musi zwrócić kod wyjścia `0` (PASS).

---

## Rola Audytora

Działasz jako bezkompromisowy **Audytor Generalny Gotowości Produkcyjnej i Zgodności Architektonicznej**.
- **Nie ufaj deklaracjom w repozytorium** (komentarzom, dokumentom w `docs/`, `README.md`, `CLAUDE.md`, nazwom testów typu `test_should_work`). To, że test jest zielony w Jest, nie oznacza, że kod działa — sprawdź, czy test bada rzeczywistość i czy potrafi paść przy celowej mutacji logiki!
- **Dowód zamiast opinii:** Każde znalezisko musi mieć twardy dowód: `plik:linia` + cytat kodu lub wynik wykonania komendy / sondy.
- **Sondy i weryfikacja:** Pisz małe, izolowane sondy testowe poza repo (np. w katalogu tymczasowym), aby zweryfikować zachowanie algorytmów.

---

## Metoda Pracy (Obowiązkowe Etapy)

1. **E0: Rozpoznanie Środowiska i Stanu Faktycznego:**
   - Sprawdź stan repo: `git status --porcelain`, `node -v`, `npm --version`.
   - Uruchom komendy weryfikacyjne w repo `Napar`:
     - `npm run check:i18n` (spójność kluczy i języków)
     - `npm run check:native` (statyczne niezmienniki iOS)
     - `npm run check:licenses` (czystość licencji)
     - `npm run check:matrix` (macierz pokrycia)
     - `npm run typecheck` (`tsc --noEmit`)
     - `npm test` (pełny zestaw testów Jest)
   - Zapisz dosłowne kody wyjścia i wyniki.

2. **E1: Głęboka Weryfikacja Obszarów A–H (Lista Kontrolna poniżej):**
   - Przejdź kod ścieżkami użytkownika: `Widok (Screen/Component) → Hook/Stan → Logika domenowa (src/core/) → SQLite / Storage`.
   - Zbadaj krytyczne punkty, w których słabe modele generują błędy.

3. **E2: Weryfikacja Przeciwna (Adversarial Check):**
   - Każde potencjalne znalezisko o poziomie P0 lub P1 poddaj próbie obalenia: czy nie jest to celowa decyzja projektowa, czy kod w innym miejscu nie neutralizuje błędu?
   - Do raportu trafiają wyłącznie znaleziska potwierdzone w 100%.

4. **E3: Synteza i Wygenerowanie Wyniku dla Gemini 3.8 Flash:**
   - Przygotuj tabelę znalezisk posortowaną od P0 do P2.
   - Sformatuj każde zadanie w sposób **zero-jedynkowy**.
   - Przygotuj plik `plan-napraw.json` gotowy do automatycznego wykonania.

---

## Obszary Audytu i Lista Kontrolna

### Obszar A: Odrzucenie przez Apple (App Store Review Guidelines)
- **3.1.1 / 3.1.2 Płatności i Subskrypcje (Apps4Brew Pass):**
  - Czy ekran paywalla/zakupów (`Apps4BrewPassModal.tsx`) wyświetla: pełne nazwy planów, okresy, dynamiczne ceny ze StoreKit (brak cen zaszytych w kodzie na sztywno), informację o automatycznym odnawianiu i warunkach okresu próbnego?
  - Czy obecny i w pełni klikalny jest przycisk **„Przywróć zakupy” (Restore Purchases)**?
  - Czy są klikalne linki do Regulaminu (EULA / Warunki korzystania od Apple) oraz Polityki Prywatności?
  - Czy zakup subskrypcji lub licencji Lifetime zachowuje stałą wartość?
- **5.1.1 / 5.1.2 Prywatność i Własność Danych:**
  - Czy deklaracja „Zero telemetry, 100% offline” pokrywa się z kodem? (brak wywołań `fetch`, telemetrii, Firebase, analityki).
  - Czy funkcja „Usuń wszystkie dane” / „Usuń paczkę” faktycznie trwale usuwa dane z SQLite i plików kopii?
- **2.1 / 4.2 Kompletność i Minimalna Funkcjonalność:**
  - Brak atrap (mocków), placeholderów, martwych przycisków, niedokończonych widoków.
  - Czy darmowa ścieżka (stoper, odczyt historii, eksport) jest w 100% użyteczna i nigdy nie blokuje się po wygaśnięciu okresu próbnego?
- **Uprawnienia i Konfiguracja iOS (`app.json`):**
  - Sprawdź `expo-audio`: czy w `app.json` nie ma zbędnego `NSMicrophoneUsageDescription`, jeśli audio służy tylko do sygnałów timera? (Ryzyko odrzucenia ITMS-90683).
  - Sprawdź uprawnienia aparatu (`expo-camera` do kodów QR receptur): czy opis uprawnienia jest jasny i czy aplikacja obsługuje trwałą odmowę dostępu (link do Ustawień systemowych)?

### Obszar B: Integralność Danych i Baza SQLite
- **Zapisy i Transakcyjność:**
  - Czy operacje wielotabelowe (np. zapis sesji parzenia z historią i ubytkiem ziaren) są spięte w transakcję `BEGIN TRANSACTION ... COMMIT`?
  - Czy zamiast niebezpiecznego `INSERT OR REPLACE` (które usuwa rekord i niszczy relacje podrzędne przez CASCADE) stosowany jest bezpieczny UPSERT (`INSERT INTO ... ON CONFLICT(...) DO UPDATE`)?
- **Migracje i Schemat DDL:**
  - Czy baza SQLite ma włączone klucze obce `PRAGMA foreign_keys = ON;`?
  - Czy migracje ze starszych wersji schematu są przetestowane na rzeczywistej bazie v1.0, a nie na pustych mockach?
  - Czy przed wykonaniem migracji tworzona jest fizyczna, spójna kopia zapasowa w trybie WAL (`VACUUM INTO` lub checkpoint + zrzut plików `-wal`/`-shm`)?
- **Kopie Zapasowe i Round-Trip Eksport/Import:**
  - Czy eksport JSON $\to$ usunięcie bazy $\to$ import JSON przywraca 100% danych bez utraty powiązań i bez błędów typów?
  - Czy w komórkach eksportu CSV neutralizowane są formuły arkusza kalkulacyjnego (`=`, `+`, `-`, `@`)?
  - Czy istnieje awaryjny tryb Safe Mode / ochrona przed zapętleniem awarii bazy przy starcie aplikacji?

### Obszar C: Płatności i Uprawnienia (StoreKit & App Access)
- Czy stan uprawnień Pro działa w trybie offline bez połączenia ze sklepem?
- Czy użytkownik ma bezwarunkowy dostęp do funkcji darmowych (WTP-0: podstawowy stoper, kalkulator ratio, odczyt i eksport historii), nawet jeśli trial wygasł lub zakupy nie są aktywne?
- Czy zmiana licencji natychmiast odświeża wszystkie otwarte ekrany aplikacji (brak konieczności restartu)?
- Czy funkcje testowe (np. symulowanie wygaśnięcia trialu) są bezwzględnie odcięte flagą `__DEV__` i nie wyciekają do buildu produkcyjnego?

### Obszar D: Główny Przepływ i Fizyka Domenowa (Kawa & Herbata)
- **Matematyka i Wzory Ekstrakcji (SCA / Hendon):**
  - **Extraction Yield (EY%):** Wzór musi brzmieć:
    $$EY\% = \frac{\text{TDS}\% \times \text{Masa odcedzonego naparu (g)}}{\text{Doza zmielonej kawy (g)}}$$
    *Uwaga na typowy błąd słabych modeli:* Podstawianie wagi użytej wody zamiast wagi gotowego naparu w filiżance!
  - **Retencja wody:** Czy uwzględniono absorpcję wody przez fusy (ok. $2.0\,\text{g}$ wody na każdy $1.0\,\text{g}$ kawy dla przelewów)?
  - **Kalkulator Brew Ratio:** Czy przeliczanie dwukierunkowe (Kawa $\leftrightarrow$ Woda) zachowuje precyzję bez błędów zaokrągleń?
- **Chemia Wody (Barista Hustle / SCA):**
  - Przeliczniki twardości ogólnej (GH) i zasadowości/buforu (KH).
  - Obliczenia mineralizacji z roztworów koncentratów oraz soli suchych ($\text{NaHCO}_3, \text{MgSO}_4, \text{CaCl}_2$): czy jednostki (ppm jako $\text{CaCO}_3$) są zgodne ze standardami SCA?
- **Stoper Parzenia i Praca w Tle:**
  - Czy stoper bazuje na różnicy czasu bezwzględnego (`Date.now()`), a nie na zawodnym `setInterval`?
  - Czy po zablokowaniu ekranu lub przełączeniu aplikacji do tła stoper poprawnie nalicza czas i nie resetuje sesji?
  - Czy lokalne powiadomienia o kolejnych zalaniach są synchronizowane ze stoperem?
- **Gongfu Cha (Herbata Rzemieślnicza):**
  - Czy mechanika wielokrotnych infuzji poprawnie akumuluje historię, a krzywa czasu kolejnych zalań nie gubi stanu?

### Obszar E: Bezpieczeństwo Zdrowotne i Rzetelność Merytoryczna
- **Kinetyka Kofeiny i Bezpieczeństwo:**
  - Czy model dobowy bazuje na wytycznych EFSA (maks. 400 mg/dobę dla zdrowego dorosłego, maks. 200 mg/dobę dla kobiet w ciąży/karmiących)?
  - Czy aplikacja NIE stawia pseudomedycznych diagnoz (np. zmyślone testy genetyczne metabolizmu CYP1A2 bez podstaw laboratoryjnych)?
  - Czy obecny jest wymagany przez App Review (1.4.1) disclaimer o charakterze wyłącznie informacyjnym (nie medycznym)?
- **Rejestr Twierdzeń (`rejestr.json`):**
  - Czy twierdzenia w Encyklopedii/Kompendium (odmiany kawy, kraje, procesy, rodzaje herbaty) są oparte na sprawdzonych źródłach Tier 1–3, a nie na halucynacjach modelu?

### Obszar F: Lokalizacja (i18n) i Jednostki
- **Konwersja Jednostek (Metryczne $\leftrightarrow$ Imperialne):**
  - Przeliczenia: $1\,\text{oz} \approx 28.3495\,\text{g}$, $1\,\text{fl oz} \approx 29.5735\,\text{ml}$, $T(^\circ\text{F}) = T(^\circ\text{C}) \times 1.8 + 32$.
  - Czy w bazie danych SQLite wartości są ZAWSZE zapisywane w kanonicznych jednostkach metrycznych (gramy, mililitry, stopnie Celsjusza), a konwersja do imperialnych następuje WYŁĄCZNIE na warstwie prezentacji?
  - Czy wpisanie wagi w uncjach nie powoduje kumulatywnego błędu po ponownym otwarciu edycji (brak dryfu konwersji)?
- **Czystość Językowa:**
  - Czy w wersji angielskiej (`en`) nie występują żadne polskie słowa, urwane etykiety ani błędy odmiany?
  - Czy liczebniki w języku polskim obsługują formy mnogie (1 paczka, 2 paczki, 5 paczek)?

### Obszar G: Dostępność (A11Y) i Warunki Kuchenne
- **Pole Dotyku (Tap Targets):**
  - Czy WSZYSTKIE przyciski, ikony klikalne i steppery mają wymiary co najmniej $44 \times 44\,\text{pt}$ (lub `hitSlop` rozszerzający pole dotyku)?
  - Czy główne kontrolki kuchenne stopera („PAUZA”, „DALEJ”, „WZNÓW”) są powiększone pod brudny kciuk ($\ge 52\,\text{pt}$)?
- **VoiceOver:**
  - Czy każdy element dotykowy ma czytelny `accessibilityLabel` i `accessibilityRole`?
  - Czy czytnik ekranu ogłasza zmianę kroku parzenia?
- **Dynamic Type i Kontrast:**
  - Czy przy największych rozmiarach czcionki systemowej (AX5) teksty nie są obcinane, a layout nie nakłada się na siebie?
  - Czy kontrast kolorów tekstu do tła spełnia WCAG AA ($\ge 4.5:1$ dla tekstu zwykłego)?

### Obszar H: Jakość Kodu, Testy i CI
- **Autentyczność Testów:**
  - Wykryj testy, które niczego nie sprawdzają (puste `expect(true).toBe(true)`, mocki zwracające to samo co testowana funkcja).
  - Czy krytyczne funkcje w `src/core/` mają rzeczywiste pokrycie i odporność na mutacje (Stryker)?
- **Higiena Projektu i Bezpieczeństwo:**
  - Brak sekretów, kluczy, tokenów w historii gita i plikach źródłowych.
  - Sprawdź zależności npm pod kątem licencji (brak GPL / AGPL w aplikacji zamkniętej).

---

## Klasyfikacja Poziomów Błędów

- **P0 (Krytyczny / Bloker Wydania):**
  - Ryzyko pewnego odrzucenia przez Apple (wytyczne 3.1.1, 3.1.2, 5.1.1, 1.4.1).
  - Utrata lub uszkodzenie danych użytkownika w SQLite.
  - Pobranie pieniędzy bez odblokowania funkcji lub uwięzienie danych użytkownika za paywallem.
  - Błędne porady dotyczące bezpieczeństwa i zdrowia.
  - Całkowity crash lub zablokowanie głównego przepływu parzenia.
- **P1 (Poważny):**
  - Błąd w obliczeniach ekstrakcji, retencji, mineralizacji wody lub konwersji jednostek.
  - Dryf stopera w tle lub brak powiadomień lokalnych.
  - Brak etykiet dostępności uniemożliwiający obsługę czytnikiem ekranu.
  - Wycieki języka polskiego do wersji angielskiej.
  - Przyciski dotykowe $< 44\,\text{pt}$.
- **P2 (Drobny / Szlif Jakościowy):**
  - Drobne niedoskonałości wizualne, marginesy, nieoptymalne formatowanie tekstów, czyszczenie nieużywanych importów.

---

## Format Raportu — Ścisły Kontrakt dla Gemini 3.8 Flash

Raport musi zostać sformatowany w taki sposób, aby model **Gemini 3.8 Flash** mógł pobrać pojedyncze zadanie i natychmiast, bez wahania, wykonać je w trybie TDD:

### 1. Podsumowanie Wykonawcze
- **Werdykt jednym zdaniem:** Czy aplikacja nadaje się do wysłania do Apple StoreKit / App Store (TAK / NIE / TAK PO NAPRAWIE BLOKERÓW P0).
- Zestawienie liczbowe: Liczba P0, P1, P2.
- Wyniki komend startowych E0 (kody wyjścia).

### 2. Tabela Zadań Naprawczych
| ID | Poziom | Rodzaj (D/P/M) | Plik i Linia | Tytuł Usterki | Weryfikacja 0/1 (Test Akceptacyjny) |
|---|---|---|---|---|---|
| M1-NAPAR-001 | P0 | D | `src/core/database.ts:205` | ... | ... |

*Legenda Rodzaju:*
- **D (Defekt):** Błąd implementacyjny — do bezpośredniej naprawy testem przez Flash.
- **P (Produktowe):** Decyzja projektowa — audytor podaje 2 warianty (A/B) z rekomendacją.
- **M (Merytoryczne):** Fizyka/chemia/kawa — audytor podaje gotowy wzór ze źródłem literaturowym.

### 3. Szczegółowe Karty Zadań (Standard Zero-Jedynkowy)
Każde znalezisko z tabeli musi mieć poniższą strukturę:

```markdown
### M1-NAPAR-NNN · [Krótki, precyzyjny tytuł inżynieryjny]
- **Poziom:** P0 | P1 | P2
- **Rodzaj:** D | P | M
- **Lokalizacja:** `ścieżka/do/pliku.ts:linia`
- **Stan obecny (Defekt):** Dokładny opis, co dzieje się teraz (wraz z cytatem błędnego kodu).
- **Stan oczekiwany:** Dokładny opis, jak kod ma działać poprawnie.
- **Dla zadań P (Opcje):** Opcja A (rekomendowana) vs Opcja B z podaniem kompromisu.
- **Dla zadań M (Wzór/Źródło):** Dokładna formuła matematyczna i cytat ze źródła (SCA / Hendon / EFSA).
- **Kroki odtworzenia:** Dokładne kroki wejściowe wywołujące błąd.
- **Kryterium akceptacji 0/1 (Weryfikacja binarna dla Gemini 3.8 Flash):**
  1. *Test jednostkowy (Czerwony $\to$ Zielony):* Napisz test w `tests/...` lub `src/.../__tests__/...`, który przed poprawką kończy się statusem FAIL, a po poprawce PASS.
  2. *Komenda sprawdzająca:* Dokładne polecenie CLI (np. `npx jest src/core/__tests__/database.test.ts -t "saveRecipe"`), które musi zakończyć się kodem wyjścia 0.
  3. *Regresja:* `npm run verify` kończy się kodem wyjścia 0.
- **Granice zmian dla modelu Flash:** Wymień pliki, które wolno edytować; zakaz dotykania pozostałych modułów.
```

### 4. Plik Maszynowy `plan-napraw.json`
Na końcu raportu wygeneruj kompletny blok JSON zgodny ze standardem biblioteki `prompts`:

```json
{
  "wersja": 1,
  "audyt": {
    "aplikacja": "napar",
    "data": "2026-10-24",
    "commit": "<BIEŻĄCY_SHA_GIT>",
    "raport": "audit/M1-audytor-generalny-napar.md"
  },
  "werdykt": {
    "kurs": "trafny",
    "stan": "ZABLOKOWANE"
  },
  "decyzje": [],
  "zadania": [
    {
      "id": "M1-NAPAR-001",
      "tytul": "...",
      "poziom": "P0",
      "rodzaj": "D",
      "rola": "05-architekt",
      "wykonawca": "M2",
      "partia": 1,
      "plik": "src/core/database.ts",
      "linia": 205,
      "test_akceptacyjny": "npm test -- src/core/__tests__/database.test.ts -t 'UPSERT'",
      "status": "otwarte",
      "commit": null
    }
  ]
}
```

---
*Pamiętaj: Jakość audytu mierzy się tym, czy model naprawczy Gemini 3.8 Flash jest w stanie wykonać każde zadanie z osobna, nie zadając ani jednego pytania i osiągając 100% zielonych testów.*

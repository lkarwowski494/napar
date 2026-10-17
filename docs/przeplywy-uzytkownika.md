# Przepływy Użytkownika i Audyt BPR · Napar (Steepwise)

**Dokument:** Architektura Procesów Produktowych (As-Is & To-Be BPR)  
**Standard:** Apps4Brew Studio · Lean UX & Business Process Reengineering  
**Zakres:** Kompletna inwentaryzacja przepływów ekranowych (`app/`, `src/components/`) oraz plan transformacji procesowej To-Be.

---

## CZĘŚĆ I — INWENTARYZACJA I DOKUMENTACJA PRZEPŁYWÓW (STAN AS-IS)

Poniżej udokumentowano wszystkie 9 przepływów użytkownika występujących w aplikacji w logicznej kolejności: od onboardingu, przez główny proces wytwórczy (parzenie), monitoring świeżości i dziennik degustacji, diagnostykę warsztatową, aż po ustawienia i kopie zapasowe.

---

### Przepływ 1: Onboarding i Profilowanie Domeny (`WelcomeModal` w `app/_layout.tsx`)

#### 1. Kiedy używasz
Przy pierwszym uruchomieniu aplikacji po instalacji (gdy flaga `welcome_completed` w lokalnej bazie SQLite nie jest ustawiona). Użytkownik określa, czy używa aplikacji do kawy specialty, rzemieślniczej herbaty, czy obu naraz, oraz poznaje politykę prywatności (100% offline, zero kont, darmowe 50 parzeń).

#### 2. Sekwencja kroków (1 → 2 → 3 → 4)

```text
+-------------------------------------------------------------------------+
| [1. WEJŚCIE] Start aplikacji (_layout.tsx)                              |
| Sprawdzenie hasCompletedWelcome() === false -> Otwarcie WelcomeModal    |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
| [2. KONFIGURACJA] Wybór preferencji napoju                              |
| Kafelki: [☕ Kawa Specialty] / [🍃 Herbata Rzemieślnicza] / [☕+🍃 Oba]  |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
| [3. WYNIK / PRZELICZENIE] Prezentacja zasad domeny i modelu Pass        |
| Dostosowanie domyślnego profilu (np. V60 vs Gaiwan) i limitu 50 parzeń  |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
| [4. EGZEKUCJA / ZAPIS] Kliknięcie [Rozpocznij parzenie]                 |
| Zapis setBeveragePreference() + setWelcomeCompleted() -> Ekran Parzenia |
+-------------------------------------------------------------------------+
```

- **Wejście:** Inicjalizacja `RootLayout` (`app/_layout.tsx`), odczyt stanu z SQLite.
- **Konfiguracja:** Wybór jednego z 3 profili domeny (`coffee`, `tea`, `both`).
- **Wynik/Przeliczenie:** Kontekst `BrewProvider` filtruje widoczne kategorie receptur, ziaren i kalkulatorów.
- **Egzekucja/Zapis:** Trwały zapis ustawienia w tabeli `app_settings` i przejście do głównego ekranu `app/(tabs)/index.tsx`.

#### 3. Wskazanie tarć poznawczych (Friction Points)
- **Brak powrotu do przewodnika po zamknięciu:** Po jednorazowym zamknięciu modala powitalnego użytkownik nie ma w nagłówku aplikacji przycisku `[🧭 Jak działa aplikacja?]`, który przypominałby strukturę ekranów i Złote Zasady ekstrakcji.
- **Zbyt długi tekst w modalu startowym:** Połączenie wyboru preferencji z opisem modelu subskrypcyjnego i manifestem prywatności na jednym ekranie wydłuża czas do pierwszego parzenia (*Time-to-First-Brew*).

---

### Przepływ 2: Główny Proces Wytwórczy — Parzenie Krok po Kroku (`app/(tabs)/index.tsx`)

#### 1. Kiedy używasz
Codzienny, główny scenariusz użycia aplikacji: stoisz przy blacie kuchennym z wagą oraz czajnikiem i chcesz przygotować powtarzalny napar (np. V60, AeroPress, Chemex, Sencha) z precyzyjnym przeliczeniem dozy, wody, klików młynka oraz prowadzeniem przez kolejne zalania.

#### 2. Sekwencja kroków (1 → 2 → 3 → 4)

```text
+-------------------------------------------------------------------------+
| [1. WEJŚCIE] Ekran "Parzenie" (app/(tabs)/index.tsx)                    |
| BrewHeader: Wybór receptury, surowca ze spiżarni oraz porcji (1x/2x)    |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
| [2. KONFIGURACJA] Karta "The Sacred Numbers" + Akordeon Pro             |
| Korekta dozy (+/- 0.5g), wody (+/- 10g), temp. oraz profilu wody SCA    |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
| [3. WYNIK / PRZELICZENIE] Przeliczenie Ratio, Klików Młynka i Harmonog. |
| Wyliczenie Ratio (np. 1:16.7), klików Comandante i podgląd kroków       |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
| [4. EGZEKUCJA / ZAPIS] Kliknięcie [ZACZNIJ PARZYĆ] -> Focus Timer       |
| Odliczanie kroków -> [Zakończ] -> BrewFinishModal -> Zapis do SQLite    |
+-------------------------------------------------------------------------+
```

- **Wejście:** Otwarcie karty `Parzenie` i wybór receptury w `BrewHeader` (lub pobranie z `RecipeSelectModal`) oraz powiązanie paczki ziaren/liści.
- **Konfiguracja:** Zmiana dozy, objętości wody, liczby porcji (`1x`, `2x`, `3x`) oraz opcjonalnie profilu wody w `BrewProAccordion`.
- **Wynik/Przeliczenie:** Natychmiastowe przeliczenie proporcji (`calculateBrewRatio`), estymacja klików wybranego młynka (`estimateGrinderSetting`) i przeskalowanie gramatur w harmonogramie zalań.
- **Egzekucja/Zapis:** Przełączenie widoku głównego ekranu w tryb `BrewActiveFocusTimer`, ręczne przechodzenie przez kroki, a po zakończeniu otwarcie `BrewFinishModal` (ocena 1–5★, balans smaku, koło aromatów, odjęcie wagi ze spiżarni i zapis sesji + kofeiny).

#### 3. Wskazanie tarć poznawczych (Friction Points)
- **Zagęszczenie akcji w `BrewHeader`:** W górnej części karty receptury znajdują się obok siebie przyciski zmiany receptury, udostępniania QR (`ShareIcon`) oraz skanera QR, co konkuruje o uwagę z samym wyborem metody.
- **Brak jawnej numeracji przyczynowo-skutkowej (1 → 2 → 3 → 4):** Sekcje wyboru surowca, parametrów wejściowych, przeliczonych proporcji oraz uruchomienia procedury zlewają się w jedną długą kartę bez wyraźnych etapów procesu.
- **Podmiana ekranu zamiast pełnoekranowego Asystenta Procedury (`ProcedureModal`):** Uruchomienie parzenia podmienia warunkowo zawartość `ScrollView` zamiast otworzyć dedykowany, pełnoekranowy modal asystenta procedury krok po kroku z wbudowanym stoperem kontekstowym i szybką korektą czasu (`-1 min`, `+1 min`, `Reset`).

---

### Przepływ 3: Rytuał Wielokrotnych Infuzji — Gongfu Cha (`app/gongfu.tsx`)

#### 1. Kiedy używasz
Gdy parzysz rzemieślniczą herbatę liściastą (Wulong, Pu-erh, Biała, Zielona) metodą wschodnią (Gongfu Cha w Gaiwanie lub czajniczku Yixing), wykonując od 4 do 10 krótkich, następujących po sobie parzeń z tych samych liści.

#### 2. Sekwencja kroków (1 → 2 → 3 → 4)

```text
+-------------------------------------------------------------------------+
| [1. WEJŚCIE] Otwarcie ekranu Gongfu Cha (z wyboru receptury)            |
| Wybór kategorii liści (np. Wulong Skalny) lub paczki herbaty ze spiżarni|
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
| [2. KONFIGURACJA] Parametry naczynia Gaiwan / Yixing                    |
| Ustawienie gramatury liści (np. 7g), pojemności (110 ml) i temp. (96°C) |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
| [3. WYNIK / PRZELICZENIE] Krzywa progresji czasu infuzji #1..#N         |
| Automatyczne wyliczenie czasu dla kolejnego parzenia (np. 15s -> 20s)   |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
| [4. EGZEKUCJA / ZAPIS] Odliczanie infuzji -> Zapis pojedynczego zalania |
| Powtarzanie dla kolejnych zalań -> [Zakończ ceremonię i zapisz sesję]   |
+-------------------------------------------------------------------------+
```

- **Wejście:** Wejście z `RecipeSelectModal` przyciskiem `Gongfu Cha`.
- **Konfiguracja:** Wybór rodzaju herbaty (`GongfuTeaType`), gramatury liści i objętości naczynia.
- **Wynik/Przeliczenie:** Algorytm `getRecommendedGongfuSteepSeconds` wyznacza rekomendowany czas bieżącej infuzji oraz łączną kofeinę z liści.
- **Egzekucja/Zapis:** Odliczanie sekundnika dla każdego zalania, rejestracja oceny cząstkowej (`recordGongfuInfusion`), a na końcu zbiorczy zapis sesji do Dziennika i Spiżarni.

#### 3. Wskazanie tarć poznawczych (Friction Points)
- **Oderwanie od głównego katalogu i asystenta procedury:** Gongfu Cha jest ukryte jako osobny przycisk wewnątrz modala wyboru receptury i posiada własny, osobny ekran timera (`app/gongfu.tsx`), co duplikuje logikę odliczania, haptyki i zapisu sesji z głównym ekranem parzenia.

---

### Przepływ 4: Katalog, Kreator i Wymiana Receptur QR (`RecipeSelectModal`, `app/recipe-builder.tsx`)

#### 1. Kiedy używasz
Gdy chcesz przejrzeć bazę wzorcowych receptur mistrzowskich, przefiltrować ulubione przepisy, stworzyć własną autorską recepturę wieloetapową albo udostępnić/zeskanować przepis przez kod QR Offline.

#### 2. Sekwencja kroków (1 → 2 → 3 → 4)

```text
+-------------------------------------------------------------------------+
| [1. WEJŚCIE] Otwarcie katalogu receptur (RecipeSelectModal)             |
| Filtrowanie po typie napoju lub kliknięcie [+ Własna receptura]         |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
| [2. KONFIGURACJA] Formularz RecipeBuilder (app/recipe-builder.tsx)      |
| Nazwa, metoda, doza, woda, temp. oraz lista kroków (czas + gramatura)   |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
| [3. WYNIK / PRZELICZENIE] Walidacja i wyliczenie Ratio na żywo          |
| Obliczenie recommendedRatio (np. 1:16.7) oraz sumy czasu i wody kroków  |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
| [4. EGZEKUCJA / ZAPIS] Zapis do SQLite lub Eksport/Import QR            |
| saveRecipe() -> Powrót do katalogu i natychmiastowa dostępność          |
+-------------------------------------------------------------------------+
```

- **Wejście:** Kliknięcie selektora receptury w Krok 1 na ekranie głównym.
- **Konfiguracja:** Przefiltrowanie listy lub przejście do `RecipeBuilderScreen` / `ImportRecipeModal` / `QrScannerModal`.
- **Wynik/Przeliczenie:** Dynamiczne przeliczenie `calculateBrewRatio` oraz serializacja kroków do `stepsJson` (lub URI `napar://recipe?...`).
- **Egzekucja/Zapis:** Zapis rekordu w tabeli `recipes` i zamknięcie modala.

#### 3. Wskazanie tarć poznawczych (Friction Points)
- **Brak filtra pierwszego rzędu "Klasyki / Ulubione / Własne" oraz wyszukiwarki w katalogu:** W `RecipeSelectModal` znajdują się jedynie zakładki `Wszystkie / Kawa / Herbata`, brakuje natomiast szybkiego przełącznika podzbiorów (`Wszystkie / Klasyki / Ulubione / Własne`), pola wyszukiwania tekstowego oraz zwijanych kategorii metod.
- **Ściana kart bez grupowania:** Wszystkie receptury renderowane są w jednej płaskiej liście, co utrudnia szybki wybór przy kilkunastu przepisach.

---

### Przepływ 5: Spiżarnia Ziaren i Liści oraz Kompendium Wiedzy (`app/(tabs)/beans.tsx`)

#### 1. Kiedy używasz
Gdy kupujesz nową paczkę kawy specialty lub herbaty liściastej, chcesz śledzić jej okno odgazowania po wypale (*Resting Window*: degassing / peak / aging), sprawdzić ile gramów pozostało w paczce lub skorzystać z encyklopedii odmian botanicznych (`BeanCompendiumModal`).

#### 2. Sekwencja kroków (1 → 2 → 3 → 4)

```text
+-------------------------------------------------------------------------+
| [1. WEJŚCIE] Karta "Spiżarnia" (app/(tabs)/beans.tsx)                   |
| Przegląd paczek lub otwarcie [+ Dodaj] / [📖 Kompendium]                |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
| [2. KONFIGURACJA] Wprowadzenie danych paczki (BeanAddModal)             |
| Nazwa, palarnia, data palenia, waga (np. 250g), cena, odmiana, obróbka  |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
| [3. WYNIK / PRZELICZENIE] Wyliczenie okna świeżości (Resting Window)    |
| evaluateRestingWindow() -> Dzień po wypale, status Peak/Degassing/Aging |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
| [4. EGZEKUCJA / ZAPIS] Zapis paczki lub kliknięcie [Parz z tych ziaren] |
| Przekazanie wybranej paczki do kontekstu parzenia i przejście do Krok 1 |
+-------------------------------------------------------------------------+
```

- **Wejście:** Wejście na zakładkę `Spiżarnia` w dolnym pasku nawigacji.
- **Konfiguracja:** Wypełnienie formularza `BeanAddModal` ręcznie lub jednym kliknięciem z szablonu `BeanCompendiumModal`.
- **Wynik/Przeliczenie:** Wyznaczenie statusu odgazowania (`evaluateRestingWindow`) i prezentacja pozostałej gramatury.
- **Egzekucja/Zapis:** Kliknięcie `Parz z tych ziaren` ustawia paczkę w `BrewContext` i przenosi na ekran parzenia.

#### 3. Wskazanie tarć poznawczych (Friction Points)
- **Pasywna lista "mikro-ERP" zamiast proaktywnego harmonogramu świeżości:** Użytkownik widzi statyczną listę paczek z tekstem statusu, ale nie widzi na osi czasu (np. na 14-dniowym kalendarzu), kiedy konkretna paczka wejdzie w szczyt smaku (*Peak Window*), kiedy skończy się odgazowanie ani które ziarna wymagają zaparzenia w pierwszej kolejności.
- **Rozbudowany formularz magazynowy:** Formularz dodawania paczki eksponuje jednocześnie wiele pól katalogowych (kraj, odmiana, obróbka, wysokość, cena, waga, nuty), co przypomina system magazynowy ERP zamiast szybkiej rejestracji paczki.

---

### Przepływ 6: Dziennik Degustacji i Analityka Sensoryczna (`app/(tabs)/journal.tsx`)

#### 1. Kiedy używasz
Gdy chcesz przejrzeć historię dotychczasowych parzeń, porównać oceny i profile sensoryczne, odtworzyć udany przepis jednym tapnięciem (`Parz ponownie`), wyeksportować notatkę albo zaplanować kolejną sesję/cupping.

#### 2. Sekwencja kroków (1 → 2 → 3 → 4)

```text
+-------------------------------------------------------------------------+
| [1. WEJŚCIE] Karta "Dziennik" (app/(tabs)/journal.tsx)                  |
| Przełącznik widoku: [Historia Sesji] / [Analityka & Smak]               |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
| [2. KONFIGURACJA] Wyszukiwanie i filtrowanie wpisów                     |
| Pole szukania + chipy: [Wszystkie] / [Kawa] / [Herbata] / [★ 4.5+]      |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
| [3. WYNIK / PRZELICZENIE] Karta sesji lub zagregowany Radar Sensoryczny |
| Obliczenie EY%, statystyk zużycia wody/ziaren i wykresu radarowego      |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
| [4. EGZEKUCJA / ZAPIS] Kliknięcie [Parz ponownie] lub [Udostępnij]      |
| Załadowanie parametrów sesji do ekranu Parzenia i start nowej ekstrakcji|
+-------------------------------------------------------------------------+
```

- **Wejście:** Otwarcie karty `Dziennik` w dolnym pasku nawigacji.
- **Konfiguracja:** Filtrowanie historii lub przełączenie na widok `JournalAnalyticsView`.
- **Wynik/Przeliczenie:** Prezentacja kart `JournalSessionCard` z balansem smaku, kosztami porcji i wyliczonym `Extraction Yield (EY%)`.
- **Egzekucja/Zapis:** Kliknięcie `Parz ponownie` (`handleBrewAgain`) kopiuje recepturę, ziarna, dozę, wodę, temperaturę i ustawienie młynka bezpośrednio do ekranu głównego.

#### 3. Wskazanie tarć poznawczych (Friction Points)
- **Wyłącznie retrospektywny charakter (pasywne archiwum):** Ekran Dziennika patrzy wyłącznie w przeszłość. Brakuje na jego szczycie **14-dniowego interaktywnego Kalendarza** oraz **Harmonogramu Akcji (`[⚡ Najbliższe]` / `[📅 Wszystkie]`)**, który łączyłby historię sesji z proaktywnymi akcjami na dziś, jutro i kolejne dni (np. zaplanowane powtórki parzeń, moment wejścia kawy ze spiżarni w okno *Peak*, cupping porównawczy czy eksport przypomnienia `.ics` do kalendarza systemowego).

---

### Przepływ 7: Diagnostyka Ekstrakcji i Kalkulatory Warsztatowe (`app/(tabs)/dialin.tsx`)

#### 1. Kiedy używasz
Gdy napar wyszedł zbyt kwaśny, gorzki lub wodnisty i szukasz deterministycznej korekty mielenia/temperatury (*Dial-in Doctor*), albo gdy chcesz przeliczyć proporcje `Ratio & Uzysk`, `TDS & EY%` czy mineralizację wody (`Chemia Wody SCA`).

#### 2. Sekwencja kroków (1 → 2 → 3 → 4)

```text
+-------------------------------------------------------------------------+
| [1. WEJŚCIE] Karta "Warsztat" (app/(tabs)/dialin.tsx)                   |
| Wybór narzędzia: [Dial-in Doctor] [Ratio] [TDS & EY%] [Chemia Wody]     |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
| [2. KONFIGURACJA] Wskazanie defektu smaku lub wpisanie pomiaru TDS      |
| Wybór kafelka (np. "Za kwaśna") lub podanie dozy/uzysku/TDS             |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
| [3. WYNIK / PRZELICZENIE] Diagnoza kompasu ekstrakcji / Wyliczenie EY%  |
| Wskazanie: "Zmiel drobniej o 2-3 kliki, podnieś temp. o +2°C"           |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
| [4. EGZEKUCJA / ZAPIS] Przejście do Kofeinometru lub powrót do Parzenia |
| Zastosowanie korekty w kolejnej sesji parzenia                          |
+-------------------------------------------------------------------------+
```

- **Wejście:** Wybór zakładki `Warsztat` w dolnej nawigacji.
- **Konfiguracja:** Wybór jednej z 4 podzakładek warsztatowych i wprowadzenie obserwacji sensorycznych lub refraktometrycznych.
- **Wynik/Przeliczenie:** Silnik reguł (`diagnoseExtractionTaste`, `calculateExtractionYield`, `evaluateWaterQuality`) zwraca rekomendację.
- **Egzekucja/Zapis:** Użytkownik ręcznie zapamiętuje korektę i wraca na zakładkę `Parzenie`.

#### 3. Wskazanie tarć poznawczych (Friction Points)
- **Duplikacja informacji między ekranami (naruszenie DRY w UI):**
  - *Dial-in Doctor* występuje zarówno w modalu końcowym parzenia (`BrewFinishModal`), jak i jako osobna zakładka w `Warsztacie`.
  - Wybór profilu wody SCA znajduje się zarówno w `BrewProAccordion` na ekranie głównym, w `BrewFinishModal`, jak i w zakładce `Chemia Wody` w `Warsztacie`.
  - Kalkulator `Ratio` dubluje przelicznik z ekranu głównego parzenia.

---

### Przepływ 8: Monitor Kofeiny i Kalkulator Bezpiecznego Snu (`app/(tabs)/caffeine.tsx`)

#### 1. Kiedy używasz
Gdy chcesz sprawdzić, ile aktywnej kofeiny krąży obecnie w Twoim krwiobiegu (według modelu rozpadu wykładniczego $t_{1/2}$), o której godzinie przypada *Caffeine Curfew* (ostatnia bezpieczna filiżanka przed snem) oraz jaki jest dobowy bilans względem limitu EFSA (400 mg).

#### 2. Sekwencja kroków (1 → 2 → 3 → 4)

```text
+-------------------------------------------------------------------------+
| [1. WEJŚCIE] Otwarcie Monitora Kofeiny (z Warsztatu lub Ustawień)       |
| Odczyt dzisiejszych wpisów z tabeli caffeine_logs                       |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
| [2. KONFIGURACJA] Szybkie dodanie napoju lub korekta godziny snu (23:00)|
| Regulacja biologicznego półokresu eliminacji t1/2 (3.0h - 8.0h)         |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
| [3. WYNIK / PRZELICZENIE] Krzywa farmakokinetyczna i prognoza na sen    |
| Wyliczenie aktualnych mg, godziny Curfew i resztkowej kofeiny o 23:00   |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
| [4. EGZEKUCJA / ZAPIS] Zapis wpisu w SQLite + opcjonalny HealthKit sync |
| Aktualizacja wykresu i ostrzeżenia zdrowotnego                          |
+-------------------------------------------------------------------------+
```

- **Wejście:** Przejście z karty `Warsztat` (baner na dole ekranu) do ukrytej trasy `/(tabs)/caffeine`.
- **Konfiguracja:** Zmiana docelowej godziny snu (`bedtimeHour`), półokresu rozpadu (`halfLifeHours`) lub szybkie dodanie wypitego napoju.
- **Wynik/Przeliczenie:** Obliczenie `calculateRemainingCaffeineMg`, `evaluateBedtimeCaffeine` oraz krzywej `CaffeineCurveChart`.
- **Egzekucja/Zapis:** Zapis w tabeli `caffeine_logs`.

#### 3. Wskazanie tarć poznawczych (Friction Points)
- **Zdublowane suwaki parametrów kofeiny:** Regulacja czasu półtrwania kofeiny ($t_{1/2}$) oraz docelowej godziny snu znajduje się zarówno na ekranie `app/(tabs)/caffeine.tsx`, jak i w `CaffeineSettingsCard` wewnątrz ekranu `Ustawienia`.

---

### Przepływ 9: Ustawienia, Kopia Zapasowa i Apps4Brew Pass (`app/settings.tsx`)

#### 1. Kiedy używasz
Gdy chcesz zmienić język (PL/EN), system jednostek (metryczny/imperialny), domyślny młynek, wyeksportować lub zaimportować pełną kopię zapasową JSON/CSV albo zarządzać dostępem Apps4Brew Pass.

#### 2. Sekwencja kroków (1 → 2 → 3 → 4)

```text
+-------------------------------------------------------------------------+
| [1. WEJŚCIE] Kliknięcie ikony w prawym górnym rogu -> Modal Ustawień    |
| Odczyt aktualnej konfiguracji z tabeli app_settings                     |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
| [2. KONFIGURACJA] Zmiana preferencji (Język, Jednostki, Młynek, Głos)   |
| Wybór akcji backupu: [Eksport JSON] / [Import JSON] / [Eksport CSV]     |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
| [3. WYNIK / PRZELICZENIE] Generowanie zrzutu bazy lub Safety Backup     |
| Automatyczny zapis safetyBackup() przed nadpisaniem bazy przy imporcie  |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
| [4. EGZEKUCJA / ZAPIS] Zapis w SQLite i odświeżenie kontekstów UI       |
| Natychmiastowa aktualizacja jednostek, języka i statusu subskrypcji     |
+-------------------------------------------------------------------------+
```

- **Wejście:** Dotknięcie przycisku `Ustawienia` w prawym górnym rogu nagłówka (`headerRight`).
- **Konfiguracja:** Przełączenie opcji sprzętowych, językowych lub otwarcie modala kopii zapasowej.
- **Wynik/Przeliczenie:** Serializacja całej bazy do JSON/CSV lub walidacja importowanego pliku.
- **Egzekucja/Zapis:** Zapis w SQLite i powrót do aplikacji.

#### 3. Wskazanie tarć poznawczych (Friction Points)
- **Ukrycie Ustawień w nagłówku zamiast w dolnym pasku nawigacji:** Ustawienia są otwierane jako modal z prawego górnego rogu, podczas gdy prawy górny róg powinien zawierać wyłącznie pojedynczy, czytelny przycisk pomocniczy `[🧭 Jak działa aplikacja?]`, a `⚙️ Ustawienia` powinny być stałą, ostatnią kartą w dolnym pasku nawigacji (`Bottom Tabs`).

---

## CZĘŚĆ II — AUDYT BUSINESS PROCESS REENGINEERING (BPR — ARCHITEKTURA TO-BE)

W oparciu o inwentaryzację As-Is przeprowadzono reengineering procesów według 5 filarów Lean UX / BPR:

### 1. Eliminacja duplikatów (DRY w UI)
- **Scalenie filtrów katalogu receptur:** W `RecipeSelectModal` wprowadzamy ujednolicony filtr pierwszego rzędu łączący podzbiory **`[⭐ Klasyki i Ulubione]` / `[📚 Wszystkie]` / `[✍️ Własne Presety]`**, wyszukiwarkę tekstową oraz **zwijane kategorie metod** (np. *Pour-Over / Drip*, *Immersion & AeroPress*, *Herbata & Gongfu Cha*), eliminując ścianę niepogrupowanych kart.
- **Ujednolicenie wyboru ziaren i przewodników:** Zamiast rozproszonych wskazówek na ekranie głównym wprowadzamy pojedynczy, nierozpychający ekranu baner **„Złote Zasady Ekstrakcji”** na górze ekranu głównego oraz zwięzły modal przewodnika **`[🧭 Jak działa aplikacja?]`** wywoływany z prawego górnego rogu nagłówka.

### 2. Odchudzenie nawigacji i nagłówków (Zero Clutter Header)
- **Prawy górny róg (`headerRight`):** Całkowicie usuwamy ikonę ustawień i drobne ikonki z nagłówków. Zostaje wyłącznie **1 czytelny przycisk pomocniczy**: **`[🧭 Jak działa aplikacja?]`** otwierający `AppGuideModal` (zwięzły przewodnik po 4 krokach parzenia i ekranach aplikacji).
- **Dolny pasek nawigacji (`Bottom Tabs`):** Przenosimy **`⚙️ Ustawienia`** jako dedykowaną, ostatnią kartę dolnego paska nawigacji (`Parzenie` → `Spiżarnia` → `Dziennik` → `Warsztat` → `Ustawienia`).

### 3. Odwrócenie sekwencji głównego procesu na naturalny ciąg przyczynowo-skutkowy (1 → 2 → 3 → 4)
Ekran główny (`app/(tabs)/index.tsx`) zostaje uporządkowany w 4 wyraźnie oznakowane, sekwencyjne bloki przyczynowo-skutkowe:
- **KROK 1: Co parzymy?** — Wybór receptury/szablonu (otwierający skonsolidowany katalog z filtrem *Klasyki / Ulubione / Własne*, wyszukiwarką i zwijanymi kategoriami) oraz opcjonalny wybór paczki ziaren/liści ze spiżarni.
- **KROK 2: Parametry wejściowe** — Liczba porcji (`1x`, `2x`, `3x`), gramatura dozy (`g`), masa wody (`g` / `ml`) oraz temperatura wody (`°C` / `°F`).
- **KROK 3: Przeliczone wyniki i proporcje na żywo** — Wyliczone w czasie rzeczywistym `Ratio` (np. `1:16.7`), rekomendowane nastawy młynka (`kliki` dla wybranego modelu), podgląd harmonogramu zalań oraz zwinięty akordeon *Woda & TDS*.
- **KROK 4: Egzekucja procedury** — Wyrazisty przycisk główny **`[▶ OTWÓRZ ASYSTENTA PROCEDURY KROK PO KROKU]`**, który otwiera pełnoekranowy **`ProcedureModal`**.

### 4. Automatyzacja wykonania w Asystencie Procedury (`ProcedureModal` — Zero-Click Context Tools)
- Tworzymy pełnoekranowy komponent **`ProcedureModal`** (`src/components/brew/ProcedureModal.tsx`), który prowadzi użytkownika przez kolejne kroki wybranej receptury.
- **Automatyczne parsowanie czasu i auto-start stopera:** Funkcja domenowa `parseStepDurationSeconds(text, fallbackSeconds)` automatycznie rozpoznaje czas z opisu kroku (np. `"przez 45 s"`, `"odczekaj 30 sekund"`, `"przez 2–3 minuty"`, `"10-15 min"`) lub przyjmuje zdefiniowany czas kroku i **automatycznie uruchamia odliczanie natychmiast po wejściu w dany krok** (Zero-Click).
- **Wbudowane narzędzia kontekstowe w kroku:** Przyciski szybkiej korekty czasu na żywo **`[-1 min]`**, **`[-10 s]`**, **`[⏸ Pauza / ▶ Wznów]`**, **`[+10 s]`**, **`[+1 min]`**, **`[↺ Reset]`** oraz podgląd docelowej masy wody na wadze (`Zalej do: X g`).
- **Jednoznaczny finał na ostatnim kroku:** Na ostatnim kroku procedury główny przycisk na dole ekranu zmienia się na jednoznaczne **`[✓ Zakończ i zapisz sesję]`**, przechodząc bezpośrednio do karty oceny i zapisu (`BrewFinishModal`).

### 5. Przekształcenie pasywnych list w Proaktywny Kalendarz i Harmonogram Akcji (1-Tap Action Feed)
- Na górze ekranu monitoringu i historii (`app/(tabs)/journal.tsx`) dodajemy **14-dniowy interaktywny Kalendarz** (`ProactiveActionCalendar`) z kolorowymi kropkami oznaczającymi dni wymagające akcji lub z wykonanymi sesjami:
  - 🟢 **Kropka miedziana/zielona:** Zaplanowana akcja świeżości (np. wejście ziaren ze Spiżarni w okno *Peak Window*, koniec odgazowania, zaplanowane parzenie / cupping kontrolny).
  - 🔵 **Kropka bursztynowa:** Dzień z zarejestrowanymi sesjami parzenia w Dzienniku.
- Bezpośrednio pod kalendarzem umieszczamy **Harmonogram Akcji** z przełącznikiem **`[⚡ Najbliższe]` / `[📅 Wszystkie]`** w układzie chronologicznym (**`DZIŚ`**, **`JUTRO`**, **`Za X dni`**):
  - Każda pozycja posiada przycisk **`[▶ Wykonaj 1-Tap]`** (ładujący natychmiast odpowiednie ziarna i recepturę do ekranu Parzenia bez otwierania szczegółów rekordu) oraz przycisk **`[📅 .ics]`** eksportujący/udostępniający przypomnienie w standardzie iCalendar (`VCALENDAR` / `.ics`) do systemowego Kalendarza.
- W formularzu Spiżarni (`BeanAddModal`) upraszczamy wprowadzanie nowej paczki: wymagana jest wyłącznie nazwa i waga początkowa, a zaawansowane metadane botaniczne (wysokość, region, obróbka, cena) są opcjonalne i zwinięte domyślnie, eliminując tarcie „mikro-ERP”.

---

## CZĘŚĆ III — TABELA PORÓWNAWCZA AS-IS VS TO-BE

| Obszar / Proces | Stan As-Is (Przed BPR) | Stan To-Be (Po transformacji BPR) | Korzyść UX / Lean |
| :--- | :--- | :--- | :--- |
| **Górny nagłówek (`headerRight`)** | Przycisk `⚙️ Ustawienia` w prawym górnym rogu; brak szybkiego przewodnika po aplikacji; akcje QR wymieszane w karcie. | Zero Clutter Header: wyłącznie 1 czytelny przycisk **`[🧭 Jak działa aplikacja?]`** w prawym górnym rogu + kompaktowy baner **„Złote Zasady”** na górze ekranu. | Czysta hierarchia wizualna i natychmiastowa pomoc kontekstowa. |
| **Dolna nawigacja (`Bottom Tabs`)** | 4 karty (`Parzenie`, `Spiżarnia`, `Dziennik`, `Warsztat`), a `Ustawienia` ukryte jako modal. | 5 czytelnych kart z **`⚙️ Ustawienia`** jako dedykowaną ostatnią kartą dolnego paska nawigacji. | Spójna i przewidywalna nawigacja pierwszorzędowa. |
| **Katalog receptur (`RecipeSelectModal`)** | Płaska lista przepisów z podziałem tylko na Kawa/Herbata; brak wyszukiwarki i brak filtra Ulubionych/Klasyków. | Filtr 1. rzędu **`[⭐ Klasyki i Ulubione]` / `[📚 Wszystkie]` / `[✍️ Własne]`**, wyszukiwarka oraz **zwijane kategorie metod**. | Brak „ściany przycisków”, wybór receptury w < 3 sekundy. |
| **Główny ekran (`app/(tabs)/index.tsx`)** | Brak wyraźnego podziału na etapy; przełączanie widoku w miejscu po starcie parzenia. | Jawny ciąg przyczynowo-skutkowy **Krok 1 → Krok 2 → Krok 3 → Krok 4** prowadzący do pełnoekranowego `ProcedureModal`. | Naturalny przepływ myślowy od surowca do egzekucji. |
| **Egzekucja procedury (`ProcedureModal`)** | Ręczne sterowanie czasem bez parsera tekstowego i bez szybkich korekt `-1 min / +1 min`. | Pełnoekranowy **Asystent Procedury Krok po Kroku** z auto-parsowaniem czasu z opisu, **auto-startem stopera po wejściu w krok**, korektą `-1m / -10s / +10s / +1m / Reset` i przyciskiem `Zakończ i zapisz`. | Zero-Click Context Tools — wolne ręce podczas zalewania wodą. |
| **Monitoring i Dziennik (`journal.tsx` / `beans.tsx`)** | Pasywne archiwum sesji oraz statyczna lista paczek z rozbudowanym formularzem „mikro-ERP”. | **14-dniowy interaktywny Kalendarz** z kropkami statusu + **Harmonogram Akcji (`DZIŚ`, `JUTRO`, `Za X dni`)** z `1-Tap Execute`, eksportem `.ics` i odchudzonym formularzem paczki. | Przejście z pasywnego rejestru na proaktywnego asystenta świeżości i parzenia. |

# Kontrakt zakresu Napar 1.0

**Status:** przebudowany 2026-11-15 po naprawach audytu M1 (D-010: kontrakt od nowa i krótka errata BRD). Funkcje z §3 czekają na decyzję właściciela; do tego czasu kontrakt opisuje stan kodu, a nie zatwierdzony zakres w całości.
**Rejestr decyzji:** `docs/decyzje.md` (ID `D-nnn`). „DEC-nn” w wierszach ZM-01…ZM-03 to decyzje audytu M1 (D-0nn w rejestrze); „BRD DEC-nn” to historyczny wiersz BRD 0.1, część 00b.
**Wymagania:** BRD 0.1 w `napar_brd/` z erratą w części 00c (ER-01…ER-06). Każde obowiązujące BR ma tu jedną decyzję (§1) albo wiersz „bez decyzji” (§3); BR ze statusem „wycofane z 1.0” (ER-03) mają wiersz na liście odcięć (§2).
**Kontrola:** `tests/audit-fixes.test.tsx`, blok „M1-audytor-generalny-038” (część `npm run verify`). *Dlaczego:* poprzednia wersja powoływała się na około 100 nieistniejących wymagań i nikt tego nie sprawdzał.

---

## 1. Główna praca, pętla główna i funkcje 1.0

- Główna praca: J-01 (BRD 00c, ER-06) — zaparzyć dziś dobrą kawę specialty albo herbatę liściastą bez liczenia w głowie, a gdy wyszła źle, wiedzieć, co zmienić następnym razem.
- Pętla główna: F-27, F-22, F-20 (przepis i młynek) → F-28, F-04 (ziarna, doza i woda) → F-01, F-02 (kawa) albo F-06 (herbata) → F-14, F-29 (zapis i ocena) → F-19 (korekta) → F-14 (powtórz z dziennika); przekrojowo F-13 (dostępność).

Decyzje: `MVP` (1.0), `PÓŹNIEJ` (wartość jest, poza 1.0; „Powrót:”), `TEST` (tylko hipoteza; „Test:”), `NIE` (powód i „Powrót:”). Podłoga: kontrola bezpieczeństwa, dostęp do własnych danych albo obowiązek prawny, które wypadają tylko razem z funkcją. WTP: 1.0 jest darmowa w całości (D-001), więc kolumny WTP nie ma.

| ID | Funkcja | Decyzja | Wymagania | Dowód wartości | Intuicyjność | Podłoga | Zależy od | Gdzie w kodzie | Uzasadnienie |
|---|---|---|---|---|---|---|---|---|---|
| F-01 | Prowadzony stoper parzenia: start przyciskiem „Rozpocznij parzenie”, pauza, wznowienie, korekta ±10 i ±60 s, reset z potwierdzeniem; ekran nie gaśnie; po powrocie do aplikacji czas dogania znaczniki | MVP | BR-PARZ-001, BR-PARZ-004, BR-PARZ-006 | — | Na ekranie kroków jeden wyróżniony przycisk startu; czas rusza dopiero nim. wynik: brak (przejście poznawcze roli 04 nieodbyte) | — | — | `src/components/brew/ProcedureModal.tsx`, `src/core/timer-engine.ts` | Rdzeń pętli. D-013: jeden ekran prowadzenia, bez cichego startu. Dryf czasu: NFR-WYD-003. |
| F-02 | Asystent Parzenia i Timery: kroki zalania z celem wody kroku i paskiem postępu, sygnał dźwięku i wibracji przy zmianie etapu na pierwszym planie | MVP | BR-PARZ-002, BR-PARZ-003 | — | Nazwa i cel wody bieżącego kroku widoczne bez przewijania; następny krok ogłoszony dźwiękiem i wibracją. wynik: brak | — | F-01 | `src/components/brew/ProcedureModal.tsx`, `src/core/signals.ts` | Przy zablokowanym ekranie albo w innej aplikacji etap mija bez sygnału (KILL-09, D-008). |
| F-04 | Doza, woda i proporcja przeliczane w obie strony na ekranie Parzenie; ten sam przelicznik w Warsztacie → Ratio | MVP | BR-KALK-001 | — | Zmiana dozy od razu zmienia wodę przy stałej proporcji; przyciski − i + przy liczbach. wynik: brak | — | — | `src/components/brew/BrewQuickPrepCard.tsx`, `src/components/dialin/BrewRatioTab.tsx` | Krok pętli przed stoperem. |
| F-06 | Gongfu: kolejne zalania herbaty z wydłużaniem czasu, pauza, wznowienie i zakończenie z rzeczywistym czasem | MVP | BR-PARZ-005 | — | Wejście przyciskiem Gongfu w nagłówku ekranu Parzenie; numer zalania i czas widoczne na stoperze. wynik: brak | — | — | `app/gongfu.tsx`, `src/core/gongfu-session.ts` | Herbata jest częścią J-01; jedna aplikacja dla kawy i herbaty (BRD DEC-03). |
| F-10 | Dane użytkownika: eksport i import JSON, eksport CSV, kopie rotacyjne (pule automatyczna i ratunkowa po 10 plików), zrzut stanu przy błędzie bazy z banerem, tryb awaryjny po pętli awarii | MVP | BR-DANE-001 (eksport i import; część „iCloud Drive”: F-38 w §3) | — | Ustawienia → sekcja danych z przyciskami eksportu i importu; baner po błędzie mówi, gdzie leży zrzut. wynik: brak | dane: odczyt, eksport, import, kopia | — | `src/components/settings/DataBackupCard.tsx`, `src/core/backup.ts`, `src/components/SafeModeView.tsx` | Zasada zerowej utraty danych (CLAUDE.md §2 pkt 6). Eksport CSV z ochroną przed formułami. |
| F-12 | Język (PL, EN) i jednostki (metryczne albo imperialne: °C/°F, g/oz); domyślnie z regionu urządzenia | MVP | BR-JEDN-001 | — | Ustawienia → Preferencje: dwa przełączniki z nazwami w języku użytkownika; zmiana widoczna od razu w pętli. wynik: brak | — | — | `src/components/settings/AppPreferencesCard.tsx`, `lib/region-units.ts` | D-003: w 1.0 polski i angielski (Z-180). D-015: zadanie 034 (°F w trybie imperialnym w głównym przepływie). |
| F-13 | Dostępność: etykiety i role VoiceOver, zapowiedź etapów stopera, haptyka, wyłączniki dźwięku, wibracji i głosu | MVP | BR-DOST-001 | — | Każdy element dotykowy ma etykietę VoiceOver; wyłączniki w Ustawieniach → Preferencje. wynik: brak | prawo: CLAUDE.md §2 pkt 4 (NFR-DOST-001, NFR-DOST-002) | F-01 | `lib/announce.ts`, `src/components/settings/AppPreferencesCard.tsx` | D-015: zadania 028–031 (kontrast, cele dotykowe, dźwięk, VoiceOver). |
| F-14 | Dziennik: automatyczny zapis sesji z oceną i notatką, historia z filtrem, „Parz ponownie”, usuwanie wpisu z potwierdzeniem | MVP | BR-DZIEN-001, BR-DZIEN-002, BR-DZIEN-004 | — | Po zakończeniu parzenia okno oceny otwiera się samo; wpis widać od razu w zakładce Dziennik. wynik: brak | dane: odczyt historii, usunięcie z potwierdzeniem (`lib/confirm.ts`) | F-01 | `src/components/brew/BrewFinishModal.tsx`, `app/(tabs)/journal.tsx` | Zapis i powrót do udanego naparu zamykają pętlę. |
| F-16 | Kofeina: dziennik spożycia (z parzenia i szybkie dodanie), licznik dobowy, krzywa stężenia w ciągu dnia | MVP | BR-KOF-001, BR-KOF-004 | — | Wejście z Warsztatu kartą „Kofeina” (zakładka ukryta, 03-zakres-009); szybkie dodanie jednym dotknięciem. wynik: brak | bezpieczeństwo: zastrzeżenie medyczne w słownikach PL i EN, bez porad ponad źródła (D-005) | — | `app/(tabs)/caffeine.tsx`, `src/core/caffeine-chart.tsx` | D-005: zostaje szacunek z zastrzeżeniem; D-004: bez Apple Health (KILL-08). |
| F-17 | Szacunek kofeiny w organizmie o porze snu, bez progu i oceny; czas półtrwania 4 h, do zmiany w zakresie 2–8 h | MVP | BR-KOF-003 | — | Karta na ekranie Kofeina pokazuje liczbę mg o wybranej godzinie snu i zastrzeżenie. wynik: brak | bezpieczeństwo: szacunek bez progu i bez oceny snu (D-005) | F-16 | `src/components/caffeine/BedtimeCurfewCard.tsx` | D-005 (wybór a, rozstrzygnięty źródłami). |
| F-19 | Dial-in Doctor: porada jednej zmiany po ocenie smaku w oknie zapisu, stałe wskazówki na ekranie Parzenie, Warsztat → Doctor | MVP | H-01 (BRD C1 bez BR; ER-06) | — | W oknie zapisu cztery przyciski smaku („kwaśna”, „gorzka”, „słaba”, „zbalansowana”) i jedna porada. wynik: brak | — | F-14 | `src/components/brew/BrewFinishModal.tsx`, `src/components/brew/BrewBanners.tsx`, `app/(tabs)/dialin.tsx` | Korekta następnego parzenia to druga połowa J-01. Algorytm deterministyczny (BRD DEC-07, KILL-03). |
| F-20 | Młynek: wybór młynka, nastawa w klikach przy przepisie, przelicznik nastaw między młynkami | MVP | BR-MLYNEK-001 | — | Pigułka „MŁYNEK” na ekranie Parzenie otwiera listę młynków; nastawa widoczna przy przepisie. wynik: brak | — | — | `src/components/brew/GrinderSelectModal.tsx`, `src/components/dialin/GrinderConverterCard.tsx`, `src/core/grinder-converter.ts` | Nastawa młynka to parametr przepisu. |
| F-22 | Własne przepisy: kreator przepisu wieloetapowego | MVP | H-02 (bez BR; ER-06) | — | Wejście z wyboru przepisu; zapis w prawym rogu nagłówka. wynik: brak | — | F-27 | `app/recipe-builder.tsx` | Własny przepis jest źródłem przepisu w pętli. |
| F-27 | Biblioteka 24 przepisów bazowych | MVP | BR-MAG-005 | — | Przycisk zmiany przepisu w nagłówku ekranu Parzenie; lista z nazwą metody. wynik: brak | — | — | `src/core/recipes-data.ts`, `src/components/brew/RecipeSelectModal.tsx` | Pierwszy krok pętli (BRD DEC-06). |
| F-28 | Magazyn ziaren i herbat: kartoteka paczek, odliczanie dozy po parzeniu, archiwum, usuwanie paczki z potwierdzeniem | MVP | BR-MAG-001, BR-MAG-003, BR-MAG-004 | — | Wybór paczki na ekranie Parzenie; ubytek widoczny po zapisie w zakładce Spiżarnia. wynik: brak | dane: usunięcie z potwierdzeniem (`lib/confirm.ts`) | — | `app/(tabs)/beans.tsx`, `src/components/brew/InventorySelectModal.tsx` | Opcjonalny krok pętli: parzenie działa też bez paczki. |
| F-29 | Profil sensoryczny przy zapisie: koło smaków i wykres radarowy, także w karcie wpisu dziennika | MVP | BR-DZIEN-003 | — | Koło smaków w oknie zapisu, wybór dotknięciem; pole można pominąć. wynik: brak | — | F-14 | `src/core/flavor-wheel-picker.tsx`, `src/core/radar-chart.tsx` | Część zapisu wyniku w pętli. |
| F-34 | Zakupy w aplikacji (StoreKit 2, Family Sharing) | PÓŹNIEJ | BR-ZAK-001 | — | — | — | — | brak kodu (usunięty 2026-11-13) | D-001: 1.0 całkowicie darmowa, kod zakupów usunięty (ER-01). Powrót: decyzja właściciela o modelu płatnym (wariant z D-014: wcześni użytkownicy zachowują pełny dostęp), prawdziwy StoreKit z testem zakupu i przywrócenia na urządzeniu, nowy wiersz ZM. |

---

## 2. Lista odcięć (KILL)

| Identyfikator | Funkcja wycięta | Wersja docelowa | Przyczyna i warunek powrotu | Decyzja (ID, data) |
| :--- | :--- | :---: | :--- | :--- |
| **KILL-01** | Komunikacja Bluetooth z wagami (Acaia, Felicita, Timemore) | **v1.2** | Brak sprzętu do testów, rozproszone protokoły BLE; w 1.0 wagę wpisuje się ręcznie. Powrót: biblioteka BLE z licencją zgodną z `check:licenses`, co najmniej jedna waga do testów na urządzeniu, uprawnienie Bluetooth w etykiecie prywatności i nowy wiersz ZM. | D-016, 2026-10-24 (słowa właściciela [DO USTALENIA]) |
| **KILL-02** | Moduł społecznościowy i współdzielenie w chmurze | **nigdy** | Sprzeczne z zasadą zero telemetrii i pracą offline (CLAUDE.md §2 pkt 5). Powrót: tylko po zmianie tej zasady decyzją właściciela i nowym wierszu ZM. | D-016, 2026-10-24 (słowa właściciela [DO USTALENIA]) |
| **KILL-03** | Czaty LLM i asystenci generatywni | **nigdy** | Ryzyko błędnych porad i potrzeba sieci; korektę daje deterministyczny Dial-in Doctor (F-19). Powrót: tylko po zmianie zasady offline decyzją właściciela i nowym wierszu ZM. | D-016, 2026-10-24 (słowa właściciela [DO USTALENIA]) |
| **KILL-04** | Automatyczne zamawianie ziaren ze sklepów internetowych | **v2.0+** | Inna praca niż J-01, wymaga sieci i partnerów. Powrót: praca J z dowodem (rozmowy albo recenzje) i nowy wiersz ZM. | D-016, 2026-10-24 (słowa właściciela [DO USTALENIA]) |
| **KILL-05** | Rozpoznawanie etykiet kawy przez chmurowy OCR | **v1.2** | Wymagałoby serwera. Powrót: rozpoznawanie na urządzeniu bez sieci, test na 20 etykietach i nowy wiersz ZM. | D-016, 2026-10-24 (słowa właściciela [DO USTALENIA]) |
| **KILL-06** | ActivityKit Live Activity i Dynamic Island (BR-ZEG-003, BR-ZEG-004; w BRD status „wycofane z 1.0”, ER-03) | **v1.2** | Brak natywnego targetu WidgetKit w projekcie Expo. Kod `src/core/live-activity.ts` (bez wywołania z interfejsu) usunięty 2026-11-13 (ZM-01, D-002); do odzyskania z historii git (commit `9f04c7b`). Powrót: build deweloperski z natywnym targetem, test na urządzeniu z zablokowanym ekranem i nowy wiersz ZM. | D-016, 2026-10-24 (słowa właściciela [DO USTALENIA]); kod: D-002, 2026-11-13 |
| **KILL-07** | Aplikacja na Apple Watch z haptyką (BR-ZEG-001, BR-ZEG-002; w BRD status „wycofane z 1.0”, ER-03) | **v1.2** | Wymaga natywnego projektu watchOS. Powrót: natywny target watchOS, zegarek do testów i nowy wiersz ZM. | D-016, 2026-10-24 (słowa właściciela [DO USTALENIA]) |
| **KILL-08** | Zapis kofeiny do Apple Health (BR-KOF-002; w BRD status „wycofane z 1.0”, ER-03) | **v1.2** | Wymaga natywnego mostka HealthKit z uprawnieniami; w 1.0 dane kofeiny tylko w lokalnym SQLite. Przełącznik w Ustawieniach, zaślepka `src/core/healthkit.ts` i obietnice Apple Health na stronie, w polityce prywatności i README usunięte 2026-11-14 (ZM-02); do odzyskania z historii git (commit `071d947`). Powrót: działający zapis do Zdrowia na urządzeniu (moduł natywny, uprawnienie `NSHealthUpdateUsageDescription` dopuszczone w `scripts/verify-native.mjs`, etykieta prywatności) i nowy wiersz ZM z decyzją właściciela. | D-004, 2026-11-13 |
| **KILL-09** | Powiadomienia lokalne o etapach parzenia przy aplikacji w tle lub zablokowanym ekranie (dawny wiersz „Powiadomienia i Zegar Delta”, `BR-ZEG-006..010`, których nie ma w BRD); razem z nimi profil Cold Brew z powiadomieniem po maceracji (Z-017) | **v1.2** | Funkcja nie istniała w kodzie (brak `expo-notifications`, planowania powiadomień i `UIBackgroundModes`); wymagałaby nowej zależności, prośby o zgodę na powiadomienia i testów na urządzeniu. W v1.0 zostaje dźwięk i wibracja na pierwszym planie oraz ekran bez wygaszania; po ręcznej blokadzie telefonu albo przejściu do innej aplikacji etap mija bez sygnału. Wykreślone 2026-11-15 (ZM-03); wersja docelowa za rekomendacją 03-zakres-008 (razem z Live Activity, KILL-06). Z-017 dołączony 2026-11-15 według rekomendacji (1) z 01-odkrywanie-021, bo zależy od tej samej zgody na powiadomienia. Powrót: czysta funkcja harmonogramu powiadomień na bezwzględne daty etapów z testami anulowania przy pauzie i resecie, zależność `expo-notifications` z wierszem w inwentarzu prywatności, `android.permission.POST_NOTIFICATIONS` dopuszczone w `scripts/verify-native.mjs`, prośba o zgodę zaprojektowana przez rolę 04, test na urządzeniu z zablokowanym ekranem i nowy wiersz ZM z decyzją właściciela. | D-008, 2026-11-13 |

---

## 3. Funkcje bez decyzji zakresu (do decyzji właściciela)

Funkcje działające w kodzie albo wymagane przez BRD, dla których nie ma decyzji właściciela ani dowodu wartości wystarczającego do MVP. Kod zostaje bez zmian do decyzji; zmiana kodu po decyzji to zadanie dla roli 08 z planem zachowania danych (zasada zerowej utraty danych). Rekomendacja roli 03 według zasady „tylko funkcje z wartością i intuicyjne”.

| ID | Funkcja | Wymagania | Gdzie w kodzie | Dowód wartości | Opcje dla właściciela | Rekomendacja |
|---|---|---|---|---|---|---|
| F-05 | Ekstrakcja: kalkulator TDS i EY (Warsztat → EY) oraz pole TDS w oknie zapisu | BR-KALK-002 | `src/components/dialin/ExtractionYieldTab.tsx`, `src/components/brew/BrewFinishModal.tsx` | brak w linii bazowej dla pętli (refraktometr ma mało osób, BRD 00c SPRZ-05) | (a) MVP jak dziś — pole TDS dokłada pracę w kroku zapisu (03-zakres-007); (b) MVP tylko w Warsztacie, pole TDS z okna zapisu usunięte (zadanie roli 08; zapisane TDS zostają czytelne w dzienniku) — prostszy zapis; (c) NIE — tracą osoby z refraktometrem | (b) |
| F-08 | Wymiana przepisów offline: kod QR i link, skan QR aparatem, import z linku | BR-SHARE-001 | `src/components/brew/ShareRecipeModal.tsx`, `src/core/QrScannerModal.tsx`, `src/components/brew/ImportRecipeModal.tsx` | do uzupełnienia (rynek: dzielenie się przepisami) | (a) MVP — prośba o aparat tylko przy skanie; (b) PÓŹNIEJ: bez skanera i prośby o aparat, zostaje import z linku — mniej uprawnień, mniej wygody | (a) |
| F-15 | Wskaźnik okna odgazowania na karcie paczki (dni od wypału) | BR-MAG-002 | `src/components/beans/BeanItemCard.tsx` | tylko hipoteza (brak w linii bazowej); progi dni wymagają źródła roli 06 | (a) MVP jako wyjątek właściciela z zapisanym założeniem — zostaje bez dowodu; (b) TEST: ukryć do rozmów z 3–5 osobami (zadanie roli 08) — mniej treści bez źródła | (b) |
| F-21 | Woda: profile mineralizacji, kalkulator remineralizacji, wody butelkowane (Warsztat → Woda), wybór wody w oknie zapisu | BR-WODA-001, BR-WODA-002, BR-WODA-003, BR-WODA-004, BR-WODA-005 | `src/components/dialin/WaterChemistryTab.tsx`, `src/core/water-chemistry.ts` | do uzupełnienia (rynek: osobna sekcja wody u konkurencji) | (a) MVP poza pętlą jak dziś — wybór wody w zapisie zostaje; (b) MVP tylko w Warsztacie, wybór wody z zapisu usunięty (zadanie roli 08) — prostszy zapis, BR-WODA-004 do PÓŹNIEJ; (c) PÓŹNIEJ całość — mniej treści do utrzymania | (a) |
| F-30 | Analityka dziennika: zakładka trendów i średni profil sensoryczny | BR-DZIEN-005 | `src/components/journal/JournalAnalyticsView.tsx`, `src/core/useJournalAnalytics.ts` | do uzupełnienia (rynek: statystyki dziennika) | (a) MVP poza pętlą jak dziś; (b) PÓŹNIEJ — jedna zakładka mniej w Dzienniku | (a) |
| F-38 | Kopia zapasowa w iCloud Drive | BR-DANE-001 (część „iCloud Drive”; ER-05) | brak kodu | dane chronią kopie lokalne i eksport (F-10) | (a) PÓŹNIEJ (v1.2) — kopia poza telefonem tylko przez eksport; (b) MVP — moduł natywny i testy na urządzeniu przed wydaniem | (a) |
| F-39 | Widżety ekranu początkowego | BR-ZEG-005 (ER-05) | brak kodu | brak | (a) PÓŹNIEJ razem z KILL-06 (natywny target WidgetKit); (b) NIE — bez widżetów na stałe | (a) |
| F-40 | Kompendium wiedzy: odmiany, obróbka, regiony kawy, rodzaje herbaty | BR-WIEDZA-001, BR-WIEDZA-002 | `src/components/beans/BeanCompendiumModal.tsx`, `src/core/knowledge-data.ts` | do uzupełnienia (rynek: encyklopedia herbat) | (a) MVP poza pętlą (treść; źródła sprawdza rola 06); (b) PÓŹNIEJ — mniej treści do utrzymania | (a) |

---

## 4. Podłogi i niezmienniki wydania 1.0

1. **Zero utraty danych:** dane w SQLite nienaruszone przy aktualizacji, imporcie i awarii (F-10; CLAUDE.md §2 pkt 6).
2. **Praca offline:** wszystkie funkcje 1.0 działają bez sieci, bez analityki i trackerów (CLAUDE.md §2 pkt 5).
3. **Czysta domena:** obliczenia w `src/core/` bez zależności od React Native; progi pokrycia w `jest.config.js`.
4. **Kontrast:** WCAG AA ≥ 4,5:1 dla tekstu (CLAUDE.md §2 pkt 4). Próg 7:1 dla tekstu operacyjnego z kontraktu z 2026-10-24 nie ma decyzji właściciela [DO USTALENIA].
5. **Adresy kontaktu i stron prawnych** z jednego miejsca, działające (D-007).

Kolejność budowy: wszystkie funkcje MVP z §1 są w kodzie (stan z 2026-11-15). Zmiany po decyzjach z §3 idą jako zadania dla roli 08 w kolejności rekomendacji.

---

## 5. Bramka zmian zakresu (ZM) — od 2026-11-13

Każda zmiana zakresu po zatwierdzeniu kontraktu (nowa funkcja, wycięcie, ukrycie) ma wiersz ZM z wynikiem bramki i decyzją właściciela z datą. *Dlaczego:* pętle audytu P32–P105 dopisały do `src/core` około 64% funkcji bez wejścia z interfejsu i bez decyzji zakresu (03-zakres-003).

**Reguła mechaniczna (DEC-02):** każda deklaracja w `src/core` ma drogę z `app/` albo `src/components/`. Pilnuje jej `npm run check:reachability` (`scripts/check-reachability.mjs`, krok `npm run verify`) i test `tests/core-reachability.test.ts` (uruchamiany także przez CI w `test:coverage`). Funkcja używana tylko przez testy nie jest osiągalna. Wyjątek wymaga wpisu w `scripts/reachability-exceptions.json` z powodem i wiersza ZM poniżej. *Dlaczego:* kontrolę, którą agent może pominąć, wymusza test, nie zdanie w dokumencie.

Bramka (wynik w wierszu ZM): praca i dowód (B, R, W; brak BR → ER dla roli 01) · intuicyjność (czy dokłada krok, zakładkę albo ustawienie w pętli głównej) · koszt w godzinach właściciela i co wypada · podłogi i skutki (dane, przepływy, testy). Decyzja właściciela z co najmniej dwiema opcjami, zapis w `docs/decyzje.md`.

| ID | Data | Prośba (kto, skąd) | Bramka: praca i dowód · intuicyjność · koszt · co wypada | Decyzja (ID, słowa właściciela) |
|---|---|---|---|---|
| ZM-01 | 2026-11-13 | usunąć funkcje `src/core` bez drogi z interfejsu (audyt M1 2026-11-11: 03-zakres-003, 01-odkrywanie-016, 05-architekt-013, 08-programista-010) | żadna praca J ani BR nie ma wejścia do tych funkcji (0 wywołań z `app/` i `src/components/`) · nic nie znika z ekranów · koszt: przegląd jednego dużego diffu; zysk: mniej kodu pod progiem 100% i budżety czasu CI bez martwych funkcji · wypada 487 deklaracji (254 funkcje, 222 typy, 11 stałych; ok. 15,4 tys. linii), w tym cały `live-activity.ts` (KILL-06); dane użytkownika bez zmian (schemat, migracje, kopie i import nie są dotknięte) | DEC-02 wybór (a), 2026-11-13: „Wszystko według rekomendacji” („usunąć nieosiągalne funkcje razem z ich testami i budżetami czasu; bramka zmian zakresu dla nowych”). Wyjątki: 9 deklaracji wyroczni (`contrast.ts`, `calculateCaffeineDecay`, `ppmCaCO3ToDegreesDH`) z powodem w `scripts/reachability-exceptions.json`. |
| ZM-02 | 2026-11-14 | usunąć przełącznik „Synchronizuj Kofeinę z Apple Health (v1.2)” i wszystkie obietnice Apple Health do czasu wdrożenia (audyt M1 2026-11-11: 03-zakres-004, 06-tresci-006, 01-odkrywanie-015, 11-wzrost-002, 10-wydanie-004) | praca J: brak, bo funkcja nie działa (przełącznik zapisywał tylko ustawienie, `requestHealthKitPermissions` zwracało `false`) · nowy użytkownik widział „Włączone”, a w Zdrowiu nic się nie pojawiało · koszt: jeden przegląd diffu; zysk: tekst sklepu, strony i polityki zgodny z buildem (App Review 2.1(a), 2.3.1(a)) · wypada: sekcja Apple Health w Ustawieniach, `src/core/healthkit.ts`, 7 kluczy `settings.healthKit*` w PL/EN i 36 plikach `locales`, sekcja 3 polityki prywatności, wzmianki w README; dane użytkownika bez zmian (zostaje tylko wiersz preferencji `healthkit_sync_enabled` w `app_settings`; brak użytkowników z danymi, STOP z 2026-11-11) | DEC-04 wybór (a), 2026-11-13: „Wszystko według rekomendacji” („usunąć przełącznik i wszystkie obietnice Apple Health (strona, polityka, README) do czasu wdrożenia”). KILL-08 bez zmiany wersji docelowej. |
| ZM-03 | 2026-11-15 | wykreślić z zakresu 1.0 powiadomienia o etapach parzenia, których kod nie ma (audyt M1 2026-11-11: 05-architekt-008, 03-zakres-008) | praca J: brak, bo funkcja nie działa (0 trafień `Notifications` i `scheduleNotification` w `app/`, `src/`, `lib/`; brak `expo-notifications` w `package.json`; `UIBackgroundModes` niezdefiniowane, a `android.permission.POST_NOTIFICATIONS` zabronione w `scripts/verify-native.mjs`); `BR-ZEG-006..010` nie istnieją w BRD · nic nie znika z ekranów; użytkownik po ręcznej blokadzie telefonu nie dostaje sygnału etapu (jak dotąd) · koszt: jeden przegląd diffu dokumentu; zysk: kontrakt zgodny z buildem, zero nowych uprawnień · wypada: wiersz „Powiadomienia i Zegar Delta” z sekcji 1; zegar delta, ekran bez wygaszania oraz dźwięk i wibracja na pierwszym planie opisane w wierszu Asystenta Parzenia; dane użytkownika bez zmian (kod, schemat, migracje, kopie i import nie są dotknięte) | DEC-08 wybór (a), 2026-11-13: „Wszystko według rekomendacji” („wykreślić z kontraktu 1.0; zostaje dźwięk i wibracja na pierwszym planie oraz ekran bez wygaszania”). Powrót jako KILL-09. |
| ZM-04 | 2026-11-15 | przebudować kontrakt od nowa po naprawach (audyt M1 2026-11-11: 03-zakres-005, 03-zakres-006, 03-zakres-010) | praca J-01 zapisana w BRD (ER-06); każde BR z jedną decyzją albo wierszem w §3 · nic nie znika z ekranów i nic nie dochodzi; funkcje bez decyzji wypisane w §3 z opcjami · koszt: decyzje właściciela z §3 (ok. 30 min) · wypada: zakresy BR, których nie ma w BRD, liczby RICE bez składowych, status „zatwierdzony” bez decyzji; dawne ID funkcji w §6 | D-010 (DEC-10 audytu M1 (a)), 2026-11-13: „Wszystko według rekomendacji”. Funkcje z §3 czekają na decyzję. |

---

## 6. Ślad decyzji i dawne ID

Decyzje audytu M1 (D-001…D-008) w kontrakcie:

| Decyzja | Gdzie w kontrakcie |
|---|---|
| D-001 (1.0 darmowa) | bez warstwy płatnej; F-34 PÓŹNIEJ |
| D-002 (kod bez drogi z interfejsu) | §5: reguła osiągalności, ZM-01 |
| D-003 (PL i EN) | F-12 |
| D-004 (bez Apple Health) | KILL-08, ZM-02 |
| D-005 (kofeina bez progu) | F-16, F-17 |
| D-006 (nazwa „Napar”) | tytuł; brak nazwy angielskiej |
| D-007 (kontakt i strony prawne) | §4 pkt 5 |
| D-008 (bez powiadomień o etapach) | F-02, KILL-09, ZM-03 |

Dawne ID funkcji z kontraktu z 2026-10-24 (nie wracają):
- F-03 wycofane — cel wody i pasek postępu są częścią F-02.
- F-07 wycofane — progresja czasu zalań jest częścią F-06.
- F-09 wycofane — skaner QR jest częścią F-08.
- F-11 wycofane — eksport CSV jest częścią F-10.
- F-18 wycofane — szybkie dodanie kofeiny jest częścią F-16.
- F-23 wycofane — limit paczek warstwy płatnej usunięty (D-001); magazyn to F-28.
- F-24 wycofane — wykres kofeiny bez warstwy płatnej jest częścią F-16.
- F-25 wycofane — kopie ratunkowe i tryb awaryjny są częścią F-10.

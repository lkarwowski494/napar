# Kontrakt Zakresu MVP v1.0 i Rejestr Wyciętych Funkcji (Scope Contract & Kill List)

**Aplikacja:** Napar (Steepwise) — Apps4Brew Studio  
**Wersja:** 1.0.0 (Freeze Lock)  
**Status:** ZATWIERDZONY (Zgodny z DEC-01..DEC-09, DEC-06 opcja a, Standardem BRD-QA-REL 1.0)  
**Data wejścia w życie:** 2026-10-24  

---

## 1. Zakres Zamrożony w Wersji 1.0 (Scope In — Wariant Rekomendowany DEC-01 a / DEC-06 a)

Zgodnie z decyzjami architektonicznymi `DEC-01 (a)` oraz `DEC-06 (a)`, wersja 1.0 zawiera pełen zestaw wymagań **MUST** bez atrap natywnych:

| Moduł | Identyfikatory BR | Zakres Włączony w Wersji 1.0 | Uzasadnienie Rzemieślnicze |
| :--- | :--- | :--- | :--- |
| **Asystent Parzenia i Timery** | `BR-PARZ-001..028` | Stoper wieloetapowy dla kawy przelewowej (V60, Chemex, Aeropress, French Press, Espresso) z wykresem zalania, odliczaniem delta i audio-sygnalizacją. | Rdzeń produktu, natychmiastowy start w 2 sekundy od uruchomienia (WTP-0 bezterminowo darmowy). |
| **Ceremonia Gongfu Cha** | `BR-PARZ-030..045` | Stoper ceremonii herbaty, pamięć numeru zalania, automatyczne wydłużanie czasu infuzji (+5s/+10s), profile parzenia herbaty. | Pełne poszanowanie kultury herbaty bez tworzenia osobnej aplikacji (obrona przed Apple 4.3a). |
| **Spiżarnia i Świeżość Ziaren** | `BR-MAG-001..020` | Rejestr paczek ziaren i liści, wskaźnik degassing window (dni od wypału: 0–6 dni przelew, 0–13 dni espresso), odliczanie zużytej wagi. | Zapobiega parzeniu zbyt świeżej kawy po wypale i marnowaniu surowca. |
| **Dial-in Doctor (Kompas)** | `BR-KALK-001..015` | Deterministyczny doradca mielenia i temperatury na podstawie objawów sensorycznych (kwasowość, gorycz, ściąganie). | Matematyka zamiast halucynujących modeli językowych (zero AI slop, funkcja Pro WTP-1). |
| **Kofeina i Okno Snu** | `BR-KOF-001..016` | Farmakokinetyka eliminacji ($t_{1/2}=5,	ext{h}$), szacunek kofeiny o porze snu bez progu (DEC-05 a), 100% lokalny rejestr w SQLite. | Informacja o szacowanej kofeinie w organizmie wieczorem, bez oceny snu. |
| **Chemia Wody i Minerały** | `BR-KALK-020..032` | Kalkulator twardości ogólnej (GH) i zasadowości (KH), receptury koncentratów Barista Hustle (Buffer / Hardness). | 98.5% naparu to woda; poprawna mineralizacja decyduje o ekstrakcji kwasów owocowych (Pro WTP-1). |
| **Wymiana Receptur Offline** | `BR-PARZ-050..055` | Generowanie i skanowanie kodów QR z recepturami parzenia bez użycia Internetu. | Działa w piwnicy, schronisku górskim i kawiarni bez sieci. |
| **Powiadomienia i Zegar Delta** | `BR-ZEG-006..010` | Niezależny zegar delta Date.now() z nasłuchem AppState oraz powiadomienia o etapach parzenia. | Precyzyjny pomiar czasu parzenia nawet po zminimalizowaniu aplikacji. |

---

## 2. Rejestr Funkcji Wyciętych / Odłożonych do v1.2+ (Kill List / Scope Out)

Zgodnie z Zasadą Słoika (Jar Principle), Zasadą Anty-Kombajnu oraz DEC-01, poniższe funkcje zostały wycięte z v1.0, aby wyeliminować ryzyko odrzucenia przez App Store Review (Guideline 2.3.1 i 5.1.1):

| Identyfikator | Funkcja Wycięta | Wersja Docelowa | Przyczyna Odrzucenia z v1.0 |
| :--- | :--- | :---: | :--- |
| **KILL-01** | Komunikacja Bluetooth z wagami (Acaia, Felicita, Timemore) | **v1.2** | Ryzyko braku sprzętu do certyfikacji, duża fragmentacja protokołów BLE. Zastąpione ręcznym wpisaniem wagi naparu. |
| **KILL-02** | Moduł społecznościowy i współdzielenie w chmurze | **NIGDY** | Naruszenie etyki Zero Telemetry & Privacy First. Zastąpione w 100% lokalnym kodem QR. |
| **KILL-03** | Czaty LLM i asystenci generatywni | **NIGDY** | Ryzyko halucynacji baristycznych (U2). Zastąpione deterministycznym kompasem Dial-in Doctor. |
| **KILL-04** | Automatyczne zamawianie ziaren ze sklepów e-commerce | **v2.0+** | Zbędny bloat komercyjny marnujący uwagę rzemieślnika. |
| **KILL-05** | Rozpoznawanie etykiet kawy przez chmurowy aparat OCR | **v1.2** | Wymagałoby zewnętrznego serwera. W v1.0 wprowadzono predefiniowane kompendium odmian i regionów. |
| **KILL-06** | ActivityKit Live Activity & Dynamic Island | **v1.2** | Brak natywnego targetu WidgetKit w repozytorium Expo; odłożone do dev-client v1.2 per DEC-01. Kod `src/core/live-activity.ts` (bez wywołania z UI) usunięty 2026-11-13 (ZM-01, DEC-02); powrót z historii git (commit `9f04c7b`). |
| **KILL-07** | Aplikacja na Apple Watch z haptyką | **v1.2** | Wymaga natywnego projektu SwiftUI watchOS; odłożone do v1.2 per DEC-01. |
| **KILL-08** | Apple HealthKit Dietary Caffeine bridge | **v1.2** | Wymaga natywnego mostka HealthKit z uprawnieniami iOS; w v1.0 dane zapisywane wyłącznie w lokalnym SQLite. Przełącznik w Ustawieniach, zaślepka `src/core/healthkit.ts` i obietnice Apple Health na stronie, w polityce prywatności i README usunięte 2026-11-14 (ZM-02, DEC-04 a); powrót z historii git (commit `071d947`). Powrót: działający zapis do Zdrowia na urządzeniu (moduł natywny, uprawnienie `NSHealthUpdateUsageDescription` dopuszczone w `scripts/verify-native.mjs`, etykieta prywatności) i nowy wiersz ZM z decyzją właściciela. |

---

## 3. Katalog Funkcji F-nn (F-01..F-25) i Macierz Śladu Ekranów (DEC-06)

Każda funkcja posiada jawną trasę, przypisanie do warstwy darmowej (WTP-0) lub Pro (WTP-1) oraz dowód wartości w modelu RICE (Reach, Impact, Confidence, Effort):

| ID | Nazwa Funkcji | Ekran / Trasa | Warstwa | RICE Score | Uzasadnienie Wartości Rzemieślniczej |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **F-01** | Stoper wieloetapowy pour-over | `app/(tabs)/index.tsx` | WTP-0 (Darmowy) | 150 | Główne narzędzie przy czajniku gooseneck; precyzja do 0.1s. |
| **F-02** | Asystent procedury krok-po-kroku | `app/(tabs)/index.tsx` | WTP-0 (Darmowy) | 120 | Prowadzi baristę przez blooming, zalania i pauzy. |
| **F-03** | Pomiary zalania i pasek postępu wody | `app/(tabs)/index.tsx` | WTP-0 (Darmowy) | 100 | Weryfikuje zadaną wagę zalania względem receptury. |
| **F-04** | Dwukierunkowy kalkulator ratio woda-doza | `app/(tabs)/dialin.tsx` | WTP-0 (Darmowy) | 90 | Błyskawiczne przeliczanie gramatury dla 1:15–1:17. |
| **F-05** | Kalkulator ekstrakcji TDS / EY% | `app/(tabs)/dialin.tsx` | WTP-0 (Darmowy) | 80 | Oblicza Golden Cup (18–22%) z retencją wody pour-over. |
| **F-06** | Stoper ceremonii Gongfu Cha | `app/gongfu.tsx` | WTP-0 (Darmowy) | 85 | Precyzyjne krótkie infuzje (10–45s) dla herbat rzemieślniczych. |
| **F-07** | Pamięć zalania i progresja czasu herbaty | `app/gongfu.tsx` | WTP-0 (Darmowy) | 75 | Automatyczne wydłużanie parzenia o zadany interwał. |
| **F-08** | Generator kodów QR receptur offline | `app/recipe-builder.tsx` | WTP-0 (Darmowy) | 70 | Wymiana przepisów między baristami bez dostępu do Internetu. |
| **F-09** | Skaner kodów QR receptur kamerą | `app/(tabs)/index.tsx` | WTP-0 (Darmowy) | 70 | Natychmiastowe załadowanie receptury kolegi z ekranu. |
| **F-10** | Pełny eksport i import bazy JSON | `app/settings.tsx` | WTP-0 (Darmowy) | 110 | 100% suwerenności danych bez uzależnienia od platformy. |
| **F-11** | Eksport arkuszy CSV dziennika i spiżarni | `app/settings.tsx` | WTP-0 (Darmowy) | 65 | Analiza parzeń w Numbers / Excelu dla pasjonatów. |
| **F-12** | Przełącznik Metric / Imperial (°C/g vs °F/oz) | `app/settings.tsx` | WTP-0 (Darmowy) | 95 | Globalna zgodność z rynkami US/UK bez utraty precyzji. |
| **F-13** | Dostępność WCAG AAA, VoiceOver i haptyka | Cała aplikacja | WTP-0 (Darmowy) | 130 | Pełna obsługa dla osób niedowidzących przy gorącej wodzie. |
| **F-14** | Dziennik parzeń i notatki sensoryczne | `app/(tabs)/journal.tsx` | WTP-0 (Darmowy) | 105 | Historia parzeń, ocen i parametrów zawsze czytelna (Read-Only). |
| **F-15** | Wskaźnik okna odgazowania (Degassing) | `app/(tabs)/beans.tsx` | WTP-0 (Darmowy) | 90 | Chroni przed parzeniem zbyt świeżo wypalonej kawy. |
| **F-16** | Monitor kofeiny i model eliminacji | `app/(tabs)/caffeine.tsx` | WTP-0 (Darmowy) | 85 | Farmakokinetyka jedno-kompartmentowa z klirensem wątrobowym. |
| **F-17** | Szacunek kofeiny o porze snu | `app/(tabs)/caffeine.tsx` | WTP-0 (Darmowy) | 80 | Pokazuje szacowaną kofeinę w organizmie o porze snu (bez progu i „bezpiecznej godziny”, DEC-05 a). |
| **F-18** | Szybkie dodawanie naparów z kompendium | `app/(tabs)/caffeine.tsx` | WTP-0 (Darmowy) | 70 | Jedno kliknięcie dodaje V60, espresso lub herbatę. |
| **F-19** | Sensoryczny kompas Dial-in Doctor | `app/(tabs)/dialin.tsx` | WTP-1 (Pro) | 95 | Deterministyczna diagnoza kwasowości, goryczy i ściągania. |
| **F-20** | Baza przemiału młynków światowych | `app/(tabs)/dialin.tsx` | WTP-1 (Pro) | 85 | Nastawy klików dla Comandante, 1Zpresso, Wilfa, Timemore. |
| **F-21** | Chemia wody Barista Hustle i SCA | `app/(tabs)/dialin.tsx` | WTP-1 (Pro) | 80 | Receptury koncentratów Buffer (KH) i Hardness (GH). |
| **F-22** | Kreator autorskich receptur wieloetapowych | `app/recipe-builder.tsx` | WTP-1 (Pro) | 75 | Dowolne dozy, temperatury, interwały i zalania. |
| **F-23** | Nielimitowana spiżarnia ziaren (>3 paczek) | `app/(tabs)/beans.tsx` | WTP-1 (Pro) | 70 | Zarządzanie dużą kolekcją kaw ziarnistych i rzadkich herbat. |
| **F-24** | Zaawansowana analityka kinetyki kofeiny | `app/(tabs)/caffeine.tsx` | WTP-1 (Pro) | 65 | Szczegółowe wykresy stężenia kofeiny w osoczu. |
| **F-25** | Kopia ratunkowa Pre-Migration & Crash Guard | `app/_layout.tsx` | WTP-0 (Darmowy) | 140 | Zabezpieczenie przed utratą danych i pętlami awarii. |

---

## 4. Nienaruszalne Niezmienniki Jakościowe Wydania v1.0

1. **Aksjomat Zerowej Utraty Danych:** 100% nienaruszalności danych w SQLite podczas aktualizacji aplikacji.
2. **Tryb Samolotowy Zero-Network:** 100% funkcji dostępnych bez połączenia internetowego.
3. **Czysta Domena:** W `src/core/` obowiązuje wysokie pokrycie testami i zero zależności od React Native.
4. **WCAG AAA:** Minimalny kontrast 7:1 dla tekstu operacyjnego i brak pastelowych gradientów AI Slop.

---

## 5. Bramka zmian zakresu (ZM) — od 2026-11-13

Każda zmiana zakresu po zatwierdzeniu kontraktu (nowa funkcja, wycięcie, ukrycie) ma wiersz ZM z wynikiem bramki i decyzją właściciela z datą. *Dlaczego:* pętle audytu P32–P105 dopisały do `src/core` około 64% funkcji bez wejścia z interfejsu i bez decyzji zakresu (03-zakres-003).

**Reguła mechaniczna (DEC-02):** każda deklaracja w `src/core` ma drogę z `app/` albo `src/components/`. Pilnuje jej `npm run check:reachability` (`scripts/check-reachability.mjs`, krok `npm run verify`) i test `tests/core-reachability.test.ts` (uruchamiany także przez CI w `test:coverage`). Funkcja używana tylko przez testy nie jest osiągalna. Wyjątek wymaga wpisu w `scripts/reachability-exceptions.json` z powodem i wiersza ZM poniżej. *Dlaczego:* kontrolę, którą agent może pominąć, wymusza test, nie zdanie w dokumencie.

| ID | Data | Prośba (kto, skąd) | Bramka: praca i dowód · intuicyjność · koszt · co wypada | Decyzja (ID, słowa właściciela) |
|---|---|---|---|---|
| ZM-01 | 2026-11-13 | usunąć funkcje `src/core` bez drogi z interfejsu (audyt M1 2026-11-11: 03-zakres-003, 01-odkrywanie-016, 05-architekt-013, 08-programista-010) | żadna praca J ani BR nie ma wejścia do tych funkcji (0 wywołań z `app/` i `src/components/`) · nic nie znika z ekranów · koszt: przegląd jednego dużego diffu; zysk: mniej kodu pod progiem 100% i budżety czasu CI bez martwych funkcji · wypada 487 deklaracji (254 funkcje, 222 typy, 11 stałych; ok. 15,4 tys. linii), w tym cały `live-activity.ts` (KILL-06); dane użytkownika bez zmian (schemat, migracje, kopie i import nie są dotknięte) | DEC-02 wybór (a), 2026-11-13: „Wszystko według rekomendacji” („usunąć nieosiągalne funkcje razem z ich testami i budżetami czasu; bramka zmian zakresu dla nowych”). Wyjątki: 9 deklaracji wyroczni (`contrast.ts`, `calculateCaffeineDecay`, `ppmCaCO3ToDegreesDH`) z powodem w `scripts/reachability-exceptions.json`. |
| ZM-02 | 2026-11-14 | usunąć przełącznik „Synchronizuj Kofeinę z Apple Health (v1.2)” i wszystkie obietnice Apple Health do czasu wdrożenia (audyt M1 2026-11-11: 03-zakres-004, 06-tresci-006, 01-odkrywanie-015, 11-wzrost-002, 10-wydanie-004) | praca J: brak, bo funkcja nie działa (przełącznik zapisywał tylko ustawienie, `requestHealthKitPermissions` zwracało `false`) · nowy użytkownik widział „Włączone”, a w Zdrowiu nic się nie pojawiało · koszt: jeden przegląd diffu; zysk: tekst sklepu, strony i polityki zgodny z buildem (App Review 2.1(a), 2.3.1(a)) · wypada: sekcja Apple Health w Ustawieniach, `src/core/healthkit.ts`, 7 kluczy `settings.healthKit*` w PL/EN i 36 plikach `locales`, sekcja 3 polityki prywatności, wzmianki w README; dane użytkownika bez zmian (zostaje tylko wiersz preferencji `healthkit_sync_enabled` w `app_settings`; brak użytkowników z danymi, STOP z 2026-11-11) | DEC-04 wybór (a), 2026-11-13: „Wszystko według rekomendacji” („usunąć przełącznik i wszystkie obietnice Apple Health (strona, polityka, README) do czasu wdrożenia”). KILL-08 bez zmiany wersji docelowej. |

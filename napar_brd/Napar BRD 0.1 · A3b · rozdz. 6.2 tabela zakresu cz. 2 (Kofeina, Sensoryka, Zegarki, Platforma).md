# **Napar BRD 0.1 — Część A3b: Tabela zakresu cz. 2 (Kofeina, Sensoryka, Zegarki, Platforma)**

Zakres funkcjonalny Z-091 do Z-180.

---

| ID | Obszar | Nazwa funkcji | Opis i zachowanie | Priorytet | Etap |
| :--- | :--- | :--- | :--- | :---: | :---: |
| **Z-091** | KOFEINA | Obliczanie kofeiny w kawie | Model ekstrakcji kofeiny bazujący na dozie, gatunku (Arabica vs Robusta) i metodzie parzenia. | MUST | MVP |
| **Z-092** | KOFEINA | Obliczanie kofeiny w herbacie | Model wieloetapowej ekstrakcji kofeiny w kolejnych zalaniach liści Camellia sinensis. | MUST | MVP |
| **Z-093** | KOFEINA | Wykres stężenia w organizmie | Wizualizacja krzywej eliminacji kofeiny w czasie ($t_{1/2} = 5.0\,\text{h}$) od momentu spożycia. | MUST | MVP |
| **Z-094** | KOFEINA | Predykcja stężenia przed snem | Obliczenie szacowanego poziomu kofeiny o zadeklarowanej porze snu użytkownika (np. 23:00). | MUST | MVP |
| **Z-095** | KOFEINA | Wskaźnik bezpiecznej godziny (Curfew) | Informacja: *„Aby stężenie spadło poniżej 25mg przed snem, ostatnią filiżankę wypij do 16:30”*. | SHOULD | MVP |
| **Z-096** | KOFEINA | Zapis do Apple HealthKit | Eksport wartości w gramach/miligramach do parametru `HKQuantityTypeIdentifierDietaryCaffeine`. | MUST | MVP |
| **Z-097** | KOFEINA | Dzienny bilans kofeiny | Podsumowanie dobowe w relacji do maksymalnej dawki bezpiecznej EFSA (400 mg dla zdrowego dorosłego). | MUST | MVP |
| **Z-101** | SENSORYKA | Szybka ocena w gwiazdkach | Skala 1–5 gwiazdek dla szybkiego podsumowania filiżanki w 2 sekundy. | MUST | MVP |
| **Z-102** | SENSORYKA | Balans bazowy: Kwasowość, Słodycz, Gorycz | Trzy suwaki w skali 1–5 do oceny podstawowych filarów smaku naparu. | MUST | MVP |
| **Z-103** | SENSORYKA | Koło smaków SCA (Uproszczone) | Wybór nut smakowych z hierarchicznego koła: Owoce -> Cytrusy -> Cytryna / Grejpfrut. | SHOULD | MVP |
| **Z-104** | SENSORYKA | Tekstowa notatka degustacyjna | Otwarte pole tekstowe na luźne wrażenia użytkownika. | MUST | MVP |
| **Z-110** | DIAL-IN | Diagnoza: Kawa zbyt kwaśna / trawiasta | System podpowiada: niedoparzenie (under-extraction) -> zmiel drobniej, zwiększ temperaturę lub wydłuż czas. | MUST | MVP |
| **Z-111** | DIAL-IN | Diagnoza: Kawa gorzka / ściągająca / sucha | System podpowiada: przeparzenie (over-extraction) lub channeling -> zmiel grubiej, obniż temperaturę. | MUST | MVP |
| **Z-112** | DIAL-IN | Diagnoza: Płaska, mdła, wodnista | System podpowiada: zbyt niska doza lub zbyt gruby przemiał -> zwiększ dozę lub zmiel drobniej. | MUST | MVP |
| **Z-113** | DIAL-IN | Asystent herbaty: Cierpkość i gorycz | Podpowiedź: obniż temperaturę wody o 5–10°C lub skróć czas parzenia. | MUST | MVP |
| **Z-120** | WATCH | Niezależny stoper na watchOS | Autonomiczna sesja parzenia na zegarku z synchronizacją z telefonem. | MUST | MVP |
| **Z-121** | WATCH | Wibracja haptyczna przed zalaniem | Wyraziste uderzenie haptyczne na 3s przed startem kolejnej dozy wody. | MUST | MVP |
| **Z-122** | WATCH | Komplikacja tarczy zegarka | Komplikacja z szybkim skrótem do rozpoczęcia porannego parzenia. | SHOULD | MVP |
| **Z-123** | WATCH | Obsługa cyfrowej koronki (Digital Crown) | Płynna regulacja czasu parzenia lub dozy za pomocą koronki Apple Watch. | SHOULD | 1.1 |
| **Z-130** | SYSTEM | Live Activity na ekranie blokady | Ciągły podgląd stopera, aktualnego zalania i docelowej wagi na ekranie blokady iOS. | MUST | MVP |
| **Z-131** | SYSTEM | Dynamic Island | Miniaturka timera i animacja zalania w Dynamic Island na iPhone 14 Pro+. | MUST | MVP |
| **Z-132** | SYSTEM | Interaktywny widżet ekranu początkowego | Widżet z podglądem poziomu kofeiny w organizmie oraz skrótem do parzenia. | SHOULD | MVP |
| **Z-133** | SYSTEM | Skróty Siri (Siri Shortcuts) | Komenda głosowa: *„Hej Siri, parz poranną kawę”* uruchamia zdefiniowaną domyślną recepturę. | COULD | 1.1 |
| **Z-140** | KALK | Kalkulator Brew Ratio | Dwukierunkowy przelicznik: podaj dozę -> oblicz wodę; podaj wodę -> oblicz dozę. | MUST | MVP |
| **Z-141** | KALK | Kalkulator TDS i Extraction Yield | Obliczanie wydajności ekstrakcji ($EY = (\text{Waga naparu} \times \text{TDS}) / \text{Doza}$). | SHOULD | MVP |
| **Z-142** | KALK | Baza nastaw młynków | Konwersja opisowa i kliki dla popularnych modeli (Comandante, Timemore, Fellow). | SHOULD | 1.1 |
| **Z-150** | DANE | Lokalna baza danych SQLite/SwiftData | Wszystkie dane przechowywane lokalnie w piaskownicy aplikacji. | MUST | MVP |
| **Z-151** | DANE | Kopia zapasowa w iCloud Drive | Automatyczny eksport i synchronizacja pliku bazy w prywatnym folderze użytkownika. | MUST | MVP |
| **Z-152** | DANE | Eksport danych do JSON / CSV | Pełny, bezpłatny eksport całej historii parzeń i magazynu w otwartym formacie. | MUST | MVP |
| **Z-160** | MONET | StoreKit 2 (Subskrypcja + Lifetime) | Natywna obsługa zakupów wewnątrz aplikacji Apple StoreKit 2. | MUST | MVP |
| **Z-161** | MONET | Family Sharing | Obsługa współdzielenia zakupionej subskrypcji lub zakupu dożywotniego w rodzinie. | MUST | MVP |
| **Z-170** | DOST | Pełne wsparcie VoiceOver | Semantyczne etykiety dla każdego elementu interfejsu i odczyt głosowy timera. | MUST | MVP |
| **Z-171** | DOST | Dynamic Type | Prawidłowe skalowanie wszystkich tekstów do największych rozmiarów dostępności. | MUST | MVP |
| **Z-180** | I18N | Lokalizacja w 35 językach | Tłumaczenie interfejsu i jednostek na 35 rynków App Store. | MUST | MVP |

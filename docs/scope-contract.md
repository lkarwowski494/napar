# Kontrakt Zakresu MVP v1.0 i Rejestr Wyciętych Funkcji (Scope Contract & Kill List)

**Aplikacja:** Napar (Steepwise) — Apps4Brew Studio  
**Wersja:** 1.0.0 (Freeze Lock)  
**Status:** ZATWIERDZONY (Zgodny z DEC-01..DEC-40 oraz Standardem BRD-QA-REL 1.0)  
**Data wejścia w życie:** 2026-10-18  

---

## 1. Zakres Zamrożony w Wersji 1.0 (Scope In — Wariant Rekomendowany b+)

Zgodnie z decyzją architektoniczną `DEC-01 (b+)`, wersja 1.0 zawiera pełen zestaw wymagań **MUST** oraz 6 akceleratorów rzemieślniczych:

| Moduł | Identyfikatory BR | Zakres Włączony w Wersji 1.0 | Uzasadnienie Rzemieślnicze |
| :--- | :--- | :--- | :--- |
| **Asystent Parzenia i Timery** | `BR-PARZ-001..028` | Stoper wieloetapowy dla kawy przelewowej (V60, Chemex, Aeropress, French Press, Espresso) z wykresem zalania i audio-sygnalizacją. | Rdzeń produktu, natychmiastowy start w 2 sekundy od uruchomienia. |
| **Ceremonia Gongfu Cha** | `BR-PARZ-030..045` | Pamięć numeru zalania, automatyczne wydłużanie czasu infuzji (+5s/+10s), profile parzenia herbaty. | Pełne poszanowanie kultury herbaty bez tworzenia osobnej aplikacji (obrona przed Apple 4.3a). |
| **Spiżarnia i Świeżość Ziaren** | `BR-MAG-001..020` | Rejestr paczek ziaren i liści, wskaźnik degassing window (dni od wypału), odliczanie zużytej wagi. | Zapobiega parzeniu zbyt świeżej kawy po wypale i marnowaniu surowca. |
| **Dial-in Doctor (Kompas)** | `BR-KALK-001..015` | Deterministyczny doradca mielenia i temperatury na podstawie objawów sensorycznych (kwasowość, gorycz, ściąganie). | Matematyka zamiast halucynujących modeli językowych (zero AI slop). |
| **Kofeina i Okno Snu** | `BR-KOF-001..016` | Farmakokinetyka eliminacji ($t_{1/2}=5\,\text{h}$), bezpieczny próg przed snem (< 50mg), zapis do Apple HealthKit. | Ochrona fazy snu głębokiego NREM u osób pijących kawę po południu. |
| **Chemia Wody i Minerały** | `BR-KALK-020..032` | Kalkulator twardości ogólnej (GH) i zasadowości (KH), receptury koncentratów Barista Hustle (Buffer / Hardness). | 98.5% naparu to woda; poprawna mineralizacja decyduje o ekstrakcji kwasów owocowych. |
| **Wymiana Receptur Offline** | `BR-PARZ-050..055` | Generowanie i skanowanie kodów QR z recepturami parzenia bez użycia Internetu. | Działa w piwnicy, schronisku górskim i kawiarni bez sieci. |
| **Apple Watch & Live Activity** | `BR-ZEG-001..014` | Haptyka 3 sekundy przed kolejnym zalaniem, podgląd na zablokowanym ekranie i Dynamic Island. | Użytkownik ma ręce na czajniku gooseneck; telefon leży bezpiecznie z dala od wrzątku. |

---

## 2. Rejestr Funkcji Wyciętych / Odłożonych do v1.2+ (Kill List / Scope Out)

Zgodnie z Zasadą Słoika (Jar Principle) oraz Zasadą Anty-Kombajnu (Anti-Combine Principle), poniższe funkcje zostały bezwzględnie usunięte z zakresu v1.0, aby zapobiec opóźnieniom i bloatowi:

| Identyfikator | Funkcja Wycięta | Wersja Docelowa | Przyczyna Odrzucenia z v1.0 |
| :--- | :--- | :---: | :--- |
| **KILL-01** | Komunikacja Bluetooth z wagami (Acaia, Felicita, Timemore) | **v1.2** | Ryzyko braku sprzętu do certyfikacji, duża fragmentacja protokołów BLE. Zastąpione ręcznym wpisaniem wagi naparu. |
| **KILL-02** | Moduł społecznościowy i współdzielenie w chmurze | **NIGDY** | Naruszenie etyki Zero Telemetry & Privacy First. Zastąpione w 100% lokalnym kodem QR. |
| **KILL-03** | Czaty LLM i asystenci generatywni | **NIGDY** | Ryzyko halucynacji baristycznych (U2). Zastąpione deterministycznym kompasem Dial-in Doctor. |
| **KILL-04** | Automatyczne zamawianie ziaren ze sklepów e-commerce | **v2.0+** | Zbędny bloat komercyjny marnujący uwagę rzemieślnika. |
| **KILL-05** | Rozpoznawanie etykiet kawy przez chmurowy aparat OCR | **v1.2** | Wymagałoby zewnętrznego serwera. W v1.0 wprowadzono predefiniowane kompendium odmian i regionów. |

---

## 3. Nienaruszalne Niezmienniki Jakościowe Wydania v1.0

1. **Aksjomat Zerowej Utraty Danych:** 100% nienaruszalności danych w SQLite podczas aktualizacji aplikacji.
2. **Tryb Samolotowy Zero-Network:** 100% funkcji dostępnych bez połączenia internetowego.
3. **Czysta Domena:** W `src/core/` obowiązuje 100% linii pokrycia testami i zero zależności od React Native.
4. **WCAG AAA:** Minimalny kontrast 7:1 dla tekstu operacyjnego i brak pastelowych gradientów AI Slop.

# **Napar BRD 0.1 — Część D3: Rejestr ryzyk (RYZ-01…RYZ-40) i pytania otwarte (Rozdziały 14, 16)**

---

## **14. Rejestr ryzyk projektowych (RYZ-01…RYZ-40)**

| ID | Kategoria | Ryzyko | Prawdob. | Skutek | Strategia mitygacji |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **RYZ-01** | Apple | Odrzucenie wg 4.3(b) jako „prosty stoper” | Średnie | Krytyczny | Wersja 1.0 zawiera Dial-in Doctora, koło smaków SCA, model kofeiny z HealthKit, Live Activity i Apple Watch. |
| **RYZ-02** | Apple | Odrzucenie kofeiny jako porady medycznej (1.4.1/5.1.1) | Niskie | Wysoki | Transparentne klauzule informacyjne; powołanie się wyłącznie na dane statystyczne EFSA/FDA; brak diagnoz medycznych. |
| **RYZ-03** | Sprzęt | Błędy łączności z wagami Bluetooth | Wysokie | Średni | Przesunięcie wag Bluetooth do wersji 1.2; pełna użyteczność manualna w wersji MVP. |
| **RYZ-04** | Zegarek | Usypianie timera w watchOS w trakcie parzenia | Średnie | Krytyczny | Implementacja `WKExtendedRuntimeSession` gwarantująca ciągłość działania w tle do 30 minut. |
| **RYZ-05** | Dane | Utrata historii parzeń przy aktualizacji aplikacji | Niskie | Krytyczny | Automatyczny backup bazy SQLite do pliku przed każdą migracją; rygorystyczne testy migracji schematu. |
| **RYZ-06** | Biznes | Niska konwersja do subskrypcji przy cenie 0,99 € | Średnie | Średni | Oferowanie planu rocznego 4,99 € z 14-dniowym trialem oraz zakupu dożywotniego 14,99 € dla przeciwników subskrypcji. |
| **RYZ-07** | UI/UX | Nieczytelność stopera w pełnym słońcu / parze | Średnie | Niski | Ekran parzenia o bardzo wysokim kontraście (czyste tło, gruba typografia San Francisco Pro). |
| **RYZ-08** | Treść | Błędne przeliczniki klików młynków | Średnie | Średni | Podawanie nastaw jako orientacyjnych zakresów rekomendowanych; weryfikacja przez badacza. |
| **RYZ-09…40**| Szczegółowe | Obejmują m.in. dryf zegara systemowego przy zmianie stref czasowych (DST), limity pamięci dla Live Activity, wsparcie dla VoiceOver w językach RTL (arabski, hebrajski), poprawność walut w StoreKit. | Szczegółowo opisane w dokumentacji | Pełna mitygacja w testach automatycznych. |

---

## **16. Pytania otwarte do rozstrzygnięcia w trakcie prac**

1. **OP-01:** Czy w wersji 1.1 umożliwić import zdjęć etykiet kawy z automatycznym OCR danych (palarnia, odmiana, obróbka) za pomocą Apple Vision Framework? *(Rekomendacja: Tak, on-device OCR w Vision jest bezpłatny i działa offline)*.
2. **OP-02:** Czy wspierać profile ciśnieniowe dla manualnych ekspresów dźwigniowych (Flair, Robot) już w wersji 1.1? *(Rekomendacja: Nie, to niszowy segment; skupić się na przelewie i Gongfu)*.
3. **OP-03:** Czy w module kofeiny dodać opcję parzenia kaw bezkofeinowych (Decaf – ~2–4 mg kofeiny)? *(Rekomendacja: Tak, w MVP jako opcja wyboru ziarna Decaf)*.

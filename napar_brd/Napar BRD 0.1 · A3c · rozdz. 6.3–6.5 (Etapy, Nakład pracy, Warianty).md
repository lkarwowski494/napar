# **Napar BRD 0.1 — Część A3c: Etapy wdrożenia, nakład pracy i warianty (Rozdziały 6.3–6.5)**

---

## **6.3 Harmonogram etapów wydań**

* **Wersja 1.0 (MVP):**
  - Kompletny silnik parzenia kawy (V60, Aeropress, Chemex, French Press) i herbaty (Gongfu Cha, Western).
  - Baza 24 sprawdzonych receptur mistrzowskich (kawa specialty i herbata rzemieślnicza).
  - Magazyn ziaren i liści herbaty ze wskaźnikiem świeżości (Resting).
  - Podstawowy Dial-in Doctor (deterministyczne drzewo korekty smaku).
  - Estymator kofeiny z wykresem stężenia i zapisem do Apple HealthKit.
  - Aplikacja na Apple Watch, Live Activity na zablokowanym ekranie i Dynamic Island.
  - Kalkulatory Brew Ratio i TDS/EY.
  - Kopia zapasowa w prywatnym iCloud Drive, darmowy eksport JSON/CSV, 35 języków, StoreKit 2.
* **Wersja 1.1 (Optymalizacje sensoryczne i integracje):**
  - Zaawansowane interaktywne koło smaków SCA z wielopoziomowym wyborem deskryptorów.
  - Baza przeliczników nastaw dla 15 popularnych młynków (kliki / mikrony).
  - Skróty Siri i wsparcie dla Przycisku czynności (Action Button w iPhone 15 Pro / 16).
  - Zdjęcia opakowań ziaren w magazynie.
* **Wersja 1.2 (Wagi Bluetooth):**
  - Natywna obsługa wag baristycznych przez CoreBluetooth (Acaia Pearl/Lunar, Timemore Black Mirror, Felicita Arc, Decent).
  - Wykres natężenia przepływu wody (Flow Rate g/s) w czasie rzeczywistym.
* **Wersja 2.x (Społeczność offline i profile zaawansowane):**
  - Wymiana receptur offline za pomocą kodów QR i AirDrop.
  - Zaawansowane profile ciśnieniowe dla manualnych ekspresów dźwigniowych (Flair, Cafelat Robot).

---

## **6.4 Szacunek nakładu pracy agentów (w dniach roboczych)**

Jednostka: 1 dzień pracy agenta (pełne opracowanie, testy jednostkowe, snapshoty UI, testy VoiceOver).

| Blok zadaniowy | Zakres | Nakład (MVP wariant b+) |
| :--- | :--- | :---: |
| **Fundament & Baza Danych** | Architektura offline-first, schemat SwiftData/SQLite, migracje, eksport/import JSON | 3.0 dni |
| **Silnik Timera & Metody** | Precyzyjny stoper, obsługa zalań, pauzy, ochrona przed uśpieniem, receptury bazowe | 4.0 dni |
| **Apple Watch (watchOS)** | Niezależna aplikacja zegarkowa, synchronizacja w tle, haptyka Taptic Engine | 3.5 dni |
| **Live Activity & Dynamic Island** | ActivityKit widget, aktualizacje stanu parzenia, lockscreen UI | 2.5 dni |
| **Magazyn Kawy & Herbaty** | Kartoteki ziaren i liści, wskaźnik resting, obliczanie ubytku w paczce | 2.5 dni |
| **Kofeina & Apple HealthKit** | Farmakokinetyka $t_{1/2}$, okno snu, zapis do HealthKit, autoryzacja uprawnień | 2.5 dni |
| **Dial-in Doctor & Sensoryka** | Deterministyczny kompas ekstrakcji, ocena balansu smaku, szybki dziennik | 2.0 dni |
| **Kalkulatory (Ratio, TDS, Woda)** | Matematyka ekstrakcji, mineralizacja wody | 1.5 dni |
| **Monetyzacja & Dostępność** | StoreKit 2, trial 14 dni, Family Sharing, VoiceOver, Dynamic Type, 35 języków | 3.5 dni |
| **Razem (Nakład sumaryczny):** | — | **25.0 dni pracy agenta** |

*Przy 2 równoległych strumieniach prac kalendarzowy czas wdrożenia wynosi **ok. 2.5–3 tygodnie**.*

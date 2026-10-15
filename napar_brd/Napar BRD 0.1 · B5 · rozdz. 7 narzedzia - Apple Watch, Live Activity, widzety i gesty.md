# **Napar BRD 0.1 — Część B5: Wymagania funkcjonalne — Apple Watch, Live Activity i Widżety**

---

### **BR-ZEG-001: Autonomiczna sesja parzenia na watchOS**
* **Opis:** Pełna, samodzielna aplikacja na Apple Watch umożliwiająca uruchomienie receptury, śledzenie etapów zalania i zakończenie sesji bez konieczności trzymania iPhone'a w dłoni.
* **Kryteria akceptacji:**
  1. Aplikacja zegarkowa działa w tle w trakcie aktywnej sesji parzenia (użycie sesji `WKExtendedRuntimeSession`).
  2. Wyraźny wyświetlacz: duży zegar etapu, docelowa waga zalania, numer kroku.
* **Priorytet:** MUST | **Etap:** MVP

### **BR-ZEG-002: Wzorzec haptyczny na nadgarstku (Haptic cues)**
* **Opis:** Unikalne impulsy Taptic Engine zegarka informujące o:
  - 3 sekundy do zalania: 2 delikatne puknięcia (`WKHapticType.directionUp`).
  - Start zalania: 1 mocne uderzenie (`WKHapticType.start`).
  - Koniec sesji: potrójna wibracja sukcesu (`WKHapticType.success`).
* **Priorytet:** MUST | **Etap:** MVP

### **BR-ZEG-003: Live Activity na zablokowanym ekranie iPhone'a**
* **Opis:** Integracja z frameworkiem ActivityKit. Aktywny widżet na zablokowanym ekranie prezentujący:
  - Aktualną fazę parzenia (np. *„Zalanie 2 z 3”*).
  - Odliczanie czasu fazy i czasu całkowitego.
  - Docelową wagę wody w gramach.
* **Priorytet:** MUST | **Etap:** MVP

### **BR-ZEG-004: Wsparcie dla Dynamic Island (iPhone 14 Pro+)**
* **Opis:** Kompaktowy widok w Dynamic Island podczas korzystania z innych aplikacji (np. czytanie wiadomości w trakcie parzenia kawy):
  - Tryb zwinięty: ikona filiżanki + czas uciekający.
  - Tryb rozwinięty (przytrzymanie): pełny podgląd gramatury i przycisk pauzy.
* **Priorytet:** MUST | **Etap:** MVP

### **BR-ZEG-005: Widżety ekranu początkowego iOS (WidgetKit)**
* **Opis:**
  1. Widżet mały (Small): poziom kofeiny w organizmie w czasie rzeczywistym + czas do zera kofeiny.
  2. Widżet średni (Medium): stan kofeiny + szybki przycisk rozpoczęcia parzenia ulubionej porannej kawy.
* **Priorytet:** SHOULD | **Etap:** MVP

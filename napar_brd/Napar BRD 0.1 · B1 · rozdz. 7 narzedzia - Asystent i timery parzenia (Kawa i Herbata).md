# **Napar BRD 0.1 — Część B1: Wymagania funkcjonalne — Asystent i timery parzenia (Kawa i Herbata)**

---

### **BR-PARZ-001: Precyzyjny stoper parzenia z dokładnością dziesiętnych sekundy**
* **Opis:** Główny stoper sesji mierzy czas od momentu rozpoczęcia pierwszego zalania (preinfuzji) z dokładnością do 0.1 sekundy. Wyświetlacz prezentuje minuty i sekundy (np. `02:45.3`).
* **Persona:** Michał (P1), Karolina (P2).
* **Kryteria akceptacji:**
  1. Stoper nie gubi czasu przy przejściu aplikacji do tła ani przy wygaszeniu ekranu (wyliczenie oparte na monotonicznym zegarze systemowym `CACurrentMediaTime`).
  2. Kliknięcie start uruchamia odliczanie w czasie poniżej 50 ms.
  3. Wyświetlacz odświeża się płynnie z częstotliwością 60/120 Hz (ProMotion).
* **Priorytet:** MUST | **Etap:** MVP

### **BR-PARZ-002: Wieloetapowy podział zalania (Multi-pour engine)**
* **Opis:** Receptura może składać się z dowolnej liczby zdefiniowanych kroków: faza preinfuzji (blooming), kolejne zalania wagowe (pours), faza spływu (drawdown).
* **Persona:** Michał (P1).
* **Kryteria akceptacji:**
  1. Każdy etap definiuje: czas trwania (lub oczekiwanie na zakończenie zalania), docelową wagę wody w gramach (skumulowaną lub per etap) oraz instrukcję słowną (np. *„Zalej spiralnym ruchem 60g wody w 15 sekund”*).
  2. Przejście między etapami następuje automatycznie na podstawie zdefiniowanego czasu lub po ręcznym stuknięciu.
* **Priorytet:** MUST | **Etap:** MVP

### **BR-PARZ-003: Sygnalizacja dźwiękowa i haptyczna zmiany etapu**
* **Opis:** Aplikacja powiadamia użytkownika na 3 sekundy przed końcem bieżącej fazy oraz dokładnie w momencie rozpoczęcia kolejnego zalania.
* **Persona:** Michał (P1), Ewa (P4).
* **Kryteria akceptacji:**
  1. Wyrazisty wzorzec haptyczny Taptic Engine (`UIImpactFeedbackGenerator(style: .heavy)`).
  2. Subtelny, naturalny dźwięk dzwonka lub czarki, niesłyszalny w tle muzyki, ale wyraźny w cichej kuchni.
  3. Możliwość wyciszenia dźwięków w ustawieniach z zachowaniem samej haptyki.
* **Priorytet:** MUST | **Etap:** MVP

### **BR-PARZ-004: Ochrona przed przypadkowym przerwaniem sesji**
* **Opis:** Zatrzymanie lub skasowanie trwającego parzenia wymaga dłuższego przytrzymania przycisku stop (0.8s) lub potwierdzenia w oknie dialogowym.
* **Persona:** Michał (P1).
* **Kryteria akceptacji:**
  1. Przypadkowe dotknięcie ekranu mokrym palcem nie przerywa odliczania.
  2. Animowany wskaźnik wypełnienia wokół przycisku podczas przytrzymania.
* **Priorytet:** MUST | **Etap:** MVP

### **BR-PARZ-005: Tryb parzenia wieloetapowego Gongfu Cha (Herbata)**
* **Opis:** Specjalistyczny silnik dla tradycyjnego parzenia herbaty chińskiej (Gongfu Cha) z obsługą wielu krótkich zalań (od 1 do 15) tych samych liści.
* **Persona:** Karolina (P2).
* **Kryteria akceptacji:**
  1. Wyświetlacz pokazuje numer bieżącego zalania (np. *„Zalanie 4 / 8”*).
  2. Czas bieżącego parzenia jest automatycznie powiększany o zdefiniowany przyrost (np. +5 sekund z każdym kolejnym zalaniem).
  3. Pomiędzy zalaniami stoper wchodzi w tryb pauzy/oczekiwania na kolejną czarkę, zliczając czas odpoczynku liści.
* **Priorytet:** MUST | **Etap:** MVP

### **BR-PARZ-006: Zabezpieczenie przed wygaszaniem ekranu (Awake Mode)**
* **Opis:** Podczas aktywnej sesji parzenia aplikacja blokuje automatyczne wygaszanie ekranu iPhone'a (`UIApplication.shared.isIdleTimerDisabled = true`).
* **Persona:** Michał (P1), Karolina (P2).
* **Kryteria akceptacji:**
  1. Ekran pozostaje włączony przez cały czas trwania parzenia.
  2. Po zakończeniu lub anulowaniu sesji blokada wygaszania jest natychmiast zdejmowana, aby chronić baterię.
* **Priorytet:** MUST | **Etap:** MVP

### **BR-MŁYNEK-001: Integracja młynka domowego i przelicznik mikronów/klików**
* **Opis:** Asystent parzenia oraz ekran Ustawień integrują selektor domowego młynka użytkownika z obsługą wiodących konstrukcji specialty: Comandante C40 MK3/MK4 (krok 30 µm), Timemore Chestnut C2/C3 (krok 35 µm), 1Zpresso K-Ultra/K-Max (krok 20 µm), Fellow Ode Gen 2 (krok 40 µm), Baratza Encore (krok 28 µm), Kingrinder K6 (krok 16 µm).
* **Persona:** Michał (P1), Maciej (P3).
* **Kryteria akceptacji:**
  1. Wybór młynka jest trwale zapamiętywany w lokalnej bazie SQLite (`app_settings`), dzięki czemu użytkownik nie musi go ponownie konfigurować przy kolejnych sesjach.
  2. Asystent parzenia w czasie rzeczywistym przelicza optymalną grubość przemiału dla wybranej metody i receptury (na bazie docelowej wielkości cząstek w mikronach µm) i wyświetla rekomendowaną liczbę klików / nastawę (np. dla V60: 720 µm -> 24 kliki Comandante, 21 klików Timemore, 7.2 1Zpresso, 5.1 Fellow Ode).
  3. Kliknięcie w pigułkę młynka na ekranie głównym otwiera modal szybkiej zmiany młynka z podglądem przeliczenia dla wszystkich wspieranych modeli.
* **Priorytet:** MUST | **Etap:** MVP

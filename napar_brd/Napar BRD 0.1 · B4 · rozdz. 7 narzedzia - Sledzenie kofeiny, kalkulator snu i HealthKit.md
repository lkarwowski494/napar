# **Napar BRD 0.1 — Część B4: Wymagania funkcjonalne — Śledzenie kofeiny, kalkulator snu i HealthKit**

---

### **BR-KOF-001: Matematyczny model zawartości kofeiny w naparze**
* **Opis:** Aplikacja automatycznie estymuje zawartość kofeiny (mg) w przygotowanym naparze w oparciu o:
  - Gatunek ziaren (Arabica: średnio 1.2% suchej masy; Robusta: 2.2% suchej masy).
  - Dozę suchej kawy (g).
  - Stopień ekstrakcji metody (przelew/filtr: ~85–90% ekstrakcji kofeiny; espresso: ~75–80%; cold brew: ~90%).
  - W przypadku herbaty: rodzaj liścia Camellia sinensis oraz numer zalania (ekstrakcja kofeiny maleje gwałtownie z każdym kolejnym zalaniem Gongfu).
* **Kryteria akceptacji:**
  1. Obliczona wartość kofeiny prezentowana jest na podsumowaniu sesji.
  2. Możliwość ręcznej korekty wartości przez użytkownika.
* **Priorytet:** MUST | **Etap:** MVP

### **BR-KOF-002: Zapis do Apple HealthKit (Dietary Caffeine)**
* **Opis:** Zapisanie spożytej dawki kofeiny bezpośrednio w systemowej bazie Apple Health jako próbki ilościowej typu `HKQuantityTypeIdentifierDietaryCaffeine`.
* **Kryteria akceptacji:**
  1. Aplikacja prosi o uprawnienie zapisu do HealthKit w przejrzystym oknie kontekstowym, wyjaśniając korzyści.
  2. Zapis następuje ze znacznikiem czasu wypicia kawy.
  3. Pełna obsługa sytuacji braku zgody na HealthKit (aplikacja działa normalnie, utrzymując dane we własnej bazie).
* **Priorytet:** MUST | **Etap:** MVP

### **BR-KOF-003: Krzywa eliminacji kofeiny i kalkulator okna snu (Sleep Curfew)**
* **Opis:** Farmakokinetyczny wykres stężenia kofeiny we krwi w czasie z uwzględnieniem czasu półtrwania ($t_{1/2} = 5.0\,\text{h}$).
* **Kryteria akceptacji:**
  1. Użytkownik definiuje w ustawieniach planowaną godzinę snu (np. 23:00) oraz maksymalny dopuszczalny próg kofeiny (domyślnie 25 mg).
  2. Aplikacja wyświetla informację: *„Twój przewidywany poziom kofeiny o 23:00 wyniesie 18 mg (Bezpiecznie dla snu głębokiego)”* lub ostrzeżenie: *„Poziom o 23:00 wyniesie 64 mg (Ryzyko spłycenia snu)”*.
  3. Dynamiczny wskaźnik: *„Kolejna kawa po godzinie 16:45 zaburzy Twój sen”*.
* **Priorytet:** MUST | **Etap:** MVP

### **BR-KOF-004: Dobowy licznik kofeiny z normami EFSA**
* **Opis:** Pasek postępu sumarycznej dawki kofeiny spożytej w danym dniu kalendarzowym w odniesieniu do limitu 400 mg dla zdrowego dorosłego człowieka.
* **Priorytet:** MUST | **Etap:** MVP

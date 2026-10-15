# **Napar BRD 0.1 — Część B2: Wymagania funkcjonalne — Magazyn ziaren, liści i receptury**

---

### **BR-MAG-001: Szczegółowa kartoteka ziaren kawy**
* **Opis:** Cyfrowy rejestr paczek kawy posiadanych przez użytkownika.
* **Pola danych:** Nazwa kawy, Palarnia, Kraj pochodzenia, Region, Farma / Producent, Odmiana botaniczna (np. Geisha, Bourbon, SL28), Metoda obróbki (Washed, Natural, Honey, Anaerobic), Data palenia (Roast Date), Waga początkowa paczki (g), Sugerowany profil sensoryczny z etykiety.
* **Kryteria akceptacji:**
  1. Dodanie nowej paczki wymaga minimum 2 pól (Nazwa, Data palenia), pozostałe są opcjonalne.
  2. Baza zawiera predefiniowaną listę popularnych krajów pochodzenia i metod obróbki.
* **Priorytet:** MUST | **Etap:** MVP

### **BR-MAG-002: Wskaźnik świeżości i okna degustacyjnego (Resting window)**
* **Opis:** System oblicza liczbę dni od daty palenia i wizualizuje stan ziaren:
  - *Dni 1–5:* Faza odgazowywania (CO2) – ostrzeżenie: „Kawa może być zbyt świeża, zalecany resting”.
  - *Dni 6–30:* Optymalne okno degustacyjne (Peak Flavor).
  - *Dni 31–60:* Stabilna dojrzałość.
  - *Powyżej 60 dni:* Starzenie – podpowiedź: „Rozważ zamrożenie lub szybsze zużycie”.
* **Kryteria akceptacji:**
  1. Automatyczna aktualizacja statusu każdego dnia o północy.
  2. Wizualizacja kolorystyczna na karcie ziarna.
* **Priorytet:** MUST | **Etap:** MVP

### **BR-MAG-003: Kartoteka herbaty rzemieślniczej**
* **Opis:** Rejestr herbat sypanych i prasowanych.
* **Pola danych:** Nazwa herbaty, Rodzaj (Biała, Zielona, Żółta, Wulong, Czarna/Czerwona, Ciemna/Puerh, Ziołowa), Rok i sezon zbioru (np. Wiosna 2025), Ogród herbaciany / Region, Kultywar, Rekomendowana temperatura wody.
* **Priorytet:** MUST | **Etap:** MVP

### **BR-MAG-004: Automatyczne śledzenie zużycia paczki**
* **Opis:** Każda zakończona sesja parzenia automatycznie odejmuje użytą dozę (np. 15g) od wagi początkowej paczki.
* **Kryteria akceptacji:**
  1. Gdy waga w paczce spadnie do 0g, aplikacja pyta: *„Paczka skończona? Przenieść do archiwum?”*.
  2. Możliwość ręcznej korekty wagi (np. w przypadku odsypania próbek dla znajomego).
* **Priorytet:** SHOULD | **Etap:** MVP

### **BR-MAG-005: Wzorcowa biblioteka receptur mistrzowskich**
* **Opis:** Wbudowany zestaw 12 zweryfikowanych receptur z opisem kroków i parametrów:
  1. V60 Tetsu Kasuya 4:6 (kawa)
  2. V60 James Hoffmann Single Cup (kawa)
  3. V60 Scott Rao (kawa)
  4. Aeropress Inverted Championship Recipe (kawa)
  5. Aeropress Standard Classic (kawa)
  6. Chemex Classic 3-Cup (kawa)
  7. French Press Hoffmann Technique (kawa)
  8. Kalita Wave 155 (kawa)
  9. Gongfu Cha: Wulong skalny Da Hong Pao (herbata)
  10. Gongfu Cha: Sheng Puerh (herbata)
  11. Sencha japońska tradycyjna (herbata)
  12. Biała herbata Pai Mu Tan (herbata)
* **Priorytet:** MUST | **Etap:** MVP

---

### **BR-WODA-001: Profile mineralizacji wody specialty dla kawy i herbaty**
* **Opis:** Baza zweryfikowanych profili chemicznych wody dla różnych metod parzenia i rodzajów surowca:
  1. *Barista Hustle 80/40:* Złoty standard dla jasnych filtrów (Etiopia, Kenia, Geisha) – GH 80, KH 40.
  2. *Standard SCA:* Oficjalny profil Specialty Coffee Association dla cuppingu i turniejów Brewers Cup – GH 68, KH 40.
  3. *Melbourne Sweet & Soft:* Bardzo miękka woda podkreślająca krystaliczną czystość i nuty kwiatowe – GH 50, KH 25.
  4. *Scott Rao Wonder Water:* Lekko wyższy bufor i twardość zapewniające gęstsze body i długi finisz – GH 85, KH 45.
  5. *Hendon Hard Water:* Wyższa mineralizacja buforująca nadmiar kwasowości w kawach średnio i ciemniej palonych – GH 120, KH 60.
  6. *Herbata Szlachetna (Zielona / Biała):* Niska mineralizacja chroniąca delikatne aminokwasy L-teaniny – GH 30, KH 15.
  7. *Gongfu Wulong & Puerh (Górska Woda):* Zrównoważona twardość magnezowa wydobywająca mineralność Yan Cha – GH 60, KH 30.
* **Kryteria akceptacji:**
  1. Każdy profil podaje docelową twardość ogólną (GH) oraz alkaliczność/bufor (KH) w ppm CaCO3.
  2. Prezentacja rekomendowanych zastosowań sensorycznych w języku polskim i angielskim.
* **Priorytet:** MUST | **Etap:** MVP

### **BR-WODA-002: Dwutorowy kalkulator remineralizacji wody bazowej (RO / Demi)**
* **Opis:** Automatyczne przeliczanie gramatur koncentratów lub soli suchych dla zadanej objętości wody bazowej (od 0.5L do 18.9L / baniak 5 galonów):
  - *Metoda A (System Koncentratów Barista Hustle):* Roztwór buforowy A (1.68g NaHCO3 / 500g wody) i roztwór twardości B (2.45g MgSO4 / 500g wody). Zależność liniowa: 1g koncentratu na 1L wody = 2 ppm KH / GH.
  - *Metoda B (Suche Sole):* Bezpośrednie odważanie mikrowagą sody oczyszczonej (NaHCO3), soli Epsom (MgSO4·7H2O) oraz chlorku wapnia (CaCl2·2H2O).
* **Kryteria akceptacji:**
  1. Suwak objętości wody od 0.5L do 20L z natychmiastowym przeliczeniem w czasie < 1 ms.
  2. Obsługa profili predefiniowanych oraz w pełni konfigurowalnego profilu Custom GH / KH.
* **Priorytet:** MUST | **Etap:** MVP

### **BR-WODA-003: Benchmark i selektor popularnych wód butelkowanych**
* **Opis:** Wbudowany poradnik powszechnie dostępnych wód butelkowanych z ich parametrami TDS, szacowanym GH i KH oraz oceną przydatności (*Doskonała*, *Dobra*, *Akceptowalna*, *Niezalecana*). Chroni użytkownika bez filtra RO przed zepsuciem naparu wodą o nadmiernym buforze (np. Muszynianka TDS 1400 ppm).
* **Priorytet:** SHOULD | **Etap:** MVP

### **BR-WODA-004: Powiązanie profilu wody z sesją parzenia i zapis w dzienniku**
* **Opis:** Użytkownik może jednym stuknięciem przypisać profil użytej wody na karcie podsumowania parzenia. Wpis w dzienniku degustacji prezentuje plakietkę wody wraz z jej parametrami.
* **Priorytet:** MUST | **Etap:** MVP

### **BR-WODA-005: Diagnoza chemiczna i sensoryczna wody w module Dial-in Doctor**
* **Opis:** Silnik diagnostyczny analizujący wpływ parametrów chemicznych wody na wady smakowe naparu:
  - Zbyt wysoki bufor (KH > 75 ppm): neutralizacja kwasów organicznych, płaski, kredowy napar -> zalecenie rozcieńczenia do KH ok. 35-45 ppm.
  - Zbyt niski bufor (KH < 20 ppm): ostry, chemiczny kwas, brak słodyczy -> zalecenie dodania buforu sodowego.
  - Zbyt mała twardość (GH < 35 ppm): cienkie body, wodnisty finisz -> zalecenie dodania magnezu.
  - Zbyt duża twardość (GH > 150 ppm): sucha gorycz, nadekstrakcja garbników -> zalecenie zmiękczenia.
* **Priorytet:** MUST | **Etap:** MVP

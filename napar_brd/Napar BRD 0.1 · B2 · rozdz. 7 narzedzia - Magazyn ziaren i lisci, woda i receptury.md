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

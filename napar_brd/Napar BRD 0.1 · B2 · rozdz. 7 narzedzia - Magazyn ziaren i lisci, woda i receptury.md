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
* **Opis:** Wbudowany zestaw 24 zweryfikowanych receptur specialty dla kawy i herbaty rzemieślniczej z precyzyjnym opisem kroków, wag, czasów i parametrów ekstrakcji:
  *Kawa (14 receptur):*
  1. V60 Tetsu Kasuya 4:6 (Brewers Cup 2016)
  2. V60 James Hoffmann Single Cup Technique
  3. AeroPress Inverted (World AeroPress Championship)
  4. French Press James Hoffmann Technique (Czysty Napar)
  5. Chemex Classic 3-Cup (Klasyk Specialty)
  6. Kalita Wave 185 (George Howell Coffee)
  7. Espresso Specialty Double Shot 1:2 (WBC Standard Protocol)
  8. Cupping SCA Standard Protocol (Ocena sensoryczna)
  9. Hario Switch Hybryda Kasuya God/Devil (Imersja + Perkolacja)
  10. AeroPress Tim Wendelboe Classic (Standard)
  11. Origami Dripper High Extraction Sweetness (Du Jianing WBrC 2019)
  12. Clever Dripper Czysta Imersja Water-First (Hoffmann)
  13. Espresso Turbo Shot o wysokim uzysku 1:3 (Hendon / Barista Hustle)
  14. AeroPress Fellow Prismo Espresso-Style Concentrate
  *Herbata rzemieślnicza (10 receptur):*
  15. Gongfu Cha: Wulong skalny Da Hong Pao (Wuyi Shan)
  16. Gongfu Cha: Młody Sheng Puerh (Yunnan)
  17. Sencha japońska tradycyjna (Rytuał Kyusu)
  18. Biała herbata Pai Mu Tan (Fujian Artisan)
  19. Gyokuro Uji Shizuku-cha (Ekstrakcja kropla po kropli, 60°C)
  20. Matcha Ceremonialna Usucha (Ubijanie Chasen, Urasenke)
  21. Hojicha Kyoto Roast (Prażone liście i łodyżki w Kyusu)
  22. Dong Ding Oolong Mroźny Szczyt (Taiwan High Mountain Gongfu)
  23. Tie Guan Yin Żelazna Bogini Miłosierdzia (Anxi Gongfu)
  24. Masala Chai Tradycyjny Dekokt Korzenny (Dhaba Punjab)
* **Kryteria akceptacji:**
  1. Każda receptura definiuje: dozę (g), wagę wody (g), temperaturę wody (°C), zalecany przemiał, rekomendowane ratio oraz sekwencję kroków.
  2. Suma wagi wody w ostatnim kroku jest ściśle równa docelowej objętości wody receptury.
  3. Zgodność z aksjomatami parzenia specialty weryfikowana kontraktem testowym (contracts.test.ts).
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

---

### **BR-WIEDZA-001: Encyklopedia odmian botanicznych, metod obróbki i terroir kawy**
* **Opis:** Wbudowane kompendium wiedzy specialty oparte na danych botanicznych i agronomicznych (World Coffee Research, SCA):
  1. *Odmiany botaniczne (10 odmian):* Geisha/Gesha, SL28 & SL34, Pink Bourbon, Ethiopian Heirloom/Landraces, Bourbon, Typica, Caturra & Catuai, Pacamara & Maragogype, Castillo & Colombia, Coffea Eugenioides.
  2. *Metody obróbki (6 procesów):* Washed (Myta/Mokra), Natural (Sucha), Honey (Yellow, Red, Black), Anaerobic (Maceracja beztlenowa w tankach), Carbonic Maceration (Maceracja węglowa CO2), Wet-Hulled (Giling Basah Sumatra).
  3. *Terroir & Kraje (7 głównych eksporterów specialty):* Etiopia, Kenia, Kolumbia, Gwatemala, Kostaryka, Brazylia, Panama z wysokościami upraw, oknami zbiorów i unikalnymi profilami sensorycznymi.
* **Kryteria akceptacji:**
  1. Dostęp do bazy wiedzy bezpośrednio z zakładki Spiżarnia (przycisk „📚 Baza wiedzy”) oraz w formularzu dodawania nowej paczki.
  2. Możliwość jednym stuknięciem przeniesienia parametrów odmiany/kraju jako szablonu do formularza nowej paczki w spiżarni.
  3. Wyszukiwarka dynamiczna filtrująca wg nazwy, kraju lub nut sensorycznych w czasie < 5 ms.
* **Priorytet:** MUST | **Etap:** MVP

### **BR-WIEDZA-002: Kompendium tradycji i klasyfikacji herbaty rzemieślniczej**
* **Opis:** Usystematyzowany przewodnik po 6 tradycyjnych kategoriach herbaty z kręgu chińskiego i japońskiego:
  1. *Biała (Bai Cha):* Pąki Silver Needle, liście Pai Mu Tan, minimalna oksydacja 5-10%, parzenie 80°C.
  2. *Zielona (Lü Cha / Ryokucha):* Sha Qing w woku (Long Jing) vs parowanie wodne (Sencha, Gyokuro, Matcha), 0% oksydacji, aminokwasy L-teaniny, parzenie 70-75°C.
  3. *Żółta (Huang Cha):* Unikalna autooksydacja Men Huang (duszenie w wilgotnym płótnie), znikoma goryczka, parzenie 85°C.
  4. *Wulong (Oolong / Wulong Cha):* Skalne Yan Cha (Da Hong Pao, Rou Gui), tajwańskie Oolongi wysokogórskie (Dong Ding, Ali Shan), oksydacja 15-70%, parzenie 95°C.
  5. *Czarna / Czerwona (Hong Cha):* Zheng Shan Xiao Zhong, Keemun, Yunnan Dian Hong, Darjeeling, pełna oksydacja 100%, parzenie 98°C.
  6. *Ciemna / Puerh (Heicha / Puerh Cha):* Dojrzewanie mikrobiologiczne Sheng (Raw) vs Wo Dui Shou (Ripe), parzenie 98°C.
* **Kryteria akceptacji:**
  1. Każda kategoria podaje: stopień utlenienia, temperaturę parzenia, metodę Sha Qing, słynne odmiany i regiony oraz właściwości prozdrowotne.
  2. Dedykowany szablon herbaty umożliwiający natychmiastowe utworzenie karty w spiżarni.
* **Priorytet:** MUST | **Etap:** MVP

### **BR-SHARE-001: Wymiana receptur offline (Kody QR SVG i Universal Links)**
* **Opis:** Wymiana autorskich i zmodyfikowanych receptur peer-to-peer w 100% offline, bez konieczności logowania, chmury, rejestracji konta ani backendu (zgodnie z DEC-20 oraz filozofią Apps4Brew).
* **Persona:** Michał (P1), Karolina (P2), Maciej (P3).
* **Kryteria akceptacji:**
  1. Generowanie wektorowego kodu QR SVG (`react-native-svg`) renderowanego bezpośrednio na ekranie urządzenia.
  2. Generowanie kompaktowego łańcucha parametrów receptury i kroków w formacie Base64 (kodowanie UTF-8) z prefiksem schematu deep-link `napar://recipe?v=1&d=...` oraz universal link `https://napar.app/recipe?v=1&d=...`.
  3. Obsługa natywnego udostępniania systemowego iOS/Android (`Share.share`) oraz kopiowania linku do schowka.
  4. Wbudowany w asystencie modal importu z wklejaniem linku lub skanem QR, natychmiastowym podglądem parametrów i kroków oraz opcją jednoklikowego zapisu do lokalnej bazy danych SQLite użytkownika.
* **Priorytet:** MUST | **Etap:** MVP

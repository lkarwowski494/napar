# **Napar BRD 0.1 — Część B3: Wymagania funkcjonalne — Dziennik parzeń i sensoryka**

---

### **BR-DZIEN-001: Automatyczny zapis sesji w dzienniku**
* **Opis:** Po zakończeniu parzenia tworzony jest wpis w dzienniku zawierający: dokładną datę i godzinę, powiązane ziarno/herbatę, użytą recepturę, dozę surowca, wagę wody, czas ekstrakcji, temperaturę wody oraz nastawę młynka.
* **Kryteria akceptacji:**
  1. Zapis odbywa się automatycznie w bazie lokalnej w czasie < 20 ms.
  2. Użytkownik może pominąć ocenę smakową i wrócić do niej w ciągu 2 godzin (dopiero po ostudzeniu naparu do temperatury picia).
* **Priorytet:** MUST | **Etap:** MVP

### **BR-DZIEN-002: Szybka ocena filiżanki (Quick Rating)**
* **Opis:** Błyskawiczna ocena satysfakcji z naparu w skali 1–5 gwiazdek (z połówkami) oraz prosty trójkąt balansu: Kwasowość (Acidity), Słodycz (Sweetness), Gorycz (Bitterness).
* **Priorytet:** MUST | **Etap:** MVP

### **BR-DZIEN-003: Interaktywne koło smaków SCA (Flavor Wheel)**
* **Opis:** Hierarchiczne koło deskryptorów smakowych oparte na standardzie Specialty Coffee Association / World Coffee Research:
  - *Poziom 1 (Kategoria główna):* Owoce, Kwiaty, Słodycz, Orzechy/Kakao, Przyprawy, Warzywne/Ziołowe, Palone.
  - *Poziom 2 (Podkategoria):* Owoce cytrusowe, Owoce pestkowe, Jagody, Suszone owoce.
  - *Poziom 3 (Konkretny deskryptor):* Cytryna, Limonka, Grejpfrut, Pomarańcza.
* **Kryteria akceptacji:**
  1. Wybór do 5 nut smakowych na napar.
  2. Wizualne podświetlenie wybranych segmentów koła.
* **Priorytet:** SHOULD | **Etap:** MVP

### **BR-DZIEN-004: Historia i filtrowanie dziennika**
* **Opis:** Przeglądanie historii parzeń z możliwością filtrowania wg: metody, konkretnego ziarna, oceny (tylko 4★+) oraz zakresu dat.
* **Kryteria akceptacji:**
  1. Płynne przewijanie listy 500+ wpisów bez opóźnień (SwiftUI lazy loading).
  2. Kliknięcie w historyczną sesję pozwala wybrać opcję *„Parz ponownie z tymi samymi parametrami”*.
* **Priorytet:** MUST | **Etap:** MVP

# **Napar BRD 0.1 — Część B6: Wymagania funkcjonalne — Kalkulatory, dane, zakupy i dostępność**

---

### **BR-KALK-001: Uniwersalny kalkulator Brew Ratio**
* **Opis:** Narzędzie do błyskawicznego przeliczania proporcji kawa:woda lub herbata:woda.
* **Funkcjonalność:**
  - Standardowe presety baristyczne: 1:15 (intensywna), 1:16.6 (standard SCA 60g/L), 1:17 (lekka, herbaciana), Gongfu 1:20 (5g na 100ml).
  - Wprowadź wagę ziaren (np. 18.5g) -> kalkulator natychmiast wylicza wagę wody (np. 308g).
  - Wprowadź pożądaną objętość napoju (np. 500g wody) -> kalkulator wylicza gramaturę ziaren.
* **Priorytet:** MUST | **Etap:** MVP

### **BR-KALK-002: Kalkulator TDS i Extraction Yield (Wydajność ekstrakcji)**
* **Opis:** Obliczenie procentowej wydajności ekstrakcji na podstawie wzoru SCA:
  $$EY\\,\\% = \\frac{\\text{Waga naparu (g)} \\times \\text{TDS (\\%)}}{\\text{Doza sucha (g)}}$$
* **Kryteria akceptacji:**
  1. Wynik porównywany z zakresem optymalnym SCA (18.0% – 22.0%).
  2. Komentarz wizualny: *Poniżej 18% = Under-extracted; 18–22% = Ideal; Powyżej 22% = Over-extracted*.
* **Priorytet:** SHOULD | **Etap:** MVP

### **BR-DANE-001: Kopia zapasowa w iCloud Drive i darmowy eksport JSON**
* **Opis:** Pełne bezpieczeństwo danych użytkownika. Baza SQLite automatycznie tworzy zaszyfrowany plik kopii zapasowej w dedykowanym folderze iCloud Drive użytkownika.
* **Kryteria akceptacji:**
  1. Eksport całej bazy do otwartego formatu JSON i CSV jest w 100% bezpłatny i nielimitowany (ZP-07).
  2. Przywrócenie danych z pliku JSON na nowym urządzeniu trwa poniżej 1 sekundy.
* **Priorytet:** MUST | **Etap:** MVP

### **BR-ZAK-001: Integracja ze StoreKit 2 i Family Sharing**
* **Opis:** Obsługa zakupów subskrypcyjnych (miesiąc/rok) oraz zakupu dożywotniego za pośrednictwem natywnego API Apple StoreKit 2.
* **Kryteria akceptacji:**
  1. Obsługa 14-dniowego darmowego okresu próbnego dla planu rocznego.
  2. Przycisk „Przywróć zakupy” (Restore Purchases) dostępny w widocznym miejscu paywalla.
  3. Obsługa Chmury rodzinnej (Family Sharing) włączona dla wszystkich produktów.
* **Priorytet:** MUST | **Etap:** MVP

### **BR-DOST-001: Pełna dostępność VoiceOver i Dynamic Type**
* **Opis:** Interfejs jest w 100% użyteczny dla osób niewidomych i słabowidzących.
* **Kryteria akceptacji:**
  1. Każdy przycisk, pole edycyjne i faza timera posiada precyzyjne `accessibilityLabel` i `accessibilityHint`.
  2. Timer w trybie VoiceOver anonsuje zmiany fazy głosem syntetycznym.
  3. Skalowanie czcionek do największych rozmiarów Dynamic Type bez ucinania tekstu.
* **Priorytet:** MUST | **Etap:** MVP

### **BR-JEDN-001: Globalny przełącznik jednostek miar (Metric / Imperial — DEC-21)**
* **Opis:** Obsługa jednostek metrycznych (°C, g, ml) oraz imperialnych (°F, oz, fl oz) z globalnym selektorem w Ustawieniach.
* **Persona:** Michał (P1), Piotr (P3), użytkownicy rynków USA/UK.
* **Kryteria akceptacji:**
  1. Precyzyjne, deterministyczne formuły przeliczeniowe temperatury ($F = C \times 1.8 + 32$), gramatur surowca ($1\,\text{oz} \approx 28.35\,\text{g}$) oraz objętości wody ($1\,\text{fl oz} \approx 29.57\,\text{ml}$).
  2. Wybór jednostek jest trwale zapamiętywany w lokalnej bazie danych SQLite (`app_settings`).
  3. Wszystkie ekrany aplikacji (Asystent Parzenia, Spiżarnia, Dziennik, Kalkulatory) respektują wybrany układ jednostek.
* **Priorytet:** MUST | **Etap:** MVP

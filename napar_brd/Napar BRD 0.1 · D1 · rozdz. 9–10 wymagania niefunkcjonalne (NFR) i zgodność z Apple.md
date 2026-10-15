# **Napar BRD 0.1 — Część D1: Wymagania niefunkcjonalne (NFR) i zgodność z Apple (Rozdziały 9–10)**

---

## **9. Wymagania niefunkcjonalne (NFR)**

### **9.1 Działanie offline i niezawodność (NFR-OFF)**
* **NFR-OFF-001:** 100% funkcjonalności aplikacji (stoper, magazyn, kalkulatory, Dial-in Doctor, historia) działa bez połączenia z siecią internetową.
* **NFR-OFF-002:** Brak jakichkolwiek blokad uruchomienia aplikacji w trybie samolotowym lub przy braku karty SIM.

### **9.2 Wydajność i responsywność (NFR-WYD)**
* **NFR-WYD-001:** Czas zimnego startu aplikacji (Cold launch) na urządzeniach od iPhone 12 w górę wynosi poniżej 400 ms do pełnej interaktywności.
* **NFR-WYD-002:** Zużycie pamięci RAM w trakcie aktywnej sesji parzenia z animowanym Live Activity nie przekracza 45 MB.
* **NFR-WYD-003:** Timer nie wykazuje dryfu czasowego większego niż 10 ms na 10 minut pracy.

### **9.3 Dostępność (NFR-DOST)**
* **NFR-DOST-001:** Wszystkie interaktywne kontrolki posiadają minimalny obszar dotyku $44 \times 44\,\text{pt}$ (zgodnie z Apple Human Interface Guidelines).
* **NFR-DOST-002:** Kontrast kolorystyczny tekstów do tła wynosi co najmniej 4.5:1 (standard WCAG 2.1 AA) w obu trybach (Light i Dark).

### **9.4 Prywatność i bezpieczeństwo (NFR-BEZP)**
* **NFR-BEZP-001:** Privacy Manifest (`PrivacyInfo.xcprivacy`) deklaruje brak gromadzenia danych śledzących (`NSPrivacyTracking = false`).
* **NFR-BEZP-002:** Dane Apple HealthKit (kofeina) nigdy nie są kopiowane poza piaskownicę aplikacji i chronione są kluczem szyfrującym urządzenia (Data Protection Class A).

---

## **10. Zgodność z wytycznymi Apple App Store Review Guidelines**

| Wytyczna | Wymóg Apple | Realizacja w Naparze | Ryzyko |
| :--- | :--- | :--- | :--- |
| **3.1.2(a)** | Wartość ciągła przy subskrypcjach | Regularne aktualizacje profili ziaren, sezonowe receptury, zaawansowane narzędzia analizy snu i kofeiny. Dostępny zakup jednorazowy Lifetime. | Niskie |
| **4.3(a)** | Zakaz tworzenia klonów i spamu | Połączenie Kawy i Herbaty w jedną unikalną aplikację Napar; brak dublowania aplikacji w sklepie. | Bardzo niskie |
| **4.3(b)** | Wymóg bogatej funkcjonalności | Aplikacja nie jest prostym minutnikiem: zawiera Dial-in Doctora, koło smaków SCA, model farmakokinetyczny kofeiny, Live Activity i watchOS. | Niskie |
| **5.1.1** | Ochrona danych i prywatność | Pełne działanie lokalne; brak wymogu podawania e-maila, brak rejestracji konta; status „Data Not Collected”. | Zerowe |
| **5.1.2(i)** | Ochrona danych zdrowotnych | Zapis do HealthKit wyłącznie za jawną zgodą użytkownika; brak wysyłania danych kofeiny na zewnętrzne serwery. | Zerowe |

# **Napar BRD 0.1 — Część C2: Reguły dziedzinowe RD-01…RD-16 (Ekstrakcja, Ratio, TDS, Woda)**

---

### **RD-01: Proporcja parzenia kawy przelewowej (Brew Ratio - Filter)**
* **Poziom pewności:** **STANDARD** (Specialty Coffee Association).
* **Definicja reguły:** Standardowa doza kawy przelewowej wynosi 60 g kawy na 1000 g wody (proporcja 1:16.67). Zakres dopuszczalny dla metod alternatywnych wynosi od 1:14 (bardzo intensywna) do 1:18 (lekka, herbaciana).
* **Wzór:**
  $$\text{Masa wody (g)} = \text{Doza kawy (g)} \times \text{Ratio}$$
  $$\text{Doza kawy (g)} = \frac{\text{Masa wody (g)}}{\text{Ratio}}$$
* **Wektory testowe:**
  - *Wejście:* Doza = 15.0 g, Ratio = 1:16.0 -> *Wynik:* Woda = 240.0 g.
  - *Wejście:* Woda = 500.0 g, Ratio = 1:16.67 -> *Wynik:* Doza = 30.0 g.

---

### **RD-02: Absorpcja wody przez zmieloną kawę (Water Retention Index)**
* **Poziom pewności:** **MATH / STANDARD** (Jonathan Gagné, *The Physics of Filter Coffee*).
* **Definicja reguły:** Zmielone ziarna kawy zatrzymują w filtrze wodę w ilości równej ok. dwukrotności swojej suchej masy.
* **Wzór:**
  $$\text{Masa uzyskanego naparu (g)} = \text{Masa wlanej wody (g)} - (\text{Doza kawy (g)} \times 2.0)$$
* **Wektory testowe:**
  - *Wejście:* Doza = 18.0 g, Woda = 300.0 g.
  - *Oczekiwany napar:* $300.0 - (18.0 \times 2.0) = 264.0\,\text{g}$.

---

### **RD-03: Wydajność ekstrakcji (Extraction Yield - EY %)**
* **Poziom pewności:** **STANDARD** (SCA Coffee Brewing Handbook).
* **Definicja reguły:** Odsetek masy suchej kawy, który przeszedł do roztworu wodnego naparu. Optymalny zakres według standardu Golden Cup wynosi **18.0% – 22.0%**.
* **Wzór:**
  $$EY\,\% = \frac{\text{Masa naparu (g)} \times \text{TDS (\%)}}{\text{Doza sucha (g)}}$$
* **Wektory testowe:**
  - *Wejście:* Doza = 15.0 g, Masa naparu = 220.0 g, TDS = 1.35%.
  - *Obliczenie:* $EY = (220.0 \times 1.35) / 15.0 = 297.0 / 15.0 = 19.80\,\%$.
  - *Ocena:* **Ideal (Golden Cup)**.
  - *Brzegowy:* Doza = 20.0 g, Napar = 300.0 g, TDS = 1.00% -> $EY = 15.0\,\%$ -> **Under-extracted**.

---

### **RD-04: Skład i mineralizacja wody baristycznej**
* **Poziom pewności:** **STANDARD** (SCA Water Quality Standard).
* **Definicja reguły:** Woda idealna do parzenia kawy specialty powinna posiadać:
  - Twardość ogólna (General Hardness - GH): 50–175 ppm CaCO3 (optimum ~100–120 ppm). Jon magnezu ($Mg^{2+}$) i wapnia ($Ca^{2+}$) wyciągają związki smakowe.
  - Zasadowość / Bufor (Alkalinity - KH): 40–75 ppm CaCO3 (optimum ~40–50 ppm). Wodorowęglany neutralizują nadmiar kwasowości.
  - pH: 6.5 – 7.5.
  - TDS: 75 – 250 ppm (optimum ~150 ppm).

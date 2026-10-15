# **Napar BRD 0.1 — Część C3: Reguły dziedzinowe RD-17…RD-30 (Metabolizm kofeiny, Gongfu, Wektory)**

---

### **RD-17: Farmakokinetyka eliminacji kofeiny (Model jedno-kompartmentowy)**
* **Poziom pewności:** **MATH / STANDARD** (EFSA Panel on Dietetic Products, Nutrition and Allergies).
* **Definicja reguły:** Kofeina wchłania się w 99% w ciągu 45 minut od spożycia. Jej eliminacja z krwioobiegu następuje wg kinetyki pierwszego rzędu z okresem półtrwania $t_{1/2}$. Domyślny czas półtrwania u zdrowego dorosłego wynosi **5.0 godzin** ($k_e = \ln(2) / 5.0 \approx 0.1386\,\text{h}^{-1}$).
* **Wzór stężenia w czasie $t$ (godziny od spożycia):**
  $$C(t) = C_0 \cdot e^{-k_e \cdot t} = C_0 \cdot \left(\frac{1}{2}\right)^{\frac{t}{t_{1/2}}}$$
* **Wektory testowe:**
  - *Wejście:* Dawka początkowa $C_0 = 120\,\text{mg}$, Czas $t = 5.0\,\text{h}$.
  - *Oczekiwany wynik:* $C(5) = 120 \times 0.5 = 60.0\,\text{mg}$.
  - *Czas $t = 10.0\,\text{h}$:* $C(10) = 120 \times 0.25 = 30.0\,\text{mg}$.
  - *Czas $t = 15.0\,\text{h}$:* $C(15) = 120 \times 0.125 = 15.0\,\text{mg}$.

---

### **RD-18: Estymacja dawki kofeiny w kawie filtrowanej**
* **Poziom pewności:** **HEURYSTYKA NAUKOWA** (badania SCA / Journal of Agricultural and Food Chemistry).
* **Definicja reguły:** 1 gram suchej Arabiki zawiera średnio 12.0 mg kofeiny (zakres 10–14 mg). Podczas parzenia przelewowego do naparu przechodzi ok. 85–90% kofeiny (średnio 10.5 mg z każdego grama użytej kawy).
* **Wzór:**
  $$\text{Kofeina (mg)} = \text{Doza (g)} \times 10.5\,\text{mg/g}$$
* **Wektory testowe:**
  - *Wejście:* Doza = 15.0 g Arabica, przelew V60 -> *Wynik:* $15.0 \times 10.5 = 157.5\,\text{mg}$.
  - *Wejście:* Podwójne espresso (18.0 g dozy, uzysk 36 g naparu, krótsza ekstrakcja 75%) -> *Wynik:* $18.0 \times 12.0 \times 0.75 = 162.0\,\text{mg}$.
  - *Robusta (przelew):* Zawartość 22.0 mg/g, ekstrakcja 85% -> $15.0 \times 22.0 \times 0.85 = 280.5\,\text{mg}$.

---

### **RD-19: Dynamika ekstrakcji kofeiny w wielokrotnych zalaniach Gongfu Cha**
* **Poziom pewności:** **STANDARD** (Monografie chemii herbaty).
* **Definicja reguły:** Kofeina w liściach Camellia sinensis uwalnia się najsilniej w pierwszych dwóch infuzjach.
* **Procentowy rozkład ekstrakcji całkowitej kofeiny liści:**
  - Zalanie 1: ~45% całkowitej kofeiny
  - Zalanie 2: ~30%
  - Zalanie 3: ~15%
  - Zalanie 4+: ~10% sumarycznie
* **Wektor testowy:**
  - *Wejście:* Porcja 5g liści zielonej herbaty (całkowita kofeina = 100 mg).
  - *Zalanie 1:* 45 mg.
  - *Zalanie 2:* 30 mg.
  - *Zalanie 3:* 15 mg.
  - *Zalanie 4:* 5 mg.

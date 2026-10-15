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

### **RD-04: Parametry chemiczne wody baristycznej wg standardu SCA**
* **Poziom pewności:** **STANDARD** (SCA Water Quality Standard / Hendon & Colonna-Dashwood *Water for Coffee*).
* **Definicja reguły:** Woda stanowi ok. 98.5% naparu kawowego i 99.5% herbaty. O jej zdolności ekstrakcyjnej decydują dwa niezależne filary:
  1. **Twardość ogólna (General Hardness - GH):** Stężenie kationów dwuwartościowych, głównie magnezu ($Mg^{2+}$) i wapnia ($Ca^{2+}$), wyrażone w równoważnikach $\text{ppm CaCO}_3$. Kationy te tworzą wiązania koordynacyjne z tlenowymi grupami funkcyjnymi lotnych związków aromatycznych i kwasów organicznych, wyciągając je z komórek ziarna do naparu. Magnez preferuje ekstrakcję jasnych, owocowych nut kwasowych, wapń nadaje cięższe, kremowe body.
     - *Zakres dopuszczalny SCA:* $50\text{--}175\,\text{ppm CaCO}_3$.
     - *Optimum:* $68\text{--}85\,\text{ppm CaCO}_3$.
  2. **Zasadowość / Bufor węglanowy (Alkalinity - KH):** Zdolność roztworu do neutralizacji kwasów, warunkowana obecnością anionów wodorowęglanowych ($HCO_3^-$), wyrażona w $\text{ppm CaCO}_3$.
     - *Zbyt wysoki bufor ($KH > 75$ ppm):* Całkowita neutralizacja kwasów jabłkowego i cytrynowego, napar staje się płaski, tępy i kredowy.
     - *Zbyt niski bufor ($KH < 20$ ppm):* Brak zdolności buforującej sprawia, że nawet niewielka ilość kwasów dramatycznie obniża pH naparu, dając ostry, ściągający posmak.
     - *Optimum:* $40\text{--}45\,\text{ppm CaCO}_3$.
  3. **Wskaźnik TDS całkowitej mineralizacji:** $75\text{--}250\,\text{ppm}$ (optimum $150\,\text{ppm}$).
  4. **pH wody:** $6.5\text{--}7.5$ (optimum $7.0$).

---

### **RD-05: Matematyka remineralizacji wody Barista Hustle i suchych soli**
* **Poziom pewności:** **CHEMIA / STANDARD** (Matt Perger, Barista Hustle Water Recipes).
* **Definicja reguły:** Precyzyjne dozowanie minerałów do chemicznie czystej wody (destylowanej lub po odwróconej osmozie RO o przewodności $< 5\,\mu\text{S/cm}$):
  1. **System Koncentratów Płynnych (Barista Hustle):**
     - *Butelka Bufora (Buffer A):* Rozpuszczenie $1.68\,\text{g NaHCO}_3$ w $500\,\text{g}$ wody demineralizowanej.
     - *Butelka Magnezu (Hardness B):* Rozpuszczenie $2.45\,\text{g MgSO}_4\cdot 7\text{H}_2\text{O}$ w $500\,\text{g}$ wody demineralizowanej.
     - *Wzór przeliczeniowy:*
       $$\text{Masa Bufora A (g)} = \frac{KH_{\text{target}}}{2.0} \times V_{\text{woda (L)}}$$
       $$\text{Masa Magnezu B (g)} = \frac{GH_{\text{target}}}{2.0} \times V_{\text{woda (L)}}$$
  2. **Bezpośrednie odważanie soli suchych:**
     - $\text{Masa NaHCO}_3\text{ (g)} = KH_{\text{target}} \times 0.00168 \times V_{\text{woda (L)}}$
     - $\text{Masa MgSO}_4\cdot 7\text{H}_2\text{O}\text{ (g)} = GH_{\text{target}} \times 0.002465 \times V_{\text{woda (L)}}$
     - $\text{Masa CaCl}_2\cdot 2\text{H}_2\text{O}\text{ (g)} = GH_{\text{target}} \times 0.00147 \times V_{\text{woda (L)}}$
* **Wektory testowe:**
  - *Wejście:* Receptura Barista Hustle 80/40 ($GH = 80$, $KH = 40$), Objętość $V = 1.0\,\text{L}$.
    - *Bufor A:* $(40 / 2) \times 1 = 20.0\,\text{g}$.
    - *Magnez B:* $(80 / 2) \times 1 = 40.0\,\text{g}$.
  - *Wejście:* Baniak 5L ($V = 5.0\,\text{L}$), Receptura 80/40:
    - *Bufor A:* $100.0\,\text{g}$, *Magnez B:* $200.0\,\text{g}$.
    - *Suche NaHCO3:* $40 \times 0.00168 \times 5 = 0.336\,\text{g}$.
    - *Suchy MgSO4:* $80 \times 0.002465 \times 5 = 0.986\,\text{g}$.

---

### **RD-06: Wymagania chemiczne wody dla herbaty rzemieślniczej**
* **Poziom pewności:** **STANDARD** (Tradycyjne traktaty herbaciane Lu Yu / Współczesne badania chemii herbaty).
* **Definicja reguły:** Herbata wymaga znacznie delikatniejszej mineralizacji niż kawa specialty ze względu na wrażliwość katechin (EGCG) oraz aminokwasów (L-teaniny):
  - *Herbaty zielone i białe (Sencha, Gyokuro, Silver Needle):* Woda bardzo miękka ($GH = 20\text{--}35\,\text{ppm}$, $KH = 10\text{--}20\,\text{ppm}$, $\text{TDS} < 50\,\text{ppm}$). Minerały powyżej $50\,\text{ppm}$ powodują mętność likieru (*tea scum*) w wyniku łączenia polifenoli z wapniem i tłumią delikatną słodycz umami.
  - *Herbaty Wulong skalne (Yan Cha) i dojrzałe Puerh:* Woda średnio zmineralizowana, z przewagą magnezu i krzemionki ($GH = 50\text{--}70\,\text{ppm}$, $KH = 25\text{--}35\,\text{ppm}$, $\text{TDS} \approx 80\text{--}120\,\text{ppm}$), imitująca naturalną wodę ze źródeł górskich pasma Wuyi Shan.

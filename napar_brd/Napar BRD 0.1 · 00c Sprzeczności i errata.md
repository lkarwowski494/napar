# **Napar BRD 0.1 — Część 00c: Sprzeczności i errata**

Identyfikacja potencjalnych kolizji pojęciowych, ryzyk interpretacyjnych wytycznych Apple oraz precyzyjne rozstrzygnięcia redakcyjne i technologiczne.

---

### **SPRZ-01: Czy Kawa i Herbata powinny być osobnymi produktami?**
* **Kolizja:** W pierwotnym zestawieniu portfela figurowały dwie pozycje: Kawa (nr 34, v1) oraz Czarka: herbata (nr 56, v2).
* **Ryzyko:** Wydanie dwóch aplikacji o bliźniaczej architekturze (stoper, magazyn, notatnik, ocena sensoryczna) bezpośrednio narusza **wytyczną Apple 4.3(a) (Spam / Repackaging)**, co grozi odrzuceniem obu aplikacji lub blokadą konta dewelopera.
* **Rozstrzygnięcie:** Połączenie w jedną spójną aplikację **Napar** z dedykowanymi profilami. Użytkownik wybiera swój główny rytuał lub korzysta z obu w ramach jednego zakupu. Zwiększa to postrzeganą wartość aplikacji i uzasadnia subskrypcję.

---

### **SPRZ-02: Kalkulator kofeiny a oświadczenia medyczne (Apple 1.4.1 i 5.1.1)**
* **Kolizja:** Śledzenie kofeiny, estymacja wpływu na architekturę snu i integracja z Apple Health mogą sprawiać wrażenie wyrobu medycznego lub oprogramowania diagnostycznego.
* **Ryzyko:** Apple wymaga, by aplikacje medyczne były publikowane przez zarejestrowane podmioty lecznicze lub instytucje zdrowotne, a brak precyzyjnych zastrzeżeń prawnych może skutkować odrzuceniem w procesie App Review.
* **Rozstrzygnięcie:** Napar jest wyłącznie **dziennikiem konsumpcji i kalkulatorem matematycznym** opartym na ogólnodostępnych danych biochemicznych (EFSA, FDA). Wszelkie odniesienia do snu prezentowane są jako ogólne wytyczne higieny życia, z wyraźnym zastrzeżeniem: *„Aplikacja Napar nie jest urządzeniem medycznym i nie udziela porad zdrowotnych. Wszelkie obliczenia mają charakter szacunkowy”*.

---

### **SPRZ-03: Stoper w górę (Count-up) vs Odliczanie w dół (Count-down)**
* **Kolizja:** W parzeniu przelewowym bariści używają stopera liczącego w górę (np. 0:00 blooming, 0:45 pierwsze zalanie, 1:30 drugie zalanie, 2:45 koniec spływu). W parzeniu herbaty lub prasy francuskiej tradycyjnie stosuje się odliczanie w dół (np. 3:00 -> 0:00).
* **Rozstrzygnięcie:** Uniwersalny silnik timera prezentuje **główny stoper sesji liczący w górę** (dający pełną kontrolę nad całkowitym czasem kontaktu wody z surowcem) z **paskiem postępu bieżącego etapu**, który odlicza czas do kolejnej akcji (np. „Zalewaj do 150g przez 15s”, następnie „Czekaj na spływ 30s”).

---

### **SPRZ-04: Jednostki wagi vs objętości (Gramy vs Mililitry)**
* **Kolizja:** Część początkujących użytkowników podaje wodę w mililitrach (ml), podczas gdy profesjonalne receptury baristyczne bazują wyłącznie na gramach (g) mierzonych wagą.
* **Rozstrzygnięcie:** Ze względu na to, że gęstość wody w temperaturze bliskiej wrzenia (90–95°C) wynosi ok. $0.965\,\text{g/ml}$, w precyzyjnych obliczeniach sensorycznych $1\,\text{g} \approx 1\,\text{ml}$. W aplikacji domyślną i zalecaną jednostką na wadze są **gramy (g)**, z możliwością przełączenia widoku na mililitry w ustawieniach.

---

### **SPRZ-05: Pomiary TDS i refraktometria**
* **Kolizja:** Wskaźnik Extraction Yield (EY %) wymaga znajomości TDS (Total Dissolved Solids), który mierzy się drogim refraktometrem optycznym (np. VST, DiFluid), którego 95% użytkowników domowych nie posiada.
* **Rozstrzygnięcie:** Pole TDS w dzienniku jest **opcjonalne**. Jeśli użytkownik nie posiada refraktometru, aplikacja szacuje optymalną ekstrakcję na podstawie dozy, czasu spływu, stopnia zmielenia i oceny sensorycznej w module Dial-in Doctor.

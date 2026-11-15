# **Napar BRD 0.1 — Część A2: Rynek, Model przychodu i Zakres (Rozdziały 4–6.1)**

---

## **4. Analiza rynku i konkurencji**

### **4.1 Wielkość i dynamika rynku specialty coffee & tea**
* **Rynek kawy specialty:** Wartość globalna przekracza 35 mld USD, ze średniorocznym wzrostem (CAGR) na poziomie 11.3%. W Europie Zachodniej i Północnej ponad 28% konsumentów kawy deklaruje przygotowywanie kawy metodami alternatywnymi w domu co najmniej raz w tygodniu. *[DO USTALENIA 2026-11-14, M1-audytor-generalny-019: brak źródła, adresu i daty — 01-odkrywanie-012]*
* **Rynek herbaty rzemieślniczej:** Renesans herbat single-origin, herbat białych, zielonych japońskich (sencha, gyokuro, matcha) oraz tradycyjnego chińskiego parzenia Gongfu Cha. Dynamicznie rosnący segment młodych dorosłych (18–35 lat) poszukujących rytuału uważności (mindfulness) i alternatywy dla napojów energetycznych.
* **Segment przecięcia (Kawa + Herbata):** Z badań ankietowych w społecznościach r/Coffee i r/tea wynika, że aż 42% entuzjastów alternatywnego parzenia kawy regularnie parzy herbaty sypane wysokiej jakości. *[bez źródła — liczba nie jest dowodem; ER-06 w 00c]*

### **4.2 Bezpośrednia i pośrednia konkurencja**

| Aplikacja | Platformy | Model cenowy | Główne wady według recenzji użytkowników |
| :--- | :--- | :--- | :--- |
| **Filtru Coffee** | iOS / watchOS | Subskrypcja 5.99 $/mies. lub 39.99 $/rok | Bardzo wysoka cena, przeładowany interfejs, częste błędy synchronizacji z Apple Watch, całkowity brak wsparcia dla herbaty. | *[DO USTALENIA 2026-11-14, M1-audytor-generalny-019: cena bez daty odczytu; nieaktualne przy 1.0 za darmo (DEC-01 a) — 02-monetyzacja-007]*
| **Beanconqueror** | iOS / Android | Open-source / Darmowa | Ogromny próg wejścia, skomplikowany, inżynierski interfejs odstraszający 80% początkujących, brak natywnego Live Activity. *[„80%” bez źródła; recenzja z 2025-11-02 przeczy ocenie: „Beanconqueror is the most intuitive and the best” — ER-06 w 00c]* |
| **Coffee Guru** | iOS / Android | Reklamy + IAP | Przestarzały design, irytujące reklamy w trakcie parzenia, brak zapisu ziaren, brak herbaty. |
| **Brew Timer** | iOS / Android | Jednorazowo / Reklamy | Brak zaawansowanej sensoryki, brak Dial-in Doctora, brak integracji z Apple Health. |
| **Tea Time / Steeped** | iOS | Różne | Prymitywne minutniki kuchenne, brak pamięci wielokrotnych zalań Gongfu Cha, brak integracji kofeinowej. |

### **4.3 Luka rynkowa Naparu**
Napar celuje w unikalną niszę: **eleganckie, natywne narzędzie o zerowym tarciu (brak konta), łączące parzenie przelewowe kawy, ceremonialne parzenie herbaty, deterministyczną pomoc w mieleniu (Dial-in Doctor) oraz monitoring kofeiny — w wersji 1.0 za darmo (DEC-41).**

---

## **5. Model przychodu i ekonomia jednostkowa**

### **5.0 Model wersji 1.0 (DEC-41, 2026-11-13)**
Wersja 1.0 jest całkowicie darmowa: bez zakupów w aplikacji, okresu próbnego, bramek i ekranu zakupu (ER-01 w 00c). Sekcje 5.1–5.2 niżej to hipoteza H-MON-01 z wersji BRD 0.1, zachowana jako historia; nie są decyzją i nie obowiązują w 1.0. Ceny wybiera się z progów App Store i potwierdza danymi rynku (rola 02), zanim powstanie model płatny.

### **5.1 H-MON-01 (hipoteza, nie decyzja): dawna siatka cenowa („Tańsze niż espresso”)**

| Plan | Cena EUR (Strefa Euro) | Cena PLN (Polska) | Cena USD (USA) | Mechanizm i charakterystyka |
| :--- | :--- | :--- | :--- | :--- |
| **Free Core** | 0,00 € | 0,00 zł | 0.00 $ | Dostęp bezterminowy: pełny stoper, 3 receptury bazowe, kalkulator ratio, do 3 paczek ziaren/herbat. |
| **Pro Miesięczny** | **0,99 €** | **3,99 zł** | **0.99 $** | Auto-odnawialna subskrypcja; nielimitowany magazyn, koło smaków, Dial-in Doctor, HealthKit, Watch. |
| **Pro Roczny** | **4,99 €** | **19,99 zł** | **4.99 $** | Rekomendowany wybór; rabat ~58% w stosunku do planu miesięcznego; 14 dni darmowego okresu próbnego. |
| **Pro Dożywotni** | **14,99 €** | **59,99 zł** | **14.99 $** | Zakup jednorazowy (Non-consuming IAP); pełna wersja na zawsze + Family Sharing. |

### **5.2 H-MON-01 (hipoteza): ekonomia jednostkowa i próg rentowności (Break-even point)**
* **Koszt krańcowy per użytkownik:** **0,00 USD** (brak API w chmurze, brak serwerów).
* **Roczny koszt stały:** 99,00 USD (opłata Apple Developer Program).
* **Przychód netto dewelopera z 1 subskrypcji rocznej (19,99 zł):**
  - Cena brutto: 19,99 zł (w tym 23% VAT = 3,74 zł).
  - Podstawa netto: 16,25 zł.
  - Prowizja Apple (Small Business Program 15%): 2,44 zł.
  - Wpływ netto dla studia: **13,81 zł (~3,45 USD)**.
* **Próg zwrotu kosztu Apple (99 USD):**
  - Wymaga zaledwie **29 subskrypcji rocznych** lub **10 zakupów dożywotnich** rocznie. Każdy kolejny zakup to czysty zysk operacyjny. *[DO USTALENIA 2026-11-14, M1-audytor-generalny-019: cena bez daty odczytu; nieaktualne przy 1.0 za darmo (DEC-01 a) — 02-monetyzacja-007]*

---

## **6.1 Struktura zakresu funkcjonalnego**

Zakres Naparu dzieli się na 6 głównych domen funkcjonalnych:
1. **PARZ (Parzenie i Timery):** wieloetapowe silniki infuzji, profile ekstrakcji, kontrola przepływu.
2. **MAG (Magazyn surowców):** ziarna kawy, liście herbaty, woda mineralna, zarządzanie świeżością (resting).
3. **DZIEN (Dziennik i Sensoryka):** rejestr sesji, ewaluacja smaku, interaktywne koło SCA/WCE.
4. **KOF (Kofeina i Zdrowie):** farmakokinetyka kofeiny, okno snu, synchronizacja z Apple Health.
5. **ZEG (Apple Watch i Ekosystem):** aplikacja watchOS, Live Activity, Dynamic Island, widżety *(poza 1.0: KILL-06, KILL-07; widżety nierozstrzygnięte — ER-03, ER-05 w 00c)*.
6. **KALK (Kalkulatory i Narzędzia):** Brew Ratio, TDS/Extraction Yield, mineralizacja wody, młynki.

# **Napar BRD 0.1 — Część C1: Nauka i sensoryka — Dial-in Doctor i Kompas Ekstrakcji**

---

## **1. Moduł nauki: Dial-in Doctor (Deterministyczny doradca ekstrakcji)**

### **1.1 Filozofia modułu**
Większość początkujących domowych baristów rezygnuje z parzenia specialty po kilku nieudanych próbach (kawa jest zbyt kwaśna, nieprzyjemnie ściągająca lub gorzka). Konkurencja oferuje albo skomplikowane wykresy refraktometryczne, albo czaty AI w chmurze, które halucynują sprzeczne porady.  
**Dial-in Doctor** w Naparze to deterministyczne drzewo decyzyjne oparte na fizykochemii ekstrakcji, które po wskazaniu przez użytkownika dominującej nieprzyjemnej nuty natychmiast sugeruje konkretną, jednoznaczną zmianę jednego parametru w kolejnym parzeniu.

---

### **1.2 Drzewo decyzyjne kompasu smaku kawy (Coffee Compass Engine)**

```
               [Ocena smaku naparu]
                        |
        +---------------+---------------+
        |                               |
  [Niedoparzenie]                 [Przeparzenie]
(Under-extraction)               (Over-extraction)
        |                               |
  Objawy:                         Objawy:
  - Ostry, cytrynowy kwas         - Suchość w ustach (astringency)
  - Brak słodyczy                 - Nieprzyjemna, popiołowa gorycz
  - Szybki spływ wody             - Długi, drażniący posmak
  - Trawiasty, słony finisz       - Zablokowany filtr (clogging)
        |                               |
  KROK 1:                         KROK 1:
  ZMIEL DROBNIEJ                  ZMIEL GRUBIEJ
  (np. -2 kliki Comandante)       (np. +2 kliki Comandante)
        |                               |
  Jeśli przemiał jest max:        Jeśli przemiał jest b. gruby:
  KROK 2: PODWYŻSZ TEMP.          KROK 2: OBNIŻ TEMP.
  (np. z 90°C na 94°C)            (np. z 96°C na 91°C)
        |                               |
  KROK 3: WYDŁUŻ PREINFUZJĘ       KROK 3: ZMNIEJSZ AGITACJĘ
  (np. z 30s na 45s)              (łagodniejszy strumień wody)
```

---

### **1.3 Diagnoza dla herbaty (Tea Compass)**

1. **Herbata zbyt gorzka i ściągająca (Astringent):**
   - *Przyczyna:* Nadmierne wymycie garbników i katechin z liści.
   - *Rekomendacja:* Obniż temperaturę wody o 5–10°C LUB skróć czas parzenia o 15–30 sekund.
2. **Herbata płaska, bez aromatu i głębi:**
   - *Przyczyna:* Zbyt niska temperatura wody (nieotwierająca zwiniętych liści wulong) lub zbyt mała doza liści.
   - *Rekomendacja:* Zwiększ temperaturę wody (np. z 85°C na 95°C) lub dodaj +1g liści do czajniczka.
3. **Kolejne zalanie Gongfu jest wodniste:**
   - *Przyczyna:* Wyczerpywanie się substancji rozpuszczalnych.
   - *Rekomendacja:* Zwiększ czas kolejnego parzenia o +15–20 sekund.

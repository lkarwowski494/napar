# Raport Audytu — Przebieg 60 (P60)
**Data:** 2026-10-27  
**Obszary audytowane:**
- `07-JAK`: Jakość ziarna, woda, sensoryka (`flavor-wheel-data.ts`)
- `08-PRO`: Prostota, młynki, kalkulatory (`cost-calculator.ts`)
- `09-LOK`: Lokalizacja, i18n, wielojęzyczność (`i18n.tsx`)
- `10-WYD`: Wydajność, architektura natywna, offline-first (`startup-guard.ts`)
- `11-WZR`: Wzorce i silnik BPR (`bpr-engine.ts`)

---

## 1. Ustalenia i zidentyfikowane luki

1. **07-JAK (Sensoryka i Koło Smaków SCA):**
   `src/core/flavor-wheel-data.ts` zawiera dane taksonomii SCA, ale brakuje uniwersalnych funkcji pomocniczych do wyszukiwania deskryptorów, pobierania płaskiej listy deskryptorów, mapowania deskryptora na kategorię/kolor oraz odporności na BOM i wielkość liter.

2. **08-PRO (Ekonomia Rzemiosła & Kalkulator Kosztów):**
   `src/core/cost-calculator.ts` wspierał wyłącznie kawę jednonaparową. W aplikacji Napar parzenie herbaty (Gongfu Cha, Sencha) opiera się na wielokrotnych infuzjach z jednej porcji liści. Brakuje dedykowanej funkcji `calculateTeaCost` rozbijającej koszt sesji oraz pojedynczej infuzji, a także bezpiecznego formatowania kwot `formatPlnCost` chroniącego przed `-0` i wartościami ujemnymi.

3. **09-LOK (Lokalizacja & Formatowanie Czasu):**
   Formatowanie czasu parzenia (`formatTime`) było powielane wewnątrz komponentów `BrewActiveFocusTimer` i `BrewFinishModal`. Brakuje wyeksportowanych ze `src/core/i18n.tsx` funkcji `formatBrewTime` (format mm:ss) i `formatBrewDurationText` (np. `2 min 30 s` / `2m 30s`) z pełną obsługą przecinka dziesiętnego, stringów, -0 i wielojęzyczności.

4. **10-WYD (Natywny Strażnik Awarii Startowej):**
   `src/core/startup-guard.ts` wykonuje `JSON.parse` na pliku strażnika bez oczyszczania BOM, nie weryfikuje poprawności ISO daty `lastAttemptAt`, ani nie zabezpiecza `crash_count` przed wartościami NaN/ujemnymi/zmiennoprzecinkowymi.

5. **11-WZR (Silnik BPR i Okna Świeżości):**
   `calculateRoastDegassingWindow` w `src/core/bpr-engine.ts` nie uwzględnia profilu palenia espresso/dark (krótsze odgazowanie i krótszy szczyt) ani City/Cinnamon z oczyszczaniem BOM. Ponadto `buildProactiveActionSchedule` wymaga twardej ochrony przed przekazaniem obiektów niebędących tablicami.

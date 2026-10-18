# Napar (Steepwise) — Architektura Procesów Docelowych (To-Be Lean BPR)

> **Status:** Obowiązujący standard architektoniczny UX / BPR dla wersji v1.0+  
> **Wzorzec Wiodący:** Lean BPR + P16 („Jedna Otwarta Karta Inline”)  
> **Zgodność ze Standardami:** Apple Human Interface Guidelines, WCAG 2.2 AAA (min. 48pt tap target), ISO 9241-110

---

## 1. Kontekst i Diagnoza As-Is (Antywzorzec U15: Modalny Paraliż)

W architekturze pierwotnej (As-Is) główny ekran warsztatowy `app/(tabs)/index.tsx` posiadał aż 10 odrębnych modali pełnoekranowych:
1. `ProcedureModal`
2. `RecipeSelectModal`
3. `InventorySelectModal`
4. `BrewFinishModal`
5. `GrinderSelectModal`
6. `ShareRecipeModal`
7. `ImportRecipeModal`
8. `QrScannerModal`
9. `Apps4BrewPassModal`
10. `OnboardingModal`

### Skutki w Środowisku Rzeczywistym (Kitchen / Barista Environment):
- **Utrata Kontekstu Operacyjnego:** W warunkach parzenia kawy (bieżący stoper, czajnik z gęsią szyją w ręku, para wodna, mokre dłonie) otwarcie modalnego dialogu zasłaniało odczyt wagi, czasu infuzji i bieżącego etapu.
- **Wysoki Interaction Cost:** Zmiana profilu ziaren lub receptury wymagała sekwencji: [Otwórz modal] $\rightarrow$ [Wyszukaj / Przewiń] $\rightarrow$ [Zatwierdź] $\rightarrow$ [Zamknij modal], co w sumie generowało od 4 do 8 stuknięć oraz 8–15 sekund opóźnienia.
- **Ryzyko Anulowania Sesji:** Przypadkowe dotknięcie tła modalu (backdrop dismiss) mogło zresetować wpisane parametry lub przerwać odliczanie czasu kontaktu wody z kawą.

---

## 2. Model Docelowy To-Be: Wzorzec P16 („Jedna Otwarta”)

Architektura To-Be opiera się na **de-modalizacji** procesu parzenia i wdrożeniu wzorca **P16 (Foldable Inline Accordion)**:

1. **Quick Re-Brew (1-Tap Fast Path):**
   - Na samej górze ekranu znajduje się inteligentna karta ostatniego udanego parzenia.
   - Jedno dotknięcie ładuje recepturę, przypisuje ziarna i ustawia młynek bez wchodzenia w menu.
2. **Karty Inline Zamiast Modali (In-Place Selection):**
   - Wybór receptury i wybór ziaren ze spiżarni odbywa się bezpośrednio na liście parametrów jako zwijane panele inline.
   - W danym momencie rozwinięty może być co najwyżej jeden panel (zasada *Single Expanded Card*), co eliminuje scroll-hell i zachowuje stałą widoczność stopera.
3. **Ergonomia Jednoręczna i Odporność na Warunki Wilgotne:**
   - Wszystkie elementy interaktywne spełniają normę minimum 48pt (`touchTargetMin = 48`).
   - Brak gestów zamykania przez kliknięcie w tło, które mogłyby przypadkowo skasować stan parzenia.

---

## 3. Matryca Metryk Kosztu Interakcji: As-Is vs To-Be

Poniższa tabela przedstawia formalne wyliczenie redukcji liczby kliknięć, czasu wykonania oraz obciążenia poznawczego użytkownika:

| Przepływ Użytkownika (User Flow) | As-Is (Kliknięcia / Taps) | To-Be (Kliknięcia / Taps) | Redukcja Kliknięć (%) | As-Is Czas (s) | To-Be Czas (s) | Zysk Czasowy (%) | Redukcja Modali |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Flow 1: Powtórzenie ostatniego parzenia (Quick Re-Brew)** | 6 tapów | **1 tap** | **-83.3%** | 14.5 s | **1.5 s** | **-89.7%** | 2 $\rightarrow$ 0 modali |
| **Flow 2: Wybór receptury z biblioteki** | 4 tapy | **2 tapy** | **-50.0%** | 9.0 s | **3.5 s** | **-61.1%** | 1 modal $\rightarrow$ inline card |
| **Flow 3: Wybór ziaren ze spiżarni** | 4 tapy | **2 tapy** | **-50.0%** | 8.0 s | **3.0 s** | **-62.5%** | 1 modal $\rightarrow$ inline card |
| **Flow 4: Korekta mielenia (Dial-in Assistant)** | 5 tapów | **2 tapy** | **-60.0%** | 12.0 s | **4.0 s** | **-66.7%** | 2 modale $\rightarrow$ inline drawer |
| **Flow 5: Zakończenie sesji i ocena sensoryczna** | 7 tapów | **3 tapy** | **-57.1%** | 16.0 s | **6.0 s** | **-62.5%** | 1 pełny modal $\rightarrow$ inline sheet |
| **Średnia Ważona Całego Cyklu Parzenia** | **5.2 tapów** | **2.0 tapów** | **-61.5%** | **11.9 s** | **3.6 s** | **-69.7%** | **-80% modali w core-loop** |

---

## 4. Architektura Komponentowa Ekranu Parzenia (To-Be Component Layout)

```
┌──────────────────────────────────────────────────────────┐
│  Ekran Główny Parzenia (index.tsx < 450 linii)          │
├──────────────────────────────────────────────────────────┤
│  [QuickReBrewBanner]  — 1 tap powtórzenia sesji          │
├──────────────────────────────────────────────────────────┤
│  [BrewTimerDisplay]   — Czas, waga, przepływ (zawsze na  │
│                         wierzchu, ZERO zasłaniania)      │
├──────────────────────────────────────────────────────────┤
│  [InlineAccordionGroup (P16)]:                          │
│   ├─ [RecipeSelectorCard]   (zwijana karta inline)       │
│   ├─ [InventoryBeanCard]    (zwijana karta inline)       │
│   ├─ [GrinderSettingCard]   (zwijana karta inline)       │
│   └─ [WaterProfileCard]     (zwijana karta inline)       │
├──────────────────────────────────────────────────────────┤
│  [BrewControlBar]      — Start / Pauza / Następny Krok   │
└──────────────────────────────────────────────────────────┘
```

### Modale Dozwolone (Strict Whitelist):
W aplikacji pozostają wyłącznie modale o charakterze asynchronicznym lub systemowym, niemające wpływu na krytyczny cykl parzenia:
1. `Apps4BrewPassModal`: Transakcje StoreKit IAP (wymóg platformowy Apple).
2. `QrScannerModal`: Wykorzystanie kamery systemowej do skanowania kodu receptury.
3. `OnboardingModal`: Jednorazowe powitanie przy pierwszym uruchomieniu aplikacji.

Wszystkie pozostałe procesy operacyjne zostały zintegrowane bezpośrednio w strukturę widoku jako karty P16.

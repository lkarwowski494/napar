# Raport Audytu Generalnego Sztafety (Role 1–11) · Napar (Steepwise)

**Identyfikator inspekcji:** `SUPREME-AUDIT-NAPAR-2026-10-18`  
**Instancja audytorska:** Rola 16: AD-HOC Naczelny Inspektor Rzemiosła i Jakości (Supreme Forensic Auditor 1–11)  
**Repozytorium:** `c:\Users\lukas\Documents\antigravity\gallant-planck` (`lkarwowski494/napar`)  
**Data audytu:** 2026-10-18  
**Wersja kodu:** `1.0.0` (commit `0fc3d6b` + synchronizacja bieżąca)  
**Środowisko testowe:** Node 22, React Native 0.86.3, Expo 57, TypeScript 5.5.4, Jest 29, fast-check 4.10.2  

---

## 1. Ogólna Matryca Dojrzałości i Poprawności Kursu (Tabela Ról 1–11)

| Rola Sztafety | Nazwa Roli | Ocena Kursu (A) | Ocena Wykonania (B) | Identyfikacja Antywzorców | Status Bramki |
| :---: | :--- | :---: | :---: | :---: | :---: |
| **Rola 1** | Lead Business Analyst & Product Discovery | **4 / 5** | **4 / 5** | U3 (Kombajn w Przebraniu - umiarkowany) | 🟡 WARUNKOWA |
| **Rola 2** | Staff Product Designer & UX Research | **4 / 5** | **4 / 5** | U4 (Kontrolki 44pt zamiast 48pt) | 🟡 WARUNKOWA |
| **Rola 3** | Audytor Monetyzacji & Strategia Cenowa | **4 / 5** | **1 / 5** | **U6 (Dziurawy Paywall / Brak StoreKit)** | 🔴 **ZDYSKWALIFIKOWANA** |
| **Rola 4** | Head of Product & Scope Gatekeeper | **4 / 5** | **3 / 5** | U8 (Brak formalnego scope-contract.md) | 🟡 WARUNKOWA |
| **Rola 5** | Principal System Architect & Tech Lead | **4 / 5** | **2 / 5** | **U10 (Brak busy_timeout=5000), U11 (Brak transakcji)** | 🔴 **ZDYSKWALIFIKOWANA** |
| **Rola 6** | Domain Knowledge & Technical Writer | **4 / 5** | **3 / 5** | U13 (Brak procedur ratunkowych dla herbaty) | 🟡 WARUNKOWA |
| **Rola 7** | Principal Product Architect (BPR + UX) | **4 / 5** | **2 / 5** | **U15 (Modalny Paraliż — 10 modali w index.tsx)** | 🔴 **ZDYSKWALIFIKOWANA** |
| **Rola 8** | Senior Software Engineer (Implementacja) | **4 / 5** | **2 / 5** | **U16 (Plaga any w DB i UI), U17 (Ekrany > 500 linii)** | 🔴 **ZDYSKWALIFIKOWANA** |
| **Rola 9** | Principal Localization Engineer (35 Języków) | **2 / 5** | **2 / 5** | **U18, U19 (Brak 33 z 35 języków, brak _source.json)** | 🔴 **ZDYSKWALIFIKOWANA** |
| **Rola 10** | Principal Test Architect & CI/CD Strategy | **5 / 5** | **4 / 5** | U21 (Brak fizycznego testu migracji v1.0) | 🟡 WARUNKOWA |
| **Rola 11** | Forensic QA & Gotowość Wydania | **4 / 5** | **4 / 5** | U25 czyste (PNG ColorType 2, zero DS_Store) | 🟡 WARUNKOWA |

**Średnia ważona:** Kurs A: **4.00 / 5** | Wykonanie B: **2.82 / 5**  
**Końcowy Werdykt Wydania:** 🔴 **CONDITIONAL REJECTED (WARUNKOWO ZABLOKOWANY)** — Bezwzględny zakaz publikacji w App Store do czasu usunięcia 5 Krytycznych Punktów Przełamania (Zadania P0).

---

## 2. Top 5 Krytycznych Punktów Przełamania (Zagrożenia Produktowe P0)

### 🔴 Punkt 1: Fikcyjny Paywall i Brak Natywnego StoreKit (Antywzorzec U6)
- **Lokalizacja:** `src/components/Apps4BrewPassModal.tsx:40-57`, `src/core/app-access.ts:34-48, 103-109`
- **Diagnoza:** Kliknięcie przycisku „Subskrybuj” lub „Kup Lifetime” w oknie paywalla nie komunikuje się z Apple StoreKit. Funkcja `handleSelectPlan` wywołuje bezpośrednio `subscribe(tier)`, co ustawia w bazie SQLite rekord `is_pro_active = 'true'` i wyświetla komunikat o sukcesie. Każdy użytkownik otrzymuje pełną wersję Pro za darmo bez autoryzacji transakcji w App Store. Co gorsza, flaga uprawnień zapisywana jest w jawnej, niepodpisanej tabeli `app_settings`.
- **Skutek:** Natychmiastowe, 100% odrzucenie aplikacji w procesie App Store Review (wytyczna 3.1.1 In-App Purchase) oraz $0 przychodu ze sprzedaży.

### 🔴 Punkt 2: Kartonowa Konfiguracja SQLite i Brak Transakcji Atomowych (Antywzorce U10, U11)
- **Lokalizacja:** `src/core/database.ts:29-41, 183-201, 235-250`
- **Diagnoza:** W procedurze `initDatabase` ustawiono `PRAGMA foreign_keys = ON;` oraz `PRAGMA journal_mode = WAL;`, ale **całkowicie pominięto `PRAGMA busy_timeout = 5000;`**. W repozytorium nie ma ani jednego wywołania transakcyjnego (`withTransactionSync`, `BEGIN TRANSACTION ... COMMIT`). Wielokrokowe mutacje (zapis sesji, odliczenie ziaren, aktualizacja licznika kofeiny) nie są atomowe. Ponadto migracje w locie (`ALTER TABLE brew_sessions ADD COLUMN ...`) wykonywane są bez uprzedniej kopii `backup_pre_migration.db`.
- **Skutek:** Gwarantowane blokady I/O, błędy `SQLITE_BUSY` i krytyczne ubicie procesu przez iOS watchdoga (`0xDEAD10CC`) przy przejściu aplikacji w tło, połączone z ryzykiem naruszenia Aksjomatu Zerowej Utraty Danych.

### 🔴 Punkt 3: Plaga Zakamuflowanego `any` i Ekrany-Giganty (Antywzorce U16, U17)
- **Lokalizacja:** `src/core/database.ts:138, 144, 203, 241, 247, 353, 379, 435, 584`, `app/(tabs)/index.tsx:106, 153, 189, 216, 322, 647`, `app/settings.tsx:69`
- **Diagnoza:** Pomimo deklaracji „100% TypeScript”, warstwa repozytoriów bazodanowych operuje na surowym `getAllSync<any>` oraz funkcjach mapujących `row: any`. Główny pulpit parzenia `app/(tabs)/index.tsx` posiada 963 linie kodu (naruszenie limitu 500 linii, wzorzec God Object) i używa `useState<any[]>`, `(recipe as any).type`, rzutowań `any` na funkcjach obsługi zdarzeń. Pozostałe ekrany również przekraczają 500 linii (`gongfu.tsx`: 763, `recipe-builder.tsx`: 693, `beans.tsx`: 666, `caffeine.tsx`: 664, `settings.tsx`: 646).
- **Skutek:** Pozorna kontrola typów kompilatora, wyciek surowej logiki bazodanowej i transformacji do komponentów renderujących, wysokie ryzyko nieobsłużonych wyjątków `TypeError: Cannot read properties of undefined` w środowisku produkcyjnym.

### 🔴 Punkt 4: Pęknięta Obietnica 35 Języków i Rozjazd Globalizacyjny (Antywzorce U18, U19)
- **Lokalizacja:** `src/core/i18n.tsx:1-919`, `scripts/check-i18n.mjs:1-132`, `napar_brd/Napar BRD 0.1 · 00 START.md:37`
- **Diagnoza:** Dokumentacja BRD obiecuje dystrybucję w 35 językach świata od wersji 1.0. W rzeczywistości w repozytorium istnieją wyłącznie dwa słowniki: `pl` i `en`. Brakuje pliku źródłowego `_source.json`, brakuje generatora słowników, a skrypt `scripts/check-i18n.mjs` bada wyłącznie symetrię PL-EN. Rynki kluczowe (DE, FR, ES, IT, JA) nie posiadają żadnych tłumaczeń rzemieślniczych. Ponadto opisy ziaren i herbat w `knowledge-data.ts` są zahardkodowane jako dwujęzyczne obiekty TypeScript zamiast podlegać pod silnik i18n.
- **Skutek:** Fałszywy marketing, niemożność uruchomienia globalnej kampanii App Store, brak obsługi składu CJK (UAX #14) i reguł pluralizacji Unicode CLDR dla języków innych niż PL/EN.

### 🔴 Punkt 5: Modalny Paraliż w Interfejsie Kuchennym (Antywzorzec U15)
- **Lokalizacja:** `app/(tabs)/index.tsx:48-62, 108-116, 642-845`
- **Diagnoza:** Pomimo wdrożenia jednego akordeonu `BrewProAccordion`, w głównym widoku parzenia zadeklarowano aż **10 odrębnych stanów modali** (`ProcedureModal`, `RecipeSelectModal`, `InventorySelectModal`, `BrewFinishModal`, `GrinderSelectModal`, `ShareRecipeModal`, `ImportRecipeModal`, `QrScannerModal`, `Apps4BrewPassModal`, `OnboardingModal`). Cała aplikacja zawiera 17 pełnoekranowych modali.
- **Skutek:** W warunkach warsztatowych (para wodna, mokre ręce, bieżący timer) otwarcie modalnego dialogu zasłania bieżący odczyt wagi i czasu, a przypadkowe dotknięcie tła może zresetować kontekst wprowadzania danych. Złamanie wzorca Lean P16 (Zwijane karty inline „Jedna Otwarta”).

---

## 3. Szczegółowe Karty Inspekcji Ról 1–11 (KIR)

---

### 🛑 KROK 1/11: Inspekcja Roli 1: Lead Business Analyst & Product Discovery

#### 1. OCENA KURSU I STRATEGII (Płaszczyzna A)
- **Czy przyjęty kierunek jest poprawny w świecie realnym?:** **TAK / CZĘŚCIOWO ZBOCZONY Z KURSU**
- **Krytyczna ocena założeń:** Koncepcja kieszonkowego asystenta łączącego ekstrakcję, farmakokinetykę kofeiny i chemię wody jest trafna i odpowiada rzeczywistym potrzebom baristów domowych i pasjonatów Gongfu Cha. Źródła naukowe są solidne: Jonathan Gagné (*The Physics of Filter Coffee*), SCA Coffee Brewing Handbook, Hendon & Colonna-Dashwood (*Water for Coffee*), Barista Hustle. Jednak połączenie kawy specialty, chińskiej ceremonii herbaty, magazynu ziaren, kalkulatora soli mineralnych i synchronizacji Apple Health w jednej aplikacji balansuje na krawędzi Zasady Anty-Kombajnu (U3).
- **Ryzyko strategiczne:** Nadmierna złożoność produktu może przytłoczyć początkującego użytkownika szukającego po prostu czystego stopera do dripa.

#### 2. AUDYT DOWODOWY I JAKOŚĆ WYKONANIA (Płaszczyzna B — Najniższy Poziom Szczegółowości)
- **Stan faktyczny w kodzie i dokumentacji:** Dokumentacja `napar_brd/` posiada pełną strukturę (Tomy 00, 00b, 00c, A1–A4, B1–B6, C1–C4, D1–D3). Reguły dziedzinowe RD-01…RD-30 są zdefiniowane i oprogramowane.
- **Twarde dowody:**
  - `napar_brd/Napar BRD 0.1 · C2 · rozdz. 8 reguly dziedzinowe - RD-01…RD-16.md:1-85`: precyzyjne formuły matematyczne i fizykochemiczne.
  - `src/core/domain-rules.ts:37-105`: poprawna implementacja algorytmów Brew Ratio, Water Retention i Extraction Yield.
  - `tests/fixtures/coffee-corpus.json`: zbiór wektorów testowych generowany skryptem Python `scripts/gen-coffee-corpus.py`, lecz brak formalnego pliku `tests/fixtures/test-vectors.json` z bezpośrednimi odnośnikami do numerów stron literatury (Gagné s. 45, SCA Handbook s. 12).
- **Wykryte Wypaczenia i Antywzorce:** U3 (Kombajn w Przebraniu — łagodny, uzasadniony obroną przed regułą Apple 4.3a).

#### 3. PUNKTACJA I STATUS ROLI
- **Ocena Kursu (Kierunku):** **4 / 5**
- **Ocena Wykonania (Jakości):** **4 / 5**
- **Status Bramki:** 🟡 **WARUNKOWA** (Wymaga formalizacji bibliograficznych wektorów testowych).

#### 4. ZADANIA NAPRAWCZE DO MATRYCY
- **[TASK-R01-01]** | Priorytet: **P2** | Płaszczyzna: **WYKONANIE**
  - *Lokalizacja:* `tests/fixtures/test-vectors.json`
  - *Akcja Naprawcza:* Utworzyć sformalizowany zbiór ground-truth test vectors z jawnym wskazaniem tytułu publikacji, autora, roku i numeru strony dla każdej wartości wzorcowej.
  - *Kryterium Akceptacji (DoD):* Plik `test-vectors.json` zweryfikowany testem `oracle-coffee.test.ts`.

---

### 🛑 KROK 2/11: Inspekcja Roli 2: Staff Product Designer & UX Research

#### 1. OCENA KURSU I STRATEGII (Płaszczyzna A)
- **Czy przyjęty kierunek jest poprawny w świecie realnym?:** **TAK**
- **Krytyczna ocena założeń:** Interfejs jest osadzony w realiach kuchennych: wysoki kontrast, wyrazista typografia, duże cyfry stopera (64pt) widoczne z odległości 1 metra przy czajniku. Paleta rzemieślnicza (bazalt `#121214`, ciepła miedź `#D97736`, szmaragd herbaty `#2A7B62`) jest estetyczna i całkowicie wolna od infantylnych szablonów AI.
- **Ryzyko strategiczne:** Ryzyko przypadkowych kliknięć mokrymi palcami w kontrolki o minimalnym rozmiarze dopuszczalnym przez Apple (44pt).

#### 2. AUDYT DOWODOWY I JAKOŚĆ WYKONANIA (Płaszczyzna B — Najniższy Poziom Szczegółowości)
- **Stan faktyczny w kodzie i dokumentacji:** Zdefiniowano tokeny designu w `src/core/theme.ts` oraz `src/core/craft-suite-theme.ts`. Przyciski `CraftButton` implementują dotyk haptyczny.
- **Twarde dowody:**
  - `src/core/craft-suite-theme.ts:101`: `touchTargetMin: 44` — spełnia Apple HIG (44pt), lecz standard rzemieślniczy wymaga min. 48pt w kontenerach dotykowych.
  - `src/core/theme.ts:50`: `borderRadius: { full: 999 }` — obecność tokenu rounded-full, choć na kartach używane jest bezpieczne `borderRadius.md` (12px).
  - Kontrast tekstu: zweryfikowany skryptem `gen-theme-contrast-corpus.py` (WCAG AAA $\ge 7:1$).
- **Wykryte Wypaczenia i Antywzorce:** U4 (Salonowy UX — kontrolki 44pt zamiast bezwzględnego 48pt).

#### 3. PUNKTACJA I STATUS ROLI
- **Ocena Kursu (Kierunku):** **4 / 5**
- **Ocena Wykonania (Jakości):** **4 / 5**
- **Status Bramki:** 🟡 **WARUNKOWA** (Zalecane podniesienie `touchTargetMin` do 48pt).

#### 4. ZADANIA NAPRAWCZE DO MATRYCY
- **[TASK-R02-01]** | Priorytet: **P1** | Płaszczyzna: **WYKONANIE**
  - *Lokalizacja:* `src/core/craft-suite-theme.ts:101`, `src/components/craft/CraftButton.tsx:73`
  - *Akcja Naprawcza:* Zwiększyć `touchTargetMin` z 44pt do 48pt, aby zagwarantować bezbłędną obsługę mokrymi dłońmi w kuchni.
  - *Kryterium Akceptacji (DoD):* Test `tests/matrix-dimensions.test.tsx` potwierdzający minimalną wysokość i szerokość kontrolek $\ge 48\text{pt}$.

---

### 🛑 KROK 3/11: Inspekcja Roli 3: Audytor Monetyzacji & Strategia Cenowa

#### 1. OCENA KURSU I STRATEGII (Płaszczyzna A)
- **Czy przyjęty kierunek jest poprawny w świecie realnym?:** **TAK**
- **Krytyczna ocena założeń:** Półka cenowa Apps4Brew (0,99 €/mc, 4,99 €/rok, 14,99 € Lifetime) jest perfekcyjnie skrojona pod psychologię rzemieślnika („taniej niż espresso w kawiarni specialty”). Dostępny zakup wieczysty likwiduje wrogość wobec subskrypcji. Gwarancja dostępu tylko-do-odczytu do historii po wygaśnięciu triala szanuje własność danych użytkownika.
- **Ryzyko strategiczne:** Całkowite załamanie modelu biznesowego z powodu braku technicznej implementacji płatności w kodzie.

#### 2. AUDYT DOWODOWY I JAKOŚĆ WYKONANIA (Płaszczyzna B — Najniższy Poziom Szczegółowości)
- **Stan faktyczny w kodzie i dokumentacji:** Na dysku istnieje plik konfiguracyjny `NaparStoreKit.storekit`, lecz w kodzie aplikacji brakuje jakiegokolwiek mostu do natywnego StoreKit.
- **Twarde dowody:**
  - `src/components/Apps4BrewPassModal.tsx:40-57`:
    ```typescript
    const handleSelectPlan = (tier: 'monthly' | 'annual' | 'lifetime') => {
      subscribe(tier);
      Alert.alert(...);
      ...
      onClose();
    };
    ```
    Brak wywołania `expo-in-app-purchases` ani StoreKit. Kliknięcie natychmiast aktywuje subskrypcję za darmo.
  - `src/core/app-access.ts:11-12`:
    ```typescript
    export const TRIAL_MAX_BREWS = 3;
    export const TRIAL_DURATION_DAYS = 7;
    ```
    Drastyczny rozjazd z BRD (w BRD: 14 dni nielimitowanego triala; w kodzie: trial blokuje się już po 3 parzeniach, czyli często w 1. dniu użytkowania!).
  - `src/core/app-access.ts:34-35`: weryfikacja statusu oparta na nieszyfrowanym rekordzie w bazie SQLite (`getAppSetting('is_pro_active', 'false')`).
- **Wykryte Wypaczenia i Antywzorce:** **U6 (Dziurawy Paywall i Naiwność Subskrypcyjna — BLOKER P0)**.

#### 3. PUNKTACJA I STATUS ROLI
- **Ocena Kursu (Kierunku):** **4 / 5**
- **Ocena Wykonania (Jakości):** **1 / 5**
- **Status Bramki:** 🔴 **ZDYSKWALIFIKOWANA** (Wymaga pilnej implementacji mostu StoreKit).

#### 4. ZADANIA NAPRAWCZE DO MATRYCY
- **[TASK-R03-01]** | Priorytet: **P0** | Płaszczyzna: **WYKONANIE**
  - *Lokalizacja:* `src/components/Apps4BrewPassModal.tsx:40-57`, `src/core/app-access.ts:103-127`
  - *Akcja Naprawcza:* Zintegrować prawdziwe wywołania StoreKit przez natywny moduł IAP lub dedykowany adapter StoreKit z walidacją transakcji i obsługą pliku `NaparStoreKit.storekit` w symulatorze.
  - *Kryterium Akceptacji (DoD):* Test E2E / integracyjny sprawdzający przejście transakcji StoreKit przed odblokowaniem flagi `is_pro_active`.
- **[TASK-R03-02]** | Priorytet: **P1** | Płaszczyzna: **KURS**
  - *Lokalizacja:* `src/core/app-access.ts:11-12`
  - *Akcja Naprawcza:* Zharmonizować parametry okresu próbnego z BRD: zwiększyć `TRIAL_MAX_BREWS` do minimum 15 parzeń lub ustawić 14 dni bez limitu ilościowego w trakcie triala.
  - *Kryterium Akceptacji (DoD):* Zgodność stałych z deklaracją w `napar_brd/00 START.md`.

---

### 🛑 KROK 4/11: Inspekcja Roli 4: Head of Product & Scope Gatekeeper

#### 1. OCENA KURSU I STRATEGII (Płaszczyzna A)
- **Czy przyjęty kierunek jest poprawny w świecie realnym?:** **TAK**
- **Krytyczna ocena założeń:** Zastosowanie Zasady Słoika (Jar Principle) zapobiegło zalaniu ekranu głównego zbędną publicystyką. Encyklopedia botaniczna została wyizolowana do modala kompendium. Słusznie odcięto wagę Bluetooth do wersji 1.2 (DEC-01c), chroniąc harmonogram.
- **Ryzyko strategiczne:** Brak formalnego dokumentu zamrażającego zakres (`docs/scope-contract.md`) sprzyja pełzaniu zakresu (*scope creep*) w kolejnych iteracjach.

#### 2. AUDYT DOWODOWY I JAKOŚĆ WYKONANIA (Płaszczyzna B — Najniższy Poziom Szczegółowości)
- **Stan faktyczny w kodzie i dokumentacji:** Decyzje produktowe są opisane w `napar_brd/Napar BRD 0.1 · 00b Jedna lista decyzji i pytań (DEC-01…DEC-40).md`. Macierz testów `docs/22-macierz-testow.md` śledzi 609 elementów. Brak jednak formalnego pliku `docs/scope-contract.md`.
- **Twarde dowody:**
  - `docs/scope-contract.md`: brak pliku w repozytorium (zwraca `False`).
  - `docs/25-audyt-brd-qa-rel.md`: istnieje raport z audytu QA, ale bez formalnego kontraktu granic wydania v1.0 / v2.0.
- **Wykryte Wypaczenia i Antywzorce:** U8 (Encyklopedyczny Bloat — kontrolowany), U9 (Złudzenie Czystego MVP — brak kontraktu).

#### 3. PUNKTACJA I STATUS ROLI
- **Ocena Kursu (Kierunku):** **4 / 5**
- **Ocena Wykonania (Jakości):** **3 / 5**
- **Status Bramki:** 🟡 **WARUNKOWA** (Wymaga utworzenia formalnego kontraktu zakresu).

#### 4. ZADANIA NAPRAWCZE DO MATRYCY
- **[TASK-R04-01]** | Priorytet: **P1** | Płaszczyzna: **WYKONANIE**
  - *Lokalizacja:* `docs/scope-contract.md`
  - *Akcja Naprawcza:* Utworzyć dokument kontraktu zakresu v1.0 z jawną listą funkcji zakontraktowanych (Scope In) oraz listą funkcji wyciętych / odłożonych do v1.1/v1.2 (Kill List).
  - *Kryterium Akceptacji (DoD):* Obecność `docs/scope-contract.md` zsynchronizowanego z DEC-01..DEC-40.

---

### 🛑 KROK 5/11: Inspekcja Roli 5: Principal System Architect & Tech Lead

#### 1. OCENA KURSU I STRATEGII (Płaszczyzna A)
- **Czy przyjęty kierunek jest poprawny w świecie realnym?:** **TAK**
- **Krytyczna ocena założeń:** Architektura Offline-First oparta na wbudowanym SQLite (`expo-sqlite`) to wzorcowy wybór dla aplikacji kuchennej. Brak zewnętrznych serwerów eliminuje koszty chmurowe i gwarantuje 100% prywatności.
- **Ryzyko strategiczne:** Ryzyko awarii bazy danych i zabicia procesu przez system iOS podczas usypiania aplikacji w tle z powodu braku właściwych pragm i obsługi transakcji.

#### 2. AUDYT DOWODOWY I JAKOŚĆ WYKONANIA (Płaszczyzna B — Najniższy Poziom Szczegółowości)
- **Stan faktyczny w kodzie i dokumentacji:** Silnik bazy danych znajduje się w `src/core/database.ts`. Schemat zdefiniowano w `src/core/database-schema.ts`.
- **Twarde dowody:**
  - `src/core/database.ts:29-41`:
    ```typescript
    export function initDatabase(db: SQLite.SQLiteDatabase): void {
      try { db.execSync('PRAGMA foreign_keys = ON;'); } catch {}
      try { db.execSync('PRAGMA journal_mode = WAL;'); } catch {}
      // BRAK PRAGMA busy_timeout = 5000; !
    ```
    Brak `PRAGMA busy_timeout = 5000;`. W przypadku jednoczesnego zapisu w tle aplikacja natychmiast rzuca wyjątkiem `database is locked`.
  - `src/core/database.ts:54-65`:
    ```typescript
    try {
      db.runSync('ALTER TABLE brew_sessions ADD COLUMN sensory_scores_json TEXT');
    } catch {}
    ```
    Migracje schematu wykonywane surowo bez transakcji `BEGIN TRANSACTION ... COMMIT` i bez uprzedniej kopii zapasowej `backup_pre_migration.db`.
  - W całym `database.ts` nie ma ani jednego wywołania transakcyjnego (`withTransactionSync`).
- **Wykryte Wypaczenia i Antywzorce:** **U10 (Kartonowa Architektura / Ryzyko 0xDEAD10CC — BLOKER P0)**, **U11 (Krucha Trwałość i Brak Asekuracji Migracji — BLOKER P0)**.

#### 3. PUNKTACJA I STATUS ROLI
- **Ocena Kursu (Kierunku):** **4 / 5**
- **Ocena Wykonania (Jakości):** **2 / 5**
- **Status Bramki:** 🔴 **ZDYSKWALIFIKOWANA** (Wymaga uzupełnienia pragm i transakcyjności).

#### 4. ZADANIA NAPRAWCZE DO MATRYCY
- **[TASK-R05-01]** | Priorytet: **P0** | Płaszczyzna: **WYKONANIE**
  - *Lokalizacja:* `src/core/database.ts:29-42`
  - *Akcja Naprawcza:* Dodać `db.execSync('PRAGMA busy_timeout = 5000;');` w `initDatabase`.
  - *Kryterium Akceptacji (DoD):* Test weryfikujący obecność pragmy `busy_timeout` równej 5000ms.
- **[TASK-R05-02]** | Priorytet: **P0** | Płaszczyzna: **WYKONANIE**
  - *Lokalizacja:* `src/core/database.ts:52-82`
  - *Akcja Naprawcza:* Owinąć migracje w jawną transakcję atomową oraz zaimplementować mechanizm kopii zapasowej bazy przed wykonaniem DDL (`backup_pre_migration.db`).
  - *Kryterium Akceptacji (DoD):* Test jednostkowy sprawdzający rollback migracji w przypadku błędu składni DDL.

---

### 🛑 KROK 6/11: Inspekcja Roli 6: Domain Knowledge & Technical Writer

#### 1. OCENA KURSU I STRATEGII (Płaszczyzna A)
- **Czy przyjęty kierunek jest poprawny w świecie realnym?:** **TAK**
- **Krytyczna ocena założeń:** Baza wiedzy jest bezpieczna i rzetelna: metabolizm kofeiny oparty na modelu $t_{1/2}=5\,\text{h}$, receptury mineralizacji wody oparte na czystych solach spożywczych (wodorowęglan sodu, siarczan magnezu). Nie zawiera niebezpiecznych zaleceń biologiczno-chemicznych.
- **Ryzyko strategiczne:** Brak procedur ratunkowych dla herbaty sprawia, że moduł herbaty jest traktowany po macoszemu w stosunku do kawy.

#### 2. AUDYT DOWODOWY I JAKOŚĆ WYKONANIA (Płaszczyzna B — Najniższy Poziom Szczegółowości)
- **Stan faktyczny w kodzie i dokumentacji:** Kompendium wiedzy znajduje się w `src/core/knowledge-data.ts`. Logika diagnozy smaku w `src/core/domain-rules.ts`.
- **Twarde dowody:**
  - `src/core/domain-rules.ts:265-301`: funkcja `diagnoseTaste` obsługuje wyłącznie kawę (`isSour`, `isBitter`, `isAstringent`, `isWatery`, `isTooIntense`). Brak obsługi błędów parzenia herbaty (np. poparzenie liści zielonej herbaty wrzątkiem, nadekstrakcja garbników w Gongfu Cha).
  - `src/core/knowledge-data.ts`: rozmiar 43.4 KB (spełnia limit < 2MB), ale wszystkie teksty posiadają sztywne pola `descriptionPl` i `descriptionEn` zamiast integracji ze słownikiem tłumaczeń.
- **Wykryte Wypaczenia i Antywzorce:** U13 (Mętny Troubleshooting — brak procedur ratunkowych dla herbaty).

#### 3. PUNKTACJA I STATUS ROLI
- **Ocena Kursu (Kierunku):** **4 / 5**
- **Ocena Wykonania (Jakości):** **3 / 5**
- **Status Bramki:** 🟡 **WARUNKOWA** (Wymaga rozbudowy algorytmu ratunkowego o herbatę).

#### 4. ZADANIA NAPRAWCZE DO MATRYCY
- **[TASK-R06-01]** | Priorytet: **P1** | Płaszczyzna: **KURS**
  - *Lokalizacja:* `src/core/domain-rules.ts:265-301`
  - *Akcja Naprawcza:* Rozszerzyć `diagnoseTaste` o algorytm diagnostyki herbaty (za wysoka temperatura wody, zbyt długi czas infuzji, nieodpowiednia woda dla herbat zielonych i białych).
  - *Kryterium Akceptacji (DoD):* Zestaw testów jednostkowych weryfikujących rekomendacje dla herbaty.

---

### 🛑 KROK 7/11: Inspekcja Roli 7: Principal Product Architect (BPR + UX Refactor)

#### 1. OCENA KURSU I STRATEGII (Płaszczyzna A)
- **Czy przyjęty kierunek jest poprawny w świecie realnym?:** **TAK**
- **Krytyczna ocena założeń:** Wprowadzenie proaktywnego powtórzenia ostatniego udanego parzenia (*Quick Re-Brew*) na samej górze ekranu to doskonała realizacja filozofii Lean BPR. Zmniejsza czas dotarcia do parzenia do pojedynczego stuknięcia.
- **Ryzyko strategiczne:** Paraliż poznawczy wynikający z nadmiernego nawarstwienia modali.

#### 2. AUDYT DOWODOWY I JAKOŚĆ WYKONANIA (Płaszczyzna B — Najniższy Poziom Szczegółowości)
- **Stan faktyczny w kodzie i dokumentacji:** Na ekranie głównym `app/(tabs)/index.tsx` zaimplementowano `BrewProAccordion`, jednak cała reszta przepływów opiera się na tradycyjnych modalach.
- **Twarde dowody:**
  - `app/(tabs)/index.tsx:108-116, 642-845`: w jednym pliku widoku zarejestrowano aż 10 modali:
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
  - Brak pliku `docs/to-be.md` dokumentującego metryki redukcji kliknięć As-Is vs To-Be.
- **Wykryte Wypaczenia i Antywzorce:** **U15 (Modalny Paraliż i Utrata Kontekstu — BLOKER P0)**.

#### 3. PUNKTACJA I STATUS ROLI
- **Ocena Kursu (Kierunku):** **4 / 5**
- **Ocena Wykonania (Jakości):** **2 / 5**
- **Status Bramki:** 🔴 **ZDYSKWALIFIKOWANA** (Wymaga de-modalizacji i wdrożenia wzorca P16).

#### 4. ZADANIA NAPRAWCZE DO MATRYCY
- **[TASK-R07-01]** | Priorytet: **P0** | Płaszczyzna: **WYKONANIE**
  - *Lokalizacja:* `app/(tabs)/index.tsx`, `src/components/brew/`
  - *Akcja Naprawcza:* Przekształcić wybór receptury (`RecipeSelectModal`) oraz wybór ziaren (`InventorySelectModal`) w zwijane panele inline (wzorzec P16: „Jedna Otwarta”), aby użytkownik nie tracił podglądu stopera i wagi podczas konfiguracji.
  - *Kryterium Akceptacji (DoD):* Test integracyjny RNTL sprawdzający wybór receptury bez montowania komponentu `<Modal>`.

---

### 🛑 KROK 8/11: Inspekcja Roli 8: Senior Software Engineer & Feature Developer (Implementacja)

#### 1. OCENA KURSU I STRATEGII (Płaszczyzna A)
- **Czy przyjęty kierunek jest poprawny w świecie realnym?:** **TAK**
- **Krytyczna ocena założeń:** Ścisła separacja czystej domeny (`src/core/`) od widoków React Native jest wzorowa i egzekwowana przez regułę architektoniczną `BR-TEST-001` (zakaz importowania Reacta do `src/core/`).
- **Ryzyko strategiczne:** Narastający dług techniczny wynikający z gigantycznych plików widoków (> 900 linii) oraz powszechnego maskowania typów przez `any`.

#### 2. AUDYT DOWODOWY I JAKOŚĆ WYKONANIA (Płaszczyzna B — Najniższy Poziom Szczegółowości)
- **Stan faktyczny w kodzie i dokumentacji:** Wszystkie testy przechodzą na zielono, ale kod zawiera liczne naruszenia rygoru Clean Code i strict TypeScript.
- **Twarde dowody:**
  - Pliki przekraczające limit 500 linii kodu:
    - `app/(tabs)/index.tsx`: **963 linie**
    - `app/gongfu.tsx`: **763 linie**
    - `src/core/database.ts`: **729 linie**
    - `app/recipe-builder.tsx`: **693 linie**
    - `app/(tabs)/beans.tsx`: **666 linie**
    - `app/(tabs)/caffeine.tsx`: **664 linie**
    - `src/components/brew/RecipeSelectModal.tsx`: **656 linie**
    - `app/settings.tsx`: **646 linie**
  - Polowanie na `any`:
    - `src/core/database.ts:138, 144, 203, 241, 247, 353, 379, 435, 584`: surowe `getAllSync<any>`, `mapRowTo...(row: any)`, `escapeCsvCell(val: any)`.
    - `app/(tabs)/index.tsx:106, 153, 189, 216, 322, 647`: `useState<any[]>`, `(recipe as any).type`, `handleQuickReBrew = (s: any)`.
    - `src/core/timer-engine.ts:51`: `private intervalId: any = null`.
    - `src/core/theme.ts:77`: `fontVariant: ['tabular-nums'] as any`.
    - `src/core/QrScannerModal.tsx:33`: `useRef<any>(null)`.
  - Brak jawnych transakcji w metodach mutujących bazę danych.
- **Wykryte Wypaczenia i Antywzorce:** **U16 (Cukier Składniowy i Zakamuflowany Any — BLOKER P0)**, **U17 (Wyciek Logiki do UI / God Objects — BLOKER P0)**.

#### 3. PUNKTACJA I STATUS ROLI
- **Ocena Kursu (Kierunku):** **4 / 5**
- **Ocena Wykonania (Jakości):** **2 / 5**
- **Status Bramki:** 🔴 **ZDYSKWALIFIKOWANA** (Zgodnie z mandatem audytora: obecność `any` w modelach danych lub repozytoriach to maksymalnie 2/5).

#### 4. ZADANIA NAPRAWCZE DO MATRYCY
- **[TASK-R08-01]** | Priorytet: **P0** | Płaszczyzna: **WYKONANIE**
  - *Lokalizacja:* `src/core/database.ts`
  - *Akcja Naprawcza:* Wprowadzić silnie typowane interfejsy wierszy SQLite (np. `RecipeRow`, `InventoryRow`, `BrewSessionRow`) i zastąpić wszystkie `getAllSync<any>` oraz `(row: any)` typowanymi zapytaniami.
  - *Kryterium Akceptacji (DoD):* Zero wystąpień słowa kluczowego `any` w `src/core/database.ts`.
- **[TASK-R08-02]** | Priorytet: **P0** | Płaszczyzna: **WYKONANIE**
  - *Lokalizacja:* `app/(tabs)/index.tsx`
  - *Akcja Naprawcza:* Przeprowadzić dekompozycję pliku `app/(tabs)/index.tsx` (963 linie) na mniejsze komponenty prezentacyjne i hooki (np. `useBrewWorkflow.ts`, `BrewQuickActions.tsx`), schodząc poniżej 400 linii.
  - *Kryterium Akceptacji (DoD):* Liczba linii kodu w `index.tsx` $\le 450$, zero wystąpień `any`.

---

### 🛑 KROK 9/11: Inspekcja Roli 9: Principal Localization Engineer (35 Języków Świata)

#### 1. OCENA KURSU I STRATEGII (Płaszczyzna A)
- **Czy przyjęty kierunek jest poprawny w świecie realnym?:** **NIE (GŁĘBOKI ROZJAZD Z DEKLARACJĄ)**
- **Krytyczna ocena założeń:** W BRD zadeklarowano aplikację globalną w 35 językach. W rzeczywistości wdrożono zaledwie dwa języki (polski i angielski). Zignorowano kluczowe rynki kawowe i herbaciane (Niemcy, Francja, Hiszpania, Włochy, Japonia, Chiny).
- **Ryzyko strategiczne:** Zablokowanie wejścia na rynki międzynarodowe, niespełnienie obietnicy marketingowej z BRD.

#### 2. AUDYT DOWODOWY I JAKOŚĆ WYKONANIA (Płaszczyzna B — Najniższy Poziom Szczegółowości)
- **Stan faktyczny w kodzie i dokumentacji:** Plik `src/core/i18n.tsx` zawiera wyłącznie słowniki `pl` oraz `en`. Brak `_source.json`.
- **Twarde dowody:**
  - `src/core/i18n.tsx:32-36`: obiekt `translations` zawiera wyłącznie klucze `pl` i `en`.
  - `scripts/check-i18n.mjs:33-36`:
    ```javascript
    if (!tr || !tr.pl || !tr.en) {
      console.error('Error: translations.pl or translations.en not found in i18n.tsx');
    ```
    Skrypt weryfikacyjny został napisany wyłącznie dla 2 języków i nie obsługuje pozostałych 33.
  - Brak implementacji reguł łamania linii UAX #14 dla składu CJK (chiński, japoński, koreański).
- **Wykryte Wypaczenia i Antywzorce:** **U18 (Maszynowe Gibberish / Brak Słowników Rynków Kluczowych — BLOKER P0)**, **U19 (Asymetria Zmiennych i Pęknięty Układ)**.

#### 3. PUNKTACJA I STATUS ROLI
- **Ocena Kursu (Kierunku):** **2 / 5**
- **Ocena Wykonania (Jakości):** **2 / 5**
- **Status Bramki:** 🔴 **ZDYSKWALIFIKOWANA** (Wymaga utworzenia `_source.json` i wygenerowania słowników dla pozostałych języków).

#### 4. ZADANIA NAPRAWCZE DO MATRYCY
- **[TASK-R09-01]** | Priorytet: **P0** | Płaszczyzna: **WYKONANIE**
  - *Lokalizacja:* `src/core/i18n.tsx`, `scripts/check-i18n.mjs`
  - *Akcja Naprawcza:* Wyodrębnić bazowy słownik `_source.json`, zaimplementować generator 35 plików językowych oraz rozszerzyć `scripts/check-i18n.mjs` o test symetrii parametrów `{param}` na wszystkich 35 słownikach.
  - *Kryterium Akceptacji (DoD):* Skrypt `check:i18n` walidujący 35 języków bez ani jednej asymetrii.

---

### 🛑 KROK 10/11: Inspekcja Roli 10: Principal Test Architect & CI/CD Strategy

#### 1. OCENA KURSU I STRATEGII (Płaszczyzna A)
- **Czy przyjęty kierunek jest poprawny w świecie realnym?:** **TAK (BARDZO WYSOKI STANDARD)**
- **Krytyczna ocena założeń:** Strategia testów w projekcie jest jedną z najmocniejszych stron: pełne testowanie niezmienników fizycznych, potok mutacyjny Stryker, testy własnościowe PBT (`fast-check`) z jawnym logowaniem `PROP_SEED`, potok CI badający 7 stref czasowych.
- **Ryzyko strategiczne:** Brak fizycznego testu migracji starszej wersji bazy danych SQLite zagraża utratą danych użytkowników przy aktualizacji do v2.0.

#### 2. AUDYT DOWODOWY I JAKOŚĆ WYKONANIA (Płaszczyzna B — Najniższy Poziom Szczegółowości)
- **Stan faktyczny w kodzie i dokumentacji:** 73 pakiety testowe, 626 testów przechodzących w 100%. CI w 7 strefach czasowych (`.github/workflows/tests-tz.yml`).
- **Twarde dowody:**
  - `.github/workflows/tests-tz.yml:23-32`: macierz 7 stref (`UTC`, `Europe/Warsaw`, `America/New_York`, `America/Los_Angeles`, `Asia/Tokyo`, `Pacific/Auckland`, `Pacific/Honolulu`).
  - `tests/domain-properties.test.ts` & `src/core/__tests__/property-based.test.ts`: testy PBT z generowaniem losowych wejść i logowaniem `PROP_SEED`.
  - Luka: Brak testu `tests/migration-v1-to-v2.test.ts` wczytującego fizyczny plik bazy ze schematem v1.0 i sprawdzającego bezstratną migrację do schematu docelowego.
- **Wykryte Wypaczenia i Antywzorce:** U21 (częściowo — brak fizycznego zrzutu testowego migracji).

#### 3. PUNKTACJA I STATUS ROLI
- **Ocena Kursu (Kierunku):** **5 / 5**
- **Ocena Wykonania (Jakości):** **4 / 5**
- **Status Bramki:** 🟡 **WARUNKOWA** (Wymaga utworzenia fizycznego testu migracji SQLite).

#### 4. ZADANIA NAPRAWCZE DO MATRYCY
- **[TASK-R10-01]** | Priorytet: **P1** | Płaszczyzna: **WYKONANIE**
  - *Lokalizacja:* `tests/migration-v1-to-v2.test.ts`
  - *Akcja Naprawcza:* Utworzyć fizyczny fixture bazy danych v1.0 (`tests/fixtures/napar-v1.0.db`) oraz test weryfikujący, że po uruchomieniu `initDatabase` 100% receptur, ziaren i sesji parzenia zachowuje integralność.
  - *Kryterium Akceptacji (DoD):* Test bezbłędnej migracji ze schematu v1 do v3 z asercjami na danych użytkownika.

---

### 🛑 KROK 11/11: Forensic QA & Gotowość Wydania

#### 1. OCENA KURSU I STRATEGII (Płaszczyzna A)
- **Czy przyjęty kierunek jest poprawny w świecie realnym?:** **TAK**
- **Krytyczna ocena założeń:** Aplikacja bezbłędnie realizuje Aksjomat Niezależności i Tryb Samolotowy Zero-Network: nie wykonuje żadnych wywołań sieciowych przy starcie, nie posiada trackerów telemetrycznych i jest w pełni operacyjna w głębokim lesie i samolocie.
- **Ryzyko strategiczne:** Zgłoszenie aplikacji do App Store w obecnym stanie skutkować będzie odrzuceniem z powodu fikcyjnego paywalla (Rola 3).

#### 2. AUDYT DOWODOWY I JAKOŚĆ WYKONANIA (Płaszczyzna B — Najniższy Poziom Szczegółowości)
- **Stan faktyczny w kodzie i dokumentacji:** Przebadano pliki binarne, skrypty CI oraz uruchomiono pełną bramkę weryfikacyjną.
- **Twarde dowody:**
  - Inspekcja binarna assetów PNG:
    - `assets/icon.png`: $1024 \times 1024$, `bit_depth=8`, `color_type=2` (Truecolor bez kanału alfa!). Zero ryzyka odrzucenia przez App Store Connect za ColorType 6.
    - `assets/splash.png`: $1284 \times 2778$, `color_type=2`.
  - Czystość repozytorium: brak plików `.DS_Store`, brak logów, brak zbędnych artefaktów.
  - Wynik komendy: `npm run verify` zakończony kodem wyjścia 0 (73 passed, 626 passed, ast matrix 609/609).
  - Weryfikacja katalogu usterek A1–A22: zabezpieczenie CSV przed formula injection (`escapeCsvCell`), brak nadmiarowych uprawnień w `app.json`.
- **Wykryte Wypaczenia i Antywzorce:** U25 (czyste — brak skażenia binarnego).

#### 3. PUNKTACJA I STATUS ROLI
- **Ocena Kursu (Kierunku):** **4 / 5**
- **Ocena Wykonania (Jakości):** **4 / 5**
- **Status Bramki:** 🟡 **WARUNKOWA** (Zablokowana przez usterki krytyczne z ról 3, 5, 8).

#### 4. ZADANIA NAPRAWCZE DO MATRYCY
- **[TASK-R11-01]** | Priorytet: **P1** | Płaszczyzna: **WYKONANIE**
  - *Lokalizacja:* `tests/airplane-mode.test.ts`
  - *Akcja Naprawcza:* Dodać dedykowany test automatyczny symulujący całkowite odcięcie sieci (`fetch = undefined`, `WebSocket = undefined`) i sprawdzający 100% operacji na stoperze i spiżarni.
  - *Kryterium Akceptacji (DoD):* Test `tests/airplane-mode.test.ts` exit code 0.

---

## 4. Ostateczny Werdykt Wydania

### 🔴 STATUS: CONDITIONAL REJECTED (WARUNKOWO ZABLOKOWANY)

Aplikacja **Napar (Steepwise)** posiada wybitną logikę domenową, znakomicie zbadane podstawy naukowe i wzorcową kulturę testów matematycznych (PBT fast-check, CI 7 stref czasowych).  
Jednakże ze względu na **5 Krytycznych Blokad P0** (w szczególności: fikcyjny paywall bez natywnego StoreKit grożący natychmiastowym odrzuceniem przez Apple, brak `PRAGMA busy_timeout = 5000;`, brak transakcji atomowych, plagę `any` w warstwie danych i brak 33 z 35 zadeklarowanych języków):

> **Aplikacja NIE MOŻE zostać opublikowana w App Store w bieżącym stanie.**  
> Zezwala się na publikację wyłącznie po zrealizowaniu wszystkich zadań o priorytecie **P0** z oficjalnej **Matrycy Zadań Naprawczych (`docs/remediation-matrix.md`)**.

---
*Podpisano:*  
**Rola 16: AD-HOC Naczelny Inspektor Rzemiosła i Jakości (Supreme Forensic Auditor 1–11)**  
*Ekosystem Apps4Craft / Apps4Brew Studio*

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

### **ER-01 (2026-11-13): Model przychodu BRD 0.1 zastąpiony wersją darmową (DEC-41)**
* **Kolizja:** BRD 0.1 ustalał subskrypcję, zakup dożywotni, 14-dniowy okres próbny, Family Sharing i ceny (A2 5.1, 00 START, DEC-11, DEC-12, BR-ZAK-001, Z-161) bez słów właściciela i daty; kod miał zakup-atrapę bez StoreKit.
* **Rozstrzygnięcie:** DEC-41 (a): wersja 1.0 całkowicie darmowa. Ceny i okres próbny z BRD 0.1 to hipoteza H-MON-01 (A2 5.1), nie decyzja. BR-ZAK-001, Z-161, KPI konwersji (A4), RYZ-06 i wiersz 3.1.2(a) (D1) nie dotyczą 1.0. SPRZ-01 („w ramach jednego zakupu”, „uzasadnia subskrypcję”) czytać bez zakupu.
* **Powrót:** model płatny wymaga nowej decyzji właściciela z opcjami roli 02, prawdziwego StoreKit (transakcje sklepu jako źródło dostępu) i ADR biblioteki z rolą 05.

---

### **SPRZ-05: Pomiary TDS i refraktometria**
* **Kolizja:** Wskaźnik Extraction Yield (EY %) wymaga znajomości TDS (Total Dissolved Solids), który mierzy się drogim refraktometrem optycznym (np. VST, DiFluid), którego 95% użytkowników domowych nie posiada.
* **Rozstrzygnięcie:** Pole TDS w dzienniku jest **opcjonalne**. Jeśli użytkownik nie posiada refraktometru, aplikacja szacuje optymalną ekstrakcję na podstawie dozy, czasu spływu, stopnia zmielenia i oceny sensorycznej w module Dial-in Doctor.

---

> **Oznaczenia ER-02…ER-05 (2026-11-15, M1-audytor-generalny-037; 01-odkrywanie-011).** „DEC-nn audytu M1” to decyzja z listy decyzji audytu M1 2026-11-11 (DEC-01…DEC-13), rozstrzygnięta przez właściciela 2026-11-13 („Wszystko według rekomendacji”); nie jest to wiersz 00b o tym samym numerze. „KILL-nn” i „ZM-nn” to wiersze `docs/scope-contract.md` (lista odcięć i bramka zmian zakresu). BRD 0.1 zostaje dokumentem historycznym z erratą (DEC-10 audytu M1 (a)); kontrakt zakresu przebuduje rola 03. Pilnuje tego test `tests/audit-fixes.test.tsx`, blok „M1-audytor-generalny-037”.

### ER-02 (2026-11-15): Identyfikator aplikacji — zostaje pl.lukasz.napar (DEC-12 audytu M1)
* **Kolizja:** 00b DEC-05 („A: com.apps4brew.napar”, status „ZAAKCEPTOWANA” bez słów właściciela i daty — ZASTĄPIONA tą erratą) oraz D2 11 (prefiks App Group z tym identyfikatorem — ZASTĄPIONE) wobec identyfikatora w `app.json` (`expo.ios.bundleIdentifier`, `expo.android.package`), w potoku TestFlight (`.github/workflows/testflight.yml`, `BUNDLE_ID`), w E2E (`.github/workflows/e2e-ios.yml`, `.maestro/*.yaml`, `appId`) i w buildach wysłanych do TestFlight: `pl.lukasz.napar`.
* **Rozstrzygnięcie:** DEC-12 audytu M1, wybór (a), 2026-11-13: identyfikator aplikacji to `pl.lukasz.napar` w BRD, `app.json` i potoku. Odrzucona opcja (b): zmiana na identyfikator z marką przed wydaniem (nowy rekord aplikacji w App Store Connect, nowe profile i potok). Przyjęty kompromis: identyfikator bez marki Apps4Brew, po wydaniu nie do zmiany. Prefiks App Group z D2 nie dotyczy 1.0 (App Group ani zakupów nie ma); przy powrocie wybiera go rola 05 od identyfikatora aplikacji.
* **Kontrola:** jeden identyfikator w `app.json`, `testflight.yml`, `e2e-ios.yml`, `.maestro/config.yaml` i BRD; inny identyfikator w BRD tylko w wierszu oznaczonym jako zastąpiony.

### ER-03 (2026-11-15): Funkcje wycięte z 1.0, które BRD wymagało jako MVP
* **Kolizja:** B4 BR-KOF-002, B5 BR-ZEG-001…004, tabela zakresu A3b, D1 (NFR-WYD-002, NFR-BEZP-002, wiersz 5.1.2(i)), A1 ZP-14, 00b (DEC-01, DEC-04, DEC-08, DEC-19), A3c 6.3–6.4 i 00 START 2 i 4 opisywały jako 1.0 / MVP funkcje, które lista odcięć i decyzje audytu wycięły. Wpisów ER nie było, więc następna rola czytała je jako obowiązujące.
* **Rozstrzygnięcie:** wymagania z tabeli mają status „wycofane z 1.0”, „odłożone”, „nie dotyczy 1.0” albo „zastąpione” z odwołaniem do pozycji listy odcięć lub decyzji. Treść wymagań zostaje jako historia i punkt wyjścia przy powrocie. Warunki powrotu są w kontrakcie zakresu (kolumna „Przyczyna” i wiersze ZM). Errata nie dodaje funkcji.

| KILL / decyzja | Funkcja wycięta z 1.0 | Decyzja (data) | Wymagania BRD ze statusem | Uwagi |
|---|---|---|---|---|
| KILL-01 | wagi Bluetooth | kontrakt zakresu 2026-10-24 (v1.2) | brak BR; BRD planuje wagi w 1.2 (A3c 6.3, wariant c w 00 START 3) — zgodne | — |
| KILL-02 | moduł społecznościowy i chmura | kontrakt zakresu 2026-10-24 (nigdy) | brak BR; wymiana receptur offline kodem QR zostaje w 1.0 | — |
| KILL-03 | czaty LLM i asystenci generatywni | kontrakt zakresu 2026-10-24 (nigdy) | brak BR; zgodne z zasadami produktu w A1 (deterministyczny Dial-in Doctor) | — |
| KILL-04 | zamawianie ziaren ze sklepów | kontrakt zakresu 2026-10-24 (v2.0+) | brak BR | — |
| KILL-05 | rozpoznawanie etykiet przez chmurowy OCR | kontrakt zakresu 2026-10-24 (v1.2) | brak BR; pytanie OP-01 w D3 16 (OCR w 1.1) czytać jako v1.2 | — |
| KILL-06 | Live Activity i Dynamic Island | kontrakt zakresu 2026-10-24 (v1.2); kod usunięty 2026-11-13 (ZM-01, DEC-02 audytu M1 (a)) | BR-ZEG-003, BR-ZEG-004, Z-130, Z-131, NFR-WYD-002 | słowa właściciela dla wierszy listy odcięć z 2026-10-24 nie są zapisane w rejestrze — do roli 03 |
| KILL-07 | aplikacja Apple Watch z haptyką | kontrakt zakresu 2026-10-24 (v1.2) | BR-ZEG-001, BR-ZEG-002, Z-120, Z-121, Z-122, Z-123, ZP-14, BRD DEC-19 | jak wyżej; 00b DEC-01 (wariant b+ z Watch i Live Activity) zastąpiona dla 1.0 |
| KILL-08 | zapis kofeiny do Apple Health (HealthKit) | DEC-04 audytu M1 (a), 2026-11-13; ZM-02 2026-11-14 | BR-KOF-002, Z-096, NFR-BEZP-002, BRD DEC-08 | wiersz 5.1.2(i) w D1 nie dotyczy 1.0 |
| KILL-09 | powiadomienia o etapach parzenia w tle | DEC-08 audytu M1 (a), 2026-11-13; ZM-03 2026-11-15 | brak BR (wymagań powiadomień etapów nie było w BRD); Z-017 | profil Cold Brew z powiadomieniem po maceracji odłożony razem z KILL-09 (kontrakt zakresu 2026-11-15, rekomendacja (1) z 01-odkrywanie-021) |
| DEC-03 audytu | 35 języków (w 1.0 polski i angielski) | DEC-03 audytu M1 (a), 2026-11-13 | Z-180 | „35 języków” w 00 START 2 i A3c 6.3–6.4 czytać jako PL i EN; rejestr `docs/lokalizacja/jezyki.md` |
| DEC-06 audytu | angielska nazwa aplikacji z 00b i tytuł ASO w A4 15.2 | DEC-06 audytu M1 (a), 2026-11-13 | BRD DEC-04 | „Napar” bez nazwy angielskiej; nazwa ostateczna przed rekordem w App Store Connect otwarta (11-wzrost-010) |
| DEC-12 audytu | identyfikator aplikacji z 00b | DEC-12 audytu M1 (a), 2026-11-13 | BRD DEC-05 | ER-02 |
| DEC-01 audytu | zakupy, okres próbny, Family Sharing | DEC-01 audytu M1 (a), 2026-11-13 | patrz ER-01 | — |

### ER-04 (2026-11-15): Stos technologiczny — Expo / React Native zamiast Swift
* **Kolizja:** D2 11 (stos Swift 6 / SwiftUI / SwiftData z GRDB), A1 ZP-15, A3b Z-150, A3c 6.4 i B3 (lista sesji) zakładają kod natywny Swift, a kod 1.0 to Expo SDK 57 i React Native 0.86 w TypeScript (`package.json`), z `expo-sqlite` i Expo Router (`app/`).
* **Rozstrzygnięcie:** stan faktyczny od pierwszego commitu repozytorium (491d618, 2026-10-29); zapisanej decyzji o stosie (opcje, słowa właściciela) nie ma. Wymagania funkcjonalne i reguły BRD obowiązują niezależnie od stosu; nazwy frameworków natywnych czytać jako odpowiedniki w Expo / React Native. ActivityKit, WatchKit i HealthKit: ER-03; WidgetKit: ER-05. Zapis decyzji o stosie (ADR) należy do roli 05.
* **Kontrola:** każdy wiersz BRD poza tą erratą, który wymienia framework natywnego stosu, ma odwołanie ER-04.

### ER-05 (2026-11-15): Wymagania MVP bez kodu i bez decyzji zakresu — iCloud Drive i widżety
* **Kolizja:** B6 BR-DANE-001 (kopia w iCloud Drive), A3b Z-151 i A1 ZP-06 oraz B5 BR-ZEG-005 i A3b Z-132 (widżety ekranu początkowego) mają etap MVP. W `app/`, `src/`, `lib/` i `app.json` nie ma kopii do iCloud Drive ani widżetów (jedyne trafienie „iCloud” to komentarz o systemowej kopii urządzenia w `src/core/db-path.ts`), a lista odcięć ich nie wymienia.
* **Rozstrzygnięcie:** brak — to decyzja zakresu dla roli 03 (DEC-10 audytu M1 (a), zadanie M1-audytor-generalny-038) i właściciela. Do tego czasu wymagania mają status „nierozstrzygnięte”. W 1.0 dane chronią kopie lokalne na urządzeniu oraz eksport i import JSON (BR-DANE-001, kryteria 1–2).

| KILL / decyzja | Funkcja | Decyzja (data) | Wymagania BRD ze statusem | Uwagi |
|---|---|---|---|---|
| bez decyzji | kopia zapasowa w iCloud Drive | — | BR-DANE-001, Z-151, ZP-06 | eksport i import JSON obowiązują |
| bez decyzji | widżety ekranu początkowego | — | BR-ZEG-005, Z-132 | — |

### ER-06 (2026-11-15): Kontrakt zakresu od nowa — główna praca, hipotezy wartości, ID tylko ASCII (D-010)
* **Kolizja:** kontrakt zakresu z 2026-10-24 powoływał się na zakresy BR, których BRD nie definiuje (np. BR-PARZ-030…045, BR-KALK-020…032), i nie przypisywał BR do funkcji. BRD nie ma pracy użytkownika (J) ani hipotez wartości (H). Dial-in Doctor (C1) i kreator własnych przepisów działają w aplikacji bez BR. ID młynka zawierało literę spoza ASCII, więc narzędzia i testy rozpoznające ID wzorcem `[A-Z]` go nie widziały.
* **Rozstrzygnięcie:** D-010 w `docs/decyzje.md` (DEC-10 audytu M1 (a), 2026-11-13). Kontrakt `docs/scope-contract.md` z 2026-11-15 przypisuje każde BR do jednej funkcji F-nn albo do tabeli funkcji bez decyzji (decyduje właściciel). Pracę J-01 i hipotezy H-01…H-03 zapisuje rola 03 do przeglądu roli 01; BR z kryteriami dla funkcji opartych na H pisze rola 01 (ER dla roli 01). ID młynka: BR-MLYNEK-001 (nagłówek w B1; dawny zapis z literą Ł). Treść wymagań bez zmian.
* **Liczby rynkowe bez źródła:** A2 4.1 („42% entuzjastów … parzy herbaty”) i A2 4.2 („odstraszający 80% początkujących”) nie mają adresu źródła; kontrakt ich nie używa jako dowodu wartości. Ocenie Beanconqueror w A2 przeczy recenzja w App Store z 2025-11-02 (odczyt 2026-11-11): „Beanconqueror is the most intuitive and the best”. Dowody wartości funkcji: tabela źródeł w `docs/scope-contract.md` §1.
* **Kontrola:** `tests/audit-fixes.test.tsx`, blok „M1-audytor-generalny-038”: każde ID z kontraktu istnieje w BRD albo w rejestrze decyzji, a każde BR ma w kontrakcie jedną decyzję albo wiersz „bez decyzji”.

| ID | Treść | Dowód (odczyt 2026-11-11) | Status |
|---|---|---|---|
| **J-01** | Zaparzyć dziś dobrą kawę specialty albo herbatę liściastą bez liczenia w głowie, a gdy wyszła źle, wiedzieć, co zmienić następnym razem. | linia bazowa audytu M1: opisy Filtru Coffee, Timer.Coffee, Beanconqueror i MyTeaPal w App Store | praca do potwierdzenia przez właściciela |
| **H-01** | Jedna konkretna korekta jednego parametru po ocenie parzenia (Dial-in Doctor, C1) pomaga trafić następnym razem. | Filtru Coffee, „Co nowego” 5.0: Dial In przeniesiony do zapisu parzenia | hipoteza; BR do napisania (rola 01) |
| **H-02** | Użytkownik chce zapisać własny przepis wieloetapowy i parzyć według niego jak według przepisu z biblioteki. | Timer.Coffee, opis w App Store: „Create & Share Recipes” | hipoteza; BR do napisania (rola 01) |
| **H-03** | Nowy użytkownik szybciej dochodzi do pierwszego parzenia, gdy aplikacja pyta tylko o rodzaj napoju (kawa, herbata, oba). | Filtru Coffee, „Co nowego” 5.0: „Improved onboarding” | hipoteza; BR do napisania (rola 01) |
| **H-04** | Kopia zapasowa danych użytkownika w iCloud Drive (część „iCloud Drive” z ER-05, Z-151, ZP-06; w 1.0 dane chronią kopie lokalne i eksport F-10). | ER-05 (2026-11-15), D-018 (2026-11-19) | odłożone (PÓŹNIEJ v1.2, F-38) |
| **H-05** | Karta kosztu parzenia wobec kawiarni w oknie zapisu (bez BR, wartości domyślne bez danych użytkownika). | brak dowodu w linii bazowej; D-020 (2026-11-19) | odrzucona (NIE, F-31, ZM-07) |
| **H-06** | Kalendarz 14 dni z harmonogramem akcji i eksportem `.ics` w Dzienniku (bez BR, inny rytm niż J-01). | brak dowodu w linii bazowej; D-020 (2026-11-19) | odrzucona (NIE, F-32, ZM-08) |
| **H-07** | Udostępnienie wpisu dziennika jako notatki degustacyjnej (tekst). | Timer.Coffee, opis w App Store (Ź-03); D-018 (2026-11-19) | hipoteza; BR do napisania (rola 01, F-33) |
| **H-08** | Link prośby o ocenę w App Store w Ustawieniach po nadaniu identyfikatora w sklepie. | D-018 (2026-11-19): zasila dowód R po wydaniu | hipoteza; BR do napisania (rola 01, F-41) |

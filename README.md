# Napar (Steepwise) ☕🍵

> **„Parz uważnie, smakuj głęboko — Twoja codzienna chwila rzemiosła.”**

Aplikacja mobilna dla miłośników kawy specialty i rzemieślniczej herbaty liściastej, stworzona zgodnie z bezkompromisowymi zasadami ekosystemu **Apps4Brew**.

---

## 🌟 Główne Zasady Produktowe (Apps4Brew)

- **100% Offline-First:** Pełna funkcjonalność bez połączenia z internetem. Działa w podróży, schronisku górskim i kawiarni bez Wi-Fi.
- **Zero Login & Bez Kont:** Brak ekranów rejestracji, formularzy logowania czy onboardingowych ankiet. Po uruchomieniu od razu gotowa do parzenia.
- **Prywatność „Data Not Collected”:** Zero trackerów, zero zewnętrznych bibliotek telemetrycznych (brak Firebase, Meta, Google Analytics). Twoje notatki degustacyjne i magazyn ziaren należą wyłącznie do Ciebie.
- **Własność Danych:** Bezpłatny i nielimitowany eksport/import całej bazy do formatu JSON w dowolnym momencie.
- **Deterministyczna Fizyka i Chemia Wody:** Wszystkie formuły (Brew Ratio, retencja wody $2.0\,\text{g/g}$, Extraction Yield $EY\%$, kinetyka eliminacji kofeiny $t_{1/2}=5.0\,\text{h}$, remineralizacja wody Barista Hustle/SCA, Dial-in Doctor) bazują na zweryfikowanej literaturze naukowej SCA (Specialty Coffee Association), Hendona (*Water for Coffee*) i EFSA.

---

## 📱 Moduły i Ekrany

1. **☕ Asystent Parzenia (Active Brew Assistant):**
   - Precyzyjny stoper z blokadą wygaszania ekranu (`expo-keep-awake`) i sygnałami wibracyjnymi (`expo-haptics`).
   - Wskaźnik tempa nalewania (g/s) i dynamiczny pasek postępu wody dla każdego etapu.
   - Płynne skalowanie gramatur przy zmianie dozy z zachowaniem właściwych proporcji (Batch Scaling 1–4 osób z korektą grubości przemiału).
   - **⏱️ Korekta Czasu Etapu w Locie (Z-009):** Dotykowe pigułki `-10s` i `+10s` w nagłówku aktywnego kroku pozwalające w czasie rzeczywistym wydłużyć lub skrócić czas zalania bez resetowania timera.
   - **📋 Klonowanie i Duplikacja Receptur (Z-024):** Przycisk `📋` przy każdej recepturze wzorcowej i autorskiej tworzący natychmiastową kopię w lokalnej bazie SQLite do swobodnej edycji i personalizacji.
   - **⚙️ Młynek Domowy (Grinder Dial-in):** Precyzyjny selektor młynka specialty (Comandante C40 MK3/MK4, Timemore Chestnut C2/C3, 1Zpresso K-Ultra/K-Max, Fellow Ode Gen 2, Baratza Encore, Kingrinder K6) z automatycznym przeliczaniem mikronów ($\mu\text{m}$) na kliki/nastawę tarczy dla wybranej metody i trwałym zapamiętywaniem w SQLite.
   - **📢 Dostępność VoiceOver & Haptyka (BR-DOST-001, DEC-13):** Automatyczne mówione anonsowanie zmian etapów (`AccessibilityInfo.announceForAccessibility`), wagi docelowej wody, 3-sekundowych ostrzeżeń przed końcem zalania, sygnałów haptycznych (`expo-haptics`) i podsumowania po zakończeniu sesji (stworzone z myślą o osobach niewidomych i słabowidzących, Persona Ewa P4).
   - **📱 Wymiana Receptur Offline (Kody QR SVG & Universal Links — DEC-20):** Błyskawiczne udostępnianie i importowanie receptur w 100% offline (zero konta, zero chmury, zero telemetry). Wektorowy generator kodów QR SVG, protokół deep link `napar://recipe?v=1&d=...` oraz `https://napar.app/recipe?v=1&d=...`, natywne udostępnianie systemowe (`Share.share`) oraz modal importu z podglądem kroków.
   - Karta degustacyjna po zakończeniu: ocena w gwiazdkach, profil balansu smaku, nuty smakowe, wybór profilu użytej wody, odczyt refractometru TDS.
2. **🫘 Spiżarnia Ziaren & Liści (Stash) & Kompendium Wiedzy:**
   - Śledzenie świeżości ziaren kawy (okno *Resting Window*: odgazowywanie CO₂, szczyt smaku *Peak*, stabilne okno, dojrzałe ziarna).
   - **✏️ Edycja Paczki & Szybkie Steppery Wagowe (BR-MAG-001):** Pełny modal edycji metadanych paczki (odmiana botaniczna, proces obróbki, data palenia, waga) oraz przyciski szybkiej korekty (`-15 g`, `-18 g`, `+15 g`, `0 g`).
   - **⚠️ Archiwizacja Pustych Paczek (BR-MAG-004):** Automatyczny baner na karcie paczki po osiągnięciu 0 g z 1-tap archiwizacją oraz trwałym usuwaniem z potwierdzeniem.
   - Dynamiczny ubytek wagi w paczce po każdym parzeniu.
   - Filtrowanie: Wszystkie, Kawa ziarnista, Herbata liściasta, Archiwum.
   - **📚 Kompendium Wiedzy (Encyklopedia Specialty & Herbaty):**
     - *Odmiany botaniczne kawy (10 odmian):* Geisha, SL28 & SL34, Pink Bourbon, Ethiopian Heirloom, Bourbon, Typica, Caturra/Catuai, Pacamara, Castillo, Eugenioides.
     - *Metody obróbki ziaren (6 procesów):* Washed, Natural, Honey (Yellow/Red/Black), Anaerobic, Carbonic Maceration, Wet-Hulled.
     - *Terroir & Kraje (7 eksporterów):* Etiopia, Kenia, Kolumbia, Gwatemala, Kostaryka, Brazylia, Panama (wysokości, zbiory, profile sensoryczne).
     - *Klasyfikacja herbaty (6 wielkich tradycji):* Biała (Bai Cha), Zielona (Lü Cha / Ryokucha), Żółta (Huang Cha), Wulong (Oolong), Czarna/Czerwona (Hong Cha), Ciemna (Heicha / Puerh).
     - Funkcja *„+ Użyj jako szablon w spiżarni”* natychmiast predefiniująca kartotekę surowca.
   - Natychmiastowe przejście do parzenia z wybranej paczki.
3. **📖 Dziennik Degustacji & Analityka (Brew Journal & Analytics):**
   - Pełna historia zaparzonych filiżanek z datą, recepturą, parametrami (czas, doza, woda, temperatura, nastawa młynka, użyty profil wody).
   - Obliczone wskaźniki ekstrakcji ($EY\%$) i szacowana zawartość kofeiny (mg).
   - Balans smaku, notatki degustacyjne, plakietka profilu wody i oceny.
   - **🔁 Parz Ponownie (Brew Again — BR-DZIEN-004):** Błyskawiczne odtworzenie historycznej sesji jednym dotknięciem – załadowanie proporcji, dozy, temperatury, profilu wody i nastawy młynka bezpośrednio do aktywnego Asystenta Parzenia.
   - **📤 Udostępnianie Notatek Degustacyjnych:** Generowanie sformatowanej, estetycznej karty parzenia z parametrami, balansem, nutami sensorycznymi i uzyskiem $EY\%$ do natywnego udostępnienia (`Share.share`) w 100% offline.
   - **📊 Statystyki & Trendy (Brew Analytics):** Przełącznik widoków `[ 📋 Sesje ]` / `[ 📊 Statystyki & Trendy ]`. Karty sumarycznego wolumenu (gramatura ziaren/liści, litry przelanej wody, przyjęta kofeina, średnia ocen ★), wykres rozkładu metod parzenia, uśredniony radar sensoryczny SCA (`SensoryRadarChart`), chmura najczęstszych nut smakowych oraz rozkład balansu w filiżance.
4. **🧭 Dial-in Doctor & Kalkulatory Ekstrakcji:**
   - **Kompas Ekstrakcji (Dial-in Doctor):** Diagnozuje błędy smaku (za kwaśna, za gorzka, wodnista, cierpka herbata) i podaje fizyczną receptę na korektę mielenia młynka i temperatury wody. [Wdrożone]
   - **Kalkulator Brew Ratio (BR-KALK-001):** Pełny dwukierunkowy przelicznik proporcji (Doza → Woda oraz Woda → Doza `calculateBrewDose`) z presetami baristycznymi (1:15 intensywna, 1:16.6 SCA standard, 1:17.5 lekka, 1:20 Gongfu, 1:2 espresso, 1:50 herbata) oraz kalkulacją uzysku po absorpcji ciastka ($2.0\,\text{g/g}$). [Wdrożone]
   - **Kalkulator TDS & Extraction Yield (BR-KALK-002):** Weryfikacja czy napar trafia w Złote Okno SCA ($18.0\% - 22.0\%$). [Wdrożone]
5. **💧 Chemia Wody i Mineralizacja (SCA & Barista Hustle — BR-WODA-001 do BR-WODA-005):**
   - 98.5% kawy i 99.5% herbaty to woda. Twardość ogólna (GH) i alkaliczność/bufor (KH) kształtują profil sensoryczny. [Wdrożone]
   - Baza 7 zweryfikowanych profili (Barista Hustle 80/40, SCA Standard, Melbourne Sweet & Soft, Scott Rao Wonder Water, Hendon Hard Water, Herbata Szlachetna, Gongfu Wulong/Puerh). [Wdrożone]
   - Dwutorowy kalkulator: roztwory koncentratów płynnych (1g/L = 2 ppm) oraz bezpośrednie odważanie soli suchych ($\text{NaHCO}_3, \text{MgSO}_4, \text{CaCl}_2$). [Wdrożone]
   - Diagnoza chemiczna wody: wykrywanie wad smaku wynikających ze zbyt twardej lub niebuforowanej wody. [Wdrożone]
   - Poradnik i benchmark powszechnie dostępnych wód butelkowanych (Volvic, Żywiecki Kryształ itp.). [Wdrożone]
6. **⚡ Monitor Kofeiny, Kalkulator Snu & Apple HealthKit (BR-KOF-001 do BR-KOF-004):**
   - Model jedno-kompartmentowej eliminacji kofeiny w organizmie. [Wdrożone]
   - **Personalizacja Metabolizmu Kofeiny (D-02):** Regulacja indywidualnego czasu półtrwania kofeiny $t_{1/2}$ w zakresie 3.0h – 8.0h (domyślnie 5.0h) z zapisem w SQLite. [Wdrożone]
   - **Kalkulator Snu i Godzina Odcięcia (Bedtime Curfew — BR-KOF-003):** Prognoza stężenia kofeiny o wybranej godzinie snu (próg bezpieczny dla fazy głębokiej NREM $\le 25\,\text{mg}$) z persystencją godziny snu. [Wdrożone]
   - **Integracja z Apple HealthKit (BR-KOF-002, Z-096):** Bezpośredni eksport spożytej kofeiny do systemowej bazy Zdrowie (`HKQuantityTypeIdentifierDietaryCaffeine`) z oknem zgody i trybem offline. [Wdrożone]
   - Dobowy bilans kofeiny w relacji do normy EFSA (400 mg). [Wdrożone]
7. **⚙️ Ustawienia, Kopia Zapasowa i Jednostki:**
   - **⚖️ Globalny Przełącznik Jednostek (Metric / Imperial — DEC-21 & BR-JEDN-001):** Płynne przełączanie między systemem metrycznym (°C, g, ml) i imperialnym (°F, oz, fl oz) z zachowaniem wewnętrznej precyzji obliczeniowej i trwałą persystencją w SQLite. [Wdrożone]
   - **📢 Dostępność i Sygnały (VoiceOver & Haptyka — BR-DOST-001, DEC-13):** Konfiguracja komunikatów głosowych czytnika ekranu oraz sygnałów wibracyjnych z natychmiastowym zapisem w SQLite. [Wdrożone]
   - Wybór domyślnego młynka domowego z trwałą synchronizacją w SQLite. [Wdrożone]
   - Eksport i import bazy w formacie JSON oraz eksport do arkuszy CSV (Dziennik i Spiżarnia). [Wdrożone]
   - **💎 Model Monetyzacji & StoreKit 2 (BR-ZAK-001, ZP-08):** Darmowy rdzeń + Napar Pro (Miesięczny 3,99 zł / 0,99 €, Roczny 19,99 zł / 4,99 € z 14-dniowym okresem próbnym Trial, Dożywotni Lifetime 59,99 zł / 14,99 € z Chmurą rodzinną Family Sharing oraz przycisk Przywróć wcześniejsze zakupy z persystencją statusu Pro w SQLite). [Wdrożone]
8. **⌚ Ekosystem Apple: Apple Watch, Live Activity & Widżety (BR-ZEG-001 do BR-ZEG-005):**
   - **Live Activity & Dynamic Island (BR-ZEG-003, BR-ZEG-004):** Natywny mostek ActivityKit (`ActivityAttributes` i `ContentState`) dla ekranu blokady i Dynamic Island (kompaktowy i rozszerzony podgląd z wagą wody, czasem etapu i stanem timera). [Wdrożone]
   - **Apple Watch & Widżety WidgetKit (BR-ZEG-001, BR-ZEG-002, BR-ZEG-005):** Mostek synchronizacji sesji i wzorców haptycznych na nadgarstku oraz kontener danych dla widżetów kofeiny. [W trakcie wdrażania]

---

## 🧪 Wzorcowe Receptury w Bazie (Master Recipes)

Aplikacja zawiera **24 fabryczne, zweryfikowane receptury specialty** dla kawy i herbaty rzemieślniczej:

### ☕ Kawa Specialty (14 receptur)
- **V60 — Metoda 4:6** (Tetsu Kasuya, Mistrz Świata Brewers Cup 2016)
- **V60 — Single Cup Technique** (James Hoffmann)
- **AeroPress — Inverted Champion** (World AeroPress Championship)
- **AeroPress — Klasyk Tima Wendelboe** (Tim Wendelboe, World Barista Champion)
- **AeroPress — Koncentrat Espresso-Style** (Fellow Prismo)
- **Hario Switch — Hybryda Kasuya (God/Devil)** (Imersja + Perkolacja)
- **Origami Dripper — Maksymalna Słodycz** (Du Jianing, World Brewers Cup 2019)
- **Clever Dripper — Czysta Imersja** (Water-First Technique)
- **Chemex — Czysty i Soczysty** (Klasyczny przelew 30g / 500g)
- **Kalita Wave 185 — Trzy Zalania** (George Howell Coffee)
- **French Press — Czysty Napar** (James Hoffmann Technique)
- **Espresso — Specialty Double Shot (1:2)** (WBC Standard Protocol)
- **Espresso — Turbo Shot 1:3** (Prof. Christopher Hendon & Barista Hustle)
- **Cupping — Standard SCA Protocol** (Specialty Coffee Association)

### 🍃 Herbata Rzemieślnicza (10 receptur)
- **Gongfu Cha — Wulong Skalny Da Hong Pao** (Tradycja Wuyi Shan)
- **Gongfu Cha — Sheng Puerh (Młody)** (Tradycja Yunnan)
- **Dong Ding Oolong — Mroźny Szczyt** (Tradycja Nantou, Taiwan Gongfu)
- **Tie Guan Yin — Żelazna Bogini Miłosierdzia** (Anxi Gongfu)
- **Gyokuro Uji — Kropla Rosy (Shizuku-cha)** (Rytuał Kyusu, 60°C)
- **Matcha Ceremonialna — Ubijanie Usucha** (Tradycja Urasenke, Chasen)
- **Sencha Japońska — Rytuał Kyusu** (Tradycyjne igły parowane)
- **Hojicha — Prażone Liście i Łodyżki** (Kyoto Roast)
- **Biała Herbata — Pai Mu Tan (Biała Piwonia)** (Fujian Artisan)
- **Masala Chai — Autentyczny Dekokt Korzenny** (Tradycja Dhaba Punjab)

---

## 🛠️ Uruchomienie i Testy

Wymagane środowisko: Node.js 20+ oraz npm.

```bash
# Instalacja zależności
npm install

# Uruchomienie weryfikacji typów TypeScript
npm run typecheck

# Uruchomienie testów jednostkowych i integracyjnych Jest
npm test

# Pełna weryfikacja projektu (CI)
npm run verify

# Uruchomienie aplikacji w środowisku Expo
npm run start
```

---

## 📂 Architektura Kodu

```text
napar/
├── app/                        # Ekrany Expo Router (file-based routing)
│   ├── _layout.tsx             # Root layout z BrewProvider i SafeAreaProvider
│   ├── settings.tsx            # Ustawienia, Kopia JSON/CSV, Model Pro Apps4Brew
│   ├── gongfu.tsx              # Dedykowany wielonaparowy tracker Gongfu Cha
│   ├── recipe-builder.tsx      # Kreator i edytor receptur autorskich z klonowaniem
│   └── (tabs)/
│       ├── _layout.tsx         # Dolny pasek 5 zakładek
│       ├── index.tsx           # Asystent Parzenia (Active Brew Assistant, QR, Młynek)
│       ├── beans.tsx           # Spiżarnia Ziaren i Liści (Resting Window, Edycja)
│       ├── journal.tsx         # Dziennik Degustacji, Oceny, Analityka i Parz Ponownie
│       ├── dialin.tsx          # Dial-in Doctor, Kalkulatory Ratio, TDS/EY i Chemia Wody
│       └── caffeine.tsx        # Monitor Kofeiny, Wykres Kinetyki i Kalkulator Snu
├── src/
│   └── core/                   # Czysta logika biznesowa i persystencja
│       ├── domain-rules.ts     # Deterministyczne reguły RD-01…RD-30
│       ├── recipes-data.ts     # 24 wzorcowe receptury specialty i herbaty
│       ├── knowledge-data.ts   # Kompendium wiedzy o odmianach, obróbkach, terroir i herbatach
│       ├── water-chemistry.ts  # Profile wody Barista Hustle / SCA, kalkulator mineralizacji
│       ├── cost-calculator.ts  # Ekonomia rzemiosła: kalkulator kosztów parzenia vs kawiarnia
│       ├── timer-audio.ts      # Dźwięki minutnika: dzwonek akustyczny A4 440Hz i haptyka
│       ├── backup.ts           # Apps4Brew SEC-09: 10 rotacyjnych kopii JSON i safetyBackup
│       ├── db-path.ts          # Zabezpieczenie ścieżki bazy SQLite (/Library/SQLite)
│       ├── QrScannerModal.tsx  # Natywny skaner kodów QR receptur aparatem (expo-camera)
│       ├── database-schema.ts  # DDL i schemat SQLite
│       ├── database.ts         # Klient expo-sqlite, repozytoria i licencja Pro
│       ├── grinder-converter.ts# Baza modeli młynków i konwersja mikronów
│       ├── recipe-share.ts     # Kodowanie receptur QR SVG i Deep Links
│       ├── unit-converter.ts   # Dwukierunkowa konwersja jednostek Metric/Imperial
│       ├── announce.ts         # Asystujące komunikaty głosowe VoiceOver i dostępność
│       ├── i18n.tsx            # Pełne wsparcie dwujęzyczne PL/EN (338 symetrycznych kluczy)
│       ├── timer-engine.ts     # Maszyna stanów stopera i haptyka
│       ├── brew-context.tsx    # Główny React Context aktywnej sesji
│       ├── gongfu-session.ts   # Matematyka i model kofeiny naparów Gongfu Cha
│       ├── flavor-wheel-data.ts# Taksonomia koła smaków SCA (8 kategorii, 40 deskryptorów)
│       ├── flavor-wheel-picker.tsx # Interaktywny selektor koła smaków
│       ├── radar-chart.tsx     # Wektorowy radar sensoryczny SCA (SVG)
│       ├── caffeine-chart.tsx  # Wektorowy wykres kinetyki kofeiny ze strefą snu
│       ├── qr-code.tsx         # Generator kodów QR SVG
│       ├── confirm.ts          # Zabezpieczenia sesji parzenia przed przerwaniem
│       ├── theme.ts            # Tokeny stylistyczne (Apps4Brew artisanal)
│       └── __tests__/          # 37 zestawów testowych (339 testów, mutacje i PBT)
├── scripts/
│   └── check-i18n.mjs          # Bramka CI weryfikująca 100% symetrii PL/EN
└── napar_brd/                  # Pełna dokumentacja wymagań biznesowych BRD 0.1
```

---

## 📄 Licencja

GPLv3 / Open Core — tworzone z pasją w duchu rzemiosła specialty.

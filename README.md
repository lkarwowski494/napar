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
   - Płynne skalowanie gramatur przy zmianie dozy z zachowaniem właściwych proporcji.
   - Karta degustacyjna po zakończeniu: ocena w gwiazdkach, profil balansu smaku, nuty smakowe, wybór profilu użytej wody, odczyt refractometru TDS.
2. **🫘 Spiżarnia Ziaren i Liści (Inventory / Stash):**
   - Śledzenie świeżości ziaren kawy (okno *Resting Window*: odgazowywanie CO₂, szczyt smaku *Peak*, stabilne okno, dojrzałe ziarna).
   - Dynamiczny ubytek wagi w paczce po każdym parzeniu.
   - Filtrowanie: Wszystkie, Kawa ziarnista, Herbata liściasta, Archiwum.
   - Natychmiastowe przejście do parzenia z wybranej paczki.
3. **📖 Dziennik Degustacji (Brew Journal):**
   - Pełna historia zaparzonych filiżanek z datą, recepturą, parametrami (czas, doza, woda, temperatura, użyty profil wody).
   - Obliczone wskaźniki ekstrakcji ($EY\%$) i szacowana zawartość kofeiny (mg).
   - Balans smaku, notatki degustacyjne, plakietka profilu wody i oceny.
4. **🧭 Dial-in Doctor & Kalkulatory:**
   - **Kompas Ekstrakcji (Dial-in Doctor):** Diagnozuje błędy smaku (za kwaśna, za gorzka, wodnista, cierpka herbata) i podaje fizyczną receptę na korektę mielenia młynka i temperatury wody.
   - **Kalkulator Brew Ratio:** Dwukierunkowy przelicznik proporcji i szacowanego uzysku w filiżance z uwzględnieniem absorpcji $2.0\,\text{g/g}$.
   - **Kalkulator TDS & Extraction Yield:** Weryfikacja czy napar trafia w Złote Okno SCA ($18.0\% - 22.0\%$).
5. **💧 Chemia Wody i Mineralizacja (SCA & Barista Hustle):**
   - 98.5% kawy i 99.5% herbaty to woda. Twardość ogólna (GH) i alkaliczność/bufor (KH) kształtują profil sensoryczny.
   - Baza 7 zweryfikowanych profili (Barista Hustle 80/40, SCA Standard, Melbourne Sweet & Soft, Scott Rao Wonder Water, Hendon Hard Water, Herbata Szlachetna, Gongfu Wulong/Puerh).
   - Dwutorowy kalkulator: roztwory koncentratów płynnych (1g/L = 2 ppm) oraz bezpośrednie odważanie soli suchych ($\text{NaHCO}_3, \text{MgSO}_4, \text{CaCl}_2$).
   - Diagnoza chemiczna wody: wykrywanie wad smaku wynikających ze zbyt twardej lub niebuforowanej wody.
   - Poradnik i benchmark powszechnie dostępnych wód butelkowanych (Volvic, Żywiecki Kryształ itp.).
6. **⚡ Monitor Kofeiny i Kalkulator Snu:**
   - Model jedno-kompartmentowej eliminacji kofeiny w organizmie ($t_{1/2} = 5.0\,\text{h}$).
   - Bieżące stężenie aktywnej kofeiny w krwiobiegu w czasie rzeczywistym.
   - Dobowy bilans kofeiny w relacji do normy EFSA (400 mg).
   - **Bedtime Sleep Curfew:** Prognoza stężenia kofeiny o wybranej godzinie snu (próg bezpieczny dla fazy głębokiej NREM $\le 25\,\text{mg}$) oraz wyznaczenie godziny ostatniej dopuszczalnej filiżanki.
7. **⚙️ Ustawienia, Kopia Zapasowa i Pro:**
   - Eksport i import bazy w formacie JSON.
   - Model uczciwej monetyzacji (Darmowy rdzeń + Pro: 3,99 zł/mies., 19,99 zł/rok z 14-dniowym okresem próbnym, 59,99 zł Lifetime + Chmura rodzinna).
   - Przywracanie zakupów StoreKit.

---

## 🧪 Wzorcowe Receptury w Bazie (Master Recipes)

Aplikacja zawiera 12 fabrycznych, zweryfikowanych receptur:
- **V60 — Metoda 4:6** (Tetsu Kasuya, Mistrz Świata Brewers Cup 2016)
- **V60 — Single Cup Technique** (James Hoffmann)
- **AeroPress — Mistrzowski Drip** (World AeroPress Championship)
- **AeroPress — Inverted (Odwrócony)**
- **Chemex — Klasyczny Przelew Trzyczęściowy**
- **French Press — Technika Jamesa Hoffmanna**
- **Kalita Wave 185 — Trzy Zalania** (George Howell Coffee)
- **Espresso — Specialty Double Shot (1:2)** (WBC Protocol)
- **Cupping — Standard SCA Protocol** (Specialty Coffee Association)
- **Gongfu Cha — Da Hong Pao (Wielka Czerwona Szata)** (Wuyi Oolong)
- **Gongfu Cha — Sheng Puerh (Raw Puerh)** (Yunnan)
- **Sencha Japońska — Rytuał Kyusu** & **Biała Herbata Pai Mu Tan**

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
│   ├── settings.tsx            # Ustawienia, Kopia JSON, Model Pro Apps4Brew
│   └── (tabs)/
│       ├── _layout.tsx         # Dolny pasek 5 zakładek
│       ├── index.tsx           # Asystent Parzenia (Active Brew Assistant)
│       ├── beans.tsx           # Spiżarnia Ziaren i Liści (Resting Window)
│       ├── journal.tsx         # Dziennik Degustacji i Oceny
│       ├── dialin.tsx          # Dial-in Doctor & Kalkulatory Ratio / TDS
│       └── caffeine.tsx        # Monitor Kofeiny i Kalkulator Snu
├── src/
│   └── core/                   # Czysta logika biznesowa i persystencja
│       ├── domain-rules.ts     # Deterministyczne reguły RD-01…RD-30
│       ├── recipes-data.ts     # 12 wzorcowych receptur
│       ├── database-schema.ts  # DDL i schemat SQLite
│       ├── database.ts         # Klient expo-sqlite i repozytoria
│       ├── timer-engine.ts     # Maszyna stanów stopera i haptyka
│       ├── brew-context.tsx    # Główny React Context aktywnej sesji
│       ├── theme.ts            # Tokeny stylistyczne (Apps4Brew artisanal)
│       └── __tests__/          # Zestaw 33 testów jednostkowych i integracyjnych
└── napar_brd/                  # Pełna dokumentacja wymagań biznesowych BRD 0.1
```

---

## 📄 Licencja

GPLv3 / Open Core — tworzone z pasją w duchu rzemiosła specialty.

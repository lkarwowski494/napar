# Napar (Steepwise) — Kitchen-Proof UX & Model Monetyzacji „Cheaper than Espresso”

## 1. Wstęp i Cel Architektoniczny
Aplikacja **Napar (Steepwise)** została zaprojektowana i zoptymalizowana pod kątem standardów **Apps4Brew Studio**:
- Oceny 4.9★ w App Store i Google Play.
- 100% Offline-First (wbudowana baza SQLite w bezpiecznym katalogu `/Library/SQLite`, zero trackerów telemetrycznych).
- Ergonomia kuchenna („Kitchen-Proof” & „Dirty Thumb” controls $\ge 48\text{–}56\,\text{pt}$).
- Model biznesowy „Taniej niż espresso” ($0.99 / $4.99 / $14.99) z bezwzględną gwarancją darmowej historii Read-Only.

---

## 2. Model Monetyzacji „Cheaper than Espresso”

### Zasada Braku Sztucznego Podziału na Free i Pro
- W aplikacji **nie ma** sztucznie zablokowanych funkcji rzemieślniczych ani etykietek „tylko w PRO”.
- W okresie próbnym (**Free Trial: 7 dni lub 3 pełne parzenia**) użytkownik ma dostęp do **100% możliwości aplikacji**:
  - Wszystkie nastawy młynków (Comandante, Timemore, 1Zpresso, Fellow Ode, Baratza, Wilfa, Kinu, Mazzer, Mahlkönig).
  - Pełna chemia i remineralizacja wody (Barista Hustle 80/40, SCA Standard, Melbourne Soft, Rao Wonder Water, Hendrick Hendon).
  - Wymiana receptur przez kody QR i deep linki `napar://`.
  - Dial-in Doctor (1-tap autodiagnoza i korekta mielenia/temperatury).
  - Zaawansowany wykres sensoryki SCA (Spider Graph) i hierarchiczne koło smaków.
  - Monitor kinetyki kofeiny z kalkulatorem półtrwania ($t_{1/2}$) i progiem snu NREM.

### Polityka Cenowa
- **$0.99 USD / miesiąc** (~4,49 zł) — mikro-subskrypcja na start.
- **$4.99 USD / rok** (~22,99 zł) — **główna rekomendowana oferta** (mniej niż 2 zł na miesiąc!).
- **$14.99 USD Lifetime** (~69,99 zł) — zakup jednorazowy raz na zawsze, z obsługą chmury rodzinnej (Family Sharing).

### Zasada Żelaznej Ochrony Ocen 4.9★: Historia Zawsze Read-Only
- Po zakończeniu okresu próbnego i braku aktywnej subskrypcji aplikacja **odcina wyłącznie funkcje tworzenia i aktywnego działania**:
  - Rozpoczęcie nowej sesji parzenia (`[ ROZPOCZNIJ PARZENIE ]` natychmiast wyświetla modal `Apps4BrewPassModal`).
  - Tworzenie nowych receptur autorskich.
- **Dziennik Parzeń i Notatki Degustacyjne pozostają ZAWSZE w 100% bezpłatne i czytelne (Read-Only):**
  - Użytkownik nigdy nie traci dostępu do swoich archiwalnych parzeń, ocen, parametrów mielenia i ulubionych profili smakowych.
  - Eliminuje to negatywne recenzje („twórcy zabrali moje notatki po trialu”).

---

## 3. Ergonomia Kuchenna: Kitchen-Proof & Progressive Disclosure

### 1-Tap Szybki Start (< 15 sekund)
Główny ekran parzenia (`app/(tabs)/index.tsx`) został zdekomponowany na wyspecjalizowane, czytelne moduły:
1. `BrewHeader`:
   - Wyeksponowana na samej górze **pigułka nastawy młynka** (`Comandante C40: 22 kliki`), widoczna przed każdym parzeniem.
   - Pigułki receptury i spiżarni ziaren.
   - Pigułka offline QR Share & linków.
   - 1-Click chipy ulubionych receptur.
2. `BrewQuickPrepCard`:
   - Karta „Do drippera na wagę”.
   - Duże przyciski stepperów dozy kawy (`−` / `+`, wysokość 44–52pt).
   - Wskaźnik całkowitej wody oraz temperatury.
   - Batch scaling dla 1–4 osób (`1 os.`, `2 os.`, `3 os.`, `4 os.`) z automatycznym przeliczaniem klików mielenia (`+2 kliki grubiej`).
3. `BrewActiveFocusTimer`:
   - **Widoczność z 1 metra**: gigantyczny stoper cyfrowy (64pt tabular-nums).
   - Wskaźnik aktualnego etapu z celem wody i sugerowanym przepływem `~g/s`.
   - Pigułki natychmiastowej korekty czasu w locie: `-10s` i `+10s`.
   - Wielkie kontrolki dotykowe brudnego kciuka: `PAUZA`, `DALEJ ▶`, `◀ WSTECZ`, `RESET`, `WZNÓW`, `ZAPISZ` (wysokość $\ge 52\,\text{pt}$).
4. `BrewProAccordion`:
   - Schowany pod eleganckim, zwijanym panelem („Progressive Disclosure”).
   - Nie przytłacza początkującego użytkownika.
   - Dla zaawansowanych rzemieślników: mineralizacja wody Barista Hustle, kalkulator soli, refractometr TDS (%) oraz radar sensoryczny SCA.
5. `BrewFinishModal`:
   - Kompleksowy arkusz po zakończeniu zalewania: ocena gwiazdkowa (★), balans smaku (`Zbalansowana`, `Za kwaśna`, `Za gorzka`, `Wodnista`).
   - **Dial-in Doctor**: 1-klikowa diagnoza i konkretna recepta (np. *„Za kwaśna? Zmiel drobniej o 2 kliki lub podnieś temp o +2°C”*).
   - Wykres radarowy SCA Spider Graph & Koło Smaków.
   - Karta **Ekonomii Rzemiosła** (koszt naparu domowego vs 18 zł w kawiarni specialty).

---

## 4. Testy i Jakość Inżynieryjna (Zero-Tolerance Forensic Fix)
- **Pokrycie testowe:** $\ge 97\%$ we wszystkich modułach (44 zestawy testowe, 379 testów jednostkowych i integracyjnych — 100% pass).
- **i18n:** Pełna symetria 362 kluczy w językach PL i EN (`npm run check:i18n`).
- **TypeScript:** 100% czystości typu w trybie ścisłym (`npm run typecheck`).
- **Anty-exploit:** `restorePurchases()` weryfikuje faktyczny dowód zakupu w bazie SQLite (`has_verified_purchase`), uniemożliwiając darmowe rozdawnictwo licencji Lifetime.
- **Audio Chime:** Generowanie pełnego sygnału akustycznego RIFF WAV PCM (880 Hz dzwonek kuchenny z harmoniczną 1760 Hz i zanikiem wykładniczym) zamiast 44-bajtowej pustej atrapy.
- **Bezpieczeństwo danych:** Kopia bezpieczeństwa przed importem (`safetyBackup`) oraz automatyczna rotacja 10 kopii zapasowych w bezpiecznym katalogu bazy danych (`expo-file-system/legacy`).
- **Unit Converter:** Globalna integracja przeliczników metrycznych i imperialnych (`formatDoseWeight`, `formatWaterWeight`, `formatTemperature`) w UI (Spiżarnia, Stoper, Karty Parzenia, Receptury, Ustawienia).


# **Napar — Wymagania biznesowe (BRD), wersja robocza 0.1, 15.10.2026**

**Status:** wersja robocza do akceptacji właściciela. Sprawy produktowe czekają na Twoje decyzje (sekcja 4, DEC-01…DEC-40). Sprawy merytoryczne (fizyka ekstrakcji, chemia wody, koło sensoryczne SCA/WCE, metabolizm kofeiny) rozstrzyga badacz według hierarchii źródeł. Każdą taką decyzję możesz zawetować.  
**Autor:** analityk biznesowy (koordynujący) studia Apps4Brew. Części A–D napisali analitycy produktu i badacz dziedzinowy.

---

## **1. Jak czytać ten dokument**

### **Części dokumentu**

| Plik | Rozdziały | Zawartość |
| :--- | :--- | :--- |
| **00-streszczenie** (ten plik) | — | Streszczenie dla właściciela, warianty pierwszej wersji, jedna lista decyzji (DEC-01…DEC-40), warunki wstępne, spis treści. |
| **00b-decyzje** | — | Zbiorcza lista decyzji produktowych i pytań otwartych DEC-01…DEC-40 z rekomendacjami analityka. |
| **00c-errata** | — | Sprzeczności dziedzinowe i errata: kawa vs herbata, ramy medyczne kofeiny, jednostki TDS/EY. |
| **A** | 1–6, 13, 15 | Wizja i 16 zasad produktu (ZP-01…16), problem i dowody rynkowe, persony P1–P6 i sytuacje SYT-01…15, analiza rynku i konkurencji, model przychodu, tabela zakresu Z-001…Z-180 z etapami, nakład pracy agentów, KPI bez śledzenia, marketing i ASO. |
| **B** | 7 (narzędzia) | Wymagania funkcjonalne narzędzi (BR-PARZ, BR-MAG, BR-DZIEN, BR-KOF, BR-ZEG, BR-KALK): asystent i timery parzenia, magazyn ziaren i liści, dziennik sensoryczny, estymator kofeiny i okna snu, Apple Watch, Live Activity i widżety, kalkulatory ekstrakcji, dane, zakupy, dostępność. |
| **C** | 7 (nauka), 8, 8.P | Moduł nauki i sensoryki: Dial-in Doctor (kompas ekstrakcji), koło smaków SCA/WCE. Reguły dziedzinowe RD-01…RD-30 (Brew Ratio, TDS, Extraction Yield, absorpcja wody, parametry wody GH/KH, farmakokinetyka kofeiny, parzenie Gongfu Cha) wraz z kompletnymi wektorami testowymi. Proces weryfikacji treści i rejestr decyzji badacza D-01…D-20. |
| **D** | 9–12, 14, 16 | Wymagania niefunkcjonalne (NFR-OFF, NFR-I18N, NFR-DOST, NFR-WYD, NFR-BEZP, NFR-ZEG itd.), zgodność z wytycznymi Apple App Store (3.1.2, 4.3(a)/(b), 5.1.1, HealthKit), architektura techniczna offline-first, schemat bazy SQLite/SwiftData, rejestr 40 ryzyk (RYZ-01…RYZ-40) oraz warunki wdrożeniowe. |

### **Oznaczenia identyfikatorów**
* **BR-xxx-nnn**: wymaganie funkcjonalne (np. `BR-PARZ-001`, `BR-KOF-005`). Każde posiada mierzalne kryteria akceptacji, personę, priorytet (**MUST / SHOULD / COULD**) i etap (**MVP / 1.1 / 1.2 / 2.x / badanie / nigdy**).
* **NFR-xxx-nnn**: wymaganie niefunkcjonalne (kody: `OFF` – offline, `I18N` – lokalizacja, `DOST` – dostępność VoiceOver/Dynamic Type, `WYG` – UI/UX, `WYD` – wydajność, `DANE` – integralność, `BEZP` – bezpieczeństwo/prywatność, `ZEG` – zegarek, `TEST` – pokrycie testami).
* **RD-nn**: reguła dziedzinowa – deterministyczny wzór matematyczny, fizykochemiczny lub standard branżowy z wektorami testowymi.
* **RYZ-nn**: ryzyko projektowe z oceną prawdopodobieństwa, wpływu i planem przeciwdziałania.
* **DEC-nn**: decyzja produktowa lub biznesowa dla właściciela.
* **Z-nnn**: wiersz tabeli zakresu funkcjonalnego.

---

## **2. Streszczenie dla właściciela**

### **Co to jest Napar**
**Napar** to kieszonkowy asystent i dziennik dla miłośników kawy specialty oraz herbaty rzemieślniczej. Łączy precyzyjny, wieloetapowy stoper parzenia (drip V60, Chemex, Aeropress, French Press, espresso, Gongfu Cha) z cyfrowym magazynem ziaren/liści, notatnikiem sensorycznym (koło smaków SCA), deterministycznym doradcą mielenia i ekstrakcji (**Dial-in Doctor**) oraz zaawansowanym monitorem kofeiny sprzężonym z Apple Health i kalkulatorem wpływu na sen.

Aplikacja działa **całkowicie offline, bez rejestracji konta, bez serwerów zewnętrznych i bez reklam**, w 35 językach, z pełnym wsparciem dla Apple Watch, Live Activity i Dynamic Island. Zgodnie z etosem Apps4Brew kosztuje **mniej niż jedno espresso miesięcznie** (0,99 €) albo dostępna jest w jednorazowym zakupie dożywotnim (14,99 €).

### **Dla kogo (Persony główne)**
* **Michał (30 lat, programista):** codziennie rano parzy kawę w dripperze V60 lub Aeropressie; potrzebuje dokładnego stopera z sygnalizacją kolejnych zalań na Apple Watch (nie chce brać mokrymi rękami telefonu do ręki) oraz możliwości zapisania profilu mielenia pod konkretną paczkę ziaren.
* **Karolina (27 lat, projektantka):** pasjonatka herbaty Gongfu Cha; wykonuje po 6–10 krótkich infuzji tych samych liści oolong lub puerh; potrzebuje stopera z pamięcią numeru parzenia i automatycznym wydłużaniem czasu ekstrakcji.
* **Piotr (42 lata, manager):** pije 3–4 napoje kofeinowe dziennie; zależy mu na głębokim śnie, dlatego potrzebuje precyzyjnego kalkulatora metabolizmu kofeiny, który podpowie mu, kiedy wypić ostatnią filiżankę, by stężenie kofeiny przed snem spadło poniżej progu zaburzającego fazę głęboką (NREM).
* **Ewa (35 lat, osoba niewidoma):** parzy herbatę i kawę przelewową przy użyciu wagi dźwiękowej; potrzebuje perfekcyjnego wsparcia VoiceOver i wyrazistych sygnałów haptycznych/akustycznych o upływie etapów parzenia.

### **Czym wygrywa Napar (Przewagi rynkowe poparte danymi)**
1. **Brak logowania i natychmiastowy start:** Rynek zalany jest aplikacjami żądającymi rejestracji konta, zgód marketingowych i profilowania przed pierwszym uruchomieniem timera. W Naparze pierwsze parzenie uruchamia się jednym stuknięciem w ciągu 2 sekund od instalacji.
2. **Kawa i Herbata w jednym narzędziu:** Istniejące aplikacje traktują herbatę po macoszemu lub są dedykowane wyłącznie jednemu napojowi. Napar łączy obie kultury parzenia na wspólnym, elastycznym silniku infuzji, eliminując ryzyko odrzucenia przez Apple za tworzenie klonów (wytyczna 4.3(a)).
3. **Prawdziwe wsparcie „Ręce na czajniku”:** Podczas zalania użytkownik trzyma w rękach czajnik typu gooseneck lub gaiwan. Dzięki aplikacji na Apple Watch (wibracja haptyczna 3 sekundy przed kolejnym zalaniem), Live Activity na ekranie blokady i Dynamic Island telefon może leżeć bezpiecznie z dala od wrzątku.
4. **Dial-in Doctor (algorytm zamiast halucynacji AI):** Konkurencja próbuje integrować czaty LLM, które wymyślają sprzeczne porady baristyczne. Napar stosuje deterministyczny, zbadany kompas ekstrakcji oparty na fizyce płynów i chemii związków aromatycznych (zbyt kwaśna -> zwiększ ekstrakcję: drobniejszy przemiał / wyższa temperatura / dłuższy kontakt).
5. **Farmakokinetyczny model kofeiny sprzężony z Apple Health:** Zamiast prymitywnego mnożenia filiżanek, Napar oblicza rzeczywistą dawkę kofeiny na podstawie gramatury, metody parzenia i stopnia ekstrakcji, synchronizuje ją z `Dietary Caffeine` w Apple HealthKit i wykreśla krzywą eliminacji z organizmu ($t_{1/2} \approx 5\,\text{h}$).
6. **Etyka prywatności „Data Not Collected”:** Wszystkie notatki, rejestr ziaren, parametry zdrowotne kofeiny i historia parzeń pozostają wyłącznie na urządzeniu użytkownika i w jego prywatnym iCloud Drive.

### **Model przychodu (Półka Apps4Brew)**
* **Subskrypcja:** 0,99 € miesięcznie / 4,99 € rocznie (w Polsce: 3,99 zł miesięcznie / 19,99 zł rocznie).
* **Zakup dożywotni (Lifetime):** 14,99 € jednorazowo (w Polsce: 59,99 zł).
* **Darmowy rdzeń (Free Core):** Pełny stoper parzenia, 3 receptury bazowe (V60, Aeropress, Gongfu Cha), podręczny kalkulator ratio oraz rejestr do 3 paczek ziaren.
* **14-dniowy okres próbny (Trial):** Dostęp do pełnej wersji Pro (Dial-in Doctor, nielimitowany magazyn, zaawansowane koło smaków, śledzenie kofeiny i okna snu, synchronizacja Apple Watch).
* **Koszt krańcowy:** 0,00 USD / użytkownika miesięcznie (brak zewnętrznych serwerów, brak chmurowych API).

### **Liczby dokumentu**
* Wymagania funkcjonalne (BR): **156** (MUST: 88, SHOULD: 46, COULD: 22).
* Wymagania niefunkcjonalne (NFR): **82**.
* Reguły dziedzinowe (RD): **30** (z kompletnymi wektorami testowymi).
* Zidentyfikowane ryzyka (RYZ): **40** (wraz ze strategią obrony).
* Decyzje produktowe (DEC): **40**.
* Tabela zakresu (Z): **180** pozycji.

---

## **3. Warianty pierwszej wersji — Decyzja nr 1 (DEC-01)**

| Wariant | Zakres | Liczba BR w MVP | Czas agentów | Kalendarz | Ryzyko 4.3(b) | Rekomendacja |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **(a) Pełne MVP z BRD** | Wszystkie moduły: Kawa, Herbata, Magazyn, Dial-in Doctor, Kofeina, Apple Watch, Live Activity, HealthKit, Kalkulatory. | 114 | 28–36 dni | 3–4 tyg. | Bardzo niskie | Alternatywny |
| **(b+) MVP zbalansowane (Rekomendowane)** | Pełen MUST + 6 kluczowych akceleratorów: wibracja haptyczna Watch, Live Activity, ochrona przed przypadkowym zatrzymaniem timera, kalkulator kofeiny z HealthKit, 14 dni triala, Family Sharing. Magazyn uproszczony do 20 ziaren, Dial-in w wersji podstawowej. | **94** | **20–26 dni** | **2–3 tyg.** | **Niskie** | **GŁÓWNA REKOMENDACJA** |
| **(b) MVP minimalne (Tylko MUST)** | Czysty stoper, manualne receptury, podstawowy kalkulator proporcji, brak integracji Watch i HealthKit. | 88 | 16–22 dni | 2 tyg. | Średnie | Odradzany (słabsza retencja) |
| **(c) (b+) + Wagi Bluetooth** | Zakres (b+) rozszerzony o bezpośrednią komunikację CoreBluetooth z wagami (Acaia, Felicita, Timemore). | 108 | 34–45 dni | 5–6 tyg. | Bardzo niskie | Przesunąć do 1.2 (ryzyko braku sprzętu) |
| **(d) Tylko Kawa (bez herbaty)** | Wycięcie modułu herbaty. | 72 | 14–18 dni | 1.5–2 tyg. | **Wysokie** (zarzut prostego stopera) | **Zdecydowanie odradzany** |

---

## **4. Warunki wstępne po stronie Właściciela**

1. **Konto Apple Developer:** Aktywny program organizacji lub indywidualny z opłaconym rocznym dostępem (99 USD).
2. **Uprawnienia HealthKit:** Aktywacja capability `HealthKit` w profilu provisioning z deklaracją zapisu `HKQuantityTypeIdentifierDietaryCaffeine`.
3. **Sprzęt testowy:**
   - iPhone z iOS 18+ (testy Live Activity i Dynamic Island).
   - Apple Watch z watchOS 11+ (weryfikacja działania w tle i haptyki timera).
   - Czajnik i dripper do weryfikacji manualnej w realnych warunkach kuchennych.
4. **Zgoda na model cenowy Apps4Brew:** Akceptacja siatki cen 0,99 € / 4,99 € / 14,99 € (w Polsce 3,99 zł / 19,99 zł / 59,99 zł).

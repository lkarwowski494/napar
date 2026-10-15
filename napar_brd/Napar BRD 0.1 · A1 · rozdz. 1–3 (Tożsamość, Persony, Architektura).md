# **Napar BRD 0.1 — Część A1: Wizja, zasady produktu, problem i persony (Rozdziały 1–3)**

---

## **1. Wizja i obietnica produktu**

### **1.1 Wizja (jeden akapit)**
Napar to intymny, cyfrowy przewodnik po sztuce parzenia kawy i herbaty, który zdejmuje z barków użytkownika stres związany z pilnowaniem gramatur, temperatur i interwałów czasowych. Prowadzi za rękę przez kolejne fazy ekstrakcji na ekranie telefonu, zablokowanym wyświetlaczu (Live Activity) i nadgarstku (Apple Watch), uczy świadomego rozpoznawania smaków w oparciu o profesjonalne koło sensoryczne, diagnozuje błędy mielenia deterministycznym kompasem ekstrakcji, a pod koniec dnia dba o spokojny sen użytkownika poprzez biochemiczny rejestr kofeiny sprzężony z Apple Health. Wszystko to w minimalistycznej, wyciszającej oprawie, bez internetu, bez rejestracji i bez reklam.

### **1.2 Obietnica marki (Slogan)**
> **„Parz uważnie, smakuj głęboko — Twoja codzienna chwila rzemiosła.”**

---

### **1.3 Szesnaście Zasad Produktu (ZP-01…ZP-16)**

Każde wymaganie funkcjonalne i techniczne w całym projekcie musi być w 100% zgodne z poniższymi regułami.

| # | Zasada | Uzasadnienie i źródło |
| :--- | :--- | :--- |
| **ZP-01** | **Niezawodność timera ponad liczbę funkcji.** | Timer i haptyka nie mogą spóźnić się o ułamek sekundy ani zawiesić przy wygaszeniu ekranu. Zepsuty czas to przeparzona, gorzka kawa lub zniszczona herbata. |
| **ZP-02** | **Bez konta i bez logowania.** | Zero barier wejścia. Pierwszy ekran po instalacji to gotowy do użycia stoper parzenia. Zero formularzy, zero e-maili. |
| **ZP-03** | **Zero serwerów i zero AI w chmurze.** | Wszystkie algorytmy (w tym Dial-in Doctor) działają deterministycznie na urządzeniu. Koszt krańcowy = 0. Aplikacja działa w schronisku górskim bez zasięgu. |
| **ZP-04** | **Bez reklam i bez banerów.** | Aplikacja rzemieślnicza to przestrzeń spokoju i skupienia. Reklamy niszczą estetykę i budzą irytację użytkownika. |
| **ZP-05** | **Determinizm zamiast generatywnego AI.** | Porady baristyczne i sensoryczne wynikają ze zweryfikowanych reguł chemii i fizyki płynów, a nie z halucynacji LLM. |
| **ZP-06** | **Dane użytkownika nigdy nie giną.** | Magazyn ziaren, notatki degustacyjne i historia parzeń są automatycznie zabezpieczane w prywatnym iCloud Drive użytkownika. |
| **ZP-07** | **Kopia zapasowa i eksport zawsze bezpłatne.** | Eksport do otwartego formatu JSON/CSV jest dostępny dla każdego, bez konieczności płacenia subskrypcji (zgodność z Apple 4.10). |
| **ZP-08** | **Uczciwy i przejrzysty model cenowy.** | Brak ukrytych płatności. Darmowy rdzeń pozwala parzyć bezterminowo. Wersja Pro w cenie „tańszej niż espresso” (0,99 € mies. / 14,99 € raz na zawsze). |
| **ZP-09** | **Szacunek dla kultury specialty i autorów.** | Nazwy metod, palarni i receptury mistrzów są prezentowane z należytym uznaniem autorstwa, bez zawłaszczania cudzej twórczości. |
| **ZP-10** | **Prywatność „Data Not Collected”.** | Zero zewnętrznych bibliotek analitycznych (Firebase, Meta, Adjust). Jedyna telemetria to natywne narzędzia Apple Store Connect opt-in. |
| **ZP-11** | **Dostępność jest fundamentem, nie dodatkiem.** | Pełna obsługa VoiceOver, Dynamic Type (skalowanie czcionek dla seniorów), wysoki kontrast i haptyka dla osób niedowidzących. |
| **ZP-12** | **Ścisła zgodność z fizyką i nauką.** | Wzory na Brew Ratio, TDS, Yield i kinetykę kofeiny bazują na literaturze Specialty Coffee Association (SCA), World Coffee Research i EFSA. |
| **ZP-13** | **Spokojny, rzemieślniczy język.** | Interfejs nie krzyczy, nie stosuje mechanizmów uzależniających (brak toxic streaks, agresywnych powiadomień push). |
| **ZP-14** | **Ręce na czajniku (Hands-free brewing).** | Informowanie o kolejnych krokach poprzez subtelną haptykę Apple Watch i czytelne Live Activity, aby użytkownik nie musiał dotykać telefonu mokrymi dłońmi. |
| **ZP-15** | **Przenośność i czysta architektura.** | Modułowy kod Swift/SwiftUI, niezależny od zewnętrznych frameworków, gotowy do współdzielenia z rdzeniem portfolio Apps4Brew. |
| **ZP-16** | **Zero kosztów stałych infrastruktury.** | Żadnych baz danych PostgreSQL w chmurze, żadnych instancji AWS. Projekt ma zerowy koszt utrzymania poza opłatą Apple Developer. |

---

## **2. Problem rynkowy i dowody empiryczne**

Analiza ponad 3 500 recenzji czołowych aplikacji baristycznych i herbacianych w App Store (Filtru, Beanconqueror, Brew Timer, Mister Barista, Acaia, Tea Time) ujawnia krytyczne braki na rynku:

1. **Agresywna i droga monetyzacja:** Aplikacje żądają 30–60 USD rocznie za prosty stoper z bazą danych, co budzi wściekłość użytkowników domowych (*„Płacić 50 dolarów rocznie za stoper do kawy to absurd”*).
2. **Zawodna obsługa zegarka Apple Watch:** Recenzje wskazują na nagminne usypianie aplikacji na zegarku w trakcie parzenia, gubienie sekund i brak wibracji haptycznych (*„Aplikacja na zegarku zamyka się dokładnie wtedy, gdy leję wodę”*).
3. **Sztuczny podział na kawę i herbatę:** Miłośnicy parzenia rzemieślniczego często piją rano kawę przelewową, a po południu herbatę Gongfu Cha. Zmuszeni są do instalowania dwóch niespójnych aplikacji.
4. **Ignorowanie wpływu kofeiny na organizm:** Żadna z wiodących aplikacji baristycznych nie łączy parzenia z kalkulatorem stężenia kofeiny w czasie i Apple HealthKit, pozostawiając użytkownika w niepewności co do jakości snu.

---

## **3. Persony użytkowników i sytuacje użycia**

### **Persony szczegółowe**

* **P1: Michał (30 lat, programista, domowy barista)**
  - *Profil:* Posiada młynek Comandante C40, dripper Hario V60 i wagę cyfrową. Kupuje ziarna single-origin z lokalnych palarni.
  - *Ból:* Irytuje go konieczność pamiętania receptury i odliczania w pamięci sekund do kolejnego zalania. Chce powtarzalności.
  - *Cel:* Chce włączyć recepturę jednym kliknięciem, widzieć fazę na Apple Watch i zapisać ocenę filiżanki w 5 sekund.

* **P2: Karolina (27 lat, architekt wnętrz, pasjonatka herbaty)**
  - *Profil:* Praktykuje chińskie parzenie Gongfu Cha w czajniczku Yixing i gaiwanie. Parzy herbaty białe, wulongi i pu-erh.
  - *Ból:* Każde kolejne parzenie tych samych liści wymaga dłuższego czasu o 5–10 sekund. Zwykłe stopery kuchenne nie pamiętają numeru zalania.
  - *Cel:* Automatyczny stoper wieloetapowy z licznikiem infuzji i bazą ulubionych herbat.

* **P3: Piotr (42 lata, manager w korporacji, entuzjasta longevity)**
  - *Profil:* Dba o parametry zdrowotne, mierzy sen za pomocą Apple Watch i pierścienia Oura. Pije 2 kawy specialty i 1 herbatę matcha.
  - *Ból:* Zdarza mu się wypić kawę zbyt późno, co drastycznie skraca fazę snu głębokiego (Deep Sleep).
  - *Cel:* Przejrzysta informacja w aplikacji: *„Wypita o 15:30 podwójna Etiopia obniży poziom kofeiny poniżej progu snu dopiero o 23:45”* + automatyczny eksport do Apple Health.

* **P4: Ewa (35 lat, tłumaczka, osoba niewidoma)**
  - *Profil:* Używa iPhone'a wyłącznie przez VoiceOver. Kocha dobrą kawę z ekspresu przelewowego Moccamaster i Aeropressu.
  - *Ból:* Aplikacje z zegarami graficznymi są całkowicie nieczytelne dla czytnika ekranu.
  - *Cel:* Pełna dostępność semantyczna, komunikaty głosowe o etapach parzenia i potwierdzenia haptyczne.

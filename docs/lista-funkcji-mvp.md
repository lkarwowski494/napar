# Lista funkcji — po korektach właściciela (22.10.2026)

Numery zachowane z poprzedniej listy. Status: **MVP** (pierwsza wersja), **1.1** (po premierze), **później** (poza planem). Skreślone: 3, 5, 25.

**Korekty właściciela:** 9, 12, 22, 31, 32 → MVP. 34 → jak w modelu „piekarza”. 35 → jak w „treningu”.

## Ziarno i liść
1. Kompendium odmian, procesów i regionów, bez nazw marek — MVP
2. Zapas paczek: palarnia, data palenia, waga, cena, ubytek, ostrzeżenie przy pustej paczce — MVP
4. Okna świeżości (odpoczynek, szczyt, starzenie) — MVP
6. Zapas herbaty: rok zbioru, cena za gram — 1.1

## Woda
7. Profile wody predefiniowane, bez nazw marek wód butelkowanych — MVP
8. Kalkulator mineralizacji z koncentratów i soli — MVP
9. Własna woda: wpis twardości i zasadowości z raportu wodociągów — MVP *(korekta)*

## Młynek i dozowanie
10. Młynki z przelicznikiem kliknięć, dane zweryfikowane — MVP
11. Własny młynek i własna metoda — MVP
12. Kalibracja przelicznika kliknięć z własnych parzeń — MVP *(korekta)*
13. Kalkulator proporcji w obie strony — MVP
14. Zakres wagi bez sztywnego minimum — MVP
15. Skalowanie na porcje — MVP

## Parzenie
16. Kroki metod: V60, Chemex, French press, AeroPress (obie metody), espresso, Kalita — MVP
17. Sesja Gongfu: rundy, czasy, kofeina na rundę — MVP
18. Krzywa rund i porównanie sesji — 1.1
19. Sygnał dźwiękowy i haptyczny przy końcu kroku — MVP
20. Zapamiętany tryb bez przełączania — MVP
21. Waga Bluetooth — później
22. Live Activity i Apple Watch — MVP *(korekta; patrz uwaga A)*

## Ocena i korekta
23. Ocena w skali koła smaków SCA — MVP
24. Diagnoza smaku z korektą (kawa, herbata) na zweryfikowanych regułach — MVP

## Dziennik i analiza
26. Dziennik sesji z pełnymi parametrami i notatkami — MVP
27. Statystyki i trendy — MVP
28. Kopia zapasowa: eksport JSON, CSV, import z testem odtworzenia — MVP
29. Spójność danych po aktualizacji — MVP

## Udostępnianie i podanie
30. Receptura jako link lub QR, offline, z obsługą otwierania linku — MVP
31. Karta degustacyjna jako obraz do udostępnienia — MVP *(korekta)*
32. Przepisy na napoje mleczne i latte art — MVP *(korekta; patrz uwaga B)*

## Konto, płatności, języki, dostępność
33. Bez konta, dane tylko w telefonie — MVP
34. Zakupy: model „piekarza” — patrz uwaga C
35. Języki: jak w „treningu” — patrz uwaga D
36. Dostępność: VoiceOver, Dynamic Type do 2.0×, przyciski 44 pt — MVP
37. Kofeina jako szacunek, bez obietnic dotyczących snu i zdrowia — MVP

## Uwagi do decyzji

**A. Live Activity i Apple Watch w MVP (22).** Dziś w Napar to atrapy (audyt). Do zbudowania potrzeba modułów ActivityKit, widżetu, aplikacji na zegarek i łączności. W `trening` są gotowe wzorce (`modules/rest-activity`, `modules/watch-link`, `targets/`), ale wymagają testów na urządzeniu. To znaczące zwiększenie zakresu i czasu. Opcje: (a) MVP z pełnym zakresem, (b) MVP bez 22, 1.1 po premierze. Rekomenduję (b).

**B. Przepisy na napoje mleczne (32) w MVP.** To nowy obszar treści, którego nie ma w Napar i którego nie oceniono w przeglądzie rynku. Każdy przepis to twierdzenie do sprawdzenia. Opcje: (a) MVP, (b) później. Rekomenduję (b).

**C. Zakupy jak w modelu „piekarza”.** Model „piekarza” (DEC-01 d): zakupy wyłącznie przez StoreKit; subskrypcja miesięczna i roczna oraz zakup dożywotni; 14 dni próby jako oferta wprowadzająca App Store; bez zakupu działa tylko historia, import, eksport i usuwanie własnych danych, a każda inna funkcja otwiera ekran zakupu.
- Konflikt: to jest dokładnie zarzut z recenzji „paywall na podstawowe funkcje”, który F1 miał naprawić.
- **A. Model „piekarza” bez zmian:** spójne z drugim produktem właściciela, ale powtarza zarzut konkurencji.
- **B. Model „piekarza”, ale podstawowe funkcje (timer, receptury, dziennik) bezpłatne:** naprawia F1, odbiega od „piekarza”.
- **Rekomendacja: B.** Wymaga Twojej decyzji, bo zmienia spójność między produktami.

**D. Języki jak w „treningu”.** `trening` ma 35 języków interfejsu. Napar ma 35 plików, ale ładowane są tylko PL i EN. Pełne 35 języków to tłumaczenie każdego tekstu, weryfikacja (rola tłumacza) i teksty sklepu dla każdego języka.
- **A. 35 języków w MVP:** największy koszt, najdłuższy czas.
- **B. PL i EN w MVP, reszta w 1.1:** tańsze, szybciej do premiery.
- **Rekomendacja: B**, chyba że 35 języków jest warunkiem sprzedaży, czego nie wiem.

**Liczba:** 31 pozycji MVP, 2 w wersji 1.1 (6, 18), 1 później (21). Po uwagach A i B (bez 22 i 32): 29 MVP.

## Decyzje właściciela (22.10.2026)

- **A — pozycja 22 (Live Activity i Apple Watch) w MVP.** Zaakceptowane z kosztem czasu. Odstępstwo od rekomendacji 1.1.
- **B — pozycja 32 (napoje mleczne i latte art) w MVP.** Zaakceptowane. Odstępstwo od rekomendacji „później”.
- **C — pozycja 34 (zakupy) według modelu z repo `trening` (M5 S1), zamiast modelu „piekarza”.** Struktura: darmowy poziom z limitem, Pro bez limitu (subskrypcja miesięczna, roczna albo dożywotnia), bez okresu próbnego i bez ofert wprowadzających, dane (historia, edycja, eksport, kopia) zawsze dostępne. Otwarte: jednostka i wielkość limitu, ceny, Family Sharing, kody ofertowe. Zastępuje decyzje D3/D4 z planu przebudowy w tym zakresie.
- **D — pozycja 35 (języki): bez decyzji.** Pozostaje otwarta.

**Liczba MVP:** 31 (bez zmian po akceptacji A i B).

## Decyzje właściciela — model zakupów i języki (22.10.2026)

1. **Limit darmowego poziomu zwiększony.** Przyjęta wartość robocza: **15 dni parzenia w miesiącu** (propozycja z tej listy; do potwierdzenia przy premierze). Dzień parzenia liczy się tylko dla parzeń wykonanych w aplikacji (timer), nie dla wpisów ręcznych.
2. **Ceny z treningu** (przyjęte jako odpowiedź „Ok”; do potwierdzenia): USD 0,99 / 6,99 / 14,99; PLN 4,99 / 19,99 / 59,99; EUR 0,99 / 7,99 / 17,99; GBP 0,99 / 6,99 / 14,99.
3. **Family Sharing dla subskrypcji i dożywotniego: zaakceptowane.** Warunek przed wysyłką: sprawdzić w App Store Connect, czy włączenie jest nieodwracalne (w treningu to pytanie jest otwarte).
4. **Bez okresu próbnego i bez ofert wprowadzających** (jak w treningu).
5. **Języki jak w treningu: 35.** Konsekwencje: tłumaczenie wszystkich tekstów interfejsu, sklepu i ekranów zakupu na 35 języków, weryfikacja przez rolę tłumacza, a `check:i18n` musi przechodzić dla wszystkich 35. To najdroższa pozycja w zakresie.

**Liczba MVP:** 31. **Zakres po decyzjach:** dodaje się koszt 35 języków, Live Activity i Apple Watch oraz treści napojów mlecznych. Harmonogram z planu przebudowy (7–11 dni agenta bez tych pozycji) wymaga aktualizacji po zebraniu zakresu.

## Korekta limitu darmowego poziomu (22.10.2026)

**Poprzednia decyzja „zwiększamy limit do 15” była błędna w kierunku.** Model z repo `trening` (`docs/monetyzacja/limit-dni.mjs`, uruchomiony bez zmian w repo; wariant 5–20 na kopii danych w scratchpadzie) pokazuje płacących na 100 pobrań w 24 miesiące:

| Limit (dni parzenia/mies.) | pesymistyczny | normalny | optymistyczny | aktywni trafiający na blokadę w 1. pełnym miesiącu |
|---|---|---|---|---|
| 4 | 1,40 | 2,00 | 2,89 | 90% |
| 5 | 1,31 | 1,88 | 2,72 | 86% |
| 6 | 1,22 | 1,76 | 2,56 | 82% |
| 10 | 0,83 | 1,23 | 1,81 | 59% |
| 15 | 0,39 | 0,59 | 0,88 | 30% |
| 20 | 0,11 | 0,17 | 0,26 | 9% |

**Zastrzeżenia:** wszystkie dane wejściowe są oznaczone w modelu jako [OCENA], a kluczowe (1,37% zakupów przy każdej blokadzie, retencja, częstotliwość) nie są zmierzone. Wynik pokazuje kierunek i proporcje, nie prognozę. Model nie uwzględnia wpływu blokady na oceny w sklepie. Badanie `trening` zanotowało, że „twarda blokada” ma 2,10★ w recenzjach.

**Wniosek:** dla celu „ludzie kupują” niższy limit daje więcej płacących w modelu. Koszt to ryzyko ocen i odinstalowań, którego model nie mierzy.

**Rekomendacja robocza: 5 dni parzenia/mies.** (tak jak w `trening`). Warunki, bez których nie wchodzimy na ten poziom:
- blokada nigdy nie przerywa trwającego parzenia; pojawia się przed startem nowego dnia,
- historia, edycja, eksport i kopia zawsze dostępne (jak w `trening` i `piekarz`),
- przed blokadą ekran pokazuje, ile dni zostało i co dokładnie się zablokuje,
- po premierze mierzymy: odsetek aktywnych trafiających na limit i udział recenzji 1–2★ z powodu blokady. Jeśli ocen spadnie za bardzo, podnosimy limit do 10.

**Alternatywa:** 10 dni (59% trafia na blokadę, ok. 65% płacących z wariantu 5). Mniej ryzyka ocen, mniej płacących w modelu.

Limit 15 z poprzedniej decyzji nie obowiązuje.

## Decyzja właściciela: limit darmowego poziomu = 10 dni parzenia/mies. (22.10.2026)

Zastępuje rekomendację 5 dni z korekty powyżej. Uzasadnienie właściciela: kawę pija się częściej niż trenuje.

**Otwarte, do zrobienia przed wyliczeniem przychodu:** model z `trening` używa częstotliwości treningowej (1–5 razy w tygodniu, z maksimum 5). Dla kawy częstotliwość jest wyższa, więc udział trafiających na limit przy 10 dniach jest prawdopodobnie większy niż 59%. Trzeba ponownie uruchomić model z rozkładem częstotliwości dla parzenia kawy (dziś nieznanym, do oszacowania) i dopiero wtedy traktować liczbę płacących jako punkt odniesienia.

Warunki z korekty obowiązują bez zmian: blokada nie przerywa trwającego parzenia, historia i eksport zawsze dostępne, ekran pokazuje pozostałe dni przed blokadą, pomiar po premierze (blokady i recenzje 1–2★).

## Decyzja właściciela: limit darmowego poziomu = 7 dni parzenia/mies. (22.10.2026)

Zastępuje decyzję 10 dni. Uzasadnienie właściciela: niższy limit daje więcej płacących; podniesienie limitu po premierze jest łatwe, obniżenie byłoby trudne dla użytkowników.

Wynik modelu `trening` (ta sama metoda, częstotliwość treningowa, [OCENA]; płacący na 100 pobrań w 24 mies., scenariusz normalny): **7 dni — 1,63** (77% aktywnych trafia na blokadę w pierwszym pełnym miesiącu); 10 dni — 1,23 (59%); 5 dni — 1,88 (86%).

**Nadal otwarte:** model wymaga ponownego uruchomienia z rozkładem częstotliwości dla parzenia kawy (kawa jest pijana częściej niż trenuje się). Przy wyższej częstotliwości udział trafiających na blokadę przy 7 dniach będzie większy niż 77%.

Warunki bez zmian: blokada nie przerywa trwającego parzenia, historia i eksport zawsze dostępne, ekran pokazuje pozostałe dni przed blokadą, pomiar po premierze (blokady i recenzje 1–2★). Jeśli ocen spadnie za bardzo, podnosimy limit.

## Family Sharing — zatwierdzone (22.10.2026)

Zatwierdzone przez właściciela dla subskrypcji i zakupu dożywotniego. **Nieodwracalne:** Apple (strona „Turn on Family Sharing for in-app purchases”, App Store Connect Help, odczyt 22.10.2026) pisze: „once you turn on Family Sharing for an In-App Purchases in App Store Connect, you can't turn it off”. Włączenie wykonuje właściciel w App Store Connect, po sprawdzeniu, że wybrany produkt jest właściwy.

## Decyzje nieblokujące — domyślne wg rekomendacji (23.10.2026)

Właściciel: decyzje nieblokujące zgodnie z rekomendacją. Lista punktów 2–5 nie była w kontekście po wyczyszczeniu sesji; poniższe przypisanie to moja interpretacja. Jeśli chodziło o inne punkty, ten wpis wymaga poprawki.

| # | Punkt | Decyzja domyślna | Status |
|---|---|---|---|
| 2 | Sprawdzenie, jak to zrobiono w `trening` (model limitu: `docs/monetyzacja/limit-dni.mjs`) | Przyjmujemy metodę z `trening`; ponowne uruchomienie z rozkładem częstotliwości kawy przed podaniem liczb przychodu | Otwarte: repo `trening` nie jest w zakresie tej sesji (wymaga `add_repo`) |
| 3 | Stare dane mogą przepaść | Wcześniejsze wartości limitu (15, 5, 10) zostają w pliku z datą jako historia; obowiązuje 7 dni; nic nie usuwamy | Zrobione tym wpisem |
| 4 | Zrobimy później | Model kawy i przychód odkładamy do czasu, aż będzie rozkład częstotliwości | Odroczone |
| 5 | Przegląd lepszym modelem Claude | Przegląd rejestru twierdzeń i modelu limitu wykonamy później, mocniejszym modelem | Odroczone |

**Wynik punktu 2 (23.10.2026).** Model `trening` (`docs/monetyzacja/limit-dni.mjs`, repo `trening` tylko do odczytu, bez zmian) uruchomiony na kopii danych z rozkładem częstotliwości kawy jako wrażliwością. Scenariusz normalny, płacący na 100 pobrań w 24 mies.:

| Rozkład częstotliwości | 5 dni | 7 dni | 10 dni | 15 dni | Blokada w 1. pełnym miesiącu (7 dni) |
|---|---|---|---|---|---|
| Trening (baza z `trening`, 1–5/tydz.) | 1,88 | 1,63 | 1,23 | 0,59 | 77% |
| Kawa średnio (2–7/tydz.) [OCENA] | 2,25 | 2,16 | 2,00 | 1,76 | 97% |
| Kawa codziennie (4–7/tydz.) [OCENA] | 2,31 | 2,27 | 2,21 | 2,09 | 100% |

Wnioski:
1. Przy częstotliwości kawy prawie wszyscy aktywni trafiają na blokadę przy każdym z testowanych limitów. Model nie rozróżnia limitów dla kawy: wynik zależy głównie od przyjętego prawdopodobieństwa zakupu przy blokadzie (1,37%, jedno źródło, [OCENA]), a nie od wartości N.
2. Model liczy dni treningowe. Napar liczy tylko parzenia w aplikacji (decyzja z 22.10). Tego filtra model nie ma, więc rzeczywista blokada może być niższa niż w tabeli. Nieuwzględnione.
3. Rozkład częstotliwości kawy nadal nie jest znany. Wartości z tabeli to wrażliwość, nie dane.

Otwarte dla właściciela: (a) przyjąć 7 dni jako wartość roboczą i mierzyć blokady oraz recenzje po premierze; (b) przed premierą zmienić model darmowego poziomu, bo limit dni nie rozdziela użytkowników kawy. Rekomendacja: (a) z pomiarem, bo nie ma danych, które uzasadniałyby (b). Zmiana modelu to decyzja cenowa i wymaga Twojej akceptacji.

**Decyzja właściciela (23.10.2026): (a).** Limit darmowego poziomu zostaje 7 dni parzenia/mies. jako wartość robocza. Po premierze mierzymy blokady i recenzje 1–2★ z powodu blokady. Wariant (b) nie jest przyjęty. Otwarte: licznik parzeń i blokad w kodzie, zakres i termin ustalimy osobno.

**Korekta (23.10.2026): licznik nie daje pomiaru po premierze.** Zero telemetrii jest zasadą nienaruszalną (CLAUDE.md §2.5, README, `tests/public-repo.test.ts`). Licznik w aplikacji zostaje na urządzeniu i nie może wysłać blokad do właściciela. Opcje:
- **(i) Bez telemetrii (rekomendacja):** pomiar z App Store Connect (agregaty zakupów i konwersji, bez kodu w aplikacji) oraz ręczny przegląd recenzji 1–2★. Zmian w kodzie pod pomiar nie ma.
- **(ii) Zmiana zasady:** opt-in, anonimowe zdarzenia blokady. Wymaga zmiany CLAUDE.md, BRD, etykiety prywatności w App Store i testu `public-repo`. Ryzyko: zaufanie do „zero telemetrii”, które jest częścią produktu.

Licznik dni parzenia na urządzeniu jest potrzebny do samego limitu i pojawi się przy wdrażaniu paywalla, nie jako narzędzie pomiaru. Do decyzji właściciela: (i) lub (ii).

**Decyzja właściciela (23.10.2026): (i) — bez telemetrii.** Zero telemetrii zostaje. Pomiar po premierze: agregaty z App Store Connect (zakupy, konwersja) i ręczny przegląd recenzji 1–2★ pod kątem blokady. Zmian w kodzie pod pomiar nie robimy. Do sprawdzenia przed premierą: jakie dane App Store Connect udostępnia dla darmowej aplikacji z zakupami (nie zweryfikowano w tej sesji).

## Decyzje właściciela — potwierdzenia przed premierą (23.10.2026)

- **Family Sharing (dożywotnie i subskrypcje): zamknięte.** Właściciel zna nieodwracalność i ją akceptuje.
- **Ceny USD: 0,99 / 6,99 / 14,99.** Potwierdzone. Ceny w PLN, EUR i GBP z listy wyżej pozostają do potwierdzenia.
- **Limit darmowego poziomu: 7 dni parzenia/mies.** Potwierdzone (wariant (a) z pomiarem po premierze).
- **Języki: jak w `trening`, czyli 35.** Potwierdzone. Zakres: tłumaczenie interfejsu, sklepu i ekranów zakupu na 35 języków, weryfikacja przez rolę tłumacza, `check:i18n` przechodzi dla wszystkich 35.

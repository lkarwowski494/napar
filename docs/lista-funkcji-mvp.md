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

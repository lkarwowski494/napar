# Proces parzenia od ziarna do podania — mapa luk (22.10.2026)

Zastrzeżenie: „nie znaleziono” znaczy tylko tyle, że wyszukiwarka tego nie pokazała. Nie dowodzi braku konkurenta. Każdy pomysł wymaga przeszukania App Store przed budową.

Legenda rynku: **pokryty** — kilka znalezionych aplikacji; **częściowo** — jedna lub dwie aplikacje, bez pełnej funkcji; **nie znaleziono** — brak wyniku.

## Kawa

| Etap | Co robi użytkownik | Rynek (znalezione) | Napar (kod, audyt) | Luka |
|---|---|---|---|---|
| 1. Wybór ziarna | porównuje palarnie, profile smaku | Kompendium statyczne; niewiele aplikacji z profilami | Kompendium, statyczne | częściowo |
| 2. Zakup i zapas | zapisuje cenę, wagę, palarnię | pokryte: [Coffee Ledger](https://apps.apple.com/app/id6760227144), [Coffee Bean Tracker – Vault](https://apps.apple.com/us/app/-/id6476065390), [BrewLab](https://apps.apple.com/us/app/id6744072433) | paczki z wagą i ubytkiem; koszt parzenia ze stałych cen | pokryte |
| 3. Świeżość | odpoczynek po paleniu, okna | pokryte regułami (okna czasowe) | okna jako reguły (`evaluateRestingWindow`) | osobisty model: odrzucony (za mało danych) |
| 4. Woda | dobiera mineralizację do kranu lub filtra | kalkulatory: [Barista Hustle](https://www.baristahustle.com/?p=350791) (desktop/web); test Smart Brew (sprzęt); **iPhone z raportem wodociągów: nie znaleziono** | profile wody i kalkulator, dane wpisywane ręcznie | **luka: import raportu lokalnego wodociągu** |
| 5. Mielenie | ustawia młynek (kliki) | analiza zdjęcia: [DOSE](https://apps.apple.com/app/id6775009587), [GrindLab](https://apps.apple.com/app/id6754118114); bazy młynków statyczne | baza młynków z klikami (wartości niezweryfikowane, audyt G3) | **luka: kalibracja młynka użytkownika z własnych parzeń** — częściowo |
| 6. Dozowanie i proporcja | waży kawę i wodę | pokryte | kalkulatory BR-KALK | pokryte |
| 7. Parzenie | czas, przepływ, temperatura | pokryte; waga BT ([Filtru](https://apps.apple.com/app/id6760366760) — sprawdzić) | stoper, kroki | pokryte |
| 8. Ocena i korekta | opisuje smak, dostaje zmianę | **nie jest unikalne:** [Coffee Brew Coach](https://apps.apple.com/app/id6777418888) — opis smaku → jedna korekta | Dial-in Doctor (silnik RD-05) | **korekta wcześniejszej analizy: K1 nie jest unikalne** |
| 9. Dziennik i analiza | notuje, porównuje | pokryte | dziennik, statystyki | pokryte |
| 10. Podanie | mleko, latte art, przepis na napój | pokryte: [The Espresso](https://apps.apple.com/app/id6761066207), [Breve](https://apps.apple.com/app/apple-store/id6747303642) | brak | parowanie z jedzeniem: **nie znaleziono** (wartość niepewna) |

## Herbata

| Etap | Co robi użytkownik | Rynek (znalezione) | Napar (kod, audyt) | Luka |
|---|---|---|---|---|
| 1. Wybór liścia | region, rok zbioru | [Tea Cellar](https://appshunter.io/ios/app/tea-cellar/id6763153804) — rok zbioru, skan etykiety | brak | częściowo |
| 2. Zakup i zapas | cena za gram, sklep | [Chayulu](https://apps.apple.com/us/app/chanrou/id6760438268) — cena za gram, wartość kolekcji; [TeaCabinet](https://mwm.ai/apps/teacabinet-tea-steep-log/6761303828) | brak | pokryte częściowo |
| 3. Przechowywanie i starzenie | rok prasowania, warunki, krzywa smaku z czasem | **nie znaleziono** w iPhone (sprawdzono kilka zapytań) | brak | **luka: dziennik starzenia puerh** |
| 4. Woda | jakość wody do herbaty | nie znaleziono w iPhone | brak | luka jak w kawie (sekcja 4) |
| 5. Parzenie gongfu | rundy, czasy, wydłużanie | pokryte: [Gongfu Tea Timer](https://apps.apple.com/app/id6757865749), [Tea Timer io](https://apps.apple.com/app/id6764414830) | sesja Gongfu z kofeiną na rundę | **krzywa rund i porównanie sesji** — częściowo |
| 6. Ocena | notatki degustacyjne | pokryte: [Tea Brew Timer & Journal](https://apps.apple.com/us/app/-/id6745836038) | notatki | pokryte |
| 7. Podanie i rytuał | czajnik, kubek, dzielenie | nie znaleziono | brak | nie znaleziono (wartość niepewna) |

## Kandydaci z luk (ranking: luka × wykonalność w Napar)

**G1. Kalibracja młynka z własnych parzeń.** Napar zbiera już kliki, dozę i wynik. Model „kliki → rozmiar” uczy się z historii użytkownika i zastępuje wpisy z bazy. Odpowiada na zarzut z recenzji („nie da się dodać młynka”). Wykonalne w `src/core`. Ryzyko: wymaga wielu parzeń, zanim model będzie wiarygodny.

**G2. Woda z raportu lokalnego wodociągu.** Użytkownik wpisuje lub fotografuje dane z raportu (twardość, zasadowość), aplikacja liczy mineralizację. Offline. Nie znaleziono takiej funkcji na iPhone. Ryzyko: formaty raportów różnią się między miastami, a wzory wymagają weryfikacji źródłami.

**G3. Dziennik starzenia herbaty puerh.** Rok prasowania, warunki przechowywania, notatki smaku w czasie, porównanie kolejnych lat. Nie znaleziono w iPhone. Nisza kolekcjonerów (dużo pieniędzy na jedną sztukę, ale mały rynek). Wykonalne prosto: model danych, bez twierdzeń zdrowotnych. Ryzyko: rynek mały.

**G4. Parowanie z jedzeniem.** Nie znaleziono, ale wartość i wiedza sensoryczna są niepewne. Odradzam na start.

## Korekty do wcześniejszych analiz

- **K1 (diagnoza smaku z korektą) nie jest unikalne.** Coffee Brew Coach już to robi. Nasza przewaga musi być w danych (poprawne reguły, zweryfikowane źródłami) albo w połączeniu z dziennikiem i młynkiem (G1). Zaktualizować `obszary-innowacji-2026-10-22.md`.
- **Pomysł laboratorium parzenia (A)** nadal nie ma pełnego odpowiednika w znalezionych aplikacjach.

## Decyzje dla właściciela

1. Czy G1 (kalibracja młynka) jako główny wyróżnik? Najlepiej łączy dane, które Napar już zbiera.
2. Czy G2 (woda z wodociągu) wchodzi do zakresu? Wymaga weryfikacji wzorów i formatów raportów.
3. Czy G3 (puerh) jako nisza na później? Mały rynek, prosta wykonalność.

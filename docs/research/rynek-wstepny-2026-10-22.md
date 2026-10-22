# Rynek kawy i herbaty — wstępny przegląd (krok 1 bramki walidacji)

Data: 22.10.2026. Status: **wstępny, niepełny.** Wyszukiwarka zwraca głównie strony sklepu bez cen i bez ocen. Ceny poniżej pochodzą z fragmentów i mogą być nieaktualne. Każdą liczbę trzeba sprawdzić na stronie w App Store przed użyciem w decyzji.

## 1. Timery parzenia kawy (iOS)

| Aplikacja | Model (wg fragmentu) | Uwagi | Źródło |
|---|---|---|---|
| Pour-Over Coffee Recipes Timer | darmowa, zakupy w aplikacji; własne receptury za subskrypcję | fragment starszy: 1 mies. 2,99 USD, 1 rok 12,99 USD (może być nieaktualne) | [App Store](https://apps.apple.com/us/app/-/id1615750286) |
| FourSix Coffee Timer | darmowa, zakupy w aplikacji, 4:6 | progi 0,99 / 7,99 / 24,99 USD, nie wiadomo, które to subskrypcje | [App Store](https://apps.apple.com/us/app/id1519905670) |
| Cup of Joe: Pour-Over Timer | 4-6 Brew darmowe; Pro za nieograniczone receptury | ceny nieznane | [App Store](https://apps.apple.com/app/id6776459348) |
| Single Origin – Coffee Timer | darmowa, zakupy w aplikacji, V60 z 60+ profilami | ceny nieznane | [App Store](https://apps.apple.com/bb/app/single-origin-coffee-timer/id1480168613) |
| Timer.Coffee | w pełni darmowa, dobrowolne wsparcie | 22 metody, w tym V60 | [App Store](https://apps.apple.com/tm/app/timer-coffee/id6449322787) |
| Bloom – Coffee Timer & Journal | darmowa, zakupy w aplikacji, plan miesięczny Pro | łączy dziennik i timer, aktualizacja maj 2026 | [AppsHunter](https://appshunter.io/ios/app/bloom-coffee-timer-and-journal/id6759914524) |

**Wniosek wstępny:** rynek timerów kawy jest zatłoczony i w większości darmowy. Płatność pojawia się przy funkcjach dodatkowych (własne receptury, dziennik). Napar konkuruje z darmowymi narzędziami, więc sama obecność stopera nie wystarczy jako powód do zapłaty.

## 2. Timery herbaty (iOS)

| Aplikacja | Model (wg fragmentu) | Uwagi | Źródło |
|---|---|---|---|
| Gongfu Tea Timer | darmowa; Live Activity | niewielka liczba ocen (4 w jednym regionie, 1 w innym) | [App Store](https://apps.apple.com/app/id6757865749) |
| Tea Timer io | darmowa, wersja iPad | cztery style parzenia, w tym gongfu | [App Store](https://apps.apple.com/app/id6764414830) |
| Kiri – Tea Timer | darmowa, zakupy w aplikacji, Apple Watch | brak wystarczającej liczby ocen do pokazania | [App Store](https://apps.apple.com/be/app/id6767208244) |

**Wniosek wstępny:** timery herbaty są prawie wszystkie darmowe i słabo ocenione (mało ocen). Nie widać ugruntowanego, płatnego modelu w tej niszy. To może być szansa, ale też sygnał, że płatność za herbatę jest trudna.

## 3. Wydatki na sprzęt i gotowość zapłaty

- **CivicScience (ok. 2400 dorosłych Amerykanów, ankieta lipcowa, rok nieznany):** najczęstsze wydatki na ekspres domowy to 50–100 USD (32%). Tylko 8% wydałoby ponad 250 USD. Chęć wydania ponad 100 USD rośnie z komplikacją metody: 16% użytkowników zwykłego dzbanka, 33% ekspresów kapsułkowych, 39% specjalistycznych ekspresów. Źródło: [CivicScience](https://civicscience.com/?p=29776).
- **Statista (lipiec 2019):** 13% respondentów deklaruje, że zapłaciłoby ponad 100 USD za ekspres dopasowany do ich potrzeb. Źródło: [Statista](https://statista.com/forecasts/1093502/willingness-to-pay-for-a-coffee-maker-matching-your-needs-in-the-us).
- **Maven Analytics (projekty portfolio, nie badanie pierwotne):** 93% woli parzyć w domu, większość uczestników wydała ponad 1000 USD na sprzęt do parzenia. Próba mała, niezweryfikowana, traktować jako słabe źródło: [Daily Grind](https://mavenanalytics.io/project/12689), [Great American Coffee Survey](https://mavenanalytics.io/project/14693).

**Ograniczenia:** dane z USA i z lat 2017–2020. **Nie znaleziono żadnych danych o gotowości zapłaty za aplikację** do parzenia. To jest najważniejsza luka i wymaga badania pierwotnego (bramka, krok 2–4).

## 4. Co z tego wynika dla bramki

1. Rynek timerów jest darmowy i zatłoczony. Płatność musi być za coś, czego darmowe narzędzia nie dają: dziennik i analityka, koło smaków, chemia wody, kofeina. To trzeba zweryfikować w wywiadach, nie zakładać.
2. Dane o wydatkach dotyczą sprzętu, nie aplikacji. Nie wolno z nich wyprowadzać ceny aplikacji.
3. Model z BRD (0,99 / 4,99 / 14,99 USD) nie ma żadnego porównania w tych danych. Porównanie musi wykonać bramka (krok 4 — test ceny).

## 5. Do zrobienia (wymaga zgody lub dostępu)

- Sprawdzić ceny i liczbę ocen dla każdej aplikacji z tabel bezpośrednio w App Store (strony otwarte w przeglądarce; w tej sesji nie mam pełnego dostępu do sklepu).
- Dopisać recenzje z 3–5 wiodących aplikacji (wzorem `trening/docs/monetyzacja-badanie-2026-10.md`, sekcja 4).
- Wywiady i test zapisów (kroki 2–3) — wymagają Twojej decyzji o kanałach, treści i tego, kogo pytamy.

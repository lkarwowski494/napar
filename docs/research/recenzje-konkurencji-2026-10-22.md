# Recenzje konkurencji — co ludziom nie działa (wstępnie, bez kontaktu z ludźmi)

Data: 22.10.2026. Źródło: publiczny kanał RSS recenzji App Store (`itunes.apple.com/{kraj}/rss/customerreviews/id={ID}/sortBy=mostRecent/json`), kraje US i PL. Pobrane 22.10.2026 w tej sesji. Surowe pliki: `scratchpad/recenzje/` (poza repo).

## 1. Próba i jej ograniczenia

| Aplikacja | ID | Recenzje w kanale | Średnia | 1–2★ |
|---|---|---|---|---|
| FourSix Coffee Timer | 1519905670 | 45 | 4,84 | 1 |
| Single Origin – Coffee Timer | 1480168613 | 18 | 3,72 | 4 |
| Pour-Over Coffee Recipes Timer | 1615750286 | 4 | 3,00 | 2 |
| Timer.Coffee | 6449322787 | 10 | 5,00 | 0 |
| Gongfu Tea Timer | 6757865749 | 1 | 5,00 | 0 |
| Tea Timer io | 6764414830 | 3 | 5,00 | 0 |
| Bloom, Cup of Joe, Kiri | — | brak recenzji w kanale | — | — |

**Ograniczenia:** łącznie około 80 recenzji, głównie z USA. Zarzutów 1–3★ jest kilkanaście. To za mało, żeby uznać wzorce za pewne. Kanał nie obejmuje Bloom, Cup of Joe i Kiri. Recenzje nie mówią, ile ludzie płacą; mówią tylko, co im przeszkadza.

## 2. Powtarzające się zarzuty (z 1–3★)

1. **Paywall na podstawowe funkcje.** „Pushes subscription, upgrade to pro just to use basic timer. Would be willing to pay upfront for straightforward app.” (FourSix, 2★). Jedna recenzja, ale mówi wprost o modelu płatności.
2. **Brak personalizacji: młynki i metody.** „Neither of these can be added to… limited list of grinders” (Single Origin, 1★); „expected both upward and inverted method for AeroPress” (Single Origin, 3★).
3. **Błędne lub niespójne proporcje.** „312 g of water in an AeroPress (as stated for a 11 oz. press)” (Single Origin, 1★); „the dial won’t go lower than 320 grams” (Single Origin, 3★).
4. **Problemy po aktualizacji.** „Recipes disappeared with latest update” (Single Origin, 1★); „It was better before!” (FourSix, 3★, nowe tryby domyślnie).
5. **Zakupy nie działają.** „charged me for a year subscription… restore purchases it freezes” (Pour-Over Recipes, 1★).

## 3. Co to oznacza dla Napar (hipotezy, nie wnioski)

- **Zarzuty 1, 2 i 5 pasują do tego, co Napar ma lub może mieć:** własne młynki i metody (kreator receptur już istnieje), dane offline bez konta, eksport. Ale to hipotezy. Nie wiemy, czy ktoś za to zapłaci.
- **Zarzut 3 jest zagrożeniem dla nas:** Napar ma dane o młynkach i wzory, a audyt pokazał błędy w obu (kliki młynka z README nie zgadzają się z kodem, EY zapisywany błędnie). Jeśli wchodzimy na tym zarzucie, dane muszą być poprawne przed premierą.
- **Zarzut 1 wskazuje na model:** jeśli podstawowe funkcje są darmowe, płatne mogą być tylko te, których nie ma w darmowych. Trzeba to zweryfikować, zanim wybierze się model.

## 4. Co trzeba zrobić dalej (bez kontaktu z ludźmi)

- Pobrać więcej recenzji (kraje: GB, DE, FR, CA, AU) — większa próba, żeby zarzuty się potwierdziły albo odpadły.
- Dla każdego zarzutu sprawdzić, czy Napar mógłby go rozwiązać, i z jakim kosztem (np. dane młynków wymagają weryfikacji źródłami).
- Zdecydować o wejściu (wybór kierunku) przed budową. Sam „MVP z całym BRD” nie jest kierunkiem.

## 5. Aktualizacja — poszerzona próba (ta sama data)

**Próba:** ok. 120 unikalnych recenzji z 9 aplikacji (kraje US, GB, DE, FR, CA, AU, PL). Większość recenzji siedzi w 2–3 aplikacjach (FourSix, Single Origin); pozostałe mają 1–16 recenzji lub brak danych w kanale. Wiele zarzutów się powtarza między krajami, więc to ta sama próba, nie niezależne potwierdzenie.

**Nowi konkurenci (z wyszukiwania, bez pełnych recenzji):**
- **Brew Timer – Coffee Recipes** — płatna; ustawienia pod młynek, korekty wody, automatyczny dziennik. Źródło: wynik wyszukiwania (SimilarWeb), adres strony nie został przypisany do aplikacji — **do weryfikacji w App Store**. **To pokrywa się z naszą hipotezą „młynek + dziennik”.**
- **Barista – Coffee Timer** — płatna; V60 i AeroPress, wagi wody na każdym kroku. Źródło: wynik wyszukiwania (SimilarWeb), adres do weryfikacji w App Store.
- **Simple Coffee Timer** — premiera kwiecień 2026; V60 i AeroPress, przeliczanie proporcji, Live Activity. [mwm.ai](https://mwm.ai/apps/simple-coffee-timer/6761335857). Ma recenzje 3★: edycja receptur w małych polach, brak zmiany wagi kawy, brak zapisu odmiany mielenia.
- **Brewly: Coffee Timer & Journal**, **Coffee DTR Timer** — dziennik i timer w jednej aplikacji. [AppsHunter](https://appshunter.io/ios/app/brewly-coffee-timer-and-journal/id6738063344/similar).
- **Tea Brew Timer & Journal** — zapis notatek degustacyjnych, od oolong po pu-erh; strona oznaczona „Designed for iPad”. [App Store](https://apps.apple.com/us/app/-/id6745836038). **Nisza herbaty z dziennikiem już jest zajęta.**
- **Enthusiast Tea Timer** — gongfu i notatki z gwiazdkami, ale dostępna na Androida i przez F-Droid, nie na iOS. [F-Droid](https://f-droid.org/packages/com.sesu8642.infusion_timer/).

**Nowe zarzuty z 1–3★:**
- edycja receptur w małych polach, trudne przestawianie kroków (Simple Coffee Timer, 3★);
- nie da się zmienić wagi kawy poniżej progu (Simple Coffee Timer, 3★; Single Origin, 3★);
- brak zapisu odmiany mielenia (Simple Coffee Timer, 3★);
- błędne ilości w metodzie 4:6 (FourSix, 1★, po niemiecku).

**Korekta wniosków z sekcji 3:**
- Hipoteza „młynek + dziennik” **nie jest unikalna**: płatna aplikacja już to oferuje. Wzięcie jej jako przewagi wymaga czegoś głębszego.
- Dziennik herbaty z notatkami też już istnieje.
- Zarzuty z recenzji dotyczą głównie UX i błędów danych, nie braku funkcji. To sugeruje, że przewaga może być w **wiarygodności danych i prostocie edycji**, a nie w liście funkcji. To wymaga potwierdzenia.
- Potencjalnie unikalne dla Napar, do zweryfikowania: diagnoza smaku z recepturą naprawczą (Dial-in Doctor), model kofeiny i wody, pełna praca offline bez konta i z eksportem. Żadnej z tych funkcji nie widziałem u konkurentów w wynikach wyszukiwania, ale brak wyniku nie dowodzi braku konkurenta.

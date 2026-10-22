# Pomysły z luką rynkową — wyszukiwanie (22.10.2026)

Zastrzeżenie: wyszukiwarka nie daje pewności, że „nikt tego nie ma”. Poniżej, co znaleziono i czego nie. Każdy pomysł wymaga osobnego przeszukania (sklep App Store, Google Patents) przed budową.

## Pomysł A: Laboratorium parzenia (eksperymenty w ciemno z analizą)

Idea: aplikacja losuje kolejność i etykiety próbek, ukrywa tożsamość do momentu oceny, zbiera oceny w tej samej skali co koło smaków SCA i liczy wynik statystycznie (np. test trójkątny, test dwumianowy, minimalna liczba próbek). Wynik trafia do dziennika i uczy się preferencji użytkownika.

**Co znaleziono (najbliżej):**
- Ręczny test w ciemno z kodami QR na etykietach i punktacją parami — metoda z bloga, bez aplikacji ([gingerlime.com](https://www.gingerlime.com/2014/coffee-ab-testing/)).
- CoffeeDialLog — porównanie dwóch parzeń tej samej kawy, bez losowania ani ukrywania ([mwm.ai](https://mwm.ai/apps/coffeediallog/6778264848)).
- Angels' Cup — notatki degustacyjne i porównanie z palarnią lub innymi użytkownikami, bez ślepej próby ([App Store](https://apps.apple.com/app/angels-cup/968069264)).
- Cuppy — ślepe cupping, ale do profesjonalnej oceny ([mwm.ai](https://mwm.ai/apps/cuppy-cupping-caf/6749718516)).

**Czego nie znaleziono:** aplikacji łączącej losowanie, ślepą ocenę, test statystyczny i zapis do dziennika w jednym narzędziu.

**Dlaczego pasuje do Napar:** losowanie i ukrywanie to logika w `src/core` (testowalna, deterministyczna). Statystyka dla małych prób jest prosta. Dziennik i koło smaków już istnieją. Nie ma twierdzeń zdrowotnych, więc nie dotyka ryzyka 1.4.1.

**Ryzyko:** to nisza entuzjastów. Płacący popyt nieznany.

## Pomysł B: Trening podniebienia z kalibracją do własnych parzeń

Idea: quizy ślepe (kwasowość, gorycz, słodycz, ciało) z referencjami, a wynik kalibruje ocenę użytkownika w dzienniku.

**Co znaleziono:** CoffeeBee ma „grę smakową” bez szczegółów formatu ([mwm.ai](https://mwm.ai/apps/coffeebee-coffee-diary/6742644321)). Coffee Smarts buduje „odcisk podniebienia” z ocen, bez testów ([App Store](https://apps.apple.com/app/id6770059943)). Ćwiczenia domowe są na blogach (np. [Metropolis](https://shop.metropoliscoffee.com/blogs/news/brew-diligence-day-one-sensory-exercises)).

**Ocena:** luka jest częściowa. Jest już element tego pomysłu, więc nie jest to czysta przewaga.

## Pomysł C: Osobisty model świeżości kawy

Idea: model wyuczony z własnych dat palenia, mielenia i ocen.

**Co znaleziono:** aplikacje oparte na regułach (okna czasowe) ([Bean AI](https://mwm.ai/apps/bean-ai/6760227144)). Młynek z czujnikami i aplikacją (Voltaire, crowdfunding, sprawdzić czy wysłany). Badanie z 2025 roku z modelem ML o R² > 0,9, oparte na CO2 i 2-metylofuranie, czyli pomiarach laboratoryjnych ([AIChE 2025](https://proceedings.aiche.org/conferences/aiche-annual-meeting/2025/proceeding/paper/predictive-modeling-measure)).

**Ocena:** wymaga danych, których pojedynczy użytkownik nie zbierze szybko. Model z kilkunastu wpisów będzie szumem. Odradzam jako pierwszy krok.

## Co nie jest luką (sprawdzone)

- Analiza ziarna ze zdjęcia: DOSE i GrindLab już działają na iPhone ([DOSE](https://apps.apple.com/app/id6775009587), [GrindLab](https://apps.apple.com/app/id6754118114)).
- Stoper z kroków: wszystkie większe timery.

## Rekomendacja

Pomysł A jako kandydat na wyróżnik, bo łączy trzy elementy, których w znalezionych aplikacjach nie widać razem: ślepą próbę, statystykę i zapis do dziennika. Pomysł B jako rozszerzenie A (kalibracja oceny). Pomysł C odłożyć.

**Decyzje dla właściciela:** czy A wchodzi do zakresu jako wyróżnik, czy jako funkcja dodatkowa; czy wymagamy przeszukania patentów przed budową (rekomenduję tak, bo idea jest prosta i może mieć stan techniki).

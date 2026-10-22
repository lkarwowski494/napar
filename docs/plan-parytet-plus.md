# Parytet plus — funkcje konkurentów zrobione lepiej (plan, 22.10.2026)

Status: **plan, bez kodu.** Każda pozycja ma dowód z recenzji (plik `docs/research/recenzje-konkurencji-2026-10-22.md`), co Napar ma dziś (audyt etapu 1), kryterium akceptacji i wymagany test. Zasady: nie kopiujemy UI, tekstów, nazw ani danych konkurentów; funkcje i poprawne zachowania są wspólne.

## 1. Zasada

Dla każdej funkcji: **parytet** (działa jak u konkurentów) + **poprawka** (usuwa to, na co narzekają recenzje). Pozycja wchodzi do zakresu tylko wtedy, gdy ma dowód luki i test akceptacji.

## 2. Macierz

| # | Funkcja (rynek) | Luka u konkurenta (dowód) | Napar dziś (audyt) | Poprawka | Kryterium akceptacji |
|---|---|---|---|---|---|
| F1 | Własne receptury bez paywalla | Pour-Over: własne receptury za subskrypcją; FourSix: „upgrade to pro just to use basic timer” (2★) | kreator receptur istnieje (`recipe-builder`) | podstawowe funkcje bez opłat; płatne tylko dodatki | każda funkcja z listy „podstawowe” działa bez zakupu |
| F2 | Młynek i metoda użytkownika | Single Origin: „can’t add grinder… limited list” (1★) | baza młynków statyczna; kliki niezweryfikowane (G3) | własne młynki i metody, dodawane z poziomu użytkownika | użytkownik dodaje młynek i zapisuje przelicznik kliknięć; test zapisu i odczytu |
| F3 | AeroPress: obie metody | Single Origin: brak „upward” (3★) | do sprawdzenia | obie metody z tymi samymi regułami | test: receptury dla obu metod, proporcje zgodne z reguły |
| F4 | Poprawne proporcje i ilości | Single Origin: 312 g wody w AeroPressie „niemożliwe” (1★); FourSix: błędne ilości w 4:6 (1★, DE) | kalkulatory proporcji działają; błąd EY w zapisie (audyt) | każda receptura w bazie sprawdzona wzorem i źródłem | test wektorowy dla każdej receptury; wpis w rejestrze twierdzeń |
| F5 | Zakres wagi kawy | Single Origin: pokrętło nie schodzi poniżej 320 g (3★); Simple Coffee Timer: nie da się zmienić wagi (3★) | dozowanie w krokach (BrewQuickPrepCard) | zakres bez sztywnego minimum | test dla 5 g i 500 g |
| F6 | Edycja receptury | Simple Coffee Timer: edycja w małych polach, trudne przestawianie kroków (3★) | edytor receptur istnieje; zdejmuje ulubione i nadpisuje `createdAt` (audyt) | pełnoekranowa edycja; przestawianie kroków; zachowanie ulubionych | test: edycja nie zmienia `createdAt` ani ulubionych |
| F7 | Zapis odmiany mielenia | Simple Coffee Timer: brak zapisu odmiany (3★) | pole w sesji istnieje (nastawa młynka) | pole odmiany w recepturze i dzienniku | test zapisu i pokazania w dzienniku |
| F8 | Przywracanie zakupów | Pour-Over: „restore purchases… freezes” (1★) | zakup to atrapa (audyt) | prawdziwe zakupy i przywracanie — dopiero po decyzji D3 | test sandbox na urządzeniu |
| F9 | Aktualizacje nie kasują danych | Single Origin: „recipes disappeared with latest update” (1★) | kopie automatyczne z ograniczeniami (audyt, obcięcia 200/100) | pełny eksport i test odtworzenia po aktualizacji | test: eksport → import na czystej instalacji = te same dane |
| F10 | Tryb domyślny bez dodatkowych kliknięć | FourSix: domyślnie tryb „brew”, trzeba przełączać (3★) | Asystent parzenia: karta 1-Tap | tryb zapamiętany, bez przełączania | test: po ponownym otwarciu ten sam tryb |
| F11 | Notatki i tryb degustacji | Tea Brew Timer & Journal ma notatki; Coffee Brew Coach ma korektę | dziennik i notatki istnieją | nie kopiujemy; poprawiamy spójność danych (F9) | brak nowej funkcji, tylko test spójności |

## 3. Proces weryfikacji (warunek „bezbłędnie”)

Bez tego plan się nie wykona. Audyt pokazał, że zielone testy nie wystarczają.

1. **Każda pozycja ma test wyniku, nie tylko wywołania** (np. EY dla znanej receptury, nie tylko `> 0`).
2. **Każda stała i wzór ma wpis w rejestrze twierdzeń** z źródłem (`docs/audyt-etap1/etap1-G6-rejestr-twierdzen.md` jako punkt wyjścia).
3. **Zakazane atrapy:** żadna funkcja nie zwraca sukcesu bez wywołania systemu (zakup, HealthKit, Live Activity — usuwamy albo oznaczamy jako niedostępne).
4. **Test na urządzeniu** przed każdą premierą: zakup, przywracanie, kopia, ścieżka bazy.

## 4. Czego nie robimy

- Nie kopiujemy tekstów, zdjęć, nazw ani układu konkurentów.
- Nie kopiujemy ich receptur. Receptury piszemy od nowa i sprawdzamy źródłami.
- Nie obiecujemy funkcji, której nie przetestowaliśmy.

## 5. Decyzje do potwierdzenia

1. Zakres: F1–F11 wszystkie, czy pierwsze pięć (F1, F2, F4, F6, F9)?
2. Model płatności: czy podstawowe funkcje są bezpłatne (F1)? Wymaga decyzji D3/D4 z planu przebudowy.
3. Kolejność: najpierw poprawność danych (F4, F9), potem funkcje (F1–F3, F5–F7, F10).

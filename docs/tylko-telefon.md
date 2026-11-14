# Lista „tylko telefon” — Napar

Kontrole, których nie sprawdzi Jest ani E2E na symulatorze (M1-audytor-generalny-012; 07-jakosc-006).
Wykonuje właściciel na buildzie TestFlight przed każdym wysłaniem do App Review. Wpisz datę, numer buildu i wynik (OK / błąd + opis).
*Dlaczego:* scenariusze Maestro sprawdzają start, spiżarnię, kofeinę, dziennik i dane po ponownej instalacji; reszta zależy od urządzenia albo nie ma jeszcze scenariusza.

| # | Kontrola | Kroki | Oczekiwany wynik | Data · build | Wynik |
|---|---|---|---|---|---|
| T1 | Parzenie do końca → dziennik → spiżarnia | Spiżarnia: dodaj paczkę 250 g → Parzenie: wybierz ją, V60 → stoper do końca → Zapisz | Wpis w Dzienniku z tą paczką; waga paczki mniejsza o dawkę; wpis kofeiny | | |
| T2 | Gongfu Cha | Gongfu: 2 infuzje → Zakończ i zapisz | Jeden wpis w Dzienniku bez oceny, której nie podano; log kofeiny; waga liści odjęta | | |
| T3 | Tryb awaryjny | Wymuś 3 nieudane starty (build diagnostyczny albo zamknięcie przed pierwszym ekranem) | Ekran trybu awaryjnego; „Zrób kopię ratunkową bazy” → komunikat z licznościami | | |
| T4 | Kopia ratunkowa w aplikacji Pliki | Po T3: aplikacja Pliki → Na moim iPhonie → Napar → kopie-ratunkowe | Folder widoczny, plik `napar-kopia-….db` (i katalog `surowa-…`) | | |
| T5 | Reset w trybie awaryjnym | Po T4: „Zresetuj uszkodzoną bazę” → potwierdź | Kopia powstaje przed usunięciem; po restarcie aplikacja bez danych; kopia nadal w Plikach | | |
| T6 | Eksport i import JSON | Ustawienia → eksport JSON → zapisz w Plikach → import tego pliku | Liczności po imporcie takie same jak przed | | |
| T7 | Aktualizacja z poprzedniego buildu | Zainstaluj poprzedni build TestFlight, dodaj dane, zaktualizuj do nowego | Dane zachowane; brak trybu awaryjnego | | |
| T8 | VoiceOver | Włącz VoiceOver; przejdź Parzenie, Spiżarnia, Dziennik, Kofeina | Każdy przycisk ma nazwę i rolę; kolejność czytania zgodna z ekranem | | |
| T9 | Duża czcionka i wąski ekran | Rozmiar tekstu AX5; iPhone SE albo zoom ekranu | Teksty się nie ucinają; stoper w jednym wierszu | | |
| T10 | Język angielski | Język systemu: English | Główne ekrany po angielsku, bez polskich tekstów | | |
| T11 | Dźwięk i wibracje | Ustawienia: wyłącz wibracje → parzenie i Gongfu | Brak wibracji; dźwięk zgodny z ustawieniem | | |
| T12 | Bez sieci | Tryb samolotowy → pełne T1 | Wszystko działa offline | | |

Otwarte dla E2E [DO USTALENIA]: czy `launchApp.arguments` (AppleLanguages) w Maestro ustawia język aplikacji na symulatorze iOS — potwierdzi pierwszy przebieg workflow „E2E iOS (Maestro)”; zapas: ustawienie języka symulatora w workflow (`defaults write -g AppleLanguages`).

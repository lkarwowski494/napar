# Rejestr decyzji projektu Napar

Jedno miejsce na decyzje, na które powołuje się kontrakt zakresu (`docs/scope-contract.md`). ID `D-nnn` są unikalne w projekcie. *Dlaczego:* BRD 0.1 (00b, DEC-01…DEC-41) i lista decyzji audytu M1 (DEC-01…DEC-13) używały tych samych numerów dla różnych spraw (01-odkrywanie-020).

Zasady zapisu:
- D-001…D-013 to decyzje audytu M1 z 2026-11-11 o tych samych numerach (D-001 = DEC-01 audytu M1 itd.). Słowa właściciela 2026-11-13: „Wszystko według rekomendacji” — wybór (a) w każdej.
- „BRD DEC-nn” to historyczny wiersz BRD 0.1, część 00b. Status „ZAAKCEPTOWANA” w 00b nie ma słów właściciela ani daty, więc nie jest tu decyzją właściciela.
- Nowa decyzja: kolejny numer, data, słowa właściciela, odrzucone opcje i zależności. Decyzja zależna od innej ma dopisek „warunkowa”.

| ID | Data | Decyzja | Odrzucone opcje (kompromis) | Słowa właściciela, źródło | Dawne ID |
|---|---|---|---|---|---|
| D-001 | 2026-11-13 | Wersja 1.0 całkowicie darmowa: bez paywalla, okresu próbnego, bramek i ekranu zakupu; kod zakupów usunięty. | (b) prawdziwy StoreKit w 1.0 (kilka dni pracy, kroki w App Store Connect, sprzeczne z kierunkiem „za darmo”) | „Wszystko według rekomendacji” | DEC-01 audytu M1; BRD DEC-41 |
| D-002 | 2026-11-13 | Funkcje `src/core` bez drogi z interfejsu usunięte razem z testami i budżetami czasu; nowe funkcje tylko przez bramkę zmian zakresu (ZM). | (b) zostawić i wyłączyć budżety czasu z CI (kombajn zostaje) | „Wszystko według rekomendacji” | DEC-02 audytu M1 |
| D-003 | 2026-11-13 | Języki 1.0: polski i angielski; deklaracja 35 lokalizacji usunięta do czasu prawdziwych tłumaczeń. | (b) 35 języków przed wydaniem (duży koszt i opóźnienie) | „Wszystko według rekomendacji” | DEC-03 audytu M1 |
| D-004 | 2026-11-13 | Bez Apple Health w 1.0: przełącznik i wszystkie obietnice usunięte do czasu wdrożenia (KILL-08). | (b) zapis do HealthKit w 1.0 (moduł natywny, uprawnienia, testy na urządzeniu) | „Wszystko według rekomendacji” | DEC-04 audytu M1 |
| D-005 | 2026-11-13 | Kofeina o porze snu jako neutralny szacunek z zastrzeżeniem, bez progu 25 mg i bez „bezpiecznej godziny”. | (b) reguła ze źródła szczebla 1–2 po jego odczycie (do tego czasu próg bez podstawy) | rozstrzygają źródła (wybór a), właściciel bez weta | DEC-05 audytu M1 |
| D-006 | 2026-11-13 | Nazwa „Napar” wszędzie, bez nazwy angielskiej. | (b) nowa nazwa angielska po sprawdzeniu sklepu i znaków towarowych | „Wszystko według rekomendacji” | DEC-06 audytu M1 |
| D-007 | 2026-11-13 | Działający adres kontaktowy właściciela wpisany wszędzie; strony prawne na GitHub Pages. | (b) domena marki ze skrzynką (koszt, wydanie czeka na DNS) | „Wszystko według rekomendacji” | DEC-07 audytu M1 |
| D-008 | 2026-11-13 | Powiadomienia o etapach parzenia wykreślone z 1.0; zostaje dźwięk i wibracja na pierwszym planie oraz ekran bez wygaszania (KILL-09). | (b) lokalne powiadomienia w 1.0 (nowa zależność, zgoda, testy na urządzeniu) | „Wszystko według rekomendacji” | DEC-08 audytu M1 |
| D-009 | 2026-11-13 | Raporty poprzednich audytów poza drzewem repozytorium; `audit/` w `.gitignore`. | (b) zostawić w publicznym repo | „Wszystko według rekomendacji” | DEC-09 audytu M1 |
| D-010 | 2026-11-13 | Kontrakt zakresu od nowa po naprawach i krótka errata BRD; BRD 0.1 zostaje dokumentem historycznym z erratą. | (b) pełna restrukturyzacja BRD teraz | „Wszystko według rekomendacji” | DEC-10 audytu M1 |
| D-011 | 2026-11-13 | Wysyłka do TestFlight tylko przy zielonym CI i E2E na tym samym commicie. | (b) tylko zielone CI, E2E informacyjnie | „Wszystko według rekomendacji” | DEC-11 audytu M1 |
| D-012 | 2026-11-13 | Identyfikator aplikacji zostaje `pl.lukasz.napar` (errata ER-02 w BRD). | (b) zmiana identyfikatora przed wydaniem (nowy rekord, profile, potok) | „Wszystko według rekomendacji” | DEC-12 audytu M1 |
| D-013 | 2026-11-13 | Jeden ekran prowadzenia parzenia; czas rusza dopiero przyciskiem „Rozpocznij parzenie”, bez cichego startu. | (b) auto-start zostaje, poprawiona tylko etykieta | „Wszystko według rekomendacji” | DEC-13 audytu M1 |
| D-014 | 2026-11-11 | Kierunek: aplikacja darmowa jako kanał sprzedaży portfela; alternatywa na później: wcześni użytkownicy zachowują pełny dostęp, a płatność albo reklamy dla nowych. Kryterium nadrzędne: „intuicyjnie i dobrze”. | — (kierunek, nie wybór między opcjami; reklamy w napięciu z zasadą zero telemetrii, decyzja przy powrocie do monetyzacji) | „Zgoda zgodnie z rekomendacją. Olej bramkę, może udostępnimy za darmo i zrobimy z tego kanał sprzedaży. […] Ma być intuicyjnie i dobrze.” | STOP 1 audytu M1 |
| D-015 | 2026-11-13 | Plan napraw audytu M1 (45 zadań) zatwierdzony w całości, w tym naprawy funkcji, które zostają w 1.0 (np. zadanie 034: °F w trybie imperialnym, zadanie 031: przewodnik z Ustawień, zadanie 030: wyłącznik dźwięku). | — | „Wszystko według rekomendacji” | STOP 2 audytu M1 |
| D-016 | 2026-10-24 | Lista odcięć KILL-01…KILL-07 (wagi Bluetooth, moduł społecznościowy, czaty LLM, zamawianie ziaren, OCR w chmurze, Live Activity, Apple Watch) z wersjami docelowymi z kontraktu z 2026-10-24. | nie zapisano | słowa właściciela niezapisane [DO USTALENIA] — do potwierdzenia przez właściciela | kontrakt zakresu 2026-10-24 |

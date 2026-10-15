# **Napar BRD 0.1 — Część A3a: Tabela zakresu cz. 1 (Parzenie, Kawa, Herbata)**

Zakres funkcjonalny Z-001 do Z-090. Przypisanie etapów: **MVP**, **1.1**, **1.2**, **2.x**, **badanie**, **nigdy**.

---

| ID | Obszar | Nazwa funkcji | Opis i zachowanie | Priorytet | Etap |
| :--- | :--- | :--- | :--- | :---: | :---: |
| **Z-001** | PARZ | Główny stoper sesji | Precyzyjny stoper z dokładnością do 0.1s liczący całkowity czas od rozpoczęcia preinfuzji. | MUST | MVP |
| **Z-002** | PARZ | Wieloetapowe zalania (Pours) | Podział parzenia na etapy: preinfuzja (blooming), kolejne zalania wagowe, faza spływu (drawdown). | MUST | MVP |
| **Z-003** | PARZ | Pasek postępu zalania | Wizualny wskaźnik sugerujący docelową gramaturę wody w czasie rzeczywistym. | MUST | MVP |
| **Z-004** | PARZ | Sygnalizacja dźwiękowa | Krótki, łagodny dźwięk dzwonka na 3s przed końcem etapu i w momencie startu kolejnego. | MUST | MVP |
| **Z-005** | PARZ | Wibracja haptyczna telefonu | Taptic Engine sygnalizuje zmianę fazy wibracją o zmiennej dynamice. | MUST | MVP |
| **Z-006** | PARZ | Ochrona przed uśpieniem ekranu | Blokada wygaszania ekranu (idleTimerDisabled) w trakcie trwania aktywnej sesji parzenia. | MUST | MVP |
| **Z-007** | PARZ | Ochrona przed przypadkowym zatrzymaniem | Wymóg dłuższego przytrzymania przycisku stop (0.8s) lub potwierdzenia przy stuknięciu. | MUST | MVP |
| **Z-008** | PARZ | Pauza i wznawianie | Możliwość wstrzymania odliczania w sytuacji awaryjnej (np. brak wrzątku w czajniku). | SHOULD | MVP |
| **Z-009** | PARZ | Korekta czasu w locie | Szybkie dodanie +10s / -10s do bieżącej fazy jednym stuknięciem. | SHOULD | 1.1 |
| **Z-010** | PARZ | Tryb ciemny zoptymalizowany pod OLED | Głęboka czerń minimalizująca zużycie baterii i nieoślepiająca o poranku. | MUST | MVP |
| **Z-011** | METODY | Profil: Hario V60 | Dedykowane receptury: Tetsu Kasuya 4:6, James Hoffmann Single Cup, Scott Rao. | MUST | MVP |
| **Z-012** | METODY | Profil: AeroPress | Tryb klasyczny i odwrócony (inverted); kontrola czasu parzenia i przeciskania. | MUST | MVP |
| **Z-013** | METODY | Profil: Chemex | Receptury na większe objętości z uwzględnieniem grubej struktury filtra papierowego. | MUST | MVP |
| **Z-014** | METODY | Profil: French Press | Metoda głębokiej infuzji (James Hoffmann French Press technique) z długim opadaniem cząstek. | MUST | MVP |
| **Z-015** | METODY | Profil: Kalita Wave / Flat Bottom | Parzenie z płaskim dnem; równomierna ekstrakcja z mniejszą liczbą zalań. | SHOULD | MVP |
| **Z-016** | METODY | Profil: Espresso | Receptura ciśnieniowa: doza sucha, uzysk w filiżance, czas preinfuzji i ekstrakcji głównej. | SHOULD | MVP |
| **Z-017** | METODY | Profil: Cold Brew | Timer długoczasowy (12–24h) z powiadomieniem lokalnym po zakończeniu maceracji. | COULD | 1.1 |
| **Z-018** | METODY | Profil: Syfon / Vacuum Pot | Kontrola czasu gotowania dolnego naczynia i czasu infuzji górnej. | COULD | 1.2 |
| **Z-019** | HERBATA | Profil: Gongfu Cha | Licznik wielokrotnych infuzji (do 15 zalań); automatyczne wydłużanie czasu kolejnego parzenia. | MUST | MVP |
| **Z-020** | HERBATA | Profil: Parzenie zachodnie (Western) | Jednorazowa infuzja dużej objętości (300–500ml) z czasem 2–5 min. | MUST | MVP |
| **Z-021** | HERBATA | Profil: Matcha | Kontrola temperatury wody (70–80°C) oraz czasu ubijania chasenem (30s). | SHOULD | 1.1 |
| **Z-022** | HERBATA | Sugestie temperatur per rodzaj herbaty | Wstępne nastawy: biała (75-80°C), zielona (70-80°C), oolong (85-95°C), czarna (95-100°C), puerh (98-100°C). | MUST | MVP |
| **Z-023** | RECEPTURY | Kreator własnych receptur | Definiowanie własnych kroków: czas, waga wody, temperatura, instrukcja słowna. | MUST | MVP |
| **Z-024** | RECEPTURY | Duplikowanie receptury | Szybkie klonowanie istniejącej receptury w celu eksperymentowania z jednym parametrem. | SHOULD | MVP |
| **Z-025** | RECEPTURY | Skalowanie receptury | Automatyczne przeliczanie gramatur ziaren i etapów wody przy zmianie dozy docelowej. | MUST | MVP |
| **Z-026** | RECEPTURY | Udostępnianie receptury (Universal Link) | Generowanie linku lub kodu QR z pełnym opisem kroków bez konieczności posiadania konta. | SHOULD | 1.1 |
| **Z-030** | MAG | Kartoteka kawy | Pola: nazwa, palarnia, kraj pochodzenia, region, farma/producent, odmiana botaniczna, obróbka, data palenia. | MUST | MVP |
| **Z-031** | MAG | Świeżość i okno degustacyjne (Resting) | Automatyczny wskaźnik: odgazowanie (za świeża), optymalny czas parzenia, starzenie. | MUST | MVP |
| **Z-032** | MAG | Stan magazynowy ziaren | Śledzenie wagi pozostałej w paczce (np. start 250g, ubywa z każdym parzeniem). | SHOULD | MVP |
| **Z-033** | MAG | Kartoteka herbaty | Pola: nazwa, producent, rodzaj (biała, zielona, oolong, czarna, puerh), rok zbioru, ogród herbaciany, kultywar. | MUST | MVP |
| **Z-034** | MAG | Archiwizacja zużytych paczek | Przenoszenie pustych opakowań do archiwum z zachowaniem pełnej historii parzeń. | SHOULD | MVP |
| **Z-035** | MAG | Zdjęcie opakowania | Możliwość dodania zdjęcia etykiety z aparatu lub biblioteki zdjęć. | COULD | 1.1 |
| **Z-040** | WODA | Baza receptur wody mineralnej | Receptury Barista Hustle (Buffer / Magnesium), Lotus Water, Third Wave Water. | SHOULD | MVP |
| **Z-041** | WODA | Notatka o profilu wody w sesji | Zapisanie typu użytej wody (np. kranówka filtrowana Brita, woda z minerałami, źródlana). | COULD | MVP |

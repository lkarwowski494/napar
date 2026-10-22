# Obszary innowacji i wyróżnienia Napar — analiza (rola: analityk produktu)

Data: 22.10.2026. Metoda: rola `analityk-produktu` z repo `trening` (najpierw kod, potem opcje do decyzji). Dowody: kod Napar (odczyt, bez zmian), recenzje konkurencji z `docs/research/recenzje-konkurencji-2026-10-22.md`, wstępny przegląd rynku z `docs/research/rynek-wstepny-2026-10-22.md`.

**Zastrzeżenie:** żaden z poniższych pomysłów nie jest zweryfikowany przez użytkowników. Opieramy się na tym, czego brakuje w recenzjach konkurencji i co Napar już ma w kodzie.

## 1. Stan kodu, na którym można budować (sprawdzone grepem)

| Zdolność | Plik | Stan wg audytu etapu 1 |
|---|---|---|
| Diagnoza smaku kawy (RD-05) | `src/core/domain-rules.ts:267` | silnik działa w zakładce Dial-in; arkusz po parzeniu ma teksty na sztywno |
| Diagnoza herbaty (RD-05b) | `src/core/domain-rules.ts:324` | nieweryfikowana w tej sesji |
| Sesja Gongfu z kofeiną na zalanie | `src/core/gongfu-session.ts:156` | działa; zapis wpisuje ocenę 5 na sztywno |
| Udostępnianie receptury w URL (offline) | `src/core/recipe-share.ts:124, 138` | kodowanie/dekodowanie działa; „Kopiuj link” pokazuje Alert, brak obsługi deep linka |
| Kalkulator wody z minerałów | `src/core/water-chemistry.ts:185`, diagnoza `:234` | działa; zgodność jednostek do zweryfikowania |
| Ekonomia parzenia vs kawiarnia | `src/core/cost-calculator.ts:50` | działa; ceny w arkuszu są stałe |

## 2. Kandydaci na wyróżnik

### K1. Diagnoza smaku z konkretną korektą (Dial-in Doctor jako główny wyróżnik)
- **Problem (recenzje):** ludzie narzekają na błędne proporcje i brak personalizacji, nie na brak timera. Nikt z badanych konkurentów nie oferuje diagnozy „co zmienić, żeby było lepiej”.
- **Co jest:** silnik RD-05 i RD-05b, dane do korekty (mielenie, temperatura, proporcja).
- **Czego brakuje:** poprawne reguły (audyt: błąd EY i niespójne stałe kofeiny), przepisanie arkusza po parzeniu tak, by używał silnika zamiast tekstów na sztywno.
- **Opcje:**
  - A. Jeden główny wyróżnik: diagnoza smaku z korektą dla kawy i herbaty (rekomendacja). Najbardziej odróżnia od timerów; koszt: wymaga poprawnych reguł, więc zaczynamy od weryfikacji źródłami.
  - B. Tylko kawa, herbata później. Mniejszy zakres, szybciej, ale słabiej się wyróżnia w niszy herbaty.
  - C. Diagnoza jako funkcja płatna, reszta darmowa. Wymaga decyzji o modelu (D3/D4 z planu).
- **DO WYJAŚNIENIA:** czy reguły RD-05 zostały zweryfikowane źródłami? Zgodnie z audytem — nie.

### K2. Receptury bez konta, wymieniane offline (QR i link)
- **Problem (recenzje):** zarzut „nie da się dodać własnego młynka ani metody”; ludzie chcą swoich receptur. Konkurenci zamykają to w subskrypcji.
- **Co jest:** kodowanie receptury w URL i QR działa offline.
- **Czego brakuje:** obsługa linku (deep link), kopiowanie, spójny format z wersjami.
- **Opcje:**
  - A. Wymiana receptur offline jako cecha marki („receptura przez QR, bez konta”) (rekomendacja). Tanie, zgodne z zasadą offline; koszt: wymaga poprawek w udostępnianiu.
  - B. Społecznościowa biblioteka receptur. Sprzeczne z zasadą „zero konta” i wymaga serwera. Odrzucam.
- **DO WYJAŚNIENIA:** czy QR jest faktycznie wygodniejszy od linku dla użytkowników? Bez badania — hipoteza.

### K3. Gongfu i herbata: krzywa zalań zamiast timera
- **Problem:** timery herbaty są darmowe i słabo ocenione, a dziennik z notatkami już istnieje (Tea Brew Timer & Journal). Nisza nie jest pusta, ale nie ma dobrego narzędzia do analizy kolejnych zalań.
- **Co jest:** sesja Gongfu z zalaniami i kofeiną na zalanie.
- **Opcje:**
  - A. Wykres krzywej zalań i porównanie sesji (rekomendacja jako rozszerzenie K1). Wykorzystuje istniejący model.
  - B. Osobna aplikacja tylko do herbaty. Duży nakład, mała nisza, odrzucam na start.
- **Ryzyko:** herbata może mieć mniejszy rynek płacący; to trzeba potwierdzić.

### K4. Ekonomia parzenia jako argument zakupu
- **Problem:** użytkownicy porównują koszt domowy z kawiarnią; konkurenci tego nie pokazują w recenzjach (brak danych).
- **Co jest:** kalkulator kosztu parzenia.
- **Opcje:**
  - A. Pokazać oszczędność miesięczną na podstawie własnych zakupów (rekomendacja). Jasny argument finansowy; koszt: ceny muszą być wprowadzane przez użytkownika, nie wpisane na sztywno.
  - B. Porównanie z cenami kawiarni z bazy. Wymaga danych, które trzeba zebrać i zweryfikować; ryzyko nieaktualności.
- **DO WYJAŚNIENIA:** czy użytkownicy liczą koszt w ogóle? Bez badania — nieznane.

### K5. Zaufanie jako pozycjonowanie: dane tylko w telefonie, zero konta, pełny eksport
- **Problem:** recenzje krytykują subskrypcje wymuszane na podstawowych funkcjach i utratę danych po aktualizacjach („recipes disappeared”).
- **Co jest:** offline, bez konta, eksport JSON/CSV, kopie automatyczne (z ograniczeniami z audytu).
- **Opcje:**
  - A. Pozycjonować Napar jako „dane należą do Ciebie” i potwierdzić to naprawą kopii (rekomendacja). Tanie, mocne przeciwieństwo do konkurentów z subskrypcją.
  - B. Ignorować to i konkurować funkcjami. Słabsza pozycja wobec płatnych timerów.
- **Warunek:** deklaracja musi być prawdziwa. Test zero-sieci i odtwarzanie z kopii muszą przejść, zanim to się obieca w sklepie.

### K6. Personalizacja kofeiny (t½ użytkownika) — odradzam jako wyróżnik
- Model z personalizacją t½ istnieje, ale obietnica sprzyjania snu lub zdrowiu to ryzyko wytycznych 1.4.1 i twierdzenie wymagające źródeł (rejestr G6, pozycje T-036, T-139, T-142). Może zostać jako narzędzie szacunkowe, nie jako wyróżnik.

## 3. Rekomendacja pakietu

**Główny wyróżnik: K1 (diagnoza smaku z korektą) + K2 (receptury offline) + K5 (zaufanie).** To trzy rzeczy, których konkurenci w recenzjach nie robią dobrze, i które Napar ma w kodzie lub może mieć tanio. K3 jako rozszerzenie herbaty po weryfikacji popytu. K4 jako funkcja pomocnicza. K6 poza wyróżnikiem.

**Warunek wstępny:** zanim cokolwiek z tego obiecamy, naprawiamy błędy z audytu, które dotyczą K1 (EY, stałe kofeiny, arkusz po parzeniu) i K5 (kopie zapasowe). Obietnica wyróżnika oparta na błędnych liczbach zrobi więcej szkody niż jej brak.

## 4. Decyzje dla właściciela

1. Czy K1 jako główny wyróżnik, czy kawa i herbata równolegle? (A/B z sekcji K1)
2. Czy K2 jako cecha marki (QR bez konta)? (A/B z sekcji K2)
3. Czy K3 włączać do pierwszej wersji, czy zostawić na później? (rekomendacja: później)
4. Model płatności dla diagnozy (K1-C): tak czy nie?

## 5. Co jeszcze nie wiadomo

- Czy użytkownicy realnie chcą diagnozy smaku, czy wolą samą listę receptur. Brak danych.
- Czy QR jest wygodniejszy niż link. Brak danych.
- Czy herbata ma płacący popyt. Brak danych.
- Zgodność jednostek w kalkulatorze wody (audyt: wymaga testu).

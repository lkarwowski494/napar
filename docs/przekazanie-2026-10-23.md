# Przekazanie — stan na 23.10.2026

Repo: `lkarwowski494/napar`, branch `claude/wykonaj-sl7vii`, ostatni commit `16f4663`.
Ta sesja zmieniła tylko dokumenty. Kod aplikacji bez zmian. `npm run verify` nie był uruchamiany.

## 1. Decyzje właściciela (23.10.2026)

Pełna treść z datami: `docs/lista-funkcji-mvp.md`, sekcje od „Decyzja właściciela (23.10.2026)” i „Decyzje właściciela — potwierdzenia przed premierą”.

- **Limit darmowego poziomu:** 7 dni parzenia w miesiącu. Dzień liczy się tylko dla parzeń wykonanych w aplikacji (timer), nie dla wpisów ręcznych.
- **Pomiar po premierze:** bez telemetrii. Agregaty z App Store Connect (zakupy, konwersja) i ręczny przegląd recenzji 1–2★ pod kątem blokady limitu. Zero telemetrii zostaje.
- **Family Sharing** (subskrypcje i dożywotnie): zaakceptowane. Właściciel zna nieodwracalność.
- **Ceny USD:** 0,99 / 6,99 / 14,99. PLN, EUR i GBP przeliczają się z USD. Wartości z `trening` dla tych walut są nieaktualne.
- **Języki:** 35, jak w `trening`. Tłumaczenie interfejsu, sklepu i ekranów zakupu, weryfikacja przez rolę tłumacza, `check:i18n` dla wszystkich 35.
- **Zakupy:** model z `trening` (M5 S1). Darmowy poziom z limitem, Pro bez limitu. Bez okresu próbnego i bez ofert wprowadzających. Dane (historia, edycja, eksport, kopia) zawsze dostępne.
- **Pozycje MVP z 22.10:** 22 (Live Activity i Apple Watch) i 32 (napoje mleczne i latte art) w MVP.

## 2. Ustalenia z analizy (z dowodami)

- Model limitu dni: `trening/docs/monetyzacja/limit-dni.mjs` (repo tylko do odczytu, commit `837a850`). Zakłada częstotliwość treningową. Rozkład częstotliwości kawy nie jest znany.
- Wrażliwość (scenariusz normalny, płacący na 100 pobrań w 24 mies.):
  - trening, 7 dni: 1,63; blokada 77%
  - kawa średnio, 7 dni: 2,16; blokada 97%
  - kawa codziennie, 7 dni: 2,27; blokada 100%
  - Model nie rozróżnia limitów dla kawy. Wynik zależy głównie od prawdopodobieństwa zakupu przy blokadzie (1,37%, jedno źródło, [OCENA]).
  - Model nie uwzględnia filtra „tylko parzenia w aplikacji”.
- Zero telemetrii: `CLAUDE.md` §2.5, `README.md`, test `tests/public-repo.test.ts`. Dlatego licznik w aplikacji nie daje pomiaru po premierze.

## 3. Otwarte

- Kwoty PLN, EUR, GBP w App Store Connect: nie sprawdzone.
- Dane dostępne w App Store Connect dla darmowej aplikacji z zakupami: nie sprawdzone.
- Rozkład częstotliwości parzeń kawy: nieznany, tylko [OCENA].
- Checklista przeglądu recenzji 1–2★: nie przygotowana.
- Kompilacja iOS i zachowanie Live Activity oraz Apple Watch: niezweryfikowane lokalnie (wymagają Maca i workflow `ios-unsigned`).
- Implementacja limitu i paywalla w kodzie: nie zaczęta. Wymaga specyfikacji, w tym zasad liczenia dni parzenia.
- Przegląd rejestru twierdzeń i modelu limitu mocniejszym modelem: odroczony.

## 4. Commity tej sesji (tylko dokumenty)

`d60bbd0`, `6fa8cd2`, `2d5e261`, `e5d9870`, `fdeb3ca`, `d532de9`, `16f4663`, oraz ten plik.

## 5. Odtworzenie wyniku wrażliwości

```bash
# w katalogu z kopią trening/docs/monetyzacja/limit-dni.json
node limit-dni.mjs limit-dni.json
```

Warianty częstotliwości kawy były podmieniane w JSON w polu `czestosc.w` i `limity: [5, 7, 10, 15]`. Skrypty i wyniki są w scratchpadzie sesji, nie w repo.

## 6. Następne kroki

1. Potwierdzić kwoty PLN, EUR, GBP w App Store Connect.
2. Przygotować checklistę przeglądu recenzji 1–2★.
3. Zdecydować, czy zbierać rozkład częstotliwości parzeń kawy (np. wywiad lub ankieta).
4. Spisać specyfikację limitu i paywalla, a dopiero potem zmieniać kod.

# Rejestr języków — Napar

Decyzja: DEC-03 wariant a (plan napraw M2, rozstrzygnięta 2026-11-13): „polski i angielski; deklaracja 35 lokalizacji i sklonowane słowniki usunięte do czasu prawdziwych tłumaczeń”. Odrzucony wariant b: 35 języków przetłumaczonych przed wydaniem (duży koszt i opóźnienie wydania; teksty trzeba najpierw wynieść do słownika).
Polityka: nazwany wyjątek od polityki „szerokiej” (D-026) na wersję 1.0 — zestaw „z dowodu”: PL (rynek główny) i EN. *Dlaczego:* każdy zadeklarowany język bez słownika pokazywał interfejs po angielsku pod nazwą innego języka w Ustawieniach iOS i w sklepie.
Źródło tekstów: `pl` (`src/core/i18n.tsx`, `translations.pl`). Teksty systemowe (Info.plist): `locales/native/<język>.json`, wskazane w `app.json` → `expo.locales`.
Utrzymanie: nowy tekst = klucz w `translations.pl` i `translations.en` (symetrię sprawdza `npm run check:i18n`); nowy język = słownik ładowany przez aplikację, plik `locales/native/<język>.json` i wiersz w tej tabeli, dopiero potem wpis w `supportedLocales`.

## Zestaw w wydaniu 1.0

| Język | Stan | Powód (dowód) | Tłumaczenie | Drugi przegląd AI | Przegląd człowieka | Treści krytyczne | Zrzuty |
|---|---|---|---|---|---|---|---|
| pl | w wydaniu | język źródłowy; rynek główny | źródło | nie dotyczy | [DO USTALENIA] | źródło | [DO USTALENIA] |
| en | w wydaniu | drugi język interfejsu od początku projektu | pochodzenie nieudokumentowane [DO USTALENIA] | [DO USTALENIA] | przegląd właściciela (2026-11-23) | przegląd właściciela (2026-11-23) | [DO USTALENIA] |

## Kontrole (trwałe)

- `app.json`: `expo-localization` `supportedLocales.ios` i `.android`, `ios.infoPlist.CFBundleLocalizations` i klucze `expo.locales` = języki słowników `translations` — `npm run check:i18n` i `npm run check:native`.
- Każdy plik `expo.locales` ma `ios.CFBundleDisplayName` równe nazwie aplikacji i każdy klucz `NS…UsageDescription` z bazowego `infoPlist`; tekst języka innego niż EN nie jest kopią EN — `npm run check:i18n`.
- Wygenerowany projekt iOS ma `<język>.lproj/InfoPlist.strings` z tekstem prośby o aparat — `npm run check:native` (prebuild).
- Test regresyjny: `tests/audit-fixes.test.tsx`, blok „M1-audytor-generalny-032”.

## Kolejne języki

Powrót do szerszego zestawu wymaga nowej decyzji właściciela (rynek z dowodu, koszt utrzymania, kto sprawdzi przekład) i tłumaczeń przez fale z przeglądem; wcześniej teksty na sztywno w widokach muszą trafić do słownika.

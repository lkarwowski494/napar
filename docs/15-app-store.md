# Karta Produktu App Store Connect — Napar (Steepwise)

> Standard wydawniczy App Store zgodny z BRD-QA-REL 1.0 (`BR-REL-021`).

---

## 1. Metadane Produktu (App Store)

### Język podstawowy: Polski (pl-PL)
* **Nazwa (Title, $\le 30$ zn.):** `Napar: Kawa i Herbata` (21 zn.)
* **Podtytuł (Subtitle, $\le 30$ zn.):** `Stoper, woda i receptury` (25 zn.)
* **Tekst promocyjny (Promotional Text, $\le 170$ zn.):**
  `Twój asystent alternatywnego parzenia kawy i herbaty. Precyzyjne zalewanie, kalkulator mineralizacji wody i stoper interwałowy. Bez reklam i bez śledzenia.` (163 zn.)
* **Słowa kluczowe (Keywords, $\le 100$ zn., oddzielone przecinkami bez spacji):**
  `kawa,herbata,v60,aeropress,chemex,drip,stoper,barista,receptura,parzenie` (72 zn.)
* **Kategoria główna:** Jedzenie i napoje (*Food & Drink*)
* **Kategoria poboczna:** Narzędzia (*Utilities*)
* **Ocena wiekowa (*Age Rating*):** 4+ (brak przemocy, brak hazardu, brak treści dla dorosłych)
* **Prawa autorskie:** `© 2026 Apps4Craft Studio`

### Język angielski (en-US)
* **Name ($\le 30$ chars):** `Napar: Coffee & Tea` (19 chars)
* **Subtitle ($\le 30$ chars):** `Specialty Coffee & Tea Brew` (27 chars)
* **Promotional Text ($\le 170$ chars):**
  `Your artisanal coffee and tea brewing companion. Precise pour-over pacing, water mineralization calc, and interval timer. 100% private, no trackers.` (152 chars)
* **Keywords ($\le 100$ chars, comma-separated no spaces):**
  `coffee,tea,pourover,v60,aeropress,chemex,timer,barista,recipe,brewing` (68 chars)

---

## 2. Adresy URL i Zgodność Prawna

* **Adres URL wsparcia technicznego (*Support URL*):**
  `https://lkarwowski494.github.io/napar/support.html`
* **Adres URL polityki prywatności (*Privacy Policy URL*):**
  `https://lkarwowski494.github.io/napar/privacy.html`
* **Adres strony marketingowej:**
  `https://lkarwowski494.github.io/napar/`
* **E-mail kontaktowy:** `kontakt@apps4craft.pl`
* **Szyfrowanie (*ITSAppUsesNonExemptEncryption*):** `false` (standardowe HTTPS bez niestandardowej kryptografii zastrzeżonej)

---

## 3. Notatki do wydania TestFlight (*What to Test*)

### Polski (wklejane do notatek wersji):
```text
Wydanie testowe Napar (Steepwise):
1. Przetestuj stoper zalewania dla drippera V60 i aeropressu.
2. Dodaj nowe ziarno do spiżarni z wagą i profilem palenia.
3. Wypróbuj kalkulator wody i przelicznik jednostek (g / oz).
4. Sprawdź eksport kopii zapasowej w Ustawieniach.
Aplikacja działa w 100% offline, dane pozostają wyłącznie na Twoim urządzeniu.
```

### English:
```text
Napar (Steepwise) TestFlight beta:
1. Test the interval pour-over timer for V60 and AeroPress.
2. Log new beans in the pantry with roast profile and weight.
3. Check the water mineralization calculator and unit conversion (g/oz).
4. Verify local JSON backup export in Settings.
100% offline, privacy-first, zero analytics.
```

---

## 4. Konfiguracja Sekretów CI/CD (GitHub Actions)

Workflow wydawniczy `.github/workflows/testflight.yml` wymaga 4 poufnych parametrów w:
`GitHub Repozytorium → Settings → Secrets and variables → Actions`:

| Nazwa sekretu | Opis | Przykład wartości |
| :--- | :--- | :--- |
| `APPLE_TEAM_ID` | 10-znakowy identyfikator zespołu deweloperskiego Apple | `AB1234CDEF` |
| `ASC_KEY_ID` | Identyfikator klucza App Store Connect API | `2X9R4HXF34` |
| `ASC_ISSUER_ID` | UUID wystawcy z App Store Connect | `69a6de70-…-47e3a6200fd6` |
| `ASC_KEY_P8_BASE64` | Zawartość pliku `AuthKey_*.p8` zakodowana w Base64 | `LS0tLS1CRUdJTi...` |

> [!IMPORTANT]
> Klucz `.p8` jest dekodowany na maszynie CI dopiero po fazie `pod install` z prawami `umask 077` i natychmiast usuwany po zakończeniu eksportu (`if: always()`).

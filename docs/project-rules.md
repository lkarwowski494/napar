# Zasady i Role Projektu: Napar (Apps4Craft Studio)

Stan na: 17.10.2026  
Właściciel: Łukasz  
Źródło standardu: „Biblioteka zasad i ról” (Dysk Google, ID: `1a9PD_1dVpY5Ct3XTkJPQoB-3iqPwVD__wbL7Fe-xOUw`)

---

## 1. Aktywne moduły zasad

### Moduł: Aplikacje (Oprogramowanie)
- **Bezpieczeństwo i prywatność:** 100% offline-first, lokalna baza SQLite, zero zewnętrznych SDK telemetrycznych i śledzących.
- **Audyt sekretów:** Historia git, pliki `.p8`, `.env`, certyfikaty i logi wolne od kluczy i prywatnych tokenów.
- **Narzędzia i koszty:** 0 zł poza Apple Developer Program. Sprawdzanie limitów GitHub Actions i narzędzi przed dużymi przebiegami.
- **Rygor testów:** Testy przed kodem; błędy odtwarzane testem sprawdzonym najpierw na kodzie sprzed poprawki; zakaz obniżania progów pokrycia.
- **Zgodność z App Store:** Dane Apple Health wyłącznie lokalnie (wytyczna 5.1.3), brak nazw konkurentów w metadanych (wytyczna 2.3.7), wydawca D-U-N-S.
- **Jakość UI i ergonomia:** Brak ucinania elementów, dynamiczne safe-area (iOS Home Indicator), dotykowe cele min. 44x44pt, całkowity brak emotikonów z klawiatury (wyłącznie autorskie wektory SVG ze standardu `@apps4craft/ui`).
- **Praca odporna na przerwy:** Commity małymi krokami, push do `main` wyłącznie przy kodzie wyjścia 0 z `npm run check`.

### Moduł: Research i Treści Merytoryczne
- **Fizykochemia ekstrakcji:** Wzory TDS & EY% oparte o standard SCA (Specialty Coffee Association).
- **Mineralizacja wody:** Twardość ogólna (GH) i alkaliczność (KH) oparte o receptury Barista Hustle & SCA.
- **Bezpieczeństwo kofeiny:** Limity dobowe i stężenia oparte o wytyczne EFSA (Europejski Urząd ds. Bezpieczeństwa Żywności).
- **Zakaz zgadywania:** Liczby i twierdzenia bez potwierdzenia oznaczane jako otwarte pytanie; rachunek z danych użytkownika to kalkulator, nie twierdzenie merytoryczne.

### Trzy Zasady Ogólne (z modułu gier / NaviStories)
1. **Jedno źródło prawdy:** Centralne tabele młynków, tokeny kolorów i komponenty bazowe zamiast duplikowania.
2. **„Udokumentowane” ≠ „zweryfikowane”:** „Zrobione” oznacza dowód (przechodzący test jednostkowy/E2E, pomiar, log).
3. **Warianty i archiwa:** Oznaczone jawnie obok kanonu (np. kopie zapasowe JSON, historia wydań).

---

## 2. Katalog aktywnych ról

| Rola | Model | Zakres w projekcie Napar |
| :--- | :--- | :--- |
| **Koordynator / Integrator** | Mocny | Prowadzenie stanu repozytorium, weryfikacja bramek CI przed commitem, diagnoza konfliktów środowiskowych. |
| **Programista** | Roboczy / Tańszy | Implementacja według specyfikacji, tworzenie minimalnego diffa, pisanie testu przed naprawą. |
| **Audytor / Tester** | Mocny | Niezależna weryfikacja jakości, audyt podatności, kontrola ucinania widoków na ekranach iPhone, testy regresji. |
| **Tłumacz** | Roboczy / Tańszy | Równoległe utrzymywanie spójności i18n (`src/core/i18n.tsx`), czysta typografia bez emotikonów. |
| **Wydawca** | Roboczy / Tańszy | Przygotowanie wydań App Store / TestFlight (`v1.0.0-b...`), nadzór nad tagami i artefaktami. |

---

## 3. Rejestr kluczowych decyzji (Dziennik Decyzji)

- **16.10.2026** — *Model biznesowy:* Apps4Brew Pass ($0.99/msc, $4.99/rok z 14-dniowym darmowym trialem, $14.99 lifetime). Gwarancja nielimitowanego i bezpłatnego dostępu Read-Only do historii parzeń i notatek po wygaśnięciu okresu próbnego.
- **16.10.2026** — *Wydanie TestFlight:* Zbudowano i wdrożono build `v1.0.0-b1006` przez GitHub Actions (`#38963552448`).
- **16.10.2026** — *Design System rodziny:* Wydzielono standard frontendu `@apps4craft/ui` do niezależnego repozytorium `https://github.com/lkarwowski494/apps4craft-ui`.
- **17.10.2026** — *Eliminacja emotikonów i safe-area:* Pełny purge emotikonów z klawiatury we wszystkich ekranach i komponentach; wdrożenie wektorów SVG (`CraftIcons.tsx`); dynamiczne marginesy tab baru eliminujące ucinanie na iPhone'ach z Home Indicator.
- **17.10.2026** — *Przyjęcie standardu ról:* Zaadoptowano 10 Zasad Uniwersalnych oraz moduły z Biblioteki Zasad i Ról (Google Drive).

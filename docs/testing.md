# Strategia i Ekosystem Testów — Napar (Apps4Brew)

Zgodnie ze standardem wieloperspektywicznego testowania przyjętym w ekosystemie projektów (wzorowanym na `organizer`), każda funkcja, algorytm, ekran oraz interakcja w aplikacji **Napar** objęta jest zestawem automatycznych testów weryfikujących zachowanie pod każdym możliwym kątem.

---

## Zasada Architektoniczna
Funkcjonalność uznaje się za ukończoną tylko wtedy, gdy:
1. Posiada pokrycie we wszystkich właściwych dla siebie warstwach testów (tabela poniżej).
2. `tsc --noEmit` kończy się z zerem błędów.
3. Wszystkie testy Jest przechodzą w 100% (`npm run verify`).
4. Spełnia surowe założenia **Apps4Brew**: 100% offline-first, zerowa telemetria, zerowe logowanie, lokalna baza SQLite i otwartość danych (eksport/import JSON/CSV).

---

## Progi Pokrycia Kodu (Coverage Thresholds — Zapadki)

Zgodnie z `jest.config.js`, w projekcie obowiązują twarde progi pokrycia uniemożliwiające regresję:

| Obszar | Linie (Lines) | Funkcje (Funcs) | Instrukcje (Stmts) | Gałęzie (Branch) |
|---|---|---|---|---|
| **Globalnie (Cały projekt)** | **≥ 97%** | **≥ 97%** | **≥ 97%** | **≥ 85%** |
| **`src/core/` (Logika domeny, baza, fizyka)** | **≥ 98%** | **≥ 98%** | **≥ 98%** | **≥ 90%** |
| **`app/` (Ekrany, modale, routing)** | **≥ 95%** | **≥ 95%** | **≥ 95%** | **≥ 75%** |

---

## Warstwy Testów według Perspektywy

| Perspektywa / Warstwa | Plik testowy | Zakres weryfikacji | Cel |
|---|---|---|---|
| **1. Kontrakty i Architektura** | `src/core/__tests__/contracts.test.ts` | • Zgodność wersji: `package.json` ↔ `app.json` ↔ `settings.tsx`<br>• Skaner czystości kodu Apps4Brew: brak bibliotek analitycznych (Firebase Analytics, Segment, Amplitude, Datadog itp.)<br>• 100% symetria kluczy i18n (PL ↔ EN)<br>• Aksjomaty receptur Master (dozy, woda, temperatura, proporcje, sekwencje zalewań)<br>• Taksonomia SCA kół smaków (6 kategorii, kolory HEX, >35 deskryptorów)<br>• Granice kalibracji młynków i wody | Gwarancja spójności metadanych, prywatności użytkownika i poprawności aksjomatów baristycznych. |
| **2. Budżety Wydajnościowe (CPU/Perf Budgets)** | `src/core/__tests__/perf-budget.test.ts` | • 10 000 obliczeń ekstrakcji TDS / EY% < 100 ms CPU<br>• 10 000 kroków kinetyki kofeiny < 80 ms CPU<br>• 1 000 wielozalewowych sesji Gongfu Cha < 100 ms CPU<br>• 2 000 konwersji mikronów dla 6 młynków < 80 ms CPU<br>• 5 000 bilansów mineralizacji wody < 80 ms CPU<br>• 5 000 ucieczek CSV < 60 ms CPU<br>• 1 000 rekordów serializacji/deserializacji JSON < 80 ms CPU | Ochrona płynności UI 60/120 fps, zapobieganie blokowaniu głównego wątku (Hermes/JS). |
| **3. Testy Własności i Niezmienników (Property-Based)** | `src/core/__tests__/property-based.test.ts` | • Odwracalność matematyczna: `water = dose * ratio` dla losowych liczb zmiennoprzecinkowych<br>• Ścisła monotoniczność EY% względem TDS (`TDS₁ < TDS₂ ⇒ EY₁ < EY₂`)<br>• Zupełność i rozłączność klasyfikacji SCA Golden Cup<br>• Monotoniczność nastaw klików dla wszystkich młynków (`k+1 > k`)<br>• Stabilność round-trip konwertera młynków (`clicks → microns → clicks`)<br>• Liniowość i addytywność koncentratów mineralnych wody (`calc(2×) == 2 × calc(1×)`)<br>• Prawo zachowania masy kofeiny w herbatach Gongfu Cha | Dowód matematycznej poprawności i braku anomalii brzegowych. |
| **4. Odporność na Chaos i Fuzzing (Chaos/Fuzz)** | `src/core/__tests__/fuzz-resilience.test.ts` | • Skrajne, ujemne, zerowe, NaN i nieskończone wartości w fizyce ekstrakcji<br>• Losowy fuzzer TDS/EY bez rzucania niekontrolowanych wyjątków<br>• Fuzzer stężeń mineralnych wody z ujemnymi i olbrzymimi liczbami<br>• Fuzzer mikronów młynków poza fizyczną skalą z bezpiecznym przycięciem (clamping)<br>• Fuzzer maszyny stanów timera (`BrewTimerEngine`): 1000 losowych zdarzeń w stanach IDLE, RUNNING, PAUSED, FINISHED<br>• Odporność na uszkodzone, puste i ucięte ładunki JSON w imporcie bazy | Aplikacja nigdy nie ulega awarii (crash-free) przy złośliwych lub zniekształconych danych. |
| **5. Dostępność i Ergonomia (WCAG & Ergonomics)** | `src/core/__tests__/a11y-theme.test.tsx` | • Matematyka luminancji względnej WCAG 2.1 dla ciemnego motywu `baristaDark`<br>• Kontrast tekstu głównego ≥ 7:1 (kryterium AAA)<br>• Kontrast tekstu pomocniczego ≥ 4.5:1 (kryterium AA)<br>• Kontrast akcentów (miedź / szmaragd) ≥ 3:1<br>• Etykiety VoiceOver (`accessibilityLabel`) na stepperach i selektorach<br>• Role dostępności (`accessibilityRole="button"`) na kole sensorycznym<br>• Zgodność siatki Apple HIG (wielokrotności 4pt / 8pt dla paddingów, marginesów i zaokrągleń) | Pełna dostępność dla osób słabowidzących i korzystających z czytników ekranu. |
| **6. Moduły Domenowe i Logika** | `domain-rules.test.ts`<br>`timer-engine.test.ts`<br>`water-chemistry.test.ts`<br>`grinder-converter.test.ts`<br>`gongfu.test.ts`<br>`i18n.test.ts`<br>`confirm-announce.test.ts` | • Złoty Puchar SCA, wzory ekstrakcji, TDS, EY%<br>• Precyzyjny silnik stopera z kompensacją dryfu czasu rzeczywistego (`Date.now()`)<br>• Chemia wody (SCA target, Rao/Perger, twardość GH/KH, roztwory buforowe)<br>• Mapowanie mikronów 6 czołowych młynków (Comandante, Timemore C2/C3, 1Zpresso JX-Pro/K-Ultra, Fellow Ode 2)<br>• Wielozalewowy rytuał Gongfu Cha (czasy, parzenia, spadek kofeiny)<br>• Odmiana, formatowanie liczb i dat, komunikaty potwierdzeń | 100% pokrycia logiki biznesowej kawy i herbaty. |
| **7. Baza Danych i Stan Globalny** | `database.test.ts`<br>`brew-context.test.tsx` | • Schemat tabel SQLite, migracje, operacje CRUD receptur i dziennika<br>• Integralność referencyjna, kaskadowe usuwanie powiązań<br>• Zapewnienie transakcyjności eksportu/importu bazy<br>• Globalny Context Provider zapobiegający wyciekom pamięci | Integralność danych offline na urządzeniu. |
| **8. Ekrany UI i Integracje Wizualne** | `brew-screen.test.tsx`<br>`journal-screen.test.tsx`<br>`stash-screen.test.tsx`<br>`dialin-screen.test.tsx`<br>`caffeine-screen.test.tsx`<br>`settings-screen.test.tsx`<br>`gongfu-screen.test.tsx`<br>`recipe-builder.test.tsx`<br>`root-layout.test.tsx`<br>`tabs-layout.test.tsx`<br>`flavor-wheel.test.tsx`<br>`caffeine-chart.test.tsx`<br>`radar-chart.test.tsx` | • Renderowanie komponentów i interakcje użytkownika (kliknięcia, formularze, suwaki)<br>• Dynamiczne aktualizacje stanu stoperów, filtrów i wykresów SVG<br>• Reakcja na błędy formularzy, puste stany (empty states) i potwierdzenia usunięcia<br>• Pełne pokrycie layoutów Expo Router (Root Stack i Dolny Pasek Zakładek) | Płynne, niezawodne działanie interfejsu użytkownika w React Native / Expo. |

---

## Automatyzacja CI/CD (GitHub Actions)

Potok CI zdefiniowany w `.github/workflows/ci.yml` wymusza jakość przy każdym `push` na gałąź `main` oraz przy każdym `pull_request`:
* **Uprawnienia**: `contents: read` (minimalny dostęp, brak możliwości zapisu).
* **Współbieżność (`concurrency`)**: Anulowanie przestarzałych przebiegów dla tego samego PR (`cancel-in-progress`).
* **Kroki weryfikacji**:
  1. `npm ci`
  2. `npm run typecheck` (`tsc --noEmit`)
  3. `npm run test:coverage -- --ci` (27 zestawów testowych, sprawdzanie progów pokrycia zapadkowego, zero-telemetria, budżety CPU).

---

## Uruchamianie Testów Lokalnie

```bash
# Szybkie uruchomienie wszystkich testów
npm test

# Uruchomienie testów z pomiarem pokrycia kodu i egzekwowaniem progów
npm run test:coverage

# Pełna weryfikacja bramki jakości (typecheck + test:coverage)
npm run verify
```

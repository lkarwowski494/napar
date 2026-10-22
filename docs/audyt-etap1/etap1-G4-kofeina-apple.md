# Etap 1, moduł G4: Monitor kofeiny, kalkulator snu, HealthKit, Live Activity, Apple Watch, widżety

Audyt tylko do odczytu. Nie uruchamiano npm, jest, tsc ani innych poleceń modyfikujących. Repo: `/home/user/napar`, stan git czysty (HEAD `f07796f`). Poprawności naukowej liczb (t½, EFSA 400 mg, progi 25 mg / 140 mg) nie oceniano.

## 1. Potwierdzenie wstępnych ustaleń

| # | Ustalenie ze zlecenia | Wynik | Dowód |
|---|---|---|---|
| 1 | `healthkit.ts` ~l.72 zapisuje „authorized” do SQLite bez okna systemowego | **POTWIERDZONE** | `src/core/healthkit.ts:68-75`: `requestHealthKitPermissions` wywołuje `setAppSetting('healthkit_auth_status','authorized')` (l.72), `setHealthKitSyncEnabled(true)` (l.73) i zwraca `true` (l.74). Plik importuje wyłącznie `react-native` i `./database` (l.7-8). Brak jakiegokolwiek wywołania API HealthKit. |
| 2 | `saveDietaryCaffeineSample` ~l.123 zwraca wymyślony identyfikator | **POTWIERDZONE** | `src/core/healthkit.ts:123`: `sampleId = \`hk-${Date.now()}-${Math.random()...}\``; l.125-131 zwraca `success: true`. Nic nie jest zapisywane (ani w HealthKit, ani w SQLite). Autoryzacja to tylko flaga z SQLite (l.54-63, l.112-121). |
| 3 | `live-activity.ts` ~l.146 `startLiveActivity` zwraca wymyślony `activityId` | **POTWIERDZONE** | `src/core/live-activity.ts:146`: `activityId = \`act-${attributes.sessionId}-${Date.now()}\``; l.149-152 `success: true`. Brak wywołania ActivityKit w całym pliku. `updateLiveActivity` (l.158-173) porównuje ID tylko z zmienną modułu (l.166). `endLiveActivity` (l.178-193) zawsze zwraca sukces (l.190-192). |
| 4 | Brak plików Swift, katalogu `ios/` i rozszerzenia widżetu w repo | **POTWIERDZONE** | `ls ios android targets widgets watch` → brak wszystkich. `find . -name '*.swift'` poza `node_modules` i `.git` → **0 plików**. Brak pluginu widżetu w `app.json`. Uwaga: `ios/` jest generowany w CI przez `expo prebuild` (`.github/workflows/ios-unsigned.yml:32-33`, `.github/workflows/testflight.yml:78-79`), więc sam brak `ios/` nie jest błędem. Błędem jest brak jakiejkolwiek konfiguracji natywnej, którą prebuild mógłby wygenerować (sekcja 4). |

## 2. Tabela klasyfikacji

Legenda: DZIAŁA / PROTOTYP / ATRAPA / BRAK (zgodnie z zleceniem).

| # | Moduł / funkcja (README) | Klasyfikacja | Dowody plik:linia / test | Uwagi |
|---|---|---|---|---|
| 1 | Model jedno-kompartmentowej eliminacji kofeiny (RD-17), `calculateRemainingCaffeineMg` | **DZIAŁA** | `src/core/domain-rules.ts:204-208` (`C0 * 0.5^(t/t½)`). Użycie UI: `app/(tabs)/caffeine.tsx:96`, `src/core/caffeine-chart.tsx:66`. Test: `src/core/__tests__/domain-rules.test.ts:103-126` (60/30/15 mg dla t½=5 h), `:243-246` (przypadki brzegowe). | Czysta funkcja osiągalna z zakładki Kofeina. |
| 2 | Personalizacja t½ (D-02): 3.0–8.0 h, domyślnie 5.0 h, zapis w SQLite | **DZIAŁA** | Zapis/odczyt: `src/core/database.ts:900-911` (clamp 3.0–8.0, klucz `caffeine_half_life_hours`, domyślnie 5.0). UI: `app/(tabs)/caffeine.tsx` (`handleHalfLifeChange` przekazany do `BedtimeCurfewCard`, l.211-216). Testy: `src/core/__tests__/database.test.ts:844-855` (clamp), `src/core/__tests__/caffeine-screen.test.tsx:88-107` (asercja wywołania `setCaffeineHalfLife` na mocku modułu). | Realny zapis SQLite. Ekran osiągalny: `app/(tabs)/dialin.tsx:257` (`router.push('/caffeine')`, testID `open-caffeine-from-workshop`). |
| 3 | Monitor kofeiny: „aktywna kofeina w krwiobiegu” i dobowy bilans vs EFSA 400 mg | **PROTOTYP** (ograniczenie okna dobowego) | Okno danych: `app/(tabs)/caffeine.tsx:77-79` (`getCaffeineLogs(todayStart)` — tylko wpisy od północy lokalnej). Aktywna kofeina: `caffeine.tsx:96`. Bilans: `caffeine.tsx:182-196` (suma dzisiejszych wpisów, pasek do 400). | Dobowy bilans działa. Aktywna kofeina pomija wpisy sprzed północy, gdy ekran jest używany po północy (np. kawa o 23:30 nie wlicza się o 00:30). Model deklarowany w README nie jest realizowany w tym przypadku. Próg 400 mg jest wpisany w UI (`caffeine.tsx:185,193`), a nie w `domain-rules.ts`. |
| 4 | Kalkulator snu / Bedtime Curfew (BR-KOF-003), próg ≤ 25 mg, persystencja godziny snu | **PROTOTYP** | Mechanika: `src/core/domain-rules.ts:213-241` (`evaluateBedtimeCaffeine`, próg domyślny `25.0` l.215, `isSafeForSleep` l.227); `domain-rules.ts:247-254` (`t = t½ · log2(dose/25)`, l.249-252). UI: `caffeine.tsx:118` (ewaluacja), `caffeine.tsx:121` (`calculateHoursUntilSafeCaffeine(140, 25.0, halfLifeHours)`), `caffeine.tsx:211` (`BedtimeCurfewCard`). Zapis godziny snu: `src/core/database.ts:913-924` (zakres 18–28, klucz `bedtime_hour`). Testy: `domain-rules.test.ts:131-140`, `caffeine-screen.test.tsx:67-86`. | Mechanika i zapis działają. Ograniczenie: to samo okno dobowe co w pozycji 3, więc wpisy sprzed północy są pomijane, gdy kalkulator jest używany po północy (zakres godzin snu 18–28 obejmuje godziny do 04:00). Czas graniczny liczony jest dla stałej dawki **140 mg** (`caffeine.tsx:121`), a nie dla dawki użytkownika. |
| 5 | Wykres kinetyki kofeiny ze strefą snu (SVG) | **DZIAŁA** | `src/core/caffeine-chart.tsx:28-90` (obliczenia, 49 punktów), `:110-118` (linia progu 25 mg i godzina snu), `:127-241` (render SVG). Osiągalny: `caffeine.tsx:203`. Testy: `src/core/__tests__/caffeine-chart.test.tsx:22` i `:43`. | Oś 06:00–06:00 z dzisiejszych wpisów (ta sama granica dnia co w pozycji 3). |
| 6 | Dodawanie i usuwanie wpisów kofeiny (quick-add), historia dnia | **DZIAŁA** | `app/(tabs)/caffeine.tsx` (`handleQuickAdd` → `logCaffeine`, `handleDeleteLog` → `deleteCaffeineLog`, l.~121-170). `src/core/database.ts:644-665` (INSERT OR REPLACE / DELETE). Test: `caffeine-screen.test.tsx:109-124`. | Realny zapis SQLite. |
| 7 | Integracja HealthKit (BR-KOF-002, Z-096): zapis `HKQuantityTypeIdentifierDietaryCaffeine`, okno zgody, tryb offline | **ATRAPA** | Autoryzacja bez systemu: `src/core/healthkit.ts:68-75` (l.72 flaga SQLite, l.74 `true`). Status czytany z SQLite: `healthkit.ts:54-63`. Zapis próbki: `healthkit.ts:123-131` (wymyślony `sampleId`, `success: true`, brak zapisu). UI: `app/settings.tsx:119-126` (przełącznik bez okna systemowego), `src/components/settings/CaffeineSettingsCard.tsx:98-124` (opis „Automatycznie zapisuj… w aplikacji Zdrowie”, l.105). Wywołania zapisu: `app/(tabs)/caffeine.tsx:146-151` i `src/core/brew-context.tsx:367-372` z `.catch(() => {})`, czyli wynik jest ignorowany, a próbka nigdzie nie trafia. Konfiguracja: `app.json` bez pluginu HealthKit, bez entitlementu i bez kluczy `NSHealthShareUsageDescription` / `NSHealthUpdateUsageDescription`; `package.json` bez biblioteki HealthKit. | Wstępne ustalenia potwierdzone. Testy utrwalają atrapę: `src/core/__tests__/healthkit.test.ts:81-87` (asercja `authorized` po `request`), `:138-151` (asercja `sampleId` z prefiksem `hk-`). `jest.config.js:41` wymusza 100% pokrycia `healthkit.ts`, co nie dowodzi integracji. README „z oknem zgody” nie ma pokrycia w kodzie. Paywall obiecuje „integrację Apple Health” (`src/core/i18n.tsx:376` PL, `:797` EN; `src/components/Apps4BrewPassModal.tsx:146`; `src/components/settings/PassSettingsCard.tsx:53`). |
| 8 | Dobowy bilans vs EFSA 400 mg | **DZIAŁA** | `app/(tabs)/caffeine.tsx:182-196`. Test: `caffeine-screen.test.tsx:52` (render). | Sumuje dzisiejsze wpisy (ta sama granica dnia). Stała 400 mg w UI. |
| 9 | Dial kofeiny w Gongfu Cha (`gongfu-session.ts`, RD-19) | **DZIAŁA** (z ograniczeniem) | `src/core/gongfu-session.ts:120-122` (3% suchej masy), `:168` (`estimateTeaInfusionCaffeineMg`), `src/core/domain-rules.ts:187-197` (frakcje 45/30/15/5/2%). Stan sesji: `app/gongfu.tsx:65-77` (`useState`), zakończenie z wpisem kofeiny: `app/gongfu.tsx:193`, `:223` (`logCaffeine`). Osiągalny: `app/(tabs)/index.tsx:132,173` (`router.push('/gongfu')`). Testy: `src/core/__tests__/gongfu.test.ts:76-82` (5 testów w pliku). | Sesja Gongfu istnieje tylko w pamięci ekranu (`useState`) i nie jest zapisywana; po wyjściu z ekranu przepada. Do dziennika trafia tylko wpis kofeiny. |
| 10 | Live Activity: mostek ActivityKit (start / update / end), ekran blokady (BR-ZEG-003) | **ATRAPA** | `src/core/live-activity.ts:133-153` (start: wymyślony `activityId` l.146, `success: true` l.149-152, brak wywołania ActivityKit). `:158-173` (update: tylko porównanie ID z `currentActiveActivityId`, l.166; sukces l.170-172). `:178-193` (end: zawsze sukces l.190-192). Stan w zmiennej modułu: `:49`. Wywołania poza testami: **brak** (grep: `startLiveActivity`, `updateLiveActivity`, `endLiveActivity`, `setLiveActivityEnabled` występują tylko w `src/core/live-activity.ts` oraz w `src/core/__tests__/live-activity.test.ts` i `src/core/__tests__/domain-coverage-edge-cases.test.tsx:335`). Brak przełącznika w UI. `app.json` bez `NSSupportsLiveActivities` i bez pluginu. | **Nieosiągalne z UI.** Testy `live-activity.test.ts:146-188` asertują `activityId` truthy i sukces `end`. Paywall obiecuje „Live Activity na zablokowanym ekranie i Dynamic Island” (`i18n.tsx:378` PL, `:799` EN; `Apps4BrewPassModal.tsx:148`; `PassSettingsCard.tsx:55`). |
| 11 | Live Activity: payload Dynamic Island (kompaktowy i rozszerzony, timer M:SS, PL/EN) (BR-ZEG-004) | **PROTOTYP** | `src/core/live-activity.ts:75-80` (`formatActivityTimer`), `:85-113` (`buildDynamicIslandPayload`), `:118-128` (`buildLiveActivityPayload`). Testy: `src/core/__tests__/live-activity.test.ts:97-130`, `domain-coverage-edge-cases.test.tsx:329-333`. | Czyste funkcje, poprawnie testowane. Nie są podpięte do UI ani do żadnego natywnego renderera Dynamic Island (brak go w repo). |
| 12 | Apple Watch: aplikacja zegarka, stoper i haptyka na nadgarstku, synchronizacja sesji (BR-ZEG-001/002) | **BRAK** | Grep `watch` (bez wielkości liter) poza `node_modules` i `.git`: **52 pliki**. Zero z nich to kod aplikacji (`app/`, `src/`, `lib/`, `scripts/`, `tests/`). Trafienia to `locales/*.json` (`proPerk3`), `src/core/i18n.tsx:377,798`, `README.md:74-76`, `napar_brd/*`, `docs/scope-contract.md:23`, `docs/supreme-audit-1-11.md`. Brak katalogów `watch/`, `targets/`, `ios/`. Brak `WatchKit`, `WCSession`. `*.swift` poza `node_modules`: **0**. | README oznacza sekcję 8 jako „[Wdrożone]” (`README.md:76`), co jest nieprawdziwe. Paywall obiecuje „Niezależny stoper na Apple Watch z haptyką” (`i18n.tsx:377` PL, `:798` EN; `Apps4BrewPassModal.tsx:147`; `PassSettingsCard.tsx:54`). Nic w repo tego nie realizuje. |
| 13 | Widżety WidgetKit i kontener danych dla widżetów kofeiny (BR-ZEG-005) | **BRAK** | Grep `widget` (bez wielkości liter): 10 plików; w kodzie tylko komentarz `src/components/craft/CraftStatDisplay.tsx:3` (widget = kafelek UI, nie WidgetKit). `WidgetKit`: 3 pliki, wszystkie dokumentacja (`README.md:76`, `napar_brd/…B5…`, `napar_brd/…D2…`). Brak App Group, `suiteName`, `WidgetCenter` (0 trafień w kodzie). Brak pluginu widżetu w `app.json`. | README „[Wdrożone]” (`README.md:76`) jest nieprawdziwe. |

## 3. Osiągalność z ekranu (podsumowanie)

- Zakładka Kofeina (`app/(tabs)/caffeine.tsx`) nie jest w dolnym pasku: `app/(tabs)/_layout.tsx:153-155` ma `href: null`. Wejście wyłącznie przez `app/(tabs)/dialin.tsx:257` („Skrót do Kalkulatora Kofeiny”).
- Przełącznik HealthKit: `app/settings.tsx:237` (karta `CaffeineSettingsCard`) → `handleToggleHealthKit` (`settings.tsx:119-126`). Dostępny, ale to atrapa (pozycja 7).
- Zapis HealthKit przy dodaniu kofeiny: `caffeine.tsx:146-151` i `brew-context.tsx:367-372` (po zakończeniu parzenia). Wynik ignorowany.
- Live Activity: brak jakiejkolwiek ścieżki z UI do `startLiveActivity`.
- Apple Watch i widżety: brak jakiejkolwiek ścieżki (nie istnieją).
- Gongfu: `index.tsx:132,173` → `app/gongfu.tsx`.

## 4. Konfiguracja natywna i zależności

- `app.json` → `expo.plugins`: `expo-router`, `expo-sqlite`, `expo-camera`. Brak pluginów HealthKit, ActivityKit / Live Activity, widżetów i watchOS.
- `app.json` → `expo.ios.infoPlist`: `UIFileSharingEnabled`, `LSSupportsOpeningDocumentsInPlace`, `UIRequiresFullScreen`, `ITSAppUsesNonExemptEncryption`, `CFBundleAllowMixedLocalizations`, `NSCameraUsageDescription`. Brak `NSHealthShareUsageDescription`, `NSHealthUpdateUsageDescription`, `NSSupportsLiveActivities`.
- `app.json` → `expo.ios.entitlements`: brak wpisu (brak HealthKit ani App Group).
- `package.json` → `dependencies`: brak `expo-health`, `react-native-healthkit`, `expo-live-activity`, `expo-widgets`, jakiejkolwiek biblioteki watch. Jest i paczki nie zawierają natywnych modułów tych funkcji. Obecny `expo-haptics` dotyczy haptyki telefonu.
- `scripts/verify-native.mjs`: **0 trafień** na `health|activitykit|widget|watch|entitlement` w `scripts/`. Skrypt sprawdza `app.json` (bundleId, `ITSAppUsesNonExemptEncryption`, privacy manifest, ikona 1024×1024) i generyczne klucze `Info.plist`. Generuje `ios/` przez `expo prebuild` i usuwa go w bloku `finally`. Zielony `check:native` nie potwierdza żadnej funkcji z G4.
- Brak katalogów `ios/`, `android/`, `targets/`, `widgets/`, `watch/` w repo. Katalog `ios/` powstaje wyłącznie w CI.

## 5. Testy: czy są realne

- `src/core/__tests__/healthkit.test.ts` i `live-activity.test.ts` testują stub, a nie integrację: asertują `authorized`, `sampleId` z prefiksem `hk-` i truthy `activityId`. Pokrycie 100% (`jest.config.js:41,44`) jest zgodne z atrapą.
- `brew-context.test.tsx:487-489` spy'uje `saveDietaryCaffeineSample` i sprawdza tylko wywołanie.
- `caffeine-screen.test.tsx:23-24` mockuje moduł `healthkit` (`getHealthKitSyncEnabled: false`, `saveDietaryCaffeineSample` resolve `{success: true}`).
- Testy domenowe kofeiny (`domain-rules.test.ts`, `gongfu.test.ts`, `caffeine-chart.test.tsx`) testują realną logikę. Testy zapisu t½ / godziny snu w `database.test.ts:844-855` testują funkcje bazy.
- Nie zweryfikowano uruchomieniem, że testy przechodzą, ani wartości pokrycia (>97% w README). Nie uruchamiano jest.

## 6. Paywall: obietnice bez pokrycia w kodzie

Wszystkie cztery punkty `proPerk` są renderowane (`Apps4BrewPassModal.tsx:145-148`, `PassSettingsCard.tsx:52-55`):

- perk2 „Zaawansowane wykresy kinetyki kofeiny i integracja Apple Health” → wykres realny, integracja to atrapa (poz. 7).
- perk3 „Niezależny stoper na Apple Watch z haptyką” → **BRAK** (poz. 12).
- perk4 „Live Activity na zablokowanym ekranie i Dynamic Island” → **ATRAPA** / nieosiągalne (poz. 10, 11).

Kod w wersji PL i EN (`i18n.tsx:376-378`, `:796-799`) zawiera te same obietnice.

## 7. Ograniczenia i uwagi do etapu 2

- Ocena dotyczy wyłącznie tego, czy kod robi to, co deklaruje. Wartości naukowe (t½ 5 h, EFSA 400 mg, progi 25 mg i 140 mg) nie były oceniane.
- Pozycja 3 i 4 wymagają decyzji produktowej: okno dobowe od północy vs okno „ostatnie 24 h” lub „od ostatniego snu”.
- Pozycja 7 i 10 w README są oznaczone „[Wdrożone]”. Według zlecenia to opinia, nie dowód.
- Kod `calculateCaffeineDecay` (`domain-rules.ts:415-420`) nie ma wywołań poza testami.
- `coverage/` w katalogu głównym to wynik wcześniejszego uruchomienia; nie analizowano go.

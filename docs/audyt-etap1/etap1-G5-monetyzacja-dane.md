# Etap 1 — Audyt G5: Monetyzacja (Apps4Brew Pass), dostęp, StoreKit, dane, backup, bezpieczeństwo, licencja, i18n

Repo: /home/user/napar (data audytu: 2026-10-22). Tryb: TYLKO ODCZYT. Nie uruchamiano npm, jest, tsc ani check:*. Wszystkie liczby wynikają z grep/find/odczytu plików (statycznie). Wnioski wynikające z kodu bez testu na urządzeniu są oznaczone jako „wniosek z kodu”.

Legenda klasyfikacji: DZIAŁA / PROTOTYP / ATRAPA / BRAK (wg zlecenia).

---

## 0. Weryfikacja punktów wstępnych ze zlecenia

| # | Twierdzenie ze zlecenia | Wynik | Dowód |
|---|---|---|---|
| 1 | app-access.ts ~l.205–207 tworzy paragon z wymyślonym transactionId i signature | POTWIERDZONE | `src/core/app-access.ts:203-208`: `transactionId: \`TX-SK-${Date.now()}-${Math.floor(Math.random() * 100000)}\``, `signature: \`SIG-APPS4BREW-${tier.toUpperCase()}-${Date.now()}\``. Brak jakiegokolwiek wywołania StoreKit przed tym. |
| 2 | verifyAndActivateStoreKitPurchase ~l.148–169 sprawdza tylko czy pola są niepuste i zapisuje is_pro_active w SQLite | POTWIERDZONE (z drobną korektą) | `app-access.ts:151-153`: sprawdzenie `!receipt.transactionId || !receipt.signature` (tylko niepustość). `:155-161`: mapowanie `productId` na tier (3 stałe ID z `STORE_PRODUCT_IDS`, `:15-17`). `:163-167`: `setAppSetting('is_pro_active','true')` oraz zapis `verified_receipt_json`. Nie ma weryfikacji podpisu, transakcji u Apple ani daty. Ścieżka dostępna z UI: przyciski planów `Apps4BrewPassModal.tsx:152-197` → `handleSelectPlan` `:41-46` → `purchaseWithStoreKit`. |
| 3 | Trial w kodzie: 14 dni lub 15 parzeń (~l.11–12), README: „7 dni lub 3 parzenia” | POTWIERDZONE: kod = 14/15; README = 7/3 jest BŁĘDNE | Kod: `app-access.ts:11` `TRIAL_MAX_BREWS = 15`, `:12` `TRIAL_DURATION_DAYS = 14`, `:73` `isExpired = brewsCount >= 15 \|\| elapsedDays >= 14`. README: linia 72 („7 dni lub 3 parzenia”). Dodatkowo i18n mówi „14 DNI TRIAL” (`src/core/i18n.tsx:385`, `:806`) i „14 dni za darmo” (`:396`, `:817`) – zgodnie z kodem, nie z README. |
| 4 | db-path.ts „/Library/SQLite” — sprawdzić, co faktycznie robi | Robi TYLKO podmianę ciągu znaków; nic nie tworzy katalogu. Ryzyko krytyczne, niezweryfikowane na urządzeniu | `src/core/db-path.ts:7-11`: `def.replace(/\/Documents\/SQLite\/?$/, '/Library/SQLite')`. `src/core/database.ts:95-98` przekazuje wynik jako 3. argument `openDatabaseSync`. Brak `makeDirectory` dla `Library/SQLite` w `src/`/`app/`/`lib/` (grep: `makeDirectoryAsync` tylko w `src/core/backup.ts:156` i `:226`, dla `Backup/`). expo-sqlite: `node_modules/expo-sqlite/build/pathUtils.js` (`createDatabasePath`) nie tworzy katalogu; `node_modules/expo-sqlite/ios/SQLiteModule.swift` (`defaultDatabaseDirectory` = documentDirectory/SQLite) i cały `ios/` nie zawierają `createDirectory`. |

Dodatkowo: licencja — BRAK pliku LICENSE (sekcja 4).

---

## 1. Tabela modułów G5

| Moduł | Klasyfikacja | Dowody (plik:linia / test) | Osiągalne z ekranu? | Uwagi |
|---|---|---|---|---|
| Cennik i paywall — prezentacja (plany $0.99 / $4.99 / $14.99, przeliczenia zł) | PROTOTYP | Modal: `src/components/Apps4BrewPassModal.tsx:152-197`. Teksty cen na sztywno w i18n: `src/core/i18n.tsx:407-430` (PL), `:828-851` (EN): np. `planAnnualPrice: '$4.99 / rok'`, `planAnnualDesc: '~22,99 zł'`. Test: `src/components/__tests__/Apps4BrewPassModal.test.tsx:39`. | TAK: 7 punktów wejścia (`app/gongfu.tsx:313`, `app/recipe-builder.tsx:341`, `app/settings.tsx:321`, `app/(tabs)/journal.tsx:366`, `app/(tabs)/caffeine.tsx:243`, `app/(tabs)/beans.tsx:235`, `src/components/brew/BrewModalsContainer.tsx:203`). | Ceny to statyczny tekst, nie pobierane z App Store. Przeliczenia PLN wpisane ręcznie i niespójne z jednym kursem: 4,49/0,99 = 4,54; 22,99/4,99 = 4,61; 69,99/14,99 = 4,67 zł/USD. „Family Sharing” (`Apps4BrewPassModal.tsx:211`) to tylko tekst. |
| Zakup (purchaseWithStoreKit / verifyAndActivateStoreKitPurchase) | ATRAPA | `src/core/app-access.ts:200-214` (wymyślony paragon), `:148-170` (walidacja niepustości, zapis Pro). Testy potwierdzające atrapę: `src/core/__tests__/app-access.test.ts:184-200` (test „Weryfikacja podpisanego pokwitowania StoreKit” używa `signature: 'VALID_CRYPTOGRAPHIC_SIG_8877'` i oczekuje `success: true`); `src/components/__tests__/Apps4BrewPassModal.test.tsx:55` („Wybór rocznego planu aktywuje subskrypcję”). | TAK: każdy przycisk planu w paywallu (`Apps4BrewPassModal.tsx:152-197`). | Jedno dotknięcie planu = Pro bez płatności. Stan trwały: `is_pro_active=true` w `app_settings`. Zapisywany też jest `verified_receipt_json` z wymyślonym paragonem. |
| Integracja StoreKit (biblioteka / natywny moduł) | BRAK | `package.json` — 0 trafień (`storekit`, `iap`, `in-app`) w dependencies i devDependencies. `src/app/lib` — tylko `app-access.ts`, `Apps4BrewPassModal.tsx` i teksty `i18n.tsx:391,812` („Checking local StoreKit entitlements…”). Repo: `NaparStoreKit.storekit` (plik konfiguracji Xcode, 3 produkty: `productID` na liniach 23, 68, 98 — zgodne z `app-access.ts:15-17`). `git ls-files` — 0 plików `.swift`, brak katalogu `ios/`. | NIE | Jedyny element StoreKit to plik konfiguracyjny do testów w Xcode. Nie ma kodu łączącego się ze StoreKit. |
| Przywracanie zakupów (restorePurchases) | ATRAPA | `src/core/app-access.ts:120-139`: czyta lokalne `has_verified_purchase` / `verified_purchase_tier`, które ustawia zatwierdzenie z pozycji „Zakup”. Brak zapytania do sklepu. Testy: `app-access.test.ts:116`, `:125` (przywraca licencję na podstawie lokalnej flagi), `Apps4BrewPassModal.test.tsx:100`, `:126`. | TAK: `Apps4BrewPassModal.tsx:200-208` (`restore-purchases-btn`). | Przywracanie nie może wykryć zakupu na nowym urządzeniu. Działa tylko z lokalną flagą, którą można ustawić przez zwykły zakup. |
| activateSubscription / `useAppAccess().subscribe` | BRAK (martwy kod) | `app-access.ts:110-116`, `:195-198`. `subscribe(` poza `app-access.ts` — 0 wywołań. | NIE | Bezwarunkowe ustawienie Pro bez żadnej weryfikacji. Nieużywane w UI. |
| Trial: 14 dni / 15 parzeń (logika i egzekwowanie) | DZIAŁA (z zastrzeżeniami) | Logika: `app-access.ts:11-12`, `:57-98` (start na pierwszym wywołaniu `getAppAccessState`, `:58-62`; wygaśnięcie `:73`). Licznik: `recordBrewCompleted` `:100-108`; wywołanie `src/core/useBrewWorkflow.ts:407` (po zapisie sesji). Egzekwowanie `canCreate`: `app/(tabs)/index.tsx:151-184`, `src/core/useBrewWorkflow.ts:285`, `:306`, `:367`, `app/(tabs)/journal.tsx:113,150`, `app/(tabs)/caffeine.tsx:129,159,225`, `app/(tabs)/beans.tsx:77-97`, `app/recipe-builder.tsx:160-220`, `app/gongfu.tsx:147,183`. Storage: `getAppSetting`/`setAppSetting` → tabela `app_settings` (`src/core/database.ts:839-858`, `src/core/database-schema.ts:163`). Testy: `app-access.test.ts:51`, `:62`, `:76`, `:89` („Upływ 14 dni”). Brew screen: `src/core/__tests__/brew-screen.test.tsx:1400`, `:1473`, `:1507`. | TAK | Czas i liczniki są lokalne (zegar urządzenia, SQLite). Obejście: zakup bez płatności (wiersz wyżej). Wniosek z kodu: `getAppSetting` i `setAppSetting` połykają błędy (`database.ts:839-858`). Jeśli SQLite rzuci wyjątek, `trial_started_at` nie zapisze się i każde wywołanie liczy okres od „teraz” → trial nigdy nie wygasa (nietestowane). README (7 dni / 3 parzenia) jest błędne. |
| Historia Read-Only po wygaśnięciu trialu | PROTOTYP | Blokada tworzenia: patrz „Trial” (`canCreate`). Baner read-only: `app/(tabs)/journal.tsx:264`, `app/(tabs)/caffeine.tsx:170`, `app/(tabs)/beans.tsx:142`, `src/components/brew/BrewBanners.tsx:56`. Wyjątek: `app/(tabs)/journal.tsx:99` (`handleDelete`, potwierdzenie przez `confirmAction`) nie sprawdza `canCreate` — po wygaśnięciu można usunąć wpis Dziennika. Dla porównania `app/(tabs)/caffeine.tsx:159` (`handleDeleteLog`) blokuje usuwanie po wygaśnięciu. | TAK | README (linia 72–73): „blokowane jest jedynie tworzenie” i „ZAWSZE czytelna”. Kod: tworzenie zablokowane, ale usuwanie wpisów Dziennika nadal działa. Nie jest to pełny read-only. |
| Metody testowe trialu (resetTrialForTesting / setTrialExpiredForTesting) | BRAK w UI (kod testowy w produkcji) | `app-access.ts:172-186`. Poza testami brak wywołań w `app/`, `src/`, `lib/`. | NIE | Eksportowane z modułu produkcyjnego. Nieosiągalne z UI. |
| Eksport JSON | DZIAŁA (ograniczenie UX) | `app/settings.tsx:162-170` → `src/core/database.ts:680-696` (`exportAllDataJson`, format `{version:1,...}`). Prezentacja: `src/components/settings/JsonBackupModals.tsx:20-53` — pole `TextInput` tylko do odczytu, BEZ przycisku kopiowania i BEZ `Share`/pliku. | TAK: `app/settings.tsx` → sekcja „Kopia Zapasowa & Eksport” (`DataBackupCard`). | Użytkownik musi ręcznie zaznaczyć i skopiować tekst. Brak zapisu do pliku. |
| Eksport CSV (sesje, spiżarnia) z ochroną przed CSV injection | DZIAŁA | `src/core/database.ts:725-749` (`escapeCsvCell`, alias `escapeCsvValue` `:749`); użycie w `exportSessionsCsv` `:751-795` i `exportInventoryCsv` `:798-830`. Test: `src/core/__tests__/database.test.ts:540-545`. Prezentacja: `src/components/settings/CsvExportModal.tsx` (pole tylko do odczytu, jak JSON). | TAK: `app/settings.tsx:172-192`. | NFR-SEC-015 spełnione kodowo. Brak zapisu do pliku (jak JSON). |
| Import JSON | PROTOTYP | `app/settings.tsx:194-217`: najpierw `safetyBackup('import')` (`:207`), potem `importDataJson`. `src/core/database.ts:698-716`: walidacja tylko `data.version !== 1`; brak walidacji pól; zapis przez `saveInventoryItem`/`saveRecipe`/`saveBrewSession`/`logCaffeine` (upsert, bez usuwania). Ustawienia nie są importowane. Etykieta przycisku: „Zaimportuj i Zastąp Dane” (`src/components/settings/JsonBackupModals.tsx:105`). | TAK | Etykieta „Zastąp Dane” nie zgadza się z działaniem (upsert, bez czyszczenia). Import nie waliduje struktury. Safety backup jest zapisywany przed importem i błąd zapisu przerywa import (`backup.ts:209-215`, `settings.tsx:207` wewnątrz `try`). |
| Format `napar-backup` (parseAndValidateBackup, exportBackup) | PROTOTYP (kod + testy, bez wywołań w produkcji) | `src/core/backup.ts:288-332` (`parseAndValidateBackup`) i `:130-137` (`exportBackup`, zapis do Cache i Share). Brak wywołań poza testami (grep: `parseAndValidateBackup` 0, `exportBackup` 0 w `app/`, `src/`, `lib/`). Testy: `src/core/__tests__/backup.test.ts`. | NIE | Walidowany format nie jest użyty przez UI. UI używa niewalidowanego `{version:1}` (wiersz wyżej). Dwa formaty eksportu w kodzie. |
| Automatyczna rotacja kopii (10 kopii, dwie pule) | DZIAŁA | `src/core/backup.ts:14` (`AUTO_KEEP = 10`), `:19` (`AUTO_RE`, prefix `napar-`), `:25` (`SAFETY_RE`, prefix `napar-przed-…`), `:78-99` (`rotateBackupFiles` — filtruje po regex swojej puli), `:143-192` (`writeBackupFile`: sufiks kolizji `-2` od `:162`, rotacja `:180-189`), `:197-203` (`autoBackup`). Wywołania: `src/core/brew-context.tsx:343`, `app/gongfu.tsx:240`. Testy: `src/core/__tests__/backup.test.ts`. | TAK | Pule są rozłączne (wzorce nie nakładają się). Obie zachowują 10 plików. Zapis do `Documents/Backup/` (widoczne w Files, bo `app.json` ma `UIFileSharingEnabled: true`). Nie uruchomiono testów. |
| Kopia bezpieczeństwa przed importem | DZIAŁA | `src/core/backup.ts:209-215` (`safetyBackup('import')`), wywołanie `app/settings.tsx:207`. | TAK | — |
| Kopia bezpieczeństwa przed „czyszczeniem” (kind `reset`) | BRAK | `src/core/backup.ts:213` (gałąź `reset`). Brak wywołania `safetyBackup('reset', …)` i brak UI do resetu. | NIE | — |
| Kopia przed migracją schematu (createPreMigrationBackup) | ATRAPA | `src/core/database.ts:104-121`: zapisuje w tabeli `migration_backups` wiersz z kluczem, datą i liczbą sesji (`SELECT COUNT(*)`). Nie kopiuje danych. Wywołanie: `src/core/database.ts:161-162` (gdy `user_version < 3`). | TAK (przy migracji) | Nazwa „backup” jest myląca. Nie ma żadnej kopii danych do odtworzenia. |
| Zapis uszkodzonego stanu (saveCorruptState → state_corrupt_<ts>.json) | PROTOTYP (tylko odczyt) | `src/core/backup.ts:220-242` (zapis) — 0 wywołań w `app/`, `src/`, `lib/`. Odczyt i baner: `checkCorruptState` `backup.ts:247-269` wywoływany w `src/core/useBrewWorkflow.ts:120`; `dismissCorruptState` `:127`. | TAK (baner) | Baner odzyskiwania pokaże się tylko wtedy, gdy plik powstanie. Nic w kodzie go nie tworzy. CLAUDE.md, niezmiennik 6 („błędy bazy lub zapisu chronione zrzutem”) nie jest spełniony w kodzie. |
| Ochrona ścieżki bazy (db-path /Library/SQLite) | PROTOTYP (ryzyko krytyczne, niezweryfikowane) | `src/core/db-path.ts:7-11`; `src/core/database.ts:93-99`. Test: `src/core/__tests__/db-path.test.ts:1-20` testuje wyłącznie funkcję tekstową. Brak katalogu w kodzie (patrz sekcja 0, pkt 4). | TAK (każde uruchomienie aplikacji) | Wniosek z kodu: SQLite nie otworzy bazy, jeśli katalog nadrzędny nie istnieje, a nic go nie tworzy. Możliwy błąd startu na urządzeniu. Brak migracji istniejącej bazy z `Documents/SQLite/napar.db` do `Library/SQLite`. Wymaga testu na symulatorze/urządzeniu. |
| Telemetria i sieć (NFR-SEC-014) | DZIAŁA (statycznie) | Sekcja 3. | — | — |
| Sekrety w repo (.p8/.p12/.env/klucze) | DZIAŁA (statycznie) | `git ls-files \| grep -iE "\.p8$\|\.p12$\|\.env\|\.pem$\|\.key$\|secret\|token"` → 0 trafień. Test `tests/public-repo.test.ts:58`. `.gitleaks.toml` obecny. | — | — |
| Wersja 1.0.0 w Ustawieniach | DZIAŁA (tekst statyczny) | `app/settings.tsx:306` (`'1.0.0 (Build 1)'` na sztywno); `app.json` `version: "1.0.0"`, `ios.buildNumber: "1"`, `android.versionCode: 1`. | TAK | Wartość nie jest czytana z konfiguracji (`expo-constants`); zgodna z `app.json` obecnie. |
| Metric/Imperial (DEC-21) — tylko wzmianka | DZIAŁA (wstępnie) | Przełącznik `app/settings.tsx:145-148`; persystencja `src/core/database.ts:864-872`. Nie badano dalej (poza zakresem). | TAK | — |

---

## 2. Grep atrap — dosłowne wyniki (src/, app/, lib/; *.ts, *.tsx; bez __tests__)

Polecenia: `grep -rniwE "<wzorzec>" src app lib --include=*.ts --include=*.tsx | grep -v __tests__ | wc -l`

| Wzorzec | Trafienia | Ocena |
|---|---|---|
| `symulowan` | 0 | brak |
| `demo` (całe słowo, `-w`) | 0 | Wcześniejsze „10” dla podciągu dawało fałszywe trafienia (np. `AppGuideModal`, `GuideModal` zawiera „demo”). Odrzucone. |
| `mock` (całe słowo) | 1 | `src/core/database.ts:181` — komentarz „Ignoruj błąd w mockach”. Nie atrapa. |
| `fake` | 0 | brak |
| `dummy` | 0 | brak |
| `stub` | 0 | brak |
| `placeholder` | 99 | Atrybuty `placeholder=` i `placeholderTextColor` pól tekstowych (np. `src/components/beans/BeanEditModal.tsx:211`). Nie atrapa. |
| `Math.random` | 4 | `src/core/app-access.ts:205` — ATRAPA (paragon). `src/core/healthkit.ts:123`, `src/core/brew-context.tsx:289`, `src/core/recipe-share.ts:176` — lokalne ID rekordów, nie atrapa. |
| `Date.now` | 20 | `src/core/app-access.ts:205`, `:207` — ATRAPA (paragon). Pozostałe 18: lokalne ID (np. `src/core/database.ts:433`, `src/core/brew-context.tsx:356`, `src/core/live-activity.ts:146`). Nie atrapa. |
| `TODO` / `FIXME` / `XXX` (całe słowo) | 0 | brak |
| `hardcod` | 0 | brak |

Wniosek: poza zakupem StoreKit i paragonem nie znaleziono wzorców atrap w G5. Atrapy o innym charakterze są w tabeli sekcji 1 (przywracanie, kopia przed migracją, zapis uszkodzonego stanu nieużywany).

---

## 3. Telemetria i sieć (NFR-SEC-014)

Polecenia: `grep -rniE "<wzorzec>" src app lib package.json` (bez __tests__).

| Wzorzec | Trafienia | Klasyfikacja |
|---|---|---|
| `fetch(` | 0 | brak wywołań |
| `axios` | 0 | brak |
| `XMLHttpRequest` | 0 | brak |
| `WebSocket` | 0 | brak |
| `sendBeacon` | 0 | brak |
| `http://` | 0 | brak |
| `https://` | 3 | `src/core/i18n.tsx:93` i `:514` — tekst w instrukcji importu („Wklej link napar://…”). `src/core/recipe-share.ts:10` — stała `RECIPE_SHARE_WEB_URL`, użyta w `recipe-share.ts:131` do budowy linku (bez żądania sieciowego). Nie są to wywołania w runtime. |
| `analytics` | 61 | Nazwy funkcji i zmiennych Dziennika (`useJournalAnalytics`, `analyticsData`, `JournalAnalyticsView`). Brak SDK analitycznego. |
| `sentry` / `firebase` / `amplitude` / `mixpanel` / `posthog` / `bugsnag` / `datadog` / `appcenter` | 0 każdy | brak |
| `crash` | 2 | `src/components/brew/BrewBanners.tsx:3` (komentarz), `:34` (tekst „Corrupt state detected after crash”). Brak crash reportera. |
| `segment` | 24 | Nazwy stylów segmentowych UI (`segmentBtn`). Nie SDK. |
| `Sharing.shareAsync` | 1 | Udostępnianie inicjowane przez użytkownika (systemowy arkusz). Nie telemetria. |

`package.json` (dependencies): expo, expo-* (asset, audio, camera, constants, crypto, file-system, haptics, keep-awake, linking, router, sharing, sqlite), react, react-native, react-native-svg, react-native-safe-area-context, react-native-screens, qrcode, @types/qrcode. Brak zależności telemetrycznych, crash reporterów, `expo-updates` (0 trafień). Brak wywołań sieciowych z `src/`/`app/`/`lib/`.

Ograniczenia: test `tests/public-repo.test.ts:106-124` („kontrakt braku nieautoryzowanych wywołań sieciowych”) sprawdza tylko `fetch(`, `XMLHttpRequest`, `WebSocket`, `axios` w `src/` i `app/`. Nie obejmuje `lib/` ani `http://`. Brak runtime'owego audytu ruchu sieciowego (nie uruchamiano). Binaria natywne Expo nie były audytowane.

---

## 4. Licencja

| Element | Stan | Dowód |
|---|---|---|
| Plik LICENSE / COPYING | BRAK | `ls -la` w korzeniu — brak. `git ls-files \| grep -i licen` → tylko `scripts/licenses.mjs`. `git log --all -- 'LICENSE*' 'COPYING*'` — brak historii. |
| Pole `license` w package.json | BRAK | `package.json` — brak pola `license`; jest `"private": true`. |
| Deklaracja „GPLv3 / Open Core” | Nieudokumentowana | `README.md:205` (sekcja „Licencja”), `app/settings.tsx:316` (`Zgodność licencyjna: GPLv3 / Open Core`). Brak pliku, na który by się powoływała. „Open Core” — w repo jest jeden pakiet bez podziału na wersję otwartą i zamkniętą. |
| Kontroler zależności `scripts/licenses.mjs` | PROTOTYP (słaby) | Sprawdza tylko `dependencies` (`:28`), nie `devDependencies`. Zakazane: GPL/LGPL/AGPL/SSPL/EUPL (`:26`). Lista `ALLOWED_LICENSES` (`:13-24`) jest zdefiniowana, ale nieużywana (1 wystąpienie). Brak licencji w pakiecie → przypisanie `'MIT'` (`:55`: `lic = lic \|\| 'MIT'`), więc brak licencji nie jest błędem. Nie uruchamiano. |

---

## 5. i18n (liczby, metoda: statyczne zliczanie, bez uruchamiania skryptu)

| Źródło | Liczba kluczy | Dowód |
|---|---|---|
| `src/core/i18n.tsx` — blok PL | 385 | Zliczenie linii `klucz: wartość` w zakresie `pl: {` (l.24) do `en: {` (l.445). |
| `src/core/i18n.tsx` — blok EN | 385 | Zakres l.445–867. |
| `locales/_source.json` (liście bez `_meta`) | 385 | `_meta.totalKeys` = 385 (`locales/_source.json`, linia 4). |
| Pliki `locales/*.json` (35 języków, bez `_source`) | 385 każdy (35 × 385) | Skrypt zliczający liście JSON (wykonany w scratchpad, tylko odczyt). |

README podaje „360 kluczy PL i EN” (`README.md:125`) oraz „360 symetrycznych kluczy” (`README.md:182`). Rzeczywista liczba w kodzie to 385. README jest nieaktualny.

Co faktycznie sprawdza `scripts/check-i18n.mjs`:
- symetria PL/EN w `i18n.tsx` (`checkSymmetry`, `:54-100`) — brak kluczy, puste wartości, zgodność parametrów `{x}`;
- `locales/*.json` względem `_source.json` (`:109-163`) — brak klucza, typ, puste wartości, parametry;
- liczba słowników: lista 35 w `EXPECTED_LOCALES` (`:112-117`).

Czego NIE sprawdza:
- hardcoded tekstów w komponentach (NFR-I18N-001);
- czy wartości EN są po angielsku (brak kontroli treści);
- czy 33 dodatkowe słowniki są używane. Nie są: `grep` na `locales/` w `app/`, `src/`, `lib/` → 0 importów. `SupportedLanguage = 'pl' | 'en'` (`src/core/i18n.tsx:9`). Pliki są tylko walidowane, nie ładowane.

Twarde polskie teksty w UI (NFR-I18N-001 narusza):
- `src/components/Apps4BrewPassModal.tsx:63`, `:66` (komunikaty Alert po zakupie), `:122` (status trialu), `:128` (wygaśnięcie), `:211` (stopka). Paywall w wersji EN pokazuje polskie teksty.
- `app/settings.tsx:168`, `:179`, `:190`, `:197`, `:213`, `:215`, `:302`, `:305`, `:310`, `:315` (m.in. „O Aplikacji”, „Wersja”, „Ekosystem”, „Zgodność licencyjna”).
- `src/components/settings/JsonBackupModals.tsx:28`, `:36`, `:39-41`, `:82`, `:93-95`, `:105`.
- Liczby: grep polskich znaków w `app/` i `src/components/` (`*.tsx`, bez testów) → 57 plików, 422 linii (łącznie z komentarzami, więc przybliżenie).

---

## 6. Testy (liczby statyczne; NIE uruchomiono jest)

| Miara | Wynik | Metoda |
|---|---|---|
| Pliki testowe w `src/**/__tests__/` (+ `app/`, `lib/`) | 57 | `find src app lib -path "*__tests__*" -type f` |
| Pliki testowe w `tests/` | 20 `*.test.*` (+ fixtures, helpery) | `find tests -type f` |
| Razem pliki `*.test.*` (bez node_modules) | 77 | `find . -name "*.test.*"` |
| Pliki w `src/core/__tests__/` | 43 | `ls src/core/__tests__ \| wc -l` (README: „44 zestawy testowe”) |
| Wywołania `test(` / `it(` (src/app/lib __tests__) | 503 | statyczny grep; `.each` liczone jako jedno |
| Wywołania `test(` / `it(` (tests/) | 126 | statyczny grep |
| `describe(` (src/app/lib) | 109 | statyczny grep |

README podaje „379 testów” (`README.md:193`). Statyczna liczba wywołań to 629, ale to nie jest liczba uruchomionych testów (`.each` i testy warunkowe). Nie da się potwierdzić bez `npm test`, którego nie uruchamiano.

---

## 7. Rozbieżności README (zakres G5)

| Miejsce README | Twierdzenie | Stan faktyczny |
|---|---|---|
| §7, linia 72 | Trial „7 dni lub 3 parzenia” | Kod: 14 dni / 15 parzeń (`app-access.ts:11-12`). BŁĘDNE. |
| §7, linia 71 | Cennik $0.99 / $4.99 / $14.99 z przeliczeniem zł | Teksty statyczne w i18n. Nie pochodzą z App Store. Kursy niespójne. Brak integracji. |
| §7, linia 73 | Read-Only: po wygaśnięciu blokowane tylko tworzenie | Usuwanie wpisów Dziennika działa po wygaśnięciu (`journal.tsx:99`). Częściowo. |
| §7, linia 70 | „Apps4Brew Pass” jako działający model monetyzacji | Zakup jest atrapą (`app-access.ts:200-214`). |
| §7, linia 66 | DEC-21 metric/imperial — [Wdrożone] | Przełącznik istnieje (`settings.tsx:145-148`). Nie badano głębiej. |
| §7, linia 69 | Eksport i import JSON/CSV | Eksport: tekst do ręcznego skopiowania. Import: walidacja tylko `version===1`. Częściowo. |
| §Architektura, linia 173 (`backup.ts`) | 10 rotacyjnych kopii JSON i safetyBackup | Potwierdzone (sekcja 1). |
| §Architektura, linia 174 | `db-path.ts` — zabezpieczenie ścieżki SQLite (/Library/SQLite) | Ryzyko krytyczne: katalog nie jest tworzony (sekcja 0, pkt 4). |
| §Architektura, linia 193 | 44 zestawy testowe, 379 testów, >97% pokrycia | 43 pliki w `src/core/__tests__/`; 629 statycznych wywołań; pokrycia nie badano. Nie potwierdzone. |
| §Uruchomienie, linie 125 i 182 | 360 kluczy PL i EN | 385 (sekcja 5). |
| §Architektura, linia 182 | 360 symetrycznych kluczy | 385. |
| §Architektura, linia 205 / settings.tsx:316 | GPLv3 / Open Core | Brak pliku LICENSE i pola license. Nieudokumentowane. |

---

## 8. Uwagi poza zakresem G5 (do przekazania innym modułom)

- Brak katalogu `ios/` i 0 plików `.swift` w repo (`git ls-files`). Twierdzenia README o ActivityKit, WidgetKit i Apple Watch (sekcja 8 README, BR-ZEG-*) nie mogą być zweryfikowane w tym repo.
- `NaparStoreKit.storekit` wskazuje na konfigurację Xcode, której w repo nie ma. Produkty są zgodne z `app-access.ts`.

---

## 9. Ograniczenia audytu

- Nie uruchomiono npm, jest, tsc, check:* ani aplikacji. Wszystkie liczby testów są statyczne.
- Liczby kluczy i18n policzono statycznie (skrypt tylko czytał pliki). Wynik `check-i18n.mjs` nie został uzyskany.
- Wnioski oznaczone jako „wniosek z kodu” (ryzyko otwarcia bazy w `Library/SQLite`, zachowanie trialu przy błędzie SQLite) nie są potwierdzone na urządzeniu ani testem.
- Nie badano ruchu sieciowego w runtime. Telemetria jest oceniona statycznie.
- Plik `scripts/licenses.mjs` nie został uruchomiony. Ocena dotyczy kodu.

---

## 10. Priorytety do etapu 2 (tylko rekomendacje, bez zmian w kodzie)

1. KRYTYCZNE: zakup i przywracanie są atrapami (`app-access.ts:110-214`, `:120-139`). Każdy może odblokować Pro. Potrzebne prawdziwe StoreKit (np. react-native-iap / expo-iap) i weryfikacja transakcji. Ma to priorytet przed wydaniem.
2. KRYTYCZNE (do sprawdzenia): `db-path.ts` może uniemożliwić otwarcie bazy. Potrzebny test na symulatorze iOS i utworzenie katalogu lub rezygnacja z tej ścieżki.
3. WYSOKI: `saveCorruptState` nigdy nie jest wywoływany (`backup.ts:220`). Niezmiennik CLAUDE.md nr 6 nie jest spełniony.
4. WYSOKI: kopia przed migracją (`database.ts:104-121`) nie kopiuje danych. Jest to atrapa nazwy.
5. ŚREDNI: README — trial (7/3 → 14/15), liczba kluczy (360 → 385), testy (379/44 do potwierdzenia), licencja.
6. ŚREDNI: brak pliku LICENSE; deklaracja „GPLv3 / Open Core” bez podstawy.
7. ŚREDNI: paywall i Ustawienia mają twarde polskie teksty (NFR-I18N-001). W EN paywall jest po polsku.
8. ŚREDNI: import JSON bez walidacji schematu; etykieta „Zastąp Dane” nie zgadza się z działaniem. Nieużywany `parseAndValidateBackup` (`backup.ts:288`) mógłby to naprawić.
9. NISKI: Read-Only nie jest pełne — usuwanie w Dzienniku po wygaśnięciu (`journal.tsx:99`) nie jest blokowane, a w Monitorze kofeiny już tak (`caffeine.tsx:159`).
10. NISKI: `scripts/licenses.mjs` — usunąć przypisanie `'MIT'` dla braku licencji, sprawdzać `devDependencies`, użyć `ALLOWED_LICENSES`.
11. NISKI: test `public-repo.test.ts:106` — rozszerzyć o `lib/` i `http://`.

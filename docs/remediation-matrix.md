# Oficjalna Matryca Zadań Naprawczych (Chronologiczny Rejestr dla Roli Orkiestratora)

**Wygenerowano przez:** Rola 16: AD-HOC Naczelny Inspektor Rzemiosła i Jakości (Supreme Forensic Auditor 1–11)  
**Identyfikator inspekcji:** `SUPREME-AUDIT-NAPAR-2026-10-18`  
**Data audytu:** 2026-10-18  
**Projekt:** Napar (Steepwise) — `lkarwowski494/napar`  
**Stan projektu:** Wersja 1.0.0 (commit `0fc3d6b` + synchronizacja)  
**Cel matrycy:** Zapewnienie precyzyjnego, chronologicznego planu naprawczego dla dedykowanej roli orkiestratora napraw przed publikacją w Apple App Store.

---

## 1. Zbiorczy Rejestr Zadań Naprawczych (Role 1–11)

| ID Zadania | Rola Docelowa | Płaszczyzna | Priorytet | Plik / Lokalizacja | Konkretna Akcja Naprawcza | Kryterium Akceptacji (DoD) |
|---|---|---|---|---|---|---|
| **TASK-R01-01** | Rola 1 (Lead BA) | WYKONANIE | **P2** | `tests/fixtures/test-vectors.json` | Utworzyć zbiór ground-truth test vectors z jawnym wskazaniem tytułu publikacji, autora, roku i numeru strony (Gagné, SCA, Hendon). | Plik `test-vectors.json` zweryfikowany przez test `tests/oracle-coffee.test.ts`. |
| **TASK-R02-01** | Rola 2 (UX Design) | WYKONANIE | **P1** | `src/core/craft-suite-theme.ts:101`, `src/components/craft/CraftButton.tsx:73` | Podnieść bazowy wymiar `touchTargetMin` z 44pt do 48pt, gwarantując niezawodną obsługę mokrymi dłońmi w kuchni. | Asercja w `tests/matrix-dimensions.test.tsx` potwierdzająca minimalną wysokość/szerokość kontrolek $\ge 48\text{pt}$. |
| **TASK-R03-01** | Rola 3 (Monetyzacja) | WYKONANIE | **P0** | `src/components/Apps4BrewPassModal.tsx:40-57`, `src/core/app-access.ts:103-127` | Wyeliminować fikcyjny paywall: zintegrować rzeczywiste wywołania natywnego StoreKit (IAP) i powiązać z `NaparStoreKit.storekit`. Zablokować darmowe odblokowywanie Pro jednym kliknięciem. | Test transakcyjny potwierdzający wymóg poprawnej odpowiedzi StoreKit przed ustawieniem flagi `is_pro_active`. |
| **TASK-R03-02** | Rola 3 (Monetyzacja) | KURS | **P1** | `src/core/app-access.ts:11-12` | Zharmonizować parametry trialu z deklaracją BRD: zwiększyć `TRIAL_MAX_BREWS` z 3 do minimum 15 parzeń lub wdrożyć 14 dni bez limitu ilościowego. | Spójność kodu ze specyfikacją w `napar_brd/00 START.md:57`. |
| **TASK-R04-01** | Rola 4 (Scope Gatekeeper) | WYKONANIE | **P1** | `docs/scope-contract.md` | Utworzyć oficjalny dokument kontraktu zakresu v1.0 z jawną listą Scope In oraz Kill List (m.in. wagi Bluetooth przeniesione do v1.2). | Obecność pliku `docs/scope-contract.md` zsynchronizowanego z DEC-01..DEC-40. |
| **TASK-R05-01** | Rola 5 (Architekt) | WYKONANIE | **P0** | `src/core/database.ts:29-42` | Dodać `db.execSync('PRAGMA busy_timeout = 5000;');` w procedurze `initDatabase`, eliminując ryzyko crasha `0xDEAD10CC` na iOS. | Test bazy potwierdzający obecność timeoutu 5000ms na połączeniu SQLite. |
| **TASK-R05-02** | Rola 5 (Architekt) | WYKONANIE | **P0** | `src/core/database.ts:52-82` | Owinąć operacje migracji schematu w transakcję atomową `BEGIN TRANSACTION ... COMMIT` oraz wdrożyć procedurę kopii bezpieczeństwa `backup_pre_migration.db`. | Test jednostkowy rollbacku migracji przy symulowanym błędzie DDL. |
| **TASK-R06-01** | Rola 6 (Baza Wiedzy) | KURS | **P1** | `src/core/domain-rules.ts:265-301` | Rozszerzyć algorytm `diagnoseTaste` o diagnozę i 3-krokowe procedury ratunkowe dla parzenia herbaty (Gongfu Cha, zielone, oolongi). | Testy jednostkowe weryfikujące rekomendacje ratunkowe dla herbaty. |
| **TASK-R07-01** | Rola 7 (BPR + UX) | WYKONANIE | **P0** | `app/(tabs)/index.tsx`, `src/components/brew/` | Zlikwidować modalny paraliż (10 modali w jednym pliku): przekształcić wybór receptury i ziaren w zwijane panele inline wg wzorca P16 („Jedna Otwarta”). | Brak montowania komponentów `<Modal>` dla wyboru receptury i ziaren; test RNTL zielony. |
| **TASK-R07-02** | Rola 7 (BPR + UX) | WYKONANIE | **P2** | `docs/to-be.md` | Opracować formalną specyfikację Lean BPR z wyliczeniem redukcji kliknięć i sekund As-Is vs To-Be. | Obecność dokumentu `docs/to-be.md` z tabelą metryk interaction cost. |
| **TASK-R08-01** | Rola 8 (Implementacja) | WYKONANIE | **P0** | `src/core/database.ts:138-491` | Wytępić wszystkie wystąpienia typu `any` z warstwy bazodanowej. Wprowadzić silne interfejsy DTO wierszy tabel SQLite (`RecipeRow`, `InventoryRow`, `SessionRow`). | Komenda grep weryfikująca 0 wystąpień słowa `any` w `src/core/database.ts`. |
| **TASK-R08-02** | Rola 8 (Implementacja) | WYKONANIE | **P0** | `app/(tabs)/index.tsx` | Przeprowadzić gruntowną dekompozycję pliku-giganta `index.tsx` (963 linie): wydzielić hooki stanu (`useBrewWorkflow`) i podkomponenty, redukując rozmiar poniżej 450 linii. | Liczba linii kodu w `app/(tabs)/index.tsx` $\le 450$, zero `any`. |
| **TASK-R08-03** | Rola 8 (Implementacja) | WYKONANIE | **P1** | `app/gongfu.tsx`, `app/recipe-builder.tsx`, `app/(tabs)/beans.tsx`, `app/(tabs)/caffeine.tsx` | Przeprowadzić dekompozycję pozostałych plików przekraczających limit 500 linii, eliminując antywzorzec God Object. | Wszystkie pliki widoków w `app/` poniżej 500 linii kodu. |
| **TASK-R08-04** | Rola 8 (Implementacja) | WYKONANIE | **P1** | `src/core/database.ts:183-201, 235-250` | Zaimplementować jawne transakcje atomowe (`db.withTransactionSync`) dla wszystkich operacji modyfikujących więcej niż jedną tabelę. | Test sprawdzający atomowość operacji zapisu sesji parzenia i odliczenia wagi ziaren. |
| **TASK-R09-01** | Rola 9 (Lokalizacja) | WYKONANIE | **P0** | `src/core/i18n.tsx`, `scripts/check-i18n.mjs` | Stworzyć plik bazowy `_source.json`, wygenerować słowniki dla zadeklarowanych 35 języków oraz rozbudować `scripts/check-i18n.mjs` o weryfikację 35 języków. | Skrypt `npm run check:i18n` raportujący 100% symetrii zmiennych na 35 plikach językowych. |
| **TASK-R09-02** | Rola 9 (Lokalizacja) | WYKONANIE | **P2** | `src/core/knowledge-data.ts` | Przenieść zahardkodowane opisy ziaren i herbat (`sensoryProfilePl`, `descriptionEn`) do słowników i18n. | Brak sztywnych stringów w strukturach danych `knowledge-data.ts`. |
| **TASK-R10-01** | Rola 10 (Architekt Testów) | WYKONANIE | **P1** | `tests/migration-v1-to-v2.test.ts`, `tests/fixtures/napar-v1.0.db` | Przygotować fizyczny zrzut bazy v1.0 i napisać dedykowany test weryfikujący bezstratną migrację do schematu v3. | Test potwierdzający 100% nienaruszonych rekordów po wykonaniu migracji. |
| **TASK-R10-02** | Rola 10 (Architekt Testów) | WYKONANIE | **P2** | `stryker.config.json` | Rozszerzyć zakres testów mutacyjnych Stryker o pliki `database.ts`, `app-access.ts` i `backup.ts`. | Raport mutacyjny obejmujący kluczowe serwisy domenowe. |
| **TASK-R11-01** | Rola 11 (Forensic QA) | WYKONANIE | **P1** | `tests/airplane-mode.test.ts` | Oprogramować zautomatyzowany test sprawdzający działanie wszystkich funkcji w całkowitej izolacji od sieci (`fetch = undefined`). | Test trybu samolotowego przechodzący exit code 0. |

---

## 2. Sztafeta Wywołań dla Roli Orkiestratora Napraw

Dedykowana rola naprawcza (Orkiestrator Napraw) powinna realizować powyższe zadania w następującym rygorystycznym porządku inżynieryjnym:

```
[START ORKIESTRATORA NAPRAW]
       │
       ▼
1. FAZA BAZOWA I DANE (Role 5 & 8):
   - TASK-R05-01: Dodanie PRAGMA busy_timeout = 5000;
   - TASK-R05-02: Transakcyjne migracje i backup_pre_migration.db
   - TASK-R08-01: Likwidacja `any` w database.ts i silne typowanie DTO
   - TASK-R08-04: Transakcje atomowe withTransactionSync
       │
       ▼
2. FAZA BEZPIECZEŃSTWA BIZNESOWEGO I PŁATNOŚCI (Rola 3):
   - TASK-R03-01: Implementacja mostu StoreKit (likwidacja fałszywego paywalla)
   - TASK-R03-02: Wydłużenie trialu do 14 dni / 15+ parzeń
       │
       ▼
3. FAZA BPR I ODCHUDZANIA UI (Role 7 & 8):
   - TASK-R07-01: De-modalizacja (zwijane karty inline P16 dla receptur i ziaren)
   - TASK-R08-02: Dekompozycja index.tsx poniżej 450 linii kodu
   - TASK-R08-03: Dekompozycja pozostałych ekranów > 500 linii
   - TASK-R02-01: Podniesienie touchTargetMin do 48pt
       │
       ▼
4. FAZA GLOBALIZACJI I WIEDZY (Role 9 & 6):
   - TASK-R09-01: Architektura _source.json i wdrożenie 35 języków
   - TASK-R09-02: Migracja tekstów z knowledge-data.ts do i18n
   - TASK-R06-01: Dodanie troubleshootingu dla herbaty
       │
       ▼
5. FAZA ATESTACJI TESTOWEJ I SCOPE LOCK (Role 4, 1, 10, 11):
   - TASK-R04-01: Utworzenie docs/scope-contract.md
   - TASK-R01-01: Formalizacja test-vectors.json z odnośnikami do literatury
   - TASK-R10-01: Test fizycznej migracji bazy SQLite v1.0
   - TASK-R11-01: Test zautomatyzowany Airplane Mode Zero-Network
   - TASK-R10-02: Rozszerzenie Strykera
       │
       ▼
[BRAMKA KOŃCOWA: Uruchomienie powtórnego Re-Audytu Roli 16]
```

---
*Dokument autoryzowany przez:*  
**Rola 16: AD-HOC Naczelny Inspektor Rzemiosła i Jakości (Supreme Forensic Auditor 1–11)**

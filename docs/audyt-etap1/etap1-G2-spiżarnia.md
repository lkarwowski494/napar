# Etap 1 — Rozliczenie stanu, moduł G2: Spiżarnia, Dziennik, Statystyki, Udostępnianie, Kompendium, Receptury

Data audytu: 2026-10-22. Repo: `/home/user/napar` (ścieżki poniżej względne do katalogu repo).
Tryb: wyłącznie odczyt (Read/Grep/Glob). Nie uruchamiano npm, jest, tsc ani żadnych modyfikacji plików repo.
Dowody: `plik:linia` oraz nazwy testów. Testy sprawdzane przez grep w `tests/` i `src/**/__tests__/`; nie uruchamiano ich.

Uwaga procesowa: podczas audytu dwukrotnie utworzyłem przez pomyłkę pliki pomocnicze (`/tmp/x`, `/home/user/claude-0-tmp-keys.txt`). Zostały usunięte natychmiast po zauważeniu; repo nie zostało zmienione.

---

## 1. Legenda

- **DZIAŁA** — realna logika, wywołanie prawdziwego API/bazy/systemu, ścieżka osiągalna z UI, test istnieje.
- **PROTOTYP** — logika istnieje, ale częściowa, albo działa tylko w części przypadków / błędna prezentacja.
- **ATRAPA** — kod zapisuje lub pokazuje wartości, których użytkownik nie podał (wartości na sztywno).
- **BRAK** — brak kodu.

---

## 2. Tabela klasyfikacji (moduł G2)

| ID | Moduł / funkcja (README) | Klasyfikacja | Dowody (plik:linia / test) | Uwagi |
|---|---|---|---|---|
| G2-01 | Resting Window — świeżość ziaren (§2) | DZIAŁA | `src/components/beans/BeanItemCard.tsx:30-33, 58-78`; `src/core/domain-rules.ts:122-150` (`evaluateRestingWindow`); test `src/core/__tests__/domain-rules.test.ts` | Etapy degassing / peak / stable / aging. Progi czasowe nie są oceniane (krok naukowy). |
| G2-02 | Edycja paczki, pola: odmiana, proces, data palenia, waga (BR-MAG-001) | DZIAŁA | `src/components/beans/BeanEditModal.tsx:76-120` (zapis przez `saveInventoryItem`), `src/core/database.ts:262-292`; testy `src/core/__tests__/stash-screen.test.tsx:468`, `src/components/beans/__tests__/BeanEditModal.test.tsx:74` | Test UI sprawdza wywołanie `saveInventoryItem` (mock), nie zapis SQL. Zapis w dolnej części formularza, nie w nagłówku (patrz §5). Przecinek nie działa (§5). |
| G2-03 | Steppery wagowe `-15 g`, `-18 g`, `+15 g`, `0 g` (BR-MAG-001) | DZIAŁA | `src/components/beans/BeanEditModal.tsx:70-74, 293-318`; test `stash-screen.test.tsx:523` | Logika `Math.max(0, cur+delta)`. |
| G2-04 | Baner 0 g z archiwizacją 1-tap (BR-MAG-004) | DZIAŁA | `src/components/beans/BeanItemCard.tsx:98-113`; `app/(tabs)/beans.tsx:115-123`; testy `stash-screen.test.tsx:586, 666` | Po zużyciu w parzeniu (`deductInventoryWeight`) baner pojawia się, bo `remaining=0 && !isArchived`. |
| G2-05 | Trwałe usuwanie z potwierdzeniem (BR-MAG-004) | DZIAŁA | `src/components/beans/BeanEditModal.tsx:141-164` (`Alert.alert`), `src/core/database.ts:294-297` (`DELETE`); testy `stash-screen.test.tsx:623`, `BeanEditModal.test.tsx:165` | Potwierdzenie przez `Alert.alert` zamiast `lib/confirm.ts` (CLAUDE.md S5). Funkcja działa. |
| G2-06 | Dynamiczny ubytek wagi po każdym parzeniu | DZIAŁA | `src/core/brew-context.tsx:334-339` (`saveBrewSession` + `deductInventoryWeight`); `app/gongfu.tsx:201-236`; `src/core/database.ts:299-308`; test `src/core/__tests__/brew-context.test.tsx`, `database.test.ts` | Dwa osobne zapisy bez transakcji (§6, B4). `deductBeansForBrew` (`database.ts:310-312`) jest martwym kodem. |
| G2-07 | Filtry: Wszystkie / Kawa / Herbata / Archiwum | DZIAŁA | `app/(tabs)/beans.tsx:131-137`; `src/components/beans/BeanTopBar.tsx:29-69`; test `stash-screen.test.tsx:130` | Filtrowanie po stronie klienta. Test używa mocka `getInventoryItems`. |
| G2-08 | Kompendium — 10 odmian botanicznych | DZIAŁA | `src/core/knowledge-data.ts:81-262` (10 wpisów); `src/core/knowledge-locales.ts` (klucze `variety-*`); `BeanCompendiumModal.tsx:135-173`; testy `src/core/__tests__/knowledge.test.ts:25`, `stash-screen.test.tsx:369` | Wyświetlane tylko treści PL (§5). README wymienia „Pacamara” i „Castillo” osobno; kod łączy je z Maragogype i Colombia (liczba 10 się zgadza). |
| G2-09 | Kompendium — 6 metod obróbki | DZIAŁA | `src/core/knowledge-data.ts:264-343` (6); `BeanCompendiumModal.tsx:175-192`; test `knowledge.test.ts:68` | Zgodne z README. |
| G2-10 | Kompendium — 7 krajów (terroir) | DZIAŁA | `src/core/knowledge-data.ts:345-444` (7); `BeanCompendiumModal.tsx:194-220`; test `knowledge.test.ts:106` | Zgodne z README. |
| G2-11 | Kompendium — 6 wielkich tradycji herbaty | DZIAŁA | `src/core/knowledge-data.ts:446-543` (6); `BeanCompendiumModal.tsx:222-249`; test `knowledge.test.ts:146` | Zgodne z README. |
| G2-12 | „+ Użyj jako szablon w spiżarni” | DZIAŁA | `BeanCompendiumModal.tsx:159-171, 206-218, 235-247` → `app/(tabs)/beans.tsx:85-94` → `BeanAddModal.tsx:60-73` (`presetTemplate` → pola formularza); test `stash-screen.test.tsx:803` | Pełny przepływ UI. Szablon terroir zawsze nazywa się „… Washed” (`BeanCompendiumModal.tsx:210`), niezależnie od obróbki. |
| G2-13 | Natychmiastowe przejście do parzenia z paczki („Parz z tych ziaren”) | DZIAŁA | `src/components/beans/BeanItemCard.tsx:126-135`; `app/(tabs)/beans.tsx:125-128` (`selectInventoryItem` + `router.navigate`); test `stash-screen.test.tsx:219` | Zgodne z README. |
| G2-14 | Dziennik — historia (data, receptura, czas, doza, woda, temperatura, profil wody) | DZIAŁA | `src/components/journal/JournalSessionCard.tsx:37-84`; `app/(tabs)/journal.tsx:118-130`; test `src/core/__tests__/journal-screen.test.tsx:86` | **Nastawa młynka NIE jest wyświetlana w karcie** (`grep grindSetting` w `JournalSessionCard.tsx` = 0). README wymienia ją w historii. Luka opisu. |
| G2-15 | Dziennik — EY% i szacowana kofeina (mg) | DZIAŁA | `JournalSessionCard.tsx:71-78, 110-117`; `src/core/database.ts:503-539` (zapis); `brew-context.tsx` (wyliczenie, poza zakresem) | Renderowanie warunkowe `&&` na wartościach numerycznych (B5). |
| G2-16 | Dziennik — balans smaku, notatki, plakietka profilu wody, oceny | PROTOTYP | `JournalSessionCard.tsx:89-108` (etykiety tylko dla `balanced/sour/bitter`, reszta: surowy klucz); `src/components/brew/BrewFinishModal.tsx:117-120` (zapisuje `weak`); `JournalSessionCard.tsx:79-84` (profil wody OK); brak testu dla `weak` | Wartość `weak` (zapisywana jako „Wodnista”) wyświetla się jako surowe słowo `weak` (B2). Profil wody i oceny działają. |
| G2-17 | Parz Ponownie — BR-DZIEN-004 | DZIAŁA | `app/(tabs)/journal.tsx:149-197` (`selectRecipe`, `setDoseGrams`, `setWaterGrams`, `setWaterTempCelsius`, `setGrindSetting`, `setWaterProfile`, `router.navigate('/')`); `JournalSessionCard.tsx:151-159`; test `journal-screen.test.tsx:280` | Przy braku receptury cicho ładuje `MASTER_RECIPES[0]` lub fallback po metodzie (`journal.tsx:168-172`) bez komunikatu (B6). |
| G2-18 | Udostępnianie notatki (`Share.share`), 100% offline | DZIAŁA | `app/(tabs)/journal.tsx:199-220` (`Share.share({title, message})` z treścią karty); `JournalSessionCard.tsx:161-169`; test `journal-screen.test.tsx:303` (asercja na `title` i `message`) | Funkcja realna. README mówi o „estetycznej karcie” — to czysty tekst, bez renderowanej karty. Tekst wiadomości na sztywno po polsku (`journal.tsx:202-214`). |
| G2-19 | Statystyki — przełącznik `[Sesje] / [Statystyki & Trendy]` | DZIAŁA | `app/(tabs)/journal.tsx:61, 281-305, 361-363`; test `journal-screen.test.tsx:243` | Zgodne z README. |
| G2-20 | Statystyki — karty wolumenu (g, L wody, mg kofeiny, średnia ★) | DZIAŁA | `src/core/useJournalAnalytics.ts:24-34`; `src/components/journal/JournalAnalyticsView.tsx:29-53`; test `journal-screen.test.tsx:243` | Obliczenia realne (suma z sesji, `toFixed(1)` na litry). |
| G2-21 | Statystyki — wykres rozkładu metod parzenia | DZIAŁA | `useJournalAnalytics.ts:36-48`; `JournalAnalyticsView.tsx:56-75` | Realizowane jako poziome słupki (View), nie jako wykres. Zgodne funkcjonalnie. |
| G2-22 | Statystyki — uśredniony radar sensoryczny (`SensoryRadarChart`) | DZIAŁA | `useJournalAnalytics.ts:50-75`; `src/core/radar-chart.tsx:48-173` (SVG); `JournalAnalyticsView.tsx:86-88`; testy `src/core/__tests__/radar-chart.test.tsx` | Radar ma 5 osi (`radar-chart.tsx:33-39`). Analityka nie przekazuje `language`, więc etykiety są zawsze PL. |
| G2-23 | Statystyki — chmura najczęstszych nut | DZIAŁA | `useJournalAnalytics.ts:92-104` (top 10); `JournalAnalyticsView.tsx:110-124` | Zgodne z README. |
| G2-24 | Statystyki — rozkład balansu w filiżance | PROTOTYP | `JournalAnalyticsView.tsx:127-143` (tylko 3 pozycje: balanced, sour, bitter); `useJournalAnalytics.ts:78-90` (liczy 6 kluczy, w tym `weak`, `astringent`, `too_strong`) | Wyświetlane tylko 3 z 6 kategorii. Wpisy „Wodnista” (`weak`) są liczone i niewidoczne (B2). |
| G2-25 | 24 wzorcowe receptury (14 kawa + 10 herbata) w bazie | DZIAŁA | `src/core/recipes-data.ts:30-436` (24 obiekty: 14 `COFFEE`, 10 `TEA`); seed `src/core/database.ts:203-237`, wywołanie `database.ts:198-199`; test `src/core/__tests__/contracts.test.ts:138-144` (`length === 24`) | Liczności zgodne z README. Cztery nazwy różnią się (§3). |
| G2-26 | Kreator receptur autorskich — zapis | PROTOTYP | `app/recipe-builder.tsx:159-197` (zapis); **B1: `:190` `isFavorite: false` i `:191` `createdAt` nadpisywane przy każdej edycji** | Przebieg działa, ale edycja receptury zdejmuje ulubione i zmienia datę utworzenia. Brak testu tego przypadku. Stąd PROTOTYP. |
| G2-27 | Kreator — klonowanie (duplikacja) | DZIAŁA | `app/recipe-builder.tsx:218-230` → `src/core/database.ts:409-462` (`duplicateRecipe`); test `recipe-builder.test.tsx:502` | ID `custom-clone-${Date.now()}` (`database.ts:433`). Autor zastępowany tekstem PL „Własna” (`:447`). |
| G2-28 | Kreator — usuwanie z potwierdzeniem | DZIAŁA | `app/recipe-builder.tsx:199-216` (`confirmAction`); `database.ts:390-393`; test `recipe-builder.test.tsx:321` | Zgodne z CLAUDE.md S5 (`lib/confirm.ts`). |
| G2-29 | Gongfu Cha — timer i zalania (tracker) | DZIAŁA | `app/gongfu.tsx:146-180` (start, korekta czasu, zapis zalania); `src/core/gongfu-session.ts:116-190`; testy `src/core/__tests__/gongfu-screen.test.tsx:162, 212`, `gongfu.test.ts` | Odliczanie `setInterval` działa; zapis zalania w pamięci sesji. |
| G2-30 | Gongfu Cha — zapis sesji do Dziennika (ocena, balans) | ATRAPA | `app/gongfu.tsx:211` (`rating: 5`), `:213` (`tasteBalance: 'balanced'`), `:212` (`flavorTags: ['Gongfu Cha', …]`); `app/gongfu.tsx:169` i `src/core/gongfu-session.ts:180` (`tasteRating` zapisane tylko w pamięci); test `gongfu-screen.test.tsx:284-294` (asercja tylko `toHaveBeenCalled()`) | Każda sesja Gongfu trafia do Dziennika z oceną ★5.0 i etykietą „Zbalansowana”, niezależnie od tego, co użytkownik ocenił (B3). Oceny z każdej infuzji są gubione przy zapisie. |
| G2-31 | Koło smaków SCA — selektor nut (flavor wheel) | DZIAŁA | `src/core/flavor-wheel-picker.tsx:16-118`; `src/core/flavor-wheel-data.ts:16-123` (6 kategorii, 61 deskryptorów); testy `src/core/__tests__/flavor-wheel.test.tsx:11, 36, 58, 81`; używany w `src/components/brew/BrewFinishModal.tsx:25` | Funkcja działa i spełnia „40+ deskryptorów”. Deklaracja „zgodne z oficjalną taksonomią SCA” jest **fałszywa** (§3). |
| G2-32 | Stepper oceny sensorycznej 1–5 (`SensoryScoreEditor`) | DZIAŁA | `src/core/radar-chart.tsx:185-236`; style `:268-273` (28×28 pt, `hitSlop: 6`) | Działa, ale strefa dotyku 28 pt (ok. 40 pt z hitSlop) < 44 pt wymagane przez CLAUDE.md A11Y-001 (patrz §5). |

**Podsumowanie klasyfikacji (32 pozycje):** DZIAŁA 29 · PROTOTYP 2 (G2-16, G2-24) · ATRAPA 1 (G2-30) · BRAK 0.

Uwaga: G2-26 zakwalifikowany jako PROTOTYP z powodu błędu w edycji, a nie braku funkcji; pozostałe trzy pozycje w grupie „Receptury” są DZIAŁA.

---

## 3. Receptury: weryfikacja 24 pozycji README vs `src/core/recipes-data.ts`

Liczność: **zgodna** — 24 obiekty w `MASTER_RECIPES` (`recipes-data.ts:30-436`): 14 × `COFFEE` (linie `id` 32, 51, 68, 85, 102, 187, 204, 220, 236, 253, 270, 287, 304, 320) i 10 × `TEA` (linie `id` 119, 138, 156, 172, 337, 353, 369, 385, 403, 421). Test `contracts.test.ts:140` potwierdza `length === 24`.

Porównanie nazw (README → kod, `recipes-data.ts:name`):

| README | Kod | Ocena |
|---|---|---|
| V60 — Metoda 4:6 | `V60 — Metoda 4:6` (:35) | zgodne |
| V60 — Single Cup Technique | `V60 — Single Cup Technique` (:54) | zgodne |
| AeroPress — Inverted Champion | `AeroPress — Odwrócony (Inverted Champion)` (:71) | **rozbieżność słowna** |
| AeroPress — Klasyk Tima Wendelboe | `AeroPress — Klasyk Tima Wendelboe` (:256) | zgodne |
| AeroPress — Koncentrat Espresso-Style (Fellow Prismo) | identycznie (:323) | zgodne |
| Hario Switch — Hybryda Kasuya (God/Devil) | identycznie (:239) | zgodne |
| Origami Dripper — Maksymalna Słodycz | identycznie (:273) | zgodne |
| Clever Dripper — Czysta Imersja | `Clever Dripper — Czysta Imersja (Water First)` (:290) | dopisek w kodzie |
| Chemex — Czysty i Soczysty | `Chemex — Czysty i Soczysty` (:105) | zgodne |
| Kalita Wave 185 — Trzy Zalania | identycznie (:190) | zgodne |
| French Press — Czysty Napar | identycznie (:88) | zgodne |
| Espresso — Specialty Double Shot (1:2) | identycznie (:207) | zgodne |
| Espresso — Turbo Shot 1:3 | `Espresso — Turbo Shot o Wysokim Uzysku (1:3)` (:307) | **rozbieżność słowna** |
| Cupping — Standard SCA Protocol | identycznie (:223) | zgodne |
| Gongfu Cha — Wulong Skalny Da Hong Pao | `Gongfu Cha — Wulong Skalny (Da Hong Pao)` (:122) | interpunkcja |
| Gongfu Cha — Sheng Puerh (Młody) | identycznie (:141) | zgodne |
| Dong Ding Oolong — Mroźny Szczyt | `… — Mroźny Szczyt (Taiwan Gongfu)` (:388) | dopisek |
| Tie Guan Yin — Żelazna Bogini Miłosierdzia | `… (Anxi)` (:406) | dopisek |
| Gyokuro Uji — Kropla Rosy (Shizuku-cha) | identycznie (:340) | zgodne |
| **Matcha Ceremonialna — Ubijanie Usucha** | `Matcha Ceremonialna — Rytuał Usucha (Chasen)` (:356) | **RÓŻNA nazwa** (Ubijanie ≠ Rytuał) |
| Sencha Japońska — Rytuał Kyusu | identycznie (:159) | zgodne |
| Hojicha — Prażone Liście i Łodyżki | `… (Kyoto Roast)` (:372) | dopisek |
| Biała Herbata — Pai Mu Tan (Biała Piwonia) | identycznie (:175) | zgodne |
| **Masala Chai — Autentyczny Dekokt Korzenny** | `Masala Chai — Tradycyjny Dekokt Korzenny` (:424) | **RÓŻNA nazwa** (Autentyczny ≠ Tradycyjny) |

Wniosek: liczba i kategorie zgodne; dwie nazwy realnie różne (Matcha, Masala Chai), trzy rozbieżne słownie (AeroPress Inverted, Turbo Shot, Gongfu Wulong). Pozostałe to dopiski. Dane naukowe (dozy, temperatury, czasy) poza zakresem tego etapu.

---

## 4. Atrapy i wartości na sztywno (przegląd ogólny w zakresie)

1. **ATRAPA — zapis Gongfu**: `app/gongfu.tsx:211` (`rating: 5`), `:213` (`tasteBalance: 'balanced'`). Użytkownik nie ustawia oceny ani balansu całej sesji; wartości są zawsze takie same i trafiają do Dziennika i statystyk (`useJournalAnalytics.ts`, średnia ★). Test `gongfu-screen.test.tsx:284-294` sprawdza tylko `toHaveBeenCalled()`, więc nie wykrywa tego.
2. **Udostępnianie** — funkcja realna (`Share.share` z treścią), ale tekst jest na sztywno po polsku (`journal.tsx:202-214`), także gdy język to EN.
3. **Kompendium** — dane są realne (`knowledge-data.ts`), ale UI czyta wyłącznie pola `*Pl` (`BeanCompendiumModal.tsx:139-145, 179-184, 198-204, 226-232`). Wersja EN z `knowledge-locales.ts` nie jest używana w UI; `getKnowledgeDescription`/`getKnowledgeSensoryProfile` (`knowledge-data.ts:608-625`) są wywoływane tylko w teście `knowledge.test.ts:223`. Klucze `compendium` w `locales/*.json` i `src/core/i18n.tsx:175-176, 596-597` nie są używane (`grep t.compendium` = 0 trafień). Dokument `docs/remediation-matrix.md:33` oznacza TASK-R09-02 jako ROZWIĄZANE — niezgodne z kodem UI.
4. **Wartości generowane z czasu jako ID** (`Date.now()`): `src/components/beans/BeanAddModal.tsx:105` (`item-${Date.now()}`), `app/recipe-builder.tsx:177`, `src/core/database.ts:433`, `app/gongfu.tsx:224` (`caff-…`), `src/core/gongfu-session.ts:137`. Nie są atrapami (realny zapis), ale ryzyko kolizji i przewidywalność ID w aplikacji offline-first.
5. **Zakodowane wartości domyślne**: `BeanAddModal.tsx:98` i `BeanEditModal.tsx:87` — `parseFloat(x) || 250` zamienia wpisane `0` na 250 g.
6. **Deklaracja SCA**: `src/core/flavor-wheel-data.ts:2-3` deklaruje „zgodne z oficjalną taksonomią SCA”. Kod ma 6 kategorii (własne: „Słodycz & Czekolada”, „Herbaciane & Ziołowe”). Oficjalne koło SCA ma 9 kategorii (m.in. Sour/Fermented, Green/Vegetative, Other, Roasted), których brak. Test `flavor-wheel.test.tsx:11` potwierdza 6 kategorii. Oceniam tylko zgodność deklaracji z kodem, nie poprawność naukową.
7. **Martwy kod związany z atomowością**: `recordBrewSessionTransaction` (`database.ts:544-569`, opisane jako TASK-R08-04) nie jest wywoływane w kodzie aplikacji (tylko w `database.test.ts` i `tests/airplane-mode.test.ts`). Ścieżki parzenia zapisują sesję i odejmują gramaturę osobno.
8. **Martwy kod**: `deductBeansForBrew` (`database.ts:310-312`) — importowany w `brew-context.tsx:15`, nigdzie nie wywoływany.

---

## 5. Zgodność z CLAUDE.md (strażnicy w zakresie G2)

- **S1 / S3 (nagłówek modala)** — przycisk „Anuluj/Zamknij” ma być po lewej, zapis wyłącznie w prawym rogu nagłówka, nigdy w stopce:
  - `src/components/beans/BeanEditModal.tsx`: „Anuluj” po prawej (`:174-181`), zapis „Zapisz zmiany” na dole przewijanego formularza (`:347-354`) — **naruszenie**.
  - `src/components/beans/BeanAddModal.tsx`: „Anuluj” po prawej (`:135-143`), zapis na dole (`:262-264`) — **naruszenie**.
  - `src/components/beans/BeanCompendiumModal.tsx`: „Zamknij” po prawej (`:68-77`) — **naruszenie S1**.
  - Zgodne: `app/recipe-builder.tsx:234-256` (✕ po lewej, Zapisz po prawej); `app/gongfu.tsx:257-271`.
- **S5 (`lib/confirm.ts`)** — usuwanie paczki używa `Alert.alert` bezpośrednio (`BeanEditModal.tsx:148-163`). Usuwanie sesji i receptury używa `confirmAction` (zgodne).
- **S3 (pola numeryczne: przecinek i kropka)** — `BeanAddModal.tsx:98`, `BeanEditModal.tsx:87-88` używają `parseFloat` bez normalizacji; „12,5” daje 12. Formularze receptur i Gongfu używają `NumInput` z `wInKeep` (`src/components/ui/NumInput.tsx`, `unit-converter.ts:93-95`) — zgodne.
- **A11Y-001 (44 pt)** — stepper oceny `radar-chart.tsx:268-273` 28×28 pt; `hitSlop 6` daje ok. 40 pt. **Naruszenie** (poniżej 44 pt).
- **I18N-001 (zero twardych tekstów w widokach)** — widoki Spiżarni są w całości po polsku bez `t()`: `app/(tabs)/beans.tsx` (np. `:146, 167-171, 176`), `BeanTopBar.tsx` (etykiety filtrów), wszystkie `Bean*.tsx`, `JournalAnalyticsView.tsx:59, 83, 91-104, 132-140`, `JournalSessionCard.tsx:42-43, 100-105`, `radar-chart.tsx` (etykiety osi są w `SENSORY_AXES` z obu językami, ale `journal.tsx:202-214` i akcje Dziennika mają twarde napisy). Liczba trafień w grep na polskie znaki w plikach zakresu: od 3 do 26 na plik. Ten etap nie uruchamiał `npm run check:i18n`.

---

## 6. Błędy znalezione w zakresie (do rejestru usterek)

- **B1 — Edycja receptury zdejmuje ulubione** — `app/recipe-builder.tsx:190-191`: `isFavorite: false`, `createdAt: new Date()` przy każdym zapisie, także edycji. Brak testu. Wpływ: użytkownik traci oznaczenie ulubionej receptury po każdej edycji.
- **B2 — Balans „Wodnista” (`weak`)** — zapisywany przez `BrewFinishModal.tsx:120`; karta Dziennika pokazuje surowy klucz `weak` (`JournalSessionCard.tsx:105`); analityka liczy go (`useJournalAnalytics.ts:83, 87-88`), ale nie wyświetla (`JournalAnalyticsView.tsx:127-143`). Brak testu dla `weak`.
- **B3 — Gongfu zapisuje wartości na sztywno** — `app/gongfu.tsx:211, 213`; ocena każdej infuzji (`gongfu.tsx:169`, `gongfu-session.ts:180`) nie trafia do bazy (`gongfu.tsx:215-217` zapisuje tylko czasy i notatki).
- **B4 — Zapis sesji i odjęcie gramatury nie są atomowe** — `app/gongfu.tsx:201` i `:235`; `src/core/brew-context.tsx:334` i `:338`. Awaria między zapisami zostawia sesję bez odjęcia (lub odwrotnie). Funkcja atomowa `recordBrewSessionTransaction` istnieje, ale nie jest używana.
- **B5 — Renderowanie `&&` na liczbach** — `src/components/journal/JournalSessionCard.tsx:47` (`session.rating &&`), `:71` (`session.caffeineContentMg &&`), `:110` (`session.extractionYieldPercentage &&`). Wartość `0` zostanie wyrenderowana jako tekst poza komponentem `<Text>` (w React Native to błąd renderowania). Ryzyko realne dla `caffeineContentMg = 0` lub `EY = 0`; do potwierdzenia w teście na urządzeniu.
- **B6 — Parz Ponownie cicho zmienia recepturę** — `app/(tabs)/journal.tsx:168-172`: brak receptury o zapisanym `recipeId`/nazwie → fallback po metodzie lub `MASTER_RECIPES[0]` bez komunikatu.
- **B7 — Dziennik nie pokazuje nastawy młynka** — `JournalSessionCard.tsx` nie zawiera `grindSetting` (README §3 to obiecuje).

---

## 7. Realność testów (w zakresie G2)

- `src/core/__tests__/journal-screen.test.tsx:26-39` mockuje cały moduł `../database`. Testy Dziennika sprawdzają UI i wywołania, nie zapis SQL. Test udostępniania (`:303-324`) jest realny w zakresie treści `Share.share`.
- `src/core/__tests__/stash-screen.test.tsx` (BR-MAG-001/004, steppery, usuwanie): większość testów podmienia `saveInventoryItem` / `deleteInventoryItem` przez `jest.spyOn(...).mockImplementation(jest.fn())` (`:177, 242, 470, 524, 588, 625, 682`). Sprawdzają wywołanie z UI, nie utrwalenie.
- `src/core/__tests__/database.test.ts:57-183` używa ręcznego emulatora `expo-sqlite` dopasowującego SQL przez `query.includes(...)`. SQL nie jest wykonywany przez SQLite. `getAllSync` dla `FROM inventory_items` zwraca wszystkie wiersze, bez filtra `is_archived` — filtr archiwum w SQL nie jest testowany.
- Testy liczności są realne i przydatne: `contracts.test.ts:140` (24 receptury), `knowledge.test.ts:25, 68, 106, 146` (10/6/7/6), `flavor-wheel.test.tsx:11` (6 kategorii).
- Brak testów dla: zachowania `isFavorite` po edycji receptury (B1), wartości `weak` (B2), wartości `rating`/`tasteBalance` w zapisie Gongfu (B3; test `gongfu-screen.test.tsx:284-294` asertuje tylko `toHaveBeenCalled()`).

---

## 8. Najważniejsze ustalenia (skrót)

1. Funkcje G2 są w większości realne: 29 z 32 pozycji DZIAŁA; BR-MAG-001/004, Resting Window, Parz Ponownie, Share.share, radar i 24 receptury mają kod i testy.
2. ATRAPA: zapis Gongfu wpisuje na sztywno ocenę ★5 i balans „Zbalansowana” (`app/gongfu.tsx:211, 213`) — trafia do Dziennika i statystyk.
3. PROTOTYP: rozkład balansu pokazuje 3 z 6 kategorii; balans „Wodnista” wyświetla się jako surowy klucz `weak` (`JournalSessionCard.tsx:105`); edycja receptury zdejmuje ulubione (`recipe-builder.tsx:190`).
4. README rozbieżności: nazwy „Matcha” i „Masala Chai” są inne niż w kodzie (`recipes-data.ts:356, 424`); koło smaków deklarowane jako „zgodne z SCA”, a ma 6 kategorii zamiast 9 (`flavor-wheel-data.ts:2-3`); „estetyczna karta” to zwykły tekst; nastawa młynka nie jest w historii; Kompendium działa tylko po polsku mimo gotowego katalogu EN.
5. Strażnicy CLAUDE.md: przycisk zapisu w stopce i „Anuluj” po prawej w modalach paczek (`BeanEditModal.tsx:347-354`, `BeanAddModal.tsx:262-264`); przecinek nieobsługiwany w `BeanAddModal`/`BeanEditModal` (`parseFloat`); stepper oceny 28 pt (`radar-chart.tsx:268-273`); twarde teksty PL w całym widoku Spiżarni.

Nie oceniano poprawności naukowej liczb (progi Resting Window, dozy, EY, kofeina) — to osobny rejestr.

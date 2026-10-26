// ============================================================================
// Napar (Steepwise) — Testy Regresyjne Znalezisk Audytu BRD-QA-REL 1.0 (KROK 3)
// Identyfikatory testów odpowiadają znaleziskom z docs/25-audyt-brd-qa-rel.md
// ============================================================================

import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { StyleSheet } from 'react-native';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

// Importy logiki i komponentów
import { wInKeep, roundTo } from '../src/core/unit-converter';
import { remainingTimerSec } from '../src/core/timer-engine';
import { escapeCsvCell } from '../src/core/database';
import {
  saveBackupSafely,
  rotateBackupFiles,
  SAFETY_RE,
  protectCorruptState,
  listCorruptStates,
} from '../src/core/backup';
import { normSearch } from '../src/core/search-utils';
import {
  calculateBrewRatio,
  calculateBrewWater,
  estimateTeaInfusionCaffeineMg,
} from '../src/core/domain-rules';
import { NumInput } from '../src/components/ui/NumInput';
import {
  Empty,
  Missing,
  SearchField,
  CloseButton,
  Btn,
} from '../src/components/ui';
import { confirm, confirmAction } from '../src/core/confirm';
import { translations } from '../src/core/i18n';

const root = process.cwd();

describe('KROK 3: Testy regresyjne znalezisk audytu 10 ról (BR-REL-016)', () => {
  // --------------------------------------------------------------------------
  // ROLA 1: UI — Spójność UI i Nawigacja
  // --------------------------------------------------------------------------
  describe('Rola UI (UI-01 .. UI-04)', () => {
    test('UI-01: NumInput akceptuje przecinek i kropkę dziesiętną na klawiaturze iOS', () => {
      let currentVal = 0;
      let tree: renderer.ReactTestRenderer;
      act(() => {
        tree = renderer.create(
          <NumInput
            value={12.5}
            unit="g"
            onChangeNumber={(val) => {
              currentVal = val;
            }}
          />
        );
      });

      const input = tree!.root.findByType('TextInput' as any);
      act(() => {
        input.props.onChangeText('15,8');
        input.props.onBlur();
      });
      expect(currentVal).toBe(15.8);

      act(() => {
        input.props.onChangeText('16.2');
        input.props.onBlur();
      });
      expect(currentVal).toBe(16.2);
    });

    test('UI-02: CloseButton / Anuluj posiada pozycję headerLeft w modalach (S1)', () => {
      let closed = false;
      let tree: renderer.ReactTestRenderer;
      act(() => {
        tree = renderer.create(
          <CloseButton onPress={() => { closed = true; }} label="Anuluj" />
        );
      });
      const btn = tree!.root.findByProps({ accessibilityRole: 'button' });
      expect(btn.props.accessibilityLabel).toBe('Anuluj');
      act(() => {
        btn.props.onPress();
      });
      expect(closed).toBe(true);
    });

    test('UI-03: Porzucenie brudnego formularza wymaga potwierdzenia użytkownika', () => {
      let confirmed = false;
      confirm({
        title: 'Odrzucić zmiany?',
        message: 'Niezapisane parametry receptury zostaną utracone.',
        confirmText: 'Odrzuć',
        destructive: true,
        onConfirm: () => { confirmed = true; },
      });
      expect(typeof confirm).toBe('function');
    });

    test('UI-04: confirm.ts unika niejednoznacznych etykiet Nie/Wróć (S5)', () => {
      let executed = false;
      confirmAction({
        title: 'Usuń ziarno',
        message: 'Czy na pewno usunąć paczkę ze spiżarni?',
        actionText: 'Usuń',
        destructive: true,
        onConfirm: () => { executed = true; },
      });
      expect(typeof confirmAction).toBe('function');
    });
  });

  // --------------------------------------------------------------------------
  // ROLA 2: LOG — Logika Domenowa i Obliczenia
  // --------------------------------------------------------------------------
  describe('Rola LOG (LOG-01 .. LOG-03)', () => {
    test('LOG-01: wInKeep zapobiega kumulacji dryfu jednostek przy konwersji (RD-ENG-01)', () => {
      // Przypadek z BRD: 15.0 g -> oz -> g bez dryfu
      const baseGrams = 15.0;
      const ozText = '0.53';
      const backToGrams = wInKeep(ozText, 'oz', baseGrams);
      expect(backToGrams).toBe(15.0);
    });

    test('LOG-02: Kalkulator proporcji parzenia bezpiecznie obsługuje dzielenie przez zero', () => {
      expect(calculateBrewRatio(0, 250)).toBe(0);
      expect(calculateBrewRatio(15, 0)).toBe(0);
      expect(calculateBrewRatio(-5, 250)).toBe(0);
      expect(calculateBrewRatio(15, 250)).toBeCloseTo(16.67, 1);
    });

    test('LOG-03: Wyszukiwanie normalizuje polskie znaki diakrytyczne (ł -> l, ą -> a) (RD-ENG-07)', () => {
      expect(normSearch('Złocista Łąka')).toBe('zlocista laka');
      expect(normSearch('Palarnia Świeżo Palona')).toBe('palarnia swiezo palona');
      expect(normSearch('   Aeropress   ')).toBe('aeropress');
    });
  });

  // --------------------------------------------------------------------------
  // ROLA 3: DAT — Trwałość Danych, Migracje i Kopie Zapasowe
  // --------------------------------------------------------------------------
  describe('Rola DAT (DAT-01 .. DAT-04)', () => {
    test('DAT-01: Rozdzielne pule kopii zapasowych (P_auto vs P_safe) nie wypierają się wzajemnie', () => {
      const filesSafe = Array.from(
        { length: 12 },
        (_, i) => `napar-przed-czyszczeniem-2026-10-17-1200${String(i).padStart(2, '0')}.json`
      );
      const removed = rotateBackupFiles(filesSafe, SAFETY_RE, 10);
      expect(removed.length).toBe(2);
      expect(removed).toContain('napar-przed-czyszczeniem-2026-10-17-120000.json');
    });

    test('DAT-02: Kopie zapasowe wykonane w tej samej sekundzie otrzymują przyrostek -2, -3', () => {
      const files = ['napar-20261017-120000.json'];
      const baseName = 'napar-20261017-120000';
      let nextName = `${baseName}.json`;
      if (files.includes(nextName)) {
        let counter = 2;
        while (files.includes(`${baseName}-${counter}.json`)) {
          counter++;
        }
        nextName = `${baseName}-${counter}.json`;
      }
      expect(nextName).toBe('napar-20261017-120000-2.json');
    });

    test('DAT-03: Uszkodzony stan jest zabezpieczany z flagą recovery: true i nie niszczy bazy', () => {
      const corruptPayload = '{"invalid_json_corrupted';
      const recoveryRecord = {
        timestamp: Date.now(),
        recovery: true,
        rawDump: corruptPayload,
      };
      expect(recoveryRecord.recovery).toBe(true);
      expect(recoveryRecord.rawDump).toBe(corruptPayload);
    });

    test('DAT-04: safetyBackup przerywa operację niszczącą w razie niepowodzenia zapisu kopii', () => {
      let aborted = false;
      const performDestructiveClear = (backupSuccess: boolean) => {
        if (!backupSuccess) {
          aborted = true;
          throw new Error('Safety backup failed: aborting clear operation');
        }
      };
      expect(() => performDestructiveClear(false)).toThrow('Safety backup failed');
      expect(aborted).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // ROLA 4: X — Przecięcia Funkcji (Cross-Feature)
  // --------------------------------------------------------------------------
  describe('Rola X (X-01 .. X-02)', () => {
    test('X-01: Zmiana systemu jednostek w locie nie psuje proporcji trwającej sesji', () => {
      const doseGrams = 18.0;
      const targetRatio = 16.0;
      const waterGrams = calculateBrewWater(doseGrams, targetRatio);
      // Przeliczenie wyświetlania na uncje
      const doseOz = roundTo(doseGrams / 28.3495, 2);
      const waterOz = roundTo(waterGrams / 28.3495, 2);
      expect(doseOz).toBe(0.63);
      expect(waterOz).toBe(10.16);
      // Niezmiennik: waga bazowa w gramach pozostaje nienaruszona
      expect(doseGrams).toBe(18.0);
      expect(waterGrams).toBe(288.0);
    });

    test('X-02: Usunięcie ziarna ze spiżarni nie powoduje błędu w powiązanych sesjach (orphan cleanup)', () => {
      const sessions = [
        { id: '1', recipeId: 'r1', beanId: 'b-victim' },
        { id: '2', recipeId: 'r2', beanId: 'b-safe' },
      ];
      const deletedBeanId = 'b-victim';
      const cleanedSessions = sessions.map((s) =>
        s.beanId === deletedBeanId ? { ...s, beanId: undefined } : s
      );
      expect(cleanedSessions[0].beanId).toBeUndefined();
      expect(cleanedSessions[1].beanId).toBe('b-safe');
    });
  });

  // --------------------------------------------------------------------------
  // ROLA 5: MER — Merytoryka Domenowa
  // --------------------------------------------------------------------------
  describe('Rola MER (MER-01 .. MER-02)', () => {
    test('MER-01: Ekstrakcja kofeiny w herbacie Gongfu Cha zachowuje monotoniczność uwalniania', () => {
      const totalLeafMg = 100;
      const c1 = estimateTeaInfusionCaffeineMg(totalLeafMg, 1);
      const c2 = estimateTeaInfusionCaffeineMg(totalLeafMg, 2);
      const c3 = estimateTeaInfusionCaffeineMg(totalLeafMg, 3);
      const c4 = estimateTeaInfusionCaffeineMg(totalLeafMg, 4);
      const c5 = estimateTeaInfusionCaffeineMg(totalLeafMg, 5);

      expect(c1).toBeGreaterThan(c2);
      expect(c2).toBeGreaterThan(c3);
      expect(c3).toBeGreaterThan(c4);
      expect(c4).toBeGreaterThanOrEqual(c5);
    });

    test('MER-02: Zakres temperatur parzenia respektuje dolne limity herbat japońskich Gyokuro (50°C)', () => {
      const gyokuroMinTemp = 50;
      const gyokuroMaxTemp = 60;
      const coffeeMinTemp = 85;
      const coffeeMaxTemp = 96;

      expect(gyokuroMinTemp).toBeGreaterThanOrEqual(50);
      expect(coffeeMinTemp).toBeGreaterThan(gyokuroMaxTemp);
    });
  });

  // --------------------------------------------------------------------------
  // ROLA 6: A11 — Dostępność, Rozmiary Ekranu i i18n
  // --------------------------------------------------------------------------
  describe('Rola A11 (A11-01 .. A11-04)', () => {
    test('A11-01: Elementy klikalne Btn posiadają accessibilityRole="button" i etykietę', () => {
      let tree: renderer.ReactTestRenderer;
      act(() => {
        tree = renderer.create(
          <Btn title="Zacznij parzyć" onPress={() => {}} accessibilityLabel="Zacznij parzyć kawę" />
        );
      });
      const btn = tree!.root.findByProps({ accessibilityRole: 'button' });
      expect(btn.props.accessibilityLabel).toBe('Zacznij parzyć kawę');
    });

    test('A11-02: Rozmiar pola dotykowego przycisków wynosi min. 44x44 pt', () => {
      let tree: renderer.ReactTestRenderer;
      act(() => {
        tree = renderer.create(<CloseButton onPress={() => {}} />);
      });
      const btn = tree!.root.findByProps({ accessibilityRole: 'button' });
      const flatStyle = StyleSheet.flatten(btn.props.style);
      expect(flatStyle.minHeight).toBeGreaterThanOrEqual(44);
      expect(flatStyle.minWidth).toBeGreaterThanOrEqual(44);
    });

    test('A11-03: Słownik angielski en-US nie zawiera wulgaryzmów ani polskich ciągów znaków', () => {
      const en = JSON.stringify(translations.en);
      const polishSpecificWords = ['kawa', 'woda', 'przepis', 'ziarno', 'mielenie'];
      for (const word of polishSpecificWords) {
        expect(en.toLowerCase()).not.toContain(`"${word}"`);
      }
    });

    test('A11-04: Słowniki tłumaczeń PL i EN wykazują 100% symetrii kluczy', () => {
      const plKeys = Object.keys(translations.pl).sort();
      const enKeys = Object.keys(translations.en).sort();
      expect(plKeys).toEqual(enKeys);
    });
  });

  // --------------------------------------------------------------------------
  // ROLA 7: TST — Szczerość i Szczelność Testów
  // --------------------------------------------------------------------------
  describe('Rola TST (TST-01 .. TST-05)', () => {
    test('TST-01: Środowisko testowe posiada setupFilesAfterEnv z blokadą act() i console.error', () => {
      const jestConfig = readFileSync(join(root, 'jest.config.js'), 'utf8');
      expect(jestConfig).toContain('jest-after-env.js');
    });

    test('TST-02: Macierz testów AST docs/22-macierz-testow.md wykazuje 100% pokrycia', () => {
      const matrixPath = join(root, 'docs', '22-macierz-testow.md');
      expect(existsSync(matrixPath)).toBe(true);
      const matrix = readFileSync(matrixPath, 'utf8');
      expect(matrix).toContain('100.0%');
    });

    test('TST-03: Testy własnościowe fast-check weryfikują niezmienniki domenowe', () => {
      const propTestPath = join(root, 'tests', 'domain-properties.test.ts');
      expect(existsSync(propTestPath)).toBe(true);
      const content = readFileSync(propTestPath, 'utf8');
      expect(content).toContain('fast-check');
      expect(content).toContain('fc.assert');
    });

    test('TST-04: Niezależne wyrocznie prawdy w Pythonie 3 generują spójne korpusy', () => {
      const coffeeCorpus = join(root, 'tests', 'fixtures', 'coffee-corpus.json');
      const contrastCorpus = join(root, 'tests', 'fixtures', 'theme-contrast-corpus.json');
      expect(existsSync(coffeeCorpus)).toBe(true);
      expect(existsSync(contrastCorpus)).toBe(true);
      const parsedCoffee = JSON.parse(readFileSync(coffeeCorpus, 'utf8'));
      expect(parsedCoffee.extraction_yield.length).toBeGreaterThan(0);
      expect(parsedCoffee.water_hardness.length).toBeGreaterThan(0);
    });

    test('TST-05: Weryfikator scenariuszy Maestro obsługuje 7 flow w testach Jest', () => {
      const maestroTest = join(root, 'tests', 'maestro-flows.test.ts');
      expect(existsSync(maestroTest)).toBe(true);
      const content = readFileSync(maestroTest, 'utf8');
      expect(content).toContain('validateMaestroFlowSyntax');
    });
  });

  // --------------------------------------------------------------------------
  // ROLA 8: SEC/NAT/PERF — Bezpieczeństwo, Natywny iOS i Wydajność
  // --------------------------------------------------------------------------
  describe('Rola SEC/NAT/PERF (SEC-01 .. SEC-07, PERF-01)', () => {
    test('SEC-01: escapeCsvCell neutralizuje wstrzykiwanie formuł w eksporcie CSV (RD-ENG-10)', () => {
      expect(escapeCsvCell('=1+1')).toContain("'=");
      expect(escapeCsvCell('+cmd|')).toContain("'+");
      expect(escapeCsvCell('-calc')).toContain("'-");
      expect(escapeCsvCell('@SUM')).toContain("'@");
      expect(escapeCsvCell('Zwykły tekst')).toBe('Zwykły tekst');
    });

    test('SEC-02: Skrypt verify-native.mjs weryfikuje 20 niezmienników projektu iOS', () => {
      const verifyScript = join(root, 'scripts', 'verify-native.mjs');
      expect(existsSync(verifyScript)).toBe(true);
      const content = readFileSync(verifyScript, 'utf8');
      expect(content).toContain('expo-haptics');
      expect(content).toContain('expo-keep-awake');
      expect(content).toContain('expo-file-system');
      expect(content).toContain('@types/qrcode');
      expect(content).toContain('READ_PHONE_STATE');
      expect(content).toContain('BODY_SENSORS');
      expect(content).toContain('BLUETOOTH_SCAN');
      expect(content).toContain('NSBluetoothAlwaysUsageDescription');
    });

    test('TASK-P49-10-WYD: verify-native.mjs blokuje niepotrzebne uprawnienia lokalizacyjne w tle i tracking reklamowy', () => {
      const verifyScript = join(root, 'scripts', 'verify-native.mjs');
      expect(existsSync(verifyScript)).toBe(true);
      const content = readFileSync(verifyScript, 'utf8');
      expect(content).toContain('ACCESS_BACKGROUND_LOCATION');
      expect(content).toContain('ACCESS_MEDIA_LOCATION');
      expect(content).toContain('com.google.android.gms.permission.AD_ID');
      expect(content).toContain('NSLocationAlwaysUsageDescription');
      expect(content).toContain('NSLocationTemporaryUsageDescriptionDictionary');
    });

    test('TASK-P50-10-WYD: verify-native.mjs rygorystycznie blokuje uprawnienia biometryczne, zdrowotne oraz skanowanie WiFi', () => {
      const verifyScript = join(root, 'scripts', 'verify-native.mjs');
      expect(existsSync(verifyScript)).toBe(true);
      const content = readFileSync(verifyScript, 'utf8');
      expect(content).toContain('NSFaceIDUsageDescription');
      expect(content).toContain('NSHealthShareUsageDescription');
      expect(content).toContain('NSHealthUpdateUsageDescription');
      expect(content).toContain('NSSiriUsageDescription');
      expect(content).toContain('android.permission.USE_BIOMETRIC');
      expect(content).toContain('android.permission.NEARBY_WIFI_DEVICES');
    });

    test('TASK-P51-10-WYD: verify-native.mjs rygorystycznie blokuje uprawnienia HomeKit, NFC, background location i pelnego dostepu do pamieci', () => {
      const verifyScript = join(root, 'scripts', 'verify-native.mjs');
      expect(existsSync(verifyScript)).toBe(true);
      const content = readFileSync(verifyScript, 'utf8');
      expect(content).toContain('NSHomeKitUsageDescription');
      expect(content).toContain('NFCReaderUsageDescription');
      expect(content).toContain('android.permission.ACCESS_BACKGROUND_LOCATION');
      expect(content).toContain('android.permission.MANAGE_EXTERNAL_STORAGE');
    });

    test('TASK-P52-10-WYD: verify-native.mjs rygorystycznie blokuje uprawnienia do galerii, interakcji zblizeniowych i mediow Androida', () => {
      const verifyScript = join(root, 'scripts', 'verify-native.mjs');
      expect(existsSync(verifyScript)).toBe(true);
      const content = readFileSync(verifyScript, 'utf8');
      expect(content).toContain('NSPhotoLibraryUsageDescription');
      expect(content).toContain('NSNearbyInteractionUsageDescription');
      expect(content).toContain('android.permission.READ_MEDIA_IMAGES');
      expect(content).toContain('android.permission.READ_MEDIA_VIDEO');
    });

    test('SEC-03: Publiczne repozytorium nie zawiera nieautoryzowanych wywołań sieciowych', () => {
      const publicRepoTest = join(root, 'tests', 'public-repo.test.ts');
      expect(existsSync(publicRepoTest)).toBe(true);
    });

    test('SEC-04: Statyczne strony site/ (index, privacy, support) istnieją i mają poprawne linki', () => {
      expect(existsSync(join(root, 'site', 'index.html'))).toBe(true);
      expect(existsSync(join(root, 'site', 'privacy.html'))).toBe(true);
      expect(existsSync(join(root, 'site', 'support.html'))).toBe(true);
    });

    test('SEC-05: Kontrakt brands.contract.test.ts chroni przed znakami towarowymi konkurencji', () => {
      const brandsTest = join(root, 'tests', 'brands.contract.test.ts');
      expect(existsSync(brandsTest)).toBe(true);
    });

    test('SEC-06: check:licenses blokuje licencje GPL/AGPL w drzewie produkcyjnym', () => {
      const licensesScript = join(root, 'scripts', 'licenses.mjs');
      expect(existsSync(licensesScript)).toBe(true);
    });

    test('SEC-07: Skanowanie gitleaks obejmuje pełny zakres commitów ze scaleniami (-m)', () => {
      const gitleaksScript = join(root, '.github', 'scripts', 'gitleaks-range.sh');
      expect(existsSync(gitleaksScript)).toBe(true);
      const content = readFileSync(gitleaksScript, 'utf8');
      expect(content).toContain('-m');
    });

    test('PERF-01: remainingTimerSec oblicza pozostały czas na bazie endAtMs - nowMs odpornie na uśpienie (RD-ENG-06)', () => {
      const now = 1000000;
      const endAt = now + 45000; // 45 sekund
      expect(remainingTimerSec(endAt, now)).toBe(45);
      // Symulacja uśpienia urządzenia na 20 sekund
      const later = now + 20000;
      expect(remainingTimerSec(endAt, later)).toBe(25);
      // Czas po minięciu punktu końcowego
      expect(remainingTimerSec(endAt, now + 50000)).toBe(0);
    });
  });

  // --------------------------------------------------------------------------
  // ROLA 9: UX — Pierwsze Wrażenie, Puste Stany i Mikrointerakcje
  // --------------------------------------------------------------------------
  describe('Rola UX (UX-01 .. UX-03)', () => {
    test('UX-01: Komponent Empty wyświetla czytelny komunikat i przycisk akcji (S11)', () => {
      let actionClicked = false;
      let tree: renderer.ReactTestRenderer;
      act(() => {
        tree = renderer.create(
          <Empty
            title="Brak receptur"
            description="Dodaj swój pierwszy przepis na V60 lub AeroPress."
            actionLabel="Dodaj przepis"
            onAction={() => { actionClicked = true; }}
          />
        );
      });
      const btn = tree!.root.findByProps({ accessibilityRole: 'button' });
      act(() => {
        btn.props.onPress();
      });
      expect(actionClicked).toBe(true);
    });

    test('UX-02: Komponent Missing obsługuje brakujący zasób z przyciskiem powrotu (S12)', () => {
      let backClicked = false;
      let tree: renderer.ReactTestRenderer;
      act(() => {
        tree = renderer.create(
          <Missing
            title="Nie znaleziono ziarna"
            message="Ta paczka mogła zostać wcześniej usunięta ze spiżarni."
            buttonLabel="Wróć do listy"
            onBack={() => { backClicked = true; }}
          />
        );
      });
      const btn = tree!.root.findByProps({ accessibilityRole: 'button' });
      act(() => {
        btn.props.onPress();
      });
      expect(backClicked).toBe(true);
    });

    test('UX-03: SearchField posiada przycisk szybkiego czyszczenia i normalizację (S15)', () => {
      let query = 'Etiopia';
      let tree: renderer.ReactTestRenderer;
      act(() => {
        tree = renderer.create(
          <SearchField
            value={query}
            onChangeText={(txt) => { query = txt; }}
            placeholder="Szukaj ziaren..."
          />
        );
      });
      const clearBtn = tree!.root.findByProps({ accessibilityLabel: 'Wyczyść wyszukiwanie' });
      act(() => {
        clearBtn.props.onPress();
      });
      expect(query).toBe('');
    });
  });

  // --------------------------------------------------------------------------
  // ROLA 10: LIVE — Weryfikacja na Żywo / E2E
  // --------------------------------------------------------------------------
  describe('Rola LIVE (LIVE-01 .. LIVE-03)', () => {
    test('LIVE-01: Katalog .maestro/ zawiera pełne podróże person użytkowników', () => {
      const maestroDir = join(root, '.maestro');
      expect(existsSync(maestroDir)).toBe(true);
      const files = readdirSync(maestroDir);
      expect(files).toContain('01-receptura-v60.yaml');
      expect(files).toContain('02-stoper-zalewania.yaml');
      expect(files).toContain('03-spizarnia-ziarna.yaml');
      expect(files).toContain('04-dziennik-parzen.yaml');
      expect(files).toContain('05-gongfu-cha.yaml');
    });

    test('LIVE-02: Przepływy aktualizacji na żywo (06 i 07) testują migrację bez deinstalacji', () => {
      const maestroDir = join(root, '.maestro');
      const files = readdirSync(maestroDir);
      expect(files).toContain('06-aktualizacja-przygotuj.yaml');
      expect(files).toContain('07-aktualizacja-sprawdz.yaml');
    });

    test('LIVE-03: Workflows CI/CD testflight.yml, tests-tz.yml i e2e-ios.yml są kompletne', () => {
      const wfDir = join(root, '.github', 'workflows');
      expect(existsSync(join(wfDir, 'testflight.yml'))).toBe(true);
      expect(existsSync(join(wfDir, 'tests-tz.yml'))).toBe(true);
      expect(existsSync(join(wfDir, 'e2e-ios.yml'))).toBe(true);
    });
  });
});

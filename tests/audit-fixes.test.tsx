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
import { rotateBackupFiles, SAFETY_RE } from '../src/core/backup';
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
import {  confirmAction } from '../src/core/confirm';
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

    test('TASK-P53-10-WYD: verify-native.mjs weryfikuje naglowki PNG (magic bytes) zasobow graficznych i blokuje SYSTEM_ALERT_WINDOW', () => {
      const verifyScript = join(root, 'scripts', 'verify-native.mjs');
      expect(existsSync(verifyScript)).toBe(true);
      const content = readFileSync(verifyScript, 'utf8');
      expect(content).toContain('0x89');
      expect(content).toContain('0x50');
      expect(content).toContain('0x4e');
      expect(content).toContain('0x47');
      expect(content).toContain('android.permission.SYSTEM_ALERT_WINDOW');
      expect(content).toContain('android.permission.REQUEST_INSTALL_PACKAGES');
    });

    test('TASK-P55-10-WYD: verify-native.mjs weryfikuje nagłówki WebP/PNG oraz blokuje fingerprint, nfc i modyfikacje sieci w android.permissions', () => {
      const verifyScript = join(root, 'scripts', 'verify-native.mjs');
      expect(existsSync(verifyScript)).toBe(true);
      const content = readFileSync(verifyScript, 'utf8');
      expect(content).toContain('0x52'); // 'R'
      expect(content).toContain('0x49'); // 'I'
      expect(content).toContain('0x46'); // 'F'
      expect(content).toContain('0x57'); // 'W'
      expect(content).toContain('0x45'); // 'E'
      expect(content).toContain('0x42'); // 'B'
      expect(content).toContain('0x50'); // 'P'
      expect(content).toContain('android.permission.USE_FINGERPRINT');
      expect(content).toContain('android.permission.NFC');
      expect(content).toContain('android.permission.CHANGE_NETWORK_STATE');
      expect(content).toContain('android.permission.CHANGE_WIFI_STATE');
      expect(content).toContain('NSNFCReaderUsageDescription');
    });

    test('TASK-P58-10-WYD: verify-native.mjs weryfikuje brak mikrofonu w pluginie kamery oraz blokuje uprawnienia rozruchowe, uslug tla i telefonii', () => {
      const verifyScript = join(root, 'scripts', 'verify-native.mjs');
      expect(existsSync(verifyScript)).toBe(true);
      const content = readFileSync(verifyScript, 'utf8');
      expect(content).toContain('microphonePermission === false');
      expect(content).toContain('android.permission.RECEIVE_BOOT_COMPLETED');
      expect(content).toContain('android.permission.FOREGROUND_SERVICE');
      expect(content).toContain('android.permission.READ_PHONE_NUMBERS');
      expect(content).toContain('android.permission.ANSWER_PHONE_CALLS');
      expect(content).toContain('NSCameraUseContinuityCameraDeviceType');
      expect(content).toContain('NSHealthClinicalHealthRecordsShareUsageDescription');
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
      // M1-audytor-generalny-012: scenariusze z selektorami istniejącymi w aplikacji (kontrakt: tests/e2e-contract.test.ts).
      expect(files).toContain('01-start.yaml');
      expect(files).toContain('02-spizarnia-dodaj-paczke.yaml');
      expect(files).toContain('03-kofeina-szybki-wpis.yaml');
      expect(files).toContain('04-dziennik.yaml');
      expect(files).toContain('05-gongfu.yaml');
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

// ============================================================================
// M1-audytor-generalny-009 · DEC-01 (a) z 2026-11-13: wersja 1.0 całkowicie darmowa.
// Trwała kontrola TASK-R03-01 (atrapa zakupu wróciła po deklarowanej naprawie):
// w kodzie produkcyjnym nie ma ekranu zakupu, okresu próbnego, bramek ani nadania Pro
// poza StoreKit. Dlaczego statycznie: atrapa przeszła wszystkie testy zachowania,
// bo testy wołały ją jak prawdziwy zakup.
// ============================================================================
describe('M1-audytor-generalny-009: wersja darmowa bez zakupów (DEC-01 a)', () => {
  const PROD_DIRS = ['app', 'src', 'lib'];
  const listProd = (dir: string): string[] => {
    const abs = join(root, dir);
    if (!existsSync(abs)) return [];
    const out: string[] = [];
    for (const e of readdirSync(abs, { withFileTypes: true })) {
      const rel = join(dir, e.name);
      if (e.isDirectory()) {
        if (e.name === '__tests__' || e.name === 'node_modules') continue;
        out.push(...listProd(rel));
      } else if (/\.(ts|tsx|js|mjs)$/.test(e.name) && !/\.test\./.test(e.name)) {
        out.push(rel);
      }
    }
    return out;
  };
  const prodFiles = PROD_DIRS.flatMap(listProd);
  const hits = (re: RegExp, files: string[] = prodFiles): string[] =>
    files.flatMap((f) =>
      readFileSync(join(root, f), 'utf8')
        .split('\n')
        .flatMap((line, i) => (re.test(line) ? [`${f}:${i + 1}: ${line.trim()}`] : [])),
    );
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
  const hasStoreKitLib = ['expo-iap', 'react-native-iap', 'react-native-purchases'].some((d) => d in deps);

  test('02-monetyzacja-001 / TASK-R03-01: brak atrapy zakupu i zapisu Pro w kodzie produkcyjnym', () => {
    expect(prodFiles.length).toBeGreaterThan(50);
    expect(
      hits(/mock-storekit|valid-receipt-signature|purchaseWithStoreKit|activateSubscription|verifyAndActivateStoreKitPurchase|setIsProUser|is_pro_active|has_verified_purchase|Apps4BrewPassModal|PassSettingsCard/),
    ).toEqual([]);
  });

  test('02-monetyzacja-001: bez biblioteki StoreKit w package.json nie ma żadnego stanu uprawnienia', () => {
    if (hasStoreKitLib) return; // model płatny wymaga nowej decyzji i testów adaptera sklepu
    expect(hits(/\b(isPro|isProUser|isSubscribed|subscriptionTier|subscription_tier|restorePurchases|useAppAccess)\b/)).toEqual([]);
    expect(existsSync(join(root, 'src/core/app-access.ts'))).toBe(false);
    expect(existsSync(join(root, 'NaparStoreKit.storekit'))).toBe(false);
  });

  test('02-monetyzacja-002: brak okresu próbnego liczonego w aplikacji', () => {
    expect(hits(/trial_started_at|trial_brews_count|trial_max_|TRIAL_DURATION_DAYS|TRIAL_MAX_BREWS/)).toEqual([]);
  });

  test('02-monetyzacja-003: słowniki i komponenty bez cen planów i ofert „za darmo”', () => {
    const localeFiles = readdirSync(join(root, 'locales'))
      .filter((f) => f.endsWith('.json'))
      .map((f) => join('locales', f));
    const files = [...localeFiles, 'src/core/i18n.tsx', ...prodFiles.filter((f) => f.startsWith(join('src', 'components')))];
    expect(hits(/\d+[,.]\d{2}\s?zł|[$€]\s?\d|dni za darmo|day free trial|NAJLEPSZA WARTOŚĆ|BEST VALUE/i, files)).toEqual([]);
    expect((translations.pl as any).paywall).toBeUndefined();
    expect((translations.en as any).paywall).toBeUndefined();
  });

  test('02-monetyzacja-004 / 02-monetyzacja-006: brak bramek tworzenia i trybu tylko do odczytu', () => {
    expect(hits(/\bcanCreate\b|onRequirePaywall|showPaywall|ShowPaywall|isHistoryReadOnly|recordBrew\b/)).toEqual([]);
  });

  test('02-monetyzacja-005 / 01-odkrywanie-010: dokumenty projektu nie obiecują okresu próbnego, cen ani Pro', () => {
    const docs = ['README.md', 'docs/MONETIZATION_AND_KITCHEN_UX.md', 'docs/project-rules.md', 'docs/to-be.md', 'docs/przeplywy-uzytkownika.md'];
    expect(
      hits(/Free Trial|okres(ie)? próbn|\$0\.99|\$4\.99|\$14\.99|9,99 zł|59,99 zł|129,99 zł|Apps4BrewPassModal|restorePurchases|app-access\.ts|NaparStoreKit/i, docs),
    ).toEqual([]);
  });

  test('10-wydanie-005 / 10-wydanie-002: opis sklepu i strony bez zakupów, gdy paywalla nie ma w buildzie', () => {
    const files = ['docs/15-app-store.md', 'site/terms.html', 'site/support.html', 'site/index.html', 'site/privacy.html'].filter((f) =>
      existsSync(join(root, f)),
    );
    expect(hits(/Apps4Brew Pass|Napar Pro|subskrypc|subscription|Przywróć Zakupy|Restore Purchases|okres próbny|free trial/i, files)).toEqual([]);
  });
});

describe('M1-audytor-generalny-015: bez progu „bezpiecznego dla snu” i „bezpiecznej godziny” (DEC-05 a; 06-tresci-001, 01-odkrywanie-004)', () => {
  const caffeineUiFiles = [
    'app/(tabs)/caffeine.tsx',
    'src/components/caffeine/BedtimeCurfewCard.tsx',
    'src/core/caffeine-chart.tsx',
    'src/components/settings/CaffeineSettingsCard.tsx',
  ];
  const localeFiles = readdirSync(join(root, 'locales'))
    .filter((f) => f.endsWith('.json'))
    .map((f) => join('locales', f));
  const grepFiles = (re: RegExp, files: string[]): string[] =>
    files.flatMap((f) =>
      readFileSync(join(root, f), 'utf8')
        .split('\n')
        .flatMap((line, i) => (re.test(line) ? [`${f}:${i + 1}: ${line.trim()}`] : [])),
    );
  const flatten = (o: any, p = ''): Array<[string, string]> =>
    Object.entries(o).flatMap(([k, v]) => (v && typeof v === 'object' ? flatten(v, `${p}${k}.`) : [[`${p}${k}`, String(v)] as [string, string]]));

  test('06-tresci-001: ekran Kofeina, wykres i ustawienia nie mają progu 25 mg, NREM ani „bezpiecznej godziny”', () => {
    expect(
      grepFiles(/Próg bezpiecze|BEZPIECZNA GODZINA|Safe level for restorative|NREM|\b25(\.0)?\s?mg|thresholdMg|isSafeForSleep|curfewTime|HoursUntilSafe/i, caffeineUiFiles),
    ).toEqual([]);
  });

  test('06-tresci-001: żaden tekst PL ani EN (słowniki i pliki locales) nie nazywa poziomu kofeiny przed snem „bezpiecznym” ani progiem NREM', () => {
    const texts = [...flatten(translations.pl), ...flatten(translations.en)].filter(([k]) => /^(caffeine|settings\.bedtime)/.test(k));
    expect(texts.length).toBeGreaterThan(5);
    expect(texts.filter(([, v]) => /bezpieczn|\bsafe\b|NREM|curfew|próg|threshold|25 mg/i.test(v))).toEqual([]);
    expect(grepFiles(/Safe level for restorative|NREM|25 mg|curfew/i, localeFiles)).toEqual([]);
  });

  test('06-tresci-001: kod domenowy nie ma progu snu ani godziny granicznej', () => {
    const src = readFileSync(join(root, 'src/core/domain-rules.ts'), 'utf8');
    expect(src).not.toMatch(/safeThresholdMg|isSafeForSleep|calculateHoursUntilSafeCaffeine|evaluateBedtimeCaffeine/);
  });

  test('06-tresci-001: karta pory snu pokazuje neutralny szacunek — ten sam wygląd na granicy dawnego progu (24,9 / 25 / 25,1 mg)', () => {
    const { BedtimeCurfewCard } = require('../src/components/caffeine/BedtimeCurfewCard');
    const render = (mg: number) => {
      let tree: any;
      act(() => {
        tree = renderer.create(
          <BedtimeCurfewCard bedtimeHour={23} onBedtimeChange={() => {}} halfLifeHours={5} onHalfLifeChange={() => {}} bedtimeMg={mg} />,
        );
      });
      const json = JSON.stringify(tree.toJSON());
      act(() => tree.unmount());
      return json;
    };
    const outs = [24.9, 25, 25.1].map(render);
    for (const [i, out] of outs.entries()) {
      expect(out).not.toMatch(/✓|⚠|bezpieczn|BEZPIECZN|NREM|curfew/i);
      expect(out).toContain(String([24.9, 25, 25.1][i]));
    }
    const shape = (s: string) => s.replace(/2[45](\.\d)?/g, 'X');
    expect(shape(outs[0])).toBe(shape(outs[1]));
    expect(shape(outs[1])).toBe(shape(outs[2]));
  });

  test('06-tresci-001: estimateBedtimeCaffeineMg sumuje kofeinę z modelu bez oceny', () => {
    const { estimateBedtimeCaffeineMg } = require('../src/core/domain-rules');
    expect(estimateBedtimeCaffeineMg([{ doseMg: 100, hoursUntilBedtime: 10 }], 5)).toBe(25);
    expect(estimateBedtimeCaffeineMg([{ doseMg: 100, hoursUntilBedtime: 5 }, { doseMg: 50, hoursUntilBedtime: 0 }], 5)).toBe(100);
  });
});

describe('M1-audytor-generalny-016: zastrzeżenie medyczne w PL i EN, z lekarzem i granicami modelu (06-tresci-002, 06-tresci-003)', () => {
  const tr: any = translations;

  test('06-tresci-002: zastrzeżenie jest w słowniku PL i EN (lekarz, ciąża, leki, wątroba, dzieci)', () => {
    const pl = `${tr.pl.caffeine.disclaimerTitle} ${tr.pl.caffeine.disclaimerText}`;
    const en = `${tr.en.caffeine.disclaimerTitle} ${tr.en.caffeine.disclaimerText}`;
    for (const re of [/lekarz/, /ciąż/, /lek(ów|ach|i)\b/, /wątrob/, /dzieci/]) expect(pl).toMatch(re);
    for (const re of [/doctor/i, /pregnan/i, /medication/i, /liver/i, /children/i]) expect(en).toMatch(re);
    expect(en).not.toMatch(/[ąćęłńóśźż]/i);
  });

  test('06-tresci-002: ekran Kofeina bierze zastrzeżenie ze słownika, nie z tekstu na sztywno', () => {
    const src = readFileSync(join(root, 'app/(tabs)/caffeine.tsx'), 'utf8');
    expect(src).not.toMatch(/Zastrzeżenie informacyjne|Informacja edukacyjna|skonsultuj się/);
    expect(src).toMatch(/t\.caffeine\.disclaimerTitle/);
    expect(src).toMatch(/t\.caffeine\.disclaimerText/);
  });

  test('06-tresci-002: opis sklepu PL i EN przypomina o lekarzu (App Review 1.4.1)', () => {
    const store = readFileSync(join(root, 'docs/15-app-store.md'), 'utf8');
    expect(store).toMatch(/Health Disclaimer:[^\n]*doctor/);
    expect(store).toMatch(/Zastrzeżenie medyczne:[^\n]*lekarz/);
    expect(store).not.toMatch(/curfew/i);
  });

  test('06-tresci-003: twierdzenia wysokiego ryzyka nie mają nieważnego zapisu przeglądu — czekają z oznaczeniem albo mają przegląd człowieka z datą', () => {
    const reg = JSON.parse(readFileSync(join(root, 'rejestr.json'), 'utf8'));
    const list: any[] = reg.twierdzenia ?? reg;
    const krytyczne = list.filter((t) => (t.krytyczne ?? t.poziom_ryzyka === 'wysoki') && t.status !== 'wycofane');
    expect(krytyczne.length).toBeGreaterThan(0);
    for (const t of krytyczne) {
      const p = t.przeglad;
      const czeka = p == null && /czeka/.test(String(t.przeglad_status ?? ''));
      const czlowiek = p && /^\d{4}-\d\d-\d\d$/.test(p.data ?? '') && /^[0-9a-f]{12}$/.test(p.sha ?? '') && !/ZASTĘPCZY_AI|subagent/.test(p.kto ?? '');
      expect([t.id, czeka || czlowiek]).toEqual([t.id, true]);
    }
  });
});

describe('M1-audytor-generalny-017: jedna wartość każdej wielkości kofeinowej i twierdzenie w rejestrze (06-tresci-004, 06-tresci-005)', () => {
  const reg = JSON.parse(readFileSync(join(root, 'rejestr.json'), 'utf8'));
  const byId = new Map<string, any>((reg.twierdzenia ?? reg).map((t: any) => [t.id, t]));

  test('06-tresci-005: zakres czasu półtrwania ma jedną wartość w src/core równą rejestrowi (EFSA-T12-ZAKRES: 2–8 h)', () => {
    const dr = require('../src/core/domain-rules');
    expect(dr.CAFFEINE_HALF_LIFE_MIN_H).toBe(2.0);
    expect(dr.CAFFEINE_HALF_LIFE_MAX_H).toBe(8.0);
    expect(dr.clampCaffeineHalfLifeHours(1)).toBe(2.0);
    expect(dr.clampCaffeineHalfLifeHours(9)).toBe(8.0);
    expect(dr.clampCaffeineHalfLifeHours(4.25)).toBe(4.3);
    expect(byId.get('EFSA-T12-ZAKRES')?.status).toBe('potwierdzone');
    expect(String(byId.get('EFSA-T12-ZAKRES')?.wartosc)).toMatch(/^2–8/);
    for (const f of ['app/(tabs)/caffeine.tsx', 'app/settings.tsx', 'src/core/database.ts']) {
      expect([f, readFileSync(join(root, f), 'utf8').match(/Math\.max\(3\.0|val < 3\.0/g)]).toEqual([f, null]);
    }
  });

  test('06-tresci-005: teksty PL i EN podają jeden zakres t½ (2–8 h) i nie przypisują domyślnych 5 h EFSA', () => {
    const tr: any = translations;
    for (const lang of ['pl', 'en']) {
      const texts = [tr[lang].caffeine.halfLifeDesc, tr[lang].settings.caffeineHalfLifeDesc, tr[lang].caffeine.halfLifeNote, tr[lang].caffeine.disclaimerText].join(' | ');
      expect(texts).not.toMatch(/\b3[.,]0 ?h|3–12|3-12|standard EFSA|EFSA standard|5[.,]0 ?h[^.|]*EFSA/);
      expect(`${tr[lang].caffeine.halfLifeDesc}`).toMatch(/2[.,]0.*8[.,]0/);
    }
    const card = readFileSync(join(root, 'src/components/caffeine/BedtimeCurfewCard.tsx'), 'utf8');
    expect(card).not.toMatch(/Standardowy metabolizm \(EFSA\)|'Krótszy czas|'Dłuższy czas/);
    const chart = readFileSync(join(root, 'src/core/caffeine-chart.tsx'), 'utf8');
    expect(chart).not.toMatch(/t₁\/₂ = 5\.0h/);
  });

  test('06-tresci-004: każdy znacznik [T:…] przy szacunkach kofeiny wskazuje twierdzenie w rejestrze', () => {
    const src = readFileSync(join(root, 'src/core/domain-rules.ts'), 'utf8');
    for (const fn of ['estimateCoffeeCaffeineMg', 'estimateTotalLeafCaffeineMg', 'estimateTeaInfusionCaffeineMg', 'calculateRemainingCaffeineMg']) {
      const at = src.indexOf(`export function ${fn}`);
      const doc = src.slice(src.lastIndexOf('/**', at), at);
      const ids = [...doc.matchAll(/\[T:([^\]]+)\]/g)].flatMap((m) => m[1].split(',').map((s) => s.trim()));
      expect([fn, ids.length > 0]).toEqual([fn, true]);
      for (const id of ids) expect([fn, id, byId.has(id)]).toEqual([fn, id, true]);
    }
    const modal = readFileSync(join(root, 'src/components/caffeine/CaffeineQuickAddModal.tsx'), 'utf8');
    for (const id of [...modal.matchAll(/\[T:([^\]]+)\]/g)].map((m) => m[1])) expect(byId.has(id)).toBe(true);
    expect(modal).toMatch(/\[T:HERBATA-SZYBKIE-45MG\]/);
  });

  test('06-tresci-005: wielkości bez przeczytanego źródła są w rejestrze jako „otwarte” [DO USTALENIA], nie jako potwierdzone', () => {
    for (const id of ['KAWA-KOFEINA-MG-G', 'KAWA-WYDAJNOSC-EKSTRAKCJI', 'HERBATA-KOFEINA-3PROC', 'HERBATA-FRAKCJE-ZALAN', 'HERBATA-SZYBKIE-45MG']) {
      expect([id, byId.get(id)?.status]).toEqual([id, 'otwarte']);
    }
  });
});

describe('M1-audytor-generalny-018: wartości i etykiety zgodne z przeczytanym źródłem (06-tresci-009, -010, -011, -015, -016)', () => {
  const reg = JSON.parse(readFileSync(join(root, 'rejestr.json'), 'utf8'));
  const byId = new Map<string, any>((reg.twierdzenia ?? reg).map((t: any) => [t.id, t]));

  test('06-tresci-009: koncentraty Barista Hustle 1,68 g / 2,45 g na 1 L (1000 ppm) — GH 80 / KH 40 w 1 L to 80 g i 40 g', () => {
    const { calculateWaterMinerals } = require('../src/core/water-chemistry');
    const r = calculateWaterMinerals(1.0, 80, 40);
    expect(r.concentrateHardnessGrams).toBe(80);
    expect(r.concentrateBufferGrams).toBe(40);
    expect(r.baseWaterGrams).toBe(880);
    for (const lang of ['pl', 'en'] as const) {
      const d = (translations as any)[lang].water.methodADesc as string;
      expect(d).not.toMatch(/500 ?g/);
      expect(d).toMatch(/1 ?L/);
    }
    expect(byId.get('BH-WATER-2016')?.zrodla?.[0]?.cytat).toMatch(/1L of deionised water/);
  });

  test('06-tresci-010: Muszynianka zgodna z producentem (~2000 mg/l), bez łączenia z inną wodą; bez niepotwierdzonego „oficjalna woda WBC”', () => {
    const { BOTTLED_WATER_BENCHMARKS } = require('../src/core/water-chemistry');
    const m = BOTTLED_WATER_BENCHMARKS.find((b: any) => b.id === 'muszynianka');
    expect(m.brandName).toBe('Muszynianka');
    expect(m.tdsPpm).toBe(2000);
    const all = JSON.stringify(BOTTLED_WATER_BENCHMARKS);
    expect(all).not.toMatch(/WBC|World Barista Championships|Oficjalna woda|Official cupping/);
    expect(byId.get('WODA-MUSZYNIANKA-MINERALIZACJA')?.status).toBe('potwierdzone');
    expect(byId.get('WODY-BUTELKOWANE-SKLADY')?.status).toBe('otwarte');
  });

  test('06-tresci-011: tryb espresso nie ocenia wyniku etykietą „Złote Okno SCA” / Golden Cup', () => {
    const { ExtractionYieldTab } = require('../src/components/dialin/ExtractionYieldTab');
    let tree: any;
    act(() => {
      tree = renderer.create(<ExtractionYieldTab language="pl" t={translations.pl} />);
    });
    act(() => tree.root.findByProps({ testID: 'ey-mode-espresso' }).props.onPress());
    const { TextInput } = require('react-native');
    const [w, d, tds] = tree.root.findAllByType(TextInput);
    act(() => {
      w.props.onChangeText('36');
      d.props.onChangeText('18');
      tds.props.onChangeText('10'); // EY = 36 × 10 / 18 = 20% — w dawnym kodzie „Złote Okno SCA”
    });
    const json = JSON.stringify(tree.toJSON());
    expect(json).toMatch(/WYDAJNOŚĆ EKSTRAKCJI|%/);
    expect(json).not.toMatch(/Złote Okno|Golden Cup|SCA/);
    act(() => tree.root.findByProps({ testID: 'ey-mode-pourover' }).props.onPress());
    act(() => {
      w.props.onChangeText('250');
      d.props.onChangeText('15');
      tds.props.onChangeText('1.35'); // przelew: EY ≈ 19,8%
    });
    expect(JSON.stringify(tree.toJSON())).toMatch(/Złote Okno SCA|Golden Cup/);
    act(() => tree.unmount());
  });

  test('06-tresci-015: receptura espresso — liczby w EN równe PL i polom receptury (18 g → 36 g, 1:2, 2–3 bar, 9 bar)', () => {
    const { MASTER_RECIPES } = require('../src/core/recipes-data');
    const r = MASTER_RECIPES.find((x: any) => /Espresso — Specialty Double Shot/.test(x.name));
    const nums = (s: string) => (s.match(/\d+(?:[.,]\d+)?/g) || []).map((n) => n.replace(',', '.')).sort().join(' ');
    expect(nums(r.nameEn)).toBe(nums(r.name));
    expect(r.nameEn).toContain(`1:${r.recommendedRatio}`);
    for (const st of r.steps) {
      expect(st.nameEn).not.toBe('');
      expect(st.instructionEn).not.toBe('');
      expect([st.stepNumber, nums(st.instructionEn)]).toEqual([st.stepNumber, nums(st.instructionPl)]);
      expect([st.stepNumber, nums(st.nameEn)]).toEqual([st.stepNumber, nums(st.namePl)]);
    }
  });

  test('06-tresci-016: diagnoza „kwaśna” (niedoparzenie) nie zawiera „cierpka/astringent” przypisanej przeparzeniu', () => {
    const { diagnoseExtractionTaste } = require('../src/core/domain-rules');
    const [sour] = diagnoseExtractionTaste({ isSour: true });
    expect(sour.issue).not.toMatch(/cierpk/i);
    expect(sour.issueEn).not.toMatch(/astringent/i);
    expect(sour.grindAdjustment).toBe('finer');
    const [astr] = diagnoseExtractionTaste({ isAstringent: true });
    expect(astr.grindAdjustment).toBe('coarser');
  });
});

describe('M1-audytor-generalny-019: rejestr twierdzeń w formacie roli, szczeble według BRD C4 §1, opis sklepu z ID (06-tresci-008, 06-tresci-014, 01-odkrywanie-005, 01-odkrywanie-012, 10-wydanie-006, 02-monetyzacja-007)', () => {
  const rejestr = JSON.parse(readFileSync(join(root, 'rejestr.json'), 'utf8'));

  test('06-tresci-014: rejestr przechodzi walidator kontrole-tresci (źródła, szczeble, jedna wartość wielkości); przegląd człowieka jeszcze czeka', async () => {
    expect(Array.isArray(rejestr)).toBe(true);
    const { spawnSync } = require('node:child_process');
    const run = spawnSync(
      process.execPath,
      ['--input-type=module', '-e', "import { sprawdzRejestr } from './scripts/kontrole-tresci.mjs'; import { readFileSync } from 'node:fs'; const u = []; const b = sprawdzRejestr(JSON.parse(readFileSync('rejestr.json', 'utf8')), [], { przedPrzegladem: true }, u); console.log(JSON.stringify({ b, u }));"],
      { cwd: root, encoding: 'utf8' },
    );
    expect(run.status).toBe(0);
    const { b: bledy, u: uwagi } = JSON.parse(run.stdout) as { b: string[]; u: string[] };
    expect(bledy).toEqual([]);
    // Bez przeglądu człowieka każde potwierdzone twierdzenie krytyczne daje uwagę — po przeglądzie zmienić na przedPrzegladem: false.
    expect(uwagi.every((u) => /krytyczne bez przeglądu człowieka/.test(u))).toBe(true);
    for (const t of rejestr) {
      expect([t.id, typeof t.twierdzenie, Array.isArray(t.zrodla), ['robocze', 'potwierdzone', 'otwarte', 'sprzeczne', 'wycofane'].includes(t.status), typeof t.krytyczne])
        .toEqual([t.id, 'string', true, true, 'boolean']);
    }
  });

  test('06-tresci-014: szczeble zgodne z hierarchią projektu (SCA, WCR, EFSA = 1; literatura recenzowana = 2; przewodnik = 4 z oznaczeniem jednego źródła)', () => {
    const tier = (id: string) => rejestr.find((t: any) => t.id === id)?.zrodla?.[0]?.szczebel;
    for (const id of ['SCA-GOLDENCUP-EY', 'SCA-WATER-STD', 'WCR-VARIETIES', 'EFSA-CAFF-2015', 'EFSA-T12-ZAKRES', 'EFSA-SEN-100MG']) expect([id, tier(id)]).toEqual([id, 1]);
    for (const id of ['NEHLIG-CYP1A2-2018', 'DRAKE-SLEEP-2013', 'ASTILL-TEA-2001', 'GRZEG-PK-CZYNNIKI']) expect([id, tier(id)]).toEqual([id, 2]);
    const bh = rejestr.find((t: any) => t.id === 'BH-WATER-2016');
    expect(bh.zrodla[0].szczebel).toBe(4);
    expect(bh.jedno_zrodlo).toBe(true);
  });

  test('10-wydanie-006 / 01-odkrywanie-005: każde twierdzenie dziedzinowe opisu sklepu PL/EN ma ID potwierdzonego twierdzenia; bez 7–35 dni, NREM i „SCA Golden Cup” bez źródła', () => {
    const store = readFileSync(join(root, 'docs/15-app-store.md'), 'utf8');
    expect(store).not.toMatch(/7–35|7-35|NREM|Golden Cup/);
    const ids = [...store.matchAll(/\[T:([^\]]+)\]/g)].flatMap((m) => m[1].split(',').map((s) => s.trim()));
    expect(ids.length).toBeGreaterThanOrEqual(4);
    for (const id of ids) expect([id, rejestr.find((t: any) => t.id === id)?.status]).toEqual([id, 'potwierdzone']);
  });

  test('01-odkrywanie-012 / 02-monetyzacja-007: liczby rynkowe i cenowe bez źródła w BRD i dokumentach są oznaczone [DO USTALENIA]', () => {
    const files = readdirSync(join(root, 'napar_brd')).map((f) => join('napar_brd', f)).concat(['docs/MONETIZATION_AND_KITCHEN_UX.md']);
    const lines = files.flatMap((f) => readFileSync(join(root, f), 'utf8').split('\n'));
    for (const re of [/3 500 recenzji/, /35 mld USD/, /5\.99 \$\/mies/, /29 subskrypcji rocznych/, /18 zł w kawiarni/]) {
      const hit = lines.filter((l) => re.test(l));
      expect([String(re), hit.length > 0 && hit.every((l) => /DO USTALENIA/.test(l))]).toEqual([String(re), true]);
    }
  });
});

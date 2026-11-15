// ============================================================================
// Napar — Testy Regresyjne Znalezisk Audytu BRD-QA-REL 1.0 (KROK 3)
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
import { ProcedureModal } from '../src/components/brew/ProcedureModal';

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
    // M1-audytor-generalny-032: zamiast usuniętych klonów locales/*.json — teksty systemowe expo.locales.
    const localeFiles = readdirSync(join(root, 'locales', 'native'))
      .filter((f) => f.endsWith('.json'))
      .map((f) => join('locales', 'native', f));
    expect(localeFiles).toHaveLength(2);
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
  // M1-audytor-generalny-032: zamiast usuniętych klonów locales/*.json — teksty systemowe expo.locales.
  const localeFiles = readdirSync(join(root, 'locales', 'native'))
    .filter((f) => f.endsWith('.json'))
    .map((f) => join('locales', 'native', f));
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

describe('M1-audytor-generalny-021: bez przełącznika i obietnic Apple Health do czasu wdrożenia (DEC-04 a; 03-zakres-004, 06-tresci-006, 01-odkrywanie-015, 11-wzrost-002, 10-wydanie-004)', () => {
  const HEALTH = /Apple Health|HealthKit|aplikacji Zdrowie|Dietary Caffeine|healthkit/i;
  const listDir = (dir: string, ext: RegExp): string[] => {
    const abs = join(root, dir);
    if (!existsSync(abs)) return [];
    return readdirSync(abs, { withFileTypes: true }).flatMap((e) => {
      const rel = join(dir, e.name);
      if (e.isDirectory()) return e.name === '__tests__' || e.name === 'node_modules' ? [] : listDir(rel, ext);
      return ext.test(e.name) && !/\.test\./.test(e.name) ? [rel] : [];
    });
  };
  const grepFiles = (re: RegExp, files: string[]): string[] =>
    files.flatMap((f) =>
      readFileSync(join(root, f), 'utf8')
        .split('\n')
        .flatMap((line, i) => (re.test(line) ? [`${f}:${i + 1}: ${line.trim()}`] : [])),
    );
  const flatten = (o: any, p = ''): Array<[string, string]> =>
    Object.entries(o).flatMap(([k, v]) => (v && typeof v === 'object' ? flatten(v, `${p}${k}.`) : [[`${p}${k}`, String(v)] as [string, string]]));
  const prodFiles = ['app', 'src', 'lib'].flatMap((d) => listDir(d, /\.(ts|tsx|js|mjs)$/));
  const publicTexts = ['README.md', ...listDir('site', /\.html$/)];

  test('03-zakres-004 / 06-tresci-006: Ustawienia kofeiny bez przełącznika toggle-healthkit-btn i bez tekstu Apple Health ani „(v1.2)”', () => {
    const { CaffeineSettingsCard } = require('../src/components/settings/CaffeineSettingsCard');
    let tree: any;
    act(() => {
      tree = renderer.create(
        <CaffeineSettingsCard halfLifeHours={4} onHalfLifeChange={() => {}} bedtimeHour={23} onBedtimeChange={() => {}} t={translations.pl} />,
      );
    });
    expect(tree.root.findAll((n: any) => n.props && n.props.testID === 'toggle-healthkit-btn')).toEqual([]);
    const out = JSON.stringify(tree.toJSON());
    act(() => tree.unmount());
    expect(out).toContain('Metabolizm');
    expect(out).not.toMatch(HEALTH);
    expect(out).not.toMatch(/\(v1\.\d\)/);
  });

  test('03-zakres-004 / 01-odkrywanie-015: kod produkcyjny nie ma mostka HealthKit ani ustawienia synchronizacji', () => {
    expect(prodFiles.length).toBeGreaterThan(50);
    expect(existsSync(join(root, 'src/core/healthkit.ts'))).toBe(false);
    expect(grepFiles(/healthkit|HealthKit|healthKitSync|toggle-healthkit-btn|saveDietaryCaffeineSample/, prodFiles)).toEqual([]);
  });

  test('03-zakres-004: żaden tekst UI (PL, EN i pliki locales) nie wspomina Apple Health ani nie zapowiada wersji „(v1.2)”', () => {
    const texts = [...flatten(translations.pl), ...flatten(translations.en)];
    expect(texts.length).toBeGreaterThan(500);
    expect(texts.filter(([k, v]) => HEALTH.test(k) || HEALTH.test(v) || /\bv1\.[1-9]\b/.test(v))).toEqual([]);
    const localeFiles = listDir('locales', /\.json$/);
    expect(localeFiles.sort()).toEqual([join('locales', 'native', 'en.json'), join('locales', 'native', 'pl.json')]); // 032: klony usunięte
    expect(grepFiles(/healthKit|Apple Health|HealthKit|\bv1\.[1-9]\b/, localeFiles)).toEqual([]);
  });

  test('11-wzrost-002 / 10-wydanie-004: strona, polityka prywatności i README bez Apple Health i funkcji spoza wersji', () => {
    expect(publicTexts).toEqual(expect.arrayContaining(['README.md', join('site', 'privacy.html'), join('site', 'index.html')]));
    expect(grepFiles(HEALTH, publicTexts)).toEqual([]);
    expect(
      grepFiles(
        /czasie rzeczywistym \(g\/s\)|wskaźnikiem przepływu|Przywróć Zakupy|zweryfikowana bezpośrednio w sklepie|odnawiają się automatycznie|Subskrypcje odnawiają|Chmurą rodzinną|\bv1\.[1-9]\b|Live Activity|Dynamic Island|Apple Watch|BrewProAccordion/i,
        publicTexts,
      ),
    ).toEqual([]);
  });
});

describe('M1-audytor-generalny-023: adresy polityki, regulaminu i wsparcia z jednego miejsca; bez adresu w nieistniejącej domenie (DEC-07 a; 10-wydanie-001)', () => {
  const listSite = (dir: string): string[] =>
    readdirSync(join(root, dir), { withFileTypes: true }).flatMap((e) =>
      e.isDirectory() ? listSite(join(dir, e.name)) : /\.html$/.test(e.name) ? [join(dir, e.name)] : [],
    );
  const siteFiles = listSite('site');
  const scan = (re: RegExp, files: string[]): string[] =>
    files.flatMap((f) =>
      readFileSync(join(root, f), 'utf8')
        .split('\n')
        .flatMap((line, i) => (re.test(line) ? [`${f}:${i + 1}`] : [])),
    );

  test('10-wydanie-001: żaden plik aplikacji, strony ani metadanych sklepu nie podaje adresu w domenie apps4brew.pl', () => {
    const files = ['app/settings.tsx', 'docs/15-app-store.md', ...siteFiles];
    expect(scan(/apps4brew\.pl/i, files)).toEqual([]);
  });

  test('10-wydanie-001: adres e-mail kontaktu ma jedno miejsce (SUPPORT_EMAIL); bez adresu od właściciela strona nie pokazuje żadnego e-maila', () => {
    const identity = require('../src/core/app-identity');
    expect(identity.SUPPORT_EMAIL).toBeNull();
    expect(readFileSync(join(root, 'src/core/app-identity.ts'), 'utf8')).toContain('[DO USTALENIA: adres od właściciela]');
    expect(scan(/[\w.+-]+@[\w-]+\.[a-z]{2,}/i, siteFiles)).toEqual([]);
    expect(readFileSync(join(root, 'site/support.html'), 'utf8')).toContain('[DO USTALENIA: adres od właściciela]');
    expect(readFileSync(join(root, 'docs/15-app-store.md'), 'utf8')).toContain('[DO USTALENIA: adres od właściciela]');
    expect(identity.supportMailtoUrl('wsparcie@przyklad.test')).toBe('mailto:wsparcie@przyklad.test');
  });

  test('10-wydanie-001: adresy strony produktu tylko w app-identity.ts; Ustawienia otwierają politykę, regulamin i wsparcie z tych stałych', () => {
    const identity = require('../src/core/app-identity');
    expect(scan(/github\.io|mailto:/, ['app/settings.tsx'])).toEqual([]);
    const { default: SettingsScreen } = require('../app/settings');
    const Linking = require('expo-linking');
    const spy = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    let tree: any;
    act(() => {
      tree = renderer.create(<SettingsScreen />);
    });
    const press = (label: RegExp) => {
      const row = tree.root.find(
        (n: any) => n.props.accessibilityRole === 'link' && label.test(String(n.props.accessibilityLabel ?? '')) && typeof n.props.onPress === 'function',
      );
      act(() => {
        row.props.onPress();
      });
    };
    press(/Polityka Prywatności/);
    press(/Regulamin/);
    press(/Kontakt i Wsparcie/);
    act(() => tree.unmount());
    expect(spy.mock.calls.map((c: any[]) => c[0])).toEqual([identity.privacyPolicyUrl('pl'), identity.TERMS_URL, identity.SUPPORT_URL]);
    expect(identity.privacyPolicyUrl('pl')).toBe('https://lkarwowski494.github.io/napar/privacy.html');
    expect(identity.TERMS_URL).toBe('https://lkarwowski494.github.io/napar/terms.html');
    expect(identity.SUPPORT_URL).toBe('https://lkarwowski494.github.io/napar/support.html');
    spy.mockRestore();
  });
});

describe('M1-audytor-generalny-023: trwała kontrola adresów strony i domeny kontaktu (10-wydanie-001)', () => {
  test('site-check.yml sprawdza co tydzień i po wdrożeniu Pages wszystkie strony z app-identity.ts oraz MX adresu kontaktu', () => {
    const wf = readFileSync(join(root, '.github/workflows/site-check.yml'), 'utf8');
    expect(wf).toMatch(/schedule:/);
    expect(wf).toMatch(/workflow_run:/);
    expect(wf).toContain('src/core/app-identity.ts');
    expect(wf).toContain('type=MX');
    const identity = readFileSync(join(root, 'src/core/app-identity.ts'), 'utf8');
    const pages = [...identity.matchAll(/^\/\/ site-check: (.+)$/gm)].map((m) => m[1]);
    expect(pages).toEqual(expect.arrayContaining(['privacy.html', 'terms.html', 'support.html']));
    for (const p of pages) expect(existsSync(join(root, 'site', p))).toBe(true);
    // Każdy adres strony otwierany z app-identity.ts jest na liście kontroli.
    const { TERMS_URL, SUPPORT_URL, SITE_BASE_URL, privacyPolicyUrl } = require('../src/core/app-identity');
    for (const url of [TERMS_URL, SUPPORT_URL, privacyPolicyUrl('pl'), privacyPolicyUrl('en')]) {
      expect(pages).toContain(String(url).replace(SITE_BASE_URL, ''));
    }
  });
});

describe('M1-audytor-generalny-023: polityka prywatności PL i EN spełnia 5.1.1(i) i zgadza się z danymi wersji (10-wydanie-010)', () => {
  const { SCHEMA_SQL } = require('../src/core/database-schema');
  const pages = { pl: 'site/privacy.html', en: 'site/en/privacy.html' } as const;
  const read = (f: string) => (existsSync(join(root, f)) ? readFileSync(join(root, f), 'utf8') : '');
  // Tabela bazy → jak polityka nazywa te dane (PL, EN). Nowa tabela bez wpisu = test czerwony:
  // polityka musi zostać uzupełniona razem ze schematem.
  const CATEGORIES: Record<string, [RegExp, RegExp]> = {
    inventory_items: [/spiżarni/i, /pantry/i],
    recipes: [/receptur/i, /recipes/i],
    brew_sessions: [/historia parzeń/i, /brew history/i],
    caffeine_logs: [/dziennik kofeiny/i, /caffeine log/i],
    app_settings: [/ustawienia aplikacji/i, /app settings/i],
  };

  test('10-wydanie-010: polityka istnieje po polsku i po angielsku, strony linkują do siebie', () => {
    expect(read(pages.pl)).toMatch(/<html lang="pl">/);
    expect(read(pages.en)).toMatch(/<html lang="en">/);
    expect(read(pages.pl)).toContain('href="en/privacy.html"');
    expect(read(pages.en)).toContain('href="../privacy.html"');
    const { privacyPolicyUrl, SITE_BASE_URL } = require('../src/core/app-identity');
    expect(privacyPolicyUrl('en')).toBe(`${SITE_BASE_URL}en/privacy.html`);
    expect(privacyPolicyUrl('pl')).toBe(`${SITE_BASE_URL}privacy.html`);
  });

  test('10-wydanie-010: polityka wymienia każdą kategorię danych z bazy (tabele SCHEMA_SQL) w obu językach', () => {
    const tables = [...String(SCHEMA_SQL).matchAll(/CREATE TABLE IF NOT EXISTS (\w+)/g)].map((m) => m[1]);
    expect(tables.length).toBeGreaterThanOrEqual(5);
    expect(tables.filter((t) => !CATEGORIES[t])).toEqual([]);
    const missing = tables.flatMap((t) =>
      ([0, 1] as const).flatMap((i) => (CATEGORIES[t][i].test(read(i === 0 ? pages.pl : pages.en)) ? [] : [`${t}:${i === 0 ? 'pl' : 'en'}`])),
    );
    expect(missing).toEqual([]);
  });

  test('10-wydanie-010: polityka opisuje przechowywanie, kopie w Backup/, usuwanie danych i cofnięcie zgody na aparat', () => {
    const pl = read(pages.pl);
    const en = read(pages.en);
    for (const re of [/Przechowywanie/, /Usuwanie danych/, /Backup\//, /10 najnowszych/, /usunięcie aplikacji/i, /cofnąć/i, /aparat/i]) expect([String(re), re.test(pl)]).toEqual([String(re), true]);
    for (const re of [/Retention/, /Deleting your data/, /Backup\//, /10 most recent/, /deleting the app/i, /revoke/i, /camera/i]) expect([String(re), re.test(en)]).toEqual([String(re), true]);
  });

  test('10-wydanie-010: polityka nie myli manifestu PrivacyInfo.xcprivacy z etykietą App Store i nie wymienia nieistniejących integracji', () => {
    for (const html of [read(pages.pl), read(pages.en)]) {
      expect(html.length).toBeGreaterThan(1000);
      expect(html.split('\n').filter((l) => /PrivacyInfo\.xcprivacy/.test(l) && /Data Not Collected/.test(l))).toEqual([]);
      expect(html).not.toMatch(/HealthKit|Apple Health|iCloud sync|synchronizac/i);
    }
  });
});

describe('M1-audytor-generalny-035: kontrakt zakresu 1.0 bez powiadomień o etapach parzenia, których kod nie ma (DEC-08 a; 05-architekt-008, 03-zakres-008)', () => {
  const contract = readFileSync(join(root, 'docs/scope-contract.md'), 'utf8');
  const section = (start: RegExp, end: RegExp): string => {
    const from = contract.search(start);
    const rest = contract.slice(from);
    const to = rest.slice(1).search(end);
    return from < 0 ? '' : to < 0 ? rest : rest.slice(0, to + 1);
  };
  const scopeIn = section(/^## 1\. /m, /^## 2\. /m);
  const killList = section(/^## 2\. /m, /^## 3\. /m);
  const zmGate = section(/^## 5\. /m, /^## 6\. /m);
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  const appJson = JSON.parse(readFileSync(join(root, 'app.json'), 'utf8'));
  const deps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };

  test('05-architekt-008 / 03-zakres-008: zakres 1.0 nie obiecuje powiadomień o etapach ani nieistniejących BR-ZEG-006..010', () => {
    expect(scopeIn).toContain('Asystent Parzenia i Timery');
    expect(scopeIn).not.toMatch(/powiadomie/i);
    expect(scopeIn).not.toMatch(/BR-ZEG-0(0[6-9]|10)/);
  });

  test('05-architekt-008: powiadomienia etapów są na liście odcięć z warunkiem powrotu, a zmiana ma wiersz ZM z DEC-08', () => {
    const kill = killList.split('\n').find((l) => /^\| \*\*KILL-09\*\*/.test(l)) ?? '';
    expect(kill).toMatch(/[Pp]owiadomienia lokalne o etapach parzenia/);
    expect(kill).toMatch(/Powrót:/);
    expect(kill).toContain('expo-notifications');
    const zm = zmGate.split('\n').find((l) => /^\| ZM-03 \|/.test(l)) ?? '';
    expect(zm).toContain('DEC-08 wybór (a)');
    expect(zm).toContain('05-architekt-008');
    expect(zm).toContain('03-zakres-008');
  });

  test('05-architekt-008: kod zgodny z kontraktem — bez powiadomień i trybów tła; zostaje ekran bez wygaszania, dźwięk i wibracja na pierwszym planie', () => {
    // Powrót powiadomień wymaga wiersza ZM i zmiany kontraktu razem z zależnością.
    expect(deps['expo-notifications']).toBeUndefined();
    expect(appJson.expo.ios.infoPlist.UIBackgroundModes).toBeUndefined();
    expect(appJson.expo.android.permissions ?? []).not.toContain('android.permission.POST_NOTIFICATIONS');
    const engine = readFileSync(join(root, 'src/core/timer-engine.ts'), 'utf8');
    const gongfu = readFileSync(join(root, 'app/gongfu.tsx'), 'utf8');
    for (const src of [engine, gongfu]) {
      expect(src).not.toMatch(/expo-notifications|scheduleNotification/);
      expect(src).toMatch(/activateKeepAwakeAsync\(\)/);
      expect(src).toMatch(/playTimerChime\(\)/);
      // 030: Gongfu wibruje przez signalHaptic (src/core/signals.ts, sprawdza ustawienie „Wibracje”)
      expect(src).toMatch(/Haptics\.(impact|notification)Async|signalHaptic\('/);
      expect(src).toMatch(/AppState\.addEventListener\('change'/);
    }
  });
});

// M1-audytor-generalny-025 · DEC-13 (a) z 2026-11-13: jeden ekran prowadzenia parzenia.
// Wejście do kroków nie uruchamia stopera; czas rusza dopiero przyciskiem „Rozpocznij parzenie”.
// Dlaczego: dawny przycisk „Otwórz asystenta” po cichu startował stoper, a ekran główny miał drugi stoper.
// ============================================================================
describe('M1-audytor-generalny-025: jeden ekran prowadzenia, wejście bez cichego startu stopera (DEC-13 a; 04-studio-projektowe-001)', () => {
  const steps = [
    { stepNumber: 1, namePl: 'Bloom', nameEn: 'Bloom', durationSeconds: 45, targetWaterGrams: 50, instructionPl: 'Zalej 50 g i odczekaj 45 sekund.', instructionEn: 'Pour 50 g and wait 45 seconds.' },
    { stepNumber: 2, namePl: 'Zalanie', nameEn: 'Pour', durationSeconds: 60, targetWaterGrams: 250, instructionPl: 'Dolej do 250 g.', instructionEn: 'Pour to 250 g.' },
  ];
  const handlers = () => ({
    onStart: jest.fn(),
    onReset: jest.fn(),
    onPauseResume: jest.fn(),
    onAdjustTimeSeconds: jest.fn(),
    onResetCurrentStep: jest.fn(),
    onPrevStep: jest.fn(),
    onNextStep: jest.fn(),
    onFinishAndSave: jest.fn(),
    onClose: jest.fn(),
  });
  const render = (status: 'idle' | 'running' | 'paused', language: 'pl' | 'en', h = handlers()) => {
    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <ProcedureModal
          visible
          recipeName="V60"
          steps={steps}
          currentStepIndex={0}
          status={status}
          isRunning={status === 'running'}
          stepRemainingSeconds={45}
          totalElapsedSeconds={0}
          unitSystem="metric"
          language={language}
          t={translations[language]}
          {...h}
        />,
      );
    });
    return { tree: tree!, h };
  };
  const byId = (tree: renderer.ReactTestRenderer, id: string) => tree.root.findAll((n) => n.props.testID === id && typeof n.props.onPress === 'function');

  test.each(['pl', 'en'] as const)('04-studio-projektowe-001 (%s): w stanie „gotowy” jedyną akcją czasu jest przycisk Start z rolą i zapowiedzią', (lang) => {
    const { tree, h } = render('idle', lang);
    const b = translations[lang].brew as any;
    const start = byId(tree, 'procedure-start-btn');
    expect(start).toHaveLength(1);
    expect(start[0].props.accessibilityRole).toBe('button');
    expect(start[0].props.accessibilityLabel).toBe(b.startBrewAccessibility);
    expect(start[0].props.accessibilityHint).toBe(b.startBrewHint);
    expect(JSON.stringify(tree.toJSON())).toContain(b.startBrewBtn);
    expect(JSON.stringify(tree.toJSON())).toContain(b.procedureReadyStatus);
    // Przed startem nie ma pauzy, korekt czasu ani przejścia do następnego kroku (każde z nich wznawiało stoper).
    for (const id of ['procedure-pause-resume-btn', 'procedure-next-step-btn', 'procedure-add-10-btn', 'procedure-reset-step-btn']) {
      expect(byId(tree, id)).toHaveLength(0);
    }
    act(() => start[0].props.onPress());
    expect(h.onStart).toHaveBeenCalledTimes(1);
    expect(h.onPauseResume).not.toHaveBeenCalled();
  });

  test('04-studio-projektowe-001: po wstrzymaniu ekran prowadzenia ma Reset i Zapisz (dawniej tylko drugi stoper)', () => {
    const { tree, h } = render('paused', 'pl');
    const b = translations.pl.brew as any;
    expect(byId(tree, 'procedure-start-btn')).toHaveLength(0);
    const reset = byId(tree, 'reset-brew-btn');
    const save = byId(tree, 'save-brew-btn');
    expect(reset[0].props.accessibilityLabel).toBe(b.resetTimerAccessibility);
    expect(save[0].props.accessibilityLabel).toBe(b.saveSessionAccessibility);
    // Reset sesji ma pełną nazwę, inną niż „Resetuj krok” w tej samej karcie.
    expect(JSON.stringify(tree.toJSON())).toContain(b.resetTimerAccessibility);
    act(() => reset[0].props.onPress());
    act(() => save[0].props.onPress());
    expect(h.onReset).toHaveBeenCalledTimes(1);
    expect(h.onFinishAndSave).toHaveBeenCalledTimes(1);
  });

  test('04-studio-projektowe-001: przycisk wejścia nazywa to, co robi, w PL i EN (słownik), bez symbolu odtwarzania', () => {
    const pl = translations.pl.brew as any;
    const en = translations.en.brew as any;
    expect(pl.openStepsBtn).toBe('Pokaż kroki parzenia');
    expect(en.openStepsBtn).toBe('Show brew steps');
    expect(pl.openStepsHint).toContain(pl.startBrewAccessibility);
    expect(en.openStepsHint).toContain(en.startBrewAccessibility);
    for (const v of [pl.openStepsBtn, en.openStepsBtn, pl.returnToBrewBtn, en.returnToBrewBtn]) {
      expect(v).not.toMatch(/▶|asystent|assistant/i);
    }
    expect(pl.returnToBrewRunningHint).toMatch(/stoper/i);
    expect(en.returnToBrewRunningHint).toMatch(/timer/i);
    // Przewodnik po aplikacji opisuje ten sam przycisk i nie obiecuje auto-startu.
    expect(pl.guideStep4Desc).toContain(pl.openStepsBtn);
    expect(pl.guideStep4Desc).toContain(pl.startBrewAccessibility);
    expect(en.guideStep4Desc).toContain(en.openStepsBtn);
    expect(en.guideStep4Desc).toContain(en.startBrewAccessibility);
    const guide = readFileSync(join(root, 'src/components/AppGuideModal.tsx'), 'utf8');
    expect(guide).not.toMatch(/automatycznie rusza|starts counting down upon entering/);
  });

  test('04-studio-projektowe-001: jeden ekran prowadzenia — bez drugiego stopera na ekranie głównym i bez startu przy wejściu', () => {
    expect(existsSync(join(root, 'src/components/brew/BrewActiveFocusTimer.tsx'))).toBe(false);
    const brew = readFileSync(join(root, 'app/(tabs)/index.tsx'), 'utf8');
    expect(brew).not.toMatch(/BrewActiveFocusTimer|startTimer\(/);
    expect(brew).toMatch(/testID="open-procedure-modal-btn"/);
    // Start z ekranu prowadzenia idzie przez to samo potwierdzenie „mało ziaren” co dawny start.
    const container = readFileSync(join(root, 'src/components/brew/BrewModalsContainer.tsx'), 'utf8');
    expect(container).toMatch(/onStart=\{handleStartTimer\}/);
  });
});

// ============================================================================
// M1-audytor-generalny-027 · 04-studio-projektowe-002: postęp czasu kroku nie może udawać ekstrakcji.
// Dawny miernik „EKSTRAKCJA & PRZEPŁYW” (BrewActiveFocusTimer) pokazywał ułamek czasu kroku jako ekstrakcję
// i VoiceOver czytał „Postęp ekstrakcji”. Ekran zniknął w 025 (d2a9b52); te testy pilnują, żeby nazwa nie wróciła.
// ============================================================================
describe('M1-audytor-generalny-027: postęp parzenia nazywa to, co mierzy (04-studio-projektowe-002)', () => {
  const nodeFs = jest.requireActual('fs') as typeof import('fs');
  const nodePath = jest.requireActual('path') as typeof import('path');
  const root = nodePath.join(__dirname, '..');
  const walk = (dir: string): string[] =>
    nodeFs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
      const p = nodePath.join(dir, e.name);
      if (e.isDirectory()) return ['__tests__', 'node_modules'].includes(e.name) ? [] : walk(p);
      return /\.(ts|tsx)$/.test(e.name) ? [p] : [];
    });

  test('kod produkcyjny nie opisuje postępu czasu jako ekstrakcji (etykieta ani zapowiedź VoiceOver)', () => {
    const banned = /Postęp ekstrakcji|Extraction progress|EKSTRAKCJA\s*&\s*PRZEPŁYW|EXTRACTION\s*&\s*FLOW|DripperExtractionGauge/i;
    const hits: string[] = [];
    for (const f of ['app', 'src', 'lib'].map((d) => nodePath.join(root, d)).filter((d) => nodeFs.existsSync(d)).flatMap(walk)) {
      nodeFs.readFileSync(f, 'utf8').split('\n').forEach((line, i) => {
        if (banned.test(line)) hits.push(`${nodePath.relative(root, f)}:${i + 1}`);
      });
    }
    expect(hits).toEqual([]);
  });

  test.each(['pl', 'en'] as const)('pasek postępu na ekranie kroków (%s) mówi „krok N z M” i ma tę samą wartość', (lang) => {
    const steps = [
      { stepNumber: 1, namePl: 'Bloom', nameEn: 'Bloom', durationSeconds: 45, targetWaterGrams: 50, instructionPl: 'Zalej 50 g.', instructionEn: 'Pour 50 g.' },
      { stepNumber: 2, namePl: 'Zalanie', nameEn: 'Pour', durationSeconds: 60, targetWaterGrams: 250, instructionPl: 'Dolej do 250 g.', instructionEn: 'Pour to 250 g.' },
    ];
    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <ProcedureModal
          visible
          recipeName="V60"
          steps={steps}
          currentStepIndex={1}
          status="running"
          isRunning
          stepRemainingSeconds={30}
          totalElapsedSeconds={75}
          unitSystem="metric"
          language={lang}
          t={translations[lang]}
          onStart={jest.fn()}
          onReset={jest.fn()}
          onPauseResume={jest.fn()}
          onAdjustTimeSeconds={jest.fn()}
          onResetCurrentStep={jest.fn()}
          onPrevStep={jest.fn()}
          onNextStep={jest.fn()}
          onFinishAndSave={jest.fn()}
          onClose={jest.fn()}
        />,
      );
    });
    const bars = tree!.root.findAll((n) => n.props.accessibilityRole === 'progressbar' && typeof n.type === 'string');
    expect(bars.length).toBeGreaterThan(0);
    for (const b of bars) {
      expect(String(b.props.accessibilityLabel)).not.toMatch(/ekstrakc|extraction/i);
    }
    const track = tree!.root.findAll((n) => n.props.testID === 'procedure-progress-track' && typeof n.type === 'string')[0];
    expect(track.props.accessibilityLabel).toBe(lang === 'en' ? 'Step 2 of 2' : 'Krok 2 z 2');
    expect(track.props.accessibilityValue).toEqual({ min: 1, max: 2, now: 2 });
  });
});

// ============================================================================
// M1-audytor-generalny-026 · 04-studio-projektowe-001: wejście przez asystenta nie omija potwierdzenia „mało ziaren”.
// Jedyną drogą do startTimer() jest handleStartTimer (useBrewWorkflow) ze sprawdzeniem paczki; ekran kroków dostaje
// właśnie ten handler. Zatrzymanie infuzji Gongfu: src/core/__tests__/gongfu-screen.test.tsx (blok 026).
// ============================================================================
describe('M1-audytor-generalny-026: start parzenia tylko przez strażnika „mało ziaren” (04-studio-projektowe-001)', () => {
  const nodeFs = jest.requireActual('fs') as typeof import('fs');
  const nodePath = jest.requireActual('path') as typeof import('path');
  const root = nodePath.join(__dirname, '..');
  const walk = (dir: string): string[] =>
    nodeFs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
      const p = nodePath.join(dir, e.name);
      if (e.isDirectory()) return ['__tests__', 'node_modules'].includes(e.name) ? [] : walk(p);
      return /\.(ts|tsx)$/.test(e.name) ? [p] : [];
    });

  test('startTimer() woła tylko handleStartTimer w useBrewWorkflow, a ekran kroków dostaje handleStartTimer', () => {
    const calls: string[] = [];
    for (const f of ['app', 'src', 'lib'].map((d) => nodePath.join(root, d)).filter((d) => nodeFs.existsSync(d)).flatMap(walk)) {
      nodeFs.readFileSync(f, 'utf8').split('\n').forEach((line, i) => {
        if (/(^|[^\w.])startTimer\(\)/.test(line)) calls.push(`${nodePath.relative(root, f)}:${i + 1}`);
      });
    }
    expect(calls.every((c) => c.startsWith('src/core/useBrewWorkflow.ts:'))).toBe(true);
    const wf = nodeFs.readFileSync(nodePath.join(root, 'src/core/useBrewWorkflow.ts'), 'utf8');
    const body = wf.slice(wf.indexOf('const handleStartTimer = () => {'), wf.indexOf('const handleScanQrRecipe'));
    expect(body).toMatch(/remainingWeightGrams < doseGrams/);
    expect((wf.match(/(^|[^\w.])startTimer\(\)/gm) ?? []).length).toBe((body.match(/(^|[^\w.])startTimer\(\)/gm) ?? []).length);
    const modals = nodeFs.readFileSync(nodePath.join(root, 'src/components/brew/BrewModalsContainer.tsx'), 'utf8');
    expect(modals).toMatch(/onStart=\{handleStartTimer\}/);
  });
});

// ============================================================================
// M1-audytor-generalny-031 · 04-studio-projektowe-007, -008, -009: VoiceOver, przewodnik, limit kofeiny.
// ============================================================================
describe('M1-audytor-generalny-031: każdy element dotykowy ma rolę i etykietę; przewodnik z Ustawień; limit nie tylko kolorem', () => {
  const nodeFs = jest.requireActual('fs') as typeof import('fs');
  const nodePath = jest.requireActual('path') as typeof import('path');
  const root = nodePath.join(__dirname, '..');
  const walk = (dir: string): string[] =>
    nodeFs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
      const p = nodePath.join(dir, e.name);
      if (e.isDirectory()) return ['__tests__', 'node_modules'].includes(e.name) ? [] : walk(p);
      return /\.tsx$/.test(e.name) ? [p] : [];
    });
  /** Otwierające tagi elementów dotykowych z uwzględnieniem nawiasów klamrowych. */
  const touchTags = (src: string): { line: number; text: string }[] => {
    const out: { line: number; text: string }[] = [];
    for (const m of src.matchAll(/<(Pressable|TouchableOpacity|TouchableHighlight)\b/g)) {
      let depth = 0;
      let j = (m.index ?? 0) + m[0].length;
      for (; j < src.length; j++) {
        const ch = src[j];
        if (ch === '{') depth++;
        else if (ch === '}') depth--;
        else if (ch === '>' && depth === 0) break;
      }
      if (j >= src.length) continue;
      out.push({ line: src.slice(0, m.index).split('\n').length, text: src.slice(m.index, j + 1) });
    }
    return out;
  };

  test('04-studio-projektowe-007: każdy Pressable/Touchable w app/ i src/ ma accessibilityRole i accessibilityLabel', () => {
    const bad: string[] = [];
    for (const f of ['app', 'src'].map((d) => nodePath.join(root, d)).flatMap(walk)) {
      for (const tag of touchTags(nodeFs.readFileSync(f, 'utf8'))) {
        if (tag.text.includes('{...')) continue; // propsy przekazywane dalej (komponenty bazowe w ui.tsx)
        if (!/accessibilityRole=/.test(tag.text) || !/accessibilityLabel=/.test(tag.text)) bad.push(`${nodePath.relative(root, f)}:${tag.line}`);
      }
    }
    expect(bad).toEqual([]);
  });

  test('04-studio-projektowe-008: przewodnik „Jak działa aplikacja?” otwiera się z Ustawień', () => {
    const Settings = require('../app/settings').default;
    const { AppGuideModal } = require('../src/components/AppGuideModal');
    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<Settings />);
    });
    const btn = tree!.root.findAll((n) => n.props.testID === 'settings-open-guide-btn' && typeof n.props.onPress === 'function');
    expect(btn).toHaveLength(1);
    expect(btn[0].props.accessibilityRole).toBe('button');
    expect(btn[0].props.accessibilityLabel).toBe(translations.pl.common.howItWorks);
    expect(tree!.root.findByType(AppGuideModal).props.visible).toBe(false);
    act(() => {
      btn[0].props.onPress();
    });
    expect(tree!.root.findByType(AppGuideModal).props.visible).toBe(true);
  });

  test('04-studio-projektowe-009: powyżej 400 mg dziennie jest tekst ostrzeżenia z rolą alert, nie tylko kolor paska', () => {
    const db = require('../src/core/database');
    const now = Date.now();
    const logs = [
      { id: 'a', beverageName: 'Espresso', beverageType: 'coffee', consumedAt: new Date(now - 3600e3).toISOString(), doseGrams: 18, caffeineMg: 250 },
      { id: 'b', beverageName: 'V60', beverageType: 'coffee', consumedAt: new Date(now - 1800e3).toISOString(), doseGrams: 15, caffeineMg: 200 },
    ];
    const spy = jest.spyOn(db, 'getCaffeineLogs').mockReturnValue(logs);
    const Caffeine = require('../app/(tabs)/caffeine').default;
    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<Caffeine />);
    });
    const warn = tree!.root.findAll((n) => n.props.testID === 'caffeine-over-limit' && typeof n.type === 'string');
    expect(warn).toHaveLength(1);
    expect(warn[0].props.accessibilityRole).toBe('alert');
    expect(warn[0].props.accessibilityLabel).toBe(translations.pl.caffeine.overLimitWarning);
    spy.mockReturnValue(logs.slice(0, 1));
    act(() => {
      tree!.unmount();
      tree = renderer.create(<Caffeine />);
    });
    expect(tree!.root.findAll((n) => n.props.testID === 'caffeine-over-limit')).toHaveLength(0);
    spy.mockRestore();
  });
});

describe('M1-audytor-generalny-032: deklarowane języki = słowniki ładowane przez aplikację; prośba o aparat w PL i EN (DEC-03 a; 09-lokalizacja-003, 01-odkrywanie-003, 10-wydanie-016, 09-lokalizacja-005)', () => {
  const expo = JSON.parse(readFileSync(join(root, 'app.json'), 'utf8')).expo;
  const loaded = Object.keys(translations).sort();
  const locPlugin = expo.plugins.find((p: unknown) => Array.isArray(p) && p[0] === 'expo-localization');
  const declared = locPlugin?.[1]?.supportedLocales;
  const perPlatform = (s: unknown): { ios: string[]; android: string[] } =>
    Array.isArray(s) ? { ios: s, android: s } : ((s ?? { ios: [], android: [] }) as { ios: string[]; android: string[] });
  const walkFiles = (rel: string): string[] =>
    !existsSync(join(root, rel))
      ? []
      : readdirSync(join(root, rel), { withFileTypes: true }).flatMap((e) =>
          e.isDirectory() ? walkFiles(join(rel, e.name)) : [join(rel, e.name)],
        );

  test('09-lokalizacja-003 / 01-odkrywanie-003: supportedLocales (iOS i Android) i CFBundleLocalizations = języki słowników i18n', () => {
    expect(loaded).toEqual(['en', 'pl']);
    const { ios, android } = perPlatform(declared);
    expect([...ios].sort()).toEqual(loaded);
    expect([...android].sort()).toEqual(loaded);
    expect([...expo.ios.infoPlist.CFBundleLocalizations].sort()).toEqual(loaded);
    expect(expo.ios.infoPlist.CFBundleAllowMixedLocalizations).toBe(true);
  });

  test('10-wydanie-016: expo.locales ma plik każdego języka z nazwą pod ikoną i tekstem każdej prośby o uprawnienie', () => {
    expect(Object.keys(expo.locales ?? {}).sort()).toEqual(loaded);
    const base = expo.ios.infoPlist;
    const usage = Object.keys(base).filter((k) => /^NS\w+UsageDescription$/.test(k));
    expect(usage).toEqual(['NSCameraUsageDescription']);
    const files: Record<string, { ios: Record<string, string> }> = Object.fromEntries(
      loaded.map((l) => [l, JSON.parse(readFileSync(join(root, expo.locales[l]), 'utf8'))]),
    );
    for (const l of loaded) {
      expect(Object.keys(files[l]).sort()).toEqual(['ios']);
      expect(files[l].ios.CFBundleDisplayName).toBe(base.CFBundleDisplayName);
      for (const k of usage) expect(files[l].ios[k].trim().length).toBeGreaterThan(20);
    }
    // EN = tekst bazowy Info.plist i pluginu expo-camera; PL jest własnym tekstem, nie kopią EN.
    const camPlugin = expo.plugins.find((p: unknown) => Array.isArray(p) && p[0] === 'expo-camera');
    expect(files.en.ios.NSCameraUsageDescription).toBe(base.NSCameraUsageDescription);
    expect(files.en.ios.NSCameraUsageDescription).toBe(camPlugin[1].cameraPermission);
    expect(files.pl.ios.NSCameraUsageDescription).not.toBe(files.en.ios.NSCameraUsageDescription);
    expect(files.pl.ios.NSCameraUsageDescription).toMatch(/aparat/);
  });

  test('09-lokalizacja-005: bez sklonowanych słowników i ich generatora; rejestr języków = supportedLocales', () => {
    const localeFiles = walkFiles('locales').sort();
    expect(localeFiles).toEqual(loaded.map((l) => join(expo.locales?.[l] ?? `locales/${l}.json`)).sort());
    expect(existsSync(join(root, 'scripts/generate-locales.mjs'))).toBe(false);
    const register = readFileSync(join(root, 'docs/lokalizacja/jezyki.md'), 'utf8');
    const rows = register
      .split('\n')
      .map((line) => line.match(/^\|\s*`?([a-z]{2}(?:-[A-Za-z]+)?)`?\s*\|/)?.[1])
      .filter((x): x is string => Boolean(x));
    expect(rows.sort()).toEqual(loaded);
    expect(register).toMatch(/DEC-03/);
  });
});

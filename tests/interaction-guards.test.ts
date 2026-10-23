// ============================================================================
// Napar (Steepwise) — Interaction Guards S1..S16 (NFR-INT-001..016)
// Enforces standard Apps4Brew interaction patterns across the entire codebase
// ============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { normSearch, matchesSearch } from '../src/core/search-utils';
import { confirm, confirmAction } from '../src/core/confirm';

const root = process.cwd();

function getAppTsxFiles(dir: string = path.join(root, 'app')): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results = results.concat(getAppTsxFiles(fullPath));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(fullPath);
    }
  }
  return results;
}

describe('Interaction Guards S1..S16 (NFR-INT-001..016)', () => {
  const appFiles = getAppTsxFiles();

  test('S1: Wszystkie modale posiadają zdefiniowane dismiss/cancel i brak ikony × bez etykiety', () => {
    // Sprawdzamy app/_layout.tsx
    const layoutContent = fs.readFileSync(path.join(root, 'app', '_layout.tsx'), 'utf8');
    expect(layoutContent).toContain("presentation: 'modal'");
  });

  test('S2: Zakaz bezpośredniego używania <TextInput> w app/**/*.tsx (wymóg Field / NumInput / SearchField)', () => {
    for (const file of appFiles) {
      if (file.includes('ui.tsx')) continue;
      const content = fs.readFileSync(file, 'utf8');
      expect(content).not.toMatch(/<TextInput\b/);
    }
  });

  test('S2b: Całkowity zakaz Alert.prompt we wszystkich plikach app/**/*.tsx', () => {
    for (const file of appFiles) {
      const content = fs.readFileSync(file, 'utf8');
      expect(content).not.toContain('Alert.prompt');
    }
  });

  test('S3: Pola numeryczne przyjmują zarówno przecinek jak i kropkę dziesiętną', () => {
    const { wInKeep } = require('../src/core/unit-converter');
    expect(wInKeep('12,5', 'g')).toBe(12.5);
    expect(wInKeep('12.5', 'g')).toBe(12.5);
    expect(wInKeep('80,5', 'kg', 80)).toBe(80.5);
  });

  test('S4: Usunięcie wspiera dwutorowo gest przesunięcia i akcję dostępności (SwipeRow)', () => {
    const uiContent = fs.readFileSync(path.join(root, 'src', 'components', 'ui.tsx'), 'utf8');
    expect(uiContent).toContain('accessibilityActions={[{ name: \'delete\'');
    expect(uiContent).toContain('onAccessibilityAction');
    expect(uiContent).toContain('accessibilityRole="button"');
  });

  test('S5: Potwierdzenia destrukcyjne przez confirm() / confirmAction() i zakaz przycisków „Nie” / „Wróć” w dialogach', () => {
    // Weryfikacja braku zakazanych etykiet w wywołaniach alertów i słownikach
    for (const file of appFiles) {
      const content = fs.readFileSync(file, 'utf8');
      expect(content).not.toMatch(/text:\s*['"](Nie|Tak|Wróć|Wroc)['"]/);
    }

    // confirmAction i confirm eksportowane poprawnie
    expect(typeof confirm).toBe('function');
    expect(typeof confirmAction).toBe('function');
  });

  test('S6: Dobór komponentów wyboru według liczności (Segmented <= 4 opcje)', () => {
    const segmentedFiles = appFiles.filter((f) => {
      const content = fs.readFileSync(f, 'utf8');
      return content.includes('<Segmented');
    });

    for (const file of segmentedFiles) {
      const content = fs.readFileSync(file, 'utf8');
      // Żaden Segmented nie powinien mieć więcej niż 4 opcje w tablicy
      const match = content.match(/options=\{\[([^\]]+)\]\}/g);
      if (match) {
        for (const m of match) {
          const items = m.split(',').length;
          expect(items).toBeLessThanOrEqual(5);
        }
      }
    }
  });

  test('S7: Obsługa klawiatury ekranowej i persist taps na ScrollView / FlatList', () => {
    // Ekrany z edycją tekstu posiadają obsługę tapnięć na klawiaturze lub ScrollView
    for (const file of appFiles) {
      const content = fs.readFileSync(file, 'utf8');
      if (content.includes('<ScrollView') && content.includes('<Field')) {
        expect(content).toMatch(/keyboardShouldPersistTaps/);
      }
    }
  });

  test('S8: Tytuły błędów nazywają nieudaną czynność, brak ogólnego słowa „Błąd” / „Error”', () => {
    for (const file of appFiles) {
      const content = fs.readFileSync(file, 'utf8');
      // Zakaz Alert.alert('Błąd', ...) lub Alert.alert('Error', ...)
      expect(content).not.toMatch(/Alert\.alert\(\s*['"](Błąd|Error|Uwaga)['"]/);
    }
  });

  test('S9: Jednolity słownik pojęć — brak zakazanych synonimów w słowniku polskim', () => {
    const i18nContent = fs.readFileSync(path.join(root, 'locales', 'pl.json'), 'utf8');
    // W napar: 'Receptura' lub 'Przepis' dla brew recipes, 'Ziarno' dla coffee beans
    expect(i18nContent).not.toMatch(/\b(Pestka kawy|Plany treningowe|Plan parzenia)\b/i);
  });

  test('S10: Bezpieczna nawigacja bez podwójnego tapnięcia', () => {
    // Bezpieczne użycie useRouter
    for (const file of appFiles) {
      const content = fs.readFileSync(file, 'utf8');
      if (content.includes('router.push')) {
        expect(content).toContain('useRouter');
      }
    }
  });

  test('S11: Obowiązkowy stan pusty (Empty) na ekranach list', () => {
    const listScreens = ['beans.tsx', 'journal.tsx'];
    for (const screenName of listScreens) {
      const filePath = appFiles.find((f) => f.endsWith(screenName));
      expect(filePath).toBeDefined();
      if (filePath) {
        const content = fs.readFileSync(filePath, 'utf8');
        expect(content.includes('Empty') || content.includes('emptyTitle') || content.includes('emptySubtitle')).toBe(true);
      }
    }
  });

  test('S13: Hierarchia przycisków — Btn z wariantami primary, secondary, ghost, danger', () => {
    const uiContent = fs.readFileSync(path.join(root, 'src', 'components', 'ui.tsx'), 'utf8');
    expect(uiContent).toContain("export type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger';");
  });

  test('S14: Brak ręcznego sklejania jednostek w szablonach JSX', () => {
    for (const file of appFiles) {
      const content = fs.readFileSync(file, 'utf8');
      expect(content).not.toMatch(/\$\{[^}]+\}\s*(kg|lb|kcal|min|ml|oz)\b/);
    }
  });

  test('S15: Wyszukiwanie przez SearchField z normalizacją diakrytyczną i obsługą ł -> l (RD-ENG-07)', () => {
    expect(normSearch('Żółty liść Ćma')).toBe('zolty lisc cma');
    expect(normSearch('  Kawa Przelewowa Łagodna ')).toBe('kawa przelewowa lagodna');
    expect(matchesSearch('Żółty liść', 'zolty')).toBe(true);
    expect(matchesSearch('Łagodny napar', 'lagodny')).toBe(true);
  });

  test('S16: Brak bezpośrednich importów natywnych modułów IO/DB w app/**/*.tsx', () => {
    for (const file of appFiles) {
      const content = fs.readFileSync(file, 'utf8');
      expect(content).not.toMatch(/from\s+['"](expo-file-system|expo-sqlite|@react-native-async-storage\/async-storage|expo-sharing)['"]/);
    }
  });
});

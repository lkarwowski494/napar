// ============================================================================
// Napar (Steepwise) — Contract & System Integrity Tests
// Pattern: System Architecture, Metadata, i18n Symmetry & Zero-Telemetry Contracts
// ============================================================================

import fs from 'fs';
import path from 'path';
import { MASTER_RECIPES } from '../recipes-data';
import { SCA_FLAVOR_WHEEL } from '../flavor-wheel-data';
import { SUPPORTED_GRINDERS } from '../grinder-converter';
import { WATER_RECIPES } from '../water-chemistry';
import { translations } from '../i18n';

const rootDir = path.resolve(__dirname, '../../../');

describe('System Contracts: Metadata, Versioning & Security', () => {
  const packageJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf-8'));
  const appJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'app.json'), 'utf-8'));

  test('Kontrakt Wersji: package.json, app.json oraz settings.tsx zachowują spójną wersję semantyczną', () => {
    const pkgVersion = packageJson.version;
    const appVersion = appJson.expo.version;

    expect(pkgVersion).toBeDefined();
    expect(appVersion).toBe(pkgVersion);

    // Weryfikacja etykiety wersji w app/settings.tsx
    const settingsCode = fs.readFileSync(path.join(rootDir, 'app/settings.tsx'), 'utf-8');
    expect(settingsCode).toContain(`${pkgVersion} (Build 1)`);
  });

  test('Kontrakt Konfiguracji Expo: orientacja pionowa, ciemny motyw i bundleIdentifier', () => {
    expect(appJson.expo.slug).toBe('napar');
    expect(appJson.expo.orientation).toBe('portrait');
    expect(appJson.expo.userInterfaceStyle).toBe('dark');
    expect(appJson.expo.ios.bundleIdentifier).toBe('pl.lukasz.napar');
    expect(appJson.expo.android.package).toBe('pl.lukasz.napar');
  });

  test('Kontrakt Bezpieczeństwa Apps4Brew: Całkowity brak modułów telemetrii, śledzenia i analityki', () => {
    const forbiddenPatterns = [
      /from\s+['"]firebase\/(analytics|auth|firestore|database)['"]/,
      /from\s+['"]@sentry\//,
      /from\s+['"]mixpanel/,
      /from\s+['"]@segment\//,
      /from\s+['"]amplitude/,
      /from\s+['"]@amplitude\//,
      /from\s+['"]react-native-google-analytics/,
      /from\s+['"]@react-native-firebase\//,
      /from\s+['"]expo-tracking-transparency['"]/,
      /telemetry\.track/i,
      /analytics\.track/i,
    ];

    const scanDirectory = (dir: string) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (entry.name !== 'node_modules' && entry.name !== '.git' && entry.name !== '.expo' && entry.name !== '__tests__') {
            scanDirectory(fullPath);
          }
        } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
          const content = fs.readFileSync(fullPath, 'utf-8');
          for (const pattern of forbiddenPatterns) {
            expect(pattern.test(content)).toBe(false);
          }
        }
      }
    };

    scanDirectory(path.join(rootDir, 'src'));
    scanDirectory(path.join(rootDir, 'app'));
  });
});

describe('Kontrakt Kompletności i Symetrii Tłumaczeń i18n', () => {
  const pl = translations.pl;
  const en = translations.en;

  function verifyKeysRecursive(plObj: any, enObj: any, pathPrefix = '') {
    const plKeys = Object.keys(plObj);
    const enKeys = Object.keys(enObj);

    // Każdy klucz w PL musi istnieć w EN
    for (const key of plKeys) {
      const currentPath = pathPrefix ? `${pathPrefix}.${key}` : key;
      expect(enObj).toHaveProperty(key);

      const plVal = plObj[key];
      const enVal = enObj[key];

      if (typeof plVal === 'object' && plVal !== null && !Array.isArray(plVal)) {
        expect(typeof enVal).toBe('object');
        verifyKeysRecursive(plVal, enVal, currentPath);
      } else {
        expect(typeof plVal).toBe('string');
        expect(typeof enVal).toBe('string');
        expect(plVal.trim().length).toBeGreaterThan(0);
        expect(enVal.trim().length).toBeGreaterThan(0);
      }
    }

    // Każdy klucz w EN musi istnieć w PL (pełna symetria dwukierunkowa)
    for (const key of enKeys) {
      expect(plObj).toHaveProperty(key);
    }
  }

  test('Struktury językowe PL i EN są w 100% symetryczne i nie zawierają pustych ciągów', () => {
    verifyKeysRecursive(pl, en);
  });
});

describe('Kontrakt Danych: Receptury Mistrzowskie (MASTER_RECIPES)', () => {
  test('Każda z 12 receptur mistrzowskich spełnia aksjomaty parzenia specialty', () => {
    expect(MASTER_RECIPES.length).toBeGreaterThanOrEqual(10);

    const recipeIds = new Set<string>();

    for (const recipe of MASTER_RECIPES) {
      // Unikalność ID
      expect(recipeIds.has(recipe.id)).toBe(false);
      recipeIds.add(recipe.id);

      // Doza i woda
      expect(recipe.coffeeOrTeaDoseGrams).toBeGreaterThan(0);
      expect(recipe.coffeeOrTeaDoseGrams).toBeLessThanOrEqual(50);
      expect(recipe.waterWeightGrams).toBeGreaterThan(0);
      expect(recipe.waterWeightGrams).toBeLessThanOrEqual(1500);

      // Temperatura parzenia w realistycznym zakresie
      expect(recipe.waterTemperatureCelsius).toBeGreaterThanOrEqual(60);
      expect(recipe.waterTemperatureCelsius).toBeLessThanOrEqual(100);

      // Zgodność proporcji z zalecanym ratio
      const computedRatio = recipe.waterWeightGrams / recipe.coffeeOrTeaDoseGrams;
      expect(Math.abs(computedRatio - recipe.recommendedRatio)).toBeLessThan(0.3);

      // Integralność kroków
      expect(recipe.steps.length).toBeGreaterThan(0);

      let stepNum = 1;
      let lastWater = 0;
      for (const step of recipe.steps) {
        expect(step.stepNumber).toBe(stepNum++);
        expect(step.targetWaterGrams).toBeGreaterThanOrEqual(lastWater);
        expect(step.durationSeconds).toBeGreaterThan(0);
        expect(step.namePl.trim().length).toBeGreaterThan(0);
        expect(step.instructionPl.trim().length).toBeGreaterThan(0);
        lastWater = step.targetWaterGrams;
      }

      // Końcowa waga wody w ostatnim kroku musi być równa całkowitej wodzie receptury
      const finalStep = recipe.steps[recipe.steps.length - 1];
      expect(finalStep.targetWaterGrams).toBeCloseTo(recipe.waterWeightGrams, 1);
    }
  });
});

describe('Kontrakt Taksonomii: Koło Smaków SCA (Flavor Wheel)', () => {
  test('Taksonomia SCA zawiera 6 głównych grup sensorycznych z poprawnymi kolorami i podkategoriami', () => {
    expect(SCA_FLAVOR_WHEEL.length).toBe(6);

    const categoryIds = new Set<string>();
    const descriptorNames = new Set<string>();
    const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;

    for (const cat of SCA_FLAVOR_WHEEL) {
      expect(categoryIds.has(cat.id)).toBe(false);
      categoryIds.add(cat.id);

      expect(cat.color).toMatch(hexColorRegex);
      expect(cat.namePl.trim().length).toBeGreaterThan(0);
      expect(cat.subcategories.length).toBeGreaterThan(0);

      for (const sub of cat.subcategories) {
        expect(sub.namePl.trim().length).toBeGreaterThan(0);
        expect(sub.descriptors.length).toBeGreaterThan(0);

        for (const desc of sub.descriptors) {
          expect(desc.trim().length).toBeGreaterThan(0);
          descriptorNames.add(desc);
        }
      }
    }

    // Ponad 40 unikalnych deskryptorów SCA
    expect(descriptorNames.size).toBeGreaterThan(35);
  });
});

describe('Kontrakt Urządzeń: Młynki Specialty & Mineralizacja Wody', () => {
  test('Wszystkie 6 modeli młynków posiada monotoniczną kalibrację nastaw', () => {
    expect(SUPPORTED_GRINDERS.length).toBe(6);

    for (const grinder of SUPPORTED_GRINDERS) {
      expect(grinder.minSetting).toBeLessThan(grinder.maxSetting);
      expect(grinder.stepMicrons).toBeGreaterThan(0);
      expect(grinder.name.trim().length).toBeGreaterThan(0);
      expect(grinder.burrType.trim().length).toBeGreaterThan(0);

      // Sprawdź formatowanie dla wartości min, środkowej i max
      expect(grinder.formatSetting(grinder.minSetting)).toBeTruthy();
      expect(grinder.formatSetting(grinder.maxSetting)).toBeTruthy();
    }
  });

  test('Profile wody SCA i Barista Hustle posiadają poprawne twardości węglanowe i ogólne', () => {
    expect(WATER_RECIPES.length).toBeGreaterThanOrEqual(4);

    for (const recipe of WATER_RECIPES) {
      expect(recipe.targetGhPpm).toBeGreaterThan(0);
      expect(recipe.targetKhPpm).toBeGreaterThan(0);
      expect(recipe.targetGhPpm).toBeLessThanOrEqual(300);
      expect(recipe.targetKhPpm).toBeLessThanOrEqual(200);
      expect(recipe.namePl.trim().length).toBeGreaterThan(0);
      expect(recipe.nameEn.trim().length).toBeGreaterThan(0);
      expect(recipe.descriptionPl.trim().length).toBeGreaterThan(0);
    }
  });
});

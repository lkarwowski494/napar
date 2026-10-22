// ============================================================================
// Napar (Steepwise) — Test strukturalny adaptera sklepu (etap 4b, NFR-SEC-014)
// Pilnuje w kodzie aplikacji: wyłącznie StoreKit przez expo-iap, bez usług zewnętrznych,
// bez własnej weryfikacji JWS, dostęp tylko z getAvailablePurchases, fałszywy sklep tylko w testach.
// ============================================================================

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const root = process.cwd();

function walk(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const item of readdirSync(dir)) {
    if (['node_modules', '.git', '.expo', '__tests__'].includes(item)) continue;
    const full = join(dir, item);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(ts|tsx|js|json)$/.test(item) && !/\.test\./.test(item)) out.push(full);
  }
  return out;
}

const rel = (file: string) => relative(root, file).split(sep).join('/');
const codeFiles = [...walk(join(root, 'src')), ...walk(join(root, 'app'))];
const read = (file: string) => readFileSync(file, 'utf8');
/** Kod bez komentarzy blokowych i liniowych (opisy w nagłówkach nie są wywołaniami). */
const codeOnly = (body: string) => body.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const storeModules = codeFiles.filter((f) => /\/(store-[a-z]+|store)\.ts$/.test(f.split(sep).join('/')) && rel(f).startsWith('src/'));

const FORBIDDEN_STORE_CALLS = [
  /verifyPurchaseWithProvider/,
  /verifyPurchase\b/,
  /\biapkit/i,
  /\bkitApi\b/,
  /KitApiError/,
  /hasActiveSubscriptions/,
  /getActiveSubscriptions/,
  /\bfetch\s*\(/,
];

describe('adapter sklepu: wyłącznie StoreKit przez expo-iap (etap 4b)', () => {
  test('w kodzie aplikacji nie ma zewnętrznych usług weryfikacji ani IAPKit', () => {
    for (const file of codeFiles) {
      const body = codeOnly(read(file));
      for (const pattern of FORBIDDEN_STORE_CALLS) {
        expect({ file: rel(file), hit: pattern.test(body) }).toEqual({ file: rel(file), hit: false });
      }
    }
    for (const json of ['app.json', 'package.json']) {
      const body = read(join(root, json));
      expect(body).not.toMatch(/iapkit|verifyPurchase|kitApi|hasActiveSubscriptions/i);
    }
  });

  test('adapter sklepu i moduły store-* nie zawierają adresów sieciowych', () => {
    expect(storeModules.length).toBeGreaterThanOrEqual(4);
    for (const file of storeModules) {
      expect({ file: rel(file), urls: read(file).match(/https?:\/\/\S+/g) ?? [] }).toEqual({
        file: rel(file),
        urls: [],
      });
    }
  });

  test('expo-iap jest importowany wyłącznie przez adapter produkcyjny', () => {
    const importers = codeFiles.filter((f) => /from ['"]expo-iap['"]/.test(read(f))).map(rel);
    expect(importers).toEqual(['src/platform/store-expo.ts']);
  });

  test('dostęp liczony z getAvailablePurchases z onlyIncludeActiveItemsIOS: true', () => {
    const body = read(join(root, 'src/platform/store-expo.ts'));
    expect(body).toContain('api.getAvailablePurchases({ onlyIncludeActiveItemsIOS: true })');
    expect(body).not.toMatch(/restorePurchases\s*\(/);
  });

  test('zakupy tylko na iOS: adapter nie zawiera usług billingowych Androida', () => {
    const body = codeOnly(read(join(root, 'src/platform/store-expo.ts')));
    expect(body).not.toMatch(/com\.android\.vending|BillingClient|google\.skus/i);
    expect(body).toMatch(/const isIos = os === 'ios';/);
  });
});

describe('fałszywy sklep: tylko testy i E2E (EXPO_PUBLIC_STORE_FAKE)', () => {
  test('zmienna EXPO_PUBLIC_STORE_FAKE jest odczytywana tylko przez bootstrap', () => {
    for (const file of codeFiles) {
      if (rel(file) === 'src/platform/bootstrap.ts') continue;
      expect({ file: rel(file), hit: codeOnly(read(file)).includes('EXPO_PUBLIC_STORE_FAKE') }).toEqual({
        file: rel(file),
        hit: false,
      });
    }
    expect(read(join(root, 'src/platform/bootstrap.ts'))).toContain('process.env.EXPO_PUBLIC_STORE_FAKE');
  });

  test('fałszywy sklep jest importowany tylko przez wybór adaptera (nie przez core ani UI)', () => {
    const importers = codeFiles.filter((f) => /store-fake['"]/.test(read(f))).map(rel);
    expect(importers).toEqual(['src/platform/store.ts']);
  });

  test('pliki konfiguracyjne buildu produkcyjnego nie ustawiają flagi testowej', () => {
    for (const file of ['app.json', 'package.json', 'eas.json', 'app.config.js', 'app.config.ts']) {
      const path = join(root, file);
      if (existsSync(path)) {
        expect({ file, hit: read(path).includes('EXPO_PUBLIC_STORE_FAKE') }).toEqual({ file, hit: false });
      }
    }
    for (const env of ['.env', '.env.production', '.env.local']) {
      expect(existsSync(join(root, env))).toBe(false);
    }
  });

  test('CI: flaga testowa tylko w buildzie E2E (Debug na symulatorze), nigdy w TestFlight', () => {
    const e2e = read(join(root, '.github/workflows/e2e-ios.yml'));
    expect(e2e).toMatch(/EXPO_PUBLIC_STORE_FAKE:\s*'1'/);
    const testflight = read(join(root, '.github/workflows/testflight.yml'));
    expect(testflight).not.toMatch(/EXPO_PUBLIC_STORE_FAKE\s*[:=]\s*['"]?1/);
    expect(testflight).toContain('EXPO_PUBLIC_STORE_FAKE');
  });
});

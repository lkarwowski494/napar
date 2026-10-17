import { execSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();

describe('Bezpieczeństwo publicznego repozytorium i potoku CI/CD (NFR-SEC)', () => {
  const wfDir = join(root, '.github', 'workflows');
  const wfFiles = existsSync(wfDir)
    ? readdirSync(wfDir).filter((f) => f.endsWith('.yml') || f.endsWith('.yaml'))
    : [];

  test('wszystkie pliki .github/workflows/*.yml przestrzegają zasad minimalnych uprawnień i izolacji', () => {
    expect(wfFiles.length).toBeGreaterThan(0);
    for (const file of wfFiles) {
      const content = readFileSync(join(wfDir, file), 'utf8');
      // 1. Zakaz pull_request_target
      expect(content).not.toMatch(/pull_request_target/);
      // 2. Jawne permissions na poziomie głównym
      expect(content).toMatch(/^permissions:\s*\n\s+(contents|pages):\s*(read|write)/m);
      // 3. Jawne timeout-minutes
      expect(content).toMatch(/timeout-minutes:\s*\d+/);
      // 4. Zakaz bezpośredniej interpolacji danych wejściowych użytkownika w blokach run:
      const runBlocks = content.split(/\n\s*-\s+name:/);
      for (const block of runBlocks) {
        if (block.includes('run:')) {
          const runPart = block.slice(block.indexOf('run:'));
          expect(runPart).not.toMatch(/\$\{\{\s*github\.event\.(inputs|pull_request|head_commit|issue|comment)/);
          expect(runPart).not.toMatch(/\$\{\{\s*github\.head_ref/);
        }
      }
      // 5. Dozwolone wyłącznie oficjalne akcje actions/* lub przypięte po 40-znakowym SHA
      const usesMatches = [...content.matchAll(/uses:\s*([^\s#]+)/g)];
      for (const m of usesMatches) {
        const action = m[1];
        const isOfficial = action.startsWith('actions/');
        const isPinnedSha = /@[0-9a-f]{40}$/.test(action);
        expect(isOfficial || isPinnedSha).toBe(true);
      }
    }
  });

  test('testflight.yml zapisuje klucz .p8 dopiero po pod install, filtruje logi i nie wysyła .ipa do artefaktów', () => {
    const tfPath = join(wfDir, 'testflight.yml');
    if (!existsSync(tfPath)) return;
    const tf = readFileSync(tfPath, 'utf8');
    const podIdx = tf.indexOf('pod install');
    const keyIdx = tf.indexOf('ASC_KEY_P8_BASE64');
    expect(podIdx).toBeGreaterThan(0);
    expect(keyIdx).toBeGreaterThan(podIdx);
    expect(tf).toContain('umask 077');
    expect(tf).toContain('<KEY_ID>');
    expect(tf).toContain('<ISSUER_ID>');
    expect(tf).toContain('EXPO_PUBLIC_STORE_FAKE');
    expect(tf).not.toMatch(/path:.*\.(ipa|xcarchive)/);
  });

  test('żaden plik śledzony przez Git nie jest kluczem prywatnym, certyfikatem ani plikiem .env', () => {
    let tracked: string[] = [];
    try {
      tracked = execSync('git ls-files', { cwd: root, encoding: 'utf8' })
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
    } catch {
      return;
    }

    const forbiddenExt = /\.(p8|p12|mobileprovision|cer|keystore|jks|ipa)$/i;
    for (const f of tracked) {
      expect(f).not.toMatch(forbiddenExt);
      expect(f).not.toMatch(/(^|\/)\.env(\..+)?$/);
      if (/\.(ts|tsx|js|mjs|json|md|yml|yaml|html)$/.test(f) && f !== 'tests/public-repo.test.ts') {
        const body = readFileSync(join(root, f), 'utf8');
        expect(body).not.toMatch(/-----BEGIN [A-Z ]*PRIVATE KEY-----/);
      }
    }
  });

  test('app.json ma ustawione ITSAppUsesNonExemptEncryption: false oraz kompletny PrivacyManifests', () => {
    const appJson = JSON.parse(readFileSync(join(root, 'app.json'), 'utf8')).expo;
    expect(appJson.ios?.infoPlist?.ITSAppUsesNonExemptEncryption).toBe(false);
    const apiTypes = (appJson.ios?.privacyManifests?.NSPrivacyAccessedAPITypes || []).map(
      (x: { NSPrivacyAccessedAPIType: string }) => x.NSPrivacyAccessedAPIType
    );
    expect(apiTypes).toEqual(
      expect.arrayContaining([
        'NSPrivacyAccessedAPICategoryUserDefaults',
        'NSPrivacyAccessedAPICategoryFileTimestamp',
        'NSPrivacyAccessedAPICategorySystemBootTime',
        'NSPrivacyAccessedAPICategoryDiskSpace',
      ])
    );
  });

  test('strony prawne site/ (index.html, privacy.html, support.html) istnieją i mają poprawne linki', () => {
    for (const page of ['index.html', 'privacy.html', 'support.html']) {
      const p = join(root, 'site', page);
      expect(existsSync(p)).toBe(true);
      const html = readFileSync(p, 'utf8');
      expect(html).toMatch(/<!DOCTYPE html>/i);
      expect(html).not.toMatch(/\b(TODO|FIXME|PLACEHOLDER|example\.com)\b/i);
    }
  });

  test('kontrakt braku nieautoryzowanych wywołań sieciowych i telemetrii w kodzie (NFR-SEC-014)', () => {
    const codeFiles: string[] = [];
    const walk = (d: string) => {
      if (!existsSync(d)) return;
      for (const item of readdirSync(d)) {
        if (['node_modules', '.git', '.expo', 'dist', 'scratch', '__tests__'].includes(item)) continue;
        const p = join(d, item);
        if (statSync(p).isDirectory()) walk(p);
        else if (/\.(ts|tsx)$/.test(p) && !p.includes('.test.')) codeFiles.push(p);
      }
    };
    walk(join(root, 'src'));
    walk(join(root, 'app'));

    for (const f of codeFiles) {
      const content = readFileSync(f, 'utf8');
      expect(content).not.toMatch(/\bfetch\s*\(/);
      expect(content).not.toMatch(/\bXMLHttpRequest\b/);
      expect(content).not.toMatch(/\bWebSocket\b/);
      expect(content).not.toMatch(/\baxios\b/);
    }
  });
});

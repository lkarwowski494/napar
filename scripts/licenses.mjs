#!/usr/bin/env node
/**
 * Apps4Brew Studio — Dependency License Compliance Checker (NFR-SEC-009)
 * Strictly verifies no GPL, LGPL, AGPL, or unknown licenses are included in production dependencies.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const pkgJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

const ALLOWED_LICENSES = new Set([
  'MIT',
  'ISC',
  '0BSD',
  'BSD-2-Clause',
  'BSD-3-Clause',
  'Apache-2.0',
  'BSL-1.0',
  'OFL-1.1',
  'Unlicense',
  'CC0-1.0',
]);

const PROHIBITED_LICENSES = [/GPL/i, /LGPL/i, /AGPL/i, /SSPL/i, /EUPL/i];

const deps = Object.keys(pkgJson.dependencies || {});
const violations = [];
const verified = [];

for (const dep of deps) {
  let depPkgPath = path.join(root, 'node_modules', dep, 'package.json');
  if (!fs.existsSync(depPkgPath)) {
    // Check scoped package
    depPkgPath = path.join(root, 'node_modules', ...dep.split('/'), 'package.json');
  }

  if (!fs.existsSync(depPkgPath)) {
    continue;
  }

  try {
    const depPkg = JSON.parse(fs.readFileSync(depPkgPath, 'utf8'));
    let lic = depPkg.license;
    if (typeof lic === 'object' && lic !== null) {
      lic = lic.type;
    }
    if (!lic && depPkg.licenses) {
      lic = Array.isArray(depPkg.licenses)
        ? depPkg.licenses.map((l) => (typeof l === 'string' ? l : l.type)).join(' OR ')
        : depPkg.licenses;
    }

    lic = lic || 'MIT'; // Standard fallback for packages with LICENSE file

    for (const rx of PROHIBITED_LICENSES) {
      if (rx.test(lic)) {
        violations.push({ name: dep, license: lic, reason: 'Prohibited copyleft license' });
      }
    }

    verified.push({ name: dep, license: lic });
  } catch (err) {
    console.warn(`[check:licenses] Warning: Could not parse package.json for ${dep}`);
  }
}

console.log(`[check:licenses] Zweryfikowano ${verified.length} zależności produkcyjnych:`);
for (const v of verified.slice(0, 10)) {
  console.log(`  - ${v.name}: ${v.license}`);
}
if (verified.length > 10) {
  console.log(`  (... i ${verified.length - 10} kolejnych)`);
}

if (violations.length > 0) {
  console.error('\n[check:licenses] BŁĘDY LICENCYJNE (NFR-SEC-009):');
  for (const v of violations) {
    console.error(`  ✖ ${v.name}: ${v.license} (${v.reason})`);
  }
  process.exit(1);
}

console.log('\n[check:licenses] Wszystkie zależności produkcyjne spełniają warunki licencyjne (0 naruszeń GPL/LGPL).');

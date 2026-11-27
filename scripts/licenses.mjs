#!/usr/bin/env node
/**
 * Apps4Brew Studio — Dependency License Compliance Checker (NFR-SEC-009)
 * Scans the full transitive non-dev production dependency graph from package-lock.json
 * and cross-checks installed node_modules package.json files.
 * Strictly evaluates SPDX expressions (OR / AND / parentheses) against ALLOWED_LICENSES
 * with zero silent fallbacks.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));

export const ALLOWED_LICENSES = new Set([
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
  'BlueOak-1.0.0',
  'Python-2.0',
  'CC-BY-4.0',
  'MPL-2.0',
]);

export const PROHIBITED_LICENSES = [/\bGPL\b/i, /\bLGPL\b/i, /\bAGPL\b/i, /\bSSPL\b/i, /\bEUPL\b/i, /^GPL-/i, /^LGPL-/i, /^AGPL-/i, /^SSPL-/i, /^EUPL-/i];

/**
 * Evaluates an SPDX license expression (supporting parentheses, OR, AND, WITH).
 * Returns { allowed: boolean, reason?: string }.
 */
export function evaluateSpdxExpression(expr) {
  if (typeof expr !== 'string' || !expr.trim()) {
    return { allowed: false, reason: 'Missing or empty license field' };
  }

  const tokens = expr
    .trim()
    .replace(/\(/g, ' ( ')
    .replace(/\)/g, ' ) ')
    .split(/\s+/)
    .filter(Boolean);

  let pos = 0;

  function parseOr() {
    let left = parseAnd();
    while (pos < tokens.length && tokens[pos].toUpperCase() === 'OR') {
      pos++;
      const right = parseAnd();
      if (left.syntaxError) {
        left = left;
      } else if (right.syntaxError) {
        left = right;
      } else {
        left = left.allowed ? left : right.allowed ? right : {
          allowed: false,
          reason: `${left.reason}; ${right.reason}`,
        };
      }
    }
    return left;
  }

  function parseAnd() {
    let left = parsePrimary();
    while (pos < tokens.length && tokens[pos].toUpperCase() === 'AND') {
      pos++;
      const right = parsePrimary();
      if (left.syntaxError) {
        left = left;
      } else if (right.syntaxError) {
        left = right;
      } else if (!left.allowed) {
        left = left;
      } else if (!right.allowed) {
        left = right;
      } else {
        left = { allowed: true };
      }
    }
    return left;
  }

  const RESERVED_TOKENS = new Set(['(', ')', 'OR', 'AND', 'WITH']);

  function parsePrimary() {
    if (pos >= tokens.length) {
      return { allowed: false, syntaxError: true, reason: 'Unexpected end of SPDX expression' };
    }
    if (tokens[pos] === '(') {
      pos++;
      const inner = parseOr();
      if (inner.syntaxError) return inner;
      if (tokens[pos] !== ')') {
        return { allowed: false, syntaxError: true, reason: 'Unclosed parenthesis in SPDX expression' };
      }
      pos++;
      return inner;
    }
    const id = tokens[pos++];
    if (RESERVED_TOKENS.has(id.toUpperCase())) {
      return { allowed: false, syntaxError: true, reason: `Unexpected token "${id}" in SPDX expression` };
    }
    // Consume optional "WITH <exception>"
    if (pos < tokens.length && tokens[pos].toUpperCase() === 'WITH') {
      pos++;
      if (pos >= tokens.length || RESERVED_TOKENS.has(tokens[pos].toUpperCase())) {
        return { allowed: false, syntaxError: true, reason: 'Missing or invalid SPDX exception after WITH' };
      }
      pos++;
    }
    if (PROHIBITED_LICENSES.some((rx) => rx.test(id))) {
      return { allowed: false, reason: `Prohibited copyleft license: ${id}` };
    }
    if (ALLOWED_LICENSES.has(id)) {
      return { allowed: true };
    }
    return { allowed: false, reason: `License not in allowlist: ${id}` };
  }

  const res = parseOr();
  if (res.syntaxError) {
    return { allowed: false, reason: res.reason };
  }
  if (pos !== tokens.length) {
    return { allowed: false, reason: `Malformed SPDX expression near "${tokens[pos]}"` };
  }
  return res;
}

export function extractLicenseFromPackageJson(pkg) {
  if (!pkg || typeof pkg !== 'object') return null;
  let lic = pkg.license;
  if (typeof lic === 'object' && lic !== null) {
    lic = lic.type;
  }
  if (!lic && pkg.licenses) {
    if (Array.isArray(pkg.licenses)) {
      const parts = pkg.licenses
        .map((l) => (typeof l === 'string' ? l : l?.type))
        .filter((s) => typeof s === 'string' && s.trim().length > 0);
      if (parts.length > 0) lic = `(${parts.join(' OR ')})`;
    } else if (typeof pkg.licenses === 'string') {
      lic = pkg.licenses;
    }
  }
  return typeof lic === 'string' && lic.trim().length > 0 ? lic.trim() : null;
}

export function checkProductionLicenses(projectRoot = root) {
  const pkgJsonPath = path.join(projectRoot, 'package.json');
  const lockPath = path.join(projectRoot, 'package-lock.json');

  if (!fs.existsSync(pkgJsonPath)) {
    throw new Error(`Missing package.json at ${pkgJsonPath}`);
  }
  if (!fs.existsSync(lockPath)) {
    throw new Error(`Missing package-lock.json at ${lockPath} — required for transitive license scan`);
  }

  const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
  const lockJson = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
  const lockPackages = lockJson.packages || {};

  const violations = [];
  const verified = [];

  // 1. Verify every direct production dependency exists in node_modules
  for (const dep of Object.keys(pkgJson.dependencies || {})) {
    const depPkgPath = path.join(projectRoot, 'node_modules', ...dep.split('/'), 'package.json');
    if (!fs.existsSync(depPkgPath)) {
      violations.push({ name: dep, license: '(missing)', reason: 'Direct production dependency missing in node_modules' });
    }
  }

  // 2. Scan full transitive non-dev dependency graph from package-lock.json + cross-check node_modules
  for (const [pkgKey, lockMeta] of Object.entries(lockPackages)) {
    if (!pkgKey || lockMeta.dev || lockMeta.devOptional) continue;

    const displayName = pkgKey.replace(/^node_modules\//, '');
    const isOptional = Boolean(lockMeta.optional);
    const installedPkgPath = path.join(projectRoot, pkgKey, 'package.json');

    let lic = extractLicenseFromPackageJson(lockMeta);

    if (fs.existsSync(installedPkgPath)) {
      try {
        const installedPkg = JSON.parse(fs.readFileSync(installedPkgPath, 'utf8'));
        const installedLic = extractLicenseFromPackageJson(installedPkg);
        if (installedLic) {
          lic = installedLic;
        }
      } catch (err) {
        violations.push({
          name: displayName,
          license: '(unreadable)',
          reason: `Could not parse installed package.json: ${err instanceof Error ? err.message : String(err)}`,
        });
        continue;
      }
    } else if (!isOptional) {
      violations.push({
        name: displayName,
        license: lic || '(missing)',
        reason: 'Non-optional production dependency missing from node_modules',
      });
      continue;
    }

    if (!lic) {
      violations.push({
        name: displayName,
        license: '(missing)',
        reason: 'Missing license metadata (no silent fallback allowed)',
      });
      continue;
    }

    const verdict = evaluateSpdxExpression(lic);
    if (!verdict.allowed) {
      violations.push({
        name: displayName,
        license: lic,
        reason: verdict.reason || 'Disallowed license',
      });
    } else {
      verified.push({ name: displayName, license: lic });
    }
  }

  return { verified, violations };
}

function main() {
  const { verified, violations } = checkProductionLicenses(root);

  console.log(`[check:licenses] Zweryfikowano ${verified.length} zależności produkcyjnych (pełny graf tranzytywny z package-lock.json):`);
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

  console.log('\n[check:licenses] Wszystkie zależności produkcyjne spełniają warunki licencyjne (0 naruszeń).');
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  main();
}

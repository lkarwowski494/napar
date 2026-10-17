import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('..', import.meta.url));

const pyCmd = process.platform === 'win32' ? 'python' : 'python3 -I';

const scripts = [
  'scripts/gen-coffee-corpus.py',
  'scripts/gen-theme-contrast-corpus.py',
];

console.log('[check:corpus] Running Python truth oracle generators...');
for (const script of scripts) {
  try {
    const output = execSync(`${pyCmd} ${script}`, { cwd: root, encoding: 'utf-8' });
    console.log(`  ✓ ${script}: ${output.trim()}`);
  } catch (err) {
    console.error(`  ✗ Error running ${script}:`, err.message);
    process.exit(1);
  }
}

// Verify that corpus fixtures exist and are non-empty
const fixtures = [
  'tests/fixtures/coffee-corpus.json',
  'tests/fixtures/theme-contrast-corpus.json',
];

for (const fix of fixtures) {
  const p = join(root, fix);
  if (!existsSync(p)) {
    console.error(`  ✗ Missing fixture: ${fix}`);
    process.exit(1);
  }
  const content = readFileSync(p, 'utf-8');
  if (content.length < 50) {
    console.error(`  ✗ Fixture ${fix} is unexpectedly empty!`);
    process.exit(1);
  }
}

console.log('[check:corpus] All Python truth oracles verified.');

// Przegląd partii 5 (P2, M1-audytor-generalny-043): skrypt `prepare` ustawia hooki tylko we własnym repo,
// nie nadpisuje cudzego core.hooksPath i nigdy nie przerywa instalacji paczek.
import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

const script = path.join(__dirname, '..', 'scripts', 'install-git-hooks.mjs');
const git = (cwd: string, ...args: string[]) => execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
const hooksPath = (cwd: string): string => {
  try {
    return git(cwd, 'config', '--get', 'core.hooksPath');
  } catch {
    return '';
  }
};
const run = (cwd: string) => execFileSync(process.execPath, [script], { cwd, env: { ...process.env, CI: '' }, encoding: 'utf8' });
const mkPkg = (dir: string) => {
  fs.mkdirSync(path.join(dir, '.githooks'), { recursive: true });
  fs.writeFileSync(path.join(dir, '.githooks', 'pre-push'), '#!/bin/sh\nnpm run verify\n');
};

describe('install-git-hooks.mjs (przegląd p5)', () => {
  let tmp: string;
  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hooks-'));
  });
  afterEach(() => fs.rmSync(tmp, { recursive: true, force: true }));

  test('własne repo bez ustawienia → core.hooksPath = .githooks', () => {
    git(tmp, 'init', '-q');
    mkPkg(tmp);
    run(tmp);
    expect(hooksPath(tmp)).toBe('.githooks');
  });

  test('paczka w podkatalogu cudzego repo → cudzy core.hooksPath bez zmian', () => {
    git(tmp, 'init', '-q');
    git(tmp, 'config', 'core.hooksPath', '.husky');
    const pkg = path.join(tmp, 'node_modules', 'napar');
    mkPkg(pkg);
    run(pkg);
    expect(hooksPath(tmp)).toBe('.husky');
  });

  test('własne repo z innym core.hooksPath dewelopera → bez nadpisania', () => {
    git(tmp, 'init', '-q');
    git(tmp, 'config', 'core.hooksPath', '.husky');
    mkPkg(tmp);
    run(tmp);
    expect(hooksPath(tmp)).toBe('.husky');
  });

  test('katalog bez repo → kod 0, bez błędu', () => {
    mkPkg(tmp);
    expect(() => run(tmp)).not.toThrow();
  });
});

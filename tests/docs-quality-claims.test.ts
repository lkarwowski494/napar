// ============================================================================
// Deklaracje jakości w dokumentach — M1-audytor-generalny-013 (07-jakosc-004, 07-jakosc-011, 07-jakosc-012)
// Liczby testów i progi pokrycia nie są przepisywane do dokumentów (rozjeżdżały się z wynikiem komend:
// „100% pokrycia” przy 93,55%, „379 testów”); źródłem są jest.config.js i wynik npm run verify.
// ============================================================================
import fs from 'fs';
import path from 'path';

const root = path.join(__dirname, '..');
const docs = ['CLAUDE.md', 'README.md', 'docs/20-definicja-ukonczenia.md', 'docs/18-przekazanie.md', 'docs/testing.md'];

test('dokumenty nie podają liczby testów ani zestawów testów', () => {
  const hits: string[] = [];
  for (const d of docs) {
    fs.readFileSync(path.join(root, d), 'utf8').split('\n').forEach((line, i) => {
      if (/\b\d+\+?\s+(zestaw(y|ów)?\s+testow|testów|testy\b|tests\b)|\(\d+\s+test/i.test(line)) hits.push(`${d}:${i + 1}`);
    });
  }
  expect(hits).toEqual([]);
});

test('dokumenty nie podają progów pokrycia liczbą (źródło: jest.config.js, zapadka)', () => {
  const hits: string[] = [];
  for (const d of docs) {
    fs.readFileSync(path.join(root, d), 'utf8').split('\n').forEach((line, i) => {
      const coverageLine = /pokryci|coverage|próg|progi|progów/i.test(line) && !/macierz|matrix|AST/i.test(line);
      if (coverageLine && /\d+(?:[.,]\d+)?\s?%/.test(line)) hits.push(`${d}:${i + 1}`);
    });
  }
  expect(hits).toEqual([]);
});

test('dokumenty odsyłają do jest.config.js jako źródła progów', () => {
  for (const d of ['CLAUDE.md', 'docs/testing.md', 'docs/20-definicja-ukonczenia.md']) {
    expect([d, fs.readFileSync(path.join(root, d), 'utf8').includes('jest.config.js')]).toEqual([d, true]);
  }
});

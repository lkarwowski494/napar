import fs from 'fs';
import path from 'path';

describe('Competitor Brands & Trademark Protection Contract (DEC-10, NFR-SEC-011)', () => {
  const root = path.resolve(__dirname, '..');

  // List of protected competitor brand names / commercial trademarks that must not appear in app source
  const FORBIDDEN_BRANDS = [
    /\bFiltru\b/i,
    /\bBeanconqueror\b/i,
    /\bBrewmaster\b/i,
    /\bCoffeeMe\b/i,
    /\bFourSixApp\b/i,
    /\bTodoist\b/i,
    /\bThings 3\b/i,
    /\bHevy\b/i,
  ];

  function getCodeFiles(dir: string): string[] {
    let files: string[] = [];
    if (!fs.existsSync(dir)) return files;
    for (const item of fs.readdirSync(dir)) {
      if (['node_modules', '.git', '.expo', 'dist', 'scratch'].includes(item)) continue;
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        files = files.concat(getCodeFiles(fullPath));
      } else if (/\.(ts|tsx|js|mjs|json|html)$/.test(item) && !fullPath.includes('brands.contract.test.ts')) {
        files.push(fullPath);
      }
    }
    return files;
  }

  it('No competitor brands or foreign trademarks appear in src/, app/, or site/', () => {
    const targetDirs = ['src', 'app', 'site'].map((d) => path.join(root, d));
    const allFiles = targetDirs.flatMap(getCodeFiles);

    for (const file of allFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      for (const brandRegex of FORBIDDEN_BRANDS) {
        const match = content.match(brandRegex);
        if (match) {
          throw new Error(
            `[DEC-10 Violation] Prohibited trademark/brand "${match[0]}" found in ${file}. Remove competitor names from production source.`
          );
        }
      }
    }
  });
});

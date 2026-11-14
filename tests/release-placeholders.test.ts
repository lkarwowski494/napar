// Elementy zastępcze widoczne dla recenzenta — M1-audytor-generalny-022 (10-wydanie-003)
import fs from 'fs';
import path from 'path';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import SettingsScreen from '../app/settings';
import { APP_STORE_ID, appStoreReviewUrl } from '../src/core/app-identity';

const root = path.join(__dirname, '..');

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return ['__tests__', 'node_modules'].includes(e.name) ? [] : walk(p);
    return /\.(ts|tsx)$/.test(e.name) ? [p] : [];
  });
}

test('kod produkcyjny nie zawiera zastępczego ID sklepu ani niezarejestrowanej domeny napar.app', () => {
  const hits: string[] = [];
  for (const f of ['app', 'src', 'lib'].map((d) => path.join(root, d)).filter(fs.existsSync).flatMap(walk)) {
    fs.readFileSync(f, 'utf8').split('\n').forEach((line, i) => {
      if (/6470000000|napar\.app\b(?!s)/.test(line)) hits.push(`${path.relative(root, f)}:${i + 1}`);
    });
  }
  expect(hits).toEqual([]);
});

test('link „Oceń w App Store” jest tylko przy prawdziwym ID aplikacji (dziś brak)', () => {
  expect(APP_STORE_ID).toBeNull();
  let tree: renderer.ReactTestRenderer;
  act(() => {
    tree = renderer.create(React.createElement(SettingsScreen));
  });
  const rows = tree!.root.findAll((n) => /App Store/.test(String(n.props.accessibilityLabel ?? '')));
  expect(rows).toEqual([]);
});

test('appStoreReviewUrl buduje link oceny z prawdziwego ID (gdy właściciel je wpisze)', () => {
  expect(appStoreReviewUrl('123456789')).toBe('https://apps.apple.com/app/id123456789?action=write-review');
});

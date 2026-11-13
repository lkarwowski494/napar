// ============================================================================
// Obsługa błędu zapisu w UI — M1-audytor-generalny-007 (08-programista-007, 05-architekt-011)
// ============================================================================

import React from 'react';
import fs from 'fs';
import path from 'path';
import renderer from 'react-test-renderer';
import { Alert, Text } from 'react-native';
import { runSave, type SaveErrorTexts } from '../lib/save-feedback';
import { translations } from '../src/core/i18n';

jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn(() => ({
    execSync: jest.fn(),
    getFirstSync: jest.fn(),
    getAllSync: jest.fn(() => []),
    runSync: jest.fn(() => ({ changes: 1 })),
    prepareSync: jest.fn(() => ({ executeSync: jest.fn(), finalizeSync: jest.fn() })),
  })),
  defaultDatabaseDirectory: '/test/SQLite',
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
}));

const texts: SaveErrorTexts = translations.pl.common;

afterEach(() => jest.restoreAllMocks());

describe('runSave (M1-audytor-generalny-007)', () => {
  test('udany zapis: true i brak komunikatu; nieudany: false i komunikat błędu zapisu', () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    expect(runSave(() => undefined, texts)).toBe(true);
    expect(alert).not.toHaveBeenCalled();
    expect(
      runSave(() => {
        throw new Error('database or disk is full');
      }, texts)
    ).toBe(false);
    expect(alert).toHaveBeenCalledWith(texts.saveErrorTitle, texts.saveErrorDesc);
  });
});

describe('Okno zakończenia parzenia przy błędzie zapisu (M1-audytor-generalny-007; 05-architekt-011)', () => {
  test('zapis rzuca: okno zostaje otwarte z notatką, bez „Zapisano!”', () => {
    const { useBrewWorkflow } = require('../src/core/useBrewWorkflow');
    const { BrewProvider } = require('../src/core/brew-context');
    const databaseModule = require('../src/core/database');
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    jest.spyOn(databaseModule, 'recordBrewSessionTransaction').mockImplementation(() => {
      throw new Error('database or disk is full');
    });

    let wf: any;
    const Harness = () => {
      wf = useBrewWorkflow();
      return <Text>{wf.showFinishModal ? 'open' : 'closed'}</Text>;
    };
    renderer.act(() => {
      renderer.create(
        <BrewProvider>
          <Harness />
        </BrewProvider>
      );
    });
    renderer.act(() => {
      wf.setShowFinishModal(true);
      wf.setNotes('kwasowość za wysoka, mielić drobniej');
    });
    renderer.act(() => {
      wf.handleFinishSave();
    });

    expect(wf.showFinishModal).toBe(true);
    expect(wf.notes).toBe('kwasowość za wysoka, mielić drobniej');
    const titles = alert.mock.calls.map((c) => c[0]);
    expect(titles).toContain(texts.saveErrorTitle);
    expect(titles).not.toContain(translations.pl.brew.savedSessionTitle);
  });
});

test('trwała kontrola: zapisy i usunięcia danych w handlerach UI przechodzą przez runSave', () => {
  const root = path.join(__dirname, '..');
  const calls = /\b(saveInventoryItem|deleteInventoryItem|logCaffeine|deleteCaffeineLog|saveRecipe|deleteRecipe|deleteBrewSession|recordBrewSessionTransaction|finishAndSaveSession|saveBrewSession)\(/;
  const files = [
    'app/gongfu.tsx',
    'app/(tabs)/beans.tsx',
    'app/(tabs)/caffeine.tsx',
    'app/(tabs)/journal.tsx',
    'app/recipe-builder.tsx',
    'src/components/beans/BeanEditModal.tsx',
    'src/components/beans/BeanAddModal.tsx',
    'src/core/useBrewWorkflow.ts',
  ];
  const unguarded: string[] = [];
  for (const rel of files) {
    const lines = fs.readFileSync(path.join(root, rel), 'utf8').split('\n');
    lines.forEach((line, i) => {
      if (!calls.test(line) || /^\s*(import|\/\/|\*)/.test(line) || /^\s*\w+,\s*$/.test(line)) return;
      const context = lines.slice(Math.max(0, i - 4), i + 1).join('\n');
      // runSave albo własny try z komunikatem (skan QR; wyjątek wymieniony w 08-programista-007)
      if (!context.includes('runSave(') && !/\btry \{/.test(context)) unguarded.push(`${rel}:${i + 1}`);
    });
  }
  expect(unguarded).toEqual([]);
});

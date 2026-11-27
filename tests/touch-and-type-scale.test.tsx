// M1-audytor-generalny-029 (04-studio-projektowe-004, -005)
// (1) Cyfry stoperów (64–72 pt) mają limit skalowania systemowego i jeden wiersz — przy AX5 (×3,571) czas się nie łamie.
// (2) Cele dotykowe w ocenie po parzeniu, ustawieniach i edycji paczki: wymiar + 2×hitSlop ≥ 44 pt w obu osiach.
import fs from 'fs';
import path from 'path';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { ProcedureModal } from '../src/components/brew/ProcedureModal';
import { GongfuActiveInfusion } from '../src/components/gongfu/GongfuActiveInfusion';
import { translations } from '../src/core/i18n';

const MAX_TIMER_SCALE = 1.5;

describe('M1-audytor-generalny-029: cyfry stoperów przy dużej czcionce (04-studio-projektowe-004)', () => {
  const checkClock = (node: renderer.ReactTestInstance) => {
    expect(node.props.maxFontSizeMultiplier).toBeGreaterThan(0);
    expect(node.props.maxFontSizeMultiplier).toBeLessThanOrEqual(MAX_TIMER_SCALE);
    expect(node.props.numberOfLines).toBe(1);
  };

  test('ekran kroków: odliczanie ma maxFontSizeMultiplier ≤ 1,5 i jeden wiersz', () => {
    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <ProcedureModal
          visible
          recipeName="V60"
          steps={[{ stepNumber: 1, namePl: 'Bloom', nameEn: 'Bloom', durationSeconds: 45, targetWaterGrams: 50, instructionPl: 'Zalej.', instructionEn: 'Pour.' }]}
          currentStepIndex={0}
          status="running"
          isRunning
          stepRemainingSeconds={45}
          totalElapsedSeconds={0}
          unitSystem="metric"
          language="pl"
          t={translations.pl}
          onStart={jest.fn()}
          onReset={jest.fn()}
          onPauseResume={jest.fn()}
          onAdjustTimeSeconds={jest.fn()}
          onResetCurrentStep={jest.fn()}
          onPrevStep={jest.fn()}
          onNextStep={jest.fn()}
          onFinishAndSave={jest.fn()}
          onClose={jest.fn()}
        />,
      );
    });
    checkClock(tree!.root.findAll((n) => n.props.testID === 'procedure-countdown-display' && typeof n.type === 'string')[0]);
  });

  test('Gongfu: odliczanie infuzji ma maxFontSizeMultiplier ≤ 1,5 i jeden wiersz', () => {
    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <GongfuActiveInfusion
          nextInfusionNum={1}
          remainingSeconds={25}
          targetSeconds={25}
          isSteeping
          steepFinished={false}
          onAdjustTime={jest.fn()}
          onStartSteep={jest.fn()}
          onPauseSteep={jest.fn()}
          onResumeSteep={jest.fn()}
          onEndSteep={jest.fn()}
          currentNotes=""
          onChangeCurrentNotes={jest.fn()}
          onRecordCurrentInfusion={jest.fn()}
          t={translations.pl}
        />,
      );
    });
    checkClock(tree!.root.findAll((n) => n.props.testID === 'gongfu-countdown-display' && typeof n.type === 'string')[0]);
  });
});

// --- (2) statyczny strażnik celów dotykowych ---
const root = path.join(__dirname, '..');
const FILES = [
  'src/components/brew/BrewFinishModal.tsx',
  'src/components/brew/BrewQuickPrepCard.tsx',
  'src/components/settings/AppPreferencesCard.tsx',
  'src/components/beans/BeanEditModal.tsx',
  'src/components/beans/BeanTopBar.tsx',
  'src/components/beans/BeanItemCard.tsx',
  'src/components/journal/JournalFilterBar.tsx',
  'src/components/journal/JournalSessionCard.tsx',
  'src/components/gongfu/GongfuActiveInfusion.tsx',
  'src/core/flavor-wheel-picker.tsx',
];

/** Otwierające tagi <Pressable …> z uwzględnieniem nawiasów klamrowych (onPress={() => …}). */
function pressableTags(src: string): { line: number; text: string }[] {
  const out: { line: number; text: string }[] = [];
  let i = src.indexOf('<Pressable');
  while (i !== -1) {
    let depth = 0;
    let j = i + 1;
    for (; j < src.length; j++) {
      const ch = src[j];
      if (ch === '{') depth++;
      else if (ch === '}') depth--;
      else if (ch === '>' && depth === 0) break;
    }
    out.push({ line: src.slice(0, i).split('\n').length, text: src.slice(i, j + 1) });
    i = src.indexOf('<Pressable', j);
  }
  return out;
}

function stylesOf(src: string): Map<string, string> {
  const m = new Map<string, string>();
  for (const x of src.matchAll(/^ {2}(\w+): \{\n([\s\S]*?)\n {2}\},?$/gm)) m.set(x[1], x[2]);
  return m;
}
const num = (body: string, key: string): number => {
  const v = body.match(new RegExp(`\\b${key}: *(\\d+(?:\\.\\d+)?)\\b`));
  return v ? Number(v[1]) : 0;
};

describe('M1-audytor-generalny-029: cele dotykowe ≥ 44 pt (04-studio-projektowe-005)', () => {
  test.each(FILES)('%s: każdy Pressable ma wysokość (a przycisk-glif także szerokość) + 2×hitSlop ≥ 44 pt', (rel) => {
    const src = fs.readFileSync(path.join(root, rel), 'utf8');
    const st = stylesOf(src);
    const bad: string[] = [];
    for (const tag of pressableTags(src)) {
      const refs = [...tag.text.matchAll(/styles\.(\w+)/g)].map((m) => m[1]).filter((n) => st.has(n));
      const slopM = tag.text.match(/hitSlop=\{(\d+)\}/);
      const slop = slopM ? Number(slopM[1]) : 0;
      const h = Math.max(0, ...refs.map((n) => Math.max(num(st.get(n)!, 'minHeight'), num(st.get(n)!, 'height'))));
      const w = Math.max(0, ...refs.map((n) => Math.max(num(st.get(n)!, 'minWidth'), num(st.get(n)!, 'width'))));
      // Szerokość sprawdzana dla przycisków-glifów (gwiazdka, ikona, ±, zamknij, przełącznik); przyciski z etykietą
      // tekstową i przyciski rozciągnięte mają szerokość z treści/układu, a wysokość musi być jawna.
      const glyph = refs.some((n) => /star|Star|icon|Icon|adjust|Adjust|close|Close|toggle|Toggle/.test(n)) || refs.length === 0;
      if (h + 2 * slop < 44 || (glyph && w + 2 * slop < 44)) bad.push(`${rel}:${tag.line} (h ${h}+2×${slop}, w ${w}+2×${slop}; style: ${refs.join(', ') || 'brak'})`);
    }
    expect(bad).toEqual([]);
  });
});

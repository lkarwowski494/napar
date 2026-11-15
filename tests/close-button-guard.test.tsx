// ============================================================================
// Napar — Close Button & Modal Guard (S1, NFR-INT-001)
// Every modal screen must have a dismiss/cancel button with accessible label
// ============================================================================

import React from 'react';
import renderer from 'react-test-renderer';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { StyleSheet } from 'react-native';
import { CloseButton, ModalHeader } from '../src/components/ui';
import RecipeBuilderScreen from '../app/recipe-builder';
import GongfuScreen from '../app/gongfu';
import { BrewProvider } from '../src/core/brew-context';
import { LanguageProvider } from '../src/core/i18n';

describe('Close Button & Modal Guard (S1, NFR-INT-001)', () => {
  test('CloseButton renders with accessible label and minimum 44pt touch target', () => {
    let pressed = false;
    let tree: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(
        <CloseButton onPress={() => { pressed = true; }} label="Zamknij modal" />
      );
    });
    const root = tree!.root;
    const button = root.findByProps({ accessibilityRole: 'button' });

    expect(button.props.accessibilityLabel).toBe('Zamknij modal');
    // Efektywny rozmiar dotyku
    const style = button.props.style || {};
    const minHeight = style.minHeight || 44;
    const minWidth = style.minWidth || 44;
    expect(minHeight).toBeGreaterThanOrEqual(44);
    expect(minWidth).toBeGreaterThanOrEqual(44);

    renderer.act(() => {
      button.props.onPress();
    });
    expect(pressed).toBe(true);
  });

  test('RecipeBuilder modal has a close/cancel button on header', () => {
    let tree: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(
        <LanguageProvider>
          <BrewProvider>
            <RecipeBuilderScreen />
          </BrewProvider>
        </LanguageProvider>
      );
    });

    const buttons = tree!.root.findAllByProps({ accessibilityRole: 'button' });
    const hasCloseOrCancel = buttons.some(
      (b) =>
        b.props.accessibilityLabel?.toLowerCase().includes('anuluj') ||
        b.props.accessibilityLabel?.toLowerCase().includes('zamknij') ||
        b.props.accessibilityLabel?.toLowerCase().includes('close') ||
        b.props.accessibilityLabel?.toLowerCase().includes('cancel')
    );

    expect(hasCloseOrCancel).toBe(true);
  });

  test('Gongfu modal has a close/dismiss button on header', () => {
    let tree: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(
        <LanguageProvider>
          <BrewProvider>
            <GongfuScreen />
          </BrewProvider>
        </LanguageProvider>
      );
    });

    const buttons = tree!.root.findAllByProps({ accessibilityRole: 'button' });
    const hasCloseOrCancel = buttons.some(
      (b) =>
        b.props.accessibilityLabel?.toLowerCase().includes('anuluj') ||
        b.props.accessibilityLabel?.toLowerCase().includes('zamknij') ||
        b.props.accessibilityLabel?.toLowerCase().includes('close') ||
        b.props.accessibilityLabel?.toLowerCase().includes('cancel')
    );

    expect(hasCloseOrCancel).toBe(true);
  });
});

// ============================================================================
// M1-audytor-generalny-041 (04-studio-projektowe-012, 04-…-N1): położenie przycisków w nagłówku.
// S1: „Anuluj”/„Zamknij” zawsze po lewej stronie nagłówka modala.
// S3: zapis formularza wyłącznie w prawym rogu nagłówka, nigdy w treści ani stopce.
// Modale wykrywane automatycznie: każdy <Modal> w app/ i src/ oraz każdy ekran z
// presentation: 'modal' w app/_layout.tsx — bez ręcznej listy plików.
// ============================================================================


const repoRoot = process.cwd();

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of fs.readdirSync(dir)) {
    if (name === '__tests__' || name === 'node_modules') continue;
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) out.push(...walk(p));
    else if (/\.tsx?$/.test(name) && !name.endsWith('.d.ts')) out.push(p);
  }
  return out;
}

const rel = (p: string) => path.relative(repoRoot, p).split(path.sep).join('/');

function parse(file: string): ts.SourceFile {
  return ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
}

function tagName(node: ts.Node): string | null {
  if (ts.isJsxElement(node)) return node.openingElement.tagName.getText();
  if (ts.isJsxSelfClosingElement(node)) return node.tagName.getText();
  return null;
}

function attrs(node: ts.Node): ts.JsxAttributes | null {
  if (ts.isJsxElement(node)) return node.openingElement.attributes;
  if (ts.isJsxSelfClosingElement(node)) return node.attributes;
  return null;
}

function attrText(a: ts.JsxAttributes, name: string): string {
  for (const p of a.properties) {
    if (ts.isJsxAttribute(p) && p.name.getText() === name && p.initializer) return p.initializer.getText();
  }
  return '';
}

function countTags(sf: ts.SourceFile, name: string): number {
  let n = 0;
  const visit = (node: ts.Node) => {
    if (tagName(node) === name) n += 1;
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return n;
}

interface ButtonHit { file: string; line: number; kind: 'zapis' | 'zamkniecie'; text: string }

const PRESSABLE_TAGS = new Set(['Pressable', 'TouchableOpacity', 'TouchableHighlight', 'Btn', 'CraftButton', 'CloseButton', 'Button']);
const SAVE_RE = /save/i;
const SAVE_LABEL_RE = /common\.save\b|save\w*Btn\b|['"](Zapisz|Save)['"]/;
const CLOSE_LABEL_RE = /common\.(close|cancel)\b|['"](Anuluj|Zamknij|Cancel|Close)['"]/;

/** Przyciski zapisu/zamknięcia leżące POZA <ModalHeader> (poddrzewo nagłówka jest pomijane). */
function buttonsOutsideHeader(sf: ts.SourceFile): ButtonHit[] {
  const hits: ButtonHit[] = [];
  const visit = (node: ts.Node) => {
    const name = tagName(node);
    if (name === 'ModalHeader') return;
    const a = attrs(node);
    if (name && a && PRESSABLE_TAGS.has(name)) {
      const testID = attrText(a, 'testID');
      const onPress = attrText(a, 'onPress');
      const label = `${attrText(a, 'accessibilityLabel')} ${attrText(a, 'title')} ${attrText(a, 'label')}`;
      const line = sf.getLineAndCharacterOfPosition(node.getStart()).line + 1;
      if (SAVE_RE.test(testID) || SAVE_RE.test(onPress) || SAVE_LABEL_RE.test(label)) {
        hits.push({ file: rel(sf.fileName), line, kind: 'zapis', text: testID || onPress || label.trim() });
      } else if (name === 'CloseButton' || /(close|cancel)-btn/i.test(testID) || CLOSE_LABEL_RE.test(label)) {
        hits.push({ file: rel(sf.fileName), line, kind: 'zamkniecie', text: testID || label.trim() });
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return hits;
}

// Wyjątki z uzasadnieniem (nie zapis formularza): przycisk przejścia między modalami.
// ProcedureModal „Zakończ i zapisz” tylko zamyka asystenta i otwiera formularz BrewFinishModal
// (BrewModalsContainer: onFinishAndSave → setShowProcedureModal(false); setShowFinishModal(true)),
// gdzie właściwy „Zapisz” stoi w prawym rogu nagłówka.
const FLOW_EXCEPTIONS: Record<string, string[]> = {
  'src/components/brew/ProcedureModal.tsx': ['"save-brew-btn"', '"procedure-finish-save-btn"'],
};

// Modale bez akcji zamknięcia (wybór obowiązkowy) — nagłówek z „Zamknij” nie ma czego wywołać.
// Wyjątek trzyma się tylko, dopóki plik nie ma ŻADNEGO przycisku zamknięcia/anulowania ani onRequestClose.
const NO_DISMISS: Record<string, string> = {
  'src/components/OnboardingModal.tsx': 'pierwsze uruchomienie: obowiązkowy wybór preferencji (onComplete), brak onClose',
};

const modalFiles = [...walk(path.join(repoRoot, 'app')), ...walk(path.join(repoRoot, 'src'))]
  .map(parse)
  .filter((sf) => countTags(sf, 'Modal') > 0);

/** Ekrany expo-router prezentowane jako modal (app/_layout.tsx). */
function modalRoutes(): { name: string; headerShown: boolean; hasHeaderLeft: boolean }[] {
  const sf = parse(path.join(repoRoot, 'app', '_layout.tsx'));
  const out: { name: string; headerShown: boolean; hasHeaderLeft: boolean }[] = [];
  const visit = (node: ts.Node) => {
    if (tagName(node) === 'Stack.Screen') {
      const a = attrs(node)!;
      const options = attrText(a, 'options');
      if (/presentation:\s*'modal'/.test(options)) {
        out.push({
          name: attrText(a, 'name').replace(/['"]/g, ''),
          headerShown: !/headerShown:\s*false/.test(options),
          hasHeaderLeft: /headerLeft\s*:/.test(options),
        });
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return out;
}

describe('Nagłówki modali: S1 (zamknięcie po lewej) i S3 (zapis w prawym rogu) — M1-audytor-generalny-041', () => {
  test('wykrywanie automatyczne znajduje modale w app/ i src/', () => {
    // Liczba z dnia naprawy (16 komponentów z <Modal>); spadek oznacza zepsute wykrywanie.
    expect(modalFiles.length).toBeGreaterThanOrEqual(16);
    expect(modalRoutes().length).toBeGreaterThanOrEqual(3);
  });

  test.each(modalFiles.map((sf) => [rel(sf.fileName), sf] as const))(
    '%s: każdy <Modal> ma wspólny <ModalHeader>',
    (name, sf) => {
      if (NO_DISMISS[name]) {
        expect(sf.text).not.toMatch(/onClose|onRequestClose|common\??\.(close|cancel)\b/);
        expect(buttonsOutsideHeader(sf).filter((h) => h.kind === 'zamkniecie')).toEqual([]);
        return;
      }
      expect(countTags(sf, 'ModalHeader')).toBeGreaterThanOrEqual(countTags(sf, 'Modal'));
    },
  );

  test('ekrany modalne z app/_layout.tsx: własny <ModalHeader> albo headerLeft w natywnym nagłówku', () => {
    const missing: string[] = [];
    for (const r of modalRoutes()) {
      if (r.headerShown) {
        if (!r.hasHeaderLeft) missing.push(`${r.name}: natywny nagłówek bez headerLeft (Zamknij po lewej)`);
      } else {
        const file = path.join(repoRoot, 'app', `${r.name}.tsx`);
        if (countTags(parse(file), 'ModalHeader') === 0) missing.push(`${r.name}: brak <ModalHeader>`);
      }
    }
    expect(missing).toEqual([]);
  });

  test('brak przycisków zapisu i zamknięcia poza nagłówkiem (modale i ekrany modalne)', () => {
    const routeFiles = modalRoutes()
      .filter((r) => !r.headerShown)
      .map((r) => parse(path.join(repoRoot, 'app', `${r.name}.tsx`)));
    const hits = [...modalFiles, ...routeFiles]
      .flatMap(buttonsOutsideHeader)
      .filter((h) => !(FLOW_EXCEPTIONS[h.file] ?? []).includes(h.text));
    expect(hits.map((h) => `${h.file}:${h.line} [${h.kind}] ${h.text}`)).toEqual([]);
  });

  test('ModalHeader: pierwszy przycisk to zamknięcie (lewa), ostatni to zapis (prawa); akcje podpięte bez zamiany', () => {
    const calls: string[] = [];
    let tree: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(
        <ModalHeader
          title="Tytuł"
          closeLabel="Anuluj"
          onClose={() => calls.push('close')}
          saveLabel="Zapisz"
          onSave={() => calls.push('save')}
          closeTestID="hdr-close"
          saveTestID="hdr-save"
        />,
      );
    });
    const header = tree!.root.findByProps({ testID: 'modal-header' });
    const buttons = header.findAll((n) => n.props.accessibilityRole === 'button' && typeof n.type !== 'string' && n.props.onPress, { deep: true })
      .filter((n, i, arr) => arr.findIndex((m) => m.props.testID === n.props.testID) === i);
    expect(buttons.map((b) => b.props.testID)).toEqual(['hdr-close', 'hdr-save']);
    renderer.act(() => buttons[0].props.onPress());
    renderer.act(() => buttons[1].props.onPress());
    expect(calls).toEqual(['close', 'save']);
    for (const b of buttons) {
      const style = StyleSheet.flatten(b.props.style) || {};
      expect(style.minHeight).toBeGreaterThanOrEqual(44);
      expect(style.minWidth).toBeGreaterThanOrEqual(44);
    }
  });

  test('ModalHeader bez zapisu: jedyny przycisk to zamknięcie po lewej; zapis wyłączony nie reaguje', () => {
    let tree: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(<ModalHeader title="Info" closeLabel="Zamknij" onClose={() => undefined} />);
    });
    const header = tree!.root.findByProps({ testID: 'modal-header' });
    const labels = header
      .findAll((n) => typeof n.type !== 'string' && n.props.accessibilityRole === 'button')
      .map((n) => n.props.accessibilityLabel);
    expect(new Set(labels)).toEqual(new Set(['Zamknij']));

    let saved = false;
    renderer.act(() => {
      tree!.update(
        <ModalHeader title="F" closeLabel="Anuluj" onClose={() => undefined} saveLabel="Zapisz" onSave={() => { saved = true; }} saveDisabled saveTestID="s" />,
      );
    });
    const save = tree!.root.findAll((n) => n.props.testID === 's' && typeof n.type !== 'string')[0];
    expect(save.props.disabled).toBe(true);
    expect(saved).toBe(false);
  });
});

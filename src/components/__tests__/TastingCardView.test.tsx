// ============================================================================
// Napar (Steepwise) — Karta degustacyjna: widok i eksport poza ekranem (poz. 31)
// ============================================================================

import React from 'react';
import { Text } from 'react-native';
import renderer, { act } from 'react-test-renderer';
import { TastingCardView } from '../journal/TastingCardView';
import { TastingCardExport } from '../journal/TastingCardExport';
import { buildTastingCardModel } from '../../core/tasting-card';
import { BrewSession } from '../../core/database-schema';

const mockShare = jest.fn((_ref: unknown, _title: string) => Promise.resolve());
jest.mock('../../platform/tasting-card-share', () => ({
  shareTastingCardImage: (ref: unknown, title: string) => mockShare(ref, title),
}));

const session: BrewSession = {
  id: 's1',
  recipeName: 'V60 Hoffmann',
  inventoryItemName: 'Kenya Nyeri',
  beverageType: 'COFFEE',
  method: 'V60',
  doseGrams: 15,
  waterGrams: 250,
  waterTempCelsius: 95,
  totalTimeSeconds: 195,
  rating: 4.5,
  flavorTags: ['porzeczka', 'miód'],
  tasteBalance: 'sour',
  extractionYieldPercentage: 20.4,
  notes: 'Soczyste',
  brewedAt: '2026-10-20T08:30:00.000Z',
};

function textsOf(tree: renderer.ReactTestRenderer): string[] {
  return tree.root.findAllByType(Text).map((n) => {
    const collect = (node: unknown): string => {
      if (node === null || node === undefined || typeof node === 'boolean') return '';
      if (typeof node === 'string' || typeof node === 'number') return String(node);
      if (Array.isArray(node)) return node.map(collect).join('');
      return collect((node as { props?: { children?: unknown } }).props?.children);
    };
    return collect(n.props.children);
  });
}

describe('TastingCardView (poz. 31 MVP)', () => {
  test('pełna karta pokazuje nazwę, parametry, ocenę, balans, EY, nuty i notatki', () => {
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <TastingCardView model={buildTastingCardModel(session)} unitSystem="metric" />
      );
    });
    const texts = textsOf(tree);
    expect(texts).toContain('V60 Hoffmann');
    expect(texts).toContain('15g');
    expect(texts).toContain('250g');
    expect(texts).toContain('95°C');
    expect(texts).toContain('3:15');
    expect(texts).toContain('4.5 / 5');
    expect(texts).toContain('Kwaśna');
    expect(texts).toContain('20.4%');
    expect(texts).toContain('Kenya Nyeri');
    expect(texts).toContain('porzeczka · miód');
    expect(texts).toContain('Soczyste');
  });

  test('sesja bez oceny, balansu, EY, nut i notatek nie pokazuje tych bloków', () => {
    const bare: BrewSession = {
      ...session,
      rating: undefined,
      tasteBalance: undefined,
      extractionYieldPercentage: undefined,
      inventoryItemName: undefined,
      flavorTags: [],
      notes: undefined,
      recipeName: undefined,
    };
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <TastingCardView model={buildTastingCardModel(bare)} unitSystem="imperial" />
      );
    });
    const texts = textsOf(tree);
    expect(texts).toContain('V60');
    expect(texts.some((x) => x.endsWith(' / 5'))).toBe(false);
    expect(texts).not.toContain('Ocena');
    expect(texts).not.toContain('Notatki');
    expect(texts.some((x) => x.endsWith('fl oz'))).toBe(true);
  });

  test('każdy balans ma etykietę w karcie', () => {
    for (const code of ['balanced', 'sour', 'bitter', 'astringent', 'weak', 'too_strong'] as const) {
      let tree!: renderer.ReactTestRenderer;
      act(() => {
        tree = renderer.create(
          <TastingCardView model={buildTastingCardModel({ ...session, tasteBalance: code })} unitSystem="metric" />
        );
      });
      expect(textsOf(tree).length).toBeGreaterThan(5);
      act(() => tree.unmount());
    }
  });
});

describe('TastingCardExport: zapis poza ekranem (poz. 31 MVP)', () => {
  beforeEach(() => mockShare.mockClear());

  test('po pierwszym układzie udostępnia kartę raz i zgłasza zakończenie', async () => {
    const onFinished = jest.fn();
    const onFailed = jest.fn();
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <TastingCardExport session={session} unitSystem="metric" dialogTitle="Karta" onFinished={onFinished} onFailed={onFailed} />
      );
    });
    const capture = tree.root.findByProps({ testID: 'tasting-card-capture' });
    await act(async () => {
      capture.props.onLayout();
      capture.props.onLayout();
    });
    expect(mockShare).toHaveBeenCalledTimes(1);
    expect(mockShare.mock.calls[0][1]).toBe('Karta');
    expect(onFinished).toHaveBeenCalledTimes(1);
    expect(onFailed).not.toHaveBeenCalled();
  });

  test('błąd zapisu zgłasza sesję do rodzica', async () => {
    mockShare.mockImplementationOnce(() => Promise.reject(new Error('brak')));
    const onFinished = jest.fn();
    const onFailed = jest.fn();
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <TastingCardExport session={session} unitSystem="metric" dialogTitle="Karta" onFinished={onFinished} onFailed={onFailed} />
      );
    });
    await act(async () => {
      tree.root.findByProps({ testID: 'tasting-card-capture' }).props.onLayout();
    });
    expect(onFailed).toHaveBeenCalledWith(session);
    expect(onFinished).not.toHaveBeenCalled();
  });
});

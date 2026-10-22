// ============================================================================
// Napar (Steepwise) — GrinderSelectionCard w ustawieniach: własny młynek na liście (poz. 11 MVP)
// ============================================================================

import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { GrinderSelectionCard } from '../GrinderSelectionCard';
import { SUPPORTED_GRINDERS } from '../../../core/grinder-converter';

jest.mock('../../../core/database', () => {
  const custom = require('../../../core/custom-grinder');
  const grinderConverter = require('../../../core/grinder-converter');
  return {
    getAllGrinders: () => [
      ...grinderConverter.SUPPORTED_GRINDERS,
      custom.customGrinderModel({
        id: 'custom-grinder-s',
        name: 'Młynek z ustawień',
        stepMicrons: 25,
        createdAt: '2026-10-22T10:00:00.000Z',
      }),
    ],
  };
});

describe('GrinderSelectionCard (poz. 11 MVP)', () => {
  test('pokazuje tabelę modeli i własny młynek z przelicznikiem µm/klik', () => {
    let tree: any;
    act(() => {
      tree = renderer.create(
        <GrinderSelectionCard selectedGrinder="comandante_c40" onSelectGrinder={jest.fn()} title="Młynek" />
      );
    });
    const str = JSON.stringify(tree.toJSON());
    expect(str).toContain(SUPPORTED_GRINDERS[0].name);
    expect(str).toContain('Młynek z ustawień');
    // Podpis łączy kilka fragmentów tekstu: przelicznik i zakres nastawy
    const subtitles = tree.root
      .findAll((n: any) => n.type === 'Text')
      .map((n: any) => [].concat(n.props.children).join(''));
    expect(subtitles).toContain('25 µm/klik · Zakres: 0–60');
  });

  test('wybór własnego młynka przekazuje jego identyfikator', () => {
    const onSelectGrinder = jest.fn();
    let tree: any;
    act(() => {
      tree = renderer.create(
        <GrinderSelectionCard selectedGrinder="comandante_c40" onSelectGrinder={onSelectGrinder} title="Młynek" />
      );
    });
    const row = tree.root.findAll(
      (n: any) => typeof n.props.accessibilityLabel === 'string' && n.props.accessibilityLabel.startsWith('Młynek z ustawień')
    )[0];
    act(() => row.props.onPress());
    expect(onSelectGrinder).toHaveBeenCalledWith(expect.stringMatching(/^custom-grinder-/));
  });
});

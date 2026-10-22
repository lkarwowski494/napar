// ============================================================================
// Napar (Steepwise) — GrinderSelectModal: własny młynek na liście wyboru (poz. 11 MVP)
// ============================================================================

import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { GrinderSelectModal } from '../GrinderSelectModal';
import { translations } from '../../../core/i18n';
import { SUPPORTED_GRINDERS } from '../../../core/grinder-converter';
import { customGrinderModel, type CustomGrinder } from '../../../core/custom-grinder';

const MY: CustomGrinder = {
  id: 'custom-grinder-m',
  name: 'Mój młynek testowy',
  stepMicrons: 20,
  createdAt: '2026-10-22T10:00:00.000Z',
};

jest.mock('../../../core/database', () => {
  const custom = require('../../../core/custom-grinder');
  const grinderConverter = require('../../../core/grinder-converter');
  return {
    getAllGrinders: () => [...grinderConverter.SUPPORTED_GRINDERS, custom.customGrinderModel({
      id: 'custom-grinder-m',
      name: 'Mój młynek testowy',
      stepMicrons: 20,
      createdAt: '2026-10-22T10:00:00.000Z',
    })],
    getCustomGrinderModels: () => [custom.customGrinderModel({
      id: 'custom-grinder-m',
      name: 'Mój młynek testowy',
      stepMicrons: 20,
      createdAt: '2026-10-22T10:00:00.000Z',
    })],
    getGrinderCalibrationStatus: () => ({ shiftClicks: 0, pairCount: 0, isActive: false }),
  };
});

const recipe: any = { id: 'v60-kasuya-4-6', method: 'V60', grindSettingDescriptionPl: '' };

describe('GrinderSelectModal: własny młynek na liście (poz. 11 MVP)', () => {
  test('lista zawiera tabelę modeli i własny młynek z jego nastawą', () => {
    let tree: any;
    act(() => {
      tree = renderer.create(
        <GrinderSelectModal
          visible
          onClose={jest.fn()}
          grinderId={SUPPORTED_GRINDERS[0].id}
          onSelectGrinder={jest.fn()}
          recipe={recipe}
          t={translations.pl}
        />
      );
    });
    const custom = tree.root.findAll((n: any) => n.props.testID === `grinder-item-${MY.id}`)[0];
    expect(custom).toBeTruthy();
    expect(custom.props.accessibilityLabel.startsWith(MY.name)).toBe(true);
    // Przelicznik 20 µm na klik: nastawa z konwertera, nie tabelowa
    expect(customGrinderModel(MY).stepMicrons).toBe(20);
    expect(tree.root.findAll((n: any) => n.props.testID === `grinder-item-${SUPPORTED_GRINDERS[0].id}`).length).toBeGreaterThan(0);
  });

  test('wybór własnego młynka przekazuje jego identyfikator', () => {
    const onSelectGrinder = jest.fn();
    const onClose = jest.fn();
    let tree: any;
    act(() => {
      tree = renderer.create(
        <GrinderSelectModal
          visible
          onClose={onClose}
          grinderId={SUPPORTED_GRINDERS[0].id}
          onSelectGrinder={onSelectGrinder}
          recipe={recipe}
          t={translations.pl}
        />
      );
    });
    const custom = tree.root.findAll((n: any) => n.props.testID === `grinder-item-${MY.id}`)[0];
    act(() => custom.props.onPress());
    expect(onSelectGrinder).toHaveBeenCalledWith(MY.id);
    expect(onClose).toHaveBeenCalled();
  });
});

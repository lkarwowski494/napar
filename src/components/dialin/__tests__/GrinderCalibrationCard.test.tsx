// ============================================================================
// Napar (Steepwise) — Unit Tests: GrinderCalibrationCard (kalibracja młynka, poz. 12)
// ============================================================================

import React from 'react';
import renderer from 'react-test-renderer';
import { GrinderCalibrationCard } from '../GrinderCalibrationCard';
import { translations } from '../../../core/i18n';
import { getAppSetting, getGrinderCalibrationStatus, resetGrinderCalibration } from '../../../core/database';
import { confirm } from '../../../core/confirm';
import { notifyGrinderCalibrationChanged } from '../../../core/grinder-calibration';

jest.mock('../../../core/database', () => ({
  getAppSetting: jest.fn(),
  getGrinderCalibrationStatus: jest.fn(),
  resetGrinderCalibration: jest.fn(),
}));

jest.mock('../../../core/confirm', () => ({
  confirm: jest.fn(),
}));

const t = translations.pl;
const mockedSetting = getAppSetting as jest.Mock;
const mockedStatus = getGrinderCalibrationStatus as jest.Mock;
const mockedReset = resetGrinderCalibration as jest.Mock;
const mockedConfirm = confirm as jest.Mock;

const dump = (tree: renderer.ReactTestRenderer) => JSON.stringify(tree.toJSON());

beforeEach(() => {
  jest.clearAllMocks();
  mockedSetting.mockReturnValue('comandante_c40');
});

test('Pokazuje liczbę parzeń tworzących kalibrację i aktywne przesunięcie', () => {
  mockedStatus.mockReturnValue({ shiftClicks: -1, pairCount: 3, isActive: true });
  let tree!: renderer.ReactTestRenderer;
  renderer.act(() => {
    tree = renderer.create(<GrinderCalibrationCard t={t} />);
  });
  const json = dump(tree);
  expect(json).toContain('Parzeń tworzących kalibrację (Comandante C40 MK3/MK4): 3');
  expect(json).toContain('Zalecenia przesunięte o -1.00 klików');
  expect(mockedStatus).toHaveBeenCalledWith('comandante_c40');
});

test('Przy mniej niż progu pokazuje, że nastawy są bez zmian', () => {
  mockedStatus.mockReturnValue({ shiftClicks: 0, pairCount: 2, isActive: false });
  let tree!: renderer.ReactTestRenderer;
  renderer.act(() => {
    tree = renderer.create(<GrinderCalibrationCard t={t} />);
  });
  expect(dump(tree)).toContain('Potrzeba co najmniej 3 parzeń z TDS');
});

test('Nieznany identyfikator młynka pokazuje sam identyfikator', () => {
  mockedSetting.mockReturnValue('nieznany_model');
  mockedStatus.mockReturnValue({ shiftClicks: 0, pairCount: 0, isActive: false });
  let tree!: renderer.ReactTestRenderer;
  renderer.act(() => {
    tree = renderer.create(<GrinderCalibrationCard t={t} />);
  });
  expect(dump(tree)).toContain('Parzeń tworzących kalibrację (nieznany_model): 0');
});

test('Wyzerowanie wymaga potwierdzenia, zeruje kalibrację i odświeża widok', () => {
  mockedStatus
    .mockReturnValueOnce({ shiftClicks: -1, pairCount: 3, isActive: true })
    .mockReturnValue({ shiftClicks: 0, pairCount: 0, isActive: false });
  let tree!: renderer.ReactTestRenderer;
  renderer.act(() => {
    tree = renderer.create(<GrinderCalibrationCard t={t} />);
  });

  renderer.act(() => {
    tree.root.findByProps({ testID: 'grinder-calibration-reset-btn' }).props.onPress();
  });
  expect(mockedConfirm).toHaveBeenCalledTimes(1);
  expect(mockedConfirm.mock.calls[0][0]).toMatchObject({ destructive: true, confirmText: t.grinder.calibResetAction });
  expect(mockedReset).not.toHaveBeenCalled();

  renderer.act(() => {
    mockedConfirm.mock.calls[0][0].onConfirm();
  });
  expect(mockedReset).toHaveBeenCalledWith('comandante_c40');
  expect(dump(tree)).toContain('Parzeń tworzących kalibrację (Comandante C40 MK3/MK4): 0');
});

test('Zmiana kalibracji w innym miejscu aplikacji odświeża kartę', () => {
  mockedStatus
    .mockReturnValueOnce({ shiftClicks: 0, pairCount: 0, isActive: false })
    .mockReturnValue({ shiftClicks: 1, pairCount: 4, isActive: true });
  let tree!: renderer.ReactTestRenderer;
  renderer.act(() => {
    tree = renderer.create(<GrinderCalibrationCard t={t} />);
  });
  renderer.act(() => {
    notifyGrinderCalibrationChanged();
  });
  expect(dump(tree)).toContain('Parzeń tworzących kalibrację (Comandante C40 MK3/MK4): 4');
});

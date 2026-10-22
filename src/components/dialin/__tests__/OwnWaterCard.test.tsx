// ============================================================================
// Napar (Steepwise) — Unit Tests: OwnWaterCard (własna woda, poz. 9)
// Baza i potwierdzenie są zastąpione atrapami; logika walidacji i dolewki jest prawdziwa.
// ============================================================================

import React from 'react';
import renderer from 'react-test-renderer';
import { OwnWaterCard } from '../OwnWaterCard';
import { translations } from '../../../core/i18n';
import {
  getOwnWaterProfile,
  saveOwnWaterProfile,
  deleteOwnWaterProfile,
} from '../../../core/database';
import { confirm } from '../../../core/confirm';

jest.mock('../../../core/database', () => ({
  getOwnWaterProfile: jest.fn(),
  saveOwnWaterProfile: jest.fn(),
  deleteOwnWaterProfile: jest.fn(),
}));

jest.mock('../../../core/confirm', () => ({
  confirm: jest.fn(),
}));

const t = translations.pl;
const TARGET = { ghPpm: 80, khPpm: 40 };
const SAVED = { sourceName: 'Wodociągi Test', ghPpm: 60, khPpm: 30, updatedAt: '2026-10-22T10:00:00.000Z' };

const mockedGet = getOwnWaterProfile as jest.Mock;
const mockedSave = saveOwnWaterProfile as jest.Mock;
const mockedDelete = deleteOwnWaterProfile as jest.Mock;
const mockedConfirm = confirm as jest.Mock;

function render(volume = 1.0, target = TARGET) {
  let tree!: renderer.ReactTestRenderer;
  renderer.act(() => {
    tree = renderer.create(
      <OwnWaterCard language="pl" t={t} target={target} volumeLiters={volume} />
    );
  });
  return tree;
}

const press = (tree: renderer.ReactTestRenderer, testID: string) => {
  renderer.act(() => {
    tree.root.findByProps({ testID }).props.onPress();
  });
};

const type = (tree: renderer.ReactTestRenderer, testID: string, value: string) => {
  renderer.act(() => {
    tree.root.findByProps({ testID }).props.onChangeText(value);
  });
};

const dump = (tree: renderer.ReactTestRenderer) => JSON.stringify(tree.toJSON());

beforeEach(() => {
  jest.clearAllMocks();
  mockedGet.mockReturnValue(null);
});

describe('OwnWaterCard: brak profilu', () => {
  test('Pokazuje przycisk dodania danych z raportu', () => {
    const tree = render();
    expect(tree.root.findByProps({ testID: 'own-water-add-btn' })).toBeDefined();
    expect(dump(tree)).toContain(t.water.ownAdd);
  });

  test('Zapis poprawnego formularza: KH podane w °dH, zapisany profil w ppm', () => {
    const tree = render();
    press(tree, 'own-water-add-btn');
    type(tree, 'own-water-source-input', ' Wodociągi Test ');
    type(tree, 'own-water-gh-input', '60');
    type(tree, 'own-water-kh-input', '1,7');
    press(tree, 'own-water-kh-unit-dH');
    press(tree, 'own-water-save-btn');

    // KH 1,7 °dH · 17,848 = 30,3416 → 30,3 mg/L ; GH 60 mg/L
    expect(mockedSave).toHaveBeenCalledTimes(1);
    const saved = mockedSave.mock.calls[0][0];
    expect(saved.sourceName).toBe('Wodociągi Test');
    expect(saved.ghPpm).toBe(60);
    expect(saved.khPpm).toBe(30.3);
    expect(dump(tree)).toContain('GH 60 ppm · KH 30.3 ppm');
  });

  test('Pusta nazwa i ujemna wartość są odrzucone bez zapisu', () => {
    const tree = render();
    press(tree, 'own-water-add-btn');
    type(tree, 'own-water-gh-input', '-3');
    type(tree, 'own-water-kh-input', '');
    press(tree, 'own-water-save-btn');

    expect(mockedSave).not.toHaveBeenCalled();
    const json = dump(tree);
    expect(json).toContain(t.water.ownErrEmpty);
    expect(json).toContain(t.water.ownErrNegative);
  });

  test('Tekst zamiast liczby pokazuje komunikat o błędzie liczby', () => {
    const tree = render();
    press(tree, 'own-water-add-btn');
    type(tree, 'own-water-source-input', 'Źródło');
    type(tree, 'own-water-gh-input', 'abc');
    type(tree, 'own-water-kh-input', '40');
    press(tree, 'own-water-save-btn');
    expect(mockedSave).not.toHaveBeenCalled();
    expect(dump(tree)).toContain(t.water.ownErrInvalid);
  });

  test('Błąd zapisu w bazie pokazuje komunikat, a formularz zostaje otwarty', () => {
    mockedSave.mockImplementationOnce(() => {
      throw new Error('brak bazy');
    });
    const tree = render();
    press(tree, 'own-water-add-btn');
    type(tree, 'own-water-source-input', 'Źródło');
    type(tree, 'own-water-gh-input', '60');
    type(tree, 'own-water-kh-input', '30');
    press(tree, 'own-water-save-btn');
    expect(dump(tree)).toContain(t.water.ownSaveFailed);
    expect(tree.root.findByProps({ testID: 'own-water-source-input' })).toBeDefined();
  });

  test('Anuluj zamyka formularz bez zapisu', () => {
    const tree = render();
    press(tree, 'own-water-add-btn');
    press(tree, 'own-water-cancel-btn');
    expect(mockedSave).not.toHaveBeenCalled();
    expect(tree.root.findByProps({ testID: 'own-water-add-btn' })).toBeDefined();
  });
});

describe('OwnWaterCard: zapisany profil', () => {
  beforeEach(() => {
    mockedGet.mockReturnValue(SAVED);
  });

  test('Dolewka do celu 80 / 40 w 1 L: KH 5,0 g i GH 10,0 g', () => {
    const tree = render(1.0);
    expect(dump(tree)).toContain('GH 60 ppm · KH 30 ppm');
    const json = dump(tree);
    expect(json).toContain('"5 g"');
    expect(json).toContain('"10 g"');
  });

  test('Dolewka skaluje się z objętością: 2 L daje 10 g i 20 g', () => {
    const tree = render(2.0);
    const json = dump(tree);
    expect(json).toContain('"10 g"');
    expect(json).toContain('"20 g"');
  });

  test('Źródło już na poziomie celu pokazuje ostrzeżenie o rozcieńczeniu', () => {
    const tree = render(1.0, { ghPpm: 80, khPpm: 25 });
    expect(dump(tree)).toContain(t.water.ownTopUpAboveTarget);
  });

  test('Edycja wypełnia formularz zapisanymi wartościami', () => {
    const tree = render();
    press(tree, 'own-water-edit-btn');
    expect(tree.root.findByProps({ testID: 'own-water-source-input' }).props.value).toBe('Wodociągi Test');
    expect(tree.root.findByProps({ testID: 'own-water-gh-input' }).props.value).toBe('60');
    expect(tree.root.findByProps({ testID: 'own-water-kh-input' }).props.value).toBe('30');
  });

  test('Usunięcie wymaga potwierdzenia i czyści profil', () => {
    const tree = render();
    press(tree, 'own-water-delete-btn');
    expect(mockedConfirm).toHaveBeenCalledTimes(1);
    expect(mockedConfirm.mock.calls[0][0]).toMatchObject({
      title: t.water.ownDeleteTitle,
      destructive: true,
    });

    renderer.act(() => {
      mockedConfirm.mock.calls[0][0].onConfirm();
    });
    expect(mockedDelete).toHaveBeenCalledTimes(1);
    expect(tree.root.findByProps({ testID: 'own-water-add-btn' })).toBeDefined();
  });
});

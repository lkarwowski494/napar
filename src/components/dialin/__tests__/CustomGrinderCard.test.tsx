// ============================================================================
// Napar (Steepwise) — CustomGrinderCard: własny młynek w dial-in (poz. 11 MVP)
// Baza mockowana w pamięci; testy sprawdzają walidację, zapis, błąd zapisu i usunięcie.
// ============================================================================

import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { CustomGrinderCard } from '../CustomGrinderCard';
import { translations } from '../../../core/i18n';
import * as database from '../../../core/database';
import { confirm } from '../../../core/confirm';
import type { CustomGrinder } from '../../../core/custom-grinder';

jest.mock('../../../core/database', () => {
  const store: { list: any[]; settings: Map<string, string> } = { list: [], settings: new Map() };
  return {
    __store: store,
    listCustomGrinders: jest.fn(() => [...store.list]),
    saveCustomGrinder: jest.fn((grinder: any) => {
      store.list = [...store.list.filter((g) => g.id !== grinder.id), grinder];
    }),
    deleteCustomGrinder: jest.fn((id: string) => {
      store.list = store.list.filter((g) => g.id !== id);
    }),
    getAppSetting: jest.fn((key: string, fallback = '') => store.settings.get(key) ?? fallback),
    setAppSetting: jest.fn((key: string, value: string) => {
      store.settings.set(key, value);
    }),
  };
});

jest.mock('../../../core/confirm', () => ({
  confirm: jest.fn(),
}));

const t = translations.pl;
const store = (database as any).__store as { list: CustomGrinder[]; settings: Map<string, string> };

function byTestId(tree: any, testID: string) {
  return tree.root.findAll((node: any) => node.props.testID === testID)[0];
}

function mount(onChanged = jest.fn()) {
  let tree: any;
  act(() => {
    tree = renderer.create(<CustomGrinderCard t={t} onChanged={onChanged} />);
  });
  return { tree, onChanged };
}

describe('CustomGrinderCard (poz. 11 MVP)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    store.list = [];
    store.settings.clear();
  });

  test('bez młynków pokazuje pusty stan i formularz z przyciskiem dodania', () => {
    const { tree } = mount();
    const str = JSON.stringify(tree.toJSON());
    expect(str).toContain(t.grinder.customListEmpty);
    expect(byTestId(tree, 'custom-grinder-add-btn')).toBeTruthy();
  });

  test('pusta nazwa i zły przelicznik pokazują błędy i nic nie zapisują', () => {
    const { tree, onChanged } = mount();
    act(() => byTestId(tree, 'custom-grinder-add-btn').props.onPress());
    const str = JSON.stringify(tree.toJSON());
    expect(str).toContain(t.grinder.customErrName);
    expect(str).toContain(t.grinder.customErrStepEmpty);
    expect(database.saveCustomGrinder).not.toHaveBeenCalled();
    expect(onChanged).not.toHaveBeenCalled();
  });

  test('przelicznik spoza zakresu i tekst nieliczbowy mają własne komunikaty', () => {
    const { tree } = mount();
    act(() => byTestId(tree, 'custom-grinder-name-input').props.onChangeText('Test'));
    act(() => byTestId(tree, 'custom-grinder-step-input').props.onChangeText('500'));
    act(() => byTestId(tree, 'custom-grinder-add-btn').props.onPress());
    expect(JSON.stringify(tree.toJSON())).toContain(t.grinder.customErrStepRange);

    act(() => byTestId(tree, 'custom-grinder-step-input').props.onChangeText('abc'));
    act(() => byTestId(tree, 'custom-grinder-add-btn').props.onPress());
    expect(JSON.stringify(tree.toJSON())).toContain(t.grinder.customErrStepInvalid);
    expect(database.saveCustomGrinder).not.toHaveBeenCalled();
  });

  test('poprawny formularz zapisuje młynek z przecinkiem jako 22,5 µm, czyści pola i powiadamia listę', () => {
    const { tree, onChanged } = mount();
    act(() => byTestId(tree, 'custom-grinder-name-input').props.onChangeText('  Mój młynek '));
    act(() => byTestId(tree, 'custom-grinder-step-input').props.onChangeText('22,5'));
    act(() => byTestId(tree, 'custom-grinder-add-btn').props.onPress());

    expect(database.saveCustomGrinder).toHaveBeenCalledTimes(1);
    const saved = (database.saveCustomGrinder as jest.Mock).mock.calls[0][0];
    expect(saved.name).toBe('Mój młynek');
    expect(saved.stepMicrons).toBe(22.5);
    expect(saved.id).toMatch(/^custom-grinder-/);
    expect(onChanged).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(tree.toJSON())).toContain('Mój młynek');
    expect(byTestId(tree, 'custom-grinder-name-input').props.value).toBe('');
  });

  test('błąd zapisu w bazie pokazuje komunikat i nie powiadamia listy', () => {
    (database.saveCustomGrinder as jest.Mock).mockImplementationOnce(() => {
      throw new Error('baza');
    });
    const { tree, onChanged } = mount();
    act(() => byTestId(tree, 'custom-grinder-name-input').props.onChangeText('Test'));
    act(() => byTestId(tree, 'custom-grinder-step-input').props.onChangeText('20'));
    act(() => byTestId(tree, 'custom-grinder-add-btn').props.onPress());
    expect(JSON.stringify(tree.toJSON())).toContain(t.grinder.customSaveFailed);
    expect(onChanged).not.toHaveBeenCalled();
  });

  test('usunięcie wymaga potwierdzenia; po potwierdzeniu znika z listy', () => {
    store.list = [{ id: 'custom-grinder-x', name: 'Do usunięcia', stepMicrons: 15, createdAt: '2026-10-01T00:00:00.000Z' }];
    const { tree, onChanged } = mount();
    expect(JSON.stringify(tree.toJSON())).toContain('Do usunięcia');

    act(() => byTestId(tree, 'custom-grinder-row-custom-grinder-x').findAll((n: any) => n.props.accessibilityRole === 'button')[0].props.onPress());
    expect(confirm).toHaveBeenCalledWith(expect.objectContaining({ destructive: true }));
    expect(database.deleteCustomGrinder).not.toHaveBeenCalled();

    const confirmArgs = (confirm as unknown as jest.Mock).mock.calls[0][0];
    act(() => confirmArgs.onConfirm());
    expect(database.deleteCustomGrinder).toHaveBeenCalledWith('custom-grinder-x');
    expect(JSON.stringify(tree.toJSON())).not.toContain('Do usunięcia');
    expect(onChanged).toHaveBeenCalledTimes(1);
  });

  test('po usunięciu domyślnego młynka wybór wraca do Comandante (bez wiszącego wpisu)', () => {
    store.list = [{ id: 'custom-grinder-d', name: 'Domyślny', stepMicrons: 15, createdAt: '2026-10-01T00:00:00.000Z' }];
    store.settings.set('default_grinder', 'custom-grinder-d');
    const { tree } = mount();
    act(() => byTestId(tree, 'custom-grinder-row-custom-grinder-d').findAll((n: any) => n.props.accessibilityRole === 'button')[0].props.onPress());
    const confirmArgs = (confirm as unknown as jest.Mock).mock.calls[0][0];
    act(() => confirmArgs.onConfirm());
    expect(store.settings.get('default_grinder')).toBe('comandante_c40');
  });

  test('gdy usunięcie się nie uda, nic nie zmienia się w ustawieniach', () => {
    store.list = [{ id: 'custom-grinder-e', name: 'Zostaje', stepMicrons: 15, createdAt: '2026-10-01T00:00:00.000Z' }];
    store.settings.set('default_grinder', 'custom-grinder-e');
    (database.deleteCustomGrinder as jest.Mock).mockImplementationOnce(() => {
      throw new Error('baza');
    });
    const { tree, onChanged } = mount();
    act(() => byTestId(tree, 'custom-grinder-row-custom-grinder-e').findAll((n: any) => n.props.accessibilityRole === 'button')[0].props.onPress());
    const confirmArgs = (confirm as unknown as jest.Mock).mock.calls[0][0];
    act(() => confirmArgs.onConfirm());
    expect(store.settings.get('default_grinder')).toBe('custom-grinder-e');
    expect(onChanged).not.toHaveBeenCalled();
  });
});

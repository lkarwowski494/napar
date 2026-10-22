// ============================================================================
// Napar (Steepwise) — Testy: własny młynek z przelicznikiem kliknięć (poz. 11 MVP)
// ============================================================================

import {
  allGrinderModels,
  customGrinderModel,
  parseStepField,
  validateCustomGrinderForm,
  CUSTOM_GRINDER_MAX_STEP_MICRONS,
  CUSTOM_GRINDER_MIN_STEP_MICRONS,
  type CustomGrinder,
  type CustomGrinderError,
  type CustomGrinderField,
  type CustomGrinderValidation,
} from '../custom-grinder';
import {
  SUPPORTED_GRINDERS,
  convertMicronsToGrinder,
  findGrinderModel,
  getRecommendedGrindForRecipe,
} from '../grinder-converter';

const CREATED = '2026-10-22T10:00:00.000Z';

const MY_GRINDER: CustomGrinder = {
  id: 'custom-grinder-1',
  name: 'Mój Hario Mini',
  stepMicrons: 20,
  createdAt: CREATED,
};

describe('Przelicznik µm na klik w formularzu (poz. 11)', () => {
  test('pusty tekst albo same spacje: brak wartości', () => {
    expect(parseStepField('')).toEqual({ ok: false, error: 'empty' });
    expect(parseStepField('   ')).toEqual({ ok: false, error: 'empty' });
  });

  test('tekst nieliczbowy: niepoprawna wartość', () => {
    expect(parseStepField('abc')).toEqual({ ok: false, error: 'invalid' });
    expect(parseStepField('22 µm')).toEqual({ ok: false, error: 'invalid' });
  });

  test('granice zakresu 1–200 µm na klik są dopuszczone, wartości spoza nie', () => {
    expect(CUSTOM_GRINDER_MIN_STEP_MICRONS).toBe(1);
    expect(CUSTOM_GRINDER_MAX_STEP_MICRONS).toBe(200);
    expect(parseStepField('1')).toEqual({ ok: true, value: 1 });
    expect(parseStepField('200')).toEqual({ ok: true, value: 200 });
    expect(parseStepField('0')).toEqual({ ok: false, error: 'range' });
    expect(parseStepField('0,9')).toEqual({ ok: false, error: 'range' });
    expect(parseStepField('200,1')).toEqual({ ok: false, error: 'range' });
  });

  test('przecinek i kropka są separatorem dziesiętnym', () => {
    expect(parseStepField('22,5')).toEqual({ ok: true, value: 22.5 });
    expect(parseStepField(' 22.5 ')).toEqual({ ok: true, value: 22.5 });
  });
});

describe('Walidacja formularza własnego młynka', () => {
  test('typy błędów: pola formularza i kody błędów są stałe, wynik to sukces albo lista błędów', () => {
    const fields: CustomGrinderField[] = ['name', 'step'];
    const codes: CustomGrinderError[] = ['empty', 'invalid', 'range'];
    const result: CustomGrinderValidation = validateCustomGrinderForm({ name: '', stepText: '1' }, 'id-t', CREATED);
    expect(fields).toEqual(['name', 'step']);
    expect(codes).toHaveLength(3);
    expect(result).toEqual({ ok: false, errors: { name: 'empty' } });
  });

  test('pusta nazwa i pusty przelicznik dają dwa błędy', () => {
    const result = validateCustomGrinderForm({ name: '  ', stepText: '' }, 'id-1', CREATED);
    expect(result).toEqual({ ok: false, errors: { name: 'empty', step: 'empty' } });
  });

  test('sama nazwa bez przelicznika zgłasza tylko błąd przelicznika', () => {
    const result = validateCustomGrinderForm({ name: 'Młynek', stepText: '2x' }, 'id-1', CREATED);
    expect(result).toEqual({ ok: false, errors: { step: 'invalid' } });
  });

  test('poprawny formularz zapisuje nazwę bez spacji, przelicznik i identyfikator', () => {
    const result = validateCustomGrinderForm(
      { name: '  Mój młynek  ', stepText: '22,5' },
      'custom-grinder-9',
      CREATED
    );
    expect(result).toEqual({
      ok: true,
      grinder: {
        id: 'custom-grinder-9',
        name: 'Mój młynek',
        stepMicrons: 22.5,
        createdAt: CREATED,
      },
    });
  });
});

describe('Model własnego młynka dla konwertera', () => {
  const model = customGrinderModel(MY_GRINDER);

  test('nazwa, identyfikator i przelicznik są z formularza, bez przesunięcia modelu', () => {
    expect(model.id).toBe('custom-grinder-1');
    expect(model.name).toBe('Mój Hario Mini');
    expect(model.stepMicrons).toBe(20);
    expect(model.micronsPerSettingOffset).toBe(0);
    expect(model.burrType).toBe('');
  });

  test('zakres kliknięć pokrywa cały zakres konwertera (150–1500 µm)', () => {
    expect(model.minSetting).toBe(0);
    expect(model.maxSetting).toBe(75); // ceil(1500 / 20)
  });

  test('format nastawy to liczba całkowita kliknięć', () => {
    expect(model.formatSetting(22.4)).toBe('22 klików');
    expect(model.formatSetting(22.6)).toBe('23 klików');
  });

  test('parsowanie nastawy tekstowej przelicza kliki na mikrony (błędny tekst daje 0)', () => {
    expect(model.parseSetting('5')).toBe(100);
    expect(model.parseSetting('2,5')).toBe(50);
    expect(model.parseSetting('abc')).toBe(0);
  });

  test('konwerter liczy nastawę własnego młynka z przelicznika (720 µm / 20 µm = 36 klików)', () => {
    const result = convertMicronsToGrinder(720, MY_GRINDER.id, [model]);
    expect(result.formatted).toBe('36 klików');
    expect(result.rawValue).toBe(36);
    expect(result.grinderName).toBe('Mój Hario Mini');
  });

  test('przesunięcie kalibracji działa tak samo jak dla tabeli (+2 kliki → 38)', () => {
    const recipe = { method: 'V60', grindSettingDescriptionPl: '' };
    const rec = getRecommendedGrindForRecipe(recipe, MY_GRINDER.id, 2, [model]);
    expect(rec.baseValue).toBe(36);
    expect(rec.rawValue).toBe(38);
    expect(rec.grinderName).toBe('Mój Hario Mini');
  });
});

describe('Lista młynków do wyboru i wyszukiwanie modelu', () => {
  test('lista to tabela modeli, a potem własne młynki w kolejności zapisu', () => {
    const second: CustomGrinder = { ...MY_GRINDER, id: 'custom-grinder-2', name: 'Drugi' };
    const all = allGrinderModels([MY_GRINDER, second]);
    expect(all.slice(0, SUPPORTED_GRINDERS.length)).toEqual(SUPPORTED_GRINDERS);
    expect(all.slice(-2).map((g) => g.id)).toEqual(['custom-grinder-1', 'custom-grinder-2']);
  });

  test('bez własnych młynków lista jest równa tabeli modeli', () => {
    expect(allGrinderModels([])).toEqual(SUPPORTED_GRINDERS);
  });

  test('findGrinderModel: tabela ma pierwszeństwo, potem dodatkowe, nieznany daje pierwszy model', () => {
    const model = customGrinderModel(MY_GRINDER);
    expect(findGrinderModel('comandante_c40', [model]).id).toBe('comandante_c40');
    expect(findGrinderModel(MY_GRINDER.id, [model]).name).toBe('Mój Hario Mini');
    expect(findGrinderModel('nieznany', [model]).id).toBe(SUPPORTED_GRINDERS[0].id);
    expect(findGrinderModel(MY_GRINDER.id).id).toBe(SUPPORTED_GRINDERS[0].id);
  });
});

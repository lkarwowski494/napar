// ============================================================================
// Napar (Steepwise) — Własny młynek z przelicznikiem kliknięć (poz. 11 MVP)
// Czysta logika: walidacja formularza, model młynka dla konwertera i lista do wyboru.
// Użytkownik podaje nazwę i ile mikronów zmienia jeden klik (przelicznik). Pozostałe
// zasady (przesunięcie kalibracji, zaokrąglanie do kliknięcia) działają jak dla młynków z tabeli.
// ============================================================================

import { parseDecimal } from './parse-decimal';
import { SUPPORTED_GRINDERS, type GrinderModel } from './grinder-converter';

/** Przedział przelicznika (µm na klik) akceptowany w formularzu. Zakres techniczny, nie produktowy. */
export const CUSTOM_GRINDER_MIN_STEP_MICRONS = 1;
export const CUSTOM_GRINDER_MAX_STEP_MICRONS = 200;

/** Zakres mikronów, który przelicza konwerter (grinder-converter.ts, convertMicronsWithShift). */
const CONVERTER_MAX_MICRONS = 1500;

export interface CustomGrinder {
  id: string;
  name: string;
  stepMicrons: number; // µm na 1 klik
  createdAt: string; // ISO 8601
}

export type CustomGrinderField = 'name' | 'step';
export type CustomGrinderError = 'empty' | 'invalid' | 'range';

export interface CustomGrinderFormInput {
  name: string;
  stepText: string;
}

export type CustomGrinderValidation =
  | { ok: true; grinder: CustomGrinder }
  | { ok: false; errors: Partial<Record<CustomGrinderField, CustomGrinderError>> };

/** Odczytuje przelicznik z pola formularza (przecinek jest dopuszczony). */
export function parseStepField(
  text: string
): { ok: true; value: number } | { ok: false; error: CustomGrinderError } {
  if (text.trim() === '') return { ok: false, error: 'empty' };
  const value = parseDecimal(text);
  if (Number.isNaN(value)) return { ok: false, error: 'invalid' };
  if (value < CUSTOM_GRINDER_MIN_STEP_MICRONS || value > CUSTOM_GRINDER_MAX_STEP_MICRONS) {
    return { ok: false, error: 'range' };
  }
  return { ok: true, value };
}

/** Waliduje formularz i buduje młynek do zapisu. Identyfikator i data tworzy wywołujący. */
export function validateCustomGrinderForm(
  input: CustomGrinderFormInput,
  id: string,
  createdAt: string
): CustomGrinderValidation {
  const errors: Partial<Record<CustomGrinderField, CustomGrinderError>> = {};
  const name = input.name.trim();
  if (name === '') errors.name = 'empty';

  const step = parseStepField(input.stepText);
  if (!step.ok) errors.step = step.error;

  if (name === '' || !step.ok) {
    return { ok: false, errors };
  }
  return { ok: true, grinder: { id, name, stepMicrons: step.value, createdAt } };
}

/** Model młynka dla konwertera: te same funkcje co w tabeli, zbudowane z przelicznika. */
export function customGrinderModel(grinder: CustomGrinder): GrinderModel {
  const step = grinder.stepMicrons;
  return {
    id: grinder.id,
    name: grinder.name,
    burrType: '',
    stepMicrons: step,
    minSetting: 0,
    maxSetting: Math.ceil(CONVERTER_MAX_MICRONS / step),
    micronsPerSettingOffset: 0,
    formatSetting: (clicks: number) => `${Math.round(clicks)} klików`,
    parseSetting: (text: string) => (parseDecimal(text) || 0) * step,
  };
}

/** Wszystkie młynki do wyboru: najpierw tabela modeli, potem własne (w kolejności zapisu). */
export function allGrinderModels(customGrinders: readonly CustomGrinder[]): GrinderModel[] {
  return [...SUPPORTED_GRINDERS, ...customGrinders.map(customGrinderModel)];
}

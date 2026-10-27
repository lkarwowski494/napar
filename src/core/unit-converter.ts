// ============================================================================
// Napar (Steepwise) — Unit Converter (Metric / Imperial — DEC-21 & NFR-I18N)
// Obsługa jednostek metrycznych (°C, g, ml) i imperialnych (°F, oz, fl oz)
// ============================================================================

export type UnitSystem = 'metric' | 'imperial';

function parseNumeric(val: unknown): number {
  if (typeof val === 'number') {
    if (!Number.isFinite(val)) return NaN;
    return Object.is(val, -0) ? 0 : val;
  }
  if (typeof val === 'string') {
    const clean = val.replace(/[\x00-\x1F\x7F\uFEFF]/g, '').trim().replace(/,/g, '.');
    const m = clean.match(/^[+-]?\d+(?:\.\d+)?/);
    if (!m) return NaN;
    const num = parseFloat(m[0]);
    if (!Number.isFinite(num)) return NaN;
    return Object.is(num, -0) ? 0 : num;
  }
  return NaN;
}

/**
 * Przelicza stopnie Celsjusza na Fahrenheita
 */
export function celsiusToFahrenheit(c: number | string): number {
  const numC = parseNumeric(c);
  if (isNaN(numC)) return 0;
  const res = Math.round((numC * 9) / 5 + 32);
  return Object.is(res, -0) ? 0 : res;
}

/**
 * Przelicza stopnie Fahrenheita na Celsjusza
 */
export function fahrenheitToCelsius(f: number | string): number {
  const numF = parseNumeric(f);
  if (isNaN(numF)) return 0;
  const res = Math.round(((numF - 32) * 5) / 9);
  return Object.is(res, -0) ? 0 : res;
}

/**
 * Przelicza gramy na uncje wagowe (oz)
 */
export function gramsToOunces(g: number | string): number {
  const numG = parseNumeric(g);
  if (isNaN(numG) || numG <= 0) return 0;
  const res = parseFloat((numG * 0.03527396195).toFixed(2));
  return Object.is(res, -0) ? 0 : res;
}

/**
 * Przelicza uncje wagowe (oz) na gramy
 */
export function ouncesToGrams(oz: number | string): number {
  const numOz = parseNumeric(oz);
  if (isNaN(numOz) || numOz <= 0) return 0;
  const res = Math.round(numOz / 0.03527396195);
  return Object.is(res, -0) ? 0 : res;
}

/**
 * Przelicza mililitry / gramy wody na uncje objętościowe (fl oz)
 */
export function mlToFluidOunces(ml: number | string): number {
  const numMl = parseNumeric(ml);
  if (isNaN(numMl) || numMl <= 0) return 0;
  const res = parseFloat((numMl * 0.0338140227).toFixed(2));
  return Object.is(res, -0) ? 0 : res;
}

/**
 * Przelicza uncje objętościowe (fl oz) na mililitry / gramy wody
 */
export function fluidOuncesToMl(flOz: number | string): number {
  const numFlOz = parseNumeric(flOz);
  if (isNaN(numFlOz) || numFlOz <= 0) return 0;
  const res = Math.round(numFlOz / 0.0338140227);
  return Object.is(res, -0) ? 0 : res;
}

/**
 * Formatuje temperaturę zgodnie z wybranym układem jednostek
 */
export function formatTemperature(celsius: number, unitSystem: UnitSystem = 'metric'): string {
  if (!Number.isFinite(celsius)) {
    return unitSystem === 'imperial' ? '32°F' : '0°C';
  }
  if (unitSystem === 'imperial') {
    return `${celsiusToFahrenheit(celsius)}°F`;
  }
  return `${Math.round(celsius)}°C`;
}

/**
 * Formatuje wagę suchą kawy / herbaty zgodnie z wybranym układem jednostek
 */
export function formatDoseWeight(grams: number, unitSystem: UnitSystem = 'metric'): string {
  if (!Number.isFinite(grams) || grams < 0) {
    return unitSystem === 'imperial' ? '0 oz' : '0g';
  }
  if (unitSystem === 'imperial') {
    return `${gramsToOunces(grams)} oz`;
  }
  return `${Number(grams.toFixed(1))}g`;
}

/**
 * Formatuje objętość lub wagę wody
 */
export function formatWaterWeight(grams: number, unitSystem: UnitSystem = 'metric'): string {
  if (!Number.isFinite(grams) || grams < 0) {
    return unitSystem === 'imperial' ? '0 fl oz' : '0g';
  }
  if (unitSystem === 'imperial') {
    return `${mlToFluidOunces(grams)} fl oz`;
  }
  return `${Number(grams.toFixed(1))}g`;
}

/**
 * Pomocnicze zaokrąglanie do określonej liczby miejsc po przecinku
 */
export function roundTo(val: number, decimals: number): number {
  const num = parseNumeric(val);
  if (isNaN(num)) return 0;
  const numDec = parseNumeric(decimals);
  const safeDec = Math.max(0, Math.min(10, Math.floor(isNaN(numDec) ? 0 : numDec)));
  const factor = Math.pow(10, safeDec);
  let res = Math.round(num * factor) / factor;
  if (Object.is(res, -0) || res === 0) res = 0;
  return res;
}

/**
 * RD-ENG-01 & BR-TEST-005: Konwersja wejściowa bez dryfu zaokrągleń (wInKeep)
 * Zachowuje dokładną wartość bazową v_prev, jeżeli sformatowana liczba w jednostce wyświetlania
 * zgadza się po zaokrągleniu do 0.1 z liczbą wpisaną przez użytkownika.
 */
export function wInKeep(txt: string, unit: string, prevBase?: number): number {
  const safePrev = typeof prevBase === 'number' && Number.isFinite(prevBase) ? (Object.is(prevBase, -0) ? 0 : prevBase) : 0;
  if (typeof txt !== 'string') return safePrev;
  const clean = txt.replace(/[\x00-\x1F\x7F\uFEFF]/g, '').trim().replace(/,/g, '.');
  const m = clean.match(/^[+-]?\d+(?:\.\d+)?/);
  if (!m) return safePrev;
  const xIn = parseFloat(m[0]);
  if (isNaN(xIn) || !isFinite(xIn)) {
    return safePrev;
  }
  if (Object.is(xIn, -0)) return 0;

  // Współczynniki konwersji jednostek
  const u = typeof unit === 'string' ? unit.toLowerCase() : '';
  let cu = 1;
  const isFahrenheit = u === '°f' || u === 'f';

  if (u === 'lb' || u === 'lbs') {
    cu = 2.20462262185;
  } else if (u === 'oz') {
    cu = 0.03527396195;
  } else if (u === 'fl oz' || u === 'floz') {
    cu = 0.0338140227;
  } else {
    cu = 1;
  }

  if (prevBase !== undefined && Number.isFinite(prevBase) && prevBase > 0) {
    if (isFahrenheit) {
      const fPrev = roundTo((prevBase * 9) / 5 + 32, 1);
      if (roundTo(xIn, 1) === fPrev) {
        return prevBase;
      }
      return roundTo(((xIn - 32) * 5) / 9, 2);
    } else {
      const fPrev1 = roundTo(prevBase * cu, 1);
      const fPrev2 = roundTo(prevBase * cu, 2);
      if (roundTo(xIn, 1) === fPrev1 || roundTo(xIn, 2) === fPrev2) {
        return prevBase;
      }
      return roundTo(xIn / cu, 2);
    }
  }

  // Brak prevBase
  if (isFahrenheit) {
    return roundTo(((xIn - 32) * 5) / 9, 2);
  }
  return roundTo(xIn / cu, 2);
}

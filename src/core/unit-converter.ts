// ============================================================================
// Napar — Unit Converter (Metric / Imperial — DEC-21 & NFR-I18N)
// Obsługa jednostek metrycznych (°C, g, ml) i imperialnych (°F, oz, fl oz)
// ============================================================================

export type UnitSystem = 'metric' | 'imperial';

/**
 * Parsuje liczbę z wejścia użytkownika obsługując polski przecinek dziesiętny (DEEP-003).
 */
export function parseLocaleFloat(val: unknown): number {
  if (typeof val === 'number') {
    if (!Number.isFinite(val)) return NaN;
    return Object.is(val, -0) ? 0 : val;
  }
  if (typeof val === 'string') {
    const clean = val.replace(/[\x00-\x1F\x7F\uFEFF]/g, '').trim().replace(/,/g, '.');
    const m = clean.match(/^[+-]?(?:\d+(?:\.\d+)?|\.\d+)/);
    if (!m) return NaN;
    const num = parseFloat(m[0]);
    if (!Number.isFinite(num)) return NaN;
    return Object.is(num, -0) ? 0 : num;
  }
  return NaN;
}

const parseNumeric = parseLocaleFloat;

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
 * Przelicza gramy na uncje wagowe (oz)
 */
export function gramsToOunces(g: number | string): number {
  const numG = parseNumeric(g);
  if (isNaN(numG) || numG <= 0) return 0;
  const res = parseFloat((numG * 0.03527396195).toFixed(2));
  return Object.is(res, -0) ? 0 : res;
}

/**
 * Przelicza uncje wagowe (oz) na gramy (zaokrąglone do pełnego grama)
 */
export function ouncesToGrams(oz: number | string): number {
  const numOz = parseNumeric(oz);
  if (isNaN(numOz) || numOz <= 0) return 0;
  const res = Math.round(numOz / 0.03527396195);
  return Object.is(res, -0) ? 0 : res;
}

/**
 * Przelicza uncje wagowe (oz) na gramy z precyzją dziesiętną (DEEP-004)
 */
export function ouncesToGramsExact(oz: number | string): number {
  const numOz = parseNumeric(oz);
  if (isNaN(numOz) || numOz <= 0) return 0;
  const res = Number((numOz / 0.03527396195).toFixed(2));
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
 * Przelicza uncje objętościowe (fl oz) na mililitry / gramy wody (DEEP-004)
 */
export function fluidOuncesToMl(flOz: number | string): number {
  const numFlOz = parseNumeric(flOz);
  if (isNaN(numFlOz) || numFlOz <= 0) return 0;
  const res = Number((numFlOz / 0.0338140227).toFixed(1));
  return Object.is(res, -0) ? 0 : res;
}

/**
 * Formatuje temperaturę zgodnie z wybranym układem jednostek
 */
export function formatTemperature(celsius: number | string, unitSystem: UnitSystem = 'metric'): string {
  const num = parseNumeric(celsius);
  if (isNaN(num)) {
    return unitSystem === 'imperial' ? '32°F' : '0°C';
  }
  if (unitSystem === 'imperial') {
    return `${celsiusToFahrenheit(num)}°F`;
  }
  const rounded = Math.round(num);
  return `${Object.is(rounded, -0) ? 0 : rounded}°C`;
}

/**
 * Formatuje liczbę dziesiętną z przecinkiem w PL i kropką w EN (M1-audytor-generalny-012)
 */
export function formatDecimal(val: number, decimals: number = 1, language: string = 'en'): string {
  const fixed = val.toFixed(decimals);
  return language === 'pl' ? fixed.replace('.', ',') : fixed;
}

/**
 * Formatuje wagę suchą kawy / herbaty zgodnie z wybranym układem jednostek
 */
export function formatDoseWeight(
  grams: number | string,
  unitSystem: UnitSystem = 'metric',
  language: string = 'en'
): string {
  const num = parseNumeric(grams);
  if (isNaN(num) || num < 0 || Object.is(num, -0)) {
    return unitSystem === 'imperial' ? '0 oz' : '0g';
  }
  const formatNum = (n: number) => (language === 'pl' ? String(n).replace('.', ',') : String(n));
  if (unitSystem === 'imperial') {
    return `${formatNum(gramsToOunces(num))} oz`;
  }
  return `${formatNum(Number(num.toFixed(1)))}g`;
}

/**
 * Formatuje wagę wody (g lub fl oz)
 */
export function formatWaterWeight(
  grams: number | string,
  unitSystem: UnitSystem = 'metric',
  language: string = 'en'
): string {
  const num = parseNumeric(grams);
  if (isNaN(num) || num < 0 || Object.is(num, -0)) {
    return unitSystem === 'imperial' ? '0 fl oz' : '0g';
  }
  const formatNum = (n: number) => (language === 'pl' ? String(n).replace('.', ',') : String(n));
  if (unitSystem === 'imperial') {
    return `${formatNum(mlToFluidOunces(num))} fl oz`;
  }
  return `${formatNum(Number(num.toFixed(1)))}g`;
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

/**
 * M1-audytor-generalny-034: różnica temperatur (np. „+2°C” w poradach) w jednostkach ustawienia.
 * Różnica, nie temperatura: 2°C = 3,6°F → zaokrąglone do pełnego stopnia (4°F).
 */
export function formatTemperatureDelta(deltaCelsius: number, unitSystem: UnitSystem = 'metric'): string {
  if (unitSystem === 'imperial') return `${Math.round((deltaCelsius * 9) / 5)}°F`;
  return `${deltaCelsius}°C`;
}

/** M1-audytor-generalny-034: godzina (HH:MM) według języka aplikacji. */
export function formatClockTime(iso: string, language: 'pl' | 'en'): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString(language === 'pl' ? 'pl-PL' : 'en-US', { hour: '2-digit', minute: '2-digit' });
}
